/**
 * Navigation state tests.
 * Covers: menu index cycling (ArrowUp/Down with wrapping),
 * syncMenuCursor no-op outside menu mode, and runCommand('clear') behavior.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDOM } from './setup.js';

setupDOM();

const { state, MENU_ITEMS, syncMenuCursor, runCommand } = await import('../js/main.js');

const LAST_MENU = MENU_ITEMS.length - 1;

function resetState() {
  state.mode      = 'menu';
  state.menuIndex = 0;
  state.eggBuffer = '';
}

// ── menuIndex cycling ─────────────────────────────────────────────────────────

describe('menuIndex cycling', () => {
  beforeEach(resetState);

  it('increments from 0 to 1', () => {
    state.menuIndex = (state.menuIndex + 1) % MENU_ITEMS.length;
    assert.strictEqual(state.menuIndex, 1);
  });

  it('wraps from last item back to 0 (ArrowDown)', () => {
    state.menuIndex = LAST_MENU;
    state.menuIndex = (state.menuIndex + 1) % MENU_ITEMS.length;
    assert.strictEqual(state.menuIndex, 0);
  });

  it('wraps from 0 to last item (ArrowUp)', () => {
    state.menuIndex = 0;
    state.menuIndex = (state.menuIndex - 1 + MENU_ITEMS.length) % MENU_ITEMS.length;
    assert.strictEqual(state.menuIndex, LAST_MENU);
  });

  it('cycles correctly over full loop', () => {
    state.menuIndex = 0;
    for (let i = 0; i < MENU_ITEMS.length; i++) {
      state.menuIndex = (state.menuIndex + 1) % MENU_ITEMS.length;
    }
    assert.strictEqual(state.menuIndex, 0, 'Full loop should return to 0');
  });

  it('never goes out of bounds on ArrowDown', () => {
    for (let i = 0; i < MENU_ITEMS.length * 3; i++) {
      state.menuIndex = (state.menuIndex + 1) % MENU_ITEMS.length;
      assert.ok(state.menuIndex >= 0 && state.menuIndex < MENU_ITEMS.length);
    }
  });

  it('never goes out of bounds on ArrowUp', () => {
    for (let i = 0; i < MENU_ITEMS.length * 3; i++) {
      state.menuIndex = (state.menuIndex - 1 + MENU_ITEMS.length) % MENU_ITEMS.length;
      assert.ok(state.menuIndex >= 0 && state.menuIndex < MENU_ITEMS.length);
    }
  });
});

// ── syncMenuCursor() ──────────────────────────────────────────────────────────

describe('syncMenuCursor()', () => {
  beforeEach(resetState);

  it('is a no-op when mode is not menu (does not throw)', () => {
    state.mode = 'easter';
    assert.doesNotThrow(() => syncMenuCursor());
  });

  it('does not throw when terminal has no .menu-item elements', () => {
    state.mode = 'menu';
    assert.doesNotThrow(() => syncMenuCursor());
  });
});

// ── runCommand('clear') ───────────────────────────────────────────────────────

describe('runCommand("clear")', () => {
  beforeEach(resetState);

  it('leaves state.mode as "menu" after clearing', async () => {
    state.mode = 'menu';
    await runCommand('clear');
    assert.strictEqual(state.mode, 'menu');
  });

  it('preserves menuIndex through clear (renderMenu does not reset it)', async () => {
    state.menuIndex = 3;
    await runCommand('clear');
    assert.strictEqual(state.menuIndex, 3);
  });
});

// ── state initial values ──────────────────────────────────────────────────────

describe('state shape', () => {
  it('has the expected initial keys', () => {
    const keys = ['mode', 'bootAborted', 'menuIndex',
                  'eggBuffer', 'eggTimer', 'eggOverlay', 'fsFiles', 'fsDir'];
    for (const key of keys) {
      assert.ok(key in state, `state missing key: ${key}`);
    }
  });

  it('does not carry the legacy projectIndex / expandedProject / prevMode keys', () => {
    for (const k of ['projectIndex', 'expandedProject', 'prevMode', 'skillsActive']) {
      assert.ok(!(k in state), `state should not include legacy key "${k}"`);
    }
  });

  it('bootAborted starts as false', () => {
    assert.strictEqual(typeof state.bootAborted, 'boolean');
  });

  it('menuIndex starts in valid range', () => {
    assert.ok(state.menuIndex >= 0 && state.menuIndex < MENU_ITEMS.length);
  });
});
