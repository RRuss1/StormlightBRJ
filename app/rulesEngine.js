/**
 * ============================================================
 * app/rulesEngine.js — Official Cosmere RPG Rules Engine
 * Stormlight Chronicles
 * ============================================================
 * Full tabletop → digital rules mapping for:
 *   1.  Stat derivation (defenses, HP, Focus, Investiture)
 *   2.  d20 resolution (advantage / disadvantage / raised stakes)
 *   3.  Plot die (Opportunity / Complication)
 *   4.  Attack resolution (Miss / Graze / Hit / Critical)
 *   5.  Damage types, deflect, and application
 *   6.  Surge attacks and Investiture management
 *   7.  Combat turn order (fast / slow initiative)
 *   8.  Conditions — apply, tick, remove
 *   9.  Injury system and Injury table rolls
 *  10.  Rest & recovery (short / long)
 *
 * All public helpers are exported on window.Rules so any module
 * can call e.g. Rules.resolveAttack(...) without import syntax.
 * ============================================================
 */

/* ─────────────────────────────────────────────────────────────
   1. STAT DERIVATION
   ─────────────────────────────────────────────────────────────
   Source: Chapter 1 (step 8) & Chapter 3
   ───────────────────────────────────────────────────────────── */

/**
 * Derive the three defenses from raw attribute scores.
 * Physical  = 10 + STR + SPD + bonuses
 * Cognitive = 10 + INT + WIL + bonuses
 * Spiritual = 10 + AWA + PRE + bonuses
 */
function calcDefenses(attrs, bonuses = {}) {
  const s = attrs;
  return {
    physDef: 10 + (s.str || 0) + (s.spd || 0) + (bonuses.physDef || 0),
    cogDef:  10 + (s.int || 0) + (s.wil || 0) + (bonuses.cogDef  || 0),
    spirDef: 10 + (s.awa || 0) + (s.pre || 0) + (bonuses.spirDef || 0),
  };
}

/**
 * Derive secondary stats from attributes and level info.
 * HP          = 10 + STR + level bonuses
 * Focus       = 2 + WIL + bonuses
 * Investiture = 2 + max(AWA, PRE)   [Radiants only — 0 otherwise]
 */
function calcSecondaryStats(attrs, level = 1, bonuses = {}, isRadiant = false) {
  const s = attrs;
  // Health grows with level per tier table (Ch.1)
  // Tier 1 (lvl 1-5): base 10+STR, +5/level after 1
  // Simplified: base = 10+STR, per level after 1 = 5 (tier 1 default)
  const hpPerLevel = bonuses.hpPerLevel || 5;
  const maxHp = 10 + (s.str || 0) + Math.max(0, level - 1) * hpPerLevel + (bonuses.maxHp || 0);
  const maxFocus = 2 + (s.wil || 0) + (bonuses.maxFocus || 0);
  const maxInvestiture = isRadiant ? 2 + Math.max(s.awa || 0, s.pre || 0) + (bonuses.maxInvestiture || 0) : 0;

  return { maxHp, maxFocus, maxInvestiture };
}

/**
 * Compute skill modifier for a single skill.
 * modifier = attribute_score + skill_ranks + misc_bonus
 */
function skillModifier(attrs, skillId, skillRanks, miscBonus = 0) {
  // Map skill → governing attribute (matches SKILLS table in gameState.js)
  const SKILL_ATTR = {
    agility: 'spd', athletics: 'str', heavyWeapon: 'str', lightWeapon: 'spd',
    stealth: 'spd', thievery: 'spd', crafting: 'int', deduction: 'int',
    discipline: 'wil', intimidation: 'wil', lore: 'int', medicine: 'int',
    deception: 'pre', insight: 'awa', leadership: 'pre', perception: 'awa',
    persuasion: 'pre', survival: 'awa',
    // Surges
    abrasion: 'spd', adhesion: 'pre', cohesion: 'wil', division: 'int',
    gravitation: 'awa', illumination: 'pre', progression: 'awa',
    tension: 'str', transformation: 'wil', transportation: 'int',
  };
  const attrKey = SKILL_ATTR[skillId] || 'int';
  return (attrs[attrKey] || 0) + (skillRanks || 0) + miscBonus;
}

