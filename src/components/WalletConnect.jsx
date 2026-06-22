import { useState, useRef, useCallback, useEffect } from 'react';
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { BrowserProvider, Contract } from 'ethers';
import { vetraToast } from './VetraToast';

const PROJECT_ID   = 'd4ee97a93dc538bc7c23303cdd30814c';
const NFT_CONTRACT = '0x1D8Af48277CbC0Fa35B6EAFdE76b17ee1B44d74e';
const USDC_ADDRESS = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';
const PRICE = 340000n;
const ZERO  = '0x0000000000000000000000000000000000000000';
const V1_CONTRACT = '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3'; // desativado - só pra warn

// Alertar se estiver usando contrato V1
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log('Dev mode - usando V2');
} else if (NFT_CONTRACT.toLowerCase() === V1_CONTRACT.toLowerCase()) {
  console.error('ERRO CRÍTICO: Site apontando para contrato V1 desativado!');
}

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
  const [inputVal, setInputVal] = useState('1');

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
      // Usar RPC direto para consultas (view functions) - mais confiavel que WalletConnect
      const rpcProvider = new BrowserProvider('https://polygon-mainnet.g.alchemy.com/v2/16sJw5JgOrfP0sQXZ1tlb');
      const nft  = new Contract(NFT_CONTRACT, NFT_ABI, rpcProvider);
      const bal = await nft.balanceOf(addr);
      const rd  = await nft.redeemable();
      const bc  = await nft.boughtCount(addr);
      setOwnedCount(Number(bal));
      setCanRedeem(bal > 0n && rd);
    } catch(e) { console.error('checkOwned error:', e); }
  }, []);

  // Chamar checkOwned quando a conta mudar
  useEffect(() => {
    if (account) {
      checkOwned(account);
    }
  }, [account, checkOwned]);

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
    if (qty < 1n) { vetraToast('Quantity must be at least 1.'); return; }
    try {
      setBusy(true);
      setLabel('Approving USDC...');
      const eth = new BrowserProvider(providerRef.current);
      const signer = await eth.getSigner();
      const usdc = new Contract(USDC_ADDRESS, USDC_ABI, signer);
      const nft  = new Contract(NFT_CONTRACT, NFT_ABI, signer);

      const totalCost = PRICE * qty;

      // Check balance
      const bal = await usdc.balanceOf(account);
      if (bal < totalCost) { vetraToast('Insufficient USDC balance.'); setLabel('Buy NFT'); setBusy(false); return; }

      // Approve if needed
      const allowance = await usdc.allowance(account, NFT_CONTRACT);
      if (allowance < totalCost) {
        setLabel('Approving USDC...');
        await (await usdc.approve(NFT_CONTRACT, 2n ** 256n - 1n)).wait();
      }

      // Resolve referrer
      var referrer = getReferrer();
      var referrerAddr = ZERO;
      if (referrer !== ZERO && referrer.length < 40) {
        var lr = await fetch('/api/lookup/' + referrer);
        if (lr.ok) { var ld = await lr.json(); referrerAddr = ld.address || ZERO; }
        else referrerAddr = ZERO;
      } else {
        referrerAddr = referrer;
      }

      // Register purchase BEFORE sending transaction
      setLabel('Registering purchase...');
      try {
        await fetch('/api/purchase', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ buyer: account, referrer: referrerAddr, quantity: Number(qty), txHash: 'pending_' + Date.now() }),
        });
      } catch (e) { console.error('Pre-register failed:', e); }

      // Send transaction
      setLabel('Confirm in wallet...');
      let receipt;
      if (qty === 1n) {
        receipt = await (await nft.buy(referrerAddr)).wait();
      } else {
        receipt = await (await nft.buyMultiple(referrerAddr, qty)).wait();
      }

      // Update txHash with real hash
      try {
        await fetch('/api/purchase', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ buyer: account, referrer: referrerAddr, quantity: Number(qty), txHash: receipt.hash }),
        });
      } catch (e) {}

      vetraToast('Purchase confirmed! Check your email.');
      setLabel('NFT Purchased!');
      checkOwned(account);
      loadReferrals(account);
    } catch (e) {
      console.error(e);
      const msg = e?.shortMessage || e?.message || 'error';
      vetraToast('Failed: ' + msg);
      if (msg.includes('user rejected') || msg.includes('disconnect') || msg.includes('not connected')) {
        setAccount(null);
        setLabel('Connect Wallet');
      } else {
        setLabel('Buy NFT');
      }
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
    } catch (e) { console.error(e); vetraToast('Failed: ' + (e?.shortMessage || e?.message || 'error'));setLabel('Redeem NFT'); }
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

      {!busy && (
        <div className="flex flex-col gap-2">
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
              {!account ? 'Connect Wallet First' : (quantity > 1 ? `Buy ${quantity} NFTs — $${totalUsd}` : 'Buy 1 NFT — $0.34')}
            </button>
          </div>
          <p className="text-text-grey text-xs text-center">1 NFT = $0.34 &middot; {quantity > 1 ? `Total: $${totalUsd}` : ''}</p>
          <p className="text-text-grey text-[11px] text-center opacity-60">Make sure you have enough POL for gas fees</p>
        </div>
      )}

      {account && (
        <p className="text-center text-sm text-white/70 mt-1">
          You own <span className="text-white font-semibold">{ownedCount}</span> Pioneer NFT{ownedCount !== 1 ? 's' : ''}
        </p>
      )}

      {busy && (
        <button disabled
          className="w-full py-4 rounded-full bg-[#643390] text-white font-semibold text-lg opacity-70 cursor-not-allowed">
          {label}
        </button>
      )}
    </div>
  );
}
