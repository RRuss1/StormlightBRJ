/**
 * ============================================================
 * app/combat.js — Combat Engine
 * Stormlight Chronicles
 * ============================================================
 * Handles:
 *   - enterCombat / exitCombat
 *   - resolveRound (5-phase: Buffs → Offense → Defense → Heal → End-of-Turn)
 *   - renderCombatScreen, renderCombatActions, renderCombatParty
 *   - callCombatGM (narrative + choice generation)
 *   - Combat dice (attack rolls, damage, deflect, injury)
 *   - Boss phases, environmental hazards
 *   - Shardblade crafting / upgrade
 *   - Spren memory recording
 * ============================================================
 */

// ══ AI DUNGEON MASTER — SYSTEM PROMPT ══
const AI_DM_SYSTEM_PROMPT = `You are the AI Dungeon Master for Stormlight Chronicles, a digital RPG set on Roshar in Brandon Sanderson's Cosmere.

PRIMARY OBJECTIVE: Create an immersive, narratively rich tabletop experience. You are simultaneously a storyteller, referee, and dramatic architect.

CORE RESPONSIBILITIES:
1. NARRATIVE CONTROL — Write in present tense, visceral and specific. Every action has a physical consequence. No abstract summaries.
2. RULE INTERPRETATION — Translate mechanical outcomes into story. Never use HP numbers, damage values, or game jargon in narrative text.
3. CHOICE GENERATION — Each choice must feel meaningfully different, true to the character's abilities, and specific to this exact moment.
4. DYNAMIC WORLD REACTION — Roshar reacts. Spren appear near strong emotion. Stormlight wisps when expended. Terrain shifts under battle.
5. GAME STATE AWARENESS — Track who is hurt, who has momentum, whose Stormlight is depleted. Let this shape tone and pacing.
6. PACING CONTROL — Short sentences in fast action. Longer ones for aftermath and revelation. Know when to breathe.
7. DRAMA AND TENSION — Every scene has stakes. Victory should taste of copper and shaking hands.
8. FAILURE/SUCCESS HANDLING — Failure is not the end. It is the story. Shape failure into consequence, never a dead end.
9. MEMORY AND CONTINUITY — Honor what happened before. Injuries persist. Oaths echo. Previous actions have weight.
10. COSMERE FIDELITY — Stormlight, Shards, spren, Radiants, the Everstorm are real and carry weight in every sentence.
11. CHARACTER VOICE — A Windrunner fights to protect. A Lightweaver seeks truth through illusion. Honor each order's philosophy.
12. TONE — Heroic but never naive. Dark but never hopeless. Ideals matter and cost something real.

NARRATIVE RULES — apply always:
- No raw numbers (HP, damage values, roll totals) in narrative text
- No game jargon ("you take damage", "roll athletics", "your turn", "modifier")
- Translate mechanics to fiction: "The blow staggers you backward" not "you lose 4 HP"
- Present tense throughout combat and story scenes
- Mechanical outcomes must be physically grounded — a crit is devastating, a miss is a near thing, a graze draws blood

CHOICES FORMAT (when generating player action choices):
- Always first-person: "I [verb]..." or an action verb implying "I"
- One vivid sentence — specific, concrete, physically grounded to this exact scene
- Always mechanically tagged: [ATTACK], [DEFEND], [HEAL], or [SURGE]
- Four distinct approaches: aggressive, defensive, ability-based, situational
- Reference specific enemies, terrain details, or current character state`;

// ══ COMBAT SYSTEMS ══

function renderEnemies(){
  const p=document.getElementById('enemy-panel');const el=document.getElementById('enemy-list');if(!p||!el||!gState)return;
  if(gState.combatMode){p.style.display='none';return;}
  const living=(gState.enemies||[]).filter(e=>e.hp>0);
  p.style.display=living.length?'block':'none';
  el.innerHTML=living.map(e=>{const pct=Math.round((e.hp/e.maxHp)*100);const col=pct>60?'#c44a28':pct>30?'#BA7517':'#888';return`<div class="enemy-card"><div class="enemy-name">${e.name}</div><div class="enemy-hp">${e.hp}/${e.maxHp} HP · ${e.type}</div><div style="height:3px;background:var(--border);border-radius:2px;margin-top:4px;overflow:hidden;"><div style="height:100%;width:${pct}%;background:${col};border-radius:2px;transition:width 0.4s;"></div></div></div>`;}).join('');
}
function renderInitiativeOrder(){
  const p=document.getElementById('initiative-panel');if(!p||!gState)return;
  if(gState.combatMode||!gState.combatActive||!(gState.combatOrder||[]).length){p.style.display='none';return;}
  p.style.display='block';
  document.getElementById('init-round-label').textContent=`⚔ Round ${gState.combatRound||1} — Initiative`;
  const cur=gState.players&&gState.players[gState.turn];
  document.getElementById('init-row').innerHTML=(gState.combatOrder||[]).map(co=>{
    const isEnemy=co.type==='enemy';
    const isCur=cur&&co.name===cur.name;
    const dead=(gState.enemies||[]).find(e=>e.name===co.name&&e.hp<=0);
  return`<div class="init-pill${isCur&&!dead?' init-active':''}" style="border:1px solid ${dead?'var(--border)':isCur&&!isEnemy?'var(--amber)':isCur&&isEnemy?'var(--coral2)':isEnemy?'rgba(196,74,40,0.4)':'rgba(191,161,90,0.3)'};background:${isCur?isEnemy?'rgba(196,74,40,0.18)':'rgba(191,161,90,0.18)':'var(--bg3)'};color:${dead?'var(--text5)':isCur?isEnemy?'#ff8060':'var(--gold-bright)':isEnemy?'var(--coral2)':'var(--amber2)'};text-decoration:${dead?'line-through':'none'};transform:${isCur&&!dead?'scale(1.1)':'scale(1)'};font-weight:${isCur&&!dead?'600':'400'};transition:all 0.3s;">${isCur?'⟁ ':''}${co.initiative} ${co.name}</div>`;
  }).join('');
}
function applyRollDamage(roll,actor,st){
  const cls=CLASSES.find(c=>c.id===actor.classId)||CLASSES[0];
  const db=cls.dmgBonus||{crit:2,hit:1,miss:0};
  const live=(st.enemies||[]).filter(e=>e.hp>0);
  const target=live.length?live[Math.floor(Math.random()*live.length)]:null;
  let msg='';
  if(roll>=18){
    actor.fragments=(actor.fragments||0)+1;
    if(target){const d=db.crit+Math.floor(Math.random()*3)+1;const oldHP=target.hp;target.hp=Math.max(0,target.hp-d);setTimeout(()=>animateHPChange(target.name,Math.round((oldHP/target.maxHp)*100),Math.round((target.hp/target.maxHp)*100),d,false),50);if(target.hp===0){actor.fragments+=3;checkEquipDrop(actor,st);}msg=`✦ Crit! ${target.name} -${d}HP${target.hp===0?' DEFEATED! +3 frags':''}  Frags:${actor.fragments}`;}
    else{const h=Math.min(2,actor.maxHp-actor.hp);actor.hp=Math.min(actor.maxHp,actor.hp+h);msg=h>0?`⬆ +${h} HP`:'✦ Critical strike';}
  } else if(roll>=10){
    if(target){const d=db.hit+Math.floor(Math.random()*2);target.hp=Math.max(0,target.hp-d);const chip=Math.floor(Math.random()*2);if(chip>0)actor.hp=Math.max(1,actor.hp-chip);msg=`Hit! ${target.name} -${d}HP${chip>0?' / ⬇-'+chip+' HP':''}`;}
    else{const d=Math.floor(Math.random()*2);if(d>0)actor.hp=Math.max(1,actor.hp-d);msg=d>0?`⬇ -${d} HP`:''}
  } else if(roll>=6){
    const d=Math.floor(Math.random()*3)+1;actor.hp=Math.max(1,actor.hp-d);msg=`⬇ -${d} HP`;
  } else {
    const d=Math.floor(Math.random()*4)+2;actor.hp=Math.max(0,actor.hp-d);msg=`💀 -${d} HP${actor.hp===0?' DOWNED!':''}`;
  }
  if(actor.classId==='edgedancer'&&roll>=10&&roll<18&&actor.hp<actor.maxHp){actor.hp=Math.min(actor.maxHp,actor.hp+1);msg+=' ✦ Regrowth +1';}
  if(st.enemies)st.enemies=st.enemies.filter(e=>e.hp>0);
  if(st.enemies&&!st.enemies.length){st.combatActive=false;st.combatOrder=[];st.combatRound=0;}
  const idx=st.players.findIndex(p=>p&&p.name===actor.name);
  if(idx>=0){st.players[idx]=actor;if(myChar&&myChar.name===actor.name){myChar=actor;saveMyChar(actor);}}
  return msg;
}
function checkEquipDrop(actor,st){
  const roll=Math.random();
  let msg='';
  if(roll>0.7&&!actor.shardplate){actor.shardplate=true;actor.maxHp=Math.round(actor.maxHp*1.4);actor.hp=Math.min(actor.maxHp,actor.hp+8);msg=' ⬛ SHARDPLATE!';}
  else if(roll>0.4&&!actor.shardblade){actor.shardblade=BLADE_NAMES[actor.classId]||'Shardblade';actor.bladeLevel=1;msg=` ⚔ ${actor.shardblade}!`;}
  return msg;
}

// ══ SHARDBLADE CRAFTING ══
function craftBlade(){
  if(!myChar||!gState)return;
  if((myChar.fragments||0)<3){alert('Need 3 Stormlight Fragments.');return;}
  myChar.shardblade=BLADE_NAMES[myChar.classId]||'Nascent Shardblade';
  myChar.bladeLevel=1;myChar.fragments=(myChar.fragments||0)-3;
  saveMyChar(myChar);const idx=gState.players.findIndex(p=>p&&p.name===myChar.name);
  if(idx>=0){gState.players[idx]=myChar;saveState(gState).catch(()=>{});}
  renderSheet();alert('⚔ '+myChar.shardblade+' forged!');
}
function upgradeBlade(){
  if(!myChar)return;const tier=myChar.bladeLevel||1;
  if(tier>=5){alert('Your blade has reached its ultimate form.');return;}
  if((myChar.fragments||0)<5){alert('Need 5 Stormlight Fragments.');return;}
  myChar.fragments=(myChar.fragments||0)-5;myChar.bladeLevel=tier+1;
  saveMyChar(myChar);const idx=gState&&gState.players.findIndex(p=>p&&p.name===myChar.name);
  if(idx>=0){gState.players[idx]=myChar;saveState(gState).catch(()=>{});}
  renderSheet();alert('⬆ Blade upgraded to Tier '+myChar.bladeLevel+' ('+BLADE_TIERS[myChar.bladeLevel-1]+')!');
}

