(() => {
const ui = {
  items: document.getElementById('items')!,
  add: document.getElementById('add-item') as HTMLButtonElement,
  check: document.getElementById('check-items') as HTMLButtonElement,
  existingSection: document.getElementById('existing-section')!,
  existing: document.getElementById('existing-list')!,
  generate: document.getElementById('generate-senses') as HTMLButtonElement,
  saveResult: document.getElementById('save-result')!,
  status: document.getElementById('status')!,
  error: document.getElementById('error')!,
};
let checkId: string | null = null;
let checkedItems: string[] = [];
let busy = false;
let revision = 0;

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', label?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (label !== undefined) node.textContent = label;
  return node;
}
function setStatus(message: string) { ui.status.textContent = message; }
function setError(message: string) { ui.error.textContent = message; ui.error.hidden = !message; }
function updateButtons() {
  ui.check.disabled = busy;
  ui.add.disabled = busy;
  ui.generate.disabled = busy || !checkId;
  ui.items.querySelectorAll<HTMLButtonElement>('.remove-item').forEach((button) => { button.disabled = busy; });
}
function invalidate() {
  revision += 1;
  checkId = null;
  checkedItems = [];
  ui.existingSection.hidden = true;
  ui.saveResult.replaceChildren();
  setStatus('Lista zmieniona. Sprawdź bazę ponownie.');
  updateButtons();
}
function addItem(value = ''): HTMLInputElement {
  const row = element('div', 'input-row');
  const input = element('input');
  input.type = 'text';
  input.autocomplete = 'off';
  input.placeholder = 'np. prendere una decisione';
  input.value = value;
  input.setAttribute('aria-label', 'Włoskie słowo lub wyrażenie');
  input.setAttribute('data-item-input', '');
  input.addEventListener('input', invalidate);
  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || !input.value.trim()) return;
    event.preventDefault();
    addItem().focus();
  });
  const remove = element('button', 'secondary remove-item', '🗑');
  remove.type = 'button';
  remove.setAttribute('aria-label', 'Usuń pozycję');
  remove.title = 'Usuń pozycję';
  remove.addEventListener('click', () => { row.remove(); invalidate(); if (!ui.items.children.length) addItem(); });
  row.append(input, remove);
  ui.items.append(row);
  invalidate();
  return input;
}
function items(): string[] {
  const values = [...ui.items.querySelectorAll<HTMLInputElement>('[data-item-input]')].map((input) => input.value.trim().replace(/\s+/g, ' ')).filter(Boolean);
  if (!values.length) throw new Error('Wpisz co najmniej jedno włoskie słowo lub wyrażenie.');
  if (new Set(values.map((value) => value.toLocaleLowerCase('it'))).size !== values.length) throw new Error('Usuń powtórzone pozycje z listy.');
  return values;
}
async function post(path: string, body: unknown): Promise<any> {
  const response = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(' ') : data.message || `Błąd ${response.status}`);
  return data;
}
function busyState(value: boolean, message: string) { busy = value; setStatus(message); updateButtons(); }
function renderExisting(result: any) {
  ui.existing.replaceChildren();
  const existingItems = result.items.filter((item: any) => item.existing.length);
  const heading = ui.existingSection.querySelector<HTMLElement>('.section-heading');
  const title = ui.existingSection.querySelector<HTMLElement>('#existing-heading');
  if (heading) heading.hidden = false;
  if (title) title.textContent = existingItems.length ? 'Istniejące znaczenia' : 'Brak istniejących znaczeń w bazie';
  ui.existing.hidden = existingItems.length === 0;
  for (const item of existingItems) {
    const card = element('article', 'existing-card');
    card.append(element('h3', '', item.input));
    card.append(element('p', 'badge existing-badge', `Już w bazie: ${item.existing.length}`));
    for (const sense of item.existing) card.append(element('p', '', `${sense.part_of_speech || '—'} · ${sense.definition_it}${sense.definition_pl ? ` · ${sense.definition_pl}` : ''}`));
    card.append(element('p', 'hint', 'Możesz usunąć tę pozycję z listy lub zachować ją, aby znaleźć inne znaczenie.'));
    ui.existing.append(card);
  }
  ui.existingSection.hidden = false;
}

ui.add.addEventListener('click', () => addItem().focus());
ui.check.addEventListener('click', async () => {
  if (busy) return;
  try {
    const values = items();
    const startedAt = revision;
    setError('');
    busyState(true, 'Sprawdzanie bazy…');
    const result = await post('/api/lexical-senses/check', { items: values });
    if (revision !== startedAt) { setStatus('Lista zmieniła się podczas sprawdzania. Sprawdź ją ponownie.'); return; }
    checkId = result.checkId;
    checkedItems = values;
    renderExisting(result);
    setStatus('Lista sprawdzona. Możesz uruchomić generowanie.');
  } catch (error) { setError((error as Error).message); setStatus('Nie udało się sprawdzić listy.'); }
  finally { busy = false; updateButtons(); }
});
ui.generate.addEventListener('click', async () => {
  if (busy || !checkId) return;
  const previousItems = checkedItems;
  const previousCheckId = checkId;
  try {
    setError('');
    ui.items.replaceChildren();
    busyState(true, 'Zlecanie generowania…');
    await post('/api/lexical-senses/generation-jobs', { checkId: previousCheckId, items: previousItems });
    checkId = null;
    checkedItems = [];
    ui.existingSection.hidden = true;
    addItem();
    const link = document.createElement('a');
    link.href = '/generation-proposals.html';
    link.textContent = 'Przejdź do propozycji do przetworzenia';
    ui.saveResult.replaceChildren(link);
    setStatus('Zadanie zlecone. Możesz dodać kolejną partię albo sprawdzić propozycje później.');
  } catch (error) {
    for (const item of previousItems) addItem(item);
    setError((error as Error).message);
    setStatus('Nie udało się zlecić generowania. Sprawdź listę i spróbuj ponownie.');
  } finally { busy = false; updateButtons(); }
});
addItem();
})();
