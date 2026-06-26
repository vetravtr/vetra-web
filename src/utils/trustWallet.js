// TrustWallet connector - alternativa para usuarios que tem problemas com WalletConnect padrao
// Usa deep linking trust:// ou walletConnect forcado para Trust

const TRUST_DEEP_LINK = 'trust://open?url=';

export function getTrustWalletLink(url) {
  return TRUST_DEEP_LINK + encodeURIComponent(url);
}

export function isTrustWallet(userAgent) {
  return userAgent && (userAgent.includes('TrustWallet') || userAgent.includes('Trust'));
}

// Metodo alternativo: abrir o site no navegador interno da Trust
export function openInTrustWallet(currentUrl) {
  const deepLink = TRUST_DEEP_LINK + encodeURIComponent(currentUrl);
  window.location.href = deepLink;
  // Fallback: se nao abrir, mostrar instrucoes
  setTimeout(() => {
    if (document.hidden) return; // Se abriu, ok
    alert('To connect with Trust Wallet:\n\n1. Open Trust Wallet app\n2. Tap "Browser"\n3. Go to ' + currentUrl + '\n4. Connect and buy');
  }, 3000);
}
