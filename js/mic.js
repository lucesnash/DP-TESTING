'use strict';
/* mic.js: real microphone for the hearing partner (Web Audio level + pitch, tone from calibrated baseline, SpeechRecognition when the browser has it, TTS). Needs https or localhost. */
/* ---------- microphone ---------- */
/* Real device microphone: level (RMS), pitch (autocorrelation) and a simple tone classifier.
   Audio is analysed in memory only and is never recorded or uploaded. */
function detectPitch(x,sr){
  const N=1024,minLag=Math.floor(sr/400),maxLag=Math.min(Math.floor(sr/70),x.length-N-1);
  let e0=0;for(let i=0;i<N;i++)e0+=x[i]*x[i];
  if(e0<1e-4)return 0;
  const nac=new Float32Array(maxLag+2);let best=0;
  for(let lag=minLag;lag<=maxLag;lag++){
    let c=0,e1=0;for(let i=0;i<N;i++){const b=x[i+lag];c+=x[i]*b;e1+=b*b}
    nac[lag]=c/Math.sqrt(e0*e1+1e-12);if(nac[lag]>best)best=nac[lag];
  }
  if(best<0.6)return 0;
  for(let lag=minLag+1;lag<maxLag;lag++){if(nac[lag]>=best*0.88&&nac[lag]>=nac[lag-1]&&nac[lag]>=nac[lag+1])return sr/lag}
  return 0;
}
const Mic=(()=>{
  let stream=null,ctx=null,an=null,buf=null,mr=null,chunks=[],t0=0;
  const SRC=window.SpeechRecognition||window.webkitSpeechRecognition;
  const api={
    supported:!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia),
    stt:!!SRC,SRC,error:null,
    get active(){return !!stream},
    async start(){
      if(stream)return true;
      if(!api.supported){api.error={name:'NotSupportedError'};return false}
      try{
        stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:false}});
        const AC=window.AudioContext||window.webkitAudioContext;ctx=new AC();
        if(ctx.state==='suspended')await ctx.resume().catch(()=>{});
        an=ctx.createAnalyser();an.fftSize=2048;ctx.createMediaStreamSource(stream).connect(an);buf=new Float32Array(an.fftSize);
        api.error=null;return true;
      }catch(e){api.error=e;try{stream&&stream.getTracks().forEach(t=>t.stop())}catch(_){}stream=ctx=an=buf=null;return false}
    },
    canRecord:!!window.MediaRecorder,
    recStart(){try{if(!stream||!window.MediaRecorder)return false;chunks=[];const mt=['audio/webm;codecs=opus','audio/webm','audio/mp4'].find(t=>MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(t));
      mr=new MediaRecorder(stream,mt?{mimeType:mt}:undefined);mr.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};t0=Date.now();mr.start(250);return true}catch(e){mr=null;return false}},
    elapsed(){return t0?Date.now()-t0:0},
    recStop(){return new Promise(res=>{const m=mr;if(!m||m.state==='inactive'){mr=null;res(null);return}const ms=Date.now()-t0;
      m.onstop=()=>{const blob=new Blob(chunks,{type:m.mimeType||'audio/webm'});mr=null;res(blob.size?{blob,url:URL.createObjectURL(blob),ms}:null)};try{m.stop()}catch(e){mr=null;res(null)}})},
    stop(){try{stream&&stream.getTracks().forEach(t=>t.stop())}catch(e){}try{ctx&&ctx.close()}catch(e){}stream=ctx=an=buf=null},
    read(){
      if(!an)return {rms:0,pitch:0};
      an.getFloatTimeDomainData(buf);let s=0;for(let i=0;i<buf.length;i++)s+=buf[i]*buf[i];
      const rms=Math.sqrt(s/buf.length);return {rms,pitch:rms>0.012?detectPitch(buf,ctx.sampleRate):0};
    },
    explain(){
      const n=api.error&&api.error.name;
      if(n==='NotAllowedError'||n==='SecurityError')return "Microphone access is blocked. Allow it from the lock icon in your browser's address bar, then try again.";
      if(n==='NotFoundError'||n==='OverconstrainedError')return 'No microphone was found on this device.';
      if(n==='NotReadableError')return 'Another app is using the microphone. Close it and try again.';
      return 'This page cannot use the microphone here. It needs a secure (https) page and a supported browser.';
    }
  };
  return api;
})();
/* drop octave jumps: accept a pitch only if it is close to the recent median */
const steady=(arr,p)=>{if(arr.length<5)return true;const m=median(arr.slice(-9));return p>m*.72&&p<m*1.4};
const mean=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:0;
const pct=(a,p)=>{if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.floor(p*s.length))]};
const median=a=>pct(a,.5);
function summarize(pitches,rmsL){
  if(pitches.length<4)return null;
  const m=mean(pitches),sd=Math.sqrt(mean(pitches.map(v=>(v-m)*(v-m))));
  return {pitch:median(pitches),rms:mean(rmsL)||0.03,std:sd};
}
/* Tone from pitch and energy relative to the person's own calibrated baseline.
   The final system uses a trained classifier; this is a readable stand-in for the prototype. */
function classifyTone(st){
  const v=state.voice||{},base=v.baseHz||170,baseRms=v.baseRms||0.05;
  const r=st.pitch/base,e=st.rms/baseRms,k={Low:1.4,Medium:1,High:.7}[state.sens]||1,t=.1*k;
  if(r>1+t*.8&&e>1.4)return 'urgent';
  if(r>1+t||(st.std/base>.2&&r>1))return 'cheerful';
  if(r<1-t*1.2&&e<.85)return 'sad';
  if(r<1-t*.6)return 'concerned';
  return 'calm';
}
function makeWave(sel){
  const hist=[];
  return {push(l){hist.push(l);if(hist.length>28)hist.shift();const bars=$$(sel+' i');bars.forEach((b,i)=>{const v=hist[hist.length-bars.length+i]||0;b.style.height=(6+Math.min(1,v*6)*40)+'px'})},clear(){hist.length=0;this.push(0)}};
}