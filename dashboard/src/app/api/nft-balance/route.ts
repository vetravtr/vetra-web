import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

export const dynamic = 'force-dynamic';

function rpcCall(hostname: string, path: string, data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const req = https.request({ hostname, port: 443, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': body.length } }, (res) => {
      let c = '';
      res.on('data', (d) => c += d);
      res.on('end', () => { try { resolve(JSON.parse(c)); } catch { reject('parse'); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet required' }, { status: 400 });
  }

  // balanceOf(address) selector: 0x70a08231
  const data = '0x70a08231' + wallet.slice(2).toLowerCase().padStart(64, '0');

  const rpcs = [
    { url: 'polygon-bor.publicnode.com', path: '/' },
    { url: 'polygon-mainnet.g.alchemy.com', path: '/v2/process.env.ALCHEMY_KEY' },
  ];

  for (const { url, path } of rpcs) {
    try {
      const json = await rpcCall(url, path, {
        jsonrpc: '2.0', method: 'eth_call',
        params: [{ to: '0x1D8Af48277CbC0Fa35B6EAFdE76b17ee1B44d74e', data }, 'latest'],
        id: 1,
      });
      if (json.result) {
        return NextResponse.json({ balance: parseInt(json.result, 16) });
      }
    } catch (e) { continue; }
  }
  return NextResponse.json({ error: 'RPC unavailable' }, { status: 502 });
}
