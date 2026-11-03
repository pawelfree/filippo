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
    (window as any).fetch = async (_path: string, options?: RequestInit) => {
      if (options?.method === 'POST' && _path.endsWith('/answers')) {
        submitted.push(JSON.parse(String(options.body)));
        return { ok: true, json: async () => ({ id: 'session-1', status: 'ready', requestedCount: 1, completedCount: 1, failures: {}, current: null, finished: true, accepted: { correct: true, rating: 4 } }) };
      }
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
    assert.equal(window.document.getElementById('cloze-card')!.hidden, true);
    assert.equal(window.document.getElementById('cloze-progress')!.textContent, '1 z 1 znaczeń');
  } finally { dom.window.close(); }
});
