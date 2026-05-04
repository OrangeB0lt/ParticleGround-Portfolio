'use strict';

import { state } from './state.js';
import { updateEggDisplay } from './egg-input.js';
import {
  eggMatrix, eggStarWars, eggStarTrek, eggCowsay,
  eggNyan, eggSudo, eggHack, eggHelp,
} from './eggs-visual.js';
import {
  eggLs, eggCd, eggMkdir, eggTouch, eggNanoVi,
  eggChmod, eggChown, eggPwd, eggCat, eggRm,
  eggWhoami, eggUname, eggClear,
} from './eggs-fs.js';
import { eggSnake } from './eggs-snake.js';
import { eggSolitaire } from './eggs-solitaire.js';

// ── EASTER EGG RUNNER ────────────────────────────────────────────────────────

// Eggs that take over the screen (full-screen overlay or modal). They set state.mode = 'easter'.
const OVERLAY_EGGS = new Set([
  'matrix', 'starwars', 'startrek', 'nyan', 'sudo', 'hack',
  './snake.prg', './solitaire.prg',
  'nano', 'vi', 'vim',
]);

function runEgg(input) {
  const [cmd, ...args] = input.trim().split(/\s+/);
  if (typeof clarity === 'function') clarity('event', `egg_${cmd}`);

  if (OVERLAY_EGGS.has(cmd)) state.mode = 'easter';

  switch (cmd) {
    case 'matrix':   eggMatrix();                    break;
    case 'starwars': eggStarWars();                  break;
    case 'startrek': eggStarTrek();                  break;
    case 'cowsay':   eggCowsay(args);                break;
    case 'nyan':     eggNyan();                      break;
    case 'sudo':     eggSudo();                      break;
    case 'hack':     eggHack();                      break;
    case 'help':     eggHelp();                      break;
    case 'ls':       eggLs(args);                    break;
    case 'cd':       eggCd(args);                    break;
    case 'mkdir':    eggMkdir(args);                 break;
    case 'touch':    eggTouch(args);                 break;
    case 'nano':     eggNanoVi(args[0], 'nano');     break;
    case 'vi':
    case 'vim':      eggNanoVi(args[0], 'vi');       break;
    case 'chmod':    eggChmod(args);                 break;
    case 'chown':    eggChown(args);                 break;
    case 'pwd':      eggPwd();                       break;
    case 'cat':      eggCat(args);                   break;
    case 'rm':       eggRm(args);                    break;
    case 'whoami':      eggWhoami();                    break;
    case 'uname':       eggUname(args);                 break;
    case 'clear':       eggClear();                     break;
    case './snake.prg':     eggSnake();                 break;
    case './solitaire.prg': eggSolitaire();             break;
  }
}

function makeOverlay(bg) {
  const ov = document.createElement('div');
  ov.className = 'egg-overlay';
  ov.style.background = bg || '#000';
  document.getElementById('crt').appendChild(ov);
  state.eggOverlay = ov;
  return ov;
}

function removeOverlay() {
  if (state.eggOverlay) { state.eggOverlay.remove(); state.eggOverlay = null; }
  state.mode = 'menu';
  updateEggDisplay();
}

function onceKeyDismiss(ov, cb) {
  const handler = e => {
    e.stopPropagation();
    document.removeEventListener('keydown', handler, true);
    if (cb) cb();
    else {
      ov.style.transition = 'opacity 0.3s';
      ov.style.opacity = '0';
      setTimeout(removeOverlay, 300);
    }
  };
  document.addEventListener('keydown', handler, true);
  return () => document.removeEventListener('keydown', handler, true);
}

export { OVERLAY_EGGS, runEgg, makeOverlay, removeOverlay, onceKeyDismiss };
