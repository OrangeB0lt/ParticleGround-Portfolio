'use strict';

import { state } from './state.js';
import { $eggInput } from './dom.js';
import { runCommand, SECTION_RENDERERS, EXTERNAL_LINKS } from './router.js';
import { EGG_COMMANDS } from './config.js';
import { initFs } from './fs.js';
import { appendOutput, escapeHTML } from './utils.js';

// ── EASTER EGG INPUT SYSTEM ───────────────────────────────────────────────────
// Readline-style line editor: cursor positioning, history with !-expansion,
// fish-style ghost text, tab cycling, reverse-i-search.

const HISTORY_KEY = 'eggHistory.v1';
const MAX_HISTORY = 200;

// ── HISTORY PERSISTENCE ──────────────────────────────────────────────────────

function loadHistory() {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) state.eggHistory = arr.slice(-MAX_HISTORY);
  } catch { /* corrupted — leave empty */ }
}

function pushHistory(line) {
  const trimmed = (line || '').trim();
  if (!trimmed) return;
  const last = state.eggHistory[state.eggHistory.length - 1];
  if (last === trimmed) return;
  state.eggHistory.push(trimmed);
  if (state.eggHistory.length > MAX_HISTORY) {
    state.eggHistory.splice(0, state.eggHistory.length - MAX_HISTORY);
  }
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(state.eggHistory)); } catch {}
}

function clearStoredHistory() {
  state.eggHistory = [];
  if (typeof localStorage === 'undefined') return;
  try { localStorage.removeItem(HISTORY_KEY); } catch {}
}

// ── HISTORY EXPANSION (bash-style `!`) ───────────────────────────────────────
// Returns { ok: true, line, expanded } or { ok: false, badRef }

function expandHistory(line) {
  if (!line.includes('!')) return { ok: true, line, expanded: false };
  const hist = state.eggHistory;

  let out = '';
  let i = 0;
  let didExpand = false;
  while (i < line.length) {
    const c = line[i];
    if (c !== '!') { out += c; i++; continue; }

    const next = line[i + 1];
    if (next === undefined || next === ' ' || next === '\t') {
      out += '!'; i++; continue;
    }
    if (next === '!') {
      const last = hist[hist.length - 1];
      if (last === undefined) return { ok: false, badRef: '!!' };
      out += last; didExpand = true; i += 2; continue;
    }
    if (next === '$') {
      const last = hist[hist.length - 1];
      if (last === undefined) return { ok: false, badRef: '!$' };
      const tokens = last.trim().split(/\s+/);
      out += tokens[tokens.length - 1]; didExpand = true; i += 2; continue;
    }
    if (next === '?') {
      const close = line.indexOf('?', i + 2);
      const str = close === -1 ? line.slice(i + 2) : line.slice(i + 2, close);
      const advance = close === -1 ? line.length - i : (close - i + 1);
      if (!str) { out += '!'; i++; continue; }
      const match = findFromEnd(hist, h => h.includes(str));
      if (!match) return { ok: false, badRef: '!?' + str + (close === -1 ? '' : '?') };
      out += match; didExpand = true; i += advance; continue;
    }
    if (next === '-' || /[0-9]/.test(next)) {
      let j = i + 1;
      if (line[j] === '-') j++;
      while (j < line.length && /[0-9]/.test(line[j])) j++;
      const numStr = line.slice(i + 1, j);
      const n = parseInt(numStr, 10);
      if (!Number.isInteger(n) || n === 0) return { ok: false, badRef: line.slice(i, j) };
      const target = n < 0 ? hist[hist.length + n] : hist[n - 1];
      if (target === undefined) return { ok: false, badRef: line.slice(i, j) };
      out += target; didExpand = true; i = j; continue;
    }
    if (/[A-Za-z_./]/.test(next)) {
      let j = i + 1;
      while (j < line.length && /[A-Za-z0-9_./-]/.test(line[j])) j++;
      const str = line.slice(i + 1, j);
      const match = findFromEnd(hist, h => h.startsWith(str));
      if (!match) return { ok: false, badRef: line.slice(i, j) };
      out += match; didExpand = true; i = j; continue;
    }
    out += '!'; i++;
  }
  return { ok: true, line: out, expanded: didExpand };
}

function findFromEnd(arr, pred) {
  for (let i = arr.length - 1; i >= 0; i--) if (pred(arr[i])) return arr[i];
  return null;
}

// ── DISPLAY ──────────────────────────────────────────────────────────────────

