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

    const { game_content_id } = await req.json()
    if (!game_content_id) throw new Error('game_content_id is required')

    // Check cache
    const { data: existingWiki } = await supabaseClient
      .from('game_wiki')
      .select('*')
      .eq('game_content_id', game_content_id)

    if (existingWiki && existingWiki.length > 0) {
      return new Response(JSON.stringify({ wiki: existingWiki }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Fetch game details
    const { data: game } = await supabaseClient
      .from('content_items')
      .select('*')
      .eq('id', game_content_id)
      .single()

    if (!game) throw new Error('Game not found')

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) throw new Error('OPENAI_API_KEY not set')

    const prompt = `Generate a comprehensive wiki for the game "${game.title}". 
    Format the output as a JSON object with the following keys: 
    "Overview", "Characters", "Walkthrough", "Tips & Tricks", "Items & Mechanics", "Easter Eggs", "Achievements", "Multiplayer".
    Each key should contain detailed markdown content for that section.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        response_format: { type: "json_object" },
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const aiData = await response.json()
    const wikiContent = JSON.parse(aiData.choices[0].message.content)

    const wikiRows = Object.entries(wikiContent).map(([section_name, content_markdown]) => ({
      game_content_id,
      section_name,
      content_markdown,
    }))

    const { data: insertedWiki, error } = await supabaseClient
      .from('game_wiki')
      .insert(wikiRows)
      .select()

    if (error) throw error

    return new Response(JSON.stringify({ wiki: insertedWiki }), {
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
