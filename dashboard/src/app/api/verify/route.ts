import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SignJWT } from 'jose';

export const dynamic = 'force-dynamic';

const supabaseUrl = 'https://qhgxffazypogelvclyjn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || "";
const JWT_SECRET = new TextEncoder().encode('vetra-dashboard-jwt-secret-2026');

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, code } = body;

    if (action === 'verify_code') {
      if (!email || !code) {
        return NextResponse.json({ error: 'Email e código obrigatórios' }, { status: 400 });
      }

      const { data: codes, error } = await supabase
        .from('verification_codes')
        .select('*')
        .eq('email', email.toLowerCase())
        .limit(1);

      if (error || !codes || codes.length === 0) {
        return NextResponse.json({ error: 'Código não encontrado' }, { status: 400 });
      }

      const record = codes[0];

      if (record.used) {
        return NextResponse.json({ error: 'Código já utilizado' }, { status: 400 });
      }

      if (new Date(record.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Código expirado' }, { status: 400 });
      }

      if (record.code !== code) {
        return NextResponse.json({ error: 'Código inválido' }, { status: 400 });
      }

      // Marcar como usado
      await supabase
        .from('verification_codes')
        .update({ used: true })
        .eq('email', email.toLowerCase());

      // Buscar usuário
      const { data: users } = await supabase
        .from('dashboard_users')
        .select('*')
        .eq('email', email.toLowerCase())
        .limit(1);

      if (!users || users.length === 0) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 400 });
      }

      const user = users[0];

      // Ativar conta
      await supabase
        .from('dashboard_users')
        .update({ email_verified: true, last_login: new Date().toISOString() })
        .eq('id', user.id);

      const token = await new SignJWT({ userId: user.id, email: user.email })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .sign(JWT_SECRET);

      return NextResponse.json({
        success: true,
        token,
        user: { id: user.id, name: user.name, email: user.email, walletAddress: user.wallet_address },
      });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (e) {
    console.error('Verify error:', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
