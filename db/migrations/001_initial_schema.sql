-- ============================================================
-- 001_initial_schema.sql — CYOAhub Neon Database
-- Run via: DATABASE_URL="postgresql://..." node db/migrate.js
-- ============================================================

-- ── CAMPAIGNS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  system      TEXT DEFAULT 'stormlight',
  world_id    TEXT DEFAULT 'stormlight',
  party_size  INTEGER DEFAULT 3,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── GAME STATE ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_state (
  campaign_id TEXT PRIMARY KEY REFERENCES campaigns(id) ON DELETE CASCADE,
  state       JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── ACTION LOG ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS action_log (
  id          BIGSERIAL PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  who         TEXT DEFAULT '',
  text        TEXT NOT NULL DEFAULT '',
  choices     JSONB DEFAULT '[]',
  ts          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_action_log_campaign
  ON action_log(campaign_id, ts DESC);

-- ── WORLD LIBRARY ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS world_library (
  world_id    TEXT PRIMARY KEY,
  tier        TEXT DEFAULT 'community',
  name        TEXT NOT NULL,
  tagline     TEXT DEFAULT '',
  author      TEXT DEFAULT 'CYOAhub',
  system      TEXT DEFAULT 'custom',
  config      JSONB DEFAULT '{}',
  rating      NUMERIC(3,2) DEFAULT 0,
  plays       INTEGER DEFAULT 0,
  published   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── MIGRATIONS TRACKING ────────────────────────────────────
CREATE TABLE IF NOT EXISTS _migrations (
  name        TEXT PRIMARY KEY,
  applied_at  TIMESTAMPTZ DEFAULT NOW()
);
