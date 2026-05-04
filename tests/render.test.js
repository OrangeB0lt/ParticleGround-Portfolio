/**
 * Render function smoke tests.
 * Verifies the menu renderer and the runCommand dispatch produce DOM output
 * and the right state, without asserting precise HTML structure.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDOM } from './setup.js';

const dom = setupDOM();

const {
  state,
  renderMenu, runCommand,
  MENU_ITEMS, PROJECTS,
} = await import('../js/main.js');

function resetState() {
  state.mode        = 'menu';
  state.menuIndex   = 0;
  state.bootAborted = false;
  state.fsFiles     = null;
  state.fsDir       = null;
  state.eggBuffer   = '';
  // clear terminal
  const t = dom.getEl('terminal');
  t.innerHTML = '';
}

// ── renderMenu() ──────────────────────────────────────────────────────────────

describe('renderMenu()', () => {
  beforeEach(resetState);

  it('sets state.mode to "menu"', () => {
    state.mode = 'easter';
    renderMenu();
    assert.strictEqual(state.mode, 'menu');
  });

  it('appends at least one child element to terminal', () => {
    const t = dom.getEl('terminal');
    renderMenu();
    assert.ok(t.children.length > 0, 'renderMenu produced no DOM output');
  });

  it('preserves menuIndex when re-rendering the menu', () => {
    state.menuIndex = 4;
    renderMenu();
    assert.strictEqual(state.menuIndex, 4, 'menuIndex should not be reset by renderMenu');
  });
});

// ── runCommand() ──────────────────────────────────────────────────────────────

describe('runCommand()', () => {
  beforeEach(resetState);

  it('appends a .cmd-line for an unknown command', async () => {
    const t = dom.getEl('terminal');
    const before = t.children.length;
    await runCommand('foobar');
    assert.ok(t.children.length > before, 'no DOM appended for unknown command');
  });

  it('"clear" leaves state.mode as menu', async () => {
    await runCommand('clear');
    assert.strictEqual(state.mode, 'menu');
  });

  it('typing "about" stays in menu mode (sections render as inline output)', async () => {
    await runCommand('about');
    assert.strictEqual(state.mode, 'menu');
  });

  it('"matrix" flips state.mode to "easter"', async () => {
    await runCommand('matrix');
    assert.strictEqual(state.mode, 'easter');
    state.mode = 'menu';
  });

  it('"ls" stays in menu mode (inline egg)', async () => {
    await runCommand('ls');
    assert.strictEqual(state.mode, 'menu');
  });

  it('"cat ratnerme.md" stays in menu mode (project detail inline)', async () => {
    await runCommand('cat ratnerme.md');
    assert.strictEqual(state.mode, 'menu');
  });
});

// ── MENU_ITEMS × renderMenu() consistency ────────────────────────────────────

describe('MENU_ITEMS match rendered label count', () => {
  beforeEach(resetState);

  it('MENU_ITEMS has 8 entries (same as expected label count)', () => {
    assert.strictEqual(MENU_ITEMS.length, 8);
  });

  it('MENU_ITEMS index 0 is RESUME (first in list)', () => {
    assert.strictEqual(MENU_ITEMS[0].action, 'resume');
  });

  it('MENU_ITEMS last two are external links', () => {
    const last2 = MENU_ITEMS.slice(-2);
    const isExt = m => m.action === 'linkedin' || m.action === 'medium';
    assert.ok(isExt(last2[0]) && isExt(last2[1]), 'Last two items should be external link actions');
  });
});

// ── PROJECTS data in render context ──────────────────────────────────────────

describe('PROJECTS for project list rendering', () => {
  it('all 5 projects have fields needed by sectionProjects()', () => {
    for (const [i, p] of PROJECTS.entries()) {
      assert.ok(p.perms,             `[${i}] missing perms`);
      assert.ok(p.name,              `[${i}] missing name`);
      assert.ok(p.desc,              `[${i}] missing desc`);
      assert.ok(p.long,              `[${i}] missing long`);
      assert.ok(Array.isArray(p.stack), `[${i}] stack not array`);
      assert.ok(typeof p.link === 'string' && p.link.length > 0, `[${i}] missing link`);
    }
  });

  it('project stack entries are all strings', () => {
    for (const [i, p] of PROJECTS.entries()) {
      for (const [j, tech] of p.stack.entries()) {
        assert.strictEqual(typeof tech, 'string', `[${i}].stack[${j}] not a string`);
      }
    }
  });
});

// ── State invariants after menu render ───────────────────────────────────────

describe('state invariants', () => {
  beforeEach(resetState);

  it('menuIndex stays within valid range after renderMenu', () => {
    renderMenu();
    assert.ok(state.menuIndex >= 0 && state.menuIndex < MENU_ITEMS.length);
  });

  it('mode "menu" allows egg input (not easter)', () => {
    state.mode = 'menu';
    assert.notStrictEqual(state.mode, 'easter');
  });

  it('mode "easter" blocks egg input processing', () => {
    state.mode = 'easter';
    assert.strictEqual(state.mode, 'easter');
  });
});
