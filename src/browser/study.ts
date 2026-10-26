(() => {
const overview = document.getElementById('overview')!;
const session = document.getElementById('session')!;
const status = document.getElementById('status')!;
const error = document.getElementById('error')!;
const start = document.getElementById('start') as HTMLButtonElement;
const pause = document.getElementById('pause') as HTMLButtonElement;
const retry = document.getElementById('retry') as HTMLButtonElement;
const retrySession = document.getElementById('retry-session') as HTMLButtonElement;
const note = document.getElementById('overview-note')!;
const sense = document.getElementById('study-sense')!;
const ratings = [...document.querySelectorAll<HTMLButtonElement>('[data-rating]')];
const storageKey = 'filippo.study.pendingAttempt';
const startedKey = 'filippo.study.started';
let sessionActive = false;
let busy = false;
let candidate: any = null;
let pending: any = readPending();
let hasStarted = localStorage.getItem(startedKey) === 'true';
let automaticRetryUsed = false;

function readPending() {
  try { const value = localStorage.getItem(storageKey); return value ? JSON.parse(value) : null; }
  catch { localStorage.removeItem(storageKey); return null; }
}
function setError(message: string) { error.textContent = message; error.hidden = !message; }
function setStatus(message: string) { status.textContent = message; }
function setBusy(value: boolean) {
  busy = value;
  ratings.forEach((button) => { button.disabled = value || !!pending || !candidate; });
  start.disabled = value || !!pending || start.dataset.available !== 'true';
  retry.hidden = !pending;
  retrySession.hidden = !pending;
  retry.disabled = value;
  retrySession.disabled = value;
}
async function request(path: string, options?: RequestInit) {
  const response = await fetch(path, options);
  const data = await response.json();
  if (!response.ok) {
    const failure: any = new Error(typeof data.message === 'string' ? data.message : `Błąd ${response.status}`);
    failure.status = response.status;
    failure.current = data.current;
    throw failure;
  }
  return data;
}
function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function section(title: string, content: HTMLElement) {
  const box = el('section');
  box.append(el('h4', '', title), content);
  sense.append(box);
}
function lines(values: unknown, format = (value: any) => String(value)) {
  const list = el('ul');
  for (const value of Array.isArray(values) ? values : []) list.append(el('li', '', format(value)));
  return list;
}
function renderSense(item: any) {
  sense.replaceChildren();
  if (!item) return;
  const record = item.sense;
  const details = record.details || {};
  sense.append(el('h3', '', record.lexical_item_it));
  sense.append(el('p', 'study-meta', `${details.part_of_speech || 'Znaczenie'} · ${item.kind === 'due' ? 'Powtórka' : item.kind === 'reinforcement' ? 'Utrwalenie' : 'Nowe'}${details.language ? ` · ${details.language}` : ''}${details.schema_version ? ` · zapis ${details.schema_version}` : ''}`));
  section('Wyjaśnienie po włosku', el('p', '', record.definition_it));
  if (details.definition_pl) section('Wyjaśnienie po polsku', el('p', '', details.definition_pl));
  if (details.glosses_pl?.length) section('Polskie odpowiedniki', lines(details.glosses_pl));
  if (details.usage) {
    const usage = details.usage;
    const box = el('div');
    if (usage.register) box.append(el('p', '', `Rejestr: ${usage.register}`));
    for (const [label, key] of [['Schematy', 'patterns_it'], ['Kolokacje', 'collocations_it'], ['Ograniczenia użycia', 'constraints_pl']]) {
      if (usage[key]?.length) box.append(el('p', '', `${label}:`), lines(usage[key]));
    }
    section('Użycie', box);
  }
  if (details.examples?.length) section('Przykłady', lines(details.examples, (example: any) => `${example.sentence_it} — ${example.translation_pl} (${example.origin === 'attested' ? 'poświadczony' : 'opracowany'}${example.evidence_id ? `, źródło ${example.evidence_id}` : ''})`));
  if (details.evidence && Object.keys(details.evidence).length) {
    const list = el('ul');
    for (const [id, source] of Object.entries<any>(details.evidence)) list.append(el('li', '', `${id}: ${source.source_type} · ${source.locator} · ${Array.isArray(source.supports) ? source.supports.join(', ') : ''}`));
    section('Źródła', list);
  }
}
function renderCounts(data: any) {
  document.getElementById('overview-due')!.textContent = String(data.dueCount);
  document.getElementById('overview-new')!.textContent = String(data.newCount);
  document.getElementById('session-due')!.textContent = String(data.dueCount);
  document.getElementById('session-reinforcement')!.textContent = String(data.reinforcementCount);
  document.getElementById('session-new')!.textContent = String(data.newCount);
  const available = data.dueCount + data.reinforcementCount + data.newCount > 0;
  start.dataset.available = String(available);
  start.textContent = hasStarted || data.reinforcementCount > 0 ? 'Kontynuuj' : 'Rozpocznij';
  note.textContent = available ? '' : data.nextDueAt ? `Na teraz wszystko gotowe. Następna powtórka: ${new Date(data.nextDueAt).toLocaleString('pl-PL')}.` : 'Na teraz wszystko gotowe.';
  setBusy(busy);
}
function renderNext(data: any) {
  renderCounts(data);
  candidate = data.candidate;
  renderSense(candidate);
  ratings.forEach((button) => { button.disabled = busy || !!pending || !candidate; });
  if (!candidate) setStatus(data.nextDueAt ? `Na teraz wszystko gotowe. Następna powtórka: ${new Date(data.nextDueAt).toLocaleString('pl-PL')}.` : 'Na teraz wszystko gotowe.');
  else setStatus('Oceń, jak dobrze pamiętasz to znaczenie.');
}
async function loadOverview() {
  try {
    setBusy(true);
    const data = await request('/api/study/overview');
    renderCounts(data);
    if (!pending) setStatus(`Wybierz „${start.textContent}”, aby przejść do znaczeń.`);
  } catch (cause: any) { setError(cause.message); }
  finally { setBusy(false); }
}
async function loadNext() {
  if (busy || pending) return;
  try {
    setBusy(true);
    const data = await request('/api/study/next');
    renderNext(data);
    setError('');
  } catch (cause: any) { setError(cause.message); }
  finally { setBusy(false); }
}
async function submitPending() {
  if (!pending || busy) return;
  const submitted = pending;
  try {
    setBusy(true);
    setStatus('Zapisywanie oceny…');
    const data = await request('/api/study/attempts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(submitted) });
    pending = null;
    localStorage.removeItem(storageKey);
    automaticRetryUsed = false;
    setError('');
    if (sessionActive) renderNext(data); else await loadOverviewAfterSave();
  } catch (cause: any) {
    if (cause.status === 409 || cause.status === 404 || cause.status === 400) {
      pending = null;
      localStorage.removeItem(storageKey);
      automaticRetryUsed = false;
      setError(cause.message);
      if (sessionActive && cause.current) renderNext(cause.current);
      else if (sessionActive) { candidate = null; await loadNextAfterConflict(); }
      else await loadOverviewAfterSave();
    } else {
      setError(`${cause.message} Ocena pozostaje do ponowienia; użyj „Ponów zapis oceny” albo odśwież stronę.`);
      setStatus('Nie udało się potwierdzić zapisu oceny.');
      if (!automaticRetryUsed) {
        automaticRetryUsed = true;
        window.setTimeout(() => { if (pending && !busy) submitPending(); }, 3000);
      }
    }
  } finally { setBusy(false); }
}
async function loadOverviewAfterSave() { try { renderCounts(await request('/api/study/overview')); setStatus('Ocena zapisana.'); } catch (cause: any) { setError(cause.message); } }
async function loadNextAfterConflict() { try { renderNext(await request('/api/study/next')); } catch (cause: any) { setError(cause.message); } }

start.addEventListener('click', async () => {
  if (busy || pending) return;
  hasStarted = true;
  localStorage.setItem(startedKey, 'true');
  sessionActive = true;
  overview.hidden = true;
  session.hidden = false;
  await loadNext();
});
pause.addEventListener('click', async () => {
  sessionActive = false;
  session.hidden = true;
  overview.hidden = false;
  await loadOverview();
});
for (const button of ratings) button.addEventListener('click', () => {
  if (busy || pending || !candidate) return;
  pending = { eventId: crypto.randomUUID(), lexicalSenseId: candidate.lexicalSenseId, presentationToken: candidate.presentationToken, rating: Number(button.dataset.rating) };
  automaticRetryUsed = false;
  localStorage.setItem(storageKey, JSON.stringify(pending));
  submitPending();
});
retry.addEventListener('click', submitPending);
retrySession.addEventListener('click', submitPending);
window.addEventListener('online', () => { if (pending) submitPending(); else if (sessionActive) loadNext(); });
setInterval(() => { if (!busy && !pending) { if (sessionActive) loadNext(); else loadOverview(); } }, 15000);
if (pending) submitPending(); else loadOverview();
})();
