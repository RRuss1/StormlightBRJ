/**
 * ============================================================
 * app/main.js — Application Bootstrap + GSAP Animation System
 * CYOAhub
 * ============================================================
 * Responsibilities:
 *   1. Initialize Lenis smooth scroll
 *   2. Register GSAP plugins
 *   3. Set up screen transition system (with blur + depth)
 *   4. Screen-specific entrance animations
 *   5. Combat feedback: float text, shake, heal, crit, damage flash
 *   6. Chronicle card 3-D tilt parallax
 *   7. Global button micro-feedback (press scale)
 *   8. Idle glyph animations
 *   9. Toast notification system
 *  10. Boot sequence
 * ============================================================
 */

// ── 1. LENIS SMOOTH SCROLL ────────────────────────────────────
// Lenis hijacks wheel events — only activate on game screens, not hub.
let lenis, _lenisRaf;
function startLenis() {
  if (lenis || typeof Lenis === 'undefined') return;
  lenis = new Lenis({
    duration: 1.2,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
  });
  function raf(time) { lenis.raf(time); _lenisRaf = requestAnimationFrame(raf); }
  _lenisRaf = requestAnimationFrame(raf);
}
function destroyLenis() {
  if (!lenis) return;
  lenis.destroy();
  lenis = null;
  if (_lenisRaf) { cancelAnimationFrame(_lenisRaf); _lenisRaf = null; }
}
// Only start Lenis on game screens — hub screens use native scroll
document.addEventListener('sc:screenChange', (e) => {
  const hub = ['landing', 'worlds', 'wizard'];
  if (hub.includes(e.detail?.screen)) {
    destroyLenis();
  } else {
    startLenis();
  }
});
// Don't start Lenis at boot if on a hub screen
window.addEventListener('load', () => {
  const _h = (window.location.hash || '').split('?')[0];
  if (_h && _h !== '#landing' && _h !== '#worlds' && _h !== '#wizard') {
    startLenis();
  }
});

// ── 2. GSAP PLUGIN REGISTRATION ──────────────────────────────
gsap.registerPlugin(ScrollTrigger);

// ── 3. SCREEN TRANSITION SYSTEM ──────────────────────────────
// Patches showScreen() so every screen change gets:
//   • fade + slight upward slide
//   • subtle blur-in (depth reveal)
//   • screen-specific entrance sequence
window.addEventListener('load', () => {
  if (!window.showScreen) return;

  const _orig = window.showScreen;
  window.showScreen = function(id) {
    _orig(id);
    const el = document.getElementById('s-' + id);
    if (!el) return;

    // Kill any in-progress animation on this element
    gsap.killTweensOf(el);
    // Force-clear residual inline styles from interrupted animations
    el.style.filter = ''; el.style.opacity = ''; el.style.transform = '';

    // Entrance animation — blur + fade + lift (cinematic depth reveal)
    gsap.fromTo(el,
      { opacity: 0, y: 14, filter: 'blur(5px)' },
      { opacity: 1, y: 0,  filter: 'blur(0px)', duration: 0.42, ease: 'power2.out', clearProps: 'all' }
    );

    // Screen-specific entrance sequences
    switch (id) {
      case 'campaign': _animateCampaignScreen(); break;
      case 'title':    _animateTitleScreen();    break;
      case 'create':   _animateCreateScreen();   break;
      case 'lobby':    _animateLobbyScreen();    break;
      case 'game':     _animateGameScreen();     break;
      case 'combat':   _animateCombatScreen();   break;
    }

    // Dispatch sc:screenChange so NL-7 weather/audio/spren hooks fire
    document.dispatchEvent(new CustomEvent('sc:screenChange', { detail: { screen: id } }));
  };

  // ── Global button micro-feedback ──────────────────────────
  // Slight compress on mousedown, spring back on mouseup
  const INTERACTIVE = '.btn, .btn-act, .btn-continue, .btn-gold, .achoice, .camp-card, .type-card, .ccard, .origin-btn, .resolve-btn';

  document.addEventListener('mousedown', (e) => {
    const btn = e.target.closest(INTERACTIVE);
    if (!btn || btn.disabled) return;
    gsap.to(btn, { scale: 0.965, duration: 0.08, ease: 'power2.in', overwrite: 'auto' });
  }, { passive: true });

  document.addEventListener('mouseup', () => {
    document.querySelectorAll(INTERACTIVE).forEach(btn => {
      if (gsap.isTweening(btn)) return;
      gsap.to(btn, { scale: 1, duration: 0.25, ease: 'elastic.out(1.2, 0.5)', overwrite: 'auto' });
    });
  }, { passive: true });
});

// ── 4. SCREEN-SPECIFIC ENTRANCE ANIMATIONS ───────────────────

