/* AMB Brand Asset Library — core: state, capabilities, data access, permissions, helpers */
'use strict';

const S = {
  cap: { db: null, user: null, assets: null, downloads: null },
  ready: {},            // collection name -> true once first non-cache snapshot arrived
  timedOut: false,
  me: { id: null, name: '', avatarUrl: '', canEdit: false, isOwner: false },
  role: 'Viewer',
  canWriteShared: null,
  assets: [], approvals: {}, folders: [], colours: [], fonts: [], typestyles: [], specs: [],
  settings: {}, roles: {}, members: [], activity: [], requests: [],
  profiles: {},
  sel: new Set(),
  ui: { lib: { q: '', cat: 'all', fmt: 'all', status: 'active', folder: 'all', sort: 'updated', view: 'grid' }, logoSub: 'all', tplSub: 'all', specGroup: 'all' },
  storageUsage: null,
};

/* ---------- Constants ---------- */
const ROLES = ['Administrator', 'Designer', 'Marketing Team', 'Viewer'];
const PERMS = {
  'Administrator': { upload: 1, editAny: 1, editOwn: 1, replace: 1, folders: 1, approve: 1, archive: 1, del: 1, brand: 1, content: 1, users: 1, settings: 1 },
  'Designer':      { upload: 1, editAny: 1, editOwn: 1, replace: 1, folders: 1, archive: 1, del: 1, brand: 1, content: 1 },
  'Marketing Team':{ upload: 1, editAny: 1, editOwn: 1, replace: 1, folders: 1, archive: 1, del: 1, brand: 1, content: 1 },
  'Viewer':        {},
};
const can = (p) => !!(PERMS[S.role] || {})[p];

const CORE_CATEGORIES = [
  { id: 'logo', label: 'Logos', code: 'Logo', desc: 'Approved AMB logos, lockups and symbol files.' },
  { id: 'template', label: 'Templates', code: 'Template', desc: 'Editable social, print and presentation templates.' },
  { id: 'social', label: 'Social Media', code: 'SocialMedia', desc: 'Finished social posts, covers and thumbnails.' },
  { id: 'photo', label: 'Photography', code: 'Photo', desc: 'Approved modular building and project photography.' },
  { id: 'print', label: 'Print & Brochures', code: 'Brochure', desc: 'Brochures, company profiles, catalogues and flyers.' },
  { id: 'web', label: 'Website Graphics', code: 'Website', desc: 'Banners, hero images and web graphics.' },
  { id: 'advert', label: 'Advertising', code: 'Ad', desc: 'Digital and print advertising materials.' },
  { id: 'video', label: 'Video', code: 'Video', desc: 'Brand videos, reels and motion assets.' },
  { id: 'font', label: 'Font Files', code: 'Font', desc: 'Licensed typeface files.' },
  { id: 'document', label: 'Documents', code: 'Doc', desc: 'Guidelines and reference PDFs.' },
];
const DEFAULT_LOGO_SUBS = ['Primary Logo', 'Secondary Logo', 'Horizontal Logo', 'Stacked Logo', 'White Logo', 'Green Logo', 'Black Logo', 'Icon / Symbol Only'];
const LOGO_FILE_FILTERS = [{ id: 'png', label: 'Transparent PNG' }, { id: 'svg', label: 'SVG Files' }, { id: 'pdf', label: 'PDF / Vector Files' }];
const DEFAULT_TEMPLATE_SUBS = ['Social Media Templates', 'Facebook Posts', 'Instagram Posts', 'YouTube Thumbnails', 'Brochures', 'Company Profiles', 'Product Catalogues', 'Presentations', 'Email Signatures', 'Marketing Flyers', 'Website Graphics', 'Advertising Materials'];
const DEFAULT_BG_OPTIONS = ['Light backgrounds', 'Dark backgrounds', 'AMB Green backgrounds', 'Photography'];

