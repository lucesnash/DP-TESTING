'use strict';
/* ui.js: shared drawing helpers (emotion faces, haptic pattern, finger-bend bars, step header, progress ring, battery) */
function face(k){const m={cheerful:'<path d="M8.5 14.5c1 1.6 2.2 2.3 3.5 2.3s2.5-.7 3.5-2.3"/>',calm:'<path d="M9 15.2c1.8 1 4.2 1 6 0"/>',concerned:'<path d="M9 16h6M8 9.2l2.2-.8M16 9.2l-2.2-.8"/>',urgent:'<ellipse cx="12" cy="15.8" rx="1.9" ry="2.3"/><path d="M8 8l2.4.7M16 8l-2.4.7"/>',sad:'<path d="M8.8 16.8c1-1.5 2.1-2.2 3.2-2.2s2.2.7 3.2 2.2"/>'};
  return `<svg class="face" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><circle cx="9" cy="10.8" r=".7" fill="currentColor"/><circle cx="15" cy="10.8" r=".7" fill="currentColor"/>${m[k]||'<path d="M9 15.5h6"/>'}</svg>`}
function patHTML(k){const p=(EMO[k]||{pat:[120]}).pat;return `<span class="pat" aria-hidden="true">${p.map((d,i)=>i%2?`<b style="width:${Math.max(4,d/30)}px"></b>`:`<i style="width:${Math.max(8,d/12)}px"></i>`).join('')}</span>`}
function emoChip(k,hz){if(!k)return `<span class="emo e-none">Typed text</span>`;return `<span class="emo e-${k}">${face(k)}${EMO[k].label}${hz?` · ${Math.round(hz)} Hz`:''}</span>`}


/* ---------- finger bars ---------- */
const barSets=new Set();let barTimer=null;
function makeBars(host,o={}){const groups=o.groups||['L','R'];const L=['T','I','M','R','P'],N={T:'Thumb',I:'Index',M:'Middle',R:'Ring',P:'Pinky'};
  host.innerHTML=groups.map(g=>`<div class="bg"><div class="bg-g">${L.map(l=>`<div><div class="fb" title="${N[l]}"><i></i></div><div class="fl">${l}</div></div>`).join('')}</div>${o.names===false?'':`<div class="bn">${g==='L'?'Left · Spoke':'Right · Hub'}</div>`}</div>`).join('');
  const fills=$$('.fb i',host),n=fills.length;const b={cur:Array(n).fill(15),tgt:Array(n).fill(15),set(a){this.tgt=a.slice(0,n)},flag(i,on){const f=fills[i];if(f&&f.parentElement)f.parentElement.classList.toggle('bad',on!==false)},destroy(){barSets.delete(b)}};
  b.fills=fills;barSets.add(b);if(!barTimer)barTimer=setInterval(tickBars,110);return b}
function tickBars(){if(!barSets.size){clearInterval(barTimer);barTimer=null;return}
  barSets.forEach(b=>{b.fills.forEach((f,i)=>{b.cur[i]+=(b.tgt[i]-b.cur[i])*.4+(RM?0:rnd(-2.2,2.2));b.cur[i]=Math.max(3,Math.min(98,b.cur[i]));f.style.height=b.cur[i]+'%'})})}
const IDLE=()=>Array.from({length:10},()=>rnd(10,22));


const stepsHTML=(n,i,names)=>`<div class="steps" aria-hidden="true">${Array.from({length:n},(_,j)=>`<i class="${j<i?'done':j===i?'cur':''}"></i>`).join('')}</div><div class="stepname"><span>Step ${Math.min(i+1,n)} of ${n}</span><span>${names[Math.min(i,n-1)]}</span></div>`;

/* ring helper */
const ringHTML=(label,sub='')=>`<div class="ringbox"><svg width="176" height="176" viewBox="0 0 176 176" aria-hidden="true"><circle cx="88" cy="88" r="78" fill="none" stroke="var(--line)" stroke-width="10"/><circle id="rg" cx="88" cy="88" r="78" fill="none" stroke="var(--teal)" stroke-width="10" stroke-linecap="round" stroke-dasharray="490" stroke-dashoffset="490" transform="rotate(-90 88 88)"/></svg><div class="mid"><b id="rg-l">${label}</b><small class="muted">${sub}</small></div></div>`;
function runRing(api,ms,onTick,onDone){const t0=performance.now();const id=api.every(()=>{const p=Math.min(1,(performance.now()-t0)/ms);const r=$('#rg');if(r)r.style.strokeDashoffset=490*(1-p);if(onTick)onTick(p);if(p>=1){clearInterval(id);onDone()}},50)}

/* ---------- battery ---------- */
function batHTML(p){p=Math.round(p);
  return `<span class="bat-ic" role="img" aria-label="Battery ${p} percent"><i style="width:${p}%"></i></span><b>${p}%</b>${p<=Battery.LOW?' <em>Low</em>':''}`}
function fillBat(){
  $$('[data-bat]').forEach(el=>{
    const k=el.dataset.bat,p=Battery.level[k];
    el.className='bat '+(p<=15?'bad':p<=30?'warn':'ok');
    el.innerHTML=state.paired?batHTML(p):'';
  });
}