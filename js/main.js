'use strict';

// ── CONFIG ───────────────────────────────────────────────────────────────────

const LINKEDIN_URL = 'https://www.linkedin.com/in/jaredratner/';
const MEDIUM_URL   = 'https://medium.com/@jared.ratner2';
const GITHUB_URL   = 'https://github.com/OrangeB0lt';

const MENU_ITEMS = [
  { label: 'RESUME',    action: 'resume'   },
  { label: 'ABOUT ME',  action: 'about'    },
  { label: 'PROJECTS',  action: 'projects' },
  { label: 'SKILLS',    action: 'skills'   },
  { label: 'CONTACT',   action: 'contact'  },
  { label: 'MAN JARED', action: 'manjared' },
  { label: 'LINKEDIN',  action: 'linkedin' },
  { label: 'MEDIUM',    action: 'medium'   },
];

const FORTUNES = [
  '"It works on my machine." -- famous last words',
  'Have you tried turning it off and on again?',
  'The on-call rotation does not negotiate\nwith sleep schedules.',
  'kubectl delete pod --all is not a\nmonitoring strategy.',
  'There are 2 hard problems in CS: cache\ninvalidation, naming, and off-by-one errors.',
  'Your YAML indentation is wrong.\nIt is always your YAML indentation.',
  '"Just a quick config change." -- last words\nbefore the outage',
  'Terraform plan looks good.\nTerraform apply: surprise.',
  'The docs said "optional".\nThe prod box disagreed.',
  'git push --force in production: a memoir.',
  'Monitoring is not a substitute for\nnot breaking things.',
  '"I will add the tests later." -- an autobiography',
  'The pipeline failed because you forgot\nthe semicolon. Again.',
  'Always read the Terraform destroy output.\nAlways.',
  'chmod 777 is not a solution. It is a confession.',
];

const PROJECTS = [
  {
    name:  'S.P.A.C.E.',
    desc:  'Tower defense strategy game',
    perms: '-rwxr-xr-x',
    long:  'Space Paradox And Combat Environment — browser-based tower defense built with Phaser 3. Custom enemy pathing, multiple tower types, and escalating wave difficulty. Live at spacetower.space.',
    stack: ['JavaScript', 'Phaser 3', 'HTML5 Canvas', 'CSS'],
    link:  'https://github.com/OrangeB0lt/S.P.A.C.E.',
  },
  {
    name:  'generic-app-docker',
    desc:  'Full-stack Docker Compose starter',
    perms: 'drwxr-xr-x',
    long:  'Production-ready boilerplate for spinning up a full-stack app in one command. FastAPI backend on :8000, React + Vite frontend on :3000, PostgreSQL 16. Designed to be cloned and shipped.',
    stack: ['Python', 'FastAPI', 'React', 'Vite', 'PostgreSQL', 'Docker'],
    link:  'https://github.com/OrangeB0lt/generic-app-docker',
  },
  {
    name:  'ollama-api-local',
    desc:  'Local API bridge for Ollama LLM server',
    perms: '-rwxr-xr-x',
    long:  'Lightweight API layer that proxies requests between a local application and a locally-running Ollama instance. Fully on-prem LLM inference — no cloud, no telemetry, no vendor lock-in.',
    stack: ['Python', 'Ollama', 'REST API'],
    link:  'https://github.com/OrangeB0lt/ollama-api-local',
  },
  {
    name:  'monty',
    desc:  'Bytecode interpreter in C',
    perms: '-rwxr-xr-x',
    long:  'A C implementation of a stack/queue-based interpreter for Monty bytecode scripts. Supports push, pop, swap, arithmetic ops, and dual stack/queue modes. Written from scratch.',
    stack: ['C', 'Systems Programming', 'Data Structures'],
    link:  'https://github.com/OrangeB0lt/monty',
  },
  {
    name:  'ParticleGround-Portfolio',
    desc:  'This site — C64 terminal portfolio',
    perms: 'drwxr-xr-x',
    long:  'Commodore 64-themed interactive portfolio. Zero frameworks — vanilla JS, CSS, HTML. Boot sequence, terminal navigation, animated skill bars, simulated browser popup, and easter eggs. Try typing "matrix".',
    stack: ['JavaScript', 'CSS', 'HTML', 'Canvas API'],
    link:  'https://github.com/OrangeB0lt/ParticleGround-Portfolio',
  },
];

const EGG_COMMANDS = new Set(['matrix', 'starwars', 'startrek', 'lolcow', 'nyan', 'sudo', 'hack', 'help']);

// ── STATE ────────────────────────────────────────────────────────────────────

const state = {
  mode: 'boot',       // 'boot' | 'menu' | 'section' | 'projects' | 'easter' | 'browser'
  bootAborted: false,
  menuIndex: 0,
  projectIndex: 0,
  expandedProject: null,
  skillsActive: false,
  eggBuffer: '',
  eggTimer: null,
  eggOverlay: null,
  prevMode: 'menu',
};

