import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const tmdbApiKey = Deno.env.get('TMDB_API_KEY')
    if (!tmdbApiKey) throw new Error('TMDB_API_KEY not set')

    const url = new URL(req.url)
    const type = url.searchParams.get('type') || 'movie' // 'movie' or 'tv'
    const page = url.searchParams.get('page') || '1'
    const search = url.searchParams.get('search') || ''

    const endpoint = search ? `/search/${type}` : `/${type}/popular`
    const tmdbUrl = `https://api.themoviedb.org/3${endpoint}?api_key=${tmdbApiKey}&page=${page}${search ? `&query=${search}` : ''}`
    
    const response = await fetch(tmdbUrl)
    const data = await response.json()

    const items = data.results.map((item: any) => ({
      type: type === 'tv' ? 'series' : 'movie',
      external_id: item.id.toString(),
      title: item.title || item.name,
      description: item.overview,
      genres: item.genre_ids, // Would need mapping in a real app
      rating: item.vote_average,
      cover_url: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
      release_date: item.release_date || item.first_air_date,
      metadata_json: { popularity: item.popularity },
      cached_at: new Date().toISOString()
    }))

    const { error } = await supabaseClient
      .from('content_items')
      .upsert(items, { onConflict: 'type,external_id' })

    if (error) throw error

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