function _animateCampaignScreen() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.from('#s-campaign .title-h1',   { opacity: 0, y: 32, filter: 'blur(4px)', duration: 0.75, delay: 0.08 })
    .from('#s-campaign .title-h2',   { opacity: 0, y: 20, duration: 0.5 }, '-=0.42')
    .from('#s-campaign .title-line', { opacity: 0, scaleX: 0, duration: 0.6, transformOrigin: 'center' }, '-=0.32');

  // Idle float on title glyph
  const glyph = document.querySelector('#s-campaign .title-glyph');
  if (glyph) {
    gsap.to(glyph, {
      y: -5, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1,
    });
  }

  // Campaign cards stagger in via MutationObserver (rendered async)
  const grid = document.getElementById('camp-grid');
  if (grid) {
    const observer = new MutationObserver(() => {
      const cards = grid.querySelectorAll('.camp-card');
      if (cards.length > 0) {
        gsap.from(cards, {
          opacity: 0,
          y: 26,
          scale: 0.95,
          filter: 'blur(3px)',
          duration: 0.48,
          stagger: 0.07,
          ease: 'power3.out',
          clearProps: 'all',
        });
        observer.disconnect();
      }
    });
    observer.observe(grid, { childList: true });
  }
}

function _animateTitleScreen() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('#s-title .title-glyph', { opacity: 0, scale: 0.75, filter: 'blur(6px)', duration: 0.65, delay: 0.06 })
    .from('#s-title .title-h1',    { opacity: 0, y: 22,  filter: 'blur(3px)', duration: 0.55 }, '-=0.30')
    .from('#s-title .title-h2',    { opacity: 0, y: 16,  duration: 0.42 }, '-=0.28')
    .from('#s-title .title-line',  { opacity: 0, scaleX: 0, duration: 0.50, transformOrigin: 'center' }, '-=0.24')
    .from('#s-title .title-quote', { opacity: 0, y: 12,  duration: 0.42 }, '-=0.20')
    .from('#s-title .psz-wrap',    { opacity: 0, y: 10,  duration: 0.40, clearProps:'all' }, '-=0.10')
    .from('#s-title .btn',         { opacity: 0, y: 8,   duration: 0.35, stagger: 0.09, clearProps:'all' }, '-=0.18');

  // Idle float on title glyph
  const glyph = document.querySelector('#s-title .title-glyph');
  if (glyph) {
    gsap.to(glyph, { y: -5, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.8 });
  }
}

function _animateCreateScreen() {
  gsap.from('#s-create .create-wrap', {
    opacity: 0, y: 18, filter: 'blur(4px)', duration: 0.44, ease: 'power2.out', delay: 0.06,
  });
  gsap.from('#create-steps .step-dot', {
    opacity: 0, scale: 0, duration: 0.32, stagger: 0.055, ease: 'back.out(2)', delay: 0.18,
  });
}

function _animateLobbyScreen() {
  gsap.from('#s-lobby .lobby-wrap > *', {
    opacity: 0, y: 16, filter: 'blur(2px)', duration: 0.42, stagger: 0.07, ease: 'power2.out', delay: 0.06,
  });
}

function _animateGameScreen() {
  // Kill any stale tweens on game elements before re-animating
  gsap.killTweensOf('.game-top, .party-strip, .chronicle-card, .side-panel');
  // Force-clear any residual blur/opacity from interrupted animations
  document.querySelectorAll('.game-top, .party-strip, .chronicle-card, .side-panel').forEach(el => {
    el.style.filter = ''; el.style.opacity = ''; el.style.transform = '';
  });
  const tl = gsap.timeline({ defaults: { ease: 'power2.out', clearProps: 'all' } });
  tl.from('.game-top',       { opacity: 0, y: -10, filter: 'blur(4px)', duration: 0.38, delay: 0.05 })
    .from('.party-strip',    { opacity: 0, y: -8,  duration: 0.32 }, '-=0.18')
    .from('.chronicle-card', { opacity: 0, y: 18,  filter: 'blur(5px)', duration: 0.52 }, '-=0.16')
    .from('.side-panel',     { opacity: 0, x: -12, filter: 'blur(3px)', duration: 0.42, stagger: 0.10 }, '-=0.30');

  // Init chronicle tilt parallax after layout settles
  setTimeout(_initChronicleTilt, 400);
}

function _animateCombatScreen() {
  // ── Dramatic red screen flash on combat entrance ──
  const flash = document.createElement('div');
  flash.style.cssText = 'position:fixed;inset:0;background:rgba(176,56,40,0.20);pointer-events:none;z-index:9999;';
  document.body.appendChild(flash);
  gsap.to(flash, {
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out',
    onComplete: () => flash.remove(),
  });

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('.combat-top',       { opacity: 0, y: -14, filter: 'blur(4px)', duration: 0.36, delay: 0.05 })
    .from('.combat-party-col .char-combat-card', {
      opacity: 0, x: -26, filter: 'blur(4px)', duration: 0.48, stagger: 0.09,
    }, '-=0.10')
    .from('.combat-enemy-col .char-combat-card', {
      opacity: 0, x: 26, filter: 'blur(4px)', duration: 0.48, stagger: 0.09,
    }, '-=0.48')
    .from('.combat-narrative', { opacity: 0, y: 14, filter: 'blur(3px)', duration: 0.40 }, '-=0.22');
}

