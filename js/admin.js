/* AMB — admin console & settings */
'use strict';

const ASSIGNABLE_BASE = ['Designer', 'Marketing Team', 'Viewer'];
const ASSIGNABLE = new Proxy([], { get: (t, k) => { const a = window.AMB_PLATFORM ? ['Administrator'].concat(ASSIGNABLE_BASE) : ASSIGNABLE_BASE; const v = a[k]; return typeof v === 'function' ? v.bind(a) : v; } });
const PERM_ROWS = [
  ['Browse, preview, search, download, copy filenames', 1, 1, 1, 1],
  ['Upload new assets (as Pending)', 1, 1, 1, 0],
  ['Edit, replace, archive and delete any asset', 1, 1, 1, 0],
  ['Create, rename and delete folders', 1, 1, 1, 0],
  ['Add, edit and remove colours, fonts, export sizes, naming rules and guidelines (saved as Draft)', 1, 1, 1, 0],
  ['Edit page text, custom sections, dashboard, lists and categories', 1, 1, 1, 0],
  ['Approve or reject assets and brand items', 1, 0, 0, 0],
  ['Manage roles, default role and portal logo', 1, 0, 0, 0],
];

function viewAdmin() {
  if (!can('approve')) return emptyState('shield', 'Administrators only', 'You need administrator access to open the Admin Console.');
  const counts = { approved: 0, pending: 0, rejected: 0, archived: 0 }; S.assets.forEach(a => counts[statusOf(a)]++);
  const queue = sortBy(S.assets.filter(a => statusOf(a) === 'pending'), a => a.updatedAt || a.createdAt || '');
  const memberIds = [...new Set(S.members.map(m => m.id).concat(Object.keys(S.roles)))];
  resolveProfiles(memberIds.concat(queue.map(a => a.uploadedBy)));
  const u = S.storageUsage;
  return `<div class="page-head"><div><span class="eyebrow">Administrator</span><h1>Admin Console</h1><p>Review uploads, manage who can do what, and keep the library current.</p></div></div>
  <section class="stat-tiles">
    <div class="card tile ${counts.pending ? 'attn' : ''}"><b>${counts.pending}</b><span>Awaiting approval</span></div>
    <div class="card tile"><b>${counts.approved}</b><span>Approved</span></div>
    <div class="card tile"><b>${counts.rejected}</b><span>Rejected</span></div>
    <div class="card tile"><b>${counts.archived}</b><span>Archived</span></div>
  </section>
  <section class="card" style="overflow:hidden">
    <div class="card-pad section-head" style="border-bottom:1px solid var(--line)"><div><h2>Approval queue</h2><p>Oldest first. Approving locks approval to the current version: a replaced file comes back here.</p></div>${queue.length > 1 ? `<button class="btn" data-act="approve-all">${icon('check')}Approve all ${queue.length}</button>` : ''}</div>
    ${queue.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th></th><th>Asset</th><th>Uploaded by</th><th>Submitted</th><th>Version</th><th></th></tr></thead><tbody>
      ${queue.map(a => `<tr class="click" data-asset="${esc(a.id)}" tabindex="0"><td>${thumbHtml(a, 'tthumb')}</td><td><b>${esc(a.name)}</b> ${isDemo(a) ? demoPill() : ''}<div class="small muted mono">${esc(a.filename)}.${esc(assetExt(a))}</div></td><td class="small">${esc(personName(a.uploadedBy))}</td><td class="small muted">${esc(relTime(a.updatedAt || a.createdAt))}</td><td class="mono small">V${String(a.version || 1).padStart(2, '0')}</td>
      <td style="white-space:nowrap"><button class="btn sm" data-approve="${esc(a.id)}" style="color:var(--ok)">${icon('check')}Approve</button> <button class="btn sm danger" data-reject="${esc(a.id)}">${icon('x')}Reject</button></td></tr>`).join('')}
    </tbody></table></div>` : emptyState('check', 'All caught up', 'There are no assets waiting for review.')}
  </section>
  ${requestsPanel()}
  <section style="display:flex;flex-direction:column;gap:18px">
    <div class="card" style="overflow:hidden">
      <div class="card-pad section-head" style="border-bottom:1px solid var(--line)"><div><h2>People & roles</h2><p>${window.AMB_PLATFORM ? 'Choose what each person can do. Administrators can approve assets and manage roles.' : 'Administrators are the people you add as <b>Editor</b> in this page’s Share menu on claude.ai. Assign everyone else a role here.'} New people get the default role (${esc((S.settings.general || {}).defaultRole || 'Designer')}).</p></div></div>
      <div class="card-pad" style="padding-bottom:6px"><div class="field" style="position:relative"><label for="ppl-search">Add a colleague</label><input class="input" id="ppl-search" placeholder="Search your organisation by name…" autocomplete="off"><div id="ppl-results" class="card" style="position:absolute;top:100%;left:0;right:0;z-index:5;margin-top:4px" hidden></div><span class="hint">${window.AMB_PLATFORM ? 'People appear here once they’ve created an account and signed in.' : 'Adding someone here sets their role. To give them access, share the library with them from claude.ai.'}</span></div></div>
      ${memberIds.length ? memberIds.map(id => { const p = S.profiles[id] || {}; const r = (S.roles[id] || {}).role; const isMe = id === S.me.id; const m = S.members.find(x => x.id === id);
        return `<div class="list-row"><img src="${esc(personAvatar(id))}" alt="" style="width:34px;height:34px;border-radius:50%"><div class="grow"><b>${esc(isMe ? (S.me.name || 'You') + ' (you)' : (p.name || 'Team member'))}</b><div class="small muted">${m && m.lastSeen ? 'Last visit ' + esc(relTime(m.lastSeen)) : 'Hasn’t opened the library yet'}${p.guest ? ' · guest' : ''}</div></div>
          ${isMe ? '<span class="pill st-approved nodot">Administrator</span>' : `<select class="select" data-role="${esc(id)}" aria-label="Role" style="width:auto">${selectOpts([{ value: '', label: 'Default (' + ((S.settings.general || {}).defaultRole || 'Designer') + ')' }].concat(ASSIGNABLE.map(x => ({ value: x, label: x }))), r || '')}</select>`}</div>`; }).join('')
        : `<p class="muted small card-pad">No one else has opened the library yet.</p>`}
    </div>
    <div class="card card-pad"><h2>Permissions by role</h2><div class="table-wrap" style="margin-top:10px"><table class="tbl"><thead><tr><th>Action</th><th>Admin</th><th>Designer</th><th>Marketing</th><th>Viewer</th></tr></thead><tbody>
      ${PERM_ROWS.map(r => `<tr><td class="small">${esc(r[0])}</td>${r.slice(1).map(v => `<td style="text-align:center">${v ? `<span style="color:var(--ok)">${icon('check', 'width="16" height="16"')}</span>` : '<span class="muted">—</span>'}</td>`).join('')}</tr>`).join('')}
    </tbody></table></div>
    <p class="note" style="margin-top:12px">Approvals and roles are enforced by the server: only administrators can change them. The Viewer role for people shared as Contributors is enforced by this app; to lock someone to read-only at the server, share the library with them as a Viewer.</p></div>
  </section>
  <section class="two-col">
    <div class="card card-pad"><h2 style="margin-bottom:6px">Activity log</h2>${feedHtml(S.activity.slice(0, 40))}</div>
    <div class="card card-pad"><h2>File storage</h2>${u ? `<p class="muted small" style="margin:4px 0 10px">${u.files} of ${u.maxFiles} files · ${fmtBytes(u.bytes)} of ${fmtBytes(u.maxBytes)}</p><div style="height:10px;border-radius:99px;background:var(--line-2);overflow:hidden"><div style="height:100%;width:${Math.min(100, (u.bytes / u.maxBytes) * 100).toFixed(1)}%;background:var(--green)"></div></div>` : `<p class="muted small" style="margin-top:6px">${S.cap.assets ? 'Loading usage…' : 'Storage details are available to administrators with upload access.'}</p>`}
      <div class="btn-row" style="margin-top:14px"><a class="btn sm" href="#settings">${icon('settings')}Library settings</a><a class="btn sm" href="#archived">${icon('archive')}Archived assets</a></div></div>
  </section>`;
}
function bindAdmin(root) {
  bindRequests(root);
  $$('[data-approve]', root).forEach(b => b.addEventListener('click', e => { e.stopPropagation(); const a = S.assets.find(x => x.id === b.dataset.approve); if (a) approveAsset(a); }));
  $$('[data-reject]', root).forEach(b => b.addEventListener('click', e => { e.stopPropagation(); const a = S.assets.find(x => x.id === b.dataset.reject); if (a) rejectAsset(a); }));
  const all = $('[data-act=approve-all]', root); if (all) all.addEventListener('click', async () => { const q = S.assets.filter(a => statusOf(a) === 'pending'); if (!await confirmDialog('Approve ' + q.length + ' assets?', 'Make sure you’ve checked each file. Approved assets become official for the whole team.', { label: 'Approve all' })) return; for (const a of q) await dbSet('approvals/' + a.id, { state: 'approved', version: a.version || 1, by: S.me.id, at: nowIso(), note: '' }); logActivity('approve', q.length + ' assets (bulk)'); toast(q.length + ' assets approved'); });
  $$('[data-role]', root).forEach(sel => sel.addEventListener('change', async () => { const id = sel.dataset.role; const ok = sel.value ? await dbSet('roles/' + id, { role: sel.value, by: S.me.id, at: nowIso() }) : await dbDelete('roles/' + id); if (ok) { logActivity('role', personName(id) + ' → ' + (sel.value || 'default')); toast('Role updated'); } }));
  const ps = $('#ppl-search', root), pr = $('#ppl-results', root);
  if (ps && S.cap.user) {
    const show = async () => { const hits = await S.cap.user.search(ps.value); const fresh = hits.filter(h => !h.isMe); if (!fresh.length) { pr.hidden = !ps.value; pr.innerHTML = ps.value ? '<p class="small muted" style="padding:10px 12px">No matches. They may be outside your organisation.</p>' : ''; return; } pr.hidden = false; pr.innerHTML = fresh.map(h => `<button type="button" class="list-row" data-pick="${esc(h.id)}" style="width:100%;border:0;background:none;cursor:pointer;text-align:left"><img src="${esc(h.avatarUrl)}" alt="" style="width:28px;height:28px;border-radius:50%"><span class="grow"></span></button>`).join(''); $$('[data-pick]', pr).forEach((b, i) => { b.querySelector('.grow').textContent = fresh[i].name; S.profiles[fresh[i].id] = fresh[i]; b.addEventListener('click', () => pickPerson(fresh[i])); }); };
    ps.addEventListener('focus', show); ps.addEventListener('input', show);
    ps.addEventListener('blur', () => setTimeout(() => { pr.hidden = true; }, 200));
  } else if (ps) ps.disabled = true;
  bindAssetClicks(root);
  if (S.cap.assets && !S.storageUsage) S.cap.assets.list().then(r => { S.storageUsage = r.usage; scheduleRender(); }).catch(() => {});
}
function pickPerson(p) {
  modal({ title: 'Set role', subtitle: 'Choose what this person can do in the library.',
    body: `<p><b></b></p><div class="field"><label for="pp-role">Role</label><select class="select" id="pp-role">${selectOpts(ASSIGNABLE, (S.roles[p.id] || {}).role || 'Designer')}</select></div>${window.AMB_PLATFORM ? '' : '<p class="note">This sets their role only. If they can’t open the library yet, share it with them from the Share menu on claude.ai.</p>'}`,
    onMount: m => { m.querySelector('p b').textContent = p.name; },
    actions: [{ label: 'Cancel' }, { label: 'Save role', primary: true, onClick: async m => { const r = formVal(m, 'pp-role'); if (!await dbSet('roles/' + p.id, { role: r, by: S.me.id, at: nowIso() })) return false; logActivity('role', p.name + ' → ' + r); toast('Role saved'); } }] });
}

/* ================= SETTINGS ================= */
function themePref() { try { return localStorage.getItem('amb-theme') || 'system'; } catch (e) { return 'system'; } }
function applyTheme(t) { if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); }
function viewSettings() {
  const g = S.settings.general || {};
  const perms = PERM_ROWS.filter(r => r[1 + ['Administrator', 'Designer', 'Marketing Team', 'Viewer'].indexOf(S.role)]).map(r => r[0]);
  const imageAssets = activeAssets().filter(a => statusOf(a) === 'approved' && (a.previewId || isImageType(a.contentType)));
  const demo = S.assets.filter(isDemo);
  const extra = (S.settings.categories && S.settings.categories.extra) || [];
  const hidden = new Set((S.settings.categories && S.settings.categories.hidden) || []);
  return `<div class="page-head"><div><span class="eyebrow">Manage</span><h1>Settings</h1><p>Your access, display preferences${can('content') ? ' and library-wide settings' : ''}.</p></div></div>
  <section class="grid g-2">
    <div class="card card-pad" style="display:flex;flex-direction:column;gap:12px"><h2>Your access</h2>
      <div style="display:flex;gap:12px;align-items:center"><img src="${esc(S.me.avatarUrl || personAvatar(S.me.id))}" alt="" style="width:44px;height:44px;border-radius:50%"><div><b>${esc(S.me.name || 'Signed-in user')}</b><div class="small muted">Role: <b>${esc(S.role)}</b></div></div></div>
      <ul style="margin:0;padding-left:18px;font-size:13.5px;color:var(--ink-2)">${perms.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
      ${S.role !== 'Administrator' ? '<p class="note">Need more access? Ask an AMB brand administrator to change your role.</p>' : ''}
    </div>
    <div class="card card-pad" style="display:flex;flex-direction:column;gap:12px"><h2>Appearance</h2>
      <div class="field"><label for="set-theme">Theme</label><select class="select" id="set-theme">${selectOpts([{ value: 'system', label: 'Match my device' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }], themePref())}</select><span class="hint">Saved in this browser only.</span></div>
    </div>
  </section>
  ${can('settings') ? `
  <section class="card card-pad" style="display:flex;flex-direction:column;gap:14px"><div class="section-head"><div><h2>Administrator settings</h2><p>Only administrators can change these. Dashboard text and images are edited on the Dashboard with “Customise dashboard”.</p></div></div>
    <div class="form-grid">
      <div class="field"><label for="set-role">Default role for new team members</label><select class="select" id="set-role">${selectOpts(ASSIGNABLE_BASE, g.defaultRole || 'Designer')}</select></div>
      <div class="field"><label for="set-logo">Portal logo (approved image)</label><select class="select" id="set-logo">${selectOpts(imageAssets.filter(a => a.category === 'logo').map(a => ({ value: a.id, label: a.name })), g.portalLogoAssetId || '', 'Default mark')}</select></div>
      <label class="check" style="align-self:end;width:max-content"><input type="checkbox" id="set-hidedemo" ${g.hideDemoBanner ? 'checked' : ''}> Hide the demo-content banner</label>
    </div>
    <div><button class="btn primary" data-act="save-general">Save administrator settings</button></div>
  </section>` : ''}
  ${can('content') ? `
  <section class="card card-pad" style="display:flex;flex-direction:column;gap:14px"><div class="section-head"><div><h2>Asset categories</h2><p>Logos and Templates are required. Hide categories you don’t use, or add your own.</p></div><button class="btn" data-act="add-cat">${icon('plus')}Add category</button></div>
    <div class="table-wrap"><table class="tbl"><thead><tr><th>Category</th><th>Filename code</th><th>Assets</th><th>Visible</th><th></th></tr></thead><tbody>
      ${CORE_CATEGORIES.map(c => `<tr><td><b>${esc(c.label)}</b><div class="small muted">${esc(c.desc)}</div></td><td class="mono">${esc(c.code)}</td><td class="tnum">${S.assets.filter(a => a.category === c.id).length}</td><td>${c.id === 'logo' || c.id === 'template' ? '<span class="small muted">Required</span>' : `<input type="checkbox" data-cat-vis="${esc(c.id)}" ${hidden.has(c.id) ? '' : 'checked'} aria-label="Show ${esc(c.label)}" style="accent-color:var(--green);width:18px;height:18px">`}</td><td></td></tr>`).join('')}
      ${extra.map(c => `<tr><td><b>${esc(c.label)}</b><div class="small muted">${esc(c.desc || 'Custom category')}</div></td><td class="mono">${esc(c.code)}</td><td class="tnum">${S.assets.filter(a => a.category === c.id).length}</td><td><span class="small muted">Custom</span></td><td><button class="btn sm ghost danger" data-cat-del="${esc(c.id)}">${icon('trash')}Remove</button></td></tr>`).join('')}
    </tbody></table></div>
  </section>
  <section class="grid g-2">
    <div class="card card-pad" style="display:flex;flex-direction:column;gap:10px"><h2>Demo content</h2>
      <p class="muted small">${demo.length ? `${demo.length} sample asset${demo.length > 1 ? 's are' : ' is'} in the library to show how it works. They carry a DEMO badge and aren’t official AMB files.` : 'There are no demo assets in the library.'}</p>
      ${demo.length ? `<div><button class="btn danger" data-act="remove-demo">${icon('trash')}Remove all demo assets</button></div>` : ''}
    </div>
    <div class="card card-pad" style="display:flex;flex-direction:column;gap:10px"><h2>Backup</h2>
      <p class="muted small">Download the library’s records (assets, approvals, colours, fonts, specs, naming rules) as a JSON file. Files themselves aren’t included.</p>
      <div class="note" style="display:flex;flex-direction:column;gap:8px"><b>Publish to Netlify in one step</b><span>Download a ready-made website of the approved library, then drag the .zip onto <b>app.netlify.com/drop</b>. No accounts or setup needed. It’s a read-only portal: anyone with the link can browse and download the approved files.</span><div><button class="btn primary" data-act="export-site" ${S.cap.downloads ? '' : 'disabled'}>${icon('download')}Download website for Netlify (.zip)</button></div></div>
      <div class="btn-row"><button class="btn" data-act="export-zip" ${S.cap.downloads ? '' : 'disabled'}>${icon('download')}Download full library (.zip)</button><button class="btn" data-act="export-json" ${S.cap.downloads ? '' : 'disabled title="Downloads aren’t available in this view"'}>${icon('download')}Records only (.json)</button></div>
      <p class="small muted">The .zip includes every stored file plus all records. Use it to move the library to another host (for example the Netlify version) or keep an offline backup.</p>
      ${S.cap.assets && S.cap.assets.uploadAs && can('approve') ? `<div><label class="btn" for="import-zip">${icon('upload')}Import a library .zip</label><input type="file" id="import-zip" accept=".zip,application/zip" hidden></div>` : ''}
    </div>
  </section>` : ''}`;
}
function bindSettings(root) {
  $('#set-theme', root).addEventListener('change', e => { try { localStorage.setItem('amb-theme', e.target.value); } catch (er) {} applyTheme(e.target.value); });
  const sg = $('[data-act=save-general]', root);
  if (sg) sg.addEventListener('click', async () => {
    const ok = await dbSet('settings/general', Object.assign({}, S.settings.general || {}, { defaultRole: formVal(root, 'set-role'), portalLogoAssetId: formVal(root, 'set-logo'), hideDemoBanner: !!$('#set-hidedemo', root).checked, updatedAt: nowIso(), updatedBy: S.me.id }));
    if (ok) { logActivity('settings', 'General settings'); toast('Settings saved'); }
  });
  const catDoc = () => Object.assign({ extra: [], hidden: [] }, S.settings.categories || {});
  $$('[data-cat-vis]', root).forEach(cb => cb.addEventListener('change', async () => { const d = catDoc(); const h = new Set(d.hidden); cb.checked ? h.delete(cb.dataset.catVis) : h.add(cb.dataset.catVis); if (await dbSet('settings/categories', Object.assign(d, { hidden: [...h], updatedAt: nowIso() }))) toast('Categories updated'); }));
  $$('[data-cat-del]', root).forEach(b => b.addEventListener('click', async () => { const d = catDoc(); const c = d.extra.find(x => x.id === b.dataset.catDel); const n = S.assets.filter(a => a.category === b.dataset.catDel).length; if (n) { toast(`Move or delete the ${n} asset(s) in this category first.`, true); return; } if (c && await confirmDialog('Remove ' + c.label + '?', 'The category will no longer be available for uploads.', { label: 'Remove', danger: true }) && await dbSet('settings/categories', Object.assign(d, { extra: d.extra.filter(x => x.id !== c.id), updatedAt: nowIso() }))) toast('Category removed'); }));
  const ac = $('[data-act=add-cat]', root);
  if (ac) ac.addEventListener('click', () => modal({ title: 'Add category', body: `<div class="field"><label for="cat-label">Name</label><input class="input" id="cat-label" placeholder="e.g. Signage"></div><div class="field"><label for="cat-code">Filename code</label><input class="input mono" id="cat-code" placeholder="Signage"><span class="hint">Letters and numbers only. Also add it to the naming convention’s category codes.</span></div><div class="field"><label for="cat-desc">Description</label><input class="input" id="cat-desc"></div>`,
    actions: [{ label: 'Cancel' }, { label: 'Add category', primary: true, onClick: async m => { const label = formVal(m, 'cat-label'); const code = formVal(m, 'cat-code') || pascal(label); if (!label) { showErr(m, 'Enter a name.'); return false; } if (!/^[A-Za-z0-9]+$/.test(code)) { showErr(m, 'The code can only contain letters and numbers.'); return false; } const id = 'c-' + pascal(label).toLowerCase(); if (categories().some(c => c.id === id)) { showErr(m, 'That category already exists.'); return false; } const d = catDoc(); if (!await dbSet('settings/categories', Object.assign(d, { extra: d.extra.concat([{ id, label, code, desc: formVal(m, 'cat-desc') }]), updatedAt: nowIso() }))) return false; logActivity('settings', 'Added category ' + label); toast('Category added'); } }] }));
  const rd = $('[data-act=remove-demo]', root);
  if (rd) rd.addEventListener('click', async () => {
    const demo = S.assets.filter(isDemo);
    if (!await confirmDialog('Remove ' + demo.length + ' demo assets?', 'The sample files and their records will be deleted for everyone. Real assets aren’t affected.', { label: 'Remove demo assets', danger: true })) return;
    for (const a of demo) {
      if (can('approve')) await dbDeleteQuiet('approvals/' + a.id); await dbDelete('assets/' + a.id);
      if (S.cap.assets) for (const id of new Set([a.fileId, a.previewId, ...(a.versions || []).flatMap(v => [v.fileId, v.previewId])].filter(Boolean))) { try { await S.cap.assets.delete(id); } catch (e) {} }
    }
    const g = S.settings.general || {}; if (can('settings') && demo.some(a => a.id === g.portalLogoAssetId || a.id === g.heroAssetId)) await dbSet('settings/general', Object.assign({}, g, { portalLogoAssetId: demo.some(a => a.id === g.portalLogoAssetId) ? '' : g.portalLogoAssetId || '', heroAssetId: demo.some(a => a.id === g.heroAssetId) ? '' : g.heroAssetId || '' }));
    logActivity('delete', demo.length + ' demo assets'); toast('Demo assets removed');
  });
  const es = $('[data-act=export-site]', root); if (es) es.addEventListener('click', () => exportStaticSite(es));
  const ez = $('[data-act=export-zip]', root); if (ez) ez.addEventListener('click', () => exportLibraryZip(ez));
  const iz = $('#import-zip', root); if (iz) iz.addEventListener('change', () => { const f = iz.files[0]; iz.value = ''; if (f) importLibraryZip(f); });
  const ex = $('[data-act=export-json]', root);
  if (ex) ex.addEventListener('click', async () => {
    const data = { exportedAt: nowIso(), assets: S.assets, approvals: S.approvals, folders: S.folders, colours: S.colours, fonts: S.fonts, typestyles: S.typestyles, specs: S.specs, settings: S.settings };
    try { await S.cap.downloads.save({ filename: 'AMB_Doc_LibraryBackup_V01_' + dateStamp('YYYYMMDD') + '.json', data: JSON.stringify(data, null, 2) }); toast('Backup saved'); } catch (e) { if (!e || e.code !== 'declined') toast('Couldn’t save the backup.', true); }
  });
}


/* ================= FULL LIBRARY EXPORT / IMPORT (.zip) ================= */
function loadJSZip() {
  if (window.JSZip) return Promise.resolve(window.JSZip);
  return new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'; sc.onload = () => res(window.JSZip); sc.onerror = () => rej(new Error('Couldn’t load the zip tool. Check your connection.')); document.head.appendChild(sc); });
}
function libraryDocs() {
  const docs = {}; const strip = o => { const c = Object.assign({}, o); delete c.id; return c; };
  S.assets.forEach(a => docs['assets/' + a.id] = strip(a));
  Object.entries(S.approvals).forEach(([id, v]) => docs['approvals/' + id] = v);
  ['folders', 'colours', 'fonts', 'typestyles', 'specs', 'requests'].forEach(c => (S[c] || []).forEach(x => docs[c + '/' + x.id] = strip(x)));
  Object.entries(S.settings).forEach(([id, v]) => docs['settings/' + id] = v);
  return docs;
}
async function exportLibraryZip(btn) {
  const orig = btn.innerHTML; btn.disabled = true;
  try {
    const JSZip = await loadJSZip(); const zip = new JSZip();
    const docs = libraryDocs();
    const ids = new Set(); S.assets.forEach(a => [a.fileId, a.previewId, ...(a.versions || []).flatMap(v => [v.fileId, v.previewId])].forEach(i => i && ids.add(i))); S.fonts.forEach(f => f.fileId && ids.add(f.fileId));
    const types = {}; S.assets.forEach(a => { (a.versions || []).forEach(v => { if (v.fileId) types[v.fileId] = v.contentType; }); if (a.fileId) types[a.fileId] = a.contentType; }); S.fonts.forEach(f => { if (f.fileId) types[f.fileId] = f.contentType; });
    let n = 0, missing = [];
    for (const id of ids) {
      btn.innerHTML = `<span class="spinner"></span> Packing ${++n} of ${ids.size}…`;
      try { const r = await fetch(blobUrl(id)); if (!r.ok) throw 0; zip.file('files/' + id, await r.blob()); } catch (e) { missing.push(id); }
    }
    zip.file('library.json', JSON.stringify({ format: 'amb-brand-library', version: 1, exportedAt: nowIso(), fileTypes: types, missingFiles: missing, docs }, null, 1));
    btn.innerHTML = '<span class="spinner"></span> Compressing…';
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    await S.cap.downloads.save({ filename: 'AMB_Doc_LibraryExport_V01_' + dateStamp('YYYYMMDD') + '.zip', data: blob });
    toast(missing.length ? `Saved. ${missing.length} file(s) couldn’t be read and were skipped.` : 'Full library saved');
  } catch (e) {
    if (e && e.code === 'declined') {} else if (e && (e.code === 'extension_not_enabled' || e.code === 'rejected_extension')) toast('Zip downloads aren’t allowed in this view.', true); else toast((e && e.message) || 'Couldn’t create the export.', true);
  } finally { btn.disabled = false; btn.innerHTML = orig; }
}
async function importLibraryZip(file) {
  let data, zip;
  try { const JSZip = await loadJSZip(); zip = await JSZip.loadAsync(file); data = JSON.parse(await zip.file('library.json').async('string')); } catch (e) { toast('That isn’t an AMB library export (.zip).', true); return; }
  if (!data || data.format !== 'amb-brand-library') { toast('That isn’t an AMB library export (.zip).', true); return; }
  const paths = Object.keys(data.docs || {}); const files = Object.keys(zip.files).filter(f => f.startsWith('files/') && !zip.files[f].dir);
  if (!await confirmDialog('Import this library?', `${paths.length} records and ${files.length} files will be added. Records with the same name are replaced. This can take a minute.`, { label: 'Import' })) return;
  const { el, close } = modal({ title: 'Importing library…', body: '<p id="imp-status" class="muted">Starting…</p><div style="height:8px;border-radius:99px;background:var(--line-2);overflow:hidden"><div id="imp-bar" style="height:100%;width:0;background:var(--lime)"></div></div>', actions: [] });
  const total = paths.length + files.length; let done = 0, failed = 0;
  const step = t => { done++; el.querySelector('#imp-status').textContent = t; el.querySelector('#imp-bar').style.width = Math.round(done / total * 100) + '%'; };
  const extType = id => (data.fileTypes || {})[id] || 'application/octet-stream';
  for (const f of files) { const id = f.slice(6); try { const blob = await zip.file(f).async('blob'); await S.cap.assets.uploadAs(id, blob, extType(id)); } catch (e) { failed++; } step(`Uploading files (${done} of ${total})…`); }
  for (const p of paths) { try { await S.cap.db.doc(p).set(data.docs[p]); } catch (e) { failed++; } step(`Saving records (${done} of ${total})…`); }
  close(); logActivity('settings', `Imported library (${paths.length} records, ${files.length} files)`);
  toast(failed ? `Import finished with ${failed} item(s) that couldn’t be saved.` : 'Library imported', !!failed);
}


/* ================= READ-ONLY WEBSITE FOR NETLIFY ================= */
async function exportStaticSite(btn) {
  const orig = btn.innerHTML; btn.disabled = true;
  try {
    const JSZip = await loadJSZip(); const zip = new JSZip();
    const code = ['styles.css', 'js/core.js', 'js/ui.js', 'js/assets.js', 'js/brand.js', 'js/admin.js', 'js/content.js', 'js/login.js', 'js/requests.js', 'js/main.js', 'js/platform-static.js'];
    btn.innerHTML = '<span class="spinner"></span> Copying the app…';
    for (const f of code) { const r = await fetch(f, { cache: 'no-cache' }); if (!r.ok) throw new Error('Couldn’t read ' + f + '. Reload the page and try again.'); zip.file(f, await r.text()); }
    const d = dashDoc(); const g = S.settings.general || {};
    const keepIds = new Set([...(d.heroAssetIds || []), d.heroAssetId, g.portalLogoAssetId].filter(Boolean));
    const assets = S.assets.filter(a => !a.archived && !isDemo(a) && (statusOf(a) === 'approved' || keepIds.has(a.id)));
    const docs = {}; const strip = o => { const c = Object.assign({}, o); delete c.id; return c; };
    assets.forEach(a => { docs['assets/' + a.id] = strip(a); if (S.approvals[a.id]) docs['approvals/' + a.id] = S.approvals[a.id]; });
    ['folders', 'colours', 'fonts', 'typestyles', 'specs'].forEach(c => (S[c] || []).forEach(x => docs[c + '/' + x.id] = strip(x)));
    Object.entries(S.settings).forEach(([id, v]) => docs['settings/' + id] = v);
    const ids = new Set(); const types = {};
    assets.forEach(a => [[a.fileId, a.contentType], [a.previewId, 'image/png'], ...(a.versions || []).flatMap(v => [[v.fileId, v.contentType], [v.previewId, 'image/png']])].forEach(([i, t]) => { if (i) { ids.add(i); if (!types[i]) types[i] = t; } }));
    S.fonts.forEach(f => { if (f.fileId) { ids.add(f.fileId); types[f.fileId] = f.contentType; } });
    let n = 0; const missing = [];
    for (const id of ids) { btn.innerHTML = `<span class="spinner"></span> Adding files ${++n} of ${ids.size}…`; try { const r = await fetch(blobUrl(id)); if (!r.ok) throw 0; zip.file('data/files/' + id, await r.blob()); } catch (e) { missing.push(id); } }
    zip.file('data/library.json', JSON.stringify({ format: 'amb-brand-library', version: 1, exportedAt: nowIso(), fileTypes: types, docs }));
    const icon = S.assets.find(a => a.category === 'logo' && a.subcategory === 'Icon / Symbol Only' && !isDemo(a) && statusOf(a) === 'approved');
    if (icon) { try { const r = await fetch(blobUrl(icon.fileId)); if (r.ok) zip.file('favicon.png', await r.blob()); } catch (e) {} }
    zip.file('index.html', `<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>AMB Brand Asset Library</title>
${icon ? '<link rel="icon" href="favicon.png">' : ''}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;1,700&family=Roboto+Condensed:wght@700&family=JetBrains+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="styles.css">
</head>
<body>
<div id="app" class="app">
  <aside id="sidebar" class="sidebar" aria-label="Main navigation"></aside>
  <div class="scrim" id="scrim" hidden></div>
  <div class="main">
    <header id="topbar" class="topbar"></header>
    <div id="banner"></div>
    <main id="view" class="view" tabindex="-1"><div class="loading-block"><span class="spinner"></span> Loading the AMB brand library…</div></main>
  </div>
</div>
<div id="drawer-root"></div>
<div id="modal-root"></div>
<div id="toast-root" class="toast-root" aria-live="polite"></div>
<script src="js/platform-static.js"></script>
${['core', 'ui', 'assets', 'brand', 'admin', 'content', 'login', 'requests', 'main'].map(f => `<script src="js/${f}.js"></script>`).join('\n')}
</body>
</html>
`);
    zip.file('_headers', '/*\n  X-Robots-Tag: noindex, nofollow\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n\n/data/library.json\n  Cache-Control: no-cache\n');
    zip.file('robots.txt', 'User-agent: *\nDisallow: /\n');
    zip.file('README.txt', `AMB Brand Asset Library – website version (read-only)\nExported ${fmtDateTime(nowIso())}\n\nTO PUT IT ONLINE\n1. Go to https://app.netlify.com/drop and sign in.\n2. Drag this .zip file onto the page.\n3. Done. Netlify gives you a web address you can share.\n\nTO UPDATE IT LATER\nIn the claude.ai library, open Settings > Backup > Download website for Netlify (.zip),\nthen in Netlify open your site > Deploys and drag the new .zip onto the page.\n\nGOOD TO KNOW\n- This version is read-only: browse, search, preview, download, copy filenames, use the naming generator and download colours.\n- It includes approved, non-archived assets only. Uploads, approvals and editing stay in the claude.ai library.\n- Anyone with the link can open it. Search engines are asked not to list it.\n`);
    btn.innerHTML = '<span class="spinner"></span> Compressing…';
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    await S.cap.downloads.save({ filename: 'AMB_Brand_Library_Website_' + dateStamp('YYYYMMDD') + '.zip', data: blob });
    logActivity('download', 'Website for Netlify');
    toast(missing.length ? `Saved. ${missing.length} file(s) couldn’t be read and were left out.` : 'Website saved. Drag the .zip onto app.netlify.com/drop');
  } catch (e) {
    if (e && e.code === 'declined') {} else if (e && (e.code === 'extension_not_enabled' || e.code === 'rejected_extension')) toast('Zip downloads aren’t allowed in this view.', true); else toast((e && e.message) || 'Couldn’t build the website.', true);
  } finally { btn.disabled = false; btn.innerHTML = orig; }
}