function updateEggDisplay() {
  if (state.mode === 'boot' || state.mode === 'easter' || state.mode === 'browser') {
    $eggInput.style.opacity = '0';
    return;
  }
  $eggInput.replaceChildren();

  if (state.eggReverseSearch) {
    const rs = document.createElement('div');
    rs.className = 'egg-rsearch';
    const { query, matchIdx } = state.eggReverseSearch;
    const match = matchIdx != null ? state.eggHistory[matchIdx] : '';
    rs.textContent = `(reverse-i-search)\`${query}\`: ${match}`;
    $eggInput.appendChild(rs);
  }

  const dir = state.fsDir ? `~/${state.fsDir}` : '~';
  const promptText = `jared@ratner.me:${dir}$ `;
  const buf = state.eggBuffer;
  const c = state.eggCursor;
  const before = buf.slice(0, c);
  const onChar = buf.slice(c, c + 1);
  const after = buf.slice(c + 1);

  $eggInput.appendChild(document.createTextNode(promptText + before));

  const cursorEl = document.createElement('span');
  cursorEl.className = 'egg-cursor' + (state.eggTyping ? ' is-typing' : '');
  cursorEl.textContent = onChar || ' ';
  $eggInput.appendChild(cursorEl);

  if (after) $eggInput.appendChild(document.createTextNode(after));

  if (state.eggGhost && c === buf.length) {
    const ghost = document.createElement('span');
    ghost.className = 'egg-ghost';
    ghost.textContent = state.eggGhost;
    $eggInput.appendChild(ghost);
  }

  if (state.eggSuggest && state.eggSuggest.length) {
    const sug = document.createElement('span');
    sug.className = 'egg-suggest';
    sug.textContent = `  [${state.eggSuggest.join(' | ')}]`;
    $eggInput.appendChild(sug);
  }

  $eggInput.style.opacity = '1';
}

function clearEgg() {
  state.eggBuffer = '';
  state.eggCursor = 0;
  state.eggSuggest = null;
  state.eggTabState = null;
  state.eggGhost = '';
  state.eggHistoryIndex = null;
  state.eggHistoryDraft = '';
  state.eggReverseSearch = null;
  if (state.eggTimer) { clearTimeout(state.eggTimer); state.eggTimer = null; }
  state.eggTyping = false;
  updateEggDisplay();
}

// ── BUFFER PRIMITIVES ────────────────────────────────────────────────────────

function setBuffer(s, cursor) {
  state.eggBuffer = s;
  state.eggCursor = cursor != null ? Math.max(0, Math.min(s.length, cursor)) : s.length;
}

function insertAtCursor(s) {
  const b = state.eggBuffer, c = state.eggCursor;
  state.eggBuffer = b.slice(0, c) + s + b.slice(c);
  state.eggCursor = c + s.length;
}

function deleteBeforeCursor(n = 1) {
  const b = state.eggBuffer, c = state.eggCursor;
  if (c === 0) return;
  const k = Math.min(n, c);
  state.eggBuffer = b.slice(0, c - k) + b.slice(c);
  state.eggCursor = c - k;
}

function deleteAfterCursor(n = 1) {
  const b = state.eggBuffer, c = state.eggCursor;
  if (c >= b.length) return;
  state.eggBuffer = b.slice(0, c) + b.slice(c + n);
}

function moveCursor(delta) {
  state.eggCursor = Math.max(0, Math.min(state.eggBuffer.length, state.eggCursor + delta));
}

function wordBoundaryLeft(b, c) {
  let i = c;
  while (i > 0 && /\s/.test(b[i - 1])) i--;
  while (i > 0 && !/\s/.test(b[i - 1])) i--;
  return i;
}

function wordBoundaryRight(b, c) {
  let i = c;
  const n = b.length;
  while (i < n && /\s/.test(b[i])) i++;
  while (i < n && !/\s/.test(b[i])) i++;
  return i;
}

// ── GHOST / BLINK ────────────────────────────────────────────────────────────

function recomputeGhost() {
  const buf = state.eggBuffer;
  const c = state.eggCursor;
  if (!buf || c !== buf.length) { state.eggGhost = ''; return; }
  const lower = buf.toLowerCase();
  const hist = state.eggHistory;
  for (let i = hist.length - 1; i >= 0; i--) {
    const h = hist[i];
    if (h.length > buf.length && h.toLowerCase().startsWith(lower)) {
      state.eggGhost = h.slice(buf.length);
      return;
    }
  }
  state.eggGhost = '';
}