/* ─────────────────────────────────────────────────────────────
   2. D20 RESOLUTION SYSTEM
   ─────────────────────────────────────────────────────────────
   Source: Chapter 3 — "Making a Skill Test"
   d20 + modifier vs DC
   Advantage: roll 2d20, keep highest
   Disadvantage: roll 2d20, keep lowest
   Multiple advantages/disadvantages cancel; net determines final
   ───────────────────────────────────────────────────────────── */

/** Roll a single d20 */
function d20() { return Math.floor(Math.random() * 20) + 1; }

/** Roll dice — e.g. rollDice(2, 6) = sum of 2d6 */
function rollDice(count, sides) {
  let total = 0;
  for (let i = 0; i < count; i++) total += Math.floor(Math.random() * sides) + 1;
  return total;
}

/** Parse a dice string like "2d6" or "1d8" and roll it */
function parseDice(diceStr) {
  const m = (diceStr || '').match(/^(\d+)d(\d+)$/i);
  if (!m) return 0;
  return rollDice(parseInt(m[1]), parseInt(m[2]));
}

/**
 * Roll a skill test.
 * @param {number} modifier     — skill modifier (attr + ranks + bonuses)
 * @param {number} advantages   — net advantages (positive) or disadvantages (negative)
 * @param {boolean} raiseStakes — if true, also roll a plot die
 * @returns {{roll, modifier, total, plotDie, opportunity, complication, raisedStakes}}
 */
function rollSkillTest(modifier, advantages = 0, raiseStakes = false) {
  let roll;
  if (advantages > 0) {
    // Keep highest of 2d20
    roll = Math.max(d20(), d20());
  } else if (advantages < 0) {
    // Keep lowest of 2d20
    roll = Math.min(d20(), d20());
  } else {
    roll = d20();
  }

  const total = roll + modifier;
  const result = { roll, modifier, total, raisedStakes: raiseStakes, plotDie: null, opportunity: false, complication: false };

  if (raiseStakes) {
    const pd = rollPlotDie();
    result.plotDie = pd;
    result.opportunity = pd.opportunity;
    result.complication = pd.complication;
  }

  return result;
}

/* ─────────────────────────────────────────────────────────────
   3. PLOT DIE (d6 Opportunity / Complication)
   ─────────────────────────────────────────────────────────────
   Source: Chapter 3 — "The Plot Die"
   1-2 = Complication (C)  4-5 = +4 bonus  6 = Opportunity (○)  3 = nothing
   ───────────────────────────────────────────────────────────── */

function rollPlotDie() {
  const roll = Math.floor(Math.random() * 6) + 1;
  return {
    roll,
    complication: roll <= 2,
    bonus:        roll === 4 || roll === 5 ? 4 : 0,
    opportunity:  roll === 6,
    label:        roll <= 2 ? 'Complication' : roll === 6 ? 'Opportunity' : roll >= 4 ? '+4' : '—',
  };
}

/* ─────────────────────────────────────────────────────────────
   4. ATTACK RESOLUTION — Miss / Graze / Hit / Critical
   ─────────────────────────────────────────────────────────────
   Source: Chapter 10 — "Making an Attack"

   Attack test result vs target defense:
   • result < defense - 4   → Miss
   • result = defense - 4 to defense - 1 → Graze (damage dice only, no modifier)
   • result >= defense      → Hit   (damage dice + skill modifier)
   • Opportunity on attack  → Critical (maximize dice + modifier; costs 1 Opportunity)

   Miss with 1 focus → Graze instead (Ch.10)
   ───────────────────────────────────────────────────────────── */

const ATTACK_OUTCOME = { MISS: 'miss', GRAZE: 'graze', HIT: 'hit', CRIT: 'crit' };

/**
 * Resolve an attack.
 * @param {number} attackTotal — total attack test result (d20 + modifier + plotBonus)
 * @param {number} targetDef   — relevant defense (Physical, Cognitive, or Spiritual)
 * @param {boolean} hasOpportunity — whether attacker has an Opportunity to spend for a crit
 * @returns {{outcome, margin}}
 */
