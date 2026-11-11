'use strict';
/* tour.js: first-time "game style" tutorial on the dashboard.
   The screen is dimmed, one part is highlighted, a card says what it is and what it is for,
   and the user taps anywhere to go to the next part. It runs once per user per mode and can be replayed
   with the play button in the dashboard header.  Keys: Enter / Space / Right arrow = next, Left arrow = back, Esc = skip. */
const Tour=(()=>{
  let ov=null,spot,tip,hint,steps=[],i=0,prev=null;
  const key=()=>'tour.'+(Session.get().id||'guest')+'.'+(state.mode||'x');
  const seen=()=>!!Store.get(key(),false);
  const mark=()=>Store.set(key(),true);

  function defs(){
    const s=state.mode==='signer';
    const conv=()=>phoneChat()?$('#convo-entry'):$('#live .chat-head');
    const tile=k=>()=>$('[data-tile="'+k+'"]');
    return [
      {t:'Welcome, '+esc(state.user)+'!',
        msg:s?'This quick tour shows what each part of the app does, so you can start signing with confidence. Tap anywhere to move on.'
             :'This quick tour shows what each part of the app does, so you can start talking with the signer. Tap anywhere to move on.'},
      s?{sel:'#devices',t:'Your gloves',is:'Two cards, one for the Left Spoke Glove and one for the Right Hub Glove. A green dot means linked, and the battery percentage shows how much charge is left.',use:'Check here that both gloves are connected and charged before you start signing.'}
       :{sel:'#devices',t:'Session and microphone',is:'Two cards that show if you joined the signer’s session and if your microphone is ready.',use:'Both must be ready so your voice can reach the signer as text.'},
      {sel:tile('pair'),t:'Pairing & Onboarding',
        is:s?'Connects your two gloves to your phone over Bluetooth.':'Joins the signer’s conversation and checks your microphone. You do not need the gloves.',
        use:s?'Do this first. Your signs cannot reach the app until the gloves are paired.':'Your phone must be in the same session as the signer, so your voice reaches them.'},
      {sel:tile('cal'),t:'Calibration',
        is:s?'Teaches the gloves your hand size and how far each finger bends.':'Measures your normal speaking voice.',
        use:s?'Makes the same sign read the same way every time, so recognition is more accurate.':'The signer sees your tone by comparing your voice with your own normal pitch.'},
      {sel:tile('per'),t:'Personalization',
        is:s?'Lets the gloves learn how you sign.':'Your reading and listening settings.',
        use:s?'Fix mistakes and adjust your signing speed, hold time and confidence limit.':'Choose text size, voice speed, speech language and tone sensitivity.'},
      {sel:tile('ana'),t:'Data Analytics',
        is:s?'A summary of how well the gloves recognize your signs.':'A summary of your conversations.',
        use:s?'Caregivers and therapists can follow progress, and you can see which signs need practice.':'See how many messages were exchanged and how well they were understood.'},
      {sel:conv,t:'Conversation',
        is:s?'Where you talk with your partner. It starts with a QR code for your partner to scan.':'Where you talk with the signer. You scan the signer’s QR code to join.',
        use:s?'Once your partner scans, your signs appear as text and speech, and you feel their tone as a buzz on your gloves.':'Tap the mic and talk. Your words become text, and your tone is sent to the signer’s gloves as a buzz.'},
      {sel:'#how-d',t:'Help',is:'The ? buttons and the step-by-step guide.',use:'Tap a ? any time to learn what something is and how to use it.'},
      {sel:'#tour-btn',t:'Tutorial',is:'This play button replays the tour you are watching now.',use:'Open it any time you want a reminder.'},
      {sel:tile('pair'),t:'Let’s begin!',msg:s?'Start with Pairing & Onboarding, then Calibration. The next step is always highlighted on the dashboard. Tap anywhere to finish.'
                                              :'Start with Pairing & Onboarding, then Calibration. The next step is always highlighted on the dashboard. Tap anywhere to finish.'}
    ];
  }

  function place(el){
    if(!ov)return;
    const vw=innerWidth,vh=innerHeight,pad=8;
    const w=Math.min(360,vw-32);tip.style.width=w+'px';
    if(!el){
      spot.style.cssText='left:'+(vw/2)+'px;top:'+(vh/2)+'px;width:0;height:0';
      tip.classList.add('center');tip.style.left='';tip.style.top='';return;
    }
    tip.classList.remove('center');
    const r=el.getBoundingClientRect();
    spot.style.left=(r.left-pad)+'px';spot.style.top=(r.top-pad)+'px';
    spot.style.width=(r.width+pad*2)+'px';spot.style.height=(r.height+pad*2)+'px';
    const th=tip.offsetHeight,below=vh-(r.bottom+pad)-70,above=r.top-pad-16;
    let top;
    if(below>=th)top=r.bottom+pad+12;
    else if(above>=th)top=r.top-pad-12-th;
    else top=(r.top>vh/2)?16+(window.visualViewport?0:0):vh-th-70;
    top=Math.max(12,Math.min(top,vh-th-12));
    tip.style.top=top+'px';
    tip.style.left=Math.max(16,Math.min(r.left+r.width/2-w/2,vw-16-w))+'px';
  }

  function draw(){
    if(!ov)return;
    const st=steps[i],last=i===steps.length-1;
    let el=st.sel?(typeof st.sel==='function'?st.sel():$(st.sel)):null;
    if(el&&el.getClientRects().length===0)el=null;
    if(el)el.scrollIntoView({block:'center',inline:'nearest'});
    tip.innerHTML=`<div class="tr-dots" aria-hidden="true">${steps.map((_,k)=>`<i class="${k<i?'d':k===i?'c':''}"></i>`).join('')}</div>
      <p class="tr-k">Step ${i+1} of ${steps.length}</p><h2 id="tr-t">${st.t}</h2>
      ${st.msg?`<p class="tr-m">${st.msg}</p>`:`<p class="tr-r"><span>What it is</span>${st.is}</p><p class="tr-r"><span>What it’s for</span>${st.use}</p>`}`;
    hint.textContent=last?'Tap anywhere to finish':'Tap anywhere to continue';
    $('#tr-back').disabled=i===0;
    spot.classList.toggle('pulse',!!el);
    place(el);
  }

  function next(){if(i>=steps.length-1)return end();i++;draw()}
  function back(){if(i>0){i--;draw()}}
  function end(){
    if(!ov)return;
    document.removeEventListener('keydown',onKey,true);
    removeEventListener('resize',redo);removeEventListener('scroll',redo,true);
    ov.remove();ov=null;document.body.classList.remove('lock');mark();
    try{prev&&prev.isConnected&&prev.focus&&prev.focus({preventScroll:true})}catch(e){}
    window.scrollTo({top:0});
  }
  const redo=()=>{if(!ov)return;const st=steps[i];let el=st.sel?(typeof st.sel==='function'?st.sel():$(st.sel)):null;if(el&&el.getClientRects().length===0)el=null;place(el)};
  function onKey(e){
    if(!ov)return;
    if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();end()}
    else if(e.key==='ArrowLeft'){e.preventDefault();e.stopImmediatePropagation();back()}
    else if(e.key==='ArrowRight'||e.key==='Enter'||e.key===' '){
      if(document.activeElement&&document.activeElement.id==='tr-skip'&&e.key!=='ArrowRight')return;
      if(document.activeElement&&document.activeElement.id==='tr-back'&&e.key!=='ArrowRight')return;
      e.preventDefault();e.stopImmediatePropagation();next();
    }
  }

  function start(){
    if(ov)return;
    closeModal&&closeModal(true);try{closeHelp()}catch(e){}
    if(typeof chatOpen==='function'&&chatOpen())closeChat();
    steps=defs();i=0;prev=document.activeElement;
    ov=document.createElement('div');ov.className='tr-ov';ov.tabIndex=-1;
    ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-labelledby','tr-t');
    ov.innerHTML=`<div class="tr-spot"></div><div class="tr-top"><button class="btn sm" id="tr-back" type="button">Back</button><button class="btn sm" id="tr-skip" type="button">Skip tour</button></div><div class="tr-tip" aria-live="polite"></div><div class="tr-hint"></div>`;
    document.body.appendChild(ov);document.body.classList.add('lock');
    spot=$('.tr-spot',ov);tip=$('.tr-tip',ov);hint=$('.tr-hint',ov);
    ov.addEventListener('click',e=>{
      if(e.target.closest('#tr-skip')){end();return}
      if(e.target.closest('#tr-back')){back();return}
      next();
    });
    document.addEventListener('keydown',onKey,true);
    addEventListener('resize',redo);addEventListener('scroll',redo,true);
    window.scrollTo({top:0});
    draw();ov.focus({preventScroll:true});
  }

  return {start,end,seen,maybeStart(){if(!seen())setTimeout(()=>{if(!ov&&!(typeof cur!=='undefined'&&cur))start()},700)}};
})();