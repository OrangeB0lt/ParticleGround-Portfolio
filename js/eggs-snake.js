'use strict';

import { state } from './state.js';
import { appendPreText } from './utils.js';
import { updateEggDisplay } from './egg-input.js';

// ── SNAKE GAME ────────────────────────────────────────────────────────────────

function eggSnake() {
  if (!state.fsDir) {
    state.mode = 'menu';
    appendPreText('bash: ./snake.prg: No such file or directory', '#ff4444');
    return;
  }

  const COLS = 20, ROWS = 16, CELL = 16;
  const W = COLS * CELL, H = ROWS * CELL;

  // Build window using sim-browser chrome
  const win = document.createElement('div');
  win.className = 'sim-browser';
  win.style.zIndex = '55';

  // Title bar
  const titlebar = document.createElement('div');
  titlebar.className = 'sim-browser-titlebar';
  const winctrls = document.createElement('span');
  winctrls.className = 'sim-browser-winctrls';
  winctrls.textContent = '[◼][◻]';
  const title = document.createElement('span');
  title.className = 'sim-browser-title';
  title.textContent = 'SNAKE v1.0 — JARED\'S ARCADE';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'sim-browser-close';
  closeBtn.textContent = '[X]';
  titlebar.appendChild(winctrls);
  titlebar.appendChild(title);
  titlebar.appendChild(closeBtn);

  // URL bar
  const urlbar = document.createElement('div');
  urlbar.className = 'sim-browser-urlbar';
  const nav = document.createElement('span');
  nav.className = 'sim-browser-nav';
  nav.textContent = '[<] [>] [↺]';
  const url = document.createElement('span');
  url.className = 'sim-browser-url';
  url.textContent = './games/snake.prg';
  urlbar.appendChild(nav);
  urlbar.appendChild(url);

  // Body with canvas
  const body = document.createElement('div');
  body.className = 'sim-browser-body';
  body.style.background = '#000';
  body.style.display = 'flex';
  body.style.alignItems = 'center';
  body.style.justifyContent = 'center';

  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  canvas.style.display = 'block';
  canvas.style.imageRendering = 'pixelated';
  canvas.style.border = '2px solid #4040e8';
  canvas.style.boxSizing = 'content-box';
  body.appendChild(canvas);

  // Status bar
  const statusbar = document.createElement('div');
  statusbar.className = 'sim-browser-statusbar';
  const statusLeft = document.createElement('span');
  statusLeft.textContent = 'PRESS ENTER TO START';
  const statusRight = document.createElement('span');
  statusRight.textContent = 'SCORE: 0';
  statusbar.appendChild(statusLeft);
  statusbar.appendChild(statusRight);

  win.appendChild(titlebar);
  win.appendChild(urlbar);
  win.appendChild(body);
  win.appendChild(statusbar);
  document.getElementById('crt').appendChild(win);

  const ctx = canvas.getContext('2d');

  // Game state
  const gs = {
    phase: 'start',   // 'start' | 'playing' | 'over'
    snake: [],
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    food: { x: 0, y: 0 },
    score: 0,
    tick: null,
    blinkOn: true,
    blinkTimer: null,
  };

  function spawnFood() {
    const occupied = new Set(gs.snake.map(s => `${s.x},${s.y}`));
    let fx, fy;
    do {
      fx = Math.floor(Math.random() * COLS);
      fy = Math.floor(Math.random() * ROWS);
    } while (occupied.has(`${fx},${fy}`));
    gs.food = { x: fx, y: fy };
  }

  function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    // Faint grid
    ctx.strokeStyle = 'rgba(64,64,232,0.32)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, H); ctx.stroke(); }
    for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(W, y * CELL); ctx.stroke(); }

    if (gs.phase === 'start') {
      if (gs.blinkOn) {
        ctx.fillStyle = '#f5f500';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PRESS ENTER', W / 2, H / 2 - 10);
        ctx.fillText('TO START', W / 2, H / 2 + 6);
      }
      return;
    }

    // Food
    ctx.fillStyle = '#00ff41';
    ctx.fillRect(gs.food.x * CELL + 3, gs.food.y * CELL + 3, CELL - 6, CELL - 6);

    // Snake body
    ctx.fillStyle = '#f5f500';
    for (let i = 1; i < gs.snake.length; i++) {
      const s = gs.snake[i];
      ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
    }
    // Snake head
    if (gs.snake.length > 0) {
      ctx.fillStyle = '#ffffff';
      const h = gs.snake[0];
      ctx.fillRect(h.x * CELL + 1, h.y * CELL + 1, CELL - 2, CELL - 2);
    }

    if (gs.phase === 'over') {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, H / 2 - 28, W, 52);
      ctx.fillStyle = '#ff4444';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 10);
      ctx.fillStyle = '#f5f500';
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.fillText('ENTER TO RESTART', W / 2, H / 2 + 8);
    }
  }

  function startGame() {
    clearInterval(gs.tick);
    clearInterval(gs.blinkTimer);
    gs.snake = [{ x: 10, y: 8 }, { x: 9, y: 8 }, { x: 8, y: 8 }];
    gs.dir = { x: 1, y: 0 };
    gs.nextDir = { x: 1, y: 0 };
    gs.score = 0;
    gs.phase = 'playing';
    statusLeft.textContent = 'USE ARROW KEYS';
    statusRight.textContent = 'SCORE: 0';
    spawnFood();
    gs.tick = setInterval(gameTick, 150);
    draw();
  }

  function gameTick() {
    gs.dir = gs.nextDir;
    const head = { x: gs.snake[0].x + gs.dir.x, y: gs.snake[0].y + gs.dir.y };

    // Wall collision
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      endGame(); return;
    }
    // Self collision
    if (gs.snake.some(s => s.x === head.x && s.y === head.y)) {
      endGame(); return;
    }

    gs.snake.unshift(head);

    if (head.x === gs.food.x && head.y === gs.food.y) {
      gs.score += 10;
      statusRight.textContent = `SCORE: ${gs.score}`;
      spawnFood();
    } else {
      gs.snake.pop();
    }

    draw();
  }

  function endGame() {
    clearInterval(gs.tick);
    gs.phase = 'over';
    statusLeft.textContent = `FINAL SCORE: ${gs.score}`;
    draw();
  }

  function closeSnake() {
    clearInterval(gs.tick);
    clearInterval(gs.blinkTimer);
    document.removeEventListener('keydown', onKey, true);
    closeBtn.removeEventListener('click', closeSnake);
    win.style.transition = 'opacity 0.15s';
    win.style.opacity = '0';
    setTimeout(() => {
      win.remove();
      state.mode = 'menu';
      updateEggDisplay();
    }, 150);
  }

  function onKey(e) {
    if (e.key === 'Escape') { e.stopPropagation(); closeSnake(); return; }

    if (gs.phase === 'start' && e.key === 'Enter') {
      e.stopPropagation();
      clearInterval(gs.blinkTimer);
      startGame();
      return;
    }

    if (gs.phase === 'over' && e.key === 'Enter') {
      e.stopPropagation();
      startGame();
      return;
    }

    if (gs.phase === 'playing') {
      const dirs = {
        ArrowUp:    { x: 0, y: -1 },
        ArrowDown:  { x: 0, y:  1 },
        ArrowLeft:  { x: -1, y: 0 },
        ArrowRight: { x:  1, y: 0 },
      };
      if (dirs[e.key]) {
        e.preventDefault();
        e.stopPropagation();
        const nd = dirs[e.key];
        if (nd.x !== -gs.dir.x || nd.y !== -gs.dir.y) gs.nextDir = nd;
      }
    }
  }

  document.addEventListener('keydown', onKey, true);
  closeBtn.addEventListener('click', closeSnake);

  // Start screen blink
  gs.blinkTimer = setInterval(() => { gs.blinkOn = !gs.blinkOn; draw(); }, 500);
  draw();
}

export { eggSnake };
