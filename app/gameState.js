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
const SHEET_ID  = window.CYOA_CONFIG?.sheetId  || '1f2lS_y0e4eZHYBX68QHJHG-8mmI9680nBNf1fG3ZdEw';
const PROXY_URL = window.CYOA_CONFIG?.apiUrl   || 'https://cyoahub-proxy.rruss7997.workers.dev';
const WS_URL    = window.CYOA_CONFIG?.wsUrl    || 'wss://cyoahub-proxy.rruss7997.workers.dev/session';


// ── SERVICE ACCOUNT (Google Sheets Auth) ────────────────────
const SA={
  client_email:'stormlightbrj@stormlight-rpg.iam.gserviceaccount.com',
  private_key:`-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQClSJ0lSZVQAxUD\n44VpcHcNd2X71dz9syJ4FS3U1XOwHr4Dz4FiHThqEnm+cvjaBNaqcu4CgMOlEXt5\nsOYVy8JLvcICyhxEfh/jubSMGPUESOhGlV1T5Shmbtz2bNh7moqAeeFBiYLU5V9t\nVWO8GcMKU1KOinCrspkXq9jVCo8qLbuLC9ux6kJgZi2K2agkXaxUxKrQauZfn1YI\nBiM7SGOvdhzRlDswRhLP3xhoh0rOGXSzWzfo2/MphDfxUS9L4M6FBW3FVhHlvGNO\nDFY+gWIVD/uHlbsA1CXtjw7KdUzHtP+/QUCIyL6j6tdIsa8o9gMmW4V5m1EDg4jv\nHbwz+b+9AgMBAAECggEAGBs/pD0XtGxGp+MKxcab7pBgBPt7uFrkp5v7K8QYE/Nf\n5mFg7wTxAfOA4yiUqAO1pXWOxjmuj0g9+JE29a3awD5EajC9L7Yvg4DF1vsa3U2e\n5xCI5KATJOF9g8l7R4fSNIvSMUNTnCZ6JRGjsr8VJc/iRhzl8vzg/EVZojTgjZeS\n78GVpXHS408RuX19rsV3LEe/zeuz9SeVLc9jegbpjJk/XAb7Ipkkz6WMhvdahcya\nqheGY/SsoLhaHlensZdwDqij/DOgPMiDbbsVIUWKwegg+BnvcaLlehkn5Gl1Is6P\nSccIXiHBGB8i0g8DLA70xS6+TuEhA7fLzL1ZLlutJwKBgQDT6jZFGa2N88wNczOR\neTis8m3twI6LTSZQSdXX0nm7dd15qBaC/Ru5CuEhess+Vpv96nVmDAPyT+XBuWjl\nk6Q8810S7n/U5tk39MIBvouU+nOR/7KlIG5CxNbAILIRkVJ9W9RyYYkOIUaJ6eCM\nzsBfyei7bQtjgG46HIQSorXcnwKBgQDHqv9pYpe6ulpGbgsNwZ/ZpB5b9SiRhlGy\nZhlxA6O5C0gM0ymC3EoCi3C5Adnzm8pRNCgGxZu2u4QcuDpm5+tR8ddrz2Nsbgce\nfJbdWUFCi90U7qrQd8pAY46zdQFWqEkJY8BPHqloOlKymlGQL289BY1pR+MTpBWT\nQ6UdLoWqIwKBgQDQCbQxbh31p4uBAMF1ZP4Auxa0Oz80/g5I79NhRx1+rR06G4vO\nGFEo/cc6KORyVHBbe9q4zb7qGQnDfxO9nY200G1k8oLILcC9sCjtsXQyUxU2FUH5\n3bahEcCJaQ+nM3U53/bWO25jUsN/DP0G/snYv80cgtaVXjXYErqN2PKUnQKBgF8y\nCeAm34xpeM0HfkGqxRmxA8B4HEV1stHJl+un/pEk7c8fhjUb7jVUYgPy/AUHi+g3\nY7YG1PzEXnKK611QyYMiOMDv+ckilEZWxF74RQMDR/7I46vM0SLt1IV/DYpRZbES\nXAfc6IwG8pKwvJ5v3ytK0GcXnQ4qNxclMz28hoHdAoGAIDDnRLlZVgBdk6oijZI+\nb7jokuI9quDtomUCCHZyB+3mMq6hf9zOfKt+GsZz0Q512ezC4vbq0j5GCVT8uMRM\nYsOgyVkloyM8TeZNLE9LNVkX8MRL9gVstaBdMkqaq/Lkvn5wCuRBO69ZD5vrZPvF\n2uxw+l3wHWPcAIiPAXybsCM=\n-----END PRIVATE KEY-----\n`
};

