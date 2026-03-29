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
  'GameCardImgs/Dank.jpg',
  'GameCardImgs/Evening Fields.jpg',
  'GameCardImgs/FACE1.png',
  'GameCardImgs/Midday Mountians.jpg',
  'GameCardImgs/Monk.png',
  'GameCardImgs/OIG1.png',
  'GameCardImgs/Palace.png',
  'GameCardImgs/RedHorse.png',
  'GameCardImgs/Star fields.jpg',
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
    [201, 168, 76], // #C9A84C  gold
    [118, 162, 232], // #76A2E8  blue
    [128, 209, 204], // #80D1CC  teal
  ];

  // Interpolate between two RGB arrays by t (0-1)
  function lerpRGB(a, b, t) {
    return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
  }

  function resize() {
    W = c.width = window.innerWidth;
    H = c.height = window.innerHeight;
    nodes = Array.from({ length: 22 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      // Assign each node one of the three palette colors
      rgb: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
  }

  function tick() {
    x.clearRect(0, 0, W, H);
    nodes.forEach((n) => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
    });

    // Draw lines — blend color between the two endpoint nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x,
          dy = nodes[i].y - nodes[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 230) {
          const fade = 1 - d / 230;
          const alpha = 0.16 * fade;
          // Midpoint color — blend the two node colors
          const mid = lerpRGB(nodes[i].rgb, nodes[j].rgb, 0.5);
          // Use a gradient along the line for a richer look
          const grad = x.createLinearGradient(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
          grad.addColorStop(0, `rgba(${nodes[i].rgb.join(',')},${alpha * 1.8})`);
          grad.addColorStop(0.5, `rgba(${mid.join(',')},${alpha * 0.8})`);
          grad.addColorStop(1, `rgba(${nodes[j].rgb.join(',')},${alpha * 1.8})`);
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
    nodes.forEach((n) => {
      const [r, g, b] = n.rgb;
      // Outer glow
      const glow = x.createRadialGradient(n.x, n.y, 0, n.x, n.y, 8);
      glow.addColorStop(0, `rgba(${r},${g},${b},0.30)`);
      glow.addColorStop(0.4, `rgba(${r},${g},${b},0.22)`);
      glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
      x.beginPath();
      x.arc(n.x, n.y, 8, 0, Math.PI * 2);
      x.fillStyle = glow;
      x.fill();
      // Bright core dot
      x.beginPath();
      x.arc(n.x, n.y, 1.5, 0, Math.PI * 2);
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
function animateLanding(boot) {
  const d = boot ? 0.1 : 0;
  gsap.fromTo('#l-eye', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, delay: d, ease: 'power2.out' });
  gsap.fromTo('#l-title', { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.75, delay: d + 0.1, ease: 'power3.out' });
  gsap.fromTo('#l-sub', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, delay: d + 0.22, ease: 'power3.out' });
  gsap.fromTo('#l-cards', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.65, delay: d + 0.34, ease: 'power3.out' });
}

/* ── WORLDS ANIM ── */
async function animateHub() {
  // Ensure community worlds are loaded (uses cache if fresh)
  await _fetchCommunityWorlds().catch(() => {});
  // Render all worlds (local + community)
  renderWorldsGrid();
  gsap.fromTo(
    '.wcard',
    { opacity: 0, y: 20, scale: 0.97 },
    { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.07, ease: 'power3.out', clearProps: 'all' }
  );
  // Re-init tilt for world cards (may not have been bound yet)
  setTimeout(initTilt, 100);
}

/* ── FILTER ── */
function filterWorlds(tier, btn) {
  document.querySelectorAll('.wtab').forEach((t) => t.classList.remove('on'));
  btn.classList.add('on');
  document.querySelectorAll('#worlds-grid .wcard:not(.wcard-new)').forEach((c) => {
    if (tier === 'all') {
      c.style.display = '';
      return;
    }
    if (tier === 'mine') {
      // "Mine" shows both private AND community worlds you own
      c.style.display = c.dataset.tier === 'mine' || (c.dataset.tier === 'community' && c.dataset.worldId) ? '' : 'none';
    } else {
      c.style.display = c.dataset.tier === tier ? '' : 'none';
    }
  });
}

/* ── WIZARD ── */
let _ws = 1;
const WS_MAX = 7;
let _selectedEnemyCategories = ['undead', 'beasts', 'goblinoids', 'humanEnemies']; // defaults
let _selectedAmbientAudio = 'forest'; // default for custom worlds

function wizStep(dir) {
  const n = _ws + dir;
  if (n < 1 || n > WS_MAX) return;
  _ws = n;
  renderStep();
}

function wizBack() {
  if (_ws <= 1) goTo('worlds');
  else wizStep(-1);
}

function renderStep() {
  document.querySelectorAll('.wstep').forEach((s, i) => s.classList.toggle('on', i + 1 === _ws));
  document.querySelectorAll('.wdot').forEach((d, i) => {
    d.classList.toggle('on', i + 1 === _ws);
    d.classList.toggle('done', i + 1 < _ws);
  });
  document.getElementById('wiz-back-btn').style.visibility = _ws > 1 ? 'visible' : 'hidden';
  document.getElementById('wiz-nav').style.display = _ws < WS_MAX ? 'flex' : 'none';
  gsap.fromTo('#ws-' + _ws, { opacity: 0, x: 16 }, { opacity: 1, x: 0, duration: 0.26, ease: 'power2.out' });
  if (_ws === 4 && !_wizClassRows.length) initWizClassRows();
  if (_ws === 5) {
    renderAmbientAudioPicker();
    renderEnemyCategoryStep();
  }
  if (_ws === WS_MAX) {
    renderCardImagePicker();
    updatePreview();
  }
}

/* ── DYNAMIC CLASS BUILDER ── */
const _DEFAULT_CLASSES = ['Warrior', 'Mage', 'Rogue', 'Healer'];
let _wizClassRows = [];

function initWizClassRows() {
  _wizClassRows = _DEFAULT_CLASSES.map((name) => ({ name, imgUrl: '' }));
  renderWizClassRows();
}

function renderWizClassRows() {
  const container = document.getElementById('wiz-class-rows');
  if (!container) return;
  container.innerHTML = _wizClassRows
    .map(
      (row, i) => `
    <div class="wiz-class-row" data-idx="${i}" style="display:flex;gap:8px;align-items:center;">
      <input type="text" class="winput wiz-class-name" value="${row.name}" placeholder="Class name..."
        oninput="_wizClassRows[${i}].name=this.value"
        style="flex:1;margin:0;">
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:6px 12px;border:1px solid rgba(40,168,160,0.2);border-radius:8px;background:rgba(40,168,160,0.05);font-size:10px;color:rgba(40,168,160,0.6);font-family:var(--font-d,monospace);letter-spacing:1px;white-space:nowrap;transition:all .15s;">
        ${row.imgUrl ? `<img src="${row.imgUrl}" style="width:24px;height:24px;border-radius:4px;object-fit:cover;">` : '📷'}
        <span>${row.imgUrl ? 'Change' : 'Image'}</span>
        <input type="file" accept="image/*" onchange="uploadWizClassImg(${i},this)" style="display:none;">
      </label>
      ${_wizClassRows.length > 4 ? `<button onclick="removeWizClassRow(${i})" style="background:none;border:none;color:rgba(176,56,40,0.6);cursor:pointer;font-size:16px;padding:4px 8px;" title="Remove">✕</button>` : ''}
    </div>
  `
    )
    .join('');

  const addBtn = document.getElementById('wiz-add-class-btn');
  if (addBtn) addBtn.style.display = _wizClassRows.length >= 10 ? 'none' : '';
}

function addWizClassRow() {
  if (_wizClassRows.length >= 10) return;
  _wizClassRows.push({ name: '', imgUrl: '' });
  renderWizClassRows();
  // Focus the new row's input
  setTimeout(() => {
    const inputs = document.querySelectorAll('.wiz-class-name');
    if (inputs.length) inputs[inputs.length - 1].focus();
  }, 50);
}

function removeWizClassRow(idx) {
  if (_wizClassRows.length <= 4) return;
  _wizClassRows.splice(idx, 1);
  renderWizClassRows();
}

async function uploadWizClassImg(idx, input) {
  const file = input.files && input.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    alert('Image must be under 2MB.');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch(PROXY_URL + '/img/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.url) {
      _wizClassRows[idx].imgUrl = data.url;
      renderWizClassRows();
    } else {
      alert(data.error || 'Upload failed.');
    }
  } catch (e) {
    alert('Upload failed: ' + e.message);
  }
}

function getWizClasses() {
  return _wizClassRows.filter((r) => r.name.trim()).map((r) => ({ name: r.name.trim(), imgUrl: r.imgUrl || '' }));
}

/* ── AMBIENT AUDIO PICKER ── */
function renderAmbientAudioPicker() {
  const grid = document.getElementById('ambient-audio-grid');
  if (!grid || grid.children.length) return;
  const registry = window.AMBIENT_AUDIO_REGISTRY || [];
  registry.forEach((a) => {
    const selected = a.id === _selectedAmbientAudio;
    const el = document.createElement('div');
    el.className = 'ambient-opt' + (selected ? ' selected' : '');
    el.dataset.id = a.id;
    el.innerHTML = `<span class="ambient-icon">${a.icon}</span><span class="ambient-label">${a.label}</span>`;
    el.title = a.desc;
    el.onclick = () => {
      grid.querySelectorAll('.ambient-opt').forEach((o) => o.classList.remove('selected'));
      el.classList.add('selected');
      _selectedAmbientAudio = a.id;
    };
    grid.appendChild(el);
  });
}

/* ── ENEMY CATEGORY STEP ── */
function renderEnemyCategoryStep() {
  const grid = document.getElementById('enemy-cat-grid');
  if (!grid || grid.children.length) return; // only render once
  const registry = window.ENEMY_CATEGORY_REGISTRY || [];
  registry.forEach((cat) => {
    const checked = _selectedEnemyCategories.includes(cat.id);
    const el = document.createElement('label');
    el.className = 'enemy-cat-item' + (checked ? ' checked' : '');
    el.innerHTML = `
      <input type="checkbox" value="${cat.id}" ${checked ? 'checked' : ''} onchange="toggleEnemyCat(this)">
      <span class="enemy-cat-icon">${cat.icon}</span>
      <span class="enemy-cat-name">${cat.name}</span>
      <span class="enemy-cat-desc">${cat.desc}</span>`;
    grid.appendChild(el);
  });
}

function toggleEnemyCat(cb) {
  const id = cb.value;
  const item = cb.closest('.enemy-cat-item');
  if (cb.checked) {
    if (!_selectedEnemyCategories.includes(id)) _selectedEnemyCategories.push(id);
    item.classList.add('checked');
  } else {
    _selectedEnemyCategories = _selectedEnemyCategories.filter((c) => c !== id);
    item.classList.remove('checked');
  }
}

function renderCardImagePicker() {
  const grid = document.getElementById('card-image-grid');
  if (!grid || grid.children.length) return; // only render once
  CARD_IMAGES.forEach((src, i) => {
    const thumb = document.createElement('div');
    thumb.className = 'card-image-thumb' + (src === _selectedCardImage ? ' selected' : '');
    thumb.innerHTML = `<img src="${src}" alt="${src
      .split('/')
      .pop()
      .replace(/\.\w+$/, '')}">`;
    thumb.onclick = () => {
      grid.querySelectorAll('.card-image-thumb').forEach((t) => t.classList.remove('selected'));
      thumb.classList.add('selected');
      _selectedCardImage = src;
    };
    grid.appendChild(thumb);
  });
}

// Track all wopt selections by data-field
const _wizSelections = {};
function selOpt(el) {
  const group = el.closest('.wopts');
  group.querySelectorAll('.wopt').forEach((o) => o.classList.remove('on'));
  el.classList.add('on');
  // Store the selection by field name
  const field = group.dataset.field;
  if (field) _wizSelections[field] = el.dataset.val || el.textContent.trim();
  if (_ws === WS_MAX) updatePreview();

  // Show/hide point buy pool picker
  if (field === 'statGenMethod') {
    const poolEl = document.getElementById('wiz-pointbuy-pool');
    if (poolEl) poolEl.style.display = (_wizSelections.statGenMethod === 'pointbuy') ? '' : 'none';
  }
  // Show/hide custom pool input
  if (field === 'pointBuyPool') {
    const customEl = document.getElementById('wiz-pointbuy-custom');
    if (customEl) customEl.style.display = (_wizSelections.pointBuyPool === 'custom') ? '' : 'none';
  }
}
function _getWizSel(field, fallback) {
  return _wizSelections[field] || fallback || '';
}

function syncColor(val) {
  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
    document.getElementById('cp').value = val;
    updatePreview();
  }
}
function syncColorField(pickerId, val) {
  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
    const el = document.getElementById(pickerId);
    if (el) el.value = val;
  }
}
// Keep hex inputs synced with color pickers
document.addEventListener('input', (e) => {
  if (e.target.type === 'color') {
    const hex = document.getElementById(e.target.id + '-hex');
    if (hex) hex.value = e.target.value;
    updatePreview(); // refresh preview on any color change
  }
});

