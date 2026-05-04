'use strict';

import { state } from './state.js';
import { appendPreText } from './utils.js';

// ── FAKE FILESYSTEM ──────────────────────────────────────────────────────────

function fmtMtime(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const m   = months[date.getMonth()];
  const d   = String(date.getDate()).padStart(2, ' ');
  const h   = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${m} ${d} ${h}:${min}`;
}

function initFs() {
  if (state.fsFiles) return;
  const now = fmtMtime(new Date());
  state.fsFiles = new Map([
    ['.git',         { type: 'dir',  perms: 'drwx------', links: 2,   owner: 'jared', group: 'staff', size: 64,     mtime: 'Apr 15 09:11', dot: true }],
    ['.ssh',         { type: 'dir',  perms: 'drwx------', links: 2,   owner: 'jared', group: 'staff', size: 64,     mtime: 'Mar 22 11:45', dot: true }],
    ['.bashrc',      { type: 'file', perms: '-rw-------', links: 1,   owner: 'jared', group: 'staff', size: 1337,   mtime: 'Apr  1 00:00', dot: true }],
    ['.env',         { type: 'file', perms: '-rw-------', links: 1,   owner: 'jared', group: 'staff', size: 42,     mtime: 'Apr  1 00:00', dot: true }],
    ['about.txt',    { type: 'file', perms: '-rw-r--r--', links: 1,   owner: 'jared', group: 'staff', size: 12480,  mtime: now }],
    ['games',        { type: 'dir',  perms: 'drwxr-xr-x', links: 2,   owner: 'jared', group: 'staff', size: 128,    mtime: 'May  4 10:00' }],
    ['index.html',   { type: 'file', perms: '-rw-r--r--', links: 1,   owner: 'jared', group: 'staff', size: 58392,  mtime: now }],
    ['main.js',      { type: 'file', perms: '-rw-r--r--', links: 1,   owner: 'jared', group: 'staff', size: 21043,  mtime: now }],
    ['node_modules', { type: 'dir',  perms: 'drwxr-xr-x', links: 999, owner: 'root',  group: 'root',  size: 999999, mtime: 'Dec 31  1969' }],
    ['resume.pdf',   { type: 'file', perms: '-rw-r--r--', links: 1,   owner: 'jared', group: 'staff', size: 485291, mtime: 'Apr 28 10:00' }],
    ['resume.txt',   { type: 'file', perms: '-rw-r--r--', links: 1,   owner: 'jared', group: 'staff', size: 9001,   mtime: 'May  1 08:00' }],
    ['skills.cfg',   { type: 'file', perms: '-rw-r--r--', links: 1,   owner: 'jared', group: 'staff', size: 2048,   mtime: 'May  1 08:00' }],
    ['style.css',    { type: 'file', perms: '-rw-r--r--', links: 1,   owner: 'jared', group: 'staff', size: 22053,  mtime: now }],
  ]);
}

function fsLongLine(_name, entry) {
  const links = String(entry.links || 1).padStart(3);
  const owner = (entry.owner || 'jared').padEnd(6);
  const group = (entry.group || 'staff').padEnd(6);
  const size  = String(entry.size  || 0).padStart(7);
  return `${entry.perms} ${links} ${owner} ${group} ${size} ${entry.mtime}`;
}

function eggDotfileError(filename, cmd) {
  appendPreText(
    `bash: ${cmd}: ${filename}: Permission denied\n` +
    `\nHint: try  sudo ${cmd} ${filename}\n` +
    `\n...actually, sudo won't help here.\n` +
    `This file is protected by something older than root.\n` +
    `Something hungry.`,
    '#ff4444'
  );
}

const CAT_CONTENT = {
  'about.txt':  '# jared ratner\ncloud engineer\nthe kind of person who automates their coffee order\nmy editor is vim and i will die on this hill',
  'main.js':    '// this is the one file.\n// everything lives here.\n// do not question it.',
  'style.css':  '/* it\'s all CRT green and nostalgia */\n/* yes, every color was chosen on purpose */\n/* no, i will not apologize */  ',
  'index.html': '<!DOCTYPE html>\n<!-- welcome. you\'re already inside. -->\n<!-- please wipe your feet. -->',
  'resume.pdf': 'bash: cat: resume.pdf: binary file (use xdg-open or just click the link above)',
  'resume.txt': 'NAME: Jared Ratner\nOCCUPATION: Cloud Engineer / Terminal Architect\nSKILLS: Bash, Python, Terraform, Kubernetes, Overthinking\nHOBBIES: Automating things that didn\'t need automating\nREFERENCES: Available upon kubectl get pod -A',
  'skills.cfg': '[languages]\npython=true\nbash=true\njavascript=true\nyaml=unfortunately\n\n[superpowers]\ndebugging_at_3am=true\nterraform_cursing=occasionally\ncommit_message_quality=debatable',
};

export { fmtMtime, initFs, fsLongLine, eggDotfileError, CAT_CONTENT };