// ── 5. COMBAT FEEDBACK ANIMATIONS ────────────────────────────

/**
 * Float a damage/heal number over a character pip.
 */
window.animateFloatText = function(element, text, isHeal) {
  if (!element) return;
  const float = document.createElement('div');
  float.textContent = text;
  float.style.cssText = `
    position: absolute;
    top: -2px; left: 50%;
    transform: translateX(-50%);
    font-family: var(--font-d);
    font-size: 14px;
    font-weight: 700;
    color: ${isHeal ? 'var(--teal2)' : 'var(--coral2)'};
    pointer-events: none;
    z-index: 100;
    white-space: nowrap;
    text-shadow: 0 0 8px ${isHeal ? 'rgba(29,122,92,0.6)' : 'rgba(212,78,48,0.6)'};
  `;
  element.style.position = 'relative';
  element.appendChild(float);

  gsap.fromTo(float,
    { opacity: 1, y: 0, scale: 1.1 },
    {
      opacity: 0,
      y: -36,
      scale: 0.85,
      duration: 1.0,
      ease: 'power2.out',
      onComplete: () => float.remove(),
    }
  );
};

/**
 * Shake a combat card when taking damage.
 */
window.shakeCombatCard = function(cardEl) {
  if (!cardEl) return;
  gsap.fromTo(cardEl,
    { x: 0 },
    {
      keyframes: { x: [-7, 6, -5, 5, -3, 2, 0] },
      duration: 0.45,
      ease: 'power1.inOut',
      clearProps: 'x',
    }
  );
};

/**
 * Heal shimmer on a combat card.
 */
window.healShimmerCard = function(cardEl) {
  if (!cardEl) return;
  gsap.fromTo(cardEl,
    { boxShadow: '0 0 0 0 rgba(29,122,92,0)' },
    {
      boxShadow: '0 0 0 4px rgba(29,122,92,0.55), 0 0 28px rgba(29,122,92,0.25)',
      duration: 0.32,
      yoyo: true,
      repeat: 1,
      ease: 'power2.out',
      clearProps: 'boxShadow',
    }
  );
};

/**
 * Critical hit — white-gold burst then fade, combined with shake.
 */
window.animateCritHit = function(cardEl) {
  if (!cardEl) return;
  gsap.timeline()
    .to(cardEl, {
      filter: 'brightness(3.0) saturate(0.15)',
      boxShadow: '0 0 50px rgba(255,248,200,0.65), 0 0 100px rgba(201,168,76,0.3)',
      duration: 0.09,
      ease: 'none',
    })
    .to(cardEl, {
      filter: 'brightness(1) saturate(1)',
      boxShadow: 'none',
      duration: 0.50,
      ease: 'power3.out',
      clearProps: 'filter,boxShadow',
    });
  window.shakeCombatCard(cardEl);
};

/**
 * Full-screen edge-flash for taking damage in combat.
 */
window.animateDamageFlash = function() {
  const flash = document.createElement('div');
  flash.style.cssText = 'position:fixed;inset:0;background:rgba(176,56,40,0.22);pointer-events:none;z-index:9998;';
  document.body.appendChild(flash);
  gsap.fromTo(flash,
    { opacity: 1 },
    { opacity: 0, duration: 0.55, ease: 'power2.out', onComplete: () => flash.remove() }
  );
};

/**
 * Spawn heal particles above a card.
 */
window.animateHealParticles = function(cardEl) {
  if (!cardEl) return;
  for (let i = 0; i < 4; i++) {
    const p = document.createElement('div');
    p.textContent = '✦';
    p.style.cssText = `
      position: absolute;
      font-size: 10px;
      color: var(--teal2);
      pointer-events: none;
      z-index: 50;
      left: ${20 + Math.random() * 60}%;
      top: 20%;
    `;
    cardEl.style.position = 'relative';
    cardEl.appendChild(p);
    gsap.fromTo(p,
      { opacity: 0.85, y: 0, x: (Math.random() - 0.5) * 14 },
      {
        opacity: 0,
        y: -(18 + Math.random() * 16),
        duration: 0.8 + Math.random() * 0.3,
        delay: i * 0.07,
        ease: 'power2.out',
        onComplete: () => p.remove(),
      }
    );
  }
};

// ── 6. CHOICE REVEAL ANIMATION ───────────────────────────────
window.animateChoicesIn = function(container) {
  if (!container) return;
  const choices = container.querySelectorAll('.achoice');
  if (!choices.length) return;
  gsap.from(choices, {
    opacity: 0,
    y: 12,
    scale: 0.96,
    filter: 'blur(2px)',
    duration: 0.34,
    stagger: 0.055,
    ease: 'power2.out',
    clearProps: 'all',
  });
};

