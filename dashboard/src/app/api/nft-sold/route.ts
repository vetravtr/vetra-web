import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

export const dynamic = 'force-dynamic';

function rpcCall(hostname: string, path: string, data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const options = {
      hostname, port: 443, path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': body.length },
    };
    const req = https.request(options, (res) => {
      let chunks = '';
      res.on('data', (chunk) => chunks += chunk);
      res.on('end', () => { try { resolve(JSON.parse(chunks)); } catch { reject('parse'); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const NFTS = '0x1D8Af48277CbC0Fa35B6EAFdE76b17ee1B44d74e' as const;
const RPCS = [
  { url: 'polygon-bor.publicnode.com', path: '/' },
  { url: 'polygon-mainnet.g.alchemy.com', path: '/v2/process.env.ALCHEMY_KEY' },
];

async function callRpc(data: string): Promise<string | null> {
  for (const { url, path } of RPCS) {
    try {
      const json = await rpcCall(url, path, {
        jsonrpc: '2.0', method: 'eth_call',
        params: [{ to: NFTS, data }, 'latest'], id: 1,
      });
      if (json.result) return json.result;
    } catch (e) { continue; }
  }
  return null;
}

export async function GET() {
  const result = await callRpc('0x9106d7ba'); // totalSold()
  if (result) return NextResponse.json({ totalSold: parseInt(result, 16) });
  return NextResponse.json({ error: 'RPC unavailable' }, { status: 502 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, selector } = body;

    if (selector === 'balanceOf' && address) {
      const data = '0x70a08231' + address.slice(2).padStart(64, '0');
      const result = await callRpc(data);
      if (result) {
        return NextResponse.json({ balance: parseInt(result, 16) });
      }
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
