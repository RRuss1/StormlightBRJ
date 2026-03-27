/**
 * app/enemyPatterns.js — Shared Enemy Pattern Registry
 * CYOAhub
 *
 * Master library of enemy patterns organized by category.
 * Each game system declares which categories are active.
 * The wizard lets custom world builders pick categories via checkboxes.
 * combat.js merges system-specific + shared patterns at runtime.
 */

// Category registry — used by wizard UI for checkboxes
window.ENEMY_CATEGORY_REGISTRY = [
  { id: 'undead', name: 'Undead', icon: '💀', desc: 'Skeletons, zombies, wraiths, vampires, liches' },
  { id: 'demons', name: 'Demons & Devils', icon: '👹', desc: 'Imps, demons, devils, hellhounds' },
  { id: 'dragons', name: 'Dragons & Drakes', icon: '🐉', desc: 'Fire dragons, frost drakes, wyverns, hydras' },
  { id: 'giants', name: 'Giants & Titans', icon: '🗿', desc: 'Ogres, trolls, frost giants, fire giants' },
  { id: 'goblinoids', name: 'Goblinoids', icon: '👺', desc: 'Goblins, orcs, kobolds, gnolls' },
  { id: 'beasts', name: 'Beasts & Megafauna', icon: '🕷', desc: 'Giant spiders, wolves, manticores, purple worms' },
  { id: 'fey', name: 'Fey & Nature', icon: '🍃', desc: 'Hags, blights, redcaps, quicklings' },
  { id: 'elementals', name: 'Elementals & Constructs', icon: '🔥', desc: 'Fire elementals, golems, mimics, animated armor' },
  { id: 'aberrations', name: 'Aberrations & Cosmic', icon: '👁', desc: 'Mind flayers, beholders, star spawn' },
  { id: 'sea', name: 'Sea & Water', icon: '🌊', desc: 'Sahuagin, kraken spawn, harpies, sirens' },
  { id: 'lycanthropes', name: 'Lycanthropes', icon: '🐺', desc: 'Werewolves, werebears, doppelgangers' },
  { id: 'plants', name: 'Plants & Fungi', icon: '🍄', desc: 'Shambling mounds, myconids, blights' },
  { id: 'humanEnemies', name: 'Human Enemies', icon: '⚔', desc: 'Cultists, pirates, assassins, bandits' },
  { id: 'mythological', name: 'Mythological', icon: '⛩', desc: 'Oni, djinn, rakshasa, Norse creatures' },
  { id: 'swarms', name: 'Swarms', icon: '🦇', desc: 'Rat swarms, bat swarms, insect swarms' },
];

