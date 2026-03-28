/**
 * ============================================================
 * app/gameState.js — Game Constants, Data Tables & State
 * CYOAhub (formerly Stormlight Chronicles)
 * ============================================================
 * Contains:
 *   - System loader + data aliases (from app/systems/*.js)
 *   - Game mechanic functions (recovery, injury, combat math)
 *   - Global mutable state variables
 *   - Sheet auth config (SA key)
 * ============================================================
 */

// ── ENV CONFIG ────────────────────────────────────────────────
// These are read at startup. Override via env.js or window.CYOA_CONFIG.
const PROXY_URL = window.CYOA_CONFIG?.apiUrl   || 'https://cyoahub-proxy.rruss7997.workers.dev';
const WS_URL    = window.CYOA_CONFIG?.wsUrl    || 'wss://cyoahub-proxy.rruss7997.workers.dev/session';

// ══ SYSTEM LOADER + DATA ALIASES ══
// No default system loaded at startup — loadSystem() must be called
window.SystemData = null;
function loadSystem(systemId) {
  const systems = {
    stormlight:   window.StormlightSystem,
    dnd5e:        window.DnD5eSystem,
    wretcheddeep: window.WretchedDeepSystem,
  };
  let sys;
  // Custom worlds built via wizard
  if (systemId && systemId.startsWith('custom-') && window.CustomSystem) {
    const cfg = window._pendingWorldConfig || {};
    sys = window.CustomSystem.build(cfg);
  } else {
    sys = systems[systemId];
  }
  if (!sys) { console.error('Unknown system:', systemId); return window.SystemData; }

  // Apply defaults so every config field is guaranteed present
  if (window.resolveWithDefaults) window.resolveWithDefaults(sys);

  // Validate config and auto-repair
  if (window.ConfigValidator) window.ConfigValidator.validate(sys);

  // Apply plugins (crafting, factions, etc.)
  if (window.PluginRegistry) window.PluginRegistry.applyPlugins(sys);

  window.SystemData = sys;

  // Rebuild ACTS from loaded system
  if (sys.baseActs && sys.baseActs.length) {
    ACTS = sys.baseActs.map(a => ({ ...a, name: a.tag, location: (sys.gmContext || {}).worldName || 'the world' }));
  }

  // Apply theme to body
  document.body.setAttribute('data-system', sys.id);
  if (sys.theme) {
    const r = document.documentElement.style;
    if (sys.theme.primary)   r.setProperty('--theme-primary', sys.theme.primary);
    if (sys.theme.secondary) r.setProperty('--theme-secondary', sys.theme.secondary);
    if (sys.theme.danger)    r.setProperty('--theme-danger', sys.theme.danger);
  }

  // Apply full themeVars if present
  if (sys.themeVars) {
    const r = document.documentElement.style;
    for (const [key, val] of Object.entries(sys.themeVars)) {
      if (val) r.setProperty('--' + key.replace(/([A-Z])/g, '-$1').toLowerCase(), val);
    }
  }

  // Dev mode notification
  if (window.DevMode) window.DevMode.onSystemLoad(sys);

  return sys;
}

// ── LIVE DATA ALIASES ──────────────────────────────────────
// These read from window.SystemData dynamically so they auto-swap
// when loadSystem() changes the active world. Every reference to
// CLASSES, NPC_M, etc. now reads from the CURRENT system, not the
// one loaded at startup.
// Usage: CLASSES (getter) — no code changes needed downstream.
function _SD() { return window.SystemData || window.StormlightSystem || {}; }