function resolveAttackOutcome(attackTotal, targetDef, hasOpportunity = false) {
  const margin = attackTotal - targetDef;
  let outcome;
  if (margin >= 0) {
    outcome = (hasOpportunity) ? ATTACK_OUTCOME.CRIT : ATTACK_OUTCOME.HIT;
  } else if (margin >= -4) {
    outcome = ATTACK_OUTCOME.GRAZE;
  } else {
    outcome = ATTACK_OUTCOME.MISS;
  }
  return { outcome, margin };
}

/**
 * Calculate damage for an attack.
 * @param {string} diceStr     — weapon dice string e.g. "2d8"
 * @param {number} modifier    — attack skill modifier (added on hit/crit, not graze)
 * @param {string} outcome     — 'miss'|'graze'|'hit'|'crit'
 * @param {number} deflect     — target deflect value (applies to energy/impact/keen)
 * @param {string} dmgType     — 'energy'|'impact'|'keen'|'spirit'|'vital'
 * @returns {{raw, deflectApplied, final, dice, mod, isCrit}}
 */
function calcAttackDamage(diceStr, modifier, outcome, deflect = 0, dmgType = 'keen') {
  if (outcome === ATTACK_OUTCOME.MISS) return { raw: 0, deflectApplied: 0, final: 0, dice: 0, mod: 0, isCrit: false };

  const m = (diceStr || '1d4').match(/^(\d+)d(\d+)$/i);
  const count = parseInt(m?.[1] || 1);
  const sides  = parseInt(m?.[2] || 4);
  const isCrit = outcome === ATTACK_OUTCOME.CRIT;

  let dice;
  if (isCrit) {
    // Critical: maximize dice (each die rolls maximum)
    dice = count * sides;
  } else {
    dice = rollDice(count, sides);
  }

  const mod = (outcome === ATTACK_OUTCOME.HIT || isCrit) ? (modifier || 0) : 0;
  const raw = dice + mod;

  // Deflect only applies to energy/impact/keen (not spirit/vital)
  const deflectable = ['energy', 'impact', 'keen'].includes(dmgType);
  const deflectApplied = deflectable ? Math.min(deflect, raw) : 0;
  const final = Math.max(0, raw - deflectApplied);

  return { raw, deflectApplied, final, dice, mod, isCrit };
}

/**
 * Full attack wrapper — wraps rollSkillTest + resolveAttackOutcome + calcAttackDamage.
 * @param {object} attacker  — { attrs, skillRanks, weapon: { dmg, dmgType, skill }, advantages, focus }
 * @param {object} defender  — { physDef, cogDef, spirDef, deflect }
 * @param {boolean} raiseStakes
 * @returns {object} full attack result
 */
function resolveAttack(attacker, defender, raiseStakes = false) {
  const weapon   = attacker.weapon || { dmg: '1d4', dmgType: 'impact', skill: 'athletics' };
  const modifier = skillModifier(attacker.attrs || {}, weapon.skill, attacker.skillRanks?.[weapon.skill] || 0);
  const testResult = rollSkillTest(modifier, attacker.advantages || 0, raiseStakes);

  // Determine target defense — default to Physical for weapon attacks
  const defMap = { physDef: defender.physDef, cogDef: defender.cogDef, spirDef: defender.spirDef };
  const targetDef = defMap[weapon.targetDef || 'physDef'] || defender.physDef || 10;

  const { outcome, margin } = resolveAttackOutcome(
    testResult.total + (testResult.bonus || 0),
    targetDef,
    testResult.opportunity,
  );

  const dmg = calcAttackDamage(weapon.dmg, modifier, outcome, defender.deflect || 0, weapon.dmgType);

  return {
    ...testResult,
    outcome,
    margin,
    weapon: weapon.name || weapon.skill,
    dmgType: weapon.dmgType,
    damage: dmg,
    targetDef,
    canGrazeOnMiss: (attacker.focus || 0) >= 1 && outcome === ATTACK_OUTCOME.MISS,
  };
}

