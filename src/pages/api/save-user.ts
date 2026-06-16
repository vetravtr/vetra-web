import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { promises as fs } from 'node:fs';
import path from 'node:path';

const DB = path.resolve('./data/users.json');

async function readUsers() {
  try { return JSON.parse(await fs.readFile(DB, 'utf-8')); }
  catch { return []; }
}
async function writeUsers(data: any[]) {
  await fs.mkdir(path.dirname(DB), { recursive: true });
  await fs.writeFile(DB, JSON.stringify(data, null, 2));
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { wallet_address, name, email } = body;
    
    if (!wallet_address) {
      return new Response(JSON.stringify({ error: "wallet_address required" }), { status: 400 });
    }

    // Salvar LOCAL sempre (fallback)
    const users = await readUsers();
    const existing = users.findIndex((u: any) => u.wallet_address?.toLowerCase() === wallet_address.toLowerCase());
    const entry = { wallet_address: wallet_address.toLowerCase(), name, email, referral_code: "r/" + wallet_address.slice(2, 10), ts: Date.now() };
    if (existing >= 0) users[existing] = entry;
    else users.push(entry);
    await writeUsers(users);

    // Tentar salvar no Supabase (se falhar, não trava)
    try {
      const supabaseUrl = import.meta.env.SUPABASE_URL;
      const supabaseKey = import.meta.env.SUPABASE_SERVICE_KEY;
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from("users").upsert(
          { wallet_address: wallet_address.toLowerCase(), name, email, referral_code: "r/" + wallet_address.slice(2, 10) },
          { onConflict: "wallet_address" }
        );
      }
    } catch (e: any) {
      console.error('[SAVE-USER] Supabase error:', e);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
