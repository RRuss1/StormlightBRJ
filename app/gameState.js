/**
 * ============================================================
 * app/gameState.js — Game Constants, Data Tables & State
 * Stormlight Chronicles
 * ============================================================
 * Contains:
 *   - All Cosmere RPG game data (classes, weapons, skills, etc.)
 *   - Global mutable state variables
 *   - Location/act seed system
 *   - Sheet auth config (SA key)
 * ============================================================
 */

// ── ENV CONFIG ────────────────────────────────────────────────
// These are read at startup. Override via env.js or window.STORMLIGHT_CONFIG.
const SHEET_ID  = window.STORMLIGHT_CONFIG?.sheetId  || '1f2lS_y0e4eZHYBX68QHJHG-8mmI9680nBNf1fG3ZdEw';
const PROXY_URL = window.STORMLIGHT_CONFIG?.apiUrl   || 'https://stormlight-proxy.goretusk55.workers.dev';
const WS_URL    = window.STORMLIGHT_CONFIG?.wsUrl    || 'wss://stormlight-proxy.rruss7997.workers.dev/session';


// ── SERVICE ACCOUNT (Google Sheets Auth) ────────────────────
const SA={
  client_email:'stormlightbrj@stormlight-rpg.iam.gserviceaccount.com',
  private_key:`-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQClSJ0lSZVQAxUD\n44VpcHcNd2X71dz9syJ4FS3U1XOwHr4Dz4FiHThqEnm+cvjaBNaqcu4CgMOlEXt5\nsOYVy8JLvcICyhxEfh/jubSMGPUESOhGlV1T5Shmbtz2bNh7moqAeeFBiYLU5V9t\nVWO8GcMKU1KOinCrspkXq9jVCo8qLbuLC9ux6kJgZi2K2agkXaxUxKrQauZfn1YI\nBiM7SGOvdhzRlDswRhLP3xhoh0rOGXSzWzfo2/MphDfxUS9L4M6FBW3FVhHlvGNO\nDFY+gWIVD/uHlbsA1CXtjw7KdUzHtP+/QUCIyL6j6tdIsa8o9gMmW4V5m1EDg4jv\nHbwz+b+9AgMBAAECggEAGBs/pD0XtGxGp+MKxcab7pBgBPt7uFrkp5v7K8QYE/Nf\n5mFg7wTxAfOA4yiUqAO1pXWOxjmuj0g9+JE29a3awD5EajC9L7Yvg4DF1vsa3U2e\n5xCI5KATJOF9g8l7R4fSNIvSMUNTnCZ6JRGjsr8VJc/iRhzl8vzg/EVZojTgjZeS\n78GVpXHS408RuX19rsV3LEe/zeuz9SeVLc9jegbpjJk/XAb7Ipkkz6WMhvdahcya\nqheGY/SsoLhaHlensZdwDqij/DOgPMiDbbsVIUWKwegg+BnvcaLlehkn5Gl1Is6P\nSccIXiHBGB8i0g8DLA70xS6+TuEhA7fLzL1ZLlutJwKBgQDT6jZFGa2N88wNczOR\neTis8m3twI6LTSZQSdXX0nm7dd15qBaC/Ru5CuEhess+Vpv96nVmDAPyT+XBuWjl\nk6Q8810S7n/U5tk39MIBvouU+nOR/7KlIG5CxNbAILIRkVJ9W9RyYYkOIUaJ6eCM\nzsBfyei7bQtjgG46HIQSorXcnwKBgQDHqv9pYpe6ulpGbgsNwZ/ZpB5b9SiRhlGy\nZhlxA6O5C0gM0ymC3EoCi3C5Adnzm8pRNCgGxZu2u4QcuDpm5+tR8ddrz2Nsbgce\nfJbdWUFCi90U7qrQd8pAY46zdQFWqEkJY8BPHqloOlKymlGQL289BY1pR+MTpBWT\nQ6UdLoWqIwKBgQDQCbQxbh31p4uBAMF1ZP4Auxa0Oz80/g5I79NhRx1+rR06G4vO\nGFEo/cc6KORyVHBbe9q4zb7qGQnDfxO9nY200G1k8oLILcC9sCjtsXQyUxU2FUH5\n3bahEcCJaQ+nM3U53/bWO25jUsN/DP0G/snYv80cgtaVXjXYErqN2PKUnQKBgF8y\nCeAm34xpeM0HfkGqxRmxA8B4HEV1stHJl+un/pEk7c8fhjUb7jVUYgPy/AUHi+g3\nY7YG1PzEXnKK611QyYMiOMDv+ckilEZWxF74RQMDR/7I46vM0SLt1IV/DYpRZbES\nXAfc6IwG8pKwvJ5v3ytK0GcXnQ4qNxclMz28hoHdAoGAIDDnRLlZVgBdk6oijZI+\nb7jokuI9quDtomUCCHZyB+3mMq6hf9zOfKt+GsZz0Q512ezC4vbq0j5GCVT8uMRM\nYsOgyVkloyM8TeZNLE9LNVkX8MRL9gVstaBdMkqaq/Lkvn5wCuRBO69ZD5vrZPvF\n2uxw+l3wHWPcAIiPAXybsCM=\n-----END PRIVATE KEY-----\n`
};

