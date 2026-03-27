/**
 * ============================================================
 * app/ui.js — UI Controllers & Rendering
 * CYOAhub
 * ============================================================
 * Handles:
 *   - Campaign picker, creation, lobby
 *   - Game screen (exploration mode)
 *   - Sheets API integration
 *   - WebSocket session management
 *   - Audio engine
 *   - Voice TTS
 *   - Language/Thai translation
 * ============================================================
 */

// ── WEBSOCKET SESSION ─────────────────────────────────────────
// ══ WEBSOCKET SESSION ══

function connectSession(){
  if(!campaignId||!myChar)return;
  if(ws&&ws.readyState===WebSocket.OPEN)return;
  const url=`${WS_URL}?campaign=${encodeURIComponent(campaignId)}&player=${myChar.slot}&name=${encodeURIComponent(myChar.name)}`;
  ws=new WebSocket(url);
  ws.onopen=()=>{wsConnected=true;console.log('⟁ WS connected');stopLobbyPolling();};
  ws.onmessage=(event)=>{try{handleSessionMessage(JSON.parse(event.data));}catch{}};
  ws.onclose=()=>{wsConnected=false;setTimeout(connectSession,3000);};
  ws.onerror=()=>{wsConnected=false;};
}

function handleSessionMessage(msg){
  switch(msg.type){
    case 'state_sync':
      if(!msg.gState)return;
      const prevPlayersStr=JSON.stringify(gState&&gState.players);
      const prevPhase=gState&&gState.phase;
      gState=msg.gState;
      invalidateLogCache(); // State synced — invalidate log cache
      const playersChanged=JSON.stringify(gState.players)!==prevPlayersStr;
      const phaseChanged=gState.phase!==prevPhase;
      if(playersChanged||phaseChanged){
        const isOnCombat=document.getElementById('s-combat').classList.contains('active');
        if(isOnCombat){renderCombatScreen();renderCombatActions();}
        else if(phaseChanged){loadLog(false).then(l=>{renderAll(l);setBottomFromState(l);});}
        else{renderPartyStrip();setBottomFromState();} // fast path: only HP/focus changed
      }
      break;
    case 'slot_assigned':
      // Server tells this client which slot they were assigned
      if(msg.slot!=null&&mySlot===null){
        mySlot=msg.slot;
        if(myChar)myChar.slot=mySlot;
        showToast('⟁ Slot '+(mySlot+1)+' assigned');
      }
      break;
    case 'action_received':showActionBadge(msg.playerName);break;
    case 'typing':showTypingIndicator(msg.playerName);break;
    case 'player_connected':showToast('⟁ '+msg.playerName+' joined');break;
    case 'player_disconnected':showToast(msg.playerName+' disconnected');break;
    case 'pong':break;
  }
}

async function saveAndBroadcast(state){
  await saveState(state);
  if(ws&&ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:'state_update',gState:state}));
}

function broadcastTyping(){
  if(ws&&ws.readyState===WebSocket.OPEN&&myChar)ws.send(JSON.stringify({type:'typing',playerName:myChar.name}));
}

setInterval(()=>{if(ws&&ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:'ping'}));},30000);

function showActionBadge(playerName){
  const id='ppip-'+playerName.replace(/\s/g,'_');
  const ppip=document.getElementById(id);if(!ppip)return;
  const existing=ppip.querySelector('.action-badge');if(existing)existing.remove();
  const badge=document.createElement('div');badge.className='action-badge';
  badge.style.cssText='position:absolute;top:4px;right:4px;font-size:9px;color:var(--teal2);font-family:var(--font-d);letter-spacing:1px;';
  badge.textContent='✓ READY';ppip.appendChild(badge);
}

function showTypingIndicator(playerName){
  const el=document.getElementById('waiting-msg');if(!el)return;
  el.textContent=playerName+' is deciding...';
  setTimeout(()=>{if(gState)setBottomFromState();},3000);
}

function showToast(message){
  const existing=document.querySelector('.sc-toast');if(existing)existing.remove();
  const toast=document.createElement('div');
  toast.className='sc-toast';
  toast.style.cssText='position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--bg3);border:1px solid var(--border2);border-radius:20px;padding:8px 20px;font-family:var(--font-d);font-size:11px;letter-spacing:1px;color:var(--text3);z-index:9999;pointer-events:none;animation:stormReveal 0.3s ease-out;';
  toast.textContent=message;document.body.appendChild(toast);
  setTimeout(()=>toast.remove(),3000);
}


// ── SHEETS API ────────────────────────────────────────────────

