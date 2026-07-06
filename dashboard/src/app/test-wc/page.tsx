'use client';

export default function WalletTest() {
  const connectWallet = async () => {
    const { EthereumProvider } = await import('@walletconnect/ethereum-provider');
    const p = await EthereumProvider.init({
      projectId: 'd4ee97a93dc538bc7c23303cdd30814c',
      chains: [137],
      showQrModal: true,
      qrModalOptions: { themeMode: 'dark' },
      metadata: {
        name: 'VETRA Dashboard',
        description: 'Test',
        url: window.location.origin,
        icons: [window.location.origin + '/favicon.svg'],
      },
    });
    await p.connect();
    alert('Connected: ' + p.accounts?.[0]);
  };

  return (
    <div className="min-h-screen bg-[rgb(5,1,9)] flex items-center justify-center">
      <button onClick={connectWallet}
        className="bg-[#643390] hover:bg-[#9A3CEB] text-white px-6 py-3 rounded-lg text-lg">
        Test WalletConnect
      </button>
    </div>
  );
}
