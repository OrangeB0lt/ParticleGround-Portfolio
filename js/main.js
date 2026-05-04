'use strict';

// ── ENTRY ────────────────────────────────────────────────────────────────────
// Module layout: this file wires global event listeners, kicks off boot, and
// re-exports the names the test suite imports. All implementation lives in the
// sibling modules.

import { state } from './state.js';
import {
  MENU_ITEMS, PROJECTS, FORTUNES, EGG_COMMANDS,
  LINKEDIN_URL, MEDIUM_URL, GITHUB_URL,
} from './config.js';
import { delay, typeText, appendOutput, appendCmdLine } from './utils.js';
import { initFs } from './fs.js';
import { PROJECT_FILES } from './sections.js';
import {
  handleEggKey, clearEgg,
  handleEggPaste, loadHistory, pushHistory, expandHistory,
} from './egg-input.js';
import { runEgg } from './egg-runtime.js';
import { runBoot } from './boot.js';
import { renderMenu, syncMenuCursor, activateItem } from './menu.js';
import { SECTION_CMDS, runCommand } from './router.js';
import { launchExternal, closeBrowser } from './browser.js';

// ── GLOBAL EVENT LISTENERS ───────────────────────────────────────────────────

function installGlobalListeners() {
  document.addEventListener('keydown', e => {
    if (state.mode === 'boot') {
      state.bootAborted = true;
      return;
    }
    if (state.mode === 'easter') return;

    if (state.mode === 'browser') {
      if (e.key === 'Escape') { closeBrowser(); clearEgg(); }
      return;
    }

    // Up/Down: if buffer non-empty, in history walk, or history exists → line editor.
    // Otherwise fall back to menu navigation.
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const useHistory =
        state.eggBuffer !== '' ||
        state.eggHistoryIndex !== null ||
        state.eggHistory.length > 0 ||
        state.eggReverseSearch !== null;
      if (useHistory) {
        handleEggKey(e);
      } else if (state.mode === 'menu') {
        if (e.key === 'ArrowUp') {
          state.menuIndex = (state.menuIndex - 1 + MENU_ITEMS.length) % MENU_ITEMS.length;
        } else {
          state.menuIndex = (state.menuIndex + 1) % MENU_ITEMS.length;
        }
        syncMenuCursor();
      }
      return;
    }

    // Enter: when there's buffer or rsearch active, dispatch to line editor.
    // When buffer empty and on menu, activate selected item.
    if (e.key === 'Enter') {
      if (state.eggBuffer || state.eggReverseSearch) {
        handleEggKey(e);
      } else if (state.mode === 'menu') {
        activateItem(state.menuIndex);
      }
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      handleEggKey(e);
      return;
    }

    handleEggKey(e);
  });

  // Paste support: route into the line editor
  document.addEventListener('paste', e => {
    if (state.mode === 'easter' || state.mode === 'boot' || state.mode === 'browser') return;
    const text = e.clipboardData && e.clipboardData.getData('text');
    if (text) {
      e.preventDefault();
      handleEggPaste(text);
    }
  });

  // skip boot on click anywhere
  document.addEventListener('click', () => {
    if (state.mode === 'boot') state.bootAborted = true;
  });

  // intercept all external links → simulated browser
  document.addEventListener('click', e => {
    if (e.target.closest('#sim-browser')) return;
    const anchor = e.target.closest('a');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    if (!href.startsWith('http://') && !href.startsWith('https://')) return;
    e.preventDefault();
    const rawText = anchor.textContent.trim().replace(/[\[\]→←<>]/g, '').trim();
    const isRawUrl = /^https?:\/\/|^www\./.test(rawText);
    const name = (rawText && !isRawUrl) ? rawText.toUpperCase() : new URL(href).hostname.toUpperCase();
    launchExternal(name, href);
  });
}

// ── INIT ─────────────────────────────────────────────────────────────────────

if (!globalThis.__TEST_ENV__) {
  loadHistory();
  installGlobalListeners();
  runBoot();
}

// ── TEST EXPORTS ──────────────────────────────────────────────────────────────

export {
  state,
  MENU_ITEMS, PROJECTS, FORTUNES, EGG_COMMANDS,
  LINKEDIN_URL, MEDIUM_URL, GITHUB_URL,
  PROJECT_FILES, SECTION_CMDS,
  handleEggKey, clearEgg,
  handleEggPaste, pushHistory, expandHistory, loadHistory,
  delay, typeText,
  renderMenu, syncMenuCursor,
  runBoot, runCommand,
  initFs, runEgg,
  appendOutput, appendCmdLine,
};