// ══ SPREN MEMORIES ══
function recordSprenMemory(action,roll,turn){
  if(!myChar||!gState)return;
  const noteworthy=roll<6||roll>=18||/protect|sacrifice|refuse|truth|oath|remember|forget/i.test(action);
  if(!noteworthy)return;
  const bond=SPREN_BONDS[myChar.classId];if(!bond)return;
  const loc=getAct(turn).location||'the field';
  const mem=roll>=18?`Turn ${turn}: ${myChar.name} achieved something extraordinary in ${loc} — "${action.substring(0,50)}"`:roll<6?`Turn ${turn}: ${myChar.name} failed gravely in ${loc} — "${action.substring(0,50)}"`:  `Turn ${turn}: ${myChar.name} made a meaningful choice in ${loc} — "${action.substring(0,50)}"`;
  if(!gState.sprenMemories)gState.sprenMemories={};
  if(!gState.sprenMemories[myChar.name])gState.sprenMemories[myChar.name]=[];
  gState.sprenMemories[myChar.name].push(mem);
  if(gState.sprenMemories[myChar.name].length>5)gState.sprenMemories[myChar.name].shift();
  saveState(gState).catch(()=>{});
}
function getSprenMemoryContext(){
  if(!gState||!gState.sprenMemories)return'';
  const sz=gState.partySize||partySize;
  const lines=[];
  gState.players.slice(0,sz).filter(Boolean).forEach(p=>{
    const mems=gState.sprenMemories&&gState.sprenMemories[p.name];
    const bond=SPREN_BONDS[p.classId];
    if(mems&&mems.length&&bond)lines.push(`${bond.nick} (bonded to ${p.name}) remembers: ${mems.slice(-2).join(' | ')}`);
  });
  return lines.length?'\n\nSPREN MEMORIES (weave naturally into narration):\n'+lines.join('\\n'):'';
}
function getCharContext(){
  if(!myChar)return'';
  const parts=[];
  // Purpose + Obstacle (Official Ch.8) — shape dramatic decisions
  if(myChar.purpose)parts.push('Purpose: '+myChar.purpose);
  if(myChar.obstacle)parts.push('Obstacle: '+myChar.obstacle);
  // Official ancestry + culture context
  if(myChar.ancestry)parts.push('Ancestry: '+(myChar.ancestry==='singer'?'Singer':'Human'));
  if((myChar.culturalExpertises||[]).length){
    const cultNames=myChar.culturalExpertises.map(c=>c.name+' ('+c.region+')').join(', ');
    parts.push('Cultural background: '+cultNames);
    // Surface cultural expertise context for GM
    const cultDesc=myChar.culturalExpertises.map(c=>c.expertise).filter(Boolean).join(' | ');
    if(cultDesc)parts.push('Cultural knowledge: '+cultDesc);
  }
  if(myChar.origin)parts.push('Origin region: '+myChar.origin);
  if(myChar.motivation)parts.push('Driven by: '+myChar.motivation);
  if(myChar.backstory&&myChar.backstory.trim())parts.push('Background: '+myChar.backstory.trim());
  if(myChar.appearance&&myChar.appearance.trim())parts.push('Looks: '+myChar.appearance.trim());
  if(!myChar.isRadiant&&myChar.roleName)parts.push('Path: '+myChar.roleName);
  // Stat summary using official names
  const s=myChar.stats||{};
  const topStats=Object.entries(s).sort((a,b)=>b[1]-a[1]).slice(0,3)
    .map(([k,v])=>`${STAT_FULL[STAT_KEYS.indexOf(k)]||k} ${v}`).join(', ');
  if(topStats)parts.push('Highest attributes: '+topStats);
  const physDef=myChar.physDef||(10+(s.str||0)+(s.spd||0));
  const cogDef=myChar.cogDef||(10+(s.int||0)+(s.wil||0));
  parts.push(`Defenses — Physical:${physDef} Cognitive:${cogDef}`);
  // Inject kit and equipment
  if(myChar.kitName)parts.push('Starting kit: '+myChar.kitName);
  if(myChar.armor)parts.push('Armor: '+myChar.armor.name+' (Deflect '+myChar.deflect+')');
  if(myChar.weapons&&myChar.weapons.length){
    parts.push('Weapons: '+myChar.weapons.map(w=>w.name+' ['+w.dmg+' '+w.dmgType+']').join(', '));
  }
  // Active conditions
  if(myChar.conditions&&Object.keys(myChar.conditions).length){
    const activeC=Object.entries(myChar.conditions).filter(([k,v])=>v).map(([k])=>CONDITIONS[k]?CONDITIONS[k].name:k);
    if(activeC.length)parts.push('Active conditions: '+activeC.join(', '));
  }
  // Injuries
  if(myChar.injuries&&myChar.injuries.length){
    parts.push('Injuries: '+myChar.injuries.map(i=>i.severity+' ('+i.duration+') — '+i.effect).join('; '));
  }
  // Inject philosophy + current Ideal for Radiants
  if(myChar.isRadiant&&myChar.philosophy){
    parts.push('Philosophy: '+myChar.philosophy);
    // Spren personality from CLASSES
    const cls=CLASSES.find(cl=>cl.id===myChar.classId);
    if(cls&&cls.sprenDesc)parts.push('Spren personality: '+cls.sprenDesc);
    if(cls&&cls.sprenAssist)parts.push('Spren test assistance: '+cls.sprenAssist);
    const idealNum=myChar.oathStage||1;
    const idealKey='ideal'+idealNum;
    if(myChar[idealKey])parts.push('Current Ideal ('+idealNum+'): '+myChar[idealKey]);
    if(myChar.spren)parts.push('Spren: '+myChar.spren+(myChar.sprenAssist?'. Assists with: '+myChar.sprenAssist:''));
  }
  // Inject key talent for heroic path characters
  if(!myChar.isRadiant&&myChar.keyTalent){
    parts.push('Path key talent: '+myChar.keyTalent+' — '+myChar.keyTalentDesc);
  }
  if(!myChar.isRadiant&&myChar.weapon){
    const wd=myChar.weaponData;
    const tier=myChar.weaponLevel||1;
    const tierDesc=wd&&wd.tiers&&wd.tiers[tier-1]?wd.tiers[tier-1].desc:'';
    const weaponCtx=`${myChar.weapon} (Tier ${tier}${tierDesc?': '+tierDesc:''})`;
    parts.push('Weapon: '+weaponCtx);
    if(wd&&wd.style)parts.push('Fighting style: '+wd.style);
  }
  if(myChar.isRadiant&&myChar.shardblade){
    const bname=myChar.bladeName||myChar.shardblade;
    const bdesc=myChar.bladeDesc?` — ${myChar.bladeDesc}`:'';
    const blevel=myChar.bladeLevel||1;
    const bpow=blevel>=5?'fully manifested Shardblade, cuts through stone and steel effortlessly':
                blevel>=4?'Shardblade nearly fully formed, leaves glowing cuts':
                blevel>=3?'Shardblade solidifying, reliable in battle':
                blevel>=2?'Shardblade flickering but usable':'nascent Shardblade, unstable but deadly';
    parts.push(`Shardblade: ${bname}${bdesc} — Tier ${blevel}/5 (${bpow})`);
  }
  if(myChar.isRadiant&&myChar.className){
    const cl=CLASSES.find(c=>c.id===myChar.classId);
    if(cl&&cl.abilities&&cl.abilities.length){
      parts.push('Surgebinding abilities: '+cl.abilities.join(', '));
    }
  }
  return parts.length?'\n'+parts.join('. '):''
}

function getGenderContext(){
  if(!gState||!gState.players)return'';
  const sz=gState.partySize||partySize;
  const lines=[];
  gState.players.slice(0,sz).filter(Boolean).forEach(p=>{
    if(!p.gender)return;
    let subj='they',obj='them',poss='their';
    if(p.gender==='he/him'){subj='he';obj='him';poss='his';}
    else if(p.gender==='she/her'){subj='she';obj='her';poss='her';}
    lines.push(`${p.name}: ${p.gender} (${subj}/${obj}/${poss})`);
  });
  return lines.length?'\n\nCHARACTER PRONOUNS — use consistently, never switch mid-scene:\n'+lines.join('\\n'):'';
}

// ══ RENDER PROGRESS ══
function renderProgress(){
  const m=gState?gState.totalMoves:0;
  const act=getAct(m);
  document.getElementById('act-label').textContent=`${act.tag} · ${act.location||act.name}`;
  document.getElementById('prog-count').textContent=`${m} / 180`;
  document.getElementById('prog-fill').style.width=Math.min(100,Math.round(m/180*100))+'%';
  document.getElementById('chronicle-act').textContent=act.tag;
}

// ══ TURN PILL ══
function renderPill(){
  const pill=document.getElementById('turn-pill');if(!gState||!pill)return;
  const tb=document.getElementById('thinking-bar');
  if(tb&&tb.style.display==='block'){return;} // keep showing previous turn during deliberation
  const cur=gState.players[gState.turn];
  const mine=myChar&&cur&&!cur.isNPC&&cur.name===myChar.name;
  pill.textContent=mine?'⟁ Your Turn':cur&&cur.isNPC?`${cur.name} acting...`:`Waiting for ${cur?cur.name:'...'}`;
  pill.className='turn-pill'+(mine?' yours':'');
  renderSkipBtn();
}

// ══ CHARACTER SHEET ══
function toggleSheet(){
  sheetOpen=!sheetOpen;
  document.getElementById('sheet-panel').style.display=sheetOpen?'block':'none';
  document.getElementById('sheet-arrow').textContent=sheetOpen?'▾':'▸';
  if(sheetOpen&&myChar)renderSheet();
}
function renderSheet(){
  const p=document.getElementById('sheet-panel');if(!p||!myChar)return;
  const cls=CLASSES.find(c=>c.id===myChar.classId)||{dmgBonus:{crit:2,hit:1,miss:0}};
  const bond=SPREN_BONDS[myChar.classId];
  const stage=getSprenStage(gState&&gState.totalMoves||0);
  const stageDesc=bond?bond.stages[stage]:'';
  p.innerHTML=`
    <div class="sheet-row"><span class="sheet-lbl">Name</span><span class="sheet-val">${myChar.name}</span></div>
    <div class="sheet-row"><span class="sheet-lbl">Order</span><span class="sheet-val">${myChar.className}</span></div>
    <div class="sheet-row"><span class="sheet-lbl">HP</span><span class="sheet-val">${myChar.hp} / ${myChar.maxHp}</span></div>
    <div style="font-family:var(--font-d);font-size:10px;letter-spacing:2px;color:var(--text4);margin:6px 0 4px;">ATTRIBUTES</div>
    ${STAT_KEYS.map((k,i)=>`<div class="sheet-row"><span class="sheet-lbl">${STAT_FULL[i]} (${STAT_NAMES[i]})</span><span class="sheet-val">${myChar.stats[k]||0} <span style="color:var(--text4);font-size:12px;">+${myChar.stats[k]||0} to rolls</span></span></div>`).join('')}
    <div style="font-family:var(--font-d);font-size:10px;letter-spacing:2px;color:var(--text4);margin:10px 0 4px;">DEFENSES</div>
    <div class="sheet-row"><span class="sheet-lbl">Physical</span><span class="sheet-val" style="color:var(--teal2);">${myChar.physDef||10+((myChar.stats.str||0)+(myChar.stats.spd||0))}</span></div>
    <div class="sheet-row"><span class="sheet-lbl">Cognitive</span><span class="sheet-val" style="color:var(--amber2);">${myChar.cogDef||10+((myChar.stats.int||0)+(myChar.stats.wil||0))}</span></div>
    <div class="sheet-row"><span class="sheet-lbl">Spiritual</span><span class="sheet-val" style="color:var(--gold);">${myChar.spirDef||10+((myChar.stats.awa||0)+(myChar.stats.pre||0))}</span></div>
    <div style="font-family:var(--font-d);font-size:10px;letter-spacing:2px;color:var(--text4);margin:10px 0 4px;">COMBAT</div>
    <div class="sheet-row"><span class="sheet-lbl">Crit Dmg</span><span class="sheet-val" style="color:var(--coral2);">+${cls.dmgBonus.crit} / Hit +${cls.dmgBonus.hit}</span></div>
    ${myChar.shardblade?`<div class="sheet-row"><span class="sheet-lbl">⚔ Shardblade</span><span class="sheet-val" style="color:var(--amber2);">${myChar.shardblade} (Tier ${myChar.bladeLevel||1})</span></div>`:''}
    ${myChar.shardplate?`<div class="sheet-row"><span class="sheet-lbl">⬛ Shardplate</span><span class="sheet-val" style="color:var(--gold);">Equipped</span></div>`:''}
    <div class="sheet-row"><span class="sheet-lbl">✦ Fragments</span><span class="sheet-val" style="color:var(--teal2);">${myChar.fragments||0}</span></div>
    ${bond?`<div class="sheet-row"><span class="sheet-lbl">Spren Bond</span><span class="sheet-val" style="color:${bond.color};">${bond.name} (${stage+1}/5)</span></div>`:''}
    ${stageDesc?`<div style="font-size:14px;font-style:italic;color:var(--text4);padding:6px 0;border-top:1px solid var(--border);margin-top:4px;">${stageDesc}</div>`:''}
    ${(myChar.fragments||0)>=3&&!myChar.shardblade?`<div style="margin-top:8px;"><button class="btn btn-sm btn-gold" onclick="craftBlade()" style="font-size:12px;">⚔ Forge Blade (3 Frags)</button></div>`:''}
    ${(myChar.fragments||0)>=5&&(myChar.bladeLevel||0)<5?`<div style="margin-top:8px;"><button class="btn btn-sm btn-teal" onclick="upgradeBlade()" style="font-size:12px;">⬆ Upgrade Blade (5 Frags)</button></div>`:''}
    <div style="margin-top:10px;font-family:var(--font-d);font-size:10px;letter-spacing:2px;color:var(--text4);">SURGES & ABILITIES</div>
    <div class="abils">${myChar.abilities.map(a=>`<span class="abil">${a}</span>`).join('')}</div>
    ${myChar.isRadiant&&myChar.surges&&myChar.surges.length?`
    <div style="margin-top:8px;font-family:var(--font-d);font-size:10px;letter-spacing:2px;color:var(--text4);">SURGE SKILLS</div>
    <div style="font-size:12px;padding:4px 0;">${myChar.surges.map(sid=>{
      const surge=SURGES.find(s=>s.id===sid);
      const ranks=(myChar.surgeSkills&&myChar.surgeSkills[sid])||0;
      const attr=surge?surge.attr:'int';
      const attrScore=(myChar.stats&&myChar.stats[attr])||0;
      const mod=ranks+attrScore;
      return surge?`<div class="sheet-row"><span class="sheet-lbl">${surge.name} (${attr.toUpperCase()})</span><span class="sheet-val">Ranks ${ranks} +${mod} mod</span></div>`:'';
    }).join('')}</div>`:''}
    ${myChar.isRadiant&&myChar.philosophy?`
    <div style="margin-top:8px;font-family:var(--font-d);font-size:10px;letter-spacing:2px;color:var(--text4);">PHILOSOPHY & IDEALS</div>
    <div style="font-size:12px;color:var(--amber2);font-style:italic;padding:4px 0;">"${myChar.philosophy}"</div>
    <div style="font-size:11px;color:var(--text3);padding:2px 0;"><span style="color:var(--text4);">1st:</span> ${myChar.ideal1||''}</div>
    ${myChar.oathStage>=2?`<div style="font-size:11px;color:var(--teal2);padding:2px 0;"><span style="color:var(--text4);">2nd:</span> ${myChar.ideal2||''}</div>`:''}
    ${myChar.oathStage>=3?`<div style="font-size:11px;color:var(--teal2);padding:2px 0;"><span style="color:var(--text4);">3rd:</span> ${myChar.ideal3||''}</div>`:''}
    ${myChar.oathStage>=4?`<div style="font-size:11px;color:var(--gold);padding:2px 0;"><span style="color:var(--text4);">4th:</span> ${myChar.ideal4||''}</div>`:''}
    `:''}
    ${!myChar.isRadiant&&myChar.keyTalent?`
    <div style="margin-top:8px;font-family:var(--font-d);font-size:10px;letter-spacing:2px;color:var(--text4);">PATH: ${myChar.roleName||''}</div>
    <div style="font-size:12px;color:var(--amber2);padding:4px 0;font-weight:600;">${myChar.keyTalent}</div>
    <div style="font-size:11px;color:var(--text3);line-height:1.5;">${myChar.keyTalentDesc||''}</div>
    `:''}
    ${myChar.kit?`<div style="margin-top:10px;font-family:var(--font-d);font-size:10px;letter-spacing:2px;color:var(--text4);">EQUIPMENT — ${myChar.kitName||''}</div>${(myChar.weapons||[]).map(w=>`<div class=\"sheet-row\"><span class=\"sheet-lbl\">${w.name}</span><span class=\"sheet-val\">${w.dmg} ${dmgTypeLabel(w.dmgType)}</span></div>`).join('')}${myChar.armor?`<div class=\"sheet-row\"><span class=\"sheet-lbl\">Armor</span><span class=\"sheet-val\">${myChar.armor.name} · Deflect ${myChar.deflect||0}</span></div>`:''}`:''}
    ${myChar.ancestry?`<div style="margin-top:10px;font-size:12px;color:var(--text4);font-family:var(--font-d);letter-spacing:1px;">ORIGINS</div>
    <div style="font-size:13px;padding:4px 0;"><span style="color:var(--amber2);">Ancestry:</span> ${myChar.ancestry==='singer'?'Singer':'Human'}</div>
    ${(myChar.culturalExpertises||[]).map(cu=>`<div style="font-size:12px;padding:2px 0;"><span style="color:var(--text3);">Culture:</span> <span style="color:var(--text);">${cu.name}</span> <span style="color:var(--text5);font-size:11px;">(${cu.region})</span></div>`).join('')}`:''}`;
}