function updatePreview() {
  const pri = document.getElementById('cp')?.value || '#C9A84C';
  const sec = document.getElementById('cp-secondary')?.value || '#28A87A';
  const bg = document.getElementById('cp-bg')?.value || '#0F0D08';
  const surface = document.getElementById('cp-surface')?.value || '#141109';
  const text = document.getElementById('cp-text')?.value || '#F8F3E8';
  const muted = document.getElementById('cp-muted')?.value || '#A07830';
  const danger = document.getElementById('cp-danger')?.value || '#B03828';
  const n = document.getElementById('wiz-name')?.value || 'Your World Name';

  // Title preview
  const pt = document.getElementById('prev-title');
  const pc = document.getElementById('prev-crit');
  if (pt) { pt.style.color = pri; pt.textContent = n || 'Your World Name'; }
  if (pc) { pc.style.color = pri; pc.style.borderColor = pri + '44'; pc.style.background = pri + '18'; }

  // ── In-game preview ──
  // Derive bg3 (slightly lighter than bg)
  const _hex = (h) => { const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16); return [r,g,b]; };
  const _toHex = (r,g,b) => '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
  const _lighten = (hex, amt) => { const [r,g,b] = _hex(hex); return _toHex(r+amt,g+amt,b+amt); };
  const bg3 = _lighten(bg, 20);
  const bg4 = _lighten(bg, 30);

  // Party pip
  const pip = document.getElementById('prev-pip');
  if (pip) { pip.style.background = `linear-gradient(145deg, ${bg3}, ${surface})`; pip.style.borderColor = pri + '40'; }
  const pipDot = document.getElementById('prev-pip-dot');
  if (pipDot) { pipDot.style.background = pri; pipDot.style.boxShadow = '0 0 8px ' + pri; }
  const pipName = document.getElementById('prev-pip-name');
  if (pipName) pipName.style.color = text;
  const pipInfo = document.getElementById('prev-pip-info');
  if (pipInfo) pipInfo.style.color = muted;

  // Story text
  const story = document.getElementById('prev-story');
  if (story) { story.style.background = `linear-gradient(145deg, ${bg3}, ${surface})`; story.style.borderColor = pri + '20'; }
  const storyText = document.getElementById('prev-story-text');
  if (storyText) storyText.style.color = text;

  // Action card
  const action = document.getElementById('prev-action');
  if (action) { action.style.background = bg4; action.style.borderColor = sec + '30'; }
  const actionTag = document.getElementById('prev-action-tag');
  if (actionTag) { actionTag.style.color = sec; actionTag.style.borderColor = sec + '40'; actionTag.style.background = sec + '15'; }
  const actionText = document.getElementById('prev-action-text');
  if (actionText) actionText.style.color = text;
}

