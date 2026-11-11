'use strict';
/* tool-analytics.js: [Data Analytics]. Caregiver/therapist summary built from anonymized data. */
function lineChart(host,d){const W=Math.max(280,host.clientWidth),H=210,pl=34,pr=16,pt=16,pb=28,mn=70,mx=100,n=d.acc.length;
  const x=i=>pl+(W-pl-pr)*i/(n-1),y=v=>pt+(H-pt-pb)*(1-(v-mn)/(mx-mn));
  const pts=d.acc.map((v,i)=>`${x(i).toFixed(1)},${y(v).toFixed(1)}`);const step=W<420?(n>8?3:2):(n>8?2:1);
  host.innerHTML=`<svg class="chart" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Recognition accuracy rose from ${d.acc[0]} to ${d.acc[n-1]} percent">
  ${[70,80,90,100].map(v=>`<line class="gridl" x1="${pl}" x2="${W-pr}" y1="${y(v)}" y2="${y(v)}"/><text x="${pl-6}" y="${y(v)+4}" text-anchor="end">${v}%</text>`).join('')}
  ${d.mk.map(i=>`<line class="mk" x1="${x(i)}" x2="${x(i)}" y1="${pt}" y2="${H-pb}"/><text x="${x(i)+4}" y="${pt+10}" style="fill:var(--amber)">Calibrated</text>`).join('')}
  <polygon class="ar" points="${x(0)},${H-pb} ${pts.join(' ')} ${x(n-1)},${H-pb}"/><polyline class="ln" points="${pts.join(' ')}"/>
  ${d.lab.map((l,i)=>i%step===0||i===n-1?`<text x="${x(i)}" y="${H-8}" text-anchor="${i===0?'start':i===n-1?'end':'middle'}">${l}</text>`:'').join('')}
  <circle class="pt" cx="${x(n-1)}" cy="${y(d.acc[n-1])}" r="5"/><text class="val" x="${x(n-1)}" y="${y(d.acc[n-1])-10}" text-anchor="end">${d.acc[n-1]}%</text></svg>`}
function analytics(){openModal('Data analytics','Progress summary for caregivers',(root,api)=>{
  let per=7,dataNow=null;
  async function draw(){const d=await DataService.getAnalytics(per);dataNow=d;root.innerHTML=`<div class="note">${icon('lock','sm')}<span>Anonymized summaries only. No message text, no raw sensor data and no names. Sample data for this prototype.</span></div>
  <div class="row sp"><div class="seg" role="group" aria-label="Period"><button data-p="7" aria-pressed="${per===7}">7 days</button><button data-p="30" aria-pressed="${per===30}">30 days</button></div><button class="btn sm" id="cp">Copy summary</button></div>
  <div class="kpis">${d.k.map(([v,l])=>`<div class="kpi"><b>${v}</b><small>${l}</small></div>`).join('')}</div>
  <div class="card"><b>Recognition accuracy over time</b><div id="ch"></div></div>
  <div class="card"><div class="row sp"><b>Accuracy by sign</b><span class="pill warn">3 need practice</span></div><div class="list" style="gap:8px">${SIGNACC.map(([n,v])=>`<div class="hb ${v<88?'flag':''}"><span>${n}</span><div class="meter"><i style="width:${v}%"></i></div><b>${v}%</b></div>`).join('')}</div></div>
  <div class="card"><b>Most confused pairs</b><div class="scroll-x"><table class="tbl"><tr><th>Pair</th><th>Times</th></tr>${CONF.map(([p,c])=>`<tr><td>${p}</td><td>${c}</td></tr>`).join('')}</table></div></div>
  <div class="card"><b>Session summaries</b><div class="scroll-x"><table class="tbl"><tr><th>Date</th><th>Length</th><th>Signs</th><th>Accuracy</th><th>Fixes</th></tr>${SESS.map(r=>`<tr>${r.map((c,i)=>`<td>${c}${i===3?'%':''}</td>`).join('')}</tr>`).join('')}</table></div></div>
  <div class="card"><div class="row sp"><b>Calibration quality</b><span class="pill ok">97%</span></div><small class="muted">Last calibrated Fri 23 Oct. Calibrate again if accuracy drops or the gloves are refitted.</small></div>`;
    $$('[data-p]').forEach(b=>b.onclick=()=>{per=+b.dataset.p;draw()});lineChart($('#ch'),d);
    $('#cp').onclick=()=>{const t=`Communication Band summary (${per} days): accuracy ${d.k[0][0]}, confidence ${d.k[1][0]}, latency ${d.k[2][0]}, sessions ${d.k[3][0]}. Practice: Water, Help, Family.`;
      try{navigator.clipboard.writeText(t).then(()=>toast('Summary copied'),()=>toast('Copy was blocked. Select the numbers to copy them.'))}catch(e){toast('Copy was blocked. Select the numbers to copy them.')}}}
  draw();cur.onTheme=()=>dataNow&&lineChart($('#ch'),dataNow);let rt;const rs=()=>{clearTimeout(rt);rt=setTimeout(()=>{const c=$('#ch');if(c)dataNow&&lineChart(c,dataNow)},150)};addEventListener('resize',rs);api.cleanups.push(()=>removeEventListener('resize',rs))})}
