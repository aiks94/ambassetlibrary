/* AMB Brand Asset Library — read-only website adapter (Netlify / any static host).
   Loads data/library.json and serves files from data/files/. No sign-in, no database. */
(function () {
  'use strict';
  window.AMB_PLATFORM = { name: 'static' };
  window.AMB_BLOB_BASE = 'data/files/';
  const ready = fetch('data/library.json', { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error('missing'); return r.json(); }).catch(() => ({ docs: {} }));
  const meta = { fromCache: false, hasPendingWrites: false };
  const denied = () => Promise.reject({ code: 'invalid_argument', message: 'This website is read-only.' });
  const snap = (id, d) => ({ id, exists: d !== undefined, data: () => d, metadata: meta });
  const collOf = p => p.split('/').slice(0, -1).join('/');
  function query(coll, o) {
    o = o || {};
    const run = docs => {
      let list = Object.entries(docs).filter(([p]) => collOf(p) === coll).map(([p, d]) => ({ id: p.split('/').pop(), d }));
      if (o.orderBy) { const [f, dir] = o.orderBy; list.sort((a, b) => { const x = a.d[f], y = b.d[f]; if (x === y) return 0; if (x === undefined) return 1; if (y === undefined) return -1; return (x < y ? -1 : 1) * (dir === 'desc' ? -1 : 1); }); }
      if (o.limit) list = list.slice(0, o.limit);
      const out = list.map(x => snap(x.id, x.d));
      return { docs: out, size: out.length, empty: !out.length, docChanges: () => [], metadata: meta };
    };
    return {
      where: () => query(coll, o), orderBy: (f, d) => query(coll, Object.assign({}, o, { orderBy: [f, d || 'asc'] })), limit: n => query(coll, Object.assign({}, o, { limit: n })),
      get: () => ready.then(j => run(j.docs || {})),
      onSnapshot(next) { ready.then(j => next(run(j.docs || {}))); return () => {}; },
      doc: id => docRef(coll + '/' + (id || 'x')), add: denied, path: coll,
    };
  }
  function docRef(path) {
    const id = path.split('/').pop();
    return { id, path, get: () => ready.then(j => snap(id, (j.docs || {})[path])), set: denied, update: denied, delete: denied,
      onSnapshot(next) { ready.then(j => next(snap(id, (j.docs || {})[path]))); return () => {}; }, collection: s => query(path + '/' + s) };
  }
  const avatar = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="32" fill="#478b02"/></svg>');
  const user = {
    me: async () => ({ id: 'viewer', name: '', avatarUrl: avatar, color: '#478b02', email: null, isOwner: false, canEdit: false, platformRole: 'Viewer' }),
    id: async () => 'viewer', isOwner: async () => false, canEdit: async () => false, can: async () => false, name: async () => '', email: async () => null,
    profiles: async ids => Object.fromEntries([].concat(ids || []).map(i => [i, { id: i, name: '', avatarUrl: avatar, color: '#478b02', email: null, isMe: false, guest: false }])),
    search: async () => [],
  };
  const downloads = { async save({ filename, data }) { const b = data instanceof Blob ? data : new Blob([data]); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = filename || 'download'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); return { status: 'saved' }; } };
  const db = { collection: c => query(c), doc: p => docRef(p) };
  window.claude = { use: async n => ({ user, db, downloads })[n] || null };
})();