function finishWizard(publish) {
  const name = document.getElementById('wiz-name')?.value.trim() || '';
  const desc = document.getElementById('wiz-desc')?.value.trim() || '';
  const color = document.getElementById('cp')?.value || '#C9A84C';

  // ── Validation ──
  if (!name) {
    const errEl = document.getElementById('wiz-err') || document.querySelector('.wiz-err');
    if (errEl) {
      errEl.textContent = 'Your world needs a name.';
      errEl.style.display = 'block';
    } else alert('Your world needs a name.');
    return;
  }
  if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
    alert('Invalid primary color hex. Use format: #RRGGBB');
    return;
  }
  const tier = publish ? 'community' : 'mine';

  // Read all text inputs
  const magicName = document.getElementById('wiz-magic-name')?.value.trim() || 'Magic';
  const magicResource = document.getElementById('wiz-magic-resource')?.value.trim() || 'Mana';
  const races = document.getElementById('wiz-races')?.value.trim() || '';
  const factions = document.getElementById('wiz-factions')?.value.trim() || '';
  const locations = document.getElementById('wiz-locations')?.value.trim() || '';
  const conflict = document.getElementById('wiz-conflict')?.value.trim() || '';
  const lore = document.getElementById('wiz-lore')?.value.trim() || '';

  // Read all wopt selections
  const tone = _getWizSel('tone', 'Epic Heroic');
  const era = _getWizSel('era', 'Medieval');
  const tech = _getWizSel('tech', 'Swords & Shields');
  const magicExists = _getWizSel('magicExists', 'Yes — Common');
  const magicSource = _getWizSel('magicSource', 'Willpower / Inner Force');
  const magicRisk = _getWizSel('magicRisk', 'Moderate — Mishaps');
  const statSystem = _getWizSel('statSystem', 'classic');
  const statGenMethod = _getWizSel('statGenMethod', 'pointbuy');
  const _poolSel = _getWizSel('pointBuyPool', '27');
  const pointBuyPool = _poolSel === 'custom'
    ? parseInt(document.getElementById('wiz-pointbuy-custom-val')?.value) || 27
    : parseInt(_poolSel) || 27;
  const progression = _getWizSel('progression', 'Level-Based (XP)');
  const namingStyle = _getWizSel('namingStyle', 'Western Fantasy');
  const narratorStyle = _getWizSel('narratorStyle', 'Epic & Mythic');
  const combatFreq = _getWizSel('combatFrequency', 'Moderate');
  const storyFocus = _getWizSel('storyFocus', 'Mixed');
  const lethality = _getWizSel('lethality', 'Balanced — Death is possible');
  const npcDepth = _getWizSel('npcDepth', 'Moderate — Personalities & motives');
  const titleFont = _getWizSel('titleFont', 'Cinzel');
  // World Rules
  const physics = _getWizSel('physics', 'Cinematic');
  const deathRules = _getWizSel('deathRules', 'Revivable');
  const timeFlow = _getWizSel('timeFlow', 'Elastic — Time bends to drama');
  const travelSpeed = _getWizSel('travelSpeed', 'Fast Travel');
  const dialogueStyle = _getWizSel('dialogueStyle', 'Mixed');
  // Visual Identity
  const uiStyle = _getWizSel('uiStyle', 'Glassmorphism');
  const buttonStyle = _getWizSel('buttonStyle', 'Rounded');
  const bgEffect = _getWizSel('bgEffect', 'Floating Particles');
  const cardStyle = _getWizSel('cardStyle', 'Glass');
  // Extended colors
  const colorSecondary = document.getElementById('cp-secondary')?.value || '#28A87A';
  const colorBg = document.getElementById('cp-bg')?.value || '#0F0D08';
  const colorSurface = document.getElementById('cp-surface')?.value || '#141109';
  const colorText = document.getElementById('cp-text')?.value || '#F8F3E8';
  const colorMuted = document.getElementById('cp-muted')?.value || '#A07830';
  const colorGlow = document.getElementById('cp-glow')?.value || '#C9A84C';
  const colorDanger = document.getElementById('cp-danger')?.value || '#B03828';

  // Parse locations into array
  const locArray = locations
    ? locations
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  // Build GM lore string from all inputs
  const gmLore =
    [
      lore,
      era !== 'Medieval' ? `Setting era: ${era}.` : '',
      tech !== 'Swords & Shields' ? `Technology: ${tech}.` : '',
      factions ? `Major factions: ${factions}.` : '',
      conflict ? `Central conflict: ${conflict}.` : '',
      namingStyle !== 'Western Fantasy' ? `Naming convention: ${namingStyle}.` : '',
    ]
      .filter(Boolean)
      .join(' ') || `A ${tone.toLowerCase()} world of adventure and mystery.`;

  // Build magic rules string
  const magicRules = magicExists.startsWith('No')
    ? 'There is no magic in this world. All power comes from skill, technology, or cunning.'
    : `${magicName} is ${magicExists.toLowerCase().replace('yes — ', '')}.
It is powered by ${magicSource.toLowerCase()}. ${magicResource} is the resource spent to cast.
Risk level: ${magicRisk.toLowerCase()}.`;

  // Build tone instruction (includes world rules)
  const toneInstruction = `${tone} tone. ${narratorStyle} narration style. Story focus: ${storyFocus.toLowerCase()}. Combat frequency: ${combatFreq.toLowerCase()}. Lethality: ${lethality.toLowerCase()}. NPC depth: ${npcDepth.toLowerCase()}.
Physics: ${physics.toLowerCase()}. Death rules: ${deathRules.toLowerCase()}. Time: ${timeFlow.toLowerCase()}. Travel: ${travelSpeed.toLowerCase()}. Dialogue: ${dialogueStyle.toLowerCase()}.`;

  // Build worldConfig from ALL wizard form data
  const worldId = 'custom-' + Date.now();
  const worldConfig = {
    id: worldId,
    name,
    tagline: desc || name,
    theme: {
      primary: color,
      secondary: colorSecondary,
      danger: colorDanger,
      bg: colorBg,
      surface: colorSurface,
      text: colorText,
      muted: colorMuted,
      glow: colorGlow,
      bgTone: 'dark',
      titleFont: titleFont,
      bodyFont: 'Crimson Pro',
      uiStyle,
      buttonStyle,
      bgEffect,
      cardStyle,
    },
    magic: { name: magicName, resource: magicResource, source: magicSource, risk: magicRisk, exists: magicExists, rules: magicRules },
    statSystem,
    statGenMethod,
    pointBuyPool, // only used when statGenMethod === 'pointbuy'
    gm: {
      worldName: name,
      worldLore: gmLore,
      tone: toneInstruction,
      npcFlavor: `${namingStyle} naming convention. NPC depth: ${npcDepth.toLowerCase()}.`,
    },
    races: races
      ? races
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    locations: locArray,
    factions,
    conflict,
    progression,
    era,
    tech,
    rules: { physics, deathRules, timeFlow, travelSpeed, dialogueStyle },
    enemies: { categories: _selectedEnemyCategories },
    ambientAudio: _selectedAmbientAudio,
    wizClasses: getWizClasses(),
  };
  // Add card image and publish flag
  worldConfig.cardImage = _selectedCardImage;
  worldConfig.published = publish;
  worldConfig.createdAt = new Date().toISOString();

  // Store config for system loader
  window._pendingWorldConfig = worldConfig;

  // Persist to localStorage
  _saveWorld(worldConfig);

  // Always save to DB (private or published)
  try {
    _saveWorldToDb(worldConfig, publish);
  } catch (e) {
    console.warn('DB save failed:', e);
  }

  // Re-render the worlds grid with the new card
  goTo('worlds');
  renderWorldsGrid();

  // Animate the new card in
  setTimeout(() => {
    const newCard = document.querySelector(`.wcard[data-world-id="${worldId}"]`);
    if (newCard) {
      gsap.fromTo(newCard, { opacity: 0, scale: 0.88, y: 22 }, { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.6)' });
    }
  }, 100);
}