function listOr(key, def) { const l = S.settings.lists && S.settings.lists[key]; return Array.isArray(l) && l.length ? l : def; }
function logoSubs() { return listOr('logoSubs', DEFAULT_LOGO_SUBS); }
function templateSubs() { return listOr('templateSubs', DEFAULT_TEMPLATE_SUBS); }
function bgOptions() { return listOr('bgOptions', DEFAULT_BG_OPTIONS); }
function specGroups() { return listOr('specGroups', DEFAULT_SPEC_GROUPS); }
const DEFAULT_SPEC_GROUPS = ['Website Images', 'Social Media Graphics', 'Facebook Covers', 'Instagram Posts', 'Instagram Stories', 'YouTube Thumbnails', 'Brochures', 'Print Materials', 'Digital Advertisements'];
function navLabel(id, def) { const p = S.settings['page-' + id]; return (p && p.navLabel) || def; }
function statusField(id, cur, options) {
  if (can('approve')) return `<div class="field"><label for="${id}">Status</label><select class="select" id="${id}">${selectOpts(options, cur)}</select></div>`;
  return `<input type="hidden" id="${id}" value="draft"><p class="note full">Your changes save as <b>Draft</b> until an administrator approves them.</p>`;
}
async function dbDeleteQuiet(path) { try { await S.cap.db.doc(path).delete(); return true; } catch (e) { return false; } }

const MIME_BY_EXT = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
  mp4: 'video/mp4', webm: 'video/webm', pdf: 'application/pdf', woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', otf: 'font/otf',
  csv: 'text/csv', md: 'text/markdown', json: 'application/json', txt: 'text/plain',
};
const EXT_BY_MIME = Object.fromEntries(Object.entries(MIME_BY_EXT).map(([e, m]) => [m, e]));
EXT_BY_MIME['image/jpeg'] = 'jpg';
const UNSUPPORTED_HINT = 'AI, PSD, INDD, EPS, PPTX, DOCX and ZIP files can’t be stored here. Upload a PNG/PDF preview instead and add a link to the editable source (SharePoint, Google Drive or Canva).';
const DOWNLOAD_EXTS = new Set(['gif', 'png', 'jpg', 'jpeg', 'webp', 'mp4', 'webm', 'txt', 'json', 'md', 'csv', 'ttf', 'svg', 'pdf']);

