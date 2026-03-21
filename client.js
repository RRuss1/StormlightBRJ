/**
 * ============================================================
 * api/client.js — Stormlight Chronicles API Client
 * ============================================================
 * All network communication goes through this file.
 * Connects the frontend to your Cloudflare Worker (PROXY_URL).
 *
 * CONFIGURATION:
 *   Set STORMLIGHT_API_URL in env.js or window.STORMLIGHT_CONFIG
 * ============================================================
 */

// ── CONFIG ────────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  // Cloudflare Worker base URL — override via env.js
  apiUrl:  window.STORMLIGHT_CONFIG?.apiUrl  || 'https://stormlight-proxy.rruss7997.workers.dev',
  wsUrl:   window.STORMLIGHT_CONFIG?.wsUrl   || 'wss://stormlight-proxy.rruss7997.workers.dev/session',
  sheetId: window.STORMLIGHT_CONFIG?.sheetId || '1f2lS_y0e4eZHYBX68QHJHG-8mmI9680nBNf1fG3ZdEw',
};

export const API_URL = DEFAULT_CONFIG.apiUrl;
export const WS_URL  = DEFAULT_CONFIG.wsUrl;
export const SHEET_ID = DEFAULT_CONFIG.sheetId;

// ── RESPONSE CACHE (GET requests only) ───────────────────────
const _cache = new Map();
const _CACHE_TTL = 8000; // 8 s — listCampaigns / loadLog

function _cacheGet(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > _CACHE_TTL) { _cache.delete(key); return null; }
  return entry.value;
}
function _cacheSet(key, value) {
  _cache.set(key, { value, ts: Date.now() });
}
function _cacheInvalidate(prefix) {
  for (const k of _cache.keys()) if (k.startsWith(prefix)) _cache.delete(k);
}

// ── DEBOUNCED SAVE ────────────────────────────────────────────
// Prevent flooding saveState with every keystroke / realtime update
let _savePending = null;
export function debounceSaveState(campaignId, gState, delay = 1200) {
  if (_savePending) clearTimeout(_savePending);
  _savePending = setTimeout(() => {
    _savePending = null;
    saveState(campaignId, gState).catch(console.warn);
    _cacheInvalidate(`/state/${encodeURIComponent(campaignId)}`);
  }, delay);
}

// ── BASE FETCH ────────────────────────────────────────────────
/**
 * Core fetch wrapper with error handling, GET caching, and retry.
 * @param {string}  path      - Endpoint path (e.g. '/campaigns')
 * @param {object}  options   - fetch() options
 * @param {number}  retries   - Number of retries on 5xx errors
 * @param {boolean} useCache  - Cache GET responses (default true for GETs)
 */
async function apiFetch(path, options = {}, retries = 2) {
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;
  const method = (options.method || 'GET').toUpperCase();

  // Short-circuit with cached value for GET requests
  if (method === 'GET') {
    const hit = _cacheGet(path);
    if (hit !== null) return hit;
  }

  const defaults = { headers: { 'Content-Type': 'application/json' } };
  const config = { ...defaults, ...options, headers: { ...defaults.headers, ...options.headers } };

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, config);
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new APIError(res.status, res.statusText, body);
      }
      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await res.json()
        : await res.text();

      // Cache successful GETs
      if (method === 'GET') _cacheSet(path, data);
      return data;
    } catch (err) {
      lastError = err;
      if (err instanceof APIError && err.status < 500) throw err;
      if (attempt < retries) await sleep(400 * Math.pow(2, attempt)); // exp backoff
    }
  }
  throw lastError;
}

class APIError extends Error {
  constructor(status, statusText, body) {
    super(`API ${status}: ${statusText}`);
    this.status = status;
    this.body = body;
  }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── STREAMING (SSE) ───────────────────────────────────────────
/**
 * Streams a GM narrative response.
 * @param {string}   prompt      - The GM prompt to send
 * @param {function} onToken     - Callback(token) called for each streamed token
 * @param {function} onComplete  - Callback(fullText) when stream ends
 */
export async function streamGMCall(prompt, onToken, onComplete) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok || !res.body) {
    // Fallback to non-streaming
    const data = await res.json().catch(() => ({}));
    const text = data?.content?.[0]?.text || 'The Stormlight flickers.';
    onToken(text);
    onComplete(text);
    return;
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = dec.decode(value, { stream: true });
    chunk.split('\n').forEach(line => {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        try {
          const d = JSON.parse(line.slice(6));
          const tok = (d.delta && (d.delta.text || d.delta.value)) || '';
          if (tok) {
            fullText += tok;
            onToken(tok);
          }
        } catch {}
      }
    });
  }
  onComplete(fullText);
}

// ── CAMPAIGNS ─────────────────────────────────────────────────
/**
 * List all campaigns (reads sheet names from Worker).
 * GET /campaigns → [{id, state}]
 */
export async function listCampaigns() {
  return apiFetch('/campaigns');
}

