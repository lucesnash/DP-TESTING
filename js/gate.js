'use strict';
/* gate.js: QR gate shown in the live chat panel BEFORE a conversation starts.
   Signer  : shows a QR code (session code) for the partner to scan.
   Partner : scans the QR code with the camera (or types the session code) to join.
   When the partner joins, unlockChat() opens the real chat on that device.
   Real backend: when your server tells the signer's phone "partner joined", call unlockChat() there.
   Needs (loaded in dashboard.html): qrcodejs (draws the QR) and, as a fallback for browsers without BarcodeDetector, jsQR (reads the QR). */

const SESSION_CODE='SECB-4829';
const chatUnlocked=()=>!!Session.get().chat;

/* ---------- unlock / lock ---------- */
function unlockChat(){
  Session.set({chat:1});
  if(state.mode==='partner')state.joined=true;
  Scan.stop();renderTiles();renderLive();
}
function endConversation(){
  state.convo=[];Session.set({chat:0});
  if(state.mode==='partner')state.joined=false;
  renderTiles();renderLive();toast('Conversation ended. Scan a QR code to start again.');
}

/* ---------- QR code drawing ---------- */
function drawQR(el,text){
  el.innerHTML='';
  if(window.QRCode){
    try{new QRCode(el,{text,width:200,height:200,colorDark:'#000000',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});return true}catch(e){}
  }
  el.innerHTML='<p style="color:#444;font-size:14px;max-width:200px">The QR code could not load (no internet). Read the session code below to your partner instead.</p>';
  return false;
}

/* ---------- QR scanning (camera) ---------- */
const Scan={
  stream:null,timer:null,
  async start(video,onCode){
    this.stop();
    if(!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia))return {ok:false,err:{name:'NotSupportedError'}};
    try{this.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false})}
    catch(e){this.stream=null;return {ok:false,err:e}}
    video.srcObject=this.stream;try{await video.play()}catch(e){}
    const det=('BarcodeDetector' in window)?new BarcodeDetector({formats:['qr_code']}):null;
    if(!det&&!window.jsQR){this.stop();return {ok:false,err:{name:'NoReaderError'}}}
    const cv=document.createElement('canvas'),cx=cv.getContext('2d',{willReadFrequently:true});
    this.timer=setInterval(async()=>{
      if(video.readyState<2||!video.videoWidth)return;
      try{
        let val=null;
        if(det){const r=await det.detect(video);if(r.length)val=r[0].rawValue}
        else{cv.width=video.videoWidth;cv.height=video.videoHeight;cx.drawImage(video,0,0);const d=cx.getImageData(0,0,cv.width,cv.height);const q=jsQR(d.data,d.width,d.height);if(q)val=q.data}
        if(val)onCode(val);
      }catch(e){}
    },250);
    return {ok:true};
  },
  stop(){
    clearInterval(this.timer);this.timer=null;
    try{this.stream&&this.stream.getTracks().forEach(t=>t.stop())}catch(e){}
    this.stream=null;
  },
  explain(e){
    const n=e&&e.name;
    if(n==='NotAllowedError'||n==='SecurityError')return "Camera access is blocked. Allow it from the lock icon in your browser's address bar, or type the session code below.";
    if(n==='NotFoundError'||n==='OverconstrainedError')return 'No camera was found on this device. Type the session code below.';
    if(n==='NotReadableError')return 'Another app is using the camera. Close it and try again, or type the session code below.';
    if(n==='NoReaderError')return 'This browser cannot read QR codes. Type the session code below.';
    return 'The camera cannot be used here. It needs a secure (https) page. Type the session code below.';
  }
};

/* accept "SECB-4829", "secb4829", "4829" or a link that contains the code */
function codeMatches(v){
  const m=String(v||'').toUpperCase().replace(/\s/g,'').match(/SECB-?(\d{4})|^(\d{4})$/);
  const d=m&&(m[1]||m[2]);
  return !!d&&('SECB-'+d)===SESSION_CODE;
}

