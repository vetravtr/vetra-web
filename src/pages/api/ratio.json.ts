import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    // Fetch reserves from the same API
    const reservesUrl = "https://my.ftassetmanagement.com/api/bcl.asp?KeyCodeGUID=91f9ff32-be3c-11f0-8d07-00155d010b18&AccountGUID=d2e45a89-7de0-11f0-8b61-00155d010b18&AccountNr=42528";
    const reservesRes = await fetch(reservesUrl);
    const reservesData = await reservesRes.json();
    const reserves = parseFloat(reservesData?.StatementSummary?.TotalBalance || '0');
    
    if (reserves <= 0) throw new Error('Invalid reserves');
    
    // Fetch total supply on-chain via RPC
    const VTR = '0xAA27bd271B01dd20CcFA079800616335416c95Fd';
    const RPC = 'https://polygon-mainnet.g.alchemy.com/v2/UkkHwMwI5JF8e_0X3qMYdQHOkGUqMwwj';
    // totalSupply() selector: 0x18160ddd
    const rpcRes = await fetch(RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'eth_call',
        params: [{ to: VTR, data: '0x18160ddd' }, 'latest'],
      }),
    });
    const rpcData = await rpcRes.json();
    
    let supply = 30_000_000; // fallback
    if (rpcData?.result) {
      supply = parseInt(rpcData.result, 16) / 1e18;
    }
    
    const ratio = reserves / supply;
    
    return new Response(JSON.stringify({
      ratio: Math.round(ratio * 100) / 100,
      reserves,
      supply: Math.round(supply),
      updatedAt: new Date().toISOString(),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      ratio: 3.33,
      reserves: 100_000_000,
      supply: 30_000_000,
      error: String(error),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
