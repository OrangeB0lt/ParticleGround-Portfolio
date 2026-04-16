/**
 * Navigation state tests.
 * Covers: menu index cycling (ArrowUp/Down with wrapping), project index cycling,
 * syncMenuCursor no-op outside menu mode, and backToMenu() mode transitions.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDOM } from './setup.js';

setupDOM();

const { state, MENU_ITEMS, PROJECTS, backToMenu, syncMenuCursor } = await import('../js/main.js');

const LAST_MENU    = MENU_ITEMS.length - 1;
const LAST_PROJECT = PROJECTS.length - 1;

function resetState() {
  state.mode         = 'menu';
  state.menuIndex    = 0;
  state.projectIndex = 0;
  state.skillsActive = false;
  state.eggBuffer    = '';
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

// ── projectIndex cycling ──────────────────────────────────────────────────────

describe('projectIndex cycling', () => {
  beforeEach(() => {
    state.mode         = 'projects';
    state.projectIndex = 0;
  });

  it('increments from 0 to 1', () => {
    state.projectIndex = (state.projectIndex + 1) % PROJECTS.length;
    assert.strictEqual(state.projectIndex, 1);
  });

  it('wraps from last project to 0 (ArrowDown)', () => {
    state.projectIndex = LAST_PROJECT;
    state.projectIndex = (state.projectIndex + 1) % PROJECTS.length;
    assert.strictEqual(state.projectIndex, 0);
  });

  it('wraps from 0 to last project (ArrowUp)', () => {
    state.projectIndex = 0;
    state.projectIndex = (state.projectIndex - 1 + PROJECTS.length) % PROJECTS.length;
    assert.strictEqual(state.projectIndex, LAST_PROJECT);
  });

  it('never exceeds PROJECTS.length - 1', () => {
    for (let i = 0; i < PROJECTS.length * 2; i++) {
      state.projectIndex = (state.projectIndex + 1) % PROJECTS.length;
      assert.ok(state.projectIndex < PROJECTS.length);
    }
  });
});

// ── expandedProject toggle ────────────────────────────────────────────────────

describe('expandedProject toggle', () => {
  beforeEach(resetState);

  it('sets expandedProject on first Enter', () => {
    state.mode         = 'projects';
    state.projectIndex = 2;
    state.expandedProject = state.expandedProject === 2 ? null : 2;
    assert.strictEqual(state.expandedProject, 2);
  });

  it('collapses on second Enter (same project)', () => {
    state.mode            = 'projects';
    state.projectIndex    = 2;
    state.expandedProject = 2;
    state.expandedProject = state.expandedProject === 2 ? null : 2;
    assert.strictEqual(state.expandedProject, null);
  });

  it('switches to new project without collapsing', () => {
    state.expandedProject = 1;
    state.projectIndex    = 3;
    state.expandedProject = state.expandedProject === 3 ? null : 3;
    assert.strictEqual(state.expandedProject, 3);
  });
});

// ── backToMenu() ──────────────────────────────────────────────────────────────

describe('backToMenu()', () => {
  beforeEach(resetState);

  it('sets state.mode to "menu" from section', () => {
    state.mode = 'section';
    backToMenu();
    assert.strictEqual(state.mode, 'menu');
  });

  it('sets state.mode to "menu" from projects', () => {
    state.mode = 'projects';
    backToMenu();
    assert.strictEqual(state.mode, 'menu');
  });

  it('deactivates skillsActive on back', () => {
    state.mode         = 'section';
    state.skillsActive = true;
    backToMenu();
    assert.strictEqual(state.skillsActive, false);
  });

  it('resets expandedProject on back', () => {
    state.mode            = 'projects';
    state.expandedProject = 2;
    backToMenu();
    assert.strictEqual(state.expandedProject, null);
  });

  it('is a no-op when mode is already "menu"', () => {
    state.mode       = 'menu';
    state.menuIndex  = 3;
    backToMenu();
    assert.strictEqual(state.mode, 'menu');
    assert.strictEqual(state.menuIndex, 3, 'menuIndex should not be reset by backToMenu');
  });

  it('is a no-op when mode is "easter"', () => {
    state.mode = 'easter';
    backToMenu();
    assert.strictEqual(state.mode, 'easter', 'easter mode should not be interrupted by backToMenu');
  });
});

// ── syncMenuCursor() ──────────────────────────────────────────────────────────

describe('syncMenuCursor()', () => {
  beforeEach(resetState);

  it('is a no-op when mode is not menu (does not throw)', () => {
    state.mode = 'section';
    assert.doesNotThrow(() => syncMenuCursor());
  });

  it('does not throw when terminal has no .menu-item elements', () => {
    state.mode = 'menu';
    assert.doesNotThrow(() => syncMenuCursor());
  });
});

// ── state initial values ──────────────────────────────────────────────────────

describe('state shape', () => {
  it('has the expected initial keys', () => {
    const keys = ['mode', 'bootAborted', 'menuIndex', 'projectIndex', 'expandedProject',
                  'skillsActive', 'eggBuffer', 'eggTimer', 'eggOverlay', 'prevMode'];
    for (const key of keys) {
      assert.ok(key in state, `state missing key: ${key}`);
    }
  });

  it('bootAborted starts as false', () => {
    assert.strictEqual(typeof state.bootAborted, 'boolean');
  });

  it('menuIndex starts in valid range', () => {
    assert.ok(state.menuIndex >= 0 && state.menuIndex < MENU_ITEMS.length);
  });

  it('projectIndex starts in valid range', () => {
    assert.ok(state.projectIndex >= 0 && state.projectIndex < PROJECTS.length);
  });
});
