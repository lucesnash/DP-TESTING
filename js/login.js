'use strict';
/* login.js: Screen 1 (index.html). Validates the form, calls AuthService, then goes to mode.html. */

let signup=false;
function setTab(up){
  signup=up;
  $('#tab-in').setAttribute('aria-selected',!up);$('#tab-up').setAttribute('aria-selected',up);
  $('#f-name').hidden=!up;
  $('#form-h').textContent=up?'Create your account':'Welcome back';
  $('#form-sub').textContent=up?'It takes a minute. You will pair your gloves next.':'Log in to set up your gloves or join a conversation.';
  $('#login-btn').textContent=up?'Get Started':'Log In';
  $('#in-pw').autocomplete=up?'new-password':'current-password';
  $('#login-err').textContent='';
}
$('#tab-in').onclick=()=>setTab(false);
$('#tab-up').onclick=()=>setTab(true);

$('#pw-toggle').onclick=()=>{
  const i=$('#in-pw'),hidden=i.type==='password';
  i.type=hidden?'text':'password';
  $('#pw-toggle').textContent=hidden?'Hide':'Show';
  $('#pw-toggle').setAttribute('aria-label',hidden?'Hide password':'Show password');
};

function finish(user){
  Session.set({id:user.id,name:user.name,email:user.email,mode:null});
  location.href='mode.html';
}
const titleCase=s=>s.charAt(0).toUpperCase()+s.slice(1);

$('#login-form').addEventListener('submit',async e=>{
  e.preventDefault();
  const email=$('#in-email').value.trim(),password=$('#in-pw').value,err=$('#login-err');
  if(!/^\S+@\S+\.\S+$/.test(email)){err.textContent='Enter a valid email, such as maria@example.com.';$('#in-email').focus();return}
  if(password.length<8){err.textContent='Your password needs at least 8 characters.';$('#in-pw').focus();return}
  const btn=$('#login-btn');btn.disabled=true;err.textContent='';
  try{
    const user=signup
      ? await AuthService.signUp({name:$('#in-name').value.trim()||titleCase(email.split('@')[0]),email,password})
      : await AuthService.logIn({email,password});
    finish(user);
  }catch(x){err.textContent=x.message}
  finally{btn.disabled=false}
});
$('#demo-login').onclick=()=>finish(AuthService.demo());
