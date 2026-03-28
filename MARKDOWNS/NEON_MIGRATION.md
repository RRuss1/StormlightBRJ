# 🗄 Neon DB Migration Handoff
**Date:** 2026-03-28  
**From:** Google Sheets persistence layer  
**To:** Neon serverless Postgres  

---

## Neon Project Details

| Field | Value |
|-------|-------|
| Project name | CyoaHub |
| Region | AWS US East 1 (N. Virginia) |
| Host (pooler) | `ep-noisy-bread-a4avxudn-pooler.us-east-1.aws.neon.tech` |
| Database | `neondb` |
| SSL | `sslmode=require&channel_binding=require` |
| Full connection string | `postgresql://[USER]:[PASSWORD]@ep-noisy-bread-a4avxudn-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |

**The full connection string (with user + password) lives as a Cloudflare Worker secret.**  
Never hardcode it. Never commit it.

```bash
# Set it once in Wrangler:
wrangler secret put DATABASE_URL
# Paste the full connection string when prompted
```

---

## What We're Replacing

Currently the Cloudflare Worker talks to **Google Sheets** for all persistence:
- Campaign list → `sheetsGetNames()`
- Game state → `sheetsGet()` / `sheetsSet()`
- Action log → `sheetsAppend()` / `sheetsGet()`
- World Library → planned `WorldLibrary` tab (not yet built)

All of this moves to **Neon Postgres** via `@neondatabase/serverless` in the Worker.

---

## Step 1 — Install the Neon driver in the Worker

```bash
cd your-worker-directory
npm install @neondatabase/serverless
```

The `@neondatabase/serverless` package works natively in Cloudflare Workers — no Node.js needed.

---

## Step 2 — Schema (run this in Neon SQL Editor)

Go to **CyoaHub project → SQL Editor** in the Neon console and run:

```sql
-- ── CAMPAIGNS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id          TEXT PRIMARY KEY,          -- slug e.g. "the-lost-expedition"
  name        TEXT NOT NULL,
  system      TEXT DEFAULT 'stormlight', -- 'stormlight' | 'dnd5e' | 'custom'
  world_id    TEXT DEFAULT 'stormlight',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── GAME STATE ─────────────────────────────────────────────
