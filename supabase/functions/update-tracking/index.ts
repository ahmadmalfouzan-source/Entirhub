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

    const { content_id, status, progress_json, personal_rating, notes, favorited } = await req.json()

    if (!content_id || !status) throw new Error('content_id and status are required')

    const { data, error } = await supabaseClient
      .from('user_tracking')
      .upsert({
        user_id: user.id,
        content_id,
        status,
        progress_json,
        personal_rating,
        notes,
        favorited,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,content_id' })
      .select()
      .single()

    if (error) throw error

    return new Response(JSON.stringify({ tracking: data }), {
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
