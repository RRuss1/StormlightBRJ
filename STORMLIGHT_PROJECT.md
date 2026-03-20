# ⟁ Stormlight Chronicles — Project Bible

**Live URL:** https://rruss1.github.io/StormlightBRJ/  
**Repo:** github.com/rruss1/StormlightBRJ  
**Stack:** Single-file HTML/CSS/JS · Google Sheets API v4 · Anthropic Claude API · Cloudflare Worker  
**File stats:** 244KB · 4,167 lines · 194 functions · 32KB CSS · 178KB JS

---

## What It Is

A browser-based async multiplayer RPG set in Brandon Sanderson's Stormlight Archive universe. Players build Knight Radiant or Hero of Roshar characters and take turns making choices that shape a 180-turn epic saga across three acts. An AI Game Master (Claude Sonnet) narrates every consequence and generates contextual choices. No app install, no accounts, no server to maintain.

---

## Architecture

```
Browser (index.html — single file, everything)
    │
    ├── Google Sheets API v4
    │     JWT auth via Web Crypto API (SA private key in-file)
    │     Per campaign: Campaign_xyz_State (JSON blob in A1)
    │                   Campaign_xyz_Log   (one entry per row)
    │
    ├── Cloudflare Worker  →  stormlight-proxy.goretusk55.workers.dev
    │     Anthropic API proxy (hides key from client)
    │
    └── Anthropic Claude API
          GM narration (exploration):          claude-sonnet-4-20250514
          GM narration (combat):               claude-sonnet-4-20250514
          Combat choices (generateCombatChoices): claude-sonnet-4-20250514
          TLDR summaries:                      claude-haiku-4-5-20251001
          Thai translation:                    claude-haiku-4-5-20251001
          Act transition summaries:            claude-haiku-4-5-20251001
          World memory updates:                claude-haiku-4-5-20251001
```

**Google Sheet ID:** `1f2lS_y0e4eZHYBX68QHJHG-8mmI9680nBNf1fG3ZdEw`  
**Service Account:** `stormlightbrj@stormlight-rpg.iam.gserviceaccount.com`  
**Worker URL:** `https://stormlight-proxy.goretusk55.workers.dev`

---

## Screen Flow

```
s-campaign → s-title → s-create (4 steps) → s-lobby → s-game ↔ s-combat
```

All screens are siblings in the DOM. `showScreen(id)` removes `.active` from all, adds to target, clears create sub-step inline styles, and scrolls to top. **Critical: screens must be direct siblings — any nesting causes invisible screen bugs.**

---

## GM Storytelling System

### The Craft Persona
The GM is instructed to write as *"an expert fantasy author — Brandon Sanderson crossed with Joe Abercrombie: epic but grounded, mythic but specific."* Every prompt leads with craft identity before mechanical rules.

### Narrative Memory (Three Layers)

**Short-term (`getRecentBeats`)** — Last 3 turns of player actions + GM responses pulled from `gState.actionLog`. Injected into every prompt as *"IMMEDIATE HISTORY — these events just happened — treat as seconds ago, not ancient history."* Prevents the GM from treating recent events as distant history.

**World state (`getWorldMemoryContext`)** — Factions, secrets, met NPCs, recent choices, act consequences. Updated by Haiku after every GM beat via `updateWorldMemory`.

**Spren memories (`getSprenMemoryContext`)** — Per-character spren memory derived from notable actions. Woven into narration naturally.

### Combat Thread (`getCombatThread`)
Pulls the last 3 pre-combat GM beats and world secrets. Injected into the combat opening prompt so the fight's cause is referenced in sentence 1. The GM is required to connect the enemy to what was discovered in exploration — no fight appears from nowhere.

### Character Context (`getCharContext`)
Every GM call receives: origin, motivation, backstory, appearance, weapon name + tier + description, fighting style, Shardblade power level by tier, surgebinding abilities list. Heroes of Roshar get the same richness as Radiants.

### 5-Stage Exploration Arc
Beat position determines the narrative job:

| Stage | Beat Position | GM's Job |
|-------|--------------|----------|
| DISCOVERY | 1 of N | Build the location with sensory specificity. No hints at combat. |
| DEEPENING | Mid | Something is wrong in a way characters sense but cannot name. Plant seeds. |
| RISING TENSION | N-2 | Echo a specific detail from recent history as warning. World tightens. |
| FINAL BEAT | N-1 | Pure dread. Violence is seconds away. End on a held breath. |
| CONFRONTATION | Pre-combat | The threat ARRIVES. End at the moment before weapons clash. |

### Craft Rules (applied in every prompt)
- Begin with what the world does — not what the player did
- Roll outcome felt as story shape, not label
- Short sharp sentences during action; longer atmospheric ones for environment
- Emotion through physical action — never stated directly
- Injuries persist and accumulate across beats
- Sentence variety enforced: no opening with character name, "As [name]", or gerund phrases
- No "suddenly", "quickly", "immediately"
- No game terminology in narration
- Descriptive pauses before/after combat — not during

