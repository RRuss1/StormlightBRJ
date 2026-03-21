/**
 * ============================================================
 * app/main.js — Application Bootstrap + GSAP Animation System
 * Stormlight Chronicles
 * ============================================================
 * Responsibilities:
 *   1. Initialize Lenis smooth scroll
 *   2. Register GSAP plugins
 *   3. Set up screen transition system
 *   4. Animate campaign screen entrance
 *   5. Wire staggered card reveals via MutationObserver
 *   6. Boot the application (applyLang + showScreen campaign)
 * ============================================================
 */

// ── 1. LENIS SMOOTH SCROLL ────────────────────────────────────
let lenis;
window.addEventListener('load', () => {
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.2,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });
    function rafLenis(time) {
      lenis.raf(time);
      requestAnimationFrame(rafLenis);
    }
    requestAnimationFrame(rafLenis);
  }
});

// ── 2. GSAP PLUGIN REGISTRATION ──────────────────────────────
gsap.registerPlugin(ScrollTrigger);

// ── 3. SCREEN TRANSITION SYSTEM ──────────────────────────────
// Patch showScreen() after game JS loads so every screen change
// gets a smooth fade+slide entrance.
window.addEventListener('load', () => {
  if (!window.showScreen) return;

  const _orig = window.showScreen;
  window.showScreen = function(id) {
    _orig(id);
    const el = document.getElementById('s-' + id);
    if (!el) return;

    // Kill any in-progress animation on this element
    gsap.killTweensOf(el);

    // Entrance animation — fast and smooth
    gsap.fromTo(el,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', clearProps: 'all' }
    );

    // Screen-specific entrance sequences
    switch (id) {
      case 'campaign':
        _animateCampaignScreen();
        break;
      case 'title':
        _animateTitleScreen();
        break;
      case 'create':
        _animateCreateScreen();
        break;
      case 'lobby':
        _animateLobbyScreen();
        break;
      case 'game':
        _animateGameScreen();
        break;
      case 'combat':
        _animateCombatScreen();
        break;
    }
  };
});

// ── 4. SCREEN-SPECIFIC ENTRANCE ANIMATIONS ───────────────────

