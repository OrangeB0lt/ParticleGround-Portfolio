'use strict';

import { state } from './state.js';
import { $terminal, $screen } from './dom.js';
import { delay, typeLine, appendHTML } from './utils.js';
import { renderMenu } from './menu.js';

// ── BOOT SEQUENCE ────────────────────────────────────────────────────────────

async function runBoot() {
  state.mode = 'boot';
  state.bootAborted = false;
  $terminal.innerHTML = '';

  const bootLines = [
    { t: '    **** COMMODORE 64 BASIC V2 ****', s: 18 },
    { t: '', s: 0 },
    { t: ' 64K RAM SYSTEM  38911 BASIC BYTES FREE', s: 18 },
    { t: '', s: 0 },
    { t: 'READY.', s: 50 },
  ];

  for (const { t, s } of bootLines) {
    await typeLine($terminal, t, s);
    await delay(50);
  }

  await delay(350);
  await typeLine($terminal, 'LOAD "PORTFOLIO",8,1', 45);
  await delay(250);
  await typeLine($terminal, 'SEARCHING FOR PORTFOLIO', 28);
  await delay(150);
  await typeLine($terminal, 'LOADING', 55);

  const dotLine = document.createElement('div');
  $terminal.appendChild(dotLine);
  for (let i = 0; i < 10; i++) {
    if (state.bootAborted) { dotLine.textContent = '..........'; break; }
    dotLine.textContent += '.';
    await new Promise(r => setTimeout(r, 110));
  }

  await delay(250);
  await typeLine($terminal, 'READY.', 45);
  await delay(150);
  await typeLine($terminal, 'RUN', 45);
  await delay(180);

  const hint = appendHTML($terminal, "// type 'help' for secrets", 'boot-hint');
  await delay(700);
  hint.style.transition = 'opacity 0.5s';
  hint.style.opacity = '0';
  await delay(600);

  $screen.classList.add('flash');
  await new Promise(r => setTimeout(r, 150));
  $terminal.innerHTML = '';
  $screen.classList.remove('flash');
  $screen.scrollTop = 0;
  state.bootAborted = false;
  renderMenu();
}

export { runBoot };
