import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { user_id, user_agent } = await req.json();
  const ip_address = req.headers.get('x-forwarded-for') || 'unknown';

  const { data, error } = await supabase
    .from('user_login_stats')
    .insert({
      user_id,
      ip_address,
      user_agent,
      login_time: new Date().toISOString()
    });

  return new Response(JSON.stringify({ data, error }), {
    headers: { 'Content-Type': 'application/json' },
  });
});