// ══ LOCATION SEED ══
function pickLocations(seed){
  const rng=n=>{let x=Math.sin(seed+n)*10000;return x-Math.floor(x);};
  const pool=[...ALL_LOCS];
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(rng(i)*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  return[pool[0],pool[1],pool[2]];
}
function buildActs(seed){
  const locs=pickLocations(seed);
  ACTS=[
    {...BASE_ACTS[0],name:'The '+locs[0],location:locs[0]},
    {...BASE_ACTS[1],name:'Secrets of '+locs[1],location:locs[1]},
    {...BASE_ACTS[2],name:'The Storm over '+locs[2],location:locs[2]},
  ];
}
function getAct(m){return ACTS.find(a=>m>=a.start&&m<=a.end)||ACTS[0];}
function getSprenStage(m){if(m<20)return 0;if(m<50)return 1;if(m<90)return 2;if(m<140)return 3;return 4;}

// ══ JWT / SHEETS AUTH ══
async function tok(){if(_tok&&Date.now()<_tokExp)return _tok;_tok=await getAT();_tokExp=Date.now()+3500000;return _tok;}
async function getAT(){
  const h={alg:'RS256',typ:'JWT'},now=Math.floor(Date.now()/1000);
  const cl={iss:SA.client_email,scope:'https://www.googleapis.com/auth/spreadsheets',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600};
  const b64=s=>btoa(unescape(encodeURIComponent(typeof s==='string'?s:JSON.stringify(s)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const u=b64(h)+'.'+b64(cl);
  const pem=SA.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g,'');
  const der=Uint8Array.from(atob(pem),c=>c.charCodeAt(0));
  const key=await crypto.subtle.importKey('pkcs8',der,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
  const sig=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(u));
  const jwt=u+'.'+btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:`grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`});
  return(await r.json()).access_token;
}
function stateSheet(){return(campaignId||'Campaign1')+'_State';}
function logSheet(){return(campaignId||'Campaign1')+'_Log';}
async function sGet(range){const t=await tok();const r=await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}`,{headers:{Authorization:`Bearer ${t}`}});return(await r.json()).values||[];}
async function sSet(range,values){const t=await tok();await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,{method:'PUT',headers:{Authorization:`Bearer ${t}`,'Content-Type':'application/json'},body:JSON.stringify({range,majorDimension:'ROWS',values})});}
async function sApp(range,values){const t=await tok();await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,{method:'POST',headers:{Authorization:`Bearer ${t}`,'Content-Type':'application/json'},body:JSON.stringify({range,majorDimension:'ROWS',values})});}
async function loadState(){try{const v=await sGet(stateSheet()+'!A1');if(v.length&&v[0][0])return JSON.parse(v[0][0]);}catch(e){}return null;}
async function saveState(s){await sSet(stateSheet()+'!A1',[[JSON.stringify(s)]]);}
async function loadLog(waitForGM){
  const attempts=waitForGM?6:1;
  for(let i=0;i<attempts;i++){
    try{
      const rows=await sGet(logSheet()+'!A:E');
      const entries=rows.map(r=>{
        let choices=[];try{if(r[3]&&r[3].trim().startsWith('['))choices=JSON.parse(r[3]);}catch(e){}
        return{type:r[0]||'',who:r[1]||'',text:r[2]||'',choices,ts:r[4]||''};
      }).filter(e=>e.type&&e.type.trim()!=='');
      if(!waitForGM||entries.some(e=>e.type==='gm'))return entries;
    }catch(e){if(i===attempts-1)return[];}
    await new Promise(r=>setTimeout(r,1500));
  }
  return[];
}
async function addLog(e){await sApp(logSheet()+'!A:E',[[e.type,e.who||'',e.text,JSON.stringify(e.choices||[]),new Date().toISOString()]]);}

// ══ SHEET MANAGEMENT ══
async function getSheetNames(){const t=await tok();const info=await(await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`,{headers:{Authorization:`Bearer ${t}`}})).json();return(info.sheets||[]).map(s=>s.properties.title);}
async function createSheet(title){const t=await tok();await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`,{method:'POST',headers:{Authorization:`Bearer ${t}`,'Content-Type':'application/json'},body:JSON.stringify({requests:[{addSheet:{properties:{title}}}]})});}
async function deleteSheet(title){const t=await tok();const info=await(await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`,{headers:{Authorization:`Bearer ${t}`}})).json();const sh=(info.sheets||[]).find(s=>s.properties.title===title);if(!sh)return;await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`,{method:'POST',headers:{Authorization:`Bearer ${t}`,'Content-Type':'application/json'},body:JSON.stringify({requests:[{deleteSheet:{sheetId:sh.properties.sheetId}}]})});}
async function ensureSheets(){const names=await getSheetNames();const sn=stateSheet(),ln=logSheet();if(!names.includes(sn))await createSheet(sn);if(!names.includes(ln))await createSheet(ln);if(!await loadState())await saveState({players:new Array(partySize).fill(null),turn:0,totalMoves:0,phase:'pregame',partySize,campaignId,campaignName:campaignId});}
async function listCampaigns(){
  const names=await getSheetNames();
  const ids=[...new Set(names.filter(n=>n.endsWith('_State')).map(n=>n.replace('_State','')))];
  const camps=[];
  for(const id of ids){try{const v=await sGet(id+'_State!A1');const st=v.length&&v[0][0]?JSON.parse(v[0][0]):null;camps.push({id,state:st});}catch(e){camps.push({id,state:null});}}
  return camps;
}

// ══ SCREEN ROUTER ══
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  // Clear any inline display styles left on create sub-steps
  ['create-s1','create-s2r','create-s2h','create-s3','create-s4','create-s4-weapon','create-s4-blade'].forEach(eid=>{
    const el=document.getElementById(eid);
    if(el)el.style.display='none';
  });
  const target=document.getElementById('s-'+id);
  if(!target){
    console.error('showScreen: no element with id s-'+id);
    return;
  }
  target.classList.add('active');
  window.scrollTo(0,0);

  // Hub backgrounds visible only on hub screens
  const isHub = ['landing','worlds','wizard'].includes(id);
  document.querySelectorAll('.hub-only').forEach(el => {
    el.style.display = isHub ? '' : 'none';
  });

  // GSAP transition for hub screens
  if (isHub && typeof gsap !== 'undefined') {
    gsap.fromTo(target,
      { opacity: 0, y: 16, filter: 'blur(6px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.42, ease: 'power2.out' }
    );
  }

  // Note: sc:screenChange event is dispatched by main.js showScreen wrapper

  if(lang==='th')setTimeout(applyThaiToPage,100);
}



// ── CAMPAIGN + CREATE + LOBBY ─────────────────────────────────
// ══ CAMPAIGN PICKER ══
async function initCampaignPicker(){
  document.getElementById('camp-status').textContent='Connecting...';
  try{await tok();const camps=await listCampaigns();renderCampaigns(camps);document.getElementById('camp-status').textContent='';}
  catch(e){document.getElementById('camp-status').textContent='Could not connect: '+e.message;}
}
function renderCampaigns(camps){
  const grid=document.getElementById('camp-grid');
  const next=camps.length+1;
  grid.innerHTML=camps.map(cam=>{
    const st=cam.state;
    const phase=st?st.phase:'pregame';
    const moves=st?st.totalMoves||0:0;
    const players=st&&st.players?st.players.filter(p=>p&&!p.isNPC).map(p=>p.name).join(', '):'No players yet';
    const act=ACTS.find(a=>moves>=a.start&&moves<=a.end)||ACTS[0];
    return`<div class="camp-card${phase==='playing'?' active-camp':''}" onclick="selectCampaign('${cam.id}')">
      <button class="camp-del" onclick="event.stopPropagation();deleteCampaign('${cam.id}')" title="Delete">✕</button>
      <div class="camp-num">${cam.id.startsWith('Campaign_')?'Campaign':cam.id.replace('Campaign','Campaign ')}</div>
      <div class="camp-name">${st&&st.campaignName?st.campaignName:cam.id}</div>
      <div class="camp-meta">${phase==='playing'?act.tag+' · Turn '+moves+'/180':'Awaiting Radiants'}</div>
      <div class="camp-meta">${players}</div>
      <span class="camp-phase ${phase==='playing'?'phase-playing':'phase-pregame'}">${phase==='playing'?'In Progress':'Pre-Game'}</span>
    </div>`;
  }).join('')+`<div class="camp-card new-camp" onclick="promptNewCampaign()"><div class="camp-new-icon">+</div><div class="camp-new-txt">New Campaign</div></div>`;
  if(lang==='th')setTimeout(applyThaiToPage,100);
}
function promptNewCampaign(num){
  pendingCampNum=num||null; // num no longer used for ID
  const m=document.getElementById('new-camp-modal');const inp=document.getElementById('camp-name-input');
  if(m)m.style.display='block';if(inp){inp.value='';setTimeout(()=>inp.focus(),50);}
  document.getElementById('new-camp-err').style.display='none';
  m&&m.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function cancelNewCampaign(){document.getElementById('new-camp-modal').style.display='none';pendingCampNum=null;}
async function confirmNewCampaign(){
  const name=document.getElementById('camp-name-input').value.trim();
  if(!name){const e=document.getElementById('new-camp-err');e.textContent='Give your campaign a name first.';e.style.display='block';return;}
  await launchNewCampaign(pendingCampNum||1,name);
}
async function launchNewCampaign(num,name){
  const slug=name.replace(/[^a-zA-Z0-9]/g,'').substring(0,16)||'Campaign';
  const suffix=Math.random().toString(36).substring(2,6);
  campaignId='Campaign_'+slug+'_'+suffix;
  document.getElementById('new-camp-modal').style.display='none';
  const status=document.getElementById('camp-status');
  if(status)status.textContent='Creating "'+name+'"...';
  try{
    await ensureSheets();gState=await loadState();
    partySize=3;gState.partySize=3;gState.campaignName=name;
    myChar=null;clearMyChar();
    await saveState(gState);
    document.getElementById('title-sub').textContent=name;
    renderPSZ();
    showScreen('title');
    if(status)status.textContent='';
    document.querySelectorAll('.camp-card').forEach(card=>card.style.opacity='1');
  }catch(e){
    if(status){status.textContent='Error: '+e.message;status.style.color='var(--coral2)';}
    document.querySelectorAll('.camp-card').forEach(card=>card.style.opacity='1');
  }
}
async function selectCampaign(id){
  // Release click handler INSTANTLY — yield to browser before all async work
  campaignId=id;
  const status=document.getElementById('camp-status');
  if(status){status.textContent='';} 
  // Instant card highlight
  document.querySelectorAll('.camp-card').forEach(el=>{
    const isSel=el.getAttribute('onclick')||'';
    el.style.opacity=isSel.includes("'"+id+"'")||isSel.includes('"'+id+'"')?'1':'0.4';
    el.style.pointerEvents=isSel.includes("'"+id+"'")||isSel.includes('"'+id+'"')?'none':'none';
  });
  setTimeout(()=>_doSelectCampaign(id),0);
}
async function _doSelectCampaign(id){
  const status=document.getElementById('camp-status');
  try{
    document.getElementById('camp-status').textContent='Loading '+id+'...';
    gState=await loadState();
    if(gState&&gState.locationSeed)buildActs(gState.locationSeed);
    if(gState)partySize=gState.partySize||3;
    myChar=loadMyChar();
    if(gState&&gState.phase==='playing'&&myChar){showGameScreen();return;}
    if(gState&&gState.phase==='playing'&&!myChar){
      // Game in progress but no character on this device — go to lobby to claim/create
      showScreen('lobby');renderLobby();startLobbyPolling();return;
    }
    if(gState&&gState.phase==='pregame'&&myChar){showScreen('lobby');renderLobby();startLobbyPolling();return;}
    renderPSZ();
    const sub=document.getElementById('title-sub');
    if(sub&&gState&&gState.campaignName)sub.textContent=gState.campaignName;
    const pszSection=document.getElementById('psz-wrap-section');
    if(pszSection)pszSection.style.display=(gState&&gState.phase==='playing')?'none':'block';
    const enterBtn=document.getElementById('enter-btn');
    if(enterBtn)enterBtn.querySelector('span').textContent=
      (gState&&gState.phase==='playing')?'⟁ Rejoin the Storm':'⟁ Create Character';
    showScreen('title');
    if(status)status.textContent='';
    document.querySelectorAll('.camp-card').forEach(card=>card.style.opacity='1');
  }catch(e){
    if(status){status.textContent='Error: '+e.message;status.style.color='var(--coral2)';}
    document.querySelectorAll('.camp-card').forEach(card=>card.style.opacity='1');
  }
}
async function deleteCampaign(id){
  if(!confirm('Delete '+id+' permanently?'))return;
  try{await deleteSheet(id+'_State');await deleteSheet(id+'_Log');initCampaignPicker();}
  catch(e){alert('Delete failed: '+e.message);}
}

// ══ PARTY SIZE ══
function renderPSZ(){
  const locked=gState&&gState.phase!=='pregame';
  if(locked)partySize=gState.partySize||3;
  document.getElementById('psz-row').innerHTML=[2,3,4,5].map(n=>`<div class="psz${partySize===n?' sel':''}${locked?' locked':''}" onclick="${locked?'':`pickSize(${n})`}">${n} Players</div>`).join('');
  // Render party slot preview cards under "Radiant Company"
  const preview=document.getElementById('title-party-preview');
  if(preview){
    const sz=partySize;
    preview.style.gridTemplateColumns=`repeat(${sz},1fr)`;
    preview.innerHTML=Array.from({length:sz},(_,i)=>{
      const p=gState&&gState.players&&gState.players[i];
      if(p&&!p.isPlaceholder&&!p.isNPC){
        return`<div class="slot filled" style="text-align:center;padding:10px 8px;">
          <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:4px;">
            <div style="width:8px;height:8px;border-radius:50%;background:${p.color||'var(--amber2)'};flex-shrink:0;"></div>
            <div style="font-family:var(--font-d);font-size:12px;color:var(--amber2);">${p.name}</div>
          </div>
          <div style="font-size:11px;color:var(--text4);">${p.className||''}</div>
        </div>`;
      } else if(p&&p.isNPC){
        return`<div class="slot npc-slot" style="text-align:center;padding:10px 8px;">
          <div style="font-family:var(--font-d);font-size:11px;color:var(--text4);margin-bottom:2px;">Slot ${i+1} · AI</div>
          <div style="font-family:var(--font-d);font-size:12px;color:var(--amber2);">${p.name}</div>
        </div>`;
      } else {
        return`<div class="slot" style="text-align:center;padding:10px 8px;">
          <div style="font-size:11px;color:var(--text5);font-family:var(--font-d);letter-spacing:1px;">Slot ${i+1}</div>
          <div style="font-size:10px;color:var(--text5);margin-top:4px;font-style:italic;">Open</div>
        </div>`;
      }
    }).join('');
  }
}
function pickSize(n){
  if(gState&&gState.phase!=='pregame')return;
  partySize=n;
  if(gState&&gState.phase==='pregame'){gState.players=Array.from({length:n},(_,i)=>gState.players[i]||null);gState.partySize=n;saveState(gState).catch(()=>{});}
  renderPSZ();
}

// ══ NPC GENERATION ══
function genNPC(slot){
  const cls=CLASSES[Math.floor(Math.random()*CLASSES.length)];
  // Assign adversary role based on slot/context (Ch.13)
  const roleKeys=Object.keys(ADVERSARY_ROLES);
  const npcRole=slot===0?'boss':slot<=1?'rival':'minion'; // slot 0 = boss, 1 = rival, 2+ = minion
  const used=gState&&gState.players?gState.players.filter(Boolean).map(p=>p.name):[];
  const avail=NPC_ALL.filter(n=>!used.includes(n));
  const isFemale=Math.random()<0.5;
  const pool=isFemale?NPC_F.filter(n=>!used.includes(n)):NPC_M.filter(n=>!used.includes(n));
  const finalPool=pool.length?pool:(avail.length?avail:NPC_ALL);
  const name=finalPool[Math.floor(Math.random()*finalPool.length)];
  const color=NPC_COLORS[Math.floor(Math.random()*NPC_COLORS.length)];
  const stats={};STAT_KEYS.forEach(k=>stats[k]=Math.min(20,r4d6()+(cls.bonus[k]||0)));
  const hp=12+stats.pre;
  const gender=isFemale?'she/her':'he/him';
  const physDef=10+Math.floor(((stats.str||0)+(stats.spd||0))/2);
  const cogDef=10+Math.floor(((stats.int||0)+(stats.wil||0))/2);
  const spirDef=10+Math.floor(((stats.awa||0)+(stats.pre||0))/2);
  return{name,className:cls.name,classId:cls.id,color,stats,hp,maxHp:hp,abilities:cls.abilities,spren:cls.spren,slot,isNPC:true,isRadiant:false,isPlaceholder:false,downed:false,gender,role:npcRole,conditions:{},injuries:[],deflect:0,focus:2,maxFocus:2,weapons:[],fragments:0,physDef,cogDef,spirDef};
}

// ══ SLOT RENDERING ══

// ══ ENTER / JOIN ══
async function onEnter(){
  if(!campaignId){initCampaignPicker();showScreen('campaign');return;}
  // Instant visual feedback before async work
  const enterBtn=document.getElementById('enter-btn');
  if(enterBtn){enterBtn.disabled=true;enterBtn.style.opacity='0.6';}
  setTitleStatus('Connecting...');
  try{
    await ensureSheets();
    gState=await loadState();
    if(gState){partySize=gState.partySize||partySize;if(gState.locationSeed)buildActs(gState.locationSeed);}
    myChar=loadMyChar();
    if(myChar&&gState&&gState.phase==='playing'){mySlot=myChar.slot??mySlot;showGameScreen();return;}
    if(myChar&&gState&&gState.phase==='pregame'){mySlot=myChar.slot??mySlot;showScreen('lobby');renderLobby();startLobbyPolling();return;}
    // No character — claim the next open slot (first-done = slot 1, etc.)
    setTitleStatus('Reserving your slot...');
    const slotIdx=await claimNextSlot();
    if(slotIdx===-1){setTitleStatus('All slots are filled or being claimed.');return;}
    setTitleStatus('');
    showScreen('create');renderCreate();
    startCreatePolling();
  }catch(e){
    setTitleStatus('Could not connect: '+e.message);
    const btn=document.getElementById('enter-btn');
    if(btn){btn.disabled=false;btn.style.opacity='';}
  }
}
function pickSlot(i){if(!gState||gState.players[i])return;reserveSlot(i);}

function findOpenSlot(){
  // Returns the first truly empty slot (null, not placeholder)
  if(!gState||!gState.players)return -1;
  return gState.players.findIndex(p=>!p);
}

async function claimNextSlot(){
  // Atomically claim the next open slot via a fresh state read.
  // First-done gets slot 0, second gets slot 1, etc.
  // Re-reads state immediately before writing to minimize race window.
  // On refresh mid-creation, reclaims the placeholder left by THIS session
  // (matched via SESSION_ID) so the user keeps their original slot.
  try{
    const fresh=await loadState();
    if(fresh){gState=fresh;partySize=fresh.partySize||partySize;}
    if(!gState){gState={players:new Array(partySize).fill(null),partySize,turn:0,
      totalMoves:0,phase:'pregame',campaignId,campaignName:campaignId};}
    if(!gState.players)gState.players=new Array(gState.partySize||partySize).fill(null);
    // Find first null slot OR a placeholder left by THIS session (refresh recovery)
    const idx=gState.players.findIndex(p=>!p||(p.isPlaceholder&&p.sessionId===SESSION_ID));
    if(idx===-1)return -1; // all slots taken
    mySlot=idx;
    const placeholder={name:'...',className:'Joining...',classId:'pending',
      color:'#555',hp:0,maxHp:0,slot:idx,isNPC:false,campaignId,isPlaceholder:true,sessionId:SESSION_ID};
    gState.players[idx]=placeholder;
    await saveState(gState);
    // Notify session of slot claim
    if(ws&&ws.readyState===WebSocket.OPEN){
      ws.send(JSON.stringify({type:'slot_claim',slot:idx,campaignId}));
    }
    return idx;
  }catch(e){
    console.warn('claimNextSlot failed:',e);
    return 0; // fallback
  }
}

async function reserveSlotOnly(i){
  // Legacy: called with explicit slot (NPC claim, late joiner).
  // For first-time join use claimNextSlot() instead.
  mySlot=i;
  if(!gState){try{gState=await loadState();}catch(e){}}
  if(!gState){gState={players:new Array(partySize).fill(null),partySize,turn:0,
    totalMoves:0,phase:'pregame',campaignId,campaignName:campaignId};}
  if(!gState.players)gState.players=new Array(gState.partySize||partySize).fill(null);
  while(gState.players.length<=i)gState.players.push(null);
  const placeholder={name:'...',className:'Joining...',classId:'pending',
    color:'#555',hp:0,maxHp:0,slot:i,isNPC:false,campaignId,isPlaceholder:true};
  gState.players[i]=placeholder;
  try{await saveState(gState);}catch(e){console.warn('reserveSlot save failed:',e);}
}

async function reserveSlot(i){
  await reserveSlotOnly(i);
  showScreen('create');renderCreate();
  startCreatePolling();
}
function setTitleStatus(m){const el=document.getElementById('title-status');if(el)el.textContent=m;}

// ══ CHARACTER CREATION ══
// ══ ENHANCED CREATOR ══
function renderCreate(){
  createStep=1;isRadiant=true;selAncestry='human';selCultures=[];
  selRole=null;selWeapon=null;selKit=null;
  charOrigin='';charMotivation='';charObstacle='';charBackstory='';charAppearance='';
  showCreateStep(1);
  renderColors();renderClasses();renderRoles();renderWeapons();renderCultureGrid();renderKits();
  updateCreateSubmitBtn();
  pickCharType(true);
  setTimeout(()=>{pickCharType(true);renderStatsPointBuy();},80);
}

function renderKits(){
  const grid=document.getElementById('kit-grid');
  if(!grid)return;
  grid.innerHTML=STARTING_KITS.map(k=>`<div class="ccard${selKit&&selKit.id===k.id?' sel':''}" onclick="pickKit('${k.id}')" style="border-color:${selKit&&selKit.id===k.id?'var(--amber2)':'var(--border)'};cursor:pointer;padding:10px 12px;">
    <div class="ccard-name" style="font-size:13px;">${k.name}</div>
    <div style="font-size:11px;color:var(--text4);margin-bottom:4px;font-style:italic;">${k.desc}</div>
    <div style="font-size:11px;color:var(--text3);">
      ${k.weapons.length?'⚔ '+k.weapons.map(w=>WEAPONS[w]?WEAPONS[w].name:w).join(', '):'No weapons'} &nbsp;|&nbsp;
      ${k.armor?'🛡 '+(ARMORS[k.armor]?ARMORS[k.armor].name:k.armor):'No armor'}
    </div>
    <div style="font-size:11px;color:var(--amber2);margin-top:3px;">💰 ${k.spheres} marks${k.bonus?' · '+k.bonus:''}</div>
    ${k.expertise?`<div style="font-size:11px;color:var(--teal2);margin-top:2px;">Expertise: ${k.expertise}</div>`:''}
    ${k.extras&&k.extras.length?`<div style="font-size:10px;color:var(--text5);margin-top:2px;">${k.extras.join(', ')}</div>`:''}
  </div>`).join('');
}

function pickKit(id){
  selKit=STARTING_KITS.find(k=>k.id===id);
  renderKits();
  // Apply armor deflect from kit
  if(selKit&&selKit.armor&&ARMORS[selKit.armor]){
    window._kitDeflect=ARMORS[selKit.armor].deflect||0;
  } else {
    window._kitDeflect=0;
  }
  renderStatsPointBuy(); // refresh grid with deflect from kit
}

function pickAncestry(id){
  selAncestry=id;
  document.getElementById('ancestry-human').classList.toggle('sel',id==='human');
  document.getElementById('ancestry-singer').classList.toggle('sel',id==='singer');
}

function renderCultureGrid(){
  const grid=document.getElementById('culture-grid');if(!grid)return;
  const singerOnly=selAncestry==='singer';
  grid.innerHTML=CULTURES.map(cu=>{
    if(cu.singerOnly&&!singerOnly)return''; // listener expertise hidden for humans
    const sel=selCultures.includes(cu.id);
    return`<div class="ccard${sel?' sel':''}" onclick="toggleCulture('${cu.id}')" style="border-color:${sel?cu.color:'var(--border)'};padding:10px 12px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;">
        <div class="ccard-name" style="font-size:13px;">${cu.name}</div>
        ${sel?`<div style="color:${cu.color};font-family:var(--font-d);font-size:9px;letter-spacing:1px;">✓</div>`:''}
      </div>
      <div style="font-size:11px;color:var(--text4);margin-bottom:3px;font-style:italic;">${cu.region} · ${cu.lang}</div>
      <div style="font-size:11px;color:var(--text3);line-height:1.4;">${cu.expertise}</div>
    </div>`;
  }).join('');
}

function toggleCulture(id){
  if(selCultures.includes(id)){
    selCultures=selCultures.filter(c=>c!==id);
  } else if(selCultures.length<2){
    selCultures.push(id);
  } else {
    // Swap out the first one
    selCultures=[selCultures[1],id];
  }
  renderCultureGrid();
}

function showCreateStep(step){
  createStep=step;
  ['s1','s2r','s2h','s3','s4'].forEach(id=>{
    const el=document.getElementById('create-'+id);
    if(el)el.style.display='none';
  });
  if(step===1)document.getElementById('create-s1').style.display='block';
  else if(step===2&&isRadiant)document.getElementById('create-s2r').style.display='block';
  else if(step===2&&!isRadiant)document.getElementById('create-s2h').style.display='block';
  else if(step===3)document.getElementById('create-s3').style.display='block';
  else if(step===4){
    document.getElementById('create-s4').style.display='block';
    document.getElementById('create-s4-weapon').style.display=isRadiant?'none':'block';
    document.getElementById('create-s4-blade').style.display=isRadiant?'block':'none';
    updateCreateSubmitBtn();
    rollStats();
    renderKits();
    if(!isRadiant)renderWeapons();
  }
  [1,2,3,4].forEach(i=>{
    const dot=document.getElementById('sdot-'+i);
    if(dot)dot.className='step-dot'+(i<=step?' active':'');
  });
  if(lang==='th')setTimeout(applyThaiToPage,100);
}

function createNext(){
  const err=document.getElementById('create-err');
  if(err)err.style.display='none';
  if(createStep===1){
    showCreateStep(2);
  } else if(createStep===2){
    if(isRadiant&&!selClass){if(err){err.textContent='Choose your Order.';err.style.display='block';}return;}
    if(!isRadiant&&!selRole){if(err){err.textContent='Choose your Role.';err.style.display='block';}return;}
    showCreateStep(3);
  } else if(createStep===3){
    const name=document.getElementById('in-name').value.trim();
    if(!name){if(err){err.textContent='Speak your name first.';err.style.display='block';}return;}
    if(!selColor){if(err){err.textContent='Choose your color.';err.style.display='block';}return;}
    charBackstory=document.getElementById('in-backstory').value.trim();
    charAppearance=document.getElementById('in-appearance').value.trim();
    showCreateStep(4);
  }
}

function createBack(){
  if(createStep>1)showCreateStep(createStep-1);
}

function updateCreateSubmitBtn(){
  const btn=document.getElementById('create-submit-btn');
  if(!btn)return;
  const nameEl=document.getElementById('in-name');
  const hasName=(nameEl&&nameEl.value.trim().length>0);
  const hasClass=!isRadiant||!!selClass;
  const hasRole=isRadiant||!!selRole;
  const ready=hasName&&hasClass&&hasRole&&!!selColor;
  btn.textContent=isRadiant?'Speak the First Oath →':'Enter the Storm →';
  btn.style.opacity=ready?'1':'0.55';
  btn.style.borderColor=ready?'var(--amber2)':'var(--border2)';
}

function pickCharType(radiant){
  isRadiant=radiant;
  const r=document.getElementById('type-radiant');
  const h=document.getElementById('type-hero');
  if(r){r.classList.toggle('sel',radiant);}
  if(h){h.classList.toggle('sel',!radiant);}
}

function pickObstacle(btn,val){
  charObstacle=val||'';
  document.querySelectorAll('#obstacle-grid .origin-btn').forEach(b=>b.classList.remove('sel'));
  if(btn)btn.classList.add('sel');
}
function pickOrigin(btn,val){
  document.querySelectorAll('.origin-btn').forEach(b=>{
    if(b.closest('#origin-grid'))b.classList.remove('sel');
  });
  btn.classList.add('sel');
  charOrigin=val;
}

function pickMotivation(btn,val){
  document.querySelectorAll('.origin-btn').forEach(b=>{
    if(b.closest('#motivation-grid'))b.classList.remove('sel');
  });
  btn.classList.add('sel');
  charMotivation=val;
}

function renderColors(){
  const taken=gState?gState.players.filter(Boolean).map(p=>p.color):[];
  document.getElementById('color-row').innerHTML=COLORS.map(c=>`<div class="cswatch${selColor===c.hex?' sel':''}" style="background:${c.hex};opacity:${taken.includes(c.hex)?0.2:1};" title="${c.name}" onclick="pickColor('${c.hex}',${taken.includes(c.hex)})"></div>`).join('');
}
function pickColor(h,t){if(t)return;selColor=h;renderColors();updateCreateSubmitBtn();}

function renderClasses(){
  document.getElementById('class-grid').innerHTML=CLASSES.map(c=>`<div class="ccard${selClass&&selClass.id===c.id?' sel':''}" onclick="pickClass('${c.id}')"><div class="ccard-name">${c.name}</div><div class="ccard-ideal">"${c.ideal}"</div><div class="ccard-desc">${c.desc}</div><div class="ccard-bonus">Spren: ${c.spren}</div><div class="ccard-bonus">Bonus: ${Object.entries(c.bonus).filter(e=>e[1]>0).map(e=>e[0].toUpperCase()+'+'+e[1]).join(' ')}</div></div>`).join('');
}
function pickClass(id){selClass=CLASSES.find(c=>c.id===id);renderClasses();rollStats();renderStatsPointBuy();updateCreateSubmitBtn();}

function renderRoles(){
  const grid=document.getElementById('role-grid');
  if(!grid)return;
  grid.innerHTML=HERO_ROLES.map(r=>`<div class="ccard${selRole&&selRole.id===r.id?' sel':''}" onclick="pickRole('${r.id}')" style="border-color:${selRole&&selRole.id===r.id?r.color:'var(--border)'};cursor:pointer;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
      <span style="font-size:22px;">${r.icon}</span>
      <div class="ccard-name">${r.name}</div>
    </div>
    <div style="font-family:var(--font-d);font-size:9px;letter-spacing:1px;color:var(--text5);margin-bottom:3px;">STARTING SKILL: ${(r.startingSkill||'').toUpperCase()} &nbsp;|&nbsp; SPECIALTIES: ${(r.specialties||[]).join(' · ')}</div>
    <div style="font-size:12px;color:var(--amber2);font-weight:600;margin-bottom:4px;">${r.keyTalent||''}</div>
    <div style="font-size:11px;color:var(--text3);line-height:1.4;margin-bottom:4px;">${r.keyTalentDesc||''}</div>
    <div style="font-size:11px;color:var(--text4);font-style:italic;">${r.desc}</div>
    <div style="font-size:11px;color:var(--text5);margin-top:4px;">Attr bonus: ${Object.entries(r.bonus||{}).filter(e=>e[1]>0).map(e=>e[0].toUpperCase()+' +'+e[1]).join(', ')||'Flexible'}</div>
  </div>`).join('');
}
function pickRole(id){selRole=HERO_ROLES.find(r=>r.id===id);renderRoles();rollStats();renderStatsPointBuy();updateCreateSubmitBtn();}

function renderWeapons(){
  const grid=document.getElementById('weapon-grid');
  if(!grid)return;
  grid.innerHTML=HERO_WEAPONS.map(w=>`<div class="ccard${selWeapon&&selWeapon.id===w.id?' sel':''}" onclick="pickWeapon('${w.id}')"><div class="ccard-name">${w.name}</div><div class="ccard-ideal">${w.type}</div><div class="ccard-desc">${w.desc}</div><div class="ccard-bonus">DMG: Crit+${w.dmgBonus.crit} Hit+${w.dmgBonus.hit}</div></div>`).join('');
}
function pickWeapon(id){selWeapon=HERO_WEAPONS.find(w=>w.id===id);renderWeapons();}

// Official: player distributes 12 points, max 3 per attribute at creation
// We auto-assign a balanced spread and let them adjust
// Point-buy allocation (12 points, max 3 each at creation)

function getClassBonus(){
  const bonus=isRadiant?(selClass?selClass.bonus:{}):(selRole?selRole.bonus:{});
  return {str:0,spd:0,int:0,wil:0,awa:0,pre:0,...bonus};
}
function getTotalStats(){
  const b=getClassBonus();
  const out={};
  STAT_KEYS.forEach(k=>out[k]=Math.min(5,(_pbAlloc[k]||0)+(b[k]||0)));
  return out;
}
function getPointsSpent(){return Object.values(_pbAlloc).reduce((a,v)=>a+v,0);}
function getPointsLeft(){return ATTR_POINTS_START-getPointsSpent();}

function rollStats(){
  // "Rebalance" — reset to an even 2/2/2/2/2/2 spread
  _pbAlloc={str:2,spd:2,int:2,wil:2,awa:2,pre:2};
  rolledStats=getTotalStats();
  renderStatsPointBuy();
  const btn=document.querySelector('[onclick="rollStats()"]');
  if(btn){btn.textContent='↻ Reset!';setTimeout(()=>{btn.textContent='↻ Rebalance';},800);}
}

function adjustStat(k, delta){
  const b=getClassBonus();
  const cur=_pbAlloc[k]||0;
  const newVal=cur+delta;
  // Bounds: base alloc 0–3, total (base+bonus) capped at 5
  if(newVal<0||newVal>3)return;
  if(delta>0&&getPointsLeft()<=0)return;
  _pbAlloc[k]=newVal;
  rolledStats=getTotalStats();
  renderStatsPointBuy();
  updateCreateSubmitBtn();
}

function renderStatsPointBuy(){
  const s=getTotalStats();
  const b=getClassBonus();
  const left=getPointsLeft();
  const grid=document.getElementById('stats-grid');
  if(!grid)return;
  grid.innerHTML=STAT_KEYS.map((k,i)=>{
    const base=_pbAlloc[k]||0;
    const bonus=b[k]||0;
    const total=s[k];
    const canInc=base<3&&left>0;
    const canDec=base>0;
    return`<div class="sbox" style="position:relative;">
      <div class="sbox-name">${STAT_FULL[i]}</div>
      <div style="font-family:var(--font-d);font-size:9px;letter-spacing:2px;color:var(--text5);margin-bottom:2px;">${STAT_NAMES[i]}</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin:4px 0;">
        <button onclick="adjustStat('${k}',-1)" style="width:24px;height:24px;border-radius:50%;border:1px solid var(--border2);background:${canDec?'var(--bg3)':'var(--bg2)'};color:${canDec?'var(--text2)':'var(--text5)'};cursor:${canDec?'pointer':'default'};font-size:14px;line-height:1;transition:all 0.15s;" ${canDec?'':'disabled'}>−</button>
        <div class="sbox-val">${total}</div>
        <button onclick="adjustStat('${k}',1)" style="width:24px;height:24px;border-radius:50%;border:1px solid var(--border2);background:${canInc?'var(--bg3)':'var(--bg2)'};color:${canInc?'var(--amber2)':'var(--text5)'};cursor:${canInc?'pointer':'default'};font-size:14px;line-height:1;transition:all 0.15s;" ${canInc?'':'disabled'}>+</button>
      </div>
      ${bonus>0?`<div style="font-size:10px;color:var(--teal2);font-family:var(--font-d);">base ${base} +${bonus} class</div>`:`<div style="font-size:10px;color:var(--text5);">base ${base}/3</div>`}
    </div>`;
  }).join('');

  // Points remaining indicator
  const pointsEl=document.getElementById('points-remaining');
  if(pointsEl){
    pointsEl.textContent=left>0?`${left} point${left!==1?'s':''} remaining`:`All 12 points allocated`;
    pointsEl.style.color=left===0?'var(--teal2)':'var(--amber2)';
  }

  // Update derived stats panel
  renderStats(s);
}
function r4d6(){const d=[0,0,0,0].map(()=>Math.ceil(Math.random()*6));d.sort((a,b)=>a-b);return d.slice(1).reduce((a,v)=>a+v,0);}
function modStr(v){return'+'+(v||0);} // Official: attribute score IS the modifier
function renderStats(s){
  // renderStats now handles ONLY the derived stats panel (not the grid)
  // Grid is managed by renderStatsPointBuy
  // Show derived stats below
  const hp=10+(s.str||0);
  const focus=2+(s.wil||0);
  const physDef=10+(s.str||0)+(s.spd||0);
  const cogDef=10+(s.int||0)+(s.wil||0);
  const spirDef=10+(s.awa||0)+(s.pre||0);
  const maxInv=getMaxInvestiture(s);
  const recovDie=getRecoveryDie(s.wil||0);
  const derived=document.getElementById('stats-derived');
  if(derived)derived.innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px;font-size:12px;">
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:6px 8px;">
        <div style="color:var(--text4);font-family:var(--font-d);font-size:9px;letter-spacing:1px;">HP</div>
        <div style="color:var(--teal2);font-weight:600;">${hp}</div>
      </div>
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:6px 8px;">
        <div style="color:var(--text4);font-family:var(--font-d);font-size:9px;letter-spacing:1px;">FOCUS</div>
        <div style="color:var(--amber2);font-weight:600;">${focus}</div>
      </div>
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:6px 8px;">
        <div style="color:var(--text4);font-family:var(--font-d);font-size:9px;letter-spacing:1px;">PHYS DEF</div>
        <div style="color:var(--text);">${physDef}</div>
      </div>
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:6px 8px;">
        <div style="color:var(--text4);font-family:var(--font-d);font-size:9px;letter-spacing:1px;">COG DEF</div>
        <div style="color:var(--text);">${cogDef}</div>
      </div>
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:6px 8px;">
        <div style="color:var(--text4);font-family:var(--font-d);font-size:9px;letter-spacing:1px;">SPIR DEF</div>
        <div style="color:var(--text);">${spirDef}</div>
      </div>
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:6px 8px;">
        <div style="color:var(--text4);font-family:var(--font-d);font-size:9px;letter-spacing:1px;">MAX INVESTITURE</div>
        <div style="color:var(--teal2);">${maxInv} ✦</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px;font-size:12px;">
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:6px 8px;">
        <div style="color:var(--text4);font-family:var(--font-d);font-size:9px;letter-spacing:1px;">RECOVERY DIE</div>
        <div style="color:var(--text);">${recovDie}</div>
      </div>
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:6px 8px;">
        <div style="color:var(--text4);font-family:var(--font-d);font-size:9px;letter-spacing:1px;">DEFLECT</div>
        <div style="color:var(--text);">${window._kitDeflect>0?window._kitDeflect+' ('+(selKit&&selKit.armor&&ARMORS[selKit.armor]?ARMORS[selKit.armor].name:'armor')+')':'0 (no armor)'}</div>
      </div>
    </div>`;
}

