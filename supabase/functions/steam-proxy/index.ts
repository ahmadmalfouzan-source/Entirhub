import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const steamKey = Deno.env.get('STEAM_API_KEY')
    const url = new URL(req.url)
    const appid = url.searchParams.get('appid')
    const query = url.searchParams.get('q')
    const type = url.searchParams.get('type')
    
    let steamUrl = ''
    
    if (type === 'price') {
      const region = url.searchParams.get('region') || 'SA'
      steamUrl = `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=${region}&filters=price_overview`
      console.log(`Proxying Price request for AppID: ${appid} in region: ${region}`)
    } else if (appid) {
      if (!steamKey) throw new Error('STEAM_API_KEY secret not found in Supabase')
      steamUrl = `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${steamKey}&appid=${appid}`
      console.log(`Proxying Schema request for AppID: ${appid}`)
    } else if (query) {
      steamUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`
      console.log(`Proxying Search request for query: ${query}`)
    } else {
      return new Response(JSON.stringify({ error: 'appid or q parameter is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }
    
    const response = await fetch(steamUrl)
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Steam API error: ${response.status} ${errorText}`)
      // Return a 200 with empty data to avoid crashing the frontend
      return new Response(JSON.stringify({ error: `Steam API responded with ${response.status}`, items: [], game: { availableGameStats: { achievements: [] } } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    
    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Steam Proxy Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
