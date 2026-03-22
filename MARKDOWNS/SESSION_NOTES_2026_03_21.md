# Stormlight Chronicles — Dev Session Notes
**Date:** 2026-03-21
**Scope:** Rules Engine wiring, AI DM system, NL-7 event bus fixes, gameplay audit + 5 critical bug fixes

---

## What This Project Is

**Stormlight Chronicles** is a multiplayer browser-based Cosmere RPG built on:
- Vanilla JS / HTML / CSS (no framework)
- Cloudflare KV for shared game state + multiplayer sync
- Claude API for AI Dungeon Master narration (streaming + non-streaming)
- Custom `rulesEngine.js` implementing Cosmere RPG mechanics (d20 + plot die, focus, deflect, conditions)

Key files:
- `app/combat.js` — combat loop, round resolution, GM calls (~1750 lines)
- `app/ui.js` — character creation, NPC generation, host logic, screen rendering
- `app/gameState.js` — state shape, exploration beats, NPC classes
- `app/rulesEngine.js` — `window.Rules` API: `resolveAttack()`, `applyCondition()`, etc.
- `app/main.js` — app init, screen routing, NL-7 ambient system hooks

---

## Session Work — Three Areas

---

### 1. Rules Engine → Live Combat

**Problem:** Combat used ad-hoc inline d20 rolls, not the Cosmere rules engine. CRITs were impossible (plot die never triggered). No conditions ever applied mechanically.

**What we did:**

Replaced the player attack block in `resolveRound` with a full `window.Rules.resolveAttack()` call:

```js
const ar = window.Rules.resolveAttack(
  { attrs: p.stats, skillRanks: p.skillRanks, weapon: { ... }, advantages, focus },
  { physDef: target.physDef, cogDef: target.cogDef, spirDef: target.spirDef, deflect: target.deflect },
  true  // raiseStakes — plot die fires every attack
);
```

**Plot die effects now live:**
- `ar.opportunity` (plot die = 6) → player gains +1 Focus
- `ar.complication` (plot die ≤ 2) → player chips themselves (1–2 HP)
- Outcomes: `MISS / GRAZE / HIT / CRIT` via `window.Rules.ATTACK_OUTCOME`

**Combat GM JSON output enforced:**
- `callCombatGM` now appends a JSON instruction suffix and parses the response
- Output shape: `{ "narrative": "...", "stateUpdates": { "conditionsAdded": [], "conditionsRemoved": [] } }`
- Conditions routed to `window.Rules.applyCondition(player, condition)` / `removeCondition()`
- No raw HP/roll numbers ever appear in narrative text (enforced by system prompt)

---

### 2. AI Dungeon Master System Prompt

**Added `AI_DM_SYSTEM_PROMPT` constant** (12 responsibilities) to both `callGM` (streaming story) and `callCombatGM` (non-streaming combat narration).

Core rules baked into the prompt:
- Present tense, visceral and specific — no "the attack connects", say *how*
- No raw numbers (HP, damage, roll totals) in narrative text
- Cosmere fidelity — Stormlight, Surgebinding, spren, Shards, investiture terminology
- Choices always first-person, always tagged: `[ATTACK]` `[DEFEND]` `[HEAL]` `[SURGE]`
- Translate mechanics to fiction: "downed" → "crumpled" / "barely standing on one knee"
- Tone: heroic but never naive — consequences are real

---

### 3. NL-7 Event Bus Fix

**Problem:** `sc:screenChange` CustomEvent was listened for throughout the NL-7 ambient system (weather, audio, spren effects) but was **never dispatched** anywhere. Every screen transition was silent to the event bus.

**Fix in `main.js`:** Added one dispatch line to the patched `showScreen()`:

```js
document.dispatchEvent(new CustomEvent('sc:screenChange', { detail: { screen: id } }));
```

**Other events now firing from `combat.js`:**
- `rules:attack` — dispatched after every resolved player attack (carries full `ar` result + outcome)
- `rules:unconscious` — dispatched when any player reaches 0 HP
- `sc:turnChange` — dispatched after `callCombatGM` re-renders, with the active card element

**UI improvement:** Story choices in `onContinue()` now render with type badges and GSAP stagger entrance:
```js
const TAG_COLORS = { ATTACK:'var(--coral2)', DEFEND:'var(--amber2)', HEAL:'var(--teal2)', ... };
gsap.fromTo(buttons, {opacity:0,y:10}, {opacity:1,y:0,stagger:0.07,duration:0.3});
```

---

### 4. Gameplay Audit — 5 Critical Bugs Fixed

Full audit covered: character creation → exploration → combat → post-combat → all-defeated → NPC party members.

---

#### Bug 1 — `genNPC` missing schema fields (`ui.js:332`)

**Problem:** NPC party members were created without `downed`, `isNPC`-compatible defense values, `weapons`, or Radiant flags. Combat code reading `npc.physDef` got `undefined` → defense was always 10.

**Fix:** Computed defense values from stats + added all missing fields:
```js
const physDef = 10 + Math.floor(((stats.str||0) + (stats.spd||0)) / 2);
const cogDef  = 10 + Math.floor(((stats.int||0) + (stats.wil||0)) / 2);
const spirDef = 10 + Math.floor(((stats.awa||0) + (stats.pre||0)) / 2);
return { ..., isRadiant:false, isPlaceholder:false, downed:false,
         physDef, cogDef, spirDef, weapons:[], fragments:0 };
```

