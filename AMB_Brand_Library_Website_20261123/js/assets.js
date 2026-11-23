/* AMB — asset views, drawer, upload/replace/edit/approve flows */
'use strict';

/* ================= DASHBOARD ================= */
function heroIsPhoto() { const hid = dashDoc().heroAssetId; const h = hid && S.assets.find(a => a.id === hid); return !!(h && (h.previewId || isImageType(h.contentType))); }
function heroTitleHtml(t) {
  const words = String(t).trim().split(/\s+/); const last = words.pop();
  const swoosh = '<svg class="hl-line" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true"><path d="M2 11C60 3 140 2 198 6" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>';
  return `<span class="hero-title">${words.length ? esc(words.join(' ')) + ' ' : ''}<span class="hl">${esc(last || '')}${swoosh}</span></span>`;
}
function heroArt() {
  const hid = dashDoc().heroAssetId;
  const hero = hid && S.assets.find(a => a.id === hid);
  if (hero && (hero.previewId || isImageType(hero.contentType))) return `<img src="${esc(blobUrl(hero.previewId || hero.fileId))}" alt="">`;
  // Illustrated modular building (drawn, not a photo) — brand palette only
  return `<svg viewBox="0 0 480 270" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="480" height="270" fill="#478b02"/>
    <rect x="300" y="38" width="96" height="40" fill="#73b134"/><rect x="252" y="84" width="92" height="40" fill="#73b134" opacity=".55"/><path d="M348 0v38" stroke="#4d4c4c" stroke-width="2"/>
    <path d="M0 238h480v32H0z" fill="#4d4c4c"/>
    <g transform="translate(96 124) scale(.8)">
      <path d="M0 140V40l170-28 190 28v100z" fill="#fefefe"/>
      <path d="M170 12 360 40v100H170z" fill="#e9eae8"/>
      <path d="M-8 42 170 10l198 30-6 8-192-28L-2 50z" fill="#4d4c4c"/>
      <rect x="18" y="66" width="56" height="40" fill="#4d4c4c"/><rect x="22" y="70" width="48" height="32" fill="#8c8f94"/>
      <rect x="94" y="66" width="56" height="40" fill="#4d4c4c"/><rect x="98" y="70" width="48" height="32" fill="#8c8f94"/>
      <rect x="196" y="60" width="38" height="80" fill="#4d4c4c"/><rect x="200" y="64" width="30" height="76" fill="#73b134"/>
      <rect x="254" y="62" width="84" height="44" fill="#4d4c4c"/><rect x="258" y="66" width="76" height="36" fill="#8c8f94"/>
      <path d="M170 12v128" stroke="#d6d8d5" stroke-width="2"/>
      <rect x="-14" y="140" width="388" height="8" fill="#4d4c4c"/>
    </g>
  </svg>`;
}

