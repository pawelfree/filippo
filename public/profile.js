const ui = {
  browser: document.getElementById('profile-browser'),
  error: document.getElementById('error'),
  summary: document.getElementById('summary'),
  estimatedLevel: document.getElementById('estimated-level'),
  updated: document.getElementById('updated'),
  categories: document.getElementById('categories'),
  competencies: document.getElementById('competencies'),
  detail: document.getElementById('detail'),
  search: document.getElementById('search'),
  categoryCount: document.getElementById('category-count'),
  competencyCount: document.getElementById('competency-count'),
};

let profile;
let taxonomy;
let categoryById;
let constructionById;
let variantById;
let competencyById;
let selectedCategoryId;
let selectedCompetencyId;

const trendNames = {
  improving: 'poprawa',
  stable: 'stabilny',
  declining: 'spadek',
  insufficient_data: 'za mało danych',
};
const taskNames = {
  fill_blank: 'uzupełnianie luki',
  multiple_choice: 'wybór odpowiedzi',
  transformation: 'przekształcanie',
  translation: 'tłumaczenie',
  free_response: 'swobodna odpowiedź',
};
const sourceNames = {
  none: 'brak oceny',
  diagnostic: 'test diagnostyczny',
  practice: 'ćwiczenia',
  import: 'import',
  manual: 'ocena ręczna',
};

function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function percent(value) {
  return `${Math.round(value * 100)}%`;
}

function categoryCompetencies(categoryId) {
  return taxonomy.variants
    .filter((variant) => constructionById.get(variant.construction_id)?.category_id === categoryId)
    .map((variant) => competencyById.get(variant.id))
    .filter(Boolean);
}

function addSummary(value, label) {
  const card = el('div', 'summary-card');
  card.append(el('strong', '', value), el('span', '', label));
  ui.summary.append(card);
}

function renderSummary() {
  const assessed = profile.competencies.filter((item) => item.mastery !== null);
  const average = assessed.length
    ? percent(assessed.reduce((sum, item) => sum + item.mastery, 0) / assessed.length)
    : '—';
  const shown = profile.competencies.reduce((sum, item) => sum + item.exposure.tasks_shown, 0);
  const difficulties = profile.competencies.reduce((sum, item) => sum + item.difficulties.length, 0);
  ui.summary.replaceChildren();
  addSummary(`${assessed.length} / ${profile.competencies.length}`, 'zagadnień z oszacowaniem');
  addSummary(average, 'średnie opanowanie ocenionych');
  addSummary(String(shown), 'pokazanych zadań');
  addSummary(String(difficulties), 'zapisanych trudności');
  ui.updated.textContent = `Aktualizacja: ${new Date(profile.updated_at).toLocaleDateString('pl-PL')}`;
  renderEstimatedLevel();
}

function renderEstimatedLevel() {
  const estimate = profile.estimated_user_level;
  const assessment = estimate.assessment;
  const hasLevel = estimate.cefr_level !== null;
  ui.estimatedLevel.replaceChildren();

  const level = el('div', `level-value${hasLevel ? '' : ' unknown'}`, estimate.cefr_level ?? '—');
  ui.estimatedLevel.append(level);

  const information = el('div', 'level-information');
  information.append(el('p', 'level-label', 'Szacowany poziom użytkownika · CEFR'));
  information.append(el('h2', '', hasLevel ? `Poziom ${estimate.cefr_level}` : 'Poziom jeszcze nieoszacowany'));
  information.append(el('p', 'level-description', hasLevel
    ? 'Orientacyjny poziom pomaga dobrać ogólną złożoność zdań. Nie jest certyfikatem ani ograniczeniem poziomu ćwiczonej gramatyki.'
    : 'Brak wystarczających danych do oszacowania poziomu.'));

  const meta = el('div', 'level-meta');
  if (hasLevel) {
    meta.append(el('span', '', `Pewność oszacowania: ${percent(estimate.confidence)}`));
    meta.append(el('span', '', `${assessment.evidence_count} obserwacji`));
    if (assessment.assessed_at) {
      meta.append(el('span', '', `Ocena z ${new Date(assessment.assessed_at).toLocaleDateString('pl-PL')}`));
    }
    meta.append(el('span', '', sourceNames[assessment.source] ?? assessment.source));
  }
  ui.estimatedLevel.append(information, meta);
  ui.estimatedLevel.hidden = false;
}

