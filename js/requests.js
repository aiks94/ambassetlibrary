/* AMB — asset requests */
'use strict';
const REQ_TYPES = ['New asset', 'Update an existing asset', 'New template', 'New export size', 'Question about the brand'];
const REQ_STATUS = [{ value: 'open', label: 'Open' }, { value: 'progress', label: 'In progress' }, { value: 'done', label: 'Done' }];
function openRequestModal(preset = {}) {
  if (!S.cap.db) { toast('Requests aren’t available in this view.', true); return; }
  modal({ title: 'Submit a request', subtitle: 'Ask the brand team for an asset, template, update or answer. Everyone on the team can see requests and their status.',
    body: `<div class="form-grid">
      <div class="field"><label for="rq-type">Request type</label><select class="select" id="rq-type">${selectOpts(REQ_TYPES, preset.type || 'New asset')}</select></div>
      <div class="field"><label for="rq-due">Needed by (optional)</label><input class="input" type="date" id="rq-due"></div>
      <div class="field full"><label for="rq-title">What do you need? *</label><input class="input" id="rq-title" maxlength="100" placeholder="e.g. Instagram story template for the Expo"></div>
      <div class="field full"><label for="rq-details">Details</label><textarea class="textarea" id="rq-details" placeholder="Sizes, platform, where it’s going, any examples…"></textarea></div>
      <div class="field full"><label for="rq-asset">Related asset (optional)</label><select class="select" id="rq-asset">${selectOpts(sortBy(activeAssets(), a => a.name.toLowerCase()).map(a => ({ value: a.id, label: a.name })), preset.assetId || '', 'None')}</select></div></div>`,
    actions: [{ label: 'Cancel' }, { label: 'Submit request', primary: true, icon: 'message', onClick: async m => {
      const title = formVal(m, 'rq-title'); if (!title) { showErr(m, 'Describe what you need.'); return false; }
      const id = uid();
      const ok = await dbSet('requests/' + id, { title, type: formVal(m, 'rq-type'), details: formVal(m, 'rq-details'), due: formVal(m, 'rq-due'), assetId: formVal(m, 'rq-asset'), status: 'open', by: S.me.id, at: nowIso(), updatedAt: nowIso() });
      if (!ok) return false; logActivity('request', title); toast('Request submitted. The brand team will see it in the Admin Console.');
    } }] });
}
function canManageRequests() { return can('approve') || can('content'); }
function requestsPanel(opts = {}) {
  const list = sortBy(S.requests || [], q => (q.status === 'done' ? '1' : '0') + (q.at || ''), 1).sort((a, b) => (a.status === 'done') - (b.status === 'done') || (b.at || '').localeCompare(a.at || '')).slice(0, opts.limit || 50);
  resolveProfiles(list.map(q => q.by));
  const open = (S.requests || []).filter(q => q.status !== 'done').length;
  return `<section class="card" style="overflow:hidden">
    <div class="card-pad section-head" style="border-bottom:1px solid var(--line)"><div><h2>Asset requests</h2><p>${open} open. ${canManageRequests() ? 'Update the status as you work on each one.' : 'You can see the status of every request here.'}</p></div>${S.cap.db && S.canWriteShared !== false && S.role !== 'Viewer' ? `<button class="btn primary" data-req-new>${icon('message')}Submit a request</button>` : ''}</div>
    ${list.length ? list.map(q => { const a = q.assetId && S.assets.find(x => x.id === q.assetId); return `<div class="list-row" style="align-items:flex-start">
      <img src="${esc(personAvatar(q.by))}" alt="" style="width:32px;height:32px;border-radius:50%">
      <div class="grow"><b>${esc(q.title)}</b> <span class="tag">${esc(q.type || '')}</span>${q.due ? ` <span class="tag">Needed by ${esc(fmtDate(q.due))}</span>` : ''}
        ${q.details ? `<p class="small" style="margin-top:4px;white-space:pre-wrap">${esc(q.details)}</p>` : ''}
        <div class="small muted" style="margin-top:4px">${esc(personName(q.by))} · ${esc(relTime(q.at))}${a ? ` · Related: <a href="#library" data-asset-link="${esc(a.id)}">${esc(a.name)}</a>` : ''}</div></div>
      ${canManageRequests() ? `<select class="select" data-req-status="${esc(q.id)}" aria-label="Status" style="width:auto">${selectOpts(REQ_STATUS, q.status || 'open')}</select><button class="btn sm icon ghost danger" data-req-del="${esc(q.id)}" aria-label="Delete request">${icon('trash')}</button>`
        : `<span class="pill ${q.status === 'done' ? 'st-approved' : q.status === 'progress' ? 'st-draft' : 'st-pending'}">${esc((REQ_STATUS.find(x => x.value === q.status) || REQ_STATUS[0]).label)}</span>`}</div>`; }).join('')
      : `<p class="muted small card-pad">No requests yet.</p>`}
  </section>`;
}
function bindRequests(root) {
  $$('[data-req-new]', root).forEach(b => b.addEventListener('click', () => openRequestModal()));
  $$('[data-req-status]', root).forEach(sel => sel.addEventListener('change', async () => { const q = (S.requests || []).find(x => x.id === sel.dataset.reqStatus); if (q && await dbUpdate('requests/' + q.id, { status: sel.value, updatedAt: nowIso(), handledBy: S.me.id })) { logActivity('edit', 'request “' + q.title + '” → ' + (REQ_STATUS.find(x => x.value === sel.value) || {}).label); toast('Request updated'); } }));
  $$('[data-req-del]', root).forEach(b => b.addEventListener('click', async () => { const q = (S.requests || []).find(x => x.id === b.dataset.reqDel); if (q && await confirmDialog('Delete this request?', `“${q.title}” will be removed for everyone.`, { label: 'Delete', danger: true }) && await dbDelete('requests/' + q.id)) toast('Request deleted'); }));
  $$('[data-asset-link]', root).forEach(a => a.addEventListener('click', e => { e.preventDefault(); openDrawer('asset', a.dataset.assetLink); }));
}
