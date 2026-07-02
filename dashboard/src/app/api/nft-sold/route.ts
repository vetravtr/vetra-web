import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  return NextResponse.json({ error: 'API not configured - set env vars in Vercel' }, { status: 501 });
}
export async function POST(req: NextRequest) {
  return NextResponse.json({ error: 'API not configured - set env vars in Vercel' }, { status: 501 });
}