// ══ GAME DATA ══
const CLASSES=[
  // ══ OFFICIAL RADIANT ORDERS (Chapter 5) ══
  // Ordered by: surges, philosophy, spren, ideals
  {id:'windrunner',name:'Windrunner',
   philosophy:'I will protect.',
   surges:['adhesion','gravitation'],
   ideal1:'Life before death. Strength before weakness. Journey before destination.',
   ideal2:'I will protect those who cannot protect themselves.',
   ideal3:'I will protect even those I hate so long as it is right.',
   ideal4:'(Personal — forgive yourself for past failures)',
   spren:'Honorspren',sprenDesc:'Glowing white-blue humanoids; warlike culture, love of honor. Deeply reluctant to bond post-Recreance.',
   sprenAssist:'Leadership, predicting highstorms, keeping time',
   desc:'Adhesion & Gravitation. Flies where others crawl — protects those who cannot protect themselves.',
   bonus:{str:2,spd:2,int:0,wil:0,awa:0,pre:0},
   abilities:['Basic Lashing (fly/hurl)','Full Lashing (bind objects)','Reverse Lashing','Enhance (STR+1 SPD+1)','Regenerate'],
   dmgBonus:{crit:3,hit:2,miss:0},color:'#5090c8'},
  {id:'skybreaker',name:'Skybreaker',
   philosophy:'I will seek justice.',
   surges:['division','gravitation'],
   ideal1:'Life before death. Strength before weakness. Journey before destination.',
   ideal2:'I swear to seek justice, to let it guide me, until I find a more perfect Ideal.',
   ideal3:'I swear to follow… (a singular authority, code, or person).',
   ideal4:'(Ideal of Crusade — pledge a personal quest to root out systemic injustice)',
   spren:'Highspren',sprenDesc:'Void-like humanoid silhouettes with a starfield within. Can read bonded Radiant thoughts silently.',
   sprenAssist:'Investigating crimes, determining guilt, Intimidation',
   desc:'Division & Gravitation. Law enforcers — rigid, principled, devoted to justice. Flies alongside destroying.',
   bonus:{str:1,spd:2,int:0,wil:0,awa:0,pre:2},
   abilities:['Basic Lashing (flight)','Division (destroy/decay)','Soaring Destruction','Enhance','Regenerate'],
   dmgBonus:{crit:3,hit:2,miss:0},color:'#9060a0'},
  {id:'dustbringer',name:'Dustbringer',
   philosophy:'I will seek self-mastery.',
   surges:['abrasion','division'],
   ideal1:'Life before death. Strength before weakness. Journey before destination.',
   ideal2:'To control my power, I will control myself.',
   ideal3:'To understand my power, I will understand what power is.',
   ideal4:'(Acknowledge obligation — power without responsibility has consequences)',
   spren:'Ashspren',sprenDesc:'Branching electrical scorches. Deeply hostile to humans due to Recreance spren deaths.',
   sprenAssist:'Crafting, setting traps, relevant Lore',
   desc:'Abrasion & Division. Controlled destruction — precision sappers and mobile artillery.',
   bonus:{str:2,spd:1,int:0,wil:0,awa:0,pre:2},
   abilities:['Abrasion (frictionless)','Division (decay/destroy)','Searing Dust Storm','Enhance','Regenerate'],
   dmgBonus:{crit:4,hit:2,miss:0},color:'#c06030'},
  {id:'edgedancer',name:'Edgedancer',
   philosophy:'I will remember.',
   surges:['abrasion','progression'],
   ideal1:'Life before death. Strength before weakness. Journey before destination.',
   ideal2:'I will remember those who have been forgotten.',
   ideal3:'I will listen to those who have been ignored.',
   ideal4:'(Advocate — carry ordinary peoples concerns to those with power)',
   spren:'Cultivationspren',sprenDesc:'Tightly interwoven vines with crystal eyes. Chosen by the Ring (cultivationspren council).',
   sprenAssist:'Insight, finding common ground across cultures',
   desc:'Abrasion & Progression. Servants of the forgotten — healers, rescuers, devoted to the common people.',
   bonus:{str:0,spd:2,int:0,wil:2,awa:1,pre:0},
   abilities:['Abrasion (frictionless motion)','Progression (Regrowth)','Edgedancer Grace','Enhance','Regenerate'],
   dmgBonus:{crit:2,hit:1,miss:1},color:'#40a080'},
  {id:'truthwatcher',name:'Truthwatcher',
   philosophy:'I will seek truth.',
   surges:['illumination','progression'],
   ideal1:'Life before death. Strength before weakness. Journey before destination.',
   ideal2:'I will seek truth wherever it is hidden.',
   ideal3:'I will reveal truth to all who seek it.',
   ideal4:'(Share forbidden knowledge — make it impossible to suppress)',
   spren:'Mistspren',sprenDesc:'Humanoid mist with a translucent porcelain mask. Curious, adventurous, love novelty.',
   sprenAssist:'Persuasion, approaching new experiences, understanding perspectives',
   desc:'Illumination & Progression. Researchers and investigative truth-seekers. Heal and reveal.',
   bonus:{str:0,spd:0,int:2,wil:3,awa:0,pre:0},
   abilities:['Illumination (illusions)','Progression (Regrowth)','Spiritual Healing','Enhance','Regenerate'],
   dmgBonus:{crit:2,hit:1,miss:1},color:'#6090a0'},
  {id:'lightweaver',name:'Lightweaver',
   philosophy:'I will speak my truth.',
   surges:['illumination','transformation'],
   ideal1:'Life before death. Strength before weakness. Journey before destination.',
   ideal2:'(Admit a simple but difficult emotional truth — e.g. "I am afraid")',
   ideal3:'(Confront increasingly painful truths — trauma, identity, ingrained misbeliefs)',
   ideal4:'(Speak the hardest truth you have been avoiding)',
   spren:'Cryptic (liespren)',sprenDesc:'Ever-shifting 3D fractal patterns. Fascinated by "lies" — jokes, fiction, sarcasm. Exceptional code-breakers.',
   sprenAssist:'Deduction (patterns, ciphers), picking locks; after 3rd Ideal: detect lies within bond range',
   desc:'Illumination & Transformation. Artists, entertainers, and spies. Ideals are personal truths, not oaths.',
   bonus:{str:0,spd:1,int:2,wil:0,awa:2,pre:0},
   abilities:['Illumination (Lightweaving)','Transformation (Soulcasting)','Distracting Illusion','Enhance','Regenerate'],
   dmgBonus:{crit:2,hit:1,miss:0},color:'#c09040'},
  {id:'willshaper',name:'Willshaper',
   philosophy:'I will seek freedom.',
   surges:['cohesion','transportation'],
   ideal1:'Life before death. Strength before weakness. Journey before destination.',
   ideal2:'I will seek freedom for those in bondage.',
   ideal3:'I will fight oppression — each Willshaper completes this personally.',
   ideal4:'(Ensure those you freed remain free — ongoing accountability)',
   spren:'Lightspren (Reachers)',sprenDesc:'Bronze humanoids in Cognitive Realm; balls of warm light in Physical. Rhythmic pulse communication. Refuse to bond those who have willingly oppressed others.',
   sprenAssist:'Travel/fair trade tests, Survival',
   desc:'Cohesion & Transportation. Build physical and social structures that enable freedom — liberate the captive.',
   bonus:{str:1,spd:2,int:0,wil:0,awa:2,pre:0},
   abilities:['Cohesion (Stoneshaping)','Transportation (Cognitive Realm)','Spiritual Cohesion','Enhance','Regenerate'],
   dmgBonus:{crit:2,hit:1,miss:0},color:'#c8a030'},
  {id:'elsecaller',name:'Elsecaller',
   philosophy:'I will reach my potential.',
   surges:['transformation','transportation'],
   ideal1:'Life before death. Strength before weakness. Journey before destination.',
   ideal2:'(Personal aspiration declared to inkspren — then pursue that growth)',
   ideal3:'Leave behind what is comfortable.',
   ideal4:'Demand deeper introspection — each Ideal harder than the last.',
   spren:'Inkspren',sprenDesc:'Deep black angular humanoids (can change size). Minimalist speech, unemotional logic. Extreme distrust of humans post-Recreance.',
   sprenAssist:'Deduction, Discipline, Stealth',
   desc:'Transformation & Transportation. Wisest Radiants — logisticians and strategists with the strongest Cognitive Realm connection.',
   bonus:{str:0,spd:0,int:2,wil:2,awa:0,pre:1},
   abilities:['Transformation (Soulcasting)','Transportation (Elsecalling)','Elsecaller Perspicacity','Enhance','Regenerate'],
   dmgBonus:{crit:2,hit:1,miss:0},color:'#3060a0'},
  {id:'stoneward',name:'Stoneward',
   philosophy:'I will be there when needed.',
   surges:['cohesion','tension'],
   ideal1:'Life before death. Strength before weakness. Journey before destination.',
   ideal2:'I will step forward when others fall back.',
   ideal3:'I will be the foundation on which others can build.',
   ideal4:'Acknowledge own needs — know when sacrifice becomes self-destruction.',
   spren:'Peakspren',sprenDesc:'Broad-shouldered stone-like humanoids (7+ ft.). Pacifistic; embittered by Recreance. Can move through and hide within stone.',
   sprenAssist:'Supporting/coordinating groups, Athletics',
   desc:'Cohesion & Tension. Heavy infantry of the Radiants — dependable, stubborn, defined by teamwork.',
   bonus:{str:2,spd:0,int:0,wil:1,awa:0,pre:2},
   abilities:['Cohesion (Stoneshaping)','Tension (rigidity)','Cohesive Teamwork','Enhance','Regenerate'],
   dmgBonus:{crit:2,hit:2,miss:0},color:'#808080'},
];
const SPREN_BONDS={
  windrunner:{name:'Sylphrena',nick:'Syl',stages:['A whisper on the wind follows you...','Syl drifts beside you, curious and cautious.','Syl solidifies into a spear of light. She speaks your name.','Syl argues with you now. She has opinions. Strong ones.','Syl becomes a Shardblade of living silver. She is yours. You are hers.'],color:'#b8d4f0'},
  lightweaver:{name:'Pattern',nick:'Pattern',stages:['Patterns flicker in glass and stone around you...','Pattern hums with mathematical delight on your sleeve.','Pattern speaks in riddles that are also truths.','Pattern confronts you with your own lies. Every one.','Pattern becomes a Shardblade of living crystal. Truth made blade.'],color:'#d4b8f0'},
  edgedancer:{name:'Wyndle',nick:'Wyndle',stages:['A trail of crystalline vines grows where you step...','Wyndle climbs your arm, leaving frost flowers.','Wyndle weeps for those you forget. He makes you remember.','Wyndle grows a garden in your wake. Even in stone.','Wyndle becomes a Shardblade of living jade. Memory made manifest.'],color:'#b8f0d4'},
  stoneward:{name:'Roksel',nick:'Roksel',stages:['The stones remember your footfalls...','Roksel surfaces from the floor, ancient and silent.','Roksel speaks in geological time. Patient. Absolute.','Roksel argues you could do more. Be more. Hold more.','Roksel becomes a Shardblade of living granite. Immovable purpose.'],color:'#d4c8a8'},
  elsecaller:{name:'Ivory',nick:'Ivory',stages:['The Cognitive Realm bleeds at the edges of your vision...','Ivory stands beside you, perfectly still, studying everything.','Ivory corrects you when you are wrong. Always politely. Always.','Ivory opens doors between worlds you did not know existed.','Ivory becomes a Shardblade of living obsidian. Two realms made one.'],color:'#f0d4b8'},
  truthwatcher:{name:'Glys',nick:'Glys',stages:['Voidspren scatter from you like startled fish...','Glys pulses softly, a star between your fingers.','Glys shows you what is real beneath what appears to be.','Glys weeps tears of Stormlight at true things. At beautiful ones.','Glys becomes a Shardblade of living starlight. Truth incarnate.'],color:'#f0f0b8'},
  willshaper:{name:"Lunu'anaki",nick:'Lunu',stages:['The winds carry whispers meant only for you...','Lunu slides into view sideways, as if through a crack in the world.','Lunu laughs at locked doors. Nothing holds you both.','Lunu grows agitated at injustice. She wants to act. Now.','Lunu becomes a Shardblade of living wind. Unchained momentum.'],color:'#b8e8f0'},
  dustbringer:{name:'Spark',nick:'Spark',stages:['Ash falls upward near you sometimes...','Spark crackles with restrained energy, studying your hands.','Spark teaches restraint. Control. The discipline of fire.','Spark burns away your excuses. What remains is clarity.','Spark becomes a Shardblade of living ember. Controlled annihilation.'],color:'#f0c8a0'},
  bondsmith:{name:'The Sibling',nick:'Sibling',stages:['Something ancient stirs in the deep stone. It has noticed you.','The Sibling speaks without words — through vibration, through warmth in the walls.','The Sibling shows you what it means to hold two realms at once. The weight is immense.','The Sibling trusts you with a secret that predates the Desolations.','The Sibling fully awakens. Urithiru breathes again. You are the reason.'],color:'#e8e0c0'},
  skybreaker:{name:'Nale (Highspren)',nick:'Highspren',stages:['The law feels heavier when you are near...','A Highspren circles you, measuring. Judging.','The Highspren names you. You are bound to more than yourself now.','The law is not cruel. It is clear. The Highspren shows you the difference.','The Highspren becomes a Shardblade of living law. Justice given edge.'],color:'#a8c8f0'},
};

