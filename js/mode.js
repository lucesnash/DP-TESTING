'use strict';
/* mode.js: Screen 2 (mode.html). Stores the chosen mode in the session and opens the dashboard. */

if(!Session.get().id){location.replace('index.html')}   // not logged in
$$('.mode').forEach(b=>b.onclick=()=>{Session.set({mode:b.dataset.mode});location.href='dashboard.html'});
$('#logout').onclick=()=>{AuthService.logOut();location.href='index.html'};

/* "How to use" guide: opens by itself once after log in (unless the user ticked "don't show again"), and any time from the button. */
$('#how-m').onclick=()=>openGuide(false);
if(!Session.get().guide){Session.set({guide:1});if(!helpHidden())setTimeout(()=>openGuide(true),400)}