// ── 7. STORY TEXT REVEAL ──────────────────────────────────────
window.animateStoryReveal = function(el) {
  if (!el) return;
  gsap.fromTo(el,
    { opacity: 0, y: 10, filter: 'blur(3px)' },
    { opacity: 1, y: 0,  filter: 'blur(0px)', duration: 0.48, ease: 'power2.out', clearProps: 'all' }
  );
};

// ── 8. CHRONICLE CARD 3-D TILT PARALLAX ──────────────────────
function _initChronicleTilt() {
  const card = document.querySelector('.chronicle-card');
  if (!card || window.innerWidth < 900) return;

  // Remove previous listeners (re-init safe)
  card.onmousemove = null;
  card.onmouseleave = null;

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width  - 0.5;  // -0.5 → 0.5
    const cy = (e.clientY - rect.top)  / rect.height - 0.5;
    gsap.to(card, {
      rotateX: cy * -3.5,
      rotateY: cx * 3.5,
      transformPerspective: 1400,
      duration: 0.55,
      ease: 'power2.out',
    });
  }, { passive: true });

  card.addEventListener('mouseleave', () => {
    gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.5, ease: 'power2.out', clearProps: 'rotateX,rotateY' });
  });
}

// Keep old initParallax for legacy calls from ui.js
function initParallax() { _initChronicleTilt(); }

// ── 9. TURN CHANGE ANIMATION ──────────────────────────────────
/**
 * Animate the turn-pill when ownership switches.
 * Call this from ui.js whenever the active turn changes.
 */
window.animateTurnChange = function(pillEl) {
  if (!pillEl) return;
  gsap.fromTo(pillEl,
    { scale: 1.0 },
    { scale: 1.12, duration: 0.18, ease: 'power2.out', yoyo: true, repeat: 1,
      onComplete: () => gsap.set(pillEl, { clearProps: 'scale' }) }
  );
};

