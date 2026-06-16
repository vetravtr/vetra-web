import { useState, useRef, useCallback } from 'react';
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { BrowserProvider, Contract } from 'ethers';

const PROJECT_ID   = 'd4ee97a93dc538bc7c23303cdd30814c';
const NFT_CONTRACT = '0x1D8Af48277CbC0Fa35B6EAFdE76b17ee1B44d74e';
const USDC_ADDRESS = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';
const PRICE = 340000n;
const ZERO  = '0x0000000000000000000000000000000000000000';

const NFT_ABI = [
  'function buy(address referrer) external',
  'function buyMultiple(address referrer, uint256 quantity) external',
  'function redeem(uint256 tokenId) external',
  'function redeemAll() external',
  'function balanceOf(address) view returns (uint256)',
  'function tokenOfOwnerByIndex(address,uint256) view returns (uint256)',
  'function boughtCount(address) view returns (uint256)',
  'function redeemable() view returns (bool)',
];
const USDC_ABI = [
  'function allowance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
  'function balanceOf(address) view returns (uint256)',
];

function getReferrer() {
  const q = new URLSearchParams(location.search).get('ref');
  if (q) return q;
  const m = location.pathname.match(/\/r\/(0x[a-fA-F0-9]{40})/);
  if (m) return m[1];
  return ZERO;
}