function bumpTypingBlink() {
  state.eggTyping = true;
  if (state.eggTimer) clearTimeout(state.eggTimer);
  if (typeof setTimeout === 'undefined') return;
  state.eggTimer = setTimeout(() => {
    state.eggTyping = false;
    state.eggTimer = null;
    updateEggDisplay();
  }, 500);
}

// ── TAB COMPLETION ───────────────────────────────────────────────────────────

const FS_ARG_COMMANDS = new Set([
  'cat', 'nano', 'vi', 'vim', 'rm', 'touch', 'cd', 'ls', 'chmod', 'chown', 'mkdir',
]);

function getCommandCandidates() {
  const set = new Set([
    ...Object.keys(SECTION_RENDERERS),
    ...Object.keys(EXTERNAL_LINKS),
    ...EGG_COMMANDS,
  ]);
  return Array.from(set);
}

function getFileCandidates() {
  initFs();
  return Array.from(state.fsFiles.keys());
}

function longestCommonPrefix(strs) {
  if (!strs.length) return '';
  let p = strs[0];
  for (const s of strs) {
    while (!s.startsWith(p)) p = p.slice(0, -1);
    if (!p) return '';
  }
  return p;
}

function tokenAtCursor() {
  const b = state.eggBuffer;
  const c = state.eggCursor;
  let s = c;
  while (s > 0 && !/\s/.test(b[s - 1])) s--;
  let e = c;
  while (e < b.length && !/\s/.test(b[e])) e++;
  return { startIdx: s, endIdx: e, value: b.slice(s, e) };
}

function isFirstWord(buf, tokenStart) {
  for (let i = 0; i < tokenStart; i++) {
    if (!/\s/.test(buf[i])) return false;
  }
  return true;
}

function replaceToken(startIdx, endIdx, replacement) {
  const b = state.eggBuffer;
  state.eggBuffer = b.slice(0, startIdx) + replacement + b.slice(endIdx);
  state.eggCursor = startIdx + replacement.length;
}

function handleTabComplete() {
  if (state.mode === 'boot' || state.mode === 'easter' || state.mode === 'browser') return;

  if (state.eggTabState) {
    const ts = state.eggTabState;
    ts.idx = (ts.idx + 1) % ts.matches.length;
    const next = ts.matches[ts.idx];
    replaceToken(ts.startIdx, ts.startIdx + ts.lastLen, next);
    ts.lastLen = next.length;
    state.eggSuggest = ts.matches.slice(0, 12);
    recomputeGhost();
    updateEggDisplay();
    return;
  }

  const buf = state.eggBuffer;
  const tok = tokenAtCursor();
  const firstWord = isFirstWord(buf, tok.startIdx);
  const prefix = tok.value;

  let pool;
  if (firstWord) {
    pool = getCommandCandidates();
  } else {
    const head = (buf.trim().split(/\s+/)[0] || '').toLowerCase();
    if (!FS_ARG_COMMANDS.has(head)) return;
    pool = getFileCandidates();
  }

  const matches = pool.filter(c => c.toLowerCase().startsWith(prefix.toLowerCase()));
  if (matches.length === 0) return;

  if (matches.length === 1) {
    replaceToken(tok.startIdx, tok.endIdx, matches[0]);
    if (state.eggBuffer[state.eggCursor] !== ' ') {
      state.eggBuffer = state.eggBuffer.slice(0, state.eggCursor) + ' ' + state.eggBuffer.slice(state.eggCursor);
    }
    state.eggCursor += 1;
    state.eggSuggest = null;
    state.eggTabState = null;
  } else {
    const lcp = longestCommonPrefix(matches);
    if (lcp.length > prefix.length) {
      replaceToken(tok.startIdx, tok.endIdx, lcp);
      state.eggSuggest = null;
      state.eggTabState = null;
    } else {
      state.eggTabState = {
        startIdx: tok.startIdx,
        matches,
        idx: 0,
        lastLen: matches[0].length,
      };
      replaceToken(tok.startIdx, tok.endIdx, matches[0]);
      state.eggSuggest = matches.slice(0, 12);
    }
  }

  recomputeGhost();
  updateEggDisplay();
}

// ── REVERSE-I-SEARCH ─────────────────────────────────────────────────────────

function rsearchFind(query, beforeIdx) {
  const hist = state.eggHistory;
  const q = query.toLowerCase();
  const start = beforeIdx == null ? hist.length - 1 : beforeIdx - 1;
  for (let i = start; i >= 0; i--) {
    if (hist[i].toLowerCase().includes(q)) return i;
  }
  return null;
}

