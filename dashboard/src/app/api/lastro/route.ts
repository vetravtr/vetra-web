import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Parâmetros da FT Asset Management
    const params = new URLSearchParams({
      KeyCodeGUID: '91f9ff32-be3c-11f0-8d07-00155d010b18',
      AccountGUID: 'd2e45a89-7de0-11f0-8b61-00155d010b18',
      AccountNr: '42528',
    });

    const response = await fetch(`https://my.ftassetmanagement.com/api/bcl.asp?${params}`, {
      next: { revalidate: 300 }, // cache 5 min
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'API indisponível' }, { status: 502 });
    }

    const text = await response.text();

    // Extrair o JSON da resposta
    const match = text.match(/\{[\s\S]*"StatementSummary"[\s\S]*\}/);
    if (!match) {
      return NextResponse.json({ error: 'Formato inesperado' }, { status: 502 });
    }

    const data = JSON.parse(match[0]);
    const summary = data.StatementSummary;

    if (!summary || !summary.TotalBalance) {
      return NextResponse.json({ error: 'Dados não encontrados' }, { status: 502 });
    }

    const balance = parseFloat(summary.TotalBalance);
    const supply = 30000000; // 30M VTR
    const ratio = (balance / supply) * 100;

    return NextResponse.json({
      balance: balance * 1e6, // em wei pra consistência
      balanceFormatted: balance,
      ratio: Math.round(ratio),
      currency: summary.Currency,
      company: summary.companyname,
      dateTime: summary.DateTime,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Lastro fetch error:', error);
    return NextResponse.json({ error: 'Erro ao consultar lastro' }, { status: 500 });
  }
}
