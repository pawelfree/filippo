(() => {
const list = document.getElementById('stored-list');
const status = document.getElementById('status');
const error = document.getElementById('error');
const search = document.getElementById('stored-search') as HTMLInputElement;
let allItems = [];

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', label?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (label !== undefined) node.textContent = label;
  return node;
}
function setStatus(message) { status.textContent = message; }
function setError(message) { error.textContent = message; error.hidden = !message; }
async function request(path, options = {}) {
  const response = await fetch(path, options);
  const data = await response.json();
  if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(' ') : data.message || `Błąd ${response.status}`);
  return data;
}
function card(item) {
  const article = element('article', 'sense-card stored-card');
  article.dataset.id = item.id;
  const header = element('div', 'stored-card-header');
  header.append(element('h3', '', `${item.lexical_item_it} · ${item.part_of_speech || '—'}`));
  const iconActions = element('div', 'stored-icon-actions');
  header.append(iconActions);
  article.append(header);
  const remove = element('button', 'secondary stored-icon-button', '🗑');
  remove.type = 'button';
  remove.setAttribute('aria-label', 'Usuń wpis');
  remove.title = 'Usuń wpis';
  remove.addEventListener('click', () => removeItem(article, item.id));
  iconActions.append(remove);
  if (!item.editable) {
    article.append(element('p', 'deferred', 'Ten starszy wpis nie ma pełnych danych i nie może być edytowany na tej stronie.'));
    return article;
  }
  const italian = element('label', 'edit-label', 'Włoskie wyjaśnienie');
  const italianInput = element('textarea');
  italianInput.rows = 2;
  italianInput.value = item.definition_it;
  italianInput.setAttribute('data-definition-it', '');
  italian.append(italianInput);
  const polish = element('label', 'edit-label', 'Polskie wyjaśnienie');
  const polishInput = element('textarea');
  polishInput.rows = 2;
  polishInput.value = item.definition_pl;
  polishInput.setAttribute('data-definition-pl', '');
  polish.append(polishInput);
  const save = element('button', 'stored-icon-button', '💾');
  save.type = 'button';
  save.disabled = true;
  save.setAttribute('aria-label', 'Zapisz zmiany');
  save.title = 'Zapisz zmiany';
  iconActions.prepend(save);
  const updateSaveState = () => { save.disabled = italianInput.value === item.definition_it && polishInput.value === item.definition_pl; };
  italianInput.addEventListener('input', updateSaveState);
  polishInput.addEventListener('input', updateSaveState);
  save.addEventListener('click', async () => {
    try {
      save.disabled = true;
      setError('');
      const updated = await request(`/api/lexical-senses/${item.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ definition_it: italianInput.value, definition_pl: polishInput.value }) });
      italianInput.value = updated.definition_it;
      polishInput.value = updated.definition_pl;
      allItems = allItems.map((stored) => stored.id === updated.id ? { ...updated, editable: true } : stored);
      item.definition_it = updated.definition_it;
      item.definition_pl = updated.definition_pl;
      setStatus(`Zapisano zmiany dla „${updated.lexical_item_it}”.`);
    } catch (cause) { setError(cause.message); }
    finally { updateSaveState(); }
  });
  article.append(italian, polish);
  return article;
}
async function removeItem(article, id) {
  if (!window.confirm('Usunąć to znaczenie?')) return;
  try {
    setError('');
    await request(`/api/lexical-senses/${id}`, { method: 'DELETE' });
    allItems = allItems.filter((item) => item.id !== id);
    render();
    setStatus('Usunięto znaczenie.');
  } catch (cause) { setError(cause.message); }
}
async function load() {
  try {
    setStatus('Wczytywanie zapisanych znaczeń…');
    allItems = await request('/api/lexical-senses');
    render();
    setStatus(`Zapisane znaczenia: ${allItems.length}.`);
  } catch (cause) { setError(cause.message); setStatus('Nie udało się wczytać znaczeń.'); }
}
function render() {
  const query = search.value.trim().toLocaleLowerCase('it');
  const visible = query ? allItems.filter((item) => [item.lexical_item_it, item.definition_it, item.definition_pl].some((value) => String(value || '').toLocaleLowerCase('it').includes(query))) : allItems;
  list.replaceChildren();
  if (!visible.length) list.append(element('p', 'hint', query ? 'Brak znaczeń pasujących do filtra.' : 'Brak zapisanych znaczeń.'));
  else visible.forEach((item) => list.append(card(item)));
}
search.addEventListener('input', render);
load();
})();