// ── DOM ──────────────────────────────────────────────────────────────────────

const $terminal = document.getElementById('terminal');
const $screen   = document.getElementById('screen');
const $eggInput = document.getElementById('egg-input');
const $escBtn   = document.getElementById('esc-btn');
$escBtn.addEventListener('click', () => backToMenu());

// ── UTILS ────────────────────────────────────────────────────────────────────

function delay(ms) {
  if (state.bootAborted) return Promise.resolve();
  return new Promise(r => setTimeout(r, ms));
}

async function typeText(el, text, speed = 35) {
  for (let i = 0; i < text.length; i++) {
    if (state.bootAborted) { el.textContent += text.slice(i); return; }
    el.textContent += text[i];
    await new Promise(r => setTimeout(r, speed));
  }
}

async function typeLine(parent, text, speed = 35) {
  const div = document.createElement('div');
  parent.appendChild(div);
  await typeText(div, text, speed);
  scrollBottom();
  return div;
}

function appendHTML(parent, html, cls) {
  const div = document.createElement('div');
  if (cls) div.className = cls;
  div.innerHTML = html;
  parent.appendChild(div);
  scrollBottom();
  return div;
}

function scrollBottom() {
  $screen.scrollTop = $screen.scrollHeight;
}

async function flashClear() {
  $screen.classList.add('flash');
  await new Promise(r => setTimeout(r, 150));
  $terminal.innerHTML = '';
  $screen.classList.remove('flash');
  $screen.scrollTop = 0;
}

function backHint(msg) {
  return `<div class="back-hint">${msg || '[ESC] BACK TO MENU'}</div>`;
}

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

  await flashClear();
  state.bootAborted = false;
  renderMenu();
}

// ── MAIN MENU ────────────────────────────────────────────────────────────────

function renderMenu() {
  state.mode = 'menu';
  state.skillsActive = false;
  state.expandedProject = null;
  $escBtn.classList.remove('visible');
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
    el.innerHTML = `<span class="menu-arrow">${i === state.menuIndex ? '>' : '\u00a0'}</span> ${item.label}`;
    el.addEventListener('click',      () => { state.menuIndex = i; activateItem(i); });
    el.addEventListener('mouseenter', () => { state.menuIndex = i; syncMenuCursor(); });
    list.appendChild(el);
  });

  appendHTML(wrap, '[ARROW KEYS / CLICK TO SELECT] [ENTER TO OPEN]', 'menu-hint');
}

function syncMenuCursor() {
  if (state.mode !== 'menu') return;
  $terminal.querySelectorAll('.menu-item').forEach((el, i) => {
    const active = i === state.menuIndex;
    el.classList.toggle('selected', active);
    el.querySelector('.menu-arrow').textContent = active ? '>' : '\u00a0';
  });
}

function activateItem(i) {
  const { action } = MENU_ITEMS[i];
  if (action === 'linkedin') { launchExternal('LINKEDIN', LINKEDIN_URL); return; }
  if (action === 'medium')   { launchExternal('MEDIUM',   MEDIUM_URL);   return; }
  showSection(action);
}

// ── SECTION ROUTER ───────────────────────────────────────────────────────────

const SECTION_CMDS = {
  about:    'cat about.txt',
  skills:   'cat skills.cfg',
  projects: 'ls -la ./projects/',
  contact:  'whois jared',
  manjared: 'man jared',
  resume:   'less resume.txt',
};

async function showSection(name) {
  await flashClear();
  state.mode = 'section';

  const cmdLine = document.createElement('div');
  cmdLine.className = 'cmd-line';
  $terminal.appendChild(cmdLine);
  cmdLine.innerHTML = `<span class="prompt">jared@ratner.me:~$</span> `;
  const cmdSpan = document.createElement('span');
  cmdLine.appendChild(cmdSpan);
  await typeText(cmdSpan, SECTION_CMDS[name] || name, 40);
  await delay(180);
  $escBtn.classList.add('visible');
  appendHTML($terminal, '', '');

  switch (name) {
    case 'about':    sectionAbout();          break;
    case 'skills':   sectionSkills();         break;
    case 'projects': sectionProjects();       break;
    case 'contact':  await sectionContact();  break;
    case 'manjared': sectionManJared();       break;
    case 'resume':   sectionResume();         break;
  }
  $screen.scrollTop = 0;
}

function backToMenu() {
  if (state.mode === 'menu' || state.mode === 'easter') return;
  state.skillsActive = false;
  renderMenu();
}

// ── ABOUT ME ─────────────────────────────────────────────────────────────────