Object.defineProperties(window, {
  // Character data
  CLASSES:       { get(){ return _SD().classes       || []; }},
  SPREN_BONDS:   { get(){ return _SD().sprenBonds    || {}; }},
  HERO_ROLES:    { get(){ return _SD().heroRoles     || []; }},
  HERO_WEAPONS:  { get(){ return _SD().heroWeapons   || []; }},
  ANCESTRIES:    { get(){ return _SD().ancestries    || []; }},
  CULTURES:      { get(){ return _SD().cultures      || []; }},
  SINGER_FORMS:  { get(){ return _SD().singerForms   || {}; }},
  STARTING_KITS: { get(){ return _SD().startingKits  || []; }},
  // Stats & skills
  STAT_KEYS:     { get(){ return _SD().statKeys      || []; }},
  STAT_NAMES:    { get(){ return _SD().statNames     || []; }},
  STAT_FULL:     { get(){ return _SD().statFull      || []; }},
  SKILLS:        { get(){ return _SD().skills        || []; }},
  PATH_SKILLS:   { get(){ return _SD().pathSkills    || {}; }},
  // Combat
  SURGES:        { get(){ return _SD().surges        || []; }},
  SURGE_SCALE:   { get(){ return _SD().surgeScale    || []; }},
  ORDER_SURGES:  { get(){ return _SD().orderSurges   || {}; }},
  CONDITIONS:    { get(){ return _SD().conditions    || {}; }},
  INJURY_EFFECTS:{ get(){ return _SD().injuryEffects || []; }},
  WEAPONS:       { get(){ return _SD().weapons       || {}; }},
  ARMORS:        { get(){ return _SD().armors        || {}; }},
  ADVERSARY_ROLES:{ get(){ return _SD().adversaryRoles|| {}; }},
  COMBAT_OPPS:   { get(){ return _SD().combatOpps    || []; }},
  COMBAT_COMPS:  { get(){ return _SD().combatComps   || []; }},
  // NPC
  NPC_M:         { get(){ return _SD().npcMale       || []; }},
  NPC_F:         { get(){ return _SD().npcFemale     || []; }},
  NPC_ALL:       { get(){ return [...(_SD().npcMale||[]), ...(_SD().npcFemale||[])]; }},
  COLORS:        { get(){ return _SD().colors        || []; }},
  NPC_COLORS:    { get(){ return _SD().npcColors     || []; }},
  // Lore & flavor
  SPREN_APPEARANCES:{ get(){ return _SD().sprenAppearances || {}; }},
  PURPOSES:      { get(){ return _SD().purposes      || []; }},
  OBSTACLES:     { get(){ return _SD().obstacles     || []; }},
  GEMSTONES:     { get(){ return _SD().gemstones     || {}; }},
  HOID_LINES:    { get(){ return _SD().hoidLines     || []; }},
  // World — generic aliases (ROSHAR_* kept for backward compat)
  LOCATIONS:     { get(){ return _SD().locations             || []; }},
  LOCATIONS_ALT: { get(){ return _SD().offworldLocations     || []; }},
  LOCATIONS_SUB: { get(){ return _SD().shadesmarLocations    || []; }},
  LOCATIONS_LEG: { get(){ return _SD().legendaryLocations    || []; }},
  ROSHAR_P:      { get(){ return _SD().locations             || []; }},
  ROSHAR_O:      { get(){ return _SD().offworldLocations     || []; }},
  ROSHAR_S:      { get(){ return _SD().shadesmarLocations    || []; }},
  ROSHAR_L:      { get(){ return _SD().legendaryLocations    || []; }},
  ALL_LOCS:      { get(){ return [...(_SD().locations||[]), ...(_SD().offworldLocations||[]), ...(_SD().shadesmarLocations||[]), ...(_SD().legendaryLocations||[])]; }},
  BASE_ACTS:     { get(){ return _SD().baseActs      || []; }},
  BLADE_TIERS:   { get(){ return _SD().bladeTiers    || []; }},
  BLADE_NAMES:   { get(){ return _SD().bladeNames    || {}; }},
  WEAPON_PREFIXES:{ get(){ return _SD().weaponPrefixes|| []; }},
  WEAPON_SUFFIXES:{ get(){ return _SD().weaponSuffixes|| []; }},
  // Progression
  ORDER_OATHS:   { get(){ return _SD().orderOaths    || {}; }},
  OATH_BONUSES:  { get(){ return _SD().oathBonuses   || {}; }},
  ADVANCEMENT:   { get(){ return _SD().advancement   || {}; }},
  ORDER_IDEALS:  { get(){ return _SD().orderIdeals   || {}; }},
});

// ══ NON-DATA CONSTANTS (game engine config) ══
// Config-driven — reads from charCreation on access
function _getAttrPoints() { return (_SD().charCreation && _SD().charCreation.attributePoints) || 12; }
function _getAttrMax() { return (_SD().charCreation && _SD().charCreation.maxPerAttribute) || 3; }
// Legacy constants kept for backward compat (read dynamically)
Object.defineProperty(window, 'ATTR_POINTS_START', { get: _getAttrPoints });
Object.defineProperty(window, 'ATTR_MAX_CREATE', { get: _getAttrMax });
const DC={EASY:10, MEDIUM:15, HARD:20, VERY_HARD:25, NEARLY_IMPOSSIBLE:30};
const COMBAT_BEATS_MIN=3, COMBAT_BEATS_MAX=8;

// ══════════════════════════════════════════════════════════
// FUNCTIONS (game mechanics — NOT extracted to system file)
// ══════════════════════════════════════════════════════════

