/* AMB — router & boot */
'use strict';

const VIEWS = {
  dashboard: [viewDashboard, bindDashboard],
  library: [viewLibrary, bindLibrary],
  logos: [viewLogos, bindLogos],
  fonts: [viewFonts, bindFonts],
  colours: [viewColours, bindColours],
  templates: [viewTemplates, bindTemplates],
  'export-sizes': [viewSpecs, bindSpecs],
  naming: [viewNaming, bindNaming],
  recent: [viewRecent, root => { bindAssetClicks(root); bindRequests(root); }],
  archived: [viewArchived, bindArchived],
  settings: [viewSettings, bindSettings],
  admin: [viewAdmin, bindAdmin],
};
let lastRoute = null;
let booted = false;

function renderView() {
  const r = currentRoute(); const [v, b] = VIEWS[r];
  const el = $('#view');
  // Preserve focus & caret on inputs that live inside the view across live re-renders
  const ae = document.activeElement; const focusId = ae && el.contains(ae) && ae.id ? ae.id : null;
  const caret = focusId && typeof ae.selectionStart === 'number' ? [ae.selectionStart, ae.selectionEnd] : null;
  try { el.innerHTML = v(); b(el); applyPageContent(el, r); }
  catch (e) { console.error(e); el.innerHTML = emptyState('warn', 'Something went wrong showing this page', 'Reload the page. If it keeps happening, tell an administrator what you were doing.'); }
  if (focusId) { const n = document.getElementById(focusId); if (n) { n.focus(); if (caret && typeof n.setSelectionRange === 'function') try { n.setSelectionRange(caret[0], caret[1]); } catch (e) {} } }
  if (r !== lastRoute) { window.scrollTo(0, 0); lastRoute = r; }
}
rerender = function () {
  if (document.body.classList.contains('gated')) return;
  computeRole();
  renderSidebar();
  // Don't rebuild the topbar while someone is typing in the global search
  if (!(document.activeElement && document.activeElement.id === 'global-search')) renderTopbar();
  renderBanner();
  // Avoid clobbering a form the user is actively typing in on the Naming page or toolbars
  const ae = document.activeElement;
  const typing = ae && $('#view').contains(ae) && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) && booted && currentRoute() === lastRoute && ['naming', 'settings'].includes(currentRoute());
  if (!typing) renderView();
  if (drawerState) renderDrawer();
  renderBulkBar();
  document.title = (currentRoute() === 'dashboard' ? '' : CRUMB_LABEL[currentRoute()] + ' · ') + 'AMB Brand Asset Library';
};

window.addEventListener('hashchange', () => { closeDrawer(); S.sel.clear(); rerender(); });

(async function boot() {
  applyTheme(themePref());
  if (window.AMB_AUTH_GATE) { try { await window.AMB_AUTH_GATE; } catch (e) { console.warn(e); } }
  renderSidebar(); renderTopbar();
  const capTimer = setTimeout(() => { if (!booted) { booted = true; const g = gateKind(); if (g) renderGate(g); else rerender(); } }, 11000);
  try { await initCapabilities(); } catch (e) { console.warn(e); }
  clearTimeout(capTimer);
  const gate = gateKind();
  if (gate) { booted = true; renderGate(gate); return; }
  computeRole();
  booted = true;
  subscribeAll();
  recordPresence();
  rerender();
})();
