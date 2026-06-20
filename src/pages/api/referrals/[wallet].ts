import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const { wallet } = params;
    if (!wallet) return new Response(JSON.stringify({ count: 0, bonusPercent: 0 }));

    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return new Response(JSON.stringify({ count: 0, bonusPercent: 0 }));

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar compras feitas com o referral link deste wallet
    const { data, error } = await supabase
      .from("nft_purchases")
      .select("id, quantity", { count: "exact" })
      .eq("referrer_address", wallet);

    if (error) return new Response(JSON.stringify({ count: 0, bonusPercent: 0 }));

    const count = data?.length || 0;
    const bonusPercent = count > 0 ? 5 : 0;

    return new Response(JSON.stringify({ count, bonusPercent }));
  } catch {
    return new Response(JSON.stringify({ count: 0, bonusPercent: 0 }));
  }
};
