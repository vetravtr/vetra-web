'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

const PROJECT_ID = 'd4ee97a93dc538bc7c23303cdd30814c';

export function WalletButton({ onConnect }: { onConnect?: (account: string | null) => void }) {
  const providerRef = useRef<any>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ensureProvider = useCallback(async () => {
    if (providerRef.current) return providerRef.current;
    const { EthereumProvider } = await import('@walletconnect/ethereum-provider');
    const p = await EthereumProvider.init({
      projectId: PROJECT_ID,
      chains: [137],
      showQrModal: true,
      qrModalOptions: { themeMode: 'dark' },
      metadata: {
        name: 'VETRA Dashboard',
        description: 'Transparency & Portfolio Management',
        url: window.location.origin,
        icons: [window.location.origin + '/favicon.svg'],
      },
    });
    p.on('disconnect', () => { setAccount(null); if (onConnect) onConnect(null); });
    p.on('accountsChanged', (a: string[]) => { setAccount(a?.[0] || null); if (onConnect) onConnect(a?.[0] || null); });
    providerRef.current = p;
    return p;
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      if (account) return;
      const p = await ensureProvider();
      await p.connect();
      const addr = p.accounts?.[0];
      if (addr) { setAccount(addr); if (onConnect) onConnect(addr); }
    } catch (e: any) {
      if (e?.code !== 4001) {
        setError(e?.message || 'Connection failed');
      }
    } finally {
      setConnecting(false);
    }
  }, [account, ensureProvider]);

  const disconnect = useCallback(async () => {
    if (providerRef.current) {
      try { await providerRef.current.disconnect(); } catch {}
    }
    providerRef.current = null;
    setAccount(null);
  }, []);

  useEffect(() => {
    const check = async () => {
      try {
        const p = await ensureProvider();
        if (p.accounts?.length > 0) { setAccount(p.accounts[0]); if (onConnect) onConnect(p.accounts[0]); }
      } catch {}
    };
    check();
  }, [ensureProvider]);

  if (connecting) {
    return (
      <button disabled className="inline-flex items-center justify-center rounded-md bg-[#643390] px-4 py-2 text-sm font-medium text-white opacity-60 transition-colors">
        Connecting...
      </button>
    );
  }

  if (account) {
    return (
      <button onClick={disconnect}
        className="inline-flex items-center justify-center rounded-md bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.1] px-3 py-2 text-sm text-white transition-colors">
        <span className="font-mono text-xs">{account.slice(0, 6)}...{account.slice(-4)}</span>
        <span className="text-white/30 mx-1">|</span>
        <span className="text-xs text-white/50">Polygon</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button onClick={connect}
        className="inline-flex items-center justify-center rounded-md bg-[#643390] hover:bg-[#9A3CEB] px-4 py-2 text-sm font-medium text-white transition-all duration-200">
        Connect Wallet
      </button>
      {error && <span className="text-xs text-red-400 max-w-48 text-right">{error}</span>}
    </div>
  );
}
