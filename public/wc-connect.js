(function(){
  var btn=document.getElementById('wc-connect-btn');
  var buyBtn=document.getElementById('pioneer-buy-btn');
  if(!btn)return;
  var provider=null,connected=false,account=null;

  // Clear WC cache
  Object.keys(localStorage).forEach(function(k){if(k.startsWith('wc@2'))localStorage.removeItem(k)});

  var ov=document.getElementById('wc-qr-overlay');
  var qrCanvas=document.getElementById('wc-qr-canvas');
  document.getElementById('wc-qr-close').onclick=closeQr;
  ov.onclick=function(e){if(e.target===ov)closeQr()};
  document.getElementById('wc-qr-copy').onclick=function(){
    if(currentUri)navigator.clipboard.writeText(currentUri);
    this.textContent='\u2713 Copied';setTimeout(function(){document.getElementById('wc-qr-copy').textContent='\uD83D\uDCCB Copy link'},2000);
  };
  var currentUri=null;
  function openQr(uri){currentUri=uri;qrCanvas.innerHTML='';ov.classList.remove('hidden');QRCode.toCanvas(uri,{width:260,margin:1},function(e,c){if(!e)qrCanvas.appendChild(c)})}
  function closeQr(){ov.classList.add('hidden')}

  function onConnect(addr){
    account=addr;connected=true;
    btn.textContent=addr.slice(0,6)+'...'+addr.slice(-4);
    buyBtn.disabled=false;
  }
  function onDisconnect(){account=null;connected=false;provider=null;btn.textContent='Connect Wallet';buyBtn.disabled=true}

  // Load CDN deps
  var loaded=0;
  function check(){if(++loaded===2)initProvider()}
  var a=document.createElement('script');a.src='https://cdn.jsdelivr.net/npm/@walletconnect/ethereum-provider@2/dist/index.umd.min.js';a.onload=check;document.head.appendChild(a);
  var b=document.createElement('script');b.src='https://cdn.jsdelivr.net/npm/qrcode@1/build/qrcode.min.js';b.onload=check;document.head.appendChild(b);

  function initProvider(){
    var P=window['@walletconnect/ethereum-provider'];
    if(!P||!P.default){btn.textContent='Error';return}
    P.default.init({projectId:'d4ee97a93dc538bc7c23303cdd30814c',chains:[137],showQrModal:false,metadata:{name:'Vetra',description:'NFT',url:window.location.origin,icons:[]}}).then(function(p){
      provider=p;
      p.on('display_uri',function(uri){openQr(uri)});
      if(p.accounts&&p.accounts.length)onConnect(p.accounts[0]);
      p.on('connect',function(){closeQr();if(p.accounts&&p.accounts.length)onConnect(p.accounts[0])});
      p.on('disconnect',onDisconnect);
      p.on('accountsChanged',function(a){a.length?onConnect(a[0]):onDisconnect()});
      btn.textContent='Connect Wallet';
    }).catch(function(e){console.error(e);btn.textContent='Init error'});
  }

  btn.onclick=function(){
    if(!provider){btn.textContent='Wait...';return}
    if(connected){provider.disconnect().catch(function(){});return}
    btn.textContent='Connecting...';btn.disabled=true;
    Object.keys(localStorage).forEach(function(k){if(k.startsWith('wc@2'))localStorage.removeItem(k)});
    provider.connect().then(function(){
      btn.disabled=false;
    }).catch(function(e){closeQr();btn.textContent='Connect Wallet';btn.disabled=false});
  };
})();