/* ---------- Helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function nowIso() { return new Date().toISOString(); }
function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
function fmtBytes(b) { if (!b && b !== 0) return '—'; if (b < 1024) return b + ' B'; if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'; return (b / 1048576).toFixed(1) + ' MB'; }
function fmtDate(iso) { if (!iso) return '—'; const d = new Date(iso); if (isNaN(d)) return '—'; return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }); }
function fmtDateTime(iso) { if (!iso) return '—'; const d = new Date(iso); if (isNaN(d)) return '—'; return d.toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }); }
function relTime(iso) {
  if (!iso) return ''; const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + 'm ago'; if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  if (s < 86400 * 7) return Math.floor(s / 86400) + 'd ago'; return fmtDate(iso);
}
function extOf(name) { const m = /\.([a-z0-9]+)$/i.exec(name || ''); return m ? m[1].toLowerCase() : ''; }
function blobUrl(id) { return id ? (window.AMB_BLOB_BASE ? window.AMB_BLOB_BASE + id : '/_blob/' + id) : ''; }
function isImageType(ct) { return /^image\//.test(ct || ''); }
function pascal(s) {
  return String(s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, ' and ')
    .split(/[^A-Za-z0-9]+/).filter(Boolean).map(w => /^[A-Z0-9]+$/.test(w) && w.length <= 4 ? w : w.charAt(0).toUpperCase() + w.slice(1)).join('');
}
function hexToRgb(hex) { const m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim()); if (!m) return null; const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function luminance(hex) { const c = hexToRgb(hex); if (!c) return 1; const [r, g, b] = c.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; }
function textOn(hex) { return luminance(hex) > .45 ? '#2b2c2e' : '#ffffff'; }
function gcd(a, b) { return b ? gcd(b, a % b) : a; }
function ratio(w, h) { w = +w; h = +h; if (!w || !h) return '—'; const g = gcd(Math.round(w), Math.round(h)); const a = Math.round(w) / g, b = Math.round(h) / g; if (a > 50 || b > 50) return (w / h).toFixed(2) + ':1'; return a + ':' + b; }
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
function sortBy(arr, fn, dir = 1) { return arr.slice().sort((a, b) => { const x = fn(a), y = fn(b); return x < y ? -dir : x > y ? dir : 0; }); }

/* ---------- Asset status ---------- */
function statusOf(a) {
  if (a.archived) return 'archived';
  const ap = S.approvals[a.id];
  if (ap && ap.state === 'archived') return 'archived';
  if (ap && ap.version === (a.version || 1) && (ap.state === 'approved' || ap.state === 'rejected')) return ap.state;
  return 'pending';
}
const STATUS_LABEL = { approved: 'Approved', pending: 'Pending review', rejected: 'Rejected', archived: 'Archived' };
function statusPill(st) { return `<span class="pill st-${st}">${STATUS_LABEL[st] || st}</span>`; }
function demoPill() { return `<span class="pill st-demo nodot" title="Sample asset for demonstration — not an official AMB file">DEMO</span>`; }
function categories() {
  const extra = (S.settings.categories && Array.isArray(S.settings.categories.extra)) ? S.settings.categories.extra : [];
  const hidden = new Set((S.settings.categories && S.settings.categories.hidden) || []);
  return CORE_CATEGORIES.filter(c => !hidden.has(c.id) || c.id === 'logo' || c.id === 'template').concat(extra.filter(c => c && c.id && c.label));
}
function catLabel(id) { const c = categories().find(c => c.id === id) || CORE_CATEGORIES.find(c => c.id === id); return c ? c.label : (id || 'Uncategorised'); }
function catCode(id) { const c = categories().find(c => c.id === id) || CORE_CATEGORIES.find(c => c.id === id); return c ? (c.code || pascal(c.label)) : pascal(id); }
function activeAssets() { return S.assets.filter(a => statusOf(a) !== 'archived'); }
function assetExt(a) { return (a.ext || EXT_BY_MIME[a.contentType] || extOf(a.originalName) || 'file').toLowerCase(); }
function isDemo(a) { return !!a.demo; }

