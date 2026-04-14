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

    const rawgApiKey = Deno.env.get('RAWG_API_KEY')
    if (!rawgApiKey) throw new Error('RAWG_API_KEY not set')

    const url = new URL(req.url)
    const page = url.searchParams.get('page') || '1'
    const search = url.searchParams.get('search') || ''

    const rawgUrl = `https://api.rawg.io/api/games?key=${rawgApiKey}&page=${page}${search ? `&search=${search}` : ''}`
    const response = await fetch(rawgUrl)
    const data = await response.json()

    const games = data.results.map((game: any) => ({
      type: 'game',
      external_id: game.id.toString(),
      title: game.name,
      description: game.description_raw || '',
      genres: game.genres.map((g: any) => g.name),
      rating: game.rating,
      cover_url: game.background_image,
      release_date: game.released,
      metadata_json: { platforms: game.platforms?.map((p: any) => p.platform.name) },
      cached_at: new Date().toISOString()
    }))

    // Upsert into content_items
    const { error } = await supabaseClient
      .from('content_items')
      .upsert(games, { onConflict: 'type,external_id' })

    if (error) throw error

    return new Response(JSON.stringify({ games }), {
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