/* ─────────────────────────────────────────────────────────────
   5. SURGE ATTACK RESOLUTION
   ─────────────────────────────────────────────────────────────
   Source: Chapter 6 — "Using Surges"
   Surge skill modifier = attr + surge_ranks
   On hit: add surge modifier to damage
   On miss: spend 1 focus per target to graze instead
   ───────────────────────────────────────────────────────────── */

/**
 * Roll a surge attack.
 * @param {object} caster     — { attrs, surgeRanks: { surgeId: ranks }, investiture }
 * @param {string} surgeId    — e.g. 'division', 'gravitation'
 * @param {object} target     — { physDef, cogDef, spirDef, deflect }
 * @param {number} investiture — Investiture spent for this surge action
 * @param {number} advantages
 * @returns {object} surge attack result
 */
function resolveSurgeAttack(caster, surgeId, target, investiture = 1, advantages = 0) {
  // Surge die scales with rank
  const SURGE_DICE = ['d4', 'd6', 'd8', 'd10', 'd12'];
  const SURGE_ATTRS = {
    abrasion: 'spd', adhesion: 'pre', cohesion: 'wil', division: 'int',
    gravitation: 'awa', illumination: 'pre', progression: 'awa',
    tension: 'str', transformation: 'wil', transportation: 'int',
  };
  const SURGE_DEF = {
    division: 'spirDef', transformation: 'spirDef', transportation: 'cogDef',
    illumination: 'cogDef',
  };

  const ranks = (caster.surgeRanks || {})[surgeId] || 1;
  const attrKey = SURGE_ATTRS[surgeId] || 'awa';
  const surgeModifier = (caster.attrs?.[attrKey] || 0) + ranks;
  const dieSize = parseInt(SURGE_DICE[Math.min(ranks - 1, 4)].slice(1));
  const dmgType = { division: 'spirit', transformation: 'spirit' }[surgeId] || 'impact';
  const targetDefKey = SURGE_DEF[surgeId] || 'physDef';
  const targetDef = target[targetDefKey] || target.physDef || 10;

  const testResult = rollSkillTest(surgeModifier, advantages, false);
  const { outcome, margin } = resolveAttackOutcome(testResult.total, targetDef, testResult.opportunity);

  // Surge base dice: typically 3d4 for Division (rank 1), scales up
  const baseDiceCount = surgeId === 'division' ? 3 : 2;
  const diceStr = `${baseDiceCount}d${dieSize}`;
  const dmg = calcAttackDamage(diceStr, surgeModifier, outcome, target.deflect || 0, dmgType);

  return {
    ...testResult,
    surgeId,
    outcome,
    margin,
    damage: dmg,
    dmgType,
    ranks,
    investitureSpent: investiture,
    targetDef,
  };
}

/* ─────────────────────────────────────────────────────────────
   6. INVESTITURE MANAGEMENT
   ─────────────────────────────────────────────────────────────
   Source: Chapter 5 & 6
   ───────────────────────────────────────────────────────────── */

function spendInvestiture(player, amount) {
  if ((player.investiture || 0) < amount) return false;
  player.investiture = (player.investiture || 0) - amount;
  return true;
}

function regainInvestiture(player) {
  player.investiture = player.maxInvestiture || 0;
}

/** Radiant Enhance action — costs 1 Inv, grants Enhanced[STR+1] and Enhanced[SPD+1] */
function activateEnhance(player) {
  if (!spendInvestiture(player, 1)) return false;
  if (!player.conditions) player.conditions = {};
  player.conditions.enhanced = { str: 1, spd: 1 };
  return true;
}

/** Regenerate (▷) — costs 1 Inv, heals 1d6 + tier */
function activateRegenerate(player, tier = 1) {
  if (!spendInvestiture(player, 1)) return false;
  const heal = rollDice(1, 6) + tier;
  player.hp = Math.min(player.maxHp || 10, (player.hp || 0) + heal);
  return { healed: heal };
}

/* ─────────────────────────────────────────────────────────────
   7. COMBAT TURN ORDER (Fast / Slow Initiative)
   ─────────────────────────────────────────────────────────────
   Source: Chapter 10 — "Turn Order"
   Phase 1: Fast PCs (chose Fast turn: 2 actions)
   Phase 2: Fast NPCs
   Phase 3: Slow PCs (chose Slow turn: 3 actions)
   Phase 4: Slow NPCs

   Characters who are Surprised cannot take a Fast turn and gain
   1 fewer action on their first turn.
   ───────────────────────────────────────────────────────────── */

