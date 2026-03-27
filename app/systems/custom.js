/**
 * app/systems/custom.js — Custom World Builder
 * CYOAhub
 *
 * Takes a worldConfig from the wizard and constructs a full
 * SystemData-compatible object so the game engine works with any custom world.
 */

window.CustomSystem = {
  /**
   * Build a complete SystemData object from wizard worldConfig.
   * @param {Object} cfg - worldConfig from the wizard form
   * @returns {Object} A full SystemData-compatible object
   */
  build(cfg) {
    const id = cfg.id || 'custom-' + Date.now();
    const name = cfg.name || 'Custom World';
    const theme = cfg.theme || {};
    const magic = cfg.magic || {};
    const stats = cfg.stats || {};
    const gm = cfg.gm || {};
    const enemies = cfg.enemies || {};

    return {
      id,
      name,
      subtitle: cfg.tagline || 'A Custom Adventure',
      tagline: cfg.tagline || '',
      glyph: '🌍',

      theme: {
        primary:   theme.primary   || '#C9A84C',
        secondary: theme.secondary || '#28A87A',
        danger:    theme.danger    || '#B03828',
        bgTone:    theme.bgTone    || 'dark',
        titleFont: theme.titleFont || 'Cinzel',
        bodyFont:  theme.bodyFont  || 'Crimson Pro',
      },

      gmContext: {
        worldName:       gm.worldName       || name,
        systemName:      name,
        magicName:       magic.name          || 'Magic',
        magicResource:   magic.resource      || 'Mana',
        combatFlavor:    name,
        healFlavor:      magic.healFlavor    || 'Healing magic',
        errorFlavor:     'Something went wrong in ' + name + '.',
        worldLore:       gm.worldLore        || 'A world of adventure and mystery.',
        toneInstruction: gm.tone             || 'Epic fantasy — mythic stakes, personal cost.',
        magicRules:      magic.rules          || 'Magic costs ' + (magic.resource || 'Mana') + '. Casters must rest to recover.',
        npcFlavor:       gm.npcFlavor        || 'Fantasy names and cultures. Tavern keepers, guild masters, mysterious travelers.',
        choiceTagRules:  '[COMBAT] [DISCOVERY] [DECISION] [MAGIC] — tag every player choice.',
      },

      // Use generic fantasy defaults for all data tables
      // These provide a playable baseline for any custom world

      statKeys:  stats.keys  || ['str','dex','con','int','wis','cha'],
      statNames: stats.names || ['STR','DEX','CON','INT','WIS','CHA'],
      statFull:  stats.full  || ['Strength','Dexterity','Constitution','Intelligence','Wisdom','Charisma'],

      // Generic classes — warrior, mage, rogue, healer archetype
      classes: cfg.classes || [
        {id:'warrior',name:'Warrior',philosophy:'Strength conquers all.',surges:[],
         ideal1:'I will master the blade.',ideal2:'I protect my allies.',ideal3:'No foe can stand before me.',ideal4:'I am war incarnate.',
         spren:'Combat Training',sprenDesc:'Years of martial discipline honed to perfection.',
         sprenAssist:'Combat tactics, weapon mastery, endurance',
         desc:'A master of martial combat.',
         bonus:{str:2,dex:1,con:0,int:0,wis:0,cha:0},
         abilities:['Power Strike','Battle Cry','Defensive Stance','Whirlwind Attack','Undying Resolve'],
         dmgBonus:{crit:4,hit:2,miss:0},color:'#9B2335'},
        {id:'mage',name:'Mage',philosophy:'Knowledge is power.',surges:['arcaneBlast','ward','heal'],
         ideal1:'I seek arcane knowledge.',ideal2:'My spells grow stronger.',ideal3:'I bend reality to my will.',ideal4:'I transcend mortal limits.',
         spren:'Arcane Study',sprenDesc:'Deep study of the mystical arts.',
         sprenAssist:'Arcane lore, spell research, magical identification',
         desc:'A wielder of arcane power.',
         bonus:{str:0,dex:0,con:0,int:2,wis:1,cha:0},
         abilities:['Arcane Blast','Mystic Shield','Elemental Surge','Teleport','Time Stop'],
         dmgBonus:{crit:3,hit:2,miss:0},color:'#4169E1'},
        {id:'rogue',name:'Rogue',philosophy:'Strike from the shadows.',surges:[],
         ideal1:'I survive by my wits.',ideal2:'The shadows conceal me.',ideal3:'I strike where they least expect.',ideal4:'I am the shadow itself.',
         spren:'Shadow Training',sprenDesc:'A lifetime of stealth and cunning.',
         sprenAssist:'Lockpicking, trap detection, stealth, deception',
         desc:'A cunning operative of stealth and precision.',
         bonus:{str:0,dex:2,con:0,int:1,wis:0,cha:0},
         abilities:['Sneak Attack','Evasion','Smoke Bomb','Assassinate','Vanish'],
         dmgBonus:{crit:4,hit:2,miss:0},color:'#4A4A4A'},
        {id:'healer',name:'Healer',philosophy:'Life above all.',surges:['healingTouch','bless','smite'],
         ideal1:'I preserve life.',ideal2:'My healing touch strengthens.',ideal3:'I channel divine energy.',ideal4:'I am a conduit of life itself.',
         spren:'Divine Gift',sprenDesc:'A sacred connection to the forces of life.',
         sprenAssist:'Healing, purification, spiritual guidance',
         desc:'A devoted healer and protector.',
         bonus:{str:0,dex:0,con:0,int:0,wis:2,cha:1},
         abilities:['Healing Touch','Purify','Divine Shield','Resurrect','Holy Nova'],
         dmgBonus:{crit:2,hit:2,miss:0},color:'#2E8B57'},
      ],

      sprenBonds: cfg.sprenBonds || {
        warrior:{name:'Battle Spirit',nick:'Spirit',stages:['A fire kindles within you...','Your instincts sharpen — you see openings others miss.','Your body moves before your mind — reflexes perfected.','In combat, time slows. Every move is deliberate.','You are the weapon itself. Unstoppable.'],color:'#9B2335'},
        mage:{name:'Arcane Echo',nick:'Echo',stages:['Whispers of power tickle the edge of your mind...','The words of power come more easily now.','Magic flows through you like a river through a canyon.','Reality bends at your mere thought.','You see the fabric of existence — and you hold the thread.'],color:'#4169E1'},
        rogue:{name:'Shadow Instinct',nick:'Shadow',stages:['You notice things others overlook...','Shadows bend toward you, offering concealment.','Your reflexes defy explanation.','You slip through danger like smoke through fingers.','You are the darkness between heartbeats.'],color:'#4A4A4A'},
        healer:{name:'Life Force',nick:'Life',stages:['A warmth settles in your hands...','Your touch soothes pain — you sense injuries.','Life energy flows through you visibly now.','Plants grow where you walk. Wounds close at your glance.','You are the heartbeat of the world.'],color:'#2E8B57'},
      },

      heroRoles: cfg.heroRoles || [
        {id:'explorer',name:'Explorer',icon:'🧭',keyTalent:'Pathfinder',keyTalentDesc:'You can always find your way and cannot be lost.',startingSkill:'survival',specialties:['Scout','Cartographer','Ranger'],buildAttrs:['dex','wis'],buildSkills:['Survival','Perception'],multiPath:['Scholar','Outlaw'],desc:'A seasoned traveler and wayfinder.',bonus:{str:0,dex:1,con:0,int:0,wis:1,cha:0},ideal:'The horizon always calls.',color:'#6B8E23'},
        {id:'scholar',name:'Scholar',icon:'📖',keyTalent:'Lorekeeper',keyTalentDesc:'You can recall obscure facts and know where to find information.',startingSkill:'arcana',specialties:['Sage','Alchemist','Historian'],buildAttrs:['int','wis'],buildSkills:['Arcana','History'],multiPath:['Explorer','Noble'],desc:'A keeper of knowledge.',bonus:{str:0,dex:0,con:0,int:2,wis:0,cha:0},ideal:'Knowledge is the only treasure that grows when shared.',color:'#4169E1'},
        {id:'outlaw',name:'Outlaw',icon:'🗡',keyTalent:'Underground Contacts',keyTalentDesc:'You have connections in the criminal underworld.',startingSkill:'stealth',specialties:['Thief','Smuggler','Spy'],buildAttrs:['dex','cha'],buildSkills:['Deception','Stealth'],multiPath:['Explorer','Soldier'],desc:'Someone who lives outside the law.',bonus:{str:0,dex:1,con:0,int:0,wis:0,cha:1},ideal:'Freedom is worth any price.',color:'#4A4A4A'},
        {id:'noble',name:'Noble',icon:'👑',keyTalent:'Privilege',keyTalentDesc:'Common folk defer to you and nobles recognize your status.',startingSkill:'persuasion',specialties:['Courtier','Knight','Heir'],buildAttrs:['cha','int'],buildSkills:['History','Persuasion'],multiPath:['Scholar','Soldier'],desc:'Born to wealth and power.',bonus:{str:0,dex:0,con:0,int:1,wis:0,cha:1},ideal:'With power comes responsibility.',color:'#800080'},
        {id:'soldier',name:'Soldier',icon:'🛡',keyTalent:'Military Rank',keyTalentDesc:'Former soldiers recognize your authority and will assist you.',startingSkill:'athletics',specialties:['Officer','Mercenary','Guard'],buildAttrs:['str','con'],buildSkills:['Athletics','Intimidation'],multiPath:['Outlaw','Noble'],desc:'A trained warrior.',bonus:{str:1,dex:0,con:1,int:0,wis:0,cha:0},ideal:'Those who fight beside me are worth dying for.',color:'#9B2335'},
        {id:'mystic',name:'Mystic',icon:'🔮',keyTalent:'Spirit Sight',keyTalentDesc:'You can sense magical auras and supernatural presences.',startingSkill:'insight',specialties:['Oracle','Shaman','Monk'],buildAttrs:['wis','cha'],buildSkills:['Insight','Religion'],multiPath:['Scholar','Explorer'],desc:'One who walks between worlds.',bonus:{str:0,dex:0,con:0,int:0,wis:1,cha:1},ideal:'The unseen world shapes the seen.',color:'#9370DB'},
      ],

      heroWeapons: cfg.heroWeapons || [
        {id:'sword',name:'Sword',type:'Blade',dmgBonus:{crit:3,hit:2,miss:0},desc:'A versatile blade.',tiers:['Standard','Fine','Masterwork','Enchanted','Legendary']},
        {id:'axe',name:'Axe',type:'Heavy',dmgBonus:{crit:4,hit:2,miss:0},desc:'A brutal chopping weapon.',tiers:['Standard','Fine','Masterwork','Enchanted','Legendary']},
        {id:'bow',name:'Bow',type:'Ranged',dmgBonus:{crit:3,hit:1,miss:0},desc:'Strike from a distance.',tiers:['Standard','Fine','Masterwork','Enchanted','Legendary']},
        {id:'staff',name:'Staff',type:'Arcane',dmgBonus:{crit:2,hit:2,miss:1},desc:'Channeling focus for casters.',tiers:['Standard','Fine','Masterwork','Enchanted','Legendary']},
        {id:'daggers',name:'Daggers',type:'Dual',dmgBonus:{crit:3,hit:2,miss:0},desc:'Quick and concealable.',tiers:['Standard','Fine','Masterwork','Enchanted','Legendary']},
        {id:'hammer',name:'Hammer',type:'Blunt',dmgBonus:{crit:4,hit:2,miss:0},desc:'Crushes armor and bone.',tiers:['Standard','Fine','Masterwork','Enchanted','Legendary']},
      ],

      ancestries: cfg.ancestries || [
        {id:'human',name:'Human',desc:'Adaptable and ambitious. The most common folk.',size:'Medium',bonusTalentSource:'background',bonusTalentTiers:[1,4,8,12,16,19],color:'#C4972F'},
        {id:'elf',name:'Elf',desc:'Graceful and long-lived. Attuned to magic and nature.',size:'Medium',bonusTalentSource:'heritage',bonusTalentTiers:[1,5,10,15,20],color:'#2E8B57'},
        {id:'dwarf',name:'Dwarf',desc:'Stout and hardy. Masters of stone and steel.',size:'Medium',bonusTalentSource:'heritage',bonusTalentTiers:[1,5,10,15,20],color:'#8B4513'},
        {id:'halfling',name:'Halfling',desc:'Small but brave. Lucky and nimble.',size:'Small',bonusTalentSource:'heritage',bonusTalentTiers:[1,5,10,15,20],color:'#DAA520'},
      ],

      cultures: cfg.cultures || [
        {id:'urban',name:'City-Born',region:'Major Cities',lang:'Common',desc:'Raised in a bustling city among trade and politics.',expertise:'City navigation, guild knowledge, social etiquette.',color:'#9B2335'},
        {id:'rural',name:'Rural',region:'Farmlands',lang:'Common',desc:'Raised among fields and forests, close to the land.',expertise:'Farming, animal care, weather reading, folk remedies.',color:'#6B8E23'},
        {id:'frontier',name:'Frontier',region:'Borderlands',lang:'Common / tribal',desc:'Raised on the edge of civilization, between law and wildness.',expertise:'Survival, hunting, danger sense, frontier justice.',color:'#8B4513'},
        {id:'nomad',name:'Nomad',region:'Traveling',lang:'Various',desc:'No fixed home — caravan, tribe, or wanderer.',expertise:'Travel routes, camp craft, cultural adaptability, trade.',color:'#909090'},
      ],

      singerForms: {},

      startingKits: cfg.startingKits || [
        {id:'adventurer',name:'Adventurer',weapons:['sword','dagger'],armor:'leather',spheres:'10gp',extras:['Backpack','Rope','Torch x5','Rations x5'],expertise:null,desc:'Basic gear for any adventurer.'},
        {id:'scholar',name:'Scholar',weapons:['staff'],armor:'none',spheres:'15gp',extras:['Books','Ink','Parchment','Spell components'],expertise:'Lore',desc:'Tools of the learned.'},
        {id:'soldier',name:'Soldier',weapons:['sword','shield'],armor:'chain',spheres:'5gp',extras:['Rations x5','Whetstone','Bedroll'],expertise:'Military',desc:'Standard military issue.'},
        {id:'rogue',name:'Rogue',weapons:['dagger','dagger'],armor:'leather',spheres:'8gp',extras:['Lockpicks','Rope','Grappling hook','Smoke bomb'],expertise:'Underworld',desc:'Tools of the trade.'},
      ],

      weapons: cfg.weapons || {
        dagger:     {name:'Dagger',     skill:'lightWeapon',attr:'dex',dmg:'1d4',dmgType:'keen',traits:['Light','Thrown']},
        shortsword: {name:'Short Sword',skill:'lightWeapon',attr:'dex',dmg:'1d6',dmgType:'keen',traits:['Light','Finesse']},
        longsword:  {name:'Long Sword', skill:'heavyWeapon',attr:'str',dmg:'1d8',dmgType:'keen',traits:['Versatile']},
        greatsword: {name:'Greatsword', skill:'heavyWeapon',attr:'str',dmg:'2d6',dmgType:'keen',traits:['Two-Handed','Heavy']},
        mace:       {name:'Mace',       skill:'lightWeapon',attr:'str',dmg:'1d6',dmgType:'impact',traits:[]},
        staff:      {name:'Staff',      skill:'lightWeapon',attr:'str',dmg:'1d6',dmgType:'impact',traits:['Versatile','Arcane Focus']},
        shortbow:   {name:'Shortbow',   skill:'lightWeapon',attr:'dex',dmg:'1d6',dmgType:'keen',traits:['Ranged [80/320]','Two-Handed']},
        longbow:    {name:'Longbow',    skill:'heavyWeapon',attr:'dex',dmg:'1d8',dmgType:'keen',traits:['Ranged [150/600]','Two-Handed','Heavy']},
        unarmed:    {name:'Unarmed',    skill:'athletics',  attr:'str',dmg:'1d4',dmgType:'impact',traits:[]},
      },

      armors: cfg.armors || {
        none:    {name:'No Armor',   deflect:0, traits:[]},
        leather: {name:'Leather',    deflect:1, traits:['Light']},
        chain:   {name:'Chain',      deflect:3, traits:['Medium']},
        plate:   {name:'Plate',      deflect:5, traits:['Heavy']},
        shield:  {name:'Shield',     deflect:2, traits:['Shield']},
      },

      surges: cfg.surges || [
        {id:'arcaneBlast',name:'Arcane Blast',attr:'int',orders:['mage'],desc:'A bolt of raw magical energy.',dmgType:'energy',targetDef:'physDef'},
        {id:'ward',name:'Mystic Ward',attr:'wis',orders:['mage','healer'],desc:'A shield of magical force.',dmgType:null,targetDef:null},
        {id:'heal',name:'Healing Touch',attr:'wis',orders:['healer'],desc:'Channel life energy to mend wounds.',dmgType:null,targetDef:null},
        {id:'smite',name:'Holy Smite',attr:'cha',orders:['healer'],desc:'Strike with divine radiance.',dmgType:'energy',targetDef:'spirDef'},
      ],

      surgeScale: [{rank:1,die:'d4',size:'Minor'},{rank:2,die:'d6',size:'Standard'},{rank:3,die:'d8',size:'Greater'},{rank:4,die:'d10',size:'Superior'},{rank:5,die:'d12',size:'Supreme'}],

      orderSurges: cfg.orderSurges || {warrior:[],mage:['arcaneBlast','ward'],rogue:[],healer:['heal','smite','ward']},

      conditions: {
        poisoned:{name:'Poisoned',desc:'Disadvantage on attacks and ability checks.'},
        stunned:{name:'Stunned',desc:'Cannot take actions. Attacks against have advantage.'},
        prone:{name:'Prone',desc:'Melee attacks against have advantage. Must use movement to stand.'},
        restrained:{name:'Restrained',desc:'Speed 0. Attacks have disadvantage.'},
        frightened:{name:'Frightened',desc:'Disadvantage on checks while source of fear is visible.'},
        unconscious:{name:'Unconscious',desc:'Cannot take actions. Prone. Attacks are auto-crits in melee.'},
        burning:{name:'Burning',desc:'Take damage at start of each turn until extinguished.'},
        frozen:{name:'Frozen',desc:'Speed halved. Disadvantage on DEX checks.'},
      },

      injuryEffects: [
        'Exhausted (general stamina loss)',
        'Exhausted (general stamina loss)',
        'Prone (knocked down)',
        'Stunned (dazed by blow)',
        'Frightened (shaken)',
        'Restrained (pinned)',
        'Poisoned (infected wound)',
        'One arm injured — single-handed only',
      ],

      adversaryRoles: {
        minion:{name:'Minion',healthMult:0.5,threat:0.5,noCrit:true,rule:'Defeated on any critical hit'},
        rival:{name:'Rival',healthMult:1,threat:1,noCrit:false,rule:'Standard adversary'},
        boss:{name:'Boss',healthMult:2,threat:4,noCrit:false,rule:'Extra actions and legendary resistances'},
      },

      combatOpps: ['Reinforcements arrive','Enemy flees','Discover useful item','Environmental advantage','Enemy drops weapon','Brief respite — recover resources','Spot hidden path','Enemy reveals weakness','Ally arrives','Gain high ground','Find cover','Enemy infighting'],
      combatComps: ['Enemy reinforcements','Ally falls','Position compromised','Equipment damaged','Environmental hazard','Trap triggered','Spell fizzles','Light goes out','Enemy escapes','Time pressure increases','Ground gives way'],

      npcMale: ['Aldric','Bram','Cedric','Darian','Eldon','Falk','Gareth','Hadric','Iver','Jorin','Kael','Lucan','Magnus','Nolan','Osric','Petyr','Quinn','Rowan','Soren','Theron'],
      npcFemale: ['Alara','Bryn','Celia','Dahlia','Elara','Freya','Gwen','Helena','Iris','Joanna','Kira','Luna','Mira','Nessa','Ophelia','Petra','Roslyn','Sera','Thalia','Una'],
      colors: [{name:'Red',hex:'#c44a28'},{name:'Blue',hex:'#4169E1'},{name:'Green',hex:'#2E8B57'},{name:'Gold',hex:'#C4972F'},{name:'Purple',hex:'#800080'},{name:'Silver',hex:'#C0C0C0'},{name:'Amber',hex:'#DAA520'},{name:'Teal',hex:'#008B8B'}],
      npcColors: ['#c44a28','#4169E1','#2E8B57','#C4972F','#800080','#C0C0C0','#DAA520','#008B8B','#9B2335','#4A4A4A'],

      skills: [
        {id:'acrobatics',name:'Acrobatics',attr:'dex',group:'physical'},
        {id:'athletics',name:'Athletics',attr:'str',group:'physical'},
        {id:'stealth',name:'Stealth',attr:'dex',group:'physical'},
        {id:'arcana',name:'Arcana',attr:'int',group:'mental'},
        {id:'history',name:'History',attr:'int',group:'mental'},
        {id:'medicine',name:'Medicine',attr:'wis',group:'mental'},
        {id:'deception',name:'Deception',attr:'cha',group:'social'},
        {id:'insight',name:'Insight',attr:'wis',group:'social'},
        {id:'intimidation',name:'Intimidation',attr:'cha',group:'social'},
        {id:'perception',name:'Perception',attr:'wis',group:'social'},
        {id:'persuasion',name:'Persuasion',attr:'cha',group:'social'},
        {id:'survival',name:'Survival',attr:'wis',group:'exploration'},
        {id:'lightWeapon',name:'Light Weaponry',attr:'dex',group:'physical'},
        {id:'heavyWeapon',name:'Heavy Weaponry',attr:'str',group:'physical'},
      ],

      pathSkills: {warrior:'athletics',mage:'arcana',rogue:'stealth',healer:'medicine'},
      sprenAppearances: {},

      purposes: ['Save Others','Seek Truth','Prove Your Worth','Find Connection','Seek Justice','Preserve Life'],
      obstacles: ['Haunted Past','Personal Grudge','Forbidden Knowledge','Crisis of Faith','Debt Owed'],
      gemstones: {copper:{chip:1,mark:10,broam:100},silver:{chip:1,mark:10,broam:100},gold:{chip:1,mark:10,broam:100}},

      locations: cfg.locations || ['The Capital','Northern Wastes','Eastern Forest','Western Mountains','Southern Coast','Ancient Ruins','Dark Caverns','Sacred Temple','Merchant Town','Border Fort','Enchanted Lake','Cursed Swamp','Desert Oasis','Frozen Tundra','Volcanic Peaks','Sunken City','Floating Isles','Shadow Realm'],
      offworldLocations: cfg.offworldLocations || ['Spirit Realm','Dream World','Elemental Plane','The Void'],
      shadesmarLocations: cfg.shadesmarLocations || ['The Underworld','Deep Caverns','Ancient Tunnels','Lost Mines','Forgotten Catacombs','Hidden Vaults'],
      legendaryLocations: cfg.legendaryLocations || ['The Final Dungeon','The Throne of Gods','The World Tree'],

      baseActs: [{num:1,tag:'Act I',start:0,end:59},{num:2,tag:'Act II',start:60,end:119},{num:3,tag:'Act III',start:120,end:179}],
      bladeTiers: ['Basic','Fine','Superior','Legendary','Mythic'],
      bladeNames: {warrior:'Champion\'s Blade',mage:'Arcane Staff',rogue:'Shadow Edge',healer:'Holy Relic'},

      orderOaths: {
        warrior:['I will fight.','I will protect.','I will endure.','I will conquer.','I am unstoppable.'],
        mage:['I seek knowledge.','I master the arcane.','I reshape reality.','I transcend limits.','I am magic itself.'],
        rogue:['I survive.','I adapt.','I overcome.','I outmaneuver.','I am the unseen.'],
        healer:['I preserve life.','I heal all wounds.','I cleanse corruption.','I restore balance.','I am life itself.'],
      },
      oathBonuses: {
        1:{desc:'First oath sworn',combat:0,heal:0},
        2:{desc:'Power awakens',combat:1,heal:0},
        3:{desc:'Abilities strengthen',combat:1,heal:1,ability:'Enhanced power'},
        4:{desc:'True potential emerges',combat:2,heal:2,ability:'Major ability'},
        5:{desc:'Mastery achieved',combat:3,heal:3,ability:'Ultimate power'},
      },
      advancement: {
        1:{attr:false,hpBase:true,maxSkill:2},
        2:{attr:false,hpGain:5,maxSkill:2},
        3:{attr:true,hpGain:5,maxSkill:2},
        4:{attr:false,hpGain:5,maxSkill:2},
        5:{attr:false,hpGain:5,maxSkill:2},
        6:{attr:true,hpGain:4,maxSkill:3},
        7:{attr:false,hpGain:4,maxSkill:3},
        8:{attr:false,hpGain:4,maxSkill:3},
        9:{attr:true,hpGain:4,maxSkill:3},
        10:{attr:false,hpGain:4,maxSkill:3},
      },
      orderIdeals: {
        warrior:{words:['fight','protect','strong','battle','warrior','blade','shield'],ideal:'I am the shield that never breaks'},
        mage:{words:['magic','arcane','spell','study','knowledge','power','learn'],ideal:'Knowledge is the ultimate power'},
        rogue:{words:['shadow','steal','sneak','hide','cunning','trick','quick'],ideal:'I am the unseen hand'},
        healer:{words:['heal','life','save','restore','purify','protect','mend'],ideal:'All life has value'},
      },

      hoidLines: [
        "A stranger catches your eye — mismatched clothes, knowing smile. They tip an invisible hat and vanish into a crowd that wasn't there a moment ago.",
        "You find a note tucked under a stone. It reads: 'You are asking the wrong questions.' No signature.",
        "A street performer plays one chord that somehow says everything about your situation, then leaves.",
        "Someone has written in the dust: LOOK CLOSER. The marks are too precise to be accidental.",
        "A child hands you something meaningless and says 'they said you'd need this eventually.'",
      ],

      weaponPrefixes: ['Iron','Shadow','Storm','Flame','Frost','Thunder','Silver','Crystal','Rune','Star'],
      weaponSuffixes: ['bane','strike','guard','fury','song','edge','fang','heart','caller','weaver'],

      // Enemy config — set by wizard checkboxes
      enemyCategories: enemies.categories || ['undead','beasts','goblinoids','humanEnemies'],
      enemyPools: enemies.pools || {
        default: [
          {name:'Bandit',type:'Humanoid',baseHP:8,dmg:3,attackBonus:2},
          {name:'Wolf',type:'Beast',baseHP:7,dmg:3,attackBonus:3},
          {name:'Skeleton',type:'Undead',baseHP:8,dmg:3,attackBonus:2},
          {name:'Goblin',type:'Goblinoid',baseHP:5,dmg:2,attackBonus:2},
        ],
      },
      enemyPatterns: [],
    };
  },
};