// ══ PDF EXPORT ══
function exportToPDF(){
  const h=document.getElementById('print-campaign-name');const d=document.getElementById('print-date');
  const party=gState&&gState.players?gState.players.filter(Boolean).map(p=>p.name).join(', '):'';
  if(h)h.textContent=((gState&&gState.campaignName)||campaignId||'Campaign')+' — '+party;
  if(d)d.textContent='Exported '+new Date().toLocaleDateString();
  window.print();
}

// ══ POLLING ══
// Debounce utility
function debounce(fn, ms){
  let timer;
  return(...args)=>{
    clearTimeout(timer);
    timer=setTimeout(()=>fn(...args),ms);
  };
}
const debouncedRenderAll=debounce(renderAll,150);
const debouncedSetBottom=debounce(setBottomFromState,100);

function startPolling(){
  if(pollTimer)clearInterval(pollTimer);
  pollTimer=setInterval(async()=>{
    // When WS connected, skip polling entirely — WS handles sync
    if(wsConnected)return;
    if(document.getElementById('s-game').classList.contains('active')&&!isLoading){
      await refreshGame();
    } else if(document.getElementById('s-combat').classList.contains('active')&&!isLoading){
      const fresh=await loadState();
      if(fresh&&JSON.stringify(fresh.pendingActions)!==JSON.stringify(gState&&gState.pendingActions)){
        gState=fresh;renderCombatScreen();renderCombatActions();
      }
    }
  },5000); // 5s fallback poll when WS unavailable
  if(!window._stormScroll){
    window.addEventListener('scroll',()=>{if(bottomState==='human-gated'||bottomState==='continue')checkScrollEnable();},{passive:true});
    window._stormScroll=true;
  }
}

// ══ LOG CACHE — avoid redundant Sheets reads ══
async function loadLogCached(force=false){
  if(!force&&_logCache&&(Date.now()-_logCacheTs)<LOG_CACHE_TTL){
    return _logCache;
  }
  _logCache=await loadLog(force);
  _logCacheTs=Date.now();
  return _logCache;
}
function invalidateLogCache(){_logCache=null;_logCacheTs=0;}

// ══ PERSISTENCE ══
function charKey(slot){return'sc_'+(campaignId||'default')+'_slot'+(slot!=null?slot:'x');}
function saveMyChar(ch){
  if(ch&&ch.slot!=null)localStorage.setItem(charKey(ch.slot),JSON.stringify(ch));
}
function loadMyChar(){
  if(!campaignId||!gState)return null;
  const sz=gState.partySize||partySize;
  for(let i=0;i<sz;i++){
    try{
      const raw=localStorage.getItem(charKey(i));
      if(!raw)continue;
      const ch=JSON.parse(raw);
      const slotPlayer=gState.players&&gState.players[i];
      if(slotPlayer&&slotPlayer.name===ch.name&&!slotPlayer.isNPC){
        return ch;
      }
      localStorage.removeItem(charKey(i));
    }catch(e){localStorage.removeItem(charKey(i));}
  }
  return null;
}
function clearMyChar(){
  if(!campaignId)return;
  const sz=(gState&&gState.partySize)||partySize;
  for(let i=0;i<sz;i++)localStorage.removeItem(charKey(i));
}