// ── 10. TOAST NOTIFICATION ────────────────────────────────────
window.showToastGSAP = function(message) {
  const existing = document.querySelector('.sc-toast');
  if (existing) {
    gsap.to(existing, { opacity: 0, y: 8, duration: 0.2, onComplete: () => existing.remove() });
  }

  const toast = document.createElement('div');
  toast.className = 'sc-toast';
  toast.style.cssText = `
    position: fixed;
    bottom: 80px; left: 50%;
    transform: translateX(-50%) translateY(10px);
    background: var(--bg3);
    border: 1px solid var(--border2);
    border-radius: 20px;
    padding: 8px 20px;
    font-family: var(--font-d);
    font-size: 11px;
    letter-spacing: 1px;
    color: var(--text3);
    z-index: 9999;
    pointer-events: none;
    opacity: 0;
    backdrop-filter: blur(12px);
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  gsap.timeline()
    .to(toast, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' })
    .to(toast, { opacity: 0, y: -8, duration: 0.3, ease: 'power2.in', delay: 2.4,
        onComplete: () => toast.remove() });
};

// ═══════════════════════════════════════════════════════════════
// NEXT LEVEL IDEAS — Six AAA Cinematic Systems
// ═══════════════════════════════════════════════════════════════

// ── NL-1. STORMLIGHT PARTICLE SYSTEM ─────────────────────────
// WebGL canvas overlay — drifting blue-white Stormlight motes.
// Activates on any character card that has Investiture > 0.
// Usage: stormlightParticles.activate(cardEl) / .deactivate()
(function _initStormlightParticles() {
  const PARTICLE_COUNT = 55;
  const COLORS = ['#b8eaff','#d4f4ff','#e8faff','#9fd8f8','#c0f0ff'];
  let canvas, ctx, particles = [], raf = null, _active = false;

  function _mkCanvas() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.id = 'stormlight-canvas';
    canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:8;opacity:0;';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    _resize();
    window.addEventListener('resize', _resize, { passive: true });
  }

  function _resize() {
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function _spawn() {
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 1.2 + Math.random() * 2.2,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -0.25 - Math.random() * 0.45,
      alpha: 0,
      targetAlpha: 0.35 + Math.random() * 0.55,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      life: 0,
      maxLife: 180 + Math.random() * 240,
    };
  }

  function _draw() {
    if (!_active || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.life++;
      p.x += p.vx + Math.sin(p.life * 0.022 + i) * 0.18;
      p.y += p.vy;

      // Fade in / fade out
      const progress = p.life / p.maxLife;
      p.alpha = progress < 0.2
        ? (progress / 0.2) * p.targetAlpha
        : progress > 0.8
          ? ((1 - progress) / 0.2) * p.targetAlpha
          : p.targetAlpha;

      if (p.life >= p.maxLife) particles[i] = _spawn();

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(_draw);
  }

  window.stormlightParticles = {
    activate() {
      if (_active) return;
      _mkCanvas();
      if (particles.length === 0) {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const p = _spawn();
          p.life = Math.floor(Math.random() * p.maxLife); // stagger
          particles.push(p);
        }
      }
      _active = true;
      gsap.to(canvas, { opacity: 1, duration: 1.2, ease: 'power2.inOut' });
      _draw();
    },
    deactivate() {
      if (!_active || !canvas) return;
      gsap.to(canvas, { opacity: 0, duration: 1.0, ease: 'power2.inOut', onComplete: () => {
        _active = false;
        if (raf) cancelAnimationFrame(raf);
      }});
    },
    toggle(on) { on ? this.activate() : this.deactivate(); },
  };
})();

// ── NL-2. WEATHER SYSTEM ─────────────────────────────────────
// CSS-layer wind/rain overlay that activates during combat.
// Reads the latest GM story text for weather keywords.
// Usage: WeatherSystem.setWeather('rain'|'storm'|'clear'|'ash')
(function _initWeatherSystem() {
  let _weatherEl = null, _current = 'clear';

  const WEATHER_STYLES = {
    clear: { opacity: 0 },
    rain: {
      background: 'repeating-linear-gradient(to bottom, transparent 0, transparent 4px, rgba(180,210,240,0.10) 4px, rgba(180,210,240,0.10) 5px)',
      backgroundSize: '3px 22px',
      opacity: 0.65,
      animation: 'weatherRain 0.22s linear infinite',
    },
    storm: {
      background: 'repeating-linear-gradient(10deg, transparent 0, transparent 3px, rgba(130,180,230,0.18) 3px, rgba(130,180,230,0.18) 4px)',
      backgroundSize: '4px 18px',
      opacity: 0.85,
      animation: 'weatherRain 0.14s linear infinite',
    },
    ash: {
      background: 'radial-gradient(circle at 50% 100%, rgba(80,60,40,0.22) 0%, transparent 70%)',
      opacity: 0.7,
    },
  };

  function _mkEl() {
    if (_weatherEl) return;
    _weatherEl = document.createElement('div');
    _weatherEl.id = 'weather-overlay';
    _weatherEl.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:6;opacity:0;transition:opacity 1.2s ease;';
    // Inject keyframes
    const style = document.createElement('style');
    style.textContent = `@keyframes weatherRain { from{background-position:0 0} to{background-position:0 22px} }`;
    document.head.appendChild(style);
    document.body.appendChild(_weatherEl);
  }

  function _detect(text) {
    if (!text) return 'clear';
    const t = text.toLowerCase();
    if (/highstorm|stormwall|lightning/.test(t)) return 'storm';
    if (/rain|downpour|drizzle|wet/.test(t))     return 'rain';
    if (/ash|dust|smoke|haze/.test(t))           return 'ash';
    return 'clear';
  }

  window.WeatherSystem = {
    setWeather(type) {
      _mkEl();
      if (_current === type) return;
      _current = type;
      const s = WEATHER_STYLES[type] || WEATHER_STYLES.clear;
      Object.assign(_weatherEl.style, {
        background: s.background || '',
        backgroundSize: s.backgroundSize || '',
        animation: s.animation || 'none',
      });
      gsap.to(_weatherEl, { opacity: s.opacity || 0, duration: 1.5, ease: 'power2.inOut' });
    },
    detectFromText(text) { this.setWeather(_detect(text)); },
    clear() {
      if (!_weatherEl) return;
      _current = 'clear';
      gsap.to(_weatherEl, { opacity: 0, duration: 0.3, ease: 'power2.out', onComplete: () => {
        if (_weatherEl) { _weatherEl.style.background = ''; _weatherEl.style.animation = 'none'; }
      }});
    },
  };
})();

// ── NL-3. OATH PROGRESSION CEREMONY ──────────────────────────
// Full-screen GSAP cinematic sequence when an Ideal is spoken.
// Usage: OathCeremony.play(idealNumber, orderName, idealText)
(function _initOathCeremony() {
  window.OathCeremony = {
    play(idealNumber = 1, orderName = 'Windrunner', idealText = '') {
      // Overlay
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position:fixed;inset:0;z-index:10000;
        background:rgba(8,6,3,0.97);
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        pointer-events:all;opacity:0;
      `;

      // Glyph
      const glyph = document.createElement('div');
      glyph.textContent = '⟁';
      glyph.style.cssText = `
        font-family:var(--font-d);font-size:72px;
        color:var(--gold);text-align:center;
        text-shadow:0 0 60px rgba(201,168,76,0.8),0 0 120px rgba(201,168,76,0.4);
        opacity:0;transform:scale(0.5);
      `;

      // Order name
      const order = document.createElement('div');
      order.textContent = orderName.toUpperCase();
      order.style.cssText = `
        font-family:var(--font-d);font-size:11px;letter-spacing:6px;
        color:var(--gold-mid);margin-top:12px;opacity:0;
      `;

      // Ideal number label
      const label = document.createElement('div');
      label.textContent = `THE ${['FIRST','SECOND','THIRD','FOURTH','FIFTH'][idealNumber-1] || 'FIRST'} IDEAL`;
      label.style.cssText = `
        font-family:var(--font-d);font-size:9px;letter-spacing:8px;
        color:var(--text4);margin-top:8px;opacity:0;
      `;

      // Ideal text
      const words = document.createElement('div');
      words.textContent = `"${idealText || 'Life before death. Strength before weakness. Journey before destination.'}"`;
      words.style.cssText = `
        font-family:var(--font-b);font-size:22px;font-style:italic;
        color:var(--text2);text-align:center;max-width:560px;
        line-height:1.7;margin-top:32px;padding:0 24px;opacity:0;
      `;

      // "These Words are accepted." line
      const accepted = document.createElement('div');
      accepted.textContent = '"These Words are accepted."';
      accepted.style.cssText = `
        font-family:var(--font-d);font-size:13px;letter-spacing:2px;
        color:var(--gold-dim);margin-top:40px;opacity:0;
      `;

      // Dismiss hint
      const hint = document.createElement('div');
      hint.textContent = 'TAP TO CONTINUE';
      hint.style.cssText = `
        font-family:var(--font-d);font-size:9px;letter-spacing:4px;
        color:var(--text5);position:absolute;bottom:36px;opacity:0;
      `;

      overlay.append(glyph, order, label, words, accepted, hint);
      document.body.appendChild(overlay);

      const tl = gsap.timeline();
      tl.to(overlay,   { opacity: 1,               duration: 0.5 })
        .to(glyph,     { opacity: 1, scale: 1,      duration: 0.9, ease: 'elastic.out(1,0.7)' })
        .to(glyph,     { textShadow: '0 0 120px rgba(201,168,76,1),0 0 240px rgba(201,168,76,0.6)', duration: 0.6, ease:'power2.out', yoyo:true, repeat:1 }, '-=0.2')
        .to(order,     { opacity: 1,                duration: 0.5 }, '-=0.3')
        .to(label,     { opacity: 1,                duration: 0.4 }, '-=0.2')
        .to(words,     { opacity: 1, y: 0,          duration: 0.7, ease:'power2.out' }, '+=0.2')
        .to(accepted,  { opacity: 0.8,              duration: 0.6 }, '+=0.8')
        .to(hint,      { opacity: 0.4,              duration: 0.5 }, '+=1.0');

      // Particle burst on glyph
      setTimeout(() => window.stormlightParticles?.activate(), 300);

      // Dismiss on click
      const _dismiss = () => {
        gsap.to(overlay, { opacity: 0, duration: 0.5, onComplete: () => {
          overlay.remove();
          window.stormlightParticles?.deactivate();
        }});
      };
      overlay.addEventListener('click', _dismiss, { once: true });
      // Auto-dismiss after 9 seconds
      setTimeout(_dismiss, 9000);
    },
  };
})();

