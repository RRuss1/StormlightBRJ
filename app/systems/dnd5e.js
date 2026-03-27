// ═══════════════════════════════════════════════════════════════════════════
// Dungeons & Dragons 5e — System Data
// All D&D 5e-specific data extracted into a single portable object.
// This file is the canonical source for world data, character options,
// combat tables, lore, and progression for the D&D 5e system.
// ═══════════════════════════════════════════════════════════════════════════

window.DnD5eSystem = {

  // ── Metadata ──────────────────────────────────────────────────────────
  id: 'dnd5e',
  name: 'Dungeons & Dragons 5e',
  subtitle: 'Adventures in the Forgotten Realms',
  tagline: '"Roll for initiative."',
  glyph: '⚔',
  ambientAudio: 'forge',

  // ── Theme tokens ──────────────────────────────────────────────────────
  theme: {
    primary: '#9B2335',      // Crimson
    secondary: '#C0C0C0',    // Silver
    danger: '#6B2737',       // Blood red
    bgTone: 'dark',
    titleFont: 'Cinzel',
    bodyFont: 'Crimson Pro',
  },

  // ── GM Context (AI prompt injection) ──────────────────────────────────
  gmContext: {
    worldName: 'the Forgotten Realms',
    systemName: 'Dungeons & Dragons 5th Edition',
    magicName: 'Arcane Magic',
    magicResource: 'Spell Slots',
    combatFlavor: 'D&D 5e',
    healFlavor: 'Healing magic and rest',
    errorFlavor: 'The magic fizzles — something went wrong.',
    worldLore: 'The Forgotten Realms — a vast medieval fantasy world of swords, sorcery, and ancient ruins. The Sword Coast stretches from Waterdeep to Baldur\'s Gate, filled with dungeons, dragons, and dark cults. Gods walk among mortals, magic pervades everyday life, and adventurers seek glory in the untamed wilds.',
    toneInstruction: 'Classic high fantasy adventure — heroic stakes, dramatic combat, mysterious dungeons. Vivid descriptions of torchlit corridors, clashing steel, and arcane energies. Danger is real but heroes rise to meet it.',
    magicRules: 'Spellcasters use spell slots to fuel spells. Cantrips are at-will. Wizards prepare spells from their spellbook. Clerics pray for divine magic. Spell slots recover on long rest (short rest for some features).',
    npcFlavor: 'Fantasy names from diverse cultures — human, elven, dwarven, halfling. Tavern keepers, guild masters, mysterious wizards, grizzled warriors. Common tongue with occasional Elvish or Dwarvish phrases.',
    choiceTagRules: '[COMBAT] [DISCOVERY] [DECISION] [MAGIC] — tag every player choice. Combat choices also use [ATTACK] [DEFEND] [HEAL] [MAGIC].',
  },

  // ══════════════════════════════════════════════════════════════════════
  // CHARACTER DATA
  // ══════════════════════════════════════════════════════════════════════

  classes: [
    {
      id: 'cleric', name: 'Cleric',
      philosophy: 'Faith guides my hand.',
      surges: ['sacredFlame','bless','cureWounds','guidingBolt','spiritualWeapon','spiritGuardians'],
      ideal1: 'I serve a higher power and channel divine magic.',
      ideal2: 'I will protect the faithful and smite the unholy.',
      ideal3: 'My devotion deepens — I become a conduit of divine will.',
      ideal4: 'I am the living instrument of my deity.',
      spren: 'Divine Domain', sprenDesc: 'Life Domain — the gods of life promote vitality and health through healing the sick and wounded, caring for those in need, and driving away the forces of death and undeath.',
      sprenAssist: 'Healing, turning undead, divine insight',
      desc: 'A priestly champion who wields divine magic in service of a higher power. Heavy armor, healing spells, and righteous fury.',
      bonus: {str:0, dex:0, con:0, int:0, wis:2, cha:1},
      abilities: ['Channel Divinity', 'Turn Undead', 'Preserve Life', 'Divine Strike', 'Divine Intervention'],
      dmgBonus: {crit:3, hit:2, miss:0}, color: '#C4972F'
    },
    {
      id: 'fighter', name: 'Fighter',
      philosophy: 'Steel solves what words cannot.',
      surges: [],
      ideal1: 'I am a master of martial combat.',
      ideal2: 'I push beyond mortal limits with Action Surge.',
      ideal3: 'My attacks multiply — I strike where others falter.',
      ideal4: 'I am an unstoppable engine of war.',
      spren: 'Martial Archetype', sprenDesc: 'Champion — the archetypal Champion focuses on the development of raw physical power honed to deadly perfection.',
      sprenAssist: 'Combat tactics, weapon mastery, physical endurance',
      desc: 'A master of martial combat, skilled with a variety of weapons and armor. Second Wind, Action Surge, and relentless attacks.',
      bonus: {str:2, dex:1, con:0, int:0, wis:0, cha:0},
      abilities: ['Second Wind', 'Action Surge', 'Extra Attack', 'Improved Critical', 'Remarkable Athlete'],
      dmgBonus: {crit:4, hit:2, miss:0}, color: '#9B2335'
    },
    {
      id: 'rogue', name: 'Rogue',
      philosophy: 'Strike from the shadows.',
      surges: [],
      ideal1: 'I excel at stealth and precision.',
      ideal2: 'My Sneak Attack finds every weakness.',
      ideal3: 'I evade what others cannot — Uncanny Dodge.',
      ideal4: 'I am untouchable — Evasion perfected.',
      spren: 'Roguish Archetype', sprenDesc: 'Thief — you hone your skills in the larcenous arts. Burglars, bandits, cutpurses, and other criminals follow this archetype.',
      sprenAssist: 'Lockpicking, trap detection, stealth, deception',
      desc: 'A scoundrel who uses stealth and trickery to overcome obstacles and enemies. Sneak Attack, Cunning Action, and Expertise.',
      bonus: {str:0, dex:2, con:0, int:1, wis:0, cha:0},
      abilities: ['Sneak Attack', 'Cunning Action', 'Uncanny Dodge', 'Evasion', 'Fast Hands'],
      dmgBonus: {crit:4, hit:2, miss:0}, color: '#4A4A4A'
    },
    {
      id: 'wizard', name: 'Wizard',
      philosophy: 'Knowledge is the ultimate power.',
      surges: ['fireBolt','magicMissile','shield','burningHands','mistyStep','fireball'],
      ideal1: 'I have mastered the arcane arts through study.',
      ideal2: 'My spell repertoire expands — Arcane Recovery fuels me.',
      ideal3: 'I sculpt spells around allies — Evocation mastery.',
      ideal4: 'I command reality itself.',
      spren: 'Arcane Tradition', sprenDesc: 'School of Evocation — you focus your study on magic that creates powerful elemental effects such as bitter cold, searing flame, rolling thunder, crackling lightning, and burning acid.',
      sprenAssist: 'Arcane lore, spell research, identifying magic items',
      desc: 'A scholarly magic-user capable of manipulating the structures of reality. Spellbook, Arcane Recovery, and devastating evocations.',
      bonus: {str:0, dex:0, con:0, int:2, wis:1, cha:0},
      abilities: ['Arcane Recovery', 'Sculpt Spells', 'Potent Cantrip', 'Empowered Evocation', 'Overchannel'],
      dmgBonus: {crit:3, hit:2, miss:0}, color: '#4169E1'
    },
  ],

  // sprenBonds → Subclass feature progression (flavor text per class)
  sprenBonds: {
    cleric: {name:'Divine Grace',nick:'Grace',stages:['A warm light settles over you as you pray...','Your holy symbol glows faintly — the divine hears you.','Sacred energy flows through your hands. You can feel the barrier between worlds thinning.','Your deity speaks through you now. Others sense it.','You are a living conduit of divine power. The faithful kneel.'],color:'#C4972F'},
    fighter: {name:'Battle Instinct',nick:'Instinct',stages:['Your grip on the weapon feels natural, balanced...','Muscle memory takes over — you move before you think.','Your body anticipates attacks before they come.','In combat, time seems to slow. Every opening is clear.','You are war incarnate. No blade can touch what you do not permit.'],color:'#9B2335'},
    rogue: {name:'Shadow Sense',nick:'Shadow',stages:['You notice things others miss — a loose stone, a hidden latch...','Shadows seem to bend toward you, offering concealment.','Your reflexes defy explanation — you dodge what you cannot see.','You move through danger like water through fingers.','You are the shadow itself. Unseen. Unstoppable.'],color:'#4A4A4A'},
    wizard: {name:'Arcane Focus',nick:'Focus',stages:['The words of power tingle on your tongue...','Your spellbook hums with contained energy when you study.','Arcane formulae appear in your mind unbidden — answers to problems you haven\'t voiced.','Reality bends subtly around you. Candles flicker when you concentrate.','You see the weave of magic underlying everything. It responds to your will.'],color:'#4169E1'},
  },

  // D&D Backgrounds → heroRoles
  heroRoles: [
    {id:'acolyte', name:'Acolyte', icon:'\u{1F64F}',
     keyTalent:'Shelter of the Faithful', keyTalentDesc:'You can receive free healing and care at temples of your faith, and supporters will provide modest lifestyle.',
     startingSkill:'religion', specialties:['Priest','Monk','Temple Guard'],
     buildAttrs:['wis','cha'], buildSkills:['Insight','Religion'],
     multiPath:['Sage','Noble'],
     desc:'You have spent your life in service to a temple, learning sacred rites and providing sacrifices.',
     bonus:{str:0,dex:0,con:0,int:0,wis:1,cha:1}, ideal:'I trust that my deity will guide my actions.',
     color:'#C4972F'},
    {id:'criminal', name:'Criminal', icon:'\u{1F5E1}',
     keyTalent:'Criminal Contact', keyTalentDesc:'You have a reliable and trustworthy contact who acts as your liaison to a network of other criminals.',
     startingSkill:'stealth', specialties:['Spy','Burglar','Fence'],
     buildAttrs:['dex','cha'], buildSkills:['Deception','Stealth'],
     multiPath:['Soldier','Folk Hero'],
     desc:'You are an experienced criminal with a history of breaking the law and a contact within a network of rogues.',
     bonus:{str:0,dex:1,con:0,int:0,wis:0,cha:1}, ideal:'I don\'t steal from those who can\'t afford to lose.',
     color:'#4A4A4A'},
    {id:'folkHero', name:'Folk Hero', icon:'\u{1F33E}',
     keyTalent:'Rustic Hospitality', keyTalentDesc:'Common folk will shield you from the law or anyone searching for you, and will shelter you if needed.',
     startingSkill:'survival', specialties:['Farmer','Rebel','Outcast'],
     buildAttrs:['str','wis'], buildSkills:['Animal Handling','Survival'],
     multiPath:['Soldier','Criminal'],
     desc:'You come from a humble social rank, but you are destined for so much more. The people of your home village regard you as their champion.',
     bonus:{str:1,dex:0,con:0,int:0,wis:1,cha:0}, ideal:'I fight for those who cannot fight for themselves.',
     color:'#6B8E23'},
    {id:'noble', name:'Noble', icon:'\u{1F451}',
     keyTalent:'Position of Privilege', keyTalentDesc:'People are inclined to think the best of you. You are welcome in high society and common folk try to accommodate you.',
     startingSkill:'persuasion', specialties:['Knight','Courtier','Heir'],
     buildAttrs:['cha','int'], buildSkills:['History','Persuasion'],
     multiPath:['Acolyte','Sage'],
     desc:'You understand wealth, power, and privilege. You carry a title, and your family owns land.',
     bonus:{str:0,dex:0,con:0,int:1,wis:0,cha:1}, ideal:'Noblesse oblige — it is my duty to protect and care for those beneath me.',
     color:'#800080'},
    {id:'sage', name:'Sage', icon:'\u{1F4DC}',
     keyTalent:'Researcher', keyTalentDesc:'When you attempt to learn or recall lore, if you don\'t know it yourself, you often know where to find it.',
     startingSkill:'arcana', specialties:['Alchemist','Astronomer','Librarian'],
     buildAttrs:['int','wis'], buildSkills:['Arcana','History'],
     multiPath:['Acolyte','Noble'],
     desc:'You spent years learning the lore of the multiverse. You scour manuscripts, study scrolls, and listen to great experts.',
     bonus:{str:0,dex:0,con:0,int:2,wis:0,cha:0}, ideal:'Knowledge is the path to power and self-improvement.',
     color:'#4169E1'},
    {id:'soldier', name:'Soldier', icon:'\u{1F6E1}',
     keyTalent:'Military Rank', keyTalentDesc:'You have a military rank from your career. Soldiers loyal to your former organization still recognize your authority.',
     startingSkill:'athletics', specialties:['Officer','Scout','Mercenary'],
     buildAttrs:['str','con'], buildSkills:['Athletics','Intimidation'],
     multiPath:['Criminal','Folk Hero'],
     desc:'You have served in a military force. War has left its mark on you — both the horrors and the camaraderie.',
     bonus:{str:1,dex:0,con:1,int:0,wis:0,cha:0}, ideal:'Those who fight beside me are worth dying for.',
     color:'#9B2335'},
  ],

  // Hero weapons (D&D starting weapon choices)
  heroWeapons: [
    {id:'longsword',name:'Longsword',type:'Blade',dmgBonus:{crit:3,hit:2,miss:0},desc:'Versatile blade favored by knights and warriors.',tiers:['Standard','Masterwork','Enchanted','Legendary','Artifact']},
    {id:'greataxe',name:'Greataxe',type:'Heavy',dmgBonus:{crit:4,hit:2,miss:0},desc:'Devastating two-handed cleaver.',tiers:['Standard','Masterwork','Enchanted','Legendary','Artifact']},
    {id:'rapier',name:'Rapier',type:'Finesse',dmgBonus:{crit:3,hit:2,miss:0},desc:'Elegant thrusting weapon favored by duelists.',tiers:['Standard','Masterwork','Enchanted','Legendary','Artifact']},
    {id:'shortbow',name:'Shortbow',type:'Ranged',dmgBonus:{crit:3,hit:1,miss:0},desc:'Quick ranged weapon for skirmishers.',tiers:['Standard','Masterwork','Enchanted','Legendary','Artifact']},
    {id:'mace',name:'Mace',type:'Blunt',dmgBonus:{crit:3,hit:2,miss:0},desc:'Simple bludgeon blessed by many clerics.',tiers:['Standard','Masterwork','Enchanted','Legendary','Artifact']},
    {id:'staff',name:'Quarterstaff',type:'Staff',dmgBonus:{crit:2,hit:2,miss:1},desc:'Arcane focus for wizards, sturdy walking stick for all.',tiers:['Standard','Masterwork','Enchanted','Legendary','Artifact']},
    {id:'daggers',name:'Twin Daggers',type:'Dual',dmgBonus:{crit:3,hit:2,miss:0},desc:'Fast, concealable, deadly when paired.',tiers:['Standard','Masterwork','Enchanted','Legendary','Artifact']},
    {id:'warhammer',name:'Warhammer',type:'Blunt',dmgBonus:{crit:4,hit:2,miss:0},desc:'Dwarven favorite — cracks armor and stone.',tiers:['Standard','Masterwork','Enchanted','Legendary','Artifact']},
  ],

  // D&D Races → ancestries
  ancestries: [
    {id:'human', name:'Human', desc:'The most adaptable and ambitious people among the common races. Whatever drives them, humans are the innovators, achievers, and pioneers of the worlds.', size:'Medium', bonusTalentSource:'background', bonusTalentTiers:[1,4,8,12,16,19], color:'#C4972F'},
    {id:'dwarf', name:'Hill Dwarf', desc:'Bold and hardy, dwarves are known as skilled warriors, miners, and workers of stone and metal. Hill dwarves have keen senses, deep intuition, and remarkable resilience.', size:'Medium', bonusTalentSource:'dwarven heritage', bonusTalentTiers:[1,5,10,15,20], color:'#8B4513'},
    {id:'elf', name:'High Elf', desc:'Elves are a magical people of otherworldly grace, living in the world but not entirely part of it. High elves have a keen mind and a mastery of at least the basics of magic.', size:'Medium', bonusTalentSource:'elven heritage', bonusTalentTiers:[1,5,10,15,20], color:'#2E8B57'},
    {id:'halfling', name:'Lightfoot Halfling', desc:'The diminutive halflings survive in a world full of larger creatures by avoiding notice or, barring that, avoiding offense. Lightfoot halflings are naturally stealthy.', size:'Small', bonusTalentSource:'halfling luck', bonusTalentTiers:[1,5,10,15,20], color:'#DAA520'},
  ],

  // D&D regions/cultures
  cultures: [
    {id:'swordCoast', name:'Sword Coast', region:'Sword Coast', lang:'Common', desc:'The civilized strip along the western coast — Waterdeep, Baldur\'s Gate, Neverwinter. Trade, politics, and adventure.', expertise:'Navigate cities, trade knowledge, local politics, tavern culture.', color:'#9B2335'},
    {id:'underdark', name:'Underdark', region:'Underdark', lang:'Undercommon / Deep Speech', desc:'Vast network of underground caverns. Drow, duergar, mind flayers. Darkness and danger.', expertise:'Underground navigation, fungal knowledge, creature lore, darkvision tactics.', color:'#4A4A6A'},
    {id:'northlands', name:'Northlands', region:'Icewind Dale / Spine of the World', lang:'Common / Dwarvish', desc:'Harsh frozen wilderness. Small settlements cling to life amidst blizzards and monsters.', expertise:'Cold survival, hunting, mountain navigation, barbarian customs.', color:'#5F9EA0'},
    {id:'cormyr', name:'Cormyr', region:'Forest Kingdom', lang:'Common', desc:'A well-ordered kingdom of knights and war wizards, ruled by the Obarskyr dynasty.', expertise:'Noble houses, Purple Dragon knights, war wizard corps, court etiquette.', color:'#800080'},
    {id:'calimshan', name:'Calimshan', region:'Calimshan', lang:'Common / Alzhedo', desc:'Southern desert nation of opulent pashas, genies, and ancient magic.', expertise:'Desert survival, djinn lore, merchant guilds, Calishite customs.', color:'#DAA520'},
    {id:'dalelands', name:'Dalelands', region:'The Dales', lang:'Common / Elvish', desc:'Rural communities nestled between ancient forests, fiercely independent.', expertise:'Farming, forest lore, elven relations, Harper networks.', color:'#6B8E23'},
    {id:'waterdeep', name:'Waterdeep', region:'City of Splendors', lang:'Common (all languages)', desc:'Massive cosmopolitan city — the jewel of the Sword Coast. Every faction has roots here.', expertise:'City navigation, guild politics, noble wards, Undermountain lore.', color:'#4682B4'},
    {id:'baldursGate', name:'Baldur\'s Gate', region:'Western Heartlands', lang:'Common', desc:'Sprawling trade city straddling the Chionthar. Rough, mercantile, pragmatic.', expertise:'Trade routes, Flaming Fist, smuggling, Wide/Gate politics.', color:'#8B0000'},
    {id:'neverwinter', name:'Neverwinter', region:'Sword Coast North', lang:'Common', desc:'The Jewel of the North, rebuilt after volcanic devastation. Hot springs keep it warm even in winter.', expertise:'Reconstruction politics, Many-Arrows orcs, Chasm threats, crafting guilds.', color:'#FF6347'},
    {id:'wanderer', name:'Wanderer', region:'Traveling', lang:'Common + trade pidgins', desc:'No fixed home. Caravan guard, pilgrim, exile, or adventurer by nature.', expertise:'Road survival, camp craft, danger sense, cultural adaptability.', color:'#909090'},
    {id:'outlander', name:'Outlander', region:'Wilderness', lang:'Common / tribal', desc:'Raised far from civilization. Tribal, feral, or simply self-sufficient.', expertise:'Tracking, foraging, animal behavior, weather prediction, shelter building.', color:'#556B2F'},
    {id:'urchin', name:'Street Urchin', region:'Various cities', lang:'Thieves\' Cant / Common', desc:'Grew up on the streets. Every city has shadows, and you know them all.', expertise:'Pickpocketing, hiding, city shortcuts, fence contacts, street survival.', color:'#696969'},
  ],

  // No singer forms in D&D
  singerForms: {},

  // Starting equipment packs
  startingKits: [
    {id:'explorer', name:'Explorer\'s Pack', weapons:['longsword','handaxe'], armor:'chain', spheres:'15gp',
     extras:['Backpack','Bedroll','Tinderbox','10 torches','10 days rations','Waterskin','50 ft rope'],
     expertise:null, desc:'Standard adventuring gear for dungeon delving.'},
    {id:'priest', name:'Priest\'s Pack', weapons:['mace'], armor:'chain', spheres:'25gp',
     extras:['Backpack','Blanket','10 candles','Tinderbox','Alms box','Incense','Vestments','Waterskin','5 days rations'],
     expertise:'Religion', desc:'Holy implements and supplies for the faithful.'},
    {id:'burglar', name:'Burglar\'s Pack', weapons:['shortsword','dagger'], armor:'leather', spheres:'10gp',
     extras:['Backpack','Ball bearings','String (10 ft)','Bell','5 candles','Crowbar','Hammer','10 pitons','Hooded lantern','2 flasks of oil','5 days rations','Tinderbox','Waterskin'],
     expertise:'Thieves\' tools', desc:'Everything a skilled infiltrator needs.'},
    {id:'scholar', name:'Scholar\'s Pack', weapons:['dagger'], armor:'none', spheres:'20gp',
     extras:['Backpack','Book of lore','Ink and pen','10 sheets parchment','Little bag of sand','Small knife','Spell component pouch'],
     expertise:'Arcana', desc:'Tools of the learned and arcane.'},
    {id:'diplomat', name:'Diplomat\'s Pack', weapons:['rapier'], armor:'leather', spheres:'30gp',
     extras:['Fine clothes','Signet ring','Scroll of pedigree','Purse'],
     expertise:'Persuasion', bonus:'Letter of introduction from noble patron',
     desc:'The accoutrements of privilege and influence.'},
    {id:'dungeoneer', name:'Dungeoneer\'s Pack', weapons:['battleaxe','handaxe'], armor:'scale', spheres:'12gp',
     extras:['Backpack','Crowbar','Hammer','10 pitons','10 torches','Tinderbox','10 days rations','Waterskin','50 ft rope'],
     expertise:null, desc:'Heavy-duty gear for delving into the deep places.'},
  ],

  // ══════════════════════════════════════════════════════════════════════
  // COMBAT & EQUIPMENT
  // ══════════════════════════════════════════════════════════════════════

  // D&D weapons
  weapons: {
    club:        {name:'Club',         skill:'lightWeapon', attr:'str', dmg:'1d4',  dmgType:'impact',  traits:['Light']},
    dagger:      {name:'Dagger',       skill:'lightWeapon', attr:'dex', dmg:'1d4',  dmgType:'keen',    traits:['Finesse','Light','Thrown [20/60]']},
    handaxe:     {name:'Handaxe',      skill:'lightWeapon', attr:'str', dmg:'1d6',  dmgType:'keen',    traits:['Light','Thrown [20/60]']},
    javelin:     {name:'Javelin',      skill:'lightWeapon', attr:'str', dmg:'1d6',  dmgType:'keen',    traits:['Thrown [30/120]']},
    lightHammer: {name:'Light Hammer', skill:'lightWeapon', attr:'str', dmg:'1d4',  dmgType:'impact',  traits:['Light','Thrown [20/60]']},
    mace:        {name:'Mace',         skill:'lightWeapon', attr:'str', dmg:'1d6',  dmgType:'impact',  traits:[]},
    quarterstaff:{name:'Quarterstaff', skill:'lightWeapon', attr:'str', dmg:'1d6',  dmgType:'impact',  traits:['Versatile (1d8)']},
    sickle:      {name:'Sickle',       skill:'lightWeapon', attr:'dex', dmg:'1d4',  dmgType:'keen',    traits:['Light']},
    spear:       {name:'Spear',        skill:'lightWeapon', attr:'str', dmg:'1d6',  dmgType:'keen',    traits:['Thrown [20/60]','Versatile (1d8)']},
    lightCrossbow:{name:'Light Crossbow',skill:'lightWeapon',attr:'dex',dmg:'1d8',  dmgType:'keen',    traits:['Ranged [80/320]','Loading','Two-Handed']},
    shortbow:    {name:'Shortbow',     skill:'lightWeapon', attr:'dex', dmg:'1d6',  dmgType:'keen',    traits:['Ranged [80/320]','Two-Handed']},
    battleaxe:   {name:'Battleaxe',    skill:'heavyWeapon', attr:'str', dmg:'1d8',  dmgType:'keen',    traits:['Versatile (1d10)']},
    greataxe:    {name:'Greataxe',     skill:'heavyWeapon', attr:'str', dmg:'1d12', dmgType:'keen',    traits:['Heavy','Two-Handed']},
    greatsword:  {name:'Greatsword',   skill:'heavyWeapon', attr:'str', dmg:'2d6',  dmgType:'keen',    traits:['Heavy','Two-Handed']},
    longsword:   {name:'Longsword',    skill:'heavyWeapon', attr:'str', dmg:'1d8',  dmgType:'keen',    traits:['Versatile (1d10)']},
    rapier:      {name:'Rapier',       skill:'heavyWeapon', attr:'dex', dmg:'1d8',  dmgType:'keen',    traits:['Finesse']},
    scimitar:    {name:'Scimitar',     skill:'heavyWeapon', attr:'dex', dmg:'1d6',  dmgType:'keen',    traits:['Finesse','Light']},
    shortsword:  {name:'Shortsword',   skill:'heavyWeapon', attr:'dex', dmg:'1d6',  dmgType:'keen',    traits:['Finesse','Light']},
    warhammer:   {name:'Warhammer',    skill:'heavyWeapon', attr:'str', dmg:'1d8',  dmgType:'impact',  traits:['Versatile (1d10)']},
    longbow:     {name:'Longbow',      skill:'heavyWeapon', attr:'dex', dmg:'1d8',  dmgType:'keen',    traits:['Ranged [150/600]','Heavy','Two-Handed']},
    heavyCrossbow:{name:'Heavy Crossbow',skill:'heavyWeapon',attr:'dex',dmg:'1d10', dmgType:'keen',    traits:['Ranged [100/400]','Heavy','Loading','Two-Handed']},
    unarmed:     {name:'Unarmed Strike',skill:'athletics',  attr:'str', dmg:'1',    dmgType:'impact',  traits:[]},
  },

  // D&D armor
  armors: {
    none:        {name:'No Armor',     deflect:0, traits:[]},
    padded:      {name:'Padded',       deflect:1, traits:['Light','Stealth Disadvantage']},
    leather:     {name:'Leather',      deflect:1, traits:['Light']},
    studdedLeather:{name:'Studded Leather',deflect:2, traits:['Light']},
    hide:        {name:'Hide',         deflect:2, traits:['Medium']},
    chainShirt:  {name:'Chain Shirt',  deflect:3, traits:['Medium']},
    scaleMail:   {name:'Scale Mail',   deflect:4, traits:['Medium','Stealth Disadvantage']},
    breastplate: {name:'Breastplate',  deflect:4, traits:['Medium']},
    halfPlate:   {name:'Half Plate',   deflect:5, traits:['Medium','Stealth Disadvantage']},
    ringMail:    {name:'Ring Mail',    deflect:4, traits:['Heavy','Stealth Disadvantage']},
    chainMail:   {name:'Chain Mail',   deflect:6, traits:['Heavy','Stealth Disadvantage','STR 13']},
    splint:      {name:'Splint',       deflect:7, traits:['Heavy','Stealth Disadvantage','STR 15']},
    plate:       {name:'Plate',        deflect:8, traits:['Heavy','Stealth Disadvantage','STR 15']},
    shield:      {name:'Shield',       deflect:2, traits:['Shield']},
  },

  // D&D spells → mapped to "surges" structure
  surges: [
    // Cantrips
    {id:'sacredFlame',  name:'Sacred Flame',  attr:'wis', orders:['cleric'],  desc:'Flame-like radiance descends on a creature. DEX save or 1d8 radiant damage.',                dmgType:'energy', targetDef:'spirDef'},
    {id:'fireBolt',     name:'Fire Bolt',     attr:'int', orders:['wizard'],  desc:'Hurl a mote of fire. Ranged spell attack, 1d10 fire damage.',                                dmgType:'energy', targetDef:'physDef'},
    {id:'light',        name:'Light',         attr:'int', orders:['cleric','wizard'], desc:'Touch an object — it sheds bright light in a 20-foot radius for 1 hour.',              dmgType:null,     targetDef:null},
    {id:'guidance',     name:'Guidance',      attr:'wis', orders:['cleric'],  desc:'Touch a willing creature. Once before the spell ends, it can add 1d4 to one ability check.',   dmgType:null,     targetDef:null},
    {id:'mageHand',     name:'Mage Hand',     attr:'int', orders:['wizard'],  desc:'A spectral floating hand appears. It can manipulate objects up to 30 feet away.',             dmgType:null,     targetDef:null},
    {id:'rayOfFrost',   name:'Ray of Frost',  attr:'int', orders:['wizard'],  desc:'Frigid beam. Ranged spell attack, 1d8 cold damage and speed reduced by 10 ft.',               dmgType:'energy', targetDef:'physDef'},
    // Level 1
    {id:'bless',        name:'Bless',         attr:'wis', orders:['cleric'],  desc:'Up to 3 creatures add 1d4 to attack rolls and saving throws for 1 minute. Concentration.',     dmgType:null,     targetDef:null},
    {id:'cureWounds',   name:'Cure Wounds',   attr:'wis', orders:['cleric'],  desc:'Touch heals 1d8 + spellcasting modifier HP.',                                                 dmgType:null,     targetDef:null},
    {id:'guidingBolt',  name:'Guiding Bolt',  attr:'wis', orders:['cleric'],  desc:'Flash of light streaks toward a creature. 4d6 radiant damage. Next attack has advantage.',     dmgType:'energy', targetDef:'physDef'},
    {id:'magicMissile', name:'Magic Missile',  attr:'int', orders:['wizard'],  desc:'Three glowing darts strike automatically. Each deals 1d4+1 force damage.',                     dmgType:'energy', targetDef:'physDef'},
    {id:'shield',       name:'Shield',        attr:'int', orders:['wizard'],  desc:'Reaction: invisible barrier of force grants +5 AC until start of next turn.',                  dmgType:null,     targetDef:null},
    {id:'burningHands', name:'Burning Hands', attr:'int', orders:['wizard'],  desc:'15-foot cone of flames. Each creature: DEX save or 3d6 fire damage.',                         dmgType:'energy', targetDef:'physDef'},
    {id:'sleepSpell',   name:'Sleep',         attr:'int', orders:['wizard'],  desc:'5d8 HP of creatures fall unconscious. Lowest HP first.',                                       dmgType:null,     targetDef:'cogDef'},
    {id:'thunderwave',  name:'Thunderwave',   attr:'int', orders:['wizard'],  desc:'Wave of thunderous force. 2d8 thunder damage, pushed 10 ft. CON save halves.',                dmgType:'energy', targetDef:'physDef'},
    {id:'healingWord',  name:'Healing Word',  attr:'wis', orders:['cleric'],  desc:'Bonus action. Creature within 60 ft regains 1d4 + spellcasting modifier HP.',                 dmgType:null,     targetDef:null},
    // Level 2
    {id:'spiritualWeapon',name:'Spiritual Weapon',attr:'wis', orders:['cleric'], desc:'Spectral weapon attacks. Bonus action: 1d8 + modifier force damage.',                       dmgType:'energy', targetDef:'physDef'},
    {id:'holdPerson',   name:'Hold Person',   attr:'wis', orders:['cleric','wizard'], desc:'Paralyze a humanoid. WIS save each turn. Concentration.',                              dmgType:null,     targetDef:'cogDef'},
    {id:'mistyStep',    name:'Misty Step',    attr:'int', orders:['wizard'],  desc:'Bonus action teleport up to 30 feet to an unoccupied space you can see.',                      dmgType:null,     targetDef:null},
    {id:'scorchingRay', name:'Scorching Ray',  attr:'int', orders:['wizard'],  desc:'Three rays of fire. Each: ranged spell attack, 2d6 fire damage.',                              dmgType:'energy', targetDef:'physDef'},
    // Level 3
    {id:'spiritGuardians',name:'Spirit Guardians',attr:'wis', orders:['cleric'], desc:'Spirits whirl around you. Enemies within 15 ft: WIS save or 3d8 radiant damage. Half on save. Concentration.', dmgType:'energy', targetDef:'spirDef'},
    {id:'fireball',     name:'Fireball',      attr:'int', orders:['wizard'],  desc:'20-foot-radius sphere of flame. Each creature: DEX save or 8d6 fire damage. Half on save.',    dmgType:'energy', targetDef:'physDef'},
    {id:'counterspell', name:'Counterspell',  attr:'int', orders:['wizard'],  desc:'Reaction: interrupt a creature casting a spell of 3rd level or lower. Higher levels require check.', dmgType:null, targetDef:null},
    {id:'revivify',     name:'Revivify',      attr:'wis', orders:['cleric'],  desc:'Touch a creature dead no longer than 1 minute. It returns to life with 1 HP.',                 dmgType:null,     targetDef:null},
  ],

  surgeScale: [
    {rank:0, die:'cantrip', size:'At-will'},
    {rank:1, die:'d8',  size:'1st Level Spell'},
    {rank:2, die:'d10', size:'2nd Level Spell'},
    {rank:3, die:'d12', size:'3rd Level Spell'},
    {rank:4, die:'2d8', size:'4th Level Spell'},
    {rank:5, die:'2d10',size:'5th Level Spell'},
  ],

  // Class spell lists → orderSurges
  orderSurges: {
    cleric: ['sacredFlame','guidance','light','bless','cureWounds','guidingBolt','healingWord','spiritualWeapon','holdPerson','spiritGuardians','revivify'],
    fighter: [],
    rogue: [],
    wizard: ['fireBolt','mageHand','rayOfFrost','light','magicMissile','shield','burningHands','sleepSpell','thunderwave','mistyStep','scorchingRay','holdPerson','fireball','counterspell'],
  },

  // D&D conditions
  conditions: {
    blinded:     {name:'Blinded',      desc:'Can\'t see. Auto-fail sight checks. Attack rolls have disadvantage; attacks against have advantage.'},
    charmed:     {name:'Charmed',      desc:'Can\'t attack the charmer. Charmer has advantage on social checks.'},
    deafened:    {name:'Deafened',      desc:'Can\'t hear. Auto-fail hearing checks.'},
    frightened:  {name:'Frightened',    desc:'Disadvantage on ability checks and attacks while source of fear is in sight. Can\'t willingly move closer.'},
    grappled:    {name:'Grappled',     desc:'Speed becomes 0. Ends if grappler is incapacitated or moved out of reach.'},
    incapacitated:{name:'Incapacitated',desc:'Can\'t take actions or reactions.'},
    invisible:   {name:'Invisible',    desc:'Can\'t be seen without magic. Attacks have advantage; attacks against have disadvantage.'},
    paralyzed:   {name:'Paralyzed',    desc:'Incapacitated, can\'t move or speak. Auto-fail STR/DEX saves. Attacks have advantage; melee hits are critical.'},
    petrified:   {name:'Petrified',    desc:'Transformed to stone. Weight increases x10. Incapacitated. Resistance to all damage.'},
    poisoned:    {name:'Poisoned',     desc:'Disadvantage on attack rolls and ability checks.'},
    prone:       {name:'Prone',        desc:'Melee attacks against have advantage. Ranged attacks have disadvantage. Standing costs half movement.'},
    restrained:  {name:'Restrained',   desc:'Speed 0. Attacks have disadvantage. Attacks against have advantage. DEX saves have disadvantage.'},
    stunned:     {name:'Stunned',      desc:'Incapacitated, can\'t move, can speak only falteringly. Auto-fail STR/DEX saves. Attacks against have advantage.'},
    unconscious: {name:'Unconscious',  desc:'Incapacitated, can\'t move or speak. Prone. Auto-fail STR/DEX saves. Melee hits are crits.'},
    exhaustion1: {name:'Exhaustion 1', desc:'Disadvantage on ability checks.'},
    exhaustion2: {name:'Exhaustion 2', desc:'Speed halved.'},
    exhaustion3: {name:'Exhaustion 3', desc:'Disadvantage on attack rolls and saving throws.'},
  },

  injuryEffects: [
    'Exhaustion 1 (disadvantage on ability checks)',
    'Exhaustion 1 (disadvantage on ability checks)',
    'Exhaustion 2 (speed halved)',
    'Prone (knocked down)',
    'Prone (knocked down)',
    'Stunned (dazed by the blow)',
    'Frightened (shaken by near-death)',
    'Grappled (pinned by debris or enemy)',
  ],

  adversaryRoles: {
    minion:  {name:'Minion',  healthMult:0.5, threat:0.5, noCrit:true,  rule:'Immediately defeated when suffering a critical hit'},
    rival:   {name:'Rival',   healthMult:1,   threat:1,   noCrit:false, rule:'Standard adversary rules'},
    boss:    {name:'Boss',    healthMult:2,   threat:4,   noCrit:false, rule:'Legendary actions, legendary resistances, lair actions'},
  },

  combatOpps: [
    'Allied reinforcements arrive',
    'Wounded enemy flees or surrenders',
    'Innocent bystander escapes',
    'Enemy is distracted — your next attack has advantage',
    'Enemy drops their weapon or gear',
    'Spot a useful vantage point or cover',
    'Find a healing potion on a fallen foe',
    'An environmental hazard shifts in your favor',
    'Brief respite — recover a spent hit die',
    'Spot a hidden passage or escape route',
    'Enemy accidentally reveals information',
    'A mysterious ally provides aid from the shadows',
  ],

  combatComps: [
    'Enemy reinforcements arrive',
    'An ally is knocked prone',
    'An ally or innocent is endangered',
    'Your position is compromised — enemies are alerted',
    'You or an ally drops or damages equipment',
    'Environmental hazard — collapsing floor, spreading fire, rising water',
    'A spell fizzles or misfires',
    'Torch goes out — partial darkness',
    'A trap is triggered nearby',
    'An enemy escapes or repositions advantageously',
    'The dungeon rumbles ominously — time pressure increases',
  ],

  // ══════════════════════════════════════════════════════════════════════
  // LORE & FLAVOR
  // ══════════════════════════════════════════════════════════════════════

  // NPC names — generic fantasy
  npcMale: [
    'Aldric','Bram','Cedric','Darian','Eldon','Falk','Gareth','Hadric','Iver','Jorin',
    'Kael','Lucan','Magnus','Nolan','Osric','Petyr','Quinn','Rowan','Soren','Theron',
    'Ulric','Voss','Willem','Xander','Yorick','Zephyr',
    'Baern','Darrak','Eberk','Gardain','Harbek','Kildrak','Morgran','Orsik','Rurik','Tordek',
    'Aramil','Berrian','Enialis','Galinndan','Hadarai','Heian','Laucian','Quarion','Riardon','Thamior',
    'Alton','Cade','Corrin','Eldon','Finnan','Garrett','Lyle','Merric','Osborn','Roscoe',
  ],

  npcFemale: [
    'Alara','Bryn','Celia','Dahlia','Elara','Freya','Gwen','Helena','Iris','Joanna',
    'Kira','Luna','Mira','Nessa','Ophelia','Petra','Roslyn','Sera','Thalia','Una',
    'Vera','Wren','Xyla','Yara','Zara',
    'Amber','Artin','Diesa','Eldeth','Gunnloda','Helja','Kathra','Mardred','Riswynn','Torbera',
    'Adrie','Althaea','Birel','Caelynn','Enna','Jelenneth','Leshanna','Meriele','Naivara','Sariel',
    'Bree','Cora','Euphemia','Jillian','Kithri','Lavinia','Lidda','Nedda','Paela','Vani',
  ],

  colors: [
    {name:'Crimson',hex:'#9B2335'},{name:'Gold',hex:'#C4972F'},{name:'Steel',hex:'#708090'},
    {name:'Forest',hex:'#2E8B57'},{name:'Royal',hex:'#4169E1'},{name:'Shadow',hex:'#4A4A4A'},
    {name:'Bronze',hex:'#CD7F32'},{name:'Silver',hex:'#C0C0C0'},
  ],

  npcColors: ['#9B2335','#C4972F','#708090','#2E8B57','#4169E1','#4A4A4A','#CD7F32','#8B4513','#800080','#DAA520'],

  statKeys: ['str','dex','con','int','wis','cha'],
  statNames: ['STR','DEX','CON','INT','WIS','CHA'],
  statFull: ['Strength','Dexterity','Constitution','Intelligence','Wisdom','Charisma'],

  skills: [
    {id:'acrobatics',     name:'Acrobatics',      attr:'dex', group:'physical'},
    {id:'animalHandling', name:'Animal Handling',  attr:'wis', group:'exploration'},
    {id:'arcana',         name:'Arcana',           attr:'int', group:'mental'},
    {id:'athletics',      name:'Athletics',        attr:'str', group:'physical'},
    {id:'deception',      name:'Deception',        attr:'cha', group:'social'},
    {id:'history',        name:'History',          attr:'int', group:'mental'},
    {id:'insight',        name:'Insight',          attr:'wis', group:'social'},
    {id:'intimidation',   name:'Intimidation',     attr:'cha', group:'social'},
    {id:'investigation',  name:'Investigation',    attr:'int', group:'mental'},
    {id:'medicine',       name:'Medicine',         attr:'wis', group:'mental'},
    {id:'nature',         name:'Nature',           attr:'int', group:'exploration'},
    {id:'perception',     name:'Perception',       attr:'wis', group:'social'},
    {id:'performance',    name:'Performance',      attr:'cha', group:'social'},
    {id:'persuasion',     name:'Persuasion',       attr:'cha', group:'social'},
    {id:'religion',       name:'Religion',         attr:'int', group:'mental'},
    {id:'sleightOfHand',  name:'Sleight of Hand',  attr:'dex', group:'physical'},
    {id:'stealth',        name:'Stealth',          attr:'dex', group:'physical'},
    {id:'survival',       name:'Survival',         attr:'wis', group:'exploration'},
  ],

  pathSkills: {
    cleric:'religion', fighter:'athletics', rogue:'stealth', wizard:'arcana'
  },

  sprenAppearances: {},

  purposes: [
    'Protect the Innocent — shield those who cannot defend themselves',
    'Seek Knowledge — uncover lost lore and ancient secrets',
    'Prove Your Worth — rise from humble origins to greatness',
    'Restore Balance — destroy evil wherever it lurks',
    'Seek Adventure — the unknown calls and you answer',
    'Earn Redemption — atone for past mistakes through noble deeds',
  ],

  obstacles: [
    'Haunted Past — dark memories that surface unbidden',
    'Personal Grudge — an enemy who wronged you still lives',
    'Forbidden Knowledge — you know something dangerous',
    'Crisis of Faith — doubts about your path and purpose',
    'Debt Owed — someone holds power over you',
  ],

  // D&D currency (maps to gemstones)
  gemstones: {
    copper:   {chip:1,   mark:10,   broam:100},
    silver:   {chip:1,   mark:10,   broam:100},
    gold:     {chip:1,   mark:10,   broam:100},
    platinum: {chip:1,   mark:10,   broam:100},
  },

  // ══════════════════════════════════════════════════════════════════════
  // WORLD DATA
  // ══════════════════════════════════════════════════════════════════════

  // Forgotten Realms locations
  locations: ['Waterdeep','Baldur\'s Gate','Neverwinter','Phandalin','Thundertree','Cragmaw Castle','Wave Echo Cave','Tresendar Manor','Triboar Trail','Conyberry','Old Owl Well','Wyvern Tor','Sword Mountains','Mere of Dead Men','Neverwinter Wood','High Road','Leilon','Thornhold'],
  offworldLocations: ['Shadowfell','Feywild','Elemental Plane of Fire','The Abyss'],
  shadesmarLocations: ['Undermountain','Underdark \u2014 Velkynvelve','Underdark \u2014 Blingdenstone','Underdark \u2014 Gracklstugh','Underdark \u2014 Neverlight Grove','Underdark \u2014 Menzoberranzan'],
  legendaryLocations: ['Tomb of Horrors','White Plume Mountain','Castle Ravenloft'],

  baseActs: [{num:1,tag:'Act I',start:0,end:59},{num:2,tag:'Act II',start:60,end:119},{num:3,tag:'Act III',start:120,end:179}],

  bladeTiers: ['Standard','Masterwork','Enchanted (+1)','Rare (+2)','Legendary (+3)'],

  bladeNames: {cleric:'Holy Avenger',fighter:'Flame Tongue',rogue:'Vorpal Dagger',wizard:'Staff of Power'},

  // ══════════════════════════════════════════════════════════════════════
  // PROGRESSION
  // ══════════════════════════════════════════════════════════════════════

  orderOaths: {
    cleric:['I serve a higher power.','I will protect the faithful.','I am a vessel of divine will.','My faith is unshakeable.','I am the light in the darkness.'],
    fighter:['I will master the blade.','I will protect my allies.','No foe can stand before me.','I am the shield wall.','I am war incarnate.'],
    rogue:['I survive by my wits.','The shadows are my ally.','I strike where they least expect.','I am uncatchable.','I am the shadow itself.'],
    wizard:['I seek knowledge above all.','The arcane is my weapon.','I bend reality to my will.','Magic is mine to command.','I have transcended mortal limits.'],
  },

  oathBonuses: {
    1:{desc:'Level 1 \u2014 Class features unlocked',combat:0,heal:0},
    2:{desc:'Level 3 \u2014 Subclass chosen',combat:1,heal:0},
    3:{desc:'Level 5 \u2014 Extra Attack / 3rd-level spells',combat:1,heal:1,ability:'Major class feature'},
    4:{desc:'Level 9 \u2014 Ability Score Improvement',combat:2,heal:2,ability:'Enhanced features'},
    5:{desc:'Level 13+ \u2014 Mastery',combat:3,heal:3,ability:'Pinnacle class feature'},
  },

  advancement: {
    1: {attr:false, hpBase:true,  maxSkill:2},
    2: {attr:false, hpGain:5,     maxSkill:2},
    3: {attr:true,  hpGain:5,     maxSkill:2},
    4: {attr:false, hpGain:5,     maxSkill:2},
    5: {attr:false, hpGain:5,     maxSkill:2},
    6: {attr:true,  hpGain:4,     maxSkill:3},
    7: {attr:false, hpGain:4,     maxSkill:3},
    8: {attr:false, hpGain:4,     maxSkill:3},
    9: {attr:true,  hpGain:4,     maxSkill:3},
    10:{attr:false, hpGain:4,     maxSkill:3},
  },

  orderIdeals: {
    cleric:{words:['faith','pray','divine','heal','holy','sacred','bless'],ideal:'I am a conduit of divine power'},
    fighter:{words:['fight','protect','strong','battle','warrior','blade','shield'],ideal:'No enemy can stand before me'},
    rogue:{words:['shadow','steal','sneak','hide','cunning','trick','quick'],ideal:'I strike from the shadows'},
    wizard:{words:['magic','arcane','spell','study','knowledge','power','learn'],ideal:'Knowledge is the ultimate power'},
  },

  hoidLines: [
    "A traveling minstrel catches your eye \u2014 patchwork cloak, knowing grin. He whispers a riddle that perfectly describes your situation, then vanishes into the crowd.",
    "You find a scrap of parchment tucked into your pack. In elegant script: 'The answer you seek is behind the door you haven't tried.' Unsigned.",
    "A raven lands on the windowsill and fixes you with an unsettlingly intelligent stare. It croaks a single word \u2014 relevant to your quest \u2014 then flies away.",
    "An old woman at the crossroads offers you a choice of three paths. 'All lead to your destination,' she says. 'Only one leads to you.' She fades like morning mist.",
    "A street performer juggles three balls. For a heartbeat, each ball becomes a scene from your past, your present, and your future. Then they're just balls again.",
    "Someone has carved a message into the dungeon wall, fresh: 'LOOK UP.' The chisel marks are warm to the touch.",
    "A cat follows you for three rooms, then sits and meows once \u2014 pointing its tail down a corridor you hadn't noticed. It vanishes when you look back.",
    "A half-drunk bard at the tavern sings a ballad about your exact situation. He claims he wrote it last week. 'Inspiration,' he says, tapping his nose.",
    "You dream of a silver dragon who speaks in your grandmother's voice: 'The treasure was never the gold, dear. You knew that already.'",
    "A child presses a smooth stone into your hand and says: 'The wizard on the hill said to give this to the brave one.' There is no hill and no wizard nearby.",
  ],

  // ══════════════════════════════════════════════════════════════════════
  // WEAPON GENERATION
  // ══════════════════════════════════════════════════════════════════════

  weaponPrefixes: ['Dragon','Shadow','Storm','Flame','Frost','Thunder','Silver','Crystal','Rune','Star'],
  weaponSuffixes: ['bane','strike','guard','fury','song','edge','fang','heart','caller','weaver'],

  // ══════════════════════════════════════════════════════════════════════
  // ENEMY CONFIGURATION
  // ══════════════════════════════════════════════════════════════════════

  // Enemy configuration for D&D — uses shared categories from enemyPatterns.js
  enemyCategories: ['undead','demons','dragons','giants','goblinoids','beasts','fey','elementals','aberrations','sea','lycanthropes','plants','humanEnemies','swarms'],

  enemyPools: {
    dungeon: [
      {name:'Skeleton',type:'Undead',baseHP:8,dmg:3,attackBonus:2},
      {name:'Zombie',type:'Undead',baseHP:10,dmg:3,attackBonus:1},
      {name:'Giant Rat',type:'Beast',baseHP:5,dmg:2,attackBonus:2},
      {name:'Goblin',type:'Goblinoid',baseHP:5,dmg:2,attackBonus:2},
      {name:'Animated Armor',type:'Construct',baseHP:12,dmg:4,attackBonus:3},
    ],
    wilderness: [
      {name:'Wolf',type:'Beast',baseHP:7,dmg:3,attackBonus:3},
      {name:'Bandit',type:'Humanoid',baseHP:8,dmg:3,attackBonus:2},
      {name:'Goblin Scout',type:'Goblinoid',baseHP:5,dmg:2,attackBonus:2},
      {name:'Orc Warrior',type:'Humanoid',baseHP:10,dmg:4,attackBonus:3},
      {name:'Dire Wolf',type:'Beast',baseHP:14,dmg:5,attackBonus:4},
    ],
    underdark: [
      {name:'Dark Mantle',type:'Aberration',baseHP:8,dmg:3,attackBonus:2},
      {name:'Drow Warrior',type:'Humanoid',baseHP:12,dmg:4,attackBonus:4},
      {name:'Giant Spider',type:'Beast',baseHP:8,dmg:3,attackBonus:3},
      {name:'Hook Horror',type:'Monstrosity',baseHP:18,dmg:6,attackBonus:4},
      {name:'Mind Flayer',type:'Aberration',baseHP:22,dmg:6,attackBonus:6},
    ],
    town: [
      {name:'Thug',type:'Humanoid',baseHP:10,dmg:3,attackBonus:2},
      {name:'Cultist',type:'Humanoid',baseHP:7,dmg:2,attackBonus:2},
      {name:'Spy',type:'Humanoid',baseHP:8,dmg:3,attackBonus:4},
      {name:'Cult Fanatic',type:'Humanoid',baseHP:12,dmg:4,attackBonus:3},
      {name:'Assassin',type:'Humanoid',baseHP:14,dmg:5,attackBonus:6},
    ],
    default: [
      {name:'Kobold',type:'Goblinoid',baseHP:4,dmg:2,attackBonus:2},
      {name:'Skeleton',type:'Undead',baseHP:8,dmg:3,attackBonus:2},
      {name:'Bandit',type:'Humanoid',baseHP:8,dmg:3,attackBonus:2},
      {name:'Wolf',type:'Beast',baseHP:7,dmg:3,attackBonus:3},
      {name:'Goblin',type:'Goblinoid',baseHP:5,dmg:2,attackBonus:2},
      {name:'Zombie',type:'Undead',baseHP:10,dmg:3,attackBonus:1},
    ],
  },

  // D&D-specific narrative patterns (supplement the shared patterns)
  enemyPatterns: [
    {keywords:[/drow|dark.elf|underdark.patrol/i], enemies:[
      {name:'Drow Warrior',type:'Humanoid',baseHP:12,dmg:4,attackBonus:4},
      {name:'Drow Priestess',type:'Elite',baseHP:18,dmg:5,attackBonus:5},
      {name:'Drow Scout',type:'Humanoid',baseHP:8,dmg:3,attackBonus:4},
    ]},
    {keywords:[/mind.flayer|illithid|brain/i], enemies:[
      {name:'Mind Flayer',type:'Aberration',baseHP:22,dmg:6,attackBonus:6},
      {name:'Intellect Devourer',type:'Aberration',baseHP:8,dmg:4,attackBonus:4},
    ]},
    {keywords:[/beholder|eye.ray|anti.magic/i], enemies:[
      {name:'Spectator',type:'Aberration',baseHP:14,dmg:5,attackBonus:4},
      {name:'Beholder',type:'Boss',baseHP:32,dmg:8,attackBonus:7},
    ]},
  ],

};