// Shared patterns organized by category ID
// Each category contains an array of pattern objects: { keywords: [regex], enemies: [{name, type, baseHP, dmg, attackBonus}] }
window.SHARED_ENEMY_PATTERNS = {

  // ═══════════════════════════════════════════════════════════════
  // UNDEAD (8 patterns)
  // ═══════════════════════════════════════════════════════════════
  undead: [
    // ── Skeletons
    { keywords: [/skeleton|bone[s]?|rattling|undead.warrior/i],
      enemies: [
        { name: 'Skeleton Warrior',    type: 'Undead',  baseHP: 8,  dmg: 3, attackBonus: 2 },
        { name: 'Skeleton Archer',     type: 'Undead',  baseHP: 6,  dmg: 3, attackBonus: 3 },
        { name: 'Bone Knight',         type: 'Elite',   baseHP: 16, dmg: 5, attackBonus: 4 },
        { name: 'Bone Golem',          type: 'Construct',baseHP:22, dmg: 7, attackBonus: 4 },
      ]},

    // ── Zombies & Ghouls
    { keywords: [/zombie|ghoul|undead.horde|shambling|risen|corpse/i],
      enemies: [
        { name: 'Zombie',              type: 'Undead',  baseHP: 10, dmg: 3, attackBonus: 1 },
        { name: 'Ghoul',               type: 'Undead',  baseHP: 12, dmg: 4, attackBonus: 3 },
        { name: 'Plague Zombie',       type: 'Undead',  baseHP: 8,  dmg: 2, attackBonus: 1 },
        { name: 'Ghast',               type: 'Elite',   baseHP: 18, dmg: 5, attackBonus: 4 },
      ]},

    // ── Wraiths & Shadows
    { keywords: [/wraith|specter|phantom|shade[s]?|shadow.*attack|darkness.*moves/i],
      enemies: [
        { name: 'Shadow',              type: 'Undead',  baseHP: 9,  dmg: 3, attackBonus: 3 },
        { name: 'Wraith',              type: 'Undead',  baseHP: 14, dmg: 5, attackBonus: 4 },
        { name: 'Specter',             type: 'Undead',  baseHP: 11, dmg: 4, attackBonus: 3 },
        { name: 'Nighthaunt',          type: 'Elite',   baseHP: 20, dmg: 6, attackBonus: 5 },
      ]},

    // ── Vampires
    { keywords: [/vampire|blood.drain|fangs.*pale|coffin|undead.*noble/i],
      enemies: [
        { name: 'Vampire Spawn',       type: 'Undead',  baseHP: 14, dmg: 5, attackBonus: 4 },
        { name: 'Vampire',             type: 'Elite',   baseHP: 24, dmg: 7, attackBonus: 6 },
        { name: 'Vampire Mist Form',   type: 'Undead',  baseHP: 10, dmg: 3, attackBonus: 3 },
      ]},

    // ── Liches & Death Knights
    { keywords: [/lich|death.knight|undead.mage|phylactery|necromancer.risen/i],
      enemies: [
        { name: 'Death Knight',        type: 'Undead',  baseHP: 26, dmg: 8, attackBonus: 6 },
        { name: 'Lich',                type: 'Boss',    baseHP: 35, dmg: 9, attackBonus: 7 },
        { name: 'Wight',               type: 'Undead',  baseHP: 16, dmg: 5, attackBonus: 4 },
      ]},

    // ── Mummies
    { keywords: [/mummy|sarcophagus|burial.chamber|tomb|cursed.wrapping/i],
      enemies: [
        { name: 'Mummy',               type: 'Undead',  baseHP: 18, dmg: 5, attackBonus: 3 },
        { name: 'Mummy Lord',          type: 'Elite',   baseHP: 28, dmg: 7, attackBonus: 5 },
        { name: 'Desert Ghoul',        type: 'Undead',  baseHP: 10, dmg: 3, attackBonus: 2 },
      ]},

    // ── Revenants & Draugr
    { keywords: [/revenant|draugr|barrow|burial.mound|drowned.dead|grave.risen/i],
      enemies: [
        { name: 'Draugr',              type: 'Undead',  baseHP: 12, dmg: 4, attackBonus: 3 },
        { name: 'Barrow Wight',        type: 'Undead',  baseHP: 16, dmg: 5, attackBonus: 4 },
        { name: 'Revenant',            type: 'Elite',   baseHP: 22, dmg: 6, attackBonus: 5 },
      ]},

    // ── Banshees & Wailing Spirits
    { keywords: [/banshee|wailing|keening|death.scream|mourning.spirit/i],
      enemies: [
        { name: 'Banshee',             type: 'Undead',  baseHP: 13, dmg: 5, attackBonus: 4 },
        { name: 'Grief Wraith',        type: 'Undead',  baseHP: 10, dmg: 4, attackBonus: 3 },
        { name: 'Death\'s Head',       type: 'Elite',   baseHP: 18, dmg: 6, attackBonus: 5 },
      ]},
  ],

  // ═══════════════════════════════════════════════════════════════
  // DEMONS & DEVILS (5 patterns)
  // ═══════════════════════════════════════════════════════════════
  demons: [
    // ── Imps & Minor Demons
    { keywords: [/imp|minor.demon|demon.familiar|hell.*small|fiendling/i],
      enemies: [
        { name: 'Imp',                 type: 'Fiend',   baseHP: 5,  dmg: 2, attackBonus: 2 },
        { name: 'Quasit',              type: 'Fiend',   baseHP: 4,  dmg: 2, attackBonus: 2 },
        { name: 'Lemure',              type: 'Fiend',   baseHP: 6,  dmg: 2, attackBonus: 1 },
        { name: 'Mane Demon',          type: 'Fiend',   baseHP: 5,  dmg: 2, attackBonus: 1 },
      ]},

    // ── Greater Demons
    { keywords: [/demon|fiend|abyssal|hell.*breach|infernal|daemonic/i],
      enemies: [
        { name: 'Vrock',               type: 'Demon',   baseHP: 18, dmg: 6, attackBonus: 5 },
        { name: 'Hezrou',              type: 'Demon',   baseHP: 22, dmg: 7, attackBonus: 5 },
        { name: 'Glabrezu',            type: 'Elite',   baseHP: 28, dmg: 8, attackBonus: 6 },
        { name: 'Shadow Demon',        type: 'Demon',   baseHP: 12, dmg: 4, attackBonus: 4 },
      ]},

    // ── Devils & Hell Knights
    { keywords: [/devil|hell.knight|pit.*fiend|infernal.contract|nine.hells/i],
      enemies: [
        { name: 'Bearded Devil',       type: 'Devil',   baseHP: 16, dmg: 5, attackBonus: 4 },
        { name: 'Chain Devil',         type: 'Devil',   baseHP: 18, dmg: 6, attackBonus: 5 },
        { name: 'Bone Devil',          type: 'Elite',   baseHP: 22, dmg: 7, attackBonus: 5 },
        { name: 'Pit Fiend',           type: 'Boss',    baseHP: 32, dmg: 9, attackBonus: 7 },
      ]},

    // ── Succubus / Incubus / Temptation Demons
    { keywords: [/succubus|incubus|temptress|seductive.*demon|charm.*fiend/i],
      enemies: [
        { name: 'Succubus',            type: 'Fiend',   baseHP: 14, dmg: 4, attackBonus: 4 },
        { name: 'Cambion',             type: 'Fiend',   baseHP: 18, dmg: 5, attackBonus: 5 },
      ]},

    // ── Hellhounds & Demon Beasts
    { keywords: [/hellhound|demon.hound|infernal.beast|hell.*dog|fire.*beast.*hell/i],
      enemies: [
        { name: 'Hellhound',           type: 'Fiend',   baseHP: 12, dmg: 5, attackBonus: 4 },
        { name: 'Nessian Warhound',    type: 'Elite',   baseHP: 18, dmg: 6, attackBonus: 5 },
        { name: 'Barghest',            type: 'Fiend',   baseHP: 14, dmg: 5, attackBonus: 4 },
      ]},
  ],

  // ═══════════════════════════════════════════════════════════════
  // DRAGONS & DRAKES (5 patterns)
  // ═══════════════════════════════════════════════════════════════
  dragons: [
    // ── Fire Dragons
    { keywords: [/dragon|wyrm|ancient.*beast.*fire|fire.*breath|scales.*red/i],
      enemies: [
        { name: 'Dragon Whelp',        type: 'Dragon',  baseHP: 14, dmg: 6, attackBonus: 4 },
        { name: 'Young Fire Drake',    type: 'Dragon',  baseHP: 22, dmg: 7, attackBonus: 5 },
        { name: 'Ancient Red Dragon',  type: 'Boss',    baseHP: 40, dmg: 12,attackBonus: 8 },
      ]},

    // ── Frost / Ice Dragons
    { keywords: [/frost.dragon|ice.wyrm|white.dragon|frozen.*breath|glacial.*beast/i],
      enemies: [
        { name: 'Frost Drake',         type: 'Dragon',  baseHP: 18, dmg: 6, attackBonus: 4 },
        { name: 'Ice Wyvern',          type: 'Dragon',  baseHP: 14, dmg: 5, attackBonus: 4 },
        { name: 'Ancient White Dragon',type: 'Boss',    baseHP: 38, dmg: 11,attackBonus: 7 },
      ]},

    // ── Wyverns
    { keywords: [/wyvern|winged.*serpent|barbed.tail|poisoned.*stinger/i],
      enemies: [
        { name: 'Wyvern',              type: 'Dragon',  baseHP: 18, dmg: 6, attackBonus: 4 },
        { name: 'Wyvern Rider',        type: 'Elite',   baseHP: 22, dmg: 7, attackBonus: 5 },
      ]},

    // ── Hydra
    { keywords: [/hydra|many.headed|regrows.*heads|serpent.*heads/i],
      enemies: [
        { name: 'Hydra',               type: 'Beast',   baseHP: 28, dmg: 8, attackBonus: 5 },
        { name: 'Lernaean Spawn',      type: 'Beast',   baseHP: 14, dmg: 5, attackBonus: 3 },
      ]},

    // ── Basilisk & Cockatrice
    { keywords: [/basilisk|cockatrice|petrif|stone.*gaze|turned.*stone/i],
      enemies: [
        { name: 'Basilisk',            type: 'Beast',   baseHP: 16, dmg: 5, attackBonus: 3 },
        { name: 'Cockatrice',          type: 'Beast',   baseHP: 10, dmg: 3, attackBonus: 2 },
        { name: 'Greater Basilisk',    type: 'Elite',   baseHP: 22, dmg: 6, attackBonus: 4 },
      ]},
  ],

  // ═══════════════════════════════════════════════════════════════
  // GIANTS & TITANS (4 patterns)
  // ═══════════════════════════════════════════════════════════════
  giants: [
    // ── Hill & Cave Giants
    { keywords: [/ogre|hill.giant|cave.giant|massive.*humanoid|giant.*club/i],
      enemies: [
        { name: 'Ogre',                type: 'Giant',   baseHP: 18, dmg: 6, attackBonus: 4 },
        { name: 'Hill Giant',          type: 'Giant',   baseHP: 24, dmg: 7, attackBonus: 4 },
        { name: 'Cave Troll',          type: 'Giant',   baseHP: 20, dmg: 6, attackBonus: 4 },
        { name: 'Ettin',               type: 'Elite',   baseHP: 26, dmg: 7, attackBonus: 5 },
      ]},

    // ── Frost Giants
    { keywords: [/frost.giant|ice.giant|jotun|giant.*frozen|giant.*north/i],
      enemies: [
        { name: 'Frost Giant',         type: 'Giant',   baseHP: 30, dmg: 9, attackBonus: 6 },
        { name: 'Frost Giant Jarl',    type: 'Boss',    baseHP: 38, dmg: 10,attackBonus: 7 },
        { name: 'Winter Wolf',         type: 'Beast',   baseHP: 14, dmg: 5, attackBonus: 4 },
      ]},

    // ── Fire Giants
    { keywords: [/fire.giant|giant.*forge|giant.*volcanic|giant.*flame/i],
      enemies: [
        { name: 'Fire Giant',          type: 'Giant',   baseHP: 32, dmg: 10,attackBonus: 6 },
        { name: 'Fire Giant Thane',    type: 'Boss',    baseHP: 40, dmg: 11,attackBonus: 7 },
        { name: 'Magma Elemental',     type: 'Elemental',baseHP:18, dmg: 6, attackBonus: 4 },
      ]},

    // ── Trolls
    { keywords: [/troll|regenerat.*flesh|rubbery.*hide|troll.*bridge/i],
      enemies: [
        { name: 'River Troll',         type: 'Giant',   baseHP: 16, dmg: 5, attackBonus: 3 },
        { name: 'Mountain Troll',      type: 'Giant',   baseHP: 20, dmg: 6, attackBonus: 4 },
        { name: 'Cave Troll',          type: 'Elite',   baseHP: 22, dmg: 7, attackBonus: 4 },
      ]},
  ],

  // ═══════════════════════════════════════════════════════════════
  // GOBLINOIDS (3 patterns)
  // ═══════════════════════════════════════════════════════════════
  goblinoids: [
    // ── Goblins
    { keywords: [/goblin|gremlin|small.*green|screeching.*horde|goblin.warband/i],
      enemies: [
        { name: 'Goblin',              type: 'Goblinoid',baseHP: 5,  dmg: 2, attackBonus: 2 },
        { name: 'Goblin Shaman',       type: 'Goblinoid',baseHP: 7,  dmg: 3, attackBonus: 2 },
        { name: 'Goblin Boss',         type: 'Elite',   baseHP: 14, dmg: 4, attackBonus: 3 },
        { name: 'Bugbear',             type: 'Goblinoid',baseHP: 14, dmg: 5, attackBonus: 4 },
      ]},

    // ── Orcs
    { keywords: [/orc|uruk|warband.*savage|brutal.*raider|orcish/i],
      enemies: [
        { name: 'Orc Warrior',         type: 'Humanoid',baseHP: 10, dmg: 4, attackBonus: 3 },
        { name: 'Orc Berserker',       type: 'Humanoid',baseHP: 14, dmg: 5, attackBonus: 4 },
        { name: 'Orc War Chief',       type: 'Elite',   baseHP: 20, dmg: 6, attackBonus: 5 },
        { name: 'Orc Shaman',          type: 'Humanoid',baseHP: 12, dmg: 4, attackBonus: 3 },
      ]},

    // ── Kobolds & Gnolls
    { keywords: [/kobold|gnoll|hyena.folk|rat.kin|small.*trap/i],
      enemies: [
        { name: 'Kobold',              type: 'Goblinoid',baseHP: 4,  dmg: 2, attackBonus: 2 },
        { name: 'Kobold Trapmaster',   type: 'Goblinoid',baseHP: 6,  dmg: 2, attackBonus: 2 },
        { name: 'Gnoll',               type: 'Humanoid',baseHP: 12, dmg: 4, attackBonus: 3 },
        { name: 'Gnoll Pack Lord',     type: 'Elite',   baseHP: 18, dmg: 5, attackBonus: 4 },
      ]},
  ],

  // ═══════════════════════════════════════════════════════════════
  // BEASTS & MEGAFAUNA (5 patterns)
  // ═══════════════════════════════════════════════════════════════
  beasts: [
    // ── Giant Spiders
    { keywords: [/spider|web|arachnid|eight.legged|silk.*trap|venom.*bite/i],
      enemies: [
        { name: 'Giant Spider',        type: 'Beast',   baseHP: 8,  dmg: 3, attackBonus: 3 },
        { name: 'Phase Spider',        type: 'Beast',   baseHP: 12, dmg: 4, attackBonus: 4 },
        { name: 'Spider Matriarch',    type: 'Elite',   baseHP: 18, dmg: 5, attackBonus: 4 },
        { name: 'Spider Swarm',        type: 'Swarm',   baseHP: 5,  dmg: 2, attackBonus: 2 },
      ]},

    // ── Wolves & Dire Beasts
    { keywords: [/wolf|dire.wolf|pack.*hunting|howl.*darkness|wolf.*pack/i],
      enemies: [
        { name: 'Wolf',                type: 'Beast',   baseHP: 7,  dmg: 3, attackBonus: 3 },
        { name: 'Dire Wolf',           type: 'Beast',   baseHP: 14, dmg: 5, attackBonus: 4 },
        { name: 'Winter Wolf',         type: 'Beast',   baseHP: 14, dmg: 5, attackBonus: 4 },
        { name: 'Greatwolf Alpha',     type: 'Elite',   baseHP: 20, dmg: 6, attackBonus: 5 },
      ]},

    // ── Manticore & Chimera
    { keywords: [/manticore|chimera|sphinx|lion.*wings|beast.*many.parts/i],
      enemies: [
        { name: 'Manticore',           type: 'Beast',   baseHP: 18, dmg: 6, attackBonus: 5 },
        { name: 'Chimera',             type: 'Beast',   baseHP: 22, dmg: 7, attackBonus: 5 },
        { name: 'Peryton',             type: 'Beast',   baseHP: 12, dmg: 4, attackBonus: 4 },
      ]},

    // ── Giant Insects & Vermin
    { keywords: [/giant.insect|giant.centipede|giant.wasp|giant.scorpion|swarm.*insect/i],
      enemies: [
        { name: 'Giant Centipede',     type: 'Beast',   baseHP: 5,  dmg: 2, attackBonus: 2 },
        { name: 'Giant Scorpion',      type: 'Beast',   baseHP: 12, dmg: 4, attackBonus: 3 },
        { name: 'Giant Wasp',          type: 'Beast',   baseHP: 8,  dmg: 3, attackBonus: 3 },
        { name: 'Insect Swarm',        type: 'Swarm',   baseHP: 4,  dmg: 2, attackBonus: 2 },
      ]},

    // ── Purple Worm & Megafauna
    { keywords: [/purple.worm|land.shark|bulette|ground.*erupts|earth.*bursts/i],
      enemies: [
        { name: 'Bulette',             type: 'Beast',   baseHP: 22, dmg: 7, attackBonus: 5 },
        { name: 'Purple Worm',         type: 'Boss',    baseHP: 36, dmg: 10,attackBonus: 6 },
        { name: 'Ankheg',              type: 'Beast',   baseHP: 14, dmg: 5, attackBonus: 4 },
      ]},
  ],

  // ═══════════════════════════════════════════════════════════════
  // FEY & NATURE (3 patterns)
  // ═══════════════════════════════════════════════════════════════
  fey: [
    // ── Hags
    { keywords: [/hag|witch|crone|cursed.old|iron.teeth|fey.crone/i],
      enemies: [
        { name: 'Green Hag',           type: 'Fey',     baseHP: 16, dmg: 5, attackBonus: 4 },
        { name: 'Sea Hag',             type: 'Fey',     baseHP: 14, dmg: 4, attackBonus: 3 },
        { name: 'Night Hag',           type: 'Elite',   baseHP: 22, dmg: 6, attackBonus: 5 },
        { name: 'Annis Hag',           type: 'Boss',    baseHP: 28, dmg: 8, attackBonus: 6 },
      ]},

    // ── Blights & Corrupted Nature
    { keywords: [/blight|corrupted.*forest|dark.*grove|twisted.*tree|forest.*turns/i],
      enemies: [
        { name: 'Twig Blight',         type: 'Plant',   baseHP: 4,  dmg: 2, attackBonus: 2 },
        { name: 'Needle Blight',       type: 'Plant',   baseHP: 6,  dmg: 3, attackBonus: 2 },
        { name: 'Vine Blight',         type: 'Plant',   baseHP: 10, dmg: 4, attackBonus: 3 },
        { name: 'Tree Blight',         type: 'Elite',   baseHP: 22, dmg: 6, attackBonus: 4 },
      ]},

    // ── Fey Hostiles
    { keywords: [/fey|faerie|pixie.*hostile|sprite.*attack|redcap|quickling/i],
      enemies: [
        { name: 'Redcap',              type: 'Fey',     baseHP: 12, dmg: 5, attackBonus: 4 },
        { name: 'Quickling',           type: 'Fey',     baseHP: 6,  dmg: 3, attackBonus: 5 },
        { name: 'Boggle',              type: 'Fey',     baseHP: 5,  dmg: 2, attackBonus: 3 },
        { name: 'Meenlock',            type: 'Fey',     baseHP: 14, dmg: 4, attackBonus: 4 },
      ]},
  ],

  // ═══════════════════════════════════════════════════════════════
  // ELEMENTALS & CONSTRUCTS (4 patterns)
  // ═══════════════════════════════════════════════════════════════
  elementals: [
    // ── Fire Elementals
    { keywords: [/fire.elemental|wall.*flame|inferno.*alive|living.*fire|flame.*being/i],
      enemies: [
        { name: 'Fire Mephit',         type: 'Elemental',baseHP: 6,  dmg: 3, attackBonus: 3 },
        { name: 'Fire Elemental',      type: 'Elemental',baseHP: 16, dmg: 6, attackBonus: 5 },
        { name: 'Elder Fire Elemental',type: 'Elite',   baseHP: 26, dmg: 8, attackBonus: 6 },
      ]},

    // ── Earth & Stone
    { keywords: [/earth.elemental|stone.golem|gargoyle|animated.*stone|earth.*rises/i],
      enemies: [
        { name: 'Gargoyle',            type: 'Construct',baseHP: 14, dmg: 5, attackBonus: 4 },
        { name: 'Earth Elemental',     type: 'Elemental',baseHP: 18, dmg: 6, attackBonus: 4 },
        { name: 'Stone Golem',         type: 'Construct',baseHP: 28, dmg: 8, attackBonus: 5 },
        { name: 'Galeb Duhr',          type: 'Elemental',baseHP: 16, dmg: 5, attackBonus: 4 },
      ]},

    // ── Animated Objects
    { keywords: [/animated|suit.*armor.*moves|statues.*alive|object.*attacks|construct.*guardian/i],
      enemies: [
        { name: 'Animated Armor',      type: 'Construct',baseHP: 12, dmg: 4, attackBonus: 3 },
        { name: 'Flying Sword',        type: 'Construct',baseHP: 6,  dmg: 3, attackBonus: 4 },
        { name: 'Shield Guardian',     type: 'Construct',baseHP: 22, dmg: 6, attackBonus: 4 },
        { name: 'Iron Golem',          type: 'Boss',    baseHP: 32, dmg: 9, attackBonus: 6 },
      ]},

    // ── Mimics & Shapeshifting Constructs
    { keywords: [/mimic|chest.*alive|door.*bites|surface.*grabs|object.*creature/i],
      enemies: [
        { name: 'Mimic',               type: 'Construct',baseHP: 14, dmg: 5, attackBonus: 4 },
        { name: 'Mimic Colony',        type: 'Elite',   baseHP: 22, dmg: 6, attackBonus: 4 },
        { name: 'Doppelganger',        type: 'Shapeshifter',baseHP:16,dmg:5, attackBonus: 5 },
      ]},
  ],

  // ═══════════════════════════════════════════════════════════════
  // ABERRATIONS & COSMIC HORRORS (4 patterns)
  // ═══════════════════════════════════════════════════════════════
  aberrations: [
    // ── Mind Flayers
    { keywords: [/mind.flayer|illithid|psychic.*attack|tentacle.*face|brain.*extract/i],
      enemies: [
        { name: 'Mind Flayer',         type: 'Aberration',baseHP:22, dmg: 6, attackBonus: 6 },
        { name: 'Intellect Devourer',  type: 'Aberration',baseHP: 8, dmg: 4, attackBonus: 4 },
        { name: 'Elder Brain',         type: 'Boss',    baseHP: 36, dmg: 9, attackBonus: 7 },
      ]},

    // ── Beholders
    { keywords: [/beholder|eye.*rays|floating.*eye|anti.magic.*cone|eye.*stalks/i],
      enemies: [
        { name: 'Spectator',           type: 'Aberration',baseHP:14, dmg: 5, attackBonus: 4 },
        { name: 'Beholder',            type: 'Boss',    baseHP: 32, dmg: 8, attackBonus: 7 },
        { name: 'Death Tyrant',        type: 'Boss',    baseHP: 36, dmg: 9, attackBonus: 7 },
      ]},

    // ── Gibbering & Chaos Creatures
    { keywords: [/gibbering|chaos.beast|aberration|wrong.*geometry|reality.*warps/i],
      enemies: [
        { name: 'Gibbering Mouther',   type: 'Aberration',baseHP:12, dmg: 4, attackBonus: 3 },
        { name: 'Chaos Beast',         type: 'Aberration',baseHP:18, dmg: 6, attackBonus: 4 },
        { name: 'Nothic',              type: 'Aberration',baseHP:14, dmg: 5, attackBonus: 4 },
        { name: 'Otyugh',              type: 'Aberration',baseHP:20, dmg: 6, attackBonus: 4 },
      ]},

    // ── Star Spawn & Void Entities
    { keywords: [/star.spawn|void.*entity|cosmic.*horror|eldritch|outer.dark|between.worlds/i],
      enemies: [
        { name: 'Star Spawn Grue',     type: 'Aberration',baseHP: 8, dmg: 3, attackBonus: 3 },
        { name: 'Star Spawn Hulk',     type: 'Aberration',baseHP:24, dmg: 7, attackBonus: 5 },
        { name: 'Dimensional Shambler',type: 'Aberration',baseHP:16, dmg: 5, attackBonus: 4 },
        { name: 'Void Spawn',          type: 'Aberration',baseHP:12, dmg: 4, attackBonus: 4 },
      ]},
  ],

  // ═══════════════════════════════════════════════════════════════
  // SEA & WATER (3 patterns)
  // ═══════════════════════════════════════════════════════════════
  sea: [
    // ── Sahuagin & Deep Ones
    { keywords: [/sahuagin|deep.one|fish.folk|beneath.*waves|mer.*hostile|kuo.toa/i],
      enemies: [
        { name: 'Sahuagin',            type: 'Humanoid',baseHP: 10, dmg: 3, attackBonus: 3 },
        { name: 'Sahuagin Baron',      type: 'Elite',   baseHP: 20, dmg: 6, attackBonus: 5 },
        { name: 'Kuo-Toa',             type: 'Humanoid',baseHP: 9,  dmg: 3, attackBonus: 2 },
        { name: 'Deep One',            type: 'Aberration',baseHP:16, dmg: 5, attackBonus: 4 },
      ]},

    // ── Kraken & Sea Monsters
    { keywords: [/kraken|sea.monster|leviathan|tentacle.*ocean|ship.*capsiz|sea.*serpent/i],
      enemies: [
        { name: 'Sea Serpent',         type: 'Beast',   baseHP: 24, dmg: 7, attackBonus: 5 },
        { name: 'Chuul',               type: 'Aberration',baseHP:18, dmg: 6, attackBonus: 4 },
        { name: 'Dragon Turtle',       type: 'Elite',   baseHP: 32, dmg: 9, attackBonus: 6 },
        { name: 'Kraken Spawn',        type: 'Beast',   baseHP: 20, dmg: 7, attackBonus: 5 },
      ]},

    // ── Sirens & Harpies
    { keywords: [/harpy|siren|song.*lure|beautiful.*deadly|voice.*enchant/i],
      enemies: [
        { name: 'Harpy',               type: 'Monstrosity',baseHP:12,dmg: 4, attackBonus: 3 },
        { name: 'Siren',               type: 'Fey',     baseHP: 10, dmg: 3, attackBonus: 3 },
        { name: 'Harpy Matron',        type: 'Elite',   baseHP: 18, dmg: 5, attackBonus: 4 },
      ]},
  ],

  // ═══════════════════════════════════════════════════════════════
  // LYCANTHROPES & SHAPESHIFTERS (2 patterns)
  // ═══════════════════════════════════════════════════════════════
  lycanthropes: [
    // ── Werewolves
    { keywords: [/werewolf|lycanthrope|wolf.*transforms|cursed.*bite|full.moon/i],
      enemies: [
        { name: 'Werewolf',            type: 'Shapeshifter',baseHP:16,dmg: 5, attackBonus: 4 },
        { name: 'Wereboar',            type: 'Shapeshifter',baseHP:18,dmg: 6, attackBonus: 4 },
        { name: 'Werewolf Alpha',      type: 'Elite',   baseHP: 24, dmg: 7, attackBonus: 5 },
        { name: 'Weretiger',           type: 'Shapeshifter',baseHP:20,dmg: 6, attackBonus: 5 },
      ]},

    // ── Skinwalkers & Doppelgangers
    { keywords: [/skinwalker|shapeshifter|face.*stolen|impersonat|wrong.*face/i],
      enemies: [
        { name: 'Doppelganger',        type: 'Shapeshifter',baseHP:16,dmg: 5, attackBonus: 5 },
        { name: 'Skinwalker',          type: 'Shapeshifter',baseHP:14,dmg: 4, attackBonus: 4 },
        { name: 'Fetch',               type: 'Fey',     baseHP: 12, dmg: 4, attackBonus: 4 },
      ]},
  ],

  // ═══════════════════════════════════════════════════════════════
  // PLANTS & FUNGI (2 patterns)
  // ═══════════════════════════════════════════════════════════════
  plants: [
    // ── Fungal Horrors
    { keywords: [/fungus|myconid|spore|mushroom.*hostile|violet.fungus|gas.spore/i],
      enemies: [
        { name: 'Violet Fungus',       type: 'Plant',   baseHP: 6,  dmg: 3, attackBonus: 2 },
        { name: 'Gas Spore',           type: 'Plant',   baseHP: 4,  dmg: 2, attackBonus: 1 },
        { name: 'Myconid Sovereign',   type: 'Elite',   baseHP: 18, dmg: 5, attackBonus: 3 },
        { name: 'Corpse Flower',       type: 'Plant',   baseHP: 14, dmg: 5, attackBonus: 3 },
      ]},

    // ── Shambling Mound & Assassin Vine
    { keywords: [/shambling|assassin.vine|plant.*grabs|jungle.*alive|vines.*attack/i],
      enemies: [
        { name: 'Assassin Vine',       type: 'Plant',   baseHP: 10, dmg: 4, attackBonus: 3 },
        { name: 'Shambling Mound',     type: 'Plant',   baseHP: 22, dmg: 6, attackBonus: 4 },
        { name: 'Tendriculos',         type: 'Elite',   baseHP: 26, dmg: 7, attackBonus: 4 },
      ]},
  ],

  // ═══════════════════════════════════════════════════════════════
  // HUMAN ENEMIES (3 patterns)
  // ═══════════════════════════════════════════════════════════════
  humanEnemies: [
    // ── Cultists & Dark Priests
    { keywords: [/cultist|dark.priest|blood.ritual|sacrifice|forbidden.ritual|cult.fanatic/i],
      enemies: [
        { name: 'Cultist',             type: 'Humanoid',baseHP: 7,  dmg: 2, attackBonus: 2 },
        { name: 'Cult Fanatic',        type: 'Humanoid',baseHP: 12, dmg: 4, attackBonus: 3 },
        { name: 'Dark Priest',         type: 'Elite',   baseHP: 16, dmg: 5, attackBonus: 4 },
        { name: 'High Cultist',        type: 'Boss',    baseHP: 22, dmg: 6, attackBonus: 5 },
      ]},

    // ── Pirates & Corsairs
    { keywords: [/pirate|corsair|sea.raider|ship.*boarding|cutlass.*crew/i],
      enemies: [
        { name: 'Pirate Deckhand',     type: 'Humanoid',baseHP: 8,  dmg: 3, attackBonus: 2 },
        { name: 'Pirate Bosun',        type: 'Humanoid',baseHP: 12, dmg: 4, attackBonus: 3 },
        { name: 'Corsair Captain',     type: 'Elite',   baseHP: 20, dmg: 5, attackBonus: 5 },
      ]},

    // ── Assassins & Rogues
    { keywords: [/assassin|shadow.*blade|poisoned.*dagger|contract.killer|silent.*killer/i],
      enemies: [
        { name: 'Spy',                 type: 'Humanoid',baseHP: 8,  dmg: 3, attackBonus: 4 },
        { name: 'Assassin',            type: 'Humanoid',baseHP: 14, dmg: 5, attackBonus: 6 },
        { name: 'Guild Shadowblade',   type: 'Elite',   baseHP: 18, dmg: 6, attackBonus: 6 },
      ]},
  ],

  // ═══════════════════════════════════════════════════════════════
  // MYTHOLOGICAL (4 patterns)
  // ═══════════════════════════════════════════════════════════════
  mythological: [
    // ── Japanese Oni & Yokai
    { keywords: [/oni|yokai|tengu|kappa|jorogumo|gashadokuro|japan.*demon/i],
      enemies: [
        { name: 'Oni',                 type: 'Giant',   baseHP: 22, dmg: 7, attackBonus: 5 },
        { name: 'Tengu',               type: 'Humanoid',baseHP: 12, dmg: 4, attackBonus: 4 },
        { name: 'Jorogumo',            type: 'Fey',     baseHP: 18, dmg: 5, attackBonus: 5 },
        { name: 'Gashadokuro',         type: 'Undead',  baseHP: 28, dmg: 8, attackBonus: 6 },
      ]},

    // ── Djinn & Genies (Hostile)
    { keywords: [/djinn|genie|efreeti|dao|marid|wish.*twisted|bound.*spirit/i],
      enemies: [
        { name: 'Efreeti',             type: 'Elemental',baseHP:26, dmg: 8, attackBonus: 6 },
        { name: 'Dao',                 type: 'Elemental',baseHP:24, dmg: 7, attackBonus: 5 },
        { name: 'Marid',               type: 'Elemental',baseHP:24, dmg: 7, attackBonus: 5 },
        { name: 'Djinn',               type: 'Elemental',baseHP:22, dmg: 6, attackBonus: 5 },
      ]},

    // ── Rakshasa & Tiger Demons
    { keywords: [/rakshasa|tiger.demon|backwards.*hands|noble.*fiend|illusory.*feast/i],
      enemies: [
        { name: 'Rakshasa',            type: 'Fiend',   baseHP: 24, dmg: 7, attackBonus: 6 },
        { name: 'Rakshasa Warrior',    type: 'Elite',   baseHP: 18, dmg: 6, attackBonus: 5 },
      ]},

    // ── Norse & Celtic
    { keywords: [/einherjar|valkyrie.*hostile|draugr|nidhogg|jormungandr|fenrir.spawn/i],
      enemies: [
        { name: 'Draugr Einherjar',    type: 'Undead',  baseHP: 16, dmg: 5, attackBonus: 4 },
        { name: 'Jormungandr Spawn',   type: 'Beast',   baseHP: 22, dmg: 7, attackBonus: 5 },
        { name: 'Nuckelavee',          type: 'Fey',     baseHP: 24, dmg: 7, attackBonus: 5 },
      ]},
  ],

  // ═══════════════════════════════════════════════════════════════
  // SWARMS (2 patterns)
  // ═══════════════════════════════════════════════════════════════
  swarms: [
    // ── Rat & Bat Swarms
    { keywords: [/rat.swarm|bat.swarm|vermin.*flood|rodents.*surge|colony.*attacks/i],
      enemies: [
        { name: 'Rat Swarm',           type: 'Swarm',   baseHP: 5,  dmg: 2, attackBonus: 2 },
        { name: 'Bat Swarm',           type: 'Swarm',   baseHP: 4,  dmg: 2, attackBonus: 2 },
        { name: 'Plague Rat Swarm',    type: 'Swarm',   baseHP: 6,  dmg: 2, attackBonus: 2 },
      ]},

    // ── Scarab & Locust Swarms
    { keywords: [/scarab|locust|beetle.*swarm|insect.*flood|crawling.*darkness/i],
      enemies: [
        { name: 'Scarab Swarm',        type: 'Swarm',   baseHP: 5,  dmg: 3, attackBonus: 2 },
        { name: 'Locust Swarm',        type: 'Swarm',   baseHP: 4,  dmg: 2, attackBonus: 1 },
        { name: 'Flesh Beetle Swarm',  type: 'Swarm',   baseHP: 6,  dmg: 3, attackBonus: 2 },
      ]},
  ],

}; // end SHARED_ENEMY_PATTERNS
