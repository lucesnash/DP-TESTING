'use strict';
/* tool-pairing.js: [Pairing & Onboarding]. Signer: BLE pairing of Left Spoke + Right Hub glove. Partner: join session + mic check. */
/* ===== Pairing (signer) ===== */
function pairSigner(){openModal('Pairing & onboarding','Pair your gloves',(root,api)=>{
  const names=['Power on','Find the hub','Link the spoke','Buzz test'];let st=state.paired?4:0,sel=false,felt={L:false,R:false};
  const gc=(t,sub,on)=>`<div class="glove-card ${on?'on':''}"><span class="gi">${icon('hand')}</span><div><b>${t}</b><br><small class="muted">${sub}</small></div><span class="pill ${on?'ok':'warn'}"><i></i>${on?'Linked':'Waiting'}</span></div>`;
  function draw(){
    if(st===4){root.innerHTML=`<div class="status ok">${icon('check','sm')} Both gloves are paired and working</div>
      <div class="list">${gc('Left Spoke Glove','ESP-NOW link to the hub · <span data-bat="L"></span> · 5 flex + IMU',true)}<div class="link-line"><i></i>ESP-NOW · encrypted<i></i></div>${gc('Right Hub Glove','Bluetooth LE to this phone · <span data-bat="R"></span> · model v'+state.modelVer+' (INT8)',true)}</div>
      <div class="note">${icon('users','sm')}<span>Your partner joins by scanning the QR code on your chat screen, or by typing this code: <b style="font-size:18px;color:var(--ink);letter-spacing:.1em">SECB-4829</b></span></div>
      <div class="cta-row"><button class="btn" id="bz-l">${icon('vib','sm')}Buzz left</button><button class="btn" id="bz-r">${icon('vib','sm')}Buzz right</button></div>
      <div class="cta-row"><button class="btn" id="unpair">Unpair and set up again</button><button class="btn primary" id="to-cal">Next: Calibration</button></div>`;
      $('#bz-l').onclick=()=>toast('Left glove buzzed');$('#bz-r').onclick=()=>toast('Right glove buzzed');$('#unpair').onclick=()=>{state.paired=false;st=0;sel=false;draw();renderTiles();renderLive()};
      $('#to-cal').onclick=()=>{closeModal();calSigner()};fillBat();return}
    let body='';
    if(st===0)body=`<h3>Switch on both gloves</h3><p class="muted">Press the power button on each cuff. The light blinks blue when the glove is ready. The band uses a left spoke glove and a right hub glove, so wear both.</p><div class="list">${gc('Left Spoke Glove','Sends finger and motion data to the hub',false)}${gc('Right Hub Glove','Runs the gesture model and talks to your phone',false)}</div><button class="btn primary block" id="n0">Both lights are blinking</button>`;
    if(st===1)body=`<h3>Find the Right Hub Glove</h3><p class="muted">Only the hub connects to your phone over Bluetooth. Turn on Bluetooth, then scan.</p><div class="list" id="scan"></div><button class="btn primary block" id="scan-b">${icon('ble','sm')}Scan for gloves</button>`;
    if(st===2)body=`<h3>Linking the Left Spoke Glove</h3><p class="muted">The spoke glove joins the hub by itself over ESP-NOW. Keep both gloves within arm's reach.</p><div class="list">${gc('Right Hub Glove','Bluetooth LE connected',true)}<div class="link-line"><i></i><span id="lk-l">Searching</span><i></i></div>${gc('Left Spoke Glove','<span id="lk-s">Looking for the hub…</span>',false)}</div><div class="meter"><i id="lk-m" style="width:0"></i></div>`;
    if(st===3)body=`<h3>Check the haptic buzz</h3><p class="muted">Each glove has a vibration motor on the palm. Tap a button and confirm you felt it.</p><div class="list">${['L','R'].map(h=>`<div class="item"><div class="t"><b>${h==='L'?'Left Spoke Glove':'Right Hub Glove'}</b><small>${felt[h]?'Confirmed':'Tap to buzz'}</small></div><div class="row"><button class="btn sm" data-bz="${h}">${icon('vib','sm')}Buzz</button><button class="btn sm ${felt[h]?'primary':''}" data-ok="${h}" ${felt[h]?'':'disabled'}>${felt[h]?'Felt it ✓':'I felt it'}</button></div></div>`).join('')}</div><button class="btn primary block" id="fin" ${felt.L&&felt.R?'':'disabled'}>Finish pairing</button>`;
    root.innerHTML=stepsHTML(4,st,names)+body;
    if(st===0)$('#n0').onclick=()=>{st=1;draw()};
    if(st===1){const lst=$('#scan');$('#scan-b').onclick=()=>{lst.innerHTML='<p class="muted">Scanning…</p>';$('#scan-b').disabled=true;api.later(()=>{
      lst.innerHTML=`<button class="item" id="hub"><div class="t"><b>SECB-Hub-R · Right Hub Glove</b><small>Strong signal · −48 dBm</small></div>${icon('ble')}</button><div class="item dim"><div class="t"><b>Wireless headphones</b><small>Not a band device</small></div></div><div class="item dim"><div class="t"><b>Unknown device</b><small>Not a band device</small></div></div>`;$('#scan-b').disabled=false;$('#scan-b').textContent='Scan again';
      $('#hub').onclick=()=>{lst.innerHTML='<div class="status warn">Connecting to SECB-Hub-R…</div>';api.later(()=>{st=2;draw()},1200)}},1400)}}
    if(st===2){let p=0;const msgs=['Searching','Handshake','Encrypting'];api.every(()=>{p+=8;const m=$('#lk-m');if(!m)return;m.style.width=Math.min(100,p)+'%';$('#lk-l').textContent=msgs[Math.min(2,Math.floor(p/36))];if(p>=100){clearInterval(api._);}},150);
      api.later(()=>{if($('#lk-s')){$('#lk-s').textContent='Linked · packet loss 0.4%';st=3;api.later(draw,900)}},1900)}
    if(st===3){$$('[data-bz]').forEach(b=>b.onclick=()=>{const h=b.dataset.bz;toast((h==='L'?'Left':'Right')+' glove buzzed');const ok=$(`[data-ok="${h}"]`);ok.disabled=false});
      $$('[data-ok]').forEach(b=>b.onclick=()=>{felt[b.dataset.ok]=true;draw()});$('#fin').onclick=()=>{state.paired=true;st=4;draw();renderTiles();renderLive();toast('Gloves paired')}}
  }draw()})}

