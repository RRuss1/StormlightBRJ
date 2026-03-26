# ⑂ CYOAhub — Master Build Plan

**Project:** Stormlight Chronicles → CYOAhub  
**Tagline:** Multiplayer AI-powered RPGs  
**Date:** 2026-03-26  
**Repo:** github.com/rruss1/cyoahub (rename from StormlightBRJ)  
**Live:** rruss1.github.io/cyoahub  
**Worker:** stormlight-proxy.rruss7997.workers.dev (rename optional, not urgent)  
**Sheet ID:** 1f2lS_y0e4eZHYBX68QHJHG-8mmI9680nBNf1fG3ZdEw

---

## What CYOAhub Is

A system-agnostic multiplayer RPG platform. The AI GM, async multiplayer engine, combat system, and UI shell are shared infrastructure. Worlds are pluggable data + config files that drop in on top.

> **CYOAhub is the platform. Stormlight Chronicles is one game on it.**

### Three Ways to Play

| Path | Status |
|------|--------|
| ⟁ **Stormlight Chronicles** — Cosmere RPG | ✅ Built |
| ⚔ **D&D 5e** — Official Basic Rules | 🔲 Phase 3 |
| 🌍 **Build Your Own World** — Custom wizard | 🔲 Phase 4 |

### World Library

Every world lives in a browsable hub. Two tiers:

| Tier | Source |
|------|--------|
| 🏛 Official | Curated by CYOAhub |
| 🌐 Community | Built and published by players |

---

## UX Flow

Three screens. No dead ends.

```
┌─────────────────────────────────────────────────┐
│                  LANDING PAGE                   │
│                                                 │
│    CYOAHUB                          ☰           │
│                                                 │
│       Choose Your Own Adventure                 │
│     Multiplayer AI-powered RPGs                 │
│                                                 │
│   ┌─────────────────┐  ┌─────────────────┐     │
│   │  Enter a World  │  │ Create a World  │     │
│   │   (gold card)   │  │  (teal card)    │     │
│   └─────────────────┘  └─────────────────┘     │
└─────────────────────────────────────────────────┘
          │                       │
          ▼                       ▼
┌──────────────────┐   ┌──────────────────────────┐
│   WORLD HUB      │   │   WORLD BUILDER WIZARD   │
│                  │   │                          │
│ ⟁ Stormlight    │   │  Step 1: Identity        │
│ ⚔ D&D 5e        │   │  Step 2: Magic System    │
│ 🌑 Grimdark...   │   │  Step 3: Stat System     │
│ + community...   │   │  Step 4: World Facts     │
│                  │   │  Step 5: GM Personality  │
│ ⊕ Create World  │◄──│  Step 6: Visual Theme    │
└──────────────────┘   │    [Finish] → Hub        │
          │            └──────────────────────────┘
          ▼
┌──────────────────┐
│  CAMPAIGN PICKER │
│  (per world)     │
│  + New Campaign  │
└──────────────────┘
          │
          ▼
   Lobby → Game (existing flow)
```

### Screen 1 — Landing

- Full-viewport nebula background image (`bg.jpg`)
- `CYOAHUB` logo top-left, hamburger menu ☰ top-right (placeholder for future nav)
- Large gold title: **"Choose Your Own Adventure"**
- Italic subtitle: *"Multiplayer AI-powered RPGs"*
- Two centered cards only — **Enter a World** (gold) and **Create a World** (teal)
- No nav links, no footer, nothing else — the choice is the whole page
- Animated geometric connector lines (canvas, gold, floating nodes)
- GSAP entrance — title, subtitle, cards stagger in from below on load

### Screen 2 — World Hub

- Grid of world cards (Official + Community + Create tile)
- Filter tabs: All / Official / Community / Mine
- Back button top-left, "+ Create World" button in nav
- Click any world card → Campaign Picker for that world
- After wizard completes → redirect here, new card animates in with `back.out` spring

### Screen 3 — World Builder Wizard

- 6-step form with animated progress dots
- Steps: Identity → Magic → Stats → World Facts → GM Personality → Visual Theme
- Step 6: live color picker, font selector, real-time preview panel
- Final buttons: **Save as Private** and **Publish to Hub**
- Both redirect to World Hub; published worlds enter Community moderation queue

