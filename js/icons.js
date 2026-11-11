'use strict';
/* icons.js: injects the SVG icon sprite so every page can use <use href="#i-name"> */
(function(){const SPRITE=`<svg width="0" height="0" style="position:absolute" aria-hidden="true">
<defs>
<symbol id="i-hand" viewBox="0 0 64 64"><path d="M20 30 L20 16 a4 4 0 018 0 V28"/><path d="M28 28 L28 12 a4 4 0 018 0 V28"/><path d="M36 28 L36 14 a4 4 0 018 0 V30"/><path d="M44 32 L44 20 a3.5 3.5 0 017 0 V34"/><path d="M20 30 q-8 2 -8 14 v4 a14 14 0 0014 14 h14 a14 14 0 0014-14 v-14 a3.5 3.5 0 00-7 0"/></symbol>
<symbol id="i-ble" viewBox="0 0 24 24"><path d="M7 7l10 10-5 5V2l5 5L7 17"/></symbol>
<symbol id="i-cal" viewBox="0 0 24 24"><path d="M4 6h8M16 6h4M4 12h4M12 12h8M4 18h10M18 18h2"/><circle cx="14" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="16" cy="18" r="2"/></symbol>
<symbol id="i-person" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5M18 4v5M15.5 6.5h5"/></symbol>
<symbol id="i-chart" viewBox="0 0 24 24"><path d="M4 20V4M4 20h16M8 16l4-5 3 3 5-7"/></symbol>
<symbol id="i-mic" viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/></symbol>
<symbol id="i-spk" viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/></symbol>
<symbol id="i-vib" viewBox="0 0 24 24"><rect x="8" y="4" width="8" height="16" rx="2"/><path d="M4 8v8M20 8v8M2 10.5v3M22 10.5v3"/></symbol>
<symbol id="i-back" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></symbol>
<symbol id="i-x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></symbol>
<symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5"/></symbol>
<symbol id="i-moon" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/></symbol>
<symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
<symbol id="i-send" viewBox="0 0 24 24"><path d="M4 12l16-8-6 16-2-7-8-1z"/></symbol>
<symbol id="i-lock" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></symbol>
<symbol id="i-play" viewBox="0 0 24 24"><path d="M7 5l12 7-12 7z"/></symbol>
<symbol id="i-stop" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></symbol>
<symbol id="i-users" viewBox="0 0 24 24"><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 19c.5-3.2 2.7-5 5.5-5s5 1.8 5.5 5M15 14.3c2.6-.4 5 1 5.5 4.7"/></symbol>
<symbol id="i-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></symbol>
</defs></svg>`;document.body.insertAdjacentHTML('afterbegin',SPRITE)})();
