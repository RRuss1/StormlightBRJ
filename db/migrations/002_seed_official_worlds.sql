-- ============================================================
-- 002_seed_official_worlds.sql — Insert official worlds
-- ============================================================

INSERT INTO world_library (world_id, tier, name, tagline, author, system, published)
VALUES
  ('stormlight',   'official', 'Stormlight Chronicles', 'Knights Radiant. Shardblades. A 180-turn epic across three acts.', 'CYOAhub', 'stormlight',   true),
  ('dnd5e',        'official', 'D&D 5e',                'Classic fantasy. Official Basic Rules. Fighters, Wizards, and Dragons.', 'CYOAhub', 'dnd5e',        true),
  ('wretcheddeep', 'official', 'The Wretched Deep',     'Corruption. Obsession. A crown that whispers in the dark. No heroes — only survivors.', 'CYOAhub', 'wretcheddeep', true)
ON CONFLICT (world_id) DO NOTHING;
