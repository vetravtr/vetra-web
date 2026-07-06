import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

export const dynamic = 'force-dynamic';

function rpcCall(hostname: string, path: string, data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const options = { hostname, port: 443, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': body.length } };
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

const RPCS = [
  { url: 'polygon-bor.publicnode.com', path: '/' },
  { url: 'polygon-mainnet.g.alchemy.com', path: '/v2/process.env.ALCHEMY_KEY' },
];

const VTR = '0xAA27bd271B01dd20CcFA079800616335416c95Fd';
const USDC = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';

async function callRpc(data: string, to: string): Promise<string | null> {
  for (const { url, path } of RPCS) {
    try {
      const json = await rpcCall(url, path, {
        jsonrpc: '2.0', method: 'eth_call',
        params: [{ to, data }, 'latest'], id: 1,
      });
      if (json.result) return json.result;
    } catch (e) { continue; }
  }
  return null;
}

function checksum(addr: string): string {
  let a = addr.toLowerCase().replace('0x', '');
  // Simple checksum — just lowercase
  return '0x' + a;
}

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();
    if (!address) return NextResponse.json({ error: 'Address required' }, { status: 400 });

    const addr = checksum(address);
    const balanceOfSelector = '0x70a08231';

    // VTR balance
    const vtrData = balanceOfSelector + addr.slice(2).padStart(64, '0');
    const vtrResult = await callRpc(vtrData, VTR);
    const vtrBalance = vtrResult ? parseInt(vtrResult, 16) / 1e18 : 0;

    // USDC balance
    const usdcData = balanceOfSelector + addr.slice(2).padStart(64, '0');
    const usdcResult = await callRpc(usdcData, USDC);
    const usdcBalance = usdcResult ? parseInt(usdcResult, 16) / 1e6 : 0;

    return NextResponse.json({
      vtr: parseFloat(vtrBalance.toFixed(4)),
      usdc: parseFloat(usdcBalance.toFixed(2)),
    });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
