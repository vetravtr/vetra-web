'use client';

import { WalletButton } from '@/components/WalletButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useEffect, useState, useRef } from 'react';
import { Tooltip } from '@/components/Tooltip';

const VTR_ADDRESS = '0xAA27bd271B01dd20CcFA079800616335416c95Fd';
const NFT_ADDRESS = '0x1D8Af48277CbC0Fa35B6EAFdE76b17ee1B44d74e';
const POOL_UNI_V3 = '0x5484C717168175cFFDd77678ecAC3A38e76c4e2B';
const VESTING_ADDRESS = '0x0000000000000000000000000000000000000000';
const USDC_ADDRESS = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';
const TREASURY = '0x29F1bE1E72c031539bc22437aFde22fF765EE00e';

const ABI_BALANCE = [{ constant: true, inputs: [{ name: '_owner', type: 'address' }], name: 'balanceOf', outputs: [{ name: '', type: 'uint256' }], type: 'function' }] as const;

let priceCache = { price: 0, timestamp: 0 };

export default function DashboardPage() {
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const isConnected = !!connectedWallet;
  const address = connectedWallet;
  const [marketData, setMarketData] = useState({ price: 0, tvl: 0, vol24: 0, fdv: 0 });
  const [twap, setTwap] = useState(0);
  const [lastro, setLastro] = useState({ balance: 0, ratio: 0 });
  const [buyback, setBuyback] = useState({ amount: '', loading: false, message: '', intents: [] as any[], totalVtr: 0, position: 0 });
  const [tickerPrices, setTickerPrices] = useState<any[]>([]);
  const [nftSold, setNftSold] = useState(0);
  const [nftBalance, setNftBalance] = useState(0);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [otcAsset, setOtcAsset] = useState('USDC');
  const [otcAmount, setOtcAmount] = useState('');
  const [otcVtr, setOtcVtr] = useState('');
  const [otcStatus, setOtcStatus] = useState('');
  const [otcMessage, setOtcMessage] = useState('');

  const [vtrBalanceRaw, setVtrBalanceRaw] = useState<string | null>(null);
  const [usdcBalanceRaw, setUsdcBalanceRaw] = useState<string | null>(null);

  // Fallback: ler saldo direto via RPC
  useEffect(() => {
    if (!address) return;
    console.log('Fetching balances for:', address);
    async function fetchBalances() {
      try {
        const r = await fetch('/api/balances', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address }),
        });
        const d = await r.json();
        if (d.vtr !== undefined) setVtrBalanceRaw(d.vtr.toFixed(2));
        if (d.usdc !== undefined) setUsdcBalanceRaw(d.usdc.toFixed(2));
      } catch (e) { console.error('Balance fetch error:', e); }
    }
    fetchBalances();
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [address]);

  // Buscar saldo de NFT da carteira conectada
  useEffect(() => {
    if (!address) return;
    const wallet = address;
    async function fetchNftBalance() {
      try {
        const r = await fetch(`/api/nft-balance?wallet=${wallet}`);
        const d = await r.json();
        if (d.balance !== undefined) setNftBalance(d.balance);
      } catch (e) { /* silent */ }
    }
    fetchNftBalance();
  }, [address]);

  // Buscar dados de mercado
  useEffect(() => {
    async function fetchMarket() {
      try {
        const r = await fetch('https://api.dexscreener.com/latest/dex/pairs/polygon/0x5484C717168175cFFDd77678ecAC3A38e76c4e2B');
        const d = await r.json();
        if (d.pair) {
          setMarketData({
            price: parseFloat(d.pair.priceUsd) || 0,
            tvl: parseFloat(d.pair.liquidity?.usd) || 0,
            vol24: parseFloat(d.pair.volume?.h24) || 0,
            fdv: parseFloat(d.pair.fdv) || 0,
          });
          setTwap(parseFloat(d.pair.priceUsd) || 0);
        }
      } catch (e) { console.error('Market fetch error:', e); }
    }
    fetchMarket();
    const interval = setInterval(fetchMarket, 60000);
    return () => clearInterval(interval);
  }, []);

  // Buscar NFT total sold
  useEffect(() => {
    async function fetchNftSold() {
      try {
        const r = await fetch('/api/nft-sold');
        const d = await r.json();
        if (d.totalSold) setNftSold(d.totalSold);
      } catch (e) { /* silent */ }
    }
    fetchNftSold();
  }, []);
  // Buscar saldo de NFT da carteira conectada
  useEffect(() => {
    if (!address) return;
    async function fetchNftBalance2() {
      try {
        const r = await fetch(`/api/nft-balance?wallet=${address}`);
        const d = await r.json();
        if (d.balance !== undefined) setNftBalance(d.balance);
      } catch (e) { /* silent */ }
    }
    fetchNftBalance2();
  }, [address]);

  // Buscar blog posts do Supabase
  useEffect(() => {
    async function fetchBlog() {
      try {
        const r = await fetch('/api/blog');
        const d = await r.json();
        if (d.posts) setBlogPosts(d.posts.slice(0, 3));
      } catch (e) { /* silent */ }
    }
    fetchBlog();
  }, []);

  // Buscar ticker
  useEffect(() => {
    async function fetchTicker() {
      try {
        const ids = 'bitcoin,ethereum,solana,polgon,chainlink,uniswap,usd-coin,tether,dai,vetra';
        const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
        const d = await r.json();
        const coins = [
          { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
          { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
          { id: 'solana', symbol: 'SOL', name: 'Solana' },
          { id: 'polgon', symbol: 'POL', name: 'Polygon' },
          { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
          { id: 'uniswap', symbol: 'UNI', name: 'Uniswap' },
          { id: 'usd-coin', symbol: 'USDC', name: 'USD Coin' },
          { id: 'tether', symbol: 'USDT', name: 'Tether' },
          { id: 'dai', symbol: 'DAI', name: 'Dai' },
          { id: 'vetra', symbol: 'VTR', name: 'VETRA' },
        ];
        const prices = coins.map(c => ({ ...c, price: d[c.id]?.usd || 0, change24h: d[c.id]?.usd_24h_change || 0 }));
        prices[9].price = marketData.price || 0.32;
        setTickerPrices(prices);
      } catch (e) { /* silent */ }
    }
    fetchTicker();
    const tickInterval = setInterval(fetchTicker, 60000);
    return () => clearInterval(tickInterval);
  }, [marketData.price]);

  // Buscar lastro
  useEffect(() => {
    async function fetchLastro() {
      try {
        const r = await fetch('/api/lastro');
        const d = await r.json();
        if (d.balance) {
          setLastro({ balance: d.balance, ratio: d.ratio || 0 });
        }
      } catch (e) { /* silent */ }
    }
    fetchLastro();
  }, []);

  // Buscar intenções de buyback
  useEffect(() => {
    async function fetchIntents() {
      if (!address) return;
      try {
        const r = await fetch(`/api/buyback?wallet=${address}`);
        const d = await r.json();
        if (d.intents) {
          setBuyback(prev => ({ ...prev, intents: d.intents, totalVtr: d.totalVtr || 0, position: d.position || 0 }));
        }
      } catch (e) { /* silent */ }
    }
    fetchIntents();
  }, [address]);

  const registrarIntencao = async () => {
    if (!address || !buyback.amount || parseFloat(buyback.amount) <= 0) return;
    setBuyback(prev => ({ ...prev, loading: true, message: '' }));
    try {
      const r = await fetch('/api/buyback', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address, amountVtr: parseFloat(buyback.amount) }),
      });
      const d = await r.json();
      if (d.success) {
        setBuyback(prev => ({ ...prev, message: 'Intent registered successfully!', amount: '', loading: false }));
        const r2 = await fetch(`/api/buyback?wallet=${address}`);
        const d2 = await r2.json();
        if (d2.intents) setBuyback(prev => ({ ...prev, intents: d2.intents, totalVtr: d2.totalVtr || 0, position: d2.position || 0 }));
      } else {
        setBuyback(prev => ({ ...prev, message: d.error || 'Error', loading: false }));
      }
    } catch (e) {
      setBuyback(prev => ({ ...prev, message: 'Connection error', loading: false }));
    }
  };

  const otcPrice = twap * 1.08;
  const buybackPrice = twap * 0.97;

  const handleOtcSubmit = async () => {
    if (!address || !otcAmount || parseFloat(otcAmount) <= 0) return;
    setOtcStatus('sending');
    setOtcMessage('');
    try {
      const r = await fetch('/api/otc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: localStorage.getItem('vetra_user') ? JSON.parse(localStorage.getItem('vetra_user')!).id : null,
          walletAddress: address,
          asset: otcAsset,
          amountUsd: parseFloat(otcAmount),
          vtrAmount: parseFloat(otcVtr),
        }),
      });
      const d = await r.json();
      if (d.success) {
        setOtcStatus('sent');
        setOtcMessage(`Thank you! Send ${otcAsset} to the address above. We'll notify you when confirmed.`);
      } else {
        setOtcStatus('');
        setOtcMessage(d.error || 'Error submitting');
      }
    } catch (e) {
      setOtcStatus('');
      setOtcMessage('Connection error');
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(5,1,9)] text-white p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 max-w-6xl mx-auto">
        <a href="https://www.vetravtr.com" target="_blank" rel="noopener noreferrer">
          <img src="/images/partners/vetra.svg" alt="VETRA" className="h-7" />
        </a>
        <nav className="hidden md:flex items-center justify-center gap-6 text-sm text-white/50 flex-1">
          <a href="https://www.vetravtr.com" target="_blank" className="hover:text-white/80 transition-colors">Home</a>
          <a href="https://www.vetravtr.com/whitepaper" target="_blank" className="hover:text-white/80 transition-colors">Whitepaper</a>
          <a href="https://www.vetravtr.com/blog" target="_blank" className="hover:text-white/80 transition-colors">Blog</a>
          <a href="https://www.vetravtr.com/faq" target="_blank" className="hover:text-white/80 transition-colors">FAQ</a>
          <a href="https://www.vetravtr.com/contact" target="_blank" className="hover:text-white/80 transition-colors">Contact us</a>
          <span className="text-white/90">Dashboard</span>
        </nav>
        <WalletButton onConnect={(addr) => { setConnectedWallet(addr); }} />
      </header>

      {/* Ticker */}
      {tickerPrices.length > 0 && (
        <div className="relative overflow-hidden mb-6 bg-white/[0.02] border border-white/[0.06] rounded-xl py-3">
          <div className="flex whitespace-nowrap gap-8 px-4" style={{ animation: 'marquee 30s linear infinite' }}>
            {[...tickerPrices, ...tickerPrices].map((coin, i) => (
              <div key={i} className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${coin.symbol === 'VTR' ? 'bg-[#643390]/20 border border-[#643390]/30' : ''}`}>
                <span className={`text-sm font-semibold ${coin.symbol === 'VTR' ? 'text-[#b388ff]' : 'text-white/80'}`}>{coin.symbol}</span>
                <span className="text-sm font-mono">${coin.price.toFixed(coin.price < 1 ? coin.price < 0.01 ? 6 : 4 : 2)}</span>
                <span className={`text-xs ${coin.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cards de Saldo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white/[0.03] border border-white/[0.06]">
          <CardHeader><CardTitle className="text-sm text-white/80">VTR Balance</CardTitle></CardHeader>
          <CardContent>
            <p className="text-base font-bold text-white">{vtrBalanceRaw || '—'}</p>
            <p className="text-xs text-white/60">~${vtrBalanceRaw ? (parseFloat(vtrBalanceRaw) * marketData.price).toFixed(2) : '0.00'} USD</p>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.03] border border-white/[0.06]">
          <CardHeader><CardTitle className="text-sm text-white/80">USDC Balance</CardTitle></CardHeader>
          <CardContent>
            <p className="text-base font-bold text-white">{usdcBalanceRaw ? '$' + usdcBalanceRaw : '—'}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.03] border border-white/[0.06]">
          <CardHeader><CardTitle className="text-sm text-white/80">Market Price</CardTitle></CardHeader>
          <CardContent>
            <p className="text-base font-bold text-white">${marketData.price > 0 ? marketData.price.toFixed(4) : '—'}</p>
            <p className="text-xs text-white/60">TVL: ${marketData.tvl.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.03] border border-white/[0.06]">
          <CardHeader><CardTitle className="text-sm text-white/80">Reserves</CardTitle></CardHeader>
          <CardContent>
            <p className="text-base font-bold text-green-400">${lastro.balance ? (lastro.balance / 1e6).toLocaleString() : '—'}</p>
            <p className="text-xs text-white/60">Ratio: {lastro.ratio > 0 ? `${lastro.ratio}%` : '—'}</p>
          </CardContent>
        </Card>
      </div>

      {/* OTC + Buyback */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="bg-white/[0.03] border border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-sm">OTC Sale (VETRA → Investor)
              <Tooltip text="Buy VTR directly from VETRA at 8% above weekly avg price. No slippage, guaranteed allocation. Ideal for large purchases.">
                <span className="ml-1 text-white/30 cursor-help">ⓘ</span>
              </Tooltip>
            </CardTitle>
            <Badge variant="secondary" className="w-fit">TWAP + 8%</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-orange-400">${otcPrice > 0 ? otcPrice.toFixed(4) : '—'}</p>
            <p className="text-xs text-white/60 mt-2">Base: <Tooltip text="TWAP = Time-Weighted Average Price over 7 days from Uniswap V3"><span className="cursor-help border-b border-dotted border-white/30">TWAP</span></Tooltip> ${twap > 0 ? twap.toFixed(4) : '—'}</p>
            <Separator className="bg-white/10 my-3" />
            <div className="text-xs text-white/50 space-y-1.5">
              <p className="text-white/70 font-medium">When to use OTC?</p>
              <p>• Buying large amounts without slippage (min $2,000)</p>
              <p>• Guaranteed allocation at fixed price</p>
              <p>• No gas fees on swap</p>
            </div>
            <Separator className="bg-white/10 my-3" />
            {isConnected ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-white/60 mb-1">Asset</p>
                    <select value={otcAsset} onChange={e => { setOtcAsset(e.target.value); setOtcVtr(''); }}
                      className="w-full h-9 rounded-lg bg-white/5 border border-white/10 text-white text-xs px-2">
                      <option value="USDC" className="bg-[#1a1a2e]">USDC</option>
                      <option value="USDT" className="bg-[#1a1a2e]">USDT</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-xs text-white/60 mb-1">Amount (min $2K)</p>
                    <input type="number" placeholder="e.g. 10000" value={otcAmount} onChange={e => { setOtcAmount(e.target.value); setOtcVtr(e.target.value && parseFloat(e.target.value) >= 2000 ? (parseFloat(e.target.value) / otcPrice).toFixed(2) : ''); }}
                      className="w-full h-9 rounded-lg bg-white/5 border border-white/10 text-white text-xs px-2 placeholder:text-white/30" />
                  </div>
                </div>
                
                {otcAmount && parseFloat(otcAmount) >= 2000 && (
                  <div className="bg-white/[0.05] rounded-lg p-3 space-y-1.5">
                    <div className="flex justify-between text-xs"><span className="text-white/60">You send</span><span className="text-white font-semibold">${parseFloat(otcAmount).toLocaleString()} {otcAsset}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-white/60">You receive</span><span className="text-[#b388ff] font-semibold">{parseFloat(otcVtr).toLocaleString()} VTR</span></div>
                    <div className="flex justify-between text-xs"><span className="text-white/60">Network</span><span className="text-white/80">Polygon</span></div>
                    <Separator className="bg-white/10 my-1" />
                    <p className="text-xs text-white/40">Send to:</p>
                    <code className="block text-[10px] text-[#b388ff] break-all bg-black/20 p-1.5 rounded">0x29F1bE1E72c031539bc22437aFde22fF765EE00e</code>
                  </div>
                )}

                {otcAmount && parseFloat(otcAmount) > 0 && parseFloat(otcAmount) < 2000 && (
                  <p className="text-xs text-red-400">Minimum order: $2,000</p>
                )}

                {otcStatus && (
                  <div className="flex items-center gap-2 text-xs">
                    {otcStatus === 'sending' ? (
                      <><span className="inline-block w-3 h-3 border-2 border-[#b388ff] border-t-transparent rounded-full animate-spin" /> <span className="text-white/60">Submitting...</span></>
                    ) : otcStatus === 'sent' ? (
                      <span className="text-green-400">✅ Request sent! You'll receive a confirmation.</span>
                    ) : null}
                  </div>
                )}

                <button onClick={handleOtcSubmit} disabled={!otcAmount || parseFloat(otcAmount) < 2000 || otcStatus === 'sending'}
                  className="w-full h-9 rounded-lg bg-[#643390] hover:bg-[#9A3CEB] text-white text-xs font-medium transition-colors disabled:opacity-50">
                  {otcStatus === 'sending' ? 'Processing...' : 'Submit OTC Request'}
                </button>

                {otcMessage && <p className={`text-xs ${otcMessage.includes('Thank you') ? 'text-green-400' : 'text-red-400'}`}>{otcMessage}</p>}
              </div>
            ) : (
              <p className="text-xs text-white/60">Connect wallet to submit OTC request.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/[0.03] border border-white/[0.06]" key="buyback-card">
          <CardHeader>
            <CardTitle className="text-sm">Buyback Commitment
              <Tooltip text="Sell your VTR back to VETRA at 3% below weekly avg price. Register your intent and we execute when treasury has funds.">
                <span className="ml-1 text-white/30 cursor-help">ⓘ</span>
              </Tooltip>
            </CardTitle>
            <Badge variant="secondary" className="w-fit">TWAP - 3%</Badge>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-white/90">Register your sell intent. When treasury has funds, we execute buyback in order of arrival at TWAP - 3%.</p>
            <p className="text-lg font-bold text-purple-400">${buybackPrice > 0 ? buybackPrice.toFixed(4) : '—'}</p>
            <p className="text-xs text-white/60 mt-2">Estimated daily cap: $500 USDC</p>
            <Separator className="bg-white/10 my-4" />
            {isConnected ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input type="number" placeholder="VTR Amount" value={buyback.amount} onChange={(e) => setBuyback({...buyback, amount: e.target.value})} className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/50" />
                  <button onClick={registrarIntencao} disabled={buyback.loading || !buyback.amount || parseFloat(buyback.amount) <= 0} className="inline-flex items-center justify-center rounded-md bg-[#643390] px-4 py-2 text-sm font-medium text-white hover:bg-[#9A3CEB] disabled:opacity-50">
                    {buyback.loading ? '...' : 'Register'}
                  </button>
                </div>
                {buyback.message && <p className={`text-xs ${buyback.message.includes('success') ? 'text-green-400' : 'text-red-400'}`}>{buyback.message}</p>}
                <div className="text-xs text-white/50 space-y-1">
                  <p>Intents in queue: {buyback.position > 0 ? buyback.position : buyback.intents.filter((i: any) => i.status === 'pending').length}</p>
                  <p>Total VTR in queue: {buyback.totalVtr.toLocaleString()}</p>
                  {buyback.position > 0 && <p>Your position: #{buyback.position}</p>}
                </div>
              </div>
            ) : (
              <p className="text-xs text-white/60">Connect wallet to register intent.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3 Cards de Conteúdo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Card NFT */}
        <Card className="bg-white/[0.03] border border-white/[0.06]">
          <CardHeader><CardTitle className="text-sm">NFT Pioneer Sales</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-white/60">Sold</p>
                  <p className="text-2xl font-bold text-white">{nftSold.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-white/60">{isConnected ? 'Your NFTs' : 'Available'}</p>
                  <p className="text-2xl font-bold text-white">{isConnected ? nftBalance.toLocaleString() : 'Unlimited'}</p>
                </div>
              </div>
              <Separator className="bg-white/10" />
              <p className="text-xs text-white/50 leading-relaxed">
                Each Pioneer NFT grants 1 VTR at redemption ($0.40 target). Share the project and help grow the community.
              </p>
              <a href="https://www.vetravtr.com" target="_blank" className="text-xs text-[#b388ff] hover:text-[#9A3CEB]">Learn more →</a>
            </div>
          </CardContent>
        </Card>

        {/* Card Info */}
        <Card className="bg-white/[0.03] border border-white/[0.06]">
          <CardHeader><CardTitle className="text-sm">Latest Updates</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-xs text-white/60 space-y-1">
                <p className="text-white/90 font-semibold">🔷 KuCoin Broker Pro Active</p>
                <p>Referral program live — earn rebates.</p>
              </div>
              <div className="text-xs text-white/60 space-y-1">
                <p className="text-white/90 font-semibold">🔷 Reserves: $100M USD</p>
                <p>333% collateralized via FT Asset Management.</p>
              </div>
              <div className="text-xs text-white/60 space-y-1">
                <p className="text-white/90 font-semibold">🔷 Pool Uni V3 Active</p>
                <p>$24K TVL — range $0.28-$0.39.</p>
              </div>
              <a href="https://www.vetravtr.com" target="_blank" className="text-xs text-[#b388ff] hover:text-[#9A3CEB]">View roadmap →</a>
            </div>
          </CardContent>
        </Card>

        {/* Card Blog */}
        <Card className="bg-white/[0.03] border border-white/[0.06]">
          <CardHeader><CardTitle className="text-sm">From the Blog</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {blogPosts.length > 0 ? blogPosts.map((post, i) => (
                <div key={i} className="text-xs text-white/60">
                  <p className="text-white/80 font-medium truncate">{post.title}</p>
                  <p className="text-white/40">{new Date(post.created_at).toLocaleDateString()}</p>
                </div>
              )) : (
                <div className="text-xs text-white/40 space-y-2">
                  <p>Loading latest posts...</p>
                </div>
              )}
              <a href="https://www.vetravtr.com/blog" target="_blank" className="text-xs text-[#b388ff] hover:text-[#9A3CEB]">View all posts →</a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button onClick={() => window.open('https://www.geckoterminal.com/polygon_pos/pools/0x5484C717168175cFFDd77678ecAC3A38e76c4e2B', '_blank')}
          className="inline-flex items-center justify-center rounded-lg bg-[#643390] hover:bg-[#9A3CEB] h-10 px-4 text-sm font-medium text-white transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-[#643390]/20">
          GeckoTerminal VTR
        </button>
        <button onClick={() => window.open(`https://polygonscan.com/address/${VTR_ADDRESS}`, '_blank')}
          className="inline-flex items-center justify-center rounded-lg bg-[#643390] hover:bg-[#9A3CEB] h-10 px-4 text-sm font-medium text-white transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-[#643390]/20">
          Contract (PolygonScan)
        </button>
      </div>

      {/* Treasury + Rounds */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="bg-white/[0.03] border border-white/[0.06]">
          <CardHeader><CardTitle className="text-sm">Treasury</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-white/80">Total Supply</span><Badge className="bg-white/10 text-white border border-white/20">30M VTR</Badge></div>
            <div className="flex justify-between"><span className="text-white/80">Treasury (ADM)</span><span className="text-white/90">~29.42M VTR</span></div>
            <Separator className="bg-white/10" />
            <div className="flex justify-between"><span className="text-white/80">USDC Wallet</span><code className="text-xs">{TREASURY.slice(0, 10)}...</code></div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.03] border border-white/[0.06]">
          <CardHeader><CardTitle className="text-sm">Latest Rounds</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-white/80">Round 1</span><Badge className="bg-[#643390] text-white border-0">200K USDT @ $0.32</Badge></div>
            <div className="flex justify-between"><span className="text-white/80">Status</span><Badge className="bg-[#643390] text-white">Active</Badge></div>
            <Separator className="bg-white/10" />
            <div className="flex justify-between"><span className="text-white/80">Total VTR Committed</span><span className="text-white/90">~2.8M / 30M</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center space-y-4">
        <div className="flex justify-center items-center gap-8 flex-wrap">
          <a href="https://www.vetravtr.com" target="_blank" className="opacity-40 hover:opacity-80 transition-opacity">
            <img src="/images/partners/vetra.svg" alt="VETRA" className="h-6" />
          </a>
          <a href="https://www.kucoin.com/r/broker/CXEMTGL5" target="_blank" className="opacity-40 hover:opacity-80 transition-opacity">
            <img src="/images/partners/kucoin.svg" alt="KuCoin" className="h-5" />
          </a>
          <a href="https://www.geckoterminal.com/polygon_pos/pools/0x5484C717168175cFFDd77678ecAC3A38e76c4e2B" target="_blank" className="opacity-40 hover:opacity-80 transition-opacity">
            <img src="/images/partners/geckoterminal.png" alt="GeckoTerminal" className="h-6" />
          </a>
          <a href={`https://polygonscan.com/address/${VTR_ADDRESS}`} target="_blank" className="opacity-40 hover:opacity-80 transition-opacity">
            <img src="/images/partners/polygonscan.svg" alt="PolygonScan" className="h-5" />
          </a>
        </div>
        <p className="text-xs text-white/30">2026 Vetra, LLC. All rights reserved.</p>
      </footer>
    </div>
  );
}