async function onCreateChar(){
  const err=document.getElementById('create-err');
  try{
    // ── Gather all form values safely ──
    const nameEl=document.getElementById('in-name');
    const name=(nameEl?nameEl.value:'').trim();
    const genderEl=document.querySelector('input[name="gender"]:checked');
    const gender=genderEl?genderEl.value:'he/him';
    const backstoryEl=document.getElementById('in-backstory');
    const appearEl=document.getElementById('in-appearance');
    charBackstory=backstoryEl?backstoryEl.value.trim():charBackstory||'';
    charAppearance=appearEl?appearEl.value.trim():charAppearance||'';

    // ── Validate ──
    if(!name){err.textContent='Enter your name first.';err.style.display='block';return;}
    if(isRadiant&&!selClass){err.textContent='Choose your Order.';err.style.display='block';return;}
    if(!isRadiant&&!selRole){err.textContent='Choose your Role.';err.style.display='block';return;}
    if(!isRadiant&&!selWeapon){err.textContent='Choose your weapon.';err.style.display='block';return;}
    if(!selColor){err.textContent='Choose a color.';err.style.display='block';return;}
    err.style.display='none';

    // ── Stats — validate all 12 points allocated ──
    rollStats(); // ensure class bonuses applied
    const stats=getTotalStats();
    const pLeft=getPointsLeft();
    if(pLeft>0){
      const pe=document.getElementById('points-remaining');
      if(pe){pe.style.color='var(--coral2)';pe.textContent=`Allocate ${pLeft} more point${pLeft!==1?'s':''} first`;}
      err.textContent=`Distribute all 12 attribute points before continuing (${pLeft} remaining).`;
      err.style.display='block';return;
    }
    // ── Compute all derived stats locally (official Ch.1-3 formulas) ──
    const physDef=10+(stats.str||0)+(stats.spd||0);
    const cogDef=10+(stats.int||0)+(stats.wil||0);
    const spirDef=10+(stats.awa||0)+(stats.pre||0);
    const maxInv=getMaxInvestiture(stats);
    const recovDie=getRecoveryDie(stats.wil||0);
    const deflect=window._kitDeflect||0;
    const hp=Math.max(1, 10+(stats.str||0)); // Official: HP = 10 + Strength

    // ── Build character ──
    const base={name,color:selColor,stats,hp,maxHp:hp,slot:mySlot,
      physDef,cogDef,spirDef,level:1,skillRanks:{},
      kit:selKit?selKit.id:'underworld',
      kitName:selKit?selKit.name:'Custom',
      weapons:(selKit&&selKit.weapons||[]).map(wid=>WEAPONS[wid]).filter(Boolean),
      armor:selKit&&selKit.armor?ARMORS[selKit.armor]:null,
      spheres:selKit?selKit.spheres:'1d20',
      ancestry:selAncestry||'human',
      cultures:selCultures.length?selCultures:['wayfarer'],
      culturalExpertises:selCultures.map(id=>CULTURES.find(cu=>cu.id===id)).filter(Boolean),
      isNPC:false,campaignId,gender,fragments:0,oathStage:1,
      investiture:0,maxInvestiture:maxInv, // Radiants start using this after First Ideal
      recovDie,deflect,
      origin:charOrigin||'',motivation:charMotivation||'',
      purpose:charMotivation||'',obstacle:charObstacle||'',goals:[],
      backstory:charBackstory,appearance:charAppearance};

    if(isRadiant){
      const cls=CLASSES.find(cl=>cl.id===selClass.id)||selClass;
      const surgeSkills={};
      (ORDER_SURGES[cls.id]||[]).forEach(sid=>{surgeSkills[sid]=0;});
      const bnEl=document.getElementById('in-blade-name');
      const bdEl=document.getElementById('in-blade-desc');
      const bladeName=(bnEl?bnEl.value.trim():'')||'';
      const bladeDesc=(bdEl?bdEl.value.trim():'')||'';
      myChar={...base,isRadiant:true,
        className:cls.name,classId:cls.id,
        philosophy:cls.philosophy,
        ideal1:cls.ideal1,ideal2:cls.ideal2,ideal3:cls.ideal3,ideal4:cls.ideal4,
        spren:cls.spren,sprenDesc:cls.sprenDesc||'',sprenAssist:cls.sprenAssist||'',
        surges:ORDER_SURGES[cls.id]||[],surgeSkills,
        weaponExpertises:[],armorExpertises:[],
        abilities:cls.abilities,
        bladeName,bladeDesc,
        investiture:maxInv,maxInvestiture:maxInv, // Radiants start with full Investiture
        focus:Math.max(1,2+(stats.wil||0)),maxFocus:Math.max(1,2+(stats.wil||0))};
    } else {
      const role=HERO_ROLES.find(r=>r.id===(selRole&&selRole.id))||HERO_ROLES[0];
      // Hero: add starting skill rank
      if(role.startingSkill&&(!base.skillRanks||!base.skillRanks[role.startingSkill])){
        if(!base.skillRanks)base.skillRanks={};
        base.skillRanks[role.startingSkill]=1; // 1 free rank from starting path
      }
      const wnEl=document.getElementById('in-weapon-name');
      const customName=wnEl?wnEl.value.trim():'';
      const weaponName=customName||(genWeaponName(selWeapon.id)+' '+selWeapon.name);
      myChar={...base,isRadiant:false,
        className:selRole.name,classId:selRole.id,
        roleId:selRole.id,roleName:selRole.name,
        pathName:role.id,keyTalent:role.keyTalent,keyTalentDesc:role.keyTalentDesc,
        startingSkill:role.startingSkill,pathSpecialties:role.specialties||[],
        weaponExpertises:selKit?(selKit.weapons||[]).map(wid=>WEAPONS[wid]?WEAPONS[wid].name:'').filter(Boolean):[],
        armorExpertises:selKit&&selKit.armor?[ARMORS[selKit.armor]?ARMORS[selKit.armor].name:''].filter(Boolean):[],
        abilities:[selWeapon.name],spren:null,
        weapon:weaponName,weaponId:selWeapon.id,weaponLevel:1,
        weaponData:selWeapon,
        focus:Math.max(1,2+(stats.wil||0)),maxFocus:Math.max(1,2+(stats.wil||0))};
    }

    // ── Resolve slot — mySlot was already assigned by claimNextSlot() in onEnter ──
    // If for any reason it's still null (edge case), claim now
    if(mySlot===null||mySlot===undefined){
      const idx=await claimNextSlot();
      mySlot=idx>=0?idx:0;
    }
    myChar.slot=mySlot;

    // ── Save ──
    saveMyChar(myChar); // save locally first
    // Rebuild gState if needed
    if(!gState){
      gState={players:new Array(partySize).fill(null),partySize,turn:0,
        totalMoves:0,phase:'pregame',campaignId,campaignName:campaignId};
    }
    if(!gState.players)gState.players=new Array(gState.partySize||partySize).fill(null);
    while(gState.players.length<=mySlot)gState.players.push(null);
    gState.players[mySlot]=myChar;
    await saveAndBroadcast(gState); // write + broadcast slot fill
    // Show lobby — keep create screen visible until lobby renders successfully
    showScreen('lobby');
    renderLobby();
    startLobbyPolling();

  }catch(e){
    console.error('onCreateChar failed:',e);
    // Show error visibly regardless of which screen is active
    const visibleErr=document.querySelector('.screen.active .err-msg')
      ||document.getElementById('create-err');
    if(visibleErr){visibleErr.textContent='Error: '+e.message;visibleErr.style.display='block';}
    // Also show as alert so it's never silently swallowed
    if(!visibleErr)alert('Character creation failed: '+e.message);
  }
}

// ══ LOBBY ══
async function assignNPC(slot){
  if(!gState||isLoading)return;
  if(gState.players[slot]&&gState.players[slot].isPlaceholder){return;} // someone is joining
  isLoading=true;
  const st=document.getElementById('lobby-status');
  if(st)st.textContent='Summoning companion...';
  const npc=genNPC(slot);
  gState.players[slot]=npc;
  await saveAndBroadcast(gState);
  isLoading=false;
  renderLobby();
  if(st)st.textContent='';
}
async function removeNPC(slot){if(!gState)return;gState.players[slot]=null;await saveState(gState);renderLobby();}
async function removeSlot(slot){
  if(!gState)return;
  const sz=gState.partySize||partySize;
  if(sz<=2){alert('Party must have at least 2 slots.');return;}
  gState.partySize=sz-1;
  partySize=sz-1;
  gState.players=gState.players.slice(0,sz-1);
  await saveState(gState);
  renderLobby();
}
let lobbyTimer=null;
// Safety timer — shared between onSubmitAction and handleNPC.
// Must be module-scope so both functions can clearTimeout() it.
let _loadingTimer=null;

function startLobbyPolling(){
  if(lobbyTimer)clearInterval(lobbyTimer);
  lobbyTimer=setInterval(async()=>{
    if(!document.getElementById('s-lobby').classList.contains('active')){
      stopLobbyPolling();return;
    }
    try{
      const fresh=await loadState();
      if(!fresh)return;
      if(fresh.phase==='playing'&&myChar){stopLobbyPolling();gState=fresh;showGameScreen();return;}
      const prevJSON=JSON.stringify(gState&&gState.players);
      gState=fresh;
      if(JSON.stringify(gState.players)!==prevJSON){
        renderLobby();
        if(lang==='th')setTimeout(applyThaiToPage,200);
      }
    }catch(e){}
  },5000);
}

function stopLobbyPolling(){
  if(lobbyTimer){clearInterval(lobbyTimer);lobbyTimer=null;}
}

let createPollTimer=null;
function startCreatePolling(){
  if(createPollTimer)clearInterval(createPollTimer);
  createPollTimer=setInterval(async()=>{
    if(!document.getElementById('s-create').classList.contains('active')){
      stopCreatePolling();return;
    }
    try{
      const fresh=await loadState();
      if(!fresh)return;
      const prevColors=JSON.stringify(gState.players.map(p=>p&&p.color));
      gState=fresh;
      if(JSON.stringify(gState.players.map(p=>p&&p.color))!==prevColors){
        renderColors(); // refresh color swatches
      }
    }catch(e){}
  },4000); // 4s during create — frequent enough without hammering
}
function stopCreatePolling(){
  if(createPollTimer){clearInterval(createPollTimer);createPollTimer=null;}
}

function claimSlot(i){
  if(!gState||!gState.players[i])return;
  const p=gState.players[i];
  if(p.isNPC){alert('That slot belongs to an NPC.');return;}
  myChar={...p,slot:i,campaignId};
  mySlot=i;
  saveMyChar(myChar);
  renderLobby();
}

function renderLobby(){
  try{
  if(!gState){console.error('renderLobby: gState is null');return;}
  if(!gState.players)gState.players=new Array(gState.partySize||partySize).fill(null);
  const sz=gState.partySize||partySize;
  const humans=gState.players.slice(0,sz).filter(p=>p&&!p.isNPC).length;
  const npcs=gState.players.slice(0,sz).filter(p=>p&&p.isNPC).length;
  const empty=gState.players.slice(0,sz).filter(p=>!p).length;
  const titleEl=document.getElementById('lobby-title');
  const subEl=document.getElementById('lobby-sub');
  if(titleEl)titleEl.textContent=gState.campaignName||campaignId||'Campaign';
  if(subEl)subEl.textContent=`${humans} player${humans!==1?'s':''} · ${npcs} AI companion${npcs!==1?'s':''} · ${empty} slot${empty!==1?'s':''} open`;
  const grid=document.getElementById('lobby-slots');
  if(!grid){console.error('renderLobby: lobby-slots not found');return;}
  // Fill the full row — 2→2col, 3→3col, 4→4col, 5→3col (2+3 wrap cleanly)
  const cols=sz===5?'repeat(3,1fr)':`repeat(${sz},1fr)`;
  grid.style.gridTemplateColumns=cols;
  const isPlaying=gState.phase==='playing';
  grid.innerHTML=Array.from({length:sz},(_,i)=>{
    const p=gState.players[i];
    const isMe=myChar&&myChar.slot===i;
    const amHost=isHost();
    if(!p){
      return`<div class="slot" style="text-align:center;">
        <div class="slot-num" style="margin-bottom:8px;">Slot ${i+1}</div>
        <div class="slot-empty-txt" style="margin-bottom:10px;">Empty — waiting for player</div>
        ${amHost&&!isPlaying?`<div style="display:flex;flex-direction:column;gap:8px;align-items:center;margin-top:4px;">
          <span class="slot-npc-btn" onclick="assignNPC(${i})">+ Fill with NPC</span>
          <span style="font-size:11px;color:var(--coral2);cursor:pointer;font-family:var(--font-d);letter-spacing:1px;" onclick="removeSlot(${i})">✕ Remove slot</span>
        </div>`:''}
      </div>`;
    }
    if(p.isPlaceholder){
      return`<div class="slot" style="text-align:center;">
        <div class="slot-num" style="margin-bottom:8px;">Slot ${i+1}</div>
        <div style="color:var(--amber2);font-family:var(--font-d);font-size:11px;letter-spacing:1px;margin-bottom:6px;">✦ Creating character...</div>
      </div>`;
    }
    if(p.isNPC){
      const canClaim=!myChar&&isPlaying; // late joiner can claim
      return`<div class="slot npc-slot">
        <div class="slot-num">Slot ${i+1} · AI</div>
        <div class="slot-pip"><div class="slot-dot" style="background:${p.color};"></div><div class="slot-pname">${p.name}</div></div>
        <div class="slot-class">${p.className}</div>
        <span class="slot-tag npc">NPC</span>
        <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
          ${canClaim?`<span class="slot-npc-btn" style="border-color:var(--amber-dim);color:var(--amber2);" onclick="lateJoinClaim(${i})">⟁ Join as this character</span>`:''}
          ${amHost&&!isPlaying?`<span style="font-size:11px;color:var(--coral2);cursor:pointer;font-family:var(--font-d);letter-spacing:1px;" onclick="removeNPC(${i})">✕ Remove</span>`:''}
        </div>
      </div>`;
    }
    const unclaimed=!isMe&&!p.isNPC&&!myChar&&!isPlaying;
    return`<div class="slot filled">
      <div class="slot-num">Slot ${i+1}${isMe?' · You':''}</div>
      <div class="slot-pip"><div class="slot-dot" style="background:${p.color};"></div><div class="slot-pname">${p.name}</div></div>
      <div class="slot-class">${p.className}</div>
      <span class="slot-tag">Ready</span>
      ${unclaimed?`<div style="margin-top:8px;"><span class="slot-npc-btn" style="border-color:var(--amber-dim);color:var(--amber2);" onclick="claimSlot(${i})">This is me →</span></div>`:''}
    </div>`;
  }).join('');
  if(lang==='th')setTimeout(applyThaiToPage,200);
  const actions=document.getElementById('lobby-actions');
  if(!actions){console.error('renderLobby: lobby-actions not found');return;}
  const allFilled=gState.players.slice(0,sz).every(p=>!!p);
  const hasHuman=gState.players.slice(0,sz).some(p=>p&&!p.isNPC);
  actions.innerHTML='';
  const allHandled=gState.players.slice(0,sz).every(p=>p&&!p.isPlaceholder);
  if(allHandled&&hasHuman&&gState.phase==='pregame'&&isHost()){
    actions.innerHTML+=`<button class="btn btn-gold" onclick="setTimeout(startNow,0)"><span data-tr>⟁ Begin the Saga →</span></button>`;
  } else if(gState.phase==='pregame'&&!isHost()){
    actions.innerHTML+=`<div style="font-family:var(--font-d);font-size:11px;letter-spacing:2px;color:var(--text4);padding:10px 0;">WAITING FOR HOST TO START...</div>`;
  }
  actions.innerHTML+=`<button class="btn btn-sm" onclick="showScreen('campaign')">← Campaigns</button>`;
  }catch(e){
    console.error('renderLobby crashed:',e);
    const el=document.getElementById('lobby-err');
    if(el){el.textContent='Lobby error: '+e.message;el.style.display='block';}
  }
}
async function lateJoinClaim(slot){
  if(!gState)return;
  mySlot=slot;
  const placeholder={name:'...',className:'Joining...',classId:'pending',
    color:'#555',hp:0,maxHp:0,slot,isNPC:false,campaignId,isPlaceholder:true};
  gState.players[slot]=placeholder;
  await saveState(gState);
  showScreen('create');renderCreate();startCreatePolling();
}

async function startNow(){
  if(isLoading)return;
  const sz=gState.partySize||partySize;
  const slots=gState.players.slice(0,sz);
  const allFilled=slots.every(p=>!!p);
  const hasHuman=slots.some(p=>p&&!p.isNPC);
  const st=document.getElementById('lobby-status');
  if(!allFilled){if(st)st.textContent='Fill all slots first — assign NPCs to empty slots.';return;}
  if(!hasHuman){if(st)st.textContent='At least one human player is required.';return;}
  if(st)st.textContent='Speaking the Oaths...';
  await startCampaign();
}

