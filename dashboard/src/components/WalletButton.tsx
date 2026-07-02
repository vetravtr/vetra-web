'use client';

import { useWallet } from '@/lib/WalletContext';

export function WalletButton() {
  const { account, connecting, connect, disconnect, error } = useWallet();

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
