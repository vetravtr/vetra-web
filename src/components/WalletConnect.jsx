import '@reown/appkit/wagmi/styles.css';
import { createAppKit } from '@reown/appkit/wagmi';
import { WagmiProvider, useAccount } from 'wagmi';
import { polygon } from '@reown/appkit/networks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';

const queryClient = new QueryClient();

const projectId = 'd4ee97a93dc538bc7c23303cdd30814c';

const wagmiAdapter = createAppKit({
  adapters: [],
  networks: [polygon],
  projectId,
  metadata: {
    name: 'VETRA',
    description: 'VETRA Pioneer NFT',
    url: 'https://www.vetravtr.com',
    icons: ['https://www.vetravtr.com/favicon.svg'],
  },
});

function ConnectWalletInner() {
  const { address, isConnected } = useAccount();

  function handleClick() {
    if (isConnected) {
      wagmiAdapter.disconnect();
    } else {
      wagmiAdapter.open();
    }
  }

  useEffect(() => {
    if (isConnected && address) {
      window.__vetra_address = address;
      window.dispatchEvent(new CustomEvent('wallet-connected', { detail: { address } }));
    }
  }, [address, isConnected]);

  return (
    <button
      onClick={handleClick}
      className="w-full py-3 px-6 rounded-full text-white font-semibold text-sm transition"
      style={{ background: isConnected ? '#3FB950' : '#3396FF' }}
    >
      {isConnected
        ? `✅ ${address?.slice(0,6)}...${address?.slice(-4)}`
        : 'Connect Wallet'}
    </button>
  );
}

export default function WalletConnect() {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectWalletInner />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
