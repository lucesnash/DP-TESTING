# Smart Expressive Communication Band: companion app prototype

Open `index.html` in a browser (or serve the folder, for example `python3 -m http.server`). Open `preview.html` to see the pages inside phone, tablet and desktop frames.

## Pages (one HTML file per screen)
| File | Screen | Scripts it loads |
|---|---|---|
| `index.html` | 1. Log in / Sign up | utils, icons, store, data-service, auth, login |
| `mode.html` | 2. Mode selection | utils, icons, store, auth, mode |
| `dashboard.html` | 3. Dashboard (4 tiles + live conversation) | utils, icons, store, data, data-service, ui, modal, live, tool-*, dashboard |
| `preview.html` | Device-frame viewer (not part of the app) | preview |

## CSS
`base.css` tokens, buttons, shared parts · `login.css` · `mode.css` · `dashboard.css` · `modal.css` (tool sheets) · `responsive.css` (phone refinements, always loaded last) · `preview.css`

## JS
- `store.js` browser storage, session, shared app state (saved automatically)
- `auth.js` sign up, log in, log out
- `data-service.js` every database read/write: profile, calibration, corrections, analytics
- `data.js` demo content and sample analytics numbers
- `live.js` the live conversation demo (signer view and partner view)
- `tool-pairing.js`, `tool-calibration.js`, `tool-personalization.js`, `tool-analytics.js` the four tiles
- `ui.js`, `modal.js`, `utils.js`, `icons.js` shared helpers

## Connecting a database
Only two files talk to storage. Both start in `local` mode (data stays in the browser) so the prototype runs with no server.
1. In `js/auth.js` and `js/data-service.js`, set `CFG.mode = 'api'` and `CFG.apiBase` to your backend.
2. Build the routes listed above each method: `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`, `PUT /profile`, `POST /calibration`, `POST /corrections`, `GET /analytics?period=7|30`.
3. Create the tables in `database/schema.sql`.

The local login hashes passwords in the browser only so they are not stored as plain text. A real backend must hash on the server and use a secure session cookie.


## Hearing partner: real microphone and Messenger-style chat (update)

- `js/mic.js` is new. It opens the microphone with `getUserMedia`, measures level (RMS) and pitch (autocorrelation) and classifies tone against the pitch baseline saved during partner calibration. Speech-to-text uses the browser's SpeechRecognition where it exists (Chrome, Edge, Safari); on other browsers the partner types and the tone is still attached to the message.
- Partner calibration has three real steps: room noise, normal voice, expressive voice. Results are saved as `voice` in the profile and as `calibration.<uid>.voice` through `DataService.saveCalibration({kind:'voice'})`.
- The microphone only works on `https://` or `http://localhost`. Opening the files directly (file://) or a sandboxed preview may block it; the app then offers "Use a simulated mic".
- On phone widths (640px and below) the conversation is a separate full-screen chat, opened from the "Conversation" row on the dashboard (back arrow returns). On tablet and desktop it stays a side panel.
