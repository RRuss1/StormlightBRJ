// ═══════════════════════════════════════════════════════════════════════════
// Stormlight Chronicles — System Data
// All Stormlight-specific data extracted from gameState.js into a single
// portable object. This file is the canonical source for world data,
// character options, combat tables, lore, and progression for the
// Stormlight Chronicles system.
// ═══════════════════════════════════════════════════════════════════════════

window.StormlightSystem = {

  // ── Metadata ──────────────────────────────────────────────────────────
  id: 'stormlight',
  name: 'Stormlight Chronicles',
  subtitle: 'A Saga of the Shattered Plains',
  tagline: '"Life before death. Strength before weakness. Journey before destination."',
  glyph: '⟁',

  // ── Theme tokens ──────────────────────────────────────────────────────
  theme: {
    primary: '#C9A84C',
    secondary: '#28A87A',
    danger: '#B03828',
    bgTone: 'dark',
    titleFont: 'Cinzel',
    bodyFont: 'Crimson Pro',
  },

  // ── GM Context (AI prompt injection) ──────────────────────────────────
  gmContext: {
    worldName: 'Roshar',
    systemName: 'Stormlight Chronicles',
    magicName: 'Stormlight',
    magicResource: 'Investiture',
    combatFlavor: 'Cosmere RPG',
    healFlavor: 'Stormlight healing',
    errorFlavor: 'The Stormlight flickers — something went wrong.',
    worldLore: 'Roshar — a world of highstorms and ancient oaths. The Knights Radiant once protected humanity with Surgebinding, channeling Stormlight through spren bonds. Now the Desolations return, and new Radiants must rise.',
    toneInstruction: 'Epic Sanderson fantasy — mythic stakes, personal cost. Begin with what the world does, not what the player did. Emotion through physical action, never stated directly.',
    magicRules: 'Surgebinding costs Stormlight (Focus). Radiants speak Ideals to grow in power. 10 Surges, each tied to specific Orders. Shardblades and Shardplate manifest at higher Ideal levels.',
    npcFlavor: 'Rosharan names from diverse cultures (Alethi, Azish, Herdazian, etc.). Spren companions visible to Radiants. Vorin faith, lighteyes/darkeyes caste, Thaylen merchants.',
    choiceTagRules: '[COMBAT] [DISCOVERY] [DECISION] [SURGE] — tag every player choice. Combat choices also use [ATTACK] [DEFEND] [HEAL] [SURGE].',
  },

  // ══════════════════════════════════════════════════════════════════════
  // CHARACTER DATA
  // ══════════════════════════════════════════════════════════════════════

  classes: [
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
  ],

  sprenBonds: {
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
  },

  heroRoles: [
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
  ],

  heroWeapons: [
    {id:'sword',name:'Dueling Sword',type:'Blade',dmgBonus:{crit:3,hit:2,miss:0},desc:'Alethi noble training. Precise and lethal.',tiers:['Honed','Tempered','Master-forged','Named','Legendary']},
    {id:'hammer',name:'War Hammer',type:'Blunt',dmgBonus:{crit:4,hit:2,miss:0},desc:'Breaks armor and morale equally.',tiers:['Weighted','Reinforced','Iron-bound','Legendary','Worldbreaker']},
    {id:'spear',name:'Spear & Shield',type:'Polearm',dmgBonus:{crit:2,hit:2,miss:0},desc:'Disciplined, reliable. +1 defense each round.',tiers:['Sharpened','Balanced','Battle-tested','Named','Eternal Guard']},
    {id:'bow',name:'Shortbow',type:'Ranged',dmgBonus:{crit:3,hit:1,miss:0},desc:'First strike advantage. Keeps distance.',tiers:['Strung tight','Balanced','Recurved','Hawkeye','Deadeye']},
    {id:'knives',name:'Twin Knives',type:'Dual',dmgBonus:{crit:3,hit:2,miss:0},desc:'Unpredictable. Bonus on fumble recovery.',tiers:['Sharpened','Balanced','Paired','Shadow-swift','Ghost-edged']},
    {id:'gauntlet',name:'Fabrial Gauntlet',type:'Artifabrian',dmgBonus:{crit:2,hit:2,miss:1},desc:'Scholar-built. Bonus to INT actions.',tiers:['Calibrated','Tuned','Refined','Masterwork','Transcendent']},
    {id:'unarmed',name:'Bare Hands',type:'Unarmed',dmgBonus:{crit:2,hit:2,miss:0},desc:'Cannot be disarmed. +END bonus.',tiers:['Calloused','Hardened','Iron-fist','Horneater-trained','Unmovable']},
    {id:'shardfork',name:'Shardfork',type:'Improvised',dmgBonus:{crit:5,hit:1,miss:0},desc:'Random chaos. Do not ask.',tiers:['Bent','Slightly less bent','Inexplicably sharp','Legendary','Unknowable']},
  ],

  ancestries: [
    {
      id:'human',
      name:'Human',
      desc:'The majority species on Roshar. Adaptable, diverse, and widespread across many nations.',
      size:'Medium',
      bonusTalentSource:'heroic path',
      bonusTalentTiers:[1,6,11,16,21],
      color:'var(--amber2)',
    },
    {
      id:'singer',
      name:'Singer',
      desc:'The indigenous people of Roshar. Can bond spren and change forms during highstorms, temporarily amplifying different abilities.',
      size:'Medium',
      bonusTalentSource:'singer tree or heroic path',
      bonusTalentTiers:[6,11,16,21],
      keyTalent:'changeForm',
      color:'var(--teal2)',
    },
  ],

  cultures: [
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
  ],

  singerForms: {
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
  },

  startingKits: [
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
  ],

  // ══════════════════════════════════════════════════════════════════════
  // COMBAT & EQUIPMENT
  // ══════════════════════════════════════════════════════════════════════

  weapons: {
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
  },

  armors: {
    uniform:    {name:'Uniform',    deflect:0, traits:['Presentable']},
    leather:    {name:'Leather',    deflect:1, traits:[],           expertTraits:['Presentable']},
    chain:      {name:'Chain',      deflect:2, traits:['Cumbersome [3]'], expertTraits:['Loses Cumbersome']},
    breastplate:{name:'Breastplate',deflect:2, traits:['Cumbersome [3]'], expertTraits:['Presentable']},
    halfPlate:  {name:'Half Plate', deflect:3, traits:['Cumbersome [4]'], expertTraits:['Cumbersome [3] instead']},
    fullPlate:  {name:'Full Plate', deflect:4, traits:['Cumbersome [5]']},
    shardplate: {name:'Shardplate', deflect:5, traits:['Dangerous','Unique'], charges:4, bonus:{str:2,spd:2}, special:'shardplateCharges'},
  },

  surges: [
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
  ],

  surgeScale: [
    {rank:1, die:'d4', size:'Small (2.5 ft)'},
    {rank:2, die:'d6', size:'Medium (5 ft)'},
    {rank:3, die:'d8', size:'Large (10 ft)'},
    {rank:4, die:'d10', size:'Huge (15 ft)'},
    {rank:5, die:'d12', size:'Gargantuan (20 ft)'},
  ],

  orderSurges: {
    windrunner:   ['adhesion','gravitation'],
    lightweaver:  ['illumination','transformation'],
    edgedancer:   ['abrasion','progression'],
    stoneward:    ['cohesion','tension'],
    elsecaller:   ['transformation','transportation'],
    truthwatcher: ['illumination','progression'],
    willshaper:   ['cohesion','transportation'],
    dustbringer:  ['abrasion','division'],
    skybreaker:   ['division','gravitation'],
  },

  conditions: {
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
  },

  injuryEffects: [
    'Exhausted [−1] (general stamina loss)',
    'Exhausted [−1] (general stamina loss)',
    'Exhausted [−2] (severe stamina loss)',
    'Slowed (injured leg)',
    'Slowed (injured leg)',
    'Disoriented (head injury)',
    'Surprised (shock)',
    'Can only use one hand (injured arm)',
  ],

  adversaryRoles: {
    minion:  {name:'Minion', healthMult:0.5, threat:0.5, noCrit:true,
              rule:'Immediately defeated when suffering an injury (PC decides: dead or unconscious)'},
    rival:   {name:'Rival',  healthMult:1,   threat:1,   noCrit:false, rule:'Standard adversary rules'},
    boss:    {name:'Boss',   healthMult:2,   threat:4,
              rule:'Takes a fast AND slow turn each round; can spend 1 focus for extra action or to remove a condition'},
  },

  combatOpps: [
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
  ],

  combatComps: [
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
  ],

  // ══════════════════════════════════════════════════════════════════════
  // LORE & FLAVOR
  // ══════════════════════════════════════════════════════════════════════

  npcMale: [
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
  ],

  npcFemale: [
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
  ],

  colors: [{name:'Amber',hex:'#e8a020'},{name:'Teal',hex:'#12a878'},{name:'Coral',hex:'#d85030'},{name:'Blue',hex:'#2a80d0'},{name:'Purple',hex:'#8060c8'},{name:'Rose',hex:'#c84070'},{name:'Gold',hex:'#BFA15A'},{name:'Sage',hex:'#5a8a5a'}],

  npcColors: ['#8060c8','#c84070','#2a6fa8','#8E6A34','#25956e','#c44a28','#BFA15A','#5a8a5a','#7a9a5a','#a06040'],

  statKeys: ['str','spd','int','wil','awa','pre'],

  statNames: ['STR','SPD','INT','WIL','AWA','PRE'],

  statFull: ['Strength','Speed','Intellect','Willpower','Awareness','Presence'],

  skills: [
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
  ],

  pathSkills: {
    agent:'insight', envoy:'discipline', hunter:'perception',
    leader:'leadership', scholar:'lore', warrior:'athletics'
  },

  sprenAppearances: {
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
  },

  purposes: [
    'Save Others — defend those who cannot protect themselves',
    'Seek Truth — insatiable curiosity about the world',
    'Push Yourself to New Heights — discover and surpass your limits',
    'Find Connection — define yourself by your relationships',
    'Seek Justice — injustice in any form is intolerable',
    'Preserve Life — all life has intrinsic value',
  ],

  obstacles: [
    'Deep Regret — something weighs heavily on your conscience',
    'Specific Fear — a particular fear that returns unbidden',
    'Spite — petty grudges, volatile temper, impulsiveness',
    'Self-Doubt — trouble believing in yourself',
    'Mistrust of Others — you push people away to avoid disappointment',
  ],

  gemstones: {
    diamond:  {chip:0.2, mark:1,  broam:4},
    garnet:   {chip:1,   mark:5,  broam:20},
    ruby:     {chip:2,   mark:10, broam:40},
    amethyst: {chip:5,   mark:25, broam:100},
    emerald:  {chip:10,  mark:50, broam:200},
  },

  // ══════════════════════════════════════════════════════════════════════
  // WORLD DATA
  // ══════════════════════════════════════════════════════════════════════

  locations: ['Urithiru','Shattered Plains','Kholinar','Kharbranth','Thaylen City','Azimir','Purelake','Hearthstone','Rathalas','Reshi Isles','Aimia (Akinah)','Frostlands','Bavland','Herdaz','Jah Keved','Alethkar','Tukar','Triax','Liafor','Emul','Marat'],

  offworldLocations: ['Braize (Damnation)','Ashyn — the Burning Planet','Aimian Sea','Godforge'],

  shadesmarLocations: ['Shadesmar — Sea of Regret','Shadesmar — Sea of Souls','Shadesmar — Sea of Lost Lights','Nexus of Imagination','Nexus of Truth','Nexus of Transition',"Honor's Perpendicularity","Cultivation's Perpendicularity"],

  legendaryLocations: ['The Honor Chasm','Feverstone Keep','Stormseat (Narak)'],

  baseActs: [{num:1,tag:'Act I',start:0,end:59},{num:2,tag:'Act II',start:60,end:119},{num:3,tag:'Act III',start:120,end:179}],

  bladeTiers: ['Nascent','Bonded','Ancient','Living','Divine'],

  bladeNames: {windrunner:'Silverwind Blade',lightweaver:'Illusory Edge',edgedancer:'Verdant Blade',stoneward:'Granite Shardblade',elsecaller:'Obsidian Catalyst',truthwatcher:'Starlight Blade',willshaper:'Freedom Edge',dustbringer:'Ember Blade',bondsmith:'Sibling-Touched Blade',skybreaker:'Law Blade'},

  // ══════════════════════════════════════════════════════════════════════
  // PROGRESSION
  // ══════════════════════════════════════════════════════════════════════

  orderOaths: {
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
  },

  oathBonuses: {
    1:{desc:'First Oath spoken',combat:0,heal:0},
    2:{desc:'Shardblade manifests',combat:1,heal:0},
    3:{desc:'Surges strengthen',combat:1,heal:1,ability:'Enhanced surge control'},
    4:{desc:'Shardplate begins forming',combat:2,heal:2,ability:'Partial Shardplate'},
    5:{desc:'Full Radiant',combat:3,heal:3,ability:'Full power — Shardplate complete'},
  },

  advancement: {
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
  },

  orderIdeals: {
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
  },

  hoidLines: [
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
  ],

  // ══════════════════════════════════════════════════════════════════════
  // WEAPON GENERATION
  // ══════════════════════════════════════════════════════════════════════

  weaponPrefixes: ['Iron','Ash','Silver','Copper','Bronze','Obsidian','Granite','Storm','Crest','Ember'],

  weaponSuffixes: ['mark','fall','watch','hold','edge','strike','ward','crest','fang','point'],

  // ── Enemy Configuration ──────────────────────────────────────────────────
  // Shared categories from enemyPatterns.js that are active for Stormlight
  enemyCategories: ['beasts','elementals','humanEnemies'],

  // Location-based fallback pools (Stormlight-specific)
  enemyPools: {
    shadesmar:[ {name:'Voidspren',type:'Spirit',baseHP:8,dmg:3,attackBonus:2},{name:'Gloomform',type:'Unmade Fragment',baseHP:14,dmg:5,attackBonus:4},{name:'Midnight Essence',type:'Unmade Shard',baseHP:11,dmg:4,attackBonus:3},{name:'Cognitive Shadow',type:'Remnant',baseHP:9,dmg:3,attackBonus:3},{name:'Spren Construct',type:'Splinter',baseHP:7,dmg:4,attackBonus:4} ],
    plains:[ {name:'Parshendi Warrior',type:'Warrior',baseHP:10,dmg:4,attackBonus:3},{name:'Parshendi Shardbearer',type:'Elite',baseHP:18,dmg:7,attackBonus:5},{name:'Parshendi Scout',type:'Scout',baseHP:8,dmg:3,attackBonus:3},{name:'Stormform Parshendi',type:'Voidbringer',baseHP:14,dmg:6,attackBonus:4},{name:'Warform Soldier',type:'Heavy',baseHP:16,dmg:5,attackBonus:4} ],
    braize:[ {name:'Fused',type:'Ancient',baseHP:22,dmg:8,attackBonus:6},{name:'Regal',type:'Parsh Void',baseHP:12,dmg:5,attackBonus:4},{name:'Magnified One',type:'Fused Elite',baseHP:18,dmg:7,attackBonus:5},{name:'Deepest One',type:'Fused Ancient',baseHP:20,dmg:9,attackBonus:6},{name:'Heavenly One',type:'Fused',baseHP:15,dmg:6,attackBonus:5} ],
    urithiru:[ {name:'Unmade Servant',type:'Cognitive Shadow',baseHP:12,dmg:4,attackBonus:3},{name:'Voidbringer',type:'Fused',baseHP:16,dmg:6,attackBonus:5},{name:'Re-Shephir Fragment',type:'Midnight Mother',baseHP:10,dmg:5,attackBonus:4},{name:'Ba-Ado-Mishram Echo',type:'Unmade',baseHP:18,dmg:6,attackBonus:4},{name:'Tower Shade',type:'Cognitive Shadow',baseHP:11,dmg:4,attackBonus:3} ],
    hearthstone:[ {name:'Void Scout',type:'Soldier',baseHP:9,dmg:3,attackBonus:3},{name:'Corrupted Townsman',type:'Parshman',baseHP:11,dmg:4,attackBonus:2},{name:'Stormform Soldier',type:'Voidbringer',baseHP:13,dmg:5,attackBonus:4},{name:'Darkform Guard',type:'Soldier',baseHP:10,dmg:4,attackBonus:3},{name:'Slumbering Horror',type:'Unknown',baseHP:15,dmg:5,attackBonus:3} ],
    sea:[ {name:'Sea Fiend',type:'Aimian',baseHP:12,dmg:5,attackBonus:4},{name:'Dysian Aimian',type:'Ancient',baseHP:16,dmg:6,attackBonus:4},{name:'Void Leviathan',type:'Sea Creature',baseHP:20,dmg:7,attackBonus:3},{name:'Santhid Spawn',type:'Creature',baseHP:10,dmg:4,attackBonus:3} ],
    default:[ {name:'Void Creature',type:'Unknown',baseHP:10,dmg:4,attackBonus:3},{name:'Darkform Soldier',type:'Soldier',baseHP:14,dmg:5,attackBonus:4},{name:'Voidspren Bound',type:'Corrupted',baseHP:9,dmg:4,attackBonus:3},{name:'Unmade Thrall',type:'Servant',baseHP:12,dmg:4,attackBonus:3},{name:'Stormspawn',type:'Creature',baseHP:11,dmg:5,attackBonus:4},{name:'Parshman Soldier',type:'Voidbringer',baseHP:13,dmg:4,attackBonus:3} ],
  },

  // Stormlight-specific narrative patterns (these take priority over shared patterns)
  enemyPatterns: [
    {keywords:[/crabs?|crab.like|crystalline.shell|clicking/i], enemies:[
      {name:'Aimian Shore Crab',type:'Creature',baseHP:7,dmg:3,attackBonus:2},{name:'Crab Swarm Cluster',type:'Swarm',baseHP:5,dmg:2,attackBonus:2},{name:'Giant Lighthouse Crab',type:'Elite',baseHP:14,dmg:5,attackBonus:3},{name:'Bioluminescent Crab',type:'Creature',baseHP:8,dmg:3,attackBonus:2},
    ]},
    {keywords:[/depths?|bioluminescent|phosphorescent|aimian.sea|ocean|leviathan/i], enemies:[
      {name:'Depth Crawler',type:'Sea Creature',baseHP:11,dmg:4,attackBonus:3},{name:'Bioluminescent Horror',type:'Unknown',baseHP:14,dmg:5,attackBonus:3},{name:'Aimian Sea Spawn',type:'Ancient',baseHP:16,dmg:6,attackBonus:4},
    ]},
    {keywords:[/parshendi|parshman|listener|warform|stormform|voidform/i], enemies:[
      {name:'Parshendi Warrior',type:'Warrior',baseHP:10,dmg:4,attackBonus:3},{name:'Parshendi Scout',type:'Scout',baseHP:8,dmg:3,attackBonus:3},{name:'Stormform Parshendi',type:'Elite',baseHP:14,dmg:6,attackBonus:4},{name:'Warform Soldier',type:'Heavy',baseHP:16,dmg:5,attackBonus:4},
    ]},
    {keywords:[/bandit|thief|brigand|soldiers?|guards?|mercenaries|assassin|scout/i], enemies:[
      {name:'Alethi Deserter',type:'Soldier',baseHP:10,dmg:4,attackBonus:3},{name:'Mercenary Blade',type:'Fighter',baseHP:12,dmg:4,attackBonus:3},{name:'Road Bandit',type:'Rogue',baseHP:8,dmg:3,attackBonus:2},{name:'Armored Guard',type:'Elite',baseHP:14,dmg:5,attackBonus:4},
    ]},
    {keywords:[/fused|ancient.enemy|regals?|magnified/i], enemies:[
      {name:'Fused',type:'Ancient',baseHP:22,dmg:8,attackBonus:6},{name:'Regal',type:'Parsh Void',baseHP:12,dmg:5,attackBonus:4},{name:'Magnified One',type:'Fused Elite',baseHP:18,dmg:7,attackBonus:5},{name:'Heavenly One',type:'Fused',baseHP:15,dmg:6,attackBonus:5},
    ]},
    {keywords:[/spren|cognitive|shadesmar|midnight.essence|unmade|splinter/i], enemies:[
      {name:'Voidspren',type:'Spirit',baseHP:8,dmg:3,attackBonus:2},{name:'Midnight Essence',type:'Unmade Shard',baseHP:11,dmg:4,attackBonus:3},{name:'Cognitive Shadow',type:'Remnant',baseHP:9,dmg:3,attackBonus:3},{name:'Gloomform',type:'Unmade Fragment',baseHP:14,dmg:5,attackBonus:4},
    ]},
    {keywords:[/highstorm|storm.creature|stormspren|windspren.*hostile|thunderclast/i], enemies:[
      {name:'Highstorm Elemental',type:'Storm',baseHP:18,dmg:6,attackBonus:4},{name:'Stormspren Fury',type:'Spren',baseHP:10,dmg:4,attackBonus:3},{name:'Thunderclast Shard',type:'Stone Beast',baseHP:24,dmg:7,attackBonus:4},
    ]},
    {keywords:[/chasmfiend|greatshell|larkin|gemheart|carapace|chrysalis/i], enemies:[
      {name:'Juvenile Chasmfiend',type:'Greatshell',baseHP:20,dmg:7,attackBonus:4},{name:'Chasmfiend Scout',type:'Creature',baseHP:12,dmg:5,attackBonus:3},{name:'Larkin Swarm',type:'Swarm',baseHP:6,dmg:2,attackBonus:2},
    ]},
    {keywords:[/rotspren|corrupted|plague|sickness|decay|festering/i], enemies:[
      {name:'Rotspren Cluster',type:'Corruption',baseHP:7,dmg:3,attackBonus:2},{name:'Corrupted Townsman',type:'Parshman',baseHP:11,dmg:4,attackBonus:2},{name:'Decayform Soldier',type:'Voidbringer',baseHP:13,dmg:5,attackBonus:3},
    ]},
    {keywords:[/shade[s]?|shadow.*attack|darkness.*moves|figure.*emerges/i], enemies:[
      {name:'Cognitive Shade',type:'Shadow',baseHP:9,dmg:4,attackBonus:3},{name:'Nachtis Shade',type:'Darkness',baseHP:12,dmg:5,attackBonus:3},{name:'Unmade Thrall',type:'Servant',baseHP:12,dmg:4,attackBonus:3},
    ]},
    {keywords:[/wolves?|hounds?|predator|beast|wild.creature|stalking/i], enemies:[
      {name:'Roshar Wolf',type:'Beast',baseHP:8,dmg:3,attackBonus:3},{name:'Stonehorn',type:'Creature',baseHP:14,dmg:5,attackBonus:3},{name:'Greatwolf Alpha',type:'Elite',baseHP:16,dmg:6,attackBonus:4},
    ]},
    {keywords:[/ambush|surround|outnumber|outnumbered|we.re.trapped|no.escape/i], enemies:[
      {name:'Ambush Leader',type:'Soldier',baseHP:14,dmg:5,attackBonus:4},{name:'Ambush Flanker',type:'Scout',baseHP:9,dmg:3,attackBonus:3},{name:'Crossbow Thug',type:'Ranged',baseHP:8,dmg:4,attackBonus:2},
    ]},
  ],

};