/* ---------- Naming convention ---------- */
const DEFAULT_NAMING = {
  prefix: 'AMB', separator: '_', dateFormat: 'YYYY',
  structure: 'AMB_Category_AssetName_Platform_Size_Version_Date',
  categories: [], platforms: [], sizes: [],
  dos: [], donts: [], extensions: [], versionRules: '', dateRules: '', updatedAt: null, status: 'draft',
};
function naming() { return Object.assign({}, DEFAULT_NAMING, S.settings.naming || {}); }
function namingCategories() {
  const n = naming();
  if (n.categories && n.categories.length) return n.categories;
  return CORE_CATEGORIES.map(c => ({ code: c.code, label: c.label }));
}
function buildFilename(o) {
  const n = naming(); const sep = n.separator || '_';
  const parts = [n.prefix || 'AMB'];
  if (o.category) parts.push(o.category);
  if (o.assetName) parts.push(pascal(o.assetName));
  if (o.platform) parts.push(o.platform);
  if (o.size) parts.push(String(o.size).replace(/\s+/g, '').replace(/×/g, 'x'));
  if (o.version) parts.push('V' + String(Math.max(1, parseInt(o.version, 10) || 1)).padStart(2, '0'));
  if (o.date) parts.push(o.date);
  return parts.filter(Boolean).join(sep);
}
function dateStamp(fmt, d = new Date()) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
  if (fmt === 'YYYYMMDD') return `${y}${m}${dd}`; if (fmt === 'YYYYMM') return `${y}${m}`; if (fmt === 'none') return ''; return String(y);
}
function validateFilename(name) {
  const n = naming(); const issues = []; const good = [];
  let base = String(name || '').trim(); const ext = extOf(base); if (ext) base = base.slice(0, -(ext.length + 1));
  if (!base) return { ok: false, issues: ['Enter a filename to check.'], good };
  const sep = n.separator || '_';
  if (/\s/.test(base)) issues.push('Contains spaces. Use ' + (sep === '_' ? 'underscores' : 'the separator') + ' between segments and PascalCase within them.');
  if (/[^A-Za-z0-9_\-]/.test(base)) issues.push('Contains special characters. Only letters, numbers and underscores are allowed.');
  if (/-/.test(base)) issues.push('Contains hyphens. Hyphens are reserved; use PascalCase instead (e.g. CompanyProfile).');
  if (/__/.test(base)) issues.push('Contains an empty segment (double underscore).');
  const parts = base.split(sep);
  if (parts[0] !== (n.prefix || 'AMB')) issues.push(`Must start with the prefix “${n.prefix || 'AMB'}${sep}”.`); else good.push('Starts with the ' + (n.prefix || 'AMB') + ' prefix');
  const cats = namingCategories().map(c => c.code);
  if (parts[1] && cats.includes(parts[1])) good.push(`Category “${parts[1]}” is approved`);
  else issues.push(`Second segment should be an approved category code (${cats.slice(0, 6).join(', ')}…).`);
  const vIdx = parts.findIndex(p => /^V\d{2,}$/.test(p));
  if (vIdx === -1) { if (parts.some(p => /^v\d+$/i.test(p))) issues.push('Version must be an upper-case V with two digits, e.g. V01.'); else issues.push('Missing a version segment (V01, V02…).'); }
  else good.push(`Version ${parts[vIdx]} is correctly formatted`);
  if (parts.some(p => /^(final|new|latest|copy|old|draft\d*)$/i.test(p))) issues.push('Avoid words like “Final”, “New”, “Latest” or “Copy”. Use the version number instead.');
  if (parts.some(p => /^\d+X\d+$/.test(p))) issues.push('Use a lower-case “x” in dimensions, e.g. 1080x1080.');
  if (parts.some(p => /^\d{1,2}[-.]\d{1,2}[-.]\d{2,4}$/.test(p))) issues.push('Dates must be YYYY, YYYYMM or YYYYMMDD.');
  if (base.length > 80) issues.push('Longer than 80 characters. Shorten the asset name.');
  if (ext) { const allowed = (n.extensions || []).map(e => (e.ext || '').replace('.', '').toLowerCase()).filter(Boolean); if (ext !== ext.toLowerCase()) issues.push('File extension should be lower case.'); else if (allowed.length && !allowed.includes(ext)) issues.push(`“.${ext}” isn’t in the approved extension list.`); else good.push(`Extension .${ext} is fine`); }
  return { ok: issues.length === 0, issues, good };
}

/* ---------- Capabilities & data ---------- */
const COLLECTIONS = ['assets', 'approvals', 'folders', 'colours', 'fonts', 'typestyles', 'specs', 'settings', 'roles', 'activity', 'requests'];
let rerender = () => {};
const scheduleRender = (() => { let p = false; return () => { if (p) return; p = true; requestAnimationFrame(() => { p = false; rerender(); }); }; })();

async function initCapabilities() {
  if (!window.claude || typeof window.claude.use !== 'function') return;
  const [user, db, assets, downloads] = await Promise.all(['user', 'db', 'assets', 'downloads'].map(n => window.claude.use(n).catch(() => null)));
  S.cap = { user, db, assets, downloads };
  if (user) {
    const me = await user.me();
    S.me = { id: me.id, name: me.name, avatarUrl: me.avatarUrl, canEdit: !!me.canEdit, isOwner: !!me.isOwner, platformRole: me.platformRole || '' };
    S.canWriteShared = await user.can('data.write');
  }
}

