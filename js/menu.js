'use strict';

import { MENU_ITEMS } from './config.js';
import { state } from './state.js';
import { $terminal } from './dom.js';
import { appendHTML } from './utils.js';
import { updateEggDisplay } from './egg-input.js';
import { SECTION_CMDS, runCommand } from './router.js';

// ── MAIN MENU ────────────────────────────────────────────────────────────────

function renderMenu() {
  state.mode = 'menu';
  $terminal.innerHTML = '';
  updateEggDisplay();

  const wrap = document.createElement('div');
  wrap.className = 'menu-wrap';
  $terminal.appendChild(wrap);

  appendHTML(wrap, 'JARED RATNER', 'menu-title');
  appendHTML(wrap, 'DEVOPS / SRE / BACKEND ENGINEER', 'menu-subtitle');
  appendHTML(wrap, '================================', 'menu-divider');

  const list = document.createElement('div');
  list.className = 'menu-list';
  wrap.appendChild(list);

  MENU_ITEMS.forEach((item, i) => {
    const el = document.createElement('div');
    el.className = 'menu-item' + (i === state.menuIndex ? ' selected' : '');
    el.dataset.index = i;
    el.innerHTML = `<span class="menu-arrow">${i === state.menuIndex ? '>' : ' '}</span> ${item.label}`;
    el.addEventListener('click',      () => { state.menuIndex = i; activateItem(i); });
    el.addEventListener('mouseenter', () => { state.menuIndex = i; syncMenuCursor(); });
    list.appendChild(el);
  });

  appendHTML(wrap, '[ARROW KEYS / CLICK TO SELECT] [ENTER TO OPEN] [TYPE A COMMAND]', 'menu-hint');
}

function syncMenuCursor() {
  if (state.mode !== 'menu') return;
  $terminal.querySelectorAll('.menu-item').forEach((el, i) => {
    const active = i === state.menuIndex;
    el.classList.toggle('selected', active);
    el.querySelector('.menu-arrow').textContent = active ? '>' : ' ';
  });
}

function activateItem(i) {
  const { action } = MENU_ITEMS[i];
  const cmd = SECTION_CMDS[action] || action;
  runCommand(cmd, { echoAs: cmd });
}

export { renderMenu, syncMenuCursor, activateItem };
