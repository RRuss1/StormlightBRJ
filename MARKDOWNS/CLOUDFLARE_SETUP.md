# Cloudflare Durable Objects — Complete Setup Guide
## Real-Time WebSocket Sync for Stormlight Chronicles

---

## Why We're Doing This

Currently the game polls Google Sheets every 5-15 seconds to detect other players' actions. This means:
- Turn transitions take 5-15 seconds after someone acts
- Everyone is constantly hammering the Sheets API
- No way to show "Joe is typing..." or "Ben just submitted"
- Combat feels sluggish waiting for everyone's actions to sync

After this upgrade:
- Turn transitions: **under 500ms**
- All actions visible to all players **instantly**
- Typing indicators, presence indicators, join/leave toasts
- Google Sheets becomes write-only persistence (backup), not source of truth

---

## Cost

**Free tier covers us entirely.**

Durable Objects with SQLite backend are free. Our game generates ~50-100 WebSocket messages per active session per day across 3-5 connections. We are orders of magnitude below any billing threshold.

Only need paid plan ($5/month) if we ever hit:
- 1 million DO requests/day
- 400,000 GB-seconds of compute/month

We won't.

---

## Architecture After This Change

```
Before:
  Browser → saveState() → Google Sheets
  Browser → setInterval(5000) → loadState() → Google Sheets

After:
  Browser → WebSocket → Cloudflare Durable Object (per campaign)
                              │
                              ├── Broadcasts to ALL connected players instantly
                              └── Async write to Google Sheets (persistence)
```

One Durable Object instance per active campaign. It holds all player WebSocket connections simultaneously. When any player acts, the DO broadcasts the new state to everyone in under 500ms. Google Sheets remains as the save file — if everyone disconnects and reconnects, they load from Sheets.

---

## Prerequisites

- Node.js 16.17.0 or later — check with `node --version`
- A Cloudflare account (free) — https://dash.cloudflare.com/sign-up
- The existing `stormlight-proxy` Worker already deployed

---

## STEP 1 — Install Wrangler CLI

Wrangler is Cloudflare's CLI for deploying Workers.

```bash
npm install -g wrangler
wrangler --version
# Should show something like: 3.x.x
```

---

## STEP 2 — Authenticate Wrangler

```bash
wrangler login
# Opens your browser
# Log in to your Cloudflare account
# Click "Allow" to authorize Wrangler
# Terminal shows: Successfully logged in.
```

---

## STEP 3 — Get Your Existing Worker Code

Your current Worker is the Anthropic proxy at `stormlight-proxy.goretusk55.workers.dev`. We need to update it — not replace it. The simplest path is to edit it directly in the Cloudflare dashboard first to confirm things work, then move to a proper local project.

**Option A — Edit in Cloudflare Dashboard (fastest)**
1. Go to https://dash.cloudflare.com
2. Click **Workers & Pages** in the left sidebar
3. Click your `stormlight-proxy` Worker
4. Click **Edit Code**
5. Replace the entire code with the new Worker code below
6. Click **Save and Deploy**

**Option B — Local project (recommended for ongoing development)**

```bash
# Create a new local project
mkdir stormlight-worker && cd stormlight-worker
npm create cloudflare@latest .
# Prompts — choose:
#   → Hello World example
#   → Worker + Durable Objects  
#   → JavaScript
#   → Yes to git
#   → No to deploy yet
```

---

## STEP 4 — The New Worker Code

This is the complete `src/index.js`. It contains both:
1. The existing Anthropic proxy (unchanged)
2. The new GameSession Durable Object

