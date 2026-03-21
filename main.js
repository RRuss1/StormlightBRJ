/**
 * ============================================================
 * app/main.js — Application Bootstrap + GSAP Animation System
 * Stormlight Chronicles  ·  v2.0
 * ============================================================
 * Responsibilities:
 *   1. Initialize Lenis smooth scroll
 *   2. Register GSAP plugins
 *   3. Set up screen transition system (with tl reuse)
 *   4. Screen-specific entrance animations
 *   5. Skeleton loaders for async content
 *   6. Combat feedback animations (float text, shake, heal)
 *   7. Toast notifications
 *   8. Boot the application
 * ============================================================
 */

// ── 1. LENIS SMOOTH SCROLL ────────────────────────────────────
let lenis;

window.addEventListener('load', () => {
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration:     1.15,
      easing:       t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation:  'vertical',
      smoothWheel:  true,
      syncTouch:    false,   // don't fight native mobile momentum
    });

    // Single rAF loop — no closure allocation per frame
    function _rafLenis(time) {
      lenis.raf(time);
      requestAnimationFrame(_rafLenis);
    }
    requestAnimationFrame(_rafLenis);

    // Keep GSAP ScrollTrigger in sync
    lenis.on('scroll', ScrollTrigger.update);
  }
});

// ── 2. GSAP PLUGIN REGISTRATION ──────────────────────────────
gsap.registerPlugin(ScrollTrigger);

// ── 3. SCREEN TRANSITION SYSTEM ──────────────────────────────
// Timeline cache — reuse instead of recreating every transition
const _screenTls = {};

window.addEventListener('load', () => {
  if (!window.showScreen) return;

  const _orig = window.showScreen;
  window.showScreen = function(id) {
    _orig(id);

    const el = document.getElementById('s-' + id);
    if (!el) return;

    // Kill stale tweens on the target element
    gsap.killTweensOf(el);

    // Entrance animation — fast, GPU only (opacity + transform)
    gsap.fromTo(el,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out', clearProps: 'transform' }
    );

    // Screen-specific sequences (each lazily creates its timeline)
    switch (id) {
      case 'campaign': _animateCampaignScreen(); break;
      case 'title':    _animateTitleScreen();    break;
      case 'create':   _animateCreateScreen();   break;
      case 'lobby':    _animateLobbyScreen();    break;
      case 'game':     _animateGameScreen();     break;
      case 'combat':   _animateCombatScreen();   break;
    }
  };
});

// ── 4. SCREEN ENTRANCE ANIMATIONS ────────────────────────────

function _animateCampaignScreen() {
  // Kill and rebuild — campaign may be re-entered multiple times
  if (_screenTls.campaign) _screenTls.campaign.kill();

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  _screenTls.campaign = tl;

  tl.from('#s-campaign .title-glyph', { opacity:0, scale:0.82, duration:0.55, delay:0.05 })
    .from('#s-campaign .title-h1',    { opacity:0, y:22,        duration:0.55 }, '-=0.3')
    .from('#s-campaign .title-h2',    { opacity:0, y:14,        duration:0.4  }, '-=0.35')
    .from('#s-campaign .title-line',  { opacity:0, scaleX:0,    duration:0.5,
                                        transformOrigin:'center' }, '-=0.3');

  // Campaign cards — watch for async render via MutationObserver
  const grid = document.getElementById('camp-grid');
  if (!grid) return;

  // Show skeleton loaders immediately while real cards load
  _showCampaignSkeletons(grid);

  let _gridObserver;
  const _kickCards = () => {
    const cards = grid.querySelectorAll('.camp-card:not(.skeleton-card)');
    if (cards.length > 0) {
      gsap.from(cards, {
        opacity: 0,
        y: 20,
        scale: 0.97,
        duration: 0.4,
        stagger: 0.055,
        ease: 'power3.out',
        clearProps: 'all',
      });
      if (_gridObserver) _gridObserver.disconnect();
    }
  };

  // Cards may already be there (re-entry) or coming soon
  if (grid.querySelectorAll('.camp-card:not(.skeleton-card)').length) {
    _kickCards();
  } else {
    _gridObserver = new MutationObserver(_kickCards);
    _gridObserver.observe(grid, { childList: true, subtree: false });
  }
}

function _showCampaignSkeletons(grid) {
  // Don't add if real cards are already present
  if (grid.querySelector('.camp-card:not(.skeleton-card)')) return;
  if (grid.querySelector('.skeleton-card')) return;

  const frag = document.createDocumentFragment();
  for (let i = 0; i < 3; i++) {
    const s = document.createElement('div');
    s.className = 'skeleton skeleton-card';
    frag.appendChild(s);
  }
  grid.appendChild(frag);
}

