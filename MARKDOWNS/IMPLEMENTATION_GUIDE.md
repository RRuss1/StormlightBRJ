# HUMAN IMPLEMENTATION GUIDE
## Stormlight Chronicles — Frontend ↔ Backend Integration

---

## 1. FILE STRUCTURE

```
CYOAHUB/
├── index.html              ← Entry point (clean shell, Tailwind classes)
├── IMPLEMENTATION_GUIDE.md ← You are here
│
├── styles/
│   ├── base.css            ← Design tokens (:root vars), reset, typography
│   ├── animations.css      ← All keyframes + GSAP hooks
│   └── components.css      ← UI components (Card, Button, Panel, Slot, etc.)
│
├── app/
│   ├── gameState.js        ← Game constants (CLASSES, WEAPONS, SURGES…) + mutable state
│   ├── ui.js               ← Campaign/Lobby/Game/Audio/Language controllers
│   ├── combat.js           ← Combat engine (resolveRound, renderCombat…)
│   └── main.js             ← Boot + GSAP animation system + Lenis
│
└── api/
    └── client.js           ← All network calls (fetch wrapper, streaming, Sheets)
```

---

## 2. HOW TO SWITCH ENVIRONMENTS (Dev vs Prod)

Open `index.html` and find this block near the top:

```html
<script>
  window.STORMLIGHT_CONFIG = {
    apiUrl:  'https://cyoahub-proxy.rruss7997.workers.dev',  // ← PROD Worker
    wsUrl:   'wss://cyoahub-proxy.rruss7997.workers.dev/session',
    sheetId: '1f2lS_y0e4eZHYBX68QHJHG-8mmI9680nBNf1fG3ZdEw',
  };
</script>
```

**For local development** (run `wrangler dev`):
```js
window.STORMLIGHT_CONFIG = {
  apiUrl:  'http://localhost:8787',
  wsUrl:   'ws://localhost:8787/session',
  sheetId: '1f2lS_y0e4eZHYBX68QHJHG-8mmI9680nBNf1fG3ZdEw',
};
```

---

## 3. DATA FLOW: UI → Cloudflare Worker → Google Sheets → UI

```
Player clicks "Act →"
       │
       ▼
onSubmitAction() in ui.js
  • Rolls d20 locally
  • Calls callGM(turnPrompt) → POST to PROXY_URL
       │
       ▼
Cloudflare Worker (PROXY_URL)
  • Receives {model, messages, stream:true}
  • Proxies request to Anthropic Claude API
  • Streams SSE tokens back to browser
       │
       ▼
callGM() streams tokens → updates #story-text live
  • On complete: saves gState to Sheets via saveState()
  • saveState() → PUT to Google Sheets API
       │
       ▼
Google Sheets (SHEET_ID)
  • CampaignName_State sheet: stores JSON blob of gState
  • CampaignName_Log sheet: appends {type, who, text, choices, ts}
       │
       ▼
Other players' poll (setInterval 5s) or WebSocket state_sync
  • loadState() → GET from Sheets
  • renderAll(log) → updates all DOM
```

---

## 4. GOOGLE SHEETS STRUCTURE

Each campaign creates **2 sheets** named after the campaign ID:

### `CampaignName_State` sheet
| A1 |
|------|
| `{"phase":"playing","turn":3,"totalMoves":47,"players":[...],...}` |

Single cell — entire gState JSON. Worker reads A1, parses JSON, writes back.

### `CampaignName_Log` sheet
| type | who | text | choices | ts |
|------|-----|------|---------|-----|
| `gm` | `` | `The wind howls...` | `["Attack","Defend","Surge","Heal"]` | `2025-03-21T...` |
| `player` | `Kaladin` | `I charge forward...` | `[]` | `2025-03-21T...` |
| `system` | `` | `⏭ Turn skipped` | `[]` | `2025-03-21T...` |

---

## 5. CLOUDFLARE WORKER EXPECTED ENDPOINTS

The frontend currently calls `PROXY_URL` directly as an Anthropic proxy.
When you upgrade to the full Worker, implement these routes:

### `POST /` (current — Anthropic proxy)
```
Body:  { model, max_tokens, messages, stream }
Returns: SSE stream from Anthropic Claude
```

### `GET /campaigns`
```
Returns: [{id: "Campaign_X", state: {...gState}}]
Implementation: list all sheets, find *_State sheets, read A1 from each
```

### `POST /campaigns`
```
Body:  { name: "The Everstorm Accord" }
Returns: { id: "Campaign_EverstormAccord_a3f2", state: {...} }
Implementation: create 2 new sheets, save initial gState
```

### `DELETE /campaigns/:id`
```
Returns: { success: true }
Implementation: delete Campaign_X_State and Campaign_X_Log sheets
```

### `GET /state/:campaignId`
```
Returns: gState object
Implementation: read CampaignId_State!A1, JSON.parse
```