// ══ RECOVERY DIE (WIL-based, Official) ══
function getRecoveryDie(wil){
  if(window.ConfigResolver){
    const die=window.ConfigResolver.getRecoveryDieFromConfig(wil);
    return '1d'+die;
  }
  if(wil<=0)return'1d4';
  if(wil<=2)return'1d6';
  if(wil<=4)return'1d8';
  if(wil<=6)return'1d10';
  if(wil<=8)return'1d12';
  return'1d20';
}
function rollRecoveryDie(wil){
  const sides={d4:4,d6:6,d8:8,d10:10,d12:12,d20:20};
  const die=getRecoveryDie(wil);
  return Math.ceil(Math.random()*(sides[die.slice(1)]||4));
}

// ══ INVESTITURE / MAGIC POOL (config-driven) ══
function getMaxInvestiture(stats, character){
  if(window.ConfigResolver){
    return window.ConfigResolver.getMaxMagicPool(stats, character||{isRadiant:true,stats});
  }
  const awa=stats&&stats.awa||0;
  const pre=stats&&stats.pre||0;
  return 2+Math.max(awa,pre);
}

// ══ DEFLECT (reduces energy/impact/keen damage — NOT spirit/vital) ══
// deflect value stored on character; 0 = no armor
function applyDeflect(dmg, dmgType, deflect){
  const isDefl = window.ConfigResolver
    ? window.ConfigResolver.isDeflectable(dmgType)
    : ['energy','impact','keen'].includes(dmgType);
  if(isDefl&&deflect>0){
    return Math.max(0,dmg-deflect);
  }
  return dmg;
}

// Apply a condition to a player object
function applyCondition(player, condId, value=true){
  if(!player.conditions)player.conditions={};
  player.conditions[condId]=value;
  return player;
}
function removeCondition(player, condId){
  if(player.conditions)delete player.conditions[condId];
  return player;
}
function hasCondition(player, condId){
  return !!(player.conditions&&player.conditions[condId]);
}

// ══ INJURY SYSTEM — delegates to Rules.rollInjury (rulesEngine.js) ══
// Kept as global for backward compat — actual logic in rulesEngine.js

// ══ CURRENCY ══
function formatMarks(mk){
  if (window.ConfigResolver) return window.ConfigResolver.formatCurrency(mk);
  if(!mk||mk<1)return mk+'mk';
  if(mk>=200)return Math.floor(mk/4)+'b '+Math.round(mk%4)+'m';
  return mk+'mk';
}

// Threat calculation for combat difficulty
function combatThreat(enemies){
  return enemies.reduce((t,e)=>{
    const role=ADVERSARY_ROLES[e.role||'rival'];
    const tierDiff=(e.tier||1)-(e.partyTier||1);
    const tierMults=[4,2,1,0.5,0.25,0];
    const mult=tierMults[Math.min(Math.max(tierDiff+2,0),5)];
    return t+(role.threat||1)*mult;
  },0);
}

// Get suggested combat difficulty label
function combatDifficulty(threat, numPlayers){
  const ratio=threat/numPlayers;
  if(ratio<=0.5)return'Easy';
  if(ratio<=1)return'Average';
  if(ratio<=1.5)return'Hard';
  return'Very Hard';
}

// ══ SHORT REST mechanic (Official Chapter 9) ══
function doShortRest(player){
  const wil=player.stats&&player.stats.wil||0;
  const die=rollRecoveryDie(wil);
  const recovered=Math.min(die, (player.maxHp||10)-player.hp);
  player.hp=Math.min(player.maxHp||10, player.hp+recovered);
  // Also recover some focus
  const focusRec=Math.min(1,player.maxFocus-(player.focus||0));
  player.focus=Math.min(player.maxFocus||3,(player.focus||0)+focusRec);
  return{die:getRecoveryDie(wil),roll:die,hpRecovered:recovered,focusRecovered:focusRec};
}

// Get damage type label for combat log
function dmgTypeLabel(dmgType){
  const labels={energy:'⚡ energy',impact:'💢 impact',keen:'🗡 keen',spirit:'👁 spirit',vital:'☠ vital'};
  return labels[dmgType]||dmgType||'damage';
}

// Get surge die roll for a character
function rollSurgeDie(ranks){
  const sides=[4,6,8,10,12];
  const die=sides[Math.min(ranks-1,4)]||4;
  return Math.ceil(Math.random()*die);
}

// Derived variable — rebuilt when system loads
let ACTS=(typeof BASE_ACTS!=='undefined'&&BASE_ACTS.length)?BASE_ACTS.map(a=>({...a,name:a.tag,location:(_SD().gmContext||{}).worldName||'the world'})):[];

