'use strict';
/* live.js: live conversation demo. Signer view (glove stream, translation, haptics) and partner view (speech-to-text, tone, text-to-speech). */
/* ---------- live conversation ---------- */
/* One chat for both roles. On a desktop it is a side panel; on a phone it is its own full-screen, Messenger-style screen. */
let liveTimers=[],liveBars=null,unread=0,interim='',rec=null,listening=null,pendingTone=null,typedDraft=false,waveV=null,voiceDraft=null,curAudio=null,curBtn=null,sttMsg='';
const phoneChat=()=>{const e=$('#convo-entry');return !!e&&getComputedStyle(e).display!=='none'};
const chatOpen=()=>{const l=$('#live');return !!l&&l.classList.contains('open')};
function stopLive(){liveTimers.forEach(clearInterval);liveTimers=[];if(liveBars){liveBars.destroy();liveBars=null}state.demo=null;state.busy=false;listening=null;interim='';try{rec&&rec.abort()}catch(e){}rec=null;Mic.stop();if(typeof Scan!=='undefined')Scan.stop();try{speechSynthesis.cancel()}catch(e){}}

function renderLive(){
  stopLive();unread=0;
  if(!chatUnlocked()){renderGate();return}   // QR gate: the chat opens only after the partner scans the signer's QR code
  const host=$('#live'),s=state.mode==='signer',showDetails=!phoneChat();
  const head=`<div class="chat-head"><button class="icon-btn chat-back" id="chat-back" aria-label="Back to dashboard">${icon('back')}</button><span class="avatar ${s?'':'v'}">${icon(s?'mic':'hand')}</span><div class="ch-t"><h2>${s?'Hearing partner':'Signer'}</h2><small id="ch-sub">${s?'Their tone buzzes your gloves':'Signs arrive as text'}</small></div><button class="btn sm warn" id="demo-stop" hidden>Stop demo</button>${s?'':`<button class="icon-btn" id="tts" aria-pressed="${state.ttsOn}" aria-label="Read signer messages aloud">${icon('spk')}</button>`}<button class="icon-btn" id="det-toggle" aria-expanded="${showDetails}" aria-controls="details" aria-label="Show details">${icon('info')}</button></div>`;
  const details=s?`<div class="chat-details" id="details" ${showDetails?'':'hidden'}>
      <div class="card"><div class="row sp"><span class="lab">Glove sensor stream · 50 Hz</span><span class="pill ${state.paired?'ok':'warn'}"><i></i>${state.paired?'Gloves linked':'Simulated stream'}</span></div><div class="bg-wrap" id="sg-bars"></div><div class="row sp"><small class="muted" id="sg-lat">Latency · 1.9 s</small><small class="muted">Battery · L <span data-bat="L"></span> · R <span data-bat="R"></span></small></div></div>
      <div class="cta-row stack"><button class="btn sm" id="sg-hear">${icon('mic','sm')}Simulate partner speaking</button><button class="btn sm" id="demo-btn">${icon('play','sm')}Play demo conversation</button><button class="btn sm" id="clear-log">Clear session</button><button class="btn sm warn" id="end-chat">End conversation</button></div></div>`
    :`<div class="chat-details" id="details" ${showDetails?'':'hidden'}>
      <div class="card"><div class="row sp"><span class="lab">Text-to-speech</span><span class="pill ${state.ttsOn?'ok':''}" id="tts-vis">${state.ttsOn?'On':'Off'}</span></div><small class="muted">Turn on the speaker button above to hear the signer's messages read aloud.</small></div>
      <div class="cta-row stack"><button class="btn sm" id="replay">${icon('spk','sm')}Replay last message</button><button class="btn sm" id="pt-sim">${icon('hand','sm')}Simulate signer message</button><button class="btn sm" id="demo-btn">${icon('play','sm')}Play demo conversation</button><button class="btn sm" id="clear-log">Clear session</button><button class="btn sm warn" id="end-chat">End conversation</button></div></div>`;
  const compose=s?`<div class="compose">
      <div class="hap-strip e-none" id="hp"><span class="gl">${icon('vib','sm')}</span><span id="hp-t"><b>Haptics idle</b> <small class="muted">Your partner's tone will buzz here</small></span></div>
      <div class="row sp"><span class="pill ok" id="sg-st"><i></i>Ready</span><small class="muted" id="sg-meta">Waiting for a sign</small><button type="button" class="link sm" id="sg-clear" hidden>Clear</button></div>
      <div class="lang-row" role="group" aria-label="Sign language"><span class="muted">Signing in:</span>${[['asl','ASL · English'],['fsl','FSL · Filipino']].map(([v,n])=>`<button type="button" class="lg-btn sl-btn" data-sl="${v}" aria-pressed="${(state.sl||'asl')===v}">${n}</button>`).join('')}</div>
      <div class="meter thin" aria-hidden="true"><i id="sg-conf" style="width:0"></i></div><div class="gloss" id="sg-gloss" aria-live="polite"></div>
      <form class="composer" id="sg-form" autocomplete="off"><button type="button" class="round" id="sg-sign" aria-label="Simulate a sign">${icon('hand')}</button><input class="draft" id="sg-in" placeholder="Make a sign, or type here" aria-label="Message to send"><button class="round primary" id="sg-send" type="submit" aria-label="Send message" disabled>${icon('send')}</button></form></div>`
    :`<div class="compose">
      <div class="tone-strip e-none" id="tone"><span id="tone-f">${face('')}</span><div class="ts-t"><b id="tone-l">Tone from your voice</b><small id="tone-d">Pitch and energy appear while you talk</small></div><div class="meter thin" aria-hidden="true"><i id="tone-m" style="width:0"></i></div></div>
      <div class="lang-row" role="group" aria-label="Speech language"><span class="muted">Speaking:</span>${[['auto','Auto'],['en-US','English'],['fil-PH','Tagalog']].map(([v,n])=>`<button type="button" class="lg-btn" data-lg="${v}" aria-pressed="${(state.lang||'auto')===v}">${n}</button>`).join('')}</div>
      <div class="wave-row" id="wave-row" hidden><span class="rec-dot" aria-hidden="true"></span><b class="rec-t" id="rec-t">0:00</b><div class="wave" id="wave" aria-hidden="true">${'<i></i>'.repeat(28)}</div></div>
      <div class="vprev" id="vprev" hidden><button type="button" class="vplay" id="vp-play" aria-label="Play your recording">${icon('play','sm')}</button><div class="vp-mid"><b id="vp-dur">0:00</b><span id="vp-tone"></span><small class="muted">Voice recording ready. Edit the transcript if needed, then send.</small></div><button type="button" class="btn sm" id="vp-x">Discard</button></div>
      <form class="composer" id="pt-form" autocomplete="off"><button type="button" class="round talk" id="mic" aria-pressed="false" aria-label="Talk with your microphone">${icon('mic')}</button><input class="draft" id="pt-type" placeholder="Tap the mic and talk, or type" aria-label="Message"><button class="round primary" id="pt-go" type="submit" aria-label="Send message" disabled>${icon('send')}</button></form>
      <small class="muted" id="pt-sent" aria-live="polite">Tone is sent to the signer's gloves as a buzz pattern</small></div>`;
  host.innerHTML=head+details+`<div class="chat-log" id="log" role="log" aria-live="polite" tabindex="0"></div>`+compose;
  $('#chat-back').onclick=closeChat;
  $('#det-toggle').onclick=()=>{const d=$('#details'),open=d.hidden;d.hidden=!open;$('#det-toggle').setAttribute('aria-expanded',open)};
  $('#demo-btn').onclick=toggleDemo;$('#demo-stop').onclick=toggleDemo;
  $('#clear-log').onclick=()=>{state.convo=[];renderLog();renderEntry();toast('Session cache cleared')};
  $('#end-chat').onclick=endConversation;
  $('#log').addEventListener('click',e=>{if(e.target.closest('[data-demo]'))toggleDemo()});
  if(s){
    liveBars=makeBars($('#sg-bars'));liveBars.set(IDLE());
    liveTimers.push(setInterval(()=>{if(!state.busy)liveBars.set(IDLE())},900));
    $('#sg-form').onsubmit=e=>{e.preventDefault();sendDraft()};
    $('#sg-in').oninput=()=>{typedDraft=true;syncDraft()};
    $('#sg-clear').onclick=()=>setDraft('','',0);
    $$('.sl-btn').forEach(b=>b.onclick=()=>{state.sl=b.dataset.sl;$$('.sl-btn').forEach(x=>x.setAttribute('aria-pressed',x===b));$('#sg-in').placeholder=state.sl==='fsl'?'Gumawa ng sign, o mag-type dito':'Make a sign, or type here';toast('Sign language: '+(state.sl==='fsl'?'Filipino Sign Language':'American Sign Language'))});
    $('#sg-sign').onclick=manualSign;$('#sg-hear').onclick=()=>partnerSpeaks(nextLine());
  }else{
    waveV=makeWave('#wave');
    $('#tts').onclick=()=>{state.ttsOn=!state.ttsOn;$('#tts').setAttribute('aria-pressed',state.ttsOn);const v=$('#tts-vis');v.textContent=state.ttsOn?'On':'Off';v.className='pill '+(state.ttsOn?'ok':'');toast(state.ttsOn?'Signer messages will be read aloud':'Read aloud is off')};
    $('#replay').onclick=()=>{const l=[...state.convo].reverse().find(m=>m.from==='signer');if(!l)return toast('No signer message yet');const was=state.ttsOn;state.ttsOn=true;speak(l.text);state.ttsOn=was;toast('Replaying message')};
    $('#mic').onclick=()=>{if(listening)return listening.stopReq();if(voiceDraft)discardVoice();listenReal()};
    $('#pt-form').onsubmit=e=>{e.preventDefault();const i=$('#pt-type'),v=i.value.trim();if(voiceDraft)return sendVoice(v);if(!v)return;i.value='';$('#pt-go').disabled=true;
      const pt=pendingTone&&Date.now()-pendingTone.at<60000?pendingTone:null;pendingTone=null;addMsg({from:'partner',text:v,emo:pt?pt.emo:null,hz:pt?pt.hz:null});if(!pt)setTone(null)};
    $('#pt-type').oninput=()=>{$('#pt-go').disabled=!$('#pt-type').value.trim()&&!voiceDraft};
    $$('.lg-btn').forEach(b=>b.onclick=()=>{state.lang=b.dataset.lg;$$('.lg-btn').forEach(x=>x.setAttribute('aria-pressed',x===b));toast('Speech language: '+b.textContent)});$('#vp-x').onclick=discardVoice;$('#vp-play').onclick=()=>playClip(voiceDraft&&voiceDraft.url,$('#vp-play'));
    $('#pt-sim').onclick=()=>signerSends(sMsg(state.sigIdx++));
  }
  $('#convo-entry').onclick=openChat;
  renderLog();renderEntry();fillBat();
}
function openChat(){const l=$('#live');l.classList.add('open');unread=0;renderEntry();renderLog();const b=$('#chat-back');b&&b.focus({preventScroll:true})}
function closeChat(){const l=$('#live');l.classList.remove('open');const e=$('#convo-entry');e&&e.focus({preventScroll:true})}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&chatOpen()&&phoneChat()&&$('#overlay').hidden)closeChat()});

