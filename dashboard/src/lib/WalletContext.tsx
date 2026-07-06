'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { BrowserProvider } from 'ethers';

const PROJECT_ID = 'd4ee97a93dc538bc7c23303cdd30814c';

interface WalletContextType {
  account: string | null;
  provider: BrowserProvider | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  error: string | null;
}

const WalletContext = createContext<WalletContextType>({
  account: null, provider: null, connecting: false,
  connect: async () => {}, disconnect: async () => {}, error: null,
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wcProvider, setWcProvider] = useState<any>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      // Limpar sessão anterior para forçar QR Code
      if (typeof window !== 'undefined') {
        localStorage.removeItem('walletconnect');
      }

      const p = await EthereumProvider.init({
        projectId: PROJECT_ID,
        chains: [137],
        showQrModal: true,
        qrModalOptions: { themeMode: 'dark' },
        metadata: {
          name: 'VETRA Dashboard',
          description: 'Transparency & Portfolio Management',
          url: 'https://vetra-dashboard-delta.vercel.app',
          icons: ['https://vetravtr.com/favicon.svg'],
        },
        rpcMap: {
          137: 'https://polygon-bor.publicnode.com',
        },
      });

      p.on('disconnect', () => { setAccount(null); setProvider(null); });
      p.on('accountsChanged', (a: string[]) => setAccount(a?.[0] || null));

      await p.connect();
      const addr = p.accounts?.[0];
      if (addr) {
        setWcProvider(p);
        setAccount(addr);
        setProvider(new BrowserProvider(p));
      }
    } catch (e: any) {
      if (e?.code !== 4001) { // user rejected
        setError(e?.message || 'Connection failed');
      }
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (wcProvider) {
      try { await wcProvider.disconnect(); } catch {}
    }
    setWcProvider(null);
    setAccount(null);
    setProvider(null);
  }, [wcProvider]);

  return (
    <WalletContext.Provider value={{ account, provider, connecting, connect, disconnect, error }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
