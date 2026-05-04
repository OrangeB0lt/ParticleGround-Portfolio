'use strict';

import { LINKEDIN_URL, MEDIUM_URL, GITHUB_URL, EGG_COMMANDS } from './config.js';
import { $terminal } from './dom.js';
import { appendCmdLine, appendOutput, escapeHTML } from './utils.js';
import { renderMenu } from './menu.js';
import {
  sectionAbout, sectionSkills, sectionProjects,
  sectionContact, sectionManJared, sectionResume,
} from './sections.js';
import { launchExternal } from './browser.js';
import { runEgg } from './egg-runtime.js';

// ── SECTION ROUTER ───────────────────────────────────────────────────────────

const SECTION_CMDS = {
  about:    'cat about.txt',
  skills:   'cat skills.cfg',
  projects: 'ls -la ./projects/',
  contact:  'whois jared',
  manjared: 'man jared',
  resume:   'less resume.txt',
};

const SECTION_RENDERERS = {
  about:    () => sectionAbout(),
  skills:   () => sectionSkills(),
  projects: () => sectionProjects(),
  contact:  () => sectionContact(),
  manjared: () => sectionManJared(),
  resume:   () => sectionResume(),
};

const EXTERNAL_LINKS = {
  linkedin: () => ['LINKEDIN', LINKEDIN_URL],
  medium:   () => ['MEDIUM',   MEDIUM_URL],
  github:   () => ['GITHUB',   GITHUB_URL],
};

// ── COMMAND DISPATCHER ───────────────────────────────────────────────────────

async function runCommand(input, { echoAs } = {}) {
  const raw = (input || '').trim();
  if (!raw) return;
  appendCmdLine(echoAs ?? raw);

  const lower = raw.toLowerCase();
  const [head, ...args] = lower.split(/\s+/);

  // clear: wipe scrollback + redraw menu (the cmd-line we just echoed gets wiped too)
  if (head === 'clear') {
    $terminal.innerHTML = '';
    renderMenu();
    return;
  }

  // section name typed directly (e.g. "about", "skills")
  if (SECTION_RENDERERS[head] && args.length === 0) {
    await SECTION_RENDERERS[head]();
    return;
  }

  // section command-string typed (e.g. "cat about.txt", "man jared")
  for (const [name, cmdStr] of Object.entries(SECTION_CMDS)) {
    if (lower === cmdStr) { await SECTION_RENDERERS[name](); return; }
  }

  // external link aliases
  if (EXTERNAL_LINKS[head]) {
    const [label, url] = EXTERNAL_LINKS[head]();
    launchExternal(label, url);
    return;
  }

  // egg dispatch (matrix, ls, cd, cat, etc.)
  if (EGG_COMMANDS.has(head) || EGG_COMMANDS.has(raw)) {
    runEgg(raw);
    return;
  }

  // unknown
  appendOutput(`bash: ${escapeHTML(head)}: command not found`, 'cmd-error');
}

export { SECTION_CMDS, SECTION_RENDERERS, EXTERNAL_LINKS, runCommand };
