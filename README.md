# ⟁ Stormlight Chronicles

A browser-based, multiplayer, turn-by-turn RPG set in Brandon Sanderson's **Way of Kings** universe — built for friends spread across the country to play together on their lunch breaks.

---

## What It Is

Stormlight Chronicles is a shared narrative RPG powered by an AI Game Master (Claude). Players each claim a slot, build a Knight Radiant character, and take turns making choices that shape a 180-turn epic saga across three acts — each set in a different, randomly selected location on Roshar.

The game lives at a single shareable URL. Each player opens it on their own device whenever they have a free moment. The story pauses between turns and waits for you. A **Continue →** button appears at the bottom of every GM scene — you have to read to the bottom before you can act. When you come back, the full Chronicle is there waiting.

---

## Features

### Core Gameplay
- **AI Game Master** — Claude narrates consequences, generates location-specific story beats, and presents 4 choices each turn tailored to your character class and scene
- **180-turn epic saga** across 3 acts, each in a different Roshar location chosen randomly per campaign
- **Read gate** — the action panel locks after every GM entry; scroll to the bottom and click **Continue →** before acting
- **Turn-based rotation** — game enforces player order; everyone else sees "waiting for [Name]" until it's their turn
- **d20 skill checks** — your stats directly affect the GM's narrative outcome across a full critical success to critical failure range
- **Dramatic storytelling rules** — GM prompts enforce varied sentence structure, no repeated weapon draws, escalating stakes, location-specific sensory detail

### Characters — All 10 Knight Radiant Orders
- **Windrunner, Lightweaver, Edgedancer, Stoneward, Elsecaller, Truthwatcher, Willshaper, Dustbringer, Bondsmith, Skybreaker**
- Full character sheets with stat rolls (4d6 drop lowest), class bonuses, unique surges and abilities
- Class-specific damage profiles — Dustbringers hit hardest on crits, Bondsmiths heal the party on misses, Edgedancers passively regenerate

### Spren Bond System
- **Named spren companions** — Syl, Pattern, Wyndle, Roksel, Ivory, Glys, Lunu'anaki, Spark, the Stormfather, Highspren
- **5 evolution stages** across the 180-turn saga — from a distant whisper to a living Shardblade
- **Spren memories** — your spren records critical successes, failures, and meaningful choices (protecting others, speaking oaths, acts of sacrifice) and the GM weaves those memories into future narration naturally
- Bond stage and current spren flavor shown in the party strip and character sheet

### Combat System
- **Real HP damage** — every roll outcome affects health; critical failures deal 2-5 damage, failures deal 1-3, critical successes can heal via Stormlight
- **Enemy HP pools** — COMBAT scenes spawn location-appropriate enemies with visible health bars (Parshendi on the Plains, Fused on Braize, Voidspren in Shadesmar)
- **Initiative order** — all combatants roll initiative at combat start; a visual tracker shows the full order, current actor, round count, and defeated enemies struck through
- **Shardblade crafting** — earn Stormlight Fragments (+1 per crit, +3 per kill), forge a class-specific blade for 3 Fragments, upgrade through 5 tiers (Nascent → Bonded → Ancient → Living → Divine) for 5 Fragments each; each tier adds +1 to all combat rolls
- **Shardplate drops** — critical victories over enemies can yield Shardplate, boosting max HP by 40%

### Audio
- **Procedural storm synthesis** — Web Audio API generates wind, thunder, and Stormlight hum entirely in the browser with no audio files
- Storm intensity shifts automatically with scene type: violent during COMBAT, mysterious during DISCOVERY, calm during DECISION
- Volume control, toggle on/off; works completely offline

### Campaigns and Multiplayer
- **Named campaigns** — give each adventure a custom title shown on the campaign card, title screen, and exports
- **Multiple simultaneous campaigns** — each has independent state and log stored in Google Sheets
- **NPC auto-fill** — empty slots become AI companions who D4-roll their choices (no AI tokens spent on their decisions)
- **Party size 2–5** — configurable at campaign creation
- **60+ Rosharan NPC names** — common citizens and soldiers, not famous book characters

### Export and Sharing
- **📷 Share Moment** — every GM entry has a button that renders a styled 800×460 story card via Canvas API and downloads it as a PNG, complete with campaign name, location, party, act/turn count, and watermark
- **⬇ Export Chronicle** — full story log formatted for printing or PDF via the browser print dialog

### Locations
34 locations seeded randomly per campaign — a completely different 3-location arc every run:

| Category | Locations |
|---|---|
| Physical Roshar | Urithiru, Shattered Plains, Kholinar, Kharbranth, Thaylen City, Azimir, Purelake, Hearthstone, Rathalas, Reshi Isles, Aimia (Akinah), Frostlands, Bavland, Herdaz, Jah Keved, Alethkar, Tukar, Triax, Liafor, Emul, Marat |
| Other Worlds | Braize (Damnation), Ashyn (floating cities), Aimian Sea, Godforge |
| Shadesmar | Sea of Regret, Sea of Souls, Sea of Lost Lights, Nexus of Imagination, Nexus of Truth, Nexus of Transition, Honor's Perpendicularity, Cultivation's Perpendicularity |
| Story Sites | The Honor Chasm, Feverstone Keep, Stormseat (Narak) |