```javascript
// ══ GAME SESSION — Durable Object ══
// One instance per active campaign.
// Uses WebSocket Hibernation — sleeps between messages, no idle charges.

export class GameSession {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);

    // WebSocket upgrade request — player connecting
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(request);
    }

    if (url.pathname.endsWith('/ping')) {
      return new Response('pong');
    }

    return new Response('Not found', { status: 404 });
  }

  async handleWebSocket(request) {
    const url = new URL(request.url);
    const playerId = url.searchParams.get('player') || 'unknown';
    const playerName = url.searchParams.get('name') || 'Player';

    const [client, server] = Object.values(new WebSocketPair());

    // acceptWebSocket (not ws.accept()) enables hibernation
    // DO can sleep between messages — zero idle billing
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ playerId, playerName });

    // Send current gState immediately so the new player is in sync
    try {
      const stored = await this.ctx.storage.get('gState');
      if (stored) {
        server.send(JSON.stringify({ type: 'state_sync', gState: stored }));
      }
    } catch (e) {}

    // Tell everyone else someone joined
    this.broadcastExcept(server, JSON.stringify({
      type: 'player_connected',
      playerName
    }));

    return new Response(null, { status: 101, webSocket: client });
  }

  // ── Fires when a hibernated DO receives a WebSocket message ──

  async webSocketMessage(ws, message) {
    const attachment = ws.deserializeAttachment() || {};
    const { playerId, playerName } = attachment;

    let msg;
    try { msg = JSON.parse(message); } catch { return; }

    switch (msg.type) {

      case 'state_update':
        // A player pushed new full gState after an action
        // Save it and broadcast to everyone
        await this.ctx.storage.put('gState', msg.gState);
        this.broadcastAll(JSON.stringify({
          type: 'state_sync',
          gState: msg.gState
        }));
        break;

      case 'action_submit':
        // Player submitted an action — broadcast immediately
        // (full state_update comes after GM responds)
        this.broadcastAll(JSON.stringify({
          type: 'action_received',
          playerName: msg.playerName
        }));
        break;

      case 'typing':
        // Typing indicator — send to all except sender
        this.broadcastExcept(ws, JSON.stringify({
          type: 'typing',
          playerName: msg.playerName
        }));
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
    }
  }

  async webSocketClose(ws) {
    const { playerName } = ws.deserializeAttachment() || {};
    this.broadcastAll(JSON.stringify({
      type: 'player_disconnected',
      playerName: playerName || 'A player'
    }));
  }

  // ── Helpers ──

  broadcastAll(message) {
    for (const ws of this.ctx.getWebSockets()) {
      try { ws.send(message); } catch {}
    }
  }

  broadcastExcept(exclude, message) {
    for (const ws of this.ctx.getWebSockets()) {
      if (ws !== exclude) {
        try { ws.send(message); } catch {}
      }
    }
  }
}

// ══ WORKER — Entry point ══

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    // ── Route 1: Anthropic API proxy (existing, unchanged) ──
    if (url.pathname === '/' && request.method === 'POST') {
      const body = await request.json();
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    // ── Route 2: Game session WebSocket ──
    // URL: /session?campaign=Campaign_WorkingLunch_x7k2&player=0&name=Slac
    if (url.pathname === '/session') {
      const campaignId = url.searchParams.get('campaign');
      if (!campaignId) {
        return new Response('Missing campaign', { status: 400 });
      }
      const id = env.GAME_SESSIONS.idFromName(campaignId);
      const stub = env.GAME_SESSIONS.get(id);
      return stub.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  }
};
```

---

## STEP 5 — Update wrangler.jsonc

If using local project, replace `wrangler.jsonc` with:

```jsonc
{
  "name": "stormlight-proxy",
  "main": "src/index.js",
  "compatibility_date": "2024-09-23",

  "durable_objects": {
    "bindings": [
      {
        "name": "GAME_SESSIONS",
        "class_name": "GameSession"
      }
    ]
  },

  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["GameSession"]
    }
  ]
}
```

**If editing in the Dashboard instead**, you need to:
1. Go to your Worker → **Settings** → **Bindings**
2. Click **Add** → **Durable Object Namespace**
3. Variable name: `GAME_SESSIONS`
4. Select the class: `GameSession` (it appears after you save the code)
5. Click **Save**

---

## STEP 6 — Add Your Secret Key (if using local project)

```bash
# Only needed if deploying from local project
# The dashboard already has your key set
wrangler secret put ANTHROPIC_KEY
# Paste your Anthropic key when prompted
```

---

## STEP 7 — Test Locally (optional but recommended)

