# CYOAhub

**Multiplayer AI-powered RPGs** -- choose a world, build a party, and let the AI Game Master take you on an adventure.

## What Is CYOAhub?

A system-agnostic multiplayer RPG platform. The AI GM, async multiplayer engine, combat system, and UI are shared infrastructure. Worlds are pluggable data + config files that drop in on top.

### Three Ways to Play

| Path | Status |
|------|--------|
| **Stormlight Chronicles** -- Cosmere RPG (10 Orders, Surgebinding, Shardblades) | Live |
| **D&D 5e** -- Official Basic Rules (4 classes, 4 races, spells, monsters) | Live |
| **Build Your Own World** -- 7-step wizard with enemy category picker | Live |

### World Library

Every world lives in a browsable hub with two tiers:

- **Official** -- curated by CYOAhub (Stormlight, D&D 5e)
- **Community** -- built and published by players via the wizard

## Quick Start

1. Open `index.html` in a browser (or visit the GitHub Pages URL)
2. Landing page -- pick **Enter a World** or **Create a World**
3. Choose a world from the hub -- Stormlight, D&D 5e, or a custom world
4. Create your character, invite friends, and begin your adventure

## Architecture

```
cyoahub/
  index.html                    -- 9 screens: 3 hub + 6 game (hash routing)
  app/
    systems/
      stormlight.js             -- Stormlight Chronicles system data + gmContext
      dnd5e.js                  -- D&D 5e system data (Basic Rules)
      custom.js                 -- Builds SystemData from wizard worldConfig
    enemyPatterns.js            -- Shared enemy pattern library (15 categories, 57+ patterns)
    gameState.js                -- System loader + data aliases + game mechanics
    rulesEngine.js              -- window.Rules API (dice, combat, conditions)
    hub.js                      -- Landing particles, wizard, router, enemy picker
    ui.js                       -- UI rendering, Sheets API, WebSocket, audio
    combat.js                   -- 5-phase combat, AI GM narration, enemy scaling
    main.js                     -- GSAP animations, Lenis scroll, effects
  api/
    client.js                   -- Network layer, Sheets API, WorldLibrary
  styles/
    base.css                    -- Design tokens + reset
    hub.css                     -- Hub screens + enemy category grid + themes
    animations.css              -- Keyframes
    components.css              -- Game UI components
  assets/                       -- UI images (bg, hero cards)
  GameCardImgs/                 -- User-selectable card art (9 images)
```

### Key Patterns

- **`window.SystemData`** -- active world's data; all game code reads from it
- **`loadSystem(id)`** -- switches the active system, applies theme CSS
- **`gmContext`** -- 6-field object that gives any world a full AI GM
- **Hash routing** -- `#worlds`, `#wizard`, `#campaign` etc.
- **Enemy categories** -- shared pattern library filtered by each system's `enemyCategories` array

### Script Load Order
```
stormlight.js -> dnd5e.js -> custom.js -> enemyPatterns.js ->
gameState.js -> rulesEngine.js -> hub.js -> ui.js -> combat.js -> main.js
```

## Tech Stack

- **Frontend**: Vanilla JS, Tailwind CSS, GSAP, Alpine.js, Lenis
- **AI**: Claude API via Cloudflare Worker proxy
- **Multiplayer**: Cloudflare Durable Objects + WebSockets
- **Persistence**: Google Sheets API (campaigns, world library)
- **Hosting**: GitHub Pages

## Infrastructure

| Service | URL |
|---------|-----|
| Live Site | `rruss1.github.io/CYOAHUB` |
| Worker Proxy | `cyoahub-proxy.rruss7997.workers.dev` |
| Google Sheet | `1f2lS_y0e4eZHYBX68QHJHG-8mmI9680nBNf1fG3ZdEw` |

## Adding a New Game System

1. Create `app/systems/yoursystem.js` with `window.YourSystem = { ... }` matching the SystemData shape
2. Add entry to `loadSystem()` in `gameState.js`
3. Add a world card to the `#worlds-grid` in `index.html`
4. Set `enemyCategories` array to pick from the shared enemy library
5. Fill in `gmContext` -- the AI GM reads these 6 fields for every prompt

## License

Game content is original. D&D 5e Basic Rules content used under Wizards of the Coast OGL/Creative Commons.
Stormlight Archive setting inspired by Brandon Sanderson's Cosmere.
