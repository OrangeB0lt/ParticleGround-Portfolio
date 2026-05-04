'use strict';

import { state } from './state.js';
import { $eggInput } from './dom.js';
import { runCommand, SECTION_RENDERERS, EXTERNAL_LINKS } from './router.js';
import { EGG_COMMANDS } from './config.js';
import { initFs } from './fs.js';

// ── EASTER EGG INPUT SYSTEM ───────────────────────────────────────────────────

function updateEggDisplay() {
  if (state.mode === 'boot' || state.mode === 'easter' || state.mode === 'browser') {
    $eggInput.style.opacity = '0';
    return;
  }
  const dir = state.fsDir ? `~/${state.fsDir}` : '~';
  $eggInput.textContent = `jared@ratner.me:${dir}$ ${state.eggBuffer}`;
  const cur = document.createElement('span');
  cur.className = 'egg-cursor';
  $eggInput.appendChild(cur);
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
  state.eggSuggest = null;
  if (state.eggTimer) { clearTimeout(state.eggTimer); state.eggTimer = null; }
  updateEggDisplay();
}

function handleEggKey(key) {
  if (state.mode === 'easter') return;

  if (key === 'Escape') { clearEgg(); return; }

  if (key === 'Enter') {
    const input = state.eggBuffer.trim();
    clearEgg();
    if (!input) return;
    runCommand(input, { echoAs: input });
    return;
  }

  if (key === 'Backspace') {
    state.eggBuffer = state.eggBuffer.slice(0, -1);
    state.eggSuggest = null;
    updateEggDisplay();
    return;
  }

  if (key === ' ') {
    if (state.eggBuffer.length > 0 && !state.eggBuffer.endsWith(' ')) {
      state.eggBuffer += ' ';
      state.eggSuggest = null;
      if (state.eggTimer) clearTimeout(state.eggTimer);
      state.eggTimer = setTimeout(clearEgg, 5000);
      updateEggDisplay();
    }
    return;
  }

  if (key.length === 1 && /[\w\-\.\/]/.test(key)) {
    state.eggBuffer += key.toLowerCase();
    state.eggSuggest = null;
    if (state.eggTimer) clearTimeout(state.eggTimer);
    state.eggTimer = setTimeout(clearEgg, 5000);
    updateEggDisplay();
  }
}

// ── TAB AUTOCOMPLETE ──────────────────────────────────────────────────────────

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

function replaceCurrentToken(buf, endsWithSpace, replacement) {
  if (endsWithSpace || buf.length === 0) return buf + replacement;
  const lastSpace = buf.lastIndexOf(' ');
  if (lastSpace === -1) return replacement;
  return buf.slice(0, lastSpace + 1) + replacement;
}

function handleTabComplete() {
  if (state.mode === 'boot' || state.mode === 'easter' || state.mode === 'browser') return;

  const buf = state.eggBuffer;
  const endsWithSpace = buf.length > 0 && buf.endsWith(' ');
  const tokens = buf.split(/\s+/).filter(Boolean);
  const isFirstWord = tokens.length === 0 || (tokens.length === 1 && !endsWithSpace);

  let prefix, pool;
  if (isFirstWord) {
    prefix = endsWithSpace ? '' : (tokens[0] || '');
    pool = getCommandCandidates();
  } else {
    const head = tokens[0];
    if (!FS_ARG_COMMANDS.has(head)) return;
    prefix = endsWithSpace ? '' : tokens[tokens.length - 1];
    pool = getFileCandidates();
  }

  const matches = pool.filter(c => c.startsWith(prefix));
  if (matches.length === 0) return;

  if (matches.length === 1) {
    state.eggBuffer = replaceCurrentToken(buf, endsWithSpace, matches[0] + ' ');
    state.eggSuggest = null;
  } else {
    const lcp = longestCommonPrefix(matches);
    if (lcp.length > prefix.length) {
      state.eggBuffer = replaceCurrentToken(buf, endsWithSpace, lcp);
      state.eggSuggest = null;
    } else {
      state.eggSuggest = matches.slice(0, 12);
    }
  }

  if (state.eggTimer) clearTimeout(state.eggTimer);
  state.eggTimer = setTimeout(clearEgg, 5000);
  updateEggDisplay();
}

export { updateEggDisplay, clearEgg, handleEggKey, handleTabComplete };
