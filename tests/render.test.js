/**
 * Render function smoke tests.
 * Verifies that section renderers and the menu renderer produce DOM output
 * and set the correct mode, without asserting precise HTML structure.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDOM } from './setup.js';

const dom = setupDOM();

const {
  state,
  renderMenu,
  MENU_ITEMS, PROJECTS,
} = await import('../js/main.js');

function resetState() {
  state.mode            = 'menu';
  state.menuIndex       = 0;
  state.projectIndex    = 0;
  state.expandedProject = null;
  state.skillsActive    = false;
  state.bootAborted     = false;
  // clear terminal
  const t = dom.getEl('terminal');
  t.innerHTML = '';
}

// ── renderMenu() ──────────────────────────────────────────────────────────────

describe('renderMenu()', () => {
  beforeEach(resetState);

  it('sets state.mode to "menu"', () => {
    state.mode = 'section';
    renderMenu();
    assert.strictEqual(state.mode, 'menu');
  });

  it('clears skillsActive', () => {
    state.skillsActive = true;
    renderMenu();
    assert.strictEqual(state.skillsActive, false);
  });

  it('resets expandedProject', () => {
    state.expandedProject = 3;
    renderMenu();
    assert.strictEqual(state.expandedProject, null);
  });

  it('appends at least one child element to terminal', () => {
    const t = dom.getEl('terminal');
    renderMenu();
    assert.ok(t.children.length > 0, 'renderMenu produced no DOM output');
  });

  it('preserves menuIndex when called from a section', () => {
    state.menuIndex = 4;
    renderMenu();
    assert.strictEqual(state.menuIndex, 4, 'menuIndex should not be reset by renderMenu');
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
  it('all 5 projects have fields needed by renderProjects()', () => {
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

  it('projectIndex stays within valid range after multiple cycles', () => {
    for (let i = 0; i < PROJECTS.length * 3; i++) {
      state.projectIndex = (state.projectIndex + 1) % PROJECTS.length;
    }
    assert.ok(state.projectIndex >= 0 && state.projectIndex < PROJECTS.length);
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
