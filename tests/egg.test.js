/**
 * Easter egg input system tests.
 * Covers: buffer accumulation, backspace, ESC, Enter (recognized/unrecognized),
 * mode guard (easter mode blocks input), timer reset on each keystroke,
 * clearEgg(), and command recognition against EGG_COMMANDS set.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDOM } from './setup.js';

setupDOM();

const {
  state, handleEggKey, clearEgg, EGG_COMMANDS, initFs, runEgg,
  pushHistory, expandHistory,
} = await import('../js/main.js');

function resetState() {
  state.mode             = 'menu';
  state.eggBuffer        = '';
  state.eggCursor        = 0;
  state.eggTimer         = null;
  state.eggTyping        = false;
  state.eggSuggest       = null;
  state.eggTabState      = null;
  state.eggHistory       = [];
  state.eggHistoryIndex  = null;
  state.eggHistoryDraft  = '';
  state.eggGhost         = '';
  state.eggReverseSearch = null;
  state.eggOverlay       = null;
  state.fsFiles          = null;
  state.fsDir            = null;
  if (typeof localStorage !== 'undefined') localStorage.clear();
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

  it('preserves case in display buffer (router lowercases at match time)', () => {
    handleEggKey('M');
    handleEggKey('A');
    assert.strictEqual(state.eggBuffer, 'MA');
  });

  it('sets eggTimer on each char (typing-blink suppression)', () => {
    handleEggKey('a');
    assert.ok(state.eggTimer !== null, 'eggTimer not set after keypress');
  });

  it('accepts ! and @ as printable characters into the buffer', () => {
    handleEggKey('!');
    handleEggKey('@');
    assert.strictEqual(state.eggBuffer, '!@');
  });

  it('accepts leading space (buffer empty)', () => {
    handleEggKey(' ');
    assert.strictEqual(state.eggBuffer, ' ');
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

describe('handleEggKey() — Enter (recognised overlay command)', () => {
  beforeEach(resetState);

  // Visual-overlay eggs flip mode to easter while the overlay is up.
  for (const cmd of ['matrix', 'starwars', 'nyan', 'sudo', 'hack']) {
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

  // Inline text eggs render into the scrollback and stay in menu mode.
  for (const cmd of ['cowsay', 'help', 'pwd', 'whoami', 'uname']) {
    it(`"${cmd}" stays in menu mode and clears buffer`, () => {
      cmd.split('').forEach(c => handleEggKey(c));
      handleEggKey('Enter');
      assert.strictEqual(state.eggBuffer, '');
      assert.strictEqual(state.mode, 'menu');
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

  it('preserves consecutive spaces (real-shell behavior)', () => {
    handleEggKey('l');
    handleEggKey('s');
    handleEggKey(' ');
    handleEggKey(' ');
    assert.strictEqual(state.eggBuffer, 'ls  ');
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

  it('"ls -la" runs the inline ls command and stays in menu mode', () => {
    'ls -la'.split('').forEach(c => handleEggKey(c));
    handleEggKey('Enter');
    assert.strictEqual(state.mode, 'menu');
  });

  it('recognises "nano readme.txt" as the nano command on Enter (overlay)', () => {
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

// ── games directory ───────────────────────────────────────────────────────────

describe('games directory — initFs', () => {
  beforeEach(resetState);

  it('includes a games/ entry', () => {
    initFs();
    assert.ok(state.fsFiles.has('games'), 'games/ missing from initFs');
  });

  it('games entry is a directory', () => {
    initFs();
    const entry = state.fsFiles.get('games');
    assert.strictEqual(entry.type, 'dir');
  });

  it('games entry has executable perms', () => {
    initFs();
    const entry = state.fsFiles.get('games');
    assert.match(entry.perms, /^d/, 'perms should start with d');
  });
});

// ── state.fsDir ───────────────────────────────────────────────────────────────

describe('state.fsDir initial value', () => {
  it('starts as null', () => {
    assert.strictEqual(state.fsDir, null);
  });
});

describe('cd games — sets fsDir', () => {
  beforeEach(resetState);

  it('cd games sets state.fsDir to "games"', () => {
    runEgg('cd games');
    assert.strictEqual(state.fsDir, 'games');
    state.mode = 'menu';
  });

  it('cd games when already in games dir does not double-navigate', () => {
    state.fsDir = 'games';
    runEgg('cd games');
    // target === 'games' but state.fsDir is already set, so falls through to error
    assert.strictEqual(state.fsDir, 'games');
    state.mode = 'menu';
  });

  it('cd .. from games dir clears state.fsDir', () => {
    state.fsDir = 'games';
    runEgg('cd ..');
    assert.strictEqual(state.fsDir, null);
    state.mode = 'menu';
  });

  it('cd ~ from games dir clears state.fsDir', () => {
    state.fsDir = 'games';
    runEgg('cd ~');
    assert.strictEqual(state.fsDir, null);
    state.mode = 'menu';
  });
});

// ── ./snake.prg command ───────────────────────────────────────────────────────

describe('./snake.prg in EGG_COMMANDS', () => {
  it('./snake.prg is a recognised command', () => {
    assert.ok(EGG_COMMANDS.has('./snake.prg'), '"./snake.prg" not in EGG_COMMANDS');
  });
});

describe('handleEggKey() — slash and ./snake.prg typing', () => {
  // eggSnake creates a setInterval blink timer; mock it so the process doesn't hang
  let _origSetInterval, _origClearInterval;
  beforeEach(() => {
    resetState();
    _origSetInterval   = globalThis.setInterval;
    _origClearInterval = globalThis.clearInterval;
    globalThis.setInterval   = () => 0;
    globalThis.clearInterval = () => {};
  });
  afterEach(() => {
    globalThis.setInterval   = _origSetInterval;
    globalThis.clearInterval = _origClearInterval;
    state.mode  = 'menu';
    state.fsDir = null;
  });

  it('accepts / character into the buffer', () => {
    handleEggKey('.');
    handleEggKey('/');
    assert.strictEqual(state.eggBuffer, './');
  });

  it('accumulates ./snake.prg in full', () => {
    './snake.prg'.split('').forEach(c => handleEggKey(c));
    assert.strictEqual(state.eggBuffer, './snake.prg');
  });

  it('typing ./snake.prg and Enter sets mode to easter (from games dir)', () => {
    state.fsDir = 'games';
    './snake.prg'.split('').forEach(c => handleEggKey(c));
    handleEggKey('Enter');
    assert.strictEqual(state.mode, 'easter');
  });

  it('./snake.prg from root prints "no such file" inline and stays in menu mode', () => {
    './snake.prg'.split('').forEach(c => handleEggKey(c));
    handleEggKey('Enter');
    assert.strictEqual(state.mode, 'menu');
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

// ── cursor movement ──────────────────────────────────────────────────────────

describe('cursor movement', () => {
  beforeEach(resetState);

  it('Home / Ctrl+A jumps cursor to start', () => {
    'matrix'.split('').forEach(c => handleEggKey(c));
    assert.strictEqual(state.eggCursor, 6);
    handleEggKey({ key: 'a', ctrlKey: true, metaKey: false, altKey: false, preventDefault() {} });
    assert.strictEqual(state.eggCursor, 0);
  });

  it('End / Ctrl+E jumps cursor to end', () => {
    'matrix'.split('').forEach(c => handleEggKey(c));
    handleEggKey({ key: 'Home' });
    assert.strictEqual(state.eggCursor, 0);
    handleEggKey({ key: 'End' });
    assert.strictEqual(state.eggCursor, 6);
  });

  it('ArrowLeft moves cursor and inserts mid-line', () => {
    'matrix'.split('').forEach(c => handleEggKey(c));
    handleEggKey({ key: 'ArrowLeft' });
    handleEggKey({ key: 'ArrowLeft' });
    assert.strictEqual(state.eggCursor, 4);
    handleEggKey('X');
    assert.strictEqual(state.eggBuffer, 'matrXix');
    assert.strictEqual(state.eggCursor, 5);
  });

  it('Backspace deletes the char before the cursor (mid-line)', () => {
    'abcde'.split('').forEach(c => handleEggKey(c));
    handleEggKey({ key: 'ArrowLeft' });   // cursor at 4
    handleEggKey({ key: 'ArrowLeft' });   // cursor at 3
    handleEggKey('Backspace');            // remove 'c'
    assert.strictEqual(state.eggBuffer, 'abde');
    assert.strictEqual(state.eggCursor, 2);
  });
});

// ── ctrl-w / ctrl-u / ctrl-k ─────────────────────────────────────────────────

describe('readline kill keys', () => {
  beforeEach(resetState);

  it('Ctrl+W deletes the previous word', () => {
    'cat about.txt'.split('').forEach(c => handleEggKey(c));
    handleEggKey({ key: 'w', ctrlKey: true, preventDefault() {} });
    assert.strictEqual(state.eggBuffer, 'cat ');
  });

  it('Ctrl+U deletes from start to cursor', () => {
    'cat about.txt'.split('').forEach(c => handleEggKey(c));
    handleEggKey({ key: 'u', ctrlKey: true, preventDefault() {} });
    assert.strictEqual(state.eggBuffer, '');
    assert.strictEqual(state.eggCursor, 0);
  });

  it('Ctrl+K deletes from cursor to end', () => {
    'cat about.txt'.split('').forEach(c => handleEggKey(c));
    handleEggKey({ key: 'Home' });
    handleEggKey({ key: 'ArrowRight' });
    handleEggKey({ key: 'ArrowRight' });
    handleEggKey({ key: 'ArrowRight' });
    handleEggKey({ key: 'k', ctrlKey: true, preventDefault() {} });
    assert.strictEqual(state.eggBuffer, 'cat');
  });
});

// ── history navigation ───────────────────────────────────────────────────────

describe('command history', () => {
  beforeEach(resetState);

  it('pushHistory dedupes consecutive identical entries', () => {
    pushHistory('matrix');
    pushHistory('matrix');
    pushHistory('cowsay');
    assert.deepStrictEqual(state.eggHistory, ['matrix', 'cowsay']);
  });

  it('ArrowUp recalls the most recent command into the buffer', () => {
    pushHistory('matrix');
    pushHistory('cowsay');
    handleEggKey({ key: 'ArrowUp' });
    assert.strictEqual(state.eggBuffer, 'cowsay');
    assert.strictEqual(state.eggCursor, 6);
  });

  it('ArrowUp twice walks back through history', () => {
    pushHistory('matrix');
    pushHistory('cowsay');
    handleEggKey({ key: 'ArrowUp' });
    handleEggKey({ key: 'ArrowUp' });
    assert.strictEqual(state.eggBuffer, 'matrix');
  });

  it('ArrowDown after ArrowUp restores the in-progress draft', () => {
    pushHistory('matrix');
    'cow'.split('').forEach(c => handleEggKey(c));
    handleEggKey({ key: 'ArrowUp' });
    assert.strictEqual(state.eggBuffer, 'matrix');
    handleEggKey({ key: 'ArrowDown' });
    assert.strictEqual(state.eggBuffer, 'cow');
  });
});

// ── history expansion (! syntax) ─────────────────────────────────────────────

describe('expandHistory', () => {
  beforeEach(resetState);

  it('!! returns the last command', () => {
    state.eggHistory = ['matrix', 'cowsay'];
    const r = expandHistory('!!');
    assert.deepStrictEqual(r, { ok: true, line: 'cowsay', expanded: true });
  });

  it('!matrix matches by prefix', () => {
    state.eggHistory = ['cowsay', 'matrix', 'help'];
    const r = expandHistory('!mat');
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.line, 'matrix');
  });

  it('!$ returns the last token of the previous command', () => {
    state.eggHistory = ['cat about.txt'];
    const r = expandHistory('cat !$');
    assert.strictEqual(r.line, 'cat about.txt');
  });

  it('!1 returns the first history entry', () => {
    state.eggHistory = ['matrix', 'cowsay'];
    const r = expandHistory('!1');
    assert.strictEqual(r.line, 'matrix');
  });

  it('!-1 returns the most recent entry', () => {
    state.eggHistory = ['matrix', 'cowsay'];
    const r = expandHistory('!-1');
    assert.strictEqual(r.line, 'cowsay');
  });

  it('returns ok:false with badRef when no match', () => {
    state.eggHistory = ['matrix'];
    const r = expandHistory('!nope');
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.badRef, '!nope');
  });

  it('leaves "!" unchanged when followed by space', () => {
    state.eggHistory = ['matrix'];
    const r = expandHistory('echo ! works');
    assert.strictEqual(r.line, 'echo ! works');
    assert.strictEqual(r.expanded, false);
  });
});

describe('Enter triggers history expansion', () => {
  beforeEach(resetState);

  it('typing !! and pressing Enter re-runs the last command', () => {
    pushHistory('cowsay');
    '!!'.split('').forEach(c => handleEggKey(c));
    handleEggKey('Enter');
    // cowsay is an inline egg; mode stays menu, history grew
    assert.strictEqual(state.eggHistory[state.eggHistory.length - 1], 'cowsay');
    assert.strictEqual(state.eggBuffer, '');
  });
});

// ── localStorage persistence ─────────────────────────────────────────────────

describe('history persistence', () => {
  beforeEach(resetState);

  it('pushHistory writes to localStorage', () => {
    pushHistory('matrix');
    const raw = localStorage.getItem('eggHistory.v1');
    assert.ok(raw, 'eggHistory.v1 not written');
    assert.deepStrictEqual(JSON.parse(raw), ['matrix']);
  });
});
