'use strict';
/* auth.js: sign up, log in, log out.
   mode "local": demo accounts are stored in this browser. Passwords are SHA-256 hashed here only so they are not stored as plain text;
                 a real system must hash on the server (bcrypt/argon2) and never trust the browser.
   mode "api"  : POST /auth/signup and POST /auth/login on your backend. Each should answer { user: { id, name, email } }
                 and set a secure, HTTP-only session cookie. */

const AuthService={
  CFG:{mode:'local',apiBase:'/api'},

  async _post(path,body){
    const r=await fetch(this.CFG.apiBase+path,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(body)});
    const j=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(j.message||'Something went wrong. Please try again.');
    return j.user;
  },
  async _hash(pw){
    try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(pw));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
    catch(e){return btoa(unescape(encodeURIComponent(pw)))}
  },

  async signUp({name,email,password}){
    if(this.CFG.mode==='api')return this._post('/auth/signup',{name,email,password});
    const users=Store.get('users',[]);
    if(users.some(u=>u.email===email.toLowerCase()))throw new Error('An account with this email already exists. Try logging in.');
    const u={id:'u'+Date.now().toString(36),name,email:email.toLowerCase(),pw:await this._hash(password),created:new Date().toISOString()};
    users.push(u);Store.set('users',users);
    return {id:u.id,name:u.name,email:u.email};
  },

  async logIn({email,password}){
    if(this.CFG.mode==='api')return this._post('/auth/login',{email,password});
    const u=Store.get('users',[]).find(x=>x.email===email.toLowerCase());
    if(!u||u.pw!==await this._hash(password))throw new Error('Email or password is incorrect. Check them and try again.');
    return {id:u.id,name:u.name,email:u.email};
  },

  demo(){return {id:'demo',name:'Maria',email:'demo@example.com'}},

  logOut(){
    if(this.CFG.mode==='api')fetch(this.CFG.apiBase+'/auth/logout',{method:'POST',credentials:'include'}).catch(()=>{});
    Session.clear();
  }
};
