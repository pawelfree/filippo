(() => {
const startPanel = document.getElementById('cloze-start')!;
const sessionPanel = document.getElementById('cloze-session')!;
const startForm = document.getElementById('cloze-start-form') as HTMLFormElement;
const count = document.getElementById('cloze-count') as HTMLInputElement;
const answerForm = document.getElementById('cloze-answer-form') as HTMLFormElement;
const submit = document.getElementById('cloze-submit') as HTMLButtonElement;
const card = document.getElementById('cloze-card')!;
const polish = document.getElementById('cloze-polish')!;
const prompt = document.getElementById('cloze-prompt')!;
const progress = document.getElementById('cloze-progress')!;
const generation = document.getElementById('cloze-generation')!;
const failures = document.getElementById('cloze-failures')!;
const status = document.getElementById('cloze-status')!;
const error = document.getElementById('cloze-error')!;
const newButton = document.getElementById('cloze-new') as HTMLButtonElement;
const retry = document.getElementById('cloze-retry') as HTMLButtonElement;
const feedbackPanel = document.getElementById('cloze-feedback')!;
const solution = document.getElementById('cloze-solution')!;
const rating = document.getElementById('cloze-rating')!;
const nextButton = document.getElementById('cloze-next') as HTMLButtonElement;
const jobTabs = document.getElementById('cloze-job-tabs')!;
const jobs = document.getElementById('cloze-jobs')!;
const historyRefresh = document.getElementById('cloze-history-refresh') as HTMLButtonElement;
const sessionKey = 'filippo.cloze.session';
const pendingKey = 'filippo.cloze.pending';
const feedbackKey = 'filippo.cloze.feedback';
let sessionId = localStorage.getItem(sessionKey);
let pending: any = null;
try { pending = JSON.parse(localStorage.getItem(pendingKey) || 'null'); } catch { localStorage.removeItem(pendingKey); }
let feedback: any = null;
try { feedback = JSON.parse(localStorage.getItem(feedbackKey) || 'null'); } catch { localStorage.removeItem(feedbackKey); }
let busy = false;
let timer: number | undefined;
let current: any = null;
let allSessions: any[] = [];
let selectedHistoryStatus = 'all';
let historyBusy = false;
let historyRefreshRequested = false;

function setError(message: string) { error.textContent = message; error.hidden = !message; }
function setStatus(message: string) { status.textContent = message; }
function setBusy(value: boolean) { busy = value; submit.disabled = value || !!pending; retry.hidden = !pending; retry.disabled = value; newButton.disabled = value || !!pending; }
async function request(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) {
    const failure: any = new Error(typeof data.message === 'string' ? data.message : `Błąd ${response.status}`);
    failure.status = response.status;
    throw failure;
  }
  return data;
}
function showFailures(items: Record<string, string>) {
  failures.replaceChildren();
  const entries = Object.entries(items);
  failures.hidden = !entries.length;
  if (!entries.length) return;
  const heading = document.createElement('strong'); heading.textContent = 'Nie udało się przygotować części ćwiczeń:';
  const list = document.createElement('ul');
  for (const [key, reason] of entries) {
    const item = document.createElement('li'); item.textContent = `${key}: ${reason}`; list.append(item);
  }
  failures.append(heading, list);
}
function generationProgress(data: any) {
  return data.generation?.processed == null ? 'Brak zapisanego postępu' : `${data.generation.processed} z ${data.generation.total ?? data.requestedCount} zestawów`;
}
function renderExercise(exercise: any) {
  polish.textContent = exercise.sentence_pl;
  prompt.replaceChildren();
  for (const part of exercise.prompt) {
    if (typeof part.text === 'string') { const span = document.createElement('span'); span.textContent = part.text; prompt.append(span); }
    else {
      const input = document.createElement('input'); input.className = 'cloze-gap'; input.type = 'text'; input.required = true;
      input.autocomplete = 'off'; input.spellcheck = false; input.dataset.gap = part.gap_id;
      input.setAttribute('aria-label', `Luka ${part.gap_id}`); prompt.append(input);
    }
  }
  card.hidden = false;
}
function renderHistory() {
  jobTabs.replaceChildren(); jobs.replaceChildren();
  const statuses = ['all', 'running', 'queued', 'ready', 'failed'];
  const labels: Record<string, string> = { all: 'Wszystkie', running: 'Generowanie', queued: 'W kolejce', ready: 'Gotowe', failed: 'Przerwane' };
  for (const state of statuses) {
    const button = document.createElement('button'); button.type = 'button';
    const amount = state === 'all' ? allSessions.length : allSessions.filter((item) => item.status === state).length;
    button.textContent = `${labels[state]} (${amount})`;
    button.setAttribute('role', 'tab'); button.setAttribute('aria-selected', String(state === selectedHistoryStatus));
    button.addEventListener('click', () => { selectedHistoryStatus = state; renderHistory(); });
    jobTabs.append(button);
  }
  const table = document.createElement('table'); table.className = 'job-table';
  table.innerHTML = '<thead><tr><th>Utworzono</th><th>Stan</th><th>Postęp</th><th>Informacja</th></tr></thead>';
  const body = document.createElement('tbody');
  const visible = allSessions.filter((item) => selectedHistoryStatus === 'all' || item.status === selectedHistoryStatus);
  for (const item of visible) {
    const row = document.createElement('tr');
    const created = document.createElement('td'); created.textContent = new Date(item.createdAt).toLocaleString('pl-PL');
    const state = document.createElement('td'); state.textContent = labels[item.status] || item.status;
    const progressCell = document.createElement('td'); progressCell.textContent = generationProgress(item);
    const note = document.createElement('td'); note.className = 'cloze-job-note';
    const reasons = Object.values(item.failures || {}) as string[];
    note.textContent = reasons.length ? `${reasons.length} brakujących ćwiczeń. ${reasons[0]}` : item.status === 'failed' ? 'Generowanie zostało przerwane.' : '';
    row.append(created, state, progressCell, note); body.append(row);
  }
  if (!visible.length) { const row = document.createElement('tr'); const cell = document.createElement('td'); cell.colSpan = 4; cell.textContent = 'Brak zleceń w tym stanie.'; row.append(cell); body.append(row); }
  table.append(body); jobs.append(table);
}
async function loadHistory(manual = false) {
  if (historyBusy) {
    if (manual) { historyRefreshRequested = true; historyRefresh.disabled = true; historyRefresh.textContent = 'Odświeżanie…'; }
    return;
  }
  historyBusy = true;
  if (manual) { historyRefresh.disabled = true; historyRefresh.textContent = 'Odświeżanie…'; }
  try { allSessions = await request('/api/cloze/sessions'); renderHistory(); }
  catch (cause: any) {
    jobs.textContent = `Nie udało się odczytać stanu generowania: ${cause.message}`;
  }
  finally {
    historyBusy = false;
    if (manual) { historyRefresh.disabled = false; historyRefresh.textContent = 'Odśwież stan'; }
    if (historyRefreshRequested) { historyRefreshRequested = false; void loadHistory(true); }
  }
}
function render(data: any) {
  if (timer) { clearTimeout(timer); timer = undefined; }
  startPanel.hidden = true; sessionPanel.hidden = false;
  progress.textContent = `${Math.min(data.completedCount, data.requestedCount)} z ${data.requestedCount} znaczeń`;
  showFailures(data.failures || {});
  card.hidden = true;
  feedbackPanel.hidden = true; submit.hidden = false;
  current = data.current;
  void loadHistory();
  if (data.status === 'queued' || data.status === 'running') {
    const state = data.status === 'queued' ? 'W kolejce.' : 'Trwa generowanie.';
    generation.textContent = `${state} Przetworzono: ${generationProgress(data)}. Możesz wrócić na tę stronę później.`;
    timer = window.setTimeout(load, 2500);
    return;
  }
  if (data.status === 'failed') {
    generation.textContent = 'Generowanie zostało przerwane. Rozpocznij nową sesję.';
    return;
  }
  generation.textContent = `Generowanie zakończone. Przetworzono: ${generationProgress(data)}.`;
  if (feedback?.sessionId === sessionId && feedback.accepted?.exercise) {
    progress.textContent = `${feedback.position + 1} z ${data.requestedCount} znaczeń`;
    renderExercise(feedback.accepted.exercise);
    for (const input of prompt.querySelectorAll<HTMLInputElement>('input')) {
      input.value = feedback.responses?.[input.dataset.gap!] ?? '';
      input.disabled = true;
    }
    submit.hidden = true;
    solution.textContent = feedback.accepted.sentence;
    rating.textContent = `Ocena: ${feedback.accepted.correct ? 'Easy — poprawnie' : 'Again — błędnie'}`;
    nextButton.textContent = data.finished ? 'Zakończ sesję' : 'Następne ćwiczenie';
    feedbackPanel.hidden = false;
    setStatus('Ocena zapisana. Sprawdź prawidłowe zdanie.');
    return;
  }
  if (data.finished || !current) { setStatus('Sesja zakończona.'); return; }
  progress.textContent = `${current.position + 1} z ${data.requestedCount} znaczeń`;
  renderExercise(current.exercise);
  prompt.querySelector('input')?.focus();
  setStatus('Wpisz osobno każde brakujące słowo.');
  setBusy(false);
}
async function load() {
  if (!sessionId || busy) return;
  try { const data = await request(`/api/cloze/sessions/${encodeURIComponent(sessionId)}`); setError(''); render(data); }
  catch (cause: any) {
    if (cause.status === 404) {
      sessionId = null; pending = null; feedback = null;
      localStorage.removeItem(sessionKey); localStorage.removeItem(pendingKey); localStorage.removeItem(feedbackKey);
      if (timer) clearTimeout(timer);
      sessionPanel.hidden = true; startPanel.hidden = false;
      setError(''); setStatus('Poprzednia sesja nie jest już dostępna. Rozpocznij nową.');
    } else setError(cause.message);
  }
}
async function sendPending() {
  if (!pending || busy || !sessionId) return;
  try {
    setBusy(true);
    setStatus('Zapisywanie odpowiedzi…');
    const data = await request(`/api/cloze/sessions/${encodeURIComponent(sessionId)}/answers`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(pending) });
    const answered = pending;
    pending = null; localStorage.removeItem(pendingKey); setError('');
    feedback = { sessionId, eventId: answered.eventId, position: answered.position, responses: answered.responses, accepted: data.accepted };
    localStorage.setItem(feedbackKey, JSON.stringify(feedback));
    render(data);
  } catch (cause: any) {
    if (cause.status === 409 || cause.status === 400 || cause.status === 404) {
      pending = null; localStorage.removeItem(pendingKey);
      setError(cause.message);
      setBusy(false);
      await load();
    } else setError(`${cause.message} Odpowiedź pozostaje do ponowienia.`);
  }
  finally { setBusy(false); }
}
startForm.addEventListener('submit', async (event) => {
  event.preventDefault(); if (busy) return;
  try {
    setBusy(true); setError(''); setStatus('Tworzenie sesji…');
    const data = await request('/api/cloze/sessions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ count: Number(count.value) }) });
    sessionId = data.id; localStorage.setItem(sessionKey, sessionId!); render(data);
  } catch (cause: any) { setError(cause.message); }
  finally { setBusy(false); }
});
answerForm.addEventListener('submit', (event) => {
  event.preventDefault(); if (!current || busy || pending || feedback) return;
  const responses: Record<string, string> = {};
  for (const input of prompt.querySelectorAll<HTMLInputElement>('input[data-gap]')) responses[input.dataset.gap!] = input.value;
  pending = { eventId: crypto.randomUUID(), position: current.position, responses };
  localStorage.setItem(pendingKey, JSON.stringify(pending));
  void sendPending();
});
retry.addEventListener('click', () => { void sendPending(); });
nextButton.addEventListener('click', async () => {
  if (!sessionId || busy || !feedback) return;
  try {
    nextButton.disabled = true;
    const data = await request(`/api/cloze/sessions/${encodeURIComponent(sessionId)}`);
    feedback = null; localStorage.removeItem(feedbackKey);
    render(data); setError('');
  } catch (cause: any) { setError(cause.message); }
  finally { nextButton.disabled = false; }
});
newButton.addEventListener('click', () => {
  if (busy || pending) return;
  sessionId = null; feedback = null; localStorage.removeItem(sessionKey); localStorage.removeItem(feedbackKey);
  if (timer) clearTimeout(timer);
  sessionPanel.hidden = true; startPanel.hidden = false; setError(''); setStatus('');
  void loadHistory();
});
historyRefresh.addEventListener('click', () => { void loadHistory(true); });
if (sessionId) { startPanel.hidden = true; sessionPanel.hidden = false; void load().then(() => { if (pending) void sendPending(); }); }
void loadHistory();
})();