function subscribeAll() {
  const db = S.cap.db; if (!db) return;
  const timer = setTimeout(() => { if (COLLECTIONS.some(c => !S.ready[c])) { S.timedOut = true; scheduleRender(); } }, 10000);
  const done = () => { if (COLLECTIONS.every(c => S.ready[c])) { clearTimeout(timer); S.timedOut = false; } };
  const handlers = {
    assets: snap => { S.assets = snap.docs.map(d => Object.assign({ id: d.id }, d.data())); },
    approvals: snap => { const o = {}; snap.docs.forEach(d => o[d.id] = d.data()); S.approvals = o; },
    folders: snap => { S.folders = snap.docs.map(d => Object.assign({ id: d.id }, d.data())); },
    colours: snap => { S.colours = sortBy(snap.docs.map(d => Object.assign({ id: d.id }, d.data())), c => (c.order ?? 99)); },
    fonts: snap => { S.fonts = snap.docs.map(d => Object.assign({ id: d.id }, d.data())); loadFontFaces(); },
    typestyles: snap => { S.typestyles = sortBy(snap.docs.map(d => Object.assign({ id: d.id }, d.data())), t => (t.order ?? 99)); },
    specs: snap => { S.specs = snap.docs.map(d => Object.assign({ id: d.id }, d.data())); },
    settings: snap => { const o = {}; snap.docs.forEach(d => o[d.id] = d.data()); S.settings = o; },
    roles: snap => { const o = {}; snap.docs.forEach(d => o[d.id] = d.data()); S.roles = o; computeRole(); },
    activity: snap => { S.activity = snap.docs.map(d => Object.assign({ id: d.id }, d.data())); },
    requests: snap => { S.requests = snap.docs.map(d => Object.assign({ id: d.id }, d.data())); },
  };
  COLLECTIONS.forEach(name => {
    let q = db.collection(name);
    if (name === 'activity') q = q.orderBy('at', 'desc').limit(60);
    q.onSnapshot(snap => {
      handlers[name](snap);
      if (!snap.metadata.fromCache) { S.ready[name] = true; done(); }
      scheduleRender();
    }, err => {
      S.ready[name] = true; done();
      if (err && err.code === 'revoked') S.revoked = true;
      console.warn('Subscription error', name, err);
      scheduleRender();
    });
  });
  if (S.me.canEdit) {
    db.collection('members').onSnapshot(snap => { S.members = snap.docs.map(d => Object.assign({ id: d.id }, d.data())); scheduleRender(); }, () => {});
  }
}

function computeRole() {
  if (!S.cap.db || !S.me.id && !S.me.canEdit) { S.role = 'Viewer'; return; }
  if (S.me.canEdit) { S.role = 'Administrator'; return; }
  if (S.me.platformRole && PERMS[S.me.platformRole]) { const r = S.me.id && S.roles[S.me.id] && S.roles[S.me.id].role; S.role = r && PERMS[r] ? r : S.me.platformRole; return; }
  if (S.canWriteShared === false) { S.role = 'Viewer'; return; }
  const r = S.me.id && S.roles[S.me.id] && S.roles[S.me.id].role;
  if (r && PERMS[r] && r !== 'Administrator') { S.role = r; return; }
  const def = (S.settings.general && S.settings.general.defaultRole) || 'Designer';
  S.role = PERMS[def] && def !== 'Administrator' ? def : 'Designer';
}

async function recordPresence() {
  if (!S.cap.db || !S.me.id || S.canWriteShared === false) return;
  try { await S.cap.db.doc('members/' + S.me.id).set({ lastSeen: nowIso() }); } catch (e) { /* view-only members can't write; fine */ }
}

function dbErrorMessage(e) {
  const code = e && e.code;
  if (code === 'invalid_argument') return 'You don’t have permission to make this change.';
  if (code === 'quota_exceeded') return 'The library storage is full. Ask an administrator to archive or delete unused assets.';
  if (code === 'resource_exhausted') return 'Too many changes at once. Wait a moment and try again.';
  if (code === 'revoked') return 'Your access to this library has changed. Reload the page.';
  return 'Couldn’t save. Check your connection and try again.';
}
async function dbSet(path, data) { try { await S.cap.db.doc(path).set(data); return true; } catch (e) { if (e && e.code === 'unavailable') { await new Promise(r => setTimeout(r, 600 + Math.random() * 600)); try { await S.cap.db.doc(path).set(data); return true; } catch (e2) { e = e2; } } toast(dbErrorMessage(e), true); return false; } }
async function dbUpdate(path, data) { try { await S.cap.db.doc(path).update(data); return true; } catch (e) { toast(dbErrorMessage(e), true); return false; } }
async function dbDelete(path) { try { await S.cap.db.doc(path).delete(); return true; } catch (e) { toast(dbErrorMessage(e), true); return false; } }