function rsearchAccept() {
  const rs = state.eggReverseSearch;
  state.eggReverseSearch = null;
  if (!rs || rs.matchIdx == null) return;
  const match = state.eggHistory[rs.matchIdx];
  setBuffer(match, match.length);
}

// ── HISTORY NAVIGATION ───────────────────────────────────────────────────────

function historyPrev() {
  const hist = state.eggHistory;
  if (hist.length === 0) return false;
  if (state.eggHistoryIndex === null) {
    state.eggHistoryDraft = state.eggBuffer;
    state.eggHistoryIndex = hist.length - 1;
  } else if (state.eggHistoryIndex > 0) {
    state.eggHistoryIndex--;
  }
  setBuffer(hist[state.eggHistoryIndex]);
  state.eggGhost = '';
  return true;
}

function historyNext() {
  const hist = state.eggHistory;
  if (state.eggHistoryIndex === null) return false;
  if (state.eggHistoryIndex < hist.length - 1) {
    state.eggHistoryIndex++;
    setBuffer(hist[state.eggHistoryIndex]);
  } else {
    state.eggHistoryIndex = null;
    setBuffer(state.eggHistoryDraft || '');
    state.eggHistoryDraft = '';
  }
  state.eggGhost = '';
  return true;
}

// ── ENTER ────────────────────────────────────────────────────────────────────

function runEnter() {
  if (state.eggReverseSearch) {
    rsearchAccept();
  }
  const raw = state.eggBuffer;
  const trimmed = raw.trim();
  if (!trimmed) {
    clearEgg();
    return;
  }
  const exp = expandHistory(trimmed);
  if (!exp.ok) {
    appendOutput(`bash: ${escapeHTML(exp.badRef)}: event not found`, 'cmd-error');
    clearEgg();
    return;
  }
  const finalLine = exp.line;
  pushHistory(finalLine);
  clearEgg();
  // history -c: clear stored history
  if (finalLine.trim() === 'history -c') {
    clearStoredHistory();
    appendOutput('history cleared', 'egg-output');
    return;
  }
  runCommand(finalLine, { echoAs: finalLine });
}

// ── KEY DISPATCH ─────────────────────────────────────────────────────────────

function asEvent(eOrKey) {
  if (typeof eOrKey === 'string') {
    return { key: eOrKey, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, preventDefault() {} };
  }
  return eOrKey;
}

function isPrintable(e) {
  return e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey;
}

