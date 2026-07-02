import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

const supabaseUrl = 'https://qhgxffazypogelvclyjn.supabase.co';
const supabaseKey = 'process.env.SUPABASE_SERVICE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, walletAddress, asset, amountUsd, vtrAmount } = body;

    if (!userId || !amountUsd || !asset) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Buscar dados do usuário
    const { data: user } = await supabase
      .from('dashboard_users')
      .select('name, email, country')
      .eq('id', userId)
      .single();

    // Salvar intenção OTC
    const { data: intent, error } = await supabase
      .from('otc_intents')
      .insert({
        user_id: userId,
        wallet_address: walletAddress || null,
        asset,
        amount_usd: amountUsd,
        vtr_amount: vtrAmount,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    // Enviar email
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 587, secure: false,
      auth: { user: 'vetraquant@gmail.com', pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: '"VETRA OTC" <vetraquant@gmail.com>',
      to: 'vetraquant@gmail.com',
      subject: `🔴 OTC Request: ${user?.name || 'Unknown'} - $${amountUsd} ${asset}`,
      text: `NEW OTC REQUEST\n\nName: ${user?.name || 'N/A'}\nEmail: ${user?.email || 'N/A'}\nCountry: ${user?.country || 'N/A'}\nWallet: ${walletAddress || 'N/A'}\n\nAsset: ${asset}\nAmount: $${amountUsd}\nVTR to receive: ${vtrAmount}\n\nSent VTR to: 0x29F1bE1E72c031539bc22437aFde22fF765EE00e\n\nStatus: Awaiting confirmation`,
    });

    return NextResponse.json({ success: true, intent });
  } catch (e) {
    console.error('OTC error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