function genWeaponName(weaponId){
  const pre=WEAPON_PREFIXES[Math.floor(Math.random()*WEAPON_PREFIXES.length)];
  const suf=WEAPON_SUFFIXES[Math.floor(Math.random()*WEAPON_SUFFIXES.length)];
  return pre+suf;
}

// Character creation step variables
let createStep=1;
let isRadiant=false;  // Set dynamically by renderCreate() based on system config
let selAncestry='human'; // 'human' | 'singer'
let selCultures=[]; // up to 2 cultural expertises
let selRole=null;
let selWeapon=null;
let charOrigin='';
let charMotivation='';
let charBackstory='';
let charAppearance='';

// ══ OATH PROGRESSION ══
async function checkOathMoment(gmText, player){
  if(!player||!gmText||!gState)return;
  const oathStage=(player.oathStage||1);
  const progType=(_SD().rules&&_SD().rules.progressionType)||'oaths';
  const maxProg=(_SD().rules&&_SD().rules.maxProgression)||5;
  const isClassPath=window.ConfigResolver?window.ConfigResolver.hasClassPath(player):player.isRadiant;
  if(oathStage>=maxProg||!isClassPath)return;
  if(progType!=='oaths'&&progType!=='corruption')return; // only oath/corruption systems have progression moments
  const ideal=ORDER_IDEALS[player.classId];if(!ideal)return;
  const recentActions=(gState.actionLog||[]).slice(0,6).filter(e=>e.name===player.name).map(e=>e.verb+' '+(e.noun||''));
  const allText=(recentActions.join(' ')+' '+gmText).toLowerCase();
  const matchCount=ideal.words.filter(w=>allText.includes(w)).length;
  if(matchCount<2)return;
  const prob=0.04+(matchCount*0.03)+(oathStage*0.01)+Math.min(0.05,(gState.totalMoves||0)*0.0005);
  if(Math.random()>prob)return;
  await progressOath(player);
}

// ══ MYSTERY VISITOR SYSTEM (Hoid/Wit for Stormlight, generic for others) ══
// ~2% chance per turn that a mysterious figure appears — cryptic, never directly helpful
async function maybeSpawnHoid(gmText, turn){
  if(!gState||turn<5)return;
  const lines=HOID_LINES;
  if(!lines||!lines.length)return; // System has no mystery visitor lines
  let chance=0.02;
  if(turn%10===0)chance=0.08;
  if(gState.preCombatTriggered&&!gState.combatMode)chance=0.12;
  if(Math.random()>chance)return;
  if(gState.lastHoidTurn&&turn-gState.lastHoidTurn<15)return;
  gState.lastHoidTurn=turn;
  const line=lines[Math.floor(Math.random()*lines.length)];
  const _glyph=(_SD().glyph)||'✦';
  const _visitorName=(_SD().id)==='stormlight'?'Wit':'A Stranger';
  await addLog({type:'system',who:_glyph+' '+_visitorName,text:line,choices:[]});
  await saveState(gState);
}

async function progressOath(player){
  const currentStage=player.oathStage||1;
  if(currentStage>=5)return;
  const newStage=currentStage+1;
  const oaths=ORDER_OATHS[player.classId]||[];
  const oath=oaths[newStage-1]||'I will hold to what matters.';
  const bonus=OATH_BONUSES[newStage];
  player.oathStage=newStage;
  // Config-driven progression equipment (Shardplate for Stormlight, etc.)
  const _edCfgP=window.ConfigResolver?window.ConfigResolver.getEquipDropConfig():{armorName:'Legendary Armor'};
  if(newStage===4&&!player.shardplate)player.shardplate='Nascent '+_edCfgP.armorName;
  if(newStage===5)player.shardplate='Full '+_edCfgP.armorName;
  const idx=gState.players.findIndex(p=>p&&p.name===player.name);
  if(idx>=0)gState.players[idx]=player;
  if(myChar&&myChar.name===player.name){myChar=player;saveMyChar(player);}
  await saveAndBroadcast(gState);
  const ctx = window.SystemData?.gmContext || {};
  const sysName = ctx.systemName || 'RPG';
  const magicName = ctx.magicName || 'power';
  const oathPrompt=`${sysName} GM. OATH MOMENT for ${player.name} the ${player.className}.
Oath ${newStage} of 5: "${oath}"
${getGenderContext()}
Write 2-3 vivid sentences: ${player.name} speaks this Oath aloud — the ${magicName} surging, the world responding. Make it feel earned and dramatic.
After, write: "NEW ABILITY UNLOCKED: ${bonus.desc}"`;
  setBottomLoading();
  try{
    const res=await fetch(PROXY_URL,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:200,messages:[{role:'user',content:oathPrompt}]})});
    const data=await res.json();
    const oathText=data.content&&data.content[0]?data.content[0].text:'';
    await addLog({type:'system',who:'',text:'⟁ OATH: '+oathText,choices:[]});
  }catch(e){}
}

