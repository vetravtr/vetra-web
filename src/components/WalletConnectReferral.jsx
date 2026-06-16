import { useState, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';

const NFT_CONTRACT = '0x1D8Af48277CbC0Fa35B6EAFdE76b17ee1B44d74e';
const USDC_ADDRESS = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';
const PRICE = 340000n;
const ZERO  = '0x0000000000000000000000000000000000000000';

const NFT_ABI = [
  'function buy(address referrer) external',
  'function buyMultiple(address referrer, uint256 quantity) external',
  'function boughtCount(address) view returns (uint256)',
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

let sharedProvider = null;
let sharedAccount = null;
let listeners = [];

function notifyAll() { listeners.forEach(fn => fn(sharedAccount)); }

async function getProvider() {
  if (sharedProvider) return sharedProvider;
  const { EthereumProvider } = await import('@walletconnect/ethereum-provider');
  const p = await EthereumProvider.init({
    projectId: 'd4ee97a93dc538bc7c23303cdd30814c',
    chains: [137], showQrModal: true,
    qrModalOptions: { themeMode: 'dark' },
    metadata: { name: 'Vetra VTR', description: 'NFT Pre-Sale', url: location.origin, icons: [location.origin + '/favicon.svg'] },
  });
  p.on('disconnect', () => { sharedAccount = null; notifyAll(); });
  p.on('accountsChanged', (a) => { sharedAccount = a?.[0] || null; notifyAll(); });
  if (p.accounts?.length) sharedAccount = p.accounts[0];
  sharedProvider = p;
  return p;
}

export default function WalletConnectReferral() {
  const [account, setAccount] = useState(sharedAccount);
  const [ref, setRef] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState('Buy NFT');
  const [quantity, setQuantity] = useState(1);
  const [inputVal, setInputVal] = useState('1');

  useEffect(() => {
    listeners.push(setAccount);
    if (sharedAccount) loadRef(sharedAccount);
    return () => { listeners = listeners.filter(fn => fn !== setAccount); };
  }, []);

  const loadRef = async (addr) => {
    try {
      const r = await fetch('/api/referrals/' + addr);
      const d = r.ok ? await r.json() : { count: 0, bonusPercent: 0 };
      setRef({ ...d, link: 'https://vetravtr.com/?ref=' + addr.slice(2, 10) });
    } catch (e) { console.error(e); }
  };

  const saveUser = async () => {
    if (!account || (!name && !email)) return;
    await fetch('/api/save-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wallet_address: account, name, email }) });
  };

  const connect = async () => {
    try {
      const p = await getProvider();
      if (sharedAccount) { await p.disconnect(); sharedAccount = null; setAccount(null); setRef(null); notifyAll(); return; }
      await p.connect();
      const addr = p.accounts?.[0];
      if (addr) { sharedAccount = addr; setAccount(addr); notifyAll(); loadRef(addr); }
    } catch (e) { console.error('connect', e); }
  };

  const buy = async () => {
    if (!account) return;
    const qty = BigInt(quantity);
    if (qty < 1n) { alert('Quantity must be at least 1.'); return; }
    try {
      setBusy(true);
      const p = await getProvider();
      const eth = new BrowserProvider(p);
      const signer = await eth.getSigner();
      const usdc = new Contract(USDC_ADDRESS, USDC_ABI, signer);
      const nft  = new Contract(NFT_CONTRACT, NFT_ABI, signer);

      const totalCost = PRICE * qty;

      if (await usdc.balanceOf(account) < totalCost) { alert('Saldo USDC insuficiente.'); setLabel('Buy NFT'); setBusy(false); return; }
      if (await usdc.allowance(account, NFT_CONTRACT) < totalCost) {
        setLabel('Aprovando USDC...');
        await (await usdc.approve(NFT_CONTRACT, 2n ** 256n - 1n)).wait();
      }
      setLabel('Confirmando...');
      var referrer = getReferrer();
      if (referrer !== ZERO && referrer.length < 40) {
        var lr = await fetch('/api/lookup/' + referrer);
        if (lr.ok) { var ld = await lr.json(); referrer = ld.address || ZERO; }
        else referrer = ZERO;
      }
      let receipt;
      if (qty === 1n) {
        receipt = await (await nft.buy(referrer)).wait();
      } else {
        receipt = await (await nft.buyMultiple(referrer, qty)).wait();
      }
      // Registrar compra no backend
      try {
        const resp = await fetch('/api/purchase', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ buyer: account, referrer: getReferrer(), quantity: Number(qty), txHash: receipt.hash, name, email }) });
        if (!resp.ok) console.warn('Purchase registration HTTP', resp.status, await resp.text());
        else console.log('Purchase registered OK');
      } catch (e) { console.warn('Purchase registration failed:', e); }
      setLabel('NFT comprado!');
      setTimeout(() => alert('Purchase confirmed! Check your email (including spam folder).'), 500);
      loadRef(account);
    } catch (e) { console.error(e); alert('Falha: ' + (e?.shortMessage || e?.message || 'erro')); setLabel('Buy NFT'); }
    finally { setBusy(false); }
  };

  const totalUsd = ((Number(PRICE) / 1_000_000) * quantity).toFixed(2);

  return (
    <div className="flex flex-col gap-4">
      <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} onBlur={saveUser}
        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white placeholder:text-text-grey text-sm focus:outline-none focus:border-badge-purple transition-colors" />
      <input type="email" placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={saveUser}
        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white placeholder:text-text-grey text-sm focus:outline-none focus:border-badge-purple transition-colors" />

      <button onClick={connect}
        className="w-full py-3 rounded-full border border-white/[0.12] text-white font-medium text-sm hover:bg-white/[0.05] transition-all">
        {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Wallet'}
      </button>

      <div className="flex items-center gap-3">
        <input type="number" min={1}
          value={inputVal}
          onChange={(e) => {
            const v = e.target.value;
            setInputVal(v);
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
      <p className="text-text-grey text-xs text-center -mt-2">1 NFT = $0.34 &middot; {quantity > 1 ? `Total: $${totalUsd}` : ''}</p>

      {ref && (
        <>
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
        </>
      )}
    </div>
  );
}
