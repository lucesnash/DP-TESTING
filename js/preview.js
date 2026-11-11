'use strict';
/* preview.js: puts the real pages inside a phone, tablet or desktop frame (iframe), scaled to fit the window. */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const DEV={phone:{w:390,h:800},tablet:{w:768,h:1024},desktop:{w:1280,h:760}};
let dev='phone',land=false;

function apply(){
  const d=$('#device'),vp=$('#vp'),sc=$('#scaler'),fit=$('#fit');
  d.dataset.d=dev;d.dataset.o=(land&&dev!=='desktop')?'land':'port';
  $$('[data-dev]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.dev===dev)));
  $('#rot').hidden=dev==='desktop';
  let {w,h}=DEV[dev];if(d.dataset.o==='land')[w,h]=[h,w];
  vp.style.width=w+'px';vp.style.height=h+'px';d.style.transform='none';
  const dw=d.offsetWidth,dh=d.offsetHeight,s=Math.min(1,(fit.clientWidth-32)/dw,(fit.clientHeight-32)/dh);
  d.style.transform='scale('+s+')';sc.style.width=dw*s+'px';sc.style.height=dh*s+'px';
  $('#dims').textContent=w+' × '+h+(s<.995?' · '+Math.round(s*100)+'%':'');
}
$$('[data-dev]').forEach(b=>b.onclick=()=>{dev=b.dataset.dev;land=false;apply()});
$('#rot').onclick=()=>{land=!land;apply()};
$('#pg').onchange=e=>{$('#vp').src=e.target.value};
let t;addEventListener('resize',()=>{clearTimeout(t);t=setTimeout(apply,80)});
apply();