// ══ RESET ══
async function onReset(){
  if(!confirm('Reset this campaign for all players?'))return;
  try{
    clearMyChar();
    await saveState({players:new Array(partySize).fill(null),turn:0,totalMoves:0,phase:'pregame',partySize,campaignId,campaignName:gState&&gState.campaignName||campaignId});
    const t=await tok();
    await fetch('https://sheets.googleapis.com/v4/spreadsheets/'+SHEET_ID+'/values/'+encodeURIComponent(logSheet()+'!A:E')+'?valueInputOption=RAW',{method:'PUT',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json'},body:JSON.stringify({range:logSheet()+'!A:E',majorDimension:'ROWS',values:[['','','','','']]})});
    gState=null;myChar=null;renderPSZ();showScreen('title');
  }catch(e){alert('Reset failed: '+e.message);}
}

// ══════════════════════════════════════
// ══════════════════════════════════════

// ══ ENVIRONMENTAL HAZARDS ══
const ENV_HAZARDS={
  shattered_plains:{name:'Plateau Collapse',desc:'The plateau beneath you groans and tilts — footing is treacherous.',effect:'15% chance each round: random combatant takes 2 fall damage.',mechanic:'plateauCollapse'},
  aimian_sea:{name:'Cognitive Drift',desc:'The water whispers old memories — concentration wavers.',effect:'Spell-like abilities cost 1 extra fragment to use.',mechanic:'cognitiveDrift'},
  shadesmar:{name:'Cognitive Shadows',desc:'Half-real spren-shapes claw at your mind from the darkness.',effect:'Each round players lose 1 Stormlight fragment unless they spend an action resisting.',mechanic:'cognitiveDrain'},
  urithiru:{name:'Ancient Wards',desc:'The tower Sibling-wrought defenses still hum faintly.',effect:'Party gains +1 defense rating while inside the tower.',mechanic:'ancientWards'},
  braize:{name:'Void Whispers',desc:'The Everstorm howls across Damnation wastes.',effect:'Players must roll will or their action is disrupted this round.',mechanic:'voidWhispers'},
  kholinar:{name:'Unmade Influence',desc:'Re-Shephir remnants press against sanity.',effect:'10% chance per round player acts against party.',mechanic:'unmaAdeMadness'},
  default:{name:'Unknown Danger',desc:'Something is wrong with this place.',effect:'Combat is harder here.',mechanic:'none'},
};

function getHazardForLocation(loc){
  const l=(loc||'').toLowerCase();
  if(l.includes('shattered')||l.includes('plains'))return ENV_HAZARDS.shattered_plains;
  if(l.includes('aimian'))return ENV_HAZARDS.aimian_sea;
  if(l.includes('shadesmar'))return ENV_HAZARDS.shadesmar;
  if(l.includes('urithiru'))return ENV_HAZARDS.urithiru;
  if(l.includes('braize')||l.includes('damnation'))return ENV_HAZARDS.braize;
  if(l.includes('kholinar'))return ENV_HAZARDS.kholinar;
  return null; // no hazard for generic locations
}

function applyHazardEffect(hazard, gState){
  if(!hazard||hazard.mechanic==='none')return[];
  const sz=gState.partySize||partySize;
  const msgs=[];
  const living=gState.players.slice(0,sz).filter(p=>p&&!p.downed);
  if(hazard.mechanic==='plateauCollapse'&&Math.random()<0.15){
    const target=living[Math.floor(Math.random()*living.length)];
    if(target){target.hp=Math.max(1,target.hp-2);msgs.push(`⚠ Plateau collapse! ${target.name} -2HP`);}
  } else if(hazard.mechanic==='cognitiveDrain'){
    living.forEach(p=>{if((p.fragments||0)>0){p.fragments--;msgs.push(`${p.name} -1 frag (cognitive drain)`);}});
  } else if(hazard.mechanic==='ancientWards'){
    msgs.push('Ancient wards active: +1 defense this round');
  } else if(hazard.mechanic==='voidWhispers'&&Math.random()<0.3){
    const target=living[Math.floor(Math.random()*living.length)];
    if(target){msgs.push(`⚠ Void whispers disrupt ${target.name}'s action`);}
  }
  return msgs;
}

// ══ BOSS ENCOUNTERS ══
const BOSS_TEMPLATES=[
  {name:'The Blackthorns Shadow',type:'Alethi Traitor',phases:[{hp:40,dmg:8,atk:7,desc:'Aggressive, twin Shardblades gleaming'},{hp:25,dmg:11,atk:9,desc:'Shardplate cracking, fighting with desperate fury'},{hp:12,dmg:14,atk:12,desc:'Barely standing, Stormlight erupting wildly'}],drop:'Obsidian Shardblade'},
  {name:'Yelig-nars Vessel',type:'Unmade Host',phases:[{hp:35,dmg:7,atk:6,desc:'Human form, dark tendrils coiling'},{hp:20,dmg:10,atk:9,desc:'Half-transformed, grotesque power'},{hp:10,dmg:15,atk:13,desc:'Full transformation — barely recognizable'}],drop:'Voidlight Crystal'},
  {name:'The Heralds Echo',type:'Cognitive Shadow',phases:[{hp:45,dmg:9,atk:8,desc:'Calm, ancient, measuring'},{hp:28,dmg:12,atk:11,desc:'Revealing true divine fury'},{hp:14,dmg:16,atk:14,desc:'Burning with Taln fire'}],drop:'Heralds Remnant Plate'},
];

function shouldSpawnBoss(gState){
  const actNum=getAct(gState.totalMoves||0).num||1;
  const bossKey=`bossDefeated_act${actNum}`;
  if(gState[bossKey])return false;
  const actCombats=gState[`actCombats_${actNum}`]||0;
  return actCombats===1; // 0-indexed: second combat
}

// ══ HIGHSTORM EVENTS ══
async function checkHighstorm(){
  if(gState.combatMode||gState.highstorm)return;
  if(Math.random()>0.08)return; // 8% chance per beat
  gState.highstorm=true;
  const sz=gState.partySize||partySize;
  await saveState(gState);
  const party=gState.players.slice(0,sz).map(p=>p?`${p.name} the ${p.className}`:'?').join(', ');
  const loc=getAct(gState.totalMoves||0).location||'Roshar';
  const prompt=`Cosmere RPG GM. A HIGHSTORM has struck ${loc}!
Party: ${party}
${getGenderContext()}

Write a vivid 3-sentence highstorm scene: the wall of wind and lightning hitting, the party scrambling for shelter, the world transformed. Then present 4 survival choices — each character-class specific, under 1 sentence each.

[CHOICES]
1. (${gState.players[0]?gState.players[0].className:'Radiant'}-specific survival action)
2. (shelter and protect allies)
3. (use Stormlight surge to survive)
4. (bold exposure — ride the storm for power)

Tag: [COMBAT]. Under 200 words.${getGenderContext()}`;
  setBottomLoading();
  await callGM(prompt);
  gState.players.slice(0,sz).filter(Boolean).forEach(p=>{
    const healed=p.maxHp-p.hp;
    if(healed>0)animateHPChange(p.name,Math.round((p.hp/p.maxHp)*100),100,healed,true);
    p.hp=p.maxHp;
    p.focus=p.maxFocus||3;
    p.fragments=(p.fragments||0)+2;
    // Ch.9 long rest: Exhausted penalty −1, flesh wounds clear, temp conditions clear
    if(p.conditions&&p.conditions.exhausted>0){
      p.conditions.exhausted=Math.max(0,p.conditions.exhausted-1);
      if(p.conditions.exhausted===0)delete p.conditions.exhausted;
    }
    if(p.injuries)p.injuries=p.injuries.filter(i=>i.severity!=='Flesh Wound');
    if(p.conditions){['surprised','stunned','prone','slowed'].forEach(k=>{delete p.conditions[k];});}
  });
  gState.highstorm=false;
  await saveState(gState);
  const freshLog=await loadLog(true);
  renderAll(freshLog);
  setTimeout(()=>{setBottomFromState(freshLog);maybeTranslateStory();},150);
}

async function enterCombat(){
  if(!gState)return;
  try{
  // ── If combat already in progress, just restore the screen — don't re-roll enemies ──
  const existingEnemies=gState.combatEnemies&&gState.combatEnemies.filter(e=>!e.downed&&e.hp>0);
  if(existingEnemies&&existingEnemies.length>0&&gState.combatPhase&&gState.combatPhase!=='idle'){
    stormIntensify(true);
  showScreen('combat');
    renderCombatScreen();
    renderCombatActions();
    return;
  }
  const sz=gState.partySize||partySize;
  const actNum=getAct(gState.totalMoves||0).num||1;
  const avgBlade=gState.players.slice(0,sz).filter(Boolean).reduce((a,p)=>a+(p.bladeLevel||0),0)/sz;
  const loc=(getAct(gState.totalMoves||0).location||'').toLowerCase();
  const ENEMY_POOLS={
    shadesmar:[ {name:'Voidspren',type:'Spirit',baseHP:8,dmg:3,attackBonus:2},{name:'Gloomform',type:'Unmade Fragment',baseHP:14,dmg:5,attackBonus:4},{name:'Midnight Essence',type:'Unmade Shard',baseHP:11,dmg:4,attackBonus:3},{name:'Cognitive Shadow',type:'Remnant',baseHP:9,dmg:3,attackBonus:3},{name:'Spren Construct',type:'Splinter',baseHP:7,dmg:4,attackBonus:4} ],
    plains:[ {name:'Parshendi Warrior',type:'Warrior',baseHP:10,dmg:4,attackBonus:3},{name:'Parshendi Shardbearer',type:'Elite',baseHP:18,dmg:7,attackBonus:5},{name:'Parshendi Scout',type:'Scout',baseHP:8,dmg:3,attackBonus:3},{name:'Stormform Parshendi',type:'Voidbringer',baseHP:14,dmg:6,attackBonus:4},{name:'Warform Soldier',type:'Heavy',baseHP:16,dmg:5,attackBonus:4} ],
    braize:[ {name:'Fused',type:'Ancient',baseHP:22,dmg:8,attackBonus:6},{name:'Regal',type:'Parsh Void',baseHP:12,dmg:5,attackBonus:4},{name:'Magnified One',type:'Fused Elite',baseHP:18,dmg:7,attackBonus:5},{name:'Deepest One',type:'Fused Ancient',baseHP:20,dmg:9,attackBonus:6},{name:'Heavenly One',type:'Fused',baseHP:15,dmg:6,attackBonus:5} ],
    urithiru:[ {name:'Unmade Servant',type:'Cognitive Shadow',baseHP:12,dmg:4,attackBonus:3},{name:'Voidbringer',type:'Fused',baseHP:16,dmg:6,attackBonus:5},{name:'Re-Shephir Fragment',type:'Midnight Mother',baseHP:10,dmg:5,attackBonus:4},{name:'Ba-Ado-Mishram Echo',type:'Unmade',baseHP:18,dmg:6,attackBonus:4},{name:'Tower Shade',type:'Cognitive Shadow',baseHP:11,dmg:4,attackBonus:3} ],
    hearthstone:[ {name:'Void Scout',type:'Soldier',baseHP:9,dmg:3,attackBonus:3},{name:'Corrupted Townsman',type:'Parshman',baseHP:11,dmg:4,attackBonus:2},{name:'Stormform Soldier',type:'Voidbringer',baseHP:13,dmg:5,attackBonus:4},{name:'Darkform Guard',type:'Soldier',baseHP:10,dmg:4,attackBonus:3},{name:'Slumbering Horror',type:'Unknown',baseHP:15,dmg:5,attackBonus:3} ],
    sea:[ {name:'Sea Fiend',type:'Aimian',baseHP:12,dmg:5,attackBonus:4},{name:'Dysian Aimian',type:'Ancient',baseHP:16,dmg:6,attackBonus:4},{name:'Void Leviathan',type:'Sea Creature',baseHP:20,dmg:7,attackBonus:3},{name:'Santhid Spawn',type:'Creature',baseHP:10,dmg:4,attackBonus:3} ],
    default:[ {name:'Void Creature',type:'Unknown',baseHP:10,dmg:4,attackBonus:3},{name:'Darkform Soldier',type:'Soldier',baseHP:14,dmg:5,attackBonus:4},{name:'Voidspren Bound',type:'Corrupted',baseHP:9,dmg:4,attackBonus:3},{name:'Unmade Thrall',type:'Servant',baseHP:12,dmg:4,attackBonus:3},{name:'Stormspawn',type:'Creature',baseHP:11,dmg:5,attackBonus:4},{name:'Parshman Soldier',type:'Voidbringer',baseHP:13,dmg:4,attackBonus:3} ],
  };
  let poolKey='default';
  if(loc.includes('shadesmar')||loc.includes('nexus')||loc.includes('regret')||loc.includes('souls'))poolKey='shadesmar';
  else if(loc.includes('plains')||loc.includes('alethkar')||loc.includes('kholinar')||loc.includes('herdaz'))poolKey='plains';
  else if(loc.includes('braize')||loc.includes('damnation'))poolKey='braize';
  else if(loc.includes('urithiru')||loc.includes('kharbranth')||loc.includes('thaylen'))poolKey='urithiru';
  else if(loc.includes('hearthstone')||loc.includes('reshi')||loc.includes('purelake')||loc.includes('bavland'))poolKey='hearthstone';
  else if(loc.includes('sea')||loc.includes('aimian')||loc.includes('aimia'))poolKey='sea';
  const fullPool=ENEMY_POOLS[poolKey];
  const shuffled=[...fullPool].sort(()=>Math.random()-0.5);
  const pool=shuffled.slice(0,2);
  const count=Math.min(sz,2);
  gState.combatEnemies=pool.slice(0,count).map((e,i)=>({
    ...e,
    id:'enemy_'+i,
    hp:calcEnemyHP(e.baseHP,actNum,avgBlade),
    maxHp:calcEnemyHP(e.baseHP,actNum,avgBlade),
    downed:false
  }));
  gState.combatRound=1;
  gState.combatPhase='narrative';
  gState.pendingActions={};
  gState.combatLog=[];
  gState.diceLog=[];
  const combatLoc=getAct(gState.totalMoves||0).location||'';
  gState.combatHazard=getHazardForLocation(combatLoc);
  const combatActNum=getAct(gState.totalMoves||0).num||1;
  gState[`actCombats_${combatActNum}`]=(gState[`actCombats_${combatActNum}`]||0)+1;
  if(shouldSpawnBoss(gState)){
    const boss=BOSS_TEMPLATES[combatActNum-1]||BOSS_TEMPLATES[0];
    const phase=boss.phases[0];
    gState.combatEnemies=[{
      ...boss,id:'boss_'+actNum,
      hp:phase.hp,maxHp:boss.phases.reduce((a,p)=>a+p.hp,0),
      currentPhase:0,phaseHP:phase.hp,
      dmg:phase.dmg,attackBonus:phase.atk,
      isBoss:true,downed:false,type:boss.type
    }];
    gState[`bossDefeated_act${combatActNum}`]=false;
    gState.isBossFight=true;
  } else {
    gState.isBossFight=false;
  } // [{round, entries:[{name,roll,bonus,total,result,detail,color}]}]
  await saveState(gState);
  showScreen('combat');
  renderCombatScreen();
  if(lang==='th')setTimeout(applyThaiToPage,200);
  await callCombatGM('opening');
  }catch(e){
    console.error('enterCombat failed:',e);
    if(gState){gState.combatMode=false;gState.combatPhase=null;await saveState(gState);}
    showScreen('game');showGameScreen();
  }
}

function renderCombatScreen(){
  if(!gState)return;
  const sz=gState.partySize||partySize;
  const rl=document.getElementById('combat-round-label');
  if(rl)rl.textContent=`Round ${gState.combatRound||1}`;
  renderCombatParty();
  renderCombatEnemies();
  renderCombatInitiative();
}

function renderCombatParty(){
  const el=document.getElementById('combat-party-col');if(!el||!gState)return;
  const sz=gState.partySize||partySize;
  el.innerHTML=`<div style="font-family:var(--font-d);font-size:10px;letter-spacing:2px;color:var(--amber2);text-transform:uppercase;margin-bottom:8px;">Your Party</div>`+
  gState.players.slice(0,sz).filter(Boolean).map(p=>{
    const pct=Math.round((p.hp/p.maxHp)*100);
    const hpCol=pct>60?'var(--teal2)':pct>30?'#BA7517':'var(--coral2)';
    const bond=SPREN_BONDS[p.classId];
    const isMyChar=myChar&&p.name===myChar.name;
    const notYetSubmitted=!(gState.pendingActions&&gState.pendingActions[p.name]);
    const isActive=gState.combatPhase==='choosing'&&isMyChar&&notYetSubmitted;
    const submitted=gState.pendingActions&&gState.pendingActions[p.name];
    return`<div class="char-combat-card${p.downed?' downed':''}${isActive?' active-turn':''}">
      <div class="ccard-name-row">
        <div style="width:10px;height:10px;border-radius:50%;background:${p.color};flex-shrink:0;"></div>
        <span style="font-family:var(--font-d);font-size:13px;font-weight:600;">${p.name}</span>
        ${p.isNPC?'<span style="font-size:10px;color:var(--teal2);font-family:var(--font-d);">AI</span>':''}
      </div>
      <div style="font-size:12px;color:var(--text3);margin-bottom:6px;">${p.className}</div>
      <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:6px;">
        <span class="ccard-hp-big" style="color:${hpCol};">${p.downed?'DOWNED':p.hp}</span>
        <span class="ccard-hp-label">/ ${p.maxHp} HP</span>
      </div>
      <div style="height:5px;background:var(--border);border-radius:3px;overflow:hidden;margin-bottom:6px;">
        <div style="height:100%;width:${p.downed?0:pct}%;background:${hpCol};transition:width 0.4s;border-radius:3px;"></div>
      </div>
      ${bond?`<div style="font-size:10px;color:${bond.color};font-family:var(--font-d);">✦ ${bond.nick} ${getSprenStage(gState.totalMoves||0)+1}/5</div>`:''}
      ${p.shardblade?`<div style="font-size:10px;color:var(--amber2);">⚔ ${p.shardblade}</div>`:''}
      ${p.shardplate?`<div style="font-size:10px;color:var(--gold);">⬛ Shardplate</div>`:''}
      ${(p.fragments||0)>0?`<div style="font-size:10px;color:var(--teal2);">✦ ${p.fragments} frags</div>`:''}
      ${submitted?`<div style="font-size:10px;color:var(--teal2);margin-top:4px;">✓ Action ready</div>`:''}
    </div>`;
  }).join('');
}

function renderCombatEnemies(){
  const el=document.getElementById('combat-enemy-col');if(!el||!gState)return;
  const enemies=gState.combatEnemies||[];
  el.innerHTML=`<div style="font-family:var(--font-d);font-size:10px;letter-spacing:2px;color:var(--coral2);text-transform:uppercase;margin-bottom:8px;">Enemies</div>`+
  enemies.map(e=>{
    const pct=Math.round((e.hp/e.maxHp)*100);
    const hpCol=pct>60?'var(--coral2)':pct>30?'#BA7517':'#888';
    return`<div class="char-combat-card enemy-card${e.downed?' downed':''}">
      <div class="ccard-name-row">
        <span style="font-family:var(--font-d);font-size:13px;font-weight:600;color:var(--coral2);">${e.name}</span>
      </div>
      <div style="font-size:12px;color:var(--text4);margin-bottom:6px;">${e.type}</div>
      <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:6px;">
        <span class="ccard-hp-big" style="color:${hpCol};">${e.downed?'DEFEATED':e.hp}</span>
        <span class="ccard-hp-label">/ ${e.maxHp} HP</span>
      </div>
      <div style="height:5px;background:var(--border);border-radius:3px;overflow:hidden;">
        <div style="height:100%;width:${e.downed?0:pct}%;background:${hpCol};transition:width 0.4s;border-radius:3px;"></div>
      </div>
      <div style="font-size:10px;color:var(--text5);margin-top:6px;">DMG: ${e.dmg} · ATK: +${e.attackBonus}</div>
    </div>`;
  }).join('');
}

function renderDiceTicker(){
  const el=document.getElementById('combat-dice-ticker');
  if(!el||!gState)return;
  const log=gState.diceLog||[];
  if(!log.length){
    el.innerHTML='<div style="color:var(--text5);font-size:11px;font-style:italic;">Dice results will appear here each round...</div>';
    return;
  }
  const recent=[...log].reverse().slice(0,3);
  el.innerHTML=recent.map(round=>{
    const entries=round.entries||[];
    return`<div class="dice-round-header">Round ${round.round}</div>`+
    entries.map(e=>{
      const rollClass=e.result==='CRIT'?'dice-result-crit':e.result==='HIT'?'dice-result-hit':e.result==='HEAL'?'dice-result-heal':e.result==='MISS'?'dice-result-miss':'dice-result-dmg';
      const p=gState.players&&gState.players.find(x=>x&&x.name===e.name);
      const nameColor=p?p.color:e.isEnemy?'var(--coral2)':'var(--text3)';
      return`<div class="dice-row">
        <span class="dice-name" style="color:${nameColor};">${e.name}</span>
        <span class="dice-roll">d20:${e.roll}${e.bonus!=null?(e.bonus>=0?'+':'')+e.bonus+'='+e.total:''}</span>
        <span class="${rollClass}">▸ ${e.result}</span>
        <span style="color:var(--text4);">${e.detail}</span>
      </div>`;
    }).join('');
  }).join('');
  el.scrollTop=0;
}

function renderCombatInitiative(){
  const el=document.getElementById('combat-init-strip');if(!el||!gState)return;
  const sz=gState.partySize||partySize;
  const combatants=[
    ...gState.players.slice(0,sz).filter(Boolean).map(p=>({name:p.name,type:'player',color:p.color,downed:p.downed})),
    ...(gState.combatEnemies||[]).map(e=>({name:e.name,type:'enemy',color:'var(--coral2)',downed:e.downed}))
  ];
  el.innerHTML=combatants.map(co=>`<div class="init-pill${co.downed?' init-pill-dead':''}" style="border:1px solid ${co.type==='enemy'?'rgba(196,74,40,0.4)':'rgba(191,161,90,0.3)'};background:var(--bg3);color:${co.type==='enemy'?'var(--coral2)':'var(--amber2)'};text-decoration:${co.downed?'line-through':'none'};">${co.name}</div>`).join('');
}

function renderCombatActions(){
  const el=document.getElementById('combat-actions');if(!el||!gState||!myChar)return;
  const phase=gState.combatPhase;
  const sz=gState.partySize||partySize;
  const allSubmitted=gState.players.slice(0,sz).filter(p=>p&&!p.isNPC&&!p.downed).every(p=>gState.pendingActions&&gState.pendingActions[p.name]);

  if(phase==='narrative'||phase==='resolving'){
    el.innerHTML=`<div class="combat-waiting">The battle unfolds...</div>`;
    return;
  }
  if(phase==='victory'||phase==='defeat'){
    const won=phase==='victory';
    el.innerHTML=`<div style="text-align:center;padding:24px;">
      <div style="font-family:var(--font-d);font-size:20px;color:${won?'var(--amber2)':'var(--coral2)'};margin-bottom:12px;">${won?'⟁ Victory':'💀 Defeated'}</div>
      <button class="resolve-btn" onclick="exitCombat(${won})" style="border-color:${won?'var(--amber)':'var(--coral)'};">Return to the Chronicle →</button>
    </div>`;
    return;
  }

  const myPlayer=gState.players.find(p=>p&&myChar&&p.name===myChar.name);
  const iAmHuman=myPlayer&&!myPlayer.isNPC&&!myPlayer.downed;
  const mySubmitted=!!(gState.pendingActions&&gState.pendingActions[myChar.name]);

  let html='';
  gState.players.slice(0,sz).filter(p=>p&&!p.isNPC&&!p.downed&&gState.pendingActions&&gState.pendingActions[p.name]).forEach(p=>{
    html+=`<div class="combat-submitted">✓ ${p.name}: ready</div>`;
  });

  if(iAmHuman&&!mySubmitted&&awayMode){
    awayMode=false;
    renderSkipBtn();
    setTimeout(()=>skipCombatTurn(myChar.name),200);
    return;
  }
  if(iAmHuman&&!mySubmitted){
    const cached=gState.combatChoicesCache&&gState.combatChoicesCache[myChar.name];
    const choices=cached&&cached.length>=4?cached:null;
    html+=`<div class="combat-player-label">⟁ Your Action — ${myChar.name}</div>`;
    if(!choices){
      // Show loading skeleton — AI choices loading
      const skeletonStyle='opacity:0.35;pointer-events:none;cursor:default;';
      const skels=['ATTACK','HEAL','DEFEND','ATTACK'];
      const skelHTML=skels.map((tag,i)=>{
        const tagCol=tag==='HEAL'?'var(--teal2)':tag==='DEFEND'?'var(--amber2)':'var(--coral2)';
        const tagBadge='<span style="font-size:9px;padding:1px 6px;border-radius:8px;background:'+tagCol+'22;color:'+tagCol+';">'+tag+'</span>';
        return'<button class="achoice" style="'+skeletonStyle+'"><span class="achoice-num">Option '+(i+1)+' '+tagBadge+'</span><span style="display:inline-block;width:85%;height:14px;background:var(--border2);border-radius:4px;vertical-align:middle;animation:starGlow 1.5s ease-in-out infinite;"></span></button>';
      }).join('');
      html+=`<div class="action-choices" style="margin-bottom:12px;">${skelHTML}</div>`;
    } else {
      const choiceHTML=choices.map((ch,i)=>{
        const display=ch.replace(/\[ATTACK\]|\[DEFEND\]|\[HEAL\]|\[SURGE\]|\[SKILL\]/g,'').trim();
        const m=ch.match(/\[(ATTACK|DEFEND|HEAL|SURGE|SKILL)\]/);
        const tag=m?m[1]:'';
        const tagCol=tag==='HEAL'?'var(--teal2)':tag==='DEFEND'?'var(--amber2)':tag==='SURGE'?'var(--amber)':tag==='SKILL'?'var(--text3)':'var(--coral2)';
        const tagBadge=tag?'<span style="font-size:9px;padding:1px 6px;border-radius:8px;background:'+tagCol+'22;color:'+tagCol+';">'+tag+'</span>':'';
        const safeOrig=ch.replace(/`/g,"'").replace(/"/g,'&quot;');
        return'<button class="achoice" onclick="selectCombatAction(this,`'+safeOrig+'`)"><span class="achoice-num">Option '+(i+1)+' '+tagBadge+'</span>'+display+'</button>';
      }).join('');
      html+=`<div class="action-choices" style="margin-bottom:12px;">${choiceHTML}</div>`;
    }
    html+=`<div class="custom-row" style="position:relative;display:flex;gap:6px;align-items:flex-start;">
  <input class="custom-in" id="combat-custom-in" placeholder="Or describe your own action..." maxlength="200" oninput="broadcastTyping&&broadcastTyping()" style="flex:1;"/>
  <button onclick="startVoiceInput('combat-custom-in')" title="Speak your action" style="background:none;border:1px solid var(--border2);border-radius:var(--r);padding:12px;cursor:pointer;font-size:14px;color:var(--text4);flex-shrink:0;">🎙</button>
  <div class="action-tooltip" id="action-tooltip">
    <div style="font-family:var(--font-d);font-size:10px;letter-spacing:2px;color:var(--amber2);margin-bottom:6px;">KEYWORDS</div>
    <div class="tooltip-grid">
      <span class="tooltip-key">attack</span><span class="tooltip-desc">offensive strike</span>
      <span class="tooltip-key">defend</span><span class="tooltip-desc">guard stance, DR next hit</span>
      <span class="tooltip-key">heal</span><span class="tooltip-desc">Stormlight recovery</span>
      <span class="tooltip-key">revive</span><span class="tooltip-desc">bring back downed ally</span>
      <span class="tooltip-key">surge</span><span class="tooltip-desc">surgebinding ability</span>
      <span class="tooltip-key">skill</span><span class="tooltip-desc">social or perception</span>
    </div>
    <div style="font-size:10px;color:var(--text5);margin-top:6px;font-style:italic;">Start your action with a keyword to tag it automatically</div>
  </div>
</div>`;
    html+=`<div class="act-row" style="margin-top:10px;"><button class="btn-act" onclick="submitCombatAction()">⚔ Act →</button></div>`;
  } else if(iAmHuman&&mySubmitted){
    const stillWaiting=gState.players.slice(0,sz).filter(p=>p&&!p.isNPC&&!p.downed&&(!gState.pendingActions||!gState.pendingActions[p.name])).map(p=>p.name);
    html+=stillWaiting.length?`<div class="combat-waiting">Waiting for ${stillWaiting.join(', ')}...</div>`:'<div class="combat-waiting" style="color:var(--teal2);">✓ All actions ready — resolving...</div>';
  } else if(!iAmHuman){
    html+=`<div class="combat-waiting">Spectating — NPCs acting...</div>`;
  }
  if(isHost()||isSelfTurn()){
    const notSubmitted=gState.players.slice(0,sz)
      .filter(p=>p&&!p.isNPC&&!p.downed&&(!gState.pendingActions||!gState.pendingActions[p.name]))
      .filter(p=>p.name!==myChar.name); // don't show skip for yourself here (use self-submit)
    notSubmitted.forEach(p=>{
      html+=`<button onclick="skipCombatTurn('${p.name}')" style="margin-top:8px;width:100%;background:transparent;border:1px solid var(--border2);border-radius:20px;padding:6px 16px;cursor:pointer;font-family:var(--font-d);font-size:10px;letter-spacing:1px;color:var(--text4);">⏭ Skip ${p.name}'s combat turn</button>`;
    });
  }

  // Resolve button: only show to host (slot 0 human) once ALL humans submitted
  // In solo play, the single human IS the host — always shows for them
  const humanPlayers=gState.players.slice(0,sz).filter(p=>p&&!p.isNPC&&!p.downed);
  const isSoloHuman=humanPlayers.length===1;
  const showResolve=allSubmitted&&(isHost()||isSoloHuman);
  if(showResolve){
    html+=`<button class="resolve-btn" onclick="setTimeout(resolveRound,0)">⚔ Resolve Round →</button>`;
  } else if(allSubmitted&&!isHost()&&!isSoloHuman){
    // Non-host sees a waiting message instead
    html+=`<div style="text-align:center;padding:14px;font-family:var(--font-d);font-size:11px;letter-spacing:2px;color:var(--teal2);">✓ READY — waiting for host to resolve</div>`;
  }
  el.innerHTML=html;
  if(lang==='th')setTimeout(applyThaiToPage,100);
}

function selectCombatAction(btn,txt){
  document.querySelectorAll('#combat-actions .achoice').forEach(b=>b.classList.remove('sel'));
  btn.classList.add('sel');
  combatSelectedAction=txt;
  document.getElementById('combat-custom-in')&&(document.getElementById('combat-custom-in').value='');
}

async function submitCombatAction(){
  const custom=document.getElementById('combat-custom-in');
  let action=custom&&custom.value.trim()||combatSelectedAction;
  if(!action||!myChar)return;
  if(custom&&custom.value.trim()&&!/\[(HEAL|ATTACK|DEFEND|SURGE|SKILL|REVIVE)\]/.test(action)){
    const lower=action.toLowerCase();
    // Explicit keyword shortcuts (case insensitive)
    if(/^heal\b/.test(lower))action='[HEAL] '+action.replace(/^heal\s*/i,'');
    else if(/^revive\b/.test(lower))action='[HEAL] revive — '+action.replace(/^revive\s*/i,'');
    else if(/^defend\b/.test(lower))action='[DEFEND] '+action.replace(/^defend\s*/i,'');
    else if(/^surge\b/.test(lower))action='[SURGE] '+action.replace(/^surge\s*/i,'');
    else if(/^skill\b/.test(lower))action='[SKILL] '+action.replace(/^skill\s*/i,'');
    else if(/^attack\b/.test(lower))action='[ATTACK] '+action.replace(/^attack\s*/i,'');
    // Fallback keyword detection from action text
    else if(/heal|mend|regrow|restore|tend|bandage|cure|knit/.test(lower))action='[HEAL] '+action;
    else if(/revive|stabilize|pull.*back|rouse/.test(lower))action='[HEAL] '+action;
    else if(/defend|block|shield|protect|brace|guard|parry|stance/.test(lower))action='[DEFEND] '+action;
    else if(/soulcast|lash|illusion|surge|transmute|conjure|lightweave/.test(lower))action='[SURGE] '+action;
    else if(/search|scout|perceive|persuade|negotiate|bluff|charm/.test(lower))action='[SKILL] '+action;
    else action='[ATTACK] '+action;
  }
  if(!action||!myChar)return;
  if(!gState.pendingActions)gState.pendingActions={};
  gState.pendingActions[myChar.name]=action;
  combatSelectedAction='';
  renderCombatActions(); // instant feedback
  await saveAndBroadcast(gState); // async save in background
  const sz=gState.partySize||partySize;
  gState.players.slice(0,sz).filter(p=>p&&p.isNPC&&!p.downed).forEach(p=>{
    if(!gState.pendingActions[p.name]){
      const choices=buildCombatChoices(p,gState);
      gState.pendingActions[p.name]=choices[Math.floor(Math.random()*choices.length)];
    }
  });
  await saveAndBroadcast(gState);
  renderCombatActions();
}

async function resolveRound(){
  if(!gState)return;
  try{
  gState.combatPhase='resolving';
  renderCombatActions();
  const sz=gState.partySize||partySize;
  const stage=getSprenStage(gState.totalMoves||0);
  const roundDice={round:gState.combatRound,entries:[]};

  // ── Build action list: map each pending action to a structured object ──
  const allActions=[];

  // Player actions
  Object.entries(gState.pendingActions||{}).forEach(([name,action])=>{
    const p=gState.players.find(x=>x&&x.name===name);
    if(!p||p.downed)return;
    const {bucket,stat}=getActionBucket(action);
    // Map bucket to phase
    const phase=bucket==='defend'?'DEFENSE':
                bucket==='heal'||bucket==='revive'?'HEAL':
                bucket==='surge'?'OFFENSE': // surges resolve with attacks
                'OFFENSE';
    allActions.push({actor:name,action,bucket,stat,phase,isEnemy:false,player:p});
  });

  // Enemy actions — AI decides targets now, locked before resolution
  const livingEnemies=(gState.combatEnemies||[]).filter(e=>!e.downed);
  const livingParty=gState.players.slice(0,sz).filter(p=>p&&!p.downed&&!p.isNPC);
  const livingAll=gState.players.slice(0,sz).filter(p=>p&&!p.downed);
  livingEnemies.forEach(enemy=>{
    // Enemy AI: target lowest HP player, or defend if low HP
    const hpPct=enemy.hp/(enemy.maxHp||enemy.hp);
    if(hpPct<0.3&&Math.random()<0.4){
      allActions.push({actor:enemy.name,action:'defend',bucket:'defend',phase:'DEFENSE',isEnemy:true,enemy});
    } else {
      const woundedTarget=livingAll.slice().sort((a,b)=>a.hp-b.hp)[0];
      const target=Math.random()<0.6&&woundedTarget?woundedTarget:livingAll[Math.floor(Math.random()*livingAll.length)];
      allActions.push({actor:enemy.name,action:'attack',bucket:'attack',phase:'OFFENSE',isEnemy:true,enemy,targetPlayer:target});
    }
  });

  const enemyAttackResults=[];

  // ══ PHASE 1: BUFFS / DEBUFFS (status effects, pre-damage) ══
  // Currently no buff system — placeholder for future expansion
  // gState.statusEffects could be processed here

  // ══ PHASE 2: OFFENSE (attacks, surges) ══
  await new Promise(r=>setTimeout(r,0)); // yield to UI thread
  allActions.filter(a=>a.phase==='OFFENSE').forEach(a=>{
    if(a.isEnemy){
      const enemy=a.enemy;
      const target=a.targetPlayer;
      if(!target||target.downed)return; // target validation
      const result=enemyAttackRoll(enemy,target);
      // Apply defending DR
      let dmg=result.dmg;
      if(target.defending){dmg=Math.max(1,dmg-2);target.defending=false;}
      if(result.hit){
        target.hp=Math.max(0,target.hp-dmg);
        if(target.hp===0){
          target.downed=true;
          rollInjury(target,false); // apply injury effect when downed by enemy
          document.dispatchEvent(new CustomEvent('rules:unconscious',{detail:{name:target.name}}));
        }
        const ti=gState.players.findIndex(p=>p&&p.name===target.name);
        if(ti>=0)gState.players[ti]=target;
        if(myChar&&myChar.name===target.name){myChar=target;saveMyChar(target);}
      }
      enemyAttackResults.push(`${enemy.name} attacked ${target.name}: ${result.hit?`hit for ${dmg} damage (${target.hp}/${target.maxHp}HP${target.downed?' — DOWNED!':''})`:'missed'}`);
      roundDice.entries.push({name:enemy.name,roll:result.roll,bonus:null,total:null,
        result:result.hit?'HIT':'MISS',
        detail:result.hit?`${target.name} -${dmg}HP${target.downed?' ☠':''}`:'no effect',
        isEnemy:true});
    } else {
      // Player attack or surge — official Rules Engine (Ch.4-6)
      const p=a.player;
      if(!p||p.downed)return;
      const pi=gState.players.findIndex(x=>x&&x.name===a.actor);
      const liveEn=(gState.combatEnemies||[]).filter(e=>!e.downed);
      const target=liveEn[Math.floor(Math.random()*liveEn.length)];
      let detail='',roll,bonus,total,result;
      const weapons=p.weapons||[];
      const surge=SURGES.find(s=>s.id===a.skill);
      const mainWeapon=weapons.find(w=>w&&(a.bucket==='attack'||a.bucket==='surge'))||weapons[0];
      const dmgType=surge?surge.dmgType:(mainWeapon?mainWeapon.dmgType:'impact');
      const weaponName=mainWeapon?mainWeapon.name:'';
      if(typeof window.Rules!=='undefined'&&target){
        // ── Official Cosmere RPG attack via Rules Engine ──
        const ar=window.Rules.resolveAttack({
          attrs:p.stats||{},
          skillRanks:p.skillRanks||{},
          weapon:{
            name:weaponName,
            dmg:(mainWeapon&&mainWeapon.dmg)||'1d6',
            dmgType,
            skill:surge?a.skill:((mainWeapon&&mainWeapon.skill)||'athletics'),
            targetDef:surge?surge.targetDef:'physDef'
          },
          advantages:(p.focus||0)>0?1:0,
          focus:p.focus||0
        },{
          physDef:target.physDef||(10+(target.attackBonus||3)),
          cogDef:target.cogDef||10,
          spirDef:target.spirDef||10,
          deflect:target.deflect||0
        }, true); // raiseStakes=true in combat: plot die active each attack
        roll=ar.roll;bonus=ar.modifier;total=ar.total;
        const oc=ar.outcome;const AOUT=window.Rules.ATTACK_OUTCOME;
        result=oc===AOUT.CRIT?'CRIT':oc===AOUT.HIT?'HIT':oc===AOUT.GRAZE?'PARTIAL':'MISS';
        if(oc!==AOUT.MISS){
          const dmg=ar.damage.final;
          target.hp=Math.max(0,target.hp-dmg);
          if(target.hp<=0){
            target.downed=true;
            const inj=rollInjury(target,dmgType==='spirit');
            detail=inj.severity==='Death'?`${target.name} FALLS — ${inj.severity}`:`${target.name} FALLS — ${inj.severity} for ${inj.duration}`;
          }
          // Class-specific crit effects
          if(oc===AOUT.CRIT){
            if(p.classId==='dustbringer'||a.bucket==='surge'){target.burning=2;detail=detail||`${target.name} -${dmg}HP ☄ BURNING${weaponName?' ['+weaponName+']':''}`;}
            else if(p.classId==='elsecaller'){target.poisoned=2;detail=detail||`${target.name} -${dmg}HP ☠ POISONED${weaponName?' ['+weaponName+']':''}`;}
            else{detail=detail||`${target.name} -${dmg}HP CRIT [${dmgTypeLabel(dmgType)}${weaponName?', '+weaponName:''}]${target.downed?' ☠':''}`;}
          } else {
            detail=detail||`${target.name} -${dmg}HP [${dmgTypeLabel(dmgType)}]${target.downed?' ☠':''}`;
          }
          // Plot die effects — Opportunity recovers 1 Focus; Complication chips self
          if(ar.opportunity){p.focus=Math.min(p.maxFocus||3,(p.focus||0)+1);}
          if(ar.complication){p.hp=Math.max(1,p.hp-Math.ceil(Math.random()*2));}
          if(pi>=0)gState.players[pi]=p;if(myChar&&myChar.name===a.actor){myChar=p;saveMyChar(p);}
          const ei=gState.combatEnemies.findIndex(e=>e.name===target.name);
          if(ei>=0)gState.combatEnemies[ei]=target;
          // Fire rules:attack → NL-7 crit flash + damage animation
          document.dispatchEvent(new CustomEvent('rules:attack',{detail:{result:ar,outcome:oc}}));
        } else {
          // Miss — fumble on natural 1-2
          if(roll<=2){const sd=Math.floor(Math.random()*3)+1;p.hp=Math.max(0,p.hp-sd);if(p.hp===0)p.downed=true;
            if(pi>=0)gState.players[pi]=p;if(myChar&&myChar.name===a.actor){myChar=p;saveMyChar(p);}
            detail=`fumbled — self -${sd}HP${p.downed?' DOWNED':''}`;result='FUMBLE';}
          else{detail='no effect';}
        }
      } else {
        // ── Fallback: legacy roll (Rules engine not loaded) ──
        const sv=(p.stats&&p.stats[a.stat])||10;
        bonus=(p.skillRanks&&p.skillRanks[a.stat]||0)+(sv||0)+(p.bladeLevel||0);
        roll=Math.ceil(Math.random()*20);total=Math.min(20,Math.max(1,roll+bonus));
        result=total>=18?'CRIT':total>=14?'HIT':total>=10?'PARTIAL':total>=6?'MISS':'FUMBLE';
        const db=(CLASSES.find(cl=>cl.id===p.classId)||CLASSES[0]).dmgBonus||{crit:3,hit:2};
        if(target&&total>=10){
          let rawDmg;
          if(mainWeapon&&mainWeapon.dmg){
            const dieSize=parseInt((mainWeapon.dmg.match(/d(\d+)/)||['','6'])[1]);
            const numDice=parseInt((mainWeapon.dmg.match(/^(\d+)d/)||['','1'])[1]);
            let wDmg=0;for(let _d=0;_d<numDice;_d++)wDmg+=Math.ceil(Math.random()*dieSize);
            rawDmg=total>=14?wDmg+((p.skillRanks&&p.skillRanks[a.skill]||0)+(p.stats&&p.stats[a.stat]||0)):wDmg;
            if(total>=18)rawDmg+=db.crit||2;
          }else{rawDmg=total>=18?db.crit+Math.floor(Math.random()*3)+1:total>=14?db.hit:1;}
          const dmg=applyDeflect(rawDmg,dmgType,target.deflect||0);
          target.hp=Math.max(0,target.hp-dmg);
          if(target.hp<=0){
            target.downed=true;
            const isShard=dmgType==='spirit'&&(mainWeapon&&mainWeapon.special==='spiritualInjury'||a.bucket==='surge');
            const inj=rollInjury(target,isShard);
            if(inj.severity==='Death'){detail=`${target.name} FALLS — ${inj.severity} (roll ${inj.roll})`;}
            else{detail=`${target.name} FALLS — ${inj.severity} for ${inj.duration}. ${inj.effect}`;}
          }
          if(total>=18){
            if(p.classId==='dustbringer'||a.bucket==='surge'){target.burning=2;detail=detail||`${target.name} -${dmg}HP ☄ BURNING${weaponName?' ['+weaponName+']':''}`;}
            else if(p.classId==='elsecaller'){target.poisoned=2;detail=detail||`${target.name} -${dmg}HP ☠ POISONED${weaponName?' ['+weaponName+']':''}`;}
            else{detail=detail||`${target.name} -${dmg}HP CRIT [${dmgTypeLabel(dmgType)}${weaponName?', '+weaponName:''}]${target.downed?' ☠':''}`;}
          } else {detail=detail||`${target.name} -${dmg}HP [${dmgTypeLabel(dmgType)}]${target.downed?' ☠':''}`;}
          const ei=gState.combatEnemies.findIndex(e=>e.name===target.name);if(ei>=0)gState.combatEnemies[ei]=target;
        } else if(total<6){
          const sd=Math.floor(Math.random()*4)+2;p.hp=Math.max(0,p.hp-sd);if(p.hp===0)p.downed=true;
          if(pi>=0)gState.players[pi]=p;if(myChar&&myChar.name===a.actor){myChar=p;saveMyChar(p);}
          detail=`self -${sd}HP${p.downed?' DOWNED':''}`;
        } else {detail='no effect';}
      }
      roundDice.entries.push({name:a.actor,roll,bonus,total,result,detail,isEnemy:false});
    }
  });

  // ══ PHASE 3: DEFENSE (guard stances — applied for NEXT incoming attack) ══
  // Clear any leftover defending flag for players who didn't choose DEFENSE this round
  {const defendingActors=new Set(allActions.filter(a=>a.phase==='DEFENSE'&&!a.isEnemy).map(a=>a.actor));
  gState.players.forEach((p,i)=>{if(p&&p.defending&&!defendingActors.has(p.name)){p.defending=false;gState.players[i]=p;}});}
  allActions.filter(a=>a.phase==='DEFENSE'&&!a.isEnemy).forEach(a=>{
    const p=a.player;
    if(!p||p.downed)return;
    const pi=gState.players.findIndex(x=>x&&x.name===a.actor);
    const sv=(p.stats&&p.stats[a.stat])||10;
    const bonus=Math.floor((sv-10)/2);
    const roll=Math.ceil(Math.random()*20);
    const total=Math.min(20,Math.max(1,roll+bonus));
    const result=total>=18?'CRIT':total>=14?'HIT':total>=10?'PARTIAL':total>=6?'MISS':'FUMBLE';
    let detail='';
    if(total>=14){
      p.defending=true;
      if(pi>=0)gState.players[pi]=p;
      detail=total>=18?'perfect stance (+4 DR next hit)':'defensive stance (+2 DR next hit)';
    } else if(total>=10){
      detail='partial block';
    } else {
      detail='stance broken';
    }
    roundDice.entries.push({name:a.actor,roll,bonus,total,result,detail,isEnemy:false});
  });

  // ══ PHASE 4: HEALING & RECOVERY ══
  allActions.filter(a=>a.phase==='HEAL').forEach(a=>{
    const p=a.player;
    if(!p||p.downed)return; // healer must be alive
    const pi=gState.players.findIndex(x=>x&&x.name===a.actor);
    const sv=(p.stats&&p.stats[a.stat])||10;
    const bonus=Math.floor((sv-10)/2);
    const roll=Math.ceil(Math.random()*20);
    const total=Math.min(20,Math.max(1,roll+bonus));
    let detail='';

    if(a.bucket==='revive'){
      const downedAlly=gState.players.find(x=>x&&x.downed&&x.name!==a.actor);
      if(!downedAlly){
        detail='no downed ally';
        roundDice.entries.push({name:a.actor,roll,bonus,total,result:'MISS',detail,isEnemy:false});
        return;
      }
      if(total>=10){
        const revHP=total>=18?getReviveHP(stage)*2:total>=14?getReviveHP(stage):Math.max(1,Math.floor(getReviveHP(stage)/2));
        downedAlly.hp=revHP;
        downedAlly.downed=false;
        const ai=gState.players.findIndex(x=>x&&x.name===downedAlly.name);
        if(ai>=0)gState.players[ai]=downedAlly;
        if(myChar&&myChar.name===downedAlly.name){myChar=downedAlly;saveMyChar(downedAlly);}
        detail=`${downedAlly.name} revived +${revHP}HP`;
        roundDice.entries.push({name:a.actor,roll,bonus,total,result:total>=18?'CRIT':total>=14?'HIT':'PARTIAL',detail,isEnemy:false});
      } else {
        detail=`failed to revive ${downedAlly.name}`;
        roundDice.entries.push({name:a.actor,roll,bonus,total,result:total>=6?'MISS':'FUMBLE',detail,isEnemy:false});
      }
    } else {
      // Self or ally heal
      const baseAmt=getHealAmount(p,stage)||6;
      let healAmt=0;
      if(total>=18)healAmt=Math.round(baseAmt*1.5);
      else if(total>=14)healAmt=baseAmt;
      else if(total>=10)healAmt=Math.round(baseAmt*0.6);
      else if(total>=6){healAmt=0;detail='heal fizzled';}
      else{healAmt=-Math.floor(baseAmt*0.3);detail='Stormlight backlash';}
      if(healAmt>0){
        p.hp=Math.min(p.maxHp||p.hp,p.hp+healAmt);
        detail=`+${healAmt}HP`;
      } else if(healAmt<0){
        p.hp=Math.max(1,p.hp+healAmt);
        detail=`${healAmt}HP (backlash)`;
      }
      if(pi>=0)gState.players[pi]=p;
      if(myChar&&myChar.name===a.actor){myChar=p;saveMyChar(p);}
      roundDice.entries.push({name:a.actor,roll,bonus,total,
        result:total>=18?'CRIT':total>=14?'HEAL':total>=10?'PARTIAL':total>=6?'MISS':'FUMBLE',
        detail,isEnemy:false});
    }
  });

  // ══ PHASE 5: END-OF-TURN EFFECTS (Official Ch.9 status ticks) ══
  const sz_st=gState.partySize||partySize;
  gState.players.slice(0,sz_st).forEach((p,pidx)=>{
    if(!p||p.downed)return;
    // Legacy status effects
    if(p.poisoned>0){
      const tick=Math.ceil(Math.random()*3)+1; // vital damage, bypasses deflect
      p.hp=Math.max(0,p.hp-tick);if(p.hp===0){p.downed=true;rollInjury(p);}p.poisoned--;
      roundDice.entries.push({name:p.name,roll:'-',bonus:null,total:null,result:'EFFECT',
        detail:`☠ poison ${dmgTypeLabel('vital')} -${tick}HP${p.poisoned>0?' ('+p.poisoned+'r)':' ✓'}`,isEnemy:false,phase:'END'});
    }
    if(p.burning>0){
      const tick=applyDeflect(Math.ceil(Math.random()*2)+1,'energy',p.deflect||0);
      p.hp=Math.max(0,p.hp-tick);if(p.hp===0){p.downed=true;rollInjury(p);}p.burning--;
      roundDice.entries.push({name:p.name,roll:'-',bonus:null,total:null,result:'EFFECT',
        detail:`🔥 burn ${dmgTypeLabel('energy')} -${tick}HP${p.burning>0?' ('+p.burning+'r)':' ✓'}`,isEnemy:false,phase:'END'});
    }
    if(p.voidCorrupted>0){
      applyFocusChange(p.name,-1);p.voidCorrupted--;
      roundDice.entries.push({name:p.name,roll:'-',bonus:null,total:null,result:'EFFECT',
        detail:`👁 Voidlight -1 Focus${p.voidCorrupted>0?' ('+p.voidCorrupted+'r)':' ✓'}`,isEnemy:false,phase:'END'});
    }
    // Official conditions system ticks
    if(p.conditions){
      if(p.conditions.afflicted){
        const afflictDmg=typeof p.conditions.afflicted==='number'?p.conditions.afflicted:1;
        const finalDmg=applyDeflect(afflictDmg,'energy',p.deflect||0);
        p.hp=Math.max(0,p.hp-finalDmg);if(p.hp===0){p.downed=true;rollInjury(p);}
        roundDice.entries.push({name:p.name,roll:'-',bonus:null,total:null,result:'EFFECT',
          detail:`Afflicted ${dmgTypeLabel('energy')} -${finalDmg}HP`,isEnemy:false,phase:'END'});
      }
      // Exhausted: apply penalty to all tests (tracked on p.conditions.exhausted)
      // Focused: focus costs -1 (applied at point of use)
    }
    gState.players[pidx]=p;
    if(myChar&&myChar.name===p.name){myChar=p;saveMyChar(p);}
  });
  (gState.combatEnemies||[]).forEach((e,idx)=>{
    if(!e||e.downed)return;
    if(e.burning>0){const tick=Math.ceil(Math.random()*2)+1;e.hp=Math.max(0,e.hp-tick);if(e.hp<=0)e.downed=true;e.burning--;roundDice.entries.push({name:e.name,roll:'-',bonus:null,total:null,result:'EFFECT',detail:`burning -${tick}HP${e.downed?' ☠':''}`,isEnemy:true,phase:'END'});gState.combatEnemies[idx]=e;}
    if(e.poisoned>0){const tick=Math.ceil(Math.random()*3)+1;e.hp=Math.max(0,e.hp-tick);if(e.hp<=0)e.downed=true;e.poisoned--;roundDice.entries.push({name:e.name,roll:'-',bonus:null,total:null,result:'EFFECT',detail:`poisoned -${tick}HP${e.downed?' ☠':''}`,isEnemy:true,phase:'END'});gState.combatEnemies[idx]=e;}
  });
  // Environmental hazard ticks
  if(gState.combatHazard){
    const hazMsgs=applyHazardEffect(gState.combatHazard,gState);
    hazMsgs.forEach(m=>roundDice.entries.push({name:'⚠ Hazard',roll:'-',bonus:null,total:null,
      result:'EFFECT',detail:m,isEnemy:false}));
    const hb=document.getElementById('combat-hazard-banner');
    if(hb){hb.style.display='block';hb.textContent='⚠ '+gState.combatHazard.name;}
  }
  // Status duration reduction placeholder (future: burn, poison ticks here)

  // ══ CLEANUP ══
  // Boss phase transitions
  if(gState.isBossFight&&gState.combatEnemies&&gState.combatEnemies[0]){
    const boss=gState.combatEnemies[0];
    const phases=boss.phases||[];
    const nextPhase=(boss.currentPhase||0)+1;
    if(nextPhase<phases.length){
      const phaseThreshold=phases.slice(nextPhase).reduce((a,p)=>a+p.hp,0);
      if(boss.hp<=phaseThreshold&&boss.hp>0){
        boss.currentPhase=nextPhase;
        const ph=phases[nextPhase];
        boss.name=ph.name||boss.name;
        boss.attackBonus=(boss.attackBonus||2)+1;
        roundDice.entries.push({name:'⚡ Boss Phase',roll:'-',bonus:null,total:null,
          result:'EFFECT',detail:`${boss.name} enters phase ${nextPhase+1}!`,isEnemy:false});
        gState.combatEnemies[0]=boss;
      }
    }
  }

  // Push dice log
  if(!gState.diceLog)gState.diceLog=[];
  gState.diceLog.push(roundDice);
  if(gState.diceLog.length>10)gState.diceLog.shift();
  renderDiceTicker();

  // ══ VICTORY / DEFEAT CHECK ══
  const allEnemiesDead=(gState.combatEnemies||[]).every(e=>e.downed||e.hp<=0);
  const humanCombatants=gState.players.slice(0,sz).filter(p=>p&&!p.isNPC);
  const allPartyDowned=humanCombatants.length>0&&humanCombatants.every(p=>p.downed);
  if(allEnemiesDead){gState.combatPhase='victory';await saveAndBroadcast(gState);renderCombatScreen();renderCombatActions();return;}
  if(allPartyDowned){gState.combatPhase='defeat';await saveAndBroadcast(gState);renderCombatScreen();renderCombatActions();return;}

  // ══ CALL GM TO NARRATE THE ROUND ══
  gState.combatRound=(gState.combatRound||1)+1;
  gState.combatPhase='narrative';
  gState.pendingActions={};
  gState.combatChoicesCache={};
  const playerOutcomes=roundDice.entries.filter(e=>!e.isEnemy).map(e=>`${e.name}: ${e.result}${e.detail?' ('+e.detail+')':''}`);
  await callCombatGM('round',playerOutcomes.join(' | '),enemyAttackResults);

  }catch(e){
    console.error('resolveRound failed:',e);
    gState.combatPhase='choosing';
    gState.pendingActions={};
    await saveAndBroadcast(gState).catch(()=>{});
    renderCombatScreen();renderCombatActions();
  }
}

// ══ STREAMING GM CALL ══
async function callGM(prompt){
  const tb=document.getElementById('thinking-bar');
  if(tb){tb.style.display='block';tb.classList.add('thinking-active');}
  const stEl=document.getElementById('story-text');
  function renderText(t){
    return t.replace(/\n\n+/g,'</p><p>').replace(/\n/g,'<br>');
  }
  function parseChoices(raw){
    const choices=[];
    raw.split('\n').filter(l=>/^\s*\d+[.)]\s/.test(l)||/^\s*[-*]\s/.test(l)).slice(0,4).forEach(l=>{
      choices.push(l.replace(/^\s*[\d.)*-]+\s+/,'').trim());
    });
    return choices;
  }
  function cleanScene(raw){
    return raw
      // Strip [CHOICES] / [CHOICES FOR X] block and everything after it
      .replace(/\[CHOICES[^\]]*\][\s\S]*/i,'')
      // Strip "Name's Options:" header and all following lines
      .replace(/^[\w '\-]+'s\s+Options?:\s*[\s\S]*/im,'')
      .replace(/^Options?\s+for\s+[\w\s]+:\s*[\s\S]*/im,'')
      // Strip trailing numbered list — 2+ consecutive numbered lines = leaked choices
      .replace(/(\n\s*\d+[.)]\s+[^\n]+){2,}\s*$/s,'')
      // Strip bold markers
      .replace(/\*+/g,'')
      .trim();
  }
  try{
    const res=await fetch(PROXY_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,stream:true,
        system:AI_DM_SYSTEM_PROMPT,
        messages:[{role:'user',content:prompt}]})
    });
    if(res.ok&&res.body){
      const reader=res.body.getReader();
      const dec=new TextDecoder();
      let raw='';
      if(stEl)stEl.innerHTML='<span class="gm-cursor">|</span>';
      while(true){
        const {done,value}=await reader.read();
        if(done)break;
        const chunk=dec.decode(value,{stream:true});
        chunk.split('\n').forEach(line=>{
          if(line.startsWith('data: ')&&line!=='data: [DONE]'){
            try{
              const d=JSON.parse(line.slice(6));
              const tok=(d.delta&&(d.delta.text||d.delta.value))||'';
              if(tok){
                raw+=tok;
                // Throttle DOM updates — only update every 4 tokens for performance
                if(raw.length%4===0||tok.includes(' ')||tok.includes('.')){
                  if(stEl)stEl.innerHTML=renderText(cleanScene(raw))+'<span class="gm-cursor">|</span>';
                }
              }
            }catch(e){}
          }
        });
      }
      if(stEl)stEl.innerHTML=renderText(cleanScene(raw));
      const scene=cleanScene(raw);
      const choices=parseChoices(raw);
      if(gState){gState.lastGM={text:scene,choices,ts:new Date().toISOString()};await saveAndBroadcast(gState);}
      await addLog({type:'gm',who:'',text:scene,choices});
      if(tb){tb.style.display='none';tb.classList.remove('thinking-active');}
      maybeSpawnHoid(scene,gState&&gState.totalMoves||0);
      return;
    }
    // Non-streaming fallback
    const data=await res.json();
    if(data.error)throw new Error(JSON.stringify(data.error));
    const raw2=data.content&&data.content[0]?data.content[0].text:'The winds carry no answer tonight.';
    const scene2=cleanScene(raw2);
    const choices2=parseChoices(raw2);
    if(stEl)stEl.innerHTML=renderText(scene2);
    if(gState){gState.lastGM={text:scene2,choices:choices2,ts:new Date().toISOString()};await saveAndBroadcast(gState);}
    await addLog({type:'gm',who:'',text:scene2,choices:choices2});
    maybeSpawnHoid(scene2,gState&&gState.totalMoves||0);
  }catch(e){
    console.error('callGM error:',e.message);
    const errText='The Stormlight flickers ['+e.message+']';
    if(stEl)stEl.innerHTML=errText;
    if(gState){gState.lastGM={text:errText,choices:[],ts:new Date().toISOString()};await saveState(gState);}
    await addLog({type:'gm',who:'',text:errText,choices:[]});
  }finally{
    if(tb){tb.style.display='none';tb.classList.remove('thinking-active');}
  }
}