// ── NL-4. STORY TYPEWRITER MODE ───────────────────────────────
// Character-by-character text reveal for the GM story panel.
// Usage: TypewriterMode.reveal(element, text, onDone?)
//        TypewriterMode.enabled = true/false   (toggle in settings)
(function _initTypewriterMode() {
  let _enabled = false;
  let _currentAnim = null;

  window.TypewriterMode = {
    get enabled() { return _enabled; },
    set enabled(v) { _enabled = !!v; localStorage.setItem('sc_typewriter', v ? '1' : '0'); },

    /** Reveal HTML text content char-by-char in the given element. */
    reveal(el, html, onDone) {
      if (!el) { onDone?.(); return; }
      if (!_enabled) {
        el.innerHTML = html;
        onDone?.();
        return;
      }

      // Cancel any in-progress animation
      if (_currentAnim) { clearInterval(_currentAnim); _currentAnim = null; }

      // Strip HTML for typing; then re-render final HTML after
      const plain = html.replace(/<[^>]+>/g, '');
      let i = 0;
      el.textContent = '';

      // Type plain chars at ~28ms/char
      _currentAnim = setInterval(() => {
        if (i < plain.length) {
          el.textContent += plain[i++];
          // Auto-scroll to bottom of story panel
          const panel = el.closest('.chronicle-card, .story-body, #story-text');
          if (panel) panel.scrollTop = panel.scrollHeight;
        } else {
          clearInterval(_currentAnim);
          _currentAnim = null;
          // Swap to richly rendered HTML once typing is done
          el.innerHTML = html;
          onDone?.();
        }
      }, 22);
    },

    /** Skip to end immediately */
    skip() {
      if (_currentAnim) { clearInterval(_currentAnim); _currentAnim = null; }
    },
  };

  // Load saved preference
  _enabled = localStorage.getItem('sc_typewriter') === '1';
})();