// Official Rosharan names from cultural sections
const NPC_M=[
  // Alethi
  'Adelar','Dannic','Elhamir','Janar','Kalith','Lanerin','Nar','Ravir','Rilin','Taren',
  // Azish
  'Arnok','Baxtol','Chivik','Falkir','Ganxir','Hauzir','Koxi','Maliq','Raukir','Sigwir',
  // Herdazian
  'Aloro','Dunal','Duro','Hanol','Jonio','Kunor','Lurio','Luron','Palor','Relio','Sulio',
  // Natan
  'Atarel','Balar','Gerem','Lortan','Talinan','Valten','Xaltor',
  // Listener
  'Bredol','Fenral','Gromil','Jarnak','Koriel','Lurin','Orlan','Saren','Urlan','Varem',
  // Unkalaki (short forms)
  'Harlun','Kalorunel','Unla','Yamloho',
];
const NPC_F=[
  // Alethi
  'Arin','Ersha','Marith','Selith','Tel','Valerin','Varda','Yaladir','Zalith',
  // Azish
  'Adebazik','Dalwa','Etosha','Jirana','Kunde','Nineka','Tama','Wolu','Yemzil',
  // Herdazian
  'Erona','Pinola','Polino','Torona','Yorino',
  // Iriali
  'Byrle','Ilori','Imral','Jyste','Lyre','Lysna','Myi','Rallin','Ynne',
  // Kharbranthian
  'Arivian','Sarvena','Trilam',
  // Listener
  'Eldir','Istarin','Kethan','Nirith','Rishai','Tirith','Welten',
  // Reshi
  'Ashi','Calsi','Fashan','Hailor','Ilesh','Naila','Neshor','Rifta','Sha','Tana','Vara',
  // Shin
  'Shal','Nama','Lanethen',
  // Thaylen
  'Alstrym','Bryndal','Creyn',
  // Veden
  'Dorlivana','Lerinda','Shulla','Varli',
];
// NPC_F now defined above with official names
const NPC_ALL=[...NPC_M,...NPC_F];
const COLORS=[{name:'Amber',hex:'#e8a020'},{name:'Teal',hex:'#12a878'},{name:'Coral',hex:'#d85030'},{name:'Blue',hex:'#2a80d0'},{name:'Purple',hex:'#8060c8'},{name:'Rose',hex:'#c84070'},{name:'Gold',hex:'#BFA15A'},{name:'Sage',hex:'#5a8a5a'}];
const NPC_COLORS=['#8060c8','#c84070','#2a6fa8','#8E6A34','#25956e','#c44a28','#BFA15A','#5a8a5a','#7a9a5a','#a06040'];
const STAT_KEYS=['str','spd','int','wil','awa','pre'];
const STAT_NAMES=['STR','SPD','INT','WIL','AWA','PRE'];
const STAT_FULL=['Strength','Speed','Intellect','Willpower','Awareness','Presence'];

// ══ OFFICIAL COSMERE RPG SKILLS (18) ══
// skill_modifier = skill_ranks + attribute_score
const SKILLS=[
  // Physical
  {id:'agility',    name:'Agility',       attr:'spd', group:'physical'},
  {id:'athletics',  name:'Athletics',     attr:'str', group:'physical'},
  {id:'heavyWeapon',name:'Heavy Weaponry',attr:'str', group:'physical'},
  {id:'lightWeapon',name:'Light Weaponry',attr:'spd', group:'physical'},
  {id:'stealth',    name:'Stealth',       attr:'spd', group:'physical'},
  {id:'thievery',   name:'Thievery',      attr:'spd', group:'physical'},
  // Mental
  {id:'crafting',   name:'Crafting',      attr:'int', group:'mental'},
  {id:'deduction',  name:'Deduction',     attr:'int', group:'mental'},
  {id:'discipline', name:'Discipline',    attr:'wil', group:'mental'},
  {id:'intimidation',name:'Intimidation', attr:'wil', group:'mental'},
  {id:'lore',       name:'Lore',          attr:'int', group:'mental'},
  {id:'medicine',   name:'Medicine',      attr:'int', group:'mental'},
  // Social
  {id:'deception',  name:'Deception',     attr:'pre', group:'social'},
  {id:'insight',    name:'Insight',       attr:'awa', group:'social'},
  {id:'leadership', name:'Leadership',    attr:'pre', group:'social'},
  {id:'perception', name:'Perception',    attr:'awa', group:'social'},
  {id:'persuasion', name:'Persuasion',    attr:'pre', group:'social'},
  {id:'survival',   name:'Survival',      attr:'awa', group:'social'},
];

// Heroic path starting skills (official)
const PATH_SKILLS={
  agent:'insight', envoy:'discipline', hunter:'perception',
  leader:'leadership', scholar:'lore', warrior:'athletics'
};

// Attribute distribution: 12 points, max 3 per attribute at creation
const ATTR_POINTS_START=12;
const ATTR_MAX_CREATE=3;

// ══ DC TABLE (Official Cosmere RPG) ══
const DC={EASY:10, MEDIUM:15, HARD:20, VERY_HARD:25, NEARLY_IMPOSSIBLE:30};

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