/**
 * Build the combat turn order from an array of combatants.
 * Each combatant should have: { id, name, isFast, isNPC, isSurprised }
 * Returns ordered array with action budgets attached.
 */
function buildTurnOrder(combatants) {
  const fastPC   = combatants.filter(c => !c.isNPC && c.isFast  && !c.isSurprised);
  const fastNPC  = combatants.filter(c =>  c.isNPC && c.isFast);
  const slowPC   = combatants.filter(c => !c.isNPC && (!c.isFast || c.isSurprised));
  const slowNPC  = combatants.filter(c =>  c.isNPC && !c.isFast);

  return [...fastPC, ...fastNPC, ...slowPC, ...slowNPC].map(c => ({
    ...c,
    actions: c.isFast && !c.isSurprised ? 2 : 3,   // Fast = 2 ▶, Slow = 3 ▶
    reactions: c.isSurprised ? 0 : 1,               // Surprised loses reactions
  }));
}

/** Check if a character can take a Fast turn (Surprised characters cannot) */
function canTakeFastTurn(character) {
  return !hasCondition(character, 'surprised') && !hasCondition(character, 'stunned');
}

/* ─────────────────────────────────────────────────────────────
   8. CONDITIONS — Apply, Tick, Remove
   ─────────────────────────────────────────────────────────────
   Source: Chapter 9 — "Conditions"
   ───────────────────────────────────────────────────────────── */

// These are already defined in gameState.js; mirror here for engine use
function applyCondition(player, condId, value = true) {
  if (!player.conditions) player.conditions = {};
  player.conditions[condId] = value;
}
function removeCondition(player, condId) {
  if (player.conditions) delete player.conditions[condId];
}
function hasCondition(player, condId) {
  return !!(player.conditions && player.conditions[condId]);
}

/**
 * Process end-of-turn condition ticks.
 * Handles: Afflicted damage, Surprised expiry (after their turn)
 * Returns an array of event strings for the combat log.
 */
function tickConditions(player, endOfTurn = true) {
  const events = [];

  // Afflicted — take damage at end of each turn
  if (player.conditions?.afflicted) {
    const afflictions = Array.isArray(player.conditions.afflicted)
      ? player.conditions.afflicted
      : [player.conditions.afflicted];

    for (const aff of afflictions) {
      const dmg = typeof aff === 'object' ? aff.dmg || 0 : aff;
      const dmgType = typeof aff === 'object' ? aff.dmgType || 'vital' : 'vital';
      const deflect = ['energy', 'impact', 'keen'].includes(dmgType) ? (player.deflect || 0) : 0;
      const actual = Math.max(0, dmg - deflect);
      player.hp = Math.max(0, (player.hp || 0) - actual);
      events.push(`${player.name || 'Character'} takes ${actual} ${dmgType} (Afflicted)`);
    }
  }

  // Surprised clears after the character's turn ends
  if (endOfTurn && hasCondition(player, 'surprised')) {
    removeCondition(player, 'surprised');
    events.push(`${player.name || 'Character'} is no longer Surprised`);
  }

  return events;
}

/**
 * Apply damage to a character, triggering unconscious/injury as needed.
 * Returns { taken, unconscious, injuryTriggered }
 */
function applyDamage(player, amount, dmgType = 'keen') {
  const deflect = ['energy', 'impact', 'keen'].includes(dmgType) ? (player.deflect || 0) : 0;
  const taken = Math.max(0, amount - deflect);
  player.hp = (player.hp || 0) - taken;

  let unconscious = false;
  let injuryTriggered = false;

  if (player.hp <= 0) {
    if (!hasCondition(player, 'unconscious')) {
      applyCondition(player, 'unconscious');
      unconscious = true;
      injuryTriggered = true;
    } else {
      // Already unconscious — taking damage causes another injury
      injuryTriggered = true;
    }
    player.hp = 0;
  }

  return { taken, unconscious, injuryTriggered };
}