export default function WalletConnect() {
  const providerRef = useRef(null);
  const [account, setAccount] = useState(null);
  const [busy, setBusy]   = useState(false);
  const [label, setLabel] = useState('Buy NFT');
  const [ref, setRef]     = useState(null);
  const [ownedCount, setOwnedCount] = useState(0);
  const [canRedeem, setCanRedeem] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const ensureProvider = useCallback(async () => {
    if (providerRef.current) return providerRef.current;
    const p = await EthereumProvider.init({
      projectId: PROJECT_ID,
      chains: [137],
      showQrModal: true,
      qrModalOptions: { themeMode: 'dark' },
      metadata: {
        name: 'Vetra VTR', description: 'NFT Pre-Sale',
        url: location.origin, icons: [location.origin + '/favicon.svg'],
      },
    });
    p.on('disconnect', () => setAccount(null));
    p.on('accountsChanged', (a) => setAccount(a?.[0] || null));
    providerRef.current = p;
    return p;
  }, []);

  const checkOwned = useCallback(async (addr) => {
    try {
      const p = await ensureProvider();
      const eth = new BrowserProvider(p);
      const nft  = new Contract(NFT_CONTRACT, NFT_ABI, eth);
      const bal = await nft.balanceOf(addr);
      const rd  = await nft.redeemable();
      const bc  = await nft.boughtCount(addr);
      setOwnedCount(Number(bal));
      setCanRedeem(bal > 0n && rd);
    } catch(e) { console.error(e); }
  }, [ensureProvider]);

  const loadReferrals = useCallback(async (addr) => {
    try {
      const r = await fetch('/api/referrals/' + addr);
      const d = r.ok ? await r.json() : { count: 0, bonusPercent: 0 };
      setRef({ ...d, link: 'https://vetravtr.com/?ref=' + addr.slice(2, 10) });
    } catch (e) { console.error(e); }
  }, []);

  const connect = async () => {
    try {
      const p = await ensureProvider();
      if (account) { await p.disconnect(); setAccount(null); return; }
      await p.connect();
      const addr = p.accounts?.[0];
      if (addr) { setAccount(addr); loadReferrals(addr); checkOwned(addr); }
    } catch (e) { console.error('connect', e); }
  };

  const buy = async () => {
    if (!account) return;
    const qty = BigInt(quantity);
    if (qty < 1n) { alert('Quantity must be at least 1.'); return; }
    try {
      setBusy(true);
      setLabel('Aprovando USDC...');
      const eth = new BrowserProvider(providerRef.current);
      const signer = await eth.getSigner();
      const usdc = new Contract(USDC_ADDRESS, USDC_ABI, signer);
      const nft  = new Contract(NFT_CONTRACT, NFT_ABI, signer);

      const totalCost = PRICE * qty;

      // Check balance
      const bal = await usdc.balanceOf(account);
      if (bal < totalCost) { alert('Saldo USDC insuficiente.'); setLabel('Buy NFT'); setBusy(false); return; }

      // Approve if needed
      const allowance = await usdc.allowance(account, NFT_CONTRACT);
      if (allowance < totalCost) {
        await (await usdc.approve(NFT_CONTRACT, 2n ** 256n - 1n)).wait();
      }

      // Resolve referrer
      var referrer = getReferrer();
      if (referrer !== ZERO && referrer.length < 40) {
        var lr = await fetch('/api/lookup/' + referrer);
        if (lr.ok) { var ld = await lr.json(); referrer = ld.address || ZERO; }
        else referrer = ZERO;
      }

      setLabel('Confirmando compra...');
      let receipt;
      if (qty === 1n) {
        receipt = await (await nft.buy(referrer)).wait();
      } else {
        receipt = await (await nft.buyMultiple(referrer, qty)).wait();
      }

      await fetch('/api/purchase', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyer: account, referrer: getReferrer(), quantity: Number(qty), txHash: receipt.hash }),
      });

      setLabel('NFT comprado!');
      checkOwned(account);
      loadReferrals(account);
    } catch (e) {
      console.error(e);
      alert('Falha: ' + (e?.shortMessage || e?.message || 'erro'));
      setLabel('Buy NFT');
    } finally { setBusy(false); }
  };

  const redeemAll = async () => {
    if (!account || ownedCount === 0) return;
    try {
      setBusy(true);
      setLabel('Resgatando todos...');
      const eth = new BrowserProvider(providerRef.current);
      const signer = await eth.getSigner();
      const nft = new Contract(NFT_CONTRACT, NFT_ABI, signer);
      const tx = await (await nft.redeemAll()).wait();
      setLabel(`Resgatado! ${ownedCount} VTR recebido`);
      setOwnedCount(0);
      checkOwned(account);
    } catch (e) { console.error(e); alert('Falha: ' + (e?.shortMessage || e?.message || 'erro')); setLabel('Redeem NFT'); }
    finally { setBusy(false); }
  };

  const short = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Wallet';

  const totalUsd = ((Number(PRICE) / 1_000_000) * quantity).toFixed(2);

  return (
    <div className="flex flex-col gap-6">
      <button onClick={connect}
        className="w-full py-3 rounded-full border border-white/[0.12] text-white font-medium text-sm hover:bg-white/[0.05] transition-all">
        {short}
      </button>

      {ownedCount === 0 && !busy && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <input type="number" min={1} value={quantity}
              onChange={(e) => {
                const v = e.target.value;
                // Permite apagar completamente (vazio) e previne concatenação
                if (v === '') { setQuantity(1); return; }
                const n = parseInt(v, 10);
                if (!isNaN(n) && n >= 1) setQuantity(n);
              }}
              onFocus={(e) => e.target.select()}
              className="w-20 py-3 px-3 rounded-full bg-white/[0.05] border border-white/[0.12] text-white text-center text-sm
                         [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button onClick={buy} disabled={!account || busy}
              className="flex-1 py-4 rounded-full bg-[#643390] hover:bg-[#9A3CEB] text-white font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed">
              {quantity > 1 ? `Buy ${quantity} NFTs — $${totalUsd}` : 'Buy 1 NFT — $0.34'}
            </button>
          </div>
          <p className="text-text-grey text-xs text-center">1 NFT = $0.34 &middot; {quantity > 1 ? `Total: $${totalUsd}` : ''}</p>
        </div>
      )}

      {ownedCount === 0 && busy && (
        <button disabled
          className="w-full py-4 rounded-full bg-[#643390] text-white font-semibold text-lg opacity-70 cursor-not-allowed">
          {label}
        </button>
      )}

      {ownedCount > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-center text-white font-medium">You own {ownedCount} Pioneer NFT{ownedCount > 1 ? 's' : ''}</p>
          {canRedeem && (
            <button onClick={redeemAll} disabled={busy}
              className="w-full py-4 rounded-full bg-green-600 hover:bg-green-500 text-white font-semibold text-lg disabled:opacity-50">
              {busy ? label : `Redeem all for ${ownedCount} VTR`}
            </button>
          )}
        </div>
      )}

      {ref && (
        <div className="flex flex-col gap-4">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-text-grey text-xs mb-2">Your referral link:</p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-white font-mono truncate">{ref.link}</span>
              <button onClick={() => navigator.clipboard.writeText(ref.link)}
                className="text-badge-purple hover:text-light-purple text-xs font-medium">COPY</button>
            </div>
          </div>
          <div className="bg-badge-purple/5 border border-badge-purple/10 rounded-xl p-4 flex justify-between items-center">
            <div><p className="text-text-grey text-xs">Referred</p><p className="text-white text-2xl font-bold">{ref.count || 0}</p></div>
            <div className="text-right"><p className="text-text-grey text-xs">Bonus</p><p className="text-light-purple text-2xl font-bold">{ref.bonusPercent || 0}%</p></div>
          </div>
        </div>
      )}
    </div>
  );
}