function sectionAbout() {
  state.mode = 'section';
  $terminal.insertAdjacentHTML('beforeend', `
    <div class="section-content">
      <div class="section-header">---===[ ABOUT.TXT ]===---</div><br>
      <div>JARED RATNER // DEVOPS / SRE / BACKEND ENGINEER</div><br>
      <div>I build and break infrastructure for a living.</div>
      <div>Currently specializing in cloud-native systems,</div>
      <div>container orchestration, and automating everything</div>
      <div>that can be automated (and a few things that</div>
      <div>probably shouldn't be).</div><br>
      <div class="section-divider">---===---</div><br>
      <div>Day job: DevOps Engineer II at Veeder-Root.</div>
      <div>Previous: SRE at Ancera, where I co-developed</div>
      <div>a patented CRISPR analysis algorithm and saved</div>
      <div>1000+ engineering hours/year through automation.</div><br>
      <div class="section-divider">---===---</div><br>
      <div>SPECIALTIES:</div>
      <div>&nbsp;&nbsp;• Kubernetes / container orchestration</div>
      <div>&nbsp;&nbsp;• Infrastructure as Code (Terraform, Ansible)</div>
      <div>&nbsp;&nbsp;• Cloud platforms (AWS primary, Azure secondary)</div>
      <div>&nbsp;&nbsp;• Observability (Prometheus, Grafana, ELK)</div>
      <div>&nbsp;&nbsp;• CI/CD (GitHub Actions, ArgoCD, Jenkins)</div>
      <div>&nbsp;&nbsp;• Backend services (Python, Go, Bash, C#)</div><br>
      <div class="section-divider">---===---</div><br>
      <div class="hint-text">// try typing 'help' for more options</div><br>
      ${backHint()}
    </div>
  `);
  scrollBottom();
}

// ── SKILLS ───────────────────────────────────────────────────────────────────

function sectionSkills() {
  state.mode = 'section';
  state.skillsActive = true;

  const skillGroups = [
    { cat: 'INFRASTRUCTURE', items: [
      { name: 'AWS',        pct: 96 },
      { name: 'Kubernetes', pct: 75 },
      { name: 'Terraform',  pct: 85 },
      { name: 'Azure',      pct: 95 },
      { name: 'Ansible',    pct: 70 },
      { name: 'Docker',     pct: 90 },
    ]},
    { cat: 'BACKEND', items: [
      { name: 'Python',     pct: 90 },
      { name: 'Bash',       pct: 95 },
      { name: 'C#/.NET',    pct: 75 },
      { name: 'Go',         pct: 60 },
      { name: 'SQL',        pct: 70 },
    ]},
    { cat: 'OBSERVABILITY', items: [
      { name: 'Prometheus', pct: 80 },
      { name: 'Grafana',    pct: 80 },
      { name: 'ELK Stack',  pct: 75 },
    ]},
    { cat: 'CI/CD', items: [
      { name: 'GitHub Actions', pct: 90 },
      { name: 'ArgoCD',         pct: 75 },
      { name: 'Jenkins',        pct: 100 },
    ]},
  ];

  const wrap = document.createElement('div');
  wrap.className = 'section-content';
  $terminal.appendChild(wrap);

  appendHTML(wrap, '<span class="section-header">---===[ SKILLS.CFG ]===---</span>');
  appendHTML(wrap, '');

  const barEls = [];

  for (const grp of skillGroups) {
    appendHTML(wrap, `<span class="skill-cat">[${grp.cat}]</span>`);
    for (const sk of grp.items) {
      const row = document.createElement('div');
      row.className = 'skill-row';
      const lbl = sk.name.padEnd(14, '\u00a0');
      row.innerHTML =
        `<span class="skill-label">${lbl}</span> ` +
        `[<span class="skill-bar-inner" data-pct="${sk.pct}"></span>` +
        `<span class="skill-bar-empty">${'\u2591'.repeat(10)}</span>] ` +
        `<span class="skill-pct">&nbsp;&nbsp;0%</span>`;
      wrap.appendChild(row);
      barEls.push(row);
    }
    appendHTML(wrap, '');
  }

  appendHTML(wrap, backHint());

  // animate bars
  const BAR = 10;
  let step = 0;
  const tick = setInterval(() => {
    if (!state.skillsActive) { clearInterval(tick); return; }
    step++;
    for (const row of barEls) {
      const pct    = parseInt(row.querySelector('.skill-bar-inner').dataset.pct, 10);
      const filled = Math.round((pct / 100) * BAR * (step / BAR));
      const empty  = BAR - filled;
      row.querySelector('.skill-bar-inner').textContent = '\u2588'.repeat(Math.min(filled, BAR));
      row.querySelector('.skill-bar-empty').textContent = '\u2591'.repeat(Math.max(empty, 0));
      const disp = Math.round((pct * step) / BAR);
      row.querySelector('.skill-pct').textContent = String(Math.min(disp, pct)).padStart(3, '\u00a0') + '%';
    }
    if (step >= BAR) clearInterval(tick);
  }, 80);
}

// ── PROJECTS ─────────────────────────────────────────────────────────────────

function sectionProjects() {
  state.mode = 'projects';
  state.projectIndex = 0;
  state.expandedProject = null;
  renderProjects();
}

