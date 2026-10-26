(() => {
  type AnyRecord = Record<string, any>;
  const range = document.getElementById('history-range') as HTMLSelectElement;
  const scheduleRange = document.getElementById('schedule-range') as HTMLSelectElement;
  const refresh = document.getElementById('refresh') as HTMLButtonElement;
  const pageError = document.getElementById('page-error')!;
  const memoryError = document.getElementById('memory-error')!;
  const numberFormat = new Intl.NumberFormat('pl-PL');
  const dateFormat = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Warsaw' });
  const dayFormat = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short', timeZone: 'Europe/Warsaw' });

  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string): HTMLElementTagNameMap[K] => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const count = (value: unknown) => numberFormat.format(Number.isFinite(Number(value)) ? Number(value) : 0);
  const asDate = (value: string) => new Date(value);
  const formatDay = (value: string) => {
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00+01:00`) : asDate(value);
    return dayFormat.format(parsed);
  };
  const formatMoment = (value?: string) => value ? dateFormat.format(asDate(value)) + ' · ' + new Intl.DateTimeFormat('pl-PL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' }).format(asDate(value)) : '';

  async function get<T>(url: string): Promise<T> {
    const response = await fetch(url);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof data.message === 'string' ? data.message : `Błąd odczytu (${response.status}).`);
    return data as T;
  }
  function metric(label: string, value: string, note = '') {
    const card = el('div', 'statistics-card');
    card.append(el('span', 'statistics-label', label), el('strong', '', value));
    if (note) card.append(el('small', '', note));
    return card;
  }
  function setTableRows(tableId: string, rows: string[][]) {
    const body = document.querySelector(`#${tableId} tbody`)!;
    body.replaceChildren();
    rows.forEach((row) => {
      const tr = el('tr');
      row.forEach((value, index) => tr.append(el(index === 0 ? 'th' : 'td', '', value)));
      if (tr.firstElementChild) tr.firstElementChild.setAttribute('scope', 'row');
      body.append(tr);
    });
  }
  function renderSummary(data: AnyRecord) {
    const s = data.summary || {};
    const target = document.getElementById('summary')!;
    target.replaceChildren(
      metric('Wszystkie znaczenia', count(s.total)),
      metric('Rozpoczęta nauka', count(s.studied)),
      metric('Nowe znaczenia', count(s.newCount)),
      metric('Należne teraz', count(s.dueNow)),
      metric('Formalne oceny', count(s.formalReviews), `Zakres: ${range.options[range.selectedIndex].text}`),
    );
    document.getElementById('history-as-of')!.textContent = `Migawka: ${formatMoment(data.asOf)} · ${data.timeZone || 'Europe/Warsaw'}`;
  }
  function renderHistory(data: AnyRecord) {
    const history = Array.isArray(data.history) ? data.history : [];
    const chart = document.getElementById('history-chart')!;
    chart.replaceChildren();
    const series = [
      ['Again', 'again', 'again'], ['Hard', 'hard', 'hard'], ['Good', 'good', 'good'], ['Easy', 'easy', 'easy'], ['Utrwalenia', 'reinforcements', 'reinforcement'],
    ];
    const max = Math.max(1, ...history.map((d: AnyRecord) => series.reduce((sum, [, key]) => sum + (Number(d[key]) || 0), 0)));
    const hasHistory = history.some((day: AnyRecord) => series.some(([, key]) => Number(day[key]) > 0));
    if (!hasHistory) {
      chart.append(el('p', 'statistics-empty', 'Brak ocen w tym zakresie.'));
      setTableRows('history-table', []);
      return;
    }
    history.forEach((day: AnyRecord) => {
      const row = el('div', 'history-day');
      row.append(el('span', 'history-day-label', formatDay(day.day)));
      const stack = el('div', 'history-stack');
      const total = series.reduce((sum, [, key]) => sum + (Number(day[key]) || 0), 0);
      stack.setAttribute('aria-hidden', 'true');
      for (const [, key, className] of series) {
        const value = Number(day[key]) || 0;
        if (!value) continue;
        const bar = el('span', `history-bar ${className}`);
        bar.style.width = `${(value / max) * 100}%`;
        stack.append(bar);
      }
      row.append(stack, el('span', 'history-total', count(total)));
      row.title = `${day.day}: ${series.map(([label, key]) => `${label} ${count(day[key])}`).join(', ')}`;
      chart.append(row);
    });
    const legend = el('div', 'chart-legend');
    for (const [label, , className] of series) {
      const item = el('span'); item.append(el('i', `legend-dot ${className}`), document.createTextNode(label)); legend.append(item);
    }
    chart.append(legend);
    setTableRows('history-table', history.map((d: AnyRecord) => [formatDay(d.day), count(d.again), count(d.hard), count(d.good), count(d.easy), count(d.reinforcements)]));
  }
  function renderRetention(data: AnyRecord) {
    const retention = data.retention || {};
    document.getElementById('retention-range')!.textContent = `Zakres: ${range.options[range.selectedIndex].text}`;
    const cards = document.getElementById('retention')!;
    cards.replaceChildren();
    const addRetention = (label: string, row?: AnyRecord, note = '') => {
      if (!row) return;
      const rate = row.total > 0 && row.rate !== null ? `${(Number(row.rate) * 100).toFixed(1)}%` : 'Brak danych';
      cards.append(metric(label, rate, `${count(row.success)} powodzeń z ${count(row.total)} prób${note ? ` · ${note}` : ''}`));
    };
    addRetention('Ogółem', retention.overall);
    addRetention('Oceny należnych powtórek', retention.due, 'ten wynik można porównać z celem FSRS');
    document.getElementById('unclassified')!.textContent = `Oceny bez klasyfikacji jako należna powtórka: ${count(retention.unclassified)}.`;
    if (!retention.overall?.total) cards.append(el('p', 'statistics-empty', 'Brak danych o skuteczności w wybranym zakresie.'));
  }
  function renderSchedule(data: AnyRecord) {
    const s = data.scheduled || {};
    const horizon = data.scheduleRange === '7d' ? 7 : 30;
    const node = document.getElementById('schedule-summary')!;
    node.replaceChildren(metric('Zaległe', count(s.overdue)), metric('Termin dziś', count(s.today)), metric(`Poza kolejnymi ${horizon} dniami`, count(s.beyond)));
    document.getElementById('schedule-as-of')!.textContent = `Zapisane terminy na migawkę ${formatMoment(data.asOf)}. To bieżący harmonogram kart, bez prognozowania ocen ani dalszych terminów.`;
    document.getElementById('schedule-caption')!.textContent = `Zapisane terminy w kolejnych ${horizon} dniach`;
    const days = Array.isArray(s.days) ? s.days : [];
    const hasSchedule = days.some((d: AnyRecord) => Number(d.count) > 0);
    setTableRows('schedule-table', hasSchedule ? days.map((d: AnyRecord) => [formatDay(d.day), count(d.count)]) : []);
    if (!hasSchedule) {
      const body = document.querySelector('#schedule-table tbody')!;
      const tr = el('tr'); const td = el('td', 'statistics-empty', 'Brak zaplanowanych terminów w tym okresie.'); td.colSpan = 2; tr.append(td); body.append(tr);
    }
  }
  function renderMemory(data: AnyRecord) {
    memoryError.hidden = true;
    document.getElementById('memory-as-of')!.textContent = `Migawka kart: ${formatMoment(data.asOf)}.`;
    const summary = document.getElementById('memory-summary')!;
    summary.replaceChildren(metric('Kart w rozkładach', count(data.count)), metric('Szacunkowo zapamiętane', Number(data.estimatedKnown || 0).toFixed(1), 'Suma prawdopodobieństw przypomnienia'), metric('Nieprawidłowe karty', count(data.invalidCount)));
    if (Number(data.invalidCount) > 0) {
      memoryError.textContent = `${count(data.invalidCount)} kart nie można uwzględnić w obliczeniach pamięci.`;
      memoryError.hidden = false;
    }
    const labels: Record<string, string> = { difficulty: 'Trudność', stability: 'Stabilność (dni)', retrievability: 'Prawdopodobieństwo przypomnienia' };
    const box = document.getElementById('memory-distributions')!;
    box.replaceChildren();
    if (!Number(data.count)) {
      box.append(el('p', 'statistics-empty', 'Brak rozpoczętych znaczeń.'));
      return;
    }
    for (const key of Object.keys(labels)) {
      const section = el('section', 'distribution'); section.append(el('h3', '', labels[key]));
      const items: AnyRecord[] = Array.isArray(data.distributions?.[key]) ? data.distributions[key] : [];
      const max = Math.max(1, ...items.map((item) => Number(item.count) || 0));
      if (!items.length) section.append(el('p', 'statistics-empty', 'Brak danych.'));
      items.forEach((item) => {
        const row = el('div', 'distribution-row');
        row.append(el('span', '', String(item.label)));
        const track = el('span', 'distribution-track'); const fill = el('span', 'distribution-fill');
        fill.style.width = `${(Number(item.count || 0) / max) * 100}%`; track.append(fill);
        row.append(track, el('strong', '', count(item.count))); section.append(row);
      });
      box.append(section);
    }
  }
  function showError(node: HTMLElement, message: string) { node.textContent = message; node.hidden = false; }
  async function loadPrimary() {
    try {
      const data = await get<AnyRecord>(`/api/study/statistics?history=${encodeURIComponent(range.value)}&schedule=${encodeURIComponent(scheduleRange.value)}`);
      renderSummary(data); renderHistory(data); renderRetention(data); renderSchedule(data);
      pageError.hidden = true;
    } catch (cause) {
      for (const id of ['summary', 'history-chart', 'retention', 'schedule-summary']) document.getElementById(id)!.replaceChildren();
      for (const id of ['history-as-of', 'unclassified', 'schedule-as-of', 'retention-range']) document.getElementById(id)!.textContent = '';
      setTableRows('history-table', []);
      setTableRows('schedule-table', []);
      showError(pageError, `Nie udało się wczytać historii i harmonogramu. ${cause instanceof Error ? cause.message : ''} Spróbuj ponownie.`);
    }
  }
  async function loadMemory() {
    try { renderMemory(await get<AnyRecord>('/api/study/statistics/memory')); }
    catch (cause) {
      document.getElementById('memory-summary')!.replaceChildren();
      document.getElementById('memory-distributions')!.replaceChildren();
      document.getElementById('memory-as-of')!.textContent = '';
      showError(memoryError, `Nie udało się wczytać rozkładów pamięci. ${cause instanceof Error ? cause.message : ''} Spróbuj ponownie.`);
    }
  }
  async function load() {
    refresh.disabled = true;
    await Promise.all([loadPrimary(), loadMemory()]);
    refresh.disabled = false;
  }
  range.addEventListener('change', loadPrimary);
  scheduleRange.addEventListener('change', loadPrimary);
  refresh.addEventListener('click', load);
  load();
})();
