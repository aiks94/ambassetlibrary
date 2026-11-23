/* AMB — sign-in screen and account menu.
   Sign-in uses the viewer's Claude account (claude.ai). The page never handles passwords. */
'use strict';

const CLAUDE_LOGIN_URL = 'https://claude.ai/login';
function gateKind() {
  if (!window.claude || typeof window.claude.use !== 'function') return 'outside';
  if (!S.cap.user || (!S.me.id && !S.cap.db)) return 'signedout';
  if (!S.cap.db) return 'noaccess';
  return null;
}
function renderGate(kind) {
  document.body.classList.add('gated');
  const copy = {
    outside: { h: 'Open the library on claude.ai', p: 'The AMB Brand Library runs inside claude.ai, where your team signs in. Open the library link your administrator shared with you.', btn: '' },
    signedout: { h: 'Sign in to the brand library', p: 'Use your Affordable Modular Buildings Claude account. The same email and password, or Google sign-in, that you use for Claude.', btn: 'Sign in with Claude' },
    noaccess: { h: 'You don’t have access yet', p: window.AMB_PLATFORM ? `You’re signed in${S.me.name ? ' as ' + S.me.name : ''}, but your account hasn’t been given access to the library. Ask an AMB brand administrator to approve your account, then reload this page.` : `You’re signed in${S.me.name ? ' as ' + S.me.name : ''}, but this library hasn’t been shared with you. Ask an AMB brand administrator to share it with you from claude.ai, then reload this page.`, btn: '' },
  }[kind];
  document.getElementById('app').innerHTML = `
  <div class="gate">
    <div class="gate-brand">
      <div class="gate-word"><span class="emph">Affordable</span><span>Modular Buildings</span></div>
      <p>Official logos, templates, colours, fonts and export specs, all in one place.</p>
      <div class="gate-blocks" aria-hidden="true"><i></i><i></i><i></i></div>
    </div>
    <main class="gate-panel">
      <div class="gate-card">
        <span class="eyebrow">Brand Asset Library</span>
        <h1>${esc(copy.h)}</h1>
        <p>${esc(copy.p)}</p>
        ${copy.btn ? `<a class="btn primary gate-btn" href="${CLAUDE_LOGIN_URL}" target="_blank" rel="noopener">${icon('external')}<span>${esc(copy.btn)}</span></a>
          <p class="small muted">Sign-in opens in a new tab. When you’ve signed in, come back here and reload.</p>` : ''}
        <button class="btn gate-btn" type="button" id="gate-reload">${icon('replace')}<span>${kind === 'signedout' ? 'I’ve signed in, reload' : 'Reload'}</span></button>
        ${window.AMB_PLATFORM ? (window.AMB_PLATFORM.signOut ? '<button class="btn gate-btn" type="button" id="gate-signout">Sign out</button>' : '') : '<div class="note"><b>No Claude account?</b> Ask your administrator to invite you to the Affordable Modular Buildings team on Claude. Accounts and passwords are managed by Claude, not by this library.</div>'}
      </div>
    </main>
  </div>`;
  document.getElementById('gate-reload').addEventListener('click', () => location.reload());
  const so = document.getElementById('gate-signout'); if (so) so.addEventListener('click', () => window.AMB_PLATFORM.signOut());
}

/* Account menu on the user chip */
function openAccountMenu(anchor) {
  const old = document.getElementById('acct-menu'); if (old) { old.remove(); return; }
  const r = anchor.getBoundingClientRect();
  const m = document.createElement('div'); m.id = 'acct-menu'; m.className = 'card acct-menu'; m.setAttribute('role', 'menu');
  m.style.top = (r.bottom + 6) + 'px'; m.style.right = Math.max(12, window.innerWidth - r.right) + 'px';
  m.innerHTML = `<div class="acct-head"><img src="${esc(S.me.avatarUrl || personAvatar(S.me.id))}" alt=""><div><b></b><div class="small muted">Role: ${esc(S.role)}</div></div></div>
    <a class="acct-item" href="#settings" role="menuitem">${icon('settings')}<span>Your access & settings</span></a>
    ${window.AMB_PLATFORM && window.AMB_PLATFORM.signOut ? `${window.AMB_PLATFORM.changePassword ? `<button type="button" class="acct-item" data-acct="pw" role="menuitem">${icon('shield')}<span>Change password</span></button>` : ''}<button type="button" class="acct-item" data-acct="out" role="menuitem">${icon('external')}<span>Sign out</span></button>`
      : `<a class="acct-item" href="https://claude.ai" target="_blank" rel="noopener" role="menuitem">${icon('users')}<span>Switch account or sign out on claude.ai</span></a>
    <p class="small muted" style="padding:8px 12px 2px;margin:0">You’re signed in with your Claude account. Signing out of claude.ai signs you out here too.</p>`}`;
  m.querySelector('b').textContent = S.me.name || 'Signed in';
  document.body.appendChild(m);
  const close = e => { if (!m.contains(e.target) && e.target !== anchor && !anchor.contains(e.target)) { m.remove(); document.removeEventListener('click', close, true); } };
  setTimeout(() => document.addEventListener('click', close, true), 0);
  $$('a', m).forEach(a => a.addEventListener('click', () => m.remove()));
  const pw = m.querySelector('[data-acct=pw]'); if (pw) pw.addEventListener('click', () => { m.remove(); window.AMB_PLATFORM.changePassword(); });
  const out = m.querySelector('[data-acct=out]'); if (out) out.addEventListener('click', () => { m.remove(); window.AMB_PLATFORM.signOut(); });
}