/* ─────────────────────────────────────────────────────────────
   9. INJURY SYSTEM
   ─────────────────────────────────────────────────────────────
   Source: Chapter 9 — "Injuries"
   Roll d20 + deflect − (5 × existing injuries)
   16+  = Flesh Wound (until long rest)
   6-15 = Shallow Injury (1d6 days)
   1-5  = Vicious Injury (6d6 days)
   −5–0 = Permanent Injury
   −6+  = Death
   ───────────────────────────────────────────────────────────── */

const INJURY_SEVERITY = [
  { min: 16,  name: 'Flesh Wound',       duration: () => 'Until next long rest', perm: false, fatal: false },
  { min: 6,   name: 'Shallow Injury',    duration: () => `${rollDice(1,6)} days`, perm: false, fatal: false },
  { min: 1,   name: 'Vicious Injury',    duration: () => `${rollDice(6,6)} days`, perm: false, fatal: false },
  { min: -5,  name: 'Permanent Injury',  duration: () => 'Permanent (supernatural healing required)', perm: true,  fatal: false },
  { min: -999,name: 'Death',             duration: () => 'Permanent',             perm: true,  fatal: true  },
];

const INJURY_EFFECTS_TABLE = [
  { d8: [1,2], effect: 'exhausted', penalty: 1, label: 'Exhausted [−1] — general stamina loss' },
  { d8: [3],   effect: 'exhausted', penalty: 2, label: 'Exhausted [−2] — severe stamina loss' },
  { d8: [4,5], effect: 'slowed',    penalty: 0, label: 'Slowed — injured leg' },
  { d8: [6],   effect: 'disoriented', penalty: 0, label: 'Disoriented — head injury' },
  { d8: [7],   effect: 'surprised',   penalty: 0, label: 'Surprised — shock from injury' },
  { d8: [8],   effect: 'oneHand',     penalty: 0, label: 'Can only use one hand — injured arm' },
];

/**
 * Roll an injury for a character.
 * isShardblade = true uses Spiritual Injury table instead.
 */
function rollInjury(player, isShardblade = false) {
  const deflect = player.deflect || 0;
  const existingInjuries = (player.injuries || []).length;
  const roll = d20() + deflect - (existingInjuries * 5);

  let severity;
  if (isShardblade) {
    // Spiritual Injury Table (Chapter 7)
    if (roll >= 16)     severity = { name: 'Flesh Wound (Spiritual)',         duration: 'Until long rest', perm: false, fatal: false };
    else if (roll >= 1) severity = { name: 'Permanent Spiritual Injury',       duration: 'Permanent (non-Invested healing blocked)', perm: true, fatal: false };
    else                severity = { name: 'Death',                            duration: 'Permanent', perm: true, fatal: true };
  } else {
    severity = INJURY_SEVERITY.find(s => roll >= s.min) || INJURY_SEVERITY[INJURY_SEVERITY.length - 1];
    severity = { ...severity, duration: severity.duration() };
  }

  // Roll d8 for injury effect
  const d8Roll = Math.floor(Math.random() * 8) + 1;
  const effectRow = INJURY_EFFECTS_TABLE.find(r => r.d8.includes(d8Roll)) || INJURY_EFFECTS_TABLE[0];

  const injury = {
    id: Date.now(),
    roll,
    severity: severity.name,
    duration: severity.duration,
    isPermanent: severity.perm,
    isFatal: severity.fatal,
    effect: effectRow.effect,
    effectPenalty: effectRow.penalty,
    effectLabel: effectRow.label,
    isShardblade,
  };

  if (!player.injuries) player.injuries = [];
  if (!severity.fatal) player.injuries.push(injury);

  // Apply condition from injury
  if (effectRow.effect === 'exhausted') {
    if (!player.conditions) player.conditions = {};
    player.conditions.exhausted = (player.conditions.exhausted || 0) + effectRow.penalty;
  } else if (effectRow.effect !== 'oneHand') {
    applyCondition(player, effectRow.effect);
  } else {
    applyCondition(player, 'oneHand');
  }

  return injury;
}

