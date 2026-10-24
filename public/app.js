const elements = {
  browser: document.getElementById('browser'),
  error: document.getElementById('error'),
  stats: document.getElementById('stats'),
  categories: document.getElementById('categories'),
  list: document.getElementById('list'),
  detail: document.getElementById('detail'),
  search: document.getElementById('search'),
  categoryCount: document.getElementById('category-count'),
  variantCount: document.getElementById('variant-count'),
};

let taxonomy;
let selectedCategoryId;
let selectedVariantId;
let variantsById;
let constructionsById;

function node(tag, className, value) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (value !== undefined) element.textContent = value;
  return element;
}

function stat(value, label) {
  const wrapper = node('div', 'stat');
  wrapper.append(node('strong', '', String(value)), node('span', '', label));
  return wrapper;
}

function selectCategory(id) {
  selectedCategoryId = id;
  elements.search.value = '';
  const firstConstruction = taxonomy.constructions.find((item) => item.category_id === id);
  selectedVariantId = taxonomy.variants.find((item) => item.construction_id === firstConstruction?.id)?.id;
  render();
}

function selectVariant(id) {
  const variant = variantsById.get(id);
  if (!variant) return;
  selectedVariantId = id;
  selectedCategoryId = constructionsById.get(variant.construction_id)?.category_id;
  elements.search.value = '';
  render();
}

function renderCategories() {
  elements.categories.replaceChildren();
  elements.categoryCount.textContent = String(taxonomy.categories.length);
  for (const category of taxonomy.categories) {
    const count = taxonomy.constructions.filter((item) => item.category_id === category.id).length;
    const button = node('button', `category-button${category.id === selectedCategoryId ? ' active' : ''}`);
    button.type = 'button';
    button.append(node('span', '', category.name), node('span', 'count', String(count)));
    button.addEventListener('click', () => selectCategory(category.id));
    elements.categories.append(button);
  }
}

function renderList() {
  elements.list.replaceChildren();
  const query = elements.search.value.trim().toLocaleLowerCase();
  const constructions = taxonomy.constructions.filter((item) => item.category_id === selectedCategoryId);
  let visibleCount = 0;

  for (const construction of constructions) {
    const variants = taxonomy.variants.filter((variant) =>
      variant.construction_id === construction.id &&
      (!query || `${variant.id} ${variant.name} ${variant.definition} ${construction.name}`.toLocaleLowerCase().includes(query))
    );
    if (!variants.length) continue;
    visibleCount += variants.length;
    const group = node('section', 'construction');
    group.append(node('h2', '', construction.name));
    for (const variant of variants) {
      const button = node('button', `variant-button${variant.id === selectedVariantId ? ' active' : ''}`);
      button.type = 'button';
      button.append(node('span', 'variant-name', variant.name));
      const meta = node('span', 'variant-meta');
      meta.append(node('span', '', variant.id));
      if (variant.cefr?.reference_level) meta.append(node('span', 'cefr-badge', variant.cefr.reference_level));
      button.append(meta);
      button.addEventListener('click', () => selectVariant(variant.id));
      group.append(button);
    }
    elements.list.append(group);
  }
  elements.variantCount.textContent = String(visibleCount);
  if (!visibleCount) elements.list.append(node('p', 'empty', 'Brak wariantów pasujących do wyszukiwania.'));
}

function renderDetail() {
  elements.detail.replaceChildren();
  const variant = variantsById.get(selectedVariantId);
  if (!variant) {
    elements.detail.append(node('p', 'empty', 'Wybierz wariant, aby zobaczyć szczegóły.'));
    return;
  }
  const construction = constructionsById.get(variant.construction_id);
  const category = taxonomy.categories.find((item) => item.id === construction?.category_id);
  elements.detail.append(node('div', 'detail-overline', `${category?.name ?? ''} / ${construction?.name ?? ''}`));
  elements.detail.append(node('h2', '', variant.name));
  const chips = node('div', 'chips');
  chips.append(node('span', 'chip id-chip', variant.id));
  if (variant.cefr?.reference_level) chips.append(node('span', 'chip', `CEFR ${variant.cefr.reference_level}`));
  elements.detail.append(chips, node('h3', '', 'Definicja'), node('p', '', variant.definition));

  if (variant.cefr) {
    const cefr = variant.cefr;
    const card = node('section', 'info-card');
    card.append(node('div', 'label', 'Orientacyjny poziom CEFR'));
    card.append(node('strong', '', `${cefr.reference_level} · zakres ${cefr.level_range.from}–${cefr.level_range.to}`));
    card.append(node('p', '', cefr.description));
    elements.detail.append(card);
  }

  const profile = variant.operational_profile;
  if (Array.isArray(profile?.examples) && profile.examples.length) {
    elements.detail.append(node('h3', '', 'Przykłady użycia'));
    for (const example of profile.examples.slice(0, 5)) {
      elements.detail.append(node('p', 'example', example.text));
    }
  }
  if (Array.isArray(profile?.rule_cases) && profile.rule_cases.length) {
    elements.detail.append(node('h3', '', `Przypadki szczegółowe (${profile.rule_cases.length})`));
    for (const rule of profile.rule_cases) {
      const card = node('section', 'info-card');
      card.append(node('div', 'label', rule.case_id));
      card.append(node('strong', '', rule.title));
      card.append(node('p', '', rule.rule));
      elements.detail.append(card);
    }
  }

  const related = taxonomy.relations
    .filter((item) => item.source_id === variant.id || item.target_id === variant.id)
    .map((item) => ({ type: item.type, variant: variantsById.get(item.source_id === variant.id ? item.target_id : item.source_id) }))
    .filter((item) => item.variant);
  if (related.length) {
    elements.detail.append(node('h3', '', `Powiązania (${related.length})`));
    const list = node('div', 'relation-list');
    for (const item of related) {
      const button = node('button', 'relation-button');
      button.type = 'button';
      button.append(node('span', 'relation-type', item.type), node('span', '', item.variant.name));
      button.title = item.variant.id;
      button.addEventListener('click', () => selectVariant(item.variant.id));
      list.append(button);
    }
    elements.detail.append(list);
  }
}

function render() {
  renderCategories();
  renderList();
  renderDetail();
}

async function start() {
  try {
    const response = await fetch('/api/taxonomy');
    if (!response.ok) throw new Error(`Serwer zwrócił błąd ${response.status}.`);
    taxonomy = await response.json();
    variantsById = new Map(taxonomy.variants.map((item) => [item.id, item]));
    constructionsById = new Map(taxonomy.constructions.map((item) => [item.id, item]));
    elements.stats.append(
      stat(taxonomy.categories.length, 'kategorii'),
      stat(taxonomy.constructions.length, 'konstrukcji'),
      stat(taxonomy.variants.length, 'wariantów')
    );
    selectedCategoryId = taxonomy.categories[0]?.id;
    selectedVariantId = taxonomy.variants.find((item) => item.construction_id === taxonomy.constructions[0]?.id)?.id;
    elements.search.addEventListener('input', renderList);
    render();
    elements.browser.hidden = false;
  } catch (error) {
    elements.error.textContent = `Nie udało się wczytać taksonomii. ${error.message}`;
    elements.error.hidden = false;
  }
}

start();
