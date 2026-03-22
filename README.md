# ⟁ Stormlight Chronicles

**Play now:** https://rruss1.github.io/StormlightBRJ/

A browser-based multiplayer RPG set in Brandon Sanderson's Stormlight Archive. You and your friends become Knights Radiant — or Heroes of Roshar — as an AI Game Master narrates your journey across 180 turns of epic saga.

No download. No account. Just open the link and play.

---

## How It Works

Stormlight Chronicles is an **async turn-based RPG**. That means:

- Open the game whenever you have a few minutes
- Take your turn — describe your action or pick from the GM's suggestions
- Close the tab and go live your life
- The story waits until everyone has acted, then the GM narrates what happens next

The AI Game Master remembers everything — who you've met, what you've discovered, what choices your party made three turns ago. It writes like a novelist: specific sensory details, consequences that persist, danger that erupts when it makes dramatic sense rather than on a schedule.

---

## Getting Started

### 1. Create a Campaign
From the campaign screen, click **+ New Campaign**, name it, and share the URL with your friends. Everyone uses the same link.

### 2. Choose Your Party Size
Select 2–5 players. Empty slots become AI companions — fully voiced NPCs who fight alongside you and react to the story.

### 3. Create Your Character

**Knight Radiant** — You've bonded a spren and spoken the First Ideal. Choose your Order:

| Order | Surges | Strength |
|-------|--------|----------|
| Windrunner | Gravitation + Adhesion | Fly, protect, lash enemies to surfaces |
| Edgedancer | Abrasion + Progression | Speed, grace, powerful healing |
| Lightweaver | Illumination + Transformation | Illusions, deception, reality-bending |
| Stoneward | Cohesion + Tension | Immovable, reliable, stone-hard defense |
| Elsecaller | Transformation + Transportation | Knowledge made power, Shadesmar access |
| Truthwatcher | Progression + Illumination | See what others miss, perceive hidden truth |
| Willshaper | Division + Adhesion | Freedom, chaos, unpredictable surges |
| Dustbringer | Division + Abrasion | Controlled destruction, precise devastation |
| Bondsmith | Tension + Adhesion | Unite allies, connect disparate forces |
| Skybreaker | Gravitation + Division | Law, precision, devastating judgment |

**Hero of Roshar** — No spren bond. Just skill, grit, and a weapon you've mastered through 5 upgrade tiers. Roles: Alethi Soldier, Kharbranth Scholar, Thaylen Merchant, Horneater, Herdazian Fighter, Shin Farmer, Worldsinger, or Custom.

### 4. Build Your Character
The GM reads your backstory, motivation, appearance, and weapon history and weaves them into every scene. The more you write, the more personal the story becomes.

### 5. Enter the Storm
Once all slots are filled (or assigned to AI companions), the host clicks **Begin the Saga**.

---

## The Story

### How Exploration Works
Each turn you choose an action — from 4 AI-generated options or your own description. A d20 rolls. Your stats shape the outcome. The GM narrates the consequence.

The GM is not a neutral narrator. It has opinions about your character. It remembers what happened two turns ago and treats it as immediate. It builds tension organically — danger doesn't arrive on a schedule, it arrives when the story demands it.

### Combat Triggers
Combat doesn't start on a timer. The GM watches what you discover and builds toward confrontation naturally. An ambush grows from something you found. A misunderstanding escalates. A creature claims territory. When the GM narrates the moment of confrontation, the fight begins.

### Between Fights
Every story turn, all living party members absorb ambient Stormlight and recover +d4 HP. Radiants and Heroes alike. The world breathes.

---

## Combat

When combat starts, everyone acts simultaneously. No waiting for your turn in the initiative order — you and your allies all submit actions, then everything resolves in a structured order.

### The Rules Engine
Combat is resolved by a full **Cosmere RPG rules engine** running in the browser:

- Every attack is a **d20 + modifier vs. Defense** (Physical / Cognitive / Spiritual depending on weapon and surge)
- Outcomes: **MISS / GRAZE / HIT / CRIT** — damage scales accordingly with deflect reduction applied
- A **plot die** rolls on every attack. Roll a 6 → **Opportunity** (gain +1 Focus). Roll 1–2 → **Complication** (chip yourself)
- **Focus** is your surge resource. It accumulates through Opportunities and resets between encounters
- **Conditions** (stunned, bleeding, burning, poisoned, prone) are applied and removed mechanically by the GM based on narrative outcomes

### Phase Order (every round)
1. **Offense** — all attacks and surges resolve simultaneously
2. **Defense** — guard stances apply their protection to the *next* incoming hit
3. **Healing** — Stormlight mending and revives happen after all damage
4. **End of turn** — environmental hazards tick, conditions wear off