// ══ CAMPAIGN START ══
async function startCampaign(){
  gState.phase='playing';gState.turn=0;gState.totalMoves=0;gState.actionLog=[];
  gState.combatMode=false;
  gState.beatsUntilCombat=COMBAT_BEATS_MIN+Math.floor(Math.random()*(COMBAT_BEATS_MAX-COMBAT_BEATS_MIN+1));
  gState.beatsSinceLastCombat=0;
  gState.preCombatTriggered=false;
  gState.worldMemory={
    factions:{},        // { 'Alethi':'neutral', 'Parshendi':'hostile' }
    secrets:[],         // ['The tower has a mind of its own']
    metNPCs:[],         // [{name:'Tarah',context:'healer, owes party favor'}]
    choices:[],         // [{turn:12,summary:'Slac warned the refugees'}]
    actConsequences:{}, // {2:'Kharbranth remembers you'}
  }; // the "final tension" beat before combat
  if(!gState.locationSeed)gState.locationSeed=Math.floor(Math.random()*99999);
  buildActs(gState.locationSeed);
  await saveState(gState);
  await addLog({type:'system',who:'',text:'The Radiants have spoken their Oaths. The saga begins in '+ACTS[0].location+'. The Chronicles begin.',choices:[]});
  stopLobbyPolling();
  showGameScreen();
  setBottomLoading();
  await callGM(openingPrompt());
  const log=await loadLog(true);
  renderAll(log);
  setTimeout(()=>{setBottomFromState(log);maybeTranslateStory();},150);
}
// ══ WORLD MEMORY CONTEXT ══
function switchRightTab(tab){
  const tabs=['summary','world'];
  tabs.forEach(t=>{
    const btn=document.getElementById('tab-'+t);
    const body=document.getElementById('tab-'+t+'-body');
    const isActive=t===tab;
    if(btn){btn.style.background=isActive?'var(--bg3)':'var(--bg2)';btn.style.borderBottomColor=isActive?'var(--amber)':'transparent';btn.style.color=isActive?'var(--amber2)':'var(--text4)';}
    if(body)body.style.display=isActive?'block':'none';
  });
  if(tab==='world')renderConsequenceBoard();
}

function renderConsequenceBoard(){
  const el=document.getElementById('consequence-board');
  if(!el||!gState)return;
  const wm=gState.worldMemory;
  const condPanel='';
  if(!wm){el.innerHTML=condPanel+'<div style="color:var(--text5);font-size:12px;font-style:italic;text-align:center;padding:12px;">No discoveries yet.</div>';return;}
  let html=condPanel;

  // Focus status
  if(myChar){
    const focus=myChar.focus!=null?myChar.focus:3;
    const maxFocus=myChar.maxFocus||5;
    const focusDots=Array.from({length:maxFocus},(_,i)=>`<span style="color:${i<focus?'var(--amber2)':'var(--border2)'};">◈</span>`).join('');
    html+=`<div style="margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--border);">
      <div style="font-family:var(--font-d);font-size:10px;letter-spacing:2px;color:var(--text4);margin-bottom:4px;">YOUR FOCUS</div>
      <div style="font-size:16px;letter-spacing:3px;">${focusDots}</div>
      ${myChar.nextRollAdvantage?`<div style="font-size:10px;color:${myChar.nextRollAdvantage==='advantage'?'var(--teal2)':'var(--coral2)'};">▲ ${myChar.nextRollAdvantage.toUpperCase()} on next roll</div>`:''}
    </div>`;
  }

  // Factions
  const factions=Object.entries(wm.factions||{});
  if(factions.length){
    html+=`<div style="margin-bottom:10px;"><div style="font-family:var(--font-d);font-size:10px;letter-spacing:2px;color:var(--text4);margin-bottom:6px;">FACTIONS</div>`;
    factions.forEach(([name,rel])=>{
      const col=rel==='hostile'?'var(--coral2)':rel==='ally'?'var(--teal2)':'var(--text3)';
      const icon=rel==='hostile'?'⚔':rel==='ally'?'✦':'◦';
      html+=`<div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;"><span style="color:var(--text2);">${name}</span><span style="color:${col};">${icon} ${rel}</span></div>`;
    });
    html+='</div>';
  }

  // Secrets
  if((wm.secrets||[]).length){
    html+=`<div style="margin-bottom:10px;"><div style="font-family:var(--font-d);font-size:10px;letter-spacing:2px;color:var(--text4);margin-bottom:6px;">DISCOVERIES</div>`;
    wm.secrets.slice(-5).reverse().forEach(s=>{
      html+=`<div style="font-size:12px;color:var(--text3);padding:4px 0;border-bottom:1px solid var(--border);line-height:1.5;">◈ ${s}</div>`;
    });
    html+='</div>';
  }

  // Met NPCs
  if((wm.metNPCs||[]).length){
    html+=`<div style="margin-bottom:10px;"><div style="font-family:var(--font-d);font-size:10px;letter-spacing:2px;color:var(--text4);margin-bottom:6px;">KNOWN FACES</div>`;
    wm.metNPCs.slice(-6).forEach(n=>{
      html+=`<div style="font-size:12px;padding:3px 0;"><span style="color:var(--amber2);font-family:var(--font-d);">${n.name}</span><span style="color:var(--text4);"> — ${n.context}</span></div>`;
    });
    html+='</div>';
  }

  // Recent choices
  if((wm.choices||[]).length){
    html+=`<div style="margin-bottom:10px;"><div style="font-family:var(--font-d);font-size:10px;letter-spacing:2px;color:var(--text4);margin-bottom:6px;">CHOICES MADE</div>`;
    wm.choices.slice(-4).reverse().forEach(ch=>{
      html+=`<div style="font-size:11px;color:var(--text4);padding:3px 0;font-style:italic;">Turn ${ch.turn}: ${ch.summary}</div>`;
    });
    html+='</div>';
  }

  if(!html){
    html='<div style="color:var(--text5);font-size:12px;font-style:italic;text-align:center;padding:12px;">Explore to uncover the world...</div>';
  }
  el.innerHTML=html;
}

function getWorldMemoryContext(){
  const wm=gState&&gState.worldMemory;
  if(!wm)return'';
  const parts=[];
  const factions=Object.entries(wm.factions||{});
  if(factions.length)parts.push('Factions: '+factions.map(([k,v])=>`${k} (${v})`).join(', '));
  if((wm.secrets||[]).length)parts.push('Known secrets: '+wm.secrets.slice(-3).join(' | '));
  if((wm.metNPCs||[]).length)parts.push('Known NPCs: '+wm.metNPCs.slice(-4).map(n=>`${n.name} — ${n.context}`).join('; '));
  if((wm.choices||[]).length)parts.push('Recent choices: '+wm.choices.slice(-3).map(ch=>`Turn ${ch.turn}: ${ch.summary}`).join(' | '));
  const actCons=wm.actConsequences&&wm.actConsequences[getAct(gState.totalMoves||0).num];
  if(actCons)parts.push('This act: '+actCons);
  if(!parts.length)return'';
  return'\n\nWORLD STATE: '+parts.join(' | ');
}

function getRecentBeats(){
  // Returns the last few action log entries as short-term narrative memory
  // actionLog entries have: {name, verb, noun, success, roll, total, ts, hpMsg}
  if(!gState||!gState.actionLog||!gState.actionLog.length)return'';
  const recent=gState.actionLog.slice(0,6); // actionLog is unshift'd, so [0] is newest
  const beats=recent.map(e=>`${e.name}: ${e.verb} ${e.noun} → ${e.success}${e.hpMsg?' ('+e.hpMsg+')':''}`);
  // Also pull last GM story text if available
  if(gState.lastGM&&gState.lastGM.text){
    const gmSnip=gState.lastGM.text.substring(0,150)+(gState.lastGM.text.length>150?'...':'');
    beats.unshift(`→ ${gmSnip}`);
  }
  if(!beats.length)return'';
  return'\n\nIMMEDIATE HISTORY (these events just happened — treat as seconds ago, not ancient history):\n'+beats.join('\n');
}

function getCombatThread(){
  // What the GM discovered in exploration that should bleed into combat
  // Gives combat its reason-for-being and narrative continuity
  if(!gState)return'';
  const parts=[];
  // Last GM beat before combat = the discovery that triggered the fight
  const log=gState.actionLog||[];
  const preCombatBeats=log.slice(-8).filter(e=>e.type==='gm').slice(-3);
  if(preCombatBeats.length){
    parts.push('What led here: '+preCombatBeats.map(e=>e.text.substring(0,100)).join(' → '));
  }
  // Any secrets discovered during exploration
  const wm=gState.worldMemory;
  if(wm&&(wm.secrets||[]).length){
    parts.push('Discoveries: '+wm.secrets.slice(-2).join(' | '));
  }
  return parts.length?'\n\nNARRATIVE THREAD (this combat grew from these discoveries — reference them):\n'+parts.join('\n'):'';
}

async function updateWorldMemory(gmText, action, turn){
  if(!gState||!gState.worldMemory)return;
  try{
    const prompt=`From this RPG story beat, extract world state changes as JSON. Return ONLY valid JSON, nothing else.
Story: "${gmText.substring(0,600)}"
Player action: "${action||''}"

Return: {"factions":{"FactionName":"disposition"},"secrets":["new secret if revealed"],"npcs":[{"name":"NPC name","context":"brief context"}],"choiceSummary":"1 sentence summary of player choice if significant"}
If nothing notable happened, return {}`;
    const res=await fetch(PROXY_URL,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:200,
        messages:[{role:'user',content:prompt}]})});
    const data=await res.json();
    const raw=data.content&&data.content[0]?data.content[0].text.trim():'{}';
    const updates=JSON.parse(raw.replace(/```json|```/g,'').trim());
    const wm=gState.worldMemory;
    if(updates.factions)Object.assign(wm.factions,updates.factions);
    if(updates.secrets&&updates.secrets.length)wm.secrets=[...wm.secrets,...updates.secrets].slice(-10);
    if(updates.npcs&&updates.npcs.length){
      updates.npcs.forEach(n=>{
        if(!wm.metNPCs.find(x=>x.name===n.name))wm.metNPCs.push(n);
      });
      wm.metNPCs=wm.metNPCs.slice(-10);
    }
    if(updates.choiceSummary&&turn)wm.choices=[...wm.choices,{turn,summary:updates.choiceSummary}].slice(-10);
  }catch(e){/* silent fail — world memory is enhancement not core */}
}

function openingPrompt(){
  const sz=gState.partySize||partySize;
  const names=gState.players.slice(0,sz).map(p=>`${p.name} the ${p.className}${p.isNPC?' (NPC — acts via D4 dice, no AI decisions)':' (human player)'}`).join(', ');
  const a1=ACTS[0],a2=ACTS[1],a3=ACTS[2];
  const gctx=getGenderContext();const wmctx=getWorldMemoryContext();const cctx=getCharContext();
  const _gc = window.SystemData?.gmContext || {};
  return`You are the Game Master for ${_gc.combatFlavor||'a'} RPG set in ${_gc.worldName||'an epic world'}. 180-turn epic saga across 3 acts.

ACTS: I (1-60): ${a1.location} | II (61-120): ${a2.location} | III (121-180): ${a3.location}
PARTY: ${names}${gctx}

STORYTELLING RULES — follow every turn without exception:
1. SHOW don't tell. No "you sense danger" — show the crumbling wall, the spren flickering.
2. VARY sentence structure. Mix short punchy lines with long atmospheric ones.
3. EACH SCENE CHANGES SOMETHING. End every narration with the world in a different state.
4. NO repeated weapon draws to open scenes. Find other ways to establish action.
5. LOCATION SPECIFIC. ${a1.location} has unique features — smells, sounds, architecture, spren behavior.
6. USE assigned pronouns consistently — never switch mid-scene.

Write EXACTLY 2 short paragraphs (2-3 sentences each, blank line between). Immediate crisis in ${a1.location} — specific, sensory, urgent. Not a generic camp scene.

[CHOICES]
4 first-person choices ("I [verb]..."), one sentence each, tagged [COMBAT], [DISCOVERY], or [DECISION]. Specific to ${a1.location} and ${gState.players[0].className}. Four distinct approaches.${getLangInstruction()}`;
}



// ── GAME SCREEN ───────────────────────────────────────────────
// ══ GAME SCREEN ══
async function showGameScreen(){
  stormIntensify(false);
  showScreen('game');
  const ab=document.getElementById('audio-bar');
  if(ab)ab.style.display='flex';
  startPolling();
  connectSession(); // upgrade to WS when available
  await refreshGame();
  setTimeout(initParallax,500);
}

async function refreshGame(){
  const prev=gState&&gState.lastGM?{...gState.lastGM}:null;
  gState=await loadState();
  if(!gState)return;
  if(gState.locationSeed)buildActs(gState.locationSeed);
  if(gState.phase==='playing'){
    if(gState.beatsUntilCombat==null)gState.beatsUntilCombat=COMBAT_BEATS_MIN+Math.floor(Math.random()*(COMBAT_BEATS_MAX-COMBAT_BEATS_MIN+1));
    if(gState.beatsSinceLastCombat==null)gState.beatsSinceLastCombat=0;
    if(gState.combatMode==null)gState.combatMode=false;
    if(!gState.worldMemory)gState.worldMemory={factions:{},secrets:[],metNPCs:[],choices:[],actConsequences:{}};
  }
  if(!gState.lastGM&&prev)gState.lastGM=prev;
  const log=await loadLog(false);
  if(gState&&!gState.lastGM){const lg=[...log].reverse().find(e=>e.type==='gm');if(lg)gState.lastGM={text:lg.text,choices:lg.choices,ts:lg.ts};}
  const prevLastGMTs=lastGMTs;
  renderAll(log);
  const cur=gState.players[gState.turn];
  const nowMine=cur&&myChar&&!cur.isNPC&&cur.name===myChar.name;
  const nowNPC=cur&&cur.isNPC;
  const storyChanged=lastGMTs!==prevLastGMTs;
  const wasWaiting=bottomState==='waiting';
  if(bottomState===''||storyChanged||(wasWaiting&&(nowMine||nowNPC))){
    setBottomFromState(log);
  }
  const onGame=document.getElementById('s-game').classList.contains('active');
  const onCombat=document.getElementById('s-combat').classList.contains('active');
  if(gState&&gState.combatMode&&!onCombat){
    enterCombat();return;
  }
  renderPill();
}

// Lightweight party strip re-render (no full DOM rebuild)
function renderPartyStrip(){
  const sz=gState&&gState.partySize||partySize;
  const strip=document.getElementById('party-strip');
  if(!strip||!gState)return;
  // Only update ppip elements that changed
  (gState.players||[]).slice(0,sz).forEach((p,i)=>{
    if(!p)return;
    const id='ppip-'+p.name.replace(/\s/g,'_');
    const ppip=document.getElementById(id);
    if(!ppip)return; // full rebuild needed
    const infoEl=ppip.querySelector('.ppip-info');
    if(!infoEl)return;
    const newText=p.className+(p.level?' Lv.'+p.level:'')+' · '+p.hp+'/'+p.maxHp+' HP · ◈ '+(p.focus||0)+'/'+(p.maxFocus||3)+' Focus'+(p.isRadiant&&p.maxInvestiture?' · ✦ '+(p.investiture||0)+'/'+p.maxInvestiture+' Inv':'')+(p.deflect?' · DEF '+p.deflect:'')+(p.nextRollAdvantage==='advantage'?' ▲ ADV':p.nextRollAdvantage==='disadvantage'?' ▼ DIS':'')+(p.conditions&&Object.keys(p.conditions).some(k=>p.conditions[k])?' ⚠':'');
    if(infoEl.textContent!==newText)infoEl.textContent=newText;
  });
}

function renderAll(log){
  if(gState&&gState.combatMode&&document.getElementById('s-combat').classList.contains('active')){
    renderCombatScreen();return;
  }
  renderParty();renderEnemies();renderInitiativeOrder();renderStory(log);renderProgress();renderPill();renderActionLog();
}

// ══ ACTION LOG + TLDR PANELS ══
function addActionLog(name, action, roll, hpMsg, total){
  if(!gState)return;
  if(!gState.actionLog)gState.actionLog=[];
  const words=action.trim().replace(/\[.*?\]/g,'').trim().split(/\s+/);
  const verb=words[0]||'Acts';
  const noun=words.slice(1,4).join(' ')||(action.substring(0,20));
  const displayRoll=total||roll;
  const success=displayRoll>=18?'CRIT!':displayRoll>=14?'SUCCESS':displayRoll>=10?'PARTIAL':displayRoll>=6?'FAILED':'FUMBLE';
  const ts=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  const entry={name,verb,noun,success,roll,total:displayRoll,ts,hpMsg:hpMsg||''};
  gState.actionLog.unshift(entry);
  if(gState.actionLog.length>20)gState.actionLog.pop();
  renderActionLog();
  saveState(gState).catch(()=>{});
}

function renderActionLog(){
  const el=document.getElementById('action-log-list');if(!el||!gState)return;
  const log=gState.actionLog||[];
  if(!log.length){el.innerHTML='<div style="color:var(--text5);font-size:12px;font-style:italic;text-align:center;padding:12px;">No actions yet</div>';return;}
  // CRIT!   #C9A84C  gold
  // SUCCESS #28A87A  teal
  // PARTIAL #76A2E8  blue
  // FAILED  #B03828  red
  // FUMBLE  #93979E  gray
  function resultColor(s){
    const u=(s||'').toUpperCase();
    if(u==='CRIT!'||u==='CRIT') return'#C9A84C';
    if(u==='SUCCESS')            return'#28A87A';
    if(u==='PARTIAL')            return'#76A2E8';
    if(u==='FAILED')             return'#B03828';
    if(u==='FUMBLE')             return'#93979E';
    return'var(--text4)';
  }
  el.innerHTML=log.map(e=>{
    const col=resultColor(e.success);
    const p=gState.players&&gState.players.find(x=>x&&x.name===e.name);
    const nameCol=p?p.color:'var(--text3)';
    return`<div style="padding:7px 0;border-bottom:1px solid var(--border);font-size:12px;line-height:1.5;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="color:${nameCol};font-family:var(--font-d);font-size:10px;letter-spacing:1px;">${e.name}</span>
        <span style="color:var(--text5);font-size:10px;">${e.ts}</span>
      </div>
      <div style="color:var(--text2);margin:2px 0;">${e.verb} ${e.noun}</div>
      <div style="display:flex;gap:6px;align-items:center;">
        <span style="color:${col};font-family:var(--font-d);font-size:10px;letter-spacing:1px;font-weight:700;">[${e.success}]</span>
        <span style="color:var(--text4);font-size:10px;">d20:${e.roll}${e.total&&e.total!==e.roll?'→'+e.total:''}</span>
        ${e.hpMsg?`<span style="color:${e.hpMsg.includes('⬆')?'var(--teal2)':'var(--coral2)'};font-size:10px;">${e.hpMsg.split(' ').slice(0,3).join(' ')}</span>`:''}
      </div>
    </div>`;
  }).join('');
}

async function generateTLDR(storyText){
  if(!storyText||storyText.trim().length<50)return;
  const el=document.getElementById('tldr-text');if(!el)return;
  el.textContent='Summarising...';
  try{
    const res=await fetch(PROXY_URL,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:120,
        messages:[{role:'user',content:'Summarise this RPG story beat in exactly 2 punchy sentences. Plain text only, no formatting:\n\n'+storyText}]})});
    const data=await res.json();
    const summary=data.content&&data.content[0]?data.content[0].text:'';
    el.textContent=summary;
    if(lang==='th'&&summary){
      const tres=await fetch(PROXY_URL,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:200,
          messages:[{role:'user',content:'Translate to Thai, keep proper names in English. Return only the translation:\n\n'+summary}]})});
      const td=await tres.json();
      if(td.content&&td.content[0])el.textContent=td.content[0].text;
    }
  }catch(e){el.textContent='Summary unavailable.';}
}