// ══ BRANCHING ACT CONSEQUENCES ══
async function generateActConsequence(actNum){
  if(!gState||!gState.worldMemory)return;
  const choices=(gState.worldMemory.choices||[]).slice(-8);
  if(!choices.length)return;
  const nextAct=ACTS[actNum]||ACTS[1];
  try{
    const prompt=`Based on these RPG choices: ${choices.map(c=>c.summary).join('; ')}
Generate ONE sentence of consequence flavor for Act ${actNum+1} location: ${nextAct.location}.
Example: "The people of ${nextAct.location} have heard of your deeds — doors open more easily here."
Return ONLY the single sentence, nothing else.`;
    const res=await fetch(PROXY_URL,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:80,messages:[{role:'user',content:prompt}]})});
    const data=await res.json();
    const consequence=data.content&&data.content[0]?data.content[0].text.trim():'';
    if(consequence&&gState.worldMemory){
      gState.worldMemory.actConsequences[actNum+1]=consequence;
      await saveState(gState);
    }
  }catch(e){}
}

// ══ COMBAT HEALING/REVIVE HELPERS ══
function getHealAmount(player, stageOverride){
  const stage=stageOverride!=null?stageOverride:getSprenStage(gState&&gState.totalMoves||0);
  const base=(stage+2)*3;
  // Config-driven heal multiplier per class
  const mult = window.ConfigResolver
    ? window.ConfigResolver.getHealMultiplier(player.classId)
    : (player.classId==='edgedancer'?1.8:player.classId==='bondsmith'?0:1);
  if(mult===0)return null; // party-wide healer returns null (handled separately)
  let heal=Math.round(base*mult);
  if(player.shardplate)heal=Math.round(heal*1.2);
  return heal;
}
function getBondsmitnPartyHeal(stage){return Math.max(2,Math.floor(stage*1.5+2));} // 2,3,5,7,9
function getReviveCost(stage){return Math.max(0,3-stage);} // 3,2,1,0,0 fragments
function getReviveHP(stage){return Math.max(1,stage*2);} // 0,2,4,6,8 → capped at 1 min

function calcEnemyHP(baseHP, actNum, avgBladeTier){
  const actMult=[1.0,1.5,2.0][actNum-1]||1.0;
  const bladeFactor=1+(avgBladeTier*0.15);
  // Party size scaling
  const sz=(typeof gState!=='undefined'&&gState&&gState.partySize)||partySize||3;
  const sizeMult=sz<=2?1.0:sz===3?1.2:sz===4?1.5:2.0;
  // Average party level scaling
  const players=(typeof gState!=='undefined'&&gState&&gState.players||[]).filter(p=>p&&!p.isNPC&&!p.isPlaceholder);
  const avgLevel=players.length?players.reduce((s,p)=>s+(p.level||1),0)/players.length:1;
  const levelMult=1+(Math.max(0,avgLevel-1)*0.12); // +12% per level above 1
  return Math.round(baseHP*actMult*bladeFactor*sizeMult*levelMult);
}

function enemyAttackRoll(enemy, target){
  const roll=Math.min(20,Math.ceil(Math.random()*20)+Math.floor(enemy.attackBonus||2));
  // Use config-driven defense (first defense in rules.defenses) or fallback
  let pDef;
  if(target.physDef!=null){
    pDef=target.physDef+(target.shardplate?3:0);
  } else if(window.ConfigResolver){
    const defs=window.ConfigResolver.calcDefensesFromConfig(target.stats||{},{});
    pDef=(defs.physDef||10)+(target.shardplate?3:0);
  } else {
    pDef=10+(target.stats&&target.stats.str||0)+(target.stats&&target.stats.spd||0)+(target.shardplate?3:0);
  }
  const hit=roll>pDef;
  const dmg=hit?Math.ceil(Math.random()*enemy.dmg)+Math.floor(enemy.dmg/2):0;
  return{roll,hit,dmg,defense:pDef};
}