function _animateTitleScreen() {
  if (_screenTls.title) _screenTls.title.kill();

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  _screenTls.title = tl;

  tl.from('#s-title .title-glyph', { opacity:0, scale:0.78, duration:0.6, delay:0.04 })
    .from('#s-title .title-h1',    { opacity:0, y:18,       duration:0.5  }, '-=0.3')
    .from('#s-title .title-h2',    { opacity:0, y:12,       duration:0.38 }, '-=0.28')
    .from('#s-title .title-line',  { opacity:0, scaleX:0,   duration:0.45,
                                     transformOrigin:'center' }, '-=0.24')
    .from('#s-title .title-quote', { opacity:0, y:10,       duration:0.38 }, '-=0.2')
    .from('#s-title .psz-wrap',    { opacity:0, y:8,        duration:0.35 }, '-=0.1')
    .from('#s-title .btn',         { opacity:0, y:6,        duration:0.3,
                                     stagger:0.07 }, '-=0.18');
}

function _animateCreateScreen() {
  if (_screenTls.create) _screenTls.create.kill();

  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
  _screenTls.create = tl;

  tl.from('#s-create .create-wrap', { opacity:0, y:14, duration:0.38, delay:0.04 })
    .from('#create-steps .step-dot', {
      opacity: 0, scale: 0, duration: 0.28,
      stagger: 0.05, ease: 'back.out(2.5)',
    }, '-=0.22');
}

function _animateLobbyScreen() {
  if (_screenTls.lobby) _screenTls.lobby.kill();

  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
  _screenTls.lobby = tl;

  tl.from('#s-lobby .lobby-wrap > *', {
    opacity: 0, y: 12, duration: 0.36, stagger: 0.065, delay: 0.04,
  });
}

function _animateGameScreen() {
  if (_screenTls.game) _screenTls.game.kill();

  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
  _screenTls.game = tl;

  tl.from('.game-top',        { opacity:0, y:-7,   duration:0.28, delay:0.04 })
    .from('.party-strip',     { opacity:0, y:-5,   duration:0.26 }, '-=0.14')
    .from('.chronicle-card',  { opacity:0, y:10,   duration:0.36 }, '-=0.14')
    .from('.side-panel',      { opacity:0, x:-8,   duration:0.32, stagger:0.09 }, '-=0.22');
}

function _animateCombatScreen() {
  if (_screenTls.combat) _screenTls.combat.kill();

  // Dramatic blood-red flash on screen enter
  gsap.fromTo(document.body,
    { '--combat-vignette': '1' },
    { '--combat-vignette': '0', duration: 0.6, ease: 'power2.out',
      onComplete: () => document.body.style.removeProperty('--combat-vignette') }
  );

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  _screenTls.combat = tl;

  tl.from('.combat-top', { opacity:0, y:-7, duration:0.26, delay:0.04 })
    .from('.combat-party-col .char-combat-card', {
      opacity:0, x:-18, duration:0.36, stagger:0.07,
    }, '-=0.1')
    .from('.combat-enemy-col .char-combat-card', {
      opacity:0, x: 18, duration:0.36, stagger:0.07,
    }, '-=0.38')
    .from('.combat-narrative', { opacity:0, y:8, duration:0.3 }, '-=0.2');
}

// ── 5. COMBAT FEEDBACK ANIMATIONS ────────────────────────────

/**
 * Float a damage/heal number above an element.
 * GPU only: opacity + transform.
 */
window.animateFloatText = function(element, text, isHeal) {
  if (!element) return;

  const float = document.createElement('div');
  float.textContent = text;
  float.style.cssText = `
    position:absolute;
    top:0;left:50%;
    transform:translateX(-50%);
    font-family:var(--font-d);
    font-size:13px;
    font-weight:700;
    color:${isHeal ? 'var(--teal2)' : 'var(--coral2)'};
    pointer-events:none;
    z-index:100;
    white-space:nowrap;
    will-change:opacity,transform;
  `;

  // Ensure positioning context without triggering layout
  const pos = getComputedStyle(element).position;
  if (pos === 'static') element.style.position = 'relative';
  element.appendChild(float);

  gsap.fromTo(float,
    { opacity: 1, y: 0, scale: 1 },
    {
      opacity: 0,
      y: -34,
      scale: 0.82,
      duration: 0.85,
      ease: 'power2.out',
      onComplete: () => float.remove(),
    }
  );
};

/**
 * Shake a combat card on damage. GPU only (translateX).
 */
window.shakeCombatCard = function(cardEl) {
  if (!cardEl) return;

  // Prevent stacking shakes
  gsap.killTweensOf(cardEl, 'x');

  gsap.to(cardEl, {
    keyframes: [
      { x: -5, duration: 0.06 },
      { x:  5, duration: 0.06 },
      { x: -4, duration: 0.06 },
      { x:  4, duration: 0.06 },
      { x: -2, duration: 0.06 },
      { x:  0, duration: 0.06 },
    ],
    ease: 'none',
    clearProps: 'x',
  });
};

/**
 * Heal shimmer — opacity flash on a GPU layer.
 */
