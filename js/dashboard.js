'use strict';
/* dashboard.js: Screen 3. Four tiles, device status, tool launcher, start-up checks. */
/* ---------- dashboard ---------- */
function tileStatus(k){const s=state.mode==='signer';
  if(k==='pair')return s?(state.paired?['ok','Connected','Left Spoke and Right Hub Glove are linked']:['warn','Needs setup','Pair the two gloves over Bluetooth']):(state.joined?['ok','Joined','Session SECB-4829, mic ready']:['warn','Not joined','Join the signer’s session and check the mic']);
  if(k==='cal')return s?(state.calibrated?['ok','Calibrated','Sign samples accuracy '+state.accuracy+'%']:['warn','Not calibrated','Flex range, IMU zero, hand fit, 10 signs']):(state.voiceCal?['ok','Voice calibrated','Pitch baseline saved']:['warn','Not calibrated','Measure your normal pitch for tone cues']);
  if(k==='per')return s?(state.corrections?['ok',state.corrections+' corrections','Model v'+state.modelVer+' on your hub glove']:['','Learning your style',state.queued+' recognitions waiting for review']):['','Reading and listening','Text size, voice speed, tone sensitivity'];
  return ['','Sample data','Accuracy, confidence and session summaries']}
function renderTiles(){const s=state.mode==='signer';
  const defs=[['pair','ble','Pairing & Onboarding'],['cal','cal','Calibration'],['per','person','Personalization'],['ana','chart','Data Analytics']];
  let nextK=null;if(s){if(!state.paired)nextK='pair';else if(!state.calibrated)nextK='cal'}else{if(!state.joined)nextK='pair';else if(!state.voiceCal)nextK='cal'}
  $('#tiles').innerHTML=defs.map(([k,ic,t])=>{const [c,l,d]=tileStatus(k);return `<div class="tw"><button class="tile${k===nextK?' next':''}" data-tile="${k}"><span class="ti">${icon(ic)}</span><h3>${t}</h3><small>${d}</small><span class="pill ${c}"><i></i>${l}</span></button><button class="qm" type="button" data-help="${k}" aria-label="What is ${t}?">?</button></div>`}).join('');
  $$('.tile').forEach(b=>b.onclick=()=>openTool(b.dataset.tile));
  const dv=$('#devices');const Q=k=>`<button class="qm sm" type="button" data-help="${k}" aria-label="What is this?">?</button>`;
  if(s)dv.innerHTML=`<div class="dev"><b><span class="dot ${state.paired?'on':''}"></span>Left Spoke Glove${Q('dev_L')}</b><small>${state.paired?'ESP-NOW to hub <span data-bat="L"></span>':'Not paired'}</small></div><div class="dev"><b><span class="dot ${state.paired?'on':''}"></span>Right Hub Glove${Q('dev_R')}</b><small>${state.paired?'Bluetooth LE <span data-bat="R"></span>':'Not paired'}</small></div>`;
  else dv.innerHTML=`<div class="dev"><b><span class="dot ${state.joined?'on':''}"></span>Session${Q('dev_S')}</b><small>${state.joined?'SECB-4829 · joined':'Not joined'}</small></div><div class="dev"><b><span class="dot ${state.mic?'on':''}"></span>Microphone${Q('dev_M')}</b><small>${state.mic?'Ready':'Not checked'}</small></div>`;
  $$('[data-help]').forEach(b=>b.onclick=e=>{e.stopPropagation();openHelp(b.dataset.help,b)});
  fillBat()}
function renderDash(){const s=state.mode==='signer';
  $('#mode-pill').innerHTML=s?`${icon('hand','sm')}Signer mode`:`${icon('mic','sm')}Partner mode`;$('#mode-pill').className='pill '+(s?'ok':'vio');
  $('#dash-h').textContent='Hi, '+state.user;$('#dash-sub').textContent=s?'Set up your gloves, then start a conversation.':'Join the signer, check your mic, then start talking.';renderTiles()}


function openTool(k){const s=state.mode==='signer';
  if(k==='pair')return s?pairSigner():pairPartner();
  if(k==='cal')return s?calSigner():calPartner();
  if(k==='per')return s?perSigner():perPartner();
  return analytics()}

/* ---------- start-up ---------- */
(function init(){
  const s=Session.get();
  if(!s.id||!s.mode){location.replace(s.id?'mode.html':'index.html');return}   // must log in and choose a mode first
  state.user=s.name;state.mode=s.mode;
  $('#dash-back').onclick=()=>{location.href='mode.html'};
  $('#how-d').onclick=()=>openGuide(false);
  $('#tour-btn').onclick=()=>Tour.start();
  Battery.onChange(lv=>{
    fillBat();
    if(!state.paired||state.mode!=='signer')return;
    ['L','R'].forEach(k=>{
      const low=lv[k]<=Battery.LOW;
      if(low&&!Battery._warned[k]){Battery._warned[k]=true;toast((k==='L'?'Left':'Right')+' glove battery is low ('+Math.round(lv[k])+'%). Charge it soon.')}
      if(!low)Battery._warned[k]=false;
    });
  });
  Battery.start();
  renderDash();renderLive();
  Tour.maybeStart();   // first-time tutorial (once per user and mode)
})();