function renderEntry(){const e=$('#convo-entry');if(!e)return;const s=state.mode==='signer',last=state.convo[state.convo.length-1];
  e.setAttribute('aria-label','Open conversation'+(unread?', '+unread+' new':''));
  e.innerHTML=`<span class="avatar ${s?'':'v'}">${icon(s?'mic':'hand')}</span><span class="ce-t"><b>${s?'Hearing partner':'Signer'}</b><small>${!chatUnlocked()?(s?'Show the QR code to your partner':'Scan the signer’s QR code to join'):last?esc((last.from===state.mode?'You: ':'')+last.text):'Start a conversation'}</small></span>${unread?`<span class="badge">${unread}</span>`:icon('arrow','sm')}`}

function renderLog(){const l=$('#log');if(!l)return;
  l.innerHTML=(state.convo.length?state.convo.map((m,i)=>{const me=m.from===state.mode;
    const meta=m.from==='partner'?`${m.lang?`<span class="lg-chip">${LNAME[m.lang]}</span> `:''}${emoChip(m.emo,m.hz)}${m.emo?patHTML(m.emo):''}`:(m.conf==null?'typed on phone':`via gloves · ${m.sl?SLN[m.sl]+' · ':''}confidence ${m.conf}%`);
    const au=m.audio?`<span class="vm">${state.mode==='partner'?`<button type="button" class="vplay" data-vi="${i}" aria-label="Play voice message">${icon('play','sm')}</button>`:`<span class="vplay static" aria-hidden="true">${icon('mic','sm')}</span>`}<span class="vbars" aria-hidden="true">${vbars(m.audio.ms)}</span><b>${fmtT(m.audio.ms)}</b><span class="sr">Voice message</span></span>`:'';
    const body=m.text?esc(m.text):(m.audio?'<i class="muted-i">No transcript</i>':'');
    return `<div class="msg ${me?'me':'them'}"><span class="who">${m.from==='partner'?'Partner':'Signer'} · ${m.t}</span>${au}<span>${body}</span><small>${meta}</small></div>`}).join('')
    :`<div class="empty"><p>No messages yet. ${state.mode==='signer'?'Make a sign':'Tap the mic'} or type a message, or watch a sample conversation.</p><button class="btn primary sm" data-demo>${icon('play','sm')}Play demo conversation</button></div>`)
    +(interim?`<div class="msg me live"><span class="who">Listening…</span><span>${esc(interim)}</span></div>`:(listening&&state.mode==='partner'&&!state.demo?`<div class="msg me live"><span class="who">Listening…</span><span class="muted-i">${esc(sttMsg||(Mic.stt?'Hearing your voice. Words appear here as the browser recognizes them.':'This browser cannot turn speech into text. You can still send the recording.'))}</span></div>`:''));
  if(!l._vp){l._vp=1;l.addEventListener('click',e=>{const b=e.target.closest('.vplay[data-vi]');if(!b)return;const m=state.convo[+b.dataset.vi];if(m&&m.audio)playClip(m.audio.url,b)})}
  l.scrollTop=l.scrollHeight}
