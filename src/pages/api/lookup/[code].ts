import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const { code } = params;
    if (!code || code.length < 5) {
      return new Response(JSON.stringify({ address: null, error: "invalid code" }), { status: 404 });
    }

    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    
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
  const { data: users } = await supabase
    .from("users")
    .select("wallet_address")
    .eq("referral_code", cleanCode)
    .limit(1);

  if (users && users.length > 0) {
    return new Response(JSON.stringify({ address: users[0].wallet_address }));
  }

  return new Response(JSON.stringify({ address: null }), { status: 404 });
}
