(() => {
  type Row = { day: string; formalMean: number; formalP10: number; formalP90: number; newMean: number; reinforcementMean: number };
  type Result = {
    asOf: string; timeZone: string; horizonDays: number; runs: number; seed: number; newPerDay: number;
    actualNewAvailable: number; assumptions: { dueReviewsCompleted: boolean; newAfterDueAtEndOfDay: boolean; reinforcementDelayMinutes: number; positiveRatingSource: string; newRatingSource: string; pendingReinforcements: number };
    sampleSizes: { formal: number; positive: number; firstNew: number }; warnings: string[]; daily: Row[];
  };
  const form = document.getElementById('simulation-form') as HTMLFormElement;
  const newPerDay = document.getElementById('new-per-day') as HTMLInputElement;
  const seed = document.getElementById('seed') as HTMLInputElement;
  const button = document.getElementById('simulate') as HTMLButtonElement;
  const loading = document.getElementById('simulation-loading')!;
  const error = document.getElementById('simulation-error')!;
  const result = document.getElementById('simulation-result')!;
  const chartSection = document.getElementById('simulation-chart-section')!;
  const stale = document.getElementById('simulation-stale')!;
  const dayFormat = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short', timeZone: 'Europe/Warsaw' });
  const momentFormat = new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Warsaw' });
  const formatDay = (day: string) => dayFormat.format(new Date(`${day}T12:00:00+01:00`));
  const decimal = (value: number) => value.toLocaleString('pl-PL', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  const integer = (value: number) => value.toLocaleString('pl-PL');
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', content?: string): HTMLElementTagNameMap[K] => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  };
  function metric(label: string, value: string, note = '') {
    const card = el('div', 'statistics-card');
    card.append(el('span', 'statistics-label', label), el('strong', '', value));
    if (note) card.append(el('small', '', note));
    return card;
  }
  function sourceName(source: string) {
    if (source === 'positive-formal-30d') return 'pozytywne formalne oceny z ostatnich 30 dni';
    if (source === 'first-new-30d') return 'pierwsze oceny nowych znaczeń z ostatnich 30 dni';
    if (source === 'all-formal-30d') return 'wszystkie formalne oceny z ostatnich 30 dni';
    return 'założenie zastępcze: Good';
  }
  function render(data: Result) {
    result.hidden = false;
    chartSection.hidden = false;
    stale.hidden = Number(newPerDay.value) === data.newPerDay && Number(seed.value) === data.seed;
    document.getElementById('simulation-meta')!.textContent = `Migawka: ${momentFormat.format(new Date(data.asOf))} · ${data.timeZone} · ${data.horizonDays} dni · ${data.runs} przebiegów · ziarno ${integer(data.seed)}`;
    const total = (key: keyof Row) => data.daily.reduce((sum, day) => sum + (day[key] as number), 0);
    document.getElementById('simulation-summary')!.replaceChildren(
      metric('Średnio formalnych powtórek', decimal(total('formalMean')), 'Łącznie w 30 dniach'),
      metric('Nowe znaczenia', integer(Math.round(total('newMean'))), `Dostępne teraz: ${integer(data.actualNewAvailable)}`),
      metric('Średnio lokalnych utrwaleń', decimal(total('reinforcementMean')), 'Dodatkowe próby po Again'),
    );
    const assumptions = document.getElementById('simulation-assumptions')!;
    assumptions.replaceChildren();
    for (const [label, text] of [
      ['Terminy', 'Wszystkie należne powtórki są wykonane w dniu terminu; zaległe trafiają na pierwszy dzień. Nowe znaczenia rozpoczynają się pod koniec dnia, po powtórkach.'],
      ['Zapamiętanie', 'Wynik przyszłej powtórki jest losowany z prawdopodobieństwa FSRS dla danej karty.'],
      ['Oceny pozytywne', `${sourceName(data.assumptions.positiveRatingSource)} (próba: ${integer(data.sampleSizes.positive)}).`],
      ['Nowe znaczenia', `${sourceName(data.assumptions.newRatingSource)} (pierwsze oceny nowych: ${integer(data.sampleSizes.firstNew)}, wszystkie formalne: ${integer(data.sampleSizes.formal)}).`],
      ['Utrwalenia', `Jedna dodatkowa próba minutę po formalnym Again, jeśli nie nadszedł już kolejny termin FSRS. Oczekujące dziś na starcie: ${integer(data.assumptions.pendingReinforcements)}.`],
      ['Niepewność', 'Przedział 10.–90. percentyla pokazuje rozrzut losowanych scenariuszy, nie gwarancję ani dokładność modelu.'],
    ]) {
      const p = el('p'); p.append(el('strong', '', `${label}: `), document.createTextNode(text)); assumptions.append(p);
    }
    const warnings = document.getElementById('simulation-warnings')!;
    warnings.replaceChildren(); warnings.hidden = data.warnings.length === 0;
    for (const warning of data.warnings) warnings.append(el('p', '', warning));
    const chart = document.getElementById('simulation-chart')!;
    chart.replaceChildren();
    const table = document.querySelector('#simulation-table tbody')!;
    table.replaceChildren();
    const maximum = Math.max(1, ...data.daily.map((day) => day.formalP90));
    if (!data.daily.some((day) => day.formalMean || day.newMean || day.reinforcementMean)) {
      chart.append(el('p', 'statistics-empty', 'Brak pracy w tym scenariuszu.'));
      const tr = el('tr'); const td = el('td', 'statistics-empty', 'Brak pracy w tym scenariuszu.');
      td.colSpan = 6; tr.append(td); table.append(tr);
      return;
    }
    for (const day of data.daily) {
      const row = el('div', 'simulation-day');
      row.append(el('span', '', formatDay(day.day)));
      const plot = el('span', 'simulation-plot');
      const band = el('span', 'simulation-band');
      band.style.left = `${Math.min(100, day.formalP10 / maximum * 100)}%`;
      band.style.width = `${Math.max(0, (day.formalP90 - day.formalP10) / maximum * 100)}%`;
      const bar = el('span', 'simulation-formal');
      bar.style.left = `${Math.min(100, day.formalMean / maximum * 100)}%`;
      plot.append(band, bar);
      const extra = el('span', 'simulation-extra');
      extra.append(el('b', '', `+${decimal(day.newMean)}`), document.createTextNode(' / '), el('i', '', `+${decimal(day.reinforcementMean)}`));
      row.append(plot, extra);
      row.title = `${day.day}: średnio ${decimal(day.formalMean)} powtórek, zakres ${decimal(day.formalP10)}–${decimal(day.formalP90)}, nowe ${decimal(day.newMean)}, utrwalenia ${decimal(day.reinforcementMean)}`;
      chart.append(row);
      const tr = el('tr');
      for (const [index, value] of [formatDay(day.day), decimal(day.formalMean), decimal(day.formalP10), decimal(day.formalP90), decimal(day.newMean), decimal(day.reinforcementMean)].entries()) {
        const cell = el(index === 0 ? 'th' : 'td', '', value);
        if (index === 0) cell.setAttribute('scope', 'row');
        tr.append(cell);
      }
      table.append(tr);
    }
  }
  for (const input of [newPerDay, seed]) input.addEventListener('input', () => { if (!result.hidden) stale.hidden = false; });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const requested = { newPerDay: Number(newPerDay.value), seed: Number(seed.value) };
    button.disabled = true; loading.hidden = false; error.hidden = true;
    try {
      const response = await fetch('/api/study/simulation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requested) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data.message === 'string' ? data.message : `Błąd obliczenia (${response.status}).`);
      render(data as Result);
    } catch (cause) {
      error.textContent = `Nie udało się obliczyć scenariusza. ${cause instanceof Error ? cause.message : ''} Spróbuj ponownie.`;
      error.hidden = false;
    } finally { button.disabled = false; loading.hidden = true; }
  });
})();