/* ── 3D CARD TILT ── */
function initTilt() {
  document.querySelectorAll('.hero-card,.wcard:not(.wcard-new)').forEach((card) => {
    if (card._tiltBound) return; // prevent duplicate listeners
    card._tiltBound = true;
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const cx = (e.clientX - r.left) / r.width - 0.5;
      const cy = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(card, { rotateY: cx * 10, rotateX: -cy * 8, duration: 0.2, overwrite: 'auto' });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.5, ease: 'elastic.out(1,.5)' });
    });
  });
}

/* ── COLOR PICKER SYNC ── */
(function () {
  const cp = document.getElementById('cp');
  if (cp) {
    cp.addEventListener('input', function () {
      document.getElementById('cp-hex').value = this.value;
      updatePreview();
    });
  }
})();

/* ── HAMBURGER MENU ── */
function toggleMenu() {
  const menu = document.getElementById('hbmenu');
  // Toggle all hamburger buttons (landing + worlds page both have one)
  document.querySelectorAll('.hamburger').forEach((hb) => hb.classList.toggle('open'));
  if (menu) menu.classList.toggle('open');
}
// Close on outside click
document.addEventListener('click', (e) => {
  const menu = document.getElementById('hbmenu');
  const clickedHamburger = e.target.closest('.hamburger');
  if (!clickedHamburger && menu && !menu.contains(e.target)) {
    document.querySelectorAll('.hamburger').forEach((hb) => hb.classList.remove('open'));
    menu.classList.remove('open');
  }
});