/* ===== Pairing (partner) ===== */
function pairPartner(){openModal('Pairing & onboarding','Join the signer’s session',(root,api)=>{
  let msg=null,busy=false;
  function draw(){const ready=state.joined&&state.mic;
    root.innerHTML=`<div class="note">${icon('lock','sm')}<span>You do not need the gloves. Your phone joins the signer's conversation and uses its own microphone.</span></div>
    <div class="card"><b>1. Session code</b><div class="row" style="flex-wrap:nowrap"><input class="input" id="code" inputmode="numeric" placeholder="SECB-4829" value="${state.joined?'SECB-4829':''}" ${state.joined?'disabled':''} aria-label="Session code"><button class="btn primary" id="join" ${state.joined?'disabled':''}>${state.joined?'Joined':'Join'}</button></div><p class="err" id="cerr" role="alert"></p>${state.joined?'':'<button class="link sm" id="use" style="justify-self:start">Use the demo code</button>'}</div>
    <div class="card"><b>2. Microphone check</b><p class="muted" style="font-size:14px">Allow the microphone, then say a few words. Audio is only used to measure your voice. It is not recorded and is discarded right away.</p>
      <div class="wave" id="mw" aria-hidden="true">${'<i></i>'.repeat(28)}</div><div class="meter"><i id="mlev" style="width:0"></i></div>
      <p class="${msg&&msg.bad?'err':'muted'}" id="mmsg" role="status" style="font-size:14px">${state.mic?(state.micSim?'Using a simulated microphone for this demo.':'Microphone ready. Heard you clearly.'):(msg?msg.text:'')}</p>
      <div class="cta-row"><button class="btn ${state.mic?'':'primary'}" id="mic-a" ${busy?'disabled':''}>${busy?'Listening…':state.mic?'Test again':'Allow microphone and test'}</button>${msg&&msg.bad&&!state.mic?'<button class="btn" id="mic-sim">Use a simulated mic</button>':''}</div></div>
    <div class="card"><b>3. Signer's gloves</b>${state.joined?`<div class="row"><span class="pill ${state.paired?'ok':'warn'}"><i></i>Left Spoke Glove ${state.paired?'linked':'waiting'}</span><span class="pill ${state.paired?'ok':'warn'}"><i></i>Right Hub Glove ${state.paired?'linked':'waiting'}</span></div>`:'<p class="muted" style="font-size:14px">Shown after you join.</p>'}</div>
    <button class="btn primary block" id="done" ${ready?'':'disabled'}>Start talking</button>`;
    const j=()=>{const v=$('#code').value.trim().toUpperCase().replace(/\s/g,'');if(codeMatches(v)){unlockChat();draw();toast('Joined the signer’s session')}else $('#cerr').textContent='That code did not match. Ask the signer for the 4-digit code on their Pairing screen.'};
    const jb=$('#join');if(jb&&!state.joined)jb.onclick=j;const u=$('#use');if(u)u.onclick=()=>{$('#code').value='SECB-4829';j()};
    $('#mic-a').onclick=micTest;
    const sm=$('#mic-sim');if(sm)sm.onclick=()=>{state.micSim=true;state.mic=true;msg=null;draw();renderTiles()};
    $('#done').onclick=()=>closeModal()}
  async function micTest(){busy=true;msg={text:'Asking for your microphone…'};draw();
    const ok=await Mic.start();if(!ok){busy=false;msg={bad:true,text:Mic.explain()};draw();return}
    const W=makeWave('#mw');let peak=0,n=0;state.micSim=false;
    const id=api.every(()=>{const r=Mic.read();peak=Math.max(peak,r.rms);W.push(r.rms);const m=$('#mlev');if(m)m.style.width=Math.min(100,r.rms*600)+'%';n++;
      if(n>=42){clearInterval(id);Mic.stop();busy=false;
        if(peak<0.02){state.mic=false;msg={bad:true,text:'We could not hear you. Speak a little louder or check which microphone your browser is using, then test again.'}}
        else{state.mic=true;msg=null}
        draw();renderTiles()}},80)}
  draw()})}