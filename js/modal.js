'use strict';
/* modal.js: sheet/dialog framework used by every tool (focus trap, Escape, cleanup of timers) */
/* ---------- modal framework ---------- */
let cur=null,lastFocus=null;
function openModal(kicker,title,fn){closeModal(true);lastFocus=document.activeElement;const ov=$('#overlay'),sh=$('#sheet');
  sh.innerHTML=`<header class="sh-head"><div><p class="kicker">${kicker}</p><h2 id="sh-title">${title}</h2></div><button class="icon-btn" id="sh-close" aria-label="Close">${icon('x')}</button></header><div class="sh-body" id="sh-body"></div>`;
  ov.hidden=false;document.body.classList.add('lock');
  const api={cleanups:[],close:()=>closeModal(),every(f,ms){const t=setInterval(f,ms);this.cleanups.push(()=>clearInterval(t));return t},later(f,ms){const t=setTimeout(f,ms);this.cleanups.push(()=>clearTimeout(t));return t},bars(h,o){const b=makeBars(h,o);this.cleanups.push(()=>b.destroy());return b}};
  cur=api;$('#sh-close').onclick=()=>closeModal();fn($('#sh-body'),api);$('#sh-close').focus()}
function closeModal(silent){if(cur){cur.cleanups.forEach(f=>f());cur=null}const ov=$('#overlay');if(ov.hidden)return;ov.hidden=true;document.body.classList.remove('lock');
  if(!silent){if(state.mode)renderTiles();if(lastFocus&&lastFocus.focus)try{lastFocus.focus()}catch(e){}}}
$('#overlay').addEventListener('mousedown',e=>{if(e.target.id==='overlay')closeModal()});
document.addEventListener('keydown',e=>{if($('#overlay').hidden)return;if(e.key==='Escape')closeModal();
  if(e.key==='Tab'){const f=$$('button:not([disabled]),input,select,[tabindex="0"]','#sheet').filter(x=>x.offsetParent!==null);if(!f.length)return;const a=f[0],z=f[f.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}});
