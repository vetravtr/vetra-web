import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider, ConnectButton, darkTheme } from '@rainbow-me/rainbowkit';
import { polygon } from 'wagmi/chains';
import { WagmiProvider, useAccount, useWalletClient } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';

const config = getDefaultConfig({
  appName: 'VETRA',
  projectId: 'd4ee97a93dc538bc7c23303cdd30814c',
  chains: [polygon],
  ssr: false,
});

const queryClient = new QueryClient();

function WalletObserver() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    if (isConnected && address && walletClient) {
      // Store globally for the page to use
      window.__vetra_address = address;
      window.__vetra_connected = true;
      // Emit event so the page knows wallet is ready
      window.dispatchEvent(new CustomEvent('wallet-connected', { 
        detail: { address, provider: walletClient } 
      }));
    } else {
      window.__vetra_address = null;
      window.__vetra_connected = false;
    }
  }, [address, isConnected, walletClient]);

  return <ConnectButton />;
}

export default function WalletConnect() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider locale="en" theme={darkTheme()} coolMode>
          <WalletObserver />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
