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

    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (userError || !user) throw new Error('Unauthorized')

    // Fetch user tracking history
    const { data: tracking } = await supabaseClient
      .from('user_tracking')
      .select('*, content_items(*)')
      .eq('user_id', user.id)

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) throw new Error('OPENAI_API_KEY not set')

    const historySummary = tracking?.map(t => `${t.content_items.title} (${t.content_items.type}) - Rating: ${t.personal_rating}/5`).join(', ') || 'No history'

    const prompt = `Based on the user's entertainment history: ${historySummary}. 
    Generate 10 recommendations (mix of games, movies, and series). 
    Return a JSON object with a "recommendations" array. Each item should have:
    "title", "type" (game, movie, or series), "reason_text" (why they would like it based on their history).`

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
    const recommendations = JSON.parse(aiData.choices[0].message.content).recommendations

    // For a real app, we would match these titles to our DB or fetch them from external APIs.
    // For this edge function, we'll just return the raw recommendations.

    return new Response(JSON.stringify({ recommendations }), {
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
