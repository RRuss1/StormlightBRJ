/**
 * ============================================================
 * app/auth.js — Authentication UI & Logic
 * CYOAhub
 * ============================================================
 * Handles:
 *   - Login / Register / Forgot Password modal
 *   - JWT session management (localStorage)
 *   - Auth API client (register, login, me, etc.)
 *   - User pill in nav bar
 *   - Ownership claiming
 *   - Invite system
 * ============================================================
 */
(function () {
  // ── STATE ────────────────────────────────────────────────────
  const TOKEN_KEY = 'cyoa_auth_token';
  let _currentUser = null; // { id, username, displayName, email, avatarUrl }

  // ── HELPERS ──────────────────────────────────────────────────
  function _token() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function _headers(json) {
    const h = { Accept: 'application/json' };
    if (json) h['Content-Type'] = 'application/json';
    const t = _token();
    if (t) h['Authorization'] = 'Bearer ' + t;
    return h;
  }

  async function authFetch(path, opts = {}) {
    opts.headers = Object.assign(_headers(!!opts.body && typeof opts.body === 'string'), opts.headers || {});
    const res = await fetch(PROXY_URL + path, opts);
    return res;
  }

  async function _json(path, method, body) {
    const res = await authFetch(path, {
      method,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || `Request failed (${res.status})`);
    return data;
  }

  // ── API CLIENT ───────────────────────────────────────────────
  async function authRegister(username, email, password, displayName) {
    const data = await _json('/db/auth/register', 'POST', {
      username,
      email: email || undefined,
      password,
      displayName: displayName || username,
    });
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      _currentUser = data.user;
    }
    return data;
  }

  async function authLogin(username, password) {
    const data = await _json('/db/auth/login', 'POST', { username, password });
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      _currentUser = data.user;
    }
    return data;
  }

  async function authGoogle(credential) {
    const data = await _json('/db/auth/google', 'POST', { credential });
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      _currentUser = data.user;
    }
    return data;
  }

  function _initGoogleButton() {
    if (!window.google || !window.google.accounts || !window.GOOGLE_CLIENT_ID) return;
    // Google will call this globally when user picks an account
    window._handleGoogleCredential = async function (response) {
      const errEl = document.querySelector('#auth-modal .auth-error');
      try {
        const data = await authGoogle(response.credential);
        if (data.error) {
          if (errEl) errEl.textContent = data.error;
          return;
        }
        _offerClaimOwnership();
        hideAuthModal();
        renderAuthUI();
      } catch (e) {
        if (errEl) errEl.textContent = 'Google sign-in failed.';
      }
    };
  }

  async function authGetMe() {
    const data = await _json('/db/auth/me', 'GET');
    const u = data.user || data;
    // Map snake_case DB fields to camelCase
    _currentUser = {
      id: u.id,
      username: u.username,
      displayName: u.display_name || u.displayName || u.username,
      email: u.email,
      avatarUrl: u.avatar_url || u.avatarUrl || '',
    };
    return _currentUser;
  }

  async function authChangePassword(currentPassword, newPassword) {
    return _json('/db/auth/change-password', 'POST', { currentPassword, newPassword });
  }

  async function authForgotPassword(email) {
    return _json('/db/auth/forgot-password', 'POST', { email });
  }

  async function authDeleteAccount() {
    const data = await _json('/db/auth/account', 'DELETE');
    localStorage.removeItem(TOKEN_KEY);
    _currentUser = null;
    return data;
  }

  async function authUpdateProfile(displayName, avatarUrl) {
    const data = await _json('/db/auth/profile', 'PUT', { displayName, avatarUrl });
    if (data.user) _currentUser = data.user;
    return data;
  }

  async function authClaimOwnership(campaignIds, worldIds) {
    return _json('/db/auth/claim', 'POST', { campaignIds, worldIds });
  }

  // ── SESSION ──────────────────────────────────────────────────
  async function initAuth() {
    const t = _token();
    if (!t) {
      _currentUser = null;
      renderAuthUI();
      return;
    }
    try {
      await authGetMe();
      window.currentUser = _currentUser;
    } catch (e) {
      console.warn('Auth token invalid, clearing:', e.message);
      localStorage.removeItem(TOKEN_KEY);
      _currentUser = null;
    }
    renderAuthUI();
  }

  function isLoggedIn() {
    return !!_currentUser;
  }
  function getCurrentUser() {
    return _currentUser;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    _currentUser = null;
    window.currentUser = null;
    renderAuthUI();
  }

  // ── INVITE SYSTEM ────────────────────────────────────────────
  async function createInvite(campaignId, maxUses, expiresInHours) {
    return _json('/db/invite/create', 'POST', { campaignId, maxUses, expiresInHours });
  }

  async function validateInvite(token) {
    return _json('/db/invite/' + encodeURIComponent(token), 'GET');
  }

  async function joinViaInvite(token, displayName) {
    return _json('/db/invite/' + encodeURIComponent(token) + '/join', 'POST', { displayName });
  }

  // ── INJECT CSS ───────────────────────────────────────────────
  function _injectStyles() {
    if (document.getElementById('auth-styles')) return;
    const s = document.createElement('style');
    s.id = 'auth-styles';
    s.textContent = `
/* ── Auth Modal ── */
#auth-modal {
  position:fixed; inset:0; z-index:200;
  background:rgba(0,0,0,0.7);
  backdrop-filter:blur(8px);
  display:flex; align-items:center; justify-content:center;
  padding:24px;
}
#auth-modal[hidden]{ display:none; }
#auth-modal .auth-box {
  position:relative;
  max-width:420px; width:100%;
  background:rgba(5,12,26,0.92);
  backdrop-filter:blur(30px);
  border:1px solid rgba(40,168,160,0.13);
  border-radius:22px;
  box-shadow:0 20px 80px rgba(0,0,0,0.6),0 0 30px rgba(40,168,160,0.06);
  padding:36px 32px 28px;
  color:#F0E6CC;
  font-family:'Crimson Pro',serif;
}
#auth-modal .auth-close {
  position:absolute; top:14px; right:18px;
  font-size:24px; color:rgba(255,255,255,0.4);
  background:none; border:none; cursor:pointer; transition:color .2s;
}
#auth-modal .auth-close:hover { color:#F8F3E8; }
#auth-modal h2 {
  font-family:'Cinzel',serif; font-size:22px; color:#F8F3E8;
  text-align:center; margin:0 0 22px; letter-spacing:1px;
}
#auth-modal label {
  display:block; font-size:13px; color:#DFC080;
  margin-bottom:4px; margin-top:14px; letter-spacing:0.5px;
}
#auth-modal input[type="text"],
#auth-modal input[type="email"],
#auth-modal input[type="password"] {
  width:100%; box-sizing:border-box;
  background:#111; color:#F0E6CC;
  border:1px solid rgba(40,168,160,0.18);
  border-radius:8px; padding:10px 12px;
  font-size:15px; font-family:'Crimson Pro',serif;
  outline:none; transition:border-color .2s;
}
#auth-modal input:focus {
  border-color:rgba(40,168,160,0.5);
}
#auth-modal .auth-btn {
  display:block; width:100%; margin-top:22px;
  padding:11px 0; border:none; border-radius:10px;
  font-family:'Cinzel',serif; font-size:15px;
  cursor:pointer; transition:opacity .2s, transform .1s;
  letter-spacing:0.5px;
}
#auth-modal .auth-btn:active { transform:scale(0.98); }
#auth-modal .auth-btn.primary {
  background:var(--primary,#28a8a0); color:#050c1a;
  font-weight:600;
}
#auth-modal .auth-btn.primary:hover { opacity:0.88; }
#auth-modal .auth-btn.secondary {
  background:var(--border2,rgba(40,168,160,0.13)); color:#F0E6CC;
  margin-top:10px;
}
#auth-modal .auth-btn.secondary:hover { opacity:0.8; }
#auth-modal .auth-link {
  display:block; text-align:center; margin-top:16px;
  font-size:13px; color:#8ab4d4; cursor:pointer;
  background:none; border:none; font-family:'Crimson Pro',serif;
  text-decoration:underline; text-underline-offset:2px;
}
#auth-modal .auth-link:hover { color:#F8F3E8; }
#auth-modal .auth-error {
  color:#B03828; font-size:13px; text-align:center;
  margin-top:12px; min-height:18px;
}
#auth-modal .auth-success {
  color:#28a8a0; font-size:13px; text-align:center;
  margin-top:12px; min-height:18px;
}
/* ── User pill ── */
.auth-pill {
  display:flex; align-items:center; gap:6px;
  position:relative; cursor:pointer;
  font-family:'Crimson Pro',serif; font-size:18px;
  color:#F0E6CC; padding:5px 14px;
  border:1px solid rgba(40,168,160,0.18);
  border-radius:14px; background:rgba(5,12,26,0.7);
  backdrop-filter:blur(12px);
  transition:border-color .2s;
  white-space:nowrap;
}
.auth-pill:hover { border-color:rgba(40,168,160,0.4); }
.auth-pill-dd {
  display:none; position:absolute; top:calc(100% + 6px); right:0;
  min-width:130px; background:rgba(5,12,26,0.95);
  border:1px solid rgba(40,168,160,0.18);
  border-radius:10px; padding:6px 0; z-index:210;
  box-shadow:0 8px 30px rgba(0,0,0,0.5);
}
.auth-pill.open .auth-pill-dd { display:block; }
.auth-pill-dd button {
  display:block; width:100%; text-align:left;
  padding:8px 16px; background:none; border:none;
  color:#F0E6CC; font-family:'Crimson Pro',serif;
  font-size:18px; cursor:pointer; transition:background .15s;
}
.auth-pill-dd button:hover {
  background:rgba(40,168,160,0.12);
}
.auth-signin-btn {
  font-family:'Crimson Pro',serif; font-size:18px;
  color:#8ab4d4; background:none; border:1px solid rgba(40,168,160,0.18);
  border-radius:10px; padding:5px 14px; cursor:pointer;
  transition:border-color .2s, color .2s; white-space:nowrap;
}
.auth-signin-btn:hover { border-color:rgba(40,168,160,0.4); color:#F8F3E8; }
`;
    document.head.appendChild(s);
  }

  // ── INJECT MODAL HTML ────────────────────────────────────────
  function _injectModal() {
    if (document.getElementById('auth-modal')) return;
    const div = document.createElement('div');
    div.id = 'auth-modal';
    div.hidden = true;
    div.onclick = function (e) {
      if (e.target === this) hideAuthModal();
    };
    div.innerHTML = `
<div class="auth-box">
  <button class="auth-close" onclick="Auth.hideModal()">&times;</button>
  <div id="auth-view-login">
    <h2>Sign In</h2>
    <div id="auth-google-btn-wrap" style="display:flex;justify-content:center;margin-bottom:14px;"></div>
    <div style="display:flex;align-items:center;gap:12px;margin:10px 0 14px;">
      <div style="flex:1;height:1px;background:rgba(40,168,160,0.15);"></div>
      <span style="font-size:11px;color:rgba(255,255,255,0.3);font-family:var(--font-d,monospace);letter-spacing:2px;">OR</span>
      <div style="flex:1;height:1px;background:rgba(40,168,160,0.15);"></div>
    </div>
    <label>Username or Email</label>
    <input type="text" id="auth-login-user" autocomplete="username" />
    <label>Password</label>
    <input type="password" id="auth-login-pass" autocomplete="current-password" />
    <button class="auth-btn primary" id="auth-login-btn">Sign In</button>
    <div class="auth-error" id="auth-login-err"></div>
    <button class="auth-link" id="auth-goto-forgot">Forgot password?</button>
    <button class="auth-link" id="auth-goto-register-from-login">Don't have an account? Register</button>
  </div>
  <div id="auth-view-register" style="display:none">
    <h2>Create Account</h2>
    <label>Username</label>
    <input type="text" id="auth-reg-user" autocomplete="username" />
    <label>Email</label>
    <input type="email" id="auth-reg-email" autocomplete="email" />
    <label>Display Name</label>
    <input type="text" id="auth-reg-display" autocomplete="name" />
    <label>Password</label>
    <input type="password" id="auth-reg-pass" autocomplete="new-password" />
    <label>Confirm Password</label>
    <input type="password" id="auth-reg-pass2" autocomplete="new-password" />
    <button class="auth-btn primary" id="auth-reg-btn">Create Account</button>
    <div class="auth-error" id="auth-reg-err"></div>
    <button class="auth-link" id="auth-goto-login-from-register">Already have an account? Sign In</button>
  </div>
  <div id="auth-view-forgot" style="display:none">
    <h2>Reset Password</h2>
    <label>Email</label>
    <input type="email" id="auth-forgot-email" autocomplete="email" />
    <button class="auth-btn primary" id="auth-forgot-btn">Send Reset Link</button>
    <div class="auth-error" id="auth-forgot-err"></div>
    <div class="auth-success" id="auth-forgot-ok"></div>
    <button class="auth-link" id="auth-goto-login-from-forgot">Back to Sign In</button>
  </div>
</div>`;
    document.body.appendChild(div);
    _bindModalEvents();
  }

  // ── MODAL NAVIGATION ─────────────────────────────────────────
  function _showView(name) {
    ['login', 'register', 'forgot'].forEach((v) => {
      const el = document.getElementById('auth-view-' + v);
      if (el) el.style.display = v === name ? '' : 'none';
    });
    // clear errors
    document.querySelectorAll('#auth-modal .auth-error, #auth-modal .auth-success').forEach((el) => (el.textContent = ''));
  }

  function showAuthModal(view) {
    _injectModal();
    _showView(view || 'login');
    document.getElementById('auth-modal').hidden = false;
    // Wake up DB (Neon cold-starts after inactivity)
    fetch(PROXY_URL + '/db/health').catch(function () {});
    // Render Google Sign-In button (only once)
    _renderGoogleButton();
  }

  function _renderGoogleButton() {
    const wrap = document.getElementById('auth-google-btn-wrap');
    if (!wrap || wrap.dataset.rendered) return;
    if (!window.google || !window.google.accounts || !window.GOOGLE_CLIENT_ID) {
      // GSI not loaded yet — retry after a short delay
      setTimeout(_renderGoogleButton, 500);
      return;
    }
    _initGoogleButton();
    google.accounts.id.initialize({
      client_id: window.GOOGLE_CLIENT_ID,
      callback: window._handleGoogleCredential,
    });
    google.accounts.id.renderButton(wrap, {
      type: 'standard',
      theme: 'filled_black',
      size: 'large',
      text: 'signin_with',
      shape: 'pill',
      width: 280,
    });
    wrap.dataset.rendered = '1';
  }

  function hideAuthModal() {
    const m = document.getElementById('auth-modal');
    if (m) m.hidden = true;
  }

  // ── MODAL EVENT BINDINGS ─────────────────────────────────────
  function _bindModalEvents() {
    // navigation
    _on('auth-goto-register-from-login', 'click', () => _showView('register'));
    _on('auth-goto-login-from-register', 'click', () => _showView('login'));
    _on('auth-goto-forgot', 'click', () => _showView('forgot'));
    _on('auth-goto-login-from-forgot', 'click', () => _showView('login'));

    // login
    _on('auth-login-btn', 'click', _doLogin);
    _on('auth-login-pass', 'keydown', (e) => {
      if (e.key === 'Enter') _doLogin();
    });

    // register
    _on('auth-reg-btn', 'click', _doRegister);
    _on('auth-reg-pass2', 'keydown', (e) => {
      if (e.key === 'Enter') _doRegister();
    });

    // forgot
    _on('auth-forgot-btn', 'click', _doForgot);
    _on('auth-forgot-email', 'keydown', (e) => {
      if (e.key === 'Enter') _doForgot();
    });
  }

  function _on(id, evt, fn) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(evt, fn);
  }

  // ── MODAL ACTIONS ────────────────────────────────────────────
  async function _doLogin() {
    const user = document.getElementById('auth-login-user').value.trim();
    const pass = document.getElementById('auth-login-pass').value;
    const err = document.getElementById('auth-login-err');
    err.textContent = '';
    if (!user || !pass) {
      err.textContent = 'Please fill in all fields.';
      return;
    }
    const btn = document.getElementById('auth-login-btn');
    btn.disabled = true;
    btn.textContent = 'Signing in...';
    try {
      await authLogin(user, pass);
      window.currentUser = _currentUser;
      hideAuthModal();
      renderAuthUI();
      _offerClaimOwnership();
    } catch (e) {
      err.textContent = e.message;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  }

  async function _doRegister() {
    const user = document.getElementById('auth-reg-user').value.trim();
    const email = document.getElementById('auth-reg-email').value.trim();
    const display = document.getElementById('auth-reg-display').value.trim();
    const pass = document.getElementById('auth-reg-pass').value;
    const pass2 = document.getElementById('auth-reg-pass2').value;
    const err = document.getElementById('auth-reg-err');
    err.textContent = '';
    if (!user || !email || !pass) {
      err.textContent = 'Username, email, and password are required.';
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      err.textContent = 'Enter a valid email address.';
      return;
    }
    if (pass.length < 6) {
      err.textContent = 'Password must be at least 6 characters.';
      return;
    }
    if (pass !== pass2) {
      err.textContent = 'Passwords do not match.';
      return;
    }
    const btn = document.getElementById('auth-reg-btn');
    btn.disabled = true;
    btn.textContent = 'Creating...';
    try {
      await authRegister(user, email, pass, display);
      window.currentUser = _currentUser;
      hideAuthModal();
      renderAuthUI();
      _offerClaimOwnership();
    } catch (e) {
      err.textContent = e.message;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  }

  async function _doForgot() {
    const email = document.getElementById('auth-forgot-email').value.trim();
    const err = document.getElementById('auth-forgot-err');
    const ok = document.getElementById('auth-forgot-ok');
    err.textContent = '';
    ok.textContent = '';
    if (!email) {
      err.textContent = 'Please enter your email.';
      return;
    }
    const btn = document.getElementById('auth-forgot-btn');
    btn.disabled = true;
    btn.textContent = 'Sending...';
    try {
      await authForgotPassword(email);
      ok.textContent = 'If that email is registered, a reset link has been sent.';
    } catch (e) {
      err.textContent = e.message;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send Reset Link';
    }
  }

  // ── OWNERSHIP CLAIMING ───────────────────────────────────────
  function _offerClaimOwnership() {
    if (!_currentUser) return;
    // Gather browser-local owned campaigns/worlds
    let campaigns = [],
      worlds = [];
    try {
      const oc = JSON.parse(localStorage.getItem('cyoa_owned_campaigns') || '{}');
      campaigns = Object.keys(oc);
    } catch (e) {}
    try {
      const ow = JSON.parse(localStorage.getItem('cyoa_owned_worlds') || '{}');
      worlds = Object.keys(ow);
    } catch (e) {}
    if (!campaigns.length && !worlds.length) return;
    // Silently claim — server will only accept if they are unclaimed
    authClaimOwnership(campaigns, worlds).catch(() => {});
  }

  // ── NAV UI (user pill / sign-in button) ──────────────────────
  function renderAuthUI() {
    // Ensure containers exist in each nav bar
    _ensureAuthSlots();
    document.querySelectorAll('.auth-slot').forEach((slot) => {
      if (_currentUser) {
        const name = _currentUser.displayName || _currentUser.username || 'User';
        slot.innerHTML = `
<div class="auth-pill" onclick="this.classList.toggle('open')">
  <span>${_esc(name)}</span>
  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style="opacity:0.5"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
  <div class="auth-pill-dd" onclick="event.stopPropagation()">
    <button onclick="Auth.showModal('profile');this.closest('.auth-pill').classList.remove('open')">Profile</button>
    <button onclick="Auth.logout();this.closest('.auth-pill').classList.remove('open')">Logout</button>
  </div>
</div>`;
      } else {
        slot.innerHTML = `<button class="auth-signin-btn" onclick="Auth.showModal()">Sign In</button>`;
      }
    });
    // Close pill dropdown on outside click
    document.addEventListener('click', _closePillDropdowns, true);
  }

  function _closePillDropdowns(e) {
    if (!e.target.closest('.auth-pill')) {
      document.querySelectorAll('.auth-pill.open').forEach((p) => p.classList.remove('open'));
    }
  }

  function _ensureAuthSlots() {
    // Insert an .auth-slot next to each hamburger button
    document.querySelectorAll('.hamburger').forEach((btn) => {
      const nav = btn.closest('nav') || btn.parentElement;
      if (!nav) return;
      if (nav.querySelector('.auth-slot')) return;
      const slot = document.createElement('div');
      slot.className = 'auth-slot';
      slot.style.cssText = 'display:inline-flex;align-items:center;margin-right:8px;';
      nav.insertBefore(slot, btn);
    });
    // Global persistent badge (shows on ALL screens including game)
    if (!document.getElementById('auth-global-badge')) {
      const badge = document.createElement('div');
      badge.id = 'auth-global-badge';
      badge.className = 'auth-slot';
      badge.style.cssText = 'position:fixed;top:12px;left:14px;z-index:150;display:inline-flex;align-items:center;';
      document.body.appendChild(badge);
    }
  }

  function _esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // ── INIT ─────────────────────────────────────────────────────
  _injectStyles();

  // ── EXPORT ───────────────────────────────────────────────────
  window.Auth = {
    init: initAuth,
    login: authLogin,
    loginGoogle: authGoogle,
    register: authRegister,
    logout: logout,
    isLoggedIn: isLoggedIn,
    getCurrentUser: getCurrentUser,
    showModal: showAuthModal,
    hideModal: hideAuthModal,
    renderUI: renderAuthUI,
    authFetch: authFetch,
    changePassword: authChangePassword,
    forgotPassword: authForgotPassword,
    deleteAccount: authDeleteAccount,
    updateProfile: authUpdateProfile,
    claimOwnership: authClaimOwnership,
    createInvite: createInvite,
    validateInvite: validateInvite,
    joinViaInvite: joinViaInvite,
  };

  // Self-init: check token and render badge immediately on script load
  // Uses sync check first (show pill from cached token), then async validate
  _injectStyles();
  if (_token()) {
    // Optimistic render — show pill immediately from token presence
    _currentUser = { displayName: '...' };
    setTimeout(function () {
      _ensureAuthSlots();
      renderAuthUI();
    }, 0);
    // Then validate async — update with real name or clear if expired
    initAuth();
  } else {
    setTimeout(function () {
      _ensureAuthSlots();
      renderAuthUI();
    }, 0);
  }
})();
