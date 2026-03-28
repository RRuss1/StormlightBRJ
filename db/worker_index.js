/**
 * ============================================================
 * worker_index.js — CYOAhub Cloudflare Worker
 * ============================================================
 * Handles:
 *   1. Anthropic API proxy (POST /)
 *   2. WebSocket sessions via Durable Objects (GET /session)
 *   3. Database API via Neon Postgres (GET/POST/PUT/DELETE /db/*)
 *
 * Secrets (set via wrangler secret put):
 *   ANTHROPIC_KEY  — Anthropic API key
 *   DATABASE_URL   — Neon Postgres connection string
 * ============================================================
 */

import { neon } from '@neondatabase/serverless';

// ── Neon connection (lazy, per-request) ──────────────────────
function getDb(env) {
  return neon(env.DATABASE_URL);
}

// ── CORS ─────────────────────────────────────────────────────
const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

// ── Durable Object: GameSession (unchanged) ──────────────────
export class GameSession {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
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
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ playerId, playerName });
    try {
      const stored = await this.ctx.storage.get('gState');
      if (stored) {
        server.send(JSON.stringify({ type: 'state_sync', gState: stored }));
      }
    } catch (e) {}
    this.broadcastExcept(server, JSON.stringify({ type: 'player_connected', playerName }));
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, message) {
    const { playerId, playerName } = ws.deserializeAttachment() || {};
    let msg;
    try { msg = JSON.parse(message); } catch { return; }
    switch (msg.type) {
      case 'state_update':
        await this.ctx.storage.put('gState', msg.gState);
        this.broadcastAll(JSON.stringify({ type: 'state_sync', gState: msg.gState }));
        break;
      case 'action_submit':
        this.broadcastAll(JSON.stringify({ type: 'action_received', playerName: msg.playerName }));
        break;
      case 'typing':
        this.broadcastExcept(ws, JSON.stringify({ type: 'typing', playerName: msg.playerName }));
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
      playerName: playerName || 'A player',
    }));
  }

  broadcastAll(message) {
    for (const ws of this.ctx.getWebSockets()) {
      try { ws.send(message); } catch {}
    }
  }

  broadcastExcept(exclude, message) {
    for (const ws of this.ctx.getWebSockets()) {
      if (ws !== exclude) { try { ws.send(message); } catch {} }
    }
  }
}