// ══ TEN SURGES (Official Chapter 6) ══
// Each is a SKILL with its own attribute
const SURGES=[
  {id:'abrasion',      name:'Abrasion',      attr:'spd', orders:['dustbringer','edgedancer'],
   desc:'Alters friction — nearly eliminates it. Skate surfaces, glide through combat.',
   dmgType:'impact', targetDef:'physDef'},
  {id:'adhesion',      name:'Adhesion',      attr:'pre', orders:['windrunner'],
   desc:'Binds things together via Full Lashings. Stick objects and surfaces to each other.',
   dmgType:'impact', targetDef:'physDef'},
  {id:'cohesion',      name:'Cohesion',      attr:'wil', orders:['stoneward','willshaper'],
   desc:'Alters matter at the particle level — Stoneshaping. Make stone moldable like clay.',
   dmgType:'impact', targetDef:'physDef'},
  {id:'division',      name:'Division',      attr:'int', orders:['dustbringer','skybreaker'],
   desc:'Decays and destroys. Spirit damage. If target reaches 0 HP, they crumble to dust.',
   dmgType:'spirit',  targetDef:'spirDef'},
  {id:'gravitation',   name:'Gravitation',   attr:'awa', orders:['skybreaker','windrunner'],
   desc:'Changes gravity direction and magnitude. Basic Lashings — flight and hurling enemies.',
   dmgType:'impact', targetDef:'physDef'},
  {id:'illumination',  name:'Illumination',  attr:'pre', orders:['lightweaver','truthwatcher'],
   desc:'Creates convincing visual and auditory illusions — Lightweaving.',
   dmgType:'energy', targetDef:'cogDef'},
  {id:'progression',   name:'Progression',   attr:'awa', orders:['edgedancer','truthwatcher'],
   desc:'Controls growth and healing of living things. Regrowth heals; plants grow rapidly.',
   dmgType:'impact', targetDef:'physDef'},
  {id:'tension',       name:'Tension',       attr:'str', orders:['stoneward'],
   desc:'Alters rigidity of objects. Harden cloth to armor, walk on liquids.',
   dmgType:'impact', targetDef:'physDef'},
  {id:'transformation',name:'Transformation',attr:'wil', orders:['elsecaller','lightweaver'],
   desc:'Transforms one material into another — Soulcasting. Spirit damage on living targets.',
   dmgType:'spirit',  targetDef:'spirDef'},
  {id:'transportation',name:'Transportation',attr:'int', orders:['elsecaller','willshaper'],
   desc:'Peer into and transport between the Physical and Cognitive realms — Elsecalling.',
   dmgType:null,      targetDef:'cogDef'},
];

// Surge scaling by rank
const SURGE_SCALE=[
  {rank:1, die:'d4', size:'Small (2.5 ft)'},
  {rank:2, die:'d6', size:'Medium (5 ft)'},
  {rank:3, die:'d8', size:'Large (10 ft)'},
  {rank:4, die:'d10', size:'Huge (15 ft)'},
  {rank:5, die:'d12', size:'Gargantuan (20 ft)'},
];

// Order → surges mapping (official)
const ORDER_SURGES={
  windrunner:   ['adhesion','gravitation'],
  lightweaver:  ['illumination','transformation'],
  edgedancer:   ['abrasion','progression'],
  stoneward:    ['cohesion','tension'],
  elsecaller:   ['transformation','transportation'],
  truthwatcher: ['illumination','progression'],
  willshaper:   ['cohesion','transportation'],
  dustbringer:  ['abrasion','division'],
  skybreaker:   ['division','gravitation'],
};

// ══ CONDITIONS (Official Chapter 9) ══
const CONDITIONS={
  afflicted:   {name:'Afflicted',    desc:'Take specified damage at end of each turn. Stacks separately.'},
  determined:  {name:'Determined',   desc:'Once when you fail a test, add an Opportunity. Then ends.'},
  disoriented: {name:'Disoriented',  desc:"No reactions. Senses always obscured. Perception disadvantage."},
  empowered:   {name:'Empowered',    desc:'Advantage on all tests. Investiture refills each turn. Ends at scene end.'},
  enhanced:    {name:'Enhanced',     desc:'Attribute bonus as specified. Does NOT change derived stats.'},
  exhausted:   {name:'Exhausted',    desc:'−X to all test results. Reduce by 1 per long rest.'},
  focused:     {name:'Focused',      desc:'Focus costs reduced by 1.'},
  immobilized: {name:'Immobilized',  desc:'Movement rate = 0.'},
  prone:       {name:'Prone',        desc:'Slowed. Melee attacks against you gain advantage. Stand up as free action.'},
  restrained:  {name:'Restrained',   desc:'Movement = 0. Disadvantage on all tests except to escape.'},
  slowed:      {name:'Slowed',       desc:'Movement rate halved.'},
  stunned:     {name:'Stunned',      desc:'Lose reactions; gain 2 fewer actions on your turn.'},
  surprised:   {name:'Surprised',    desc:'Lose reactions; gain 1 fewer action. Ends after your next turn.'},
  unconscious: {name:'Unconscious',  desc:'Can take no actions except Breathe Stormlight/Regenerate (Radiants). Prone.'},
  // Legacy status conditions
  poisoned:    {name:'Poisoned',     desc:'Take 1d3+1 vital damage per round. Stacks remaining rounds.'},
  burning:     {name:'Burning',      desc:'Take 1d2+1 energy damage per round. Stacks remaining rounds.'},
  voidCorrupted:{name:'Void Corrupted',desc:'Lose 1 Focus per round from Voidlight taint.'},
};

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
const INJURY_EFFECTS=[
  'Exhausted [−1] (general stamina loss)',
  'Exhausted [−1] (general stamina loss)',
  'Exhausted [−2] (severe stamina loss)',
  'Slowed (injured leg)',
  'Slowed (injured leg)',
  'Disoriented (head injury)',
  'Surprised (shock)',
  'Can only use one hand (injured arm)',
];

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
    else if(roll>=6)  {severity='Shallow Injury';    duration:`${Math.ceil(Math.random()*6)} days`;}
    else if(roll>=1)  {severity='Vicious Injury';    duration:`${Math.ceil(Math.random()*6)+Math.ceil(Math.random()*6)+Math.ceil(Math.random()*6)+Math.ceil(Math.random()*6)+Math.ceil(Math.random()*6)+Math.ceil(Math.random()*6)} days`;}
    else if(roll>=-5) {severity='Permanent Injury';  duration:'permanent';}
    else              {severity='Death';              duration:'permanent';}
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

// ══ WEAPONS (Official Chapter 7) ══
const WEAPONS={
  // Light Weaponry (Speed)
  javelin:    {name:'Javelin',    skill:'lightWeapon', attr:'spd', dmg:'1d6', dmgType:'keen',   traits:['Thrown [30/120]','Indirect']},
  knife:      {name:'Knife',      skill:'lightWeapon', attr:'spd', dmg:'1d4', dmgType:'keen',   traits:['Discreet'],               expertTraits:['Offhand','Thrown [20/60]']},
  mace:       {name:'Mace',       skill:'lightWeapon', attr:'spd', dmg:'1d6', dmgType:'impact', traits:[],                         expertTraits:['Momentum']},
  rapier:     {name:'Rapier',     skill:'lightWeapon', attr:'spd', dmg:'1d6', dmgType:'keen',   traits:['Quickdraw'],              expertTraits:['Defensive']},
  shortspear: {name:'Shortspear', skill:'lightWeapon', attr:'spd', dmg:'1d8', dmgType:'keen',   traits:['Two-Handed'],             expertTraits:['Loses Two-Handed']},
  sidesword:  {name:'Sidesword',  skill:'lightWeapon', attr:'spd', dmg:'1d6', dmgType:'keen',   traits:['Quickdraw'],              expertTraits:['Offhand']},
  staff:      {name:'Staff',      skill:'lightWeapon', attr:'spd', dmg:'1d6', dmgType:'impact', traits:['Discreet','Two-Handed'],  expertTraits:['Defensive']},
  shortbow:   {name:'Shortbow',   skill:'lightWeapon', attr:'spd', dmg:'1d6', dmgType:'keen',   traits:['Two-Handed','Ranged [80/320]'], expertTraits:['Quickdraw']},
  sling:      {name:'Sling',      skill:'lightWeapon', attr:'spd', dmg:'1d4', dmgType:'impact', traits:['Discreet','Ranged [30/120]'],  expertTraits:['Indirect']},
  // Heavy Weaponry (Strength)
  axe:        {name:'Axe',        skill:'heavyWeapon', attr:'str', dmg:'1d6', dmgType:'keen',   traits:['Thrown [20/60]'],         expertTraits:['Offhand']},
  greatsword: {name:'Greatsword', skill:'heavyWeapon', attr:'str', dmg:'1d10',dmgType:'keen',   traits:['Two-Handed'],             expertTraits:['Deadly']},
  hammer:     {name:'Hammer',     skill:'heavyWeapon', attr:'str', dmg:'1d10',dmgType:'impact', traits:['Two-Handed'],             expertTraits:['Momentum']},
  longspear:  {name:'Longspear',  skill:'heavyWeapon', attr:'str', dmg:'1d8', dmgType:'keen',   traits:['Two-Handed','Melee [+5]'],expertTraits:['Defensive']},
  longsword:  {name:'Longsword',  skill:'heavyWeapon', attr:'str', dmg:'1d8', dmgType:'keen',   traits:['Quickdraw','Two-Handed'], expertTraits:['Loses Two-Handed']},
  poleaxe:    {name:'Poleaxe',    skill:'heavyWeapon', attr:'str', dmg:'1d10',dmgType:'keen',   traits:['Two-Handed'],             expertTraits:['Melee [+5]']},
  shield:     {name:'Shield',     skill:'heavyWeapon', attr:'str', dmg:'1d4', dmgType:'impact', traits:['Defensive'],              expertTraits:['Offhand']},
  crossbow:   {name:'Crossbow',   skill:'heavyWeapon', attr:'str', dmg:'1d8', dmgType:'keen',   traits:['Loaded [1]','Two-Handed','Ranged [100/400]'], expertTraits:['Deadly']},
  longbow:    {name:'Longbow',    skill:'heavyWeapon', attr:'str', dmg:'1d6', dmgType:'keen',   traits:['Two-Handed','Ranged [150/600]'],              expertTraits:['Indirect']},
  // Special
  unarmed:    {name:'Unarmed',    skill:'athletics',   attr:'str', dmg:'1d4', dmgType:'impact', traits:['Momentum','Offhand']},
  halfShard:  {name:'Half-Shard', skill:'heavyWeapon', attr:'str', dmg:'2d4', dmgType:'impact', traits:['Defensive','Two-Handed'], charges:1, special:'deflect+10'},
  shardblade: {name:'Shardblade', skill:'heavyWeapon', attr:'str', dmg:'2d8', dmgType:'spirit', traits:['Dangerous','Deadly'],    special:'spiritualInjury'},
  warhammer:  {name:'Warhammer',  skill:'heavyWeapon', attr:'str', dmg:'2d10',dmgType:'impact', traits:['Cumbersome [5]','Two-Handed']},
  grandbow:   {name:'Grandbow',   skill:'heavyWeapon', attr:'str', dmg:'2d6', dmgType:'keen',   traits:['Cumbersome [5]','Two-Handed','Ranged [200/800]']},
};

