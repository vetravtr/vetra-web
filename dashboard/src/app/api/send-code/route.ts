import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = 'https://qhgxffazypogelvclyjn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// POST: Enviar código de verificação
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 });
    }

    // Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

    // Salvar código no Supabase
    const { error: upsertError } = await supabase
      .from('verification_codes')
      .upsert({ 
        email: email.toLowerCase(), 
        code, 
        expires_at: expiresAt,
        used: false 
      }, { onConflict: 'email' });

    if (upsertError) {
      console.error('Erro ao salvar código:', upsertError);
    }

    // Enviar email
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'vetraquant@gmail.com',
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: '"VETRA Dashboard" <vetraquant@gmail.com>',
      to: email,
      subject: 'Your VETRA Dashboard verification code',
      text: `Welcome to VETRA Dashboard!\n\nYour verification code is: ${code}\n\nThis code expires in 15 minutes.\n\nIf you didn't request this, please ignore this email.\n\nVETRA Team`,
      html: `<div style="background:#050109;color:#fff;padding:40px;font-family:sans-serif;text-align:center">
        <img src="https://www.vetravtr.com/logo.svg" alt="VETRA" style="height:30px;margin-bottom:20px" />
        <h2 style="color:#b388ff">VETRA Dashboard</h2>
        <p style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#b388ff;margin:30px 0">${code}</p>
        <p style="color:#999">This code expires in 15 minutes.</p>
        <p style="color:#666;font-size:12px;margin-top:30px">2026 Vetra, LLC. All rights reserved.</p>
      </div>`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Send code error:', error);
    return NextResponse.json({ error: 'Erro ao enviar código' }, { status: 500 });
  }
}
