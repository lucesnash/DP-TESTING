'use strict';
/* store.js: browser storage + the shared app state.
   Session  = who is logged in and which mode they chose (cleared when the tab closes).
   Store    = small key/value storage in this browser (used by the "local" demo adapters).
   state    = the live app state. Keys listed in PERSIST are saved automatically through DataService. */

const Store={
  get(k,d){try{const v=localStorage.getItem('secb.'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},
  set(k,v){try{localStorage.setItem('secb.'+k,JSON.stringify(v))}catch(e){}},
  del(k){try{localStorage.removeItem('secb.'+k)}catch(e){}}
};

const Session={
  get(){try{return JSON.parse(sessionStorage.getItem('secb.session')||'{}')}catch(e){return {}}},
  set(patch){try{sessionStorage.setItem('secb.session',JSON.stringify(Object.assign(Session.get(),patch)))}catch(e){}},
  clear(){try{sessionStorage.removeItem('secb.session')}catch(e){}}
};

const PERSIST=['paired','joined','mic','calibrated','accuracy','voiceCal','cal','corrections','queued','modelVer','threshold','hold','speed','ttsOn','ttsRate','sens','msgScale','voice','lang','micSim','sl'];

const state=(()=>{
  const defaults={user:'Maria',mode:null,paired:false,joined:false,mic:false,calibrated:false,voiceCal:false,voice:null,lang:'auto',sl:'asl',micSim:false,accuracy:null,
    corrections:0,queued:3,modelVer:'1.3',threshold:70,hold:0.6,speed:50,ttsOn:false,ttsRate:1,sens:'Medium',
    convo:[],busy:false,demo:null,draft:'',lineIdx:0,sigIdx:0,vocIdx:0};
  const saved=Store.get('profile.'+(Session.get().id||'guest'),{});
  const target=Object.assign({},defaults,saved);
  return new Proxy(target,{set(t,k,v){
    t[k]=v;
    if(PERSIST.includes(k)&&typeof DataService!=='undefined'){DataService.saveProfile(PERSIST.reduce((o,p)=>{if(t[p]!==undefined)o[p]=t[p];return o},{}))}
    return true}});
})();

/* Battery: remaining charge of each glove, 0-100.
   Local demo: drains slowly while the gloves are paired.
   Real gloves: call Battery.set(leftPercent, rightPercent) when BLE data arrives
   (the hub sends its own level and the spoke's level, e.g. in the standard BLE Battery Level characteristic 0x2A19). */
const Battery={
  level:{L:82,R:74},LOW:20,_warned:{L:false,R:false},_subs:[],_t:null,
  onChange(f){this._subs.push(f)},
  set(L,R){
    if(L!=null)this.level.L=Math.max(0,Math.min(100,L));
    if(R!=null)this.level.R=Math.max(0,Math.min(100,R));
    this._subs.forEach(f=>f(this.level));
  },
  start(){
    if(this._t)return;
    this._t=setInterval(()=>{if(state.paired)this.set(this.level.L-.2,this.level.R-.3)},5000);
  }
};