// ══ ARMOR (Official Chapter 7) ══
const ARMORS={
  uniform:    {name:'Uniform',    deflect:0, traits:['Presentable']},
  leather:    {name:'Leather',    deflect:1, traits:[],           expertTraits:['Presentable']},
  chain:      {name:'Chain',      deflect:2, traits:['Cumbersome [3]'], expertTraits:['Loses Cumbersome']},
  breastplate:{name:'Breastplate',deflect:2, traits:['Cumbersome [3]'], expertTraits:['Presentable']},
  halfPlate:  {name:'Half Plate', deflect:3, traits:['Cumbersome [4]'], expertTraits:['Cumbersome [3] instead']},
  fullPlate:  {name:'Full Plate', deflect:4, traits:['Cumbersome [5]']},
  shardplate: {name:'Shardplate', deflect:5, traits:['Dangerous','Unique'], charges:4, bonus:{str:2,spd:2}, special:'shardplateCharges'},
};

// ══ STARTING KITS (Official Chapter 7) ══
const STARTING_KITS=[
  {id:'academic',   name:'Academic',   weapons:['knife'],         armor:'uniform',  spheres:'3d12',
   extras:['Books and ink','Reference book'],                     expertise:'Literature',
   desc:'Scholar or professional — knowledge is your sharpest weapon.'},
  {id:'artisan',    name:'Artisan',    weapons:['hammer','knife'], armor:'leather',  spheres:'4d8',
   extras:['Instruments','Surgical supplies','Scale'],             expertise:null,
   desc:'Craftsperson, healer, or entertainer.'},
  {id:'military',   name:'Military',   weapons:['longsword','knife'],armor:'chain',  spheres:'2d6',
   extras:['Rations (5 days)','Whetstone','Blanket'],              expertise:'Military Life',
   desc:'Trained soldier. Disciplined, equipped, reliable.'},
  {id:'courtier',   name:'Courtier',   weapons:['sidesword'],     armor:'uniform',  spheres:'4d20',
   extras:['Fine clothing'],                                       expertise:'High Society',
   bonus:'Noble patron connection',
   desc:'Noble-adjacent operative. Money and connections open doors.'},
  {id:'prisoner',   name:'Prisoner',   weapons:[],                armor:null,       spheres:'0',
   extras:[],                                                      expertise:null,
   bonus:'Connected to a Radiant spren (2 milestones toward First Ideal)',
   desc:'Nothing but your wits and a debt to the universe.'},
  {id:'underworld', name:'Underworld', weapons:['knife','knife'],  armor:'leather',  spheres:'1d20',
   extras:['Lockpick','Crowbar','Rope (50 ft.)','Alcohol','5 days food'],expertise:'Underworld',
   desc:'Criminal, mercenary, or survivor. You know how the real world works.'},
];

// ══ CURRENCY (Spheres — Official Chapter 7) ══
const GEMSTONES={
  diamond:  {chip:0.2, mark:1,  broam:4},
  garnet:   {chip:1,   mark:5,  broam:20},
  ruby:     {chip:2,   mark:10, broam:40},
  amethyst: {chip:5,   mark:25, broam:100},
  emerald:  {chip:10,  mark:50, broam:200},
};
function formatMarks(mk){
  if(!mk||mk<1)return mk+'mk';
  if(mk>=200)return Math.floor(mk/4)+'b '+Math.round(mk%4)+'m'; // broams + marks
  return mk+'mk';
}

// ══ SPREN APPEARANCES (Official Chapter 13 — for GM flavor) ══
const SPREN_APPEARANCES={
  angerspren:       'Red pool bubbling at your feet',
  anticipationspren:'Red streamers drifting in the air',
  creationspren:    'Silvery shapes constantly shifting form',
  fearspren:        'Violet blobs wriggling upward',
  gloryspren:       'Golden orbs slowly circling you',
  joyspren:         'Blue leaves swirling in an invisible wind',
  painspren:        'Orange hands grasping upward from the floor',
  shamespren:       'Red and white petals falling from above',
  flamespren:       'Dancing humanoid figures in any nearby fire',
  lifespren:        'Glowing green specks near living plants',
  rainspren:        'Blue candles with a single watching eye',
  windspren:        'Ribbons of light dancing in the wind',
};

// ══ ADVERSARY ROLES (Official Chapter 13) ══
const ADVERSARY_ROLES={
  minion:  {name:'Minion', healthMult:0.5, threat:0.5, noCrit:true,
            rule:'Immediately defeated when suffering an injury (PC decides: dead or unconscious)'},
  rival:   {name:'Rival',  healthMult:1,   threat:1,   noCrit:false, rule:'Standard adversary rules'},
  boss:    {name:'Boss',   healthMult:2,   threat:4,
            rule:'Takes a fast AND slow turn each round; can spend 1 focus for extra action or to remove a condition'},
};

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

// ══ COMBAT OPPORTUNITY/COMPLICATION tables (Official Chapter 10) ══
const COMBAT_OPPS=[
  'Friendly reinforcements arrive',
  'Wounded enemy flees or surrenders',
  'Innocent bystander escapes',
  'Enemy is distracted — your next attack gains advantage',
  'Enemy drops their weapon or gear',
  'Spot a useful vantage point or resource',
  'Spot infused spheres on an enemy — you can draw Stormlight',
  'A spren helps you in a key moment',
  'Brief respite — recover 1 focus',
  'Spot a hidden opponent — reveal to allies',
  'Enemy accidentally reveals a secret',
  'Buy time — the goal becomes less urgent',
];
const COMBAT_COMPS=[
  'Enemy reinforcements arrive',
  'An ally trips — they fall Prone',
  'An ally or innocent is endangered and must be saved',
  'Enemy is alerted to your presence',
  'You or an ally drops or damages equipment',
  'Rain picks up — battlefield navigation becomes harder',
  'Nearby spheres go dun — a Radiant loses Stormlight access',
  'A spren is distracted — cannot help in this key moment',
  'A guard spots you — no advantage on surprise',
  'An enemy slips away — no Reactive Strike',
  'The stakes rise — the goal becomes more urgent',
];

