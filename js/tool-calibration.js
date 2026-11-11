'use strict';
/* tool-calibration.js: [Calibration]. Signer: flex range, IMU zero, hand fit, 10 sign samples. Partner: voice baseline. */
/* ===== Calibration (signer) ===== */
function calSigner(){openModal('Calibration','Calibrate your gloves',(root,api)=>{
  const names=['Flex range','IMU zero','Hand fit','Sign samples'];let ph=0,cap=0,res=null,bars=null;
  const FN=['thumb','index finger','middle finger','ring finger','pinky'],fname=i=>(i<5?'Left ':'Right ')+FN[i%5],glove=i=>i<5?'Left Spoke Glove':'Right Hub Glove';
  let fault=(state.faultDemo==null?6:state.faultDemo),skipped=-1,faultOpen=false;   /* index 0-4 left hand, 5-9 right hand; -1 = none */
  const dead=a=>{if(fault<0)return a;const b=a.slice();b[fault]=rnd(6,9);return b};
  const PH=[
    {t:'Check flex sensor range',p:'Each finger sensor needs a clear gap between an open hand and a fist.',caps:[['Open both hands flat',()=>dead(Array(10).fill(0).map(()=>rnd(8,16)))],['Close both hands into fists',()=>dead(Array(10).fill(0).map(()=>rnd(78,92)))]],
      r:()=>{const f=['Thumb','Index','Middle','Ring','Pinky'];state.cal=state.cal||{};state.cal.flex=f.map(()=>({o:Math.round(rnd(8,16)),c:Math.round(rnd(78,92))}));
        const sk=skipped>=0?`<div class="status warn">${icon('info','sm')} 9 of 10 sensors OK. ${fname(skipped)} was skipped. Signs that use it may be misread until it is fixed.</div>`:`<div class="status ok">${icon('check','sm')} All 10 flex sensors have a usable range</div>`;
        return sk+`<div class="scroll-x"><table class="tbl"><tr><th>Finger</th><th>Open</th><th>Fist</th><th>Span</th></tr>${f.map((n,i)=>{const x=state.cal.flex[i];return `<tr><td>${n}</td><td>${x.o}%</td><td>${x.c}%</td><td>${x.c-x.o}%</td></tr>`}).join('')}${skipped>=0?`<tr><td>${fname(skipped)}</td><td>–</td><td>–</td><td>No signal</td></tr>`:''}</table></div>`}},
    {t:'Zero the motion sensors',p:'Rest both hands flat on a table, palms down, and keep still. The IMU on the back of each hand removes its tilt and drift.',caps:[['Rest hands flat and still',()=>Array(10).fill(0).map(()=>rnd(8,16))]],imu:true,
      r:()=>`<div class="status ok">${icon('check','sm')} IMU zeroed on both hands</div><div class="scroll-x"><table class="tbl"><tr><th>Axis</th><th>Before</th><th>After</th></tr><tr><td>Accel X</td><td>0.04 g</td><td>0.00 g</td></tr><tr><td>Accel Z</td><td>0.97 g</td><td>1.00 g</td></tr><tr><td>Gyro drift</td><td>1.8 °/s</td><td>0.1 °/s</td></tr></table></div>`},
    {t:'Fit the gloves to your hands',p:'Spread your fingers wide and hold. The app scales every sensor to your hand size so the same sign reads the same.',caps:[['Spread fingers wide',()=>Array(10).fill(0).map(()=>rnd(4,10))]],
      r:()=>{const f=['Thumb','Index','Middle','Ring','Pinky'];return `<div class="status ok">${icon('check','sm')} Hand profile saved: medium fit</div><div class="scroll-x"><table class="tbl"><tr><th>Finger</th><th>Left gain</th><th>Right gain</th></tr>${f.map(n=>`<tr><td>${n}</td><td>×${rnd(.92,1.1).toFixed(2)}</td><td>×${rnd(.92,1.1).toFixed(2)}</td></tr>`).join('')}</table></div>`}}
  ];
  function draw(){bars&&bars.destroy();bars=null;if(ph<3)drawPhase();else drawSigns()}
  function drawPhase(){const P=PH[ph];root.innerHTML=stepsHTML(4,ph,names)+`<h3>${P.t}</h3><p class="muted">${P.p}</p>
    ${P.imu?`<div class="bubble" aria-hidden="true"><i id="bub"></i></div>`:''}<div class="card"><span class="lab">Live finger bend</span><div class="bg-wrap" id="cb"></div></div>
    ${ph===0?`<div class="field" style="gap:4px"><label for="flt" style="font-weight:600;font-size:13px">Prototype: simulate a sensor fault</label><select class="input" id="flt" style="min-height:44px"><option value="-1">No fault</option>${[1,6,2,7,4,9].map(i=>`<option value="${i}">${fname(i)}</option>`).join('')}</select></div>`:''}
    <div id="cap-area"></div>`;bars=api.bars($('#cb'));bars.set(IDLE());if(skipped>=0)bars.flag(skipped);
    if(ph===0){const fl=$('#flt');fl.value=String(fault);fl.onchange=()=>{fault=+fl.value;state.faultDemo=fault;if(skipped>=0){bars.flag(skipped,false);skipped=-1}}}
    if(P.imu){api.every(()=>{const b=$('#bub');if(b){const k=res?0:(cap===0&&capRunning?2:8);b.style.transform=`translate(${rnd(-k,k)}px,${rnd(-k,k)}px)`}},120)}
    capUI()}
  let capRunning=false;
  function capUI(){const P=PH[ph],a=$('#cap-area');if(res){a.innerHTML=res+`<button class="btn primary block" id="nx" style="margin-top:14px">Next</button>`;$('#nx').onclick=()=>{ph++;cap=0;res=null;draw()};return}
    if(ph===0&&cap>=P.caps.length&&fault>=0){a.innerHTML=`<div style="display:grid;gap:12px"><div class="status bad" role="alert">${icon('info','sm')} <span><b>${fname(fault)} sensor error.</b> It did not respond when you made a fist.</span></div><button class="btn primary block" id="tsb">Troubleshoot this finger</button><button class="btn block" id="rcap">Capture again</button></div>`;$('#tsb').onclick=()=>showFault(fault);$('#rcap').onclick=()=>{cap=0;capUI()};return}
    a.innerHTML=`<div style="display:grid;gap:12px">${ringHTML('Ready')}<div class="status" id="cs">${icon('hand','sm')} ${P.caps[cap][0]}</div><button class="btn primary block" id="cb-go">Capture (${cap+1} of ${P.caps.length})</button></div>`;
    $('#cb-go').onclick=()=>{$('#cb-go').disabled=true;capRunning=true;bars.set(P.caps[cap][1]());$('#cs').className='status warn';$('#cs').textContent='Hold steady…';
      runRing(api,2200,p=>{const l=$('#rg-l');if(l)l.textContent=(2.2*(1-p)).toFixed(1)+'s'},()=>{capRunning=false;cap++;if(cap>=P.caps.length){if(ph===0&&fault>=0){bars.flag(fault);bars.set(dead(IDLE()));capUI();showFault(fault)}else{res=P.r();bars.set(IDLE());toast('Captured');capUI()}}else capUI()})}}
  /* finger error pop-up with troubleshooting */
  function showFault(i){if(faultOpen)return;faultOpen=true;const prev=document.activeElement;
    const ov=document.createElement('div');ov.className='overlay alert-ov';ov.id='alert';
    const STEPS=[['Check the fit',`Slide the ${FN[i%5]} fully into the glove. Make sure the sensor strip along the finger is straight, not folded or pinched.`],
      ['Re-seat the sensor connector',`Switch the glove off, open the wrist cover and press the ${FN[i%5]} sensor connector in firmly until it clicks.`],
      ['Look for damage or moisture',`Check the strip for kinks, cracks or sweat. Dry it with a soft cloth if it is damp.`],
      ['Restart the glove',`Hold the power button for 3 seconds, switch it on again and wait for the light to turn steady.`]];
    ov.innerHTML=`<div class="sheet alert" role="alertdialog" aria-modal="true" aria-labelledby="al-t" aria-describedby="al-d">
      <header class="sh-head"><div><p class="kicker bad">Sensor error</p><h2 id="al-t">${fname(i)} is not working</h2></div><button class="icon-btn" id="al-x" aria-label="Close and troubleshoot later">${icon('x')}</button></header>
      <div class="sh-body">
        <div class="status bad" role="status">${icon('info','sm')} ${glove(i)} · ${FN[i%5]} flex sensor · no signal</div>
        <p id="al-d" style="margin:0">The ${FN[i%5]} sensor on your <b>${glove(i)}</b> barely changed when you made a fist (3% change, it needs at least 40%). Signs that use this finger may be misread. Try these steps, then test again:</p>
        <ol class="ts">${STEPS.map((x,k)=>`<li><label><input type="checkbox" data-st="${k}"><span><b>${k+1}. ${x[0]}</b><small>${x[1]}</small></span></label></li>`).join('')}</ol>
        <div class="lt card"><span class="lab">Live test · ${fname(i)}</span><div class="meter" aria-hidden="true"><i id="lt-b" style="width:3%"></i></div><div class="status" id="lt-s" aria-live="polite">Tick the steps you tried, then press Test again.</div></div>
        <div class="cta-row stack"><button class="btn primary" id="al-t2">Test again</button><button class="btn" id="al-skip">Skip this finger for now</button></div>
        <button class="link" id="al-help" type="button" aria-expanded="false">Still not working?</button>
        <div class="note" id="al-hb" hidden>${icon('info','sm')}<span>If the sensor still shows no signal, its flex strip or connector may be damaged. Replace the ${FN[i%5]} sensor module and run calibration again. You can keep using the gloves meanwhile, but signs that depend on this finger will be less accurate.</span></div>
      </div></div>`;
    $('#overlay').parentElement.appendChild(ov);const q=s=>$(s,ov),qa=s=>$$(s,ov);
    const close=ret=>{document.removeEventListener('keydown',key,true);ov.remove();faultOpen=false;if(!ret&&prev&&prev.focus)try{prev.focus()}catch(e){}};
    const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}
      else if(e.key==='Tab'){e.stopImmediatePropagation();const f=$$('button:not([disabled]),input,[tabindex="0"]',ov).filter(x=>x.offsetParent!==null);if(!f.length)return;const a=f[0],z=f[f.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}};
    document.addEventListener('keydown',key,true);api.cleanups.push(()=>{if(faultOpen)close(true)});
    q('#al-x').onclick=()=>close();
    q('#al-help').onclick=()=>{const h=q('#al-hb');h.hidden=!h.hidden;q('#al-help').setAttribute('aria-expanded',!h.hidden)};
    q('#al-skip').onclick=()=>{skipped=i;fault=-1;state.faultDemo=-1;close(true);res=PH[0].r();bars.set(IDLE());bars.flag(i);capUI();toast(fname(i)+' skipped')};
    q('#al-t2').onclick=()=>{const tried=qa('[data-st]:checked').length,b=q('#lt-b'),st=q('#lt-s'),btn=q('#al-t2');btn.disabled=true;st.className='status warn';st.textContent='Bend your '+FN[i%5]+' slowly now…';
      let n=0;const ok=tried>=2;const id=setInterval(()=>{n++;b.style.width=(ok?(n%2?72:20):rnd(2,6))+'%';if(n>=8){clearInterval(id);btn.disabled=false;
        if(ok){st.className='status ok';st.innerHTML=`${icon('check','sm')} ${fname(i)} responds. Range ${Math.round(rnd(66,76))}%.`;btn.textContent='Continue calibration';btn.onclick=()=>{fault=-1;state.faultDemo=-1;close(true);bars.flag(i,false);res=PH[0].r();bars.set(IDLE());capUI();toast('Sensor fixed')}}
        else{st.className='status bad';st.textContent=tried?'Still no signal. Try the other steps too, then test again.':'Still no signal. Work through the steps above first, then test again.'}}},RM?60:300)};
    q('#al-x').focus()}
  /* sign samples, as in Fig. 20 */
  let si=1,held=false,flash=false;
  function drawSigns(){if(si>10)return doneSigns();const w=tw(VOC[si-1]);
    root.innerHTML=stepsHTML(4,3,names)+`<div class="row sp"><span class="kicker">Sign ${si} of 10</span></div><h3 style="font-size:24px">Make the sign for “${w}”</h3><p class="muted">Hold the handshape steady until the ring fills.</p>
    <div class="ringbox"><svg width="176" height="176" viewBox="0 0 176 176" aria-hidden="true"><circle cx="88" cy="88" r="78" fill="none" stroke="var(--line)" stroke-width="10"/><circle id="rg" cx="88" cy="88" r="78" fill="none" stroke="var(--teal)" stroke-width="10" stroke-linecap="round" stroke-dasharray="490" stroke-dashoffset="490" transform="rotate(-90 88 88)"/></svg><div class="mid"><svg width="64" height="64" viewBox="0 0 64 64" fill="var(--teal-tint)" stroke="var(--ink)" stroke-width="3.4" stroke-linecap="round" aria-hidden="true"><use href="#i-hand"/></svg><b id="rg-l">2.4s</b></div></div>
    <div class="status" id="sst"><span class="dot on"></span>Hold steady…</div>
    <div class="card"><span class="lab">Finger bend, live (right hand)</span><div id="sb"></div></div>
    <div class="dots" aria-hidden="true">${Array.from({length:10},(_,i)=>`<i class="${i+1<si?'d':i+1===si?'c':''}"></i>`).join('')}</div>
    <div class="cta-row"><button class="btn" id="retry">Retry sign</button><button class="btn primary" id="nxs" disabled>Next sign</button></div>`;
    bars=api.bars($('#sb'),{groups:['R'],names:false});const start=()=>{held=false;$('#nxs').disabled=true;const r=$('#rg');r.style.stroke='var(--teal)';bars.set(pat10(w).slice(0,5));$('#sst').className='status';$('#sst').innerHTML='<span class="dot on"></span>Hold steady…';
      runRing(api,2400,p=>{const l=$('#rg-l');if(l){l.textContent=(2.4*(1-p)).toFixed(1)+'s'}},()=>{held=true;$('#rg-l').textContent='Done';$('#sst').className='status ok';$('#sst').innerHTML=`${icon('check','sm')} Captured · quality ${Math.round(rnd(93,99))}%`;$('#nxs').disabled=false})};
    $('#retry').onclick=()=>{$('#rg').style.stroke='var(--amber)';$('#rg').style.strokeDashoffset=490;$('#rg-l').textContent='Retry';start()};
    $('#nxs').onclick=()=>{si++;drawSigns()};start()}
  function doneSigns(){state.calibrated=true;state.accuracy=97;DataService.saveCalibration({flex:(state.cal||{}).flex,accuracy:97,signs:VOC.length});root.innerHTML=stepsHTML(4,4,names)+`<div class="status ok">${icon('check','sm')} All 10 signs calibrated · accuracy 97%</div><p class="muted">Your flex ranges, IMU zero and hand fit are saved on the hub glove. Calibrate again if the gloves feel different or accuracy drops.</p><button class="btn primary block" id="chat">Start chatting →</button>`;
    renderTiles();$('#chat').onclick=()=>{closeModal();if(phoneChat())openChat();else $('#live').scrollIntoView({behavior:RM?'auto':'smooth'})}}
  draw()})}

