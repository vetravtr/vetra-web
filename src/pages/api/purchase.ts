import type { APIRoute } from 'astro';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export const prerender = false;

const DB = path.resolve('./data/purchases.json');

async function read() {
  try { return JSON.parse(await fs.readFile(DB, 'utf-8')); }
  catch { return []; }
}
async function write(data: any[]) {
  await fs.mkdir(path.dirname(DB), { recursive: true });
  await fs.writeFile(DB, JSON.stringify(data, null, 2));
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { buyer, txHash, referrer, name, email } = body;

    if (!buyer || !txHash) {
      return new Response(JSON.stringify({ error: 'missing fields' }), { status: 400 });
    }

    const data = await read();

    if (data.find((p: any) => p.txHash === txHash)) {
      return new Response(JSON.stringify({ ok: true, dup: true }), { status: 200 });
    }

    data.push({
      buyer: buyer.toLowerCase(),
      txHash,
      referrer: referrer ? referrer.toLowerCase() : null,
      name: name || null,
      email: email || null,
      ts: Date.now()
    });
    await write(data);

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'server error' }), { status: 500 });
  }
};