// ══ GOALS/PURPOSE/OBSTACLE (Official Chapter 8) ══
const PURPOSES=[
  'Save Others — defend those who cannot protect themselves',
  'Seek Truth — insatiable curiosity about the world',
  'Push Yourself to New Heights — discover and surpass your limits',
  'Find Connection — define yourself by your relationships',
  'Seek Justice — injustice in any form is intolerable',
  'Preserve Life — all life has intrinsic value',
];
const OBSTACLES=[
  'Deep Regret — something weighs heavily on your conscience',
  'Specific Fear — a particular fear that returns unbidden',
  'Spite — petty grudges, volatile temper, impulsiveness',
  'Self-Doubt — trouble believing in yourself',
  'Mistrust of Others — you push people away to avoid disappointment',
];

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
const ROSHAR_P=['Urithiru','Shattered Plains','Kholinar','Kharbranth','Thaylen City','Azimir','Purelake','Hearthstone','Rathalas','Reshi Isles','Aimia (Akinah)','Frostlands','Bavland','Herdaz','Jah Keved','Alethkar','Tukar','Triax','Liafor','Emul','Marat'];
const ROSHAR_O=['Braize (Damnation)','Ashyn — the Burning Planet','Aimian Sea','Godforge'];
const ROSHAR_S=['Shadesmar — Sea of Regret','Shadesmar — Sea of Souls','Shadesmar — Sea of Lost Lights','Nexus of Imagination','Nexus of Truth','Nexus of Transition',"Honor's Perpendicularity","Cultivation's Perpendicularity"];
const ROSHAR_L=['The Honor Chasm','Feverstone Keep','Stormseat (Narak)'];
const ALL_LOCS=[...ROSHAR_P,...ROSHAR_O,...ROSHAR_S,...ROSHAR_L];
const BASE_ACTS=[{num:1,tag:'Act I',start:0,end:59},{num:2,tag:'Act II',start:60,end:119},{num:3,tag:'Act III',start:120,end:179}];
let ACTS=BASE_ACTS.map(a=>({...a,name:a.tag,location:'Roshar'}));
const BLADE_TIERS=['Nascent','Bonded','Ancient','Living','Divine'];

// ══ HERO ROLES ══
// ══ ANCESTRY (Official Cosmere RPG) ══
// Step 1: Choose ancestry (Human or Singer) — affects talents and size
const ANCESTRIES=[
  {
    id:'human',
    name:'Human',
    desc:'The majority species on Roshar. Adaptable, diverse, and widespread across many nations.',
    size:'Medium',
    bonusTalentSource:'heroic path',
    bonusTalentTiers:[1,6,11,16,21], // levels at which bonus talents are gained
    color:'var(--amber2)',
  },
  {
    id:'singer',
    name:'Singer',
    desc:'The indigenous people of Roshar. Can bond spren and change forms during highstorms, temporarily amplifying different abilities.',
    size:'Medium',
    bonusTalentSource:'singer tree or heroic path',
    bonusTalentTiers:[6,11,16,21], // level 1 gets Change Form key + one bonus form
    keyTalent:'changeForm',
    color:'var(--teal2)',
  },
];

// ══ CULTURAL EXPERTISES (Official — up to 2 chosen at creation + INT score extras) ══
const CULTURES=[
  {id:'alethi',     name:'Alethi',       region:'Alethkar',       lang:'Alethi / Glyphs',
   desc:'War-driven monarchy. Strict gender roles, Vorin faith, lighteyes/darkeyes caste system.',
   expertise:'Know princedoms, navigate Alethi society, Vorin tenets. Strong warrior tradition.',
   color:'#c44a28'},
  {id:'azish',      name:'Azish',        region:'Azir / Azish Empire', lang:'Azish (spoken/signed/written)',
   desc:'Bureaucratic empire led by Prime Aqasix and viziers. Procedure and official debate valued.',
   expertise:'Navigate civic bureaucracy, file complaints, recall Azish law and Kadasixes.',
   color:'#5a9e8f'},
  {id:'herdazian',  name:'Herdazian',    region:'Herdaz',         lang:'Herdazian / Glyphs',
   desc:'Ranching nation with large diaspora. Close-knit community, Vorin faith, crystalline nails.',
   expertise:'Ranch navigation, sparkflickers, Herdazian Vorinism. Resist native Roshar poisons.',
   color:'#BA7517'},
  {id:'iriali',     name:'Iriali',       region:'Iri',            lang:'Iri',
   desc:'Offworlder descendants following the Long Trail religion. Journey and diversity valued.',
   expertise:'Travel strategies, Iriali Triumvirate knowledge, One/Long Trail faith.',
   color:'#d4a820'},
  {id:'kharbranthian',name:'Kharbranthian',region:'Kharbranth',   lang:'Kharbranthian / Glyphs',
   desc:'City of Bells — academic and medical hub. Free healthcare, the Palanaeum library.',
   expertise:'Medical knowledge, major education systems, rotspren hygiene, Vorin tenets.',
   color:'#7a9e9f'},
  {id:'listener',   name:'Listener',     region:'Shattered Plains',lang:'Listener language / Rhythms',
   desc:'Independent singers who defied Odium. Keepers of songs preserving lost forms.',
   expertise:'Know five listener forms, listener council, Shattered Plains ecology, War of Reckoning.',
   singerOnly:true,
   color:'#8a6f9e'},
  {id:'natan',      name:'Natan',        region:'New Natanan',    lang:'Natan / Vorin language',
   desc:'Remnant of a destroyed empire. Nomadic people with pale blue skin and white hair.',
   expertise:'Highstorm potency and defenses, Natan history, reverence for the moons.',
   color:'#a0b0c0'},
  {id:'reshi',      name:'Reshi',        region:'Reshi Isles',    lang:'Reshi',
   desc:'Island nation worshipping Tai-na greatshells as gods. Sharp, quick-resolved conflicts.',
   expertise:'Tai-na ecology, stationary island locations, Reshi Sea resources.',
   color:'#4a9e7a'},
  {id:'shin',       name:'Shin',         region:'Shinovar',       lang:'Shin',
   desc:'Isolated nation where farmers are revered and warriors disgraced. Stone is sacred.',
   expertise:'Stone Shamanism, Shinovar ecology, bartering by diminishing perceived value.',
   color:'#8fa870'},
  {id:'thaylen',    name:'Thaylen',      region:'Thaylenah',      lang:'Thaylen',
   desc:'Trade-focused island nation. Merchant councils, fabrials as everyday life, flexible Vorinism.',
   expertise:'Merchant guilds, fabrial knowledge, sea travel, the Passions.',
   color:'#9b7bb8'},
  {id:'unkalaki',   name:'Unkalaki',     region:'Horneater Peaks',lang:'Unkalaki',
   desc:'Mountain peaks with warm crater lakes. Horneater teeth can crush cremling shells.',
   expertise:'Peak ecology, thin-air acclimation, water gods worship, Sighted phenomenon.',
   color:'#b07050'},
  {id:'veden',      name:'Veden',        region:'Jah Keved',      lang:'Veden / Alethi (mutual)',
   desc:'Kingdom with Vorin faith. Multiple ethnic groups, Holy Enclave in Valath.',
   expertise:'Jah Keved princedoms, four ethnic groups, Vorin church, Veden/Alethi language.',
   color:'#c07090'},
  {id:'wayfarer',   name:'Wayfarer',     region:'Traveling',      lang:'Basic greetings, many nations',
   desc:'No fixed home. Perpetual traveler — mercenary, tourist, or exile.',
   expertise:'International map reading, currency exchange, land and sea routes, storm shelters.',
   color:'#909090'},
  {id:'underworld', name:'Underworld',   region:'Various',        lang:'Varies',
   desc:'Criminal network, black markets, and illicit organizations across Roshar.',
   expertise:'Black market contacts, criminal codes, fence networks, avoiding authorities.',
   color:'#606060'},
  {id:'highsociety',name:'High Society', region:'Various',        lang:'Varies',
   desc:'Noble courts, formal etiquette, political intrigue across the nations of Roshar.',
   expertise:'Court etiquette, noble houses, political alliances, formal protocol.',
   color:'#BFA15A'},
  {id:'military',   name:'Military Life',region:'Various',        lang:'Varies',
   desc:'Army service, bridge crews, soldier training. Know how soldiers think and fight.',
   expertise:'Military ranks, formations, camp life, supply logistics, soldier culture.',
   color:'#c44a28'},
];