async function logActivity(type, label, extra = {}) {
  if (!S.cap.db) return;
  try { await S.cap.db.collection('activity').doc().set(Object.assign({ type, label, by: S.me.id || null, at: nowIso() }, extra)); } catch (e) { /* non-critical */ }
}

async function resolveProfiles(ids) {
  ids = [...new Set(ids.filter(Boolean))];
  if (!ids.length || !S.cap.user) return;
  const missing = ids.filter(i => !S.profiles[i]);
  if (!missing.length) return;
  try { const ps = await S.cap.user.profiles(missing); Object.assign(S.profiles, ps); scheduleRender(); } catch (e) {}
}
function personName(id) { if (!id) return 'Claude (setup)'; const p = S.profiles[id]; if (id === S.me.id) return 'You'; return (p && p.name) || 'A team member'; }
function personAvatar(id) { const p = S.profiles[id]; return (p && p.avatarUrl) || (id === S.me.id ? S.me.avatarUrl : '') || 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><rect width="28" height="28" rx="14" fill="#8c8f94"/></svg>'); }

/* ---------- Fonts loaded from library ---------- */
const loadedFonts = new Set();
function loadFontFaces() {
  S.fonts.forEach(f => {
    if (!f.family) return;
    if (f.fileId && !loadedFonts.has(f.fileId)) {
      loadedFonts.add(f.fileId);
      const st = document.createElement('style');
      const fam = String(f.family).replace(/["\\<>]/g, '');
      st.textContent = `@font-face{font-family:"AMBLib-${fam}";src:url("${blobUrl(f.fileId).replace(/"/g, '')}");font-display:swap}`;
      document.head.appendChild(st);
    } else if (f.source === 'Google Fonts' && !loadedFonts.has('g:' + f.family + f.style)) {
      loadedFonts.add('g:' + f.family + f.style);
      const wl = (f.weights && f.weights.length ? f.weights : [400, 700]).map(Number).filter(Boolean).sort((a, b) => a - b);
      const axis = f.style === 'italic' ? 'ital,wght@' + wl.map(w => '1,' + w).join(';') : 'wght@' + wl.join(';');
      const l = document.createElement('link'); l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(f.family).replace(/%20/g, '+') + ':' + axis + '&display=swap';
      document.head.appendChild(l);
    }
  });
}
function fontStack(f) {
  if (!f) return 'var(--font-body)';
  const fam = String(f.family || '').replace(/["\\<>;{}]/g, '');
  return f.fileId ? `"AMBLib-${fam}", "${fam}", var(--font-body)` : `"${fam}", var(--font-body)`;
}
function fontForRole(role) { return S.fonts.find(f => f.role === role && f.status === 'approved') || S.fonts.find(f => f.role === role); }

/* ---------- Clipboard & downloads ---------- */
async function copyText(text, what = 'Copied') {
  try { await navigator.clipboard.writeText(text); toast(what + ' to clipboard'); return; } catch (e) {}
  try {
    const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove();
    if (ok) { toast(what + ' to clipboard'); return; }
  } catch (e) {}
  modal({ title: 'Copy manually', body: `<p class="muted">Your browser blocked clipboard access. Select the text and press Ctrl/Cmd + C.</p><input class="input mono" id="manual-copy" value="${esc(text)}" readonly>`, actions: [{ label: 'Done', primary: true }] });
  setTimeout(() => { const i = $('#manual-copy'); if (i) { i.focus(); i.select(); } }, 50);
}

async function downloadFile(fileId, filenameBase, ext, contentType) {
  if (!fileId) { toast('This asset has no stored file.', true); return; }
  ext = (ext || EXT_BY_MIME[contentType] || 'bin').toLowerCase();
  const filename = filenameBase + '.' + ext;
  const dl = S.cap.downloads;
  if (!dl || !DOWNLOAD_EXTS.has(ext)) { openInNewTab(fileId); return; }
  try {
    const res = await fetch(blobUrl(fileId));
    if (!res.ok) throw new Error('missing');
    const blob = await res.blob();
    await dl.save({ filename, data: blob });
    toast('Saved ' + filename);
    if (S.cap.db) logActivity('download', filename);
  } catch (e) {
    if (e && e.code === 'declined') return;
    if (e && (e.code === 'rate_limited')) { toast('A download prompt is already open.', true); return; }
    if (e && e.message === 'missing') { toast('The stored file couldn’t be found. Ask an admin to replace it.', true); return; }
    openInNewTab(fileId);
  }
}
function openInNewTab(fileId) {
  const a = document.createElement('a'); a.href = blobUrl(fileId); a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
  toast('Opened the file in a new tab. Save it from there.');
}

/* ---------- File inspection ---------- */
function detectType(file) {
  const ext = extOf(file.name);
  let type = file.type && Object.values(MIME_BY_EXT).includes(file.type) ? file.type : (MIME_BY_EXT[ext] || '');
  return { ext: ext === 'jpeg' ? 'jpg' : ext, type };
}
function validateUploadFile(file) {
  const { ext, type } = detectType(file);
  if (!type) return { error: `“.${ext || '?'}” files aren’t supported. ${UNSUPPORTED_HINT}` };
  const limit = type === 'image/svg+xml' ? 2 * 1048576 : 20 * 1048576;
  if (file.size > limit) return { error: `This file is ${fmtBytes(file.size)}. The limit is ${type === 'image/svg+xml' ? '2 MB for SVG' : '20 MB'}. Compress it and try again.` };
  if (file.size === 0) return { error: 'This file is empty.' };
  return { ext, type };
}
async function imageDims(file, type) {
  try {
    if (type === 'image/svg+xml') {
      const txt = await file.text();
      const doc = new DOMParser().parseFromString(txt, 'image/svg+xml'); const svg = doc.documentElement;
      let w = parseFloat(svg.getAttribute('width')), h = parseFloat(svg.getAttribute('height'));
      const vb = (svg.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
      if ((!w || !h) && vb.length === 4) { w = vb[2]; h = vb[3]; }
      return w && h ? { width: Math.round(w), height: Math.round(h) } : {};
    }
    if (/^image\//.test(type)) { const bmp = await createImageBitmap(file); const r = { width: bmp.width, height: bmp.height }; bmp.close && bmp.close(); return r; }
    if (/^video\//.test(type)) {
      return await new Promise(res => { const v = document.createElement('video'); v.preload = 'metadata'; v.onloadedmetadata = () => { res({ width: v.videoWidth, height: v.videoHeight }); URL.revokeObjectURL(v.src); }; v.onerror = () => res({}); v.src = URL.createObjectURL(file); });
    }
  } catch (e) {}
  return {};
}
function uploadErrorMessage(e) {
  const c = e && e.code;
  if (c === 'too_large') return 'That file is over the size limit (20 MB, or 2 MB for SVG).';
  if (c === 'unsupported_type') return 'That file type isn’t supported. ' + UNSUPPORTED_HINT;
  if (c === 'quota_or_state') return 'The library’s file storage is full. Ask an administrator to delete unused files.';
  if (c === 'rate_limited') return 'Too many uploads at once. Wait a moment and try again.';
  if (c === 'not_granted' || c === 'capability_disabled') return 'Your account can’t upload files to this library.';
  if (c === 'upstream_auth') return 'Your session expired. Reload the page and sign in again.';
  return 'Upload failed. Check your connection and try again.';
}
async function uploadBlob(file, type) {
  const a = S.cap.assets; if (!a) throw { code: 'not_granted' };
  try { return await a.upload(file, { type }); }
  catch (e) { if (e && e.code === 'store_unavailable') { await new Promise(r => setTimeout(r, 900)); return await a.upload(file, { type }); } throw e; }
}