window.healShimmerCard = function(cardEl) {
  if (!cardEl) return;

  gsap.killTweensOf(cardEl, 'opacity');

  gsap.fromTo(cardEl,
    { '--heal-glow': '0' },
    {
      '--heal-glow': '1',
      duration: 0.3,
      yoyo: true,
      repeat: 1,
      ease: 'power2.out',
      clearProps: '--heal-glow',
      // Fallback: briefly brighten without CSS var support
      onStart() {
        cardEl.classList.add('_heal-active');
      },
      onComplete() {
        cardEl.classList.remove('_heal-active');
      },
    }
  );
};

// ── 6. CHOICE REVEAL ─────────────────────────────────────────
/**
 * Stagger-animate choice buttons into view.
 */
window.animateChoicesIn = function(container) {
  if (!container) return;
  const choices = container.querySelectorAll('.achoice');
  if (!choices.length) return;

  gsap.from(choices, {
    opacity: 0,
    y: 9,
    scale: 0.97,
    duration: 0.28,
    stagger: 0.045,
    ease: 'power2.out',
    clearProps: 'all',
  });
};

// ── 7. STORY TEXT REVEAL ──────────────────────────────────────
window.animateStoryReveal = function(el) {
  if (!el) return;
  gsap.fromTo(el,
    { opacity: 0, y: 7 },
    { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', clearProps: 'all' }
  );
};

// ── 8. PARALLAX ───────────────────────────────────────────────
// Debounced parallax init — only runs once, only on desktop
let _parallaxInited = false;

function initParallax() {
  if (_parallaxInited || window.innerWidth < 900) return;
  const card = document.querySelector('.chronicle-card');
  if (!card) return;

  _parallaxInited = true;

  ScrollTrigger.create({
    trigger: card,
    start: 'top bottom',
    end: 'bottom top',
    scrub: 0.5,
    onUpdate: self => {
      // Transform only — no backgroundPosition (triggers layout in some engines)
      gsap.set(card, { backgroundPositionY: `${50 + self.progress * 8}%` });
    },
  });
}

// ── 9. TOAST NOTIFICATION ────────────────────────────────────
window.showToastGSAP = function(message) {
  // Dismiss any existing toast instantly
  const existing = document.querySelector('.sc-toast');
  if (existing) {
    gsap.killTweensOf(existing);
    existing.remove();
  }

  const toast = document.createElement('div');
  toast.className = 'sc-toast';
  toast.style.cssText = `
    position:fixed;
    bottom:76px;left:50%;
    transform:translateX(-50%) translateY(10px);
    background:rgba(24,20,12,0.95);
    border:1px solid var(--border3);
    border-radius:20px;
    padding:7px 18px;
    font-family:var(--font-d);
    font-size:10px;
    letter-spacing:1.2px;
    color:var(--text3);
    z-index:9999;
    pointer-events:none;
    opacity:0;
    backdrop-filter:blur(16px);
    -webkit-backdrop-filter:blur(16px);
    box-shadow:0 4px 24px rgba(0,0,0,0.5);
    will-change:opacity,transform;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  gsap.timeline()
    .to(toast, { opacity:1, y:0, duration:0.25, ease:'power2.out' })
    .to(toast, { opacity:0, y:-6, duration:0.25, ease:'power2.in',
        delay:2.2, onComplete:() => toast.remove() });
};

// ── 10. LOADING STATE HELPERS ─────────────────────────────────

/**
 * Set a button into a loading/disabled state with optional label swap.
 */
window.setButtonLoading = function(btn, loading, loadingText) {
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn._origText = btn.innerHTML;
    if (loadingText) btn.innerHTML = loadingText;
    btn.style.opacity = '0.55';
    btn.style.cursor = 'not-allowed';
  } else {
    btn.disabled = false;
    if (btn._origText) btn.innerHTML = btn._origText;
    btn.style.opacity = '';
    btn.style.cursor = '';
  }
};

/**
 * Animate an HP bar update. Uses scaleX on .hp-fill for GPU compositing.
 */
window.animateHPBar = function(fillEl, fromPct, toPct) {
  if (!fillEl) return;
  gsap.fromTo(fillEl,
    { scaleX: fromPct / 100 },
    { scaleX: toPct  / 100, duration: 0.5, ease: 'power2.out',
      transformOrigin: 'left center' }
  );
};

// ── 11. BOOT ─────────────────────────────────────────────────
(async () => {
  // Apply stored language + voice preference
  applyLang();
  loadVoicePreference();

  // Show campaign screen
  showScreen('campaign');

  // Init parallax after game layout renders
  setTimeout(initParallax, 800);

  // Load campaigns
  try {
    await tok();
    const camps = await listCampaigns();
    renderCampaigns(camps);
    document.getElementById('camp-status').textContent = '';
  } catch (e) {
    document.getElementById('camp-status').textContent = 'Connecting... ' + e.message;
  }
})();
