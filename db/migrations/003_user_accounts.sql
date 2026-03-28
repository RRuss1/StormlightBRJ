-- ============================================================
-- 003_user_accounts.sql — User accounts and ownership
-- ============================================================

-- ── USERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,             -- UUID or OAuth provider ID
  username    TEXT UNIQUE NOT NULL,
  display_name TEXT DEFAULT '',
  email       TEXT UNIQUE,
  avatar_url  TEXT DEFAULT '',
  provider    TEXT DEFAULT 'local',         -- 'local' | 'google' | 'discord' | 'github'
  provider_id TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  last_login  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id);

-- ── CAMPAIGN OWNERSHIP ─────────────────────────────────────
-- Links users to campaigns they created or joined
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS owner_id TEXT REFERENCES users(id);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

CREATE TABLE IF NOT EXISTS campaign_members (
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot        INTEGER NOT NULL DEFAULT 0,
  role        TEXT DEFAULT 'player',        -- 'owner' | 'player' | 'spectator'
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (campaign_id, user_id)
);

-- ── WORLD OWNERSHIP ────────────────────────────────────────
ALTER TABLE world_library ADD COLUMN IF NOT EXISTS owner_id TEXT REFERENCES users(id);

-- ── USER PREFERENCES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme       TEXT DEFAULT 'dark',
  audio_on    BOOLEAN DEFAULT true,
  volume      NUMERIC(3,2) DEFAULT 0.3,
  lang        TEXT DEFAULT 'en',
  tts_on      BOOLEAN DEFAULT false,
  prefs       JSONB DEFAULT '{}'            -- extensible preferences blob
);
