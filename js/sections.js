'use strict';

import { PROJECTS, LINKEDIN_URL, GITHUB_URL } from './config.js';
import { $terminal } from './dom.js';
import { appendHTML, scrollBottom, escapeHTML } from './utils.js';
import { initFs } from './fs.js';

// ── ABOUT ME ─────────────────────────────────────────────────────────────────

function sectionAbout() {
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
      <div class="hint-text">// try typing 'help' for more options</div>
    </div>
  `);
  scrollBottom();
}

// ── SKILLS ───────────────────────────────────────────────────────────────────

function sectionSkills() {
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
      const lbl = sk.name.padEnd(14, ' ');
      row.innerHTML =
        `<span class="skill-label">${lbl}</span> ` +
        `[<span class="skill-bar-inner" data-pct="${sk.pct}"></span>` +
        `<span class="skill-bar-empty">${'░'.repeat(10)}</span>] ` +
        `<span class="skill-pct">&nbsp;&nbsp;0%</span>`;
      wrap.appendChild(row);
      barEls.push(row);
    }
    appendHTML(wrap, '');
  }

  // animate bars (each invocation owns its own ticker; multiple skills calls run independently)
  const BAR = 10;
  let step = 0;
  const tick = setInterval(() => {
    step++;
    for (const row of barEls) {
      const pct    = parseInt(row.querySelector('.skill-bar-inner').dataset.pct, 10);
      const filled = Math.round((pct / 100) * BAR * (step / BAR));
      const empty  = BAR - filled;
      row.querySelector('.skill-bar-inner').textContent = '█'.repeat(Math.min(filled, BAR));
      row.querySelector('.skill-bar-empty').textContent = '░'.repeat(Math.max(empty, 0));
      const disp = Math.round((pct * step) / BAR);
      row.querySelector('.skill-pct').textContent = String(Math.min(disp, pct)).padStart(3, ' ') + '%';
    }
    if (step >= BAR) clearInterval(tick);
  }, 80);
  scrollBottom();
}

// ── PROJECTS ─────────────────────────────────────────────────────────────────

const PROJECT_FILES = ['space.md', 'generic-app.md', 'ollama-api.md', 'monty.md', 'ratnerme.md'];

function sectionProjects() {
  initFs();
  const wrap = document.createElement('div');
  wrap.className = 'section-content projects-content';
  $terminal.appendChild(wrap);

  appendHTML(wrap, '<span class="section-header">---===[ ./PROJECTS/ ]===---</span>');
  appendHTML(wrap, `<span class="ls-header">total ${PROJECTS.length}</span>`);
  appendHTML(wrap, '');

  PROJECTS.forEach((p, i) => {
    const file = PROJECT_FILES[i];
    const row = document.createElement('div');
    row.className = 'project-row';
    row.innerHTML =
      `<span class="proj-perms">${p.perms}</span>&nbsp;&nbsp;` +
      `<span class="proj-name">${file}</span>&nbsp;&nbsp;` +
      `<span class="proj-desc">${p.desc}</span>`;
    wrap.appendChild(row);
  });

  appendHTML(wrap, '');
  appendHTML(wrap, "// type 'cat &lt;name&gt;.md' for details", 'hint-text');
  scrollBottom();
}

function renderProjectDetail(idx) {
  const p = PROJECTS[idx];
  const block = document.createElement('div');
  block.className = 'project-expanded';
  block.innerHTML =
    `<div>├── ${escapeHTML(p.long)}</div>` +
    `<div>├── STACK: ${escapeHTML(p.stack.join(' | '))}</div>` +
    `<div>└── <a href="${p.link}" target="_blank" rel="noopener">${escapeHTML(p.link)}</a></div>`;
  $terminal.appendChild(block);
  scrollBottom();
}

// ── CONTACT ──────────────────────────────────────────────────────────────────

async function sectionContact() {
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
    { label: 'Location', val: '250 Totoket Rd North Branford, CT 06471' },
    { label: 'Status',   val: '<span class="status-available">AVAILABLE FOR OPPORTUNITIES</span>' },
  ];

  for (const f of fields) {
    const row = document.createElement('div');
    row.className = 'whois-row';
    row.style.opacity = '0';
    row.innerHTML = `<span class="whois-label">${(f.label + ':').padEnd(11, ' ')}</span> ${f.val}`;
    wrap.appendChild(row);
    await new Promise(r => setTimeout(r, 200));
    row.style.transition = 'opacity 0.3s';
    row.style.opacity = '1';
    scrollBottom();
  }

  await new Promise(r => setTimeout(r, 300));
  appendHTML(wrap, '');
  scrollBottom();
}

// ── MAN JARED ────────────────────────────────────────────────────────────────

function sectionManJared() {
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
      <div class="man-body">&nbsp;&nbsp;&nbsp;&nbsp;SEE ALSO: cowsay easter egg (try typing 'cowsay')</div><br>
      <div class="man-section">SEE ALSO</div>
      <div class="man-body">&nbsp;&nbsp;&nbsp;&nbsp;<a href="${LINKEDIN_URL}" target="_blank" rel="noopener">linkedin(1)</a>,&nbsp; <a href="${GITHUB_URL}" target="_blank" rel="noopener">github(1)</a>,&nbsp; resume(1)</div><br>
      <div class="man-footer">JARED(1)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;User Commands&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;JARED(1)</div>
    </div>
  `);
  scrollBottom();
}

// ── RESUME ───────────────────────────────────────────────────────────────────

function sectionResume() {
  $terminal.insertAdjacentHTML('beforeend', `
    <div class="section-content resume-content">
      <div class="section-header">---===[ RESUME.TXT ]===---</div><br>
      <div>JARED RATNER</div>
      <div class="dim-text">jared.ratner2@gmail.com &nbsp;|&nbsp; ratner.me &nbsp;|&nbsp; Boston, MA</div>
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
    </div>
  `);
  scrollBottom();
}

export {
  PROJECT_FILES,
  sectionAbout, sectionSkills, sectionProjects, renderProjectDetail,
  sectionContact, sectionManJared, sectionResume,
};