function renderProjects() {
  const old = $terminal.querySelector('.projects-content');
  if (old) old.remove();

  const wrap = document.createElement('div');
  wrap.className = 'section-content projects-content';
  $terminal.appendChild(wrap);

  appendHTML(wrap, '<span class="section-header">---===[ ./PROJECTS/ ]===---</span>');
  appendHTML(wrap, `<span class="ls-header">total ${PROJECTS.length}</span>`);
  appendHTML(wrap, '');

  PROJECTS.forEach((p, i) => {
    const sel = i === state.projectIndex;
    const exp = state.expandedProject === i;

    const row = document.createElement('div');
    row.className = 'project-row' + (sel ? ' selected' : '');

    const arrow = `<span class="proj-arrow">${sel ? '>' : '\u00a0'}</span>`;
    row.innerHTML =
      `${arrow} <span class="proj-perms">${p.perms}</span>&nbsp;&nbsp;` +
      `<span class="proj-name">${p.name}</span>&nbsp;&nbsp;` +
      `<span class="proj-desc">${p.desc}</span>`;

    if (exp) {
      const details = document.createElement('div');
      details.className = 'project-expanded';
      details.innerHTML =
        `<div>&nbsp;&nbsp;\u251C\u2500\u2500 ${p.long}</div>` +
        `<div>&nbsp;&nbsp;\u251C\u2500\u2500 STACK: ${p.stack.join(' | ')}</div>` +
        `<div>&nbsp;&nbsp;\u2514\u2500\u2500 <a href="${p.link}" target="_blank" rel="noopener">${p.link}</a></div>`;
      row.appendChild(details);
    }

    row.addEventListener('click', () => {
      state.projectIndex = i;
      state.expandedProject = state.expandedProject === i ? null : i;
      renderProjects();
    });
    row.addEventListener('mouseenter', () => {
      if (state.projectIndex !== i) { state.projectIndex = i; renderProjects(); }
    });

    wrap.appendChild(row);
  });

  appendHTML(wrap, '');
  appendHTML(wrap, backHint('[ARROWS] NAVIGATE &nbsp;[ENTER] EXPAND &nbsp;[ESC] BACK'));
  scrollBottom();
}

// ── CONTACT ──────────────────────────────────────────────────────────────────

async function sectionContact() {
  state.mode = 'section';

  const wrap = document.createElement('div');
  wrap.className = 'section-content';
  $terminal.appendChild(wrap);

  appendHTML(wrap, '<span class="section-header">% WHOIS JARED RATNER</span>');
  appendHTML(wrap, '');

  const fields = [
    { label: 'Name',     val: 'Jared Ratner' },
    { label: 'Email',    val: `<a href="mailto:jared.ratner2@gmail.com" rel="noopener">jared.ratner2@gmail.com</a>` },
    { label: 'GitHub',   val: `<a href="${GITHUB_URL}" target="_blank" rel="noopener">${GITHUB_URL}</a>` },
    { label: 'LinkedIn', val: `<a href="${LINKEDIN_URL}" target="_blank" rel="noopener">${LINKEDIN_URL}</a>` },
    { label: 'Location', val: '153 Boylston St #1, Boston, MA' },
    { label: 'Status',   val: '<span class="status-available">AVAILABLE FOR OPPORTUNITIES</span>' },
  ];

  for (const f of fields) {
    const row = document.createElement('div');
    row.className = 'whois-row';
    row.style.opacity = '0';
    row.innerHTML = `<span class="whois-label">${(f.label + ':').padEnd(11, '\u00a0')}</span> ${f.val}`;
    wrap.appendChild(row);
    await new Promise(r => setTimeout(r, 200));
    row.style.transition = 'opacity 0.3s';
    row.style.opacity = '1';
    scrollBottom();
  }

  await new Promise(r => setTimeout(r, 300));
  appendHTML(wrap, '');
  appendHTML(wrap, backHint());
  scrollBottom();
}

// ── MAN JARED ────────────────────────────────────────────────────────────────