/**
 * Create a new campaign.
 * POST /campaigns → {id, state}
 */
export async function createCampaign(name) {
  return apiFetch('/campaigns', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

/**
 * Delete a campaign and its sheets.
 * DELETE /campaigns/:id
 */
export async function deleteCampaign(id) {
  return apiFetch(`/campaigns/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ── GAME STATE ────────────────────────────────────────────────
/**
 * Load full game state for a campaign.
 * GET /state/:campaignId → gState object
 */
export async function loadState(campaignId) {
  return apiFetch(`/state/${encodeURIComponent(campaignId)}`);
}

/**
 * Save full game state.
 * PUT /state/:campaignId  body: {gState}
 */
export async function saveState(campaignId, gState) {
  return apiFetch(`/state/${encodeURIComponent(campaignId)}`, {
    method: 'PUT',
    body: JSON.stringify({ gState }),
  });
}

// ── LOG ───────────────────────────────────────────────────────
/**
 * Load the action log for a campaign.
 * GET /log/:campaignId?waitForGM=true → [{type, who, text, choices, ts}]
 */
export async function loadLog(campaignId, waitForGM = false) {
  return apiFetch(`/log/${encodeURIComponent(campaignId)}?waitForGM=${waitForGM}`);
}

/**
 * Append an entry to the log.
 * POST /log/:campaignId  body: {type, who, text, choices}
 */
export async function addLog(campaignId, entry) {
  return apiFetch(`/log/${encodeURIComponent(campaignId)}`, {
    method: 'POST',
    body: JSON.stringify(entry),
  });
}

// ── ACTIONS ───────────────────────────────────────────────────
/**
 * Submit a player action (triggers GM response on server).
 * POST /action  body: {campaignId, playerName, action, roll, total}
 * Returns: {gmText, choices, newState}
 */
export async function submitAction(campaignId, playerName, action, roll, total) {
  return apiFetch('/action', {
    method: 'POST',
    body: JSON.stringify({ campaignId, playerName, action, roll, total }),
  });
}

// ── COMBAT ────────────────────────────────────────────────────
/**
 * Resolve a combat round.
 * POST /combat/resolve  body: {campaignId, pendingActions, gState}
 * Returns: {newState, narrative, diceLog}
 */
export async function resolveCombat(campaignId, pendingActions, gState) {
  return apiFetch('/combat/resolve', {
    method: 'POST',
    body: JSON.stringify({ campaignId, pendingActions, gState }),
  });
}

// ── GOOGLE SHEETS (DIRECT — LEGACY) ──────────────────────────
/**
 * LEGACY: Direct Google Sheets access via JWT.
 * These are preserved for backward compatibility with the existing
 * Worker-less setup. New implementations should route through
 * the Worker endpoints above.
 *
 * SA config is loaded from the gameState module to avoid
 * exposing credentials in this file.
 */
let _tok = null;
let _tokExp = 0;

export async function getAccessToken(saConfig) {
  if (_tok && Date.now() < _tokExp) return _tok;
  _tok = await _getNewToken(saConfig);
  _tokExp = Date.now() + 3_500_000;
  return _tok;
}

async function _getNewToken(SA) {
  const h = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const cl = {
    iss: SA.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const b64 = s =>
    btoa(unescape(encodeURIComponent(typeof s === 'string' ? s : JSON.stringify(s))))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const u = b64(h) + '.' + b64(cl);
  const pem = SA.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\\n|\n/g, '');
  const der = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(u));
  const jwt = u + '.' + btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  return (await r.json()).access_token;
}

export async function sheetsGet(saConfig, sheetId, range) {
  const t = await getAccessToken(saConfig);
  const r = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${t}` } }
  );
  return (await r.json()).values || [];
}

export async function sheetsSet(saConfig, sheetId, range, values) {
  const t = await getAccessToken(saConfig);
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ range, majorDimension: 'ROWS', values }),
    }
  );
}

export async function sheetsAppend(saConfig, sheetId, range, values) {
  const t = await getAccessToken(saConfig);
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ range, majorDimension: 'ROWS', values }),
    }
  );
}

export async function sheetsGetNames(saConfig, sheetId) {
  const t = await getAccessToken(saConfig);
  const info = await (await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`,
    { headers: { Authorization: `Bearer ${t}` } }
  )).json();
  return (info.sheets || []).map(s => s.properties.title);
}

export async function sheetsCreate(saConfig, sheetId, title) {
  const t = await getAccessToken(saConfig);
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ addSheet: { properties: { title } } }] }),
    }
  );
}

export async function sheetsDelete(saConfig, sheetId, title) {
  const t = await getAccessToken(saConfig);
  const info = await (await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`,
    { headers: { Authorization: `Bearer ${t}` } }
  )).json();
  const sh = (info.sheets || []).find(s => s.properties.title === title);
  if (!sh) return;
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ deleteSheet: { sheetId: sh.properties.sheetId } }] }),
    }
  );
}
