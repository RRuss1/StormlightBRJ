# CYOAhub — Session Status

**Date:** 2026-03-27
**Repo:** github.com/rruss1/CYOAHUB
**Live:** rruss1.github.io/CYOAHUB
**Worker:** `cyoahub-proxy.rruss7997.workers.dev`
**Sheet ID:** `1f2lS_y0e4eZHYBX68QHJHG-8mmI9680nBNf1fG3ZdEw`

---

## What Was Done This Session (2026-03-27 PM)

### Phase 3 — D&D 5e System (Complete)
- Created `app/systems/dnd5e.js` (~800 lines) — full D&D 5e Basic Rules data
  - 4 classes: Cleric (Life), Fighter (Champion), Rogue (Thief), Wizard (Evocation)
  - 4 races: Human, Hill Dwarf, High Elf, Lightfoot Halfling
  - 6 backgrounds: Acolyte, Criminal, Folk Hero, Noble, Sage, Soldier
  - 18 skills, 20+ weapons, 13 armor types, 17 conditions
  - 23 spells (cantrips through 3rd level) for Cleric & Wizard
  - D&D-specific enemy pools (dungeon, wilderness, underdark, town)
  - D&D gmContext for Forgotten Realms AI narration
  - Crimson/candlelight theme tokens
- Added `dnd5e` to `loadSystem()` in `gameState.js`
- D&D world card already in index.html — now fully wired

### Phase 3.5 — Enemy System Refactor (Complete)
- Created `app/enemyPatterns.js` (~800 lines) — shared enemy pattern library
  - 15 categories, 57 patterns, 200+ enemy variants
  - Categories: Undead, Demons, Dragons, Giants, Goblinoids, Beasts, Fey, Elementals, Aberrations, Sea, Lycanthropes, Plants, Human Enemies, Mythological, Swarms
  - `ENEMY_CATEGORY_REGISTRY` array for wizard UI checkboxes
  - `SHARED_ENEMY_PATTERNS` object keyed by category ID
- Moved Stormlight-specific enemy pools + patterns into `stormlight.js` (`enemyPools`, `enemyPatterns`, `enemyCategories`)
- Refactored `combat.js` to merge system-specific + shared patterns at runtime
- Each system declares `enemyCategories` array to filter the shared library

### Phase 4 — Custom World Builder (Complete)
- Created `app/systems/custom.js` — builds SystemData-compatible object from wizard worldConfig
  - Generic 4-class system (Warrior, Mage, Rogue, Healer)
  - All fields from SystemData shape present with sensible defaults
  - `cfg.enemies.categories` flows from wizard checkboxes
- Added **Step 5: Enemy Types** to wizard (7 steps total now)
  - Checkbox grid with all 15 enemy categories from the shared library
  - Category icons, names, descriptions
  - Selection state tracked in `_selectedEnemyCategories`
- `finishWizard()` now builds worldConfig and stores it for `loadSystem()`
- Wizard steps renumbered from 6 → 7

### Phase 5 — World Library API (Complete)
- Added `loadWorldLibrary()` to `api/client.js` — reads WorldLibrary tab, 60s cache
- Added `publishWorld()` — appends worldConfig as JSON row
- WorldLibrary tab columns: worldId, tier, name, tagline, author, system, config, rating, plays, published

### Phase 6 — Polish (Partial)
- Theme injection: `loadSystem()` now sets `data-system` on body and overrides CSS custom properties
- D&D theme CSS in `hub.css` — body[data-system="dnd5e"] overrides
- Theme-overridable tokens (`--theme-primary`, `--theme-secondary`, `--theme-danger`) in `base.css`
- Enemy category grid CSS with responsive layout

### Documentation
- Fresh `README.md` — architecture, tech stack, adding systems guide
- Updated `CYOAHUB_STATUS.md` — reflects repo rename, all phases
- Stale worker URLs in MARKDOWNS/ still reference old names (archive/reference)

---

## Previous Session Work

### Phase 0 — Rebrand (Complete)
- `STORMLIGHT_CONFIG` → `CYOA_CONFIG` in all code files
- `<title>` → CYOAhub
- Worker URLs → `cyoahub-proxy.rruss7997.workers.dev` (3 files)
- All file header comments → CYOAhub
- Cloudflare Worker renamed on dashboard

### Phase 1 — Extract Stormlight + System Loader (Complete)
- Created `app/systems/stormlight.js` (~750 lines) — all Stormlight-specific data extracted
- `app/gameState.js` reduced from 1,267 → 595 lines — uses `_sys.*` aliases
- `window.SystemData` + `loadSystem(id)` function added
- GM prompts in `combat.js` and `ui.js` parameterized via `SystemData.gmContext`
- `AI_DM_SYSTEM_PROMPT` now built dynamically from active system's gmContext

### Phase 2 — Landing Page Integration (Complete)
- 3 new screens merged into `index.html`: `s-landing`, `s-worlds`, `s-wizard`
- Created `styles/hub.css` — all hub-specific styles
- Created `app/hub.js` — particles, wizard, hash router, world picking, hamburger menu
- Landing page hero cards use images (`assets/EnterWorlds.png`, `assets/CreateWorld.png`)
- World cards use images from `GameCardImgs/`
- Worlds screen has `background worlds.jpg` as backdrop
- Boot sequence gated — hub screens handled by hub.js, game screens by existing flow
- `showScreen()` enhanced with hub-only background toggling + GSAP transitions
- Lenis smooth scroll destroyed on hub screens, created on game screens (prevents wheel hijack)
- Wizard Step 6 has card image picker — auto-fill grid, future-proof for more images