async function callCombatGM(type, playerActions, enemyResults){
  const sz=gState.partySize||partySize;
  const party=gState.players.slice(0,sz).map(p=>{
    if(!p)return'?';
    const conds=p.conditions?Object.entries(p.conditions).filter(([k,v])=>v).map(([k])=>CONDITIONS[k]?CONDITIONS[k].name:k):[];
    const injStr=p.injuries&&p.injuries.length?`${p.injuries.length}inj`:'';
    const condStr=[...conds,injStr].filter(Boolean).join(',');
    return`${p.name}(${p.hp}/${p.maxHp}HP${p.downed?' DOWNED':''}${condStr?' ['+condStr+']':''})`;
  }).join(' | ');
  const enemies=(gState.combatEnemies||[]).map(e=>{
    const conds=e.conditions?Object.entries(e.conditions).filter(([k,v])=>v).map(([k])=>CONDITIONS[k]?CONDITIONS[k].name:k):[];
    const condStr=conds.join(',');
    return`${e.name}(${e.hp}/${e.maxHp}HP${e.downed?' DEFEATED':''}${condStr?' ['+condStr+']':''})`;
  }).join(' | ');
  const loc=getAct(gState.totalMoves||0).location||'the battlefield';
  const gctx=getGenderContext();
  const mctx=getSprenMemoryContext();
  const round=gState.combatRound||1;
  const roundContext=round===1?'opening chaos — everyone finding their footing, no pattern yet':round<=3?'the shape of the fight is forming — who is dangerous, who is scared':round<=5?'exhaustion and desperation bleeding in — mistakes happening':'final moments — this ends soon, someone or something will break';

  let prompt='';
  if(type==='opening'){
    const thread=getCombatThread();
    prompt=`You are a combat GM — an expert at cinematic, visceral action writing. Write in the style of a blend of high fantasy (epic tone), cinematic action (clear visual movement), and character-focused drama.

Location: ${loc}. Round 1.
Party: ${party}
Enemies: ${enemies}${gctx}${mctx}${thread}

Write EXACTLY 3 sentences opening this combat. Craft rules:
• Sentence 1: The threat arrives — not approaches, ARRIVES. Use a detail from NARRATIVE THREAD above if present — connect this fight to what was discovered
• Sentence 2: ${loc} becomes part of the danger. Specific environmental detail. Tactile and present.
• Sentence 3: The moment before first contact. One image. Held breath. End here.

STYLE RULES — apply all:
• Fast, visceral, clear — easy to visualize who is where doing what
• Short sharp sentences during action. Longer atmospheric ones for environment.
• Environmental interaction — terrain, objects, the specific chaos of this place
• Show fear, rage, desperation through physical action — never state it
• No "suddenly". No "quickly". No game terminology.
• Do NOT summarize how the party got here`;

  } else if(type==='round'){
    // Inject spren emotion flavor into combat round
    const sprenFlavor=round<=2?'Painspren (orange hands) grasp upward near anyone who was hit.':
      round<=4?'Fearspren (violet blobs) crawl up a wall somewhere in the fight.':
      'Anticipationspren (red streamers) drift from someone about to break.';
    // Get previous round text to avoid repetition
    const prevRoundText=(gState.combatLog||[]).slice(-2).map(e=>e.text||'').filter(Boolean).join(' ');
    const prevHint=prevRoundText?`
PREVIOUS ROUND (do NOT repeat sentence structures, imagery, or outcomes from here): "${prevRoundText.slice(0,200)}"`:'';
    prompt=`You are a combat GM. Round ${round}. ${loc}. ${roundContext}.
Party: ${party}
Enemies: ${enemies}
WHAT HAPPENED THIS ROUND — weave ALL of this in:
Player actions: ${playerActions}
Enemy attacks: ${(enemyResults||[]).join(' | ')}${gctx}${prevHint}

SPREN PRESENT: ${sprenFlavor}

Write EXACTLY 3 sentences. Every rule must be followed:
• INCLUDE ALL OUTCOMES — every hit, miss, heal, and surge above must appear as a physical consequence
• ONE SCENE — not a list; a single fluid moment with all outcomes woven together
• MOMENTUM SHIFT — make clear who has advantage NOW; end on something uncertain
• SPREN FLAVOR — mention the spren above naturally; they appear near strong emotions
• INJURIES ACCUMULATE — characters hurt in previous rounds are still hurting
• SENTENCE VARIATION — one long sentence, two short ones (or vice versa); never three of the same length
• ROSHAR SPECIFIC — Stormlight glows and wisps; Shardblades shriek in the mind; ground-eating creatures scatter
• No "suddenly", no "quickly", no game jargon, no narrating intent — only what IS happening
• Present tense throughout`;

  } else if(type==='victory'){
    const injuries=gState.players.slice(0,sz).filter(p=>p&&p.injuries&&p.injuries.length).map(p=>`${p.name}:${p.injuries[0].effect}`).join(', ');
    const injNote=injuries?`
Active injuries: ${injuries} — these should show in the aftermath.`:'';
    prompt=`Combat GM. ${loc}. All enemies defeated. Round ${round}.
Party: ${party}${gctx}${mctx}${injNote}

Write 2 sentences. Rules:
• Sentence 1: The exact physical moment the last enemy falls — specific, visual, definitive
• Sentence 2: The immediate aftermath — what the survivors feel in their BODIES, not their hearts; what the silence sounds like; one detail that has permanently changed
• No triumphalism. Victory in real fights tastes like copper and shaking hands.
• Gloryspren (golden orbs) will appear — mention them once, briefly`;

  } else if(type==='defeat'){
    prompt=`Combat GM. ${loc}. All party members downed.
${gctx}

Write 2 sentences: the moment the last party member falls, and what the enemy does next. Leave everyone downed but breathing — enemies do not deliver killing blows. End on stillness and consequence, not despair.`;
  }

  const el=document.getElementById('combat-narrative-text');
  if(el){el.textContent='...';el.parentElement.style.opacity='0.5';}
  // Structured JSON instruction appended to every combat GM prompt
  const jsonInstr=`\n\nRespond ONLY with valid JSON (no markdown fences): {"narrative":"[2-3 sentences, present tense, no HP numbers, no game jargon — translate mechanics to vivid fiction]","stateUpdates":{"conditionsAdded":[],"conditionsRemoved":[]}}`;
  try{
    const res=await fetch(PROXY_URL,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:450,
        system:AI_DM_SYSTEM_PROMPT,
        messages:[{role:'user',content:prompt+jsonInstr}]})});
    const data=await res.json();
    const rawText=(data.content&&data.content[0]?data.content[0].text.trim():'')||'The battle continues...';
    // Parse JSON — extract narrative and optional stateUpdates
    let narrative=rawText,stateUpdates={};
    try{
      const js=rawText.indexOf('{'),je=rawText.lastIndexOf('}');
      if(js>=0&&je>js){
        const parsed=JSON.parse(rawText.slice(js,je+1));
        narrative=(parsed.narrative||rawText).replace(/\*\*([^*]+)\*\*/g,'$1').trim();
        stateUpdates=parsed.stateUpdates||{};
      } else {
        narrative=rawText.replace(/\*\*([^*]+)\*\*/g,'$1').trim();
      }
    }catch(pe){narrative=rawText.replace(/\*\*([^*]+)\*\*/g,'$1').trim();}
    // Apply state updates from AI DM
    if(stateUpdates.conditionsAdded){
      stateUpdates.conditionsAdded.forEach(({target,condition})=>{
        const tp=gState.players.find(x=>x&&x.name===target);
        if(tp&&typeof window.Rules!=='undefined')window.Rules.applyCondition(tp,condition);
        const te=(gState.combatEnemies||[]).find(e=>e.name===target);
        if(te&&condition){te[condition]=(te[condition]||0)+1;}
      });
    }
    if(stateUpdates.conditionsRemoved){
      stateUpdates.conditionsRemoved.forEach(({target,condition})=>{
        const tp=gState.players.find(x=>x&&x.name===target);
        if(tp&&typeof window.Rules!=='undefined')window.Rules.removeCondition(tp,condition);
      });
    }
    if(el){el.textContent=narrative;el.parentElement.style.opacity='1';}
    if(lang==='th'&&el){
      translateToThai(narrative).then(thai=>{
        if(thai&&thai!==narrative)el.textContent=thai;
      }).catch(()=>{});
    }
    gState.combatLog=gState.combatLog||[];
    gState.combatLog.push({round,text:narrative,type});
    await saveAndBroadcast(gState);
  }catch(e){if(el){el.textContent='The battle continues...';el.parentElement.style.opacity='1';}}
  if(type==='opening'||type==='round'){
    gState.combatPhase='choosing';
    gState.combatChoicesCache={}; // clear so new round generates fresh unique choices
    renderCombatScreen();   // render immediately for responsiveness
    renderCombatActions();
    // Notify SprenCompanion of the new active turn card
    const activeCard=document.querySelector('.char-combat-card.active-turn');
    document.dispatchEvent(new CustomEvent('sc:turnChange',{detail:{cardEl:activeCard}}));
    await saveAndBroadcast(gState); // save after UI update
    const sz2=gState.partySize||partySize;
    gState.players.slice(0,sz2).filter(p=>p&&!p.isNPC&&!p.downed).forEach(p=>{
      generateCombatChoices(p).catch(()=>{});
    });
  }
}

