import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';

test('cloze start separates reviews from new meanings', async () => {
  const html = await readFile(join(process.cwd(), 'public/cloze.html'), 'utf8');
  const script = await readFile(join(process.cwd(), 'dist/browser/cloze.js'), 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost/cloze.html', runScripts: 'outside-only' });
  try {
    const posts: any[] = [];
    (dom.window as any).fetch = async (path: string, options?: RequestInit) => {
      if (path === '/api/study/overview') return { ok: true, json: async () => ({ dueCount: 1, reinforcementCount: 1, newCount: 2 }) };
      if (path === '/api/cloze/sessions' && options?.method === 'POST') {
        posts.push(JSON.parse(String(options.body)));
        return { ok: true, json: async () => ({ id: `session-${posts.length}`, status: 'ready', requestedCount: 1, completedCount: 0, failures: {}, current: null, finished: true }) };
      }
      return { ok: true, json: async () => [] };
    };
    dom.window.eval(script);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(dom.window.document.getElementById('cloze-overview-due')!.textContent, '1');
    assert.equal(dom.window.document.getElementById('cloze-overview-reinforcement')!.textContent, '1');
    (dom.window.document.getElementById('cloze-review-start') as HTMLButtonElement).click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.deepEqual(posts[0], { mode: 'review' });
    (dom.window.document.getElementById('cloze-new') as HTMLButtonElement).click();
    (dom.window.document.getElementById('cloze-start-form') as HTMLFormElement).dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.deepEqual(posts[1], { count: 5, mode: 'new' });
  } finally { dom.window.close(); }
});

test('cloze screen renders Polish sentence and one input per gap, then finishes fixed selection', async () => {
  const html = await readFile(join(process.cwd(), 'public/cloze.html'), 'utf8');
  const script = await readFile(join(process.cwd(), 'dist/browser/cloze.js'), 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost/cloze.html', runScripts: 'outside-only' });
  try {
    const { window } = dom;
    Object.defineProperty(window.crypto, 'randomUUID', { value: randomUUID });
    const submitted: any[] = [];
    const card = { position: 0, exerciseId: 'ex-1', exercise: { sentence_pl: 'Deszcz dał nam wytchnienie.', prompt: [{ text: 'La pioggia ha dato ' }, { gap_id: 'g1' }, { text: ' ' }, { gap_id: 'g2' }, { text: '.' }] } };
    let answered = false;
    (window as any).fetch = async (_path: string, options?: RequestInit) => {
      if (_path === '/api/study/overview') return { ok: true, json: async () => ({ dueCount: 0, reinforcementCount: 0, newCount: answered ? 0 : 1 }) };
      if (_path === '/api/cloze/overview') return { ok: false, status: 404, json: async () => ({ message: 'Nie znaleziono zasobu.' }) };
      if (_path === '/api/cloze/sessions' && !options?.method) return { ok: true, json: async () => [] };
      if (options?.method === 'POST' && _path.endsWith('/answers')) {
        answered = true;
        submitted.push(JSON.parse(String(options.body)));
        return { ok: true, json: async () => ({ id: 'session-1', status: 'ready', requestedCount: 1, completedCount: 1, failures: {}, current: null, finished: true, accepted: { correct: true, rating: 4, sentence: 'La pioggia ha dato una tregua.', exercise: card.exercise } }) };
      }
      if (answered) return { ok: true, json: async () => ({ id: 'session-1', status: 'ready', requestedCount: 1, completedCount: 1, failures: {}, current: null, finished: true }) };
      return { ok: true, json: async () => ({ id: 'session-1', status: 'ready', requestedCount: 1, completedCount: 0, failures: {}, current: card, finished: false }) };
    };
    window.eval(script);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(window.document.getElementById('cloze-overview-new')!.textContent, '1');
    const form = window.document.getElementById('cloze-start-form') as HTMLFormElement;
    form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(window.document.getElementById('cloze-polish')!.textContent, 'Deszcz dał nam wytchnienie.');
    const inputs = [...window.document.querySelectorAll<HTMLInputElement>('#cloze-prompt input')];
    assert.equal(inputs.length, 2);
    inputs[0].value = 'una'; inputs[1].value = 'tregua';
    (window.document.getElementById('cloze-answer-form') as HTMLFormElement).dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.deepEqual(submitted[0].responses, { g1: 'una', g2: 'tregua' });
    assert.equal(window.document.getElementById('cloze-card')!.hidden, false);
    assert.equal(window.document.getElementById('cloze-session-new')!.textContent, '0');
    assert.match(window.document.getElementById('cloze-feedback')!.textContent!, /La pioggia ha dato una tregua\./);
    assert.match(window.document.getElementById('cloze-feedback')!.textContent!, /Easy/);
    assert.equal(window.document.getElementById('cloze-next')!.hidden, false);
    (window.document.getElementById('cloze-next') as HTMLButtonElement).click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(window.document.getElementById('cloze-card')!.hidden, true);
    assert.equal(window.document.getElementById('cloze-progress')!.textContent, 'Sesja zakończona');
  } finally { dom.window.close(); }
});

test('missing saved cloze session returns to the start form', async () => {
  const html = await readFile(join(process.cwd(), 'public/cloze.html'), 'utf8');
  const script = await readFile(join(process.cwd(), 'dist/browser/cloze.js'), 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost/cloze.html', runScripts: 'outside-only' });
  try {
    const { window } = dom;
    window.localStorage.setItem('filippo.cloze.session', 'deleted-session');
    (window as any).fetch = async (path: string) => path === '/api/study/overview'
      ? { ok: true, json: async () => ({ dueCount: 0, reinforcementCount: 0, newCount: 1 }) }
      : path === '/api/cloze/sessions'
      ? { ok: true, json: async () => [] }
      : { ok: false, status: 404, json: async () => ({ message: 'Nie znaleziono sesji cloze.' }) };
    window.eval(script);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(window.document.getElementById('cloze-start')!.hidden, false);
    assert.equal(window.document.getElementById('cloze-session')!.hidden, true);
    assert.equal(window.localStorage.getItem('filippo.cloze.session'), null);
    assert.match(window.document.getElementById('cloze-status')!.textContent!, /Rozpocznij nową/);
  } finally { dom.window.close(); }
});

test('wrong answer shows the solution and Again before the next meaning', async () => {
  const html = await readFile(join(process.cwd(), 'public/cloze.html'), 'utf8');
  const script = await readFile(join(process.cwd(), 'dist/browser/cloze.js'), 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost/cloze.html', runScripts: 'outside-only' });
  try {
    const { window } = dom;
    Object.defineProperty(window.crypto, 'randomUUID', { value: randomUUID });
    const first = { position: 0, exercise: { sentence_pl: 'Krótka przerwa.', prompt: [{ text: 'La ' }, { gap_id: 'word' }, { text: ' è breve.' }] } };
    const second = { position: 1, exercise: { sentence_pl: 'Długi dzień.', prompt: [{ text: 'Il ' }, { gap_id: 'word' }, { text: ' è lungo.' }] } };
    const started = { id: 'session-2', status: 'ready', requestedCount: 2, completedCount: 0, generation: { processed: 2, total: 2 }, failures: {}, current: first, finished: false };
    const advanced = { ...started, completedCount: 1, current: second };
    let answered = false;
    (window as any).fetch = async (path: string, options?: RequestInit) => {
      if (path === '/api/study/overview') return { ok: true, json: async () => ({ dueCount: 1, reinforcementCount: 0, newCount: 1 }) };
      if (path === '/api/cloze/sessions' && !options?.method) return { ok: true, json: async () => [] };
      if (path.endsWith('/answers')) {
        answered = true;
        return { ok: true, json: async () => ({ ...advanced, accepted: { correct: false, rating: 1, sentence: 'La tregua è breve.', exercise: first.exercise } }) };
      }
      return { ok: true, json: async () => answered ? advanced : started };
    };
    window.eval(script);
    (window.document.getElementById('cloze-start-form') as HTMLFormElement).dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    (window.document.querySelector('#cloze-prompt input') as HTMLInputElement).value = 'errore';
    (window.document.getElementById('cloze-answer-form') as HTMLFormElement).dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(window.document.getElementById('cloze-polish')!.textContent, 'Krótka przerwa.');
    assert.equal((window.document.querySelector('#cloze-prompt input') as HTMLInputElement).value, 'errore');
    assert.equal(window.document.getElementById('cloze-solution')!.textContent, 'La tregua è breve.');
    assert.match(window.document.getElementById('cloze-rating')!.textContent!, /Again/);
    assert.equal(window.document.getElementById('cloze-progress')!.textContent, 'Przećwiczono 1 z 2 znaczeń');
    const resume = new JSDOM(html, { url: 'http://localhost/cloze.html', runScripts: 'outside-only' });
    try {
      resume.window.localStorage.setItem('filippo.cloze.session', 'session-2');
      resume.window.localStorage.setItem('filippo.cloze.feedback', window.localStorage.getItem('filippo.cloze.feedback')!);
      (resume.window as any).fetch = async (path: string) => ({ ok: true, json: async () => path === '/api/cloze/sessions' ? [] : path === '/api/study/overview' ? { dueCount: 1, reinforcementCount: 0, newCount: 1 } : advanced });
      resume.window.eval(script);
      await new Promise((resolve) => setTimeout(resolve, 0));
      assert.equal(resume.window.document.getElementById('cloze-polish')!.textContent, 'Krótka przerwa.');
      assert.equal(resume.window.document.getElementById('cloze-solution')!.textContent, 'La tregua è breve.');
    } finally { resume.window.close(); }
    (window.document.getElementById('cloze-next') as HTMLButtonElement).click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(window.document.getElementById('cloze-polish')!.textContent, 'Długi dzień.');
    assert.equal(window.document.getElementById('cloze-feedback')!.hidden, true);
    assert.equal(window.document.getElementById('cloze-progress')!.textContent, 'Ćwiczenie 2 z 2');
  } finally { dom.window.close(); }
});

test('queued cloze session shows generation progress separately from study progress', async () => {
  const html = await readFile(join(process.cwd(), 'public/cloze.html'), 'utf8');
  const script = await readFile(join(process.cwd(), 'dist/browser/cloze.js'), 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost/cloze.html', runScripts: 'outside-only' });
  try {
    const { window } = dom;
    const running = { id: 'session-1', status: 'running', requestedCount: 5, completedCount: 0, generation: { processed: 2, total: 5 }, failures: {}, current: null, finished: false };
    let historyReads = 0;
    (window as any).fetch = async (path: string, options?: RequestInit) => {
      if (path === '/api/study/overview') return { ok: true, json: async () => ({ dueCount: 2, reinforcementCount: 1, newCount: 3 }) };
      if (path === '/api/cloze/sessions' && !options?.method) historyReads += 1;
      return { ok: true, json: async () => path === '/api/cloze/sessions' && !options?.method ? [{ ...running, createdAt: '2026-11-03T10:00:00.000Z' }] : running };
    };
    window.eval(script);
    (window.document.getElementById('cloze-start-form') as HTMLFormElement).dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(window.document.getElementById('cloze-progress')!.textContent, 'Przygotowywanie ćwiczeń…');
    assert.equal(window.document.getElementById('cloze-generation')!.textContent, '');
    assert.equal((window.document.getElementById('cloze-new') as HTMLButtonElement).disabled, true);
    assert.equal(window.document.getElementById('cloze-new')!.textContent, 'Poczekaj');
    assert.match(window.document.getElementById('cloze-jobs')!.textContent!, /Generowanie.*2 z 5 znaczeń wymagających ćwiczeń/);
    assert.equal(window.document.querySelectorAll('#cloze-job-tabs button').length, 5);
    assert.equal(window.document.getElementById('cloze-overview-due')!.textContent, '2');
    assert.equal(window.document.getElementById('cloze-session-reinforcement')!.textContent, '1');
    const queuedTab = [...window.document.querySelectorAll<HTMLButtonElement>('#cloze-job-tabs button')].find((button) => button.textContent?.startsWith('W kolejce'))!;
    queuedTab.click();
    assert.match(window.document.getElementById('cloze-jobs')!.textContent!, /Brak zleceń w tym stanie/);
    const allTab = [...window.document.querySelectorAll<HTMLButtonElement>('#cloze-job-tabs button')].find((button) => button.textContent?.startsWith('Wszystkie'))!;
    allTab.click();
    assert.match(window.document.getElementById('cloze-jobs')!.textContent!, /2 z 5 znaczeń wymagających ćwiczeń/);
    assert.equal(window.document.querySelectorAll('#cloze-jobs button').length, 0);
    const refresh = window.document.getElementById('cloze-history-refresh') as HTMLButtonElement;
    assert.equal(refresh.disabled, false);
    assert.equal(refresh.classList.contains('secondary'), false, 'refresh should not look disabled');
    const beforeRefresh = historyReads;
    refresh.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(historyReads, beforeRefresh + 1);
    assert.equal(refresh.textContent, 'Odśwież stan');
    assert.equal(window.document.getElementById('cloze-history-status'), null);
  } finally { dom.window.close(); }
});

test('generation failure is shown once per meaning and offers a retry', async () => {
  const html = await readFile(join(process.cwd(), 'public/cloze.html'), 'utf8');
  const script = await readFile(join(process.cwd(), 'dist/browser/cloze.js'), 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost/cloze.html', runScripts: 'outside-only' });
  try {
    let retried = 0;
    const failure = { id: 'session-failed', status: 'failed', requestedCount: 10, completedCount: 0, missingCount: 1, generation: { processed: 1, total: 5 }, failures: Object.fromEntries([1, 2, 3, 4].map((position) => [`sense:1:${position}`, 'Nie udało się połączyć z OpenAI.'])), failureLabels: { sense: 'pagnotta — utrzymanie' }, current: null, finished: true };
    (dom.window as any).fetch = async (path: string, options?: RequestInit) => {
      if (path === '/api/study/overview') return { ok: true, json: async () => ({ dueCount: 0, reinforcementCount: 0, newCount: 1 }) };
      if (path === '/api/cloze/sessions' && !options?.method) return { ok: true, json: async () => [{ ...failure, createdAt: '2026-11-03T10:00:00.000Z' }] };
      if (path.endsWith('/retry-generation')) {
        retried += 1;
        return { ok: true, json: async () => ({ ...failure, status: 'queued', missingCount: 1, generation: { processed: 0, total: 1 }, failures: {}, finished: false }) };
      }
      return { ok: true, json: async () => failure };
    };
    dom.window.eval(script);
    (dom.window.document.getElementById('cloze-start-form') as HTMLFormElement).dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(dom.window.document.querySelectorAll('#cloze-failures li').length, 1);
    assert.equal(dom.window.document.getElementById('cloze-failures')!.textContent!.includes('sense:1:1'), false);
    assert.match(dom.window.document.getElementById('cloze-failures')!.textContent!, /pagnotta — utrzymanie/);
    assert.doesNotMatch(dom.window.document.getElementById('cloze-failures')!.textContent!, /Znaczenie 1/);
    assert.match(dom.window.document.getElementById('cloze-jobs')!.textContent!, /1 z 5 znaczeń wymagających ćwiczeń/);
    assert.match(dom.window.document.getElementById('cloze-jobs')!.textContent!, /Brak ćwiczeń dla 1 znaczenia: pagnotta — utrzymanie/);
    assert.equal(dom.window.document.getElementById('cloze-progress')!.textContent, 'Przygotowywanie przerwane');
    assert.equal(dom.window.document.getElementById('cloze-generation')!.textContent, '');
    const retryButton = dom.window.document.getElementById('cloze-generation-retry') as HTMLButtonElement;
    assert.equal(retryButton.hidden, false);
    retryButton.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(retried, 1);
    assert.equal((dom.window.document.getElementById('cloze-new') as HTMLButtonElement).disabled, true);
    assert.equal(dom.window.document.getElementById('cloze-new')!.textContent, 'Poczekaj');
  } finally { dom.window.close(); }
});

test('history never substitutes session size for a missing generation total', async () => {
  const html = await readFile(join(process.cwd(), 'public/cloze.html'), 'utf8');
  const script = await readFile(join(process.cwd(), 'dist/browser/cloze.js'), 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost/cloze.html', runScripts: 'outside-only' });
  try {
    (dom.window as any).fetch = async (path: string) => ({ ok: true, json: async () => path === '/api/study/overview'
      ? { dueCount: 0, reinforcementCount: 0, newCount: 0 }
      : [{ id: 'older', createdAt: '2026-11-03T10:00:00.000Z', status: 'failed', requestedCount: 10, generation: { processed: 2 }, failures: {} }] });
    dom.window.eval(script);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.match(dom.window.document.getElementById('cloze-jobs')!.textContent!, /Brak zapisanego postępu/);
    assert.doesNotMatch(dom.window.document.getElementById('cloze-jobs')!.textContent!, /2 z 10/);
  } finally { dom.window.close(); }
});

test('refresh requested during a history read starts another read', async () => {
  const html = await readFile(join(process.cwd(), 'public/cloze.html'), 'utf8');
  const script = await readFile(join(process.cwd(), 'dist/browser/cloze.js'), 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost/cloze.html', runScripts: 'outside-only' });
  try {
    let release!: () => void;
    const first = new Promise<void>((resolve) => { release = resolve; });
    let reads = 0;
    (dom.window as any).fetch = async (path: string) => {
      if (path === '/api/study/overview') return { ok: true, json: async () => ({ dueCount: 0, reinforcementCount: 0, newCount: 0 }) };
      reads += 1;
      if (reads === 1) await first;
      return { ok: true, json: async () => [] };
    };
    dom.window.eval(script);
    const refresh = dom.window.document.getElementById('cloze-history-refresh') as HTMLButtonElement;
    refresh.click();
    assert.equal(refresh.textContent, 'Odświeżanie…');
    release();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(reads, 2);
    assert.equal(refresh.disabled, false);
    assert.equal(refresh.textContent, 'Odśwież stan');
  } finally { dom.window.close(); }
});

test('failed study overview shows an error instead of empty cloze counters', async () => {
  const html = await readFile(join(process.cwd(), 'public/cloze.html'), 'utf8');
  const script = await readFile(join(process.cwd(), 'dist/browser/cloze.js'), 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost/cloze.html', runScripts: 'outside-only' });
  try {
    (dom.window as any).fetch = async (path: string) => path === '/api/study/overview'
      ? { ok: false, status: 503, json: async () => ({ message: 'Serwer niedostępny.' }) }
      : { ok: true, json: async () => [] };
    dom.window.eval(script);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(dom.window.document.getElementById('cloze-overview-due')!.textContent, 'Błąd');
    assert.equal(dom.window.document.getElementById('cloze-session-reinforcement')!.textContent, 'Błąd');
    assert.match(dom.window.document.getElementById('cloze-overview-note')!.textContent!, /Nie udało się pobrać liczników/);
  } finally { dom.window.close(); }
});
