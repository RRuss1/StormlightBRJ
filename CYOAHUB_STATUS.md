# CYOAhub — Session Status

**Date:** 2026-03-27
**Repo:** github.com/rruss1/StormlightBRJ (rename to `cyoahub` pending)
**Live:** rruss1.github.io/StormlightBRJ → will become rruss1.github.io/cyoahub
**Worker:** `cyoahub-proxy.rruss7997.workers.dev` (renamed from stormlight-proxy)
**Sheet ID:** `1f2lS_y0e4eZHYBX68QHJHG-8mmI9680nBNf1fG3ZdEw`

---

## What Was Done This Session

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
├── assets/
│   ├── bg.jpg                 ← Nebula background (landing)
│   ├── background worlds.jpg  ← Worlds screen backdrop
│   ├── EnterWorlds.png        ← Landing hero card image
│   └── CreateWorld.png        ← Landing hero card image
├── GameCardImgs/              ← User-selectable card art (add more here)
│   ├── DnD.png
│   ├── Dragons.png
│   ├── FACE1.png
│   ├── Monk.png
│   ├── Palace.png
│   ├── RedHorse.png
│   ├── Stormlight.png
│   ├── Unicorns.png
│   └── cosmic face.png
├── app/
│   ├── systems/
│   │   └── stormlight.js      ← All Stormlight data + gmContext
│   ├── gameState.js           ← System loader + aliases + game functions
│   ├── rulesEngine.js         ← window.Rules API (Cosmere math)
│   ├── hub.js                 ← Hub particles, wizard, router, image picker
│   ├── ui.js                  ← UI rendering + enhanced showScreen()
│   ├── combat.js              ← Combat + parameterized GM prompts
│   └── main.js                ← GSAP, Lenis control, NL-7 systems
├── api/
│   └── client.js              ← Network layer
├── styles/
│   ├── base.css               ← Design tokens + reset
│   ├── hub.css                ← Hub screen styles
│   ├── animations.css         ← Keyframes
│   └── components.css         ← Game UI components
└── CYOAhubfiles/              ← Old reference files (can delete eventually)
```

## Script Load Order
```
stormlight.js → gameState.js → rulesEngine.js → hub.js → ui.js → combat.js → main.js
```

---

## Known Issues

1. **Landing page scroll** — scrollbar appears but mousewheel doesn't work. Lenis is destroyed on hub screens but the fixed-position flex container may still be preventing native scroll. Needs CSS investigation (likely the flex children shrinking to fit instead of overflowing).

2. **Game screen titles hardcoded** — `index.html` lines 428, 499, 872, 904 say "Stormlight Chronicles". These should eventually become dynamic based on `SystemData.name` when entering a world.

3. **Repo not yet renamed** — Still `StormlightBRJ` on GitHub. Rename to `cyoahub` in Settings → Repository name.

---

## What's Next

### Immediate
- Fix landing page mousewheel scroll
- Test full flow: landing → worlds → pick Stormlight → campaign picker → game → combat
- Verify no regressions in existing Stormlight gameplay

### Phase 3 — D&D 5e
- Create `app/systems/dnd5e.js` — races, classes, backgrounds, spells, monsters, gmContext
- Source: `PlayerBasicRulesV03.pdf` (114pp, on file)
- D&D rules engine: ability modifier, proficiency bonus, AC, spell slots, death saves
- D&D theme CSS — crimson/parchment, Uncial Antiqua + IM Fell English

### Phase 4 — Custom World Builder
- Wire wizard form → `worldConfig` → `window.SystemData` via `app/systems/custom.js`
- Custom gmContext builder generates all 6 fields from wizard answers
- Save/publish to `WorldLibrary` Google Sheet

### Phase 5 — World Library
- Create `WorldLibrary` tab in Google Sheet (column headers ready)
- `loadWorldLibrary()` in `api/client.js`
- World Hub renders dynamically from sheet data instead of hardcoded HTML

### Phase 6 — Polish
- Hamburger menu → real auth
- Per-world CSS theme injection
- Mobile layout (1-column grid)
- Campaign invite link sharing

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
