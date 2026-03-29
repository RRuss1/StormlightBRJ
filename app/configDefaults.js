/**
 * ============================================================
 * app/configDefaults.js — Default World Config & Fallback System
 * CYOAhub
 * ============================================================
 * Provides a complete default config template so systems only
 * define what they differ on. Every access to SystemData goes
 * through resolveWithDefaults() to guarantee no missing fields.
 *
 * Loaded BEFORE gameState.js and rulesEngine.js.
 * ============================================================
 */

window.ConfigDefaults = {
  // ── Default rules block — Cosmere-flavored baseline ────────
  rules: {
    // Defense computation: array of {id, label, base, stats[]}
    defenses: [
      { id: 'physDef', label: 'Physical Defense', base: 10, stats: ['str', 'spd'] },
      { id: 'cogDef', label: 'Cognitive Defense', base: 10, stats: ['int', 'wil'] },
      { id: 'spirDef', label: 'Spiritual Defense', base: 10, stats: ['awa', 'pre'] },
    ],

    // HP formula: base + stat + perLevel * (level - 1)
    hp: { base: 10, stat: 'str', perLevel: 5 },

    // Focus / concentration pool
    focus: { base: 2, stat: 'wil' },

    // Magic resource pool (Investiture / Spell Slots / Obsession)
    magicPool: {
      enabled: true,
      label: 'Investiture',
      formula: 'max', // 'max' = base + max(stat1, stat2), 'sum' = sum array, 'flat' = base only
      base: 2,
      stats: ['awa', 'pre'], // which stats contribute
      classGated: true, // only class-path characters get this
    },

    // Recovery die table: [{maxStat, die}]
    recoveryDie: {
      stat: 'wil',
      table: [
        { maxStat: 0, die: 4 },
        { maxStat: 2, die: 6 },
        { maxStat: 4, die: 8 },
        { maxStat: 6, die: 10 },
        { maxStat: 8, die: 12 },
        { maxStat: 999, die: 20 },
      ],
    },

    // Skill → attribute mapping
    skillAttrMap: {
      agility: 'spd',
      athletics: 'str',
      heavyWeapon: 'str',
      lightWeapon: 'spd',
      stealth: 'spd',
      thievery: 'spd',
      crafting: 'int',
      deduction: 'int',
      discipline: 'wil',
      intimidation: 'wil',
      lore: 'int',
      medicine: 'int',
      deception: 'pre',
      insight: 'awa',
      leadership: 'pre',
      perception: 'awa',
      persuasion: 'pre',
      survival: 'awa',
    },

    // Damage types that deflect blocks
    deflectableTypes: ['energy', 'impact', 'keen'],

    // Currency display
    currency: { name: 'marks', symbol: 'mk', tiers: null },

    // Progression system
    progressionType: 'oaths', // 'oaths' | 'levels' | 'corruption' | 'milestones'
    progressionLabel: 'Oath',
    maxProgression: 5,

    // Combat turn structure
    turnOrder: 'fast-slow', // 'fast-slow' | 'initiative' | 'round-robin'

    // Damage scaling per outcome
    damageScale: {
      miss: 0,
      graze: 'dice',
      hit: 'dice+mod',
      crit: 'max+mod',
    },

    // Stat generation method for character creation
    // 4d6drop1, 1d20, 2d6plus6, 3d8, pointbuy, manual, none
    statGenMethod: 'pointbuy',

    // Healing class overrides: { classId: multiplier }
    healClassMultipliers: {},

    // Equipment drop system
    equipmentDrops: {
      enabled: true,
      fragmentName: 'fragment',
      craftCost: 3,
      upgradeCost: 5,
      legendaryName: 'Shardblade',
      armorName: 'Shardplate',
    },
  },

  // ── Default character creation config ──────────────────────
  charCreation: {
    // The two creation paths
    paths: [
      { id: 'class', label: 'Class', icon: '⚔', sublabel: 'Primary path · Abilities · Progression', desc: '"Choose your combat role."' },
      {
        id: 'background',
        label: 'Background',
        icon: '✦',
        sublabel: 'Skills · Talent · Starting gear',
        desc: '"Your past defines your skills."',
      },
    ],

    // Dynamic labels
    classLabel: 'Class',
    backgroundLabel: 'Background',
    classHeading: 'Your Class',
    backgroundHeading: 'Your Background',
    classFlavor: 'Choose carefully.',
    backgroundFlavor: 'What shaped you?',
    ancestryLabel: 'Ancestry',
    partyLabel: 'Adventuring Party',

    // Submission button text per path
    submitText: { class: 'Create Character →', background: 'Create Character →' },

    // Origins — null hides the section, array renders buttons
    origins: null,

    // Character creation start message template ({location} gets replaced)
    startMessage: 'The party forms. The adventure begins in {location}.',

    // Act name templates ({loc} gets replaced)
    actNames: ['The {loc}', 'Secrets of {loc}', 'The Storm over {loc}'],

    // Point buy config
    attributePoints: 12,
    maxPerAttribute: 3,

    // Feature toggles
    showBlade: false,
    showWeapon: true,
    showCompanion: false,

    // Name input placeholder
    namePlaceholder: 'What do they call you?',
  },

  // ── Default combat actions ─────────────────────────────────
  combatActions: [
    { id: 'attack', tag: 'ATTACK', label: 'Attack', icon: '⚔', cost: null },
    { id: 'defend', tag: 'DEFEND', label: 'Defend', icon: '🛡', cost: null },
    { id: 'heal', tag: 'HEAL', label: 'Heal', icon: '✦', cost: null },
    { id: 'surge', tag: 'SURGE', label: 'Ability', icon: '◈', cost: 'magicPool:1' },
  ],

  // ── Default story action tags ──────────────────────────────
  storyActions: [
    { id: 'combat', tag: 'COMBAT', label: 'Combat' },
    { id: 'discovery', tag: 'DISCOVERY', label: 'Discovery' },
    { id: 'decision', tag: 'DECISION', label: 'Decision' },
    { id: 'magic', tag: 'MAGIC', label: 'Magic' },
  ],
};

/**
 * Deep-merge a system's config with defaults.
 * System values always win over defaults.
 */
window.resolveWithDefaults = function (systemData) {
  if (!systemData) return { ...window.ConfigDefaults };

  const defaults = window.ConfigDefaults;

  // Deep merge helper — only merges plain objects, arrays are replaced
  function deepMerge(target, source) {
    const out = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] === undefined) continue;
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key]) &&
        target[key] &&
        typeof target[key] === 'object' &&
        !Array.isArray(target[key])
      ) {
        out[key] = deepMerge(target[key], source[key]);
      } else {
        out[key] = source[key];
      }
    }
    return out;
  }

  // Merge rules block
  if (!systemData.rules) systemData.rules = {};
  systemData.rules = deepMerge(defaults.rules, systemData.rules);

  // Merge charCreation block
  if (!systemData.charCreation) systemData.charCreation = {};
  systemData.charCreation = deepMerge(defaults.charCreation, systemData.charCreation);

  // Merge combatActions
  if (!systemData.combatActions) systemData.combatActions = defaults.combatActions;

  // Merge storyActions
  if (!systemData.storyActions) systemData.storyActions = defaults.storyActions;

  return systemData;
};
