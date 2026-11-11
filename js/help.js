'use strict';
/* help.js: the "?" help dialogs on the dashboard and the first-time "How to use this app" guide. Needs utils.js and icons.js only (also used by mode.html). */
/* ---------- help ---------- */
/* "?" help buttons (what is this / what is it for / how to use it) and the first-time "How to use this app" guide.
   Self-contained on purpose: it does not need modal.js, so the mode page can use it too. */
const HELP={
  pair_s:{t:'Pairing & Onboarding',what:'This connects your two gloves, the Left Spoke Glove and the Right Hub Glove, to your phone.',use:'The gloves cannot send your signs to the app until they are linked. You only need to do this the first time, or when a glove was switched off or replaced.',
    steps:['Switch on both gloves. The light blinks blue when a glove is ready.','Turn on Bluetooth and scan. Choose the Right Hub Glove first.','The Left Spoke Glove joins the hub by itself.','Do the buzz test to feel both gloves.','Once paired, check the battery percentage of each glove.','Give your partner the session code so their phone can join.'],tip:'Keep both gloves within arm\'s reach while pairing.',tool:'pair'},
  cal_s:{t:'Calibration',what:'This teaches the gloves your hand size and how far each finger bends.',use:'Every hand is different. Calibration makes the same sign read the same way every time, so recognition is more accurate.',
    steps:['Flex range: hold your hands open, then make fists.','IMU zero: rest both hands flat and still on a table.','Hand fit: spread your fingers wide.','Sign samples: make 10 signs when the ring fills.','If a finger shows an error, follow the troubleshooting steps on screen.'],tip:'Calibrate again if the gloves feel different or accuracy drops.',tool:'cal'},
  per_s:{t:'Personalization',what:'This lets the gloves learn how you sign.',use:'People sign at different speeds and with their own style. Fixing mistakes and adjusting three sliders makes the gloves match you.',
    steps:['Check "Quick corrections". Tap "That\'s right" or pick the correct word under "Fix…".','Adjust signing speed, hold time and confidence limit. Tap "What is this for?" under each one.','Press "Update model on my hub glove" to save what you taught it.'],tip:'Change one slider at a time and test it in a conversation.',tool:'per'},
  ana_s:{t:'Data Analytics',what:'This is a summary of how well the gloves recognize your signs.',use:'Caregivers, teachers and therapists can see progress over time: accuracy, confidence and session summaries. The data is anonymized and shown here as sample data.',
    steps:['Open the tile and choose a time range.','Read the accuracy and confidence charts.','Look at the session summaries to see which signs need practice.'],tip:'Use it to decide what to practice or re-calibrate.',tool:'ana'},
  pair_p:{t:'Pairing & Onboarding',what:'This joins the signer\'s conversation and checks your microphone. You do not need the gloves.',use:'Your phone must be in the same session as the signer, and your microphone must work, so your voice can be turned into text.',
    steps:['Ask the signer for the session code (for example SECB-4829).','Type the code and press Join.','Allow the microphone and say a few words. The bar moves when it hears you.'],tip:'If the microphone is blocked, use "Use a simulated mic" to try the app anyway.',tool:'pair'},
  cal_p:{t:'Calibration',what:'This measures your normal speaking voice.',use:'The app shows the signer your tone (calm, cheerful, concerned and so on) by comparing your voice to your own normal pitch. Without calibration those tone cues are less accurate.',
    steps:['Stay in a quiet room. The app checks the background noise.','Speak in your normal voice for a few seconds.','Speak expressively, as if excited or worried.','Check the summary of your pitch range.'],tip:'Calibrate again if you move to a noisier place.',tool:'cal'},
  per_p:{t:'Personalization',what:'These are your reading and listening settings.',use:'Make the conversation comfortable for you: text size, how fast the voice speaks, how sensitive the tone cue is, and the language you speak.',
    steps:['Pick a text size that is easy to read.','Choose a voice speed for text-to-speech.','Set tone sensitivity: Low, Medium or High.','Choose English, Tagalog or Auto for speech-to-text.'],tip:'Changes are saved automatically.',tool:'per'},
  ana_p:{t:'Data Analytics',what:'This is a summary of your conversations.',use:'See how many messages were exchanged and how well they were understood. It is sample data in this prototype.',
    steps:['Open the tile and choose a time range.','Read the charts and summaries.'],tip:'The numbers are samples until the app is connected to a database.',tool:'ana'},
  dev_L:{t:'Left Spoke Glove',what:'The glove on your left hand. It has 5 finger (flex) sensors and a motion sensor.',use:'It sends your finger and hand movements to the Right Hub Glove over a short wireless link (ESP-NOW), so both hands are read together.',
    steps:['A green dot means it is linked. The battery percentage next to it shows how much charge is left. Charge the glove when it shows Low (20% or less).','"Not paired" means you still need to pair it. Open Pairing & Onboarding.'],tip:'It does not talk to your phone directly. Only the hub does.'},
  dev_R:{t:'Right Hub Glove',what:'The glove on your right hand. It has the same sensors as the left, plus the small brain of the system.',use:'It combines both hands, recognizes your signs, and talks to your phone over Bluetooth.',
    steps:['A green dot means it is connected to your phone. The battery percentage next to it shows how much charge is left. Charge the glove when it shows Low (20% or less).','"Not paired" means you still need to pair it. Open Pairing & Onboarding.'],tip:'Keep it charged. It runs the recognition model.'},
  dev_S:{t:'Session',what:'Your connection to the signer\'s conversation.',use:'You and the signer must be in the same session so your voice reaches them and their signs reach you.',
    steps:['"Not joined" means you have not entered the session code yet.','Open Pairing & Onboarding and type the code from the signer.'],tip:'The demo code is SECB-4829.'},
  dev_M:{t:'Microphone',what:'Your phone\'s microphone.',use:'It listens to your voice so the app can turn it into text and measure your tone. Voice messages are recorded with it too.',
    steps:['"Ready" means the microphone works.','"Not checked" means you have not tested it yet. Open Pairing & Onboarding and say a few words.'],tip:'If your browser asks for microphone permission, choose Allow.'}
};
const GUIDE=[
  {t:'Welcome',h:'<p>This app is the companion for the <b>Smart Expressive Communication Band</b>. It helps a person who signs and a person who hears talk to each other.</p><ul><li>The signer wears two gloves. Their signs become <b>text and voice</b>.</li><li>The hearing partner speaks. Their voice becomes <b>text</b>, with a <b>tone cue</b> (calm, cheerful, concerned…) that the signer can feel as a buzz.</li></ul><p class="hp-n">No camera is used. Only the glove sensors and your voice.</p>'},
  {t:'Choose your mode',h:'<p>After you log in, pick how you will use the band today. You can change it later from the dashboard (the back arrow).</p><div class="hp-two"><div><b>Deaf / Mute Signer</b><span>You wear the gloves and sign.</span></div><div><b>Hearing Conversation Partner</b><span>You talk. Your phone microphone is used.</span></div></div>'},
  {t:'Set up in 4 steps',h:'<p>The dashboard has four tiles. Do them in this order. The next one to do is highlighted.</p><ol class="hp-o"><li><b>Pairing & Onboarding.</b> Connect the gloves (signer) or join the session and check the microphone (partner).</li><li><b>Calibration.</b> Teach the app your hands (signer) or your normal voice (partner).</li><li><b>Personalization.</b> Fine-tune to your style.</li><li><b>Data Analytics.</b> See progress and summaries.</li></ol>'},
  {t:'Start a conversation',h:'<div class="hp-two"><div><b>Signer</b><span>1. Sign with the gloves.<br>2. Your words appear as text.<br>3. Press Send or Speak.<br>4. Feel your partner\'s tone as a buzz.</span></div><div><b>Partner</b><span>1. Tap the mic and talk.<br>2. Tap again to stop.<br>3. Check the text, then press Send.<br>4. Turn on text-to-speech to hear the signer.</span></div></div><p class="hp-n">On a phone, the conversation opens as its own chat screen from the "Conversation" row on the dashboard.</p>'},
  {t:'Need help?',h:'<ul><li>Tap a <span class="hp-q" aria-hidden="true">?</span> button on the dashboard to learn what something is and how to use it.</li><li>Open this guide again any time with the <b>How to use</b> button.</li><li>Signers: after the gloves connect, the battery percentage of each glove is shown on the dashboard.</li><li>Your data stays with you. There is no camera or video capture.</li></ul>'}
];
let hpOpener=null,hpKey=null;
function helpHidden(){try{return localStorage.getItem('secb.hideGuide')==='1'}catch(e){return false}}
function closeHelp(){const o=document.getElementById('hp');if(!o)return;document.removeEventListener('keydown',hpKey,true);o.remove();
  let f=hpOpener;if(f&&!f.isConnected&&f.dataset&&f.dataset.help)f=document.querySelector('[data-help="'+f.dataset.help+'"]');if(f&&f.focus)try{f.focus()}catch(e){}hpOpener=null}
