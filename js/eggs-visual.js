'use strict';

import { FORTUNES } from './config.js';
import { $terminal } from './dom.js';
import { appendPreText, scrollBottom } from './utils.js';
import { makeOverlay, removeOverlay } from './egg-runtime.js';

// ── MATRIX ───────────────────────────────────────────────────────────────────

function eggMatrix() {
  const ov = makeOverlay('#000');
  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  ov.appendChild(canvas);

  const crt = document.getElementById('crt');
  const W = crt.clientWidth  || window.innerWidth;
  const H = crt.clientHeight || window.innerHeight;
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const COLS  = Math.floor(W / 16);
  const drops = Array.from({ length: COLS }, () => Math.random() * -50);
  const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモラリルレロワヲン0123456789ABCDEF';

  const interval = setInterval(() => {
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#00ff41';
    ctx.font = '14px monospace';
    for (let i = 0; i < drops.length; i++) {
      ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], i * 16, drops[i] * 16);
      if (drops[i] * 16 > H && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  }, 50);

  let done = false;
  const stop = () => {
    if (done) return;
    done = true;
    clearInterval(interval);
    clearTimeout(autoStop);
    document.removeEventListener('keydown', keyHandler, true);
    ov.style.transition = 'opacity 0.5s';
    ov.style.opacity = '0';
    setTimeout(removeOverlay, 500);
  };

  const keyHandler = e => { e.stopPropagation(); stop(); };
  document.addEventListener('keydown', keyHandler, true);
  const autoStop = setTimeout(stop, 10000);
}

// ── STAR WARS ────────────────────────────────────────────────────────────────

function eggStarWars() {
  const ov = makeOverlay('#000');
  ov.style.overflow = 'hidden';

  const crawlWrap = document.createElement('div');
  crawlWrap.className = 'sw-crawl-wrap';
  ov.appendChild(crawlWrap);

  const crawl = document.createElement('div');
  crawl.className = 'sw-crawl';
  crawl.innerHTML = `
    <div class="sw-logo">A long time ago in a galaxy far, far away....</div>
    <br><br>
    <div class="sw-title">&star;&nbsp; STAR WARS &nbsp;&star;</div>
    <br>
    <div class="sw-episode">Episode IV: A NEW JOB</div>
    <br><br>
    <div class="sw-body">It is a period of cloud migration.</div>
    <div class="sw-body">Rebel engineers, striking from</div>
    <div class="sw-body">hidden Kubernetes clusters, have</div>
    <div class="sw-body">won their first victory against</div>
    <div class="sw-body">the evil Legacy Monolith.</div>
    <br>
    <div class="sw-body">During the battle, Rebel spies</div>
    <div class="sw-body">managed to steal secret plans to</div>
    <div class="sw-body">the Monolith's ultimate weakness --</div>
    <div class="sw-body">a complete lack of automated testing.</div>
    <br>
    <div class="sw-body">Pursued by the Monolith's sinister</div>
    <div class="sw-body">agents, JARED RATNER races home,</div>
    <div class="sw-body">custodian of the stolen Terraform</div>
    <div class="sw-body">state that can save his people and</div>
    <div class="sw-body">restore freedom to the cloud....</div>
    <br><br><br><br>
  `;
  crawlWrap.appendChild(crawl);

  let done = false;
  const stop = () => {
    if (done) return;
    done = true;
    document.removeEventListener('keydown', keyHandler, true);
    ov.style.transition = 'opacity 0.4s';
    ov.style.opacity = '0';
    setTimeout(removeOverlay, 400);
  };
  const keyHandler = e => { e.stopPropagation(); stop(); };
  document.addEventListener('keydown', keyHandler, true);
  crawl.addEventListener('animationend', stop);
}

// ── STAR TREK ────────────────────────────────────────────────────────────────

