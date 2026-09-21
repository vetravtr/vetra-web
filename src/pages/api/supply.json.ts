import type { APIRoute } from "astro";

/**
 * /api/supply.json
 *
 * Retorna o supply real do token VTR, lido DIRETAMENTE do contrato na Polygon.
 * Sem intermediarios, sem custodiante, sem API de terceiros.
 *
 * Contrato: 0xAA27bd271B01dd20CcFA079800616335416c95Fd
 * Selector: totalSupply() = 0x18160ddd  (18 decimais)
 */
const VTR = "0xAA27bd271B01dd20CcFA079800616335416c95Fd";
const TOTAL_SUPPLY_SELECTOR = "0x18160ddd";
const MAX_SUPPLY_SELECTOR = "0xd5abeb01"; // maxSupply() do contrato V3
const DECIMALS = 18;

const RPCS = [
  import.meta.env.POLYGON_RPC,
  "https://polygon-bor-rpc.publicnode.com",
  "https://polygon-rpc.com",
].filter(Boolean) as string[];

async function callRpc(method: string, params: unknown[]) {
  let lastError: unknown = null;
  for (const url of RPCS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": "VETRA/1.0" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      });
      const json = await res.json();
      if (json?.result) return json.result;
      lastError = json?.error ?? "empty result";
    } catch (e) {
      lastError = e;
    }
  }
  throw new Error(String(lastError));
}

export const GET: APIRoute = async () => {
  try {
    const supplyHex = await callRpc("eth_call", [
      { to: VTR, data: TOTAL_SUPPLY_SELECTOR },
      "latest",
    ]);
    const supply = Number(BigInt(supplyHex)) / 10 ** DECIMALS;

    let maxSupply: number | null = null;
    try {
      const maxHex = await callRpc("eth_call", [
        { to: VTR, data: MAX_SUPPLY_SELECTOR },
        "latest",
      ]);
      const raw = BigInt(maxHex);
      if (raw > 0n) maxSupply = Number(raw) / 10 ** DECIMALS;
    } catch {
      maxSupply = null;
    }

    return new Response(
      JSON.stringify({
        supply,
        maxSupply,
        decimals: DECIMALS,
        contract: VTR,
        network: "Polygon PoS (137)",
        updatedAt: new Date().toISOString(),
        source: "on-chain",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300",
        },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error), source: "on-chain" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