function helpDialog(kicker,title,html,bind){closeHelp();hpOpener=document.activeElement;
  const o=document.createElement('div');o.className='hp-ov';o.id='hp';
  o.innerHTML=`<div class="hp" role="dialog" aria-modal="true" aria-labelledby="hp-t"><header class="hp-h"><div><p class="hp-k">${kicker}</p><h2 id="hp-t">${title}</h2></div><button class="hp-x" id="hp-x" type="button" aria-label="Close">${icon('x')}</button></header><div class="hp-b" id="hp-b">${html}</div></div>`;
  (document.getElementById('vp')||document.body).appendChild(o);
  hpKey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeHelp()}
    else if(e.key==='Tab'){const f=[...o.querySelectorAll('button:not([disabled]),input,a[href]')].filter(x=>x.offsetParent!==null);if(!f.length)return;const a=f[0],z=f[f.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}};
  document.addEventListener('keydown',hpKey,true);
  o.addEventListener('mousedown',e=>{if(e.target===o)closeHelp()});$('#hp-x').onclick=closeHelp;if(bind)bind(o);$('#hp-x').focus()}
function openHelp(key,opener){const s=(typeof state!=='undefined'&&state.mode==='partner')?'p':'s';
  const H=HELP[key]||HELP[key+'_'+s];if(!H)return;
  const html=`<section><h3>What is this?</h3><p>${H.what}</p></section><section><h3>What is it for?</h3><p>${H.use}</p></section><section><h3>How to use it</h3><ol class="hp-o">${H.steps.map(x=>`<li>${x}</li>`).join('')}</ol></section>${H.tip?`<p class="hp-n">${icon('info','sm')} <span><b>Tip:</b> ${H.tip}</span></p>`:''}
    <div class="hp-f">${H.tool&&typeof openTool==='function'?`<button class="btn primary" id="hp-go" type="button">Open ${H.t}</button>`:''}<button class="btn" id="hp-ok" type="button">Got it</button></div>`;
  if(opener)hpOpener=opener;const keep=opener;
  helpDialog('Help',H.t,html,o=>{$('#hp-ok').onclick=closeHelp;const g=$('#hp-go');if(g)g.onclick=()=>{const t=H.tool;hpOpener=null;closeHelp();openTool(t)}});if(keep)hpOpener=keep}
