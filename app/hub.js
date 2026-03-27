/* ══════════════════════════════════════════════════════════════
   hub.js — CYOAhub landing, worlds, wizard logic + particles
   ══════════════════════════════════════════════════════════════ */

// ── ALIAS — goTo delegates to the main app's showScreen ──
const goTo = (id) => showScreen(id);

// ── CARD IMAGE LIBRARY ───────────────────────────────────────
// Add new images to GameCardImgs/ and list them here.
// These are the only images available for user-created world cards.
const CARD_IMAGES = [
  'GameCardImgs/DnD.png',
  'GameCardImgs/Dragons.png',
  'GameCardImgs/FACE1.png',
  'GameCardImgs/Monk.png',
  'GameCardImgs/Palace.png',
  'GameCardImgs/RedHorse.png',
  'GameCardImgs/Stormlight.png',
  'GameCardImgs/Unicorns.png',
  'GameCardImgs/cosmic face.png',
];
let _selectedCardImage = CARD_IMAGES[0]; // default selection

/* ── GEOMETRIC PARTICLE CANVAS ── */
function initHubParticles() {
  const c = document.getElementById('hub-particles');
  if (!c) return;
  const x = c.getContext('2d');
  let W, H, nodes;

  // Three palette colors — gold, blue, teal
  // Each stored as [r, g, b] for interpolation
  const COLORS = [
    [201, 168,  76],  // #C9A84C  gold
    [118, 162, 232],  // #76A2E8  blue
    [128, 209, 204],  // #80D1CC  teal
  ];

  // Interpolate between two RGB arrays by t (0-1)
  function lerpRGB(a, b, t){
    return [
      Math.round(a[0] + (b[0]-a[0])*t),
      Math.round(a[1] + (b[1]-a[1])*t),
      Math.round(a[2] + (b[2]-a[2])*t),
    ];
  }

  function resize(){
    W = c.width  = window.innerWidth;
    H = c.height = window.innerHeight;
    nodes = Array.from({length:22}, ()=>({
      x:  Math.random()*W,
      y:  Math.random()*H,
      vx: (Math.random()-.5)*.2,
      vy: (Math.random()-.5)*.2,
      // Assign each node one of the three palette colors
      rgb: COLORS[Math.floor(Math.random()*COLORS.length)],
    }));
  }

  function tick(){
    x.clearRect(0,0,W,H);
    nodes.forEach(n=>{
      n.x+=n.vx; n.y+=n.vy;
      if(n.x<0||n.x>W) n.vx*=-1;
      if(n.y<0||n.y>H) n.vy*=-1;
    });

    // Draw lines — blend color between the two endpoint nodes
    for(let i=0;i<nodes.length;i++){
      for(let j=i+1;j<nodes.length;j++){
        const dx=nodes[i].x-nodes[j].x, dy=nodes[i].y-nodes[j].y;
        const d=Math.sqrt(dx*dx+dy*dy);
        if(d<230){
          const fade = 1 - d/230;
          const alpha = 0.16 * fade;
          // Midpoint color — blend the two node colors
          const mid = lerpRGB(nodes[i].rgb, nodes[j].rgb, 0.5);
          // Use a gradient along the line for a richer look
          const grad = x.createLinearGradient(
            nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y
          );
          grad.addColorStop(0,   `rgba(${nodes[i].rgb.join(',')},${alpha * 1.8})`);
          grad.addColorStop(0.5, `rgba(${mid.join(',')},${alpha * 0.8})`);
          grad.addColorStop(1,   `rgba(${nodes[j].rgb.join(',')},${alpha * 1.8})`);
          x.beginPath();
          x.moveTo(nodes[i].x, nodes[i].y);
          x.lineTo(nodes[j].x, nodes[j].y);
          x.strokeStyle = grad;
          x.lineWidth = 1.3;
          x.stroke();
        }
      }
    }

    // Draw vertex dots — brightest points in the system
    nodes.forEach(n=>{
      const [r,g,b] = n.rgb;
      // Outer glow
      const glow = x.createRadialGradient(n.x, n.y, 0, n.x, n.y, 8);
      glow.addColorStop(0,   `rgba(${r},${g},${b},0.30)`);
      glow.addColorStop(0.4, `rgba(${r},${g},${b},0.22)`);
      glow.addColorStop(1,   `rgba(${r},${g},${b},0)`);
      x.beginPath();
      x.arc(n.x, n.y, 8, 0, Math.PI*2);
      x.fillStyle = glow;
      x.fill();
      // Bright core dot
      x.beginPath();
      x.arc(n.x, n.y, 1.5, 0, Math.PI*2);
      x.fillStyle = `rgba(${r},${g},${b},1.0)`;
      x.fill();
    });

    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize);
  resize();
  tick();
}

