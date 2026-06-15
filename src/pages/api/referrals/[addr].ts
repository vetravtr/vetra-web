import type { APIRoute } from 'astro';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export const prerender = false;

const DB = path.resolve('./data/purchases.json');

async function read() {
  try { return JSON.parse(await fs.readFile(DB, 'utf-8')); }
  catch { return []; }
}

export const GET: APIRoute = async ({ params }) => {
  const addr = (params.addr || '').toLowerCase();
  if (!/^0x[a-f0-9]{40}$/.test(addr)) {
    return new Response(JSON.stringify({ error: 'bad address' }), { status: 400 });
  }

  const data = await read();
  const referred = data.filter((p: any) => p.referrer === addr);

  return new Response(JSON.stringify({
    address: addr,
    count: referred.length,
    bonusPercent: referred.length * 5,
    referred: referred.map((p: any) => ({ buyer: p.buyer, ts: p.ts }))
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