function openGuide(first){let i=0;const hide=helpHidden();
  function draw(){const g=GUIDE[i],last=i===GUIDE.length-1,b=$('#hp-b');
    b.innerHTML=`<div class="hp-dots" aria-hidden="true">${GUIDE.map((_,k)=>`<i class="${k<i?'d':k===i?'c':''}"></i>`).join('')}</div><p class="hp-k" aria-live="polite">Step ${i+1} of ${GUIDE.length}</p><h3 class="hp-st">${g.t}</h3><div class="hp-c">${g.h}</div>
      ${last?`<label class="hp-chk"><input type="checkbox" id="hp-hide" ${helpHidden()?'checked':''}> Don't show this guide automatically after I log in</label>`:''}
      <div class="hp-f"><button class="btn" id="hp-back" type="button" ${i?'':'disabled'}>Back</button>${last?'':'<button class="btn link" id="hp-skip" type="button">Skip</button>'}<button class="btn primary" id="hp-next" type="button">${last?'Get started':'Next'}</button></div>`;
    $('#hp-back').onclick=()=>{i--;draw();$('#hp-next').focus()};
    $('#hp-next').onclick=()=>{if(last){fin()}else{i++;draw();$('#hp-next').focus()}};
    const sk=$('#hp-skip');if(sk)sk.onclick=fin;
    const hd=$('#hp-hide');if(hd)hd.onchange=()=>{try{localStorage.setItem('secb.hideGuide',hd.checked?'1':'0')}catch(e){}}}
  function fin(){closeHelp()}
  helpDialog(first?'Welcome':'Guide','How to use this app','',draw0=>draw());}