### Rolling

| Roll | Result | What it means |
|------|--------|---------------|
| 18–20 | **CRIT** | Maximum effect + plot die Opportunity |
| 14–17 | **HIT** | Clean success |
| 10–13 | **GRAZE** | Partial — reduced damage, something complicates it |
| 1–9 | **MISS** | The world resists |

### Action Types
You can always describe your own action, or use these keywords:
- `[ATTACK]` — offensive strike (STR or weapon skill)
- `[DEFEND]` — guard stance, reduces damage on the next hit (END)
- `[HEAL]` — Stormlight recovery (WIS) — not guaranteed; fumbles can backlash
- `[SURGE]` — Surgebinding ability (targets Cognitive or Spiritual Defense)
- `[SKILL]` — social or perception action (CHA or WIS)

### Healing
Heals roll like everything else. A critical heal restores maximum Stormlight. A fumble causes backlash — a negative. Plan accordingly.

### Reviving
If a party member is downed (0 HP), use a heal action targeting them. Partial success brings them back at reduced HP. A crit brings them back full. A miss means they stay down this round.

### Combat Persistence
If you have to close the game mid-combat, the enemies wait. Same HP, same round, same pending actions when you return.

---

## Oath Progression

Knight Radiants grow stronger as they speak their Oaths. There are 5 per order, each with canonical text from the books. The GM watches your actions and recognizes when they match your order's ideals.

- **Oath 2–3**: Growing bond, increasing power
- **Oath 4**: Shardplate begins to form
- **Oath 5**: Full Radiant — Shardblade fully manifested, peak power

---

## Voice Narration

Click **🔈** in the game bar to have the chronicle read aloud using your browser's built-in speech synthesis — no download required.

- **Voices:** populated from your OS/browser's installed English voices (Chrome typically offers 20+)
- **Streaming:** narration begins speaking as the AI writes — text is chunked at sentence and phrase boundaries and queued for gapless playback
- **Controls:** VOL · SPD · PCH sliders let you tune narrator volume, speed, and pitch in real time
- **Voice selector:** choose any installed voice; your preference is saved across sessions

---

## Sound

Click **🌩** in the audio bar to start the storm. The sound design is fully procedural — no audio files, everything synthesized in real time:

- **Four wind layers** — spatially separated left to right, each breathing at a different rate
- **Rain** — textured highpass noise behind the wind
- **Thunder** — preceded by a lightning crackle, rumbles every 9–25 seconds
- **Stormlight hum** — a subtle, beating ethereal tone underneath everything
- **Combat intensification** — the storm ramps up when you enter combat, fades back when you return

---

## Tips

**For new players:** Pick Edgedancer or Windrunner for your first Radiant — their abilities are intuitive and they have strong healing options. For Heroes, Alethi Soldier is the most straightforward.

**For storytelling:** The more you write in your backstory and appearance fields, the more the GM personalizes the narrative. Give your weapon a name. Write about your past. It shows up.

**For async play:** Enable **Step Away** before closing the tab. Your combat turn auto-resolves with a defend action so your party isn't waiting.

**For combat:** Defend when you're at low HP and your healer is ready. Defense applies *next round*, so plan a turn ahead. The plot die fires every attack — chasing Focus through Opportunities is a real strategy.

**For hosts:** Fill empty slots with AI companions before starting — they fight competently and add to the story. You can always replace them if a late player joins.

---

## Locations

Your saga unfolds across 34 locations including Hearthstone, the Shattered Plains, Urithiru, Kharbranth, Kholinar, Thaylenah, the Purelake, the Reshi Isles, Braize, Shinovar, the Horneater Peaks, Shadesmar, Aimia, and more — randomized each campaign with a different path through all three acts.

---

## Technical

- **AI:** Claude Sonnet via Anthropic API — streaming narration, structured JSON combat output, 12-responsibility DM system prompt
- **Rules engine:** Custom Cosmere RPG implementation — resolveAttack(), applyCondition(), plot die, Focus economy
- **Voice:** Web Speech API — browser-native TTS, sentence-chunked streaming pipeline, pitch/rate/volume sliders
- **Audio:** Procedural Web Audio API — no samples, everything synthesized
- **State:** Cloudflare KV via Workers proxy — multiplayer sync, persistent campaign state
- **No framework:** Vanilla JS / HTML / CSS + GSAP for animation

---

## Credits

Built with the Anthropic Claude API. Set in Brandon Sanderson's Cosmere. Made for people who love the Stormlight Archive and can't coordinate a weekly game night.

*Life before death. Strength before weakness. Journey before destination.*

---

Questions or issues: github.com/rruss1/StormlightBRJ