/* ── SAVE WORLD TO DATABASE ── */
async function _saveWorldToDb(cfg, publish) {
  const author =
    window.Auth && window.Auth.getCurrentUser()
      ? window.Auth.getCurrentUser().displayName || window.Auth.getCurrentUser().username
      : 'Anonymous';
  const headers = { 'Content-Type': 'application/json' };
  // Attach auth token if logged in
  if (window.Auth && window.Auth.isLoggedIn()) {
    const tok = localStorage.getItem('cyoa_auth_token');
    if (tok) headers['Authorization'] = 'Bearer ' + tok;
  }
  try {
    await fetch(PROXY_URL + '/db/worlds', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        worldId: cfg.id,
        name: cfg.name || 'Custom World',
        tagline: cfg.tagline || '',
        author,
        system: 'custom',
        config: cfg,
        published: !!publish,
      }),
    });
  } catch (e) {
    console.warn('World DB save failed:', e);
  }
}

/* ── WORLD OWNERSHIP & PERSISTENCE ── */
function _getSavedWorlds() {
  try {
    return JSON.parse(localStorage.getItem('cyoa_my_worlds') || '[]');
  } catch (e) {
    return [];
  }
}
function _saveWorld(worldConfig) {
  const worlds = _getSavedWorlds();
  // Replace if same ID, else push
  const idx = worlds.findIndex((w) => w.id === worldConfig.id);
  if (idx >= 0) worlds[idx] = worldConfig;
  else worlds.push(worldConfig);
  localStorage.setItem('cyoa_my_worlds', JSON.stringify(worlds));
}
function _deleteWorld(worldId) {
  const worlds = _getSavedWorlds().filter((w) => w.id !== worldId);
  localStorage.setItem('cyoa_my_worlds', JSON.stringify(worlds));
}
function _isOwnedWorld(worldId) {
  // DB-first: check community cache for owner_id match
  if (window.Auth && window.Auth.isLoggedIn()) {
    const user = window.Auth.getCurrentUser();
    if (user) {
      const cached = _communityWorldsCache.find((w) => w.id === worldId);
      if (cached && cached.owner_id === user.id) return true;
    }
  }
  // Fallback: localStorage
  return _getSavedWorlds().some((w) => w.id === worldId);
}