function _animateCampaignScreen() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  // Title elements stagger in
  tl.from('#s-campaign .title-h1',  { opacity: 0, y: 30, duration: 0.7, delay: 0.1 })
    .from('#s-campaign .title-h2',  { opacity: 0, y: 20, duration: 0.5 }, '-=0.4')
    .from('#s-campaign .title-line',{ opacity: 0, scaleX: 0, duration: 0.6, transformOrigin: 'center' }, '-=0.3');

  // Campaign cards stagger in via MutationObserver (they're rendered async)
  const grid = document.getElementById('camp-grid');
  if (grid) {
    const observer = new MutationObserver(() => {
      const cards = grid.querySelectorAll('.camp-card');
      if (cards.length > 0) {
        gsap.from(cards, {
          opacity: 0,
          y: 24,
          scale: 0.96,
          duration: 0.45,
          stagger: 0.06,
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
  tl.from('#s-title .title-glyph', { opacity: 0, scale: 0.8, duration: 0.6, delay: 0.05 })
    .from('#s-title .title-h1',    { opacity: 0, y: 20, duration: 0.55 }, '-=0.3')
    .from('#s-title .title-h2',    { opacity: 0, y: 16, duration: 0.4 }, '-=0.3')
    .from('#s-title .title-line',  { opacity: 0, scaleX: 0, duration: 0.5, transformOrigin: 'center' }, '-=0.25')
    .from('#s-title .title-quote', { opacity: 0, y: 12, duration: 0.4 }, '-=0.2')
    .from('#s-title .psz-wrap',    { opacity: 0, y: 10, duration: 0.4 }, '-=0.1')
    .from('#s-title .btn',         { opacity: 0, y: 8, duration: 0.35, stagger: 0.08 }, '-=0.2');
}

function _animateCreateScreen() {
  gsap.from('#s-create .create-wrap', {
    opacity: 0, y: 16, duration: 0.4, ease: 'power2.out', delay: 0.05,
  });
  gsap.from('#create-steps .step-dot', {
    opacity: 0, scale: 0, duration: 0.3, stagger: 0.05, ease: 'back.out(2)', delay: 0.15,
  });
}

function _animateLobbyScreen() {
  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
  tl.from('#s-lobby .lobby-wrap > *', {
    opacity: 0, y: 14, duration: 0.4, stagger: 0.07, delay: 0.05,
  });
}

function _animateGameScreen() {
  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
  tl.from('.game-top',     { opacity: 0, y: -8, duration: 0.3, delay: 0.05 })
    .from('.party-strip',  { opacity: 0, y: -6, duration: 0.3 }, '-=0.15')
    .from('.chronicle-card',{ opacity: 0, y: 12, duration: 0.4 }, '-=0.15')
    .from('.side-panel',   { opacity: 0, x: -10, duration: 0.35, stagger: 0.1 }, '-=0.25');
}

function _animateCombatScreen() {
  // Dramatic red flash + elements flying in
  gsap.fromTo('body', { '--combat-overlay': '0.15' }, { '--combat-overlay': '0', duration: 0.5 });

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('.combat-top',        { opacity: 0, y: -8, duration: 0.3, delay: 0.05 })
    .from('.combat-party-col .char-combat-card', {
      opacity: 0, x: -20, duration: 0.4, stagger: 0.08,
    }, '-=0.1')
    .from('.combat-enemy-col .char-combat-card', {
      opacity: 0, x: 20, duration: 0.4, stagger: 0.08,
    }, '-=0.4')
    .from('.combat-narrative', { opacity: 0, y: 10, duration: 0.35 }, '-=0.2');
}

// ── 5. COMBAT FEEDBACK ANIMATIONS ────────────────────────────

/**
 * Flash a damage/heal number over a character pip.
 * Called from animateHPChange() in ui.js
 */
window.animateFloatText = function(element, text, isHeal) {
  if (!element) return;
  const float = document.createElement('div');
  float.textContent = text;
  float.style.cssText = `
    position: absolute;
    top: 0; left: 50%;
    transform: translateX(-50%);
    font-family: var(--font-d);
    font-size: 14px;
    font-weight: 700;
    color: ${isHeal ? 'var(--teal2)' : 'var(--coral2)'};
    pointer-events: none;
    z-index: 100;
    white-space: nowrap;
  `;
  element.style.position = 'relative';
  element.appendChild(float);

  gsap.fromTo(float,
    { opacity: 1, y: 0 },
    {
      opacity: 0,
      y: -32,
      duration: 0.9,
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
      x: gsap.utils.wrap([-6, 5, -4, 4, 0]),
      duration: 0.4,
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
      boxShadow: '0 0 0 4px rgba(29,122,92,0.5), 0 0 20px rgba(29,122,92,0.2)',
      duration: 0.3,
      yoyo: true,
      repeat: 1,
      ease: 'power2.out',
      clearProps: 'boxShadow',
    }
  );
};

// ── 6. CHOICE REVEAL ANIMATION ───────────────────────────────
/**
 * Animate combat/exploration choice buttons appearing.
 * Called after choices are injected into the DOM.
 */
window.animateChoicesIn = function(container) {
  if (!container) return;
  const choices = container.querySelectorAll('.achoice');
  if (!choices.length) return;
  gsap.from(choices, {
    opacity: 0,
    y: 10,
    scale: 0.97,
    duration: 0.3,
    stagger: 0.05,
    ease: 'power2.out',
    clearProps: 'all',
  });
};

// ── 7. STORY TEXT REVEAL ──────────────────────────────────────
/**
 * Animate new story text appearing (called from renderStory).
 */
window.animateStoryReveal = function(el) {
  if (!el) return;
  gsap.fromTo(el,
    { opacity: 0, y: 8 },
    { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', clearProps: 'all' }
  );
};

// ── 8. PARALLAX ───────────────────────────────────────────────
function initParallax() {
  const card = document.querySelector('.chronicle-card');
  if (!card || window.innerWidth < 900) return;

  // GSAP ScrollTrigger parallax on the chronicle card background
  gsap.to(card, {
    backgroundPosition: '52% 48%',
    ease: 'none',
    scrollTrigger: {
      trigger: card,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
    },
  });
}

// ── 9. TOAST NOTIFICATION ────────────────────────────────────
// Enhanced with GSAP — replaces the CSS animation version
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
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  gsap.timeline()
    .to(toast, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' })
    .to(toast, { opacity: 0, y: -8, duration: 0.3, ease: 'power2.in', delay: 2.4,
        onComplete: () => toast.remove() });
};

// ── 10. BOOT ─────────────────────────────────────────────────
(async () => {
  // Apply stored language
  applyLang();
  loadVoicePreference();

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
