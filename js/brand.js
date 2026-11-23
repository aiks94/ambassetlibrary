/* AMB — brand sections: colours, fonts & typography, export sizes, naming guide */
'use strict';

const lines = (m, id) => formVal(m, id).split('\n').map(s => s.trim()).filter(Boolean);
const pairs = (m, id, a = 'code', b = 'label') => lines(m, id).map(l => { const [x, ...y] = l.split('|'); return { [a]: (x || '').trim(), [b]: y.join('|').trim() }; }).filter(o => o[a]);
const statusTag = st => st === 'approved' ? '<span class="pill st-approved">Approved</span>' : st === 'review' ? '<span class="pill st-pending">Needs review</span>' : '<span class="pill st-draft">Draft</span>';

/* ================= COLOURS ================= */
function contrastRatio(a, b) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
function contrastUse(r) {
  if (r >= 4.5) return 'Any text, any size.';
  if (r >= 4) return 'Headlines and short bold lines, 40px+.';
  if (r >= 3) return 'Large headlines and highlights only, 64px+.';
  if (r >= 1.8) return 'Shapes only, not text.';
  return 'Tone-on-tone shapes only.';
}
function colourGuide() { return S.settings.colourguide || {}; }
function comboTile(c) {
  const roles = c.roles || []; const ground = c.ground || (roles[0] || {}).hex || '#fefefe';
  const textC = c.textHex || (roles[1] || {}).hex || textOn(ground);
  const sh = Array.isArray(c.shapes) && c.shapes.length ? c.shapes : [(roles[2] || roles[1] || {}).hex || '#73b134', (roles[3] || roles[2] || {}).hex || '#73b134'];
  const line = luminance(ground) > .5 ? '#4d4c4c' : '#fefefe';
  const words = String(c.name || '').toUpperCase().split(/\s+/).filter(Boolean);
  return `<svg viewBox="0 0 220 220" role="img" aria-label="${esc(c.name)} combination" style="display:block;width:100%;height:auto;border:1px solid var(--line)">
    <rect width="220" height="220" fill="${esc(ground)}"/>
    <text x="22" y="40" font-family="Roboto Condensed, Arial Narrow, sans-serif" font-weight="700" font-size="21" fill="${esc(textC)}">${words.map((w, i) => `<tspan x="22" dy="${i ? 21 : 0}">${esc(w)}</tspan>`).join('')}</text>
    <path d="M144 0v132" stroke="${esc(line)}" stroke-width="1.5"/><rect x="120" y="132" width="48" height="24" fill="${esc(sh[0])}"/>
    <rect x="94" y="174" width="48" height="24" fill="${esc(sh[1] || sh[0])}"/><rect x="148" y="174" width="48" height="24" fill="${esc(sh[1] || sh[0])}"/></svg>`;
}
function viewColours() {
  const groups = ['Primary', 'Accent', 'Secondary', 'Neutral'];
  const byGroup = g => S.colours.filter(c => (c.group || 'Primary') === g);
  const other = S.colours.filter(c => !groups.includes(c.group || 'Primary'));
  const cg = colourGuide();
  const card = c => {
    const rgb = hexToRgb(c.hex); const rgbStr = rgb ? rgb.join(', ') : '—';
    return `<article class="card swatch">
      <div class="swatch-chip" style="background:${esc(c.hex)};color:${textOn(c.hex)}${luminance(c.hex) > .9 ? ';border-bottom:1px solid var(--line)' : ''}"><div class="btn-row" style="gap:6px"><button class="btn sm" data-copyhex="${esc(c.hex)}" style="background:rgba(254,254,254,.92);color:#4d4c4c;border-color:transparent">${icon('copy')}Copy HEX</button><button class="btn sm icon" data-dl-swatch="${esc(c.id)}" style="background:rgba(254,254,254,.92);color:#4d4c4c;border-color:transparent" aria-label="Download ${esc(c.name)} swatch" title="Download swatch (PNG)">${icon('download')}</button></div></div>
      <div class="swatch-body">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><h3>${esc(c.name)}</h3>${statusTag(c.status)}</div>
        ${c.role ? `<span class="small" style="font-weight:700">${esc(c.role)}</span>` : ''}
        <div class="swatch-codes">
          <span>HEX</span><span class="mono">${esc((c.hex || '').toUpperCase())}</span><button class="copy-mini" data-copy="${esc((c.hex || '').toUpperCase())}" aria-label="Copy HEX">${icon('copy')}</button>
          <span>RGB</span><span class="mono">${esc(rgbStr)}</span><button class="copy-mini" data-copy="rgb(${esc(rgbStr)})" aria-label="Copy RGB">${icon('copy')}</button>
          <span>CMYK</span><span class="mono">${c.cmyk ? esc(c.cmyk) : '<span class="muted" style="font-family:var(--font-body)">Not configured</span>'}</span>${c.cmyk ? `<button class="copy-mini" data-copy="${esc(c.cmyk)}" aria-label="Copy CMYK">${icon('copy')}</button>` : '<span></span>'}
          ${c.pantone ? `<span>PMS</span><span class="mono">${esc(c.pantone)}</span><button class="copy-mini" data-copy="${esc(c.pantone)}" aria-label="Copy Pantone">${icon('copy')}</button>` : ''}
        </div>
        ${c.usage ? `<p class="small muted">${esc(c.usage)}</p>` : ''}
        ${can('brand') ? `<div class="btn-row" style="margin-top:4px"><button class="btn sm" data-edit-colour="${esc(c.id)}">${icon('edit')}Edit</button><button class="btn sm ghost danger" data-del-colour="${esc(c.id)}">${icon('trash')}Delete</button></div>` : ''}
      </div></article>`;
  };
  const section = (title, list) => list.length ? `<section style="display:flex;flex-direction:column;gap:12px"><h2>${esc(title)}</h2><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(175px,1fr))">${list.map(card).join('')}</div></section>` : '';
  const total = S.colours.reduce((t, c) => t + (+c.weight || 0), 0) || 1;
  const mix = sortBy(S.colours.filter(c => +c.weight > 0), c => +c.weight, -1);
  const pairs = [];
  S.colours.forEach(bg => S.colours.forEach(fg => { if (bg.id !== fg.id) pairs.push({ bg, fg, r: contrastRatio(bg.hex, fg.hex) }); }));
  const pairList = sortBy(pairs, p => p.r, -1);
  const combos = cg.combos || [];
  return `<div class="page-head"><div><span class="eyebrow">Brand</span><h1>Brand Colours</h1><p>${esc(cg.intro || 'The official AMB palette. Click any value to copy it.')} CMYK and Pantone values appear once an administrator adds printer-verified values.</p></div>
    <div class="btn-row">${S.colours.length ? `<button class="btn primary" data-act="dl-palette">${icon('download')}Download palette</button><button class="btn" data-act="copy-css">${icon('copy')}Copy as CSS variables</button>` : ''}${can('brand') ? `<button class="btn primary" data-act="add-colour">${icon('plus')}Add colour</button>` : ''}</div></div>
    ${S.colours.length ? section('The palette', S.colours)
      : emptyState('colour', 'No brand colours yet', 'An administrator can add the official palette here.', can('brand') ? `<button class="btn primary" data-act="add-colour">${icon('plus')}Add colour</button>` : '')}
    ${mix.length > 1 ? `<section class="card card-pad" style="display:flex;flex-direction:column;gap:12px"><h2>How much of each</h2>
      <div style="display:flex;height:52px;border:1px solid var(--line);overflow:hidden">${mix.map(c => { const pct = Math.round((+c.weight / total) * 100); return `<div title="${esc(c.name)} ${pct}%" style="flex:${+c.weight};background:${esc(c.hex)};color:${textOn(c.hex)};display:flex;align-items:center;padding:0 12px;font-weight:700;font-size:14px;min-width:0;overflow:hidden;white-space:nowrap">${pct}%</div>`; }).join('')}</div>
      <div class="chips small">${mix.map(c => `<span class="tag"><span style="display:inline-block;width:10px;height:10px;background:${esc(c.hex)};border:1px solid var(--line);margin-right:6px;align-self:center"></span>${esc(c.name)} ${Math.round((+c.weight / total) * 100)}%</span>`).join('')}</div>
      ${cg.mixNote ? `<p class="muted" style="max-width:70ch">${esc(cg.mixNote)}</p>` : ''}</section>` : ''}
    <section class="card card-pad" style="display:flex;flex-direction:column;gap:14px">
      <div class="section-head"><div><h2>Colour combinations</h2><p>${esc(cg.combosNote || 'Pick one combination per post and rotate them across the feed.')}</p></div>${can('brand') ? `<button class="btn" data-act="edit-combos">${icon('edit')}Edit combinations</button>` : ''}</div>
      ${combos.length ? `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:20px">${combos.map(c => `<div style="display:flex;flex-direction:column;gap:10px">${comboTile(c)}
        <div style="display:flex;flex-direction:column;gap:6px">${(c.roles || []).map(r => `<div style="display:flex;align-items:center;gap:8px;font-size:13px"><span style="width:18px;height:18px;background:${esc(r.hex)};border:1px solid var(--line);flex:0 0 auto"></span><span>${esc(r.label)} <b class="mono">${esc((r.hex || '').toLowerCase())}</b></span><button class="copy-mini" data-copy="${esc((r.hex || '').toUpperCase())}" aria-label="Copy ${esc(r.hex)}">${icon('copy')}</button></div>`).join('')}</div>
        ${c.use ? `<p class="small"><b>Use for</b> ${esc(c.use)}</p>` : ''}</div>`).join('')}</div>` : '<p class="muted small">No combinations defined yet.</p>'}
    </section>
    ${pairList.length ? `<section class="card card-pad" style="display:flex;flex-direction:column;gap:14px">
      <div><h2>Which text goes on which colour</h2><p class="muted" style="margin-top:4px;max-width:72ch">Contrast ratios are calculated live from the palette using the WCAG formula. Sizes refer to a 1080px social post, which shows at about a third of that size on a phone, so text that looks big while designing ends up small in the feed.</p></div>
      <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:12px">${pairList.map(p => `<div style="display:flex;gap:12px;align-items:center"><div style="width:72px;height:72px;flex:0 0 auto;background:${esc(p.bg.hex)};color:${esc(p.fg.hex)};display:grid;place-items:center;font-family:var(--font-body);font-weight:700;font-size:32px;border:1px solid var(--line)">Aa</div><div><b class="small" style="display:block">${esc(p.fg.name)} on ${esc(p.bg.name)}</b><span class="small muted"><span class="mono">${p.r.toFixed(1)} : 1</span>. ${esc(contrastUse(p.r))}</span></div></div>`).join('')}</div>
    </section>` : ''}`;
}
function bindColours(root) {
  $$('[data-copyhex]', root).forEach(b => b.addEventListener('click', () => copyText(b.dataset.copyhex.toUpperCase(), 'HEX ' + b.dataset.copyhex.toUpperCase() + ' copied')));
  $$('[data-copy]', root).forEach(b => b.addEventListener('click', () => copyText(b.dataset.copy, b.dataset.copy + ' copied')));
  $$('[data-act=add-colour]', root).forEach(b => b.addEventListener('click', () => openColourModal()));
  $$('[data-edit-colour]', root).forEach(b => b.addEventListener('click', () => openColourModal(S.colours.find(c => c.id === b.dataset.editColour))));
  $$('[data-del-colour]', root).forEach(b => b.addEventListener('click', async () => { const c = S.colours.find(x => x.id === b.dataset.delColour); if (c && await confirmDialog('Delete ' + c.name + '?', 'This removes the colour from the brand palette for everyone.', { label: 'Delete', danger: true }) && await dbDelete('colours/' + c.id)) { logActivity('brand', 'Removed colour ' + c.name); toast('Colour deleted'); } }));
  const dp = $('[data-act=dl-palette]', root); if (dp) dp.addEventListener('click', openPaletteDownload);
  $$('[data-dl-swatch]', root).forEach(b => b.addEventListener('click', () => { const c = S.colours.find(x => x.id === b.dataset.dlSwatch); if (c) downloadSwatchPng(c); }));
  const ec = $('[data-act=edit-combos]', root); if (ec) ec.addEventListener('click', openCombosModal);
  const css = $('[data-act=copy-css]', root); if (css) css.addEventListener('click', () => copyText(':root {\n' + S.colours.map(c => `  --amb-${pascal(c.name).replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}: ${c.hex.toUpperCase()};`).join('\n') + '\n}', 'CSS variables copied'));
}
function openCombosModal() {
  const cg = colourGuide(); const combos = (cg.combos || []).concat([{}]).slice(0, 6);
  modal({ title: 'Edit colour combinations', subtitle: 'Leave a name empty to remove that combination. Roles: one per line as “Label | #hex”. The first role is the ground.', wide: true,
    body: `<div class="field"><label for="cb-note">Intro line</label><input class="input" id="cb-note" value="${esc(cg.combosNote || '')}"></div>
      <div class="field"><label for="cb-mix">“How much of each” note</label><textarea class="textarea" id="cb-mix" style="min-height:60px">${esc(cg.mixNote || '')}</textarea></div>
      ${combos.map((c, i) => `<div class="card card-pad" style="display:flex;flex-direction:column;gap:10px;box-shadow:none"><div class="form-grid">
        <div class="field"><label for="cb-name-${i}">Combination name</label><input class="input" id="cb-name-${i}" value="${esc(c.name || '')}" placeholder="${i === combos.length - 1 ? 'Add a new combination' : ''}"></div>
        <div class="field"><label for="cb-use-${i}">Use for</label><input class="input" id="cb-use-${i}" value="${esc(c.use || '')}"></div>
        <div class="field full"><label for="cb-roles-${i}">Roles</label><textarea class="textarea mono" id="cb-roles-${i}" style="min-height:90px">${esc((c.roles || []).map(r => r.label + ' | ' + r.hex).join('\n'))}</textarea></div></div></div>`).join('')}`,
    actions: [{ label: 'Cancel' }, { label: 'Save combinations', primary: true, onClick: async m => {
      const out = [];
      for (let i = 0; i < combos.length; i++) {
        const name = formVal(m, 'cb-name-' + i); if (!name) continue;
        const roles = pairs(m, 'cb-roles-' + i, 'label', 'hex').map(r => ({ label: r.label, hex: (r.hex || '').trim() }));
        const bad = roles.find(r => !/^#[0-9a-f]{6}$/i.test(r.hex)); if (bad) { showErr(m, `“${name}”: ${bad.label || 'a role'} needs a 6-digit HEX like #478B02.`); return false; }
        if (!roles.length) { showErr(m, `“${name}” needs at least a ground colour.`); return false; }
        const prev = combos[i] || {}; out.push(Object.assign({}, prev.shapes ? { shapes: prev.shapes } : {}, prev.textHex ? { textHex: prev.textHex } : {}, { name, use: formVal(m, 'cb-use-' + i), ground: roles[0].hex, roles }));
      }
      const ok = await dbSet('settings/colourguide', Object.assign({}, cg, { combos: out, combosNote: formVal(m, 'cb-note'), mixNote: formVal(m, 'cb-mix'), updatedAt: nowIso(), updatedBy: S.me.id }));
      if (!ok) return false; logActivity('brand', 'Colour combinations updated'); toast('Combinations saved');
    } }] });
}
function openColourModal(c) {
  c = c || {};
  modal({ title: c.id ? 'Edit ' + c.name : 'Add brand colour',
    body: `<div class="form-grid">
      <div class="field"><label for="co-name">Colour name *</label><input class="input" id="co-name" value="${esc(c.name || '')}" placeholder="AMB Green"></div>
      <div class="field"><label for="co-hex">HEX *</label><div style="display:flex;gap:8px"><input type="color" id="co-picker" value="${esc(c.hex || '#478B02')}" style="width:44px;height:38px;border:1px solid var(--line);border-radius:8px;padding:2px;background:var(--surface)"><input class="input mono" id="co-hex" value="${esc((c.hex || '').toUpperCase())}" placeholder="#478B02"></div></div>
      <div class="field"><label for="co-cmyk">CMYK</label><input class="input mono" id="co-cmyk" value="${esc(c.cmyk || '')}" placeholder="e.g. 65, 0, 100, 0"><span class="hint">Use the values your printer has verified.</span></div>
      <div class="field"><label for="co-pms">Pantone</label><input class="input mono" id="co-pms" value="${esc(c.pantone || '')}" placeholder="Optional"></div>
      <div class="field"><label for="co-group">Group</label><select class="select" id="co-group">${selectOpts(['Primary', 'Accent', 'Secondary', 'Neutral'], c.group || 'Primary')}</select></div>
      <div class="field full"><label for="co-role">Role (short)</label><input class="input" id="co-role" value="${esc(c.role || '')}" placeholder="e.g. Primary. Brand grounds, and headlines on white."></div>
      <div class="field"><label for="co-order">Display order</label><input class="input" type="number" id="co-order" value="${esc(c.order ?? S.colours.length + 1)}"></div>
      <div class="field full"><label for="co-usage">Usage notes</label><textarea class="textarea" id="co-usage" style="min-height:64px">${esc(c.usage || '')}</textarea></div>
      ${statusField('co-status', c.status || 'approved', [{ value: 'approved', label: 'Approved' }, { value: 'draft', label: 'Draft' }])}
      <div class="field"><label for="co-weight">Share of posts (%)</label><input class="input" type="number" min="0" max="100" id="co-weight" value="${esc(c.weight ?? 0)}"><span class="hint">Used for the “How much of each” bar.</span></div></div>`,
    onMount: m => { const p = m.querySelector('#co-picker'), h = m.querySelector('#co-hex'); p.addEventListener('input', () => h.value = p.value.toUpperCase()); h.addEventListener('input', () => { if (/^#[0-9a-f]{6}$/i.test(h.value)) p.value = h.value; }); },
    actions: [{ label: 'Cancel' }, { label: 'Save colour', primary: true, onClick: async m => {
      const name = formVal(m, 'co-name'); let hex = formVal(m, 'co-hex'); if (hex && hex[0] !== '#') hex = '#' + hex;
      if (!name) { showErr(m, 'Enter a colour name.'); return false; }
      if (!/^#[0-9a-f]{6}$/i.test(hex)) { showErr(m, 'Enter a 6-digit HEX code, e.g. #478B02.'); return false; }
      const id = c.id || uid();
      const ok = await dbSet('colours/' + id, { name, hex: hex.toUpperCase(), cmyk: formVal(m, 'co-cmyk'), pantone: formVal(m, 'co-pms'), group: formVal(m, 'co-group'), order: +formVal(m, 'co-order') || 99, usage: formVal(m, 'co-usage'), status: formVal(m, 'co-status'), role: formVal(m, 'co-role'), weight: Math.min(100, Math.max(0, +formVal(m, 'co-weight') || 0)), updatedAt: nowIso(), updatedBy: S.me.id });
      if (!ok) return false; logActivity('brand', (c.id ? 'Updated' : 'Added') + ' colour ' + name); toast('Colour saved');
    } }] });
}

/* ================= FONTS & TYPOGRAPHY ================= */
const FONT_ROLES = ['Primary Typeface', 'Secondary Typeface', 'Display / Accent', 'Web Fallback'];
const WEIGHTS = [[100, 'Thin'], [200, 'Extra Light'], [300, 'Light'], [400, 'Regular'], [500, 'Medium'], [600, 'Semibold'], [700, 'Bold'], [800, 'Extra Bold'], [900, 'Black']];
function viewFonts() {
  const fonts = sortBy(S.fonts, f => FONT_ROLES.indexOf(f.role) === -1 ? 9 : FONT_ROLES.indexOf(f.role));
  const fontCard = f => `<article class="card card-pad font-card">
    <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><span class="eyebrow">${esc(f.role || 'Typeface')}</span><h2 style="margin-top:3px">${esc(f.family)}</h2></div>${statusTag(f.status)}</div>
    <div class="font-specimen" style="font-family:${esc(fontStack(f))};${f.style === 'italic' ? 'font-style:italic;' : ''}font-weight:${+((f.weights || [])[0]) || 400}">Aa Bb Cc 123</div>
    <p style="font-family:${esc(fontStack(f))};${f.style === 'italic' ? 'font-style:italic;' : ''}font-size:17px;color:var(--ink-2)">Quality modular buildings, delivered affordably across Australia.</p>
    <div class="weights">${(f.weights || []).map(w => `<span class="tag" style="font-family:${esc(fontStack(f))};font-weight:${+w};${f.style === 'italic' ? 'font-style:italic' : ''}">${(WEIGHTS.find(x => x[0] === +w) || [w, w])[1]} ${w}</span>`).join('') || '<span class="muted small">No weights listed</span>'}</div>
    <div class="meta"><div>Source</div><div>${esc(f.source || '—')}</div><div>Fallback stack</div><div class="mono small">${esc(f.fallback || 'Arial, Helvetica, sans-serif')}</div>${f.license ? `<div>Licence</div><div>${esc(f.license)}</div>` : ''}</div>
    ${f.usage ? `<p class="small" style="color:var(--ink-2)">${esc(f.usage)}</p>` : ''}
    <div class="btn-row">
      ${f.fileId ? `<button class="btn primary sm" data-font-dl="${esc(f.id)}">${icon('download')}Download font file</button>` : ''}
      ${f.url && /^https?:\/\//i.test(f.url) ? `<a class="btn sm" href="${esc(f.url)}" target="_blank" rel="noopener">${icon('external')}${f.source === 'Google Fonts' ? 'Get from Google Fonts' : 'Download / licence page'}</a>` : ''}
      <button class="btn sm ghost" data-copy="${esc(`font-family: "${f.family}", ${f.fallback || 'Arial, Helvetica, sans-serif'};`)}">${icon('copy')}Copy CSS</button>
      ${can('brand') ? `<button class="btn sm" data-edit-font="${esc(f.id)}">${icon('edit')}Edit</button><button class="btn sm ghost danger" data-del-font="${esc(f.id)}">${icon('trash')}</button>` : ''}
    </div></article>`;
  const ts = S.typestyles;
  const styleFor = t => { const f = fontForRole(t.fontRole); return `font-family:${fontStack(f)};font-size:${Math.min(+t.size || 16, 56)}px;font-weight:${+t.weight || 400};line-height:${+t.lineHeight || 1.3};letter-spacing:${(+t.tracking || 0) / 1000}em;${t.textCase === 'uppercase' ? 'text-transform:uppercase;' : ''}${t.italic ? 'font-style:italic;' : ''}${/^#[0-9a-f]{6}$/i.test(t.colour || '') ? 'color:' + t.colour + ';' : ''}`; };
  const byName = n => ts.find(t => (t.name || '').toLowerCase().startsWith(n));
  const emphStyle = ts.find(t => /emphasis/i.test(t.name || ''));
  return `<div class="page-head"><div><span class="eyebrow">Brand</span><h1>Fonts & Typography</h1><p>Official AMB typefaces, weights and the type hierarchy for headings and body text.</p></div>
    <div class="btn-row">${can('brand') ? `<button class="btn" data-act="add-style">${icon('plus')}Add text style</button><button class="btn primary" data-act="add-font">${icon('plus')}Add typeface</button>` : ''}</div></div>
  ${fonts.length ? `<section class="grid g-2">${fonts.map(fontCard).join('')}</section>`
    : `<section class="card">${emptyState('font', 'No official typefaces added yet', 'The official AMB fonts haven’t been entered. An administrator should add the primary and secondary typefaces with their source and licence. Until then, the hierarchy below previews in the interface font.', can('brand') ? `<button class="btn primary" data-act="add-font">${icon('plus')}Add typeface</button>` : '')}</section>`}
  <section class="card" style="overflow:hidden">
    <div class="card-pad section-head" style="border-bottom:1px solid var(--line)"><div><h2>Type hierarchy</h2><p>Sizes are for digital layouts at 1× (px). Each style uses the typeface assigned to its role.</p></div></div>
    ${ts.length ? ts.map(t => `<div class="type-row"><div><b>${esc(t.name)}</b><div class="small muted">${esc(t.fontRole || '')}</div>${statusTag(t.status)}</div>
      <div class="type-sample" style="${esc(styleFor(t))}">${esc(t.sample || 'Modular buildings made simple')}</div>
      <div class="small muted mono tnum" style="text-align:right;white-space:nowrap">${esc(t.size)}px / ${esc(t.lineHeight)} · ${esc(t.weight)}${t.tracking ? ' · ' + esc(t.tracking) : ''}${can('brand') ? `<div class="btn-row" style="justify-content:flex-end;margin-top:6px"><button class="btn sm" data-edit-style="${esc(t.id)}">${icon('edit')}Edit</button><button class="btn sm ghost danger" data-del-style="${esc(t.id)}" aria-label="Delete style">${icon('trash')}</button></div>` : ''}</div></div>
      ${t.usage ? `<div class="small muted" style="padding:0 20px 12px;margin-top:-8px">${esc(t.usage)}</div>` : ''}`).join('')
      : emptyState('font', 'No text styles defined', 'Administrators can add heading and body styles.')}
  </section>
  ${ts.length ? `<section class="card card-pad" style="display:flex;flex-direction:column;gap:10px"><span class="eyebrow">Usage example</span>
    ${emphStyle ? `<div style="${esc(styleFor(emphStyle))}">Affordable</div>` : ''}
    ${byName('h1') ? `<div style="${esc(styleFor(byName('h1')))}">Modular buildings</div>` : ''}
    ${byName('h2') ? `<div style="${esc(styleFor(byName('h2')))}">Designed, built and delivered by AMB</div>` : ''}
    ${byName('body') ? `<p style="${esc(styleFor(byName('body')))};max-width:65ch;color:var(--ink-2)">Every AMB building is manufactured in a controlled environment, then delivered and installed on your site. This paragraph shows the body text style at its recommended size and line height.</p>` : ''}
    ${byName('caption') ? `<div style="${esc(styleFor(byName('caption')))};color:var(--muted)">Caption: 2-bedroom modular home, Queensland</div>` : ''}
  </section>` : ''}`;
}
function bindFonts(root) {
  $$('[data-act=add-font]', root).forEach(b => b.addEventListener('click', () => openFontModal()));
  $$('[data-edit-font]', root).forEach(b => b.addEventListener('click', () => openFontModal(S.fonts.find(f => f.id === b.dataset.editFont))));
  $$('[data-del-font]', root).forEach(b => b.addEventListener('click', async () => { const f = S.fonts.find(x => x.id === b.dataset.delFont); if (f && await confirmDialog('Remove ' + f.family + '?', 'This removes the typeface from the brand library.', { label: 'Remove', danger: true }) && await dbDelete('fonts/' + f.id)) { logActivity('brand', 'Removed typeface ' + f.family); toast('Typeface removed'); } }));
  $$('[data-font-dl]', root).forEach(b => b.addEventListener('click', () => { const f = S.fonts.find(x => x.id === b.dataset.fontDl); if (f) downloadFile(f.fileId, 'AMB_Font_' + pascal(f.family), f.ext, f.contentType); }));
  $$('[data-copy]', root).forEach(b => b.addEventListener('click', () => copyText(b.dataset.copy, 'CSS copied')));
  $$('[data-act=add-style]', root).forEach(b => b.addEventListener('click', () => openStyleModal()));
  $$('[data-edit-style]', root).forEach(b => b.addEventListener('click', () => openStyleModal(S.typestyles.find(t => t.id === b.dataset.editStyle))));
  $$('[data-del-style]', root).forEach(b => b.addEventListener('click', async () => { const t = S.typestyles.find(x => x.id === b.dataset.delStyle); if (t && await confirmDialog('Delete style ' + t.name + '?', 'This removes it from the type hierarchy.', { label: 'Delete', danger: true }) && await dbDelete('typestyles/' + t.id)) toast('Style deleted'); }));
}
function openFontModal(f) {
  f = f || {}; let file = null;
  modal({ title: f.id ? 'Edit typeface' : 'Add official typeface', subtitle: 'Enter the exact family name used in AMB’s brand guidelines.', wide: true,
    body: `<div class="form-grid">
      <div class="field"><label for="fn-family">Font family name *</label><input class="input" id="fn-family" value="${esc(f.family || '')}"></div>
      <div class="field"><label for="fn-role">Role *</label><select class="select" id="fn-role">${selectOpts(FONT_ROLES, f.role || 'Primary Typeface')}</select></div>
      <div class="field"><label for="fn-source">Source</label><select class="select" id="fn-source">${selectOpts(['Google Fonts', 'Adobe Fonts', 'Licensed / purchased', 'System font', 'Custom'], f.source || 'Google Fonts')}</select><span class="hint">Google Fonts families preview live in this library.</span></div>
      <div class="field"><label for="fn-url">Download or licence link</label><input class="input" id="fn-url" type="url" value="${esc(f.url || '')}" placeholder="https://"></div>
      <div class="field full"><span class="lbl">Approved weights</span><div class="checks">${WEIGHTS.map(([w, n]) => `<label class="check"><input type="checkbox" class="fn-w" value="${w}" ${(f.weights || []).map(Number).includes(w) ? 'checked' : ''}> ${n} ${w}</label>`).join('')}</div></div>
      <div class="field"><label for="fn-style">Style</label><select class="select" id="fn-style">${selectOpts([{ value: 'normal', label: 'Upright' }, { value: 'italic', label: 'Italic' }], f.style || 'normal')}</select></div>
      <div class="field"><label for="fn-fallback">Fallback stack</label><input class="input mono" id="fn-fallback" value="${esc(f.fallback || 'Arial, Helvetica, sans-serif')}"></div>
      <div class="field"><label for="fn-license">Licence notes</label><input class="input" id="fn-license" value="${esc(f.license || '')}" placeholder="e.g. Desktop licence, 5 seats"></div>
      <div class="field full"><label for="fn-usage">Usage notes</label><textarea class="textarea" id="fn-usage" style="min-height:64px">${esc(f.usage || '')}</textarea></div>
      ${statusField('fn-status', f.status || 'draft', [{ value: 'draft', label: 'Draft' }, { value: 'approved', label: 'Approved' }])}
      <div class="full">${S.cap.assets ? filePickerHtml('fn-file', f.fileId ? 'Replace font file (optional)' : 'Font file (optional)', 'WOFF2, WOFF, TTF or OTF. Only upload fonts AMB is licensed to share internally.') : '<p class="note">Font file uploads aren’t available for your account.</p>'}</div>
    </div>`,
    onMount: m => { if (S.cap.assets) bindFilePicker(m, 'fn-file', p => { file = p && /^font\//.test(p.type) ? p : null; if (p && !file) showErr(m, 'Choose a WOFF2, WOFF, TTF or OTF file.'); }, '.woff2,.woff,.ttf,.otf'); },
    actions: [{ label: 'Cancel' }, { label: 'Save typeface', primary: true, onClick: async m => {
      const family = formVal(m, 'fn-family'); if (!family) { showErr(m, 'Enter the font family name.'); return false; }
      const url = formVal(m, 'fn-url'); if (url && !/^https?:\/\//i.test(url)) { showErr(m, 'The link must start with https://'); return false; }
      const doc = { family, role: formVal(m, 'fn-role'), source: formVal(m, 'fn-source'), url, weights: $$('.fn-w', m).filter(c => c.checked).map(c => +c.value), style: formVal(m, 'fn-style'), fallback: formVal(m, 'fn-fallback'), license: formVal(m, 'fn-license'), usage: formVal(m, 'fn-usage'), status: formVal(m, 'fn-status'), fileId: f.fileId || '', ext: f.ext || '', contentType: f.contentType || '', updatedAt: nowIso(), updatedBy: S.me.id };
      if (file) { try { const up = await uploadBlob(file.file, file.type); Object.assign(doc, { fileId: up.id, ext: file.ext, contentType: file.type }); } catch (e) { showErr(m, uploadErrorMessage(e)); return false; } }
      const ok = await dbSet('fonts/' + (f.id || uid()), doc); if (!ok) return false;
      logActivity('brand', (f.id ? 'Updated' : 'Added') + ' typeface ' + family); toast('Typeface saved');
    } }] });
}
function openStyleModal(t) {
  t = t || {};
  modal({ title: t.id ? 'Edit text style' : 'Add text style',
    body: `<div class="form-grid">
      <div class="field"><label for="ts-name">Style name *</label><input class="input" id="ts-name" value="${esc(t.name || '')}" placeholder="H1 – Page title"></div>
      <div class="field"><label for="ts-role">Typeface role</label><select class="select" id="ts-role">${selectOpts(FONT_ROLES, t.fontRole || 'Primary Typeface')}</select></div>
      <div class="field"><label for="ts-size">Size (px) *</label><input class="input" type="number" id="ts-size" value="${esc(t.size || 16)}"></div>
      <div class="field"><label for="ts-weight">Weight</label><select class="select" id="ts-weight">${selectOpts(WEIGHTS.map(([w, n]) => ({ value: w, label: n + ' ' + w })), t.weight || 400)}</select></div>
      <div class="field"><label for="ts-lh">Line height</label><input class="input" type="number" step="0.05" id="ts-lh" value="${esc(t.lineHeight || 1.4)}"></div>
      <div class="field"><label for="ts-track">Letter spacing (1/1000 em)</label><input class="input" type="number" id="ts-track" value="${esc(t.tracking || 0)}"></div>
      <div class="field"><label for="ts-case">Case</label><select class="select" id="ts-case">${selectOpts([{ value: 'none', label: 'As typed' }, { value: 'uppercase', label: 'UPPERCASE' }], t.textCase || 'none')}</select></div>
      <div class="field"><label for="ts-colour">Colour</label><select class="select" id="ts-colour">${selectOpts(S.colours.map(c => ({ value: c.hex, label: c.name + ' ' + c.hex })), t.colour || '', 'Default text colour')}</select></div>
      <label class="check" style="align-self:end;width:max-content"><input type="checkbox" id="ts-italic" ${t.italic ? 'checked' : ''}> Italic</label>
      <div class="field"><label for="ts-order">Order</label><input class="input" type="number" id="ts-order" value="${esc(t.order ?? S.typestyles.length + 1)}"></div>
      <div class="field full"><label for="ts-sample">Sample text</label><input class="input" id="ts-sample" value="${esc(t.sample || '')}"></div>
      <div class="field full"><label for="ts-usage">Usage</label><input class="input" id="ts-usage" value="${esc(t.usage || '')}"></div>
      ${statusField('ts-status', t.status || 'draft', [{ value: 'draft', label: 'Draft' }, { value: 'approved', label: 'Approved' }])}</div>`,
    actions: [{ label: 'Cancel' }, { label: 'Save style', primary: true, onClick: async m => {
      const name = formVal(m, 'ts-name'); if (!name) { showErr(m, 'Enter a style name.'); return false; }
      const ok = await dbSet('typestyles/' + (t.id || uid()), { name, fontRole: formVal(m, 'ts-role'), size: +formVal(m, 'ts-size') || 16, weight: +formVal(m, 'ts-weight') || 400, lineHeight: +formVal(m, 'ts-lh') || 1.4, tracking: +formVal(m, 'ts-track') || 0, textCase: formVal(m, 'ts-case'), italic: !!formVal(m, 'ts-italic'), colour: formVal(m, 'ts-colour'), order: +formVal(m, 'ts-order') || 99, sample: formVal(m, 'ts-sample'), usage: formVal(m, 'ts-usage'), status: formVal(m, 'ts-status'), updatedAt: nowIso(), updatedBy: S.me.id });
      if (!ok) return false; logActivity('brand', 'Text style ' + name + ' saved'); toast('Style saved');
    } }] });
}

/* ================= EXPORT SIZES ================= */
function viewSpecs() {
  const g = S.ui.specGroup;
  const groups = [...new Set(specGroups().concat(S.specs.map(s => s.group).filter(Boolean)))];
  const list = sortBy(S.specs.filter(s => g === 'all' || s.group === g), s => (groups.indexOf(s.group) * 1000) + (+s.order || 0));
  const box = s => { const w = +s.width, h = +s.height; if (!w || !h) return ''; const k = 34 / Math.max(w, h); return `<div class="ratio-box" style="width:${Math.max(8, Math.round(w * k))}px;height:${Math.max(8, Math.round(h * k))}px"></div>`; };
  return `<div class="page-head"><div><span class="eyebrow">Brand</span><h1>Export Sizes</h1><p>Approved export specifications for every channel. Use these dimensions when exporting from Illustrator, InDesign, Photoshop or Canva.</p></div>
    <div class="btn-row">${can('content') && S.cap.db ? `<button class="btn" data-list="specGroups">${icon('list')}Edit groups</button>` : ''}${can('brand') ? `<button class="btn primary" data-act="add-spec">${icon('plus')}Add specification</button>` : ''}</div></div>
  <div class="chips"><button class="chip ${g === 'all' ? 'on' : ''}" data-group="all">All<span class="n">${S.specs.length}</span></button>${groups.map(x => `<button class="chip ${g === x ? 'on' : ''}" data-group="${esc(x)}">${esc(x)}<span class="n">${S.specs.filter(s => s.group === x).length}</span></button>`).join('')}</div>
  ${list.length ? `<div class="card table-wrap"><table class="tbl"><thead><tr><th></th><th>Specification</th><th>Dimensions</th><th>Ratio</th><th>Format</th><th>Resolution</th><th>Colour</th><th>Max size</th><th>Status</th><th></th></tr></thead><tbody>
    ${list.map(s => `<tr><td style="width:56px"><div style="width:40px;height:40px;display:grid;place-items:center">${box(s)}</div></td>
      <td><b>${esc(s.name)}</b><div class="small muted">${esc(s.group || '')}</div>${s.notes ? `<div class="small" style="color:var(--ink-2);max-width:42ch;margin-top:3px">${esc(s.notes)}</div>` : ''}</td>
      <td class="mono tnum" style="white-space:nowrap">${esc(s.width)} × ${esc(s.height)} ${esc(s.unit || 'px')}</td>
      <td class="mono">${esc(ratio(s.width, s.height))}</td><td>${esc(s.format || '—')}</td><td class="small">${esc(s.resolution || '—')}</td><td class="small">${esc(s.colourMode || '—')}</td><td class="small">${esc(s.maxSize || '—')}</td>
      <td>${statusTag(s.status)}</td>
      <td style="white-space:nowrap"><button class="btn sm icon" data-copy-dim="${esc(s.width + 'x' + s.height)}" aria-label="Copy dimensions" title="Copy dimensions">${icon('copy')}</button><button class="btn sm icon" data-name-spec="${esc(s.id)}" aria-label="Generate a filename for this size" title="Generate a filename">${icon('naming')}</button>${can('brand') ? `<button class="btn sm icon" data-edit-spec="${esc(s.id)}" aria-label="Edit">${icon('edit')}</button><button class="btn sm icon ghost danger" data-del-spec="${esc(s.id)}" aria-label="Delete">${icon('trash')}</button>` : ''}</td></tr>`).join('')}
  </tbody></table></div>` : emptyState('sizes', 'No specifications in this group', 'Administrators can add export specifications.', can('brand') ? `<button class="btn primary" data-act="add-spec">${icon('plus')}Add specification</button>` : '')}
  <p class="note">Specs marked <b>Needs review</b> are common platform recommendations entered as a starting point. Social platforms change their sizes often, so an administrator should confirm each one and mark it Approved.</p>`;
}
function bindSpecs(root) {
  $$('[data-group]', root).forEach(b => b.addEventListener('click', () => { S.ui.specGroup = b.dataset.group; renderView(); }));
  $$('[data-act=add-spec]', root).forEach(b => b.addEventListener('click', () => openSpecModal()));
  $$('[data-list]', root).forEach(b => b.addEventListener('click', () => openListModal(b.dataset.list)));
  $$('[data-copy-dim]', root).forEach(b => b.addEventListener('click', () => copyText(b.dataset.copyDim, b.dataset.copyDim + ' copied')));
  $$('[data-name-spec]', root).forEach(b => b.addEventListener('click', () => { const s = S.specs.find(x => x.id === b.dataset.nameSpec); if (!s) return; S.ui.gen = Object.assign(S.ui.gen || {}, { size: s.unit === 'mm' && s.sizeCode ? s.sizeCode : (s.sizeCode || s.width + 'x' + s.height), platform: s.platform || (S.ui.gen || {}).platform || '' }); go('naming'); }));
  $$('[data-edit-spec]', root).forEach(b => b.addEventListener('click', () => openSpecModal(S.specs.find(s => s.id === b.dataset.editSpec))));
  $$('[data-del-spec]', root).forEach(b => b.addEventListener('click', async () => { const s = S.specs.find(x => x.id === b.dataset.delSpec); if (s && await confirmDialog('Delete ' + s.name + '?', 'This removes the export specification.', { label: 'Delete', danger: true }) && await dbDelete('specs/' + s.id)) { logActivity('brand', 'Removed export spec ' + s.name); toast('Specification deleted'); } }));
}
function openSpecModal(s) {
  s = s || {};
  modal({ title: s.id ? 'Edit specification' : 'Add export specification', wide: true,
    body: `<div class="form-grid">
      <div class="field"><label for="sp-name">Name *</label><input class="input" id="sp-name" value="${esc(s.name || '')}" placeholder="Instagram Portrait Post"></div>
      <div class="field"><label for="sp-group">Group *</label><input class="input" id="sp-group" list="sp-groups" value="${esc(s.group || '')}"><datalist id="sp-groups">${specGroups().map(g => `<option value="${esc(g)}">`).join('')}</datalist></div>
      <div class="field"><label for="sp-w">Width *</label><input class="input" type="number" id="sp-w" value="${esc(s.width || '')}"></div>
      <div class="field"><label for="sp-h">Height *</label><input class="input" type="number" id="sp-h" value="${esc(s.height || '')}"></div>
      <div class="field"><label for="sp-unit">Unit</label><select class="select" id="sp-unit">${selectOpts(['px', 'mm'], s.unit || 'px')}</select></div>
      <div class="field"><label for="sp-code">Size code for filenames</label><input class="input mono" id="sp-code" value="${esc(s.sizeCode || '')}" placeholder="1080x1350 or A4"></div>
      <div class="field"><label for="sp-format">File format(s)</label><input class="input" id="sp-format" value="${esc(s.format || '')}" placeholder="JPG, PNG"></div>
      <div class="field"><label for="sp-res">Resolution</label><input class="input" id="sp-res" value="${esc(s.resolution || '')}" placeholder="72 ppi / 300 dpi"></div>
      <div class="field"><label for="sp-cm">Colour mode</label><select class="select" id="sp-cm">${selectOpts(['RGB', 'sRGB', 'CMYK', 'RGB / CMYK'], s.colourMode || 'RGB')}</select></div>
      <div class="field"><label for="sp-max">Max file size</label><input class="input" id="sp-max" value="${esc(s.maxSize || '')}" placeholder="e.g. 2 MB"></div>
      <div class="field"><label for="sp-platform">Platform code</label><select class="select" id="sp-platform">${selectOpts(platformOptions().map(p => ({ value: p.code, label: p.label })), s.platform || '', 'None')}</select></div>
      ${statusField('sp-status', s.status || 'approved', [{ value: 'approved', label: 'Approved' }, { value: 'review', label: 'Needs review' }, { value: 'draft', label: 'Draft' }])}
      <div class="field full"><label for="sp-notes">Usage notes</label><textarea class="textarea" id="sp-notes" style="min-height:64px">${esc(s.notes || '')}</textarea></div></div>`,
    actions: [{ label: 'Cancel' }, { label: 'Save specification', primary: true, onClick: async m => {
      const name = formVal(m, 'sp-name'), group = formVal(m, 'sp-group'), w = +formVal(m, 'sp-w'), h = +formVal(m, 'sp-h');
      if (!name || !group) { showErr(m, 'Enter a name and group.'); return false; }
      if (!(w > 0 && h > 0)) { showErr(m, 'Enter a width and height greater than zero.'); return false; }
      const ok = await dbSet('specs/' + (s.id || uid()), { name, group, width: w, height: h, unit: formVal(m, 'sp-unit'), sizeCode: formVal(m, 'sp-code'), format: formVal(m, 'sp-format'), resolution: formVal(m, 'sp-res'), colourMode: formVal(m, 'sp-cm'), maxSize: formVal(m, 'sp-max'), platform: formVal(m, 'sp-platform'), status: formVal(m, 'sp-status'), notes: formVal(m, 'sp-notes'), order: s.order || 0, updatedAt: nowIso(), updatedBy: S.me.id });
      if (!ok) return false; logActivity('brand', (s.id ? 'Updated' : 'Added') + ' export spec ' + name); toast('Specification saved');
    } }] });
}

/* ================= NAMING GUIDE ================= */
const SEG_INFO = [
  ['Prefix', 'AMB', 'Always “AMB” so files are identifiable outside the library.'],
  ['Category', 'Logo', 'An approved category code from the list below.'],
  ['AssetName', 'CompanyProfile', 'What the asset is, in PascalCase. No spaces or symbols.'],
  ['Platform', 'Instagram', 'Where it will be used. Optional for general assets.'],
  ['Size', '1080x1080', 'Pixel dimensions (W x H, lower-case x) or a paper size like A4. Optional.'],
  ['Version', 'V01', 'Upper-case V and two digits. Increase for every approved change.'],
  ['Date', '2026', 'Year (YYYY), or YYYYMM / YYYYMMDD for time-sensitive campaigns. Optional.'],
];
function segInfo() {
  const n = naming();
  if (Array.isArray(n.segments) && n.segments.length) return n.segments;
  return SEG_INFO.map((x, i) => ({ name: x[0], example: i === 0 ? (n.prefix || 'AMB') : x[1], required: [0, 1, 2, 5].includes(i), rule: x[2] }));
}
function viewNaming() {
  const n = naming(); const segs = segInfo();
  const gen = S.ui.gen = Object.assign({ category: (namingCategories()[0] || {}).code || 'Logo', assetName: '', platform: '', size: '', version: 1, dateFmt: n.dateFormat || 'YYYY', ext: 'png' }, S.ui.gen || {});
  const exts = n.extensions && n.extensions.length ? n.extensions : [];
  const sizes = [...new Set((n.sizes || []).map(s => s.code).concat(S.specs.map(s => s.sizeCode || (s.unit === 'px' ? s.width + 'x' + s.height : '')).filter(Boolean)))];
  return `<div class="page-head"><div><span class="eyebrow">Brand</span><h1>Asset Naming Guide</h1><p>One naming convention for every AMB file, so anyone can tell what a file is, where it’s used and which version is current.</p></div>
    <div class="btn-row">${statusTag(n.status)}${can('brand') ? `<button class="btn" data-act="edit-naming">${icon('edit')}Edit convention</button>` : ''}</div></div>
  <section class="card card-pad" style="display:flex;flex-direction:column;gap:16px">
    <div><h2>The convention</h2><p class="muted" style="margin-top:4px">Segments are joined with underscores. Optional segments are left out entirely, never left blank.</p></div>
    <div class="np">${segs.map((s, i) => `${i ? '<span class="sep">_</span>' : ''}<span class="seg-part"><small>${esc(s.name)}</small>${esc(s.example)}</span>`).join('')}</div>
    <div class="table-wrap"><table class="tbl"><thead><tr><th>Segment</th><th>Example</th><th>Required</th><th>Rule</th></tr></thead><tbody>
      ${segs.map(s => `<tr><td><b>${esc(s.name)}</b></td><td class="mono">${esc(s.example)}</td><td>${s.required ? '<span class="pill st-approved nodot">Required</span>' : '<span class="pill st-archived nodot">Optional</span>'}</td><td class="small">${esc(s.rule)}</td></tr>`).join('')}
    </tbody></table></div>
  </section>
  <section class="two-col">
    <div class="card card-pad" style="display:flex;flex-direction:column;gap:14px" id="generator">
      <div><span class="eyebrow">Tool</span><h2>Filename generator</h2><p class="muted small" style="margin-top:3px">Fill in the fields to build a standard filename.</p></div>
      <div class="form-grid">
        <div class="field"><label for="g-cat">Asset category</label><select class="select" id="g-cat">${selectOpts(namingCategories().map(c => ({ value: c.code, label: c.label + ' (' + c.code + ')' })), gen.category)}</select></div>
        <div class="field"><label for="g-name">Asset name</label><input class="input" id="g-name" value="${esc(gen.assetName)}" placeholder="e.g. Company Profile"></div>
        <div class="field"><label for="g-platform">Platform</label><select class="select" id="g-platform">${selectOpts(platformOptions().map(p => ({ value: p.code, label: p.label })), gen.platform, 'None')}</select></div>
        <div class="field"><label for="g-size">Dimensions</label><input class="input mono" id="g-size" list="g-sizes" value="${esc(gen.size)}" placeholder="1080x1080 or A4"><datalist id="g-sizes">${sizes.map(s => `<option value="${esc(s)}">`).join('')}</datalist></div>
        <div class="field"><label for="g-ver">Version</label><input class="input" type="number" min="1" max="99" id="g-ver" value="${esc(gen.version)}"></div>
        <div class="field"><label for="g-date">Date</label><select class="select" id="g-date">${selectOpts([{ value: 'none', label: 'No date' }, { value: 'YYYY', label: 'Year · ' + dateStamp('YYYY') }, { value: 'YYYYMM', label: 'Year + month · ' + dateStamp('YYYYMM') }, { value: 'YYYYMMDD', label: 'Full date · ' + dateStamp('YYYYMMDD') }], gen.dateFmt)}</select></div>
        <div class="field"><label for="g-ext">File extension</label><select class="select" id="g-ext">${selectOpts((exts.length ? exts.map(e => e.ext.replace('.', '')) : ['png', 'jpg', 'svg', 'pdf', 'mp4', 'ai', 'psd', 'indd', 'pptx']), gen.ext)}</select></div>
      </div>
      <div class="gen-out"><code id="g-out"></code><button class="btn primary" id="g-copy" type="button">${icon('copy')}Copy filename</button></div>
      <p class="small" id="g-msg"></p>
    </div>
    <div class="card card-pad" style="display:flex;flex-direction:column;gap:12px">
      <div><span class="eyebrow">Tool</span><h2>Check a filename</h2><p class="muted small" style="margin-top:3px">Paste any filename to see if it follows the convention.</p></div>
      <input class="input mono" id="chk-in" placeholder="AMB_Brochure_CompanyProfile_A4_V02_2026.pdf" value="${esc(S.ui.chk || '')}">
      <div class="check-result" id="chk-out"></div>
    </div>
  </section>
  <section class="card card-pad" style="display:flex;flex-direction:column;gap:12px"><h2>Examples</h2>
    <div class="feed">${(n.examples || []).map(ex => `<div class="feed-item" style="align-items:center"><div class="grow"><code class="mono">${esc(ex.name)}</code>${ex.note ? `<div class="small muted">${esc(ex.note)}</div>` : ''}</div><button class="btn sm icon" data-copy="${esc(ex.name)}" aria-label="Copy example">${icon('copy')}</button></div>`).join('') || '<p class="muted small">No examples added.</p>'}</div>
  </section>
  <section class="grid g-2">
    <div class="card card-pad"><h2>Approved category codes</h2><div class="table-wrap" style="margin-top:10px"><table class="tbl"><thead><tr><th>Code</th><th>Use for</th></tr></thead><tbody>${namingCategories().map(c => `<tr><td class="mono"><b>${esc(c.code)}</b></td><td>${esc(c.label)}</td></tr>`).join('')}</tbody></table></div></div>
    <div class="card card-pad"><h2>Approved platform codes</h2><div class="table-wrap" style="margin-top:10px"><table class="tbl"><thead><tr><th>Code</th><th>Use for</th></tr></thead><tbody>${platformOptions().map(c => `<tr><td class="mono"><b>${esc(c.code)}</b></td><td>${esc(c.label)}</td></tr>`).join('')}</tbody></table></div>
      ${(n.sizes || []).length ? `<h3 style="margin-top:16px">Size codes</h3><div class="table-wrap" style="margin-top:8px"><table class="tbl"><tbody>${n.sizes.map(c => `<tr><td class="mono"><b>${esc(c.code)}</b></td><td>${esc(c.label)}</td></tr>`).join('')}</tbody></table></div>` : ''}</div>
  </section>
  <section class="grid g-2">
    <div class="card card-pad"><h2>Version control</h2><p class="guide-block" style="margin-top:8px">${esc(n.versionRules || 'Not defined yet.')}</p></div>
    <div class="card card-pad"><h2>Date format standards</h2><p class="guide-block" style="margin-top:8px">${esc(n.dateRules || 'Not defined yet.')}</p></div>
  </section>
  <section class="card card-pad"><h2>File extension standards</h2>
    ${exts.length ? `<div class="table-wrap" style="margin-top:10px"><table class="tbl"><thead><tr><th>Extension</th><th>When to use it</th></tr></thead><tbody>${exts.map(e => `<tr><td class="mono"><b>.${esc(e.ext.replace('.', ''))}</b></td><td>${esc(e.use)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted small" style="margin-top:8px">Not defined yet.</p>'}
  </section>
  <section class="card card-pad"><div class="dodont">
    <div class="do"><h2>Do</h2><ul>${(n.dos || []).map(x => `<li>${icon('check')}<span>${esc(x)}</span></li>`).join('') || '<li class="muted">Not defined yet.</li>'}</ul></div>
    <div class="dont"><h2>Don’t</h2><ul>${(n.donts || []).map(x => `<li>${icon('x')}<span>${esc(x)}</span></li>`).join('') || '<li class="muted">Not defined yet.</li>'}</ul></div>
  </div></section>`;
}
function bindNaming(root) {
  const gen = S.ui.gen;
  const upd = () => {
    gen.category = formVal(root, 'g-cat'); gen.assetName = formVal(root, 'g-name'); gen.platform = formVal(root, 'g-platform'); gen.size = formVal(root, 'g-size'); gen.version = formVal(root, 'g-ver') || 1; gen.dateFmt = formVal(root, 'g-date'); gen.ext = formVal(root, 'g-ext');
    const name = buildFilename({ category: gen.category, assetName: gen.assetName || 'AssetName', platform: gen.platform, size: gen.size, version: gen.version, date: dateStamp(gen.dateFmt) });
    $('#g-out', root).textContent = name + '.' + gen.ext;
    const msg = $('#g-msg', root);
    if (!gen.assetName) { msg.textContent = 'Add an asset name to replace the “AssetName” placeholder.'; msg.style.color = 'var(--warn)'; }
    else if (gen.size && !/^(\d+x\d+|[A-Z]\d|DL|[A-Za-z0-9]+)$/.test(gen.size.replace(/\s/g, ''))) { msg.textContent = 'Dimensions should look like 1080x1080 or a paper size like A4.'; msg.style.color = 'var(--warn)'; }
    else { msg.textContent = '✓ Ready to use'; msg.style.color = 'var(--ok)'; }
  };
  ['g-cat', 'g-name', 'g-platform', 'g-size', 'g-ver', 'g-date', 'g-ext'].forEach(id => { const e = $('#' + id, root); e.addEventListener('input', upd); e.addEventListener('change', upd); });
  $('#g-copy', root).addEventListener('click', () => { if (!gen.assetName) { toast('Add an asset name first.', true); $('#g-name', root).focus(); return; } copyText($('#g-out', root).textContent, 'Filename copied'); });
  upd();
  const chk = () => { const v = $('#chk-in', root).value; S.ui.chk = v; const out = $('#chk-out', root); if (!v.trim()) { out.innerHTML = '<span class="muted small">Results appear here.</span>'; return; } const r = validateFilename(v); out.innerHTML = (r.ok ? `<span class="ok">✓ This filename follows the AMB convention.</span>` : `<b class="bad">${r.issues.length} issue${r.issues.length > 1 ? 's' : ''} found</b>`) + r.issues.map(i => `<div class="bad">✕ ${esc(i)}</div>`).join('') + r.good.map(g => `<div class="muted">✓ ${esc(g)}</div>`).join(''); };
  $('#chk-in', root).addEventListener('input', chk); chk();
  $$('[data-copy]', root).forEach(b => b.addEventListener('click', () => copyText(b.dataset.copy, 'Example copied')));
  const ed = $('[data-act=edit-naming]', root); if (ed) ed.addEventListener('click', openNamingModal);
}
function openNamingModal() {
  const n = naming();
  const pl = (arr, a = 'code', b = 'label') => (arr || []).map(o => o[a] + ' | ' + o[b]).join('\n');
  modal({ title: 'Edit naming convention', subtitle: 'Changes apply to the generator, checker and upload form straight away.', wide: true,
    body: `<div class="form-grid">
      <div class="field"><label for="nm-prefix">Prefix</label><input class="input mono" id="nm-prefix" value="${esc(n.prefix)}"></div>
      <div class="field"><label for="nm-date">Default date format</label><select class="select" id="nm-date">${selectOpts([{ value: 'none', label: 'No date' }, { value: 'YYYY', label: 'YYYY' }, { value: 'YYYYMM', label: 'YYYYMM' }, { value: 'YYYYMMDD', label: 'YYYYMMDD' }], n.dateFormat)}</select></div>
      <div class="field"><label for="nm-cats">Category codes (Code | Description)</label><textarea class="textarea mono" id="nm-cats" style="min-height:150px">${esc(pl(n.categories))}</textarea></div>
      <div class="field"><label for="nm-plats">Platform codes (Code | Description)</label><textarea class="textarea mono" id="nm-plats" style="min-height:150px">${esc(pl(n.platforms))}</textarea></div>
      <div class="field"><label for="nm-sizes">Size codes (Code | Description)</label><textarea class="textarea mono" id="nm-sizes">${esc(pl(n.sizes))}</textarea></div>
      <div class="field"><label for="nm-exts">Extensions (ext | when to use)</label><textarea class="textarea mono" id="nm-exts">${esc(pl(n.extensions, 'ext', 'use'))}</textarea></div>
      <div class="field"><label for="nm-ver">Version control rules</label><textarea class="textarea" id="nm-ver">${esc(n.versionRules)}</textarea></div>
      <div class="field"><label for="nm-dr">Date format rules</label><textarea class="textarea" id="nm-dr">${esc(n.dateRules)}</textarea></div>
      <div class="field"><label for="nm-dos">Do (one per line)</label><textarea class="textarea" id="nm-dos">${esc((n.dos || []).join('\n'))}</textarea></div>
      <div class="field"><label for="nm-donts">Don’t (one per line)</label><textarea class="textarea" id="nm-donts">${esc((n.donts || []).join('\n'))}</textarea></div>
      <div class="field full"><label for="nm-segs">Convention table (Segment | Example | Required yes/no | Rule)</label><textarea class="textarea mono" id="nm-segs" style="min-height:150px">${esc(segInfo().map(s => [s.name, s.example, s.required ? 'yes' : 'no', s.rule].join(' | ')).join('\n'))}</textarea><span class="hint">Changes the explanation on this page. The generator and checker keep the AMB_Category_AssetName_Platform_Size_Version_Date order.</span></div>
      <div class="field full"><label for="nm-ex">Examples (filename | note)</label><textarea class="textarea mono" id="nm-ex">${esc(pl(n.examples, 'name', 'note'))}</textarea></div>
      ${statusField('nm-status', n.status, [{ value: 'draft', label: 'Draft' }, { value: 'approved', label: 'Approved' }])}</div>`,
    actions: [{ label: 'Cancel' }, { label: 'Save convention', primary: true, onClick: async m => {
      const prefix = formVal(m, 'nm-prefix'); if (!/^[A-Za-z0-9]+$/.test(prefix)) { showErr(m, 'The prefix can only contain letters and numbers.'); return false; }
      const cats = pairs(m, 'nm-cats'); if (!cats.length) { showErr(m, 'Add at least one category code.'); return false; }
      const bad = cats.concat(pairs(m, 'nm-plats')).find(c => !/^[A-Za-z0-9]+$/.test(c.code)); if (bad) { showErr(m, `Code “${bad.code}” can only contain letters and numbers.`); return false; }
      const ok = await dbSet('settings/naming', { prefix, separator: '_', dateFormat: formVal(m, 'nm-date'), structure: n.structure, categories: cats, platforms: pairs(m, 'nm-plats'), sizes: pairs(m, 'nm-sizes'), extensions: pairs(m, 'nm-exts', 'ext', 'use'), versionRules: formVal(m, 'nm-ver'), dateRules: formVal(m, 'nm-dr'), dos: lines(m, 'nm-dos'), donts: lines(m, 'nm-donts'), examples: pairs(m, 'nm-ex', 'name', 'note'), segments: lines(m, 'nm-segs').map(l => { const [name, example, req, ...rule] = l.split('|').map(x => x.trim()); return { name: name || '', example: example || '', required: /^y/i.test(req || ''), rule: rule.join(' | ') }; }).filter(x => x.name), status: formVal(m, 'nm-status'), updatedAt: nowIso(), updatedBy: S.me.id });
      if (!ok) return false; logActivity('brand', 'Naming convention updated'); toast('Naming convention saved');
    } }] });
}


/* ================= COLOUR DOWNLOADS ================= */
function paletteBase(kind) { return buildFilename({ category: 'Doc', assetName: kind, version: 1, date: dateStamp('YYYY') }); }
async function saveDownload(filename, data) {
  if (!S.cap.downloads) { toast('Downloads aren’t available in this view.', true); return; }
  try { await S.cap.downloads.save({ filename, data }); toast('Saved ' + filename); logActivity('download', filename); }
  catch (e) { if (e && e.code === 'declined') return; if (e && e.code === 'rate_limited') { toast('A download prompt is already open.', true); return; } toast('Couldn’t download that file.', true); }
}
function colourRows() { return S.colours.map(c => { const rgb = hexToRgb(c.hex) || []; return { name: c.name, hex: (c.hex || '').toUpperCase(), rgb: rgb.join(', '), cmyk: c.cmyk || '', pantone: c.pantone || '', group: c.group || '', role: c.role || '', usage: c.usage || '', share: c.weight ? c.weight + '%' : '' }; }); }
function csvCell(v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
function canvasBlob(cv) { return new Promise(r => cv.toBlob(r, 'image/png')); }
async function fontsReady() { try { await document.fonts.ready; } catch (e) {} }
async function downloadSwatchPng(c) {
  await fontsReady();
  const cv = document.createElement('canvas'); cv.width = 1200; cv.height = 1200; const x = cv.getContext('2d');
  x.fillStyle = c.hex; x.fillRect(0, 0, 1200, 860);
  x.fillStyle = '#fefefe'; x.fillRect(0, 860, 1200, 340);
  if (luminance(c.hex) > .9) { x.strokeStyle = '#e2e4e1'; x.lineWidth = 4; x.strokeRect(2, 2, 1196, 856); }
  const rgb = (hexToRgb(c.hex) || []).join(', ');
  x.fillStyle = '#4d4c4c'; x.font = '800 64px Inter, Arial, sans-serif'; x.fillText(c.name, 60, 960);
  x.font = '500 34px Inter, Arial, sans-serif'; x.fillStyle = '#4d4c4c';
  x.fillText('HEX ' + c.hex.toUpperCase() + '     RGB ' + rgb, 60, 1030);
  x.fillText('CMYK ' + (c.cmyk || 'not configured') + (c.pantone ? '     PMS ' + c.pantone : ''), 60, 1085);
  x.fillStyle = '#6b6e73'; x.font = '600 26px Inter, Arial, sans-serif'; x.fillText('Affordable Modular Buildings · Brand colour', 60, 1150);
  await saveDownload(buildFilename({ category: 'Doc', assetName: 'Colour ' + c.name, size: '1200x1200', version: 1 }) + '.png', await canvasBlob(cv));
}
async function downloadPaletteSheet() {
  await fontsReady();
  const cols = S.colours; const per = Math.min(5, cols.length) || 1; const rows = Math.ceil(cols.length / per);
  const W = 2000, pad = 80, gap = 32, cw = (W - pad * 2 - gap * (per - 1)) / per, chipH = 420, infoH = 300;
  const H = 300 + rows * (chipH + infoH + gap) + 120;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
  x.fillStyle = '#fefefe'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#478b02'; x.font = 'italic 800 60px Inter, Arial, sans-serif'; x.fillText('AFFORDABLE MODULAR BUILDINGS', pad, 130);
  x.fillStyle = '#4d4c4c'; x.font = '800 96px Inter, Arial, sans-serif'; x.fillText('Brand Colours', pad, 235);
  const wrap = (t, mx) => { const w = String(t).split(' '); const out = []; let l = ''; w.forEach(word => { const tt = l ? l + ' ' + word : word; if (x.measureText(tt).width > mx && l) { out.push(l); l = word; } else l = tt; }); if (l) out.push(l); return out; };
  cols.forEach((c, i) => {
    const cx = pad + (i % per) * (cw + gap), cy = 300 + Math.floor(i / per) * (chipH + infoH + gap);
    x.fillStyle = c.hex; x.fillRect(cx, cy, cw, chipH);
    if (luminance(c.hex) > .9) { x.strokeStyle = '#d6d8d5'; x.lineWidth = 3; x.strokeRect(cx + 1.5, cy + 1.5, cw - 3, chipH - 3); }
    x.fillStyle = '#4d4c4c'; x.font = '800 40px Inter, Arial, sans-serif'; x.fillText(c.name, cx, cy + chipH + 60);
    x.font = '500 28px Inter, Arial, sans-serif';
    x.fillText('HEX  ' + c.hex.toUpperCase(), cx, cy + chipH + 110);
    x.fillText('RGB  ' + (hexToRgb(c.hex) || []).join(', '), cx, cy + chipH + 150);
    x.fillText('CMYK  ' + (c.cmyk || '—'), cx, cy + chipH + 190);
    if (c.role) { x.fillStyle = '#6b6e73'; x.font = '500 24px Inter, Arial, sans-serif'; wrap(c.role, cw).slice(0, 2).forEach((l, j) => x.fillText(l, cx, cy + chipH + 235 + j * 32)); }
  });
  x.fillStyle = '#6b6e73'; x.font = '500 24px Inter, Arial, sans-serif'; x.fillText('Exported from the AMB Brand Asset Library · ' + fmtDate(nowIso()), pad, H - 50);
  await saveDownload(paletteBase('BrandColours') + '.png', await canvasBlob(cv));
}
function paletteSvg() {
  const cols = S.colours; const w = 220, gap = 20, W = cols.length * (w + gap) + 40;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="420" viewBox="0 0 ${W} 420">\n<rect width="${W}" height="420" fill="#FEFEFE"/>\n` + cols.map((c, i) => { const xx = 20 + i * (w + gap); const t = s => String(s).replace(/[<&>"]/g, ch => ({ '<': '&lt;', '&': '&amp;', '>': '&gt;', '"': '&quot;' }[ch])); return `<g id="${t(pascal(c.name))}">\n  <rect x="${xx}" y="20" width="${w}" height="240" fill="${t(c.hex)}" stroke="#E2E4E1"/>\n  <text x="${xx}" y="296" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="700" fill="#4D4C4C">${t(c.name)}</text>\n  <text x="${xx}" y="326" font-family="Arial, sans-serif" font-size="15" fill="#4D4C4C">HEX ${t(c.hex.toUpperCase())}</text>\n  <text x="${xx}" y="348" font-family="Arial, sans-serif" font-size="15" fill="#4D4C4C">RGB ${(hexToRgb(c.hex) || []).join(', ')}</text>\n  <text x="${xx}" y="370" font-family="Arial, sans-serif" font-size="15" fill="#4D4C4C">CMYK ${t(c.cmyk || '—')}</text>\n</g>`; }).join('\n') + '\n</svg>\n';
}
function openPaletteDownload() {
  const opts = [
    { id: 'png', icon: 'image', title: 'Palette sheet (PNG)', desc: 'A one-page image of every colour with HEX, RGB and CMYK. Good for sharing and briefs.' },
    { id: 'svg', icon: 'layers', title: 'Swatches (SVG)', desc: 'Editable vector swatches, named by colour. Opens in Illustrator, Figma and Canva.' },
    { id: 'csv', icon: 'list', title: 'Colour values (CSV)', desc: 'A spreadsheet of names, HEX, RGB, CMYK, Pantone, roles and usage.' },
    { id: 'json', icon: 'file', title: 'Design tokens (JSON)', desc: 'For developers: colour names and values in a tokens file.' },
    { id: 'md', icon: 'book', title: 'Colour guide (Markdown)', desc: 'Palette, mix, combinations and text-contrast rules as a text document.' },
  ];
  const { el, close } = modal({ title: 'Download palette', subtitle: `${S.colours.length} brand colours. Pick a format.`, body: `<div class="dl-grid">${opts.map(o => `<button type="button" class="dl-opt" data-fmt="${o.id}">${icon(o.icon)}<span><b>${esc(o.title)}</b><small>${esc(o.desc)}</small></span>${icon('download')}</button>`).join('')}</div>${S.cap.downloads ? '' : '<p class="note">Downloads aren’t available in this view.</p>'}`, actions: [{ label: 'Close' }] });
  $$('[data-fmt]', el).forEach(b => b.addEventListener('click', async () => {
    const f = b.dataset.fmt; b.disabled = true;
    try {
      if (f === 'png') await downloadPaletteSheet();
      else if (f === 'svg') await saveDownload(paletteBase('BrandColourSwatches') + '.svg', paletteSvg());
      else if (f === 'csv') { const r = colourRows(); const head = ['Name', 'HEX', 'RGB', 'CMYK', 'Pantone', 'Group', 'Role', 'Usage', 'Share of posts']; await saveDownload(paletteBase('BrandColours') + '.csv', '﻿' + [head.join(',')].concat(r.map(x => [x.name, x.hex, x.rgb, x.cmyk, x.pantone, x.group, x.role, x.usage, x.share].map(csvCell).join(','))).join('\r\n')); }
      else if (f === 'json') { const tokens = { color: { amb: Object.fromEntries(S.colours.map(c => [pascal(c.name).replace(/^./, m => m.toLowerCase()), { value: c.hex.toUpperCase(), type: 'color', description: c.role || c.usage || '' }])) } }; await saveDownload(paletteBase('BrandColourTokens') + '.json', JSON.stringify(tokens, null, 2)); }
      else if (f === 'md') {
        const cg = colourGuide(); const total = S.colours.reduce((t, c) => t + (+c.weight || 0), 0) || 1;
        const pairs = []; S.colours.forEach(bg => S.colours.forEach(fg => { if (bg.id !== fg.id) pairs.push({ bg, fg, r: contrastRatio(bg.hex, fg.hex) }); }));
        const md = `# Affordable Modular Buildings – Brand Colours\n\n${cg.intro || ''}\n\n## Palette\n\n| Colour | HEX | RGB | CMYK | Role |\n|---|---|---|---|---|\n${colourRows().map(r => `| ${r.name} | ${r.hex} | ${r.rgb} | ${r.cmyk || '—'} | ${r.role} |`).join('\n')}\n\n## How much of each\n\n${S.colours.filter(c => +c.weight > 0).map(c => `- ${c.name}: ${Math.round(+c.weight / total * 100)}%`).join('\n')}\n\n${cg.mixNote || ''}\n\n## Colour combinations\n\n${(cg.combos || []).map(c => `### ${c.name}\n\n${(c.roles || []).map(r => `- ${r.label}: ${r.hex}`).join('\n')}\n\nUse for ${c.use || ''}`).join('\n\n')}\n\n## Which text goes on which colour\n\n| Text on background | Contrast | Use |\n|---|---|---|\n${sortBy(pairs, p => p.r, -1).map(p => `| ${p.fg.name} on ${p.bg.name} | ${p.r.toFixed(1)} : 1 | ${contrastUse(p.r)} |`).join('\n')}\n\n_Exported from the AMB Brand Asset Library, ${fmtDate(nowIso())}._\n`;
        await saveDownload(paletteBase('BrandColourGuide') + '.md', md);
      }
    } finally { b.disabled = false; }
  }));
  void close;
}