function deleteWorld(worldId) {
  if (!_isOwnedWorld(worldId)) {
    alert('You can only delete worlds you created.');
    return;
  }
  if (!confirm('Delete this world permanently?')) return;
  _deleteWorld(worldId);
  renderWorldsGrid();
}

// ── WORLD LIBRARY CACHE ──
let _communityWorldsCache = [];
let _communityFetchedAt = 0;
const _COMMUNITY_CACHE_MS = 60000; // 60s

async function _fetchCommunityWorlds() {
  const now = Date.now();
  if (_communityWorldsCache.length && now - _communityFetchedAt < _COMMUNITY_CACHE_MS) return _communityWorldsCache;
  try {
    const headers = {};
    // Send auth token so logged-in users see their private worlds too
    const tok = localStorage.getItem('cyoa_auth_token');
    if (tok) headers['Authorization'] = 'Bearer ' + tok;
    const res = await fetch(PROXY_URL + '/db/worlds', { headers });
    if (!res.ok) {
      _communityFetchedAt = now;
      return [];
    }
    const rows = await res.json();
    _communityWorldsCache = (Array.isArray(rows) ? rows : [])
      .map((r) => ({
        id: r.world_id || '',
        tier: r.tier || 'community',
        name: r.name || 'Unnamed',
        tagline: r.tagline || '',
        author: r.author || 'Unknown',
        system: r.system || 'custom',
        config: (typeof r.config === 'string' ? JSON.parse(r.config) : r.config) || {},
        rating: parseFloat(r.rating) || 0,
        plays: parseInt(r.plays) || 0,
        published: r.published !== false,
        owner_id: r.owner_id || null,
      }))
      .filter((w) => w.id);
    _communityFetchedAt = now;
    return _communityWorldsCache;
  } catch (e) {
    console.warn('World library fetch failed:', e);
    return _communityWorldsCache;
  }
}

// Start prefetching on landing page load so worlds are ready when user clicks "Enter a World"
function prefetchWorldLibrary() {
  _fetchCommunityWorlds().catch(() => {});
}

function _renderWorldCard(w, isOwned, grid) {
  const color = (w.theme && w.theme.primary) || (w.config && w.config.theme && w.config.theme.primary) || '#C9A84C';
  const tier = isOwned ? (w.published ? 'community' : 'mine') : 'community';
  const name = w.name || 'Custom World';
  const tagline = w.tagline || w.config?.tagline || 'A community world.';
  const image = w.cardImage || w.config?.cardImage || 'GameCardImgs/cosmic face.png';
  const author = w.author || '';
  const worldId = w.id;

  const card = document.createElement('div');
  card.className = 'wcard';
  card.dataset.tier = tier;
  card.dataset.worldId = worldId;
  card.style.borderColor = color + '28';
  card.onclick = () => pickWorld(worldId);
  card.innerHTML = `
    ${isOwned ? `<button class="wcard-del" onclick="event.stopPropagation();deleteWorld('${worldId}')" title="Delete world">✕</button>` : ''}
    <div class="wcard-art">
      <img src="${image}" alt="${name}" class="wcard-img">
    </div>
    <div class="wcard-body">
      <div class="wcard-badges">
        <span class="badge" style="background:${color}18;border:1px solid ${color}40;color:${color};">
          ${tier === 'mine' ? '🔒 Private' : '🌐 Community'}
        </span>
      </div>
      <div class="wcard-name" style="color:${color}">${name}</div>
      <div class="wcard-desc">${tagline}</div>
      <div class="wcard-meta">${author ? author + ' · ' : ''}Custom</div>
      <button class="wcard-btn" style="border-color:${color}50;color:${color};"
        onclick="event.stopPropagation();pickWorld('${worldId}')">Play →</button>
    </div>`;
  grid.appendChild(card);
}

function renderWorldsGrid() {
  const grid = document.getElementById('worlds-grid');
  if (!grid) return;

  // Remove all non-official cards (keep official hardcoded ones)
  grid.querySelectorAll('.wcard:not([data-tier="official"])').forEach((el) => el.remove());

  // 1. Render local worlds (yours — private + published)
  const myWorlds = _getSavedWorlds();
  const myIds = new Set(myWorlds.map((w) => w.id));
  myWorlds.forEach((w) => _renderWorldCard(w, true, grid));

  // 2. Render community worlds from sheet (skip duplicates with your local worlds)
  _communityWorldsCache.forEach((cw) => {
    if (myIds.has(cw.id)) return; // already rendered as your own
    // Store config so pickWorld can load it
    const worldData = cw.config || {};
    worldData.id = cw.id;
    worldData.name = cw.name;
    worldData.tagline = cw.tagline;
    worldData.author = cw.author;
    _renderWorldCard(worldData, false, grid);
  });

  // Re-init tilt for new cards
  setTimeout(initTilt, 50);
}

