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
const sessionKey = 'filippo.cloze.session';
const pendingKey = 'filippo.cloze.pending';
let sessionId = localStorage.getItem(sessionKey);
let pending: any = null;
try { pending = JSON.parse(localStorage.getItem(pendingKey) || 'null'); } catch { localStorage.removeItem(pendingKey); }
let busy = false;
let timer: number | undefined;
let current: any = null;

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
function render(data: any) {
  if (timer) { clearTimeout(timer); timer = undefined; }
  startPanel.hidden = true; sessionPanel.hidden = false;
  progress.textContent = `${Math.min(data.completedCount, data.requestedCount)} z ${data.requestedCount} znaczeń`;
  showFailures(data.failures || {});
  card.hidden = true;
  current = data.current;
  if (data.status === 'queued' || data.status === 'running') {
    generation.textContent = 'Przygotowywanie brakujących ćwiczeń. Możesz wrócić na tę stronę później.';
    timer = window.setTimeout(load, 2500);
    return;
  }
  if (data.status === 'failed') {
    generation.textContent = 'Generowanie zostało przerwane. Rozpocznij nową sesję.';
    return;
  }
  generation.textContent = '';
  if (data.finished || !current) { setStatus('Sesja zakończona.'); return; }
  progress.textContent = `${current.position + 1} z ${data.requestedCount} znaczeń`;
  polish.textContent = current.exercise.sentence_pl;
  prompt.replaceChildren();
  for (const part of current.exercise.prompt) {
    if (typeof part.text === 'string') { const span = document.createElement('span'); span.textContent = part.text; prompt.append(span); }
    else {
      const input = document.createElement('input'); input.className = 'cloze-gap'; input.type = 'text'; input.required = true;
      input.autocomplete = 'off'; input.spellcheck = false; input.dataset.gap = part.gap_id;
      input.setAttribute('aria-label', `Luka ${part.gap_id}`); prompt.append(input);
    }
  }
  card.hidden = false;
  prompt.querySelector('input')?.focus();
  setStatus('Wpisz osobno każde brakujące słowo.');
  setBusy(false);
}
async function load() {
  if (!sessionId || busy) return;
  try { const data = await request(`/api/cloze/sessions/${encodeURIComponent(sessionId)}`); setError(''); render(data); }
  catch (cause: any) { setError(cause.message); }
}
async function sendPending() {
  if (!pending || busy || !sessionId) return;
  try {
    setBusy(true);
    setStatus('Zapisywanie odpowiedzi…');
    const data = await request(`/api/cloze/sessions/${encodeURIComponent(sessionId)}/answers`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(pending) });
    pending = null; localStorage.removeItem(pendingKey); setError('');
    render(data);
    setStatus(data.accepted.correct ? 'Poprawnie. Ocena Easy zapisana.' : 'Błędna odpowiedź. Ocena Again zapisana.');
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
  event.preventDefault(); if (!current || busy || pending) return;
  const responses: Record<string, string> = {};
  for (const input of prompt.querySelectorAll<HTMLInputElement>('input[data-gap]')) responses[input.dataset.gap!] = input.value;
  pending = { eventId: crypto.randomUUID(), position: current.position, responses };
  localStorage.setItem(pendingKey, JSON.stringify(pending));
  void sendPending();
});
retry.addEventListener('click', () => { void sendPending(); });
newButton.addEventListener('click', () => {
  if (busy || pending) return;
  sessionId = null; localStorage.removeItem(sessionKey);
  if (timer) clearTimeout(timer);
  sessionPanel.hidden = true; startPanel.hidden = false; setError(''); setStatus('');
});
if (sessionId) { startPanel.hidden = true; sessionPanel.hidden = false; void load().then(() => { if (pending) void sendPending(); }); }
})();
