/**
 * Utility function tests.
 * Covers: delay() normal timing and bootAborted fast-path,
 * typeText() character-by-character accumulation and abort fast-forward.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDOM, createEl } from './setup.js';

setupDOM();

const { state, delay, typeText } = await import('../js/main.js');

function resetState() {
  state.bootAborted = false;
  state.mode        = 'menu';
}

// ── delay() ───────────────────────────────────────────────────────────────────

describe('delay()', () => {
  beforeEach(resetState);

  it('resolves after approximately the requested time', async () => {
    const start = Date.now();
    await delay(80);
    const elapsed = Date.now() - start;
    assert.ok(elapsed >= 70, `Resolved too early: ${elapsed}ms`);
    assert.ok(elapsed < 300, `Took too long: ${elapsed}ms`);
  });

  it('resolves immediately when bootAborted is true', async () => {
    state.bootAborted = true;
    const start = Date.now();
    await delay(5000);
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 50, `Should be instant when aborted, took ${elapsed}ms`);
  });

  it('returns a Promise', () => {
    const result = delay(0);
    assert.ok(result instanceof Promise);
  });

  it('resolves even with delay(0)', async () => {
    await assert.doesNotReject(async () => { await delay(0); });
  });

  it('checks bootAborted at call time, not later', async () => {
    state.bootAborted = false;
    const p = delay(30);
    state.bootAborted = true;
    await p;
    state.bootAborted = false;
  });
});

// ── typeText() ────────────────────────────────────────────────────────────────

describe('typeText()', () => {
  beforeEach(resetState);

  it('appends all characters to element textContent', async () => {
    const el = createEl();
    el.textContent = '';
    await typeText(el, 'HELLO', 0);
    assert.strictEqual(el.textContent, 'HELLO');
  });

  it('appends to existing textContent (does not overwrite)', async () => {
    const el = createEl();
    el.textContent = 'PRE:';
    await typeText(el, 'ABC', 0);
    assert.strictEqual(el.textContent, 'PRE:ABC');
  });

  it('handles empty string without error', async () => {
    const el = createEl();
    el.textContent = '';
    await typeText(el, '', 0);
    assert.strictEqual(el.textContent, '');
  });

  it('appends the full string immediately when bootAborted is true', async () => {
    state.bootAborted = true;
    const el = createEl();
    el.textContent = '';
    const start = Date.now();
    await typeText(el, 'FAST', 100);
    const elapsed = Date.now() - start;
    assert.strictEqual(el.textContent, 'FAST');
    assert.ok(elapsed < 100, `Should be instant when aborted, took ${elapsed}ms`);
    state.bootAborted = false;
  });

  it('handles single-character strings', async () => {
    const el = createEl();
    el.textContent = '';
    await typeText(el, 'X', 0);
    assert.strictEqual(el.textContent, 'X');
  });

  it('handles strings with special characters', async () => {
    const el = createEl();
    el.textContent = '';
    await typeText(el, '!@#$%', 0);
    assert.strictEqual(el.textContent, '!@#$%');
  });

  it('preserves character order', async () => {
    const el = createEl();
    el.textContent = '';
    const str = 'abcdefghijklmnopqrstuvwxyz';
    await typeText(el, str, 0);
    assert.strictEqual(el.textContent, str);
  });
});