### Variable Beat Length
- Critical success or failure: 3 sentences (deserves space)
- Pre-combat confrontation: 3-4 sentences (most important beat)
- Normal beats: 2-3 sentences

### Combat Narration Craft
- Opening: 3 sentences — threat arrives, environment as danger, moment before contact
- Rounds: 3 sentences — all outcomes woven into one scene (not a list), momentum shown, ends on uncertainty
- Round context escalates: Round 1 = chaos, Rounds 2-3 = pattern forming, 4-5 = exhaustion, 6+ = final moments
- Victory: relief and exhaustion, not glory
- Defeat: stillness and consequence, not despair

---

## Combat System (5-Phase Simultaneous Resolution)

All units choose actions first, then resolve in strict phase order.

```
PHASE 1: BUFFS/DEBUFFS   — pre-damage status effects (future expansion placeholder)
PHASE 2: OFFENSE         — attacks and surges (players + enemies simultaneously)
PHASE 3: DEFENSE         — guard stances (DR applies to NEXT incoming hit, not retroactive)
PHASE 4: HEALING         — heals and revives after all damage
PHASE 5: END-OF-TURN     — hazard ticks, status durations, defending flag reset
```

### Action Buckets (`getActionBucket`)

| Bucket | Phase | Stat | Roll Outcomes |
|--------|-------|------|---------------|
| ATTACK | OFFENSE | STR/DEX | CRIT=bonus dice, HIT=standard, PARTIAL=1 chip, MISS=nothing, FUMBLE=self damage |
| SURGE | OFFENSE | INT | Same structure, surgebinding flavor |
| SKILL | OFFENSE | CHA/WIS | Social/perception |
| DEFEND | DEFENSE | END | HIT/CRIT sets `p.defending=true` for DR next hit |
| HEAL | HEAL | WIS | CRIT=150%, HIT=full, PARTIAL=60%, MISS=fizzle, FUMBLE=backlash |
| REVIVE | HEAL | WIS | PARTIAL=½HP, HIT=full revive HP, CRIT=double. Clears `downed` flag. |

### Enemy AI
- Targets locked at declaration time
- Low HP (<30%) → 40% chance to defend
- Priority target: lowest HP living party member (60% weight)

### Combat Persistence
`enterCombat` checks for living enemies before re-initializing. **Pausing mid-combat and returning preserves enemy HP, round, and pending actions.**

### Combat Choices UX
- Shimmer skeleton cards shown while Sonnet generates choices
- Cache in `gState.combatChoicesCache[playerName]`, cleared each round
- Custom action keywords: `attack`, `heal`, `revive`, `defend`, `surge`, `skill` (case insensitive, prefix stripped)

---

## Exploration System

### Turn Loop
Player submits action → d20 roll + stat check → log → GM narrates → turn advances → passive regen → next player.

### Passive Stormlight Regen
Every story turn (not combat), every living party member (Radiant and Hero) gains +d4 HP capped at `maxHp`.

### World Memory
```javascript
gState.worldMemory = {
  factions: {},        // 'Alethi': 'neutral'
  secrets: [],         // ['The tower has a mind of its own']
  metNPCs: [],         // [{name:'Tarah', context:'healer, owes party favor'}]
  choices: [],         // [{turn:12, summary:'Slac warned the refugees'}]
  actConsequences: {}  // {2: 'Kharbranth remembers you'}
}
```

### Structure
- 180 turns, 3 acts, 34 randomized Roshar locations
- 3–8 beats before each combat (randomized at campaign start)
- Pre-combat dramatic tension beat before fight starts
- Boss encounters once per act, 3 HP phases, guaranteed drops
- Act transitions at turn 60 and 120 with Haiku-generated consequence text

---

## Audio System

### Storm Synthesis (Web Audio API — zero file downloads)
Four wind layers spatially separated (left/right/center/far-left), each with:
- Gust sweep LFO — filter frequency sweeps so wind breathes instead of droning
- Amplitude LFO — volume swell at different rates per layer
- Slow stereo pan movement — storm feels like it's moving around you

Plus rain layer (highpass noise with flutter LFO), thunder + lightning crackle (shaped noise burst preceding the rumble), and Stormlight hum (3-oscillator beating sine pair with swell).

### `stormIntensify(intense)`
Called automatically on combat entry/exit. Ramps all layers to 1.8x volume over 2.5s on combat start, fades back to 1.0x over 4s on return to exploration.

### TTS
On-demand only via 🔈 button. No auto-play. `autoSpeak` is hardcoded `const false`. Web Speech API with system voice fallback.

---

## Multiplayer

- Party size 2–5
- Slot reservation prevents join collisions
- Lobby polls every 5s — only routes to game if `myChar` exists
- Phase routing: `playing && myChar` → game; `playing && !myChar` → lobby
- Skip Turn: host skip, self-skip, Away Mode
- NPC auto-fill with 60+ Rosharan names
- Late joiner NPC claim

---

## Model Assignment Rationale