function handleEggKey(eOrKey) {
  const e = asEvent(eOrKey);
  if (state.mode === 'easter' || state.mode === 'boot' || state.mode === 'browser') return;

  const key = e.key;
  const ctrl = e.ctrlKey;
  const meta = e.metaKey;
  const alt = e.altKey;

  // Reverse-i-search modal substate
  if (state.eggReverseSearch) {
    if (key === 'Escape') {
      state.eggReverseSearch = null;
      updateEggDisplay();
      return;
    }
    if (key === 'Enter') {
      runEnter();
      return;
    }
    if (ctrl && (key === 'r' || key === 'R')) {
      const before = state.eggReverseSearch.matchIdx;
      const next = rsearchFind(state.eggReverseSearch.query, before);
      if (next !== null) state.eggReverseSearch.matchIdx = next;
      updateEggDisplay();
      return;
    }
    if (key === 'Backspace') {
      const rs = state.eggReverseSearch;
      rs.query = rs.query.slice(0, -1);
      rs.matchIdx = rs.query ? rsearchFind(rs.query) : null;
      updateEggDisplay();
      return;
    }
    if (isPrintable(e)) {
      const rs = state.eggReverseSearch;
      rs.query += key;
      rs.matchIdx = rsearchFind(rs.query);
      updateEggDisplay();
      return;
    }
    state.eggReverseSearch = null;
  }

  // Tab → completion / cycle
  if (key === 'Tab') {
    if (e.preventDefault) e.preventDefault();
    handleTabComplete();
    return;
  }

  // any non-Tab key clears tab cycle state
  if (state.eggTabState) state.eggTabState = null;

  if (key === 'Escape') { clearEgg(); return; }
  if (key === 'Enter')  { runEnter(); return; }

  // History
  if (key === 'ArrowUp' || (ctrl && (key === 'p' || key === 'P'))) {
    historyPrev();
    updateEggDisplay();
    return;
  }
  if (key === 'ArrowDown' || (ctrl && (key === 'n' || key === 'N'))) {
    historyNext();
    updateEggDisplay();
    return;
  }

  // Cursor movement
  if (key === 'ArrowLeft') {
    if (alt || meta) {
      state.eggCursor = wordBoundaryLeft(state.eggBuffer, state.eggCursor);
    } else {
      moveCursor(-1);
    }
    state.eggGhost = '';
    updateEggDisplay();
    return;
  }
  if (key === 'ArrowRight') {
    if (state.eggCursor === state.eggBuffer.length && state.eggGhost) {
      const g = state.eggGhost;
      state.eggGhost = '';
      insertAtCursor(g);
      recomputeGhost();
      updateEggDisplay();
      return;
    }
    if (alt || meta) {
      state.eggCursor = wordBoundaryRight(state.eggBuffer, state.eggCursor);
    } else {
      moveCursor(1);
    }
    recomputeGhost();
    updateEggDisplay();
    return;
  }
  if (key === 'Home' || (ctrl && (key === 'a' || key === 'A'))) {
    state.eggCursor = 0;
    state.eggGhost = '';
    updateEggDisplay();
    return;
  }
  if (key === 'End' || (ctrl && (key === 'e' || key === 'E'))) {
    if (state.eggCursor === state.eggBuffer.length && state.eggGhost) {
      const g = state.eggGhost;
      state.eggGhost = '';
      insertAtCursor(g);
    } else {
      state.eggCursor = state.eggBuffer.length;
    }
    recomputeGhost();
    updateEggDisplay();
    return;
  }

  // Deletion
  if (key === 'Backspace') {
    if (meta) {
      state.eggBuffer = state.eggBuffer.slice(state.eggCursor);
      state.eggCursor = 0;
    } else if (alt) {
      const newC = wordBoundaryLeft(state.eggBuffer, state.eggCursor);
      state.eggBuffer = state.eggBuffer.slice(0, newC) + state.eggBuffer.slice(state.eggCursor);
      state.eggCursor = newC;
    } else {
      deleteBeforeCursor(1);
    }
    state.eggSuggest = null;
    recomputeGhost();
    bumpTypingBlink();
    updateEggDisplay();
    return;
  }
  if (key === 'Delete') {
    deleteAfterCursor(1);
    state.eggSuggest = null;
    recomputeGhost();
    bumpTypingBlink();
    updateEggDisplay();
    return;
  }

  // Ctrl combos
  if (ctrl) {
    if (key === 'u' || key === 'U') {
      state.eggBuffer = state.eggBuffer.slice(state.eggCursor);
      state.eggCursor = 0;
      state.eggSuggest = null;
      recomputeGhost();
      updateEggDisplay();
      return;
    }
    if (key === 'k' || key === 'K') {
      state.eggBuffer = state.eggBuffer.slice(0, state.eggCursor);
      state.eggSuggest = null;
      recomputeGhost();
      updateEggDisplay();
      return;
    }
    if (key === 'w' || key === 'W') {
      const newC = wordBoundaryLeft(state.eggBuffer, state.eggCursor);
      state.eggBuffer = state.eggBuffer.slice(0, newC) + state.eggBuffer.slice(state.eggCursor);
      state.eggCursor = newC;
      state.eggSuggest = null;
      recomputeGhost();
      updateEggDisplay();
      return;
    }
    if (key === 'r' || key === 'R') {
      state.eggReverseSearch = { query: '', matchIdx: null };
      updateEggDisplay();
      return;
    }
    if (key === 'l' || key === 'L') {
      runCommand('clear', { echoAs: '' });
      return;
    }
    return;
  }

  // Cmd combos: ignore (let browser handle native shortcuts; paste comes via 'paste' event)
  if (meta) return;

  // Printable character → insert
  if (isPrintable(e)) {
    insertAtCursor(key);
    state.eggSuggest = null;
    recomputeGhost();
    bumpTypingBlink();
    updateEggDisplay();
    return;
  }
  // Function-key names ('Shift', 'Control', 'Alt', 'F1', 'CapsLock', etc.) are no-ops.
}

function handleEggPaste(text) {
  if (state.mode === 'easter' || state.mode === 'boot' || state.mode === 'browser') return;
  if (!text) return;
  const cleaned = String(text).replace(/\r/g, '').split('\n')[0];
  insertAtCursor(cleaned);
  state.eggTabState = null;
  state.eggSuggest = null;
  recomputeGhost();
  bumpTypingBlink();
  updateEggDisplay();
}

export {
  updateEggDisplay, clearEgg, handleEggKey, handleTabComplete,
  handleEggPaste, loadHistory, pushHistory, expandHistory,
};
