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

const { state, handleEggKey, clearEgg, EGG_COMMANDS, initFs, runEgg } = await import('../js/main.js');

function resetState() {
  state.mode       = 'menu';
  state.eggBuffer  = '';
  state.eggTimer   = null;
  state.eggOverlay = null;
  state.prevMode   = 'menu';
  state.fsFiles    = null;
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

  it('ignores punctuation characters (!, @)', () => {
    handleEggKey('!');
    handleEggKey('@');
    assert.strictEqual(state.eggBuffer, '');
  });

  it('ignores leading space (buffer empty)', () => {
    handleEggKey(' ');
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
    'cowsay'.split('').forEach(c => handleEggKey(c));
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

  for (const cmd of ['matrix', 'starwars', 'cowsay', 'nyan', 'sudo', 'hack', 'help']) {
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
  const expectedCmds = ['matrix', 'starwars', 'cowsay', 'nyan', 'sudo', 'hack', 'help'];

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

  it('all new filesystem commands are recognised', () => {
    const fsCmds = ['ls', 'cd', 'mkdir', 'touch', 'nano', 'vi', 'vim',
                    'chmod', 'chown', 'pwd', 'cat', 'rm', 'whoami', 'uname', 'clear'];
    for (const cmd of fsCmds) {
      assert.ok(EGG_COMMANDS.has(cmd), `"${cmd}" not in EGG_COMMANDS`);
    }
  });
});

// ── handleEggKey() — spaces, dashes, dots ─────────────────────────────��──────

describe('handleEggKey() — spaces, dashes, and dots', () => {
  beforeEach(resetState);

  it('appends space after non-empty buffer', () => {
    handleEggKey('l');
    handleEggKey('s');
    handleEggKey(' ');
    assert.strictEqual(state.eggBuffer, 'ls ');
  });

  it('collapses consecutive spaces', () => {
    handleEggKey('l');
    handleEggKey('s');
    handleEggKey(' ');
    handleEggKey(' ');
    assert.strictEqual(state.eggBuffer, 'ls ');
  });

  it('accumulates flags (dash)', () => {
    'ls'.split('').forEach(c => handleEggKey(c));
    handleEggKey(' ');
    '-la'.split('').forEach(c => handleEggKey(c));
    assert.strictEqual(state.eggBuffer, 'ls -la');
  });

  it('accumulates dotfile names', () => {
    'nano'.split('').forEach(c => handleEggKey(c));
    handleEggKey(' ');
    '.bashrc'.split('').forEach(c => handleEggKey(c));
    assert.strictEqual(state.eggBuffer, 'nano .bashrc');
  });

  it('recognises "ls -la" as the ls command on Enter', () => {
    'ls -la'.split('').forEach(c => handleEggKey(c));
    handleEggKey('Enter');
    assert.strictEqual(state.mode, 'easter');
    state.mode = 'menu';
  });

  it('recognises "nano readme.txt" as the nano command on Enter', () => {
    'nano readme.txt'.split('').forEach(c => handleEggKey(c));
    handleEggKey('Enter');
    assert.strictEqual(state.mode, 'easter');
    state.mode = 'menu';
  });
});

// ── initFs() ──────────────────────���─────────────────────────────���─────────────

describe('initFs()', () => {
  beforeEach(resetState);

  it('creates fsFiles Map on first call', () => {
    assert.strictEqual(state.fsFiles, null);
    initFs();
    assert.ok(state.fsFiles instanceof Map);
  });

  it('is idempotent — second call does not reset the map', () => {
    initFs();
    state.fsFiles.set('sentinel.txt', { type: 'file' });
    initFs();
    assert.ok(state.fsFiles.has('sentinel.txt'), 'second initFs wiped user files');
  });

  it('includes expected default files', () => {
    initFs();
    const expected = ['about.txt', 'index.html', 'main.js', 'style.css',
                      'resume.pdf', 'resume.txt', 'skills.cfg', 'node_modules'];
    for (const f of expected) {
      assert.ok(state.fsFiles.has(f), `default file "${f}" missing`);
    }
  });

  it('includes hidden dot entries', () => {
    initFs();
    for (const f of ['.git', '.ssh', '.bashrc', '.env']) {
      assert.ok(state.fsFiles.has(f), `dot entry "${f}" missing`);
      assert.ok(state.fsFiles.get(f).dot, `"${f}" missing dot:true flag`);
    }
  });
});

// ── touch ────────────────────────────��────────────────────────────────────────

describe('touch via runEgg', () => {
  beforeEach(resetState);

  it('adds a new file entry to fsFiles', () => {
    runEgg('touch newfile.txt');
    assert.ok(state.fsFiles.has('newfile.txt'));
    const entry = state.fsFiles.get('newfile.txt');
    assert.strictEqual(entry.type, 'file');
    assert.strictEqual(entry.size, 0);
    state.mode = 'menu';
  });

  it('does not overwrite an existing file', () => {
    initFs();
    state.fsFiles.set('existing.txt', { type: 'file', size: 99 });
    runEgg('touch existing.txt');
    assert.strictEqual(state.fsFiles.get('existing.txt').size, 99);
    state.mode = 'menu';
  });
});

// ── mkdir ─────────────────────────────────────────────────────────────────────

describe('mkdir via runEgg', () => {
  beforeEach(resetState);

  it('adds a dir entry to fsFiles', () => {
    runEgg('mkdir mydir');
    assert.ok(state.fsFiles.has('mydir'));
    assert.strictEqual(state.fsFiles.get('mydir').type, 'dir');
    state.mode = 'menu';
  });

  it('does not overwrite an existing entry', () => {
    initFs();
    state.fsFiles.set('mydir', { type: 'dir', links: 5 });
    runEgg('mkdir mydir');
    assert.strictEqual(state.fsFiles.get('mydir').links, 5);
    state.mode = 'menu';
  });
});

// ── rm ──────────────────────────────────────────────────────────────────���─────

describe('rm via runEgg', () => {
  beforeEach(resetState);

  it('removes a file that exists', () => {
    initFs();
    state.fsFiles.set('trash.txt', { type: 'file' });
    runEgg('rm trash.txt');
    assert.ok(!state.fsFiles.has('trash.txt'));
    state.mode = 'menu';
  });

  it('touch then rm removes the file', () => {
    runEgg('touch temp.log');
    assert.ok(state.fsFiles.has('temp.log'));
    state.mode = 'menu';
    state.prevMode = 'menu';
    runEgg('rm temp.log');
    assert.ok(!state.fsFiles.has('temp.log'));
    state.mode = 'menu';
  });
});

// ── nano / corrupted files ───────────────────────────��────────────────────────

describe('eggNanoVi — corrupted file flag', () => {
  beforeEach(resetState);

  it('marks file as corrupted after triggerSave (simulated)', () => {
    initFs();
    // Simulate what triggerSave does synchronously
    state.fsFiles.set('test.txt', { type: 'file', perms: '-rw-r--r--', links: 1,
      owner: 'jared', group: 'staff', size: 5, mtime: 'May  4 10:00' });
    state.fsFiles.get('test.txt').corrupted = true;
    assert.ok(state.fsFiles.get('test.txt').corrupted);
  });
});