// ══ SINGER FORMS (Official — Change Form talent tree) ══
const SINGER_FORMS={
  // Base forms (Change Form key)
  dullform:{name:'Dullform',type:'base',bonuses:{},
    desc:'No specialized spren bond. Can pass as a "parshman" in human societies.'},
  mateform:{name:'Mateform',type:'base',bonuses:{},spren:'lifespren',
    desc:'Bonded with a lifespren. Specialized for reproduction.'},
  // Forms of Finesse
  artform:{name:'Artform',type:'finesse',bonuses:{awa:1},spren:'creationspren',
    focus:0,desc:'Awareness +1. Expertises in Painting and Music. Advantage on Crafting and entertainment tests.'},
  nimbleform:{name:'Nimbleform',type:'finesse',bonuses:{spd:1},spren:'windspren',
    focusBonus:2,desc:'Speed +1. Focus +2 while in this form.'},
  // Forms of Resolve
  warform:{name:'Warform',type:'resolve',bonuses:{str:1},spren:'painspren',
    deflect:1,desc:'Strength +1. Deflect +1. Jump up to movement rate horizontally.'},
  workform:{name:'Workform',type:'resolve',bonuses:{wil:1},spren:'gravitationspren',
    desc:'Willpower +1. Ignore Exhausted condition. Can disguise as parshman.'},
  // Forms of Wisdom
  mediationform:{name:'Mediationform',type:'wisdom',bonuses:{pre:1},spren:'bindspren',
    desc:'Presence +1. Aid reaction costs no focus.'},
  scholarform:{name:'Scholarform',type:'wisdom',bonuses:{int:1},spren:'logicspren',
    desc:'Intellect +1. Gain one temporary expertise and one temporary skill rank.'},
  // Forms of Destruction (requires Ambitious Mind)
  direform:{name:'Direform',type:'destruction',bonuses:{str:2},spren:'callousspren',
    deflect:2,desc:'Strength +2. Deflect +2. Reactive Strikes can Grapple instead of attack.'},
  stormform:{name:'Stormform',type:'destruction',bonuses:{str:1,spd:1},spren:'stormspren',
    deflect:1,special:'unleashLightning',
    desc:'Strength +1, Speed +1, Deflect +1. Unleash Lightning: 2d8 energy damage, 60ft, Disorient.'},
  // Forms of Expansion (requires Ambitious Mind)
  envoyform:{name:'Envoyform',type:'expansion',bonuses:{int:1,pre:1},spren:'zealspren',
    desc:'Intellect +1, Presence +1. Understand all languages. Advantage on Insight tests.'},
  relayform:{name:'Relayform',type:'expansion',bonuses:{spd:2},spren:'hastespren',
    desc:'Speed +2. Ignore Slowed. Spend 1 focus for advantage on Agility/Stealth/Thievery.'},
  // Forms of Mystery (requires Ambitious Mind)
  decayform:{name:'Decayform',type:'mystery',bonuses:{wil:2},spren:'blightspren',
    special:'decayingTouch',desc:'Willpower +2. Prevent adjacent character from recovering HP/Focus.'},
  nightform:{name:'Nightform',type:'mystery',bonuses:{awa:1,int:1},spren:'nightspren',
    focusBonus:2,special:'intervening Premonitions',
    desc:'Awareness +1, Intellect +1. Focus +2. Preroll 2d20s each session to replace rolls.'},
};

const HERO_ROLES=[
  // ══ OFFICIAL HEROIC PATHS (Chapter 4) ══
  {id:'agent', name:'Agent', icon:'🗡',
   keyTalent:'Opportunist',
   keyTalentDesc:'Once per round, reroll your plot die. The original roll has no effect.',
   startingSkill:'insight',
   specialties:['Investigator','Spy','Thief'],
   buildAttrs:['awa','int','spd'],
   buildSkills:['Agility','Deception','Deduction','Insight','Light Weaponry','Thievery'],
   multiPath:['Hunter','Scholar'],
   desc:'A talented operative who solves problems with a keen mind or deft hand.',
   bonus:{awa:2,spd:1}, ideal:'Every lock has a key. I just find them faster.',
   color:'#7a6e5a'},
  {id:'envoy', name:'Envoy', icon:'🎭',
   keyTalent:'Rousing Presence',
   keyTalentDesc:'Choose an ally you can influence — they become Determined until they benefit from it or the scene ends.',
   startingSkill:'discipline',
   specialties:['Diplomat','Faithful','Mentor'],
   buildAttrs:['pre','wil'],
   buildSkills:['Discipline','Deception','Leadership','Lore','Persuasion'],
   multiPath:['Leader','Scholar'],
   desc:'An insightful negotiator who adeptly influences others.',
   bonus:{pre:2,wil:1}, ideal:'Words are the sharpest weapons. Mine never miss.',
   color:'#9b7bb8'},
  {id:'hunter', name:'Hunter', icon:'🏹',
   keyTalent:'Seek Quarry',
   keyTalentDesc:'Choose a character as your quarry. Gain advantage on all tests to find, attack, or study them.',
   startingSkill:'perception',
   specialties:['Archer','Assassin','Tracker'],
   buildAttrs:['awa','str','spd'],
   buildSkills:['Agility','Perception','Stealth','Survival','Light Weaponry','Heavy Weaponry'],
   multiPath:['Warrior','Agent'],
   desc:'A skilled sharpshooter and outdoorsperson who seeks and eliminates problems.',
   bonus:{awa:2,spd:1}, ideal:'I always find what I hunt.',
   color:'#6a8a5a'},
  {id:'leader', name:'Leader', icon:'⚔',
   keyTalent:'Decisive Command',
   keyTalentDesc:'Gain a command die (d4). Spend 1 focus to give an ally your command die — they roll it with any one test before their next turn ends.',
   startingSkill:'leadership',
   specialties:['Champion','Officer','Politico'],
   buildAttrs:['pre','str','wil'],
   buildSkills:['Athletics','Deception','Heavy Weaponry','Intimidation','Leadership','Persuasion'],
   multiPath:['Warrior','Envoy'],
   desc:'A poised commander who directs and guides others to be their best.',
   bonus:{pre:2,str:1}, ideal:'My people fight better when I stand with them.',
   color:'#c44a28'},
  {id:'scholar', name:'Scholar', icon:'📜',
   keyTalent:'Erudition',
   keyTalentDesc:'Choose one cultural or utility expertise and two non-surge cognitive skills — you count as having them temporarily. Reassign after a long rest with library access.',
   startingSkill:'lore',
   specialties:['Artifabrian','Strategist','Surgeon'],
   buildAttrs:['int','pre','spd'],
   buildSkills:['Crafting','Deduction','Lore','Medicine'],
   multiPath:['Agent','Envoy'],
   desc:'An adroit thinker who excels at planning and building.',
   bonus:{int:2,wil:1}, ideal:'Knowledge is the only power that cannot be taken away.',
   color:'#5a9e8f'},
  {id:'warrior', name:'Warrior', icon:'🛡',
   keyTalent:'Vigilant Stance',
   keyTalentDesc:'Learn fighting stances. Begin with Vigilant Stance: reduce focus cost of Dodge and Reactive Strike by 1. Enter known stances as a free action.',
   startingSkill:'athletics',
   specialties:['Duelist','Shardbearer','Soldier'],
   buildAttrs:['spd','str','awa','wil'],
   buildSkills:['Athletics','Light Weaponry','Heavy Weaponry','Intimidation','Leadership','Persuasion'],
   multiPath:['Leader','Hunter'],
   desc:'A fighter who relies on their skill, brute strength, or indomitable will.',
   bonus:{str:2,spd:1}, ideal:'I have survived worse. I will survive this.',
   color:'#8a7060'},
];

