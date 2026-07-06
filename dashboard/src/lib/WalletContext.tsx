'use client';

import dynamic from 'next/dynamic';

const WalletProviderInner = dynamic(
  () => import('./WalletProviderInner').then(m => m.WalletProviderInner),
  { ssr: false }
);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return <WalletProviderInner>{children}</WalletProviderInner>;
}

export { useWallet } from './WalletProviderInner';