// ── NL-5. PROCEDURAL AMBIENT CHORD (Web Audio API) ───────────
// Synthesizes a shifting ambient chord — calm outside combat,
// tense sustained tones when combat is active.
// Usage: AmbientAudio.startCombat() / .endCombat() / .setVolume(0-1)
(function _initAmbientAudio() {
  let _ctx = null, _gainNode = null, _oscillators = [], _active = false, _volume = 0.06;

  // Pentatonic scale frequencies — calm (Hz)
  const CALM_CHORD  = [55, 82.41, 110, 164.81];   // A1 E2 A2 E3
  const COMBAT_CHORD = [58.27, 87.31, 116.54, 155.56]; // Bb1 F2 Bb2 Eb3 (tense)

  function _ensureCtx() {
    if (_ctx) return true;
    try {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
      _gainNode = _ctx.createGain();
      _gainNode.gain.value = 0;
      _gainNode.connect(_ctx.destination);
      return true;
    } catch (e) { return false; }
  }

  function _buildChord(freqs) {
    _oscillators.forEach(o => { try { o.stop(); } catch(e){} });
    _oscillators = [];
    if (!_ctx || !_gainNode) return;

    freqs.forEach((freq, i) => {
      const osc = _ctx.createOscillator();
      const oscGain = _ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      // Slight detuning for warmth
      osc.detune.value = (i % 2 === 0 ? 1 : -1) * (2 + i * 0.5);
      oscGain.gain.value = 0.22 - i * 0.03;
      osc.connect(oscGain);
      oscGain.connect(_gainNode);
      osc.start();
      _oscillators.push(osc);
    });
  }

  function _fade(targetVol, duration = 2.0) {
    if (!_gainNode) return;
    _gainNode.gain.cancelScheduledValues(_ctx.currentTime);
    _gainNode.gain.linearRampToValueAtTime(targetVol, _ctx.currentTime + duration);
  }

  window.AmbientAudio = {
    start() {
      if (_active || !_ensureCtx()) return;
      if (_ctx.state === 'suspended') _ctx.resume();
      _buildChord(CALM_CHORD);
      _fade(_volume);
      _active = true;
    },
    startCombat() {
      if (!_ensureCtx()) return;
      if (_ctx.state === 'suspended') _ctx.resume();
      _buildChord(COMBAT_CHORD);
      _fade(_volume * 1.6, 1.2);
      _active = true;
    },
    endCombat() {
      if (!_active || !_ctx) return;
      _buildChord(CALM_CHORD);
      _fade(_volume, 2.5);
    },
    stop() {
      if (!_ctx) return;
      _fade(0, 1.0);
      setTimeout(() => {
        _oscillators.forEach(o => { try { o.stop(); } catch(e){} });
        _oscillators = [];
        _active = false;
      }, 1200);
    },
    setVolume(v) {
      _volume = Math.max(0, Math.min(1, v));
      if (_gainNode && _active) _fade(_volume, 0.5);
      localStorage.setItem('sc_ambient_vol', _volume);
    },
    get active() { return _active; },
  };

  // Load saved volume
  const saved = parseFloat(localStorage.getItem('sc_ambient_vol'));
  if (!isNaN(saved)) _volume = saved;
})();

// ── NL-6. GSAP MOTIONPATH SPREN COMPANION ────────────────────
// A spren SVG sprite that traces a lazy orbital path around the
// active player's combat card. Updates when the active card changes.
// Usage: SprenCompanion.attachTo(cardEl) / .detach()
(function _initSprenCompanion() {
  let _sprEl = null, _motionTween = null, _orbitTween = null;

  function _mkSpren() {
    if (_sprEl) return;
    _sprEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    _sprEl.setAttribute('viewBox', '0 0 24 24');
    _sprEl.style.cssText = `
      position:fixed;width:22px;height:22px;
      pointer-events:none;z-index:60;opacity:0;
      filter:drop-shadow(0 0 6px rgba(180,230,255,0.9));
    `;
    // Simple honorspren shape — glowing white-blue diamond
    _sprEl.innerHTML = `
      <polygon points="12,2 22,12 12,22 2,12" fill="rgba(200,235,255,0.85)" stroke="rgba(180,220,255,0.6)" stroke-width="0.8"/>
      <polygon points="12,5 19,12 12,19 5,12"  fill="rgba(220,245,255,0.5)"/>
      <circle cx="12" cy="12" r="2.2" fill="white" opacity="0.9"/>
    `;
    document.body.appendChild(_sprEl);
  }

  function _orbit(cardEl) {
    if (!cardEl || !_sprEl) return;
    // Get card bounds and place spren on a smooth elliptical orbit around it
    const update = () => {
      const rect = cardEl.getBoundingClientRect();
      if (!rect.width) return;
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const rx = rect.width  / 2 + 22;
      const ry = rect.height / 2 + 16;

      // Orbit using parametric t → x,y
      let angle = 0;
      if (_orbitTween) _orbitTween.kill();
      _orbitTween = gsap.to({ t: 0 }, {
        t: Math.PI * 2,
        duration: 5.5,
        ease: 'none',
        repeat: -1,
        onUpdate: function() {
          const t = this.targets()[0].t;
          const x = cx + Math.cos(t) * rx - 11;
          const y = cy + Math.sin(t) * ry - 11;
          gsap.set(_sprEl, { x, y });
        },
      });
    };
    update();
    // Refresh on resize / scroll
    window.addEventListener('resize', update, { passive: true });
  }

  window.SprenCompanion = {
    attachTo(cardEl) {
      _mkSpren();
      if (_orbitTween) _orbitTween.kill();
      gsap.killTweensOf(_sprEl);
      gsap.to(_sprEl, { opacity: 1, duration: 0.6, ease: 'power2.out' });
      _orbit(cardEl);
    },
    detach() {
      if (!_sprEl) return;
      if (_orbitTween) { _orbitTween.kill(); _orbitTween = null; }
      gsap.to(_sprEl, { opacity: 0, duration: 0.4, ease: 'power2.in' });
    },
    /** Call whenever the active card changes in combat. */
    updateActiveCard(cardEl) {
      if (!cardEl) { this.detach(); return; }
      this.attachTo(cardEl);
    },
  };
})();