### Routing — Hash-based (GitHub Pages compatible)

```js
const ROUTES = {
  "":          "landing",
  "#worlds":   "worlds",
  "#wizard":   "wizard",
  "#campaign": "campaign",  // ?world=stormlight
};
```

### Hamburger Menu (☰)

Top-right on all screens. Placeholder for future auth/navigation.
Contains: Worlds, Campaigns, Login.
CSS transition open/close. Closes on outside click.
Will wire to real auth in Phase 6.

---

## Architecture

### What Is Already System-Agnostic (Keep As-Is)

- Async multiplayer — Cloudflare KV, WebSockets, turn management
- AI GM narration pipeline — prompt-driven, lore context swappable
- 5-phase simultaneous combat resolution
- `window.Rules` API — abstracted, needs implementations per system
- Action log, world memory, NPC memory, oath/progression hooks
- Full UI shell — campaign screen, lobby, game screen, combat screen
- Audio — procedural storm, ambient chord, TTS narrator
- GSAP animation system, NL-7 event bus
- Google Sheets persistence layer
- Cloudflare Worker proxy

### What Is Stormlight-Specific (Must Be Extracted in Phase 1)

- All class/order data — Radiant Orders, Hero paths, surge lists
- Location/act seed system — 34 Roshar locations
- NPC name pools + class flavors
- Oath progression — 5 ideals per Order
- Stormlight GM prompt lore strings
- Enemy pools — Parshendi, Fused, Unmade, sea creatures
- Shardblade weapon system, investiture/focus mechanics
- `rulesEngine.js` — physDef/cogDef/spirDef, Cosmere math

---

## Target File Structure

```
cyoahub/
├── index.html                    ← Landing + World Hub + Wizard (hash routing)
│
├── app/
│   ├── gameState.js              ← Generic shell + system loader
│   ├── ui.js                     ← Generic UI (branches on gState.system)
│   ├── combat.js                 ← Generic combat engine
│   ├── main.js                   ← Boot + GSAP (mostly unchanged)
│   ├── rulesEngine.js            ← Generic Rules API surface
│   │
│   └── systems/
│       ├── stormlight.js         ← All Stormlight data + gmContext + rules
│       ├── dnd5e.js              ← All D&D 5e data + gmContext + rules
│       └── custom.js             ← Builds SystemData from worldConfig
│
├── api/
│   └── client.js                 ← Add loadWorldLibrary()
│
├── bg.jpg                        ← Nebula background (landing page)
│
└── styles/
    ├── base.css                  ← Shared design tokens
    ├── animations.css            ← Shared keyframes
    ├── components.css            ← Shared components
    └── themes/
        ├── stormlight.css        ← Gold/amber (current palette, extracted)
        ├── dnd5e.css             ← Crimson/parchment
        └── custom.css            ← Neutral fallback, overridden by worldConfig.theme
```

---

## Theme System

Each world overrides CSS custom properties. Component CSS is untouched.

```css
body[data-system="stormlight"] { --theme-primary: #C9A84C; ... }
body[data-system="dnd5e"]      { --theme-primary: #9B2335; ... }
body[data-system="custom"]     { /* injected from worldConfig.theme at runtime */ }
```

### Official Themes

#### ⟁ Stormlight Chronicles
| Token | Value | Feel |
|-------|-------|------|
| Primary | `#C9A84C` | Warm gold |
| Secondary | `#28A87A` | Stormlight teal |
| Danger | `#B03828` | Coral red |
| BG | `#0F0D08` | Near-black warm |
| Fonts | Cinzel + Crimson Pro | Regal |

#### ⚔ D&D 5e — Crimson & Parchment
| Token | Value | Feel |
|-------|-------|------|
| Primary | `#9B2335` | Crimson |
| Secondary | `#C4972F` | Candlelight |
| Danger | `#6B2737` | Blood red |
| BG | `#0D0A07` | Dungeon black |
| Fonts | Uncial Antiqua + IM Fell English | Old tome |

### Result Label Color Palette (Action Log) — Locked

