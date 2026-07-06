import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

const supabaseUrl = 'https://qhgxffazypogelvclyjn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const JWT_SECRET = new TextEncoder().encode('vetra-dashboard-jwt-secret-2026');

const supabase = createClient(supabaseUrl, supabaseKey);

// POST: Login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, password, name, walletAddress } = body;

    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email e senha obrigatórios' }, { status: 400 });
      }

      const { data: users, error } = await supabase
        .from('dashboard_users')
        .select('*')
        .eq('email', email.toLowerCase())
        .limit(1);

      if (error || !users || users.length === 0) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
      }

      const user = users[0];
      const passwordMatch = await bcrypt.compare(password, user.password_hash || '');

      if (!passwordMatch) {
        return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
      }

      // Criar token JWT
      const token = await new SignJWT({ userId: user.id, email: user.email })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .sign(JWT_SECRET);

      return NextResponse.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          walletAddress: user.wallet_address,
        }
      });
    }

    if (action === 'register') {
      if (!email || !password || !name) {
        return NextResponse.json({ error: 'Nome, email e senha obrigatórios' }, { status: 400 });
      }

      // Verificar se email já existe
      const { data: existing } = await supabase
        .from('dashboard_users')
        .select('id')
        .eq('email', email.toLowerCase())
        .limit(1);

      if (existing && existing.length > 0) {
        return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const { data, error } = await supabase
        .from('dashboard_users')
        .insert({
          email: email.toLowerCase(),
          name,
          password_hash: passwordHash,
          wallet_address: walletAddress || null,
        })
        .select();

      if (error) {
        return NextResponse.json({ error: 'Erro ao cadastrar' }, { status: 500 });
      }

      const user = data[0];
      const token = await new SignJWT({ userId: user.id, email: user.email })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .sign(JWT_SECRET);

      return NextResponse.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          walletAddress: user.wallet_address,
        }
      });
    }

    if (action === 'verify') {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
      }

      try {
        const { payload } = await jwtVerify(authHeader.replace('Bearer ', ''), JWT_SECRET);
        const { data: users } = await supabase
          .from('dashboard_users')
          .select('*')
          .eq('id', payload.userId as string)
          .limit(1);

        if (!users || users.length === 0) {
          return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
        }

        const user = users[0];
        return NextResponse.json({
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            walletAddress: user.wallet_address,
          }
        });
      } catch (e) {
        return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
      }
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PUT: Vincular wallet ao usuário logado
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { payload } = await jwtVerify(authHeader.replace('Bearer ', ''), JWT_SECRET);
    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet obrigatória' }, { status: 400 });
    }

    const { error } = await supabase
      .from('dashboard_users')
      .update({ wallet_address: walletAddress.toLowerCase() })
      .eq('id', payload.userId);

    if (error) {
      return NextResponse.json({ error: 'Erro ao vincular wallet' }, { status: 500 });
    }

    return NextResponse.json({ success: true, walletAddress: walletAddress.toLowerCase() });
  } catch (e) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }
}