async function exitCombat(won){
  if(!gState)return;
  try{
  const sz=gState.partySize||partySize;
  // Resurrect downed players and sync myChar
  gState.players.slice(0,sz).forEach((p,i)=>{
    if(!p)return;
    if(p.downed){p.downed=false;p.hp=1;}
    // Clear any lingering combat conditions
    if(p.defending){p.defending=false;}
    if(p.conditions){Object.keys(p.conditions).forEach(k=>{
      if(['stunned','bleeding','burning','poisoned','prone'].includes(k))delete p.conditions[k];
    });}
    gState.players[i]=p;
    if(myChar&&myChar.name===p.name){myChar=p;saveMyChar(p);}
  });
  gState.combatMode=false;
  gState.combatPhase=null;
  gState.enemies=[];
  gState.combatEnemies=[];
  gState.combatActive=false;
  gState.combatOrder=[];
  gState.combatRound=0;
  gState.combatLog=[];
  gState.diceLog=[];
  gState.isBossFight=false;
  gState.combatHazard=null;
  gState.turn=0;
  gState.beatsUntilCombat=COMBAT_BEATS_MIN+Math.floor(Math.random()*(COMBAT_BEATS_MAX-COMBAT_BEATS_MIN+1));
  gState.beatsSinceLastCombat=0;
  gState.preCombatTriggered=false;
  gState.pendingActions={};
  await saveAndBroadcast(gState);
  showScreen('game');
  showGameScreen();
  setBottomLoading();
  await callGM(combatAftermathPrompt(won));
  const freshLog=await loadLog(true);
  renderAll(freshLog);
  setTimeout(()=>{setBottomFromState(freshLog);maybeTranslateStory();if(gState&&gState.lastGM&&gState.lastGM.text)generateTLDR(gState.lastGM.text);},150);
  }catch(e){
    console.error('exitCombat failed:',e);
    showScreen('game');showGameScreen();
  }
}