function buildCombatChoices(player, combatState){
  const cached=gState.combatChoicesCache&&gState.combatChoicesCache[player.name];
  if(cached&&cached.length>=4)return cached;
  const round=gState.combatRound||1;
  const cls=CLASSES.find(cl=>cl.id===player.classId)||CLASSES[0];
  const sz=gState.partySize||partySize;
  const enemies=(gState.combatEnemies||[]).filter(e=>!e.downed&&e.hp>0);
  const downed=gState.players.slice(0,sz).filter(p=>p&&p.downed);
  const anyInjured=gState.players.slice(0,sz).some(p=>p&&p.hp<(p.maxHp||10)&&!p.downed);
  const healAmt=getHealAmount(player,getSprenStage(gState.totalMoves||0));
  const eName=(enemies[0]&&enemies[0].name)||'the enemy';
  const weapon=player.weapons&&player.weapons[0];
  const wName=weapon?weapon.name:(player.shardblade||'my weapon');
  const surgeId=(ORDER_SURGES[player.classId]||[])[0];
  const surgeObj=surgeId&&SURGES.find(s=>s.id===surgeId);
  const _gmCtx=_SD().gmContext||{};
  const _magicName=_gmCtx.magicName||'power';
  const _magicRes=_gmCtx.magicResource||'energy';
  const surgeName=surgeObj?surgeObj.name:('my '+_magicName.toLowerCase());
  const _abilTag=(_SD().combatActions||[]).find(a=>a.id==='surge'||a.id==='magic'||a.id==='corruption');
  const _surgeTag=_abilTag?_abilTag.tag:'SURGE';
  const seed=((round-1)%5);
  const attackPool=[
    `[ATTACK] I drive forward and unleash ${surgeName} directly into ${eName}'s center of mass`,
    `[ATTACK] I feint left and swing hard for the gap in ${eName}'s guard with ${wName}`,
    `[ATTACK] I channel ${_magicName} through my body and launch at ${eName}`,
    `[ATTACK] I read ${eName}'s weight distribution and strike exactly where balance fails`,
    `[ATTACK] I put everything into a single overwhelming blow — no holding back`,
  ];
  const tacticalPool=[
    `[ATTACK] I use ${surgeName} to cut off ${eName}'s retreat and force them onto my terms`,
    `[DEFEND] I draw ${eName}'s strike, let it slide past, and open a path for my allies`,
    `[ATTACK] I target ${eName}'s weapon arm — end the fight by ending their offense`,
    `[DEFEND] I put myself between ${eName} and whoever needs protection most`,
    `[ATTACK] I call ${eName}'s next move before they make it and counter before they adjust`,
  ];
  const surgePool=[
    `[${_surgeTag}] I pour ${_magicRes} into ${surgeName} and reshape the ground between us`,
    `[${_surgeTag}] I breathe in deep and let ${surgeName} flow through my limbs — faster, stronger`,
    `[${_surgeTag}] I push ${surgeName} beyond its usual limits and see what it can do`,
    `[${_surgeTag}] I use ${surgeName} to create an opening no one else in this fight could make`,
    `[${_surgeTag}] I anchor myself with ${surgeName} and become the immovable point this battle needs`,
  ];
  const healPool=[
    downed.length>0?`[HEAL] I drop to ${downed[0].name}'s side and channel ${_magicName} into the wound`:
      `[HEAL] I press ${_magicName} into the worst of my injuries and force them to close`,
    downed.length>0?`[HEAL] I cover ${downed[0].name} and pour everything I have into keeping them alive`:
      `[HEAL] I steal a moment to let healing do its work on whoever needs it most`,
    `[HEAL] I draw all the ${_magicName} within reach and distribute it among those who need it`,
    `[HEAL] I sacrifice momentum to stabilize — we cannot win if we keep bleeding out`,
    `[HEAL] I draw deep and let the energy seal what the last blow opened`,
  ];
  return [attackPool[seed], tacticalPool[seed], surgePool[seed], healPool[seed]];
}

