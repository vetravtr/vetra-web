'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';

// Lazy import do WalletConnect — carregado apenas no cliente
let EthereumProviderPromise: Promise<any> | null = null;
function getEthereumProvider() {
  if (!EthereumProviderPromise) {
    EthereumProviderPromise = import('@walletconnect/ethereum-provider').then(m => m.EthereumProvider);
  }
  return EthereumProviderPromise;
}

const PROJECT_ID = 'd4ee97a93dc538bc7c23303cdd30814c';

interface WalletContextType {
  account: string | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  error: string | null;
}

const WalletContext = createContext<WalletContextType>({
  account: null, connecting: false,
  connect: async () => {}, disconnect: async () => {}, error: null,
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const providerRef = useRef<any>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ensureProvider = useCallback(async () => {
    if (providerRef.current) return providerRef.current;
    const EthProv = await getEthereumProvider();
    const p = await EthProv.init({
      projectId: PROJECT_ID,
      chains: [137],
      showQrModal: true,
      qrModalOptions: { themeMode: 'dark' },
      metadata: {
        name: 'VETRA Dashboard',
        description: 'Transparency & Portfolio Management',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://vetravtr.com',
        icons: [typeof window !== 'undefined' ? window.location.origin + '/favicon.svg' : 'https://vetravtr.com/favicon.svg'],
      },
    });
    p.on('disconnect', () => setAccount(null));
    p.on('accountsChanged', (a: string[]) => setAccount(a?.[0] || null));
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
      if (addr) setAccount(addr);
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

  // Auto-reconnect
  useEffect(() => {
    const check = async () => {
      try {
        const p = await ensureProvider();
        if (p.accounts?.length > 0) setAccount(p.accounts[0]);
      } catch {}
    };
    check();
  }, [ensureProvider]);

  return (
    <WalletContext.Provider value={{ account, connecting, connect, disconnect, error }}>
      <div id="walletconnect-container" />
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