// ══ SPREN SVG COMPANIONS ══
function getSprenSVG(classId, bond, isHero, roleName){
  if(isHero){
    const roleIcons={
      soldier:`<svg class="spren-svg" viewBox="0 0 44 44" style="color:#c44a28;animation:heroZoom 3s ease-in-out infinite,heroPulse 3s ease-in-out infinite;"><text x="22" y="30" text-anchor="middle" font-size="22" fill="currentColor">⚔</text></svg>`,
      scholar:`<svg class="spren-svg" viewBox="0 0 44 44" style="color:#5a9e8f;animation:heroZoom 3.5s ease-in-out infinite,heroPulse 3.5s ease-in-out infinite;"><text x="22" y="30" text-anchor="middle" font-size="22" fill="currentColor">📜</text></svg>`,
      merchant:`<svg class="spren-svg" viewBox="0 0 44 44" style="color:#BA7517;animation:heroZoom 4s ease-in-out infinite,heroPulse 4s ease-in-out infinite;"><text x="22" y="30" text-anchor="middle" font-size="22" fill="currentColor">💎</text></svg>`,
      horneater:`<svg class="spren-svg" viewBox="0 0 44 44" style="color:#888;animation:heroZoom 2.5s ease-in-out infinite,heroPulse 2.5s ease-in-out infinite;"><text x="22" y="30" text-anchor="middle" font-size="22" fill="currentColor">🏔</text></svg>`,
      herdazian:`<svg class="spren-svg" viewBox="0 0 44 44" style="color:#7a6e5a;animation:heroZoom 3s ease-in-out infinite,heroPulse 3s ease-in-out infinite;"><text x="22" y="30" text-anchor="middle" font-size="22" fill="currentColor">🗡</text></svg>`,
      shin:`<svg class="spren-svg" viewBox="0 0 44 44" style="color:#8fa870;animation:heroZoom 4s ease-in-out infinite,heroPulse 4s ease-in-out infinite;"><text x="22" y="30" text-anchor="middle" font-size="22" fill="currentColor">🌾</text></svg>`,
      worldsinger:`<svg class="spren-svg" viewBox="0 0 44 44" style="color:#9b7bb8;animation:heroZoom 3.5s ease-in-out infinite,heroPulse 3.5s ease-in-out infinite;"><text x="22" y="30" text-anchor="middle" font-size="22" fill="currentColor">🎵</text></svg>`,
      custom:`<svg class="spren-svg" viewBox="0 0 44 44" style="color:#a09080;animation:heroZoom 3s ease-in-out infinite,heroPulse 3s ease-in-out infinite;"><text x="22" y="30" text-anchor="middle" font-size="22" fill="currentColor">✦</text></svg>`,
    };
    const roleId=(roleName||'').toLowerCase().replace(/\s+/g,'').replace('alethli','soldier').replace('alethi','soldier').replace('kharbranth','scholar').replace('thaylen','merchant').replace('horneater','horneater').replace('herdazian','herdazian').replace('shin','shin').replace('worldsinger','worldsinger');
    return roleIcons[roleId]||roleIcons[classId]||roleIcons.custom;
  }

  if(!bond)return'';
  const col=bond.color||'#aaa';

  const svgs={
    windrunner:`<svg class="spren-svg" viewBox="0 0 44 44"><path d="M6 32 C10 26 14 20 18 16 C22 12 28 10 36 12" stroke="${col}" stroke-width="2" fill="none" stroke-linecap="round" stroke-dasharray="38 4" style="animation:flowRibbon 1.8s linear infinite;"/><path d="M4 36 C9 29 14 24 20 20 C26 15 32 14 38 16" stroke="${col}" stroke-width="1" fill="none" stroke-linecap="round" stroke-dasharray="42 6" opacity="0.45" style="animation:flowRibbon 2.4s linear infinite 0.6s;"/><path d="M8 28 C12 24 16 20 20 18" stroke="${col}" stroke-width="0.7" fill="none" stroke-linecap="round" opacity="0.25" stroke-dasharray="18 4" style="animation:flowRibbon 1.4s linear infinite 0.3s;"/></svg>`,

    lightweaver:`<svg class="spren-svg" viewBox="0 0 44 44"><g style="transform-origin:22px 22px;animation:spinSlow 8s linear infinite;"><polygon points="22,6 26,16 38,16 28,23 32,34 22,27 12,34 16,23 6,16 18,16" stroke="${col}" stroke-width="1.2" fill="none" opacity="0.8"/></g><g style="transform-origin:22px 22px;animation:spinSlowRev 5s linear infinite;"><polygon points="22,11 25,18 33,18 27,22 29,30 22,26 15,30 17,22 11,18 19,18" stroke="${col}" stroke-width="0.8" fill="${col}" fill-opacity="0.08"/></g><circle cx="22" cy="22" r="2.5" fill="${col}" opacity="0.7" style="animation:orbDrift 3s ease-in-out infinite;"/></svg>`,

    edgedancer:`<svg class="spren-svg" viewBox="0 0 44 44"><path d="M22 38 Q18 30 20 22 Q21 16 22 10" stroke="${col}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-dasharray="30 4" style="animation:vineGrow 2.2s ease-in-out infinite;"/><path d="M22 28 Q16 24 14 20" stroke="${col}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.7" style="animation:vineGrow 2.2s ease-in-out infinite 0.4s;"/><path d="M22 22 Q28 18 30 14" stroke="${col}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.7" style="animation:vineGrow 2.2s ease-in-out infinite 0.8s;"/><circle cx="22" cy="10" r="2" fill="${col}" opacity="0.9"/><circle cx="14" cy="20" r="1.5" fill="${col}" opacity="0.6"/><circle cx="30" cy="14" r="1.5" fill="${col}" opacity="0.6"/></svg>`,

    stoneward:`<svg class="spren-svg" viewBox="0 0 44 44"><polygon points="22,6 30,14 34,24 28,34 16,34 10,24 14,14" stroke="${col}" stroke-width="1.5" fill="${col}" fill-opacity="0.08" style="animation:starRay 3s ease-in-out infinite;"/><polygon points="22,12 27,18 29,24 25,30 19,30 15,24 17,18" stroke="${col}" stroke-width="1" fill="${col}" fill-opacity="0.12" style="animation:starRay 3s ease-in-out infinite 0.5s;"/><circle cx="22" cy="22" r="3" fill="${col}" opacity="0.5" style="animation:orbDrift 4s ease-in-out infinite;"/></svg>`,

    elsecaller:`<svg class="spren-svg" viewBox="0 0 44 44"><circle cx="22" cy="22" r="12" stroke="${col}" stroke-width="1.2" fill="none" opacity="0.3" stroke-dasharray="4 2" style="animation:spinSlow 6s linear infinite;"/><circle cx="22" cy="22" r="7" stroke="${col}" stroke-width="1.5" fill="none" opacity="0.6" style="animation:spinSlowRev 4s linear infinite;"/><circle cx="22" cy="22" r="2" fill="${col}" opacity="0.9"/><circle cx="32" cy="22" r="2" fill="${col}" opacity="0.8" style="transform-origin:22px 22px;animation:spinSlow 3s linear infinite;"/></svg>`,

    truthwatcher:`<svg class="spren-svg" viewBox="0 0 44 44"><g style="transform-origin:22px 22px;animation:starRay 2s ease-in-out infinite;"><line x1="22" y1="6" x2="22" y2="38" stroke="${col}" stroke-width="0.8" opacity="0.3"/><line x1="6" y1="22" x2="38" y2="22" stroke="${col}" stroke-width="0.8" opacity="0.3"/><line x1="10" y1="10" x2="34" y2="34" stroke="${col}" stroke-width="0.6" opacity="0.2"/><line x1="34" y1="10" x2="10" y2="34" stroke="${col}" stroke-width="0.6" opacity="0.2"/></g><polygon points="22,8 24.5,16 33,16 26.5,21 29,29 22,24 15,29 17.5,21 11,16 19.5,16" stroke="${col}" stroke-width="1.3" fill="${col}" fill-opacity="0.1" style="animation:starRay 2s ease-in-out infinite 0.3s;"/></svg>`,

    willshaper:`<svg class="spren-svg" viewBox="0 0 44 44"><ellipse cx="22" cy="22" rx="14" ry="6" stroke="${col}" stroke-width="1.2" fill="none" opacity="0.5" style="transform-origin:22px 22px;animation:spinSlow 3s linear infinite;"/><ellipse cx="22" cy="22" rx="10" ry="14" stroke="${col}" stroke-width="1" fill="none" opacity="0.4" style="transform-origin:22px 22px;animation:spinSlowRev 4s linear infinite;"/><circle cx="22" cy="22" r="2.5" fill="${col}" opacity="0.8" style="animation:orbDrift 2s ease-in-out infinite;"/></svg>`,

    dustbringer:`<svg class="spren-svg" viewBox="0 0 44 44"><ellipse cx="22" cy="30" rx="6" ry="4" fill="#ff4400" fill-opacity="0.5" style="animation:firePulse 0.8s ease-in-out infinite;"/><path d="M16 30 Q18 22 22 14 Q26 22 28 30" fill="${col}" fill-opacity="0.7" stroke="none" style="animation:firePulse 0.9s ease-in-out infinite;"/><path d="M18 30 Q20 24 22 18 Q24 24 26 30" fill="#ffaa22" fill-opacity="0.6" stroke="none" style="animation:firePulse 0.7s ease-in-out infinite 0.1s;"/><circle cx="14" cy="20" r="1.2" fill="${col}" style="animation:sparkFloat 1.5s ease-out infinite;"/><circle cx="30" cy="24" r="1" fill="#ffcc44" style="animation:sparkFloat 1.8s ease-out infinite 0.4s;"/><circle cx="20" cy="16" r="0.8" fill="#ff8800" style="animation:sparkFloat 1.2s ease-out infinite 0.7s;"/></svg>`,

    bondsmith:`<svg class="spren-svg" viewBox="0 0 44 44"><circle cx="14" cy="22" r="8" stroke="${col}" stroke-width="1.5" fill="none" style="animation:linkPulse 2s ease-in-out infinite;"/><circle cx="30" cy="22" r="8" stroke="${col}" stroke-width="1.5" fill="none" style="animation:linkPulse 2s ease-in-out infinite 0.5s;"/><line x1="19" y1="22" x2="25" y2="22" stroke="${col}" stroke-width="2" style="animation:linkPulse 2s ease-in-out infinite 0.25s;"/><circle cx="14" cy="22" r="3" fill="${col}" fill-opacity="0.3" style="animation:orbDrift 3s ease-in-out infinite;"/><circle cx="30" cy="22" r="3" fill="${col}" fill-opacity="0.3" style="animation:orbDrift 3s ease-in-out infinite 1s;"/></svg>`,

    skybreaker:`<svg class="spren-svg" viewBox="0 0 44 44"><g style="transform-origin:22px 22px;animation:spinSlow 10s linear infinite;"><polygon points="22,4 24.5,14 35,14 27,20 30,30 22,24 14,30 17,20 9,14 19.5,14" fill="${col}" fill-opacity="0.12"/><polygon points="22,4 24.5,14 35,14 27,20 30,30 22,24 14,30 17,20 9,14 19.5,14" stroke="${col}" stroke-width="1.3" fill="none"/></g><circle cx="22" cy="22" r="3" fill="${col}" opacity="0.6" style="animation:starRay 2.5s ease-in-out infinite;"/></svg>`,
  };
  return svgs[classId]||'';
}

// ══ HP ANIMATION ══
function animateHPChange(playerName, fromPct, toPct, delta, isHeal){
  const card=document.getElementById('ppip-'+playerName.replace(/\s/g,'_'));
  const fill=document.getElementById('hp-fill-'+playerName.replace(/\s/g,'_'));
  if(!card)return;
  const float=document.createElement('div');
  float.className=isHeal?'heal-float':'dmg-float';
  float.textContent=(isHeal?'+':'-')+Math.abs(delta)+'HP';
  float.style.color=isHeal?'var(--teal2)':'var(--coral2)';
  card.style.position='relative';
  card.appendChild(float);
  setTimeout(()=>float.remove(),1100);
  card.classList.remove('took-damage','received-heal');
  void card.offsetWidth; // force reflow
  card.classList.add(isHeal?'received-heal':'took-damage');
  setTimeout(()=>card.classList.remove('took-damage','received-heal'),900);
}

// ══ SKIP TURN SYSTEM ══
function isHost(){
  if(!gState||!myChar)return false;
  // Find the first non-NPC, non-placeholder human slot — avoids deadlock when slot 0 is NPC/null
  const firstHuman=gState.players.find(p=>p&&!p.isNPC&&!p.isPlaceholder);
  return firstHuman&&firstHuman.name===myChar.name;
}

function isSelfTurn(){
  if(!gState||!myChar)return false;
  const cur=gState.players[gState.turn];
  return cur&&cur.name===myChar.name&&!cur.isNPC;
}

async function doRestAction(){
  if(!myChar||!gState)return;
  const result=doShortRest(myChar);
  const idx=gState.players.findIndex(p=>p&&p.name===myChar.name);
  if(idx>=0)gState.players[idx]=myChar;
  saveMyChar(myChar);
  // Log the rest
  const detail=`${myChar.name} takes a short rest — recovers ${result.hpRecovered} HP and ${result.focusRecovered} Focus (rolled ${result.die}: ${result.roll})`;
  addLog({type:'system',who:'',text:detail,choices:[]});
  loadLog(false).then(l=>renderAll(l));
  saveAndBroadcast(gState).catch(()=>{});
  showToast(`Short rest: +${result.hpRecovered} HP, +${result.focusRecovered} Focus`);
}
async function skipTurn(playerName){
  if(!gState)return;
  const sz=gState.partySize||partySize;
  const idx=gState.players.findIndex(p=>p&&p.name===playerName);
  if(idx<0)return;
  await addLog({type:'system',who:'',
    text:`⏭ ${playerName}'s turn was skipped by ${myChar?myChar.name:'the host'}.`,
    choices:[]});
  gState.turn=(gState.turn+1)%sz;
  gState.totalMoves=(gState.totalMoves||0)+1;
  if(!gState.combatMode){
    gState.beatsSinceLastCombat=(gState.beatsSinceLastCombat||0)+1;
    const beatsLeft=(gState.beatsUntilCombat||5)-gState.beatsSinceLastCombat;
    if(beatsLeft<=0&&gState.preCombatTriggered){gState.combatMode=true;}
    else if(beatsLeft<=0&&!gState.preCombatTriggered){gState.preCombatTriggered=true;}
  }
  await saveAndBroadcast(gState);
  const freshLog=await loadLogCached(true);
  renderAll(freshLog);
  setBottomFromState(freshLog);
}

async function skipCombatTurn(playerName){
  if(!gState)return;
  if(!gState.pendingActions)gState.pendingActions={};
  gState.pendingActions[playerName]='[DEFEND] Hold position and brace — buying time for the others';
  await saveAndBroadcast(gState);
  renderCombatActions();
  const sz=gState.partySize||partySize;
  const allSubmitted=gState.players.slice(0,sz)
    .filter(p=>p&&!p.isNPC&&!p.downed)
    .every(p=>gState.pendingActions&&gState.pendingActions[p.name]);
  if(allSubmitted)resolveRound();
}

// ══ SKIP BUTTON IN TOP BAR ══
function handleSkipTop(){
  if(!gState||!myChar)return;
  const cur=gState.players&&gState.players[gState.turn];
  if(!cur)return;
  if(gState.combatMode){
    const sz=gState.partySize||partySize;
    if(isSelfTurn()||awayMode){
      skipCombatTurn(myChar.name);
      awayMode=false;
    } else if(isHost()){
      const notSubmitted=gState.players.slice(0,sz)
        .filter(p=>p&&!p.isNPC&&!p.downed&&(!gState.pendingActions||!gState.pendingActions[p.name]))
        .filter(p=>p.name!==myChar.name);
      if(notSubmitted.length>0)skipCombatTurn(notSubmitted[0].name);
    } else {
      awayMode=!awayMode;
    }
  } else {
    if(isSelfTurn()){
      skipTurn(cur.name);
      awayMode=false;
    } else {
      awayMode=!awayMode;
    }
  }
  renderSkipBtn();
}

function renderSkipBtn(){
  const btn=document.getElementById('skip-top-btn');
  if(!btn||!gState||!myChar)return;
  const cur=gState.players&&gState.players[gState.turn];
  if(!cur){btn.style.display='none';return;}
  const mine=cur.name===myChar.name&&!cur.isNPC;

  btn.style.display='inline-flex';

  if(awayMode){
    btn.textContent='🟡 Away (armed)';
    btn.style.borderColor='var(--amber)';
    btn.style.color='var(--amber2)';
    btn.style.background='rgba(191,161,90,0.1)';
    btn.title='Away mode on — your next turn will auto-skip. Tap to cancel.';
  } else if(mine){
    btn.textContent='⏭ Step away';
    btn.style.borderColor='var(--border2)';
    btn.style.color='var(--text4)';
    btn.style.background='transparent';
    btn.title='Skip your turn now';
  } else if(!mine&&!cur.isNPC){
    btn.textContent='⏭ Away next';
    btn.style.borderColor='var(--border2)';
    btn.style.color='var(--text4)';
    btn.style.background='transparent';
    btn.title='Auto-skip your next turn when it arrives';
  } else if(isHost()&&cur.isNPC){
    btn.style.display='none';
  } else {
    btn.style.display='none';
  }
}

// ══ RENDER PARTY STRIP ══
function renderParty(){
  const s=document.getElementById('party-strip');if(!gState)return;
  const sz=gState.partySize||partySize;
  s.innerHTML=gState.players.slice(0,sz).map((p,i)=>{
    if(!p)return`<div class="ppip"><div class="ppip-top"><div class="ppip-dot" style="background:var(--border2);"></div><span class="ppip-name" style="color:var(--text5);">Empty</span></div></div>`;
    const pct=Math.round((p.hp/p.maxHp)*100);
    const hpCol=pct>60?p.color:pct>30?'#BA7517':'#c44a28';
    const bond=SPREN_BONDS[p.classId];
    const stage=getSprenStage(gState.totalMoves||0);
    const sprenSVG=getSprenSVG(p.classId,bond,p.isRadiant===false,p.roleName||p.className);
    return`<div class="ppip-pair">
      <div class="ppip${gState.turn===i?' active':''}${p.isNPC?' npc':''}" id="ppip-${p.name.replace(/\s/g,'_')}">
        <div class="ppip-top"><div class="ppip-dot" style="background:${p.color};"></div><span class="ppip-name">${p.name}</span></div>
        <div class="ppip-info">${p.className}${p.level?' Lv.'+p.level:''} · ${p.hp}/${p.maxHp} HP · ◈ ${p.focus||0}/${p.maxFocus||3} Focus${p.isRadiant&&p.maxInvestiture?` · ✦ ${p.investiture||0}/${p.maxInvestiture} Inv`:''}${p.deflect?` · DEF ${p.deflect}`:''}${p.nextRollAdvantage==='advantage'?' ▲ ADV':p.nextRollAdvantage==='disadvantage'?' ▼ DIS':''}${(p.conditions&&Object.keys(p.conditions).some(k=>p.conditions[k]))?' ⚠':''}</div>
        ${p.nextRollAdvantage?`<div class="ppip-tag" style="color:${p.nextRollAdvantage==='advantage'?'var(--teal2)':'var(--coral2)'};">${p.nextRollAdvantage==='advantage'?'▲ ADVANTAGE':'▼ DISADVANTAGE'}</div>`:''}
        ${bond?`<div class="ppip-tag" style="color:${bond.color};">✦ ${bond.nick} Oath ${p.oathStage||1}/5</div>`:''}
        ${p.isNPC?'<div class="ppip-tag" style="color:var(--teal2);">AI COMPANION</div>':''}
        ${p.shardblade?`<div class="ppip-tag" style="color:var(--amber2);" title="${p.bladeDesc||p.shardblade}">⚔ ${p.bladeName||p.shardblade} T${p.bladeLevel||1}</div>`:''}
      ${p.weapon&&!p.shardblade?`<div class="ppip-tag" style="color:var(--amber2);">⚔ ${p.weapon} T${p.weaponLevel||1}</div>`:''}
        ${p.shardplate?`<div class="ppip-tag" style="color:var(--gold);">⬛ Shardplate</div>`:''}
        ${(p.fragments||0)>0?`<div class="ppip-tag" style="color:var(--teal2);">✦ ${p.fragments} frags</div>`:''}
        <div class="hp-track"><div class="hp-fill" id="hp-fill-${p.name.replace(/\s/g,'_')}" style="width:${pct}%;background:${hpCol};"></div></div>
      </div>
      <div class="spren-card" style="border-color:${bond?bond.color+'55':'var(--border)'};">
        ${sprenSVG||`<div style="font-size:18px;opacity:0.3;">✦</div>`}
      </div>
    </div>`;
  }).join('');
  if(lang==='th')setTimeout(applyThaiToPage,200);
}