/* ===== Calibration (partner voice) ===== */
function calPartner(){openModal('Calibration','Calibrate your voice',(root,api)=>{
  const names=['Room noise','Normal voice','Expressive voice'];
  const PH=[{t:'Check the room',p:'Stay quiet for 3 seconds so the app can measure background noise.',cap:'Stay quiet',ms:3000},
    {t:'Say it normally',p:'Say “Hello, how are you today?” in your everyday voice. Tone cues are measured against your own pitch, not an average.',cap:'Speak normally',ms:4500},
    {t:'Say it with feeling',p:'Say the same sentence again, as if you were happy to see them.',cap:'Speak with feeling',ms:4500}];
  let ph=0,sim=false;const cal=Object.assign({},state.voice||{});
  function draw(){if(ph>=3)return finish();const P=PH[ph];
    root.innerHTML=stepsHTML(3,ph,names)+`<h3>${P.t}</h3><p class="muted">${P.p}</p>
    <div class="card"><div class="wave" id="cw" aria-hidden="true">${'<i></i>'.repeat(28)}</div><div class="meter"><i id="cl" style="width:0"></i></div><div class="row sp"><small class="muted">${sim?'Simulated microphone':'Your microphone'}</small><small class="muted" id="cpv">Pitch · –</small></div></div>
    <div id="cap">${ringHTML('Ready')}<button class="btn primary block" id="go">${P.cap}</button></div>`;
    $('#go').onclick=()=>capture(P)}
  function showResult(kind,text,retry){$('#cap').innerHTML=`<div class="status ${kind}" role="status">${kind==='ok'?icon('check','sm'):''} ${text}</div><div class="cta-row" style="margin-top:12px">${retry?'<button class="btn" id="rt">Try again</button>':''}${kind==='bad'?'':`<button class="btn primary" id="nx">Next</button>`}</div>`;
    const r=$('#rt');if(r)r.onclick=draw;const n=$('#nx');if(n)n.onclick=()=>{ph++;draw()}}
  function showErr(){$('#cap').innerHTML=`<div class="status warn" role="alert">${Mic.explain()}</div><div class="cta-row" style="margin-top:12px"><button class="btn" id="rt">Try again</button><button class="btn" id="sm">Use a simulated mic</button></div>`;
    $('#rt').onclick=draw;$('#sm').onclick=()=>{sim=true;draw()}}
  async function capture(P){const go=$('#go');go.disabled=true;
    if(!sim){const ok=await Mic.start();if(!ok){showErr();return}}
    const W=makeWave('#cw'),all=[],vRms=[],pitches=[];W.clear();
    const sid=api.every(()=>{let r;
      if(sim){const v=ph>0;r={rms:v?rnd(.04,.12):rnd(.002,.006),pitch:v?(ph===1?172:208)+rnd(-18,18):0}}else r=Mic.read();
      W.push(r.rms);const c=$('#cl');if(c)c.style.width=Math.min(100,r.rms*600)+'%';all.push(r.rms);
      if(r.rms>.015&&r.pitch&&steady(pitches,r.pitch)){pitches.push(r.pitch);vRms.push(r.rms);const pv=$('#cpv');if(pv)pv.textContent='Pitch · '+Math.round(r.pitch)+' Hz'}},70);
    runRing(api,P.ms,p=>{const l=$('#rg-l');if(l)l.textContent=(P.ms/1000*(1-p)).toFixed(1)+'s'},()=>{
      clearInterval(sid);if(!sim)Mic.stop();
      if(ph===0){const db=Math.round(20*Math.log10(mean(all)||1e-4));cal.noiseDb=db;
        if(db<-50)showResult('ok',`Quiet room (${db} dBFS). Good for speech-to-text.`);
        else if(db<-40)showResult('warn',`Some background noise (${db} dBFS). Speech-to-text may miss a few words.`);
        else showResult('warn',`This room is noisy (${db} dBFS). For better results move somewhere quieter and try again, or continue.`,true);
      }else if(pitches.length<8){showResult('bad','We could not hear your voice. Speak a little louder, check your microphone, then try again.',true)}
      else if(ph===1){cal.baseHz=Math.round(median(pitches));cal.loHz=Math.round(pct(pitches,.1));cal.hiHz=Math.round(pct(pitches,.9));cal.baseRms=+mean(vRms).toFixed(4);
        showResult('ok',`Your baseline pitch is ${cal.baseHz} Hz, usually between ${cal.loHz} and ${cal.hiHz} Hz.`)}
      else{cal.maxHz=Math.round(pct(pitches,.95));cal.peakRms=+Math.max(...vRms).toFixed(4);showResult('ok',`Expressive range recorded: up to ${cal.maxHz} Hz. Cheerful and urgent tones can now be told apart.`)}})}
  function finish(){state.voice=cal;state.voiceCal=true;DataService.saveCalibration({kind:'voice',voice:cal});
    root.innerHTML=stepsHTML(3,3,names)+`<div class="status ok">${icon('check','sm')} Voice calibrated</div>
    <div class="kpis"><div class="kpi"><b>${cal.baseHz||172} Hz</b><small>Baseline pitch</small></div><div class="kpi"><b>${cal.maxHz||248} Hz</b><small>Expressive peak</small></div><div class="kpi"><b>${cal.noiseDb!=null?cal.noiseDb:-58} dB</b><small>Room noise (dBFS)</small></div></div>
    <p class="muted">Your pitch baseline stays on this phone. Audio is analysed in memory and discarded right after each message.</p><button class="btn primary block" id="ok">Done</button>`;
    renderTiles();$('#ok').onclick=()=>closeModal()}
  draw()})}