function combatAftermathPrompt(won){
  const sz=gState.partySize||partySize;
  const party=gState.players.slice(0,sz).map(p=>p?`${p.name}(${p.className} HP:${p.hp}/${p.maxHp})`:'?').join(' | ');
  const loc=getAct(gState.totalMoves||0).location||'the field';
  const gctx=getGenderContext();const mctx=getSprenMemoryContext();const wmctx=getWorldMemoryContext();const cctx=getCharContext();
  return`Cosmere RPG GM. Post-combat scene. Location: ${loc}.
Party: ${party}
Combat result: ${won?'VICTORY — enemies defeated':'DEFEAT — party was downed but survived'}${gctx}${mctx}

Write a VERBOSE aftermath scene (4-6 sentences): the immediate aftermath of combat, wounds tended, what was discovered, how the environment has changed, what the victory/defeat means for the story going forward. Be specific to ${loc} and the characters involved.

[CHOICES] 4 numbered options for ${gState.players[0]?gState.players[0].name:'the party'} (${gState.players[0]?gState.players[0].className:'?'}) — exploration and recovery focused.
One sentence each. Tag: [DISCOVERY] or [DECISION].${getGenderContext()}`;
}


// ══ VOICE OVER — Kokoro TTS ══
// Apache-licensed 82M neural TTS. Runs 100% in-browser via WebGPU/WASM.
// First use: ~160MB model download, then cached by browser forever.
// Quality: comparable to ElevenLabs. Vastly better than Web Speech API.
// Fallback: if Kokoro fails to load, silently falls back to Web Speech API.