### `PUT /state/:campaignId`
```
Body:  { gState }
Returns: { success: true }
Implementation: JSON.stringify(gState), write to CampaignId_State!A1
```

### `GET /log/:campaignId?waitForGM=true`
```
Returns: [{type, who, text, choices, ts}]
waitForGM: if true, retry up to 6×1.5s waiting for a gm-type entry
Implementation: read CampaignId_Log!A:E, map rows to objects
```

### `POST /log/:campaignId`
```
Body:  { type, who, text, choices }
Returns: { success: true }
Implementation: append row to CampaignId_Log!A:E
```

### `GET /session` (WebSocket upgrade)
```
Upgrade to WebSocket
Messages: { type: "state_sync"|"slot_assigned"|"action_received"|... }
Implementation: Cloudflare Durable Objects for shared state
```

---

## 6. CURRENT ARCHITECTURE vs FUTURE ARCHITECTURE

### Current (what's running now)
```
Browser → PROXY_URL (Anthropic proxy only)
Browser → Google Sheets API directly (JWT auth with SA key)
Browser → WebSocket (Durable Objects session)
```

The SA private key is embedded in `app/gameState.js`.
This works but the key is visible to anyone who opens DevTools.

### Recommended upgrade path
```
Browser → Cloudflare Worker (all requests)
Worker  → Anthropic API      (GM calls)
Worker  → Google Sheets API  (state persistence)
Worker  → Durable Objects    (WebSocket sessions)
```

**To migrate**: move the Sheets JWT logic from `api/client.js` into the Worker.
Remove `const SA = {...}` from `gameState.js`.
All the Worker needs is the SA JSON as a **Cloudflare secret**:

```bash
wrangler secret put GOOGLE_SA_KEY
# paste the full SA JSON when prompted
```

---

## 7. OPTIMISTIC UPDATES vs SERVER RESPONSES

The frontend uses **optimistic updates** for performance:

1. **Player submits action** → turn counter increments locally, bottom zone switches to "loading" instantly
2. **callGM streams** → story text updates token-by-token
3. **On stream complete** → `saveAndBroadcast(gState)` writes to Sheets AND sends WS message
4. **Other players** receive `state_sync` WS message OR poll via `refreshGame()` every 5s

If the GM call fails, the `catch` in `callGM()` shows an error and does NOT advance state.
The 30s `_loadingTimer` in `onSubmitAction()` auto-resets `isLoading` to prevent UI freeze.

---

## 8. WEBSERVER REQUIREMENTS

To run locally, you need **any static file server** — the app has no build step:

```bash
# Option A: Python (simplest)
cd CYOAHUB
python3 -m http.server 3000

# Option B: VS Code Live Server extension
# Right-click index.html → "Open with Live Server"

# Option C: Node
npx serve .
```

Then open: `http://localhost:3000`

**Important**: The Tailwind CDN, GSAP, Alpine, and Lenis all load from CDN.
No npm install required. No build step.

---

## 9. DEPLOYING TO GITHUB PAGES

The project at `https://rruss1.github.io/CYOAHUB/` is served directly from GitHub.
To deploy updates:

```bash
# From the repo root
git add .
git commit -m "refactor: modular architecture"
git push origin main
```

GitHub Pages serves `index.html` → loads JS from `app/` → loads CSS from `styles/`.
All paths are relative — no configuration needed.

---

## 10. WHAT TAILWIND IS DOING vs CUSTOM CSS

| Concern | Where |
|---------|-------|
| Layout (flex, grid, gap, padding, margin) | Tailwind classes on HTML elements |
| Responsive breakpoints | Tailwind `md:`, `lg:` prefixes |
| Typography scale | Tailwind `text-sm`, `text-xl`, etc. |
| Colors (brand) | CSS variables via `style="color:var(--amber2)"` |
| Visual effects (gradients, shadows, glow) | `styles/components.css` |
| Keyframe animations | `styles/animations.css` |
| Design tokens | `styles/base.css` `:root` block |
| GSAP transitions | `app/main.js` |
| SVG animations | Inline CSS in `getSprenSVG()` in `ui.js` |

---

## 11. COMMON ISSUES

**Q: Campaign grid doesn't appear**
A: Check console for JWT errors. The SA key in `gameState.js` needs valid Google Sheets access.

**Q: "Lenis is not defined" error**
A: The jsdelivr CDN URL is correct (`cdn.jsdelivr.net/npm/lenis@1.1.13`). If it fails, check network.

**Q: Tailwind CDN warning "should not be used in production"**
A: Safe to ignore for this use case. For production with a build pipeline, install Tailwind as PostCSS plugin.

**Q: WebSocket connects but state doesn't sync**
A: Check `WS_URL` in `STORMLIGHT_CONFIG`. The Durable Objects Worker may be separate from the proxy Worker.

**Q: Combat choices don't appear (just skeletons)**
A: `generateCombatChoices()` calls Haiku via `PROXY_URL`. If the Worker is down, fallback choices from `buildCombatChoices()` should appear after a timeout.
