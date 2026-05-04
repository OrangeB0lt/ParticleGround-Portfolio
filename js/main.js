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
import { handleEggKey, clearEgg, handleTabComplete } from './egg-input.js';
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

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (state.mode === 'menu') {
          state.menuIndex = (state.menuIndex - 1 + MENU_ITEMS.length) % MENU_ITEMS.length;
          syncMenuCursor();
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (state.mode === 'menu') {
          state.menuIndex = (state.menuIndex + 1) % MENU_ITEMS.length;
          syncMenuCursor();
        }
        break;

      case 'Enter':
        if (state.eggBuffer) {
          handleEggKey('Enter');
        } else if (state.mode === 'menu') {
          activateItem(state.menuIndex);
        }
        break;

      case 'Escape':
        if (state.mode === 'browser') {
          closeBrowser();
        }
        clearEgg();
        break;

      case 'Tab':
        e.preventDefault();
        handleTabComplete();
        break;

      default:
        handleEggKey(e.key);
        break;
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
  delay, typeText,
  renderMenu, syncMenuCursor,
  runBoot, runCommand,
  initFs, runEgg,
  appendOutput, appendCmdLine,
};