/* ── MODALS (FAQ, Feedback, Contribute) ── */
function openFAQ() {
  const modal = document.getElementById('faq-modal');
  modal.style.display = 'flex';
  // Parse markdown FAQ into HTML (simple parser — handles ##, **, *, -, ---)
  fetch('MARKDOWNS/CYOAHUB_FAQ.md')
    .then((r) => r.text())
    .then((md) => {
      const html = md
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^---$/gm, '<hr>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>\n?)+/g, (m) => '<ul>' + m + '</ul>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
      document.getElementById('faq-content').innerHTML = '<p>' + html + '</p>';
    })
    .catch(() => {
      document.getElementById('faq-content').innerHTML = '<p>FAQ could not be loaded.</p>';
    });
}

function openFeedback() {
  document.getElementById('feedback-modal').style.display = 'flex';
}

function openContribute() {
  document.getElementById('contribute-modal').style.display = 'flex';
}

/* ── PICK WORLD ── */
function pickWorld(worldId) {
  // Persist active world so page refresh can restore it
  if (worldId) localStorage.setItem('cyoa_active_world', worldId);
  // For custom worlds, load config from local storage or community cache
  if (worldId && worldId.startsWith('custom-')) {
    const saved = _getSavedWorlds().find((w) => w.id === worldId);
    if (saved) {
      window._pendingWorldConfig = saved;
    } else {
      // Check community cache (someone else's published world)
      const community = _communityWorldsCache.find((w) => w.id === worldId);
      if (community && community.config) {
        const cfg = community.config;
        cfg.id = community.id;
        cfg.name = community.name;
        cfg.tagline = community.tagline;
        window._pendingWorldConfig = cfg;
      }
    }
  }
  if (typeof loadSystem === 'function') loadSystem(worldId);
  if (typeof gState !== 'undefined' && gState) {
    gState.system = worldId;
    gState.worldId = worldId;
  }
  // Populate dynamic screen titles from active system
  const sys = window.SystemData || {};
  const glyph = sys.glyph || '⟁';
  const name = sys.name || worldId;
  const sub = sys.subtitle || '';
  const tag = sys.tagline || '';
  const thinkLabel = glyph + ' The Game Master deliberates';
  // Campaign screen
  const campGlyph = document.getElementById('camp-glyph');
  const campTitle = document.getElementById('camp-title');
  if (campGlyph) campGlyph.textContent = glyph;
  if (campTitle) campTitle.textContent = name;
  // Title screen
  const titleGlyph = document.getElementById('title-glyph');
  const titleName = document.getElementById('title-name');
  const titleSub = document.getElementById('title-sub');
  const titleQuote = document.getElementById('title-quote');
  if (titleGlyph) titleGlyph.textContent = glyph;
  if (titleName) titleName.textContent = name;
  if (titleSub) titleSub.innerHTML = `<span data-tr>${sub}</span>`;
  if (titleQuote && tag) titleQuote.innerHTML = `${tag}`;
  // Game screen header
  const gameLogo = document.getElementById('game-logo');
  if (gameLogo) {
    const logoName = document.getElementById('game-logo-name');
    if (logoName) logoName.textContent = name;
    else gameLogo.textContent = glyph + ' ' + name;
  }
  // Thinking bar
  const thinkEl = document.getElementById('thinking-label');
  if (thinkEl) thinkEl.textContent = thinkLabel;
  // Print header
  const printTitle = document.getElementById('print-title');
  if (printTitle) printTitle.textContent = glyph + ' ' + name;
  // System-aware labels throughout game screens
  const partyLabel = document.getElementById('party-label');
  const classHeading = document.getElementById('class-heading');
  const classFlavor = document.getElementById('class-flavor');
  // Config-driven labels
  const cc = sys.charCreation || {};
  if (partyLabel) partyLabel.textContent = cc.partyLabel || 'Adventuring Party';
  const lobbyPartyLabel = document.getElementById('lobby-party-label');
  if (lobbyPartyLabel) lobbyPartyLabel.textContent = cc.partyLabel || 'Adventuring Party';
  const enterText = document.getElementById('enter-btn-text');
  if (enterText) enterText.textContent = glyph + ' Begin Campaign';
  if (classHeading) classHeading.textContent = cc.classHeading || 'Your Class';
  if (classFlavor) classFlavor.textContent = cc.classFlavor || 'Choose wisely.';
  const bgFlavor = document.getElementById('bg-flavor');
  if (bgFlavor) bgFlavor.textContent = cc.backgroundFlavor || 'What shaped you?';

  window.location.hash = '#campaign/' + (worldId || 'stormlight');
  showScreen('campaign');
  if (typeof initCampaignPicker === 'function') initCampaignPicker();
}

// ── HASH ROUTER ──────────────────────────────────────────
// URL format: #screen/worldId/campaignId
// Examples: #campaign/dnd5e, #game/dnd5e/my-campaign-abc, #lobby/wretcheddeep/deep-run-xyz
const HUB_ROUTES = { '': 'landing', '#landing': 'landing', '#worlds': 'worlds', '#wizard': 'wizard' };
const GAME_SCREENS = ['campaign', 'title', 'create', 'lobby', 'game', 'combat', 'join'];