| Label | Hex |
|-------|-----|
| `[CRIT!]` | `#C9A84C` gold |
| `[SUCCESS]` | `#28A87A` teal |
| `[PARTIAL]` | `#76A2E8` blue |
| `[FAILED]` | `#B03828` red |
| `[FUMBLE]` | `#93979E` gray |

---

## GM Prompt Architecture

The most critical extensibility decision. Every `systems/*.js` exports a `gmContext` object. Every GM prompt reads from it. Any world that fills in these six fields gets a full AI GM.

```js
export const gmContext = {
  worldLore:       "Roshar — a world of storms and ancient oaths...",
  combatLore:      "Stormlight surges, Shardblades, physDef/cogDef/spirDef...",
  toneInstruction: "Epic Sanderson fantasy — mythic stakes, personal cost.",
  magicRules:      "Surgebinding costs Stormlight (Focus). Radiants speak Ideals to grow.",
  npcFlavor:       "Rosharan names, Alethi culture, spren companions.",
  choiceTagRules:  "[COMBAT] [DISCOVERY] [DECISION] [SURGE] — tag every player choice.",
};
```

In `turnPrompt()`, `npcPrompt()`, `callCombatGM()`:
```js
const ctx = window.SystemData.gmContext;
// Inject ctx.worldLore, ctx.toneInstruction, etc. into every prompt
```

---

## gState — New Fields

```js
gState = {
  system:      "stormlight" | "dnd5e" | "custom",
  worldId:     "stormlight",
  worldConfig: {
    name: "", tone: "", magic: {}, stats: {},
    factions: [], locations: [], conflict: "", gm: {},
    theme: {
      primary: "#C9A84C", secondary: "#28A87A", danger: "#B03828",
      bgTone: "dark", titleFont: "Cinzel", bodyFont: "Crimson Pro",
    },
  },
  // All existing fields unchanged
}
```

---

## World Library — Google Sheets

New tab: `WorldLibrary`. Each row = one world.

| Column | Description |
|--------|-------------|
| `worldId` | Unique slug e.g. `stormlight`, `grimdark-hinterlands` |
| `tier` | `official` or `community` |
| `name` | Display name |
| `tagline` | One sentence |
| `author` | `CYOAhub` or player name |
| `system` | `stormlight` / `dnd5e` / `custom` |
| `config` | Full `worldConfig` JSON blob |
| `rating` | Avg star rating |
| `plays` | Campaign count |
| `published` | Bool — community worlds start false |

`loadWorldLibrary()` reads and caches for 60s.

---

## Build Phases

---

### PHASE 0 — Rebrand Sweep

**Do:** Rename repo, replace `STORMLIGHT_CONFIG` → `CYOA_CONFIG`, update `<title>` to `CYOAhub`, update docs.

**Don't touch:** Stormlight lore, class names, GM prompts, CSS animation class names.

```bash
grep -r "StormlightBRJ\|STORMLIGHT_CONFIG" . # must return nothing before push
git commit -m "rebrand: STORMLIGHT_CONFIG → CYOA_CONFIG, title → CYOAhub"
# Then rename repo in GitHub UI: Settings → cyoahub
```

---

### PHASE 1 — Extract Stormlight + System Loader

Move all Stormlight-specific data from `gameState.js` into `app/systems/stormlight.js`.
Add `system: 'stormlight'` to `gState` (default — no breaking change).
Audit `ui.js` + `combat.js` — all data lookups go via `window.SystemData`.
Extract GM prompt lore strings into `gmContext` object exported from system file.

`git commit -m "refactor: extract Stormlight data into systems/stormlight.js"`

---

### PHASE 2 — Landing Page + World Hub Integration

Deploy `index.html` (landing page, already built) to repo root.
Wire World Hub to `loadWorldLibrary()` from Sheets.
Campaign Picker filters campaigns by `worldId`.
Theme injection on campaign entry.

`git commit -m "feat: landing page + world hub wired to live data"`

---

### PHASE 3 — D&D 5e

Source: `PlayerBasicRulesV03.pdf` (on file, 114pp, June 2015, Creative Commons).

- `app/systems/dnd5e.js` — races, classes, backgrounds, spells, monsters, gmContext
- Character creation: Race → Class → Ability Scores → Background → Equipment → Spells
- D&D rules engine: ability modifier, proficiency bonus, AC, spell slots, death saves
- D&D theme — crimson/parchment, Uncial Antiqua + IM Fell English

