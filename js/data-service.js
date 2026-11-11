'use strict';
/* data-service.js: the ONLY place the app talks to a database.
   mode "local": everything is kept in this browser, so the prototype works with no server.
   mode "api"  : each call is sent to your backend (REST + JSON). Set DataService.CFG.mode = 'api' and CFG.apiBase.
   Suggested tables are in database/schema.sql. The routes expected from the backend are listed next to each method. */

const DataService={
  CFG:{mode:'local',apiBase:'/api'},

  _uid(){return Session.get().id||'guest'},
  _api(method,path,body){
    return fetch(this.CFG.apiBase+path,{method,headers:{'Content-Type':'application/json'},credentials:'include',body:body?JSON.stringify(body):undefined})
      .then(r=>{if(!r.ok)throw new Error('Request failed ('+r.status+')');return r.json()});
  },

  /* PUT /profile: pairing flags, calibration status, model version, personalization settings */
  saveProfile(profile){
    Store.set('profile.'+this._uid(),profile);
    if(this.CFG.mode==='api')this._api('PUT','/profile',profile).catch(()=>{});
  },

  /* POST /calibration: flex ranges, IMU offsets, hand-fit gains, sign-sample accuracy for this user */
  saveCalibration(cal){
    const row=Object.assign({at:new Date().toISOString()},cal);
    Store.set('calibration.'+this._uid()+(cal.kind==='voice'?'.voice':''),row);   // signer and partner calibrations are stored separately
    if(this.CFG.mode==='api')this._api('POST','/calibration',row).catch(()=>{});
  },

  /* POST /corrections: one row each time the signer confirms or corrects a recognized sign */
  saveCorrection(c){
    const row=Object.assign({at:new Date().toISOString()},c);
    const list=Store.get('corrections.'+this._uid(),[]);list.push(row);Store.set('corrections.'+this._uid(),list);
    if(this.CFG.mode==='api')this._api('POST','/corrections',row).catch(()=>{});
  },

  /* GET /analytics?period=7|30: anonymized accuracy, confidence, latency, per-sign accuracy, confusions, sessions */
  async getAnalytics(period){
    if(this.CFG.mode==='api')return this._api('GET','/analytics?period='+period);
    return AN[period];   // sample numbers from data.js
  }
};