/* ── LANDING ANIM ── */
function animateLanding(boot){
  const d = boot ? .1 : 0;
  gsap.fromTo('#l-eye',   {opacity:0,y:14}, {opacity:1,y:0,duration:.6,delay:d,    ease:'power2.out'});
  gsap.fromTo('#l-title', {opacity:0,y:28}, {opacity:1,y:0,duration:.75,delay:d+.1,ease:'power3.out'});
  gsap.fromTo('#l-sub',   {opacity:0,y:20}, {opacity:1,y:0,duration:.7, delay:d+.22,ease:'power3.out'});
  gsap.fromTo('#l-cards', {opacity:0,y:24}, {opacity:1,y:0,duration:.65,delay:d+.34,ease:'power3.out'});
}

/* ── WORLDS ANIM ── */
function animateHub(){
  gsap.fromTo('.wcard',
    {opacity:0,y:20,scale:.97},
    {opacity:1,y:0,scale:1,duration:.4,stagger:.07,ease:'power3.out',clearProps:'all'}
  );
}

/* ── FILTER ── */
function filterWorlds(tier,btn){
  document.querySelectorAll('.wtab').forEach(t=>t.classList.remove('on'));
  btn.classList.add('on');
  document.querySelectorAll('#worlds-grid .wcard:not(.wcard-new)').forEach(c=>{
    c.style.display=(tier==='all'||c.dataset.tier===tier)?'':'none';
  });
}

/* ── WIZARD ── */
let _ws=1;
const WS_MAX=7;
let _selectedEnemyCategories = ['undead','beasts','goblinoids','humanEnemies']; // defaults

function wizStep(dir){
  const n=_ws+dir;
  if(n<1||n>WS_MAX) return;
  _ws=n; renderStep();
}

function wizBack(){
  if(_ws<=1) goTo('worlds'); else wizStep(-1);
}

function renderStep(){
  document.querySelectorAll('.wstep').forEach((s,i)=>s.classList.toggle('on',i+1===_ws));
  document.querySelectorAll('.wdot').forEach((d,i)=>{
    d.classList.toggle('on',  i+1===_ws);
    d.classList.toggle('done',i+1<_ws);
  });
  document.getElementById('wiz-back-btn').style.visibility=_ws>1?'visible':'hidden';
  document.getElementById('wiz-nav').style.display=_ws<WS_MAX?'flex':'none';
  gsap.fromTo('#ws-'+_ws,{opacity:0,x:16},{opacity:1,x:0,duration:.26,ease:'power2.out'});
  if(_ws===5) renderEnemyCategoryStep();
  if(_ws===WS_MAX) { renderCardImagePicker(); updatePreview(); }
}

/* ── ENEMY CATEGORY STEP ── */
function renderEnemyCategoryStep(){
  const grid = document.getElementById('enemy-cat-grid');
  if(!grid || grid.children.length) return; // only render once
  const registry = window.ENEMY_CATEGORY_REGISTRY || [];
  registry.forEach(cat => {
    const checked = _selectedEnemyCategories.includes(cat.id);
    const el = document.createElement('label');
    el.className = 'enemy-cat-item' + (checked ? ' checked' : '');
    el.innerHTML = `
      <input type="checkbox" value="${cat.id}" ${checked?'checked':''} onchange="toggleEnemyCat(this)">
      <span class="enemy-cat-icon">${cat.icon}</span>
      <span class="enemy-cat-name">${cat.name}</span>
      <span class="enemy-cat-desc">${cat.desc}</span>`;
    grid.appendChild(el);
  });
}

function toggleEnemyCat(cb){
  const id = cb.value;
  const item = cb.closest('.enemy-cat-item');
  if(cb.checked){
    if(!_selectedEnemyCategories.includes(id)) _selectedEnemyCategories.push(id);
    item.classList.add('checked');
  } else {
    _selectedEnemyCategories = _selectedEnemyCategories.filter(c=>c!==id);
    item.classList.remove('checked');
  }
}

function renderCardImagePicker(){
  const grid = document.getElementById('card-image-grid');
  if(!grid || grid.children.length) return; // only render once
  CARD_IMAGES.forEach((src, i) => {
    const thumb = document.createElement('div');
    thumb.className = 'card-image-thumb' + (src === _selectedCardImage ? ' selected' : '');
    thumb.innerHTML = `<img src="${src}" alt="${src.split('/').pop().replace(/\.\w+$/,'')}">`;
    thumb.onclick = () => {
      grid.querySelectorAll('.card-image-thumb').forEach(t => t.classList.remove('selected'));
      thumb.classList.add('selected');
      _selectedCardImage = src;
    };
    grid.appendChild(thumb);
  });
}

function selOpt(el){
  el.closest('.wopts').querySelectorAll('.wopt').forEach(o=>o.classList.remove('on'));
  el.classList.add('on');
  if(_ws===WS_MAX) updatePreview();
}

function syncColor(val){
  if(/^#[0-9A-Fa-f]{6}$/.test(val)){
    document.getElementById('cp').value=val; updatePreview();
  }
}

function updatePreview(){
  const p=document.getElementById('cp').value;
  const n=document.getElementById('wiz-name')?.value||'Your World Name';
  const pt=document.getElementById('prev-title');
  const pc=document.getElementById('prev-crit');
  if(pt){pt.style.color=p; pt.textContent=n||'Your World Name';}
  if(pc){pc.style.color=p; pc.style.borderColor=p+'44'; pc.style.background=p+'18';}
}