// ══ RENDER STORY TEXT ══
function renderStory(log){
  const el=document.getElementById('story-text');if(!el)return;
  let dlog=[...log];
  if(gState&&gState.lastGM&&!dlog.some(e=>e.type==='gm')){
    dlog=[...dlog,{type:'gm',who:'',text:gState.lastGM.text,choices:gState.lastGM.choices,ts:gState.lastGM.ts||'mem'}];
  }
  if(!dlog.length){el.innerHTML='<div style="text-align:center;color:var(--text4);font-style:italic;padding:2rem 0;"><span data-tr>Waiting for all Radiants to join...</span></div>';return;}

  const latestGM=[...dlog].reverse().find(e=>e.type==='gm');
  const isNew=latestGM&&(latestGM.ts||'new')!==lastGMTs;
  const hasContent=el.innerHTML&&el.innerHTML.trim().length>50;
  if(!isNew&&hasContent)return;

  el.innerHTML=dlog.map(e=>{
    if(e.type==='gm'){
      const raw=e.text
        .replace(/\*\*([^*]+)\*\*/g,'$1')
        .replace(/\*([^*]+)\*/g,'$1')
        .replace(/^\*+$|^#+\s*/gm,'')
        .replace(/^(CONSEQUENCE|RESULT|OUTCOME|NARRATION|SUMMARY|SCENE|GM|NOTE|TURN \d+[^\n]*):\s*/gim,'')
        .replace(/^(PARAGRAPH \d+[^\n]*):\s*/gim,'')
        .replace(/^[\w\s]+'s Options?:\s*/gim,'')
        .replace(/^Options? for [\w\s]+:\s*/gim,'')
        .replace(/^(YOUR|GORE|SLAC|PLAYER|CHARACTER)[^\n]*OPTIONS?[^\n]*:\s*/gim,'')
        .trim();
      const badge=raw.includes('[COMBAT]')?'<span class="event-badge badge-combat">Combat</span>':raw.includes('[DISCOVERY]')?'<span class="event-badge badge-discovery">Discovery</span>':raw.includes('[DECISION]')?'<span class="event-badge badge-decision">Decision</span>':'';
      const clean=raw.replace(/\[COMBAT\]|\[DISCOVERY\]|\[DECISION\]/g,'').replace(/\[CHOICES\][\s\S]*/,'').trim();
      return`<div style="border-left:2px solid var(--gold);padding-left:14px;margin-bottom:12px;">${badge}<span class="gm-label"><span data-tr>The Chronicle</span></span>${clean.replace(/\n/g,'<br/>')}</div>`;
    }
    if(e.type==='player'){const p=gState&&gState.players.find(x=>x&&x.name===e.who);return`<div class="entry-player"><div class="entry-pname" style="color:${p?p.color:'var(--text3)'};">${e.who}</div>${e.text}</div>`;}
    if(e.type==='npc')return''; // NPC actions are silent — summarised by GM in next beat
    if(e.type==='system')return''; // system entries are bookkeeping only — not shown to players
    return'';
  }).join('');

  if(isNew&&latestGM){
    lastGMTs=latestGM.ts||'new';
    el.scrollTop=0;
    const safeToGate=bottomState===''||bottomState==='loading'||bottomState==='waiting';
    if(safeToGate)setTimeout(()=>setBottomFromState(dlog),80);
  }
}

// ══ BOTTOM ZONE STATE MACHINE ══
function setBottomLoading(){
  bottomState='loading';
  document.getElementById('bottom-loading').style.display='block';
  document.getElementById('bottom-human').style.display='none';
  const _bc=document.getElementById('bottom-continue');if(_bc){_bc.style.display='none';_bc.classList.remove('active');}
  document.getElementById('bottom-waiting').style.display='none';
  const tb=document.getElementById('thinking-bar');
  if(tb){tb.style.display='block';tb.classList.add('thinking-active');}
}

function setBottomFromState(log){
  if(!gState||!myChar)return;
  const cur=gState.players[gState.turn];
  if(!cur)return;
  const mine=!cur.isNPC&&cur.name===myChar.name;
  const npc=cur.isNPC;
  const lastGM=(gState.lastGM)||(log?[...log].reverse().find(e=>e.type==='gm'):null);
  const choices=lastGM&&lastGM.choices&&lastGM.choices.length?lastGM.choices:[];

  if(mine){
    if(awayMode){
      awayMode=false;
      renderSkipBtn();
      setTimeout(()=>skipTurn(myChar.name),200);
      return;
    }
    setBottomReadGate(choices);
  }
  else if(npc){setBottomContinue('NPC turn — press Continue to advance');}
  else{setBottomWaiting(cur.name);}
}

function setBottomReadGate(choices){
  bottomState='human-gated';
  const tb=document.getElementById('thinking-bar');if(tb)tb.style.display='none';
  const storyEl=document.getElementById('story-text');
  if(storyEl){storyEl.classList.remove('story-reveal');void storyEl.offsetWidth;storyEl.classList.add('story-reveal');}
  const glyph=document.querySelector('.chronicle-title');
  if(glyph){glyph.classList.remove('glyph-flare');void glyph.offsetWidth;glyph.classList.add('glyph-flare');setTimeout(()=>glyph.classList.remove('glyph-flare'),700);}
  document.getElementById('bottom-loading').style.display='none';
  document.getElementById('bottom-human').style.display='none';
  document.getElementById('bottom-waiting').style.display='none';
  const cont=document.getElementById('bottom-continue');
  cont.style.display='flex';cont.classList.add('active');
  const btn=document.getElementById('continue-btn');
  const hint=document.getElementById('continue-hint');
  btn.disabled=true;
  hint.textContent='Scroll down to read →';
  btn._pendingChoices=choices;
  setTimeout(enableContinue,4000);
  checkScrollEnable();
}

function setBottomContinue(hintText){
  bottomState='continue';
  const tb=document.getElementById('thinking-bar');if(tb)tb.style.display='none';
  document.getElementById('bottom-loading').style.display='none';
  document.getElementById('bottom-human').style.display='none';
  document.getElementById('bottom-waiting').style.display='none';
  const cont=document.getElementById('bottom-continue');
  cont.style.display='flex';cont.classList.add('active');
  cont.style.removeProperty('display'); // let CSS handle it, then force
  cont.style.display='flex';cont.classList.add('active');
  const btn=document.getElementById('continue-btn');
  const hint=document.getElementById('continue-hint');
  btn.disabled=true;
  hint.textContent='Scroll to read →';
  btn._pendingChoices=null;
  setTimeout(enableContinue,4000);
  checkScrollEnable();
}

function setBottomWaiting(name){
  bottomState='waiting';
  const tb=document.getElementById('thinking-bar');if(tb)tb.style.display='none';
  document.getElementById('bottom-loading').style.display='none';
  document.getElementById('bottom-human').style.display='none';
  const _bc=document.getElementById('bottom-continue');if(_bc){_bc.style.display='none';_bc.classList.remove('active');}
  const wait=document.getElementById('bottom-waiting');
  wait.style.display='block';
  const wm=document.getElementById('waiting-msg');
  wm.textContent=name?`Waiting for ${name}...`:'Waiting...';
  const existing=document.getElementById('skip-btn-wrap');
  if(existing)existing.remove();
}

function enableContinue(){
  const btn=document.getElementById('continue-btn');
  const hint=document.getElementById('continue-hint');
  if(btn)btn.disabled=false;
  if(hint)hint.textContent='';
}

function checkScrollEnable(){
  const cont=document.getElementById('bottom-continue');
  if(!cont||cont.style.display==='none')return;
  const rect=cont.getBoundingClientRect();
  const visible=rect.top<window.innerHeight+40;
  if(visible)enableContinue();
}

function onContinue(){
  stopSpeaking(); // stop voice when player advances
  const btn=document.getElementById('continue-btn');
  const choices=btn&&btn._pendingChoices;
  const _bc=document.getElementById('bottom-continue');if(_bc){_bc.style.display='none';_bc.classList.remove('active');}
  const cur=gState&&gState.players[gState.turn];
  const mine=cur&&myChar&&!cur.isNPC&&cur.name===myChar.name;
  const npc=cur&&cur.isNPC;

  if(mine){
    bottomState='human';
    const h=document.getElementById('bottom-human');
    const ch=document.getElementById('action-choices');
    if(choices&&choices.length){
      const TAG_COLORS={
        ATTACK:'var(--coral2)',COMBAT:'var(--coral2)',
        DEFEND:'var(--amber2)',DECISION:'var(--amber2)',
        HEAL:'var(--teal2)',DISCOVERY:'var(--teal2)',
        SURGE:'var(--amber)',SKILL:'var(--text3)'
      };
      const choiceItems=choices.map((c,i)=>{
        const raw=(typeof c==='string'?c:(c.text||'')).replace(/\*\*/g,'').trim();
        const m=raw.match(/^\[(ATTACK|DEFEND|HEAL|SURGE|COMBAT|DISCOVERY|DECISION|SKILL)\]/i);
        const tag=m?m[1].toUpperCase():'';
        const display=raw.replace(/^\[.*?\]\s*/,'').trim();
        const tagCol=TAG_COLORS[tag]||'var(--text4)';
        const tagBadge=tag?`<span style="font-size:9px;padding:1px 7px;border-radius:8px;background:${tagCol}22;color:${tagCol};letter-spacing:.5px;margin-right:5px;">${tag}</span>`:'';
        const safeDisplay=display.replace(/`/g,"'");
        return`<button class="achoice" onclick="selAct(this,\`${safeDisplay}\`,\`${tag}\`)"><span class="achoice-num">Option ${i+1} ${tagBadge}</span>${display}</button>`;
      });
      ch.innerHTML=choiceItems.join('');
      // Staggered entrance — choices drift up into view
      if(window.gsap){
        gsap.fromTo(ch.querySelectorAll('.achoice'),
          {opacity:0,y:10},
          {opacity:1,y:0,duration:0.3,stagger:0.07,ease:'power2.out',clearProps:'all'}
        );
      }
      if(lang==='th'){
        const displays=choices.map(c=>{const raw=(typeof c==='string'?c:(c.text||'')).replace(/\*\*/g,'').replace(/^\[.*?\]\s*/,'').trim();return raw;});
        Promise.all(displays.map(d=>translateToThai(d))).then(translated=>{
          ch.querySelectorAll('.achoice').forEach((btn,i)=>{
            const span=btn.querySelector('.achoice-num');
            const orig=btn.getAttribute('onclick');
            btn.innerHTML='';btn.appendChild(span);btn.appendChild(document.createTextNode(translated[i]||displays[i]));
            btn.setAttribute('onclick',orig);
          });
        }).catch(()=>{});
      }
    } else {ch.innerHTML='';}
    h.style.display='block';
    setTimeout(()=>h.scrollIntoView({behavior:'smooth',block:'nearest'}),100);
  } else if(npc&&!isLoading){
    loadLog(false).then(log=>handleNPC(log));
  }
}

// ══ NPC TURN ══
async function handleNPC(log){
  if(isLoading)return;
  const cur=gState.players[gState.turn];
  if(!cur||!cur.isNPC)return;
  isLoading=true;
  const lastGM=[...log].reverse().find(e=>e.type==='gm');
  const opts=lastGM&&lastGM.choices&&lastGM.choices.length?lastGM.choices:['Takes a defensive stance','Scouts the area','Searches for allies','Draws weapon and advances'];
  const d4=Math.floor(Math.random()*Math.min(4,opts.length));
  const pick=opts[d4];
  await new Promise(r=>setTimeout(r,600));
  const from=gState.turn;
  const sz=gState.partySize||partySize;
  gState.turn=(gState.turn+1)%sz;
  gState.totalMoves=(gState.totalMoves||0)+1;
  if(gState.combatActive&&gState.turn===0)gState.combatRound=(gState.combatRound||1)+1;
  // ── Passive Stormlight regen (story mode only) ──
  if(!gState.combatMode){
    gState.players.slice(0,sz).forEach((p,idx)=>{
      if(!p||p.isPlaceholder||p.downed)return;
      const regen=Math.ceil(Math.random()*4); // d4
      p.hp=Math.min(p.maxHp||p.hp,p.hp+regen);
      gState.players[idx]=p;
      if(myChar&&myChar.name===p.name){myChar=p;saveMyChar(p);}
    });
  }
  if(!gState.combatMode){
    gState.beatsSinceLastCombat=(gState.beatsSinceLastCombat||0)+1;
    const beatsLeft=(gState.beatsUntilCombat||5)-gState.beatsSinceLastCombat;
    if(beatsLeft<=0&&gState.preCombatTriggered){
      gState.combatMode=true; // next render will show combat screen
    } else if(beatsLeft<=0&&!gState.preCombatTriggered){
      gState.preCombatTriggered=true; // trigger the final tension beat first
    }
  }
  addActionLog(cur.name, pick, Math.ceil(Math.random()*4), ''); // D4 roll logged
  await saveAndBroadcast(gState);
  setBottomLoading();
  await callGM(npcPrompt(pick,cur,from));
  clearTimeout(_loadingTimer);
  isLoading=false;
  const freshLog=await loadLog(true);
  renderAll(freshLog);
  setTimeout(()=>{setBottomFromState(freshLog);maybeTranslateStory();if(gState&&gState.lastGM&&gState.lastGM.text)generateTLDR(gState.lastGM.text);},150);
  // Wire oath + world memory checks after each NPC GM response
  const _npcGMText=gState&&gState.lastGM&&gState.lastGM.text||'';
  if(_npcGMText){
    const sz_oath=gState.partySize||partySize;
    gState.players.slice(0,sz_oath).filter(p=>p&&p.isRadiant&&!p.isNPC).forEach(p=>{
      checkOathMoment(_npcGMText,p).catch(()=>{});
    });
    updateWorldMemory(_npcGMText,pick,gState.totalMoves||0).catch(()=>{});
  }
}

function npcPrompt(action,npc,from){
  const m=gState.totalMoves||0;const act=getAct(m);
  const sz=gState.partySize||partySize;
  const next=gState.players[gState.turn];
  const party=gState.players.slice(0,sz).map(p=>p?`${p.name}(${p.className}${p.isNPC?' NPC':''} HP:${p.hp}/${p.maxHp})`:'?').join(' | ');
  const loc=act.location||act.name;
  const gctx=getGenderContext();
  const mctx=getSprenMemoryContext();
  const wmctx=getWorldMemoryContext();
  const isNPCNext=next&&next.isNPC;
  const choiceBlock=isNPCNext?'':
`
It is now ${next?next.name+"'s turn ("+next.className+' human)':'next turn'}.
[CHOICES]
4 first-person choices for ${next?next.name:'the next player'} (${next?next.className:'?'}) ONLY. Tagged [COMBAT], [DISCOVERY], or [DECISION]. One sentence each. Four distinct approaches.`;

  return`${window.SystemData?.gmContext?.combatFlavor||'RPG'} GM. Turn ${m}/180. ${act.tag}: ${loc}.
Party: ${party}${gctx}${mctx}${wmctx}

NPC ${npc.name} (${npc.className}) chose: "${action}"

Write EXACTLY 2 short paragraphs (2-3 sentences each, blank line between). NOTHING else.
P1: What ${npc.name} did and its immediate consequence.
P2: What shifts — where things stand now, what demands attention.${choiceBlock}
${getLangInstruction()}`;
}

// ══ HUMAN TURN ══
function selAct(btn,txt,tag=''){document.querySelectorAll('.achoice').forEach(b=>b.classList.remove('sel'));btn.classList.add('sel');selActionText=txt;selActionTag=tag.toUpperCase();document.getElementById('custom-in').value='';}

async function onSubmitAction(){
  const custom=document.getElementById('custom-in').value.trim();
  const action=custom||selActionText;
  const errEl=document.getElementById('action-err');
  if(!action){errEl.textContent='Choose or describe an action first.';errEl.style.display='block';return;}
  errEl.style.display='none';
  if(isLoading)return;
  // If the player chose a [COMBAT] tagged option, enter combat immediately
  if(selActionTag==='COMBAT'||/^\[COMBAT\]/i.test(action)){
    gState.combatMode=true;
    gState.preCombatTriggered=true;
  }
  selActionTag=''; // clear after use
  isLoading=true;
  // Safety: auto-reset isLoading after 30s to prevent UI freeze
  _loadingTimer=setTimeout(()=>{isLoading=false;setBottomFromState();},30000);
  stopSpeaking(); // stop voice when player acts
  // Immediate visual feedback — don't wait for Sheets
  setBottomLoading();
  requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'smooth'}));
  // Advantage/Disadvantage: roll twice, take best/worst
  const myPlayerData=gState.players.find(p=>p&&p.name===myChar.name);
  const advState=myPlayerData&&myPlayerData.nextRollAdvantage;
  let roll=Math.ceil(Math.random()*20);
  if(advState){
    const roll2=Math.ceil(Math.random()*20);
    roll=advState==='advantage'?Math.max(roll,roll2):Math.min(roll,roll2);
    // Clear after use
    const pi=gState.players.findIndex(p=>p&&p.name===myChar.name);
    if(pi>=0)delete gState.players[pi].nextRollAdvantage;
  }
  const sk=getStat(action);
  const ab=getActionBucket(action);
  const {bucket}=ab;
  const sv=(myChar.stats&&myChar.stats[sk])||10;
  // Official: modifier = skill_ranks + attribute_score
  const skillRanks=(myChar.skillRanks&&myChar.skillRanks[sk])||0;
  const bonus=skillRanks+(sv||0)+(myChar.bladeLevel||0);
  const beatsLeft=(gState.beatsUntilCombat||5)-(gState.beatsSinceLastCombat||0);

  // ── Plot Die (Official Cosmere RPG) ──
  let plotResult=null;
  let plotBonus=0;
  const raisedStakes=shouldRaisePricing(roll, roll, bucket, beatsLeft);
  if(raisedStakes){
    plotResult=rollPlotDie();
    plotBonus=plotResult.bonus;
  }
  // Natural 20 = Opportunity (no bonus), Natural 1 = Complication (no bonus)
  let naturalEffect=null;
  if(roll===20&&!plotResult)naturalEffect={type:'opportunity',symbol:'NAT 20',bonus:0};
  if(roll===1&&!plotResult)naturalEffect={type:'complication',symbol:'NAT 1',bonus:0};
  const plotOrNatural=plotResult||naturalEffect;

  const total=Math.min(20,Math.max(1,roll+bonus+plotBonus));

  // Build dice flash text
  let diceText=advState?`d20:${roll}(${advState==='advantage'?'ADV':'DIS'})`:  `d20:${roll}`;
  if(plotResult)diceText+=` 🎲${plotResult.symbol}`;
  if(plotBonus>0)diceText+=`+${plotBonus}`;
  diceText+=` + ${sk.toUpperCase()}(${bonus>=0?'+':''}${bonus}) = ${total}`;
  if(naturalEffect)diceText+=` [${naturalEffect.symbol}]`;
  document.getElementById('dice-flash').textContent=diceText;

  // Store plot effect for GM prompt injection
  if(plotOrNatural){
    gState.lastPlotEffect={
      type:plotOrNatural.type,
      actor:myChar.name,
      bucket,
      effect:plotOrNatural.type==='opportunity'
        ?getOpportunityEffect(bucket,myChar.name)
        :getComplicationEffect(bucket,myChar.name)
    };
  } else {
    gState.lastPlotEffect=null;
  }

  const dmgMsg=applyRollDamage(total,myChar,gState);
  if(dmgMsg)document.getElementById('dice-flash').textContent+=` ${dmgMsg}`;
  recordSprenMemory(action,total,gState.totalMoves||0);
  addActionLog(myChar.name, action, roll, dmgMsg, total);
  await addLog({type:'player',who:myChar.name,text:action,choices:[]});
  const from=gState.turn;
  const sz=gState.partySize||partySize;
  gState.turn=(gState.turn+1)%sz;
  gState.totalMoves=(gState.totalMoves||0)+1;
  if(gState.combatActive&&gState.turn===0)gState.combatRound=(gState.combatRound||1)+1;
  // ── Passive Stormlight regen (story mode only) ──
  if(!gState.combatMode){
    gState.players.slice(0,sz).forEach((p,idx)=>{
      if(!p||p.isPlaceholder||p.downed)return;
      const regen=Math.ceil(Math.random()*4); // d4
      p.hp=Math.min(p.maxHp||p.hp,p.hp+regen);
      gState.players[idx]=p;
      if(myChar&&myChar.name===p.name){myChar=p;saveMyChar(p);}
    });
  }
  if(!gState.combatMode){
    gState.beatsSinceLastCombat=(gState.beatsSinceLastCombat||0)+1;
    const beatsLeft=(gState.beatsUntilCombat||5)-gState.beatsSinceLastCombat;
    if(beatsLeft<=0&&gState.preCombatTriggered){
      gState.combatMode=true; // next render will show combat screen
    } else if(beatsLeft<=0&&!gState.preCombatTriggered){
      gState.preCombatTriggered=true; // trigger the final tension beat first
    }
  }
  // ── Short rest interception (Ch.9) ──
  if(ab&&ab.restAction&&myChar){
    const restResult=doShortRest(myChar);
    const pidx=gState.players.findIndex(p=>p&&p.name===myChar.name);
    if(pidx>=0)gState.players[pidx]=myChar;
    saveMyChar(myChar);
    await saveAndBroadcast(gState);
    selActionText='';document.getElementById('custom-in').value='';
    document.querySelectorAll('.achoice').forEach(b=>b.classList.remove('sel'));
    showToast(`⏸ Short rest: +${restResult.hpRecovered} HP, +${restResult.focusRecovered} Focus (${restResult.die}: ${restResult.roll})`);
    isLoading=false;
    await refreshGame();
    return;
  }
  await saveAndBroadcast(gState);
  selActionText='';document.getElementById('custom-in').value='';
  document.querySelectorAll('.achoice').forEach(b=>b.classList.remove('sel'));
  await callGM(turnPrompt(action,total,sk,from));
  clearTimeout(_loadingTimer);
  isLoading=false;
  // If combat was triggered (by [COMBAT] tag or beat counter), transition now
  if(gState&&gState.combatMode&&!document.getElementById('s-combat').classList.contains('active')){
    enterCombat(); return;
  }
  const freshLog=await loadLog(true);
  renderAll(freshLog);
  setTimeout(()=>{setBottomFromState(freshLog);maybeTranslateStory();if(gState&&gState.lastGM&&gState.lastGM.text)generateTLDR(gState.lastGM.text);},150);
  // Wire oath + world memory checks after each GM response
  const _gmText=gState&&gState.lastGM&&gState.lastGM.text||'';
  if(_gmText){
    const _actor=gState.players.find(p=>p&&myChar&&p.name===myChar.name);
    if(_actor)checkOathMoment(_gmText,_actor).catch(()=>{});
    updateWorldMemory(_gmText,action,gState.totalMoves||0).catch(()=>{});
  }
}

function getActionBucket(a){
  // Returns {bucket, stat, skill} — 18 official skills + 10 surges + Stormlight actions
  const t=a.toLowerCase();
  // ── PRIORITY: Explicit action tags override all keyword matching ──
  if(/^\[heal\]/.test(t))return{bucket:'heal',stat:'wil',skill:'medicine'};
  if(/^\[defend\]/.test(t))return{bucket:'defend',stat:'pre',skill:'athletics'};
  if(/^\[attack\]/.test(t))return{bucket:'attack',stat:'str',skill:'athletics'};
  if(/^\[surge\]/.test(t))return{bucket:'surge',stat:'int',skill:'transformation'};
  if(/^\[skill\]/.test(t))return{bucket:'skill',stat:'int',skill:'perception'};
  if(/^\[revive\]/.test(t))return{bucket:'revive',stat:'wil',skill:'medicine'};
  // ── Short rest (Ch.9) — triggers doShortRest ──
  if(/\[rest\]|short rest|take a rest|rest and recover|catch.*breath|bind.*wound|tend.*wound/.test(t))
    return{bucket:'heal',stat:'wil',skill:'medicine',restAction:true};
  // ── Stormlight actions (Ch.5, Radiants only) ──
  if(/breathe.*stormlight|inhale.*stormlight|draw.*stormlight/.test(t))
    return{bucket:'skill',stat:'awa',skill:'perception',stormlightAction:'breathe'};
  if(/stormlight.*enhance|enhance.*str|enhance.*spd/.test(t))
    return{bucket:'skill',stat:'wil',skill:'discipline',stormlightAction:'enhance'};
  if(/stormlight.*regen|regenerate.*stormlight/.test(t))
    return{bucket:'heal',stat:'awa',skill:'progression',stormlightAction:'regenerate'};
  // ── Surge detection (Ch.6) — specific surge skills ──
  if(/basic lashing|reverse lashing|full lashing|gravitation surge/.test(t))
    return{bucket:'surge',stat:'awa',skill:'gravitation'};
  if(/abrasion|frictionless|skate along|slide frict/.test(t))
    return{bucket:'surge',stat:'spd',skill:'abrasion'};
  if(/adhesion|full lash|bind.*together|stick.*surface/.test(t))
    return{bucket:'surge',stat:'pre',skill:'adhesion'};
  if(/stoneshap|cohesion|mold.*stone|reshape.*stone|stone surge/.test(t))
    return{bucket:'surge',stat:'wil',skill:'cohesion'};
  if(/division|disintegrat|decay.*surge|destroy.*surge/.test(t))
    return{bucket:'surge',stat:'int',skill:'division'};
  if(/lightweav|illumination|illusion surge/.test(t))
    return{bucket:'surge',stat:'pre',skill:'illumination'};
  if(/regrowth|progression surge|grow.*plant/.test(t))
    return{bucket:'surge',stat:'awa',skill:'progression'};
  if(/tension surge|harden.*cloth|rigidity surge/.test(t))
    return{bucket:'surge',stat:'str',skill:'tension'};
  if(/soulcast|transformation surge/.test(t))
    return{bucket:'surge',stat:'wil',skill:'transformation'};
  if(/elsecall|cognitive realm|shadesmar|transportation surge/.test(t))
    return{bucket:'surge',stat:'int',skill:'transportation'};
  // ── Official 18 skills (physical group) ──
  const isRevive=/revive|stabilize|pull.*back|save.*downed|rouse|wake.*up|bring.*back|resuscitate/.test(t)&&/ally|companion|downed|fallen|hobber|friend|party/.test(t);
  const isHeal=/\[heal\]|heal|regrow|mend|restore|tend|bandage|cure|knit|medicine|patch.*wound|stitch|treat.*injur|fix.*wound|channel.*stormlight.*into|mend.*bone|check.*breathing|check.*wound|check.*on|pull.*behind.*shelter|drag.*to.*safety|yank.*behind|nurse|aid.*allie|triage|infuse.*with.*light|pour.*stormlight|ease.*pain|soothe/.test(t);
  if(isRevive)return{bucket:'revive',stat:'wil',skill:'medicine'};
  if(isHeal)return{bucket:'heal',stat:'wil',skill:'medicine'};
  if(/sneak|stealth|hide|conceal|shadow.*move/.test(t))return{bucket:'skill',stat:'spd',skill:'stealth'};
  if(/pick.*lock|pickpocket|steal|sleight|thieve/.test(t))return{bucket:'skill',stat:'spd',skill:'thievery'};
  if(/dodge|tumble|evade|flip|acrobat|agile move/.test(t))return{bucket:'attack',stat:'spd',skill:'agility'};
  if(/heavy.*weapon|warhammer|greataxe|maul/.test(t))return{bucket:'attack',stat:'str',skill:'heavyWeapon'};
  if(/light.*weapon|dagger|knife|shortsword|bow shot/.test(t))return{bucket:'attack',stat:'spd',skill:'lightWeapon'};
  if(/defend|protect|shield|block|parry|stance|barrier|brace|guard|hunker|cover.*allie|hold.*line|take.*position|hold.*ground|fortif|entrench|dig.*in|plant.*feet|stand.*firm|sentinel|interpose|screen|ward/.test(t))return{bucket:'defend',stat:'pre',skill:'athletics'};
  // ── Cognitive skills ──
  if(/craft|build|forge|construct|fabricate|fabrial/.test(t))return{bucket:'skill',stat:'int',skill:'crafting'};
  if(/deduce|analyze|figure|logic|reason through/.test(t))return{bucket:'skill',stat:'int',skill:'deduction'};
  if(/lore|history|recall|scholar|research/.test(t))return{bucket:'skill',stat:'int',skill:'lore'};
  if(/surge|transform|summon|conjure|transmute|pattern|soulcast|lash/.test(t))return{bucket:'surge',stat:'int',skill:'transformation'};
  if(/focus|concentrate|discipline|willpower|composure/.test(t))return{bucket:'skill',stat:'wil',skill:'discipline'};
  if(/intimidate|threaten|frighten|scare/.test(t))return{bucket:'skill',stat:'wil',skill:'intimidation'};
  // ── Spiritual skills ──
  if(/lie|deceive|trick|bluff|fake|mislead/.test(t))return{bucket:'skill',stat:'pre',skill:'deception'};
  if(/read.*person|insight|sense.*motive|see.*through/.test(t))return{bucket:'skill',stat:'awa',skill:'insight'};
  if(/lead|command|inspire|rally|coordinate/.test(t))return{bucket:'skill',stat:'pre',skill:'leadership'};
  if(/search|detect|sense|notice|examine|investigate|scout|perceive/.test(t))return{bucket:'skill',stat:'awa',skill:'perception'};
  if(/persuade|negotiate|charm|convince|appeal/.test(t))return{bucket:'skill',stat:'pre',skill:'persuasion'};
  if(/survive|forage|track|navigate|hunt|wilderness/.test(t))return{bucket:'skill',stat:'awa',skill:'survival'};
  if(/run|dash|sprint|leap|jump|climb/.test(t))return{bucket:'attack',stat:'str',skill:'athletics'};
  return{bucket:'attack',stat:'str',skill:'athletics'};
}
function getStat(a){return getActionBucket(a).stat;}

// ══ PLOT DIE (Official Cosmere RPG) ══
// d6: 1=Complication+4, 2=Complication+2, 3-4=blank, 5-6=Opportunity
function rollPlotDie(){
  const face=Math.ceil(Math.random()*6);
  if(face===1)return{type:'complication',bonus:4,symbol:'C+4'};
  if(face===2)return{type:'complication',bonus:2,symbol:'C+2'};
  if(face<=4)return{type:'blank',bonus:0,symbol:'—'};
  return{type:'opportunity',bonus:0,symbol:'O'};
}

// Should a roll use the plot die?
// Official: GM decides for tests that directly contribute to mission,
// play to character's purpose, or have high dramatic import
function shouldRaisePricing(total, roll, bucket, beatsLeft){
  if(roll===20||roll===1)return false; // natural 20/1 handle their own effects
  const preCombat=gState.preCombatTriggered&&!gState.combatMode;
  const isHighStakes=preCombat||(beatsLeft!=null&&beatsLeft<=2);
  const isCharacterMoment=bucket==='heal'||bucket==='revive'||bucket==='surge';
  // 30% chance on high-stakes beats, 15% on character-specific surges
  if(isHighStakes)return Math.random()<0.30;
  if(isCharacterMoment)return Math.random()<0.15;
  return false;
}

// Get Opportunity effect text for GM prompt injection
function applyFocusChange(actorName, delta){
  if(!gState)return;
  const sz=gState.partySize||partySize;
  const idx=gState.players.findIndex(p=>p&&p.name===actorName);
  if(idx<0)return;
  const p=gState.players[idx];
  p.focus=Math.min(p.maxFocus||5,Math.max(0,(p.focus||3)+delta));
  gState.players[idx]=p;
  if(myChar&&myChar.name===actorName){myChar.focus=p.focus;saveMyChar(myChar);}
}

function applyAdvantageEffect(targetName, isAdvantage){
  if(!gState)return;
  const idx=gState.players.findIndex(p=>p&&p.name===targetName);
  if(idx<0)return;
  gState.players[idx].nextRollAdvantage=isAdvantage?'advantage':'disadvantage';
}

function getOpportunityEffect(bucket, actor){
  // Use official combat opportunity table (Ch.10) blended with narrative effects
  const inCombat=gState&&gState.combatMode;
  const p=gState&&gState.players.find(x=>x&&x.name===actor);

  // Combat opportunities from official table
  if(inCombat){
    const roll=Math.floor(Math.random()*COMBAT_OPPS.length);
    const officialOpp=COMBAT_OPPS[roll];
    // Apply mechanical effects for specific opps
    if(officialOpp.includes('recover 1 focus')&&p){applyFocusChange(actor,1);}
    if(officialOpp.includes('Stormlight')&&p&&p.isRadiant){
      p.investiture=Math.min(p.maxInvestiture||0,(p.investiture||0)+2);
    }
    // Advantage effect tracked via existing system
    if(officialOpp.includes('advantage')&&p){
      applyAdvantageEffect(actor,true);
    }
    return officialOpp;
  }

  // Exploration opportunities — narrative/mechanical blend
  const roll=Math.random();
  if(roll<0.25){
    applyFocusChange(actor,1);
    return`${actor} steadies — recovers 1 Focus (${(p||{focus:3}).focus||3} total)`;
  }
  if(roll<0.50){
    const allies=(gState&&gState.players||[]).filter(p=>p&&p.name!==actor&&!p.isNPC&&!p.downed);
    if(allies.length){
      const ally=allies[Math.floor(Math.random()*allies.length)];
      applyAdvantageEffect(ally.name,true);
      return`${actor} opens an opportunity — ${ally.name} gains advantage on their next test`;
    }
  }
  if(roll<0.75){
    return`${actor} spots a useful detail — the GM reveals a hidden feature of the environment`;
  }
  return`${actor} gains a narrative edge — something shifts in the party's favor`;
}

function getComplicationEffect(bucket, actor){
  // Use official combat complication table (Ch.10)
  const inCombat=gState&&gState.combatMode;
  const p=gState&&gState.players.find(x=>x&&x.name===actor);

  if(inCombat){
    const roll=Math.floor(Math.random()*COMBAT_COMPS.length);
    const officialComp=COMBAT_COMPS[roll];
    // Apply mechanical effects
    if(officialComp.includes('fall Prone')&&p){applyCondition(p,'prone');}
    if(officialComp.includes('go dun')&&gState){
      // Narrative — Radiant loses Stormlight access this round
      if(p&&p.isRadiant){
        const oldInv=p.investiture||0;
        p.investiture=Math.max(0,oldInv-2);
        return officialComp+` (${p.name} loses 2 Investiture)`;
      }
    }
    if(officialComp.includes('lose')&&p){applyFocusChange(actor,-1);}
    return officialComp;
  }

  // Exploration complications
  const roll=Math.random();
  if(bucket==='heal'||bucket==='revive'){
    if(roll<0.3){
      const focLoss=Math.ceil(Math.random()*2);
      applyFocusChange(actor,-focLoss);
      return`${actor} overextends — loses ${focLoss} Focus from the effort`;
    }
  }
  if(bucket==='surge'&&p&&p.isRadiant){
    const invLoss=1;
    p.investiture=Math.max(0,(p.investiture||0)-invLoss);
    return`${actor} surges too hard — loses ${invLoss} Investiture as Stormlight escapes`;
  }
  if(roll<0.33){
    applyFocusChange(actor,-1);
    return`${actor} loses composure — −1 Focus`;
  }
  if(roll<0.66){
    return`${actor}'s action has unexpected consequences — the GM will clarify`;
  }
  return`${actor} encounters a complication — something in the environment shifts against the party`;
}

function turnPrompt(action,roll,sk,from){
  const m=gState.totalMoves||0;const act=getAct(m);
  const sz=gState.partySize||partySize;const next=gState.players[gState.turn];
  const party=gState.players.slice(0,sz).map(p=>{
    if(!p)return'?';
    const injCount=p.injuries?p.injuries.length:0;
    const conds=p.conditions?Object.entries(p.conditions).filter(([k,v])=>v).map(([k])=>CONDITIONS[k]?CONDITIONS[k].name:k):[];
    const statusStr=[...conds,injCount>0?injCount+'inj':''].filter(Boolean).join(',');
    return`${p.name}(${p.className}${p.isNPC?' NPC':''} ${p.hp}/${p.maxHp}HP${p.focus!=null?' ◈'+p.focus:''}${p.oathStage>1?' Oath '+p.oathStage:''}${statusStr?' ['+statusStr+']':''})`;
  }).join(' | ');
  const who=gState.players[from];const loc=act.location||act.name;
  const rollDesc=roll>=18?'CRITICAL SUCCESS — something unexpected and wonderful happens':roll>=14?'Strong success — clean, clear outcome':roll>=10?'Partial success — they get what they want but something is now complicated or wrong':roll>=6?'Failure — what they wanted did not happen, and the world responds':'CRITICAL FAILURE — something goes badly wrong, raise the stakes hard and immediately';
  const gctx=getGenderContext();
  const mctx=getSprenMemoryContext();
  const wmctx=getWorldMemoryContext();
  const cctx=getCharContext();
  const recentBeats=getRecentBeats();
  // Recent player choices — inject to prevent repetition
  // actionLog entries: {name, verb, noun, success, ...} — unshift'd so [0]=newest
  const recentPlayerChoices=(gState.actionLog||[])
    .filter(e=>e.name===next?.name)
    .slice(0,3)
    .map(e=>`${e.verb} ${e.noun}`.trim())
    .filter(Boolean);
  const choiceHistory=recentPlayerChoices.length?
    `
RECENT CHOICES BY ${next?.name?.toUpperCase()||'THIS PLAYER'} (DO NOT REPEAT these approaches): ${recentPlayerChoices.map(a=>a.slice(0,50)).join(' | ')}`:
    '';
  const beatsLeft=(gState.beatsUntilCombat||5)-(gState.beatsSinceLastCombat||0);
  const preCombatNow=gState.preCombatTriggered&&!gState.combatMode;
  const totalBeats=gState.beatsUntilCombat||5;
  const beatNum=totalBeats-Math.max(0,beatsLeft)+1;

  // Phase guidance — specific narrative instructions per beat position
  let phaseInstr='';
  if(!gState.combatMode){
    if(preCombatNow){
      phaseInstr=`

PHASE — THE CONFRONTATION (this is the pre-combat payoff beat):
The threat that has been building must physically manifest RIGHT NOW and face the party. Do not approach — arrive. End at the exact moment before weapons clash. One image, maximum dread, no resolution. Short sharp sentences here.`;
    } else if(beatsLeft<=1){
      phaseInstr=`

PHASE — FINAL BEAT BEFORE COMBAT (${beatNum}/${totalBeats}):
The wrongness is undeniable. Something from the immediate history above has escalated beyond ignoring. Build pure dread — not action yet, but the absolute certainty that violence is seconds away. The party can feel it in their bodies. End on a held breath.`;
    } else if(beatsLeft<=2){
      phaseInstr=`

PHASE — RISING TENSION (${beatNum}/${totalBeats}):
The world is tightening. Echo something specific from the immediate history — a detail that felt minor before but now reads as warning. The threat is not subtle anymore. Show the environment responding to it.`;
    } else if(beatNum>Math.floor(totalBeats/2)){
      phaseInstr=`

PHASE — DEEPENING (${beatNum}/${totalBeats}):
Past the threshold. Every discovery should add texture to a threat without naming it. Something specific about ${loc} is wrong in a way the characters can sense but not yet explain. Plant something that will pay off later.`;
    } else {
      phaseInstr=`

PHASE — DISCOVERY (${beatNum}/${totalBeats}):
Fresh ground. Build ${loc} with sensory specificity — what makes this place unlike anywhere else in ${window.SystemData?.gmContext?.worldName||'this world'}. Introduce details that will matter. No hints at combat yet. Let the world feel vast.`;
    }
  }

  if(m===59)generateActConsequence(1).catch(()=>{});
  if(m===119)generateActConsequence(2).catch(()=>{});
  const actHint=m===59?`\n\nACT TRANSITION: Close out ${loc} emotionally. One sensory detail foreshadowing ${ACTS[1]?ACTS[1].location:'what comes next'}.`:m===119?`\n\nACT TRANSITION: Final Act II beat. The weight of everything before should be felt. One image of ${ACTS[2]?ACTS[2].location:'the final act'}.`:'';

  const beatLen='2 short paragraphs (2-3 sentences each, no more)';

// Plot effect injection for GM
  const pe=gState.lastPlotEffect;
  const plotInstr=pe?`

PLOT DIE — ${pe.type.toUpperCase()}: ${pe.effect}. Weave this naturally into the consequence — do not label it as an Opportunity or Complication, just let it shape the narrative.`:'';

  const isNPCNext=next&&next.isNPC;
  const choiceBlock=isNPCNext?'':
`

[CHOICES FOR ${next?next.name.toUpperCase():'NEXT PLAYER'}]
4 choices for ${next?next.name:'the player'} (${next?next.className:'?'}, Oath ${next?next.oathStage||1:'?'}/5, ${next?next.hp:0}/${next?next.maxHp:10}HP).
Rules: first-person ("I [verb]..."), one vivid sentence each, tagged [ATTACK]/[DEFEND]/[HEAL]/[SURGE]/[COMBAT]/[DISCOVERY]/[DECISION], four distinct types (ability, physical, investigative, bold). Reference ${loc}. No repetition from recent history. ONLY for ${next?next.name:'this player'} — never write choices for other characters.`;

  return`You are the GM of ${window.SystemData?.gmContext?.combatFlavor||'an'} RPG in ${window.SystemData?.gmContext?.worldName||'the world'}. Turn ${m}/180. Location: ${loc}. ${act.tag}.
Party: ${party}${gctx}
${wmctx}${recentBeats}${choiceHistory}${mctx}${cctx}

ACTION: ${who.name} (${who.className}) — "${action}"
Roll: d20 vs ${sk.toUpperCase()} = ${roll} → ${rollDesc}${plotInstr}

Write EXACTLY 2 short paragraphs (2-3 sentences each, separated by a blank line). NOTHING ELSE before [CHOICES].

PARAGRAPH 1 — CONSEQUENCE: What the WORLD does in response. The action already happened — show the result. ${roll>=18?'Something unexpected and wonderful happens.':roll>=14?'Clean outcome, the world yields, one detail unresolved.':roll>=10?'Partial success — show what slipped through or changed.':roll>=6?'The world pushes back — show the specific thing that went wrong.':'Something breaks. Show it immediately.'}
PARAGRAPH 2 — SHIFT: New tension, new information, or setup for what comes next. End with the world in a different state.

CRAFT RULES:
• Begin with what the WORLD does, not ${who.name}. Never summarize the action taken.
• Use ${loc} concretely — a smell, a sound, a texture unique to this place.
• Mix sentence lengths. Never open with "${who.name}" or a gerund.
• Show emotion through action. Injuries persist. No game jargon. Present tense.
• No "suddenly", "quickly", or "immediately".${actHint}${phaseInstr}${choiceBlock}

${getLangInstruction()}`;
}



// ── AUDIO + VOICE + LANGUAGE ──────────────────────────────────
// ══ AUDIO ENGINE ══
function initAudio(){
  if(audioCtx)return;
  try{audioCtx=new(window.AudioContext||window.webkitAudioContext)();masterGain=audioCtx.createGain();masterGain.gain.value=0.3;masterGain.connect(audioCtx.destination);}
  catch(e){console.warn('Web Audio not supported');}
}
// ── NOISE BUFFER (shared) ──
let _noiseBuf=null;
function noiseBuffer(secs=4){
  if(_noiseBuf)return _noiseBuf;
  const buf=audioCtx.createBuffer(1,audioCtx.sampleRate*secs,audioCtx.sampleRate);
  const d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1);
  _noiseBuf=buf;return buf;
}

// ── WIND LAYER — bandpass noise with sweep LFO and slow pan ──
function mkWind(freq,gain,gustSpeed,pan=0){
  if(!audioCtx)return null;
  const src=audioCtx.createBufferSource();src.buffer=noiseBuffer();src.loop=true;
  // Bandpass shapes the wind character
  const filt=audioCtx.createBiquadFilter();filt.type='bandpass';filt.frequency.value=freq;filt.Q.value=1.2;
  // Gust LFO sweeps filter frequency — wind breathes
  const gustLFO=audioCtx.createOscillator();gustLFO.frequency.value=gustSpeed;
  const gustDepth=audioCtx.createGain();gustDepth.gain.value=freq*0.6;
  gustLFO.connect(gustDepth);gustDepth.connect(filt.frequency);
  // Amplitude LFO for volume swell
  const g=audioCtx.createGain();g.gain.value=gain;
  const ampLFO=audioCtx.createOscillator();ampLFO.frequency.value=gustSpeed*0.7;
  const ampDepth=audioCtx.createGain();ampDepth.gain.value=gain*0.35;
  ampLFO.connect(ampDepth);ampDepth.connect(g.gain);
  // Stereo panning — spreads wind across field
  const panner=audioCtx.createStereoPanner();panner.pan.value=pan;
  // Slow pan sweep for movement
  const panLFO=audioCtx.createOscillator();panLFO.frequency.value=0.03;
  const panDepth=audioCtx.createGain();panDepth.gain.value=0.4;
  panLFO.connect(panDepth);panDepth.connect(panner.pan);
  src.connect(filt);filt.connect(g);g.connect(panner);panner.connect(masterGain);
  gustLFO.start();ampLFO.start();panLFO.start();src.start();
  return{src,filt,g,gustLFO,ampLFO,panLFO,panner};
}

// ── RAIN — highpass noise layer, steady with light flutter ──
function mkRain(gain=0.06){
  if(!audioCtx)return null;
  const src=audioCtx.createBufferSource();src.buffer=noiseBuffer();src.loop=true;
  const hp=audioCtx.createBiquadFilter();hp.type='highpass';hp.frequency.value=3500;hp.Q.value=0.5;
  const lp=audioCtx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=8000;
  const g=audioCtx.createGain();g.gain.value=gain;
  // Flutter — tiny fast variation for raindrop texture
  const flutter=audioCtx.createOscillator();flutter.frequency.value=14;
  const fd=audioCtx.createGain();fd.gain.value=gain*0.08;
  flutter.connect(fd);fd.connect(g.gain);flutter.start();
  src.connect(hp);hp.connect(lp);lp.connect(g);g.connect(masterGain);src.start();
  return{src,hp,lp,g,flutter};
}

// ── THUNDER — sawtooth rumble with lightning crackle preceding it ──
function mkThunder(){
  if(!audioCtx)return null;
  const osc=audioCtx.createOscillator();osc.type='sawtooth';osc.frequency.value=48;
  const osc2=audioCtx.createOscillator();osc2.type='sine';osc2.frequency.value=32;
  const filt=audioCtx.createBiquadFilter();filt.type='lowpass';filt.frequency.value=110;
  const g=audioCtx.createGain();g.gain.value=0;
  // Mix both oscillators for richer rumble
  const mix=audioCtx.createGain();mix.gain.value=0.6;
  osc.connect(filt);osc2.connect(mix);mix.connect(filt);filt.connect(g);g.connect(masterGain);
  osc.start();osc2.start();
  function strike(){
    const now=audioCtx.currentTime;
    // Lightning crackle — brief burst of shaped noise before thunder
    const crack=audioCtx.createBufferSource();
    const crackBuf=audioCtx.createBuffer(1,audioCtx.sampleRate*0.15,audioCtx.sampleRate);
    const cd=crackBuf.getChannelData(0);
    for(let i=0;i<cd.length;i++)cd[i]=(Math.random()*2-1)*Math.pow(1-(i/cd.length),3);
    crack.buffer=crackBuf;
    const crackFilt=audioCtx.createBiquadFilter();crackFilt.type='highpass';crackFilt.frequency.value=2000;
    const crackG=audioCtx.createGain();crackG.gain.value=0.25;
    crack.connect(crackFilt);crackFilt.connect(crackG);crackG.connect(masterGain);
    crack.start(now);
    // Thunder rolls in 0.2s after crackle
    g.gain.setValueAtTime(0,now+0.2);
    g.gain.linearRampToValueAtTime(0.18,now+0.35);
    g.gain.setValueAtTime(0.18,now+0.6);
    g.gain.exponentialRampToValueAtTime(0.001,now+3.5);
    const next=9000+Math.random()*16000;
    setTimeout(strike,next);
  }
  setTimeout(strike,4000+Math.random()*6000);
  return{osc,osc2,filt,g,mix};
}

// ── STORMLIGHT HUM — beating sinewave pair, ethereal ──
function mkHum(){
  if(!audioCtx)return null;
  const o1=audioCtx.createOscillator();o1.type='sine';o1.frequency.value=220;
  const o2=audioCtx.createOscillator();o2.type='sine';o2.frequency.value=220.8;
  const o3=audioCtx.createOscillator();o3.type='sine';o3.frequency.value=440.3;
  const g=audioCtx.createGain();g.gain.value=0.018;
  const g3=audioCtx.createGain();g3.gain.value=0.007;
  // Slow swell
  const swell=audioCtx.createOscillator();swell.frequency.value=0.18;
  const sd=audioCtx.createGain();sd.gain.value=0.012;
  swell.connect(sd);sd.connect(g.gain);swell.start();
  o1.start();o2.start();o3.start();
  o1.connect(g);o2.connect(g);o3.connect(g3);g.connect(masterGain);g3.connect(masterGain);
  return{o1,o2,o3,g,g3,swell};
}

// ── COMBAT INTENSIFIER — ramps up storm when combat starts ──
function stormIntensify(intense=true){
  if(!audioCtx||!audioOn)return;
  const now=audioCtx.currentTime;
  const ramp=intense?1.8:1.0;
  const time=intense?2.5:4.0;
  if(audioNodes.w1)audioNodes.w1.g.gain.linearRampToValueAtTime(0.12*ramp,now+time);
  if(audioNodes.w2)audioNodes.w2.g.gain.linearRampToValueAtTime(0.08*ramp,now+time);
  if(audioNodes.w3)audioNodes.w3.g.gain.linearRampToValueAtTime(0.15*ramp,now+time);
  if(audioNodes.rain)audioNodes.rain.g.gain.linearRampToValueAtTime(0.06*ramp,now+time);
}

function startAudio(){
  initAudio();
  if(!audioCtx)return;
  if(audioCtx.state==='suspended')audioCtx.resume();
  _noiseBuf=null; // reset shared buffer
  audioNodes.w1=mkWind(380,0.11,0.07,-0.3);   // low howl, left
  audioNodes.w2=mkWind(780,0.07,0.12, 0.3);   // mid whistle, right
  audioNodes.w3=mkWind(180,0.14,0.04, 0.0);   // deep rumble, center
  audioNodes.w4=mkWind(1200,0.04,0.18,-0.6);  // high shriek, far left
  audioNodes.rain=mkRain(0.055);
  audioNodes.thunder=mkThunder();
  audioNodes.hum=mkHum();
  audioOn=true;
  document.getElementById('audio-toggle').textContent='🌩';
  document.getElementById('audio-label').textContent='STORM';
}
function stopAudio(){
  if(!audioCtx)return;
  const nodes=Object.values(audioNodes);
  nodes.forEach(n=>{
    if(!n)return;
    try{
      ['src','osc','osc2','o1','o2','o3','gustLFO','ampLFO','panLFO','swell','flutter'].forEach(k=>{
        if(n[k])n[k].stop();
      });
    }catch(e){}
  });
  audioNodes={};audioOn=false;_noiseBuf=null;
  document.getElementById('audio-toggle').textContent='🔇';
  document.getElementById('audio-label').textContent='OFF';
}
function toggleAudio(){
  if(!audioOn)startAudio();else stopAudio();
}

// ══ VOICE INPUT ══
let voiceInputActive=false;
function startVoiceInput(targetId){
  if(!('webkitSpeechRecognition' in window||'SpeechRecognition' in window)){
    showToast('Voice input not supported in this browser');return;
  }
  const btn=document.getElementById('voice-input-btn');
  if(voiceInputActive){
    if(window._voiceRecog)window._voiceRecog.stop();
    voiceInputActive=false;
    if(btn){btn.textContent='🎙';btn.style.color='var(--text4)';btn.style.borderColor='var(--border2)';}
    return;
  }
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  const recog=new SR();
  window._voiceRecog=recog;
  recog.lang='en-US';
  recog.interimResults=true;
  recog.maxAlternatives=1;
  voiceInputActive=true;
  if(btn){btn.textContent='🔴';btn.style.color='var(--coral2)';btn.style.borderColor='var(--coral)';}
  showToast('Listening... speak your action');
  recog.onresult=(event)=>{
    const transcript=event.results[0][0].transcript;
    const el=document.getElementById(targetId);
    if(el)el.value=transcript;
    if(event.results[0].isFinal){
      voiceInputActive=false;
      if(btn){btn.textContent='🎙';btn.style.color='var(--text4)';btn.style.borderColor='var(--border2)';}
    }
  };
  recog.onerror=()=>{
    voiceInputActive=false;
    if(btn){btn.textContent='🎙';btn.style.color='var(--text4)';}
    showToast('Voice input stopped');
  };
  recog.onend=()=>{
    voiceInputActive=false;
    if(btn){btn.textContent='🎙';btn.style.color='var(--text4)';btn.style.borderColor='var(--border2)';}
  };
  recog.start();
}
function setVolume(v){if(masterGain)masterGain.gain.value=v/100*0.6;}
function setStormIntensity(type){
  if(!audioOn||!audioNodes.w1)return;
  const now=audioCtx.currentTime;
  const t={combat:{w1:0.22,w2:0.16,w3:0.25,hum:0.04},decision:{w1:0.06,w2:0.04,w3:0.08,hum:0.06},discovery:{w1:0.09,w2:0.07,w3:0.10,hum:0.08},normal:{w1:0.12,w2:0.08,w3:0.15,hum:0.02}}[type]||{w1:0.12,w2:0.08,w3:0.15,hum:0.02};
  audioNodes.w1.g.gain.linearRampToValueAtTime(t.w1,now+2);
  audioNodes.w2.g.gain.linearRampToValueAtTime(t.w2,now+2);
  audioNodes.w3.g.gain.linearRampToValueAtTime(t.w3,now+2);
  if(audioNodes.hum)audioNodes.hum.g.gain.linearRampToValueAtTime(t.hum,now+1.5);
}

// ══ BOOT ══
// ══════════════════════════════════════
// ══════════════════════════════════════
// ══════════════════════════════════════
// ══════════════════════════════════════

function T(str){return str;}

function toggleLang(){
  lang=lang==='en'?'th':'en';
  localStorage.setItem('sc_lang',lang);
  if(lang==='th')applyThaiToPage();
  else location.reload(); // simplest restore of English
}

function applyLang(){
  const label=lang==='th'?'🌐 ไทย':'🌐 EN';
  ['lang-toggle','lang-toggle-camp'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.textContent=label;
  });
  const banner=document.getElementById('thai-banner');
  if(banner)banner.style.display=lang==='th'?'block':'none';
  if(lang==='th')setTimeout(applyThaiToPage,200);
}

async function batchTranslate(strings){
  if(!strings.length)return[];
  const uncached=strings.filter(s=>!thaiCache[s]);
  if(uncached.length){
    try{
      const prompt='Translate each numbered item to Thai. Keep character names, Rosharan place names, and game terms (Radiant, Stormlight, Shardblade, Spren, etc) in English. Return ONLY a numbered list:\n\n'+
        uncached.map((s,i)=>`${i+1}. ${s}`).join('\\n');
      const res=await fetch(PROXY_URL,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:4000,
          messages:[{role:'user',content:prompt}]})});
      const data=await res.json();
      const raw=data.content&&data.content[0]?data.content[0].text:'';
      raw.split('\n').filter(l=>l.trim()).forEach(line=>{
        const m=line.match(/^(\d+)\.\s*(.+)/);
        if(m){const idx=parseInt(m[1])-1;if(idx>=0&&idx<uncached.length)thaiCache[uncached[idx]]=m[2].trim();}
      });
    }catch(e){console.warn('batchTranslate failed:',e.message);}
  }
  return strings.map(str=>thaiCache[str]||str);
}


async function applyThaiToPage(){
  if(uiTranslating||lang!=='th')return;
  uiTranslating=true;

  const textNodes=[];
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{
    acceptNode(node){
      const parent=node.parentElement;
      if(!parent)return NodeFilter.FILTER_REJECT;
      const tag=parent.tagName;
      if(['SCRIPT','STYLE','INPUT','TEXTAREA','SELECT','OPTION'].includes(tag))return NodeFilter.FILTER_REJECT;
      const style=window.getComputedStyle(parent);
      if(style.display==='none'||style.visibility==='hidden')return NodeFilter.FILTER_SKIP;
      const text=node.textContent.trim();
      if(!text||text.length<2)return NodeFilter.FILTER_REJECT;
      if(/[฀-๿]/.test(text))return NodeFilter.FILTER_REJECT;
      if(/^[\d\s\.\-\+\%\/\:\→\←\⟁\✦\⚔\⬛\☠\•\|]+$/.test(text))return NodeFilter.FILTER_REJECT;
      if(text.startsWith('http')||text.startsWith('Campaign')||text.startsWith('@'))return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  let node;
  while((node=walker.nextNode()))textNodes.push(node);

  const unique=[...new Set(textNodes.map(n=>n.textContent.trim()))].filter(t=>t.length>1);
  if(unique.length){
    const translated=await batchTranslate(unique);
    const map={};
    unique.forEach((t,i)=>{if(translated[i]&&translated[i]!==t)map[t]=translated[i];});
    textNodes.forEach(n=>{
      const orig=n.textContent.trim();
      if(map[orig])n.textContent=n.textContent.replace(orig,map[orig]);
    });
  }

  const tagged=Array.from(document.querySelectorAll('[data-tr]'));
  tagged.forEach(el=>{if(!el.getAttribute('data-tr-orig'))el.setAttribute('data-tr-orig',el.textContent.trim());});
  const taggedTexts=tagged.map(el=>el.getAttribute('data-tr-orig')||el.textContent.trim()).filter(t=>t&&t.length>1&&!/[฀-๿]/.test(t));
  if(taggedTexts.length){
    const taggedTrans=await batchTranslate(taggedTexts);
    tagged.forEach((el,i)=>{if(taggedTrans[i]&&taggedTrans[i]!==taggedTexts[i])el.textContent=taggedTrans[i];});
  }

  uiTranslating=false;
  ['lang-toggle','lang-toggle-camp'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.textContent='🌐 ไทย';
  });
}

async function maybeTranslateChoices(){
  if(lang!=='th')return;
  const btns=document.querySelectorAll('.achoice');
  if(!btns.length)return;
  const texts=Array.from(btns).map(btn=>{
    const nodes=[...btn.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim());
    return nodes.length?nodes[nodes.length-1].textContent.trim():'';
  }).filter(t=>t.length>3&&!/[฀-๿]/.test(t));
  if(!texts.length)return;
  const translated=await batchTranslate(texts);
  let ti=0;
  btns.forEach(btn=>{
    const textNodes=[...btn.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim());
    if(textNodes.length&&translated[ti]&&!/[฀-๿]/.test(textNodes[textNodes.length-1].textContent)){
      textNodes[textNodes.length-1].textContent=translated[ti++];
    }
  });
}

function getLangInstruction(){
  if(lang!=='th')return'';
  const names=gState&&gState.players?gState.players.filter(Boolean).map(p=>p.name).join(', '):'';
  return'\n\nสำคัญมาก: เขียนทั้งหมดเป็นภาษาไทย รวมถึงเนื้อเรื่อง ตัวเลือก และทุกอย่าง แต่ให้คงชื่อตัวละคร ('+names+') ไว้เหมือนเดิม';
}

async function translateToThai(text){
  if(!text||!text.trim())return text;
  try{
    const res=await fetch(PROXY_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        model:'claude-haiku-4-5-20251001',
        max_tokens:2000,
        messages:[{role:'user',content:`Translate the following text to Thai. Keep all character names, place names (Roshar, Shattered Plains, etc), and game terms (Radiant, Stormlight, Shardblade, etc) in their original English form. Return ONLY the translated text with no explanation or preamble:

${text}`}]
      })
    });
    const data=await res.json();
    return data.content&&data.content[0]?data.content[0].text:text;
  }catch(e){
    console.warn('Translation failed:',e.message);
    return text;
  }
}

