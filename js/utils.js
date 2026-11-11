'use strict';
/* utils.js: tiny helpers, toast and light/dark theme toggle (loaded on every page) */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const rnd=(a,b)=>a+Math.random()*(b-a);
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const icon=(n,c='')=>`<svg class="ic ${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const nowT=()=>new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});


let toastT;function toast(m){const t=$('#toast');if(!t)return;t.textContent=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2600)}


/* ---------- theme ---------- */
function effTheme(){const d=document.documentElement.dataset.theme;return d||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}
function themeIcons(){const dark=effTheme()==='dark';$$('[data-theme-toggle] use').forEach(u=>u.setAttribute('href',dark?'#i-sun':'#i-moon'))}
$$('[data-theme-toggle]').forEach(b=>b.addEventListener('click',()=>{document.documentElement.dataset.theme=effTheme()==='dark'?'light':'dark';themeIcons();if(typeof cur!=='undefined'&&cur&&cur.onTheme)cur.onTheme()}));
themeIcons();