```bash
wrangler dev
# Starts local server at http://localhost:8787
# To test WebSocket:
# wscat -c "ws://localhost:8787/session?campaign=test&player=0&name=Slac"
# (install wscat with: npm install -g wscat)
```

Send a test message:
```json
{"type":"ping"}
```
Should receive:
```json
{"type":"pong"}
```

---

## STEP 8 — Deploy

```bash
# From local project:
wrangler deploy

# Or from Dashboard: click Save and Deploy
```

Your Worker URL stays the same: `https://stormlight-proxy.goretusk55.workers.dev`

---

## STEP 9 — Update index.html

Add this JavaScript block to the game. It lives alongside the existing code — the polling system stays as a fallback.

### 9a — Add WebSocket connection manager

Add this near the top of the `<script>` block, after the constants:

```javascript
// ══ WEBSOCKET SESSION ══
let ws = null;
let wsConnected = false;
const WS_URL = 'wss://stormlight-proxy.goretusk55.workers.dev/session';

function connectSession() {
  if (!campaignId || !myChar) return;
  if (ws && ws.readyState === WebSocket.OPEN) return; // already connected

  const url = `${WS_URL}?campaign=${encodeURIComponent(campaignId)}&player=${myChar.slot}&name=${encodeURIComponent(myChar.name)}`;

  ws = new WebSocket(url);

  ws.onopen = () => {
    wsConnected = true;
    console.log('⟁ Session connected');
    // Stop polling — WebSocket handles updates now
    stopLobbyPolling();
    if (refreshTimer) clearInterval(refreshTimer);
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      handleSessionMessage(msg);
    } catch {}
  };

  ws.onclose = () => {
    wsConnected = false;
    // Auto-reconnect after 3 seconds
    setTimeout(connectSession, 3000);
  };

  ws.onerror = () => {
    // Silent fallback — polling still works if WS fails
    wsConnected = false;
  };
}

function handleSessionMessage(msg) {
  switch (msg.type) {

    case 'state_sync':
      if (!msg.gState) return;
      const prevPlayers = JSON.stringify(gState?.players);
      gState = msg.gState;
      // Only re-render if something actually changed
      if (JSON.stringify(gState.players) !== prevPlayers) {
        const isOnCombat = document.getElementById('s-combat')?.classList.contains('active');
        if (isOnCombat) {
          renderCombatScreen();
          renderCombatActions();
        } else {
          renderAll();
          setBottomFromState();
        }
      }
      break;

    case 'action_received':
      // Show immediate visual feedback that someone submitted
      showActionBadge(msg.playerName);
      break;

    case 'typing':
      showTypingIndicator(msg.playerName);
      break;

    case 'player_connected':
      showToast(`⟁ ${msg.playerName} joined`);
      break;

    case 'player_disconnected':
      showToast(`${msg.playerName} disconnected`);
      break;

    case 'pong':
      break; // heartbeat ack
  }
}

// Replace direct saveState() calls with this in key action functions
async function saveAndBroadcast(state) {
  await saveState(state); // Google Sheets persistence (always)
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'state_update', gState: state }));
  }
}

// Call when player focuses on action input
function broadcastTyping() {
  if (ws?.readyState === WebSocket.OPEN && myChar) {
    ws.send(JSON.stringify({ type: 'typing', playerName: myChar.name }));
  }
}

// Presence heartbeat — every 30 seconds
setInterval(() => {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 30000);

// ── UI helpers ──

function showActionBadge(playerName) {
  const id = 'ppip-' + playerName.replace(/\s/g, '_');
  const ppip = document.getElementById(id);
  if (!ppip) return;
  const existing = ppip.querySelector('.action-badge');
  if (existing) existing.remove();
  const badge = document.createElement('div');
  badge.className = 'action-badge';
  badge.style.cssText = 'position:absolute;top:4px;right:4px;font-size:9px;color:var(--teal2);font-family:var(--font-d);letter-spacing:1px;';
  badge.textContent = '✓ READY';
  ppip.appendChild(badge);
}

function showTypingIndicator(playerName) {
  const el = document.getElementById('waiting-msg');
  if (!el) return;
  el.textContent = `${playerName} is deciding...`;
  setTimeout(() => {
    if (gState) setBottomFromState();
  }, 3000);
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = [
    'position:fixed;bottom:80px;left:50%;transform:translateX(-50%)',
    'background:var(--bg3);border:1px solid var(--border2)',
    'border-radius:20px;padding:8px 20px',
    'font-family:var(--font-d);font-size:11px;letter-spacing:1px',
    'color:var(--text3);z-index:9999;pointer-events:none',
  ].join(';');
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
```