// ── NL-7. WIRE UP SYSTEMS TO GAME EVENTS ─────────────────────
// Connect weather detection to story updates, particles to combat
// entrance, ambient audio to scene transitions, and spren companion
// to turn changes — so everything runs automatically.
window.addEventListener('load', () => {
  // ── Combat screen → activate weather + ambient + particles ──
  const _origShowScreen = window.showScreen;
  if (_origShowScreen) {
    // Already patched in section 3; hook via CustomEvent instead
    document.addEventListener('sc:screenChange', (e) => {
      const id = e.detail?.screen;
      if (id === 'combat') {
        // Only start ambient chord if Storm Audio is on — respect the user's audio toggle
        if (typeof audioOn !== 'undefined' && audioOn) AmbientAudio.startCombat();
        stormlightParticles.activate();
      } else if (id === 'game') {
        AmbientAudio.endCombat();
        stormlightParticles.deactivate();
        WeatherSystem.clear();
      } else if (id === 'title' || id === 'campaign') {
        AmbientAudio.stop();
        stormlightParticles.deactivate();
        WeatherSystem.clear();
      }
    });
  }

  // ── Story text update → weather detection (combat screen only) ──
  // Weather overlay only runs during combat — exploration text is too full of
  // Stormlight-world weather words to use for detection without false positives.
  const storyEl = document.getElementById('story-text');
  if (storyEl) {
    const storyObserver = new MutationObserver(() => {
      const onCombat = document.getElementById('s-combat')?.classList.contains('active');
      if (onCombat) WeatherSystem.detectFromText(storyEl.textContent);
      else WeatherSystem.clear();
    });
    storyObserver.observe(storyEl, { childList: true, subtree: true, characterData: true });
  }

  // ── Spren companion: follow active turn card ──
  document.addEventListener('sc:turnChange', (e) => {
    const card = e.detail?.cardEl || document.querySelector('.char-combat-card.active-turn');
    SprenCompanion.updateActiveCard(card);
  });

  // ── Rules engine events → UI feedback ──
  document.addEventListener('rules:attack', (e) => {
    const { result } = e.detail || {};
    if (!result) return;
    if (result.outcome === 'crit') window.animateCritHit?.(e.detail.cardEl);
    if (result.outcome === 'miss' || result.outcome === 'graze') return;
    window.animateDamageFlash?.();
  });

  document.addEventListener('rules:unconscious', (e) => {
    const card = e.detail?.cardEl;
    if (card) window.shakeCombatCard?.(card);
  });
});

// ── 11. BOOT ──────────────────────────────────────────────────
(async () => {
  applyLang();
  loadVoicePreference();

  // If on a hub screen (landing, worlds, wizard), let hub.js handle boot — don't load campaigns
  const _bootHash = (window.location.hash || '').split('?')[0];
  if (!_bootHash || _bootHash === '#landing' || _bootHash === '#worlds' || _bootHash === '#wizard') {
    return; // Hub boot handled by hub.js
  }

  // Show campaign screen
  showScreen('campaign');

  // Load campaigns
  try {
    await tok();
    const camps = await listCampaigns();
    renderCampaigns(camps);
    document.getElementById('camp-status').textContent = '';
  } catch (e) {
    document.getElementById('camp-status').textContent = 'Connecting... ' + e.message;
  }

  // Init parallax after first render
  setTimeout(initParallax, 600);
})();