async function generateCombatChoices(player){
  if(!player||!gState)return;
  const stage=getSprenStage(gState.totalMoves||0);
  const cls=CLASSES.find(c=>c.id===player.classId)||CLASSES[0];
  const sz=gState.partySize||partySize;
  const enemies=(gState.combatEnemies||[]).filter(e=>!e.downed&&e.hp>0);
  const downed=gState.players.slice(0,sz).filter(p=>p&&p.downed);
  const anyInjured=gState.players.slice(0,sz).some(p=>p&&p.hp<(p.maxHp||10)&&!p.downed);
  const healAmt=getHealAmount(player,stage);
  const loc=getAct(gState.totalMoves||0).location||'the battlefield';
  const round=gState.combatRound||1;
  const enemyDesc=enemies.map(e=>`${e.name}(${Math.round(e.hp/e.maxHp*100)}% HP${e.conditions&&Object.keys(e.conditions).length?' '+Object.keys(e.conditions).join(','):''} )`).join(', ')||'no enemies standing';
  const partyDesc=gState.players.slice(0,sz).filter(p=>p&&!p.downed).map(p=>`${p.name}(${Math.round(p.hp/(p.maxHp||10)*100)}%HP)`).join(', ');
  const healOption=downed.length>0?`REQUIRED: One option MUST be [HEAL] to attempt reviving ${downed[0].name}.`
    :anyInjured?`REQUIRED: One option MUST be [HEAL] targeting an injury (estimated +${healAmt}HP).`:'';
  const surges=ORDER_SURGES[player.classId]||[];
  const surgeNames=surges.map(id=>SURGES.find(s=>s.id===id)).filter(Boolean).map(s=>s.name).join(' and ');

  // Get the last 2 rounds of choices to avoid repetition
  const prevChoices=[];
  if(gState.combatLog){
    gState.combatLog.slice(-4).forEach(entry=>{
      if(entry.playerChoices&&entry.playerChoices[player.name]){
        prevChoices.push(entry.playerChoices[player.name]);
      }
    });
  }
  const prevWarning=prevChoices.length>0?
    `\nDO NOT use these phrases or approaches from previous rounds: ${prevChoices.flat().slice(0,6).map(c=>c.slice(0,40)).join(' | ')}`:
    '';

  // Recent combat narrative for context
  const recentLog=(gState.combatLog||[]).slice(-2).map(e=>e.text||'').filter(Boolean).join(' ');
  const contextSnippet=recentLog.slice(0,300);

  const _ctx2 = window.SystemData?.gmContext || {};
  const _magicName2 = _ctx2.magicName || 'power';
  const _magicRes2 = _ctx2.magicResource || 'energy';
  const _abilTag2 = (_SD().combatActions||[]).find(a=>a.id==='surge'||a.id==='magic'||a.id==='corruption');
  const _surgeTag2 = _abilTag2?_abilTag2.tag:'SURGE';
  const surgesText=surgeNames?`\nAbilities available: ${surgeNames}. Weave them into at least one option.`:'';
  const abilitiesText=(cls.abilities||[]).length?`\nClass abilities: ${cls.abilities.slice(0,3).join(', ')}.`:'';
  const woundNote=player.hp<(player.maxHp||10)*0.4?`\n${player.name} is badly wounded (${player.hp}/${player.maxHp}HP) — this must show in at least one option.`:'';
  const injuryNote=(player.injuries&&player.injuries.length)?`\nActive injuries: ${player.injuries.map(i=>i.effect).join(', ')} — let this shape the choices.`:'';

  const _sysLabel = _ctx2.combatFlavor || _ctx2.systemName || 'RPG';
  const _actionTags = (_SD().combatActions||[]).map(a=>'['+a.tag+']').join(', ')||'[ATTACK], [DEFEND], [HEAL], ['+_surgeTag2+']';
  const prompt=`You are writing 4 combat action choices for a ${_sysLabel} game. These appear as buttons the player clicks.

ROUND ${round}. LOCATION: ${loc}.
ACTING CHARACTER: ${player.name}, ${cls.name}${player.oathStage?' (Stage '+player.oathStage+')':''}${woundNote}${injuryNote}
ENEMIES: ${enemyDesc}
ALLIES: ${partyDesc}
RECENT CONTEXT: ${contextSnippet||'Combat just began.'}${surgesText}${abilitiesText}
${healOption}
${prevWarning}

RULES — EVERY choice must follow ALL of these:
1. FIRST PERSON ONLY — "I [verb]..." or starts with an action verb implying "I". NEVER "Strike the enemy" or "${player.name} does X".
2. ONE VIVID SENTENCE — specific, concrete, shows what happens physically.
3. MECHANICALLY TAGGED — start with one of: ${_actionTags}.
4. UNIQUE TO THIS MOMENT — reference the specific enemy, location detail, or current status. No generic RPG phrases.
5. FOUR DISTINCT APPROACHES — one aggressive, one tactical/defensive, one ${_magicName2.toLowerCase()}/class ability, one situational (healing, terrain, ally help).
6. NO REPETITION from previous rounds listed above.

EXAMPLES OF GOOD choices:
"[ATTACK] I drive forward and slam my weapon into the enemy's center mass, hurling them backward."
"[DEFEND] I interpose myself between my ally and the incoming strike, taking the blow on my shoulder."
"[${_surgeTag2}] I channel ${_magicName2} into the cracked ground and force it to buckle under their feet."
"[HEAL] I pull my ally behind cover and channel ${_magicName2} into the wound."

Return ONLY 4 numbered lines. Nothing else.`;

  try{
    const res=await fetch(PROXY_URL,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:300,
        messages:[{role:'user',content:prompt}]})});
    const data=await res.json();
    const raw=data.content&&data.content[0]?data.content[0].text:'';
    const parsed=(raw.match(/^\d+\.\s*.+$/gm)||[])
      .map(l=>l.replace(/^\d+\.\s*/,'').trim())
      .filter(l=>l.length>15&&/\[ATTACK\]|\[DEFEND\]|\[HEAL\]|\[SURGE\]/.test(l))
      .slice(0,4);
    if(parsed.length>=3){
      if(!gState.combatChoicesCache)gState.combatChoicesCache={};
      gState.combatChoicesCache[player.name]=parsed;
      // Store in combatLog for future uniqueness checking
      if(gState.combatLog){
        const lastEntry=gState.combatLog[gState.combatLog.length-1];
        if(lastEntry){
          if(!lastEntry.playerChoices)lastEntry.playerChoices={};
          lastEntry.playerChoices[player.name]=parsed;
        }
      }
      if(myChar&&myChar.name===player.name)renderCombatActions();
    }
  }catch(e){console.warn('generateCombatChoices failed, using fallback:',e.message);}
}

