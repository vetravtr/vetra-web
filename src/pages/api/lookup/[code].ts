import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const code = (params.code || '').toLowerCase();
  if (code.length < 4) return new Response(JSON.stringify({ error: 'invalid' }), { status: 400 });

  try {
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'not configured' }), { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data } = await supabase.from('users').select('wallet_address').ilike('wallet_address', '0x' + code + '%').limit(1).single();

    if (data?.wallet_address) {
      return new Response(JSON.stringify({ address: data.wallet_address }));
    }
    return new Response(JSON.stringify({ error: 'not found' }), { status: 404 });
  } catch {
    return new Response(JSON.stringify({ error: 'server error' }), { status: 500 });
  }
};
