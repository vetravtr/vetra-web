import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const { code } = params;
    if (!code || code.length < 5) {
      return new Response(JSON.stringify({ address: null, error: "invalid code" }), { status: 404 });
    }

    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ address: null, error: "not configured" }), { status: 500 });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseKey);
    return await doLookup(supabase, code);
  } catch (e: any) {
    return new Response(JSON.stringify({ address: null, error: e?.message || "unknown" }), { status: 500 });
  }
}

async function doLookup(supabase, code) {
  const cleanCode = code.startsWith('r/') ? code : 'r/' + code;
  // 18/11/2026: consulta a FUNCAO lookup_referral (SECURITY DEFINER, um codigo por vez).
  // Antes era uma view que permitia listar TODOS os codigos e carteiras de uma vez.
  const { data, error } = await supabase.rpc("lookup_referral", { p_code: cleanCode });

  if (error) {
    return new Response(JSON.stringify({ address: null, error: error.message }), { status: 500 });
  }
  if (data) {
    return new Response(JSON.stringify({ address: data }));
  }

  return new Response(JSON.stringify({ address: null }), { status: 404 });
}