function finishWizard(publish){
  const name   = document.getElementById('wiz-name')?.value.trim()||'My World';
  const color  = document.getElementById('cp')?.value||'#C9A84C';
  const tier   = publish?'community':'mine';

  // Build worldConfig from wizard form
  const worldId = 'custom-' + Date.now();
  const worldConfig = {
    id: worldId,
    name,
    tagline: name,
    theme: { primary: color, secondary: '#28A87A', danger: '#B03828', bgTone: 'dark', titleFont: 'Cinzel', bodyFont: 'Crimson Pro' },
    magic: { name: 'Magic', resource: 'Mana' },
    gm: { worldName: name, tone: 'Epic fantasy' },
    enemies: { categories: _selectedEnemyCategories },
  };
  // Store config for system loader
  window._pendingWorldConfig = worldConfig;

  const grid  = document.getElementById('worlds-grid');
  const newBtn= grid.querySelector('.wcard-new');
  const card  = document.createElement('div');
  card.className='wcard';
  card.dataset.tier=tier;
  card.style.cssText=`border-color:${color}28;opacity:0;`;
  card.innerHTML=`
    <div class="wcard-art">
      <img src="${_selectedCardImage}" alt="${name}" class="wcard-img">
    </div>
    <div class="wcard-body">
      <div class="wcard-badges">
        <span class="badge" style="background:${color}18;border:1px solid ${color}40;color:${color};">
          ${publish?'🌐 Community':'🔒 Private'}
        </span>
      </div>
      <div class="wcard-name" style="color:${color}">${name}</div>
      <div class="wcard-desc">Your custom world — ready to play.</div>
      <div class="wcard-meta">Just created · Custom</div>
      <button class="wcard-btn" style="border-color:${color}50;color:${color};">Play →</button>
    </div>`;

  grid.insertBefore(card, newBtn);
  goTo('worlds');
  gsap.fromTo(card,
    {opacity:0,scale:.88,y:22},
    {opacity:1,scale:1,y:0,duration:.5,delay:.3,ease:'back.out(1.6)'}
  );
}

/* ── 3D CARD TILT ── */
function initTilt(){
  document.querySelectorAll('.hero-card,.wcard:not(.wcard-new)').forEach(card=>{
    card.addEventListener('mousemove',e=>{
      const r=card.getBoundingClientRect();
      const cx=(e.clientX-r.left)/r.width-.5;
      const cy=(e.clientY-r.top)/r.height-.5;
      gsap.to(card,{rotateY:cx*10,rotateX:-cy*8,duration:.2,overwrite:'auto'});
    });
    card.addEventListener('mouseleave',()=>{
      gsap.to(card,{rotateY:0,rotateX:0,duration:.5,ease:'elastic.out(1,.5)'});
    });
  });
}

/* ── COLOR PICKER SYNC ── */
(function(){
  const cp = document.getElementById('cp');
  if (cp) {
    cp.addEventListener('input',function(){
      document.getElementById('cp-hex').value=this.value;
      updatePreview();
    });
  }
})();

/* ── HAMBURGER MENU ── */
function toggleMenu(){
  const hb = document.getElementById('hamburger');
  const menu = document.getElementById('hbmenu');
  hb.classList.toggle('open');
  menu.classList.toggle('open');
}
// Close on outside click
document.addEventListener('click', e => {
  const hb   = document.getElementById('hamburger');
  const menu = document.getElementById('hbmenu');
  if(hb && menu && !hb.contains(e.target) && !menu.contains(e.target)){
    hb.classList.remove('open');
    menu.classList.remove('open');
  }
});

/* ── PICK WORLD ── */
function pickWorld(worldId) {
  if (typeof loadSystem === 'function') loadSystem(worldId);
  if (typeof gState !== 'undefined' && gState) {
    gState.system = worldId;
    gState.worldId = worldId;
  }
  window.location.hash = '#campaign';
  showScreen('campaign');
}

// ── HASH ROUTER ──────────────────────────────────────────
const HUB_ROUTES = {
  '':          'landing',
  '#landing':  'landing',
  '#worlds':   'worlds',
  '#wizard':   'wizard',
};

function routeFromHash() {
  const hash = (window.location.hash || '').split('?')[0];
  const screenId = HUB_ROUTES[hash];
  if (screenId) {
    showScreen(screenId);
    if (screenId === 'landing') animateLanding(false);
    if (screenId === 'worlds') animateHub();
  }
}
window.addEventListener('hashchange', routeFromHash);

/* ── HUB BOOT ── */
function hubBoot() {
  const hash = (window.location.hash || '').split('?')[0];
  if (!hash || hash === '#landing' || hash === '#worlds' || hash === '#wizard') {
    showScreen('landing');
    animateLanding(true);
    initTilt();
    initHubParticles();
  } else {
    routeFromHash();
  }
}

// Run hub boot on window load
window.addEventListener('load', () => {
  const hash = (window.location.hash || '').split('?')[0];
  if (!hash || hash === '#landing' || hash === '#worlds' || hash === '#wizard') {
    hubBoot();
  }
});
