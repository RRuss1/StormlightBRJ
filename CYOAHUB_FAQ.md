# CYOAhub — FAQ

---

## General

**What is CYOAhub?**
CYOAhub is a multiplayer AI-powered RPG platform. You and your friends play through a collaborative story driven by an AI Game Master — rolling dice, making choices, and fighting enemies together in real time. You can play in an existing world or build your own from scratch.

**Is it free?**
Yes. CYOAhub is free to play. No account required to get started.

**Do I need to know how to play D&D or any RPG?**
No. The AI GM guides you through everything. If you can read and make a choice, you can play.

**What worlds are available?**
Currently:
- **Stormlight Chronicles** — Epic fantasy set in Brandon Sanderson's Cosmere universe. 10 Radiant Orders, Surgebinding, Shardblades.
- **D&D 5e** — Classic fantasy using the Official Basic Rules. 4 classes, 4 races, 6 backgrounds, spells, and monsters.
- **Build Your Own World** — Create a fully custom world using the 7-step World Builder wizard.

Community-published worlds also appear in the World Hub for anyone to play.

---

## Gameplay

**How does the AI GM work?**
After each player action, Claude generates a story beat — describing what happens, raising the stakes, and presenting new choices. It adapts to your decisions, remembers what happened earlier, and keeps the narrative consistent across the whole campaign. Each world has its own GM personality, tone, and lore context.

**How many players can join a campaign?**
Up to 4 players per campaign. You can also play solo (2-5 party size, with AI companions filling empty slots).

**Can I play solo?**
Yes. Solo play works exactly the same — the AI GM treats NPC party members as companions and runs their turns automatically.

**How long is a campaign?**
A full campaign runs 180 turns across 3 acts. Sessions are async — no need to all be online at the same time. Play a few turns now, come back later.

**What happens if a player goes offline mid-session?**
The game saves state after every action. Anyone can pick up where things left off. The host can skip absent players' turns if needed.

**Is there actual combat?**
Yes. When the story escalates into a fight, the game switches to a dedicated combat screen with a 5-phase simultaneous resolution system. Each player submits their action, then the round resolves — dice rolls, damage, injuries, and all. Enemy types are drawn from the world's enabled enemy categories.

**What are Oaths?**
Oaths are progression milestones. In Stormlight Chronicles, speaking an Ideal unlocks new Radiant abilities. Other worlds have their own progression systems — level-based, milestone, freeform, or oath-based, depending on how the world was built.

**Does each world have its own campaign list?**
Yes. When you enter a world, you only see campaigns created in that world. Stormlight campaigns don't appear in D&D, and vice versa. Each world's campaign hub is themed to match its visual identity.

---

## Characters

**How do I create a character?**
When you join a campaign for the first time, you go through a short character creation flow — picking your class or path, allocating stats, choosing equipment, and optionally bonding a companion. Takes about 2 minutes.

**What character options are there?**
It depends on the world:
- **Stormlight** — 10 Radiant Orders (Windrunner, Lightweaver, etc.) or 6 Hero Paths (Agent, Envoy, Hunter, etc.). Two ancestries (Human, Singer).
- **D&D 5e** — 4 classes (Cleric, Fighter, Rogue, Wizard), 4 races (Human, Dwarf, Elf, Halfling), 6 backgrounds.
- **Custom worlds** — 4 generic archetypes (Warrior, Mage, Rogue, Healer) with world-specific flavor.

**Do characters carry over between campaigns?**
Not currently. Each campaign starts a fresh character. Campaign progression and the chronicle of your story are saved permanently.

**Can I lose my character permanently?**
Depends on the world's death rules. Some worlds use permanent death, some allow revival, and some treat death as a narrative event. This is set by the world creator.

---

## Worlds & The World Builder

**What is the World Builder?**
A 7-step wizard that lets you design a completely original RPG world. You configure:
1. **Identity** — Name, description, era, tone, technology level
2. **Magic** — Whether magic exists, what it's called, what fuels it, how risky it is
3. **Stats** — Choose from 16 stat systems (classic D&D, survival horror, emotional drive, cyberpunk, and more)
4. **World Facts** — Factions, locations, central conflict, lore, naming style
5. **Atmosphere** — Ambient audio (15 soundscapes) and enemy categories (15 types)
6. **GM Personality** — Narrator style, combat frequency, story focus, lethality, NPC depth, plus world rules (physics, death, time, travel, dialogue)
7. **Visual Identity** — 8-color theme system, UI style, button style, background effects, card style, title font, and card image

**Can I share my world with other players?**
Yes. After finishing the wizard you can publish your world to the Community Hub, where anyone can browse and start a campaign in it.

**How many stat systems are there?**
16 — including Classic D&D, Cosmere, Body-Mind-Spirit, Combat-Oriented, Dark Cost (Flesh/Will/Soul/Blood/Shadow), Emotional Drive (Hope/Fear/Anger/Love/Ambition), Fate-Based, Cyberpunk Core, Mythic Scale, Survival Horror, and more.

**What ambient audio options are there?**
15 procedural soundscapes: Storm, Forge, Ocean, Forest, Dungeon, Tavern, Desert, Arctic, Jungle, Volcanic, Cathedral, Battlefield, Cosmic, Swamp, and Clockwork. Each plays during gameplay to set the mood.

**What enemy categories can I enable?**
15 categories with 57+ narrative enemy patterns: Undead, Demons & Devils, Dragons, Giants, Goblinoids, Beasts, Fey, Elementals, Aberrations, Sea Creatures, Lycanthropes, Plants, Human Enemies, Mythological, and Swarms. The AI GM draws from your enabled categories during combat.

**Can I delete my worlds?**
Yes. You can delete any world you created. A delete button appears on hover for worlds you own. Other players cannot delete your worlds.

---

## Campaigns & Safety

**Can someone delete my campaign?**
No. Only the person who created a campaign (on the same device) can delete it. The delete button only appears for campaigns you own.

**Can someone delete my world?**
No. Same ownership system — only the creator sees the delete option.

**What if I clear my browser data?**
Ownership is stored in your browser's local storage. Clearing it means you lose the ability to delete your campaigns and worlds (they'll still exist, just without the delete button). Your actual game data is safe in the cloud.

---

## Technical

**What devices does CYOAhub run on?**
Any modern browser — desktop, tablet, or mobile. No app download required.

**Does it work offline?**
No. An internet connection is required — the AI GM runs on Anthropic's Claude API.

**How is my game data saved?**
Campaign state is saved to a cloud backend (Google Sheets) after every action. Private worlds are saved in your browser's local storage. Published worlds are stored in the cloud.

**Is my data private?**
Campaign content is stored securely and not shared publicly unless you explicitly publish a world to the Community Hub.

**What AI model powers the GM?**
Claude by Anthropic, accessed through a Cloudflare Worker proxy. The AI generates narrative, combat choices, and NPC dialogue in real time.

---

## Community

**How do I report a bug or give feedback?**
Use the Feedback option in the hamburger menu (top-right). It links to our GitHub Issues page where you can report bugs or suggest features. You can also email us directly.

**Can I contribute to CYOAhub?**
Yes! CYOAhub is open source. Use the Contribute option in the hamburger menu to visit the GitHub repo. You can build new game systems, design enemy patterns, improve AI prompts, or help with UI.

**Can my world become an Official world?**
Community worlds that receive strong engagement and demonstrate quality world-building may be promoted to Official status.

---

*CYOAhub is in active development. New worlds, features, and systems are added regularly.*