function renderCategories() {
  ui.categories.replaceChildren();
  ui.categoryCount.textContent = String(taxonomy.categories.length);
  for (const category of taxonomy.categories) {
    const competencies = categoryCompetencies(category.id);
    const assessed = competencies.filter((item) => item.mastery !== null).length;
    const button = el('button', `category-button${category.id === selectedCategoryId ? ' active' : ''}`);
    button.type = 'button';
    button.append(el('span', '', category.name), el('span', 'count', `${assessed}/${competencies.length}`));
    button.addEventListener('click', () => {
      selectedCategoryId = category.id;
      selectedCompetencyId = competencies[0]?.taxonomy_node_id;
      ui.search.value = '';
      render();
    });
    ui.categories.append(button);
  }
}

function renderCompetencies() {
  ui.competencies.replaceChildren();
  const query = ui.search.value.trim().toLocaleLowerCase();
  let visible = 0;
  const constructions = taxonomy.constructions.filter((item) => item.category_id === selectedCategoryId);
  for (const construction of constructions) {
    const variants = taxonomy.variants.filter((variant) => {
      if (variant.construction_id !== construction.id) return false;
      const competency = competencyById.get(variant.id);
      return `${variant.id} ${variant.name} ${variant.definition}`.toLocaleLowerCase().includes(query) && competency;
    });
    if (!variants.length) continue;
    const group = el('section', 'construction');
    group.append(el('h2', '', construction.name));
    for (const variant of variants) {
      const competency = competencyById.get(variant.id);
      const known = competency.mastery !== null;
      const button = el('button', `competency-row${competency.taxonomy_node_id === selectedCompetencyId ? ' active' : ''}`);
      button.type = 'button';
      const title = el('span', 'competency-title');
      title.append(el('strong', '', variant.name));
      title.append(el('span', `score${known ? '' : ' unknown'}`, known ? percent(competency.mastery) : 'brak oceny'));
      button.append(title);
      if (known) {
        const meter = el('span', 'meter');
        const fill = el('span', competency.mastery < 0.5 ? 'low' : '');
        fill.style.width = percent(competency.mastery);
        meter.append(fill);
        button.append(meter);
      }
      const subtitle = el('span', 'competency-subtitle');
      subtitle.append(el('span', '', variant.id));
      subtitle.append(el('span', '', `${competency.exposure.tasks_attempted} prób · ${trendNames[competency.trend]}`));
      button.append(subtitle);
      button.addEventListener('click', () => {
        selectedCompetencyId = competency.taxonomy_node_id;
        render();
      });
      group.append(button);
      visible += 1;
    }
    ui.competencies.append(group);
  }
  ui.competencyCount.textContent = String(visible);
  if (!visible) ui.competencies.append(el('p', 'empty', 'Brak kompetencji pasujących do wyszukiwania.'));
}

function addDetailStat(container, value, label) {
  const stat = el('div', 'detail-stat');
  stat.append(el('strong', '', String(value)), el('span', '', label));
  container.append(stat);
}