// ══ SYSTEM LOADER + DATA ALIASES ══
const _sys = window.StormlightSystem;
window.SystemData = _sys;
function loadSystem(systemId) {
  const systems = { stormlight: window.StormlightSystem };
  const sys = systems[systemId];
  if (!sys) { console.error('Unknown system:', systemId); return window.SystemData; }
  window.SystemData = sys;
  return sys;
}

const CLASSES       = _sys.classes;
const SPREN_BONDS   = _sys.sprenBonds;
const NPC_M         = _sys.npcMale;
const NPC_F         = _sys.npcFemale;
const NPC_ALL       = [..._sys.npcMale, ..._sys.npcFemale];
const COLORS        = _sys.colors;
const NPC_COLORS    = _sys.npcColors;
const STAT_KEYS     = _sys.statKeys;
const STAT_NAMES    = _sys.statNames;
const STAT_FULL     = _sys.statFull;
const SKILLS        = _sys.skills;
const PATH_SKILLS   = _sys.pathSkills;
const SURGES        = _sys.surges;
const SURGE_SCALE   = _sys.surgeScale;
const ORDER_SURGES  = _sys.orderSurges;
const CONDITIONS    = _sys.conditions;
const INJURY_EFFECTS= _sys.injuryEffects;
const WEAPONS       = _sys.weapons;
const ARMORS        = _sys.armors;
const STARTING_KITS = _sys.startingKits;
const GEMSTONES     = _sys.gemstones;
const SPREN_APPEARANCES = _sys.sprenAppearances;
const ADVERSARY_ROLES   = _sys.adversaryRoles;
const COMBAT_OPPS   = _sys.combatOpps;
const COMBAT_COMPS  = _sys.combatComps;
const PURPOSES      = _sys.purposes;
const OBSTACLES     = _sys.obstacles;
const ROSHAR_P      = _sys.locations;
const ROSHAR_O      = _sys.offworldLocations;
const ROSHAR_S      = _sys.shadesmarLocations;
const ROSHAR_L      = _sys.legendaryLocations;
const ALL_LOCS      = [...ROSHAR_P, ...ROSHAR_O, ...ROSHAR_S, ...ROSHAR_L];
const BASE_ACTS     = _sys.baseActs;
const BLADE_TIERS   = _sys.bladeTiers;
const ANCESTRIES    = _sys.ancestries;
const CULTURES      = _sys.cultures;
const SINGER_FORMS  = _sys.singerForms;
const HERO_ROLES    = _sys.heroRoles;
const HERO_WEAPONS  = _sys.heroWeapons;
const WEAPON_PREFIXES = _sys.weaponPrefixes;
const WEAPON_SUFFIXES = _sys.weaponSuffixes;
const ORDER_OATHS   = _sys.orderOaths;
const OATH_BONUSES  = _sys.oathBonuses;
const ADVANCEMENT   = _sys.advancement;
const ORDER_IDEALS  = _sys.orderIdeals;
const HOID_LINES    = _sys.hoidLines;
const BLADE_NAMES   = _sys.bladeNames;

