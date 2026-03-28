/**
 * ============================================================
 * worker_index.js — CYOAhub Cloudflare Worker
 * ============================================================
 * Handles:
 *   1. Anthropic API proxy (POST /)
 *   2. WebSocket sessions via Durable Objects (GET /session)
 *   3. Database API via Neon Postgres (GET/POST/PUT/DELETE /db/*)
 *   4. Auth API (POST /db/auth/*)
 *   5. Invite API (POST /db/invite/*)
 *
 * Secrets (set via wrangler secret put):
 *   ANTHROPIC_KEY  — Anthropic API key
 *   DATABASE_URL   — Neon Postgres connection string
 *   JWT_SECRET     — Secret for signing JWTs (generate a random 64-char string)
 * ============================================================
 */

import { neon } from '@neondatabase/serverless';

// ── Neon connection (lazy, per-request) ──────────────────────
function getDb(env) {
  return neon(env.DATABASE_URL);
}

// ══════════════════════════════════════════════════════════════
// AUTH UTILITIES
// ══════════════════════════════════════════════════════════════

// ── Password hashing (PBKDF2 — available in Workers natively) ──
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  return saltB64 + ':' + hashB64;
}

async function verifyPassword(password, stored) {
  const [saltB64, hashB64] = stored.split(':');
  const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  const hashB64Check = btoa(String.fromCharCode(...new Uint8Array(hash)));
  return hashB64Check === hashB64;
}

// ── JWT (HMAC-SHA256 — native Web Crypto) ──
async function createJWT(payload, secret, expiresInHours = 72) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claims = { ...payload, iat: now, exp: now + expiresInHours * 3600, jti: crypto.randomUUID() };
  const b64 = (obj) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unsigned = b64(header) + '.' + b64(claims);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(unsigned));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return unsigned + '.' + sigB64;
}

