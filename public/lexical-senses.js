const ui = {
  items: document.getElementById('items'), add: document.getElementById('add-item'), check: document.getElementById('check-items'),
  existingSection: document.getElementById('existing-section'), existing: document.getElementById('existing-list'),
  generate: document.getElementById('generate-senses'), proposalsSection: document.getElementById('proposal-section'),
  proposals: document.getElementById('proposal-list'), deferred: document.getElementById('deferred-list'),
  coverage: document.getElementById('coverage-list'), save: document.getElementById('save-senses'),
  saveResult: document.getElementById('save-result'), status: document.getElementById('status'), error: document.getElementById('error'),
};

let checkId = null;
let checkedItems = [];
let draft = null;
let busy = false;
let revision = 0;

function element(tag, className, label) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (label !== undefined) node.textContent = label;
  return node;
}

function setStatus(message) { ui.status.textContent = message; }
function setError(message) { ui.error.textContent = message; ui.error.hidden = !message; }
function updateButtons() {
  ui.check.disabled = busy;
  ui.add.disabled = busy;
  ui.generate.disabled = busy || !checkId;
  const selectedCards = [...ui.proposals.querySelectorAll('[data-sense-card]')].filter((card) => card.querySelector('[data-select-sense]').checked);
  ui.save.disabled = busy || !draft || !selectedCards.length || selectedCards.some((card) => {
    const confirm = card.querySelector('[data-confirm-distinct]');
    return confirm && !confirm.checked;
  });
}
function invalidate() {
  revision += 1;
  checkId = null;
  draft = null;
  ui.existingSection.hidden = true;
  ui.proposalsSection.hidden = true;
  ui.saveResult.replaceChildren();
  setStatus('Lista zmieniona. Sprawdź bazę ponownie.');
  updateButtons();
}
function addItem(value = '') {
  const row = element('div', 'input-row');
  const input = element('input');
  input.type = 'text';
  input.autocomplete = 'off';
  input.placeholder = 'np. prendere una decisione';
  input.value = value;
  input.setAttribute('aria-label', 'Włoskie słowo lub wyrażenie');
  input.setAttribute('data-item-input', '');
  input.addEventListener('input', invalidate);
  const remove = element('button', 'secondary remove-item', 'Usuń');
  remove.type = 'button';
  remove.addEventListener('click', () => { row.remove(); invalidate(); if (!ui.items.children.length) addItem(); });
  row.append(input, remove);
  ui.items.append(row);
  invalidate();
  return input;
}
function items() {
  const values = [...ui.items.querySelectorAll('[data-item-input]')].map((input) => input.value.trim().replace(/\s+/g, ' ')).filter(Boolean);
  if (!values.length) throw new Error('Wpisz co najmniej jedno włoskie słowo lub wyrażenie.');
  if (new Set(values.map((value) => value.toLocaleLowerCase('it'))).size !== values.length) throw new Error('Usuń powtórzone pozycje z listy.');
  return values;
}
async function post(path, body) {
  const response = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(' ') : data.message || `Błąd ${response.status}`);
  return data;
}
function busyState(value, message) { busy = value; setStatus(message); updateButtons(); }

function renderExisting(result) {
  ui.existing.replaceChildren();
  for (const item of result.items) {
    const card = element('article', 'existing-card');
    card.append(element('h3', '', item.input));
    if (item.existing.length) {
      card.append(element('p', 'badge existing-badge', `Już w bazie: ${item.existing.length}`));
      for (const sense of item.existing) card.append(element('p', '', `${sense.part_of_speech || '—'} · ${sense.definition_it}${sense.definition_pl ? ` · ${sense.definition_pl}` : ''}`));
      card.append(element('p', 'hint', 'Możesz usunąć tę pozycję z listy lub zachować ją, aby znaleźć inne znaczenie.'));
    } else card.append(element('p', 'hint', 'Brak wpisów dla tej postaci hasłowej.'));
    ui.existing.append(card);
  }
  ui.existingSection.hidden = false;
}