function sectionManJared() {
  state.mode = 'section';
  $terminal.insertAdjacentHTML('beforeend', `
    <div class="section-content man-page">
      <div class="man-header">JARED(1)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;User Commands&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;JARED(1)</div><br>
      <div class="man-section">NAME</div>
      <div class="man-body">&nbsp;&nbsp;&nbsp;&nbsp;jared - DevOps/SRE/Backend engineer and occasional over-engineer</div><br>
      <div class="man-section">SYNOPSIS</div>
      <div class="man-body">&nbsp;&nbsp;&nbsp;&nbsp;jared [--coffee-required] [--on-call] [--kubernetes] &lt;task&gt;</div><br>
      <div class="man-section">DESCRIPTION</div>
      <div class="man-body">&nbsp;&nbsp;&nbsp;&nbsp;jared(1) is a cloud-native engineer optimized for building resilient</div>
      <div class="man-body">&nbsp;&nbsp;&nbsp;&nbsp;infrastructure, automating toil, and explaining why "it works on my</div>
      <div class="man-body">&nbsp;&nbsp;&nbsp;&nbsp;machine" is not acceptable in production.</div><br>
      <div class="man-section">OPTIONS</div>
      <div class="man-body">&nbsp;&nbsp;&nbsp;&nbsp;--coffee-required</div>
      <div class="man-body">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Will not function before first coffee. Side effects: excessive</div>
      <div class="man-body">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;YAML and unsolicited Terraform advice.</div><br>
      <div class="man-body">&nbsp;&nbsp;&nbsp;&nbsp;--on-call-veteran</div>
      <div class="man-body">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Has been paged at 3am more times than medically advisable.</div>
      <div class="man-body">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Remains functional. Barely.</div><br>
      <div class="man-body">&nbsp;&nbsp;&nbsp;&nbsp;--automates-everything</div>
      <div class="man-body">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;If a task is done twice, it will be scripted. If done three</div>
      <div class="man-body">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;times, it gets a Terraform module, a GitHub Action, and a</div>
      <div class="man-body">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Confluence page nobody will read.</div><br>
      <div class="man-body">&nbsp;&nbsp;&nbsp;&nbsp;--kubernetes</div>
      <div class="man-body">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Deploys everything to Kubernetes. Yes, including the blog.</div>
      <div class="man-body">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Yes, including the static site. No regrets.</div><br>
      <div class="man-section">ENVIRONMENT VARIABLES</div>
      <div class="man-body">&nbsp;&nbsp;&nbsp;&nbsp;$PREFERRED_EDITOR&nbsp;&nbsp;&nbsp;vim (non-negotiable)</div>
      <div class="man-body">&nbsp;&nbsp;&nbsp;&nbsp;$CLOUD_PROVIDER&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;AWS (primary), Azure (secondary)</div>
      <div class="man-body">&nbsp;&nbsp;&nbsp;&nbsp;$INCIDENT_RESPONSE&nbsp;&nbsp;"Have you tried turning it off and on again?"</div>
      <div class="man-body">&nbsp;&nbsp;&nbsp;&nbsp;$TERRAFORM_STATE&nbsp;&nbsp;&nbsp;&nbsp;s3://definitely-backed-up</div>
      <div class="man-body">&nbsp;&nbsp;&nbsp;&nbsp;$ON_CALL_MOOD&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;f(hour, coffee_count)</div><br>
      <div class="man-section">BUGS</div>
      <div class="man-body">&nbsp;&nbsp;&nbsp;&nbsp;Occasionally over-engineers solutions.</div>
      <div class="man-body">&nbsp;&nbsp;&nbsp;&nbsp;Known to write Terraform for personal projects.</div>
      <div class="man-body">&nbsp;&nbsp;&nbsp;&nbsp;Will refactor working code "just to clean it up."</div>
      <div class="man-body">&nbsp;&nbsp;&nbsp;&nbsp;SEE ALSO: lolcow easter egg (try typing 'lolcow')</div><br>
      <div class="man-section">SEE ALSO</div>
      <div class="man-body">&nbsp;&nbsp;&nbsp;&nbsp;<a href="${LINKEDIN_URL}" target="_blank" rel="noopener">linkedin(1)</a>,&nbsp; <a href="${GITHUB_URL}" target="_blank" rel="noopener">github(1)</a>,&nbsp; resume(1)</div><br>
      <div class="man-footer">JARED(1)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;User Commands&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;JARED(1)</div><br>
      ${backHint()}
    </div>
  `);
  scrollBottom();
}

// ── RESUME ───────────────────────────────────────────────────────────────────