### 9b — Connect on game start

In `showGameScreen()`, add `connectSession()`:

```javascript
function showGameScreen() {
  showScreen('game');
  renderAll();
  setBottomFromState();
  connectSession(); // ← ADD THIS
}
```

### 9c — Swap saveState for saveAndBroadcast in key functions

Find these function calls and replace `await saveState(gState)` with `await saveAndBroadcast(gState)`:

- `onSubmitAction()` — after the GM responds
- `resolveRound()` — after round resolution  
- `exitCombat()` — after combat ends
- `callGM()` — after each GM response
- `callCombatGM()` — after each combat GM response

### 9d — Add typing listener to action inputs

```javascript
// In the HTML, add oninput="broadcastTyping()" to both action inputs:
// id="custom-in" and id="combat-custom-in"
// Or add it in JS after rendering:
document.getElementById('custom-in')?.addEventListener('input', broadcastTyping);
```

---

## STEP 10 — Verify It Works

1. Deploy the updated Worker
2. Push the updated `index.html` to GitHub
3. Open the game in two browser windows (or two devices)
4. Both logged into the same campaign
5. In window 1, submit an action
6. Window 2 should update in under 1 second — no refresh needed
7. Check the browser console for `⟁ Session connected`

---

## Troubleshooting

**"WebSocket connection failed"**
- Check that the Worker deployed successfully in Cloudflare dashboard
- Make sure the DO binding `GAME_SESSIONS` is configured
- Try the `/ping` endpoint: `curl https://stormlight-proxy.goretusk55.workers.dev/ping`

**"Missing campaign" error**
- The `campaign` query param wasn't passed — make sure `connectSession()` is called after `campaignId` and `myChar` are both set

**State not syncing**
- Check browser console for WebSocket errors
- Verify `saveAndBroadcast` is being called (not just `saveState`)
- The DO logs are visible in Cloudflare Dashboard → Worker → Logs

**DO binding not found**
- Go to Worker → Settings → Bindings → confirm `GAME_SESSIONS` is listed
- If you deployed via `wrangler deploy`, the migration should have created it automatically

---

## Migration Reference — Before vs After

| Function | Before | After |
|---|---|---|
| Save game state | `await saveState(gState)` | `await saveAndBroadcast(gState)` |
| Check for updates | `setInterval(refreshGame, 5000)` | WebSocket `state_sync` message |
| Lobby updates | `setInterval(loadState, 5000)` | WebSocket `state_sync` message |
| Combat sync | `setInterval(refreshGame, 8000)` | WebSocket `action_received` + `state_sync` |
| Join notification | None | `player_connected` toast |
| Leave notification | None | `player_disconnected` toast |
| Typing feedback | None | `typing` indicator |

---

## File Locations

```
stormlight-worker/        ← Cloudflare Worker project (new)
  src/index.js            ← Worker + GameSession DO code
  wrangler.jsonc          ← Cloudflare config

StormlightBRJ/            ← Game repo (existing)
  index.html              ← Game code (add WebSocket section)
  README.md               ← Player docs
  STORMLIGHT_PROJECT.md   ← Project overview
  CLOUDFLARE_SETUP.md     ← This file
```

---

## What's Next After This

Once real-time sync is working:

1. **Push Notifications** — the DO already knows when turns change. Add Web Push API calls here so players get "It's your turn" browser notifications even with the tab closed.

2. **Presence Indicators** — the DO tracks who's connected. Add `lastSeen` timestamps and surface 🟢/🟡/⚫ status on party cards.

3. **Streaming GM Responses** — switch from `fetch()` to `fetch()` with streaming body, pipe tokens to the story element as they arrive. The worker forwards the stream from Anthropic directly to the browser.