### Asset Reorganization
- `assets/` folder created for UI-only images (EnterWorlds.png, CreateWorld.png, background worlds.jpg, bg.jpg)
- `GameCardImgs/` is now exclusively user-selectable card images (9 images)
- `CARD_IMAGES` array in hub.js — add filenames there when adding new card art

---

## Current File Structure

```
cyoahub/
├── index.html                 ← 9 screens: 3 hub + 6 game
├── README.md                  ← Fresh project README
├── assets/
│   ├── bg.jpg                 ← Nebula background (landing)
│   ├── background worlds.jpg  ← Worlds screen backdrop
│   ├── EnterWorlds.png        ← Landing hero card image
│   └── CreateWorld.png        ← Landing hero card image
├── GameCardImgs/              ← User-selectable card art (add more here)
│   ├── DnD.png ... (9 images)
├── app/
│   ├── systems/
│   │   ├── stormlight.js      ← Stormlight data + enemyPools + enemyPatterns
│   │   ├── dnd5e.js           ← D&D 5e Basic Rules data + gmContext
│   │   └── custom.js          ← Builds SystemData from wizard worldConfig
│   ├── enemyPatterns.js       ← Shared enemy library (15 categories, 57+ patterns)
│   ├── gameState.js           ← System loader + aliases + game functions
│   ├── rulesEngine.js         ← window.Rules API (Cosmere math)
│   ├── hub.js                 ← Hub particles, 7-step wizard, router, enemy picker
│   ├── ui.js                  ← UI rendering + enhanced showScreen()
│   ├── combat.js              ← Combat + system-aware enemy pools
│   └── main.js                ← GSAP, Lenis control, NL-7 systems
├── api/
│   └── client.js              ← Network layer + WorldLibrary API
├── styles/
│   ├── base.css               ← Design tokens + theme overrides + reset
│   ├── hub.css                ← Hub styles + enemy category grid + D&D theme
│   ├── animations.css         ← Keyframes
│   └── components.css         ← Game UI components
├── MARKDOWNS/                 ← Rulebook chapters + project docs (archive)
└── CYOAhubfiles/              ← Old reference files (archive)
```

## Script Load Order
```
stormlight.js → dnd5e.js → custom.js → enemyPatterns.js → gameState.js → rulesEngine.js → hub.js → ui.js → combat.js → main.js
```

---

## Known Issues

1. **Landing page scroll** — scrollbar appears but mousewheel doesn't work. Lenis is destroyed on hub screens but the fixed-position flex container may still be preventing native scroll.

2. **Game screen titles hardcoded** — `index.html` says "Stormlight Chronicles" in game screens. Should become dynamic via `SystemData.name`.

3. **D&D character creation flow** — existing UI branching (`isRadiant` flag) needs adaptation for D&D's class+background model. Currently loads data but creation flow may need tweaks.

4. **rulesEngine.js** — currently Cosmere-only math. D&D ability modifier, proficiency bonus, AC calculation, and death saves need to be added alongside existing Cosmere rules. Combat works but uses Cosmere formulas for D&D characters.

5. **WorldLibrary Google Sheet tab** — tab needs to be manually created with column headers: worldId, tier, name, tagline, author, system, config, rating, plays, published.

6. **Dynamic world hub** — hub currently uses hardcoded world cards. Need to wire `loadWorldLibrary()` to render community/published worlds dynamically.

7. **Wizard data collection** — Steps 1-4 and 6 collect UI selections but don't yet read all form values into worldConfig. Only name, color, and enemy categories are fully wired.

---

## What's Next

### Immediate (Bug Squash)
- Fix landing page mousewheel scroll
- Test full flow for BOTH systems: Stormlight and D&D 5e
- Adapt character creation UI for D&D class+background model
- Add D&D math to rulesEngine.js (ability modifiers, proficiency, AC, death saves)

### Phase 5 Completion
- Create WorldLibrary tab in Google Sheet manually
- Wire world hub to render dynamically from sheet data
- Publish flow: wizard → save to sheet → card appears in hub

### Phase 6 Completion
- Hamburger menu → real auth
- Mobile layout (1-column grid)
- Campaign invite link sharing
- Per-world font loading (Uncial Antiqua for D&D, etc.)

---

## Key Architecture Decisions

- **Single index.html** — all screens (hub + game) as sibling `<div class="screen">` elements
- **Hash routing** — `#worlds`, `#wizard`, `#campaign` etc.
- **SystemData pattern** — `window.SystemData` points to active world's data; all game code reads from it
- **`loadSystem(id)`** — switches the active system; defaults to `'stormlight'`
- **Hub screens** use `position: fixed` overlays; game screens use relative positioning
- **Lenis** destroyed on hub screens, created on game screens
- **CARD_IMAGES array** in hub.js — single place to register new card art

---

## Credentials (unchanged)
- SA email: `stormlightbrj@stormlight-rpg.iam.gserviceaccount.com` (can't rename — GCP)
- SA private key: in `app/gameState.js` (same as before)
- Sheet ID: `1f2lS_y0e4eZHYBX68QHJHG-8mmI9680nBNf1fG3ZdEw`
