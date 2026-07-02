import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = 'https://qhgxffazypogelvclyjn.supabase.co';
const supabaseKey = 'process.env.SUPABASE_SERVICE_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

// POST: Registrar intenção de buyback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, amountVtr } = body;

    if (!walletAddress || !amountVtr || amountVtr <= 0) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // Calcular valor estimado (TWAP - 3%)
    // Buscar preço atual
    let twapPrice = 0.32; // fallback
    try {
      const r = await fetch('https://api.dexscreener.com/latest/dex/pairs/polygon/0x5484C717168175cFFDd77678ecAC3A38e76c4e2B');
      const d = await r.json();
      if (d.pair) twapPrice = parseFloat(d.pair.priceUsd) || 0.32;
    } catch (e) { /* usa fallback */ }

    const buybackPrice = twapPrice * 0.97;
    const estimatedValue = amountVtr * buybackPrice;

    // Inserir no Supabase
    const { data, error } = await supabase
      .from('buyback_intents')
      .insert({
        wallet_address: walletAddress.toLowerCase(),
        amount_vtr: amountVtr,
        estimated_value_usd: estimatedValue,
        status: 'pending',
      })
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Erro ao registrar' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data?.[0] });
  } catch (e) {
    console.error('Buyback intent error:', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// GET: Consultar intenções (fila)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    let query = supabase
      .from('buyback_intents')
      .select('*')
      .order('created_at', { ascending: true });

    if (wallet) {
      query = query.eq('wallet_address', wallet.toLowerCase());
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Erro ao consultar' }, { status: 500 });
    }

    // Calcular posição na fila
    const intents = data || [];
    const totalVtr = intents.reduce((sum: number, i: any) => sum + parseFloat(i.amount_vtr || 0), 0);
    const pendingCount = intents.filter((i: any) => i.status === 'pending').length;

    return NextResponse.json({
      intents,
      totalVtr,
      pendingCount,
      position: wallet ? intents.findIndex((i: any) => i.wallet_address === wallet.toLowerCase()) + 1 : null,
    });
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