function sectionResume() {
  state.mode = 'section';
  $terminal.insertAdjacentHTML('beforeend', `
    <div class="section-content resume-content">
      <div class="section-header">---===[ RESUME.TXT ]===---</div><br>
      <div>JARED RATNER</div>
      <div class="dim-text">jared.ratner2@gmail.com &nbsp;|&nbsp; ratner.me &nbsp;|&nbsp; Avon, CT</div>
      <div class="dim-text"><a href="${GITHUB_URL}" target="_blank" rel="noopener">github.com/OrangeB0lt</a> &nbsp;|&nbsp; <a href="${LINKEDIN_URL}" target="_blank" rel="noopener">linkedin.com/in/jaredratner</a></div>
      <br>

      <div class="resume-section-head">TECHNICAL SKILLS</div>
      <div class="resume-bullet">Certs: CompTIA A+, Holberton Full Stack</div>
      <div class="resume-bullet">Languages: Python, C#, C/C++, Bash, Go, Java, Kotlin, SQL, JS, PHP, HTML, CSS, Ruby</div>
      <div class="resume-bullet">Frameworks: FastAPI, Flask, Django, .NET Core, React, NextJS, Pandas</div>
      <div class="resume-bullet">DevOps: Docker, Terraform, Azure, AWS, Jenkins, ArgoCD, Ansible, SOC2, CI/CD</div>
      <div class="resume-bullet">Databases: PostgreSQL, MongoDB, Redis, MySQL, SQLite</div>
      <br>

      <div class="resume-section-head">EXPERIENCE</div>

      <div class="resume-job-title">Veeder-Root &mdash; DevOps Engineer II &nbsp;[2025&ndash;Present]</div>
      <div class="resume-bullet">Automated software version reporting across sister companies</div>
      <div class="resume-bullet">Refactored AWS infrastructure with Terraform modules</div>
      <div class="resume-bullet">Deployed Proxmox VE virtualization with automated backups</div>
      <div class="resume-bullet">Built secure AWS-hosted document/password manager</div>
      <div class="resume-bullet">Replaced legacy Jenkins CI/CD pipeline with modern tooling</div>
      <br>

      <div class="resume-job-title">Ancera &mdash; SRE / DevOps &nbsp;[2021&ndash;2025]</div>
      <div class="resume-bullet">Led full-stack Azure and on-prem network design</div>
      <div class="resume-bullet">Co-developed patented CRISPR filtering algorithm</div>
      <div class="resume-bullet">Built automation tooling saving 1000+ engineering hours/year</div>
      <div class="resume-bullet">Built Ansible deployment pipelines and CI/CD workflows</div>
      <div class="resume-bullet">Managed 30+ contractors and optimized cloud spend</div>
      <br>

      <div class="resume-job-title">Bodangly Software &mdash; Software Engineer &nbsp;[2020&ndash;2021]</div>
      <div class="resume-bullet">Developed APIs for IoT devices and Azure IoT Hub</div>
      <div class="resume-bullet">Created drivers for nVidia GPU visual processing</div>
      <div class="resume-bullet">Built Vue.js frontend for Litecoin exchange platform</div>
      <br>

      <div class="resume-job-title">V-Technologies &mdash; Software Support Specialist &nbsp;[2018]</div>
      <div class="resume-bullet">Automated API calls and data pipelines for logistics integration</div>
      <div class="resume-bullet">Wrote Python scripts and managed SQL/RDS environments</div>
      <br>

      <div class="resume-job-title">NPS &mdash; IT Intern &nbsp;[2017]</div>
      <div class="resume-bullet">Hardware imaging and setup for medical offices</div>
      <br>

      <div class="resume-section-head">EDUCATION</div>
      <div class="resume-bullet">Holberton School of Software Engineering &mdash; Full Stack</div>
      <br>

      <div><a href="resume.pdf" target="_blank" rel="noopener">[ DOWNLOAD RESUME.PDF ]</a></div>
      <br>
      ${backHint()}
    </div>
  `);
  scrollBottom();
}

// ── EXTERNAL LINKS ───────────────────────────────────────────────────────────

function launchExternal(name, url) {
  state.prevMode = state.mode;
  state.mode = 'browser';
  $escBtn.classList.remove('visible');
  updateEggDisplay();
  showBrowser(name, url);
}