/* ─────────────────────────────────────────────────────────────
  10. REST & RECOVERY
   ─────────────────────────────────────────────────────────────
   Source: Chapter 9 — "Resting"

   Short Rest (1+ hour, choose one):
   • Roll recovery die + add to HP, Focus, or split
   • Recovery die size = f(WIL) — see getRecoveryDie() in gameState.js

   Long Rest (8+ hours):
   • Restore ALL lost HP and Focus
   • Reduce Exhausted penalty by 1
   • Flesh Wounds heal
   ───────────────────────────────────────────────────────────── */

const RECOVERY_DIE_TABLE = [
  { maxWil: 0,  die: 4  },
  { maxWil: 2,  die: 6  },
  { maxWil: 4,  die: 8  },
  { maxWil: 6,  die: 10 },
  { maxWil: 8,  die: 12 },
  { maxWil: 999,die: 20 },
];

function getRecoveryDieSides(wil) {
  return (RECOVERY_DIE_TABLE.find(r => (wil || 0) <= r.maxWil) || { die: 20 }).die;
}

/**
 * Perform a short rest for a character (choose how to allocate the roll).
 * @param {object} player
 * @param {'hp'|'focus'|'split'} allocation — where to put the recovery roll
 */
function doShortRest(player, allocation = 'hp') {
  const wil = player.stats?.wil || player.attrs?.wil || 0;
  const dieSides = getRecoveryDieSides(wil);
  const roll = rollDice(1, dieSides);

  let hpGained = 0, focusGained = 0;
  if (allocation === 'hp') {
    hpGained = Math.min(roll, (player.maxHp || 10) - (player.hp || 0));
    player.hp = Math.min(player.maxHp || 10, (player.hp || 0) + roll);
  } else if (allocation === 'focus') {
    focusGained = Math.min(roll, (player.maxFocus || 3) - (player.focus || 0));
    player.focus = Math.min(player.maxFocus || 3, (player.focus || 0) + roll);
  } else {
    // Split — half to HP, half to Focus (rounded)
    const half = Math.floor(roll / 2);
    hpGained = Math.min(half, (player.maxHp || 10) - (player.hp || 0));
    focusGained = Math.min(roll - half, (player.maxFocus || 3) - (player.focus || 0));
    player.hp = Math.min(player.maxHp || 10, (player.hp || 0) + half);
    player.focus = Math.min(player.maxFocus || 3, (player.focus || 0) + (roll - half));
  }

  return { dieSize: `1d${dieSides}`, roll, hpGained, focusGained };
}

/**
 * Perform a long rest for a character.
 * Fully restores HP and Focus; reduces Exhausted; heals Flesh Wounds.
 */
function doLongRest(player) {
  const hpRestored = (player.maxHp || 10) - (player.hp || 0);
  const focusRestored = (player.maxFocus || 3) - (player.focus || 0);
  player.hp = player.maxHp || 10;
  player.focus = player.maxFocus || 3;

  // Reduce Exhausted by 1
  if (player.conditions?.exhausted && player.conditions.exhausted > 0) {
    player.conditions.exhausted -= 1;
    if (player.conditions.exhausted <= 0) delete player.conditions.exhausted;
  }

  // Heal Flesh Wounds (duration 'until long rest' or 'Until next long rest')
  if (player.injuries) {
    player.injuries = player.injuries.filter(inj =>
      inj.isPermanent || (!inj.severity.toLowerCase().includes('flesh'))
    );
  }

  // Radiant: if they had a full long rest, they can re-breathe Stormlight before scenes
  if (player.maxInvestiture) {
    player.investiture = player.maxInvestiture;
  }

  return { hpRestored, focusRestored };
}

/* ─────────────────────────────────────────────────────────────
   INITIATIVE / SCENE HELPERS
   ─────────────────────────────────────────────────────────────*/

/**
 * Generate a narrated combat log entry for an attack result.
 */