// ══ HERO WEAPONS ══
const HERO_WEAPONS=[
  {id:'sword',name:'Dueling Sword',type:'Blade',dmgBonus:{crit:3,hit:2,miss:0},desc:'Alethi noble training. Precise and lethal.',tiers:['Honed','Tempered','Master-forged','Named','Legendary']},
  {id:'hammer',name:'War Hammer',type:'Blunt',dmgBonus:{crit:4,hit:2,miss:0},desc:'Breaks armor and morale equally.',tiers:['Weighted','Reinforced','Iron-bound','Legendary','Worldbreaker']},
  {id:'spear',name:'Spear & Shield',type:'Polearm',dmgBonus:{crit:2,hit:2,miss:0},desc:'Disciplined, reliable. +1 defense each round.',tiers:['Sharpened','Balanced','Battle-tested','Named','Eternal Guard']},
  {id:'bow',name:'Shortbow',type:'Ranged',dmgBonus:{crit:3,hit:1,miss:0},desc:'First strike advantage. Keeps distance.',tiers:['Strung tight','Balanced','Recurved','Hawkeye','Deadeye']},
  {id:'knives',name:'Twin Knives',type:'Dual',dmgBonus:{crit:3,hit:2,miss:0},desc:'Unpredictable. Bonus on fumble recovery.',tiers:['Sharpened','Balanced','Paired','Shadow-swift','Ghost-edged']},
  {id:'gauntlet',name:'Fabrial Gauntlet',type:'Artifabrian',dmgBonus:{crit:2,hit:2,miss:1},desc:'Scholar-built. Bonus to INT actions.',tiers:['Calibrated','Tuned','Refined','Masterwork','Transcendent']},
  {id:'unarmed',name:'Bare Hands',type:'Unarmed',dmgBonus:{crit:2,hit:2,miss:0},desc:'Cannot be disarmed. +END bonus.',tiers:['Calloused','Hardened','Iron-fist','Horneater-trained','Unmovable']},
  {id:'shardfork',name:'Shardfork',type:'Improvised',dmgBonus:{crit:5,hit:1,miss:0},desc:'Random chaos. Do not ask.',tiers:['Bent','Slightly less bent','Inexplicably sharp','Legendary','Unknowable']},
];

const WEAPON_PREFIXES=['Iron','Ash','Silver','Copper','Bronze','Obsidian','Granite','Storm','Crest','Ember'];
const WEAPON_SUFFIXES=['mark','fall','watch','hold','edge','strike','ward','crest','fang','point'];
function genWeaponName(weaponId){
  const pre=WEAPON_PREFIXES[Math.floor(Math.random()*WEAPON_PREFIXES.length)];
  const suf=WEAPON_SUFFIXES[Math.floor(Math.random()*WEAPON_SUFFIXES.length)];
  return pre+suf;
}

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
const ORDER_OATHS={
  windrunner:['Life before death, strength before weakness, journey before destination.','I will protect those who cannot protect themselves.','I will protect even those I hate, so long as it is right.','I accept that there will be those I cannot protect.','I will protect those I hate. Even if it destroys me.'],
  lightweaver:['I will seek truth.','I acknowledge my flaws.','I will accept what I am.','I will not hide from myself.','I am what I am.'],
  edgedancer:['I will remember those who have been forgotten.','I will listen to those who have been ignored.','I will protect even the least of those in my care.','I will remember all.','I will never forget.'],
  stoneward:['I will be there when I am needed.','I will not give up.','I will bear what must be borne.','I will hold firm.','I will be the rock on which others stand.'],
  elsecaller:['I will seek knowledge.','I will improve myself.','I will push my limits.','I will not be held back.','I have exceeded what I was.'],
  truthwatcher:['I will seek what is true.','I will not deceive myself.','I will see clearly.','I will share what I know.','Truth is the only shield.'],
  willshaper:['I will seek freedom.','I will free those who are bound.','I will forge my own path.','I will not be constrained.','I am unbound.'],
  dustbringer:['I will seek change.','I will burn away the old.','I will embrace destruction in service of creation.','I will unmake what must be unmade.','From ash, something new.'],
  bondsmith:['I will unite instead of divide.','I will take responsibility for what I have done.','I will listen, and then I will act.','I will unite even those who do not want to be united.','I am the one who connects.'],
  skybreaker:['I will follow the law.','I will protect the law.','I will be the law.','The law is absolute.','Justice is mine to deliver.'],
};

const OATH_BONUSES={
  1:{desc:'First Oath spoken',combat:0,heal:0},
  2:{desc:'Shardblade manifests',combat:1,heal:0},
  3:{desc:'Surges strengthen',combat:1,heal:1,ability:'Enhanced surge control'},
  4:{desc:'Shardplate begins forming',combat:2,heal:2,ability:'Partial Shardplate'},
  5:{desc:'Full Radiant',combat:3,heal:3,ability:'Full power — Shardplate complete'},
};

// ══ CHARACTER ADVANCEMENT (Official Cosmere RPG) ══
const ADVANCEMENT={
  // level: {attrPoint, hpGain formula key, maxSkillRank, skillRanks, talentNote}
  1: {attr:false, hpBase:true,  maxSkill:2},
  2: {attr:false, hpGain:5,     maxSkill:2},
  3: {attr:true,  hpGain:5,     maxSkill:2},
  4: {attr:false, hpGain:5,     maxSkill:2},
  5: {attr:false, hpGain:5,     maxSkill:2},
  6: {attr:true,  hpGain:'4+str',maxSkill:3},
  7: {attr:false, hpGain:4,     maxSkill:3},
  8: {attr:false, hpGain:4,     maxSkill:3},
  9: {attr:true,  hpGain:4,     maxSkill:3},
  10:{attr:false, hpGain:4,     maxSkill:3},
};

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

const ORDER_IDEALS={
  windrunner:{words:['protect','shield','guard','defend','save','sacrifice','stand'],ideal:'I will protect those who cannot protect themselves'},
  edgedancer:{words:['remember','forgotten','heal','tend','notice','acknowledge','care'],ideal:'I will remember those who have been forgotten'},
  lightweaver:{words:['truth','lie','illusion','art','create','deceive','reveal'],ideal:'I am who I needed when I was young'},
  stoneward:{words:['reliable','present','there','stand','endure','hold','refuse'],ideal:'I will be there when I am needed'},
  elsecaller:{words:['potential','learn','grow','knowledge','seek','study','reach'],ideal:'I will reach my potential so I may help others'},
  truthwatcher:{words:['truth','see','perceive','observe','find','uncover','witness'],ideal:'I will seek truth even when it is painful'},
  willshaper:{words:['freedom','chain','bound','free','choice','will','refuse'],ideal:'I will seek freedom for those in bondage'},
  dustbringer:{words:['master','control','discipline','self','restrain','overcome'],ideal:'I will seek self-mastery above all else'},
  bondsmith:{words:['unite','connect','bridge','together','bond','join','repair'],ideal:'I will unite instead of divide'},
  skybreaker:{words:['law','justice','right','wrong','judgement','sentence','execute'],ideal:'I will put the law before all else'},
};
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
const HOID_LINES=[
  "A man nearby catches your eye — disheveled coat, knowing smile. He tips an invisible hat and walks into a crowd that wasn't there a moment ago.",
  "Someone has left a note tucked under a stone. It reads: 'You are asking the wrong questions. The right ones are more dangerous.' No signature.",
  "A gleeman passes through — except gleemen are rare this far from civilization. He plays one chord that somehow says everything about your situation, and leaves before you can ask.",
  "You find a single white flower pressed into a crack in the stone. It shouldn't be able to grow here. Someone left it intentionally.",
  "A voice at the edge of hearing, not directed at you, but clearly meant for you: 'The most important things are always happening just out of sight.' Then silence.",
  "A beggar holds a cup but asks for nothing. When your eyes meet, he says exactly one word — a word relevant to your situation — then looks away and is gone.",
  "Someone has written in the dust: SURVIVE. Just that. The finger-strokes are too precise to be accidental.",
  "A child hands you something — a rock, a feather, an object that means nothing — and says 'he said you'd need this eventually,' then runs before you can ask who.",
  "The fire pops and for a fraction of a second the smoke forms the shape of a face you almost recognize. Then it's just smoke.",
  "You catch a fragment of a story someone is telling nearby: '...and the hero never realized the clue was in what they didn't see...' They stop when they notice you listening.",
];

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

// ══ COMBAT SYSTEM CONSTANTS ══
const COMBAT_BEATS_MIN=3, COMBAT_BEATS_MAX=8;

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


const BLADE_NAMES={windrunner:'Silverwind Blade',lightweaver:'Illusory Edge',edgedancer:'Verdant Blade',stoneward:'Granite Shardblade',elsecaller:'Obsidian Catalyst',truthwatcher:'Starlight Blade',willshaper:'Freedom Edge',dustbringer:'Ember Blade',bondsmith:'Sibling-Touched Blade',skybreaker:'Law Blade'};

// ── MUTABLE STATE ─────────────────────────────────────────────
let gState    = null;   // Full campaign game state from Sheets
let myChar    = null;   // This player's character object
let mySlot    = null;   // Slot index for this player
let selClass  = null;   // Selected class during creation
let selColor  = null;   // Selected color during creation
let rolledStats = null; // Stats from character creation
let selActionText = '';
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
let voiceActive = false, voiceEnabled = true, currentUtterance = null;
const autoSpeak = false;

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