```
git commit -m "feat: dnd5e system — data, rules engine, character creation, theme"
```

---

### PHASE 4 — Custom World Builder

Wire wizard form → `worldConfig` → `window.SystemData` via `app/systems/custom.js`.
Custom GM context builder generates all 6 `gmContext` fields from wizard answers.
Save/publish to `WorldLibrary` Google Sheet.
Theme injection from `worldConfig.theme` at runtime.

`git commit -m "feat: custom world builder wires to live SystemData + sheet"`

---

### PHASE 5 — World Library

Create `WorldLibrary` tab in Google Sheet manually (add headers now).
`loadWorldLibrary()` in `api/client.js` — reads tab, caches 60s.
World Hub renders dynamically from sheet data (not hardcoded HTML).
Seed official worlds: Stormlight, D&D, Grimdark Hinterlands, The Drowned Empires.
Publish flow saves `worldConfig` JSON to sheet row.

`git commit -m "feat: world library from Sheets — dynamic hub, official worlds seeded"`

---

### PHASE 6 — Polish

- Hamburger menu wires to real auth
- Per-world CSS themes load lazily (only Cinzel + Crimson Pro at boot)
- Campaign cards show world badge + act/turn progress
- Mobile layout — grid collapses to 1 column
- Social sharing — copy campaign invite link
- Chronicle export formatted per system

---

## Risk Register

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| D&D spell complexity slows Phase 3 | High | Ship without spells first, add in Phase 3.5 |
| Custom wizard produces incoherent GM prompts | Medium | Haiku validation pass before saving |
| Existing Stormlight campaigns break in Phase 1 | Medium | `system` defaults to `'stormlight'`, fallbacks everywhere |
| Landing + RPG app routing conflict on GitHub Pages | Medium | Decide single-file vs separate files before Phase 2 |
| `rulesEngine.js` API diverges between systems | Low | Define shared interface contract before D&D impl |

---

## Immediate Next Steps

1. Open `index.html` + `bg.jpg` locally — verify background, two cards, all screens work
2. Phase 0 — rename repo in GitHub UI, sweep `STORMLIGHT_CONFIG`
3. Phase 1 — list every constant in `gameState.js` to extract, create `app/systems/` folder
4. **Routing decision** — landing `index.html` + RPG app: same file or separate? Answer before Phase 2
5. Create `WorldLibrary` tab in Google Sheet now — add column headers so Phase 5 has a target

---

## Files Changing By Phase

| File | Change | Phase |
|------|--------|-------|
| `index.html` (landing) | New file — already built | 2 |
| `index.html` (RPG app) | Title + config rename | 0 |
| `app/gameState.js` | Config rename + system loader + data extract | 0, 1 |
| `app/ui.js` | Branch by system, SystemData lookups, GM prompts | 1, 2 |
| `app/combat.js` | Enemy pools from SystemData | 1 |
| `app/rulesEngine.js` | D&D implementation alongside Cosmere | 3 |
| `app/systems/stormlight.js` | New | 1 |
| `app/systems/dnd5e.js` | New | 3 |
| `app/systems/custom.js` | New | 4 |
| `api/client.js` | Add `loadWorldLibrary()` | 5 |
| `styles/themes/stormlight.css` | Extract from base.css | 1 |
| `styles/themes/dnd5e.css` | New | 3 |
| `styles/themes/custom.css` | New | 4 |
| `CLAUDE_CODE_HANDOFF.md` | Update repo name + config var | 0 |

---

## Key Rules — Read Every Session

- Always edit `app/`, `api/`, `styles/` — never root-level JS in the RPG app
- One commit per fix; `node --check` every JS file after edit
- `grep -r "goretusk55"` must return nothing before any push
- `rulesEngine.js` loads before `ui.js` — maintain script order in `index.html`
- `gState.system` defaults to `'stormlight'` — never break existing campaigns
- Landing `index.html` and RPG app `index.html` are **different files** — do not confuse them
- D&D Basic Rules PDF is on file (`PlayerBasicRulesV03.pdf`, 114pp) — reference for Phase 3

*Update status column in the Three Ways to Play table at the start of each session.*
