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
    if (!steamKey) throw new Error('STEAM_API_KEY secret not found in Supabase')

    const url = new URL(req.url)
    const appid = url.searchParams.get('appid')
    
    if (!appid) {
      return new Response(JSON.stringify({ error: 'appid parameter is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Call Steam API GetSchemaForGame
    const steamUrl = `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${steamKey}&appid=${appid}`
    console.log(`Proxying request for AppID: ${appid}`)
    
    const response = await fetch(steamUrl)
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Steam API responded with ${response.status}: ${errorText}`)
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
