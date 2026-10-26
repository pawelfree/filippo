(() => {
const jobs = document.getElementById('jobs')!, tabs = document.getElementById('job-tabs')!, pagination = document.getElementById('job-pagination')!, proposals = document.getElementById('proposals')!, status = document.getElementById('status')!, error = document.getElementById('error')!;
const statuses = ['running', 'queued', 'ready', 'failed'];
let allJobs: any[] = [], selectedStatus = 'running', page = 1;
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, text = ''): HTMLElementTagNameMap[K] => { const node = document.createElement(tag); node.textContent = text; return node; };
const request = async (path: string, options?: RequestInit) => { const response = await fetch(path, options); const data = response.status === 204 ? null : await response.json(); if (!response.ok) throw new Error(data?.message || 'Błąd serwera.'); return data; };
const renderJobsTable = () => {
  tabs.replaceChildren(); jobs.replaceChildren(); pagination.replaceChildren();
  for (const state of statuses) { const button = el('button', `${state} (${allJobs.filter((job) => job.status === state).length})`); button.type = 'button'; button.setAttribute('role', 'tab'); button.setAttribute('aria-selected', String(state === selectedStatus)); button.addEventListener('click', () => { selectedStatus = state; page = 1; renderJobsTable(); }); tabs.append(button); }
  if (allJobs.some((job) => job.status === 'running')) { const refresh = el('button', 'Odśwież'); refresh.type = 'button'; refresh.addEventListener('click', () => { void load(); }); tabs.append(refresh); }
  const filtered = allJobs.filter((job) => job.status === selectedStatus), offset = (page - 1) * 10, visible = filtered.slice(offset, offset + 10);
  const table = document.createElement('table'); table.className = 'job-table'; table.innerHTML = '<thead><tr><th>Wejścia</th><th>Utworzono</th><th>Informacja</th><th></th></tr></thead>';
  const body = document.createElement('tbody');
  for (const job of visible) { const row = document.createElement('tr'); const items = el('td', job.items.join(', ')); const created = el('td', new Date(job.createdAt).toLocaleString('pl-PL')); const info = el('td', job.errorMessage || ''); const action = document.createElement('td'); if (job.status === 'failed') { const retry = el('button', 'Ponów'); retry.addEventListener('click', async () => { await request('/api/lexical-senses/generation-jobs/' + job.id + '/retry', { method: 'POST' }); await load(); }); action.append(retry); } row.append(items, created, info, action); body.append(row); }
  if (!visible.length) { const row = document.createElement('tr'); const cell = el('td', 'Brak zadań w tym statusie.'); cell.colSpan = 4; row.append(cell); body.append(row); } table.append(body); jobs.append(table);
  const pages = Math.ceil(filtered.length / 10); if (pages > 1) { const previous = el('button', 'Poprzednia'); previous.disabled = page === 1; previous.addEventListener('click', () => { page -= 1; renderJobsTable(); }); const next = el('button', 'Następna'); next.disabled = page === pages; next.addEventListener('click', () => { page += 1; renderJobsTable(); }); pagination.append(previous, el('span', `Strona ${page} z ${pages}`), next); }
};
const load = async () => { try {
  error.hidden = true; const [loadedJobs, all] = await Promise.all([request('/api/lexical-senses/generation-jobs'), request('/api/lexical-senses/generation-proposals')]);
  allJobs = loadedJobs; renderJobsTable(); proposals.replaceChildren();
  for (const p of all) {
    const card = el('article'); card.className = 'sense-card stored-card';
    const header = el('div'); header.className = 'stored-card-header';
    const actions = el('div'); actions.className = 'stored-icon-actions';
    header.append(el('h3', `${p.lexical_item_it} · ${p.part_of_speech}`), actions);
    card.append(header, el('p', p.definition_it));
    const definition = document.createElement('textarea'); definition.value = p.definition_pl; definition.rows = 2; card.append(definition);
    const warnings = (p.validationWarnings || []).flatMap((entry: any) => entry.warnings || []);
    if (!p.examples?.length) warnings.push('Brak przykładu użycia.');
    if (warnings.length) { const box = el('div'); box.className = 'deferred'; box.append(el('strong', 'Braki w propozycji:')); const list = document.createElement('ul'); for (const warning of warnings) list.append(el('li', warning)); box.append(list); card.append(box); }
    const result = el('div'); result.setAttribute('role', 'alert'); let saving = false;
    const submit = async (confirmed: boolean) => {
      if (saving) return;
      saving = true; save.disabled = true; reject.disabled = true; result.className = ''; result.replaceChildren();
      try {
        const verdict = await request('/api/lexical-senses/generation-proposals/' + p.id + '/save', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ definition_pl: definition.value, confirmedDistinct: confirmed }) });
        if (verdict.status === 'saved') { await load(); status.textContent = 'Zapisano znaczenie.'; return; }
        if (verdict.status === 'conflict') { result.textContent = 'To znaczenie jest już zapisane w bazie.'; return; }
        result.append(el('p', 'Podobne znaczenie w bazie:'));
        for (const existing of verdict.existing || p.matches || []) result.append(el('p', `${existing.part_of_speech || '—'} · ${existing.definition_it}${existing.definition_pl ? ' · ' + existing.definition_pl : ''}`));
        const force = el('button', 'Zapisz mimo podobieństwa'); force.addEventListener('click', () => { void submit(true); });
        const leave = el('button', 'Pozostaw bez zmian'); leave.addEventListener('click', () => result.replaceChildren());
        result.append(force, leave);
      } catch (cause) { result.textContent = (cause as Error).message; result.className = 'error'; }
      finally { saving = false; save.disabled = false; reject.disabled = false; }
    };
    const save = el('button', '💾'); save.className = 'stored-icon-button'; save.setAttribute('aria-label', 'Zapisz znaczenie'); save.title = 'Zapisz znaczenie'; save.addEventListener('click', () => { void submit(false); });
    const reject = el('button', '🗑'); reject.className = 'secondary stored-icon-button'; reject.setAttribute('aria-label', 'Odrzuć propozycję'); reject.title = 'Odrzuć propozycję'; reject.addEventListener('click', async () => { try { reject.disabled = true; await request('/api/lexical-senses/generation-proposals/' + p.id + '/reject', { method: 'POST' }); await load(); status.textContent = 'Odrzucono propozycję.'; } catch (cause) { result.textContent = (cause as Error).message; result.className = 'error'; reject.disabled = false; } });
    actions.append(save, reject); card.append(result); proposals.append(card);
  }
  if (!all.length) proposals.append(el('p', 'Brak propozycji do przetworzenia.')); status.textContent = `Oczekujące propozycje: ${all.length}.`;
} catch (cause) { error.textContent = (cause as Error).message; error.hidden = false; } };
load();
})();