function heroImages() {
  const d = dashDoc(); const ids = (Array.isArray(d.heroAssetIds) && d.heroAssetIds.length ? d.heroAssetIds : [d.heroAssetId]).filter(Boolean);
  return ids.map(id => S.assets.find(a => a.id === id)).filter(h => h && statusOf(h) !== 'archived' && statusOf(h) !== 'rejected' && (h.previewId || isImageType(h.contentType)));
}
function periodStart(p) { const n = new Date(); if (p === 'month') return new Date(n.getFullYear(), n.getMonth(), 1).toISOString(); if (p === '30d') return new Date(Date.now() - 30 * 864e5).toISOString(); if (p === 'week') return new Date(Date.now() - 7 * 864e5).toISOString(); return ''; }
function rcCard(a) {
  const ct = a.contentType || ''; const prev = a.previewId || (isImageType(ct) ? a.fileId : '');
  const cover = prev && a.category !== 'logo' && !(ct === 'image/svg+xml' && !a.previewId);
  const bg = (a.bgCompat || [])[0] === 'Dark backgrounds' ? 'bg-dark' : (a.bgCompat || [])[0] === 'AMB Green backgrounds' ? 'bg-green' : 'bg-white';
  return `<article class="card rc" data-asset="${esc(a.id)}" tabindex="0" aria-label="${esc(a.name)}">
    <div class="rc-thumb ${bg}${cover ? ' cover' : ''}">${prev ? `<img src="${esc(blobUrl(prev))}" alt="" loading="lazy">` : `<div class="ph">${icon(/^video/.test(ct) ? 'video' : 'file')}</div>`}
      ${isDemo(a) ? `<span class="rc-demo">${demoPill()}</span>` : ''}<span class="rc-badge">${icon(/^video/.test(ct) ? 'video' : isImageType(ct) ? 'image' : 'file')}</span></div>
    <div class="rc-body"><b title="${esc(a.name)}">${esc(a.name)}</b><span class="small mono">${esc(assetExt(a).toUpperCase())}${a.width && a.height ? ' · ' + esc(a.width + ' × ' + a.height) : ' · ' + esc(fmtBytes(a.sizeBytes))}</span>
      <div class="rc-foot">${statusPill(statusOf(a))}<span>${esc(relTime(a.createdAt))}</span></div></div></article>`;
}
function viewDashboard() {
  const all = activeAssets(); const real = all.filter(a => !isDemo(a));
  const approvedList = real.filter(a => statusOf(a) === 'approved');
  const pending = S.assets.filter(a => statusOf(a) === 'pending').length;
  const d = dashDoc();
  const first = (S.me.name || '').split(' ')[0];
  const emph = first ? (d.emph || '').replace(/\{name\}/g, first) : (d.emph || '').replace(/[,\s]*\{name\}/g, '');
  const period = S.ui.period || 'month';
  const since = periodStart(period);
  const newApproved = since ? approvedList.filter(a => ((S.approvals[a.id] || {}).at || a.createdAt || '') >= since).length : 0;
  const cats = d.cards.filter(c => c.show !== false);
  const recent = sortBy(all, a => a.createdAt || '', -1).slice(0, 6);
  const quick = all.filter(a => a.quick && statusOf(a) === 'approved').slice(0, 6);
  const imgs = heroImages();
  const guide = d.guideUrl && /^https?:\/\//i.test(d.guideUrl) ? `href="${esc(d.guideUrl)}" target="_blank" rel="noopener"` : `href="#${esc(d.guideRoute || 'colours')}"`;
  const brandUpdates = [
    ...S.colours.map(c => ({ t: 'Colour: ' + c.name, at: c.updatedAt, r: 'colours', hex: c.hex })),
    ...S.fonts.map(f => ({ t: 'Typeface: ' + f.family + (f.style === 'italic' ? ' Italic' : ''), at: f.updatedAt, r: 'fonts' })),
    ...S.specs.map(s => ({ t: 'Export spec: ' + s.name, at: s.updatedAt, r: 'export-sizes' })),
    ...(S.settings.naming ? [{ t: 'Naming convention', at: S.settings.naming.updatedAt, r: 'naming' }] : []),
    ...(S.settings.guidelines ? [{ t: 'Logo usage guidelines', at: S.settings.guidelines.updatedAt, r: 'logos' }] : []),
    ...(S.settings.colourguide ? [{ t: 'Colour combinations', at: S.settings.colourguide.updatedAt, r: 'colours' }] : []),
  ].filter(x => x.at).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);
  const canUp = can('upload') && S.cap.assets;
  const canReq = S.cap.db && S.canWriteShared !== false && S.role !== 'Viewer';
  return `
  <section class="hero v2">
    <div class="hero-art${imgs.length ? ' photo' : ''}">${imgs.length ? imgs.map((h, i) => `<img src="${esc(blobUrl(h.previewId || h.fileId))}" alt="" class="${i === 0 ? 'on' : ''}" style="object-position:${esc(heroPos(d, h.id))}">`).join('') : heroArt()}</div>
    ${can('content') && S.cap.db ? `<button type="button" class="hero-edit" data-act="hero-image">${icon('image')}<span>Change image</span></button>` : ''}
    <div class="hero-body">
      ${d.eyebrow ? `<div class="hero-eyebrow"><svg viewBox="0 0 40 32" width="34" height="28" aria-hidden="true"><path d="M20 2 38 11 20 20 2 11z" fill="#9ed36a"/><path d="M4 16l16 8 16-8v5l-16 8-16-8z" fill="#73b134"/></svg><span>${esc(d.eyebrow)}</span></div>` : ''}
      <h1>${emph ? `<span class="emph">${esc(emph)}</span>` : ''}${heroTitleHtml(d.title || 'Brand Asset Library').replace('<svg class="hl-line"', '<svg hidden class="hl-line"')}</h1>
      <p>${esc(d.welcome || 'Find the latest approved logos, templates, colours and export specs for Affordable Modular Buildings, and make sure every file stays on brand.')}</p>
      <div class="hero-ctas"><a class="btn primary" href="#library">${icon('layers')}<span>Browse Assets</span>${icon('arrow')}</a><a class="btn outline" ${guide}>${icon('book')}<span>${esc(d.guideLabel || 'Brand Guidelines')}</span></a></div>
    </div>
    ${imgs.length > 1 ? `<div class="hero-dots" role="tablist" aria-label="Hero images">${imgs.map((h, i) => `<button type="button" class="${i === 0 ? 'on' : ''}" data-slide="${i}" aria-label="Show image ${i + 1}"></button>`).join('')}</div>` : ''}
  </section>
  ${can('approve') && pending ? `<div class="banner info" style="margin:0">${icon('shield')}<span class="grow"><b>${pending} asset${pending > 1 ? 's' : ''}</b> waiting for your approval.</span><a class="btn sm primary" href="#admin">Review now</a></div>` : ''}
  <section style="display:flex;flex-direction:column;gap:14px">
    <div class="ov-head"><h2>Asset Overview</h2><label class="ov-period">${icon('calendar')}<span class="sr-only">Period</span><select id="ov-period">${selectOpts([{ value: 'week', label: 'This Week' }, { value: 'month', label: 'This Month' }, { value: '30d', label: 'Last 30 Days' }, { value: 'all', label: 'All Time' }], period)}</select></label></div>
    <div class="ov-grid">
      <a class="card ov first" href="#library">${newApproved ? `<span class="delta">${icon('upload')}+${newApproved}</span>` : ''}${icon('folder')}<b>${approvedList.length}</b><span>Approved Assets</span></a>
      <a class="card ov" href="${can('approve') ? '#admin' : '#library'}">${icon('recent')}<b>${pending}</b><span>Pending Review</span></a>
      <a class="card ov" href="#colours">${icon('layers')}<b>${S.colours.length}</b><span>Brand Colours</span></a>
      <a class="card ov" href="#export-sizes">${icon('download')}<b>${S.specs.length}</b><span>Export Sizes</span></a>
    </div>
    <p class="small muted" style="margin-top:-4px">Approved Assets counts official files (not demo samples)${since ? `. The green badge shows how many were approved ${period === 'month' ? 'this month' : period === 'week' ? 'in the last 7 days' : 'in the last 30 days'}` : ''}.</p>
  </section>
  ${cats.length ? `<section style="display:flex;flex-direction:column;gap:14px">
    <div class="ov-head"><h2>Quick Access</h2>${can('content') && S.cap.db ? `<button class="btn sm" data-act="customise">${icon('edit')}Customise dashboard</button>` : ''}</div>
    <div class="qa-grid">${cats.map(c => { const href = c.url && /^https?:\/\//i.test(c.url) ? `href="${esc(c.url)}" target="_blank" rel="noopener"` : `href="#${esc(c.route || 'library')}"`; return `<a class="card qa" ${href}>${icon(CARD_ICONS.includes(c.icon) ? c.icon : 'star')}<span>${esc(c.title)}</span>${icon(c.url ? 'external' : 'chevron')}</a>`; }).join('')}</div>
  </section>` : (can('content') && S.cap.db ? `<div class="btn-row" style="justify-content:flex-end"><button class="btn sm" data-act="customise">${icon('edit')}Customise dashboard</button></div>` : '')}
  ${d.showRecent || d.showQuick || d.showUpdates ? `<section class="${d.showRecent && (d.showQuick || d.showUpdates) ? 'two-col' : ''}" style="display:${d.showRecent && (d.showQuick || d.showUpdates) ? 'grid' : 'flex'};flex-direction:column;gap:18px">
    ${d.showRecent ? `<div class="card card-pad" style="display:flex;flex-direction:column;gap:14px">
      <div class="section-head"><div><h2>Recently Uploaded</h2><p>The newest files added to the library.</p></div><a class="btn sm" href="#library">View All ${icon('arrow')}</a></div>
      ${recent.length ? `<div class="rc-grid">${recent.map(rcCard).join('')}</div>` : emptyState('upload', 'No assets yet', canUp ? 'Upload the first approved AMB file to get the library started.' : 'Assets appear here once the team uploads them.', canUp ? `<button class="btn primary" data-act="upload">${icon('upload')}Upload asset</button>` : '')}
    </div>` : ''}
    ${d.showQuick || d.showUpdates ? `<div style="display:flex;flex-direction:column;gap:18px">
      ${d.showQuick ? `<div class="card card-pad">
        <div class="section-head"><div><h2>Quick Downloads</h2><p>Approved files the team uses most.</p></div></div>
        <div style="margin-top:8px">${quick.length ? quick.map(a => `<div class="quick"><div class="tthumb ${(a.bgCompat || [])[0] === 'Dark backgrounds' ? 'bg-dark' : 'checker'}" data-asset="${esc(a.id)}">${(a.previewId || isImageType(a.contentType)) ? `<img src="${esc(blobUrl(a.previewId || a.fileId))}" alt="">` : icon('file')}</div><div class="grow"><b class="small" style="display:block">${esc(a.name)} ${isDemo(a) ? demoPill() : ''}</b><span class="small muted">${esc(assetExt(a).toUpperCase())} · ${esc(fmtBytes(a.sizeBytes))}</span></div><button class="btn sm icon" data-dl="${esc(a.id)}" aria-label="Download ${esc(a.name)}">${icon('download')}</button></div>`).join('')
          : `<p class="muted small" style="padding:10px 0">${can('content') ? 'Open an approved asset and choose “Add to quick downloads”.' : 'Your team can pin approved assets here.'}</p>`}</div>
      </div>` : ''}
      ${d.showUpdates ? `<div class="card card-pad">
        <div class="section-head"><div><h2>Brand Updates</h2><p>Recent changes to guidelines and specs.</p></div></div>
        <div class="feed" style="margin-top:6px">${brandUpdates.length ? brandUpdates.map(u => `<a class="feed-item" href="#${u.r}" style="text-decoration:none;color:inherit"><span class="upd-dot" style="background:${esc(u.hex || 'var(--site-green)')}"></span><div class="grow small">${esc(u.t)}</div><span class="when">${esc(relTime(u.at))}</span></a>`).join('') : `<p class="muted small" style="padding:10px 0">No brand updates yet.</p>`}</div>
      </div>` : ''}
    </div>` : ''}
  </section>` : ''}
  ${canUp || canReq ? `<section class="card qx"><div class="qx-text"><h2>Quick Actions</h2><p class="small muted">Common tasks to keep your brand assets up to date.</p></div>
    ${canUp ? `<button class="btn primary" data-act="upload">${icon('upload')}Upload Asset</button><button class="btn" data-act="new-template">${icon('plus')}Create Template</button>` : ''}
    ${canReq ? `<button class="btn" data-act="request">${icon('message')}Request Asset</button>` : ''}</section>` : ''}`;
}
let heroTimer = null;
function bindDashboard(root) {
  $$('[data-act=upload]', root).forEach(b => b.addEventListener('click', () => openUpload({})));
  $$('[data-act=new-template]', root).forEach(b => b.addEventListener('click', () => openUpload({ category: 'template' })));
  $$('[data-act=request]', root).forEach(b => b.addEventListener('click', () => openRequestModal()));
  $$('[data-act=customise]', root).forEach(b => b.addEventListener('click', openDashboardModal));
  $$('[data-act=hero-image]', root).forEach(b => b.addEventListener('click', openHeroImageModal));
  const per = $('#ov-period', root); if (per) per.addEventListener('change', () => { S.ui.period = per.value; renderView(); });
  $$('[data-dl]', root).forEach(b => b.addEventListener('click', () => { const a = S.assets.find(x => x.id === b.dataset.dl); if (a) downloadAsset(a); }));
  bindAssetClicks(root);
  // hero slides
  clearInterval(heroTimer);
  const imgs = $$('.hero.v2 .hero-art img', root), dots = $$('[data-slide]', root);
  if (imgs.length > 1) {
    let cur = 0; const show = i => { cur = (i + imgs.length) % imgs.length; imgs.forEach((im, j) => im.classList.toggle('on', j === cur)); dots.forEach((d, j) => d.classList.toggle('on', j === cur)); };
    dots.forEach(d => d.addEventListener('click', () => { show(+d.dataset.slide); clearInterval(heroTimer); }));
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) heroTimer = setInterval(() => { if (!document.body.contains(imgs[0])) { clearInterval(heroTimer); return; } show(cur + 1); }, 6000);
  }
}

/* ================= LIBRARY ================= */
function filterAssets(list, f) {
  const q = (f.q || '').trim().toLowerCase();
  let out = list.filter(a => {
    const st = statusOf(a);
    if (f.status === 'active' && st === 'archived') return false;
    if (f.status && f.status !== 'active' && f.status !== 'all' && st !== f.status) return false;
    if (f.cat && f.cat !== 'all' && a.category !== f.cat) return false;
    if (f.fmt && f.fmt !== 'all' && assetExt(a) !== f.fmt) return false;
    if (f.folder && f.folder !== 'all' && (a.folderId || '') !== (f.folder === 'none' ? '' : f.folder)) return false;
    if (q) {
      const hay = [a.name, a.filename, a.description, a.subcategory, catLabel(a.category), (a.tags || []).join(' '), a.platform, assetExt(a)].join(' ').toLowerCase();
      if (!q.split(/\s+/).every(t => hay.includes(t))) return false;
    }
    return true;
  });
  const s = f.sort || 'updated';
  if (s === 'updated') out = sortBy(out, a => a.updatedAt || a.createdAt || '', -1);
  else if (s === 'newest') out = sortBy(out, a => a.createdAt || '', -1);
  else if (s === 'oldest') out = sortBy(out, a => a.createdAt || '');
  else if (s === 'name') out = sortBy(out, a => (a.name || '').toLowerCase());
  else if (s === 'size') out = sortBy(out, a => a.sizeBytes || 0, -1);
  return out;
}
function viewLibrary() {
  const f = S.ui.lib;
  const list = filterAssets(S.assets, f);
  const fmts = [...new Set(S.assets.map(assetExt))].sort();
  const folders = sortBy(S.folders, x => (x.name || '').toLowerCase());
  const curFolder = folders.find(x => x.id === f.folder);
  return `
  <div class="page-head"><div><span class="eyebrow">Library</span><h1>Asset Library</h1><p>Every AMB asset in one place. Search by filename, category or keyword, and filter by format and approval status.</p></div>
    <div class="btn-row">${can('folders') && S.cap.db ? `<button class="btn" data-act="new-folder">${icon('folder')}New folder</button>` : ''}${can('upload') && S.cap.assets ? `<button class="btn primary" data-act="upload">${icon('upload')}Upload asset</button>` : ''}</div></div>
  <div class="card toolbar">
    <div class="search">${icon('search')}<input class="input" type="search" id="lib-q" placeholder="Search filename, name, tags…" value="${esc(f.q)}" aria-label="Search assets"></div>
    <select class="select" id="lib-cat" aria-label="Category"><option value="all">All categories</option>${selectOpts(categories().map(c => ({ value: c.id, label: c.label })), f.cat)}</select>
    <select class="select" id="lib-fmt" aria-label="File format"><option value="all">All formats</option>${selectOpts(fmts.map(x => ({ value: x, label: x.toUpperCase() })), f.fmt)}</select>
    <select class="select" id="lib-status" aria-label="Approval status">${selectOpts([{ value: 'active', label: 'Active (not archived)' }, { value: 'approved', label: 'Approved' }, { value: 'pending', label: 'Pending review' }, { value: 'rejected', label: 'Rejected' }, { value: 'archived', label: 'Archived' }, { value: 'all', label: 'All statuses' }], f.status)}</select>
    <select class="select" id="lib-sort" aria-label="Sort">${selectOpts([{ value: 'updated', label: 'Recently updated' }, { value: 'newest', label: 'Newest uploads' }, { value: 'oldest', label: 'Oldest uploads' }, { value: 'name', label: 'Name A–Z' }, { value: 'size', label: 'Largest files' }], f.sort)}</select>
    <div class="seg" role="group" aria-label="Layout"><button class="${f.view === 'grid' ? 'on' : ''}" data-view="grid" aria-label="Grid view">${icon('grid')}</button><button class="${f.view === 'list' ? 'on' : ''}" data-view="list" aria-label="List view">${icon('list')}</button></div>
  </div>
  <div class="chips" aria-label="Folders">
    <button class="chip ${f.folder === 'all' ? 'on' : ''}" data-folder="all">All folders</button>
    ${folders.map(fo => `<button class="chip ${f.folder === fo.id ? 'on' : ''}" data-folder="${esc(fo.id)}">${esc(fo.name)}<span class="n">${S.assets.filter(a => a.folderId === fo.id && statusOf(a) !== 'archived').length}</span></button>`).join('')}
    <button class="chip ${f.folder === 'none' ? 'on' : ''}" data-folder="none">Unfiled</button>
    ${curFolder && can('folders') ? `<button class="btn sm ghost" data-act="rename-folder">${icon('edit')}Rename</button>` : ''}${curFolder && can('del') ? `<button class="btn sm ghost danger" data-act="delete-folder">${icon('trash')}Delete folder</button>` : ''}
  </div>
  <p class="small muted">${list.length} asset${list.length === 1 ? '' : 's'}${f.q ? ` matching “${esc(f.q)}”` : ''}</p>
  ${!S.ready.assets && S.cap.db ? `<div class="grid g-assets">${'<div class="skel" style="height:240px"></div>'.repeat(6)}</div>`
    : list.length ? (f.view === 'list' ? assetTable(list) : `<div class="grid g-assets">${list.map(assetCard).join('')}</div>`)
    : S.assets.length ? emptyState('search', 'No assets match these filters', 'Try a different search term, or reset the filters.', `<button class="btn" data-act="reset">Reset filters</button>`)
    : emptyState('library', 'The library is empty', 'Approved AMB assets will appear here once they’re uploaded.', can('upload') && S.cap.assets ? `<button class="btn primary" data-act="upload">${icon('upload')}Upload the first asset</button>` : '')}`;
}
function bindLibrary(root) {
  const f = S.ui.lib;
  const q = $('#lib-q', root); q.addEventListener('input', debounce(() => { f.q = q.value; renderView(); setTimeout(() => { const i = $('#lib-q'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 0); }, 200));
  [['lib-cat', 'cat'], ['lib-fmt', 'fmt'], ['lib-status', 'status'], ['lib-sort', 'sort']].forEach(([id, k]) => $('#' + id, root).addEventListener('change', e => { f[k] = e.target.value; renderView(); }));
  $$('[data-view]', root).forEach(b => b.addEventListener('click', () => { f.view = b.dataset.view; renderView(); }));
  $$('[data-folder]', root).forEach(b => b.addEventListener('click', () => { f.folder = b.dataset.folder; renderView(); }));
  $$('[data-act=upload]', root).forEach(b => b.addEventListener('click', () => openUpload({ folderId: !['all', 'none'].includes(f.folder) ? f.folder : '' })));
  const nf = $('[data-act=new-folder]', root); if (nf) nf.addEventListener('click', () => openFolderModal());
  const rf = $('[data-act=rename-folder]', root); if (rf) rf.addEventListener('click', () => openFolderModal(S.folders.find(x => x.id === f.folder)));
  const df = $('[data-act=delete-folder]', root); if (df) df.addEventListener('click', () => deleteFolder(S.folders.find(x => x.id === f.folder)));
  const rs = $('[data-act=reset]', root); if (rs) rs.addEventListener('click', () => { Object.assign(f, { q: '', cat: 'all', fmt: 'all', status: 'active', folder: 'all' }); renderView(); });
  bindAssetClicks(root);
}
function openFolderModal(existing) {
  modal({ title: existing ? 'Rename folder' : 'New folder', subtitle: 'Folders group assets within the library, e.g. “2026 Expo” or “Granny Flats campaign”.',
    body: `<div class="field"><label for="fo-name">Folder name</label><input class="input" id="fo-name" maxlength="60" value="${esc(existing ? existing.name : '')}"></div>
      <div class="field"><label for="fo-cat">Main category (optional)</label><select class="select" id="fo-cat">${selectOpts(categories().map(c => ({ value: c.id, label: c.label })), existing ? existing.category : '', 'Any category')}</select></div>`,
    actions: [{ label: 'Cancel' }, { label: existing ? 'Save' : 'Create folder', primary: true, onClick: async (m) => {
      const name = formVal(m, 'fo-name'); if (!name) { showErr(m, 'Enter a folder name.'); return false; }
      if (S.folders.some(x => x.name.toLowerCase() === name.toLowerCase() && (!existing || x.id !== existing.id))) { showErr(m, 'A folder with that name already exists.'); return false; }
      const id = existing ? existing.id : uid();
      const base = existing ? { createdBy: existing.createdBy || null, createdAt: existing.createdAt || nowIso() } : { createdBy: S.me.id, createdAt: nowIso() };
      const ok = await dbSet('folders/' + id, Object.assign(base, { name, category: formVal(m, 'fo-cat'), updatedAt: nowIso() }));
      if (!ok) return false;
      logActivity(existing ? 'folder-rename' : 'folder-create', name); toast(existing ? 'Folder renamed' : 'Folder created');
    } }] });
}
async function deleteFolder(fo) {
  if (!fo) return;
  const inside = S.assets.filter(a => a.folderId === fo.id);
  if (!await confirmDialog('Delete folder “' + fo.name + '”?', inside.length ? `The ${inside.length} asset(s) inside will move to Unfiled. No files are deleted.` : 'This folder is empty.', { label: 'Delete folder', danger: true })) return;
  for (const a of inside) await dbUpdate('assets/' + a.id, { folderId: '' });
  if (await dbDelete('folders/' + fo.id)) { S.ui.lib.folder = 'all'; logActivity('folder-delete', fo.name); toast('Folder deleted'); }
}

/* ================= LOGOS ================= */
function viewLogos() {
  const logos = activeAssets().filter(a => a.category === 'logo');
  const sub = S.ui.logoSub;
  const list = logos.filter(a => sub === 'all' ? true : LOGO_FILE_FILTERS.some(x => x.id === sub) ? assetExt(a) === sub : a.subcategory === sub);
  const gl = S.settings.guidelines || {};
  const cnt = s => LOGO_FILE_FILTERS.some(x => x.id === s) ? logos.filter(a => assetExt(a) === s).length : logos.filter(a => a.subcategory === s).length;
  return `
  <div class="page-head"><div><span class="eyebrow">Brand</span><h1>Logos</h1><p>Approved AMB logo files and variations. Check background compatibility and usage notes before you download.</p></div>
    <div class="btn-row">${can('content') && S.cap.db ? `<button class="btn" data-list="logoSubs">${icon('list')}Edit logo types</button><button class="btn" data-list="bgOptions">${icon('list')}Edit background options</button>` : ''}${can('brand') ? `<button class="btn" data-act="edit-guidelines">${icon('edit')}Edit logo guidelines</button>` : ''}${can('upload') && S.cap.assets ? `<button class="btn primary" data-act="upload">${icon('upload')}Upload logo</button>` : ''}</div></div>
  <div class="chips">
    <button class="chip ${sub === 'all' ? 'on' : ''}" data-sub="all">All logos<span class="n">${logos.length}</span></button>
    ${logoSubs().map(s => `<button class="chip ${sub === s ? 'on' : ''}" data-sub="${esc(s)}">${esc(s)}<span class="n">${cnt(s)}</span></button>`).join('')}
    ${LOGO_FILE_FILTERS.map(s => `<button class="chip ${sub === s.id ? 'on' : ''}" data-sub="${s.id}">${esc(s.label)}<span class="n">${cnt(s.id)}</span></button>`).join('')}
  </div>
  ${list.length ? `<div class="grid g-assets">${list.map(assetCard).join('')}</div>` : emptyState('logo', sub === 'all' ? 'No logos uploaded yet' : 'No files in “' + (LOGO_FILE_FILTERS.find(x => x.id === sub) || { label: sub }).label + '”', 'Upload the official AMB logo files. Each upload is reviewed by an administrator before it shows as approved.', can('upload') && S.cap.assets ? `<button class="btn primary" data-act="upload">${icon('upload')}Upload logo</button>` : '')}
  <section class="card card-pad" style="display:flex;flex-direction:column;gap:14px">
    <div class="section-head"><div><h2>Logo usage guidelines</h2><p>${gl.status === 'approved' ? 'Approved by an administrator' : 'Draft. An administrator needs to review and approve these guidelines.'}${gl.updatedAt ? ' · updated ' + esc(fmtDate(gl.updatedAt)) : ''}</p></div>${gl.status === 'approved' ? '<span class="pill st-approved">Approved</span>' : '<span class="pill st-draft">Draft</span>'}</div>
    ${gl.logoIntro ? `<p class="guide-block">${esc(gl.logoIntro)}</p>` : ''}
    <div class="dodont">
      <div class="do"><h3>Do</h3><ul>${(gl.logoDos || []).map(x => `<li>${icon('check')}<span>${esc(x)}</span></li>`).join('') || '<li class="muted">No rules added yet.</li>'}</ul></div>
      <div class="dont"><h3>Don’t</h3><ul>${(gl.logoDonts || []).map(x => `<li>${icon('x')}<span>${esc(x)}</span></li>`).join('') || '<li class="muted">No rules added yet.</li>'}</ul></div>
    </div>
  </section>`;
}
function bindLogos(root) {
  $$('[data-sub]', root).forEach(b => b.addEventListener('click', () => { S.ui.logoSub = b.dataset.sub; renderView(); }));
  $$('[data-act=upload]', root).forEach(b => b.addEventListener('click', () => openUpload({ category: 'logo', subcategory: logoSubs().includes(S.ui.logoSub) ? S.ui.logoSub : '' })));
  const eg = $('[data-act=edit-guidelines]', root); if (eg) eg.addEventListener('click', openGuidelinesModal);
  $$('[data-list]', root).forEach(b => b.addEventListener('click', () => openListModal(b.dataset.list)));
  bindAssetClicks(root);
}
function openGuidelinesModal() {
  const gl = S.settings.guidelines || {};
  modal({ title: 'Logo usage guidelines', subtitle: 'Shown on the Logos page. One rule per line.', wide: true,
    body: `<div class="field"><label for="gl-intro">Introduction</label><textarea class="textarea" id="gl-intro">${esc(gl.logoIntro || '')}</textarea></div>
    <div class="form-grid"><div class="field"><label for="gl-dos">Do</label><textarea class="textarea" id="gl-dos" style="min-height:160px">${esc((gl.logoDos || []).join('\n'))}</textarea></div>
    <div class="field"><label for="gl-donts">Don’t</label><textarea class="textarea" id="gl-donts" style="min-height:160px">${esc((gl.logoDonts || []).join('\n'))}</textarea></div></div>
    ${statusField('gl-status', gl.status || 'draft', [{ value: 'draft', label: 'Draft' }, { value: 'approved', label: 'Approved' }])}`,
    actions: [{ label: 'Cancel' }, { label: 'Save guidelines', primary: true, onClick: async m => {
      const lines = id => formVal(m, id).split('\n').map(s => s.trim()).filter(Boolean);
      const ok = await dbSet('settings/guidelines', Object.assign({}, gl, { logoIntro: formVal(m, 'gl-intro'), logoDos: lines('gl-dos'), logoDonts: lines('gl-donts'), status: formVal(m, 'gl-status'), updatedAt: nowIso(), updatedBy: S.me.id }));
      if (!ok) return false; logActivity('brand', 'Logo usage guidelines updated'); toast('Guidelines saved');
    } }] });
}

/* ================= TEMPLATES ================= */
function viewTemplates() {
  const tpls = activeAssets().filter(a => a.category === 'template');
  const sub = S.ui.tplSub;
  const list = sub === 'all' ? tpls : tpls.filter(a => a.subcategory === sub);
  return `
  <div class="page-head"><div><span class="eyebrow">Brand</span><h1>Templates</h1><p>Approved, editable templates for social media, print, presentations and email. Each template links to its editable source file.</p></div>
    <div class="btn-row">${can('content') && S.cap.db ? `<button class="btn" data-list="templateSubs">${icon('list')}Edit template types</button>` : ''}${can('upload') && S.cap.assets ? `<button class="btn primary" data-act="upload">${icon('upload')}Add template</button>` : ''}</div></div>
  <div class="chips"><button class="chip ${sub === 'all' ? 'on' : ''}" data-sub="all">All templates<span class="n">${tpls.length}</span></button>
    ${templateSubs().map(s => `<button class="chip ${sub === s ? 'on' : ''}" data-sub="${esc(s)}">${esc(s)}<span class="n">${tpls.filter(a => a.subcategory === s).length}</span></button>`).join('')}</div>
  ${list.length ? `<div class="grid g-assets">${list.map(a => assetCard(a).replace('</div></article>', `<div class="small muted" style="display:flex;gap:6px;align-items:center;margin-top:2px">${a.sourceUrl ? icon('link', 'width="14" height="14"') + ' Editable source linked' : 'No source link yet'}</div></div></article>`)).join('')}</div>`
    : emptyState('template', 'No templates here yet', 'Upload a PNG or PDF preview and add a link to the editable file (Canva, InDesign on SharePoint, Google Slides…).', can('upload') && S.cap.assets ? `<button class="btn primary" data-act="upload">${icon('upload')}Add template</button>` : '')}`;
}
function bindTemplates(root) {
  $$('[data-sub]', root).forEach(b => b.addEventListener('click', () => { S.ui.tplSub = b.dataset.sub; renderView(); }));
  $$('[data-list]', root).forEach(b => b.addEventListener('click', () => openListModal(b.dataset.list)));
  $$('[data-act=upload]', root).forEach(b => b.addEventListener('click', () => openUpload({ category: 'template', subcategory: S.ui.tplSub !== 'all' ? S.ui.tplSub : '' })));
  bindAssetClicks(root);
}

/* ================= RECENT & ARCHIVED ================= */
function activityLine(ev) {
  const who = `<b>${esc(personName(ev.by))}</b>`;
  const map = { request: 'requested', upload: 'uploaded', replace: 'uploaded a new version of', approve: 'approved', reject: 'rejected', archive: 'archived', restore: 'restored', edit: 'edited', delete: 'deleted', download: 'downloaded', brand: 'updated', 'folder-create': 'created folder', 'folder-rename': 'renamed folder', 'folder-delete': 'deleted folder', role: 'changed a role:', settings: 'updated settings:' };
  return `${who} ${map[ev.type] || ev.type} <span>${esc(ev.label || '')}</span>`;
}
function feedHtml(items) {
  resolveProfiles(items.map(i => i.by));
  return items.length ? `<div class="feed">${items.map(ev => `<div class="feed-item"><img src="${esc(personAvatar(ev.by))}" alt=""><div class="grow">${activityLine(ev)}</div><span class="when">${esc(relTime(ev.at))}</span></div>`).join('')}</div>` : `<p class="muted small">No activity yet.</p>`;
}
function viewRecent() {
  const list = sortBy(S.assets.filter(a => statusOf(a) !== 'archived'), a => a.updatedAt || a.createdAt || '', -1).slice(0, 24);
  const feed = S.activity.filter(a => a.type !== 'download').slice(0, 25);
  return `<div class="page-head"><div><span class="eyebrow">Manage</span><h1>Recently Updated</h1><p>The latest uploads, new versions, approvals and brand changes.</p></div></div>
  <section class="two-col">
    <div>${list.length ? assetTable(list) : emptyState('recent', 'Nothing updated yet', 'Changes to assets will show here.')}</div>
    <div class="card card-pad"><h2 style="margin-bottom:6px">Activity</h2>${feedHtml(feed)}</div>
  </section>
  ${requestsPanel({ limit: 20 })}`;
}
function viewArchived() {
  const list = sortBy(S.assets.filter(a => statusOf(a) === 'archived'), a => a.archivedAt || (S.approvals[a.id] || {}).at || '', -1);
  return `<div class="page-head"><div><span class="eyebrow">Manage</span><h1>Archived Assets</h1><p>Outdated files kept for reference. Archived assets don’t appear in search or category pages. ${can('archive') ? 'Restore a file to send it back to the library.' : 'Ask your team to restore a file you need.'}</p></div></div>
  ${list.length ? `<div class="card table-wrap"><table class="tbl"><thead><tr><th></th><th>Name</th><th>Filename</th><th>Archived</th><th>Reason</th><th></th></tr></thead><tbody>
    ${list.map(a => { const ap = S.approvals[a.id] || {}; return `<tr class="click" data-asset="${esc(a.id)}" tabindex="0"><td>${thumbHtml(a, 'tthumb')}</td><td><b>${esc(a.name)}</b></td><td class="mono small muted">${esc(a.filename)}</td><td class="small muted tnum">${esc(fmtDate(a.archivedAt || ap.at))}</td><td class="small">${esc(a.archiveNote || ap.note || '—')}</td><td>${can('archive') ? `<button class="btn sm" data-restore="${esc(a.id)}">${icon('restore')}Restore</button>` : ''}</td></tr>`; }).join('')}
  </tbody></table></div>` : emptyState('archive', 'No archived assets', 'When an administrator archives an outdated file, it moves here.')}`;
}
function bindArchived(root) {
  $$('[data-restore]', root).forEach(b => b.addEventListener('click', e => { e.stopPropagation(); const a = S.assets.find(x => x.id === b.dataset.restore); if (a) restoreAsset(a); }));
  bindAssetClicks(root);
}

/* ================= ASSET DRAWER ================= */
function canEditAsset(a) { return can('editAny') || (can('editOwn') && a.uploadedBy && a.uploadedBy === S.me.id); }
function renderDrawer() {
  const root = $('#drawer-root');
  if (!drawerState) { root.innerHTML = ''; return; }
  const a = S.assets.find(x => x.id === drawerState.id);
  if (!a) { root.innerHTML = ''; drawerState = null; return; }
  const scroll = $('.drawer-body', root) ? $('.drawer-body', root).scrollTop : 0;
  const st = statusOf(a); const ap = S.approvals[a.id];
  const ct = a.contentType || ''; const prev = a.previewId || (isImageType(ct) ? a.fileId : '');
  const bg = drawerState.bg || ((a.bgCompat || [])[0] === 'Dark backgrounds' ? 'dark' : (a.bgCompat || [])[0] === 'AMB Green backgrounds' ? 'green' : (ct === 'image/png' || ct === 'image/svg+xml') ? 'checker' : 'white');
  let previewInner;
  if (/^video\//.test(ct) && a.fileId) previewInner = `<video src="${esc(blobUrl(a.fileId))}" controls ${a.previewId ? `poster="${esc(blobUrl(a.previewId))}"` : ''}></video>`;
  else if (prev) previewInner = `<img src="${esc(blobUrl(prev))}" alt="Preview of ${esc(a.name)}">`;
  else if (/^font\//.test(ct)) previewInner = `<div class="ph" style="color:var(--muted);display:flex;flex-direction:column;align-items:center;gap:8px">${icon('font', 'width="40" height="40"')}<span>Font file. Download to install.</span></div>`;
  else previewInner = `<div class="ph" style="color:var(--muted);display:flex;flex-direction:column;align-items:center;gap:8px">${icon('file', 'width="40" height="40"')}<span>No preview for ${esc(assetExt(a).toUpperCase())} files</span></div>`;
  const folder = S.folders.find(f => f.id === a.folderId);
  const versions = sortBy(a.versions || [], v => v.version || 0, -1);
  resolveProfiles([a.uploadedBy, a.updatedBy, ap && ap.by, ...versions.map(v => v.by)]);
  const bgBtn = (k, cls, label) => `<button type="button" class="${cls}${bg === k ? ' on' : ''}" data-bg="${k}" aria-label="${label}" title="${label}"></button>`;
  root.innerHTML = `<div class="overlay" data-close></div>
  <aside class="drawer" role="dialog" aria-modal="true" aria-label="${esc(a.name)}">
    <div class="drawer-head"><div class="grow"><div class="btn-row" style="gap:6px;margin-bottom:6px">${statusPill(st)}${isDemo(a) ? demoPill() : ''}<span class="tag">${esc(catLabel(a.category))}</span>${a.subcategory ? `<span class="tag">${esc(a.subcategory)}</span>` : ''}</div><h2>${esc(a.name)}</h2></div><button class="btn ghost icon" data-close aria-label="Close">${icon('x')}</button></div>
    <div class="drawer-body">
      ${isDemo(a) ? `<div class="banner demo" style="margin:0">${icon('info')}<span class="grow">This is a <b>sample file</b> created to demonstrate the library. It is not an official AMB asset. Do not use it in published material.</span></div>` : ''}
      ${st === 'rejected' && ap ? `<div class="banner warn" style="margin:0">${icon('warn')}<span class="grow"><b>Rejected:</b> ${esc(ap.note || 'No reason given.')}</span></div>` : ''}
      ${st === 'pending' && ap && ap.version !== (a.version || 1) && ap.state === 'approved' ? `<div class="banner info" style="margin:0">${icon('info')}<span class="grow">V${String(ap.version).padStart(2, '0')} was approved. This new version needs review before it’s official.</span></div>` : ''}
      <div class="preview ${bg === 'dark' ? 'bg-dark' : bg === 'green' ? 'bg-green' : bg === 'checker' ? 'checker' : 'bg-white'}">${previewInner}</div>
      ${prev ? `<div class="btn-row" style="justify-content:space-between"><span class="small muted">Preview background</span><div class="bg-switch">${bgBtn('checker', 'checker', 'Transparent')}${bgBtn('white', 'bg-white', 'White')}${bgBtn('dark', 'bg-dark', 'Charcoal')}${bgBtn('green', 'bg-green', 'AMB Green')}</div></div>` : ''}
      <div class="field"><span class="lbl">Standard filename</span><div class="filename"><code>${esc(a.filename)}.${esc(assetExt(a))}</code><button class="btn sm" data-copy-fn>${icon('copy')}Copy</button></div>
        ${(() => { const v = validateFilename(a.filename); return v.ok ? '' : `<span class="small" style="color:var(--warn)">Doesn’t fully match the naming convention: ${esc(v.issues[0])}</span>`; })()}</div>
      <div class="meta">
        <div>Format</div><div><span class="mono">${esc(assetExt(a).toUpperCase())}</span> <span class="muted small">${esc(ct)}</span></div>
        <div>Dimensions</div><div class="tnum">${a.width && a.height ? esc(a.width + ' × ' + a.height + ' px') + ` <span class="muted small">(${esc(ratio(a.width, a.height))})</span>` : '—'}</div>
        <div>File size</div><div class="tnum">${esc(fmtBytes(a.sizeBytes))}</div>
        <div>Version</div><div class="mono">V${String(a.version || 1).padStart(2, '0')}</div>
        ${a.category === 'logo' || (a.bgCompat || []).length ? `<div>Backgrounds</div><div>${(a.bgCompat || []).map(b => `<span class="tag" style="margin:0 4px 4px 0">${esc(b)}</span>`).join('') || '<span class="muted">Not specified</span>'}</div>` : ''}
        ${a.platform ? `<div>Platform</div><div>${esc(a.platform)}</div>` : ''}
        <div>Folder</div><div>${folder ? esc(folder.name) : '<span class="muted">Unfiled</span>'}</div>
        <div>Tags</div><div>${(a.tags || []).map(t => `<span class="tag" style="margin:0 4px 4px 0">${esc(t)}</span>`).join('') || '<span class="muted">None</span>'}</div>
        <div>Editable source</div><div>${a.sourceUrl && /^https?:\/\//i.test(a.sourceUrl) ? `<a href="${esc(a.sourceUrl)}" target="_blank" rel="noopener">${icon('external', 'width="13" height="13"')} Open source file</a><br><span class="small muted mono">${esc(a.sourceUrl)}</span>` : '<span class="muted">No link added</span>'}</div>
        <div>Uploaded</div><div>${esc(fmtDateTime(a.createdAt))} · ${esc(personName(a.uploadedBy))}</div>
        <div>Last modified</div><div>${esc(fmtDateTime(a.updatedAt || a.createdAt))} · ${esc(personName(a.updatedBy || a.uploadedBy))}</div>
        <div>Approval</div><div>${a.archived ? 'Archived ' + esc(fmtDate(a.archivedAt)) + ' by ' + esc(personName(a.archivedBy)) : ap && (ap.version === (a.version || 1) || ap.state === 'archived') ? `${esc(STATUS_LABEL[ap.state] || ap.state)} by ${esc(personName(ap.by))}, ${esc(fmtDate(ap.at))}` : 'Awaiting administrator review'}</div>
      </div>
      ${a.description ? `<div class="kv"><b>Description</b><p>${esc(a.description)}</p></div>` : ''}
      <div class="kv"><b>Usage instructions</b><p class="guide-block">${esc(a.usage || 'No usage instructions added.')}</p></div>
      <div><h3 style="margin-bottom:6px">Version history</h3>
        ${versions.map(v => `<div class="ver"><span class="vnum">V${String(v.version).padStart(2, '0')}</span><div class="grow"><span>${esc(v.note || (v.version === 1 ? 'Original upload' : 'New version'))}</span><br><span class="small muted">${esc(fmtDateTime(v.at))} · ${esc(personName(v.by))} · ${esc(fmtBytes(v.sizeBytes))}</span></div>${v.version === (a.version || 1) ? '<span class="pill st-draft nodot">Current</span>' : ''}<button class="btn sm icon" data-dlv="${esc(String(v.version))}" aria-label="Download version ${v.version}">${icon('download')}</button></div>`).join('') || '<p class="muted small">No history.</p>'}
      </div>
    </div>
    <div class="drawer-foot">
      <button class="btn primary" data-act="download">${icon('download')}Download</button>
      ${a.fileId ? `<a class="btn" href="${esc(blobUrl(a.fileId))}" target="_blank" rel="noopener">${icon('external')}Open</a>` : ''}
      ${canEditAsset(a) ? `<button class="btn" data-act="edit">${icon('edit')}Edit details</button>` : ''}
      ${can('replace') && S.cap.assets && st !== 'archived' ? `<button class="btn" data-act="replace">${icon('replace')}Replace file</button>` : ''}
      ${can('approve') && st !== 'approved' && st !== 'archived' ? `<button class="btn" data-act="approve" style="color:var(--ok)">${icon('check')}Approve</button>` : ''}
      ${can('approve') && st !== 'rejected' && st !== 'archived' ? `<button class="btn danger" data-act="reject">${icon('x')}Reject</button>` : ''}
      ${can('content') && st === 'approved' ? `<button class="btn" data-act="quick">${icon('star')}${a.quick ? 'Remove from quick downloads' : 'Add to quick downloads'}</button>` : ''}
      ${can('settings') && a.category === 'logo' && prev ? `<button class="btn" data-act="portal-logo">Use as portal logo</button>` : ''}
      ${can('archive') && st !== 'archived' ? `<button class="btn" data-act="archive">${icon('archive')}Archive</button>` : ''}
      ${can('archive') && st === 'archived' ? `<button class="btn" data-act="restore">${icon('restore')}Restore</button>` : ''}
      ${can('del') ? `<button class="btn danger" data-act="delete">${icon('trash')}Delete</button>` : ''}
    </div>
  </aside>`;
  $('.drawer-body', root).scrollTop = scroll;
  $$('[data-close]', root).forEach(b => b.addEventListener('click', closeDrawer));
  $$('[data-bg]', root).forEach(b => b.addEventListener('click', () => { drawerState.bg = b.dataset.bg; renderDrawer(); }));
  $('[data-copy-fn]', root).addEventListener('click', () => copyText(a.filename + '.' + assetExt(a), 'Filename copied'));
  $$('[data-dlv]', root).forEach(b => b.addEventListener('click', () => { const v = (a.versions || []).find(x => String(x.version) === b.dataset.dlv); if (v) downloadFile(v.fileId, v.filename || a.filename, v.ext, v.contentType); }));
  const act = (n, fn) => { const b = $(`[data-act=${n}]`, root); if (b) b.addEventListener('click', fn); };
  act('download', () => downloadAsset(a));
  act('edit', () => openEditAsset(a));
  act('replace', () => openReplace(a));
  act('approve', () => approveAsset(a));
  act('reject', () => rejectAsset(a));
  act('archive', () => archiveAsset(a));
  act('restore', () => restoreAsset(a));
  act('delete', () => deleteAsset(a));
  act('quick', async () => { if (await dbUpdate('assets/' + a.id, { quick: !a.quick })) toast(a.quick ? 'Removed from quick downloads' : 'Added to quick downloads'); });
  act('portal-logo', async () => { if (await dbSet('settings/general', Object.assign({}, S.settings.general || {}, { portalLogoAssetId: a.id, updatedAt: nowIso() }))) { logActivity('settings', 'Portal logo set to ' + a.name); toast('Portal logo updated'); } });
}
function downloadAsset(a) {
  if (isDemo(a)) toast('Heads up: this is a DEMO file, not an official AMB asset.');
  downloadFile(a.fileId, a.filename, assetExt(a), a.contentType);
}

/* ================= APPROVAL ACTIONS ================= */
async function approveAsset(a) {
  if (!can('approve')) return;
  const ok = await dbSet('approvals/' + a.id, { state: 'approved', version: a.version || 1, by: S.me.id, at: nowIso(), note: '' });
  if (ok) { logActivity('approve', a.name, { assetId: a.id }); toast('Approved ' + a.name); }
  return ok;
}
function rejectAsset(a) {
  modal({ title: 'Reject “' + a.name + '”', subtitle: 'The uploader will see this reason on the asset.',
    body: `<div class="field"><label for="rj-note">Reason</label><textarea class="textarea" id="rj-note" placeholder="e.g. Logo has the old tagline. Please upload the 2026 version."></textarea></div>`,
    actions: [{ label: 'Cancel' }, { label: 'Reject asset', danger: true, onClick: async m => {
      const note = formVal(m, 'rj-note'); if (!note) { showErr(m, 'Add a reason so the uploader knows what to fix.'); return false; }
      const ok = await dbSet('approvals/' + a.id, { state: 'rejected', version: a.version || 1, by: S.me.id, at: nowIso(), note });
      if (!ok) return false; logActivity('reject', a.name, { assetId: a.id }); toast('Asset rejected');
    } }] });
}
function archiveAsset(a) {
  modal({ title: 'Archive “' + a.name + '”?', subtitle: 'Archived assets are hidden from the library but kept for reference. You can restore them later.',
    body: `<div class="field"><label for="ar-note">Reason (optional)</label><input class="input" id="ar-note" placeholder="e.g. Replaced by 2026 brand refresh"></div>`,
    actions: [{ label: 'Cancel' }, { label: 'Archive', primary: true, onClick: async m => {
      const ok = await dbUpdate('assets/' + a.id, { archived: true, archivedAt: nowIso(), archivedBy: S.me.id, archiveNote: formVal(m, 'ar-note'), quick: false });
      if (!ok) return false; logActivity('archive', a.name, { assetId: a.id }); toast('Asset archived');
    } }] });
}
async function restoreAsset(a) {
  let ok = true;
  if (a.archived) ok = await dbUpdate('assets/' + a.id, { archived: false });
  const ap = S.approvals[a.id] || {};
  if (ok && ap.state === 'archived' && can('approve')) {
    if (ap.prevState === 'approved' || ap.prevState === 'rejected') ok = await dbSet('approvals/' + a.id, { state: ap.prevState, version: ap.version || a.version || 1, by: S.me.id, at: nowIso(), note: '' });
    else ok = await dbDelete('approvals/' + a.id);
  }
  if (ok) { logActivity('restore', a.name, { assetId: a.id }); toast('Asset restored'); }
}
async function deleteAsset(a) {
  if (!await confirmDialog('Permanently delete “' + a.name + '”?', `This removes the asset and all ${(a.versions || []).length || 1} stored file version(s) for everyone. This can’t be undone. Archive it instead if you might need it again.`, { label: 'Delete permanently', danger: true })) return;
  closeDrawer();
  if (await removeAssets([a])) toast('Asset deleted');
}
async function removeAssets(list) {
  const ids = new Set(list.map(a => a.id));
  const others = new Set(); S.assets.filter(x => !ids.has(x.id)).forEach(x => { [x.fileId, x.previewId, ...(x.versions || []).flatMap(v => [v.fileId, v.previewId])].forEach(i => i && others.add(i)); });
  let ok = 0;
  for (const a of list) {
    const fileIds = new Set(); (a.versions || []).forEach(v => { if (v.fileId) fileIds.add(v.fileId); if (v.previewId) fileIds.add(v.previewId); }); if (a.fileId) fileIds.add(a.fileId); if (a.previewId) fileIds.add(a.previewId);
    if (!await dbDelete('assets/' + a.id)) break;
    ok++; S.sel.delete(a.id);
    if (can('approve')) await dbDeleteQuiet('approvals/' + a.id);
    if (S.cap.assets) for (const id of fileIds) { if (!others.has(id)) { others.add(id); try { await S.cap.assets.delete(id); } catch (e) { /* another uploader's file; ignore */ } } }
    logActivity('delete', a.name);
  }
  return ok;
}

/* ================= UPLOAD / EDIT / REPLACE ================= */
function platformOptions() { const n = naming(); return (n.platforms && n.platforms.length ? n.platforms : [{ code: 'Website', label: 'Website' }, { code: 'Facebook', label: 'Facebook' }, { code: 'Instagram', label: 'Instagram' }, { code: 'YouTube', label: 'YouTube' }, { code: 'LinkedIn', label: 'LinkedIn' }, { code: 'Print', label: 'Print' }, { code: 'Email', label: 'Email' }]); }
function subOptionsFor(cat) { return cat === 'logo' ? logoSubs() : cat === 'template' ? templateSubs() : null; }
function assetFormFields(d, { isNew }) {
  const subs = subOptionsFor(d.category);
  return `
  <div class="form-grid">
    <div class="field full"><label for="af-name">Display name *</label><input class="input" id="af-name" maxlength="90" value="${esc(d.name || '')}" placeholder="e.g. Primary Logo, Full Colour"></div>
    <div class="field"><label for="af-cat">Category *</label><select class="select" id="af-cat">${selectOpts(categories().map(c => ({ value: c.id, label: c.label })), d.category || '', 'Choose a category')}</select></div>
    <div class="field"><label for="af-sub">Subcategory</label>${subs ? `<select class="select" id="af-sub">${selectOpts(subs, d.subcategory || '', 'None')}</select>` : `<input class="input" id="af-sub" maxlength="60" value="${esc(d.subcategory || '')}" placeholder="Optional">`}</div>
    <div class="field"><label for="af-folder">Folder</label><select class="select" id="af-folder">${selectOpts(sortBy(S.folders, f => f.name.toLowerCase()).map(f => ({ value: f.id, label: f.name })), d.folderId || '', 'Unfiled')}</select></div>
    <div class="field"><label for="af-platform">Platform / use</label><select class="select" id="af-platform">${selectOpts(platformOptions().map(p => ({ value: p.code, label: p.label })), d.platform || '', 'None')}</select></div>
    <div class="field"><label for="af-size">Size segment</label><input class="input" id="af-size" maxlength="20" value="${esc(d.sizeSeg || '')}" placeholder="1080x1080, A4…"><span class="hint">Auto-filled from the image when possible.</span></div>
    <div class="field"><label for="af-date">Date segment</label><select class="select" id="af-date">${selectOpts([{ value: 'none', label: 'No date' }, { value: 'YYYY', label: 'Year (' + dateStamp('YYYY') + ')' }, { value: 'YYYYMM', label: 'Year + month (' + dateStamp('YYYYMM') + ')' }, { value: 'YYYYMMDD', label: 'Full date (' + dateStamp('YYYYMMDD') + ')' }], d.dateFmt || naming().dateFormat || 'YYYY')}</select></div>
    <div class="field full"><label for="af-filename">Standard filename</label><div class="filename"><code id="af-fn-preview"></code><span class="muted small" id="af-fn-ext"></span></div>
      <label class="check" style="width:max-content"><input type="checkbox" id="af-fn-custom" ${d.customFilename ? 'checked' : ''}> Override the generated filename</label>
      <input class="input mono" id="af-filename" value="${esc(d.filename || '')}" ${d.customFilename ? '' : 'hidden'}><span class="small" id="af-fn-check"></span></div>
    <div class="field full"><label for="af-tags">Keywords / tags</label><input class="input" id="af-tags" value="${esc((d.tags || []).join(', '))}" placeholder="granny flat, expo, cabin (comma separated)"></div>
    <div class="field full"><label for="af-desc">Description</label><textarea class="textarea" id="af-desc" style="min-height:64px">${esc(d.description || '')}</textarea></div>
    <div class="field full"><label for="af-usage">Usage instructions</label><textarea class="textarea" id="af-usage" style="min-height:64px" placeholder="Where and how this asset should be used. Minimum size, clear space, backgrounds…">${esc(d.usage || '')}</textarea></div>
    <div class="field full"><span class="lbl">Background compatibility</span><div class="checks">${bgOptions().map((b, i) => `<label class="check"><input type="checkbox" class="af-bg" value="${esc(b)}" ${(d.bgCompat || []).includes(b) ? 'checked' : ''}> ${esc(b)}</label>`).join('')}</div></div>
    <div class="field full"><label for="af-source">Editable source file link</label><input class="input" id="af-source" type="url" value="${esc(d.sourceUrl || '')}" placeholder="https://… (SharePoint, Google Drive, Canva)"><span class="hint">For AI, PSD, INDD, PPTX or other files that can’t be stored here.</span></div>
    ${isNew && can('approve') ? `<label class="check full" style="width:max-content"><input type="checkbox" id="af-approve" checked> Approve immediately (you’re an administrator)</label>` : ''}
  </div>`;
}
function bindAssetForm(m, ctx) {
  const upd = () => {
    const cat = formVal(m, 'af-cat');
    const auto = buildFilename({ category: cat ? catCode(cat) : 'Category', assetName: formVal(m, 'af-name') || 'AssetName', platform: formVal(m, 'af-platform'), size: formVal(m, 'af-size'), version: ctx.version || 1, date: dateStamp(formVal(m, 'af-date')) });
    const custom = formVal(m, 'af-fn-custom');
    const fnInput = m.querySelector('#af-filename');
    fnInput.hidden = !custom;
    if (!custom) fnInput.value = auto;
    const fn = custom ? fnInput.value.trim() : auto;
    m.querySelector('#af-fn-preview').textContent = fn;
    m.querySelector('#af-fn-ext').textContent = ctx.ext ? '.' + ctx.ext : '';
    const v = validateFilename(fn); const ch = m.querySelector('#af-fn-check');
    ch.textContent = v.ok ? '✓ Matches the AMB naming convention' : '⚠ ' + v.issues[0]; ch.style.color = v.ok ? 'var(--ok)' : 'var(--warn)';
  };
  ['af-name', 'af-platform', 'af-size', 'af-date', 'af-fn-custom', 'af-filename'].forEach(id => { const e = m.querySelector('#' + id); e.addEventListener('input', upd); e.addEventListener('change', upd); });
  m.querySelector('#af-cat').addEventListener('change', () => {
    const cat = formVal(m, 'af-cat'); const subs = subOptionsFor(cat); const holder = m.querySelector('#af-sub').parentElement; const cur = formVal(m, 'af-sub');
    m.querySelector('#af-sub').outerHTML = subs ? `<select class="select" id="af-sub">${selectOpts(subs, subs.includes(cur) ? cur : '', 'None')}</select>` : `<input class="input" id="af-sub" maxlength="60" placeholder="Optional">`;
    void holder; upd();
  });
  ctx.refresh = upd; upd();
}
function readAssetForm(m) {
  const custom = formVal(m, 'af-fn-custom');
  return {
    name: formVal(m, 'af-name'), category: formVal(m, 'af-cat'), subcategory: formVal(m, 'af-sub'), folderId: formVal(m, 'af-folder'),
    platform: formVal(m, 'af-platform'), sizeSeg: formVal(m, 'af-size'), dateFmt: formVal(m, 'af-date'),
    filename: (m.querySelector('#af-fn-preview').textContent || '').trim(), customFilename: !!custom,
    tags: formVal(m, 'af-tags').split(',').map(t => t.trim()).filter(Boolean).slice(0, 20),
    description: formVal(m, 'af-desc'), usage: formVal(m, 'af-usage'),
    bgCompat: $$('.af-bg', m).filter(c => c.checked).map(c => c.value), sourceUrl: formVal(m, 'af-source'),
  };
}
function validateAssetData(d) {
  if (!d.name) return 'Enter a display name.';
  if (!d.category) return 'Choose a category.';
  if (!d.filename || /[^A-Za-z0-9_\-]/.test(d.filename)) return 'The filename can only contain letters, numbers and underscores.';
  if (d.sourceUrl && !/^https?:\/\//i.test(d.sourceUrl)) return 'The source file link must start with https://';
  return '';
}
function filePickerHtml(prefix, label, hint) {
  return `<div class="field"><span class="lbl">${esc(label)}</span>
    <div class="dropzone" id="${prefix}-dz" tabindex="0" role="button" aria-label="${esc(label)}">${icon('upload')}<b style="color:var(--ink)">Drop a file here or click to browse</b><span class="small">${esc(hint)}</span></div>
    <div class="file-pick" id="${prefix}-picked" hidden></div><input type="file" id="${prefix}-input" hidden></div>`;
}
function bindFilePicker(m, prefix, onPick, accept) {
  const dz = m.querySelector('#' + prefix + '-dz'), inp = m.querySelector('#' + prefix + '-input'), picked = m.querySelector('#' + prefix + '-picked');
  if (accept) inp.accept = accept;
  const handle = async file => {
    if (!file) return;
    const v = validateUploadFile(file);
    if (v.error) { picked.hidden = false; picked.innerHTML = `<span class="err">${esc(v.error)}</span>`; onPick(null); return; }
    const dims = await imageDims(file, v.type);
    const url = /^image\//.test(v.type) ? URL.createObjectURL(file) : '';
    picked.hidden = false; dz.hidden = true;
    picked.innerHTML = `<div class="tthumb checker">${url ? `<img src="${url}" alt="">` : icon('file')}</div><div style="flex:1;min-width:0"><b class="small" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></b><span class="small muted">${esc(v.ext.toUpperCase())} · ${esc(fmtBytes(file.size))}${dims.width ? ' · ' + dims.width + '×' + dims.height + ' px' : ''}</span></div><button type="button" class="btn sm ghost">Change</button>`;
    picked.querySelector('b').textContent = file.name;
    picked.querySelector('button').addEventListener('click', () => inp.click());
    onPick({ file, ext: v.ext, type: v.type, dims });
  };
  dz.addEventListener('click', () => inp.click());
  dz.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.click(); } });
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('over'));
  dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('over'); handle(e.dataTransfer.files[0]); });
  inp.addEventListener('change', () => handle(inp.files[0]));
}