// ══════════════════════════════════════════════════════════════
// MAIN FETCH HANDLER
// ══════════════════════════════════════════════════════════════

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // ── CORS preflight ──
    if (method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // ══════════════════════════════════════════════════════════
    // 1. ANTHROPIC PROXY (POST /)
    // ══════════════════════════════════════════════════════════
    if (pathname === '/' && method === 'POST') {
      let body;
      try { body = await request.json(); } catch {
        return json({ error: 'Invalid JSON' }, 400);
      }

      const isStreaming = body.stream === true;

      const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type':      'application/json',
          'x-api-key':         env.ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });

      if (!anthropicRes.ok) {
        const errText = await anthropicRes.text();
        return new Response(errText, {
          status: anthropicRes.status,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        });
      }

      if (isStreaming) {
        return new Response(anthropicRes.body, {
          status: 200,
          headers: {
            'Content-Type':      'text/event-stream',
            'Cache-Control':     'no-cache',
            'Connection':        'keep-alive',
            'X-Accel-Buffering': 'no',
            ...CORS_HEADERS,
          },
        });
      } else {
        const data = await anthropicRes.text();
        return new Response(data, {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        });
      }
    }

    // ══════════════════════════════════════════════════════════
    // 2. WEBSOCKET SESSION (GET /session)
    // ══════════════════════════════════════════════════════════
    if (pathname === '/session') {
      const campaignId = url.searchParams.get('campaign');
      if (!campaignId) return new Response('Missing campaign', { status: 400 });
      const id = env.GAME_SESSIONS.idFromName(campaignId);
      const stub = env.GAME_SESSIONS.get(id);
      return stub.fetch(request);
    }

    // ══════════════════════════════════════════════════════════
    // 3. DATABASE ROUTES (Neon Postgres)
    // ══════════════════════════════════════════════════════════

    if (!env.DATABASE_URL) {
      // If DATABASE_URL not set, DB routes are unavailable
      if (pathname.startsWith('/db/')) {
        return json({ error: 'Database not configured' }, 503);
      }
      return new Response('Not found', { status: 404, headers: CORS_HEADERS });
    }

    const sql = getDb(env);

    // Wrap all DB routes in try/catch for clean error reporting
    try {

    // ── CAMPAIGNS ─────────────────────────────────────────

    // GET /db/campaigns — list all campaigns (optionally filter by world)
    if (pathname === '/db/campaigns' && method === 'GET') {
      const worldId = url.searchParams.get('world');
      let rows;
      if (worldId) {
        rows = await sql`
          SELECT id, name, system, world_id, party_size, created_at
          FROM campaigns WHERE world_id = ${worldId}
          ORDER BY updated_at DESC
        `;
      } else {
        rows = await sql`
          SELECT id, name, system, world_id, party_size, created_at
          FROM campaigns ORDER BY updated_at DESC
        `;
      }
      return json(rows);
    }

    // POST /db/campaigns — create a new campaign
    if (pathname === '/db/campaigns' && method === 'POST') {
      const { name, system = 'stormlight', worldId, partySize = 3 } = await request.json();
      const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString(36);
      const wid = worldId || system;
      const emptyState = JSON.stringify({});
      await sql`
        INSERT INTO campaigns (id, name, system, world_id, party_size)
        VALUES (${id}, ${name}, ${system}, ${wid}, ${partySize})
      `;
      await sql`
        INSERT INTO game_state (campaign_id, state) VALUES (${id}, ${emptyState}::jsonb)
      `;
      return json({ id, name, system, worldId: wid });
    }

    // DELETE /db/campaigns/:id
    if (pathname.startsWith('/db/campaigns/') && method === 'DELETE') {
      const campaignId = pathname.split('/db/campaigns/')[1];
      await sql`DELETE FROM campaigns WHERE id = ${campaignId}`;
      return json({ ok: true });
    }

    // ── GAME STATE ────────────────────────────────────────

    // GET /db/state/:campaignId
    if (pathname.startsWith('/db/state/') && method === 'GET') {
      const campaignId = pathname.split('/db/state/')[1];
      const [row] = await sql`
        SELECT state FROM game_state WHERE campaign_id = ${campaignId}
      `;
      return json(row?.state ?? {});
    }

    // PUT /db/state/:campaignId
    if (pathname.startsWith('/db/state/') && method === 'PUT') {
      const campaignId = pathname.split('/db/state/')[1];
      const { gState } = await request.json();
      await sql`
        INSERT INTO game_state (campaign_id, state, updated_at)
        VALUES (${campaignId}, ${JSON.stringify(gState)}, NOW())
        ON CONFLICT (campaign_id)
        DO UPDATE SET state = EXCLUDED.state, updated_at = NOW()
      `;
      // Also touch campaigns.updated_at for sorting
      await sql`UPDATE campaigns SET updated_at = NOW() WHERE id = ${campaignId}`;
      return json({ ok: true });
    }

    // ── ACTION LOG ────────────────────────────────────────

    // GET /db/log/:campaignId
    if (pathname.startsWith('/db/log/') && method === 'GET') {
      const campaignId = pathname.split('/db/log/')[1];
      const rows = await sql`
        SELECT type, who, text, choices, ts
        FROM action_log
        WHERE campaign_id = ${campaignId}
        ORDER BY ts ASC
      `;
      return json(rows);
    }

    // POST /db/log/:campaignId — append a log entry
    if (pathname.startsWith('/db/log/') && method === 'POST') {
      const campaignId = pathname.split('/db/log/')[1];
      const { type, who, text, choices } = await request.json();
      await sql`
        INSERT INTO action_log (campaign_id, type, who, text, choices)
        VALUES (${campaignId}, ${type}, ${who ?? ''}, ${text ?? ''}, ${JSON.stringify(choices ?? [])})
      `;
      return json({ ok: true });
    }

    // ── WORLD LIBRARY ─────────────────────────────────────

    // GET /db/worlds — list published worlds
    if (pathname === '/db/worlds' && method === 'GET') {
      const rows = await sql`
        SELECT world_id, tier, name, tagline, author, system, config, rating, plays, published
        FROM world_library
        WHERE published = true
        ORDER BY tier DESC, plays DESC
      `;
      return json(rows);
    }

    // POST /db/worlds — publish a custom world
    if (pathname === '/db/worlds' && method === 'POST') {
      const { worldId, name, tagline, author, system, config } = await request.json();
      await sql`
        INSERT INTO world_library (world_id, tier, name, tagline, author, system, config, published)
        VALUES (${worldId}, 'community', ${name}, ${tagline ?? ''}, ${author ?? 'Anonymous'}, ${system ?? 'custom'}, ${JSON.stringify(config ?? {})}, true)
        ON CONFLICT (world_id)
        DO UPDATE SET name = EXCLUDED.name, tagline = EXCLUDED.tagline, config = EXCLUDED.config
      `;
      return json({ ok: true, worldId });
    }

    // PUT /db/worlds/:worldId/play — increment play count
    if (pathname.match(/^\/db\/worlds\/[^/]+\/play$/) && method === 'PUT') {
      const worldId = pathname.split('/db/worlds/')[1].split('/play')[0];
      await sql`UPDATE world_library SET plays = plays + 1 WHERE world_id = ${worldId}`;
      return json({ ok: true });
    }

    // DELETE /db/worlds/:worldId
    if (pathname.startsWith('/db/worlds/') && method === 'DELETE') {
      const worldId = pathname.split('/db/worlds/')[1];
      await sql`DELETE FROM world_library WHERE world_id = ${worldId} AND tier != 'official'`;
      return json({ ok: true });
    }

    // ── USERS (future — routes ready) ─────────────────────

    // GET /db/users/:id
    if (pathname.startsWith('/db/users/') && method === 'GET') {
      const userId = pathname.split('/db/users/')[1];
      const [user] = await sql`SELECT id, username, display_name, avatar_url, created_at FROM users WHERE id = ${userId}`;
      if (!user) return json({ error: 'User not found' }, 404);
      return json(user);
    }

    // POST /db/users — create/upsert user
    if (pathname === '/db/users' && method === 'POST') {
      const { id, username, displayName, email, avatarUrl, provider, providerId } = await request.json();
      await sql`
        INSERT INTO users (id, username, display_name, email, avatar_url, provider, provider_id)
        VALUES (${id}, ${username}, ${displayName ?? ''}, ${email ?? null}, ${avatarUrl ?? ''}, ${provider ?? 'local'}, ${providerId ?? ''})
        ON CONFLICT (id) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          avatar_url = EXCLUDED.avatar_url,
          last_login = NOW()
      `;
      return json({ ok: true, id });
    }

    // ── HEALTH CHECK ──────────────────────────────────────
    if (pathname === '/db/health') {
      await sql`SELECT 1`;
      return json({ status: 'ok', db: 'connected' });
    }

    } catch (dbErr) {
      return json({ error: 'Database error', detail: dbErr.message }, 500);
    }

    return new Response('Not found', { status: 404, headers: CORS_HEADERS });
  },
};
