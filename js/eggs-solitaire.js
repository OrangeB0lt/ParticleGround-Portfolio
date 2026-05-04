'use strict';

import { state } from './state.js';
import { appendPreText } from './utils.js';
import { updateEggDisplay } from './egg-input.js';

// ── KLONDIKE SOLITAIRE ────────────────────────────────────────────────────────

function eggSolitaire() {
  if (!state.fsDir) {
    state.mode = 'menu';
    appendPreText('bash: ./solitaire.prg: No such file or directory', '#ff4444');
    return;
  }

  const CARD_W = 50, CARD_H = 72;
  const PAD = 12, GAP = 8, STACK_OFFSET = 18;
  const W = PAD + 7 * CARD_W + 6 * GAP + PAD;       // 430
  const TABLEAU_Y = PAD + CARD_H + GAP;             // 92
  const H = TABLEAU_Y + CARD_H + 18 * STACK_OFFSET + PAD; // 488 (room for ~19-card columns)

  // Build window using sim-browser chrome (matches snake)
  const win = document.createElement('div');
  win.className = 'sim-browser';
  win.style.zIndex = '55';

  const titlebar = document.createElement('div');
  titlebar.className = 'sim-browser-titlebar';
  const winctrls = document.createElement('span');
  winctrls.className = 'sim-browser-winctrls';
  winctrls.textContent = '[◼][◻]';
  const title = document.createElement('span');
  title.className = 'sim-browser-title';
  title.textContent = 'SOLITAIRE v1.0 — JARED\'S ARCADE';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'sim-browser-close';
  closeBtn.textContent = '[X]';
  titlebar.appendChild(winctrls);
  titlebar.appendChild(title);
  titlebar.appendChild(closeBtn);

  const urlbar = document.createElement('div');
  urlbar.className = 'sim-browser-urlbar';
  const nav = document.createElement('span');
  nav.className = 'sim-browser-nav';
  nav.textContent = '[<] [>] [↺]';
  const url = document.createElement('span');
  url.className = 'sim-browser-url';
  url.textContent = './games/solitaire.prg';
  urlbar.appendChild(nav);
  urlbar.appendChild(url);

  const body = document.createElement('div');
  body.className = 'sim-browser-body';
  body.style.background = '#0a5320';
  body.style.display = 'flex';
  body.style.alignItems = 'center';
  body.style.justifyContent = 'center';

  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  canvas.style.display = 'block';
  canvas.style.border = '2px solid #4040e8';
  canvas.style.boxSizing = 'content-box';
  canvas.style.cursor = 'pointer';
  body.appendChild(canvas);

  const statusbar = document.createElement('div');
  statusbar.className = 'sim-browser-statusbar';
  const statusLeft = document.createElement('span');
  statusLeft.textContent = 'CLICK STOCK TO DRAW';
  const statusRight = document.createElement('span');
  statusRight.textContent = 'MOVES: 0';
  statusbar.appendChild(statusLeft);
  statusbar.appendChild(statusRight);

  win.appendChild(titlebar);
  win.appendChild(urlbar);
  win.appendChild(body);
  win.appendChild(statusbar);
  document.getElementById('crt').appendChild(win);

  const ctx = canvas.getContext('2d');

  // suits: 0=♠ 1=♥ 2=♦ 3=♣  (red = 1 or 2)
  const SUITS = ['♠', '♥', '♦', '♣'];
  const RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const gs = {
    stock: [],
    waste: [],
    foundations: [[], [], [], []],
    tableau: [[], [], [], [], [], [], []],
    selected: null,
    won: false,
    moves: 0,
  };

  function dealNewGame() {
    const deck = [];
    for (let s = 0; s < 4; s++)
      for (let r = 1; r <= 13; r++)
        deck.push({ suit: s, rank: r, faceUp: false });
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    for (let c = 0; c < 7; c++) {
      for (let k = 0; k <= c; k++) {
        const card = deck.pop();
        card.faceUp = (k === c);
        gs.tableau[c].push(card);
      }
    }
    gs.stock = deck;
  }

  function isRed(card)   { return card.suit === 1 || card.suit === 2; }
  function topOf(pile)   { return pile.length > 0 ? pile[pile.length - 1] : null; }

  function canMoveToFoundation(card, fIdx) {
    const top = topOf(gs.foundations[fIdx]);
    if (!top) return card.rank === 1;
    return card.suit === top.suit && card.rank === top.rank + 1;
  }

  function canMoveToTableau(card, col) {
    const top = topOf(gs.tableau[col]);
    if (!top) return card.rank === 13;
    if (!top.faceUp) return false;
    return isRed(card) !== isRed(top) && card.rank === top.rank - 1;
  }

  // Card faces ─────────────────────────────────────────────────────────────────
  function drawCard(x, y, card, selected) {
    if (!card.faceUp) {
      ctx.fillStyle = '#2020a0';
      ctx.fillRect(x, y, CARD_W, CARD_H);
      ctx.strokeStyle = '#4040e8';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 3.5, y + 3.5, CARD_W - 7, CARD_H - 7);
    } else {
      ctx.fillStyle = '#fafafa';
      ctx.fillRect(x, y, CARD_W, CARD_H);
      ctx.fillStyle = isRed(card) ? '#d40000' : '#101010';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(RANKS[card.rank], x + 3, y + 3);
      ctx.fillText(SUITS[card.suit], x + 3, y + 17);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(RANKS[card.rank], x + CARD_W - 3, y + CARD_H - 17);
      ctx.fillText(SUITS[card.suit], x + CARD_W - 3, y + CARD_H - 3);
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(SUITS[card.suit], x + CARD_W / 2, y + CARD_H / 2);
    }
    ctx.strokeStyle = selected ? '#ffd700' : '#000';
    ctx.lineWidth = selected ? 2 : 1;
    ctx.strokeRect(x + 0.5, y + 0.5, CARD_W - 1, CARD_H - 1);
  }

  function drawEmptySlot(x, y, label) {
    ctx.strokeStyle = '#1a8030';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, CARD_W - 1, CARD_H - 1);
    if (label) {
      ctx.fillStyle = '#1a8030';
      ctx.font = '20px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x + CARD_W / 2, y + CARD_H / 2);
    }
  }

  // Pile coordinates ──────────────────────────────────────────────────────────
  const stockX = PAD, stockY = PAD;
  const wasteX = PAD + (CARD_W + GAP), wasteY = PAD;
  function foundationX(f) { return PAD + (3 + f) * (CARD_W + GAP); }
  function tableauX(c)    { return PAD + c * (CARD_W + GAP); }

  function draw() {
    ctx.fillStyle = '#0a5320';
    ctx.fillRect(0, 0, W, H);

    // Stock
    if (gs.stock.length > 0) drawCard(stockX, stockY, { faceUp: false }, false);
    else                     drawEmptySlot(stockX, stockY, '↻');

    // Waste
    if (gs.waste.length > 0) {
      const sel = gs.selected && gs.selected.pile === 'waste';
      drawCard(wasteX, wasteY, topOf(gs.waste), sel);
    } else {
      drawEmptySlot(wasteX, wasteY, null);
    }

    // Foundations
    for (let f = 0; f < 4; f++) {
      const fx = foundationX(f);
      if (gs.foundations[f].length > 0) {
        const sel = gs.selected && gs.selected.pile === 'foundation' && gs.selected.col === f;
        drawCard(fx, PAD, topOf(gs.foundations[f]), sel);
      } else {
        drawEmptySlot(fx, PAD, SUITS[f]);
      }
    }

    // Tableau
    for (let c = 0; c < 7; c++) {
      const cx = tableauX(c);
      const col = gs.tableau[c];
      if (col.length === 0) {
        drawEmptySlot(cx, TABLEAU_Y, null);
      } else {
        for (let k = 0; k < col.length; k++) {
          const cy = TABLEAU_Y + k * STACK_OFFSET;
          const sel = gs.selected
                   && gs.selected.pile === 'tableau'
                   && gs.selected.col === c
                   && k >= gs.selected.idx;
          drawCard(cx, cy, col[k], sel);
        }
      }
    }

    if (gs.won) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, H / 2 - 40, W, 80);
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('YOU WIN!', W / 2, H / 2 - 10);
      ctx.fillStyle = '#fff';
      ctx.font = '12px monospace';
      ctx.fillText(`Solved in ${gs.moves} moves`, W / 2, H / 2 + 16);
    }
  }

  // Hit-testing ───────────────────────────────────────────────────────────────
  function hitTest(mx, my) {
    if (my >= PAD && my < PAD + CARD_H) {
      if (mx >= stockX && mx < stockX + CARD_W) return { pile: 'stock' };
      if (mx >= wasteX && mx < wasteX + CARD_W) return { pile: 'waste' };
      for (let f = 0; f < 4; f++) {
        const fx = foundationX(f);
        if (mx >= fx && mx < fx + CARD_W) return { pile: 'foundation', col: f };
      }
    }
    for (let c = 0; c < 7; c++) {
      const cx = tableauX(c);
      if (mx >= cx && mx < cx + CARD_W) {
        const col = gs.tableau[c];
        if (col.length === 0) {
          if (my >= TABLEAU_Y && my < TABLEAU_Y + CARD_H) {
            return { pile: 'tableau', col: c, idx: 0, empty: true };
          }
          return null;
        }
        for (let k = 0; k < col.length; k++) {
          const ky = TABLEAU_Y + k * STACK_OFFSET;
          const isLast = k === col.length - 1;
          const bottom = isLast ? ky + CARD_H : ky + STACK_OFFSET;
          if (my >= ky && my < bottom) return { pile: 'tableau', col: c, idx: k };
        }
        return null;
      }
    }
    return null;
  }

  // Move logic ────────────────────────────────────────────────────────────────
  function drawFromStock() {
    if (gs.stock.length > 0) {
      const c = gs.stock.pop();
      c.faceUp = true;
      gs.waste.push(c);
    } else {
      while (gs.waste.length > 0) {
        const c = gs.waste.pop();
        c.faceUp = false;
        gs.stock.push(c);
      }
    }
  }

  function tryMove(src, dst) {
    let cards;
    if (src.pile === 'waste') {
      if (gs.waste.length === 0) return false;
      cards = [topOf(gs.waste)];
    } else if (src.pile === 'foundation') {
      const fp = gs.foundations[src.col];
      if (fp.length === 0) return false;
      cards = [topOf(fp)];
    } else if (src.pile === 'tableau') {
      const col = gs.tableau[src.col];
      if (col.length === 0 || src.idx < 0 || src.idx >= col.length) return false;
      if (!col[src.idx].faceUp) return false;
      cards = col.slice(src.idx);
    } else {
      return false;
    }

    if (dst.pile === 'foundation') {
      if (cards.length !== 1) return false;
      if (!canMoveToFoundation(cards[0], dst.col)) return false;
    } else if (dst.pile === 'tableau') {
      if (!canMoveToTableau(cards[0], dst.col)) return false;
    } else {
      return false;
    }

    if (src.pile === 'waste')           gs.waste.pop();
    else if (src.pile === 'foundation') gs.foundations[src.col].pop();
    else                                gs.tableau[src.col].splice(src.idx);

    if (dst.pile === 'foundation') gs.foundations[dst.col].push(cards[0]);
    else                           gs.tableau[dst.col].push(...cards);

    if (src.pile === 'tableau') {
      const srcCol = gs.tableau[src.col];
      const newTop = topOf(srcCol);
      if (newTop && !newTop.faceUp) newTop.faceUp = true;
    }
    return true;
  }

  function checkWin() {
    const total = gs.foundations.reduce((s, f) => s + f.length, 0);
    if (total === 52) gs.won = true;
  }

  function sameSelection(hit, sel) {
    if (hit.pile !== sel.pile) return false;
    if (hit.pile === 'waste') return true;
    if (hit.pile === 'foundation') return hit.col === sel.col;
    if (hit.pile === 'tableau') return hit.col === sel.col && hit.idx === sel.idx;
    return false;
  }

  function updateStatus() {
    if (gs.won)            statusLeft.textContent = 'YOU WIN!';
    else if (gs.selected)  statusLeft.textContent = 'CLICK TARGET PILE';
    else                   statusLeft.textContent = 'CLICK STOCK TO DRAW';
    statusRight.textContent = `MOVES: ${gs.moves}`;
  }

  function handleClick(e) {
    if (gs.won) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width  / rect.width);
    const my = (e.clientY - rect.top)  * (canvas.height / rect.height);
    const hit = hitTest(mx, my);

    // Stock click always wins (deselects + draws/recycles)
    if (hit && hit.pile === 'stock') {
      gs.selected = null;
      drawFromStock();
      updateStatus();
      draw();
      return;
    }

    if (!gs.selected) {
      if (!hit) return;
      if (hit.pile === 'waste' && gs.waste.length > 0) {
        gs.selected = { pile: 'waste' };
      } else if (hit.pile === 'foundation' && gs.foundations[hit.col].length > 0) {
        gs.selected = { pile: 'foundation', col: hit.col };
      } else if (hit.pile === 'tableau' && !hit.empty) {
        const card = gs.tableau[hit.col][hit.idx];
        if (card && card.faceUp) {
          gs.selected = { pile: 'tableau', col: hit.col, idx: hit.idx };
        }
      }
      updateStatus();
      draw();
      return;
    }

    if (!hit) {
      gs.selected = null;
      updateStatus();
      draw();
      return;
    }

    if (sameSelection(hit, gs.selected)) {
      gs.selected = null;
      updateStatus();
      draw();
      return;
    }

    const moved = tryMove(gs.selected, hit);
    gs.selected = null;
    if (moved) {
      gs.moves++;
      checkWin();
    }
    updateStatus();
    draw();
  }

  function closeSolitaire() {
    document.removeEventListener('keydown', onKey, true);
    canvas.removeEventListener('click', handleClick);
    closeBtn.removeEventListener('click', closeSolitaire);
    win.style.transition = 'opacity 0.15s';
    win.style.opacity = '0';
    setTimeout(() => {
      win.remove();
      state.mode = 'menu';
      updateEggDisplay();
    }, 150);
  }

  function onKey(e) {
    if (e.key === 'Escape') { e.stopPropagation(); closeSolitaire(); }
  }

  dealNewGame();
  canvas.addEventListener('click', handleClick);
  document.addEventListener('keydown', onKey, true);
  closeBtn.addEventListener('click', closeSolitaire);
  draw();
}

export { eggSolitaire };
