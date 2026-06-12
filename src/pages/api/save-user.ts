import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { wallet_address, name, email } = body;
    
    if (!wallet_address) {
      return new Response(JSON.stringify({ error: "wallet_address required" }), { status: 400 });
    }

    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: "Supabase not configured" }), { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { error } = await supabase.from("users").upsert(
      { wallet_address: wallet_address.toLowerCase(), name, email, referral_code: "r/" + wallet_address.slice(0,8) },
      { onConflict: "wallet_address" }
    );

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
