import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';

test('study screen shows counters, full sense, rating controls, and returns to overview', async () => {
  const html = await readFile(join(process.cwd(), 'public/study.html'), 'utf8');
  const script = await readFile(join(process.cwd(), 'dist/browser/study.js'), 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost/study.html', runScripts: 'outside-only' });
  try {
    const window = dom.window;
    Object.defineProperty(window.crypto, 'randomUUID', { value: randomUUID });
    const seen: string[] = [];
    const candidate = {
      lexicalSenseId: 'sense-1', kind: 'new', presentationToken: 'a'.repeat(64),
      sense: { lexical_item_it: 'casa', definition_it: 'abitazione', details: {
        part_of_speech: 'noun', definition_pl: 'dom', glosses_pl: ['dom'], usage: { register: 'neutral', patterns_it: [], collocations_it: [], constraints_pl: [] },
        examples: [{ sentence_it: 'Sono a casa.', translation_pl: 'Jestem w domu.', origin: 'authored' }],
        evidence: { e1: { source_type: 'dictionary', locator: 'https://example.org', supports: ['meaning'] } },
      } },
    };
    (window as any).fetch = async (path: string, options?: RequestInit) => {
      seen.push(`${options?.method || 'GET'} ${path}`);
      const data = path.endsWith('/overview') ? { dueCount: 0, reinforcementCount: seen.some((entry) => entry.startsWith('POST')) ? 0 : 0, newCount: seen.some((entry) => entry.startsWith('POST')) ? 0 : 1, nextDueAt: null }
        : options?.method === 'POST' ? { dueCount: 0, reinforcementCount: 0, newCount: 0, nextDueAt: null, candidate: null, accepted: {} }
          : { dueCount: 0, reinforcementCount: 0, newCount: 1, nextDueAt: null, candidate };
      return { ok: true, json: async () => data };
    };
    window.eval(script);
    const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
    await settle();
    assert.equal(window.document.getElementById('overview-due')!.textContent, '0');
    assert.equal(window.document.getElementById('overview-new')!.textContent, '1');
    assert.equal(window.document.querySelectorAll('#overview .study-counter').length, 2);
    (window.document.getElementById('start') as HTMLElement).click();
    await settle();
    assert.equal(window.document.getElementById('session')!.hidden, false);
    assert.match(window.document.getElementById('study-sense')!.textContent!, /casa.*abitazione.*dom.*Sono a casa.*example.org/s);
    assert.equal(window.document.querySelectorAll('#session .study-counter').length, 3);
    assert.equal(window.document.querySelectorAll('[data-rating]').length, 4);
    (window.document.querySelector('[data-rating="3"]') as HTMLElement).click();
    await settle();
    assert.equal(seen.filter((entry) => entry === 'POST /api/study/attempts').length, 1);
    assert.equal(window.localStorage.getItem('filippo.study.pendingAttempt'), null);
    (window.document.getElementById('pause') as HTMLElement).click();
    await settle();
    assert.equal(window.document.getElementById('overview')!.hidden, false);
    assert.equal(window.document.getElementById('overview-new')!.textContent, '0');
  } finally { dom.window.close(); }
});

test('uncertain transport failure keeps the same event for a safe retry', async () => {
  const html = await readFile(join(process.cwd(), 'public/study.html'), 'utf8');
  const script = await readFile(join(process.cwd(), 'dist/browser/study.js'), 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost/study.html', runScripts: 'outside-only' });
  try {
    const window = dom.window;
    Object.defineProperty(window.crypto, 'randomUUID', { value: randomUUID });
    const submissions: any[] = [];
    (window as any).fetch = async (path: string, options?: RequestInit) => {
      if (options?.method === 'POST') {
        submissions.push(JSON.parse(String(options.body)));
        if (submissions.length === 1) throw new Error('Połączenie przerwane');
        return { ok: true, json: async () => ({ dueCount: 0, reinforcementCount: 0, newCount: 0, nextDueAt: null, candidate: null, accepted: {} }) };
      }
      const candidate = { lexicalSenseId: 'one', kind: 'new', presentationToken: 'b'.repeat(64), sense: { lexical_item_it: 'casa', definition_it: 'abitazione', details: null } };
      return { ok: true, json: async () => path.endsWith('/next') ? { dueCount: 0, reinforcementCount: 0, newCount: 1, nextDueAt: null, candidate } : { dueCount: 0, reinforcementCount: 0, newCount: 1, nextDueAt: null } };
    };
    window.eval(script);
    const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
    await settle();
    (window.document.getElementById('start') as HTMLElement).click();
    await settle();
    (window.document.querySelector('[data-rating="1"]') as HTMLElement).click();
    await settle();
    assert.equal(submissions.length, 1);
    assert.equal((window.document.querySelector('[data-rating="1"]') as HTMLButtonElement).disabled, true);
    assert.ok(window.localStorage.getItem('filippo.study.pendingAttempt'));
    (window.document.getElementById('retry-session') as HTMLElement).click();
    await settle();
    assert.equal(submissions.length, 2);
    assert.equal(submissions[1].eventId, submissions[0].eventId);
    assert.equal(window.localStorage.getItem('filippo.study.pendingAttempt'), null);
  } finally { dom.window.close(); }
});

test('study reset requires confirmation and returns to fresh counters', async () => {
  const html = await readFile(join(process.cwd(), 'public/study.html'), 'utf8');
  const script = await readFile(join(process.cwd(), 'dist/browser/study.js'), 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost/study.html', runScripts: 'outside-only' });
  try {
    const { window } = dom;
    const calls: string[] = [];
    let confirmed = false;
    let failReset = true;
    window.confirm = () => confirmed;
    (window as any).fetch = async (path: string, options?: RequestInit) => {
      calls.push(`${options?.method || 'GET'} ${path}`);
      const reset = path.endsWith('/reset');
      if (reset && failReset) return { ok: false, status: 500, json: async () => ({ message: 'Nie udało się wyczyścić postępu.' }) };
      const data = reset
        ? { dueCount: 0, reinforcementCount: 0, newCount: 2, nextDueAt: null }
        : path.endsWith('/next')
          ? { dueCount: 1, reinforcementCount: 0, newCount: 1, nextDueAt: null, candidate: { lexicalSenseId: 'one', kind: 'due', presentationToken: 'a'.repeat(64), sense: { lexical_item_it: 'casa', definition_it: 'abitazione' } } }
          : { dueCount: 1, reinforcementCount: 0, newCount: 1, nextDueAt: null };
      return { ok: true, json: async () => data };
    };
    window.eval(script);
    const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
    await settle();
    (window.document.getElementById('start') as HTMLElement).click();
    await settle();
    (window.document.querySelector('#session [data-reset-study]') as HTMLElement).click();
    await settle();
    assert.equal(calls.filter((call) => call === 'POST /api/study/reset').length, 0);
    confirmed = true;
    (window.document.querySelector('#session [data-reset-study]') as HTMLElement).click();
    await settle();
    assert.equal(calls.filter((call) => call === 'POST /api/study/reset').length, 1);
    assert.equal(window.document.getElementById('session')!.hidden, false);
    assert.match(window.document.getElementById('error')!.textContent!, /Nie udało się wyczyścić postępu/);
    failReset = false;
    (window.document.querySelector('#session [data-reset-study]') as HTMLElement).click();
    await settle();
    assert.equal(calls.filter((call) => call === 'POST /api/study/reset').length, 2);
    assert.equal(window.document.getElementById('session')!.hidden, true);
    assert.equal(window.document.getElementById('overview')!.hidden, false);
    assert.equal(window.document.getElementById('overview-due')!.textContent, '0');
    assert.equal(window.document.getElementById('overview-new')!.textContent, '2');
    assert.equal(window.localStorage.getItem('filippo.study.started'), null);
    assert.match(window.document.getElementById('status')!.textContent!, /Postęp nauki został wyczyszczony/);
  } finally { dom.window.close(); }
});