function narrateAttack(attackerName, defenderName, result) {
  const { outcome, damage, weapon, dmgType } = result;
  const dmgLabels = { energy: 'energy', impact: 'impact', keen: 'keen', spirit: 'spirit', vital: 'vital' };
  const typeLabel = dmgLabels[dmgType] || 'damage';

  switch (outcome) {
    case ATTACK_OUTCOME.MISS:
      return `${attackerName} swings at ${defenderName} but misses entirely.`;
    case ATTACK_OUTCOME.GRAZE:
      return `${attackerName} grazes ${defenderName} for ${damage.final} ${typeLabel} damage (dice only, no modifier).`;
    case ATTACK_OUTCOME.HIT:
      return `${attackerName} hits ${defenderName} for ${damage.final} ${typeLabel} damage.`;
    case ATTACK_OUTCOME.CRIT:
      return `${attackerName} CRITICALLY HITS ${defenderName} for ${damage.final} ${typeLabel} damage! (Maximized dice.)`;
    default:
      return `${attackerName} attacks ${defenderName}.`;
  }
}

/**
 * Compute total modifier from conditions (Exhausted penalties, etc.)
 * Returns a number to add to all test results.
 */
function conditionModifier(player) {
  let mod = 0;
  const conds = player.conditions || {};
  if (conds.exhausted && conds.exhausted > 0) mod -= conds.exhausted;
  if (conds.empowered) mod += 2; // Empowered grants advantage; simplified as +2 for flat tests
  return mod;
}

/**
 * Determine whether a character is at 0 HP and should fall Unconscious.
 */
function checkUnconscious(player) {
  if ((player.hp || 0) <= 0 && !hasCondition(player, 'unconscious')) {
    applyCondition(player, 'unconscious');
    applyCondition(player, 'prone');
    return true;
  }
  return false;
}

/* ─────────────────────────────────────────────────────────────
   GOAL / MILESTONE TRACKING (Chapter 8)
   ─────────────────────────────────────────────────────────────*/

/**
 * Mark a milestone on a goal. Returns true if goal is now complete (3/3).
 */
function markGoalMilestone(goal) {
  if (!goal.milestones) goal.milestones = [false, false, false];
  const next = goal.milestones.indexOf(false);
  if (next === -1) return false; // already complete
  goal.milestones[next] = true;
  return goal.milestones.every(Boolean);
}

/**
 * Check if a Radiant ideal goal is complete (all 3 milestones checked).
 */
function isIdealComplete(goal) {
  return Array.isArray(goal?.milestones) && goal.milestones.every(Boolean);
}

/* ─────────────────────────────────────────────────────────────
   EXPORT — expose everything on window.Rules
   ─────────────────────────────────────────────────────────────*/
window.Rules = {
  // Stat derivation
  calcDefenses,
  calcSecondaryStats,
  skillModifier,

  // Dice
  d20,
  rollDice,
  parseDice,

  // Test system
  rollSkillTest,
  rollPlotDie,

  // Attack resolution
  ATTACK_OUTCOME,
  resolveAttackOutcome,
  calcAttackDamage,
  resolveAttack,
  narrateAttack,

  // Surges
  resolveSurgeAttack,
  spendInvestiture,
  regainInvestiture,
  activateEnhance,
  activateRegenerate,

  // Combat
  buildTurnOrder,
  canTakeFastTurn,

  // Damage / conditions
  applyDamage,
  applyCondition,
  removeCondition,
  hasCondition,
  tickConditions,
  conditionModifier,
  checkUnconscious,

  // Injuries
  rollInjury,

  // Rest
  getRecoveryDieSides,
  doShortRest,
  doLongRest,

  // Goals
  markGoalMilestone,
  isIdealComplete,
};

/* ─────────────────────────────────────────────────────────────
   INTEGRATION HOOKS
   Rules system emits named CustomEvents so UI can react:
   • rules:attack    — { detail: { attacker, defender, result } }
   • rules:injury    — { detail: { player, injury } }
   • rules:unconscious — { detail: { player } }
   • rules:condition — { detail: { player, condId, applied } }
   • rules:rest      — { detail: { player, type, result } }
   ─────────────────────────────────────────────────────────────*/
function emit(name, detail) {
  document.dispatchEvent(new CustomEvent('rules:' + name, { detail, bubbles: false }));
}
window.Rules._emit = emit;
