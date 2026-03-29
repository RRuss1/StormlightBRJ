// ═══════════════════════════════════════════════════════════════════════════
// The Wretched Deep — System Data
// All Wretched Deep-specific data extracted into a single portable object.
// This file is the canonical source for world data, character options,
// combat tables, lore, and progression for The Wretched Deep system.
// A dark, paranoid, obsession-driven RPG world where the Hollow Crown
// corrupts all who draw near.
// ═══════════════════════════════════════════════════════════════════════════

window.WretchedDeepSystem = {

  // ── Metadata ──────────────────────────────────────────────────────────
  id: 'wretcheddeep',
  name: 'The Wretched Deep',
  subtitle: 'Obsession Consumes All',
  tagline: '"We watches, we waits, we remembers... always."',
  glyph: '👁',
  ambientAudio: 'volcanic',

  // ── Theme tokens ──────────────────────────────────────────────────────
  theme: {
    primary: '#7B3F8E',
    secondary: '#3A8E5C',
    danger: '#8E2020',
    bgTone: 'dark',
    titleFont: 'Cinzel',
    bodyFont: 'Crimson Pro',
  },

  themeVars: {
    bg: '#08060A', bg2: '#100E14', bg3: '#181420', bg4: '#201A2A',
    border: '#2A1E30', border2: '#3A2E40', border3: '#4A3E50',
    primary: '#7B3F8E', goldMid: '#A070B0', goldBright: '#C8A0D8', goldDim: '#3A1E48',
    secondary: '#3A8E5C', teal: '#2A6E4C', teal2: '#3A8E5C',
    danger: '#8E2020', coral2: '#A83030',
    text: '#E8E0F0', text2: '#D0C8DA', text3: '#B0A0C0', text4: '#9080A8', text5: '#706088',
  },

  // ── GM Context (AI prompt injection) ──────────────────────────────────
  gmContext: {
    worldName: 'The Wretched Deep',
    systemName: 'The Wretched Deep',
    magicName: 'The Corruption',
    magicResource: 'Obsession',
    combatFlavor: 'Wretched Deep',
    healFlavor: 'A moment of clarity pushes back the whispers',
    errorFlavor: 'The shadows shift — something went wrong in the deep.',
    worldLore: 'The Wretched Deep — a fractured underworld of tunnels, flooded caverns, and forgotten cities built atop one another for millennia. At its heart lies the Hollow Crown, an artifact of immense power that whispers to all who draw near. Those who touch it gain terrible abilities but lose themselves piece by piece. The surface world has forgotten this place exists. Down here, factions war over fragments of the Crown while the darkness itself seems alive, watching, waiting. Every shadow has eyes. Every whisper has a voice. Trust is the first thing the Deep devours.',
    toneInstruction: 'Dark, paranoid, obsessive. Fragmented prose — short jagged sentences mixed with run-on whispered thoughts. The narrator is unreliable, sometimes addressing the player in second person, sometimes slipping into "we" as if the darkness speaks through them. Gritty survival horror meets psychological corruption. No heroes — only survivors. Every victory costs something.',
    magicRules: 'The Corruption is fueled by Obsession — the more you fixate on something (power, revenge, the Crown, a person), the stronger your abilities become. But high Obsession warps your body and mind. At Obsession 5+, the GM describes physical changes. At 8+, you hear voices. At 10, you become an NPC — consumed. Obsession drops slowly through rest, connection with allies, or acts of selflessness.',
    npcFlavor: 'Names are guttural, broken — Skrave, Moltch, Drenna, Wyst. Many NPCs have forgotten their real names and go by descriptions: The Weeper, Cracked-Tooth, Old Fingers. Dialogue is clipped, suspicious, paranoid. Nobody makes eye contact. Deals are made in whispers.',
    choiceTagRules: '[COMBAT] [DISCOVERY] [DECISION] [CORRUPTION] — tag every player choice. Use [CORRUPTION] when a choice involves using the artifact or giving in to obsession.',
  },

  // ── Rules Config (config-driven formulas) ─────────────────────────────
  rules: {
    defenses: [
      { id: 'physDef', label: 'Evasion', base: 10, stats: ['instinct','shadow'] },
      { id: 'cogDef',  label: 'Resolve', base: 10, stats: ['will','cunning'] },
    ],
    hp: { base: 8, stat: 'will', perLevel: 4 },
    focus: { base: 2, stat: 'will' },
    magicPool: {
      enabled: true, label: 'Obsession', formula: 'flat',
      base: 0, stats: ['obsession'], classGated: false,
    },
    recoveryDie: {
      stat: 'will',
      table: [
        { maxStat:0, die:4 }, { maxStat:2, die:6 }, { maxStat:4, die:8 },
        { maxStat:6, die:10 }, { maxStat:999, die:12 },
      ],
    },
    skillAttrMap: {
      stealth:'shadow', athletics:'instinct', intimidation:'obsession',
      perception:'cunning', survival:'instinct', deception:'cunning',
      insight:'will', lore:'cunning', medicine:'will',
      lightWeapon:'instinct', heavyWeapon:'instinct',
    },
    deflectableTypes: ['physical','sharp'],
    currency: { name: 'scraps', symbol: 'sc', tiers: null },
    statGenMethod: '3d8',
    progressionType: 'corruption', progressionLabel: 'Corruption Stage', maxProgression: 10,
    turnOrder: 'fast-slow',
    healClassMultipliers: { fleshwright: 1.6 },
    equipmentDrops: {
      enabled: true, fragmentName: 'crown shard', craftCost: 3, upgradeCost: 5,
      legendaryName: 'Crown Fragment', armorName: 'Shadow Shroud',
    },
  },

  // ── Character Creation Config ─────────────────────────────────────────
  charCreation: {
    paths: [
      { id: 'class', label: 'Archetype', icon: '👁',
        desc: '"What the Deep made you."',
        sublabel: 'Lurker · Thief · Watcher · Whisperer · Fleshwright' },
      { id: 'background', label: 'Past Life', icon: '🕯',
        desc: '"Who you were before the fall."',
        sublabel: 'Your memories shape your survival' },
    ],
    classLabel: 'Archetype', backgroundLabel: 'Past Life',
    classHeading: 'Your Archetype', backgroundHeading: 'Your Past',
    classFlavor: 'The Crown whispers. What do you become?',
    backgroundFlavor: 'Who were you, before the Deep took everything?',
    ancestryLabel: 'Origin',
    partyLabel: 'The Desperate',
    submitText: { class: 'Descend into the Deep →', background: 'Descend into the Deep →' },
    origins: ['The Upper Tunnels','The Drowned Market','The Bone Warrens','The Weeping Halls','The Crown Chamber','The Forgotten Surface'],
    startMessage: 'The darkness closes in. Your descent begins at {location}.',
    actNames: ['Descent into {loc}', 'The Whispers of {loc}', 'The Crown beneath {loc}'],
    attributePoints: 12, maxPerAttribute: 3,
    showBlade: false, showWeapon: true, showCompanion: false,
    namePlaceholder: 'What did they used to call you?',
  },

  // ── Combat Actions ────────────────────────────────────────────────────
  combatActions: [
    { id: 'attack',     tag: 'ATTACK',     label: 'Strike',     icon: '🗡', cost: null, phase: 'OFFENSE', stat: 'instinct', skill: 'lightWeapon', keywords: ['attack','strike','stab','swing','slash','hit','shiv'] },
    { id: 'defend',     tag: 'DEFEND',     label: 'Evade',      icon: '🌑', cost: null, phase: 'DEFENSE', stat: 'shadow', skill: 'stealth', keywords: ['defend','dodge','evade','hide','duck','flee','escape'] },
    { id: 'heal',       tag: 'HEAL',       label: 'Recover',    icon: '🕯', cost: null, phase: 'HEAL', stat: 'will', skill: 'medicine', keywords: ['heal','mend','recover','bandage','splint','rest'] },
    { id: 'corruption', tag: 'CORRUPTION', label: 'Embrace It', icon: '👁', cost: 'magicPool:1', phase: 'OFFENSE', stat: 'obsession', skill: 'corruption', keywords: ['corrupt','embrace','crown','whisper','warp','drain','consume'] },
  ],

  // ── Story Actions ─────────────────────────────────────────────────────
  storyActions: [
    { id: 'combat',     tag: 'COMBAT',     label: 'Violence' },
    { id: 'discovery',  tag: 'DISCOVERY',  label: 'Discovery' },
    { id: 'decision',   tag: 'DECISION',   label: 'Decision' },
    { id: 'corruption', tag: 'CORRUPTION', label: 'Corruption' },
  ],

  combatAtmosphere: [
    'Something skitters in the dark beyond the fight. The Crown hums louder. Blood looks black down here.',
    'The walls weep. Water drips upward for a moment. Your wounds ache in ways that feel intentional.',
    'The darkness presses closer. Obsession claws at the edge of your thoughts. This place is feeding on the violence.',
  ],

  // ══════════════════════════════════════════════════════════════════════
  // CHARACTER DATA
  // ══════════════════════════════════════════════════════════════════════

  // Stats: CUNNING / OBSESSION / WILL / SHADOW / INSTINCT
  statKeys: ['cunning','obsession','will','shadow','instinct'],
  statNames: ['CUN','OBS','WIL','SHD','INS'],
  statFull: ['Cunning','Obsession','Will','Shadow','Instinct'],

  // Classes
  classes: [
    {id:'lurker',name:'Lurker',
     philosophy:'We sees what others miss.',
     surges:['blindsight','echolocation','shadowMeld'],
     ideal1:'I watch from the dark.',ideal2:'I know their weaknesses before they know mine.',ideal3:'The shadows obey me now.',ideal4:'I am the dark itself.',
     spren:'Shadow Bond',sprenDesc:'A symbiotic connection to the living darkness. It feeds on your fear and gives you sight where there is none.',
     sprenAssist:'Stealth, perception in darkness, detecting lies',
     desc:'Masters of darkness and observation. Lurkers see everything and strike from where you least expect.',
     bonus:{cunning:0,obsession:0,will:0,shadow:2,instinct:1},
     abilities:['Blindsight','Shadow Meld','Whisper Strike','Echolocation','Consume Light'],
     dmgBonus:{crit:4,hit:2,miss:0},color:'#4A2A5E'},
    {id:'thief',name:'Thief',
     philosophy:'What is theirs becomes ours.',
     surges:['quickFingers','misdirect','escapeArtist'],
     ideal1:'I take what I need.',ideal2:'No lock holds, no trap catches.',ideal3:'I steal their courage as easily as their coin.',ideal4:'Everything belongs to me.',
     spren:'Greed Echo',sprenDesc:'An insatiable hunger that sharpens your reflexes but deepens your need. The more you take, the faster you become.',
     sprenAssist:'Lockpicking, pickpocketing, trap disarming, escape',
     desc:'Quick-fingered survivors who take what they need. Speed and cunning over brute force.',
     bonus:{cunning:2,obsession:0,will:0,shadow:0,instinct:1},
     abilities:['Quick Fingers','Misdirection','Escape Artist','Pocket Sand','Sleight of Fate'],
     dmgBonus:{crit:3,hit:2,miss:0},color:'#8E7B3F'},
    {id:'watcher',name:'Watcher',
     philosophy:'We remembers everything.',
     surges:['memoryDrain','psychicEcho','mindShatter'],
     ideal1:'I see what was.',ideal2:'Their memories become my weapons.',ideal3:'I know what you will do before you do it.',ideal4:'All minds are open to me.',
     spren:'Memory Leech',sprenDesc:'A psychic parasite that feeds on memories — yours and others. The more it eats, the more you know, but the less you remember of who you were.',
     sprenAssist:'Reading intentions, recalling lore, psychic interrogation',
     desc:'Psychic observers who drain memories and knowledge from others. Powerful but at risk of losing themselves.',
     bonus:{cunning:1,obsession:1,will:0,shadow:0,instinct:1},
     abilities:['Memory Drain','Psychic Echo','Mind Shatter','Forgotten Name','Identity Collapse'],
     dmgBonus:{crit:3,hit:2,miss:0},color:'#3F6E8E'},
    {id:'whisperer',name:'Whisperer',
     philosophy:'The Crown speaks through us.',
     surges:['corruptTouch','crownVoice','warpFlesh'],
     ideal1:'I hear the Crown.',ideal2:'Its power flows through my words.',ideal3:'I reshape flesh with a whisper.',ideal4:'I am the Crown\'s voice.',
     spren:'Crown Fragment',sprenDesc:'A shard of the Hollow Crown embedded in your mind. It grants terrible power but speaks constantly, eroding your sense of self.',
     sprenAssist:'Corruption magic, persuasion through fear, warping reality',
     desc:'Conduits of the Hollow Crown\'s power. The most powerful and the most doomed.',
     bonus:{cunning:0,obsession:2,will:0,shadow:0,instinct:1},
     abilities:['Corrupt Touch','Crown Voice','Warp Flesh','Madness Aura','Hollow Command'],
     dmgBonus:{crit:3,hit:2,miss:1},color:'#7B3F8E'},
    {id:'fleshwright',name:'Fleshwright',
     philosophy:'The body is clay. We shapes it.',
     surges:['graftLimb','bonesplint','fleshShield'],
     ideal1:'I mend what breaks.',ideal2:'Flesh remembers its shape when I remind it.',ideal3:'I rebuild what the Deep destroys.',ideal4:'I am the surgeon of the damned.',
     spren:'Nerve Web',sprenDesc:'A living network that burrows into your nervous system. It lets you feel others\' bodies as your own — their pain, their breaks, their potential for change.',
     sprenAssist:'Surgery, wound assessment, poison identification, body modification',
     desc:'Surgeons of the Deep who reshape flesh — healing allies or warping enemies. The line between medicine and horror is thin down here.',
     bonus:{cunning:0,obsession:1,will:1,shadow:0,instinct:1},
     abilities:['Graft Limb','Bone Splint','Flesh Shield','Nerve Puppet','Abomination'],
     dmgBonus:{crit:2,hit:2,miss:0},color:'#5E8E3A',
     healMultiplier:1.6,critEffect:null},
  ],

  sprenBonds: {
    lurker:{name:'The Shade',nick:'Shade',stages:['Something moves when you close your eyes...','The darkness bends toward you, protective.','Shadows pool at your feet like loyal hounds.','You see in absolute darkness. Light hurts.','You step between shadows as easily as breathing. You are never truly visible.'],color:'#4A2A5E'},
    thief:{name:'The Itch',nick:'Itch',stages:['Your fingers twitch near pockets that aren\'t yours...','You sense valuables through walls. The Itch guides your hands.','Locks open at your touch. Traps disarm themselves.','You steal seconds from time itself.','Everything you see is already yours. The world just doesn\'t know it yet.'],color:'#8E7B3F'},
    watcher:{name:'The Hollow',nick:'Hollow',stages:['You dream of strangers\' memories...','Touching someone shows you their worst moment.','You read intentions like words on a page.','Memories flow to you unbidden. You forget your childhood.','You are everyone and no one. A vessel of stolen lives.'],color:'#3F6E8E'},
    whisperer:{name:'The Shard',nick:'Shard',stages:['A hum at the edge of hearing, always present...','The Crown speaks your name in dreams.','Your touch leaves dark veins on skin. Yours and theirs.','Reality warps subtly around you. Stones weep. Metal moans.','You are the Crown\'s mouth. When you speak, the Deep listens.'],color:'#7B3F8E'},
    fleshwright:{name:'The Web',nick:'Web',stages:['Your fingertips tingle near the wounded...','You feel others\' heartbeats through the stone.','Touching flesh shows you its structure — bone, muscle, nerve.','You reshape wounds with a thought. Pain is a language you speak fluently.','Bodies are your canvas. You unmake and remake at will.'],color:'#5E8E3A'},
  },

  // Backgrounds → heroRoles
  heroRoles: [
    {id:'outcast',name:'Outcast',icon:'🚪',keyTalent:'Survival Instinct',keyTalentDesc:'Once per rest, when you would drop to 0 HP, stay at 1 instead.',startingSkill:'survival',specialties:['Exile','Refugee','Pariah'],buildAttrs:['will','instinct'],buildSkills:['Survival','Stealth'],multiPath:['Scavenger','Cultist'],desc:'Cast out from what passes for society in the Deep. You survive alone.',bonus:{cunning:0,obsession:0,will:1,shadow:0,instinct:1},ideal:'I need no one. No one needs me.',color:'#6E6E6E'},
    {id:'scavenger',name:'Scavenger',icon:'🔧',keyTalent:'Jury Rig',keyTalentDesc:'Once per session, create a useful tool or weapon from scraps.',startingSkill:'crafting',specialties:['Tinkerer','Salvager','Trap-maker'],buildAttrs:['cunning','instinct'],buildSkills:['Crafting','Perception'],multiPath:['Outcast','Guide'],desc:'You find value in what others discard. The Deep is full of discarded things.',bonus:{cunning:1,obsession:0,will:0,shadow:0,instinct:1},ideal:'One creature\'s trash is another\'s salvation.',color:'#8E7B3F'},
    {id:'cultist',name:'Former Cultist',icon:'👁',keyTalent:'Crown Whispers',keyTalentDesc:'You understand fragments of the Crown\'s language. Gain advantage on Corruption lore checks.',startingSkill:'lore',specialties:['Apostate','Doubter','Infiltrator'],buildAttrs:['obsession','cunning'],buildSkills:['Lore','Deception'],multiPath:['Outcast','Scavenger'],desc:'You served the Crown once. Now you run from what you learned.',bonus:{cunning:0,obsession:1,will:0,shadow:0,instinct:1},ideal:'I know what the Crown offers. That is why I fear it.',color:'#7B3F8E'},
    {id:'guide',name:'Tunnel Guide',icon:'🕯',keyTalent:'Deep Mapping',keyTalentDesc:'You always know which direction leads up and can sense cave-ins before they happen.',startingSkill:'navigation',specialties:['Pathfinder','Ferryman','Lamplighter'],buildAttrs:['instinct','will'],buildSkills:['Survival','Perception'],multiPath:['Scavenger','Cultist'],desc:'You know the tunnels. Every fork, every drop, every dead end. The Deep hasn\'t killed you yet.',bonus:{cunning:0,obsession:0,will:0,shadow:1,instinct:1},ideal:'Follow me. I know the way. Probably.',color:'#3A8E5C'},
    {id:'deserter',name:'Deserter',icon:'⚔',keyTalent:'Battle Scars',keyTalentDesc:'You\'ve been hurt so many times that moderate injuries barely register. Reduce injury severity by 1.',startingSkill:'athletics',specialties:['Ex-soldier','Mercenary','Pit Fighter'],buildAttrs:['will','shadow'],buildSkills:['Athletics','Intimidation'],multiPath:['Outcast','Guide'],desc:'You fought for someone once. Now you fight for yourself.',bonus:{cunning:0,obsession:0,will:1,shadow:1,instinct:0},ideal:'I left one war. I won\'t start another. Unless I have to.',color:'#8E2020'},
  ],

  heroWeapons: [
    {id:'shiv',name:'Bone Shiv',type:'Blade',dmgBonus:{crit:3,hit:2,miss:0},desc:'Sharpened bone. Silent. Disposable.',tiers:['Crude','Honed','Wicked','Cursed','Hollowed']},
    {id:'club',name:'Rubble Club',type:'Blunt',dmgBonus:{crit:4,hit:2,miss:0},desc:'A chunk of masonry. Crude but devastating.',tiers:['Rough','Balanced','Iron-bound','Runed','Shatterstone']},
    {id:'sling',name:'Cave Sling',type:'Ranged',dmgBonus:{crit:3,hit:1,miss:0},desc:'Leather and stone. Echoes for days.',tiers:['Frayed','Taut','Silent','Ghost-wound','Void-shot']},
    {id:'chain',name:'Rusted Chain',type:'Flexible',dmgBonus:{crit:3,hit:2,miss:0},desc:'Reach and restraint. The sound alone is terrifying.',tiers:['Corroded','Oiled','Weighted','Whispering','Living Chain']},
    {id:'claws',name:'Crown Claws',type:'Natural',dmgBonus:{crit:4,hit:2,miss:0},desc:'Fingers warped by Corruption into weapons.',tiers:['Cracked','Sharp','Obsidian','Hollow','Crown-touched']},
    {id:'torch',name:'Burning Brand',type:'Fire',dmgBonus:{crit:2,hit:2,miss:1},desc:'Light and weapon. Both are precious down here.',tiers:['Sputtering','Steady','Roaring','Everburn','Soulfire']},
  ],

  ancestries: [
    {id:'surfacer',name:'Surfacer',desc:'You came from above. The sun is a memory now. You still flinch at total darkness.',size:'Medium',bonusTalentSource:'background',bonusTalentTiers:[1,4,8,12,16,19],color:'#CCC4AC'},
    {id:'deepborn',name:'Deepborn',desc:'Born in the tunnels. You\'ve never seen the sky. Pale skin, wide eyes, sensitive hearing.',size:'Medium',bonusTalentSource:'deep heritage',bonusTalentTiers:[1,5,10,15,20],color:'#4A2A5E'},
    {id:'touched',name:'Crown-Touched',desc:'Born near a Crown fragment. Slightly warped from birth — extra fingers, odd eyes, whispers only you hear.',size:'Medium',bonusTalentSource:'corruption',bonusTalentTiers:[1,5,10,15,20],color:'#7B3F8E'},
    {id:'remnant',name:'Remnant',desc:'Descended from the builders of the old cities. You carry fragments of forgotten knowledge in your blood.',size:'Medium',bonusTalentSource:'ancestral memory',bonusTalentTiers:[1,5,10,15,20],color:'#3F6E8E'},
  ],

  cultures: [
    {id:'shallows',name:'The Shallows',region:'Upper Tunnels',lang:'Common / Whisper-tongue',desc:'Closest to the surface. Trading posts, dim lantern light, the last pretense of civilization.',expertise:'Trade routes, surface goods, lantern maintenance, basic medicine.',color:'#CCC4AC'},
    {id:'middeep',name:'The Mid-Deep',region:'Central Caverns',lang:'Deep Common',desc:'Vast caverns with fungal forests and underground lakes. Most settlements are here.',expertise:'Fungal cultivation, cave navigation, water purification, echo-mapping.',color:'#3A8E5C'},
    {id:'crownhold',name:'Crownhold',region:'Inner Sanctum',lang:'Crown-tongue / Deep Common',desc:'The cult\'s domain. Built around the largest Crown fragment. Beautiful and terrifying.',expertise:'Crown lore, corruption resistance, ritual knowledge, political manipulation.',color:'#7B3F8E'},
    {id:'drowned',name:'The Drowned Halls',region:'Flooded Ruins',lang:'Gurgle-sign / Deep Common',desc:'Partially submerged ancient city. Residents breathe through fungal gills or don\'t breathe at all.',expertise:'Swimming, underwater navigation, ruin-diving, holding breath, old-world artifacts.',color:'#3F6E8E'},
    {id:'ashpits',name:'The Ash Pits',region:'Volcanic Vents',lang:'Scream-speak / Deep Common',desc:'Near the volcanic heart. Brutal, hot, rich in metals. The toughest survive here.',expertise:'Metalworking, heat resistance, volcanic geology, pit fighting.',color:'#8E2020'},
    {id:'nowhere',name:'Nowhere',region:'Unmapped',lang:'Silence / gestures',desc:'You wandered alone in unmapped tunnels. You don\'t talk about what you saw.',expertise:'Solo survival, silence, reading darkness, sensing danger, forgetting.',color:'#2A2A2A'},
  ],

  singerForms: {},

  startingKits: [
    {id:'survivor',name:'Survivor',weapons:['shiv','torch'],armor:'rags',spheres:'3 scraps',extras:['Waterskin (cracked)','Fungal rations (3 days)','Rope (frayed, 30ft)'],expertise:null,desc:'You have almost nothing. That\'s normal down here.'},
    {id:'scav',name:'Scavenger Pack',weapons:['club'],armor:'patchwork',spheres:'5 scraps',extras:['Tool bag','Wire','Salvaged metal bits','Fungal paste'],expertise:'Crafting',desc:'Junk to most. Treasure to you.'},
    {id:'cultgear',name:'Cult Remnants',weapons:['shiv'],armor:'cult robes',spheres:'2 scraps',extras:['Crown symbol (broken)','Ritual notes','Ink and blood-quill'],expertise:'Crown Lore',desc:'Relics of a faith you abandoned. Or did it abandon you?'},
    {id:'fighter',name:'Pit Fighter Gear',weapons:['chain','shiv'],armor:'leather scraps',spheres:'4 scraps',extras:['Bandages','Stimulant fungus','Chalk (for grip)'],expertise:'Intimidation',desc:'You\'ve bled for entertainment. Now you bleed for yourself.'},
  ],

  // ══════════════════════════════════════════════════════════════════════
  // COMBAT & EQUIPMENT
  // ══════════════════════════════════════════════════════════════════════

  weapons: {
    shiv:     {name:'Bone Shiv',skill:'lightWeapon',attr:'cunning',dmg:'1d4',dmgType:'keen',traits:['Silent','Concealed']},
    club:     {name:'Rubble Club',skill:'heavyWeapon',attr:'will',dmg:'1d8',dmgType:'impact',traits:['Loud','Crushing']},
    chain:    {name:'Rusted Chain',skill:'heavyWeapon',attr:'shadow',dmg:'1d6',dmgType:'impact',traits:['Reach','Grapple']},
    sling:    {name:'Cave Sling',skill:'lightWeapon',attr:'instinct',dmg:'1d6',dmgType:'impact',traits:['Ranged [40/120]','Silent']},
    torch:    {name:'Burning Brand',skill:'lightWeapon',attr:'will',dmg:'1d4',dmgType:'energy',traits:['Light source','Fire']},
    claws:    {name:'Crown Claws',skill:'lightWeapon',attr:'obsession',dmg:'1d6',dmgType:'keen',traits:['Natural','Corruption']},
    pike:     {name:'Bone Pike',skill:'heavyWeapon',attr:'will',dmg:'1d8',dmgType:'keen',traits:['Reach','Two-Handed']},
    unarmed:  {name:'Bare Hands',skill:'athletics',attr:'will',dmg:'1d4',dmgType:'impact',traits:['Grapple']},
  },

  armors: {
    rags:       {name:'Rags',deflect:0,traits:['Concealment']},
    patchwork:  {name:'Patchwork',deflect:1,traits:['Noisy']},
    leather:    {name:'Cave Leather',deflect:2,traits:[]},
    chitin:     {name:'Chitin Plates',deflect:3,traits:['Insect-sourced','Cumbersome']},
    crownplate: {name:'Crown-Touched Plate',deflect:4,traits:['Corrupting','Whispers']},
  },

  surges: [
    {id:'blindsight',name:'Blindsight',attr:'shadow',orders:['lurker'],desc:'See perfectly in absolute darkness. Light becomes painful.',dmgType:null,targetDef:null},
    {id:'echolocation',name:'Echolocation',attr:'instinct',orders:['lurker'],desc:'Map entire caverns with a whisper. Detect hidden creatures.',dmgType:null,targetDef:null},
    {id:'shadowMeld',name:'Shadow Meld',attr:'shadow',orders:['lurker'],desc:'Step into shadows and become invisible. Moving breaks the meld.',dmgType:null,targetDef:'physDef'},
    {id:'quickFingers',name:'Quick Fingers',attr:'cunning',orders:['thief'],desc:'Steal, plant, or swap items faster than the eye can follow.',dmgType:null,targetDef:null},
    {id:'misdirect',name:'Misdirection',attr:'cunning',orders:['thief'],desc:'Create a distraction — sound, movement, false presence.',dmgType:null,targetDef:'cogDef'},
    {id:'escapeArtist',name:'Escape Artist',attr:'cunning',orders:['thief'],desc:'Slip bonds, squeeze through gaps, dodge grapples.',dmgType:null,targetDef:null},
    {id:'memoryDrain',name:'Memory Drain',attr:'obsession',orders:['watcher'],desc:'Touch a creature and rip a memory from their mind. You gain it; they lose it.',dmgType:'spirit',targetDef:'cogDef'},
    {id:'psychicEcho',name:'Psychic Echo',attr:'obsession',orders:['watcher'],desc:'Replay a memory so vividly the target relives it — stunning them.',dmgType:'spirit',targetDef:'cogDef'},
    {id:'mindShatter',name:'Mind Shatter',attr:'obsession',orders:['watcher'],desc:'Overwhelm a mind with stolen memories. Devastating but costs your own.',dmgType:'spirit',targetDef:'spirDef'},
    {id:'corruptTouch',name:'Corrupt Touch',attr:'obsession',orders:['whisperer'],desc:'Your touch spreads dark veins through flesh. Deals damage and raises Obsession in the target.',dmgType:'spirit',targetDef:'spirDef'},
    {id:'crownVoice',name:'Crown Voice',attr:'obsession',orders:['whisperer'],desc:'Speak with the Crown\'s authority. Creatures must save or obey a single command.',dmgType:null,targetDef:'spirDef'},
    {id:'warpFlesh',name:'Warp Flesh',attr:'obsession',orders:['whisperer'],desc:'Reshape living tissue — heal allies or deform enemies.',dmgType:'spirit',targetDef:'physDef'},
    {id:'graftLimb',name:'Graft Limb',attr:'will',orders:['fleshwright'],desc:'Attach salvaged flesh or bone to replace damaged limbs. Temporary but functional.',dmgType:null,targetDef:null},
    {id:'bonesplint',name:'Bone Splint',attr:'instinct',orders:['fleshwright'],desc:'Instantly set broken bones and fuse torn tissue. Painful but effective.',dmgType:null,targetDef:null},
    {id:'fleshShield',name:'Flesh Shield',attr:'will',orders:['fleshwright'],desc:'Harden your own skin to absorb incoming damage. Your body pays the cost later.',dmgType:null,targetDef:null},
  ],

  surgeScale: [{rank:1,die:'d4',size:'Whisper'},{rank:2,die:'d6',size:'Murmur'},{rank:3,die:'d8',size:'Voice'},{rank:4,die:'d10',size:'Scream'},{rank:5,die:'d12',size:'Crown Command'}],

  orderSurges: {
    lurker:['blindsight','echolocation','shadowMeld'],
    thief:['quickFingers','misdirect','escapeArtist'],
    watcher:['memoryDrain','psychicEcho','mindShatter'],
    whisperer:['corruptTouch','crownVoice','warpFlesh'],
    fleshwright:['graftLimb','bonesplint','fleshShield'],
  },

  conditions: {
    corrupted:{name:'Corrupted',desc:'Dark veins visible. Obsession rises by 1 each rest.'},
    paranoid:{name:'Paranoid',desc:'Disadvantage on all social tests. Cannot benefit from allies\' help.'},
    hollow:{name:'Hollow',desc:'Cannot feel emotions. Immune to fear but cannot be healed by magic.'},
    consumed:{name:'Consumed',desc:'Obsession at max. One more corruption effect and you become an NPC.'},
    blinded:{name:'Light-Blinded',desc:'Exposed to bright light. Disadvantage on attacks and perception.'},
    grasping:{name:'Grasping',desc:'Compelled to take the nearest valuable object. Will save to resist.'},
    drowning:{name:'Drowning',desc:'Suffocating. Lose HP each round. Only escape or air ends this.'},
    unconscious:{name:'Unconscious',desc:'Cannot act. Prone. Attacks against are automatic crits in melee.'},
  },

  injuryEffects: [
    'Paranoid (trust shattered)',
    'Paranoid (trust shattered)',
    'Light-Blinded (flash exposure)',
    'Corrupted (darkness seeps in)',
    'Hollow (emotions drain away)',
    'Grasping (the hunger takes hold)',
    'Drowning (lungs fill with dark water)',
    'Consumed (the Crown notices you)',
  ],

  adversaryRoles: {
    minion:{name:'Wretch',healthMult:0.5,threat:0.5,noCrit:true,rule:'Collapses on any critical hit — whimpering, not dead'},
    rival:{name:'Stalker',healthMult:1,threat:1,noCrit:false,rule:'Standard adversary — fights smart, retreats when losing'},
    boss:{name:'Crown-Vessel',healthMult:2,threat:4,noCrit:false,rule:'Two turns per round. Corruption aura — nearby players gain 1 Obsession per round.'},
  },

  combatOpps: ['Enemy flees into darkness','Stalactite falls on enemy position','Fungal gas disorients enemies','Water rises — changes terrain','Ancient trap activates in your favor','Crown fragment pulses — enemies flinch','Ally from the shadows helps','Enemy drops something valuable','Tunnel collapses behind enemies','Brief moment of clarity — Obsession drops by 1','Echo reveals hidden passage','Enemy turns on its allies'],
  combatComps: ['Light source goes out','Water rises','Tunnel narrows — movement restricted','Crown whispers — all players test Will or gain Obsession','Reinforcements from the dark','Fungal spores — poison cloud','Floor gives way','Enemy was a distraction — the real threat is behind you','An ally hears the Crown and freezes','Equipment corrodes','The darkness moves','Someone screams — not one of yours'],

  // ══════════════════════════════════════════════════════════════════════
  // LORE & FLAVOR
  // ══════════════════════════════════════════════════════════════════════

  npcMale: ['Skrave','Moltch','Drenn','Wyst','Cragg','Hollowjaw','Fungal Pete','Nub','Slink','Gloom','Biter','Twitch','Rathand','Ashthroat','Gulk','Mawson','Dreg','Toecurl','Whisp','Blackspit'],
  npcFemale: ['Drenna','Silt','Mireya','Vetch','Nailbiter','Hollow May','Ashwife','Crekka','Fungal Sue','Threadbare','Silkworm','Lanternjaw','Guttersnipe','Old Fingers','Puddleblood','Wystling','Needleteeth','Duskmother','Rattlechain','Bonesmith'],
  colors: [{name:'Corruption',hex:'#7B3F8E'},{name:'Sickly',hex:'#3A8E5C'},{name:'Blood',hex:'#8E2020'},{name:'Bone',hex:'#CCC4AC'},{name:'Rust',hex:'#8E5A3F'},{name:'Shadow',hex:'#2A2A2A'},{name:'Fungal',hex:'#5E8E3A'},{name:'Deep Water',hex:'#3F6E8E'}],
  npcColors: ['#7B3F8E','#3A8E5C','#8E2020','#CCC4AC','#8E5A3F','#2A2A2A','#5E8E3A','#3F6E8E','#6E6E6E','#4A2A5E'],

  skills: [
    {id:'athletics',name:'Athletics',attr:'will',group:'physical'},
    {id:'stealth',name:'Stealth',attr:'shadow',group:'physical'},
    {id:'lightWeapon',name:'Light Weaponry',attr:'cunning',group:'physical'},
    {id:'heavyWeapon',name:'Heavy Weaponry',attr:'will',group:'physical'},
    {id:'survival',name:'Survival',attr:'instinct',group:'physical'},
    {id:'crafting',name:'Crafting',attr:'cunning',group:'mental'},
    {id:'lore',name:'Deep Lore',attr:'cunning',group:'mental'},
    {id:'medicine',name:'Cave Medicine',attr:'instinct',group:'mental'},
    {id:'perception',name:'Perception',attr:'instinct',group:'mental'},
    {id:'deception',name:'Deception',attr:'cunning',group:'social'},
    {id:'intimidation',name:'Intimidation',attr:'shadow',group:'social'},
    {id:'insight',name:'Insight',attr:'instinct',group:'social'},
    {id:'persuasion',name:'Persuasion',attr:'cunning',group:'social'},
    {id:'corruption',name:'Corruption Lore',attr:'obsession',group:'mental'},
  ],

  pathSkills: {lurker:'stealth',thief:'deception',watcher:'insight',whisperer:'corruption',fleshwright:'medicine'},
  sprenAppearances: {},

  purposes: ['Escape the Deep — find a way to the surface','Destroy the Crown — end the corruption forever','Protect the Weak — someone has to','Find the Truth — what created the Crown?','Reclaim Your Name — remember who you were','Survive — that is enough'],
  obstacles: ['Crown Addiction — you\'ve touched it and you want more','Lost Memories — you don\'t remember your past','Betrayer — you sold someone to the cult','Hunted — the cult wants you back','Voices — the Crown speaks to you unbidden'],

  gemstones: {scraps:{chip:1,mark:5,broam:25},fungal:{chip:1,mark:10,broam:50},crownbit:{chip:5,mark:25,broam:100}},

  // ══════════════════════════════════════════════════════════════════════
  // WORLD DATA
  // ══════════════════════════════════════════════════════════════════════

  locations: ['The Shallows','Lantern Market','The Fungal Forest','Blackwater Lake','The Bone Bridge','Crownhold Gates','The Ash Pits','Echo Chamber','The Drowned Halls','Collapse Point','The Weeping Wall','The Worm Tunnels','Old City Ruins','The Hollow Throne','Sulfur Vents','The Deep Below'],
  offworldLocations: ['The Surface (myth?)','The Crown\'s Dream','The Void Between Stones','Memory Palace'],
  shadesmarLocations: ['Sub-Level One','The Flooded Cathedral','Root Network','The Obsidian Lake','Worm God\'s Burrow','The Singing Crevasse'],
  legendaryLocations: ['The Hollow Crown','The First Shaft','The Architect\'s Tomb'],

  baseActs: [{num:1,tag:'Act I — The Shallows',start:0,end:59},{num:2,tag:'Act II — The Deep',start:60,end:119},{num:3,tag:'Act III — The Crown',start:120,end:179}],
  bladeTiers: ['Crude','Honed','Warped','Crown-Touched','Hollow'],
  bladeNames: {lurker:'Shadowfang',thief:'Quicksilver Edge',watcher:'Memory\'s Tooth',whisperer:'Crown\'s Whisper',fleshwright:'Nerve Blade'},

  // ══════════════════════════════════════════════════════════════════════
  // PROGRESSION
  // ══════════════════════════════════════════════════════════════════════

  orderOaths: {
    lurker:['I watch from the dark.','I see what others cannot.','The shadows are mine to command.','Light cannot touch me.','I am the darkness itself.'],
    thief:['I take what I need.','No lock holds me.','What is theirs is mine.','I steal time itself.','Everything belongs to me.'],
    watcher:['I remember.','Their memories feed me.','I know what you\'ll do next.','I am everyone and no one.','All minds are open books.'],
    whisperer:['I hear the Crown.','Its voice is my voice.','Flesh obeys my word.','Reality bends when I speak.','I am the Crown\'s will made flesh.'],
    fleshwright:['I mend what breaks.','The body remembers my touch.','I rebuild what the Deep destroys.','Pain is a language I speak fluently.','I am the surgeon of the damned.'],
  },

  oathBonuses: {
    1:{desc:'First whisper heard',combat:0,heal:0},
    2:{desc:'Corruption ability manifests',combat:1,heal:0},
    3:{desc:'Physical warping begins',combat:1,heal:1,ability:'Corruption power'},
    4:{desc:'The Crown recognizes you',combat:2,heal:2,ability:'Major corruption'},
    5:{desc:'Fully consumed or transcended',combat:3,heal:3,ability:'Crown mastery'},
  },

  advancement: {
    1:{attr:false,hpBase:true,maxSkill:2},2:{attr:false,hpGain:4,maxSkill:2},3:{attr:true,hpGain:4,maxSkill:2},4:{attr:false,hpGain:4,maxSkill:2},5:{attr:false,hpGain:4,maxSkill:2},6:{attr:true,hpGain:3,maxSkill:3},7:{attr:false,hpGain:3,maxSkill:3},8:{attr:false,hpGain:3,maxSkill:3},9:{attr:true,hpGain:3,maxSkill:3},10:{attr:false,hpGain:3,maxSkill:3},
  },

  orderIdeals: {
    lurker:{words:['shadow','dark','hide','watch','see','invisible','silent'],ideal:'I am the darkness that watches'},
    thief:{words:['steal','take','grab','snatch','pocket','mine','claim'],ideal:'What is theirs becomes mine'},
    watcher:{words:['remember','memory','know','see','mind','forget','recall'],ideal:'I remember what you cannot'},
    whisperer:{words:['crown','whisper','corrupt','power','voice','command','obey'],ideal:'The Crown speaks through me'},
    fleshwright:{words:['heal','mend','flesh','bone','graft','surgery','body','fix','repair'],ideal:'The body is clay and I am the sculptor'},
  },

  hoidLines: [
    "Something skitters in the dark, too deliberate to be vermin. When you look, there's a smooth stone where nothing was before. It's warm.",
    "A voice echoes from a tunnel you're certain is a dead end: 'Wrong way. All ways are wrong. But that one is less wrong.' Silence.",
    "You find a handprint on the wall, glowing faintly. It matches your hand exactly. The glow fades as you watch.",
    "A blind woman sits at a crossroads that shouldn't exist. 'The Crown doesn't want you,' she says. 'That should worry you more.'",
    "Water drips upward for exactly three seconds. Then stops. No one else noticed.",
  ],

  // ══════════════════════════════════════════════════════════════════════
  // WEAPON GENERATION
  // ══════════════════════════════════════════════════════════════════════

  weaponPrefixes: ['Bone','Rust','Hollow','Crown','Fungal','Obsidian','Ash','Worm','Shadow','Drip'],
  weaponSuffixes: ['fang','bite','whisper','scream','tooth','claw','drip','maw','crawl','grip'],

  // ── Enemy Configuration ──────────────────────────────────────────────────
  // Boss Templates
  bossTemplates: [
    {name:'The Hollow King',type:'Crown Vessel',phases:[{hp:35,dmg:7,atk:7,desc:'A figure of pure darkness, crown fragments orbiting'},{hp:22,dmg:10,atk:9,desc:'Crown shards embedding in flesh, mutating'},{hp:10,dmg:14,atk:12,desc:'Barely human, the Crown itself fighting through them'}],drop:'Crown Shard'},
    {name:'The Worm God',type:'Aberration',phases:[{hp:45,dmg:8,atk:6,desc:'Vast, pale, filling the tunnel, grinding forward'},{hp:28,dmg:11,atk:9,desc:'Rearing up, maw splitting open, acid dripping'},{hp:14,dmg:15,atk:12,desc:'Thrashing in death throes, tunnel collapsing'}],drop:'Worm God Tooth'},
    {name:'The Rememberer',type:'Psychic Horror',phases:[{hp:30,dmg:6,atk:8,desc:'A figure of stolen faces, whispering your memories'},{hp:18,dmg:9,atk:10,desc:'Your own face stares back, speaking your secrets'},{hp:8,dmg:13,atk:13,desc:'Identity dissolving, pure psychic onslaught'}],drop:'Memory Crystal'},
  ],

  // Environmental Hazards
  envHazards: {
    shallows:{name:'Cave-In',desc:'The ceiling groans and drops rubble.',effect:'15% chance each round: random combatant takes 2 damage.',mechanic:'plateauCollapse'},
    drowned:{name:'Rising Water',desc:'Black water seeps from the walls, rising fast.',effect:'Players must spend movement or start drowning.',mechanic:'cognitiveDrain'},
    crownhold:{name:'Crown Aura',desc:'The Crown fragment pulses with corruption.',effect:'Each round all players gain 1 Obsession unless they resist.',mechanic:'voidWhispers'},
    ashpits:{name:'Volcanic Vents',desc:'Sulfurous gas erupts from cracks in the floor.',effect:'Players must save or take 2 heat damage.',mechanic:'cognitiveDrain'},
  },

  enemyCategories: ['undead','aberrations','beasts','goblinoids','plants','humanEnemies','swarms'],
  enemyPools: {
    shallows:[{name:'Tunnel Rat',type:'Beast',baseHP:5,dmg:2,attackBonus:2},{name:'Fungal Zombie',type:'Undead',baseHP:8,dmg:3,attackBonus:1},{name:'Scavenger Thug',type:'Humanoid',baseHP:9,dmg:3,attackBonus:2}],
    deep:[{name:'Cave Crawler',type:'Beast',baseHP:10,dmg:4,attackBonus:3},{name:'Crown Cultist',type:'Humanoid',baseHP:12,dmg:4,attackBonus:3},{name:'Worm Spawn',type:'Aberration',baseHP:14,dmg:5,attackBonus:4}],
    crownhold:[{name:'Crown Guard',type:'Humanoid',baseHP:16,dmg:5,attackBonus:5},{name:'Vessel',type:'Aberration',baseHP:20,dmg:7,attackBonus:6},{name:'Hollow One',type:'Undead',baseHP:14,dmg:6,attackBonus:4}],
    default:[{name:'Shadow Creeper',type:'Beast',baseHP:7,dmg:3,attackBonus:2},{name:'Tunnel Bandit',type:'Humanoid',baseHP:9,dmg:3,attackBonus:3},{name:'Corrupted Wanderer',type:'Undead',baseHP:11,dmg:4,attackBonus:3},{name:'Fungal Horror',type:'Plant',baseHP:10,dmg:4,attackBonus:2}],
  },
  enemyPatterns: [
    {keywords:[/crown.*cult|cultist|worshipper|robed/i],enemies:[{name:'Crown Cultist',type:'Humanoid',baseHP:12,dmg:4,attackBonus:3},{name:'Crown Zealot',type:'Elite',baseHP:18,dmg:6,attackBonus:5},{name:'Cult Initiate',type:'Humanoid',baseHP:7,dmg:2,attackBonus:2}]},
    {keywords:[/worm|burrow|tunnel.*creature|grinding/i],enemies:[{name:'Tunnel Worm',type:'Beast',baseHP:16,dmg:5,attackBonus:3},{name:'Worm Larva',type:'Swarm',baseHP:6,dmg:2,attackBonus:2},{name:'Great Worm',type:'Boss',baseHP:30,dmg:8,attackBonus:5}]},
    {keywords:[/fungal|mushroom|spore|mold/i],enemies:[{name:'Fungal Shambler',type:'Plant',baseHP:10,dmg:3,attackBonus:2},{name:'Spore Cloud',type:'Swarm',baseHP:5,dmg:2,attackBonus:1},{name:'Mycelium Horror',type:'Elite',baseHP:18,dmg:5,attackBonus:4}]},
    {keywords:[/water|flood|drowned|submerged/i],enemies:[{name:'Drowned One',type:'Undead',baseHP:12,dmg:4,attackBonus:3},{name:'Deep Lurker',type:'Aberration',baseHP:14,dmg:5,attackBonus:4},{name:'Water Wraith',type:'Spirit',baseHP:9,dmg:4,attackBonus:3}]},
    {keywords:[/crown.*fragment|artifact|relic|hollow/i],enemies:[{name:'Crown Fragment Guardian',type:'Construct',baseHP:20,dmg:6,attackBonus:5},{name:'Hollow Sentinel',type:'Undead',baseHP:16,dmg:5,attackBonus:4}]},
  ],
};