function parseHash() {
  const raw = (window.location.hash || '').split('?')[0];
  // Handle legacy invite links: #campaign?world=X&id=Y
  if (raw === '#campaign' && (window.location.hash || '').includes('world=')) {
    const params = new URLSearchParams((window.location.hash || '').split('?')[1] || '');
    return { screen: 'campaign', worldId: params.get('world'), campId: params.get('id') };
  }
  const parts = raw.replace('#', '').split('/');
  return { screen: parts[0] || '', worldId: parts[1] || '', campId: parts[2] || '' };
}

function setGameHash(screen, worldId, campId) {
  const wid = worldId || (window.SystemData && window.SystemData.id) || localStorage.getItem('cyoa_active_world') || '';
  const cid = campId || (typeof campaignId !== 'undefined' ? campaignId : '') || '';
  let hash = '#' + screen;
  if (wid) hash += '/' + wid;
  if (cid) hash += '/' + cid;
  if (window.location.hash !== hash) window.location.hash = hash;
}

function _loadWorldFromId(worldId) {
  if (!worldId || !typeof loadSystem === 'function') return;
  if (window.SystemData && window.SystemData.id === worldId) return; // already loaded
  if (worldId.startsWith('custom-')) {
    const saved = _getSavedWorlds().find((w) => w.id === worldId);
    if (saved) window._pendingWorldConfig = saved;
  }
  localStorage.setItem('cyoa_active_world', worldId);
  loadSystem(worldId);
  // Apply titles
  const sys = window.SystemData || {};
  const campTitle = document.getElementById('camp-title');
  if (campTitle) campTitle.textContent = sys.name || 'Choose Your Campaign';
  const campGlyph = document.getElementById('camp-glyph');
  if (campGlyph) campGlyph.textContent = sys.glyph || '⟁';
  const logoName = document.getElementById('game-logo-name');
  if (logoName) logoName.textContent = sys.name || 'CYOAhub';
}

function routeFromHash() {
  const { screen, worldId, campId } = parseHash();

  // Hub screens
  if (HUB_ROUTES['#' + screen] || HUB_ROUTES[screen] || !screen) {
    const sid = HUB_ROUTES['#' + screen] || HUB_ROUTES[screen] || 'landing';
    showScreen(sid);
    if (sid === 'landing') animateLanding(false);
    if (sid === 'worlds') animateHub();
    return;
  }

  // Join via invite link: #join/TOKEN
  if (screen === 'join' && worldId) {
    const token = worldId; // in #join/TOKEN, the "worldId" slot holds the token
    if (window.Auth && window.Auth.validateInvite) {
      window.Auth.validateInvite(token)
        .then((info) => {
          if (info && info.valid) {
            _loadWorldFromId(info.worldId);
            if (typeof campaignId !== 'undefined') campaignId = info.campaignId;
            // If logged in, join directly. If guest, show join modal.
            if (window.Auth.isLoggedIn()) {
              window.Auth.joinViaInvite(token, window.Auth.getCurrentUser().displayName).then(() => {
                showScreen('lobby');
                if (typeof renderLobby === 'function') renderLobby();
              });
            } else {
              // Show a join dialog for guests
              const name = prompt('Enter your name to join as a guest:');
              if (name) {
                window.Auth.joinViaInvite(token, name).then(() => {
                  showScreen('lobby');
                  if (typeof renderLobby === 'function') renderLobby();
                });
              } else {
                showScreen('landing');
                animateLanding(false);
              }
            }
          } else {
            alert('This invite link is invalid or expired.');
            showScreen('landing');
            animateLanding(false);
          }
        })
        .catch(() => {
          showScreen('landing');
          animateLanding(false);
        });
    }
    return;
  }

  // Game screens — need a world loaded
  if (GAME_SCREENS.includes(screen)) {
    const wid = worldId || localStorage.getItem('cyoa_active_world') || 'stormlight';
    _loadWorldFromId(wid);

    if (screen === 'campaign') {
      showScreen('campaign');
      if (typeof initCampaignPicker === 'function') initCampaignPicker();
    } else if (campId && (screen === 'game' || screen === 'lobby' || screen === 'combat')) {
      // Restore campaign context
      if (typeof campaignId !== 'undefined') campaignId = campId;
      showScreen(screen);
      if (screen === 'game' && typeof showGameScreen === 'function') showGameScreen();
      else if (screen === 'lobby' && typeof renderLobby === 'function') {
        renderLobby();
        if (typeof startLobbyPolling === 'function') startLobbyPolling();
      } else if (screen === 'combat' && typeof enterCombat === 'function') enterCombat();
    } else {
      showScreen(screen);
    }
    return;
  }
}
window.addEventListener('hashchange', routeFromHash);

/* ── HUB BOOT ── */
function hubBoot() {
  const { screen, worldId, campId } = parseHash();

  // Legacy invite link handling
  if (screen === 'campaign' && worldId && campId) {
    pickWorld(worldId);
    setTimeout(() => {
      if (typeof selectCampaign === 'function') selectCampaign(campId);
    }, 500);
    return;
  }

  // Initialize auth on every boot
  if (window.Auth && window.Auth.init) window.Auth.init();

  if (!screen || screen === 'landing' || screen === 'worlds' || screen === 'wizard') {
    showScreen('landing');
    animateLanding(true);
    initTilt();
    initHubParticles();
    prefetchWorldLibrary();
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