async function maybeTranslateStory(){
  if(lang!=='th')return;
  const el=document.getElementById('story-text');
  if(!el||!el.innerText||el.innerText.trim().length<10)return;
  if(/[฀-๿]/.test(el.innerText))return;
  el.style.opacity='0.5';
  const translated=await translateToThai(el.innerText);
  const paras=translated.split('\n').filter(l=>l.trim());
  el.innerHTML=paras.map(l=>'<p style="margin-bottom:1rem;">'+l+'</p>').join('');
  el.style.opacity='1';
}

// ══ PARALLAX ══
function initParallax(){
  const card=document.querySelector('.chronicle-card');
  if(!card||window.innerWidth<900)return;
  card.style.backgroundImage='radial-gradient(ellipse at center,rgba(255,255,255,0.015) 0%,transparent 70%)';
  card.style.backgroundSize='200% 200%';
  window.addEventListener('scroll',()=>{
    const y=window.scrollY;
    const px=50+y*0.015;const py=50-y*0.008;
    card.style.backgroundPosition=`${px}% ${py}%`;
  },{passive:true});
}

// Guard: ui.js loads before combat.js. Install a stub so the boot IIFE
// never throws ReferenceError. combat.js overwrites this with the real impl.
if(typeof loadVoicePreference==='undefined'){
  window.loadVoicePreference=function(){
    const stored=localStorage.getItem('sc_voice');
    if(stored&&typeof setVoice==='function')setVoice(stored);
  };
}

(async()=>{
  applyLang();
  loadVoicePreference();
  // If hash points to a hub screen (or empty = landing), let hub.js handle boot
  const _hash = (window.location.hash || '').split('?')[0];
  if (!_hash || _hash === '#landing' || _hash === '#worlds' || _hash === '#wizard') {
    // Hub boot — hub.js hubBoot() will run on window.load
    return;
  }
  // Game boot — show campaign picker
  showScreen('campaign');
  try{await tok();const camps=await listCampaigns();renderCampaigns(camps);document.getElementById('camp-status').textContent='';}
  catch(e){document.getElementById('camp-status').textContent='Connecting... '+e.message;}
})();
async function applyThaiToElement(el){
  if(!el||!el.innerText||el.innerText.trim().length<10)return;
  if(/[฀-๿]/.test(el.innerText))return;
  el.style.opacity='0.5';
  const translated=await translateToThai(el.innerText);
  const paras=translated.split('\n').filter(l=>l.trim());
  el.innerHTML=paras.map(l=>'<p style="margin-bottom:1rem;">'+l+'</p>').join('');
  el.style.opacity='1';
}

// ══ PARALLAX ══


