import type { APIRoute } from 'astro';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import nodemailer from 'nodemailer';

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

    // Disparar email de agradecimento direto via SMTP Gmail
    if (email) {
      try {
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: 'vetranft@gmail.com',
            pass: 'bnwp lxhi npqt prtq',
          },
        });
        await transporter.sendMail({
          from: '"VETRA NFT" <vetranft@gmail.com>',
          to: email,
          subject: 'Thank you for supporting VETRA!',
          text: `Hi ${name || 'Valued supporter'},\n\nThank you for your purchase of the VETRA Pioneer NFT!\n\nYou now own ${body.quantity || 1} Pioneer NFT(s). When VTR reaches $0.40, come back and redeem each NFT for 1 VTR.\n\nYour support helps build a stronger, more decentralized ecosystem. We truly appreciate it.\n\n---\nVETRA Team\nhttps://vetravtr.com`,
        });
        console.log('Email sent to', email);
      } catch (e) {
        console.error('Email send failed:', e);
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'server error' }), { status: 500 });
  }
};
