import '@reown/appkit/wagmi/styles.css';
import { createAppKit } from '@reown/appkit/wagmi';
import { WagmiProvider } from 'wagmi';
import { polygon } from '@reown/appkit/networks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

export default function WalletConnect() {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <appkit-button />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