function eggStarTrek() {
  const ov = makeOverlay('#000');
  ov.style.overflow = 'hidden';

  let warpInterval = null;
  let phaseTimer   = null;
  let done         = false;

  const stop = () => {
    if (done) return;
    done = true;
    clearInterval(warpInterval);
    clearTimeout(phaseTimer);
    document.removeEventListener('keydown', keyHandler, true);
    ov.style.transition = 'opacity 0.3s';
    ov.style.opacity = '0';
    setTimeout(removeOverlay, 300);
  };
  const keyHandler = e => { e.stopPropagation(); stop(); };
  document.addEventListener('keydown', keyHandler, true);

  // ── Phase 1: warp jump ──────────────────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;';
  ov.appendChild(canvas);

  const crt = document.getElementById('crt');
  const W = crt.clientWidth;
  const H = crt.clientHeight;
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const newStar = () => {
    const angle = Math.random() * Math.PI * 2;
    return { angle, dist: Math.random() * 15 + 3, speed: 2 + Math.random() * 5 };
  };
  const stars = Array.from({ length: 220 }, newStar);

  let warpFrame = 0;
  warpInterval = setInterval(() => {
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(0, 0, W, H);
    for (const s of stars) {
      const px = W / 2 + Math.cos(s.angle) * s.dist;
      const py = H / 2 + Math.sin(s.angle) * s.dist;
      s.dist += s.speed * (1 + warpFrame * 0.045);
      const nx = W / 2 + Math.cos(s.angle) * s.dist;
      const ny = H / 2 + Math.sin(s.angle) * s.dist;
      ctx.strokeStyle = `rgba(255,248,200,${Math.min(1, s.dist / 70)})`;
      ctx.lineWidth   = Math.min(2.5, s.dist / 55);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      if (nx < -10 || nx > W + 10 || ny < -10 || ny > H + 10) Object.assign(s, newStar());
    }
    warpFrame++;
  }, 16);

  const warpMsg = document.createElement('div');
  warpMsg.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--font-main);font-size:11px;color:#ffe81f;letter-spacing:0.15em;animation:blink 0.5s step-end infinite;';
  warpMsg.textContent = 'WARP FACTOR 9';
  ov.appendChild(warpMsg);

  // ── Phase 2: Captain's Log ──────────────────────────────────────
  phaseTimer = setTimeout(() => {
    if (done) return;
    clearInterval(warpInterval);
    canvas.remove();
    warpMsg.remove();

    ov.style.display        = 'flex';
    ov.style.flexDirection  = 'column';
    ov.style.alignItems     = 'center';
    ov.style.justifyContent = 'center';
    ov.style.padding        = '20px';

    const now        = new Date();
    const dayOfYear  = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    const stardate   = ((now.getFullYear() - 2000 + 13) * 100 + Math.floor(dayOfYear / 3.65)).toFixed(1);

    const ship = document.createElement('pre');
    ship.style.cssText = 'font-family:var(--font-main);font-size:8px;color:#7c70da;text-align:center;line-height:1.7;margin-bottom:14px;white-space:pre;';
    ship.textContent = [
      '           _____________ ',
      '          / NCC - 1701  \\',
      '    ______/_______________\\_______________________ ',
      '   |   --/               \\--                      |===>',
      '   |_____\\_______________/________________________|',
      '          \\             / ',
      '           \\___________/ ',
      '                 || ',
      '            _____|_____ ',
      '           |___________| ',
      '           |___________| ',
    ].join('\n');

    const log = document.createElement('pre');
    log.style.cssText = 'font-family:var(--font-main);font-size:8px;color:#f5f500;line-height:2;white-space:pre;text-align:left;';
    log.textContent = [
      `CAPTAIN'S LOG  STARDATE ${stardate}`,
      '',
      'USS ENTERPRISE  NCC-1701-D',
      '================================',
      '',
      'CHIEF ENGINEER J. RATNER reporting.',
      'All systems operating at warp capacity.',
      '',
      '  KUBERNETES    ......... [ WARP  ]',
      '  TERRAFORM     ......... [ APPLY ]',
      '  CI/CD         ......... [ RUN   ]',
      '  COFFEE        ......... [ EMPTY ]',
      '',
      'Mission: To explore strange new codebases.',
      'To seek out new pipelines and clusters.',
      'To boldly deploy where no one has before.',
      '',
      '================================',
      '',
      '          [ PRESS ANY KEY ]',
    ].join('\n');

    ov.appendChild(ship);
    ov.appendChild(log);
  }, 2500);
}

// ── COWSAY ───────────────────────────────────────────────────────────────────

function eggCowsay(args = []) {
  const text = args.length
    ? args.join(' ')
    : FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
  const lines  = text.split('\n');
  const maxLen = Math.max(...lines.map(l => l.length));
  const bar    = '_'.repeat(maxLen + 2);
  const dash   = '-'.repeat(maxLen + 2);

  let bubble = ` ${bar}\n`;
  if (lines.length === 1) {
    bubble += `< ${lines[0].padEnd(maxLen, ' ')} >\n`;
  } else {
    bubble += `/ ${lines[0].padEnd(maxLen, ' ')} \\\n`;
    for (let i = 1; i < lines.length - 1; i++) {
      bubble += `| ${lines[i].padEnd(maxLen, ' ')} |\n`;
    }
    bubble += `\\ ${lines[lines.length - 1].padEnd(maxLen, ' ')} /\n`;
  }
  bubble += ` ${dash}`;

  const cow = [
    '        \\   ^__^',
    '         \\  (oo)\\_______',
    '            (__)\\       )\\/\\',
    '                ||----w |',
    '                ||     ||',
  ].join('\n');

  appendPreText(bubble + '\n' + cow);
}

// ── NYAN CAT ─────────────────────────────────────────────────────────────────