function renderProposals(result) {
  ui.proposals.replaceChildren();
  ui.deferred.replaceChildren();
  ui.coverage.replaceChildren();
  ui.saveResult.replaceChildren();
  result.lexical_senses.forEach((sense, index) => {
    const card = element('article', 'sense-card');
    card.setAttribute('data-sense-card', '');
    card.append(element('h3', '', `${sense.lexical_item_it} · ${sense.part_of_speech}`));
    card.append(element('p', '', sense.definition_it));
    card.append(element('p', 'hint', `Glosy: ${sense.glosses_pl.join(', ')}`));
    if (sense.usage.patterns_it.length) card.append(element('p', 'hint', `Wzorce: ${sense.usage.patterns_it.join('; ')}`));
    for (const example of sense.examples) card.append(element('p', 'example', `${example.sentence_it} — ${example.translation_pl}`));
    const evidence = element('details');
    evidence.append(element('summary', '', 'Sprawdzone źródła'));
    for (const source of Object.values(sense.evidence)) evidence.append(element('p', 'hint', `${source.source_type}: ${source.locator}`));
    card.append(evidence);
    const matches = result.matches[index] || [];
    if (matches.length) {
      card.append(element('p', 'badge existing-badge', 'Istniejące znaczenia tej jednostki:'));
      for (const match of matches) card.append(element('p', 'hint', `${match.equivalent ? 'Konflikt: ' : ''}${match.definition_it}${match.definition_pl ? ` · ${match.definition_pl}` : ''}`));
    }
    const label = element('label', 'edit-label', 'Polskie objaśnienie');
    const edit = element('textarea');
    edit.value = sense.definition_pl;
    edit.rows = 2;
    edit.setAttribute('data-definition-pl', '');
    edit.addEventListener('input', updateButtons);
    label.append(edit);
    const choose = element('label', 'choose-label');
    const checkbox = element('input');
    checkbox.type = 'checkbox';
    checkbox.setAttribute('data-select-sense', '');
    checkbox.disabled = matches.some((match) => match.equivalent);
    checkbox.addEventListener('change', updateButtons);
    choose.append(checkbox, element('span', '', checkbox.disabled ? 'Już zapisane — konflikt' : 'Wybierz do zapisu'));
    card.append(label, choose);
    if (!checkbox.disabled && matches.some((match) => match.possible)) {
      const review = element('label', 'choose-label');
      const confirmation = element('input');
      confirmation.type = 'checkbox';
      confirmation.setAttribute('data-confirm-distinct', '');
      confirmation.addEventListener('change', updateButtons);
      review.append(confirmation, element('span', '', 'Potwierdzam: to odrębne znaczenie od pokazanych wpisów.'));
      card.append(review);
    }
    const saveState = element('p', 'save-state');
    saveState.setAttribute('data-save-state', '');
    card.append(saveState);
    ui.proposals.append(card);
  });
  if (!result.lexical_senses.length) ui.proposals.append(element('p', 'hint', 'Brak gotowych propozycji.'));
  if (result.deferred.length) {
    ui.deferred.append(element('h3', '', 'Odroczone wejścia'));
    for (const item of result.deferred) ui.deferred.append(element('p', 'deferred', `${item.input_form_it}: ${item.needed_evidence_or_decision} (${item.reason_code})`));
  }
  if (result.coverage.length) {
    const details = element('details');
    details.append(element('summary', '', 'Zakres analizy'));
    for (const item of result.coverage) {
      const source = item.matched_input_form_it || item.input_form_it || item.lexical_item_it;
      const target = item.lexical_item_it && item.lexical_item_it !== source ? ` → ${item.lexical_item_it}` : '';
      const part = item.part_of_speech ? ` · ${item.part_of_speech}` : '';
      details.append(element('p', 'hint', `${source}${target}${part} · ${item.selection_basis}: ${item.notes_pl}`));
    }
    ui.coverage.append(details);
  }
  ui.proposalsSection.hidden = false;
  updateButtons();
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
  } catch (error) { setError(error.message); setStatus('Nie udało się sprawdzić listy.'); }
  finally { busy = false; updateButtons(); }
});
ui.generate.addEventListener('click', async () => {
  if (busy || !checkId) return;
  try {
    const startedAt = revision;
    setError('');
    busyState(true, 'Generowanie i sprawdzanie źródeł może potrwać kilka minut…');
    const result = await post('/api/lexical-senses/generate', { checkId, items: checkedItems });
    if (revision !== startedAt) { setStatus('Lista zmieniła się podczas generowania. Sprawdź ją ponownie.'); return; }
    draft = result;
    renderProposals(result);
    setStatus(`Gotowe propozycje: ${result.lexical_senses.length}; odroczone: ${result.deferred.length}.`);
  } catch (error) { setError(error.message); setStatus('Nie udało się wygenerować propozycji.'); }
  finally { busy = false; updateButtons(); }
});
ui.save.addEventListener('click', async () => {
  if (busy || !draft) return;
  const selected = [...ui.proposals.querySelectorAll('[data-sense-card]')].flatMap((card, index) => {
    if (!card.querySelector('[data-select-sense]').checked) return [];
    return [{ index, definition_pl: card.querySelector('[data-definition-pl]').value.trim(), confirmedDistinct: !!card.querySelector('[data-confirm-distinct]')?.checked }];
  });
  if (selected.some((item) => !item.definition_pl)) { setError('Uzupełnij polskie objaśnienia wybranych znaczeń.'); return; }
  try {
    setError('');
    busyState(true, 'Zapisywanie wybranych znaczeń…');
    const result = await post('/api/lexical-senses/save', { draftId: draft.draftId, selected });
    const saved = result.results.filter((item) => item.status === 'saved').length;
    const conflicts = result.results.filter((item) => item.status === 'conflict').length;
    const reviews = result.results.filter((item) => item.status === 'review_required').length;
    for (const item of result.results) {
      const card = ui.proposals.querySelectorAll('[data-sense-card]')[item.index];
      const state = card.querySelector('[data-save-state]');
      state.textContent = item.status === 'saved' ? 'Zapisano' : item.status === 'conflict' ? 'Konflikt: znaczenie jest już w bazie.' : 'Wymaga potwierdzenia odrębności znaczenia.';
      if (item.status === 'review_required' && !card.querySelector('[data-confirm-distinct]')) {
        for (const existing of item.existing) card.append(element('p', 'hint', `Nowy wpis w bazie: ${existing.definition_it}${existing.definition_pl ? ` · ${existing.definition_pl}` : ''}`));
        const review = element('label', 'choose-label');
        const confirmation = element('input');
        confirmation.type = 'checkbox';
        confirmation.setAttribute('data-confirm-distinct', '');
        confirmation.addEventListener('change', updateButtons);
        review.append(confirmation, element('span', '', 'Potwierdzam: to odrębne znaczenie od nowych wpisów.'));
        card.append(review);
      }
    }
    ui.saveResult.textContent = `Zapisano ${saved}. Konflikty: ${conflicts}. Do potwierdzenia: ${reviews}.`;
    setStatus('Zapis zakończony.');
  } catch (error) { setError(error.message); setStatus('Nie udało się zapisać. Poprawki i wybór pozostały na stronie.'); }
  finally { busy = false; updateButtons(); }
});
addItem();