function renderDetail() {
  ui.detail.replaceChildren();
  const competency = competencyById.get(selectedCompetencyId);
  const variant = variantById.get(selectedCompetencyId);
  if (!competency || !variant) {
    ui.detail.append(el('p', 'empty', 'Wybierz zagadnienie, aby zobaczyć szczegóły profilu.'));
    return;
  }
  const construction = constructionById.get(variant.construction_id);
  const category = categoryById.get(construction.category_id);
  ui.detail.append(el('div', 'detail-overline', `${category.name} / ${construction.name}`));
  ui.detail.append(el('h2', '', variant.name));
  const chips = el('div', 'chips');
  chips.append(el('span', 'chip id-chip', variant.id));
  ui.detail.append(chips, el('p', '', variant.definition));

  const known = competency.mastery !== null;
  const scorePanel = el('section', 'score-panel');
  scorePanel.append(el('div', `score-ring${known ? '' : ' unknown'}`, known ? percent(competency.mastery) : 'brak danych'));
  const copy = el('div', 'score-copy');
  copy.append(el('strong', '', known ? `Andamento ${trendNames[competency.trend]}` : 'Nessuna stima disponibile'));
  copy.append(el('span', '', known
    ? `Affidabilità della stima: ${percent(competency.confidence)}. Il valore indica una stima di padronanza, non un livello CEFR.`
    : 'Non ci sono ancora prove sufficienti per stimare la padronanza. Il dato mancante non equivale a un risultato pari a zero.'));
  scorePanel.append(copy);
  ui.detail.append(scorePanel);

  const performance = competency.performance;
  const exposure = competency.exposure;
  const grid = el('div', 'detail-grid');
  addDetailStat(grid, `${performance.first_attempt_correct}/${performance.first_attempts}`, 'risposte corrette al primo tentativo');
  addDetailStat(grid, `${exposure.tasks_attempted}/${exposure.tasks_shown}`, 'attività tentate / mostrate');
  addDetailStat(grid, `${performance.recent_first_attempt_correct}/${performance.recent_first_attempts}`, 'corrette nella finestra recente');
  addDetailStat(grid, sourceNames[competency.assessment.source] ?? competency.assessment.source, 'origine della stima');
  ui.detail.append(el('h3', '', 'Ćwiczenia i wyniki'), grid);

  if (exposure.task_types_seen.length) {
    ui.detail.append(el('h3', '', 'Formati incontrati'));
    const types = el('div', 'task-chips');
    for (const type of exposure.task_types_seen) types.append(el('span', '', taskNames[type] ?? type));
    ui.detail.append(types);
  }
  if (competency.assessment.assessed_at) {
    ui.detail.append(el('p', 'profile-date', `Oceniono ${new Date(competency.assessment.assessed_at).toLocaleDateString('pl-PL')} · ${competency.assessment.evidence_count} obserwacji`));
  }

  if (competency.difficulties.length) {
    ui.detail.append(el('h3', '', `Trudności odnotowane (${competency.difficulties.length})`));
    for (const difficulty of competency.difficulties) {
      const card = el('section', 'difficulty-card');
      card.append(el('span', 'severity', `ważność: ${difficulty.severity}`));
      card.append(el('strong', '', difficulty.code));
      card.append(el('p', '', difficulty.description));
      for (const evidence of difficulty.evidence) {
        const item = el('div', 'evidence');
        item.append(el('div', '', `Kontekst: ${difficulty.contexts.map((context) => context.grammar_context).join('; ')}`));
        item.append(el('div', '', `Odpowiedź uczącego się: ${evidence.learner_answer}`));
        item.append(el('div', '', `Oczekiwano: ${evidence.expected_answer}`));
        card.append(item);
      }
      ui.detail.append(card);
    }
  }
}

function render() {
  renderCategories();
  renderCompetencies();
  renderDetail();
}

async function start() {
  try {
    const [profileResponse, taxonomyResponse] = await Promise.all([
      fetch('/api/profile'),
      fetch('/api/taxonomy'),
    ]);
    if (!profileResponse.ok) throw new Error(`Profil niedostępny (${profileResponse.status}).`);
    if (!taxonomyResponse.ok) throw new Error(`Taksonomia niedostępna (${taxonomyResponse.status}).`);
    [profile, taxonomy] = await Promise.all([profileResponse.json(), taxonomyResponse.json()]);
    categoryById = new Map(taxonomy.categories.map((item) => [item.id, item]));
    constructionById = new Map(taxonomy.constructions.map((item) => [item.id, item]));
    variantById = new Map(taxonomy.variants.map((item) => [item.id, item]));
    competencyById = new Map(profile.competencies.map((item) => [item.taxonomy_node_id, item]));
    selectedCategoryId = taxonomy.categories[0]?.id;
    selectedCompetencyId = categoryCompetencies(selectedCategoryId)[0]?.taxonomy_node_id;
    ui.search.addEventListener('input', renderCompetencies);
    renderSummary();
    render();
    ui.browser.hidden = false;
  } catch (error) {
    ui.error.textContent = `Nie udało się wczytać profilu. ${error.message}`;
    ui.error.hidden = false;
  }
}

start();
