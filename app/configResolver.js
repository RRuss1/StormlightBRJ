/**
 * ============================================================
 * app/configResolver.js — Universal Config-Driven Rules Facade
 * CYOAhub
 * ============================================================
 * All game mechanics read from window.SystemData.rules instead
 * of hardcoded formulas. This file provides the four required
 * helper functions plus derived stat calculation.
 *
 * Loaded AFTER configDefaults.js, BEFORE gameState.js.
 *
 * Exports on window.ConfigResolver:
 *   resolveStat(statId, character)
 *   calculateDerivedStats(attrs, level, character)
 *   evaluateCondition(condExpr, context)
 *   executeAction(actionDef, actor, target)
 *   calcDefensesFromConfig(attrs, bonuses)
 *   getRecoveryDieFromConfig(statVal)
 *   getMaxMagicPool(attrs, character)
 *   formatCurrency(amount)
 *   getActNames()
 *   hasClassPath(character) — replaces isRadiant check
 *   getCharPaths() — returns the two creation paths from config
 * ============================================================
 */

(function () {
  'use strict';

  // Shorthand for current system data with defaults applied
  function _SD() {
    return window.SystemData || {};
  }
  function _rules() {
    return _SD().rules || (window.ConfigDefaults && window.ConfigDefaults.rules) || {};
  }
  function _cc() {
    return _SD().charCreation || (window.ConfigDefaults && window.ConfigDefaults.charCreation) || {};
  }

  // ═══════════════════════════════════════════════════════════
  // 1. resolveStat — get a stat value with bonuses applied
  // ═══════════════════════════════════════════════════════════
  function resolveStat(statId, character) {
    if (!character || !character.stats) return 0;
    const base = character.stats[statId] || 0;

    // Add condition modifiers
    let mod = 0;
    const conds = character.conditions || {};
    if (conds.enhanced && conds.enhanced[statId]) {
      mod += conds.enhanced[statId];
    }
    if (conds.exhausted && typeof conds.exhausted === 'number') {
      mod -= conds.exhausted; // exhaustion penalizes all stats
    }

    return Math.max(0, base + mod);
  }

  // ═══════════════════════════════════════════════════════════
  // 2. calculateDerivedStats — compute HP, defenses, focus, magic
  // ═══════════════════════════════════════════════════════════
  function calculateDerivedStats(attrs, level, character) {
    const rules = _rules();
    const bonuses = character ? character.bonuses || {} : {};
    level = level || 1;

    // ── Defenses ──
    const defenses = {};
    (rules.defenses || []).forEach((def) => {
      let val = def.base || 10;
      (def.stats || []).forEach((statKey) => {
        val += attrs[statKey] || 0;
      });
      val += bonuses[def.id] || 0;
      // Shardplate / armor bonus
      if (character && character.shardplate && def.id === 'physDef') val += 3;
      defenses[def.id] = val;
    });

    // ── HP ──
    const hpCfg = rules.hp || { base: 10, stat: 'str', perLevel: 5 };
    let maxHp;

    // Formula engine: if hp.formula is a string expression, evaluate it
    if (hpCfg.formula && window.FormulaEngine && window.FormulaEngine.isFormula(hpCfg.formula)) {
      maxHp = window.FormulaEngine.evaluate(hpCfg.formula, { ...attrs, level, base: hpCfg.base || 10 });
    }
    // D&D override: HP from hit dice
    else if (hpCfg.useHitDie && character && character.classId) {
      const cls = (_SD().classes || []).find((c) => c.id === character.classId);
      if (cls && cls.hitDie) {
        const dieSizes = { d6: 6, d8: 8, d10: 10, d12: 12 };
        const die = dieSizes[cls.hitDie] || 8;
        const conMod = hpCfg.abilityModFn ? Math.floor(((attrs[hpCfg.stat] || 10) - 10) / 2) : attrs[hpCfg.stat] || 0;
        maxHp = die + conMod + Math.max(0, level - 1) * (Math.floor(die / 2) + 1 + conMod);
      } else {
        maxHp = hpCfg.base + (attrs[hpCfg.stat] || 0) + Math.max(0, level - 1) * (hpCfg.perLevel || 5);
      }
    }
    // Default: base + stat + perLevel
    else {
      maxHp = (hpCfg.base || 10) + (attrs[hpCfg.stat] || 0) + Math.max(0, level - 1) * (hpCfg.perLevel || 5);
    }
    maxHp += bonuses.maxHp || 0;

    // ── Focus ──
    const focusCfg = rules.focus || { base: 2, stat: 'wil' };
    let maxFocus = focusCfg.base + (attrs[focusCfg.stat] || 0);
    if (focusCfg.abilityModFn) {
      maxFocus = focusCfg.base + Math.floor(((attrs[focusCfg.stat] || 10) - 10) / 2);
    }
    maxFocus += bonuses.maxFocus || 0;

    // ── Magic Pool ──
    const mpCfg = rules.magicPool || {};
    let maxMagicPool = 0;
    if (mpCfg.enabled !== false) {
      const isClassPath = hasClassPath(character);
      if (!mpCfg.classGated || isClassPath) {
        if (mpCfg.formula === 'max') {
          const vals = (mpCfg.stats || []).map((k) => attrs[k] || 0);
          maxMagicPool = (mpCfg.base || 0) + Math.max(0, ...vals);
        } else if (mpCfg.formula === 'sum') {
          const vals = (mpCfg.stats || []).map((k) => attrs[k] || 0);
          maxMagicPool = (mpCfg.base || 0) + vals.reduce((a, b) => a + b, 0);
        } else if (mpCfg.formula === 'spellSlots') {
          // D&D: sum spell slots by level
          const slotTable = mpCfg.slotTable || {};
          const slots = slotTable[Math.min(level, 10)] || [2];
          maxMagicPool = slots.reduce((a, b) => a + b, 0);
        } else {
          maxMagicPool = mpCfg.base || 0;
        }
        maxMagicPool += bonuses.maxMagicPool || 0;
      }
    }

    return {
      ...defenses,
      maxHp,
      maxFocus: Math.max(1, maxFocus),
      maxMagicPool,
      magicPoolLabel: mpCfg.label || 'Magic',
    };
  }

  // ═══════════════════════════════════════════════════════════
  // 3. evaluateCondition — evaluate a condition expression
  // ═══════════════════════════════════════════════════════════
  /**
   * Evaluate a simple condition against a context.
   * Supports:
   *   'stat:str >= 3'    — stat check
   *   'has:classPath'    — boolean flag
   *   'flag:someFlag'    — gState flag check
   *   'hp < 50%'         — HP threshold
   *   true / false       — literal
   *
   * @param {string|boolean} condExpr
   * @param {object} context — { character, gState, target }
   * @returns {boolean}
   */
  function evaluateCondition(condExpr, context) {
    if (condExpr === true || condExpr === 'true') return true;
    if (condExpr === false || condExpr === 'false' || !condExpr) return false;
    if (typeof condExpr !== 'string') return !!condExpr;

    const char = context.character || context.actor || {};
    const gs = context.gState || (typeof gState !== 'undefined' ? gState : {});

    // stat:key op value
    const statMatch = condExpr.match(/^stat:(\w+)\s*(>=|<=|>|<|==|!=)\s*(\d+)$/);
    if (statMatch) {
      const val = resolveStat(statMatch[1], char);
      const target = parseInt(statMatch[3]);
      switch (statMatch[2]) {
        case '>=':
          return val >= target;
        case '<=':
          return val <= target;
        case '>':
          return val > target;
        case '<':
          return val < target;
        case '==':
          return val === target;
        case '!=':
          return val !== target;
      }
    }

    // has:flag
    if (condExpr.startsWith('has:')) {
      const flag = condExpr.slice(4);
      if (flag === 'classPath') return hasClassPath(char);
      if (flag === 'backgroundPath') return !hasClassPath(char);
      return !!char[flag];
    }

    // flag:name
    if (condExpr.startsWith('flag:')) {
      return !!gs[condExpr.slice(5)];
    }

    // hp < X%
    const hpMatch = condExpr.match(/^hp\s*(<|>|<=|>=)\s*(\d+)%$/);
    if (hpMatch) {
      const pct = ((char.hp || 0) / (char.maxHp || 1)) * 100;
      const target = parseInt(hpMatch[2]);
      switch (hpMatch[1]) {
        case '<':
          return pct < target;
        case '>':
          return pct > target;
        case '<=':
          return pct <= target;
        case '>=':
          return pct >= target;
      }
    }

    return false;
  }

  // ═══════════════════════════════════════════════════════════
  // 4. executeAction — resolve an action from config
  // ═══════════════════════════════════════════════════════════
  /**
   * Execute a combat or story action defined in config.
   * @param {object} actionDef — from combatActions or storyActions
   * @param {object} actor     — the acting character
   * @param {object} target    — the target (enemy or player)
   * @returns {object} result — { success, damage, healing, narrative, cost }
   */
  function executeAction(actionDef, actor, target) {
    if (!actionDef) return { success: false, narrative: 'No action defined.' };

    const result = { success: true, damage: 0, healing: 0, narrative: '', cost: null };

    // Check cost
    if (actionDef.cost) {
      const [resource, amount] = actionDef.cost.split(':');
      const costAmt = parseInt(amount) || 1;
      if (resource === 'magicPool' || resource === 'investiture') {
        if ((actor.investiture || 0) < costAmt) {
          result.success = false;
          result.narrative = `Not enough ${_rules().magicPool?.label || 'magic'} (need ${costAmt}).`;
          return result;
        }
        result.cost = { resource, amount: costAmt };
      } else if (resource === 'focus') {
        if ((actor.focus || 0) < costAmt) {
          result.success = false;
          result.narrative = 'Not enough Focus.';
          return result;
        }
        result.cost = { resource, amount: costAmt };
      }
    }

    // Check conditions
    if (actionDef.conditions) {
      for (const cond of Array.isArray(actionDef.conditions) ? actionDef.conditions : [actionDef.conditions]) {
        if (!evaluateCondition(cond, { character: actor })) {
          result.success = false;
          result.narrative = 'Conditions not met.';
          return result;
        }
      }
    }

    return result;
  }

  // ═══════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════

  /**
   * Calculate defenses from config — replacement for hardcoded calcDefenses.
   */
  function calcDefensesFromConfig(attrs, bonuses) {
    const rules = _rules();
    const result = {};
    (rules.defenses || []).forEach((def) => {
      let val = def.base || 10;
      (def.stats || []).forEach((statKey) => {
        val += attrs[statKey] || 0;
      });
      val += (bonuses && bonuses[def.id]) || 0;
      result[def.id] = val;
    });
    return result;
  }

  /**
   * Get recovery die size from config.
   */
  function getRecoveryDieFromConfig(statVal) {
    const rules = _rules();
    const rdCfg = rules.recoveryDie || {};
    const table = rdCfg.table || [{ maxStat: 999, die: 6 }];
    const entry = table.find((r) => (statVal || 0) <= r.maxStat) || table[table.length - 1];
    return entry.die || 6;
  }

  /**
   * Get max magic pool for a character.
   */
  function getMaxMagicPool(attrs, character) {
    const derived = calculateDerivedStats(attrs, character ? character.level : 1, character);
    return derived.maxMagicPool;
  }

  /**
   * Format currency from config.
   */
  function formatCurrency(amount) {
    const rules = _rules();
    const curr = rules.currency || {};
    const symbol = curr.symbol || 'mk';
    if (curr.tiers && amount >= 200) {
      return Math.floor(amount / 4) + 'b ' + Math.round(amount % 4) + 'm';
    }
    return amount + symbol;
  }

  /**
   * Get act name templates from config.
   */
  function getActNames() {
    const cc = _cc();
    return cc.actNames || ['The {loc}', 'Secrets of {loc}', 'The Storm over {loc}'];
  }

  /**
   * Check if character is on the "class" path (replaces isRadiant).
   * This is the universal replacement for the hardcoded isRadiant check.
   * Returns true if the character was created via the class/order path.
   */
  function hasClassPath(character) {
    if (!character) return false;
    // Explicit flag from creation
    if (character.isRadiant === true) return true;
    if (character.isRadiant === false) return false;
    // Infer from character data
    if (character.surges && character.surges.length > 0) return true;
    if (character.roleId || character.keyTalent) return false;
    // Default: class path if classId exists in CLASSES
    if (character.classId) {
      const classes = _SD().classes || [];
      return classes.some((c) => c.id === character.classId);
    }
    return false;
  }

  /**
   * Get the two character creation paths from config.
   * Returns { classpath, bgpath } with labels, icons, sublabels.
   */
  function getCharPaths() {
    const cc = _cc();
    const paths = cc.paths || window.ConfigDefaults.charCreation.paths;
    return {
      classpath: paths[0] || { id: 'class', label: 'Class', icon: '⚔', desc: '', sublabel: '' },
      bgpath: paths[1] || { id: 'background', label: 'Background', icon: '✦', desc: '', sublabel: '' },
    };
  }

  /**
   * Get the skill → attribute map from config.
   */
  function getSkillAttrMap() {
    const rules = _rules();
    const base = rules.skillAttrMap || {};
    // Also add surge attrs from system surges
    const surges = _SD().surges || [];
    surges.forEach((s) => {
      if (s.id && s.attr) base[s.id] = s.attr;
    });
    return base;
  }

  /**
   * Check if a damage type is deflectable.
   */
  function isDeflectable(dmgType) {
    const rules = _rules();
    return (rules.deflectableTypes || ['energy', 'impact', 'keen']).includes(dmgType);
  }

  /**
   * Get healing multiplier for a class.
   */
  function getHealMultiplier(classId) {
    const rules = _rules();
    return (rules.healClassMultipliers || {})[classId] || 1.0;
  }

  /**
   * Get equipment drop config.
   */
  function getEquipDropConfig() {
    const rules = _rules();
    return rules.equipmentDrops || window.ConfigDefaults.rules.equipmentDrops;
  }

  /**
   * Get magic pool label for UI.
   */
  function getMagicPoolLabel() {
    const rules = _rules();
    return (rules.magicPool && rules.magicPool.label) || 'Magic';
  }

  /**
   * Get the character creation config.
   */
  function getCharCreation() {
    return _cc();
  }

  /**
   * Get start message with location substituted.
   */
  function getStartMessage(location) {
    const cc = _cc();
    const tmpl = cc.startMessage || 'The adventure begins in {location}.';
    return tmpl.replace('{location}', location || 'the world');
  }

  // ═══════════════════════════════════════════════════════════
  // STAT GENERATION
  // ═══════════════════════════════════════════════════════════

  function _rollD(sides) {
    return Math.floor(Math.random() * sides) + 1;
  }

  /**
   * Roll a single stat value using the configured generation method.
   * @returns {number} the generated stat value
   */
  function rollSingleStat(method) {
    method = method || getStatGenMethod();
    switch (method) {
      case '4d6drop1': {
        const dice = [_rollD(6), _rollD(6), _rollD(6), _rollD(6)];
        dice.sort((a, b) => a - b);
        return dice[1] + dice[2] + dice[3]; // drop lowest
      }
      case '1d20':
        return _rollD(20);
      case '2d6plus6':
        return _rollD(6) + _rollD(6) + 6;
      case '3d8':
        return _rollD(8) + _rollD(8) + _rollD(8);
      case 'manual':
        return 10; // default starting value for manual assignment
      case 'pointbuy':
        return 2; // default allocation (distributed by point-buy UI)
      case 'none':
        return 0;
      default:
        return 2; // fallback to point-buy default
    }
  }

  /**
   * Generate a full stat array for all stat keys.
   */
  function rollAllStats(method) {
    method = method || getStatGenMethod();
    const keys = (_SD().statKeys || ['str', 'dex', 'con', 'int', 'wis', 'cha']);
    const stats = {};
    keys.forEach((k) => {
      stats[k] = rollSingleStat(method);
    });
    return stats;
  }

  /**
   * Get the stat generation method from config.
   */
  function getStatGenMethod() {
    return (_rules().statGenMethod) || (_SD().statGenMethod) || 'pointbuy';
  }

  /**
   * Get stat generation metadata (range, average, isRolled, etc.)
   */
  function getStatGenInfo(method) {
    method = method || getStatGenMethod();
    const info = {
      '4d6drop1': { min: 3, max: 18, avg: 12.2, isRolled: true, label: '4d6 Drop Lowest', maxPerStat: 18 },
      '1d20':     { min: 1, max: 20, avg: 10.5, isRolled: true, label: '1d20', maxPerStat: 20 },
      '2d6plus6': { min: 8, max: 18, avg: 13,   isRolled: true, label: '2d6+6', maxPerStat: 18 },
      '3d8':      { min: 3, max: 24, avg: 13.5, isRolled: true, label: '3d8', maxPerStat: 24 },
      'pointbuy': { min: 0, max: 20, avg: null,  isRolled: false, label: 'Point Buy', maxPerStat: 20 },
      'manual':   { min: 0, max: 20, avg: null,  isRolled: false, label: 'Manual', maxPerStat: 20 },
      'none':     { min: 0, max: 0,  avg: 0,     isRolled: false, label: 'No Stats', maxPerStat: 0 },
    };
    return info[method] || info['pointbuy'];
  }

  /**
   * Get the expected average stat value for enemy scaling.
   */
  function getExpectedAvgStat(method) {
    const info = getStatGenInfo(method);
    if (info.avg != null) return info.avg;
    // Point buy: assume even distribution of attributePoints across stats
    const cc = _cc();
    const keys = (_SD().statKeys || []);
    const pts = cc.attributePoints || 12;
    return keys.length ? pts / keys.length : 2;
  }

  // ═══════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════
  window.ConfigResolver = {
    resolveStat,
    calculateDerivedStats,
    evaluateCondition,
    executeAction,
    calcDefensesFromConfig,
    getRecoveryDieFromConfig,
    getMaxMagicPool,
    formatCurrency,
    getActNames,
    hasClassPath,
    getCharPaths,
    getSkillAttrMap,
    isDeflectable,
    getHealMultiplier,
    getEquipDropConfig,
    getMagicPoolLabel,
    getCharCreation,
    getStartMessage,
    rollSingleStat,
    rollAllStats,
    getStatGenMethod,
    getStatGenInfo,
    getExpectedAvgStat,
  };
})();
