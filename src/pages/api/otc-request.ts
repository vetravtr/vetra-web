import type { APIRoute } from 'astro';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const DB = path.resolve('./data/otc_requests.json');

// Pool de referência de preço: VTR/USDC 0.05% na Uniswap V3 (Polygon)
const POOL = '0x5484c717168175cffdd77678ecac3a38e76c4e2b';
const SPREAD = 0.03;          // 3% a favor da VETRA (definido pelo Comandante)
const MIN_USD = 50;           // mínimo por operação
const PRICE_SOURCES = [
  `https://api.geckoterminal.com/api/v2/networks/polygon_pos/pools/${POOL}`,
];

async function read() {
  try { return JSON.parse(await fs.readFile(DB, 'utf-8')); }
  catch { return []; }
}
async function write(data: any[]) {
  await fs.mkdir(path.dirname(DB), { recursive: true });
  await fs.writeFile(DB, JSON.stringify(data, null, 2));
}

/** Preço de mercado do VTR em USD — do pool público (verificável on-chain). */
async function marketPrice(): Promise<number | null> {
  for (const url of PRICE_SOURCES) {
    try {
      const r = await fetch(url, { headers: { accept: 'application/json' } });
      if (!r.ok) continue;
      const j: any = await r.json();
      const p = parseFloat(j?.data?.attributes?.base_token_price_usd);
      if (p > 0) return p;
    } catch (_) { /* tenta a próxima */ }
  }
  return null;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const name = (body.name || '').trim();
    const email = (body.email || '').trim();
    const country = (body.country || '').trim();
    const wallet = (body.wallet || '').trim();
    const amount = parseFloat(body.amount);
    const token = ((body.token || 'USDC') + '').toUpperCase();
    const note = (body.note || '').slice(0, 500);

    // ---- validação ----
    if (!name || !email || !wallet) {
      return new Response(JSON.stringify({ error: 'missing fields' }), { status: 400 });
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return new Response(JSON.stringify({ error: 'invalid wallet address' }), { status: 400 });
    }
    if (!(amount >= MIN_USD)) {
      return new Response(JSON.stringify({ error: `minimum is US$ ${MIN_USD}` }), { status: 400 });
    }
    if (!['USDC', 'USDT'].includes(token)) {
      return new Response(JSON.stringify({ error: 'token must be USDC or USDT' }), { status: 400 });
    }

    // ---- cotação de referência (mercado + spread) ----
    const price = await marketPrice();
    const netPrice = price ? price * (1 + SPREAD) : null;
    const vtrOut = netPrice ? amount / netPrice : null;

    const record = {
      ts: Date.now(),
      name, email, country, wallet: wallet.toLowerCase(),
      paying: `${amount} ${token}`,
      marketPriceUsd: price,
      quotePriceUsd: netPrice,
      vtrToSend: vtrOut,
      note,
      status: 'pending_quote',
    };

    // ---- registro local (sempre) ----
    try {
      const data = await read();
      data.push(record);
      await write(data);
    } catch (_) { console.log('[OTC] registro local ignorado (fs read-only)'); }

    // ---- registro no Supabase ----
    try {
      const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
      const supabaseKey = import.meta.env.SUPABASE_SERVICE_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { error } = await supabase.from('otc_requests').insert({
          name, email, country,
          wallet_address: wallet.toLowerCase(),
          amount_usd: amount,
          pay_token: token,
          quote_price_usd: netPrice,
          vtr_to_send: vtrOut,
          note,
          status: 'pending_quote',
        });
        if (error) console.error('[OTC] Supabase:', error.message);
      }
    } catch (e: any) { console.error('[OTC] Supabase:', e?.message || e); }

    // ---- e-mail para a equipe (é o aviso que o Comandante pediu) ----
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 587, secure: false,
      auth: {
        user: 'vetraquant@gmail.com',
        // import.meta.env no dev local; process.env na Vercel (env var)
        pass: (import.meta.env.SMTP_PASS as string) || process.env.SMTP_PASS,
      },
    });

    const fmt = (n: number | null) => (n === null ? 'n/d' : n.toLocaleString('en-US', { maximumFractionDigits: 6 }));

    try {
      await transporter.sendMail({
        from: '"VETRA OTC" <vetraquant@gmail.com>',
        to: 'contact@vetravtr.com',
        replyTo: email,
        subject: `[VETRA OTC] New quote request — ${amount} ${token} (${name})`,
        text: `NEW QUOTE REQUEST

Name:      ${name}
Email:     ${email}
Country:   ${country || 'n/d'}
Wallet to receive VTR:
           ${wallet}

Paying:    ${amount} ${token} (Polygon)
Note:      ${note || '—'}

--- reference quote (auto) ---
VTR market price : $${fmt(price)}
Quote price (+${(SPREAD * 100).toFixed(0)}%): $${fmt(netPrice)}
VTR to send      : ${fmt(vtrOut)}

Reply to the client with the quote and the receiving address,
then confirm the payment on-chain before sending the VTR.
`,
      });
      console.log('[OTC] aviso enviado para a equipe');
    } catch (e: any) { console.error('[OTC] e-mail equipe falhou:', e?.message || e); }

    // ---- e-mail de confirmação para o cliente ----
    try {
      await transporter.sendMail({
        from: '"VETRA" <vetraquant@gmail.com>',
        to: email,
        bcc: 'contact@vetravtr.com',
        subject: 'VETRA — we received your quote request',
        text: `Hi ${name},

Thank you for your interest in VTR.

We received your request to exchange ${amount} ${token} for VTR.
Our team will reply shortly with the current quote (price, quantity of VTR,
receiving address and how long the quote is valid for).

After your payment is confirmed on-chain, the VTR will be sent to:
${wallet}

Both transactions (your payment and our VTR transfer) are public and
verifiable on Polygonscan.

VTR is the utility and governance token of the VETRA protocol. It is not
an investment product: no return, yield or guaranteed value is offered.

—
VETRA Team
https://www.vetravtr.com`,
      });
      console.log('[OTC] confirmação enviada ao cliente');
    } catch (e: any) { console.error('[OTC] e-mail cliente falhou:', e?.message || e); }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    console.error('[OTC] erro:', e?.message || e);
    return new Response(JSON.stringify({ error: 'server error' }), { status: 500 });
  }
};
