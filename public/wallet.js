import { createAppKit, Viem } from 'https://cdn.jsdelivr.net/npm/@reown/appkit-cdn@1/dist/appkit.js';

const btn = document.getElementById('wc-connect-btn');
const buyBtn = document.getElementById('pioneer-buy-btn');
if (!btn) throw new Error('Button not found');

const appKit = createAppKit({
  projectId: 'd4ee97a93dc538bc7c23303cdd30814c',
  adapters: [new Viem.ViemAdapter({
    chains: [Viem.polygon],
    transports: { [Viem.polygon.id]: Viem.http() },
  })],
  networks: [Viem.polygon],
  metadata: { name: 'Vetra VTR', description: 'VTR Pioneer NFT', url: 'https://vetravtr.com', icons: [] },
  features: { email: false, socials: false, analytics: false },
});

btn.disabled = false;
btn.onclick = () => appKit.open();

appKit.subscribeState((state) => {
  if (state.open) return;
  if (state.selectedNetworkId && state.connectedAddress) {
    btn.textContent = state.connectedAddress.slice(0,6) + '...' + state.connectedAddress.slice(-4);
    if (buyBtn) buyBtn.disabled = false;
  }
});