async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const data = new TextEncoder().encode(parts[0] + '.' + parts[1]);
    const sig = Uint8Array.from(atob(parts[2].replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, sig, data);
    if (!valid) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

// ── Extract user from Authorization header ──
async function getAuthUser(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  return verifyJWT(token, env.JWT_SECRET || 'cyoahub-dev-secret');
}

// ── Generate invite token ──
function generateToken(length = 8) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  const values = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) result += chars[values[i] % chars.length];
  return result;
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

    // GET /db/worlds — list published worlds + user's own private worlds
    if (pathname === '/db/worlds' && method === 'GET') {
      const authUser = await getAuthUser(request, env);
      let rows;
      if (authUser) {
        // Logged in: show published worlds + own private worlds
        rows = await sql`
          SELECT world_id, tier, name, tagline, author, system, config, rating, plays, published, owner_id
          FROM world_library
          WHERE published = true OR owner_id = ${authUser.sub}
          ORDER BY tier DESC, plays DESC
        `;
      } else {
        rows = await sql`
          SELECT world_id, tier, name, tagline, author, system, config, rating, plays, published
          FROM world_library
          WHERE published = true
          ORDER BY tier DESC, plays DESC
        `;
      }
      return json(rows);
    }

    // POST /db/worlds — save a custom world (private or published)
    if (pathname === '/db/worlds' && method === 'POST') {
      const { worldId, name, tagline, author, system, config, published } = await request.json();
      const isPublished = published === true;
      // Get owner from auth token if present
      const authUser = await getAuthUser(request, env);
      const ownerId = authUser ? authUser.sub : null;
      await sql`
        INSERT INTO world_library (world_id, tier, name, tagline, author, system, config, published, owner_id)
        VALUES (${worldId}, ${isPublished ? 'community' : 'private'}, ${name}, ${tagline ?? ''}, ${author ?? 'Anonymous'}, ${system ?? 'custom'}, ${JSON.stringify(config ?? {})}, ${isPublished}, ${ownerId})
        ON CONFLICT (world_id)
        DO UPDATE SET name = EXCLUDED.name, tagline = EXCLUDED.tagline, config = EXCLUDED.config,
                      published = EXCLUDED.published, owner_id = COALESCE(EXCLUDED.owner_id, world_library.owner_id)
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

    // ══════════════════════════════════════════════════════
    // AUTH ROUTES
    // ══════════════════════════════════════════════════════

    const jwtSecret = env.JWT_SECRET || 'cyoahub-dev-secret';

    // POST /db/auth/register — create account
    if (pathname === '/db/auth/register' && method === 'POST') {
      const { username, email, password, displayName } = await request.json();
      if (!username || !email || !password) return json({ error: 'Username, email, and password required' }, 400);
      if (password.length < 6) return json({ error: 'Password must be at least 6 characters' }, 400);
      if (username.length < 2 || username.length > 24) return json({ error: 'Username must be 2-24 characters' }, 400);

      // Check if username or email already taken
      const [existing] = await sql`SELECT id FROM users WHERE username = ${username}`;
      if (existing) return json({ error: 'Username already taken' }, 409);
      if (email) {
        const [emailTaken] = await sql`SELECT id FROM users WHERE email = ${email}`;
        if (emailTaken) return json({ error: 'Email already registered' }, 409);
      }

      const id = crypto.randomUUID();
      const hash = await hashPassword(password);
      await sql`
        INSERT INTO users (id, username, display_name, email, password_hash, provider)
        VALUES (${id}, ${username}, ${displayName || username}, ${email || null}, ${hash}, 'local')
      `;

      const token = await createJWT({ sub: id, username }, jwtSecret);
      return json({ ok: true, user: { id, username, displayName: displayName || username }, token });
    }

    // POST /db/auth/login — sign in
    if (pathname === '/db/auth/login' && method === 'POST') {
      const { username, password } = await request.json();
      if (!username || !password) return json({ error: 'Username and password required' }, 400);

      const [user] = await sql`
        SELECT id, username, display_name, email, password_hash, login_attempts, locked_until
        FROM users WHERE username = ${username} OR email = ${username}
      `;
      if (!user) return json({ error: 'Invalid username or password' }, 401);

      // Rate limiting — check lockout
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        const mins = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
        return json({ error: `Account locked. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.` }, 429);
      }

      const valid = await verifyPassword(password, user.password_hash);
      if (!valid) {
        const attempts = (user.login_attempts || 0) + 1;
        const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60000).toISOString() : null;
        await sql`UPDATE users SET login_attempts = ${attempts}, locked_until = ${lockUntil} WHERE id = ${user.id}`;
        return json({ error: 'Invalid username or password' }, 401);
      }

      // Success — reset attempts, update last_login
      await sql`UPDATE users SET login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = ${user.id}`;

      const token = await createJWT({ sub: user.id, username: user.username }, jwtSecret);
      return json({
        ok: true,
        user: { id: user.id, username: user.username, displayName: user.display_name, email: user.email },
        token,
      });
    }

    // GET /db/auth/me — validate token + return user
    if (pathname === '/db/auth/me' && method === 'GET') {
      const payload = await getAuthUser(request, env);
      if (!payload) return json({ error: 'Not authenticated' }, 401);

      const [user] = await sql`
        SELECT id, username, display_name, email, avatar_url, created_at
        FROM users WHERE id = ${payload.sub}
      `;
      if (!user) return json({ error: 'User not found' }, 404);
      return json({ user });
    }

    // POST /db/auth/change-password
    if (pathname === '/db/auth/change-password' && method === 'POST') {
      const payload = await getAuthUser(request, env);
      if (!payload) return json({ error: 'Not authenticated' }, 401);

      const { currentPassword, newPassword } = await request.json();
      if (!newPassword || newPassword.length < 6) return json({ error: 'New password must be at least 6 characters' }, 400);

      const [user] = await sql`SELECT password_hash FROM users WHERE id = ${payload.sub}`;
      if (!user) return json({ error: 'User not found' }, 404);

      const valid = await verifyPassword(currentPassword, user.password_hash);
      if (!valid) return json({ error: 'Current password is incorrect' }, 401);

      const hash = await hashPassword(newPassword);
      await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${payload.sub}`;
      return json({ ok: true });
    }

    // POST /db/auth/google — verify Google ID token + create/login user
    if (pathname === '/db/auth/google' && method === 'POST') {
      const { credential } = await request.json();
      if (!credential) return json({ error: 'Missing Google credential' }, 400);

      // Verify the Google ID token via Google's tokeninfo endpoint
      const gRes = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + credential);
      if (!gRes.ok) return json({ error: 'Invalid Google token' }, 401);
      const gData = await gRes.json();

      const googleId = gData.sub;
      const email = gData.email;
      const name = gData.name || gData.email;
      const avatar = gData.picture || '';

      if (!googleId || !email) return json({ error: 'Google token missing required fields' }, 400);

      // Check if user already exists (by Google provider_id OR matching email)
      let [user] = await sql`SELECT id, username, display_name, email FROM users WHERE provider = 'google' AND provider_id = ${googleId}`;

      if (!user) {
        // Check if email matches an existing local account — link them
        [user] = await sql`SELECT id, username, display_name, email FROM users WHERE email = ${email}`;
        if (user) {
          // Link Google to existing account
          await sql`UPDATE users SET provider = 'google', provider_id = ${googleId}, avatar_url = ${avatar}, last_login = NOW() WHERE id = ${user.id}`;
        } else {
          // Create new user from Google
          const id = crypto.randomUUID();
          const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Math.random().toString(36).slice(2, 6);
          await sql`
            INSERT INTO users (id, username, display_name, email, avatar_url, provider, provider_id, email_verified)
            VALUES (${id}, ${username}, ${name}, ${email}, ${avatar}, 'google', ${googleId}, true)
          `;
          user = { id, username, display_name: name, email };
        }
      } else {
        // Update last login + avatar
        await sql`UPDATE users SET avatar_url = ${avatar}, last_login = NOW() WHERE id = ${user.id}`;
      }

      const token = await createJWT({ sub: user.id, username: user.username }, jwtSecret);
      return json({
        ok: true,
        user: { id: user.id, username: user.username, displayName: user.display_name, email: user.email },
        token,
      });
    }

    // POST /db/auth/forgot-password — stub (needs email service to fully work)
    if (pathname === '/db/auth/forgot-password' && method === 'POST') {
      const { email } = await request.json();
      // For now, just confirm the email exists. Real implementation needs SendGrid/Mailgun.
      const [user] = await sql`SELECT id FROM users WHERE email = ${email}`;
      // Always return success to prevent email enumeration
      return json({ ok: true, message: 'If that email is registered, a reset link has been sent.' });
    }

    // DELETE /db/auth/account — delete own account
    if (pathname === '/db/auth/account' && method === 'DELETE') {
      const payload = await getAuthUser(request, env);
      if (!payload) return json({ error: 'Not authenticated' }, 401);

      // Remove user — cascades will handle campaign_members, preferences
      await sql`DELETE FROM users WHERE id = ${payload.sub}`;
      return json({ ok: true });
    }

    // PUT /db/auth/profile — update display name / avatar
    if (pathname === '/db/auth/profile' && method === 'PUT') {
      const payload = await getAuthUser(request, env);
      if (!payload) return json({ error: 'Not authenticated' }, 401);

      const { displayName, avatarUrl } = await request.json();
      await sql`
        UPDATE users SET
          display_name = COALESCE(${displayName}, display_name),
          avatar_url = COALESCE(${avatarUrl}, avatar_url)
        WHERE id = ${payload.sub}
      `;
      return json({ ok: true });
    }

    // ══════════════════════════════════════════════════════
    // INVITE / PUBLIC JOIN ROUTES
    // ══════════════════════════════════════════════════════

    // POST /db/invite/create — generate invite link (auth required)
    if (pathname === '/db/invite/create' && method === 'POST') {
      const payload = await getAuthUser(request, env);
      if (!payload) return json({ error: 'Not authenticated' }, 401);

      const { campaignId, maxUses = 5, expiresInHours = 48 } = await request.json();
      if (!campaignId) return json({ error: 'campaignId required' }, 400);

      const token = generateToken(8);
      const expiresAt = new Date(Date.now() + expiresInHours * 3600000).toISOString();
      await sql`
        INSERT INTO invite_tokens (token, campaign_id, created_by, max_uses, expires_at)
        VALUES (${token}, ${campaignId}, ${payload.sub}, ${maxUses}, ${expiresAt})
      `;

      return json({ ok: true, token, expiresAt, maxUses });
    }

    // GET /db/invite/:token — validate invite (no auth needed — guests use this)
    if (pathname.startsWith('/db/invite/') && !pathname.includes('/create') && method === 'GET') {
      const token = pathname.split('/db/invite/')[1];
      const [invite] = await sql`
        SELECT t.token, t.campaign_id, t.max_uses, t.uses, t.expires_at,
               c.name as campaign_name, c.system, c.world_id
        FROM invite_tokens t
        JOIN campaigns c ON c.id = t.campaign_id
        WHERE t.token = ${token}
      `;
      if (!invite) return json({ error: 'Invalid invite link' }, 404);
      if (new Date(invite.expires_at) < new Date()) return json({ error: 'Invite link has expired' }, 410);
      if (invite.uses >= invite.max_uses) return json({ error: 'Invite link has been fully used' }, 410);

      return json({
        valid: true,
        campaignId: invite.campaign_id,
        campaignName: invite.campaign_name,
        worldId: invite.world_id,
        system: invite.system,
        usesLeft: invite.max_uses - invite.uses,
      });
    }

    // POST /db/invite/:token/join — use invite to join campaign (no auth needed)
    if (pathname.match(/^\/db\/invite\/[^/]+\/join$/) && method === 'POST') {
      const token = pathname.split('/db/invite/')[1].split('/join')[0];
      const { displayName, userId } = await request.json();

      const [invite] = await sql`
        SELECT token, campaign_id, max_uses, uses, expires_at FROM invite_tokens WHERE token = ${token}
      `;
      if (!invite) return json({ error: 'Invalid invite' }, 404);
      if (new Date(invite.expires_at) < new Date()) return json({ error: 'Invite expired' }, 410);
      if (invite.uses >= invite.max_uses) return json({ error: 'Invite fully used' }, 410);

      // Increment uses
      await sql`UPDATE invite_tokens SET uses = uses + 1 WHERE token = ${token}`;

      // If user is logged in, add as campaign member
      if (userId) {
        await sql`
          INSERT INTO campaign_members (campaign_id, user_id, role)
          VALUES (${invite.campaign_id}, ${userId}, 'player')
          ON CONFLICT (campaign_id, user_id) DO NOTHING
        `;
      } else {
        // Guest player — generate a guest ID
        const guestId = 'guest-' + crypto.randomUUID().slice(0, 8);
        await sql`
          INSERT INTO guest_players (id, campaign_id, display_name)
          VALUES (${guestId}, ${invite.campaign_id}, ${displayName || 'Guest'})
        `;
        return json({ ok: true, guestId, campaignId: invite.campaign_id });
      }

      return json({ ok: true, campaignId: invite.campaign_id });
    }

    // DELETE /db/invite/:token — revoke invite (auth required)
    if (pathname.startsWith('/db/invite/') && method === 'DELETE') {
      const payload = await getAuthUser(request, env);
      if (!payload) return json({ error: 'Not authenticated' }, 401);
      const token = pathname.split('/db/invite/')[1];
      await sql`DELETE FROM invite_tokens WHERE token = ${token} AND created_by = ${payload.sub}`;
      return json({ ok: true });
    }

    // ══════════════════════════════════════════════════════
    // USER PROFILE
    // ══════════════════════════════════════════════════════

    // GET /db/users/:id
    if (pathname.startsWith('/db/users/') && method === 'GET') {
      const userId = pathname.split('/db/users/')[1];
      const [user] = await sql`SELECT id, username, display_name, avatar_url, created_at FROM users WHERE id = ${userId}`;
      if (!user) return json({ error: 'User not found' }, 404);
      return json(user);
    }

    // POST /db/auth/claim — claim browser-owned campaigns to user account
    if (pathname === '/db/auth/claim' && method === 'POST') {
      const payload = await getAuthUser(request, env);
      if (!payload) return json({ error: 'Not authenticated' }, 401);

      const { campaignIds, worldIds } = await request.json();
      let claimedCampaigns = 0, claimedWorlds = 0;

      if (campaignIds && Array.isArray(campaignIds)) {
        for (const cid of campaignIds) {
          await sql`UPDATE campaigns SET owner_id = ${payload.sub} WHERE id = ${cid} AND owner_id IS NULL`;
          await sql`
            INSERT INTO campaign_members (campaign_id, user_id, role)
            VALUES (${cid}, ${payload.sub}, 'owner')
            ON CONFLICT (campaign_id, user_id) DO UPDATE SET role = 'owner'
          `;
          claimedCampaigns++;
        }
      }
      if (worldIds && Array.isArray(worldIds)) {
        for (const wid of worldIds) {
          await sql`UPDATE world_library SET owner_id = ${payload.sub} WHERE world_id = ${wid} AND owner_id IS NULL`;
          claimedWorlds++;
        }
      }

      return json({ ok: true, claimedCampaigns, claimedWorlds });
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
