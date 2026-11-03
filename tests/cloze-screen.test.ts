import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';

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
      if (_path === '/api/cloze/overview') return { ok: true, json: async () => ({ dueCount: 0, reinforcementCount: 0, newCount: 1 }) };
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
    assert.match(window.document.getElementById('cloze-feedback')!.textContent!, /La pioggia ha dato una tregua\./);
    assert.match(window.document.getElementById('cloze-feedback')!.textContent!, /Easy/);
    assert.equal(window.document.getElementById('cloze-next')!.hidden, false);
    (window.document.getElementById('cloze-next') as HTMLButtonElement).click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(window.document.getElementById('cloze-card')!.hidden, true);
    assert.equal(window.document.getElementById('cloze-progress')!.textContent, '1 z 1 znaczeń');
  } finally { dom.window.close(); }
});

test('missing saved cloze session returns to the start form', async () => {
  const html = await readFile(join(process.cwd(), 'public/cloze.html'), 'utf8');
  const script = await readFile(join(process.cwd(), 'dist/browser/cloze.js'), 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost/cloze.html', runScripts: 'outside-only' });
  try {
    const { window } = dom;
    window.localStorage.setItem('filippo.cloze.session', 'deleted-session');
    (window as any).fetch = async (path: string) => path === '/api/cloze/overview'
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
      if (path === '/api/cloze/overview') return { ok: true, json: async () => ({ dueCount: 1, reinforcementCount: 0, newCount: 1 }) };
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
    assert.equal(window.document.getElementById('cloze-progress')!.textContent, '1 z 2 znaczeń');
    const resume = new JSDOM(html, { url: 'http://localhost/cloze.html', runScripts: 'outside-only' });
    try {
      resume.window.localStorage.setItem('filippo.cloze.session', 'session-2');
      resume.window.localStorage.setItem('filippo.cloze.feedback', window.localStorage.getItem('filippo.cloze.feedback')!);
      (resume.window as any).fetch = async (path: string) => ({ ok: true, json: async () => path === '/api/cloze/sessions' ? [] : path === '/api/cloze/overview' ? { dueCount: 1, reinforcementCount: 0, newCount: 1 } : advanced });
      resume.window.eval(script);
      await new Promise((resolve) => setTimeout(resolve, 0));
      assert.equal(resume.window.document.getElementById('cloze-polish')!.textContent, 'Krótka przerwa.');
      assert.equal(resume.window.document.getElementById('cloze-solution')!.textContent, 'La tregua è breve.');
    } finally { resume.window.close(); }
    (window.document.getElementById('cloze-next') as HTMLButtonElement).click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(window.document.getElementById('cloze-polish')!.textContent, 'Długi dzień.');
    assert.equal(window.document.getElementById('cloze-feedback')!.hidden, true);
    assert.equal(window.document.getElementById('cloze-progress')!.textContent, '2 z 2 znaczeń');
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
      if (path === '/api/cloze/overview') return { ok: true, json: async () => ({ dueCount: 2, reinforcementCount: 1, newCount: 3 }) };
      if (path === '/api/cloze/sessions' && !options?.method) historyReads += 1;
      return { ok: true, json: async () => path === '/api/cloze/sessions' && !options?.method ? [{ ...running, createdAt: '2026-11-03T10:00:00.000Z' }] : running };
    };
    window.eval(script);
    (window.document.getElementById('cloze-start-form') as HTMLFormElement).dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(window.document.getElementById('cloze-progress')!.textContent, '0 z 5 znaczeń');
    assert.match(window.document.getElementById('cloze-generation')!.textContent!, /Trwa generowanie.*Przetworzono: 2 z 5 zestawów/);
    assert.match(window.document.getElementById('cloze-jobs')!.textContent!, /Generowanie.*2 z 5 zestawów/);
    assert.equal(window.document.querySelectorAll('#cloze-job-tabs button').length, 5);
    assert.equal(window.document.getElementById('cloze-overview-due')!.textContent, '2');
    assert.equal(window.document.getElementById('cloze-session-reinforcement')!.textContent, '1');
    const queuedTab = [...window.document.querySelectorAll<HTMLButtonElement>('#cloze-job-tabs button')].find((button) => button.textContent?.startsWith('W kolejce'))!;
    queuedTab.click();
    assert.match(window.document.getElementById('cloze-jobs')!.textContent!, /Brak zleceń w tym stanie/);
    const allTab = [...window.document.querySelectorAll<HTMLButtonElement>('#cloze-job-tabs button')].find((button) => button.textContent?.startsWith('Wszystkie'))!;
    allTab.click();
    assert.match(window.document.getElementById('cloze-jobs')!.textContent!, /2 z 5 zestawów/);
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

test('refresh requested during a history read starts another read', async () => {
  const html = await readFile(join(process.cwd(), 'public/cloze.html'), 'utf8');
  const script = await readFile(join(process.cwd(), 'dist/browser/cloze.js'), 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost/cloze.html', runScripts: 'outside-only' });
  try {
    let release!: () => void;
    const first = new Promise<void>((resolve) => { release = resolve; });
    let reads = 0;
    (dom.window as any).fetch = async (path: string) => {
      if (path === '/api/cloze/overview') return { ok: true, json: async () => ({ dueCount: 0, reinforcementCount: 0, newCount: 0 }) };
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