function eggNyan() {
  const ov = makeOverlay('#000');
  ov.style.display = 'flex';
  ov.style.flexDirection = 'column';
  ov.style.alignItems = 'center';
  ov.style.justifyContent = 'center';

  const RAINBOW = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#8800ff'];

  const CAT_LINES = [
    '     .-----.',
    '    /  ^ ^  \\',
    '   |  (w)   |',
    '   |  ===   |--~',
    '    \\       /',
    '     `-----`',
    '     |  |  |',
    '    /|  |  |\\',
  ];

  const container = document.createElement('div');
  container.style.cssText = 'font-family:monospace;font-size:13px;line-height:1.5;';
  ov.appendChild(container);

  const titleEl = document.createElement('div');
  titleEl.style.cssText = 'margin-top:16px;font-family:monospace;font-size:14px;letter-spacing:4px;';
  ov.appendChild(titleEl);

  let frame = 0;

  const render = () => {
    container.innerHTML = '';

    // rainbow + cat side by side
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';

    const rainbowDiv = document.createElement('div');
    for (let i = 0; i < 6; i++) {
      const line = document.createElement('div');
      line.style.color = RAINBOW[(i + frame) % 6];
      line.textContent = '█'.repeat(18);
      rainbowDiv.appendChild(line);
    }

    const catDiv = document.createElement('div');
    catDiv.style.marginLeft = '8px';
    CAT_LINES.forEach(l => {
      const d = document.createElement('div');
      d.style.color = '#ddd';
      d.textContent = l;
      catDiv.appendChild(d);
    });

    row.appendChild(rainbowDiv);
    row.appendChild(catDiv);
    container.appendChild(row);

    // stars row
    const stars = document.createElement('div');
    stars.style.cssText = `color:${RAINBOW[frame % 6]};margin-top:8px;`;
    stars.textContent = frame % 2 === 0
      ? '★  ·  ✶  ·  ★  ·  ✶  ·  ★'
      : '·  ★  ·  ✶  ·  ★  ·  ✶  ·';
    container.appendChild(stars);

    // cycling title
    titleEl.innerHTML = 'NYAN NYAN NYAN NYAN'.split('').map((c, i) =>
      `<span style="color:${RAINBOW[(i + frame) % 6]}">${c}</span>`
    ).join('');

    frame++;
  };

  render();
  const interval = setInterval(render, 180);

  let done = false;
  const stop = () => {
    if (done) return;
    done = true;
    clearInterval(interval);
    clearTimeout(autoStop);
    document.removeEventListener('keydown', keyHandler, true);
    removeOverlay();
  };
  const keyHandler = e => { e.stopPropagation(); stop(); };
  document.addEventListener('keydown', keyHandler, true);
  const autoStop = setTimeout(stop, 8000);
}

// ── SUDO ─────────────────────────────────────────────────────────────────────

async function eggSudo() {
  const ov = makeOverlay('#000');
  ov.style.padding = '40px';
  ov.style.display = 'flex';
  ov.style.flexDirection = 'column';
  ov.style.justifyContent = 'center';

  const pre = document.createElement('pre');
  pre.className = 'egg-text';
  pre.style.color = '#f5f500';
  ov.appendChild(pre);

  const lines = [
    'We trust you have received the usual lecture from the',
    'local System Administrator. It usually boils down to',
    'these three things:',
    '',
    '    #1) Respect the privacy of others.',
    '    #2) Think before you type.',
    '    #3) With great power comes great responsibility.',
    '',
    '[sudo] password for jared: ',
  ];

  for (const line of lines) {
    pre.textContent += line + '\n';
    await new Promise(r => setTimeout(r, 90));
  }

  await new Promise(r => setTimeout(r, 1400));
  pre.textContent += '\nSorry, try again.\n';
  await new Promise(r => setTimeout(r, 800));
  pre.textContent += '[sudo] password for jared: \n';
  await new Promise(r => setTimeout(r, 900));
  pre.textContent += '\njared is not in the sudoers file.\n';
  await new Promise(r => setTimeout(r, 300));
  pre.textContent += 'This incident has been reported.\n';

  await new Promise(r => setTimeout(r, 3000));
  removeOverlay();
}

// ── HACK ─────────────────────────────────────────────────────────────────────

