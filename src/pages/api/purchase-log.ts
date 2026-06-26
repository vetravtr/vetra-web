import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { type, wallet, qty, error } = body;
    
    // Log no servidor
    console.log(`[PURCHASE-LOG] ${type} | wallet: ${wallet?.slice(0,10) || '?'} | qty: ${qty || 1} | error: ${error || 'none'}`);
    
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false }), { status: 200 });
  }
};