function autoSpeakStory(){}

// ── Voice catalogue ──
const KOKORO_VOICES = {
  'am_echo':    { label:'Echo — American Male, Warm'     },
  'am_adam':    { label:'Adam — American Male, Deep'     },
  'am_michael': { label:'Michael — American Male, Clear' },
  'af_heart':   { label:'Heart — American Female, Warm'  },
  'af_sky':     { label:'Sky — American Female, Bright'  },
  'af_nicole':  { label:'Nicole — American Female, Calm' },
  'bm_daniel':  { label:'Daniel — British Male, Noble'   },
  'bm_george':  { label:'George — British Male, Gravelly'},
  'bf_emma':    { label:'Emma — British Female, Crisp'   },
};

// ── Module-level state ──
let _kokoroTTS      = null;
let _kokoroLoading  = false;
let _kokoroReady    = false;
let _kokoroVoice    = 'bm_daniel';
let _kokoroBusy     = false;
let _kokoroCancel   = false;
let _currentAudio   = null;

// ── Lazy singleton model loader ──
async function _ensureKokoro() {
  if (_kokoroReady) return true;
  if (_kokoroLoading) {
    await new Promise(r => {
      const check = setInterval(() => {
        if (_kokoroReady || !_kokoroLoading) { clearInterval(check); r(); }
      }, 200);
    });
    return _kokoroReady;
  }
  _kokoroLoading = true;
  _updateVoiceStatus('loading');
  try {
    const { KokoroTTS } = await import('https://cdn.jsdelivr.net/npm/kokoro-js@1.2.0/dist/kokoro.web.js');
    let device = 'wasm', dtype = 'q8';
    try {
      if (navigator.gpu) {
        const adapter = await navigator.gpu.requestAdapter();
        if (adapter) { device = 'webgpu'; dtype = 'fp32'; }
      }
    } catch(e) {}
    _kokoroTTS = await KokoroTTS.from_pretrained(
      'onnx-community/Kokoro-82M-v1.0-ONNX',
      { dtype, device }
    );
    _kokoroReady = true; _kokoroLoading = false;
    _updateVoiceStatus('ready');
    console.log('✓ Kokoro TTS ready — device:', device, 'dtype:', dtype);
    return true;
  } catch(err) {
    _kokoroLoading = false; _kokoroReady = false;
    console.warn('✗ Kokoro failed, falling back to Web Speech:', err.message);
    _updateVoiceStatus('fallback');
    return false;
  }
}

// ── Text cleaner ──
function _cleanForTTS(raw) {
  return (raw || '')
    .replace(/\[CHOICES[^\]]*\][\s\S]*/i, '')
    .replace(/\[COMBAT\]|\[DISCOVERY\]|\[DECISION\]/gi, '')
    .replace(/THE CHRONICLE/gi, '')
    .replace(/\*+/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ── Sentence splitter — enables streaming first-sentence playback ──
function _splitSentences(text) {
  return text.split(/(?<=[.!?…])\s+/).map(s => s.trim()).filter(s => s.length > 3);
}

// ── PCM float32 → WAV blob ──
function _float32ToWav(audioData, sampleRate) {
  const numChannels = 1, bitsPerSample = 16;
  const dataSize = audioData.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const w = (o, v, s) => s===4?view.setUint32(o,v,true):view.setUint16(o,v,true);
  const ws = (o, s) => { for(let i=0;i<s.length;i++) view.setUint8(o+i,s.charCodeAt(i)); };
  ws(0,'RIFF'); w(4,36+dataSize,4); ws(8,'WAVE'); ws(12,'fmt ');
  w(16,16,4); w(20,1,2); w(22,numChannels,2); w(24,sampleRate,4);
  w(28,sampleRate*2,4); w(30,2,2); w(34,bitsPerSample,2);
  ws(36,'data'); w(40,dataSize,4);
  let offset=44;
  for(let i=0;i<audioData.length;i++){
    const s=Math.max(-1,Math.min(1,audioData[i]));
    view.setInt16(offset,s<0?s*0x8000:s*0x7FFF,true); offset+=2;
  }
  return new Blob([buffer],{type:'audio/wav'});
}

// ── Play a WAV blob, resolve when done ──
function _playAudioBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    _currentAudio = new Audio(url);
    const slider = document.getElementById('vol-slider');
    _currentAudio.volume = slider ? Math.min(1, parseInt(slider.value||70)/100) : 0.92;
    _currentAudio.onended = () => { URL.revokeObjectURL(url); resolve(); };
    _currentAudio.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    _currentAudio.play().catch(reject);
  });
}

// ── Core: Kokoro sentence-by-sentence streaming ──
async function _speakWithKokoro(text) {
  if(!text||text.length<4) return;
  _kokoroCancel=false; _kokoroBusy=true; voiceActive=true; updateVoiceBtn();
  const sentences = _splitSentences(text);
  for(const sentence of sentences){
    if(_kokoroCancel) break;
    if(sentence.length<3) continue;
    try{
      const result = await _kokoroTTS.generate(sentence, { voice: _kokoroVoice, speed: 0.92 });
      if(_kokoroCancel) break;
      await _playAudioBlob(_float32ToWav(result.audio, result.sampling_rate));
    } catch(e){ console.warn('✗ Kokoro sentence error:', e.message); }
  }
  _kokoroBusy=false;
  if(!_kokoroCancel){ voiceActive=false; updateVoiceBtn(); }
}

// ── Web Speech fallback ──
function _speakWithWebSpeech(text){
  if(!window.speechSynthesis) return;
  stopSpeaking();
  const go=()=>{
    currentUtterance=new SpeechSynthesisUtterance(text);
    currentUtterance.volume=0.95; currentUtterance.rate=0.88; currentUtterance.pitch=0.9;
    const vv=window.speechSynthesis.getVoices();
    const prefs=['Daniel','George','Arthur','Aaron','Alex'];
    let v=null;
    for(const n of prefs){v=vv.find(x=>x.name===n);if(v)break;}
    if(!v)v=vv.find(x=>x.lang==='en-GB'&&x.localService)||vv.find(x=>x.lang.startsWith('en'))||vv[0];
    if(v)currentUtterance.voice=v;
    currentUtterance.onend=currentUtterance.onerror=()=>{voiceActive=false;updateVoiceBtn();};
    window.speechSynthesis.speak(currentUtterance);
    voiceActive=true; updateVoiceBtn();
  };
  if(window.speechSynthesis.getVoices().length>0)go();
  else{window.speechSynthesis.onvoiceschanged=()=>{window.speechSynthesis.onvoiceschanged=null;go();};}
}

// ── Public API ──
async function speakStory(){
  if(!voiceEnabled||isMobile()) return;
  const el=document.getElementById('story-text'); if(!el) return;
  const text=_cleanForTTS(el.innerText||''); if(text.length<10) return;
  stopSpeaking();
  const ok=await _ensureKokoro();
  if(ok) await _speakWithKokoro(text); else _speakWithWebSpeech(text);
}

async function speakFromElement(text){
  if(!voiceEnabled||!text||isMobile()) return;
  stopSpeaking();
  const ok=await _ensureKokoro();
  if(ok) await _speakWithKokoro(_cleanForTTS(text)); else _speakWithWebSpeech(_cleanForTTS(text));
}

function stopSpeaking(){
  _kokoroCancel=true;
  if(_currentAudio){_currentAudio.pause();_currentAudio.src='';_currentAudio=null;}
  _kokoroBusy=false;
  if(window.speechSynthesis)window.speechSynthesis.cancel();
  voiceActive=false; updateVoiceBtn();
}

function toggleVoice(){
  if(isMobile()) return;
  if(voiceActive){stopSpeaking();return;}
  voiceEnabled=true; speakStory();
}

function updateVoiceBtn(){
  const label=voiceActive?'🔊':'🔈';
  const title=voiceActive?'Stop reading':'Read story aloud';
  const b=document.getElementById('voice-btn-bar'); if(b){b.textContent=label;b.title=title;}
}

function toggleAutoSpeak(){}
function updateAutoSpeakBtn(){
  const btn=document.getElementById('autospeak-btn'); if(!btn)return;
  if(autoSpeak){btn.textContent='AUTO ON';btn.style.cssText+='color:var(--amber2);border-color:var(--amber-dim);background:rgba(191,161,90,0.1)';}
  else{btn.textContent='AUTO';btn.style.cssText+='color:var(--text4);border-color:var(--border2);background:var(--bg3)';}
}

function _updateVoiceStatus(state){
  const btn=document.getElementById('voice-btn-bar'); if(!btn)return;
  if(state==='loading'){btn.title='Loading Kokoro voice model (one-time ~160MB)…';btn.textContent='⏳';}
  else if(state==='ready'){btn.title='Kokoro TTS ready — click to read story';btn.textContent='🔈';}
  else if(state==='fallback'){btn.title='Using browser voice (Kokoro unavailable)';btn.textContent='🔈';}
}

function setVoice(voiceVal){
  localStorage.setItem('sc_voice',voiceVal);
  const legacyMap={
    'male_deep':'bm_george','male_warm':'am_echo','male_gravelly':'bm_george',
    'female_british':'bf_emma','female_warm':'af_heart','female_clear':'af_sky',
  };
  _kokoroVoice=KOKORO_VOICES[voiceVal]?voiceVal:(legacyMap[voiceVal]||'bm_daniel');
  if(voiceActive){stopSpeaking();setTimeout(speakStory,100);}
}

function loadVoicePreference(){
  const stored=localStorage.getItem('sc_voice'); if(stored)setVoice(stored);
}

function isMobile(){return/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);}

