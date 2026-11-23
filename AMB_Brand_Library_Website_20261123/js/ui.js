/* AMB — UI primitives: icons, shell, modal, drawer, toast */
'use strict';

const ICON_PATHS = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  library: '<path d="M4 5a2 2 0 0 1 2-2h3l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M4 9h16"/>',
  logo: '<path d="M3 11 12 4l9 7"/><path d="M5 10v9h14v-9"/><rect x="9" y="13" width="6" height="6"/>',
  font: '<path d="M4 20 10 4h1l6 16"/><path d="M6.5 14h8"/><path d="M17 20h4M3 20h4"/>',
  colour: '<circle cx="12" cy="12" r="9"/><circle cx="8" cy="10" r="1.4" fill="currentColor"/><circle cx="12" cy="7.5" r="1.4" fill="currentColor"/><circle cx="16" cy="10" r="1.4" fill="currentColor"/><path d="M12 21a3 3 0 0 1 0-6h1.5a2 2 0 0 0 0-4"/>',
  template: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  sizes: '<path d="M3 7V3h4M21 7V3h-4M3 17v4h4M21 17v4h-4"/><rect x="7" y="7" width="10" height="10" rx="1"/>',
  naming: '<path d="M4 7V5h16v2M9 19h6M12 5v14"/>',
  recent: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  archive: '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><path d="M10 12h4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m14 6 4 4"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  folder: '<path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  replace: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9"/><path d="M20 4v5h-5"/><path d="M20 12a8 8 0 0 1-14 5.3L4 15"/><path d="M4 20v-5h5"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
  video: '<rect x="3" y="5" width="13" height="14" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
  warn: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17.5v.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2a5 5 0 0 1 5.5 4.8"/>',
  restore: '<path d="M4 12a8 8 0 1 0 2.3-5.7L4 9"/><path d="M4 4v5h5"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  chevdown: '<path d="m6 9 6 6 6-6"/>',
  book: '<path d="M3 5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v15a2 2 0 0 0-2-2H3z"/><path d="M21 5a2 2 0 0 0-2-2h-5a2 2 0 0 0-2 2v15a2 2 0 0 1 2-2h7z"/>',
  layers: '<path d="M12 3 21 8l-9 5-9-5z"/><path d="M3 12.5 12 17.5l9-5"/><path d="M3 16.5 12 21.5l9-5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  message: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
};
function icon(name, extra = '') { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${ICON_PATHS[name] || ''}</svg>`; }

/* ---------- Toast ---------- */
function toast(msg, bad = false) {
  const root = $('#toast-root'); const t = document.createElement('div');
  t.className = 'toast' + (bad ? ' bad' : ''); t.innerHTML = (bad ? '' : icon('check')) + `<span></span>`; t.querySelector('span').textContent = msg;
  root.appendChild(t); setTimeout(() => t.remove(), bad ? 5200 : 2600);
}

/* ---------- Modal ---------- */
let modalStack = [];
function modal({ title, subtitle = '', body = '', actions = [], wide = false, onMount }) {
  const root = $('#modal-root');
  const ov = document.createElement('div'); ov.className = 'overlay modal-overlay';
  const m = document.createElement('div'); m.className = 'modal' + (wide ? ' wide' : ''); m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
  m.innerHTML = `<div class="modal-head"><div class="grow"><h2>${esc(title)}</h2>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div><button class="btn ghost icon" data-x aria-label="Close">${icon('x')}</button></div>
    <form class="modal-body" novalidate>${body}</form>
    <div class="modal-foot"></div>`;
  const foot = m.querySelector('.modal-foot');
  const close = () => { ov.remove(); m.remove(); modalStack = modalStack.filter(x => x !== close); };
  actions.forEach(a => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn' + (a.primary ? ' primary' : '') + (a.danger ? ' danger' : '');
    b.innerHTML = (a.icon ? icon(a.icon) : '') + `<span>${esc(a.label)}</span>`;
    b.addEventListener('click', async () => {
      if (!a.onClick) return close();
      b.disabled = true; const orig = b.innerHTML; b.innerHTML = '<span class="spinner"></span><span>Working…</span>';
      try { const r = await a.onClick(m, close); if (r !== false) close(); }
      finally { if (b.isConnected) { b.disabled = false; b.innerHTML = orig; } }
    });
    foot.appendChild(b);
  });
  m.querySelector('form').addEventListener('submit', e => { e.preventDefault(); const p = foot.querySelector('.btn.primary'); if (p) p.click(); });
  m.querySelector('[data-x]').addEventListener('click', close);
  ov.addEventListener('click', close);
  root.append(ov, m); modalStack.push(close);
  if (onMount) onMount(m, close);
  setTimeout(() => { const f = m.querySelector('input:not([type=hidden]):not([readonly]),select,textarea'); if (f) f.focus(); }, 30);
  return { el: m, close };
}
function confirmDialog(title, message, { label = 'Confirm', danger = false } = {}) {
  return new Promise(res => {
    let decided = false;
    const { el } = modal({ title, body: `<p class="muted">${esc(message)}</p>`, actions: [
      { label: 'Cancel', onClick: () => { decided = true; res(false); } },
      { label, primary: !danger, danger, onClick: () => { decided = true; res(true); } },
    ] });
    const obs = new MutationObserver(() => { if (!el.isConnected) { obs.disconnect(); if (!decided) res(false); } });
    obs.observe($('#modal-root'), { childList: true });
  });
}
function formVal(m, id) { const e = m.querySelector('#' + id); if (!e) return ''; if (e.type === 'checkbox') return e.checked; return (e.value || '').trim(); }
function showErr(m, msg) { let e = m.querySelector('.err.form-err'); if (!e) { e = document.createElement('p'); e.className = 'err form-err'; m.querySelector('.modal-body').appendChild(e); } e.textContent = msg; }

/* ---------- Drawer ---------- */
let drawerState = null;
function openDrawer(kind, id) { drawerState = { kind, id }; renderDrawer(); }
function closeDrawer() { drawerState = null; $('#drawer-root').innerHTML = ''; }
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (modalStack.length) { modalStack[modalStack.length - 1](); return; }
  if (drawerState) closeDrawer();
  $('#app').classList.remove('nav-open'); $('#scrim').hidden = true;
});

/* ---------- Common bits ---------- */
function emptyState(ic, title, text, actionHtml = '') {
  return `<div class="empty"><div class="em-icon">${icon(ic)}</div><h3>${esc(title)}</h3><p>${esc(text)}</p>${actionHtml}</div>`;
}
function thumbHtml(a, cls = 'thumb') {
  const ct = a.contentType || ''; const prev = a.previewId || (isImageType(ct) ? a.fileId : '');
  const bg = (a.bgCompat || [])[0];
  const bgCls = bg === 'Dark backgrounds' ? 'bg-dark' : bg === 'AMB Green backgrounds' ? 'bg-green' : (ct === 'image/png' || ct === 'image/svg+xml') ? 'checker' : 'bg-white';
  const isCover = a.category !== 'logo' && prev && (a.category === 'photo' || (a.category === 'social' && a.contentType !== 'image/svg+xml'));
  let inner;
  if (prev) inner = `<img src="${esc(blobUrl(prev))}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'ph',textContent:'Preview unavailable'}))">`;
  else if (/^video\//.test(ct)) inner = `<div class="ph">${icon('video')}<span>Video</span></div>`;
  else if (/^font\//.test(ct)) inner = `<div class="ph">${icon('font')}<span>Font file</span></div>`;
  else inner = `<div class="ph">${icon('file')}<span>${esc(assetExt(a).toUpperCase())}</span></div>`;
  return `<div class="${cls} ${bgCls}${isCover ? ' cover' : ''}">${inner}</div>`;
}
function assetCard(a) {
  const st = statusOf(a);
  const on = S.sel && S.sel.has(a.id);
  return `<article class="card asset${on ? ' selected' : ''}" data-asset="${esc(a.id)}" tabindex="0" aria-label="${esc(a.name)}">
    <div style="position:relative">${thumbHtml(a)}${canBulk() ? `<label class="sel-box" title="Select"><input type="checkbox" data-sel="${esc(a.id)}" ${on ? 'checked' : ''} aria-label="Select ${esc(a.name)}"><span></span></label>` : ''}
      <div style="position:absolute;top:8px;left:8px;display:flex;gap:5px">${isDemo(a) ? demoPill() : ''}</div>
      <span class="fmt-tag" style="position:absolute;right:8px;bottom:8px">${esc(assetExt(a).toUpperCase())}</span>
    </div>
    <div class="asset-body">
      <div class="asset-name" title="${esc(a.name)}">${esc(a.name)}</div>
      <div class="asset-file" title="${esc(a.filename)}">${esc(a.filename || '')}</div>
      <div class="asset-meta">${statusPill(st)}<span class="tnum">${a.width && a.height ? esc(a.width + '×' + a.height) : esc(fmtBytes(a.sizeBytes))}</span></div>
    </div></article>`;
}
function assetTable(list) {
  return `<div class="card table-wrap"><table class="tbl"><thead><tr>${canBulk() ? `<th style="width:36px"><input type="checkbox" data-sel-all aria-label="Select all" ${list.length && list.every(a => S.sel.has(a.id)) ? 'checked' : ''}></th>` : ''}<th></th><th>Name</th><th>Filename</th><th>Category</th><th>Format</th><th>Status</th><th>Version</th><th>Updated</th></tr></thead><tbody>
  ${list.map(a => `<tr class="click${S.sel.has(a.id) ? ' selected' : ''}" data-asset="${esc(a.id)}" tabindex="0">${canBulk() ? `<td><input type="checkbox" data-sel="${esc(a.id)}" ${S.sel.has(a.id) ? 'checked' : ''} aria-label="Select ${esc(a.name)}"></td>` : ''}<td>${thumbHtml(a, 'tthumb')}</td><td><b>${esc(a.name)}</b> ${isDemo(a) ? demoPill() : ''}</td><td class="mono small muted">${esc(a.filename || '')}</td><td>${esc(catLabel(a.category))}</td><td><span class="tag mono">${esc(assetExt(a).toUpperCase())}</span></td><td>${statusPill(statusOf(a))}</td><td class="mono small">V${String(a.version || 1).padStart(2, '0')}</td><td class="small muted tnum">${esc(fmtDate(a.updatedAt || a.createdAt))}</td></tr>`).join('')}
  </tbody></table></div>`;
}
function canBulk() { return !!S.cap.db && (can('archive') || can('del') || can('editAny') || can('approve')); }
function bindAssetClicks(root) {
  $$('[data-sel]', root).forEach(cb => {
    cb.addEventListener('click', e => e.stopPropagation());
    cb.addEventListener('change', () => { cb.checked ? S.sel.add(cb.dataset.sel) : S.sel.delete(cb.dataset.sel); renderView(); renderBulkBar(); });
  });
  const all = $('[data-sel-all]', root); if (all) all.addEventListener('change', () => { const ids = $$('[data-sel]', root).map(c => c.dataset.sel); ids.forEach(id => all.checked ? S.sel.add(id) : S.sel.delete(id)); renderView(); renderBulkBar(); });
  $$('.sel-box', root).forEach(l => l.addEventListener('click', e => e.stopPropagation()));
  $$('[data-asset]', root).forEach(el => {
    const go = () => { if (S.sel.size && canBulk()) { const id = el.dataset.asset; S.sel.has(id) ? S.sel.delete(id) : S.sel.add(id); renderView(); renderBulkBar(); return; } openDrawer('asset', el.dataset.asset); };
    el.addEventListener('click', e => { if (e.target.closest('button,a,input,label')) return; go(); });
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
}
function selectOpts(list, val, placeholder) {
  return (placeholder !== undefined ? `<option value="">${esc(placeholder)}</option>` : '') + list.map(o => { const v = typeof o === 'object' ? o.value : o; const l = typeof o === 'object' ? o.label : o; return `<option value="${esc(v)}"${String(v) === String(val) ? ' selected' : ''}>${esc(l)}</option>`; }).join('');
}

/* ---------- Shell ---------- */
const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'library', label: 'Asset Library', icon: 'library' },
  { id: 'logos', label: 'Logos', icon: 'logo' },
  { id: 'fonts', label: 'Fonts', icon: 'font' },
  { id: 'colours', label: 'Colours', icon: 'colour' },
  { id: 'templates', label: 'Templates', icon: 'template' },
  { id: 'export-sizes', label: 'Export Sizes', icon: 'sizes' },
  { id: 'naming', label: 'Naming Guide', icon: 'naming' },
  { id: 'recent', label: 'Recently Updated', icon: 'recent' },
  { id: 'archived', label: 'Archived Assets', icon: 'archive' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];
const IS_STATIC = !!(window.AMB_PLATFORM && window.AMB_PLATFORM.name === 'static');
if (IS_STATIC) { for (let i = NAV.length - 1; i >= 0; i--) if (['settings', 'archived'].includes(NAV[i].id)) NAV.splice(i, 1); }
function currentRoute() { const h = (location.hash || '').replace('#', ''); return NAV.some(n => n.id === h) || h === 'admin' ? h : 'dashboard'; }
function go(route) { if (location.hash !== '#' + route) location.hash = route; else rerender(); }

function sidebarLogo() {
  const ok = a => a && !isDemo(a) && statusOf(a) === 'approved' && (a.previewId || a.fileId);
  const g = S.settings.general || {};
  const portal = g.portalLogoAssetId && S.assets.find(a => a.id === g.portalLogoAssetId);
  if (ok(portal)) return portal;
  return S.assets.find(a => a.category === 'logo' && a.subcategory === 'Primary Logo' && ok(a)) || null;
}
function renderSidebar() {
  const r = currentRoute();
  const counts = {
    library: activeAssets().length, logos: activeAssets().filter(a => a.category === 'logo').length,
    templates: activeAssets().filter(a => a.category === 'template').length, archived: S.assets.filter(a => statusOf(a) === 'archived').length,
  };
  const pending = S.assets.filter(a => statusOf(a) === 'pending').length;
  const openReq = (S.requests || []).filter(q => q.status !== 'done').length;
  const logo = sidebarLogo();
  const item = n => `<a href="#${n.id}" class="${r === n.id ? 'active' : ''}"${r === n.id ? ' aria-current="page"' : ''}>${icon(n.icon)}<span>${esc(navLabel(n.id, n.label))}</span>${counts[n.id] ? `<span class="count tnum">${counts[n.id]}</span>` : ''}</a>`;
  const brandHtml = logo
    ? `<a class="brand brand-full" href="#dashboard" aria-label="AMB Brand Asset Library home"><img src="${esc(blobUrl(logo.previewId || logo.fileId))}" alt="Affordable Modular Buildings"><div class="brand-sub">Brand Asset Library</div></a>`
    : `<a class="brand brand-full" href="#dashboard"><div class="brand-name">Affordable Modular Buildings</div><div class="brand-sub">Brand Asset Library</div></a>`;
  const canReq = S.cap.db && S.canWriteShared !== false && S.role !== 'Viewer';
  $('#sidebar').innerHTML = `
    ${brandHtml}
    <nav class="nav">
      ${NAV.slice(0, 2).map(item).join('')}
      <div class="nav-label">Brand</div>
      ${NAV.slice(2, 8).map(item).join('')}
      <div class="nav-label">Manage</div>
      ${NAV.slice(8).map(item).join('')}
      ${can('approve') ? `<a href="#admin" class="${r === 'admin' ? 'active' : ''}">${icon('shield')}<span>Admin Console</span>${pending + openReq ? `<span class="count tnum attn">${pending + openReq}</span>` : ''}</a>` : ''}
    </nav>
    ${canReq ? `<div class="side-req"><b>Need an asset or have a request?</b><button class="btn primary sm" type="button" id="side-req">Submit a Request ${icon('arrow')}</button></div>` : ''}
    <svg class="side-swoosh" viewBox="0 0 240 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40C70 10 150 60 240 20v70H0z" fill="#478b02" opacity=".55"/><path d="M0 62C80 30 160 78 240 44v46H0z" fill="#73b134" opacity=".7"/></svg>`;
  $$('#sidebar a').forEach(a => a.addEventListener('click', () => { $('#app').classList.remove('nav-open'); $('#scrim').hidden = true; }));
  const sr = $('#side-req'); if (sr) sr.addEventListener('click', () => openRequestModal());
}

const CRUMB_LABEL = new Proxy({}, { get: (t, id) => id === 'admin' ? 'Admin Console' : navLabel(id, (NAV.find(n => n.id === id) || {}).label || '') });
function renderTopbar() {
  const r = currentRoute();
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || '');
  $('#topbar').innerHTML = `
    <button class="btn ghost icon menu-btn" id="menu-btn" aria-label="Open navigation">${icon('menu')}</button>
    <nav class="crumbs" aria-label="Breadcrumb"><a href="#dashboard">AMB Brand Library</a>${r !== 'dashboard' ? `<span>/</span><span class="cur">${esc(CRUMB_LABEL[r])}</span>` : ''}</nav>
    <div class="top-search">${icon('search')}<input type="search" id="global-search" placeholder="Search logos, templates, filenames…" aria-label="Search all assets" value="${esc(r === 'library' ? S.ui.lib.q : '')}"><kbd>${mac ? '⌘' : 'Ctrl'} + K</kbd></div>
    <div class="top-actions">
      ${can('upload') && S.cap.assets && r !== 'dashboard' ? `<button class="btn primary" id="top-upload">${icon('upload')}<span>Upload</span></button>` : ''}
      ${IS_STATIC ? '' : `<button type="button" class="btn ghost icon bell" id="bell-btn" aria-label="Notifications" aria-haspopup="menu">${icon('bell')}${notifUnread() ? '<span class="dot"></span>' : ''}</button>
      <button type="button" class="me" id="me-btn" aria-haspopup="menu" title="Account"><img src="${esc(S.me.avatarUrl || personAvatar(S.me.id))}" alt=""><span class="me-text"><b>${esc(S.me.name || 'Signed in')}</b><small>${esc(S.role === 'Administrator' ? 'Brand Admin' : S.role)}</small></span>${icon('chevdown')}</button>`}
    </div>`;
  $('#menu-btn').addEventListener('click', () => { $('#app').classList.add('nav-open'); $('#scrim').hidden = false; });
  const gs = $('#global-search');
  gs.addEventListener('input', debounce(() => { S.ui.lib.q = gs.value; if (currentRoute() !== 'library') { S.ui.lib.status = 'active'; go('library'); setTimeout(() => { const i = $('#global-search'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 30); } else renderView(); }, 220));
  const up = $('#top-upload'); if (up) up.addEventListener('click', () => openUpload({}));
  const mb = $('#me-btn'); if (mb) mb.addEventListener('click', () => openAccountMenu(mb));
  const bb = $('#bell-btn'); if (bb) bb.addEventListener('click', () => openNotifications(bb));
}
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { const i = $('#global-search'); if (i && i.offsetParent) { e.preventDefault(); i.focus(); i.select(); } }
});
function notifSeen() { try { return localStorage.getItem('amb-notif-seen') || ''; } catch (e) { return ''; } }
function notifItems() {
  const items = [];
  if (can('approve')) {
    const p = S.assets.filter(a => statusOf(a) === 'pending').length; if (p) items.push({ urgent: true, text: `${p} asset${p > 1 ? 's' : ''} waiting for approval`, href: '#admin' });
  }
  const oq = (S.requests || []).filter(q => q.status !== 'done');
  if (oq.length && (can('approve') || can('content'))) items.push({ urgent: true, text: `${oq.length} open asset request${oq.length > 1 ? 's' : ''}`, href: can('approve') ? '#admin' : '#recent' });
  S.activity.filter(a => a.type !== 'download' && a.by !== S.me.id).slice(0, 8).forEach(a => items.push({ ev: a }));
  return items;
}
function notifUnread() { const seen = notifSeen(); return (can('approve') && S.assets.some(a => statusOf(a) === 'pending')) || S.activity.some(a => a.type !== 'download' && a.by !== S.me.id && (a.at || '') > seen); }
function openNotifications(anchor) {
  const old = document.getElementById('notif-menu'); if (old) { old.remove(); return; }
  try { localStorage.setItem('amb-notif-seen', nowIso()); } catch (e) {}
  const r = anchor.getBoundingClientRect(); const items = notifItems();
  resolveProfiles(items.filter(i => i.ev).map(i => i.ev.by));
  const m = document.createElement('div'); m.id = 'notif-menu'; m.className = 'card acct-menu notif-menu'; m.setAttribute('role', 'menu');
  m.style.top = (r.bottom + 6) + 'px'; m.style.right = Math.max(12, window.innerWidth - r.right) + 'px';
  m.innerHTML = `<div class="acct-head" style="justify-content:space-between"><b>Notifications</b><a class="small" href="#recent">See all activity</a></div>
    ${items.length ? items.map(i => i.ev ? `<div class="notif-item"><img src="${esc(personAvatar(i.ev.by))}" alt=""><div class="grow small">${activityLine(i.ev)}<div class="muted">${esc(relTime(i.ev.at))}</div></div></div>` : `<a class="notif-item urgent" href="${i.href}">${icon('warn')}<span class="grow small"><b>${esc(i.text)}</b></span>${icon('chevron')}</a>`).join('') : '<p class="small muted" style="padding:12px">You’re all caught up.</p>'}`;
  document.body.appendChild(m);
  const close = e => { if (!m.contains(e.target) && !anchor.contains(e.target)) { m.remove(); document.removeEventListener('click', close, true); } };
  setTimeout(() => document.addEventListener('click', close, true), 0);
  $$('a', m).forEach(a => a.addEventListener('click', () => m.remove()));
  const dot = anchor.querySelector('.dot'); if (dot && !(can('approve') && S.assets.some(a => statusOf(a) === 'pending'))) dot.remove();
}
function renderBanner() {
  const b = $('#banner'); const parts = [];
  if (!S.cap.db) parts.push(`<div class="banner warn">${icon('warn')}<span class="grow">${window.AMB_PLATFORM ? 'The library database isn’t reachable. Check your connection, or ask an administrator to check the Supabase settings.' : 'Library storage isn’t available in this view. Open the published library on claude.ai while signed in to your organisation account.'}</span></div>`);
  else if (S.revoked) parts.push(`<div class="banner warn">${icon('warn')}<span class="grow">Your access to this library changed. Reload the page to continue.</span></div>`);
  else if (S.timedOut) parts.push(`<div class="banner warn">${icon('warn')}<span class="grow">Still connecting to the library. What you see may be out of date.</span></div>`);
  const demo = S.assets.filter(isDemo).length;
  if (demo && !(S.settings.general && S.settings.general.hideDemoBanner)) parts.push(`<div class="banner demo">${icon('info')}<span class="grow"><b>${demo} demo asset${demo > 1 ? 's' : ''}</b> marked DEMO are samples, not official AMB files. Replace them with approved company files.</span>${can('content') ? `<a class="btn sm" href="#settings">Manage demo content</a>` : ''}</div>`);
  b.innerHTML = parts.join('');
}
