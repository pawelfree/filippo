(() => {
const list = document.getElementById('stored-list');
const status = document.getElementById('status');
const error = document.getElementById('error');

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
  article.append(element('h3', '', `${item.lexical_item_it} · ${item.part_of_speech || '—'}`));
  if (!item.editable) {
    article.append(element('p', 'deferred', 'Ten starszy wpis nie ma pełnych danych i nie może być edytowany na tej stronie.'));
    const remove = element('button', 'secondary', 'Usuń wpis');
    remove.type = 'button';
    remove.addEventListener('click', () => removeItem(article, item.id));
    article.append(remove);
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
  const actions = element('div', 'actions');
  const save = element('button', '', 'Zapisz zmiany');
  save.type = 'button';
  save.addEventListener('click', async () => {
    try {
      save.disabled = true;
      setError('');
      const updated = await request(`/api/lexical-senses/${item.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ definition_it: italianInput.value, definition_pl: polishInput.value }) });
      italianInput.value = updated.definition_it;
      polishInput.value = updated.definition_pl;
      setStatus(`Zapisano zmiany dla „${updated.lexical_item_it}”.`);
    } catch (cause) { setError(cause.message); }
    finally { save.disabled = false; }
  });
  const remove = element('button', 'secondary', 'Usuń wpis');
  remove.type = 'button';
  remove.addEventListener('click', () => removeItem(article, item.id));
  actions.append(save, remove);
  article.append(italian, polish, actions);
  return article;
}
async function removeItem(article, id) {
  if (!window.confirm('Usunąć to znaczenie?')) return;
  try {
    setError('');
    await request(`/api/lexical-senses/${id}`, { method: 'DELETE' });
    article.remove();
    setStatus('Usunięto znaczenie.');
    if (!list.children.length) list.append(element('p', 'hint', 'Brak zapisanych znaczeń.'));
  } catch (cause) { setError(cause.message); }
}
async function load() {
  try {
    setStatus('Wczytywanie zapisanych znaczeń…');
    const items = await request('/api/lexical-senses');
    list.replaceChildren();
    if (!items.length) list.append(element('p', 'hint', 'Brak zapisanych znaczeń.'));
    else items.forEach((item) => list.append(card(item)));
    setStatus(`Zapisane znaczenia: ${items.length}.`);
  } catch (cause) { setError(cause.message); setStatus('Nie udało się wczytać znaczeń.'); }
}
load();
})();