function showBrowser(name, url) {
  const host = new URL(url).hostname;
  const browser = document.createElement('div');
  browser.className = 'sim-browser';
  browser.id = 'sim-browser';

  // Title bar
  const titlebar = document.createElement('div');
  titlebar.className = 'sim-browser-titlebar';
  const winctrls = document.createElement('span');
  winctrls.className = 'sim-browser-winctrls';
  winctrls.textContent = '[\u25fc][\u25fb]';
  const title = document.createElement('div');
  title.className = 'sim-browser-title';
  title.textContent = `NETSCAPE C64 \u2014 ${name}`;
  const closeBtn = document.createElement('button');
  closeBtn.className = 'sim-browser-close';
  closeBtn.textContent = '[X]';
  closeBtn.addEventListener('click', closeBrowser);
  titlebar.append(winctrls, title, closeBtn);

  // URL bar
  const urlbar = document.createElement('div');
  urlbar.className = 'sim-browser-urlbar';
  const nav = document.createElement('span');
  nav.className = 'sim-browser-nav';
  nav.textContent = '[<] [>] [\u21ba]';
  const urlDisplay = document.createElement('div');
  urlDisplay.className = 'sim-browser-url';
  urlDisplay.textContent = url;
  urlbar.append(nav, urlDisplay);

  // Body
  const body = document.createElement('div');
  body.className = 'sim-browser-body';

  const loadOverlay = document.createElement('div');
  loadOverlay.className = 'sim-browser-loading';
  const loadText = document.createElement('div');
  loadText.className = 'sim-browser-load-text';
  loadText.textContent = `RENDERING ${host.toUpperCase()}...`;
  const loadSub = document.createElement('div');
  loadSub.className = 'sim-browser-load-sub';
  loadSub.textContent = 'Capturing screenshot — may take a moment';
  loadOverlay.append(loadText, loadSub);
  body.appendChild(loadOverlay);

  // Status bar
  const statusbar = document.createElement('div');
  statusbar.className = 'sim-browser-statusbar';
  const statusEl = document.createElement('span');
  statusEl.className = 'sim-browser-status';
  statusEl.textContent = 'LOADING...';
  const newTab = document.createElement('a');
  newTab.className = 'sim-browser-newtab';
  newTab.href = url;
  newTab.target = '_blank';
  newTab.rel = 'noopener';
  newTab.textContent = '[OPEN IN NEW TAB]';
  statusbar.append(statusEl, newTab);

  browser.append(titlebar, urlbar, body, statusbar);
  document.getElementById('crt').appendChild(browser);

  // Load screenshot — use local asset for sites that require auth, Microlink otherwise
  const LOCAL_SCREENSHOTS = {
    'www.linkedin.com': 'assets/linkedin.png',
  };
  const screenshotUrl = LOCAL_SCREENSHOTS[host]
    || `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;
  const img = document.createElement('img');
  img.className = 'sim-browser-screenshot';
  img.src = screenshotUrl;
  img.alt = name;
  img.title = `Click to open ${host} in a new tab`;
  body.appendChild(img);

  const timeout = setTimeout(() => {
    loadOverlay.remove();
    img.remove();
    showBlockedScreen(body, host, url, statusEl);
  }, 25000);

  img.addEventListener('load', () => {
    clearTimeout(timeout);
    loadOverlay.remove();
    img.style.opacity = '1';
    statusEl.textContent = 'CLICK TO OPEN';
  });

  img.addEventListener('error', () => {
    clearTimeout(timeout);
    loadOverlay.remove();
    img.remove();
    showBlockedScreen(body, host, url, statusEl);
  });

  img.addEventListener('click', () => window.open(url, '_blank', 'noopener'));
}

function showBlockedScreen(body, host, url, statusEl) {
  statusEl.textContent = 'ERR_SCREENSHOT_FAILED';
  const blocked = document.createElement('div');
  blocked.className = 'sim-browser-blocked';
  blocked.innerHTML =
    '<div class="sim-browser-blocked-title">RENDER FAILED</div>' +
    `<div class="sim-browser-blocked-host">${host}</div>` +
    '<div class="sim-browser-blocked-err">ERR_SCREENSHOT_UNAVAILABLE</div>' +
    '<div class="sim-browser-blocked-info">Could not capture page screenshot.</div>' +
    `<a href="${url}" target="_blank" rel="noopener" class="sim-browser-blocked-link">[ OPEN IN NEW TAB &rarr; ]</a>`;
  body.appendChild(blocked);
}

function closeBrowser() {
  const browser = document.getElementById('sim-browser');
  if (!browser) return;
  browser.style.transition = 'opacity 0.15s';
  browser.style.opacity = '0';
  setTimeout(() => {
    browser.remove();
    state.mode = state.prevMode || 'menu';
    if (!$terminal.querySelector('.menu-wrap')) renderMenu();
    updateEggDisplay();
  }, 150);
}

// ── EASTER EGG INPUT SYSTEM ───────────────────────────────────────────────────

function updateEggDisplay() {
  if (state.mode === 'boot' || state.mode === 'easter' || state.mode === 'browser') {
    $eggInput.style.opacity = '0';
    return;
  }
  $eggInput.textContent = `jared@ratner.me:~$\u00a0${state.eggBuffer}`;
  const cur = document.createElement('span');
  cur.className = 'egg-cursor';
  $eggInput.appendChild(cur);
  $eggInput.style.opacity = '1';
}

function clearEgg() {
  state.eggBuffer = '';
  if (state.eggTimer) { clearTimeout(state.eggTimer); state.eggTimer = null; }
  updateEggDisplay();
}

async function eggNotFound(cmd) {
  $eggInput.textContent = `bash: ${cmd}: command not found`;
  $eggInput.style.opacity = '1';
  await new Promise(r => setTimeout(r, 2500));
  clearEgg();
}

function handleEggKey(key) {
  if (state.mode === 'easter') return;

  if (key === 'Escape') { clearEgg(); return; }

  if (key === 'Enter') {
    const cmd = state.eggBuffer.trim().toLowerCase();
    clearEgg();
    if (!cmd) return;
    if (EGG_COMMANDS.has(cmd)) runEgg(cmd);
    else eggNotFound(cmd);
    return;
  }

  if (key === 'Backspace') {
    state.eggBuffer = state.eggBuffer.slice(0, -1);
    updateEggDisplay();
    return;
  }

  if (key.length === 1 && /[\w]/.test(key)) {
    state.eggBuffer += key.toLowerCase();
    if (state.eggTimer) clearTimeout(state.eggTimer);
    state.eggTimer = setTimeout(clearEgg, 3000);
    updateEggDisplay();
  }
}

// ── EASTER EGG RUNNER ────────────────────────────────────────────────────────

function runEgg(cmd) {
  state.prevMode = state.mode;
  state.mode = 'easter';

  switch (cmd) {
    case 'matrix':   eggMatrix();   break;
    case 'starwars': eggStarWars(); break;
    case 'startrek': eggStarTrek(); break;
    case 'lolcow':   eggLolcow();   break;
    case 'nyan':     eggNyan();     break;
    case 'sudo':     eggSudo();     break;
    case 'hack':     eggHack();     break;
    case 'help':     eggHelp();     break;
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
  state.mode = state.prevMode || 'menu';
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

// ── LOLCOW ───────────────────────────────────────────────────────────────────

function eggLolcow() {
  const ov = makeOverlay('#000');
  ov.style.display = 'flex';
  ov.style.alignItems = 'center';
  ov.style.justifyContent = 'center';

  const fortune = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
  const lines   = fortune.split('\n');
  const maxLen  = Math.max(...lines.map(l => l.length));
  const bar     = '_'.repeat(maxLen + 2);
  const dash    = '-'.repeat(maxLen + 2);

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

  const pre = document.createElement('pre');
  pre.className = 'lolcow-text';
  pre.textContent = bubble + '\n' + cow;
  ov.appendChild(pre);

  const hint = document.createElement('div');
  hint.style.cssText = 'color:#5050c8;font-family:monospace;font-size:10px;margin-top:16px;text-align:center;';
  hint.textContent = '[ press any key ]';
  ov.appendChild(hint);

  onceKeyDismiss(ov);
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
      line.textContent = '\u2588'.repeat(18);
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
      ? '\u2605  \u00b7  \u2736  \u00b7  \u2605  \u00b7  \u2736  \u00b7  \u2605'
      : '\u00b7  \u2605  \u00b7  \u2736  \u00b7  \u2605  \u00b7  \u2736  \u00b7';
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
  const ov = makeOverlay('#000');
  ov.style.display = 'flex';
  ov.style.alignItems = 'center';
  ov.style.justifyContent = 'center';

  const pre = document.createElement('pre');
  pre.className = 'egg-text';
  pre.style.color = '#f5f500';
  pre.innerHTML = `<span style="color:#7c70da">HELP(1)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Hidden Commands&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;HELP(1)</span>

<span style="color:#ffffff">NAME</span>
    help &mdash; list available easter egg commands

<span style="color:#ffffff">COMMANDS</span>
    <span style="color:#00ff41">matrix</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Full-screen Matrix rain (10s or any key)
    <span style="color:#00ff41">starwars</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ASCII Star Wars opening crawl
    <span style="color:#00ff41">startrek</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Warp jump + Captain's Log
    <span style="color:#00ff41">lolcow</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ASCII cow with random DevOps fortune
    <span style="color:#00ff41">nyan</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Nyan cat animation (8s or any key)
    <span style="color:#00ff41">sudo</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Try to escalate privileges
    <span style="color:#00ff41">hack</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Hollywood hacking sequence
    <span style="color:#00ff41">help</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;This page

<span style="color:#ffffff">USAGE</span>
    Start typing anywhere on the page.
    A prompt appears in the bottom-left corner.
    Press ENTER to execute. ESC to cancel.
    Buffer clears after 3 seconds of inactivity.

<span style="color:#7c70da">HELP(1)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Hidden Commands&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;HELP(1)</span>

<span style="color:#2020a0">[ press any key to dismiss ]</span>
`;
  ov.appendChild(pre);
  onceKeyDismiss(ov);
}

// ── KEYBOARD HANDLER ─────────────────────────────────────────────────────────

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
      } else if (state.mode === 'projects') {
        state.projectIndex = (state.projectIndex - 1 + PROJECTS.length) % PROJECTS.length;
        renderProjects();
      }
      break;

    case 'ArrowDown':
      e.preventDefault();
      if (state.mode === 'menu') {
        state.menuIndex = (state.menuIndex + 1) % MENU_ITEMS.length;
        syncMenuCursor();
      } else if (state.mode === 'projects') {
        state.projectIndex = (state.projectIndex + 1) % PROJECTS.length;
        renderProjects();
      }
      break;

    case 'Enter':
      if (state.eggBuffer) {
        handleEggKey('Enter');
      } else if (state.mode === 'menu') {
        activateItem(state.menuIndex);
      } else if (state.mode === 'projects') {
        state.expandedProject = state.expandedProject === state.projectIndex ? null : state.projectIndex;
        renderProjects();
      } else {
        handleEggKey('Enter');
      }
      break;

    case 'Escape':
      if (state.mode === 'browser') {
        closeBrowser();
      } else if (state.mode === 'section' || state.mode === 'projects') {
        backToMenu();
      }
      clearEgg();
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

// ── INIT ─────────────────────────────────────────────────────────────────────

if (!globalThis.__TEST_ENV__) runBoot();

// ── TEST EXPORTS ──────────────────────────────────────────────────────────────

export {
  state,
  MENU_ITEMS, PROJECTS, FORTUNES, EGG_COMMANDS,
  LINKEDIN_URL, MEDIUM_URL, GITHUB_URL,
  handleEggKey, clearEgg, backToMenu,
  delay, typeText,
  renderMenu, syncMenuCursor,
  runBoot,
};