// ══ LEVEL SYSTEM ══
function getLevelStats(level, str){
  const entry=ADVANCEMENT[level]||{hpGain:1,maxSkill:5};
  let hpGain=entry.hpGain||0;
  if(hpGain==='4+str')hpGain=4+(str||0);
  if(entry.hpBase)hpGain=10+(str||0);
  return{hpGain,maxSkill:entry.maxSkill||5,getsAttrPoint:entry.attr||false};
}

function levelUp(player){
  if(!player)return player;
  const newLevel=(player.level||1)+1;
  const {hpGain,getsAttrPoint}=getLevelStats(newLevel,player.stats&&player.stats.str||0);
  player.level=newLevel;
  player.maxHp=(player.maxHp||10)+hpGain;
  player.hp=Math.min(player.hp+(hpGain),player.maxHp);
  // +2 skill ranks per level (player chooses which skills)
  if(!player.skillRanksAvailable)player.skillRanksAvailable=0;
  player.skillRanksAvailable+=2;
  return player;
}

// ── MUTABLE STATE ─────────────────────────────────────────────
let gState    = null;   // Full campaign game state from Sheets
let myChar    = null;   // This player's character object
let mySlot    = null;   // Slot index for this player

// Unique ID for this browser tab session — survives refresh, dies on tab close.
// Used to reclaim stale placeholders left by a mid-creation refresh.
const SESSION_ID = sessionStorage.getItem('sc_session') || (()=>{
  const id = Math.random().toString(36).slice(2,10);
  sessionStorage.setItem('sc_session', id);
  return id;
})();
let selClass  = null;   // Selected class during creation
let selColor  = null;   // Selected color during creation
let rolledStats = null; // Stats from character creation
let selActionText = '';
let selActionTag  = ''; // tag from the last clicked choice button (COMBAT/DISCOVERY/etc.)
let sheetOpen = false;
let isLoading = false;
let pollTimer = null;
let partySize = 3;
let campaignId = null;
let pendingCampNum = null;
let bottomState = '';
let lastGMTs = '';

// Away mode — auto-skip when player steps away
let awayMode = false;

// Character creation step state
let selKit      = null;
let charObstacle    = '';

// Point-buy allocation (12 points, max 3 per attr at creation)
// Point-buy allocation — rebuilt dynamically when system loads
let _pbAlloc = {}; // Initialized by renderCreate() from STAT_KEYS

// Speech synthesis
let voiceActive = false, currentUtterance = null;
// voiceEnabled persists — when ON, every new story beat is read aloud automatically
let voiceEnabled = localStorage.getItem('sc_tts_on') === 'true';

// Audio
let audioCtx = null, audioNodes = {}, audioOn = false, masterGain = null;

// WebSocket
let ws = null, wsConnected = false;

// Log cache
let _logCache = null;
let _logCacheTs = 0;
const LOG_CACHE_TTL = 3000;

// JWT token cache
let _tok = null, _tokExp = 0;

// Lang
let lang = localStorage.getItem('sc_lang') || 'en';
let thaiCache = {};
let uiTranslating = false;

// Combat state
let combatSelectedAction = '';