---

## How to Play

1. Open the link — you land on the **Campaign Picker**
2. Click **+ New Campaign**, give it a name, press Enter
3. Choose **party size** (2–5) then click **Enter the Storm**
4. Build your **Knight Radiant** — pick your Order, choose a color, roll stats
5. Land in the **Lobby** — assign NPCs to empty slots or wait for friends to join
6. Click **Begin the Saga →**
7. The AI GM opens the story. Read it. Scroll to the bottom. Click **Continue →**
8. On your turn: pick from 4 choices (or type your own action) then click **Act →**
9. Check back at your next lunch break

Each GM response takes 10–15 seconds to generate. A full 180-turn saga takes roughly 2–3 months of daily lunch breaks.

---

## All 10 Radiant Orders

| Order | Ideal | Surges | Spren |
|---|---|---|---|
| Windrunner | I will protect those who cannot protect themselves | Gravitation + Pressure | Honorspren (Syl) |
| Lightweaver | I am who I needed when I was young | Illumination + Transformation | Cryptic (Pattern) |
| Edgedancer | I will remember those who have been forgotten | Abrasion + Progression | Cultivationspren (Wyndle) |
| Stoneward | I will be there when I am needed | Tension + Cohesion | Peakspren (Roksel) |
| Elsecaller | I will reach my potential so I may help others reach theirs | Transportation + Transformation | Inkspren (Ivory) |
| Truthwatcher | I will seek truth, even when it is painful | Progression + Illumination | Mistspren (Glys) |
| Willshaper | I will seek freedom for those in bondage | Transportation + Cohesion | Lightspren (Lunu'anaki) |
| Dustbringer | I will seek self-mastery above all else | Division + Abrasion | Ashspren (Spark) |
| Bondsmith | I will unite instead of divide | Tension + Adhesion | Godspren (Stormfather) |
| Skybreaker | I will follow the law | Gravitation + Division | Highspren |

---

## Spren Bond Evolution

| Turns | Stage | What Happens |
|---|---|---|
| 0–19 | 1 | A whisper — the spren is drawn to you but distant |
| 20–49 | 2 | First contact — the spren manifests and observes |
| 50–89 | 3 | First Words — the spren speaks, tests, challenges |
| 90–139 | 4 | Deepening Bond — the spren pushes you toward growth |
| 140–180 | 5 | Full Bond — living Shardblade manifests, full Radiant power |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Single-file HTML/CSS/JS, no framework, ~1750 lines |
| Hosting | GitHub Pages |
| Shared state | Google Sheets API v4 |
| AI Game Master | Anthropic Claude API (claude-sonnet) |
| API proxy | Cloudflare Worker (keeps API key off the client) |
| Auth | Google Service Account JWT via Web Crypto API |
| Audio | Web Audio API — procedural synthesis, no files |
| Story cards | Canvas API — client-side PNG generation |
| Fonts | Cinzel + Crimson Pro via Google Fonts |

---

## Setup (Self-Hosting)

### 1. Google Sheets
- Create a new Google Sheet
- Enable **Google Sheets API** in Google Cloud Console
- Create a **Service Account** and download the JSON key
- Share the Sheet with the service account email (Editor access)
- Copy the Sheet ID from the URL

### 2. Cloudflare Worker
Create a free Cloudflare account, make a Worker named `stormlight-proxy`, add your Anthropic API key as a secret variable called `ANTHROPIC_KEY`, then paste this code:

```javascript
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }
    const body = await request.json();
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
};
```

### 3. Update index.html
Replace these constants near the top of the script block:

```javascript
const SHEET_ID = 'your-sheet-id-here';
const PROXY_URL = 'https://your-worker.workers.dev';
const SA = {
  client_email: 'your-service-account@project.iam.gserviceaccount.com',
  private_key: `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n`
};
```

### 4. Deploy to GitHub Pages
Upload `index.html` to a public GitHub repo, go to Settings → Pages → Deploy from branch → main → / (root). Your URL becomes `https://yourusername.github.io/your-repo-name`.

---

## API Costs

| Item | Cost |
|---|---|
| Google Sheets API | Free |
| Cloudflare Worker | Free (100k requests/day) |
| GitHub Pages | Free |
| Claude API per GM turn | ~$0.003 |
| Full 180-turn campaign | ~$0.54 total |

New Anthropic accounts get $5 free credit — enough for roughly 9 full campaigns.

---

## Contributing

This project started as a lunch-break idea and turned into something genuinely fun to build. If you've played it, forked it, or have ideas — open an issue and let's brainstorm what else we can add to make this even better. The Cosmere is a big universe and we've barely scratched the surface.

---

## Support

If you enjoy the game, help keep the Stormfather awake:

**Cash App: $rurich31**

API costs run ~$0.003 per turn. Every campaign costs less than a dollar.

---

## License

MIT — fork it, mod it, run your own campaign. Just don't sell it.

---

*"The most important step a man can take. It's not the first one, is it? It's the next one."*
*— The Way of Kings, Brandon Sanderson*