async function eggHack() {
  const ov = makeOverlay('#000');
  ov.style.overflow = 'hidden';

  const pre = document.createElement('pre');
  pre.className = 'egg-text hack-text';
  pre.style.cssText = 'color:#00ff41;font-size:10px;padding:20px;line-height:1.4;';
  ov.appendChild(pre);

  const hex = () => {
    let s = '';
    for (let i = 0; i < 64; i++) {
      s += '0123456789ABCDEF'[Math.floor(Math.random() * 16)];
      if ((i + 1) % 4 === 0) s += ' ';
    }
    return s;
  };

  let lines = [];
  const interval = setInterval(() => {
    lines.push(hex());
    if (lines.length > 22) lines.shift();
    pre.textContent = lines.join('\n');
  }, 55);

  await new Promise(r => setTimeout(r, 3000));
  clearInterval(interval);
  pre.textContent = '';
  pre.style.fontSize = '14px';
  pre.style.textAlign = 'center';
  pre.style.paddingTop = '20%';

  const steps = [
    'INITIATING BREACH SEQUENCE...',
    'BYPASSING FIREWALL.............. [OK]',
    'CRACKING ENCRYPTION............. [OK]',
    'ELEVATING PRIVILEGES............ [OK]',
    'ACCESSING MAINFRAME............. [OK]',
    '',
    '>>> ACCESS GRANTED <<<',
    '',
    'Welcome, jared.',
  ];

  for (const line of steps) {
    pre.textContent += line + '\n';
    await new Promise(r => setTimeout(r, 280));
  }

  await new Promise(r => setTimeout(r, 2500));
  ov.style.transition = 'opacity 0.5s';
  ov.style.opacity = '0';
  await new Promise(r => setTimeout(r, 500));
  removeOverlay();
}

// ── HELP ─────────────────────────────────────────────────────────────────────

function eggHelp() {
  const pre = document.createElement('pre');
  pre.className = 'egg-output-pre';
  pre.style.color = '#f5f500';
  pre.innerHTML = `<span style="color:#7c70da">HELP(1)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Hidden Commands&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;HELP(1)</span>

<span style="color:#ffffff">NAME</span>
    help &mdash; list available easter egg commands

<span style="color:#ffffff">COMMANDS</span>
    <span style="color:#00ff41">matrix</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Full-screen Matrix rain (10s or any key)
    <span style="color:#00ff41">starwars</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ASCII Star Wars opening crawl
    <span style="color:#00ff41">startrek</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Warp jump + Captain's Log
    <span style="color:#00ff41">cowsay</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ASCII cow with random DevOps fortune
    <span style="color:#00ff41">nyan</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Nyan cat animation (8s or any key)
    <span style="color:#00ff41">sudo</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Try to escalate privileges
    <span style="color:#00ff41">hack</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Hollywood hacking sequence
    <span style="color:#00ff41">help</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;This page

<span style="color:#ffffff">FILESYSTEM</span>
    <span style="color:#00ff41">ls</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;List files &nbsp;&nbsp;<span style="color:#888">ls -la</span> for long format
    <span style="color:#00ff41">cat</span> &lt;file&gt;&nbsp;&nbsp;&nbsp;Print file contents
    <span style="color:#00ff41">nano</span> &lt;file&gt;&nbsp;&nbsp;Open fake text editor (saves as &lt;CORRUPTED&gt;)
    <span style="color:#00ff41">vi</span> &lt;file&gt;&nbsp;&nbsp;&nbsp;&nbsp;Like nano but with existential weight
    <span style="color:#00ff41">touch</span> &lt;f&gt;&nbsp;&nbsp;&nbsp;Create a file &nbsp;&nbsp;<span style="color:#888">ls to see it</span>
    <span style="color:#00ff41">mkdir</span> &lt;d&gt;&nbsp;&nbsp;&nbsp;Create a directory
    <span style="color:#00ff41">rm</span> &lt;file&gt;&nbsp;&nbsp;&nbsp;Delete a file &nbsp;&nbsp;<span style="color:#888">rm -rf node_modules</span> if you dare
    <span style="color:#00ff41">cd</span> &lt;dir&gt;&nbsp;&nbsp;&nbsp;&nbsp;Go somewhere (you won't)
    <span style="color:#00ff41">pwd</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Print working directory
    <span style="color:#00ff41">chmod</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Change permissions (lol no)
    <span style="color:#00ff41">chown</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Change ownership (also no)
    <span style="color:#00ff41">whoami</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;...are you sure?
    <span style="color:#00ff41">uname -a</span>&nbsp;&nbsp;&nbsp;&nbsp;System information
    <span style="color:#00ff41">clear</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Clear the screen

<span style="color:#ffffff">USAGE</span>
    Start typing anywhere on the page.
    A prompt appears in the bottom-left corner.
    Press ENTER to execute. ESC to cancel.
    Buffer clears after 5 seconds of inactivity.
    Commands support arguments: &lt;space&gt;, <span style="color:#888">-flags</span>, <span style="color:#888">.dotfiles</span>

<span style="color:#7c70da">HELP(1)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Hidden Commands&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;HELP(1)</span>
`;
  $terminal.appendChild(pre);
  scrollBottom();
}

export {
  eggMatrix, eggStarWars, eggStarTrek, eggCowsay,
  eggNyan, eggSudo, eggHack, eggHelp,
};