| Call | Model | Reason |
|------|-------|--------|
| Exploration GM narration | Sonnet | Players read every word — quality is the product |
| Combat GM narration | Sonnet | Dramatic payoff moment |
| Combat choices | Sonnet | Players deliberate over these |
| TLDR summary | Haiku | 2 sentences, fast |
| Thai translation | Haiku | Pattern matching |
| Act transition | Haiku | Distillation task |
| World memory update | Haiku | JSON extraction, not generation |

---

## Hardened Audit Checklist

Run after every session before pushing:

```python
# 1. Single HTML document
assert c.count('<html') == 1 and c.count('<!DOCTYPE') == 1

# 2. All 6 screens as proper <div id="s-xxx"> (not raw id= text)
for s in ['s-campaign','s-title','s-create','s-lobby','s-game','s-combat']:
    assert c.count(f'<div id="{s}"') == 1

# 3. Div balance between every adjacent screen pair
for each adjacent pair: assert opens == closes in segment

# 4. No hardcoded display:block on create sub-steps in HTML
for step in ['create-s1','create-s2r','create-s2h','create-s3','create-s4']:
    assert 'display:block' not in html_opening_tag(step)

# 5. showScreen body clears all create sub-step inline styles
# 6. JS syntax clean: node --check → exit 0
# 7. All 27 critical functions present
# 8. Dead references gone: spawnEnemies, rollInitiative, renderSlots, kokoro*
# 9. Nothing after </html>
```

---

## Bug Graveyard

| Bug | Root Cause | Prevention |
|-----|-----------|------------|
| Blank screen after Speak the Oath | Duplicate HTML document embedded at malformed comment marker | `c.count('<html') == 1` |
| `s-lobby not found` alert | Missing `<div ` before `id="s-lobby"` | Check `<div id="s-xxx"` not just `id="s-xxx"` |
| Lobby invisible despite renderLobby COMPLETE | `s-create` missing `</div>` — lobby was child of create | Div balance check between every adjacent screen pair |
| Lobby blank after correct render | `showCreateStep(4)` inline `display:block` persisted | `showScreen()` clears all create sub-step inline styles |
| Routing to game without character | `selectCampaign` sent `phase=playing` → game regardless of `myChar` | `playing && myChar` → game; `playing && !myChar` → lobby |
| `playerOutcomes is not defined` | Referenced before declared in resolveRound | Derive from `roundDice.entries` before `callCombatGM` |
| `spawnEnemies is not defined` | Function deleted but call left in `callGM` | Search all callers before removing any function |
| Heals never applied | `[HEAL]` branch never set `p.hp` | Write `p` back to `gState.players[pi]` AND `myChar` |
| Re-entering combat spawns fresh enemies | `enterCombat` always re-initialized unconditionally | Check `gState.combatEnemies` for living enemies first |
| Combat choices flash generic then AI | `buildCombatChoices` rendered immediately, Sonnet updated after | Shimmer skeleton cards until cache populated |

---

## Testing

`combat_tester.py` — standalone Python combat simulator:
- Mirrors JS mechanics exactly (phases, buckets, dice, enemy AI)
- 5 scenarios: 2v2, 1v3 outnumbered, revive test, Hero mechanics, full party
- Hard caps: 8 rounds, 3 combats, 8000 tokens (~$0.002)
- Bug checks: HP negative, heal exceeds maxHp, revive flag not cleared

```bash
export ANTHROPIC_API_KEY=your_key
python3 combat_tester.py
```

---

## Cost Per Session

| Service | Cost |
|---------|------|
| GitHub Pages | Free |
| Google Sheets API | Free |
| Cloudflare Worker | Free |
| Sonnet per GM turn | ~$0.003 |
| Haiku (TLDR/translation/memory) | ~$0.0002/beat |
| **Full 180-turn campaign** | **~$0.54 total** |

---

## Roadmap

### Next — Cloudflare Durable Objects
Replace Sheets polling with WebSocket real-time. See `CLOUDFLARE_SETUP.md`. Turn latency: 5-15s → <500ms.

### Near Term
- [ ] Streaming GM responses (token-by-token typewriter)
- [ ] Push notifications
- [ ] PWA manifest + Service Worker
- [ ] Presence indicators (🟢/🟡/⚫)
- [ ] Phase 1 buff/debuff system (poison, burn, Voidlight corruption)

### Medium Term
- [ ] Consequence board (surface worldMemory visually)
- [ ] Shardblade Duels (PvP)
- [ ] The Hoid System (2% per 10 turns)
- [ ] Oath detection (trigger on matching actions)
- [ ] Voice input (Web Speech Recognition)

### Long Term
- [ ] Illustrated story cards (text-to-image)
- [ ] Collaborative world map
- [ ] Cross-campaign shared world memory

---

## VS Code + Claude Code

Start every new session:
> *"Read STORMLIGHT_PROJECT.md and CLOUDFLARE_SETUP.md before we begin."*

```bash
npm install -g @anthropic-ai/claude-code
cd ~/StormlightBRJ && claude
```
