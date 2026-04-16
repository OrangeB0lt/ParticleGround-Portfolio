/**
 * Easter egg input system tests.
 * Covers: buffer accumulation, backspace, ESC, Enter (recognized/unrecognized),
 * mode guard (easter mode blocks input), timer reset on each keystroke,
 * clearEgg(), and command recognition against EGG_COMMANDS set.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDOM } from './setup.js';

setupDOM();

const { state, handleEggKey, clearEgg, EGG_COMMANDS } = await import('../js/main.js');

function resetState() {
  state.mode       = 'menu';
  state.eggBuffer  = '';
  state.eggTimer   = null;
  state.eggOverlay = null;
  state.prevMode   = 'menu';
}

// ── clearEgg() ────────────────────────────────────────────────────────────────

describe('clearEgg()', () => {
  beforeEach(resetState);

  it('clears eggBuffer', () => {
    state.eggBuffer = 'hello';
    clearEgg();
    assert.strictEqual(state.eggBuffer, '');
  });

  it('cancels pending eggTimer', () => {
    state.eggTimer = setTimeout(() => {}, 9999);
    assert.ok(state.eggTimer !== null);
    clearEgg();
    assert.strictEqual(state.eggTimer, null);
  });

  it('is idempotent on empty buffer', () => {
    clearEgg();
    clearEgg();
    assert.strictEqual(state.eggBuffer, '');
  });
});

// ── handleEggKey() — character accumulation ──────────────────────────────────

describe('handleEggKey() — buffer accumulation', () => {
  beforeEach(resetState);

  it('appends a single letter to eggBuffer', () => {
    handleEggKey('m');
    assert.strictEqual(state.eggBuffer, 'm');
  });

  it('accumulates multiple characters in order', () => {
    'matrix'.split('').forEach(c => handleEggKey(c));
    assert.strictEqual(state.eggBuffer, 'matrix');
  });

  it('normalises uppercase input to lowercase', () => {
    handleEggKey('M');
    handleEggKey('A');
    assert.strictEqual(state.eggBuffer, 'ma');
  });

  it('sets eggTimer on each char', () => {
    handleEggKey('a');
    assert.ok(state.eggTimer !== null, 'eggTimer not set after keypress');
  });

  it('ignores non-word characters (space, punctuation)', () => {
    handleEggKey(' ');
    handleEggKey('!');
    handleEggKey('@');
    assert.strictEqual(state.eggBuffer, '');
  });

  it('ignores function-key names like Shift, Control, Alt', () => {
    handleEggKey('Shift');
    handleEggKey('Control');
    assert.strictEqual(state.eggBuffer, '');
  });
});

// ── handleEggKey() — Backspace ────────────────────────────────────────────────

describe('handleEggKey() — Backspace', () => {
  beforeEach(resetState);

  it('removes the last character', () => {
    handleEggKey('h');
    handleEggKey('i');
    handleEggKey('Backspace');
    assert.strictEqual(state.eggBuffer, 'h');
  });

  it('does nothing on empty buffer', () => {
    handleEggKey('Backspace');
    assert.strictEqual(state.eggBuffer, '');
  });

  it('can empty the buffer one char at a time', () => {
    handleEggKey('a');
    handleEggKey('b');
    handleEggKey('Backspace');
    handleEggKey('Backspace');
    assert.strictEqual(state.eggBuffer, '');
  });
});

// ── handleEggKey() — Escape ───────────────────────────────────────────────────

describe('handleEggKey() — Escape', () => {
  beforeEach(resetState);

  it('clears buffer on Escape', () => {
    'lolcow'.split('').forEach(c => handleEggKey(c));
    handleEggKey('Escape');
    assert.strictEqual(state.eggBuffer, '');
  });

  it('cancels timer on Escape', () => {
    handleEggKey('a');
    handleEggKey('Escape');
    assert.strictEqual(state.eggTimer, null);
  });
});

// ── handleEggKey() — Enter with recognised command ───────────────────────────

describe('handleEggKey() — Enter (recognised command)', () => {
  beforeEach(resetState);

  for (const cmd of ['matrix', 'starwars', 'lolcow', 'nyan', 'sudo', 'hack', 'help']) {
    it(`"${cmd}" sets state.mode to easter and clears buffer`, () => {
      cmd.split('').forEach(c => handleEggKey(c));
      assert.strictEqual(state.eggBuffer, cmd);
      handleEggKey('Enter');
      assert.strictEqual(state.eggBuffer, '', 'Buffer not cleared after Enter');
      assert.strictEqual(state.mode, 'easter', 'mode not set to easter');
      // reset mode so other tests are unaffected
      state.mode = 'menu';
    });
  }
});

// ── handleEggKey() — Enter with unrecognised command ─────────────────────────

describe('handleEggKey() — Enter (unrecognised command)', () => {
  beforeEach(resetState);

  it('clears buffer synchronously before eggNotFound runs', () => {
    'notarealcmd'.split('').forEach(c => handleEggKey(c));
    handleEggKey('Enter');
    assert.strictEqual(state.eggBuffer, '');
  });

  it('does not change mode to easter', () => {
    state.mode = 'menu';
    'badcmd'.split('').forEach(c => handleEggKey(c));
    handleEggKey('Enter');
    assert.notStrictEqual(state.mode, 'easter');
  });

  it('Enter on empty buffer is a no-op', () => {
    state.mode = 'section';
    handleEggKey('Enter');
    assert.strictEqual(state.mode, 'section');
  });
});

// ── handleEggKey() — easter mode guard ───────────────────────────────────────

describe('handleEggKey() — easter mode guard', () => {
  beforeEach(resetState);

  it('ignores all input when mode is easter', () => {
    state.mode = 'easter';
    handleEggKey('m');
    handleEggKey('a');
    handleEggKey('t');
    assert.strictEqual(state.eggBuffer, '', 'Buffer should stay empty in easter mode');
  });

  it('ignores Enter when mode is easter', () => {
    state.mode = 'easter';
    state.eggBuffer = 'matrix';
    handleEggKey('Enter');
    assert.strictEqual(state.eggBuffer, 'matrix', 'Buffer should be unmodified');
  });
});

// ── EGG_COMMANDS set membership ───────────────────────────────────────────────

describe('EGG_COMMANDS set membership', () => {
  const expectedCmds = ['matrix', 'starwars', 'lolcow', 'nyan', 'sudo', 'hack', 'help'];

  it('every expected command is recognised', () => {
    for (const cmd of expectedCmds) {
      assert.ok(EGG_COMMANDS.has(cmd), `"${cmd}" not in EGG_COMMANDS`);
    }
  });

  it('common mistyped variants are NOT recognised', () => {
    const typos = ['matix', 'star wars', 'lol cow', 'Help', 'SUDO', 'nyan ', ' hack'];
    for (const t of typos) {
      assert.ok(!EGG_COMMANDS.has(t), `"${t}" should not be a command`);
    }
  });
});