-- One row per campaign — full gState JSON blob
CREATE TABLE IF NOT EXISTS game_state (
  campaign_id TEXT PRIMARY KEY REFERENCES campaigns(id) ON DELETE CASCADE,
  state       JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── ACTION LOG ─────────────────────────────────────────────
-- Append-only log entries per campaign
CREATE TABLE IF NOT EXISTS action_log (
  id          BIGSERIAL PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,             -- 'player' | 'gm' | 'system' | 'combat'
  who         TEXT DEFAULT '',
  text        TEXT NOT NULL DEFAULT '',
  choices     JSONB DEFAULT '[]',
  ts          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_action_log_campaign
  ON action_log(campaign_id, ts DESC);

-- ── WORLD LIBRARY ───────────────────────────────────────────
-- Official + community worlds
CREATE TABLE IF NOT EXISTS world_library (
  world_id    TEXT PRIMARY KEY,          -- slug e.g. 'stormlight', 'grimdark-hinterlands'
  tier        TEXT DEFAULT 'community',  -- 'official' | 'community'
  name        TEXT NOT NULL,
  tagline     TEXT DEFAULT '',
  author      TEXT DEFAULT 'CYOAhub',
  system      TEXT DEFAULT 'custom',
  config      JSONB DEFAULT '{}',        -- full worldConfig JSON
  rating      NUMERIC(3,2) DEFAULT 0,
  plays       INTEGER DEFAULT 0,
  published   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── SEED OFFICIAL WORLDS ────────────────────────────────────
INSERT INTO world_library (world_id, tier, name, tagline, author, system, published)
VALUES
  ('stormlight', 'official', 'Stormlight Chronicles', 'Knights Radiant. Shardblades. The Cosmere.', 'CYOAhub', 'stormlight', true),
  ('dnd5e',      'official', 'D&D 5e',                'Classic fantasy. Official Basic Rules.',       'CYOAhub', 'dnd5e',      false)
ON CONFLICT (world_id) DO NOTHING;
```

---

## Step 3 — Update `worker_index.js`

Replace the Google Sheets logic with Neon queries. Here is the full replacement pattern:

### Worker setup — top of file

```js
import { neon } from '@neondatabase/serverless';

// DATABASE_URL is set as a Wrangler secret — never hardcoded
function getDb(env) {
  return neon(env.DATABASE_URL);
}
```

### Route replacements

#### GET /campaigns  (was: sheetsGetNames)
```js
// OLD — Google Sheets
const names = await sheetsGetNames(saConfig, SHEET_ID);

// NEW — Neon
const sql = getDb(env);
const rows = await sql`SELECT id, name, system, world_id FROM campaigns ORDER BY created_at DESC`;
return Response.json(rows);
```

#### POST /campaigns  (was: sheetsCreate)
```js
// NEW
const { name, system = 'stormlight', worldId = 'stormlight' } = await req.json();
const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
await sql`
  INSERT INTO campaigns (id, name, system, world_id)
  VALUES (${id}, ${name}, ${system}, ${worldId})
  ON CONFLICT (id) DO NOTHING
`;
await sql`
  INSERT INTO game_state (campaign_id, state) VALUES (${id}, '{}')
  ON CONFLICT (campaign_id) DO NOTHING
`;
return Response.json({ id, name, system });
```

#### GET /state/:campaignId  (was: sheetsGet range)
```js
// NEW
const [row] = await sql`
  SELECT state FROM game_state WHERE campaign_id = ${campaignId}
`;
return Response.json(row?.state ?? {});
```

#### PUT /state/:campaignId  (was: sheetsSet)
```js
// NEW
const { gState } = await req.json();
await sql`
  INSERT INTO game_state (campaign_id, state, updated_at)
  VALUES (${campaignId}, ${JSON.stringify(gState)}, NOW())
  ON CONFLICT (campaign_id)
  DO UPDATE SET state = EXCLUDED.state, updated_at = NOW()
`;
return Response.json({ ok: true });
```

#### GET /log/:campaignId  (was: sheetsGet log range)
```js
// NEW
const rows = await sql`
  SELECT type, who, text, choices, ts
  FROM action_log
  WHERE campaign_id = ${campaignId}
  ORDER BY ts ASC
`;
return Response.json(rows);
```

#### POST /log/:campaignId  (was: sheetsAppend)
```js
// NEW
const { type, who, text, choices } = await req.json();
await sql`
  INSERT INTO action_log (campaign_id, type, who, text, choices)
  VALUES (${campaignId}, ${type}, ${who ?? ''}, ${text}, ${JSON.stringify(choices ?? [])})
`;
return Response.json({ ok: true });
```

#### DELETE /campaigns/:id  (was: sheetsDelete)
```js
// NEW — cascades to game_state + action_log via FK
await sql`DELETE FROM campaigns WHERE id = ${campaignId}`;
return Response.json({ ok: true });
```

#### GET /worlds  (NEW — World Library, didn't exist in Sheets version)
```js
const rows = await sql`
  SELECT world_id, tier, name, tagline, author, system, rating, plays
  FROM world_library
  WHERE published = true
  ORDER BY tier DESC, plays DESC
`;
return Response.json(rows);
```

---

## Step 4 — Update `wrangler.toml`

Remove any Sheets-related environment vars. The only secret needed now is `DATABASE_URL`.

```toml
name = "stormlight-proxy"
main = "worker_index.js"
compatibility_date = "2026-01-01"

# No KV bindings needed for DB — Neon handles it
# Secrets (set via wrangler secret put, not here):
# DATABASE_URL
```

---

## Step 5 — Update `api/client.js` in the frontend

The frontend already calls `/campaigns`, `/state/:id`, `/log/:id` etc. via `apiFetch()`.  
**The frontend does not need to change** — the Worker API surface stays identical.  
The only thing that changes is what happens inside the Worker.

The Google Sheets helper functions (`sheetsGet`, `sheetsSet`, `sheetsAppend`, etc.) in `api/client.js` can be removed or kept as dead code — they're no longer called by anything once the Worker is updated.

---

## Step 6 — Deploy

```bash
# Set the secret first
wrangler secret put DATABASE_URL
# → paste: postgresql://[USER]:[PASSWORD]@ep-noisy-bread-a4avxudn-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Deploy the updated worker
wrangler deploy

# Verify
curl https://stormlight-proxy.rruss7997.workers.dev/campaigns
# Should return [] (empty array — no campaigns yet)

curl https://stormlight-proxy.rruss7997.workers.dev/worlds
# Should return the two seeded official worlds
```

---

## Step 7 — Migrate existing campaign data (optional)

If there are active campaigns in the Google Sheet worth keeping:

1. Open the Sheet
2. For each campaign tab, copy the state JSON and log rows
3. POST them into Neon:

```bash
# Create the campaign
curl -X POST https://stormlight-proxy.rruss7997.workers.dev/campaigns \
  -H "Content-Type: application/json" \
  -d '{"name":"Your Campaign Name","system":"stormlight"}'

# Save the state
curl -X PUT https://stormlight-proxy.rruss7997.workers.dev/state/your-campaign-name \
  -H "Content-Type: application/json" \
  -d '{"gState": { ...paste state here... }}'
```

Or do it directly in the Neon SQL Editor — paste and run INSERT statements.

---

## What Improves Immediately

| Before (Sheets) | After (Neon) |
|-----------------|--------------|
| ~800ms state reads | ~20ms state reads |
| Race conditions on simultaneous writes | Proper ACID transactions |
| 10MB cell size limit on state | No practical limit on JSONB |
| No real querying | Full SQL on game state |
| WorldLibrary was a planned tab | `world_library` table exists now |
| Auth credentials in frontend JS | Only in Worker env secrets |

---

## What Does NOT Change

- Cloudflare Worker URL stays the same
- Frontend API calls stay the same  
- `gState` JSON shape stays the same
- Multiplayer WebSocket logic stays the same
- The `CYOA_CONFIG` in `index.html` stays the same

---

## Files Changed in This Migration

| File | Change |
|------|--------|
| `worker_index.js` | Replace Sheets calls with Neon queries — main work |
| `wrangler.toml` | Remove Sheets env vars, confirm secrets setup |
| `api/client.js` | Remove or stub out Sheets helper functions |
| Neon SQL Editor | Run schema SQL once manually |
| Cloudflare dashboard | Set `DATABASE_URL` secret via Wrangler |

**No changes to:** `app/ui.js`, `app/combat.js`, `app/gameState.js`, `app/main.js`, `index.html`

---

*Hand this file to Claude Code in VSCode along with the current `worker_index.js`.*  
*Claude Code has the full project context and can rewrite the Worker directly from these specs.*