const LNAME={'en-US':'English','en-PH':'English','fil-PH':'Tagalog'};
const fmtT=ms=>{const s=Math.max(1,Math.round(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
const vbars=ms=>{let o='';const n=22;for(let k=0;k<n;k++){o+=`<i style="height:${30+Math.round(60*Math.abs(Math.sin(k*1.7+ms/400)))}%"></i>`}return o};
const PAUSE_SVG='<svg class="ic sm" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';
function playClip(url,btn){if(!url)return;
  if(curAudio&&curBtn===btn&&!curAudio.paused){curAudio.pause();return}
  if(curAudio){try{curAudio.pause()}catch(e){}}
  const a=new Audio(url);curAudio=a;curBtn=btn;const idle=icon('play','sm');
  const done=()=>{if(btn&&btn.isConnected){btn.innerHTML=idle;btn.classList.remove('playing');btn.setAttribute('aria-label','Play voice message')}};
  a.onplay=()=>{btn.innerHTML=PAUSE_SVG;btn.classList.add('playing');btn.setAttribute('aria-label','Pause')};
  a.onpause=done;a.onended=done;a.onerror=()=>{done();toast('Could not play this recording')};
  a.play().catch(()=>{done();toast('Could not play this recording')})}
function discardVoice(){if(curAudio){try{curAudio.pause()}catch(e){}}if(voiceDraft){try{URL.revokeObjectURL(voiceDraft.url)}catch(e){}}voiceDraft=null;
  const v=$('#vprev');if(v)v.hidden=true;const i=$('#pt-type');if(i){i.value='';i.placeholder='Tap the mic and talk, or type'}const g=$('#pt-go');if(g)g.disabled=true;setTone(null)}
function showVoice(){const v=$('#vprev');if(!v||!voiceDraft)return;v.hidden=false;$('#vp-dur').textContent=fmtT(voiceDraft.ms);
  $('#vp-tone').innerHTML=voiceDraft.emo?emoChip(voiceDraft.emo,voiceDraft.hz):'';
  const i=$('#pt-type');i.value=voiceDraft.text||'';i.placeholder='Type what you said (optional)';const sm=$('#vprev small');if(sm)sm.textContent=voiceDraft.text?'Transcript from your voice'+(voiceDraft.lang?' ('+LNAME[voiceDraft.lang]+')':'')+'. Edit it if needed, then send.':voiceDraft.note;$('#pt-go').disabled=false;$('#pt-go').setAttribute('aria-label','Send voice message');$('#pt-sent').textContent='Press send to share this voice message. The signer sees the transcript and feels the tone.'}
function sendVoice(text){const d=voiceDraft;if(!d)return;if(curAudio){try{curAudio.pause()}catch(e){}}
  voiceDraft=null;$('#vprev').hidden=true;const i=$('#pt-type');i.value='';i.placeholder='Tap the mic and talk, or type';$('#pt-go').disabled=true;$('#pt-go').setAttribute('aria-label','Send message');
  addMsg({from:'partner',text,lang:text&&d.text&&text===d.text?d.lang:null,emo:d.emo,hz:d.hz,audio:{url:d.url,ms:d.ms}});toast('Voice message sent')}

function addMsg(m){m.t=nowT();state.convo.push(m);
  if(m.from!==state.mode&&phoneChat()&&!chatOpen())unread++;
  renderLog();renderEntry();
  if(m.from==='partner'){if(state.mode==='signer')buzz(m.emo);else{const n=$('#pt-sent');if(n)n.innerHTML=m.emo?`Sent to the signer's gloves: ${EMO[m.emo].label} ${patHTML(m.emo)}`:'Sent as text. No tone buzz.'}}
  else if(state.mode==='partner')speak(m.text)}

function buzz(k){const h=$('#hp');if(!h)return;h.className='hap-strip '+(k?'e-'+k:'e-none');void h.offsetWidth;h.classList.add('buzz');
  $('#hp-t').innerHTML=k?`<b>Gloves buzzed: ${EMO[k].label}</b> ${patHTML(k)}<br><small class="muted">${EMO[k].hint}</small>`:'<b>Single tap</b> <small class="muted">New message</small>';
  try{navigator.vibrate&&navigator.vibrate((EMO[k]||{pat:[120]}).pat)}catch(e){}
  if(k)toast('Gloves buzz: '+EMO[k].label+' tone')}

function speak(t){if(!state.ttsOn)return;const sp=$('#tts-vis');
  try{if('speechSynthesis' in window){const u=new SpeechSynthesisUtterance(t);u.rate=state.ttsRate;speechSynthesis.cancel();speechSynthesis.speak(u)}}catch(e){}
  if(sp){sp.textContent='Speaking…';sp.className='pill ok';setTimeout(()=>{sp.textContent='On'},Math.min(5000,t.length*70))}}

/* ----- signer ----- */
function syncDraft(){const i=$('#sg-in');if(!i)return;const has=!!i.value.trim();$('#sg-send').disabled=!has;$('#sg-clear').hidden=!has}
function setDraft(text,gloss,conf){const i=$('#sg-in');if(!i)return;i.value=text||'';typedDraft=false;$('#sg-gloss').textContent=gloss||'';$('#sg-conf').style.width=(text?conf:0)+'%';$('#sg-meta').textContent=text?`Recognized from signing · confidence ${conf}%`:'Waiting for a sign';syncDraft()}
function sendDraft(){const i=$('#sg-in'),text=i.value.trim();if(!text)return;const conf=typedDraft?null:(parseInt($('#sg-conf').style.width)||92);
  addMsg({from:'signer',text,conf,sl:state.sl});setDraft('','',0);const h=$('#hp');if(h){h.className='hap-strip e-none';void h.offsetWidth;h.classList.add('buzz');$('#hp-t').innerHTML='<b>Sent</b> <small class="muted">One short tap on both gloves</small>'}}
async function signSeq(signs,text){const st=$('#sg-st');state.busy=true;const gloss=[];
  for(const w of signs){st.className='pill warn';st.innerHTML='<i></i>Recognizing';liveBars.set(pat10(w));gloss.push(w.toUpperCase());$('#sg-gloss').textContent=gloss.join(' + ');await sleep(RM?300:900)}
  const conf=Math.round(rnd(90,98));liveBars.set(IDLE());st.className='pill ok';st.innerHTML='<i></i>Ready';$('#sg-lat').textContent='Latency · '+rnd(1.6,2.2).toFixed(1)+' s';setDraft(text,gloss.join(' + '),conf);state.busy=false}
async function manualSign(){if(state.busy)return;const w=tw(VOC[state.vocIdx++%VOC.length]);const conf=Math.round(rnd(52,99));const st=$('#sg-st');
  if(conf<state.threshold){state.busy=true;st.className='pill warn';st.innerHTML='<i></i>Recognizing';liveBars.set(pat10(w));await sleep(900);liveBars.set(IDLE());st.className='pill bad';st.innerHTML='<i></i>Not sure';
    $('#sg-gloss').textContent='';$('#sg-meta').textContent=`Low confidence (${conf}%). Nothing was added. Please sign again.`;buzz(null);$('#hp-t').innerHTML=`<b>Repeat cue</b> <small class="muted">Confidence ${conf}% is below your ${state.threshold}% limit</small>`;state.busy=false;return}
  const cur=$('#sg-in').value.trim();const t=cur?cur.replace(/[.!?]$/,'')+', '+w.toLowerCase():w;await signSeq([w],t);$('#sg-conf').style.width=conf+'%';$('#sg-meta').textContent=`Recognized from signing · confidence ${conf}%`}
function nextLine(){return PARTNER_LINES[state.lineIdx++%PARTNER_LINES.length]}

/* ----- partner: tone, wave, listening ----- */
function setTone(k,hz,en){const t=$('#tone');if(!t)return;t.className='tone-strip '+(k?'e-'+k:'e-none');$('#tone-f').innerHTML=face(k||'');$('#tone-l').textContent=k?EMO[k].label:'Tone from your voice';
  $('#tone-d').textContent=k?`Pitch ${Math.round(hz)} Hz · energy ${Math.round(en)}%`:'Pitch and energy appear while you talk';$('#tone-m').style.width=(k?en:0)+'%'}
function setListening(on){const b=$('#mic');if(!b)return;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);b.setAttribute('aria-label',on?'Stop recording':'Talk with your microphone');
  $('#wave-row').hidden=!on;$('#pt-type').placeholder=on?'Listening…':'Tap the mic and talk, or type';if(on)waveV.clear();else interim=''}

/* real microphone (falls back to a simulated voice when the browser blocks it) */
async function listenReal(){
  if(state.busy)return;state.busy=true;
  const ok=await Mic.start();
  if(!ok){state.busy=false;toast(Mic.explain().split('. ')[0]+'. Using a simulated voice instead.');return listenSim(nextLine())}
  state.mic=true;Mic.recStart();setListening(true);
  const pitches=[],rmsL=[];let ended=false,tm=null;sttMsg='';
  /* speech-to-text. Browsers run ONE recognizer at a time and it understands ONE language, so "Auto" listens phrase by phrase and
     switches between English and Filipino whenever a phrase comes back empty or unsure. */
  const order=state.lang==='auto'?['en-US','fil-PH']:[state.lang||'en-US'];
  let li=0,parts=[],curP='',stopping=false,sr=null;const sErr=[];
  const FATAL=/not-allowed|service-not-allowed|network|audio-capture|language-not-supported|start/;
  const joined=()=>(parts.map(x=>x.t).join(' ')+' '+curP).trim();
  const finish=async()=>{if(ended)return;ended=true;clearInterval(tm);try{sr&&sr.abort()}catch(e){}sr=null;rec=null;const clip=await Mic.recStop();Mic.stop();setListening(false);
    const st=summarize(pitches,rmsL),emo=st?classifyTone(st):null,text=joined();
    const top=parts.slice().sort((a,b)=>b.t.length-a.t.length)[0],lang=top?top.l:null;interim='';listening=null;state.busy=false;
    const why=sErr.length?' (browser said: '+[...new Set(sErr)].join(', ')+')':'';
    const note=text?'':(!Mic.stt?'This browser has no speech-to-text (try Chrome, Edge or Safari). Type what you said.':sErr.some(x=>FATAL.test(x))?'Speech-to-text could not start'+why+'. It needs internet and https or localhost, and is often blocked inside a preview frame. Type what you said.':'No words were recognized'+why+'. Speak closer to the mic, or choose English or Tagalog below. Type what you said.');
    if(clip&&clip.ms>600){voiceDraft={url:clip.url,ms:clip.ms,text,lang,emo,hz:st?st.pitch:null,note};showVoice();renderLog();return}
    if(text)addMsg({from:'partner',text,lang,emo,hz:st?st.pitch:null});
    else{pendingTone=emo?{emo,hz:st.pitch,at:Date.now()}:null;renderLog();toast(note);$('#pt-type').focus()}renderLog()};
  listening={stopReq:()=>{stopping=true;try{sr&&sr.stop()}catch(e){}setTimeout(finish,Mic.stt?1500:0)}};
  const startSR=()=>{if(ended||stopping)return finish();const l=order[li%order.length];let fin='',conf=[];
    try{sr=new Mic.SRC();sr.lang=l;sr.interimResults=true;sr.continuous=false;sr.maxAlternatives=1;
      sr.onresult=e=>{let f='',pp='';conf=[];for(let k=0;k<e.results.length;k++){const x=e.results[k];if(x.isFinal){f+=x[0].transcript+' ';if(x[0].confidence)conf.push(x[0].confidence)}else pp+=x[0].transcript}
        fin=f.trim();curP=(f+' '+pp).trim();interim=joined();renderLog()};
      sr.onerror=e=>{if(e.error!=='aborted')sErr.push(e.error)};
      sr.onend=()=>{if(fin){const c=conf.length?conf.reduce((a,b)=>a+b,0)/conf.length:1;parts.push({t:fin,l,c});if(order.length>1&&c<.6)li++}else if(order.length>1)li++;
        curP='';if(ended)return;if(stopping||sErr.some(x=>FATAL.test(x)))return finish();startSR()};
      sr.start()}catch(e){sErr.push('start');finish()}};
  if(Mic.stt)startSR();
  tm=setInterval(()=>{const r=Mic.read();waveV.push(r.rms);const rt=$('#rec-t');if(rt)rt.textContent=fmtT(Math.max(1000,Mic.elapsed())).replace(/^0:01$/,'0:00');if(r.rms>0.015)rmsL.push(r.rms);if(r.pitch&&r.rms>0.015&&steady(pitches,r.pitch))pitches.push(r.pitch);
    if(pitches.length>5){const st=summarize(pitches.slice(-25),rmsL.slice(-25));setTone(classifyTone(st),st.pitch,Math.min(100,st.rms/((state.voice&&state.voice.baseRms)||.05)*50))}},80);
  liveTimers.push(tm);
  setTimeout(()=>{if(!ended&&listening)listening.stopReq()},60000);
}
/* scripted / simulated voice (demo and fallback) */
function listenSim(line){return new Promise(res=>{state.busy=true;const words=line.text.split(' ');let i=0,n=0;setListening(true);
  const send=text=>{clearInterval(tm);setListening(false);interim='';state.busy=false;listening=null;addMsg({from:'partner',text,emo:line.emo,hz:line.hz});res()};
  const tm=setInterval(()=>{n++;waveV.push(rnd(.01,.12));if(n%2)return;
    if(i<words.length){i++;interim=words.slice(0,i).join(' ');renderLog();const en={urgent:78,cheerful:66,calm:34,sad:24,concerned:44}[line.emo]+rnd(-8,8);setTone(line.emo,line.hz+rnd(-9,9),en)}else send(line.text)},110);
  liveTimers.push(tm);listening={stopReq:()=>send(words.slice(0,Math.max(1,i)).join(' '))}})}
async function partnerSpeaks(line){if(state.busy)return;if($('#mic')){await listenSim(line)}else{state.busy=true;toast('Partner is speaking…');await sleep(1100);addMsg({from:'partner',text:line.text,emo:line.emo,hz:line.hz+rnd(-8,8)});state.busy=false}}
async function signerSends(step){if(state.busy)return;if($('#sg-in')){await signSeq(step.signs,step.text);await sleep(700);sendDraft()}
  else{state.busy=true;toast('Signer is signing…');await sleep(1300);addMsg({from:'signer',text:step.text,conf:Math.round(rnd(90,98)),sl:state.sl});state.busy=false}}

/* demo */
function setDemoUI(on){const b=$('#demo-btn');if(b)b.innerHTML=icon(on?'stop':'play','sm')+(on?'Stop demo':'Play demo conversation');const s=$('#demo-stop');if(s)s.hidden=!on;$$('[data-demo]').forEach(x=>x.hidden=on)}
async function toggleDemo(){if(state.demo){state.demo.stop=true;if(listening)listening.stopReq();return}
  const d={stop:false};state.demo=d;setDemoUI(true);
  for(const [w,i] of DEMO){if(d.stop)break;while(state.busy&&!d.stop)await sleep(150);if(d.stop)break;if(w==='p')await partnerSpeaks(PARTNER_LINES[i]);else await signerSends(sMsg(i));await sleep(900)}
  if(state.demo===d)state.demo=null;setDemoUI(false)}