---

#### Bug 2 — `isHost()` deadlock (`ui.js:1474`)

**Problem:** Host was determined by checking if slot 0 is a non-NPC human. In any party where slot 0 is an NPC (common when party fills from the bottom), `isHost()` returned `false` for everyone. Nobody could see the Resolve Round button. Combat was permanently stuck.

**Fix:** Find the first actual human player regardless of slot:
```js
function isHost(){
  if(!gState||!myChar) return false;
  const firstHuman = gState.players.find(p => p && !p.isNPC && !p.isPlaceholder);
  return firstHuman && firstHuman.name === myChar.name;
}
```

---

#### Bug 3 — Defense stance persisting forever (`combat.js:Phase 3`)

**Problem:** When a player chose DEFEND, `p.defending = true` was set. It was only cleared if an enemy happened to attack that player. If enemies attacked someone else (or the enemy died), the flag was never cleared — the player got free DR on every future attack indefinitely.

**Fix:** Sweep before Phase 3 — clear `defending` on any player who didn't actively choose DEFEND this round:
```js
const defendingActors = new Set(allActions.filter(a=>a.phase==='DEFENSE'&&!a.isEnemy).map(a=>a.actor));
gState.players.forEach((p,i) => {
  if(p && p.defending && !defendingActors.has(p.name)){ p.defending=false; gState.players[i]=p; }
});
```

---

#### Bug 4 — `allPartyDowned` instant defeat on NPC-only party (`combat.js:1215`)

**Problem:** `.every()` on an empty array returns `true`. A party with zero human players (all NPCs, or a bug in party assembly) triggered instant defeat at the start of every round check.

**Fix:** Guard with length check:
```js
const humanCombatants = gState.players.slice(0,sz).filter(p => p && !p.isNPC);
const allPartyDowned = humanCombatants.length > 0 && humanCombatants.every(p => p.downed);
```

---

#### Bug 5 — `exitCombat` state leak + `myChar` desync (`combat.js:1481`)

**Problem:** When combat ended, several state fields were NOT cleared:
- `combatEnemies` — old enemies persisted into exploration
- `combatRound`, `combatLog`, `diceLog` — stale data from prior encounter
- `isBossFight`, `combatHazard` — flags never reset
- `gState.turn` — left at whatever turn combat ended on, breaking exploration turn logic
- `myChar` — was NOT updated after `p.downed=false; p.hp=1` resurrection loop, so local myChar still showed the downed state

**Fix:** Full teardown + myChar sync:
```js
gState.players.slice(0,sz).forEach((p,i) => {
  if(!p) return;
  if(p.downed){ p.downed=false; p.hp=1; }
  if(p.defending){ p.defending=false; }
  // Strip combat-only conditions
  ['stunned','bleeding','burning','poisoned','prone'].forEach(k => delete p.conditions[k]);
  gState.players[i] = p;
  if(myChar && myChar.name === p.name){ myChar = p; saveMyChar(p); }
});
gState.combatEnemies = [];
gState.combatRound   = 0;
gState.combatLog     = [];
gState.diceLog       = [];
gState.isBossFight   = false;
gState.combatHazard  = null;
gState.turn          = 0;
```

---

## Current State

| Area | Status |
|------|--------|
| Rules Engine in combat | ✅ Live — all player attacks use `resolveAttack()` |
| Plot die (Opportunity/Complication) | ✅ Fires on every attack |
| AI DM system prompt | ✅ Applied to both GM callers |
| Combat GM JSON output | ✅ Parsed, conditions routed to Rules API |
| `sc:screenChange` event | ✅ Dispatching on every `showScreen()` |
| `rules:attack` / `rules:unconscious` / `sc:turnChange` | ✅ Dispatching from combat |
| Story choice type badges + GSAP stagger | ✅ Live |
| `genNPC` schema | ✅ Full combat-compatible schema |
| `isHost()` deadlock | ✅ Fixed |
| Defense stance persistence | ✅ Fixed |
| `allPartyDowned` empty-array edge case | ✅ Fixed |
| `exitCombat` state cleanup | ✅ Full teardown |

---

## Known Remaining / Future Work

- **Condition whitelist** — AI DM can technically send any condition name to `applyCondition`. No validation yet. Low risk now; worth a whitelist pass before release.
- **`callGM` streaming + structured output** — Story GM uses streaming (good UX), combat GM uses non-streaming JSON. If we want structured output from the story GM too (e.g. for world state updates mid-story), we'd need a two-call pattern or move to a non-streaming approach for that path.
- **Surge system in combat** — Surge actions exist in the choice system but `resolveRound` surge path routes to a simplified roll. Full Surge mechanics (Gravitation, Progression, Illumination etc.) not yet mechanically differentiated beyond damage type.
- **Multi-hit / area attacks** — Enemy AOE attacks not modeled. All enemy attacks currently single-target.
- **NPC party AI** — NPC party members don't submit `pendingActions` themselves; their turns are currently skipped in action collection. They need an AI auto-submit path.