// ══ NON-DATA CONSTANTS (game engine config) ══
const ATTR_POINTS_START=12;
const ATTR_MAX_CREATE=3;
const DC={EASY:10, MEDIUM:15, HARD:20, VERY_HARD:25, NEARLY_IMPOSSIBLE:30};
const COMBAT_BEATS_MIN=3, COMBAT_BEATS_MAX=8;

// ══════════════════════════════════════════════════════════
// FUNCTIONS (game mechanics — NOT extracted to system file)
// ══════════════════════════════════════════════════════════

// ══ RECOVERY DIE (WIL-based, Official) ══
function getRecoveryDie(wil){
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

// ══ INVESTITURE (Official: 2 + higher of AWA or PRE) ══
function getMaxInvestiture(stats){
  const awa=stats&&stats.awa||0;
  const pre=stats&&stats.pre||0;
  return 2+Math.max(awa,pre);
}

// ══ DEFLECT (reduces energy/impact/keen damage — NOT spirit/vital) ══
// deflect value stored on character; 0 = no armor
function applyDeflect(dmg, dmgType, deflect){
  const deflectable=['energy','impact','keen'];
  if(deflectable.includes(dmgType)&&deflect>0){
    return Math.max(0,dmg-deflect);
  }
  return dmg; // spirit/vital damage bypasses deflect
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

// ══ INJURY SYSTEM (Official Chapter 9) ══
function rollInjury(player, isShardblade=false){
  const deflect=player.deflect||0;
  const existingInjuries=(player.injuries||[]).length;
  const roll=Math.ceil(Math.random()*20)+deflect-(existingInjuries*5);

  let severity, duration;
  if(isShardblade){
    // Spiritual Injury table
    if(roll>=16)      {severity='Flesh Wound';      duration='until long rest';}
    else if(roll>=1)  {severity='Permanent Spiritual Injury'; duration='permanent (no non-Invested healing)';}
    else              {severity='Death';             duration='permanent';}
  } else {
    if(roll>=16)      {severity='Flesh Wound';       duration='until long rest';}
    else if(roll>=6)  {severity='Shallow Injury';    duration=`${Math.ceil(Math.random()*6)} days`;}
    else if(roll>=1)  {severity='Vicious Injury';    duration=`${Math.ceil(Math.random()*6)+Math.ceil(Math.random()*6)+Math.ceil(Math.random()*6)+Math.ceil(Math.random()*6)+Math.ceil(Math.random()*6)+Math.ceil(Math.random()*6)} days`;}
    else if(roll>=-5) {severity='Permanent Injury';  duration='permanent';}
    else              {severity='Death';              duration='permanent';}
  }

  const effectIdx=Math.floor(Math.random()*8);
  const effect=INJURY_EFFECTS[effectIdx];
  const injury={severity,duration,effect,roll,isShardblade};

  if(!player.injuries)player.injuries=[];
  if(severity!=='Death')player.injuries.push(injury);

  // Apply condition from injury
  if(effect.includes('Exhausted')){
    const pen=effect.includes('[−2]')?2:1;
    if(!player.conditions)player.conditions={};
    player.conditions.exhausted=(player.conditions.exhausted||0)+pen;
  } else if(effect.includes('Slowed')){
    applyCondition(player,'slowed');
  } else if(effect.includes('Disoriented')){
    applyCondition(player,'disoriented');
  } else if(effect.includes('Surprised')){
    applyCondition(player,'surprised');
  }

  return injury;
}

// ══ CURRENCY ══
function formatMarks(mk){
  if(!mk||mk<1)return mk+'mk';
  if(mk>=200)return Math.floor(mk/4)+'b '+Math.round(mk%4)+'m'; // broams + marks
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

// Derived variable
let ACTS=BASE_ACTS.map(a=>({...a,name:a.tag,location:'Roshar'}));

function genWeaponName(weaponId){
  const pre=WEAPON_PREFIXES[Math.floor(Math.random()*WEAPON_PREFIXES.length)];
  const suf=WEAPON_SUFFIXES[Math.floor(Math.random()*WEAPON_SUFFIXES.length)];
  return pre+suf;
}

// Character creation step variables
let createStep=1;
let isRadiant=true;
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
  if(oathStage>=5||!player.isRadiant)return;
  const ideal=ORDER_IDEALS[player.classId];if(!ideal)return;
  const recentActions=(gState.actionLog||[]).slice(0,6).filter(e=>e.name===player.name).map(e=>e.verb+' '+(e.noun||''));
  const allText=(recentActions.join(' ')+' '+gmText).toLowerCase();
  const matchCount=ideal.words.filter(w=>allText.includes(w)).length;
  if(matchCount<2)return;
  const prob=0.04+(matchCount*0.03)+(oathStage*0.01)+Math.min(0.05,(gState.totalMoves||0)*0.0005);
  if(Math.random()>prob)return;
  await progressOath(player);
}

// ══ THE HOID SYSTEM ══
// ~2% chance per turn that Wit appears — cryptic, never directly helpful
// Increases slightly at dramatic moments
async function maybeSpawnHoid(gmText, turn){
  if(!gState||turn<5)return;
  // Base chance 2%, rises at dramatic moments and multiples of 10
  let chance=0.02;
  if(turn%10===0)chance=0.08;
  if(gState.preCombatTriggered&&!gState.combatMode)chance=0.12;
  if(Math.random()>chance)return;
  // Don't repeat too soon
  if(gState.lastHoidTurn&&turn-gState.lastHoidTurn<15)return;
  gState.lastHoidTurn=turn;
  const line=HOID_LINES[Math.floor(Math.random()*HOID_LINES.length)];
  await addLog({type:'system',who:'⟁ Wit',text:line,choices:[]});
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
  if(newStage===4&&!player.shardplate)player.shardplate='Nascent Plate';
  if(newStage===5)player.shardplate='Full Shardplate';
  const idx=gState.players.findIndex(p=>p&&p.name===player.name);
  if(idx>=0)gState.players[idx]=player;
  if(myChar&&myChar.name===player.name){myChar=player;saveMyChar(player);}
  await saveAndBroadcast(gState);
  const oathPrompt=`Cosmere RPG GM. OATH MOMENT for ${player.name} the ${player.className}.
Oath ${newStage} of 5: "${oath}"
${getGenderContext()}
Write 2-3 vivid sentences: ${player.name} speaks this Oath aloud — the Stormlight surging, the spren's reaction, the world responding. Make it feel earned and dramatic.
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
  const base=(stage+2)*3; // 9,12,15,18,21 — meaningful healing
  if(player.classId==='edgedancer')return Math.round(base*1.8); // 16,22,27,32,38
  if(player.classId==='bondsmith')return null;
  if(player.shardplate)return Math.round(base*1.2); // Shardplate wearers channel more
  return base;
}
function getBondsmitnPartyHeal(stage){return Math.max(2,Math.floor(stage*1.5+2));} // 2,3,5,7,9
function getReviveCost(stage){return Math.max(0,3-stage);} // 3,2,1,0,0 fragments
function getReviveHP(stage){return Math.max(1,stage*2);} // 0,2,4,6,8 → capped at 1 min

function calcEnemyHP(baseHP, actNum, avgBladeTier){
  const actMult=[1.0,1.5,2.0][actNum-1]||1.0;
  const bladeFactor=1+(avgBladeTier*0.15);
  return Math.round(baseHP*actMult*bladeFactor);
}

function enemyAttackRoll(enemy, target){
  const roll=Math.min(20,Math.ceil(Math.random()*20)+Math.floor(enemy.attackBonus||2));
  // Official Physical Defense = 10 + STR + SPD
  const pDef=10+(target.stats&&target.stats.str||0)+(target.stats&&target.stats.spd||0)+(target.shardplate?3:0);
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
  const surgeName=surgeObj?surgeObj.name:'my surge';
  const seed=((round-1)%5);
  const attackPool=[
    `[ATTACK] I drive forward and unleash ${surgeName} directly into ${eName}'s center of mass`,
    `[ATTACK] I feint left and swing hard for the gap in ${eName}'s guard with ${wName}`,
    `[ATTACK] I channel Stormlight through my feet and launch off the ground at ${eName}`,
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
    `[SURGE] I pour Investiture into ${surgeName} and reshape the ground between us`,
    `[SURGE] I breathe in deep and let ${surgeName} flow through my limbs — faster, stronger`,
    `[SURGE] I push ${surgeName} beyond its usual limits and see what it can do`,
    `[SURGE] I use ${surgeName} to create an opening no one else in this fight could make`,
    `[SURGE] I anchor myself with ${surgeName} and become the immovable point this battle needs`,
  ];
  const healPool=[
    downed.length>0?`[HEAL] I drop to ${downed[0].name}'s side and push Stormlight into the wound`:
      `[HEAL] I press Stormlight into the worst of my injuries and force them to close`,
    downed.length>0?`[HEAL] I cover ${downed[0].name} and pour everything I have into keeping them alive`:
      `[HEAL] I steal a moment to let Progression do its work on whoever needs it most`,
    `[HEAL] I draw all Stormlight within reach and distribute it among those who need it`,
    `[HEAL] I sacrifice momentum to stabilize — we cannot win if we keep bleeding out`,
    `[HEAL] I inhale from the nearest sphere and let the light seal what the last blow opened`,
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

  const surgesText=surgeNames?`\nSurges available: ${surgeNames}. Weave them into at least one option.`:'';
  const abilitiesText=(cls.abilities||[]).length?`\nClass abilities: ${cls.abilities.slice(0,3).join(', ')}.`:'';
  const woundNote=player.hp<(player.maxHp||10)*0.4?`\n${player.name} is badly wounded (${player.hp}/${player.maxHp}HP) — this must show in at least one option.`:'';
  const injuryNote=(player.injuries&&player.injuries.length)?`\nActive injuries: ${player.injuries.map(i=>i.effect).join(', ')} — let this shape the choices.`:'';

  const prompt=`You are writing 4 combat action choices for a Stormlight Archive RPG. These appear as buttons the player clicks.

ROUND ${round}. LOCATION: ${loc}.
ACTING CHARACTER: ${player.name}, ${cls.name} (Oath ${player.oathStage||1}/5)${woundNote}${injuryNote}
ENEMIES: ${enemyDesc}
ALLIES: ${partyDesc}
RECENT CONTEXT: ${contextSnippet||'Combat just began.'}${surgesText}${abilitiesText}
${healOption}
${prevWarning}

RULES — EVERY choice must follow ALL of these:
1. FIRST PERSON ONLY — "I [verb]..." or starts with an action verb implying "I". NEVER "Strike the enemy" or "${player.name} does X".
2. ONE VIVID SENTENCE — specific, concrete, shows what happens physically.
3. MECHANICALLY TAGGED — start with [ATTACK], [DEFEND], [HEAL], or [SURGE].
4. UNIQUE TO THIS MOMENT — reference the specific enemy, location detail, or current status. No generic RPG phrases.
5. FOUR DISTINCT APPROACHES — one aggressive, one tactical/defensive, one surge/class ability, one situational (healing, terrain, ally help).
6. NO REPETITION from previous rounds listed above.

EXAMPLES OF GOOD choices:
"[ATTACK] I slam a Basic Lashing into the Fused's chest and hurl them backward into the wall."
"[DEFEND] I interpose myself between Kal and the singer's spear, taking the blow on my shoulder."
"[SURGE] I pour Progression into the cracked stone floor and force it to buckle under their feet."
"[HEAL] I pull ${player.name==='Kaladin'?'Shallan':'my ally'} behind a pillar and breathe Stormlight into the wound."

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
let _pbAlloc = { str:2, spd:2, int:2, wil:2, awa:2, pre:2 };

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