function openUpload(preset) {
  if (!S.cap.assets) { toast('Your account can’t upload files. Ask an administrator for access.', true); return; }
  const ctx = { version: 1, ext: '' }; let main = null, preview = null;
  modal({ title: 'Upload asset', subtitle: can('approve') ? 'Add a file to the AMB library.' : 'New uploads are marked Pending until an administrator approves them.', wide: true,
    body: `${filePickerHtml('up-main', 'File *', 'PNG, JPG, SVG, WEBP, GIF, PDF, MP4, WEBM, WOFF2, TTF, OTF · up to 20 MB (SVG 2 MB)')}
      <details><summary class="small" style="cursor:pointer;font-weight:700">Add a separate preview image (for PDFs, videos, fonts or templates)</summary><div style="margin-top:10px">${filePickerHtml('up-prev', 'Preview image', 'PNG, JPG or WEBP')}</div></details>
      ${assetFormFields(Object.assign({ dateFmt: naming().dateFormat || 'YYYY' }, preset), { isNew: true })}
      <p class="note">${icon('info', 'width="14" height="14" style="vertical-align:-2px"')} ${esc(UNSUPPORTED_HINT)}</p>`,
    onMount: m => {
      bindAssetForm(m, ctx);
      bindFilePicker(m, 'up-main', p => {
        main = p; ctx.ext = p ? p.ext : '';
        if (p) {
          const nm = m.querySelector('#af-name'); if (!nm.value) nm.value = p.file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
          const sz = m.querySelector('#af-size'); if (!sz.value && p.dims.width) sz.value = p.dims.width + 'x' + p.dims.height;
          if (/^font\//.test(p.type)) { const c = m.querySelector('#af-cat'); if (!c.value) { c.value = 'font'; c.dispatchEvent(new Event('change')); } }
        }
        ctx.refresh();
      });
      bindFilePicker(m, 'up-prev', p => { preview = p && /^image\/(png|jpeg|webp|gif)$/.test(p.type) ? p : null; }, 'image/png,image/jpeg,image/webp');
    },
    actions: [{ label: 'Cancel' }, { label: 'Upload', primary: true, icon: 'upload', onClick: async m => {
      if (!main) { showErr(m, 'Choose a file to upload.'); return false; }
      const d = readAssetForm(m); const err = validateAssetData(d); if (err) { showErr(m, err); return false; }
      if (S.assets.some(x => x.filename === d.filename && statusOf(x) !== 'archived')) { showErr(m, 'An active asset already uses this filename. Change the name or version, or replace the existing asset instead.'); return false; }
      let up, pv = null;
      try { up = await uploadBlob(main.file, main.type); if (preview) pv = await uploadBlob(preview.file, preview.type); }
      catch (e) { showErr(m, uploadErrorMessage(e)); return false; }
      const id = uid(); const at = nowIso();
      const doc = Object.assign(d, {
        fileId: up.id, previewId: pv ? pv.id : '', contentType: up.contentType || main.type, ext: main.ext, sizeBytes: up.sizeBytes || main.file.size,
        width: main.dims.width || null, height: main.dims.height || null, originalName: main.file.name, version: 1, demo: false, quick: false,
        versions: [{ version: 1, fileId: up.id, previewId: pv ? pv.id : '', contentType: up.contentType || main.type, ext: main.ext, sizeBytes: up.sizeBytes || main.file.size, filename: d.filename, by: S.me.id, at, note: 'Original upload' }],
        uploadedBy: S.me.id, createdAt: at, updatedBy: S.me.id, updatedAt: at,
      });
      if (!await dbSet('assets/' + id, doc)) { showErr(m, 'The file uploaded but the record couldn’t be saved. Try again.'); return false; }
      if (formVal(m, 'af-approve') && can('approve')) await dbSet('approvals/' + id, { state: 'approved', version: 1, by: S.me.id, at, note: '' });
      logActivity('upload', d.name, { assetId: id });
      toast('Uploaded ' + d.name);
      setTimeout(() => openDrawer('asset', id), 300);
    } }] });
}
function openEditAsset(a) {
  const ctx = { version: a.version || 1, ext: assetExt(a) };
  modal({ title: 'Edit asset details', subtitle: 'Changing details doesn’t create a new version or affect approval.', wide: true,
    body: assetFormFields(Object.assign({}, a, { customFilename: true }), { isNew: false }),
    onMount: m => bindAssetForm(m, ctx),
    actions: [{ label: 'Cancel' }, { label: 'Save changes', primary: true, onClick: async m => {
      const d = readAssetForm(m); const err = validateAssetData(d); if (err) { showErr(m, err); return false; }
      if (S.assets.some(x => x.id !== a.id && x.filename === d.filename && statusOf(x) !== 'archived')) { showErr(m, 'Another active asset already uses this filename.'); return false; }
      const ok = await dbUpdate('assets/' + a.id, Object.assign(d, { updatedBy: S.me.id, updatedAt: nowIso() }));
      if (!ok) return false; logActivity('edit', d.name, { assetId: a.id }); toast('Details saved');
    } }] });
}
function openReplace(a) {
  let main = null, preview = null; const nextV = (a.version || 1) + 1;
  modal({ title: 'Replace file: ' + a.name, subtitle: `Upload V${String(nextV).padStart(2, '0')}. Previous versions stay in the history. ${can('approve') ? '' : 'The new version needs administrator approval.'}`,
    body: `${filePickerHtml('rp-main', 'New file *', 'Same format recommended')}
      <details><summary class="small" style="cursor:pointer;font-weight:700">New preview image (optional)</summary><div style="margin-top:10px">${filePickerHtml('rp-prev', 'Preview image', 'PNG, JPG or WEBP')}</div></details>
      <div class="field"><label for="rp-note">What changed? *</label><input class="input" id="rp-note" maxlength="140" placeholder="e.g. Updated phone number and 2026 tagline"></div>
      ${can('approve') ? `<label class="check" style="width:max-content"><input type="checkbox" id="rp-approve" checked> Approve this version immediately</label>` : ''}`,
    onMount: m => { bindFilePicker(m, 'rp-main', p => { main = p; }); bindFilePicker(m, 'rp-prev', p => { preview = p && /^image\//.test(p.type) ? p : null; }, 'image/png,image/jpeg,image/webp'); },
    actions: [{ label: 'Cancel' }, { label: 'Upload new version', primary: true, icon: 'replace', onClick: async m => {
      if (!main) { showErr(m, 'Choose the replacement file.'); return false; }
      const note = formVal(m, 'rp-note'); if (!note) { showErr(m, 'Describe what changed in this version.'); return false; }
      let up, pv = null;
      try { up = await uploadBlob(main.file, main.type); if (preview) pv = await uploadBlob(preview.file, preview.type); } catch (e) { showErr(m, uploadErrorMessage(e)); return false; }
      const at = nowIso(); const vtag = 'V' + String(nextV).padStart(2, '0');
      const filename = /_V\d{2,}/.test(a.filename) ? a.filename.replace(/_V\d{2,}/, '_' + vtag) : a.filename + '_' + vtag;
      const keepPreview = !pv && a.previewId && !isImageType(main.type) ? a.previewId : '';
      const entry = { version: nextV, fileId: up.id, previewId: pv ? pv.id : keepPreview, contentType: up.contentType || main.type, ext: main.ext, sizeBytes: up.sizeBytes || main.file.size, filename, by: S.me.id, at, note };
      const ok = await dbUpdate('assets/' + a.id, { fileId: up.id, previewId: entry.previewId, contentType: entry.contentType, ext: main.ext, sizeBytes: entry.sizeBytes, width: main.dims.width || null, height: main.dims.height || null, originalName: main.file.name, version: nextV, filename, versions: (a.versions || []).concat([entry]), updatedBy: S.me.id, updatedAt: at, demo: false });
      if (!ok) return false;
      if (formVal(m, 'rp-approve') && can('approve')) await dbSet('approvals/' + a.id, { state: 'approved', version: nextV, by: S.me.id, at, note: '' });
      logActivity('replace', a.name + ' (' + vtag + ')', { assetId: a.id }); toast('New version uploaded');
    } }] });
}


/* ================= BULK ACTIONS ================= */
function selectedAssets() { return [...S.sel].map(id => S.assets.find(a => a.id === id)).filter(Boolean); }
function renderBulkBar() {
  let bar = document.getElementById('bulk-bar');
  [...S.sel].forEach(id => { if (!S.assets.some(a => a.id === id)) S.sel.delete(id); });
  const list = selectedAssets();
  if (!list.length || !canBulk()) { if (bar) bar.remove(); return; }
  if (!bar) { bar = document.createElement('div'); bar.id = 'bulk-bar'; bar.className = 'bulk-bar'; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'Selected assets'); document.body.appendChild(bar); }
  const archived = list.filter(a => statusOf(a) === 'archived').length, active = list.length - archived;
  const pend = list.filter(a => ['pending', 'rejected'].includes(statusOf(a))).length;
  bar.innerHTML = `<b>${list.length} selected</b>
    <button class="btn sm ghost" data-b="all">Select all on page</button>
    <span class="bulk-sep"></span>
    ${can('editAny') ? `<button class="btn sm" data-b="move">${icon('folder')}Move</button>` : ''}
    ${can('approve') && pend ? `<button class="btn sm" data-b="approve" style="color:var(--ok)">${icon('check')}Approve ${pend}</button>` : ''}
    ${can('archive') && active ? `<button class="btn sm" data-b="archive">${icon('archive')}Archive</button>` : ''}
    ${can('archive') && archived ? `<button class="btn sm" data-b="restore">${icon('restore')}Restore</button>` : ''}
    ${can('del') ? `<button class="btn sm danger" data-b="delete">${icon('trash')}Delete</button>` : ''}
    <button class="btn sm ghost icon" data-b="clear" aria-label="Clear selection" title="Clear selection">${icon('x')}</button>`;
  const on = (k, fn) => { const b = bar.querySelector(`[data-b=${k}]`); if (b) b.addEventListener('click', fn); };
  on('clear', () => { S.sel.clear(); renderView(); renderBulkBar(); });
  on('all', () => { $$('#view [data-sel]').forEach(c => S.sel.add(c.dataset.sel)); renderView(); renderBulkBar(); });
  on('move', () => openBulkMove(list));
  on('approve', async () => { let n = 0; for (const a of list.filter(a => ['pending', 'rejected'].includes(statusOf(a)))) { if (await dbSet('approvals/' + a.id, { state: 'approved', version: a.version || 1, by: S.me.id, at: nowIso(), note: '' })) n++; } logActivity('approve', n + ' assets (bulk)'); toast(n + ' approved'); });
  on('archive', async () => { const l = list.filter(a => statusOf(a) !== 'archived'); if (!await confirmDialog(`Archive ${l.length} asset${l.length > 1 ? 's' : ''}?`, 'They’ll be hidden from the library but kept for reference. You can restore them from Archived Assets.', { label: 'Archive' })) return; let n = 0; for (const a of l) { if (await dbUpdate('assets/' + a.id, { archived: true, archivedAt: nowIso(), archivedBy: S.me.id, archiveNote: 'Archived in bulk', quick: false })) n++; } logActivity('archive', n + ' assets (bulk)'); S.sel.clear(); toast(n + ' archived'); renderBulkBar(); });
  on('restore', async () => { let n = 0; for (const a of list.filter(a => statusOf(a) === 'archived')) { if (a.archived) { if (await dbUpdate('assets/' + a.id, { archived: false })) n++; } else if (can('approve')) { if (await dbDelete('approvals/' + a.id)) n++; } } logActivity('restore', n + ' assets (bulk)'); S.sel.clear(); toast(n + ' restored'); renderBulkBar(); });
  on('delete', async () => { if (!await confirmDialog(`Permanently delete ${list.length} asset${list.length > 1 ? 's' : ''}?`, 'This removes them and all their stored file versions for everyone. This can’t be undone. Archive them instead if you might need them again.', { label: 'Delete ' + list.length, danger: true })) return; const n = await removeAssets(list); S.sel.clear(); toast(n + ' deleted'); renderView(); renderBulkBar(); });
}
function openBulkMove(list) {
  const KEEP = '__keep__';
  modal({ title: `Move ${list.length} asset${list.length > 1 ? 's' : ''}`, subtitle: 'Leave a field on “Keep as is” to leave it unchanged.',
    body: `<div class="form-grid">
      <div class="field full"><label for="bm-folder">Folder</label><select class="select" id="bm-folder"><option value="${KEEP}">Keep as is</option><option value="">Unfiled</option>${selectOpts(sortBy(S.folders, f => f.name.toLowerCase()).map(f => ({ value: f.id, label: f.name })), '')}<option value="__new__">New folder…</option></select></div>
      <div class="field full" id="bm-new-wrap" hidden><label for="bm-new">New folder name</label><input class="input" id="bm-new" maxlength="60"></div>
      <div class="field"><label for="bm-cat">Category</label><select class="select" id="bm-cat"><option value="${KEEP}">Keep as is</option>${selectOpts(categories().map(c => ({ value: c.id, label: c.label })), '')}</select></div>
      <div class="field"><label for="bm-sub">Type / subcategory</label><select class="select" id="bm-sub"><option value="${KEEP}">Keep as is</option></select></div></div>`,
    onMount: m => {
      const syncSub = () => { const cat = formVal(m, 'bm-cat'); const cats = cat === KEEP ? [...new Set(list.map(a => a.category))] : [cat]; const subs = cats.length === 1 ? (subOptionsFor(cats[0]) || []) : []; m.querySelector('#bm-sub').innerHTML = `<option value="${KEEP}">Keep as is</option><option value="">None</option>` + selectOpts(subs, ''); };
      m.querySelector('#bm-cat').addEventListener('change', syncSub); syncSub();
      m.querySelector('#bm-folder').addEventListener('change', () => { m.querySelector('#bm-new-wrap').hidden = formVal(m, 'bm-folder') !== '__new__'; });
    },
    actions: [{ label: 'Cancel' }, { label: 'Move', primary: true, onClick: async m => {
      let folder = formVal(m, 'bm-folder'); const cat = formVal(m, 'bm-cat'), sub = formVal(m, 'bm-sub');
      if (folder === '__new__') { const name = formVal(m, 'bm-new'); if (!name) { showErr(m, 'Enter a name for the new folder.'); return false; } const ex = S.folders.find(f => f.name.toLowerCase() === name.toLowerCase()); if (ex) folder = ex.id; else { folder = uid(); if (!await dbSet('folders/' + folder, { name, category: cat !== KEEP ? cat : '', createdBy: S.me.id, createdAt: nowIso(), updatedAt: nowIso() })) return false; logActivity('folder-create', name); } }
      const patch = {}; if (folder !== KEEP) patch.folderId = folder; if (cat !== KEEP) patch.category = cat; if (sub !== KEEP) patch.subcategory = sub;
      if (!Object.keys(patch).length) { showErr(m, 'Choose a folder, category or type to move them to.'); return false; }
      let n = 0; for (const a of list) { if (await dbUpdate('assets/' + a.id, Object.assign({ updatedBy: S.me.id, updatedAt: nowIso() }, patch))) n++; }
      logActivity('edit', `Moved ${n} assets`); S.sel.clear(); renderBulkBar(); toast(`${n} asset${n > 1 ? 's' : ''} moved`);
    } }] });
}
