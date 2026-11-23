/* AMB — editable site content: page text, custom sections, dashboard, lists */
'use strict';

const SECTION_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'dodont', label: 'Do / Don’t lists' },
  { value: 'links', label: 'Links (label | https://…)' },
  { value: 'callout', label: 'Callout note' },
];
function pageDoc(route) { return S.settings['page-' + route] || {}; }
async function savePageDoc(route, patch) {
  return dbSet('settings/page-' + route, Object.assign({}, pageDoc(route), patch, { updatedAt: nowIso(), updatedBy: S.me.id }));
}

/* ---------- Custom sections ---------- */
function sectionHtml(sec, i, total, route) {
  const tools = can('content') ? `<div class="btn-row" style="gap:4px">
      <button class="btn sm icon ghost" data-sec-up="${i}" aria-label="Move section up" ${i === 0 ? 'disabled' : ''}>↑</button>
      <button class="btn sm icon ghost" data-sec-down="${i}" aria-label="Move section down" ${i === total - 1 ? 'disabled' : ''}>↓</button>
      <button class="btn sm" data-sec-edit="${i}">${icon('edit')}Edit</button>
      <button class="btn sm ghost danger" data-sec-del="${i}" aria-label="Delete section">${icon('trash')}</button></div>` : '';
  let body = '';
  if (sec.type === 'dodont') body = `<div class="dodont">
      <div class="do"><h3>Do</h3><ul>${(sec.dos || []).map(x => `<li>${icon('check')}<span>${esc(x)}</span></li>`).join('') || '<li class="muted">Nothing added.</li>'}</ul></div>
      <div class="dont"><h3>Don’t</h3><ul>${(sec.donts || []).map(x => `<li>${icon('x')}<span>${esc(x)}</span></li>`).join('') || '<li class="muted">Nothing added.</li>'}</ul></div></div>`;
  else if (sec.type === 'links') body = `<div class="feed">${(sec.links || []).map(l => /^https?:\/\//i.test(l.url) ? `<a class="feed-item" href="${esc(l.url)}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit;align-items:center"><span style="color:var(--green-ink)">${icon('external', 'width="16" height="16"')}</span><div class="grow"><b>${esc(l.label || l.url)}</b><div class="small muted mono" style="overflow-wrap:anywhere">${esc(l.url)}</div></div></a>` : '').join('') || '<p class="muted small">No links added.</p>'}</div>`;
  else if (sec.type === 'callout') return `<div class="banner ${sec.tone === 'warn' ? 'warn' : 'info'}" style="margin:0" data-section>${icon(sec.tone === 'warn' ? 'warn' : 'info')}<span class="grow">${sec.title ? `<b>${esc(sec.title)}</b> ` : ''}${esc(sec.body || '')}</span>${tools}</div>`;
  else body = `<p class="guide-block">${esc(sec.body || '')}</p>`;
  return `<section class="card card-pad" style="display:flex;flex-direction:column;gap:12px" data-section>
    <div class="section-head"><div>${sec.title ? `<h2>${esc(sec.title)}</h2>` : ''}</div>${tools}</div>${body}</section>`;
}
function openSectionModal(route, idx) {
  const secs = (pageDoc(route).sections || []).slice(); const sec = idx != null ? secs[idx] : { type: 'text' };
  modal({ title: idx != null ? 'Edit section' : 'Add a section', subtitle: 'Sections appear at the bottom of this page for everyone.', wide: true,
    body: `<div class="form-grid">
      <div class="field"><label for="sc-type">Section type</label><select class="select" id="sc-type">${selectOpts(SECTION_TYPES, sec.type || 'text')}</select></div>
      <div class="field"><label for="sc-title">Heading</label><input class="input" id="sc-title" maxlength="80" value="${esc(sec.title || '')}"></div>
      <div class="field full" data-for="text callout"><label for="sc-body">Text</label><textarea class="textarea" id="sc-body" style="min-height:120px">${esc(sec.body || '')}</textarea></div>
      <div class="field" data-for="callout"><label for="sc-tone">Style</label><select class="select" id="sc-tone">${selectOpts([{ value: 'info', label: 'Information (blue)' }, { value: 'warn', label: 'Warning (amber)' }], sec.tone || 'info')}</select></div>
      <div class="field" data-for="dodont"><label for="sc-dos">Do (one per line)</label><textarea class="textarea" id="sc-dos" style="min-height:140px">${esc((sec.dos || []).join('\n'))}</textarea></div>
      <div class="field" data-for="dodont"><label for="sc-donts">Don’t (one per line)</label><textarea class="textarea" id="sc-donts" style="min-height:140px">${esc((sec.donts || []).join('\n'))}</textarea></div>
      <div class="field full" data-for="links"><label for="sc-links">Links (one per line: Label | https://…)</label><textarea class="textarea mono" id="sc-links" style="min-height:120px">${esc((sec.links || []).map(l => l.label + ' | ' + l.url).join('\n'))}</textarea></div></div>`,
    onMount: m => { const sync = () => { const t = formVal(m, 'sc-type'); $$('[data-for]', m).forEach(f => { f.hidden = !f.dataset.for.split(' ').includes(t); }); }; m.querySelector('#sc-type').addEventListener('change', sync); sync(); },
    actions: [{ label: 'Cancel' }, { label: idx != null ? 'Save section' : 'Add section', primary: true, onClick: async m => {
      const type = formVal(m, 'sc-type'); const title = formVal(m, 'sc-title');
      const out = { id: sec.id || uid(), type, title };
      const ls = id => formVal(m, id).split('\n').map(x => x.trim()).filter(Boolean);
      if (type === 'text' || type === 'callout') { out.body = formVal(m, 'sc-body'); if (!out.body) { showErr(m, 'Add some text.'); return false; } if (type === 'callout') out.tone = formVal(m, 'sc-tone'); }
      if (type === 'dodont') { out.dos = ls('sc-dos'); out.donts = ls('sc-donts'); if (!out.dos.length && !out.donts.length) { showErr(m, 'Add at least one Do or Don’t.'); return false; } }
      if (type === 'links') { out.links = ls('sc-links').map(l => { const [a, ...b] = l.split('|'); const url = b.join('|').trim() || a.trim(); return { label: b.length ? a.trim() : '', url }; }); const bad = out.links.find(l => !/^https?:\/\//i.test(l.url)); if (bad) { showErr(m, `“${bad.url}” must start with https://`); return false; } if (!out.links.length) { showErr(m, 'Add at least one link.'); return false; } }
      if (type !== 'callout' && !title) { showErr(m, 'Add a heading.'); return false; }
      if (idx != null) secs[idx] = out; else secs.push(out);
      if (!await savePageDoc(route, { sections: secs })) return false;
      logActivity('settings', (idx != null ? 'Edited' : 'Added') + ' section “' + (title || type) + '” on ' + CRUMB_LABEL[route]); toast(idx != null ? 'Section saved' : 'Section added');
    } }] });
}

/* ---------- Page header & sections applied to every page ---------- */
function applyPageContent(el, route) {
  const pc = pageDoc(route);
  const hiddenSet = new Set(pc.hidden || []);
  const builtins = route === 'dashboard' ? [] : [...el.children].filter(c => c.tagName === 'SECTION' && c.querySelector('h2')).map(c => {
    const label = $$('h2', c).map(h => h.textContent.trim()).join(' / ');
    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
    if (hiddenSet.has(key)) c.hidden = true;
    return { key, label };
  });
  const head = el.querySelector('.page-head');
  if (head) {
    const eb = head.querySelector('.eyebrow'), h1 = head.querySelector('h1'), p = head.querySelector(':scope > div > p');
    if (pc.eyebrow && eb) eb.textContent = pc.eyebrow;
    if (pc.title && h1) h1.textContent = pc.title;
    if (pc.intro && p) p.textContent = pc.intro;
    if (can('content') && S.cap.db) {
      let row = head.querySelector(':scope > .btn-row'); if (!row) { row = document.createElement('div'); row.className = 'btn-row'; head.appendChild(row); }
      const b = document.createElement('button'); b.className = 'btn'; b.innerHTML = icon('edit') + '<span>Edit page</span>';
      b.addEventListener('click', () => openPageTextModal(route, { eyebrow: eb ? eb.textContent : '', title: h1 ? h1.textContent : '', intro: p ? p.textContent : '' }, builtins));
      row.prepend(b);
    }
  }
  const secs = pc.sections || [];
  if (!secs.length && !can('content')) return;
  const wrap = document.createElement('div'); wrap.style.cssText = 'display:flex;flex-direction:column;gap:18px';
  wrap.innerHTML = secs.map((s, i) => sectionHtml(s, i, secs.length, route)).join('') + (can('content') && S.cap.db ? `<div><button class="btn" data-sec-add>${icon('plus')}Add a section to this page</button></div>` : '');
  el.appendChild(wrap);
  const move = async (i, d) => { const a = secs.slice(); const [x] = a.splice(i, 1); a.splice(i + d, 0, x); if (await savePageDoc(route, { sections: a })) toast('Section moved'); };
  $$('[data-sec-up]', wrap).forEach(b => b.addEventListener('click', () => move(+b.dataset.secUp, -1)));
  $$('[data-sec-down]', wrap).forEach(b => b.addEventListener('click', () => move(+b.dataset.secDown, 1)));
  $$('[data-sec-edit]', wrap).forEach(b => b.addEventListener('click', () => openSectionModal(route, +b.dataset.secEdit)));
  $$('[data-sec-del]', wrap).forEach(b => b.addEventListener('click', async () => { const i = +b.dataset.secDel; const s = secs[i]; if (!await confirmDialog('Delete this section?', `“${s.title || 'Untitled'}” will be removed from the page for everyone.`, { label: 'Delete section', danger: true })) return; const a = secs.filter((_, j) => j !== i); if (await savePageDoc(route, { sections: a })) { logActivity('settings', 'Removed section “' + (s.title || s.type) + '”'); toast('Section deleted'); } }));
  const add = $('[data-sec-add]', wrap); if (add) add.addEventListener('click', () => openSectionModal(route));
}
function openPageTextModal(route, cur, builtins = []) {
  const pc = pageDoc(route); const navDef = (NAV.find(n => n.id === route) || {}).label || '';
  modal({ title: 'Edit page', subtitle: 'Change the text or remove built-in sections. Leave a text field empty to go back to the default.',
    body: `<div class="field"><label for="pt-nav">Menu label</label><input class="input" id="pt-nav" maxlength="30" value="${esc(pc.navLabel || '')}" placeholder="${esc(navDef)}"></div>
      <div class="field"><label for="pt-eyebrow">Small label above the title</label><input class="input" id="pt-eyebrow" maxlength="40" value="${esc(pc.eyebrow || '')}" placeholder="${esc(cur.eyebrow)}"></div>
      <div class="field"><label for="pt-title">Page title</label><input class="input" id="pt-title" maxlength="60" value="${esc(pc.title || '')}" placeholder="${esc(cur.title)}"></div>
      <div class="field"><label for="pt-intro">Introduction</label><textarea class="textarea" id="pt-intro" placeholder="${esc(cur.intro)}">${esc(pc.intro || '')}</textarea></div>
      ${builtins.length ? `<div class="field"><span class="lbl">Built-in sections on this page</span><span class="hint">Untick a section to remove it from the page. Tick it again to bring it back.</span><div class="checks">${builtins.map((b, i) => `<label class="check"><input type="checkbox" class="pt-show" data-key="${esc(b.key)}" ${(pc.hidden || []).includes(b.key) ? '' : 'checked'}> ${esc(b.label)}</label>`).join('')}</div></div>` : ''}`,
    actions: [{ label: 'Cancel' }, { label: 'Save page text', primary: true, onClick: async m => {
      const keys = new Set(builtins.map(b => b.key)); const keep = (pc.hidden || []).filter(k => !keys.has(k));
      const hidden = keep.concat($$('.pt-show', m).filter(c => !c.checked).map(c => c.dataset.key));
      if (!await savePageDoc(route, { navLabel: formVal(m, 'pt-nav'), eyebrow: formVal(m, 'pt-eyebrow'), title: formVal(m, 'pt-title'), intro: formVal(m, 'pt-intro'), hidden })) return false;
      logActivity('settings', 'Page text for ' + (formVal(m, 'pt-title') || cur.title)); toast('Page text saved');
    } }] });
}

/* ---------- Editable lists (logo types, template types, spec groups, backgrounds) ---------- */
const LIST_META = {
  logoSubs: { title: 'Logo types', def: () => DEFAULT_LOGO_SUBS, field: 'subcategory', cat: 'logo' },
  templateSubs: { title: 'Template types', def: () => DEFAULT_TEMPLATE_SUBS, field: 'subcategory', cat: 'template' },
  specGroups: { title: 'Export size groups', def: () => DEFAULT_SPEC_GROUPS },
  bgOptions: { title: 'Background options', def: () => DEFAULT_BG_OPTIONS },
};
function openListModal(key) {
  const meta = LIST_META[key]; const cur = listOr(key, meta.def());
  modal({ title: 'Edit ' + meta.title.toLowerCase(), subtitle: 'One per line, in the order they should appear. To rename one, write “Old name => New name” and everything using it moves across.',
    body: `<div class="field"><label for="ls-items">${esc(meta.title)}</label><textarea class="textarea" id="ls-items" style="min-height:240px">${esc(cur.join('\n'))}</textarea></div>
      <p class="note">Removing an entry doesn’t delete anything: items that used it keep their value and can be re-assigned.</p>
      <button type="button" class="btn sm ghost" id="ls-reset" style="width:max-content">Reset to the default list</button>`,
    onMount: m => m.querySelector('#ls-reset').addEventListener('click', () => { m.querySelector('#ls-items').value = meta.def().join('\n'); }),
    actions: [{ label: 'Cancel' }, { label: 'Save list', primary: true, onClick: async m => {
      const renames = []; const items = [];
      formVal(m, 'ls-items').split('\n').map(x => x.trim()).filter(Boolean).forEach(l => { const r = l.split('=>'); if (r.length === 2) { const from = r[0].trim(), to = r[1].trim(); if (to) { items.push(to); if (from && from !== to) renames.push([from, to]); } } else items.push(l); });
      const uniq = [...new Set(items)]; if (!uniq.length) { showErr(m, 'Add at least one entry.'); return false; }
      if (!await dbSet('settings/lists', Object.assign({}, S.settings.lists || {}, { [key]: uniq, updatedAt: nowIso(), updatedBy: S.me.id }))) return false;
      for (const [from, to] of renames) {
        if (key === 'specGroups') { for (const sp of S.specs.filter(x => x.group === from)) await dbUpdate('specs/' + sp.id, { group: to }); }
        else if (key === 'bgOptions') { for (const a of S.assets.filter(x => (x.bgCompat || []).includes(from))) await dbUpdate('assets/' + a.id, { bgCompat: a.bgCompat.map(b => b === from ? to : b) }); }
        else { for (const a of S.assets.filter(x => x.category === meta.cat && x.subcategory === from)) await dbUpdate('assets/' + a.id, { subcategory: to }); }
      }
      if (key === 'logoSubs' && renames.some(r => r[0] === S.ui.logoSub)) S.ui.logoSub = 'all';
      if (key === 'templateSubs' && renames.some(r => r[0] === S.ui.tplSub)) S.ui.tplSub = 'all';
      if (key === 'specGroups' && renames.some(r => r[0] === S.ui.specGroup)) S.ui.specGroup = 'all';
      logActivity('settings', meta.title + ' updated'); toast(meta.title + ' saved');
    } }] });
}

/* ---------- Dashboard customisation ---------- */
const CARD_ICONS = ['logo', 'font', 'colour', 'template', 'sizes', 'naming', 'library', 'recent', 'archive', 'folder', 'image', 'video', 'file', 'link', 'star', 'users', 'shield'];
const DEFAULT_CARDS = [
  { id: 'c-logos', route: 'logos', icon: 'logo', title: 'Logos', desc: 'Primary, secondary, reversed and symbol files.' },
  { id: 'c-fonts', route: 'fonts', icon: 'font', title: 'Fonts & Typography', desc: 'Official typefaces, weights and type hierarchy.' },
  { id: 'c-colours', route: 'colours', icon: 'colour', title: 'Brand Colours', desc: 'Swatches, combinations and contrast guide.' },
  { id: 'c-templates', route: 'templates', icon: 'template', title: 'Templates', desc: 'Social, print, presentation and email templates.' },
  { id: 'c-sizes', route: 'export-sizes', icon: 'sizes', title: 'Export Sizes', desc: 'Approved dimensions and formats per platform.' },
  { id: 'c-naming', route: 'naming', icon: 'naming', title: 'Naming Guide', desc: 'Filename convention, generator and checker.' },
  { id: 'c-library', route: 'library', icon: 'library', title: 'All Assets', desc: 'Search and filter the complete library.' },
  { id: 'c-recent', route: 'recent', icon: 'recent', title: 'Recently Updated', desc: 'Latest uploads, approvals and brand changes.' },
];
function dashDoc() {
  const d = S.settings.dashboard || {}; const g = S.settings.general || {};
  return Object.assign({ emph: 'Welcome Back, {name}', title: 'Brand Asset Library', welcome: g.welcome || '', heroAssetId: g.heroAssetId || '', eyebrow: 'Official brand repository', showRecent: true, showQuick: true, showUpdates: true }, d, { cards: Array.isArray(d.cards) && d.cards.length ? d.cards : DEFAULT_CARDS.map(c => Object.assign({ show: true }, c)) });
}
function cardCount(route) {
  const all = activeAssets();
  return ({ logos: all.filter(a => a.category === 'logo').length, fonts: S.fonts.length, colours: S.colours.length, templates: all.filter(a => a.category === 'template').length, 'export-sizes': S.specs.length, library: all.length, archived: S.assets.filter(a => statusOf(a) === 'archived').length })[route];
}
function openDashboardModal() {
  const d = dashDoc(); const rows = d.cards.concat([{ id: '', show: true, route: 'library', icon: 'star', title: '', desc: '' }]);
  const imgs = activeAssets().filter(a => statusOf(a) === 'approved' && a.category !== 'logo' && (a.previewId || isImageType(a.contentType)));
  const routeOpts = NAV.map(n => ({ value: n.id, label: navLabel(n.id, n.label) })).concat([{ value: 'url', label: 'External link…' }]);
  modal({ title: 'Customise dashboard', subtitle: 'Changes show for everyone. Use {name} in the greeting for the viewer’s first name.', wide: true,
    body: `<div class="form-grid">
      <div class="field"><label for="dd-eyebrow">Small label</label><input class="input" id="dd-eyebrow" maxlength="40" value="${esc(d.eyebrow)}"></div>
      <div class="field"><label for="dd-emph">Greeting (italic line)</label><input class="input" id="dd-emph" maxlength="50" value="${esc(d.emph)}"></div>
      <div class="field"><label for="dd-title">Headline</label><input class="input" id="dd-title" maxlength="50" value="${esc(d.title)}"></div>
      <div class="field full"><span class="lbl">Hero images</span><span class="hint">Tick one or more approved images. With more than one, they rotate every 6 seconds with dots to switch. None ticked shows the illustration.</span><div class="checks">${imgs.map(a => `<label class="check"><input type="checkbox" class="dd-hero" value="${esc(a.id)}" ${(Array.isArray(d.heroAssetIds) && d.heroAssetIds.length ? d.heroAssetIds : [d.heroAssetId]).includes(a.id) ? 'checked' : ''}> ${esc(a.name)}</label>`).join('') || '<span class="small muted">No approved images yet. Upload a photo and approve it first.</span>'}</div></div>
      <div class="field"><label for="dd-glabel">Second button label</label><input class="input" id="dd-glabel" maxlength="30" value="${esc(d.guideLabel || 'Brand Guidelines')}"></div>
      <div class="field"><label for="dd-groute">Second button links to</label><select class="select" id="dd-groute">${selectOpts(NAV.map(n => ({ value: n.id, label: navLabel(n.id, n.label) })).concat([{ value: 'url', label: 'External link…' }]), d.guideUrl ? 'url' : (d.guideRoute || 'colours'))}</select></div>
      <div class="field full"><label for="dd-gurl">External link for the second button</label><input class="input" id="dd-gurl" type="url" value="${esc(d.guideUrl || '')}" placeholder="https://… (e.g. your brand guidelines PDF on SharePoint)"></div>
      <div class="field full"><label for="dd-welcome">Welcome text</label><textarea class="textarea" id="dd-welcome" style="min-height:64px" placeholder="Find the latest approved logos, templates, colours and export specs…">${esc(d.welcome)}</textarea></div>
      <div class="field full"><span class="lbl">Show these panels</span><div class="checks">
        <label class="check"><input type="checkbox" id="dd-recent" ${d.showRecent ? 'checked' : ''}> Recently uploaded</label>
        <label class="check"><input type="checkbox" id="dd-quick" ${d.showQuick ? 'checked' : ''}> Quick downloads</label>
        <label class="check"><input type="checkbox" id="dd-updates" ${d.showUpdates ? 'checked' : ''}> Brand updates</label></div></div></div>
      <h3>Category cards</h3>
      <p class="small muted" style="margin-top:-8px">Untick “Show” to hide a card, tick “Remove” to delete it. Fill in the last row to add a card.</p>
      ${rows.map((c, i) => `<div class="card card-pad" style="box-shadow:none;display:flex;flex-direction:column;gap:10px" data-row="${i}">
        <div class="form-grid">
          <div class="field"><label for="dc-title-${i}">${c.id ? 'Card title' : 'New card title'}</label><input class="input" id="dc-title-${i}" maxlength="40" value="${esc(c.title || '')}"></div>
          <div class="field"><label for="dc-desc-${i}">Description</label><input class="input" id="dc-desc-${i}" maxlength="90" value="${esc(c.desc || '')}"></div>
          <div class="field"><label for="dc-route-${i}">Links to</label><select class="select" id="dc-route-${i}">${selectOpts(routeOpts, c.url ? 'url' : (c.route || 'library'))}</select></div>
          <div class="field"><label for="dc-url-${i}">External link</label><input class="input" id="dc-url-${i}" type="url" value="${esc(c.url || '')}" placeholder="https://…"></div>
          <div class="field"><label for="dc-icon-${i}">Icon</label><select class="select" id="dc-icon-${i}">${selectOpts(CARD_ICONS, c.icon || 'star')}</select></div>
          <div class="field"><label for="dc-order-${i}">Order</label><input class="input" type="number" id="dc-order-${i}" value="${i + 1}"></div>
        </div>
        ${c.id ? `<div class="checks"><label class="check"><input type="checkbox" id="dc-show-${i}" ${c.show !== false ? 'checked' : ''}> Show</label><label class="check"><input type="checkbox" id="dc-del-${i}"> Remove</label></div>` : ''}</div>`).join('')}
      <button type="button" class="btn sm ghost" id="dd-reset" style="width:max-content">Reset cards to the defaults</button>`,
    onMount: m => m.querySelector('#dd-reset').addEventListener('click', async () => { if (await dbSet('settings/dashboard', Object.assign({}, S.settings.dashboard || {}, { cards: [], updatedAt: nowIso() }))) { toast('Cards reset'); $$('.modal [data-x]').forEach(x => x.click()); } }),
    actions: [{ label: 'Cancel' }, { label: 'Save dashboard', primary: true, onClick: async m => {
      const cards = [];
      for (let i = 0; i < rows.length; i++) {
        const c = rows[i]; const title = formVal(m, 'dc-title-' + i);
        if (c.id && formVal(m, 'dc-del-' + i)) continue;
        if (!title) { if (c.id) { showErr(m, 'Every card needs a title (or tick Remove).'); return false; } continue; }
        const route = formVal(m, 'dc-route-' + i); const url = formVal(m, 'dc-url-' + i);
        if (route === 'url' && !/^https?:\/\//i.test(url)) { showErr(m, `“${title}”: the external link must start with https://`); return false; }
        cards.push({ id: c.id || uid(), title, desc: formVal(m, 'dc-desc-' + i), icon: formVal(m, 'dc-icon-' + i), route: route === 'url' ? '' : route, url: route === 'url' ? url : '', show: c.id ? !!formVal(m, 'dc-show-' + i) : true, order: +formVal(m, 'dc-order-' + i) || 99 });
      }
      cards.sort((a, b) => a.order - b.order); cards.forEach(c => delete c.order);
      const heroIds = $$('.dd-hero', m).filter(c => c.checked).map(c => c.value);
      const groute = formVal(m, 'dd-groute'); const gurl = formVal(m, 'dd-gurl');
      if (groute === 'url' && !/^https?:\/\//i.test(gurl)) { showErr(m, 'The second button’s external link must start with https://'); return false; }
      const ok = await dbSet('settings/dashboard', { eyebrow: formVal(m, 'dd-eyebrow'), emph: formVal(m, 'dd-emph'), title: formVal(m, 'dd-title'), welcome: formVal(m, 'dd-welcome'), heroAssetId: heroIds[0] || '', heroAssetIds: heroIds, guideLabel: formVal(m, 'dd-glabel'), guideRoute: groute === 'url' ? '' : groute, guideUrl: groute === 'url' ? gurl : '', showRecent: !!formVal(m, 'dd-recent'), showQuick: !!formVal(m, 'dd-quick'), showUpdates: !!formVal(m, 'dd-updates'), cards, updatedAt: nowIso(), updatedBy: S.me.id });
      if (!ok) return false; logActivity('settings', 'Dashboard customised'); toast('Dashboard saved');
    } }] });
}

/* ---------- Hero image picker ---------- */
function heroPos(d, id) { const p = (d.heroPos || {})[id]; return p && typeof p.x === 'number' ? `${p.x}% ${p.y}%` : 'center 62%'; }
function openHeroImageModal() {
  const d = dashDoc();
  let sel = (Array.isArray(d.heroAssetIds) && d.heroAssetIds.length ? d.heroAssetIds : [d.heroAssetId]).filter(id => S.assets.some(a => a.id === id));
  const pos = JSON.parse(JSON.stringify(d.heroPos || {}));
  let focusId = sel[0] || '';
  const pool = () => sortBy(activeAssets().filter(a => a.category !== 'logo' && statusOf(a) !== 'rejected' && (a.previewId || isImageType(a.contentType)) && a.contentType !== 'image/svg+xml' || sel.includes(a.id)), a => (sel.includes(a.id) ? '0' : '1') + (a.createdAt || ''), 1);
  const { el: m } = modal({ title: 'Change hero image', subtitle: 'Upload a new photo or pick from the library. Pick more than one to rotate them. Wide photos (about 1600 × 900 or larger) look best.', wide: true,
    body: `<div id="hi-drop"></div>
      <div class="field"><span class="lbl">Choose images <span class="muted small" style="font-weight:500">(numbers show the rotation order)</span></span><div id="hi-grid" class="hi-grid"></div></div>
      <div class="field" id="hi-pos-wrap"><span class="lbl">Position the selected image</span><span class="hint">Drag the sliders to choose which part of the photo stays in view.</span>
        <div class="hi-preview"><div class="hi-preview-text">Welcome Back<br><b>Brand Asset Library</b></div><img id="hi-prev-img" alt=""></div>
        <div class="form-grid"><div class="field"><label for="hi-x">Left ↔ right</label><input type="range" id="hi-x" min="0" max="100"></div><div class="field"><label for="hi-y">Top ↕ bottom</label><input type="range" id="hi-y" min="0" max="100"></div></div></div>`,
    onMount: mm => {
      mm.querySelector('#hi-drop').innerHTML = S.cap.assets ? filePickerHtml('hi-up', 'Upload a new photo', 'JPG, PNG or WEBP · up to 20 MB') : '<p class="note">Your account can’t upload files. Pick an image from the library below.</p>';
      const draw = () => {
        const grid = mm.querySelector('#hi-grid'); const list = pool();
        grid.innerHTML = list.length ? list.map(a => { const i = sel.indexOf(a.id); return `<button type="button" class="hi-item${i >= 0 ? ' on' : ''}${a.id === focusId ? ' focus' : ''}" data-id="${esc(a.id)}" title="${esc(a.name)}"><img src="${esc(blobUrl(a.previewId || a.fileId))}" alt="">${i >= 0 ? `<span class="hi-num">${i + 1}</span>` : ''}${statusOf(a) === 'pending' ? '<span class="pill st-pending hi-pill">Pending</span>' : ''}<span class="hi-name">${esc(a.name)}</span></button>`; }).join('') : '<p class="small muted">No photos in the library yet. Upload one above.</p>';
        $$('.hi-item', grid).forEach(b => b.addEventListener('click', () => { const id = b.dataset.id; if (sel.includes(id) && focusId === id) { sel = sel.filter(x => x !== id); focusId = sel[0] || ''; } else { if (!sel.includes(id)) sel.push(id); focusId = id; } draw(); }));
        const a = S.assets.find(x => x.id === focusId); const wrap = mm.querySelector('#hi-pos-wrap');
        wrap.hidden = !a; if (!a) return;
        const p = pos[a.id] || { x: 50, y: 62 }; mm.querySelector('#hi-x').value = p.x; mm.querySelector('#hi-y').value = p.y;
        const img = mm.querySelector('#hi-prev-img'); img.src = blobUrl(a.previewId || a.fileId); img.style.objectPosition = `${p.x}% ${p.y}%`;
      };
      const slide = () => { if (!focusId) return; pos[focusId] = { x: +mm.querySelector('#hi-x').value, y: +mm.querySelector('#hi-y').value }; mm.querySelector('#hi-prev-img').style.objectPosition = `${pos[focusId].x}% ${pos[focusId].y}%`; };
      mm.querySelector('#hi-x').addEventListener('input', slide); mm.querySelector('#hi-y').addEventListener('input', slide);
      if (S.cap.assets) bindFilePicker(mm, 'hi-up', async p => {
        if (!p) return;
        if (!/^image\/(png|jpeg|webp|gif)$/.test(p.type)) { showErr(mm, 'Choose a JPG, PNG or WEBP photo.'); return; }
        const picked = mm.querySelector('#hi-up-picked'); picked.insertAdjacentHTML('beforeend', '<span class="spinner" id="hi-spin"></span>');
        try {
          const up = await uploadBlob(p.file, p.type); const id = uid(); const at = nowIso();
          const name = 'Dashboard hero – ' + (p.file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'photo');
          const filename = buildFilename({ category: 'Photo', assetName: 'DashboardHero ' + pascal(p.file.name.replace(/\.[^.]+$/, '')).slice(0, 30), platform: 'Website', size: p.dims.width ? p.dims.width + 'x' + p.dims.height : '', version: 1 });
          const ok = await dbSet('assets/' + id, { name, category: 'photo', subcategory: 'Hero image', folderId: '', platform: 'Website', sizeSeg: '', dateFmt: 'none', filename, customFilename: true, tags: ['hero', 'dashboard'], description: 'Uploaded as a dashboard hero image.', usage: 'Used on the library dashboard.', bgCompat: [], sourceUrl: '', fileId: up.id, previewId: '', contentType: up.contentType || p.type, ext: p.ext, sizeBytes: up.sizeBytes || p.file.size, width: p.dims.width || null, height: p.dims.height || null, originalName: p.file.name, version: 1, demo: false, quick: false, versions: [{ version: 1, fileId: up.id, previewId: '', contentType: up.contentType || p.type, ext: p.ext, sizeBytes: up.sizeBytes || p.file.size, filename, by: S.me.id, at, note: 'Uploaded from Change hero image' }], uploadedBy: S.me.id, createdAt: at, updatedBy: S.me.id, updatedAt: at });
          if (!ok) throw { code: 'db' };
          if (can('approve')) await dbSet('approvals/' + id, { state: 'approved', version: 1, by: S.me.id, at, note: 'Hero image' });
          logActivity('upload', name, { assetId: id });
          const wait = () => S.assets.some(a => a.id === id) ? Promise.resolve() : new Promise(r => setTimeout(() => r(wait()), 150));
          await Promise.race([wait(), new Promise(r => setTimeout(r, 4000))]);
          sel = [id].concat(sel.filter(x => x !== id)); focusId = id; pos[id] = { x: 50, y: 55 };
          toast('Photo uploaded'); draw();
        } catch (e) { showErr(mm, e && e.code === 'db' ? 'The photo uploaded but couldn’t be saved. Try again.' : uploadErrorMessage(e)); }
        finally { const sp = mm.querySelector('#hi-spin'); if (sp) sp.remove(); }
      }, 'image/png,image/jpeg,image/webp');
      draw();
    },
    actions: [{ label: 'Cancel' }, { label: 'Use the illustration', onClick: async () => { if (!await dbSet('settings/dashboard', Object.assign({}, S.settings.dashboard || {}, { heroAssetIds: [], heroAssetId: '', updatedAt: nowIso(), updatedBy: S.me.id }))) return false; toast('Hero now shows the illustration'); } },
      { label: 'Save hero image', primary: true, onClick: async () => {
        const keepPos = {}; sel.forEach(id => { if (pos[id]) keepPos[id] = pos[id]; });
        if (!await dbSet('settings/dashboard', Object.assign({}, S.settings.dashboard || {}, { heroAssetIds: sel, heroAssetId: sel[0] || '', heroPos: keepPos, updatedAt: nowIso(), updatedBy: S.me.id }))) return false;
        logActivity('settings', 'Dashboard hero image changed'); toast(sel.length ? 'Hero image saved' : 'Hero now shows the illustration');
      } }] });
  void m;
}