/* ---------- the gate screen (replaces the chat until unlocked) ---------- */
function renderGate(){
  const host=$('#live'),s=state.mode==='signer';
  const head=`<div class="chat-head"><button class="icon-btn chat-back" id="chat-back" aria-label="Back to dashboard">${icon('back')}</button><span class="avatar ${s?'':'v'}">${icon(s?'mic':'hand')}</span><div class="ch-t"><h2>${s?'Start a conversation':'Join a conversation'}</h2><small>${s?'Your partner scans the QR code to begin':'Scan the signer’s QR code to begin'}</small></div></div>`;
  const signer=`<div class="gate-card">
      <p class="kicker">Step 1 of 2</p>
      <h3>Show this QR code to your partner</h3>
      <p class="muted">Ask your partner to open the app, choose <b>Hearing Conversation Partner</b> mode, and scan this code. The chat opens on both phones as soon as they join.</p>
      <div class="qr" id="qr" role="img" aria-label="QR code for session ${SESSION_CODE}"></div>
      <div class="gate-code"><span class="lab">Session code</span><b>${SESSION_CODE}</b></div>
      <div class="status warn" id="g-st" role="status"><span class="dot"></span>Waiting for your partner to scan…</div>
      ${state.paired?'':`<p class="note">${icon('info','sm')}<span>Your gloves are not paired yet. You can start now and type messages, or pair them first from the dashboard.</span></p>`}
      <div class="cta-row stack"><button class="btn" id="g-copy" type="button">Copy code</button><button class="btn" id="g-sim" type="button">Simulate partner scan (demo)</button></div>
    </div>`;
  const partner=`<div class="gate-card">
      <p class="kicker">Step 1 of 2</p>
      <h3>Scan the signer’s QR code</h3>
      <p class="muted">Ask the signer to open their chat screen, then point your camera at the QR code. Your camera is only used to read the code. Nothing is recorded.</p>
      <div class="scan" id="scan-box" hidden><video id="scan-v" playsinline muted></video><div class="scan-frame" aria-hidden="true"></div></div>
      <p class="muted" id="scan-msg" role="status"></p>
      <button class="btn primary block" id="scan-go" type="button">Open camera and scan</button>
      <div class="field"><label for="g-code">Or type the session code</label>
        <div class="row" style="flex-wrap:nowrap"><input class="input" id="g-code" placeholder="${SESSION_CODE}" autocomplete="off" autocapitalize="characters"><button class="btn" id="g-join" type="button">Join</button></div>
        <p class="err" id="g-err" role="alert"></p></div>
      <button class="link sm" id="g-demo" type="button">Use the demo code</button>
    </div>`;
  host.innerHTML=head+`<div class="gate" id="gate">${s?signer:partner}</div>`;
  $('#chat-back').onclick=closeChat;
  $('#convo-entry').onclick=openChat;
  renderEntry();

  if(s){
    drawQR($('#qr'),SESSION_CODE);
    $('#g-sim').onclick=()=>{toast('Partner joined');unlockChat()};
    $('#g-copy').onclick=()=>{try{navigator.clipboard.writeText(SESSION_CODE).then(()=>toast('Code copied'),()=>toast('Copy was blocked. Read the code aloud instead.'))}catch(e){toast('Copy was blocked. Read the code aloud instead.')}};
  }else{
    const join=v=>{
      if(codeMatches(v)){toast('Joined the signer’s session');unlockChat();return true}
      return false;
    };
    $('#g-join').onclick=()=>{if(!join($('#g-code').value))$('#g-err').textContent='That code did not match. Ask the signer for the code shown under their QR code.'};
    $('#g-code').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('#g-join').click()}};
    $('#g-demo').onclick=()=>join(SESSION_CODE);
    $('#scan-go').onclick=async()=>{
      const box=$('#scan-box'),msg=$('#scan-msg'),btn=$('#scan-go');
      btn.disabled=true;msg.className='muted';msg.textContent='Asking for your camera…';
      const r=await Scan.start($('#scan-v'),val=>{
        if(join(val))return;
        msg.className='err';msg.textContent='That QR code is not a Communication Band session. Try the signer’s code again.';
      });
      btn.disabled=false;
      if(!r.ok){box.hidden=true;msg.className='err';msg.textContent=Scan.explain(r.err);btn.textContent='Try the camera again';return}
      box.hidden=false;msg.className='muted';msg.textContent='Point the camera at the QR code.';btn.textContent='Restart camera';
    };
  }
}