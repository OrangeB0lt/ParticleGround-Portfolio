'use strict';

import { state } from './state.js';
import { $terminal } from './dom.js';
import { appendPreText, appendPreHTML, scrollBottom } from './utils.js';
import { initFs, fmtMtime, fsLongLine, eggDotfileError, CAT_CONTENT } from './fs.js';
import { updateEggDisplay } from './egg-input.js';
import { makeOverlay, removeOverlay, onceKeyDismiss } from './egg-runtime.js';
import { PROJECT_FILES, renderProjectDetail } from './sections.js';
import { renderMenu } from './menu.js';

// ── LS ────────────────────────────────────────────────────────────────────────

function eggLs(args) {
  initFs();
  const flagStr  = args.filter(a => a.startsWith('-')).map(a => a.slice(1)).join('');
  const showAll  = flagStr.includes('a');
  const showLong = flagStr.includes('l');

  if (state.fsDir === 'games') {
    const snakeEntry     = { type: 'file', perms: '-rwxr-xr-x', links: 1, owner: 'jared', group: 'staff', size: 24576, mtime: 'May  4 10:00' };
    const solitaireEntry = { type: 'file', perms: '-rwxr-xr-x', links: 1, owner: 'jared', group: 'staff', size: 32768, mtime: 'May  4 10:00' };
    let html = '';
    if (showLong) {
      html += `total 56\n`;
      if (showAll) {
        html += `${fsLongLine('.', { type: 'dir', perms: 'drwxr-xr-x', links: 2, owner: 'jared', group: 'staff', size: 128, mtime: 'May  4 10:00' })} <span style="color:#7c70da">.</span>\n`;
        html += `${fsLongLine('..', { type: 'dir', perms: 'drwxr-xr-x', links: 9, owner: 'jared', group: 'staff', size: 288, mtime: 'May  3 14:22' })} <span style="color:#7c70da">..</span>\n`;
      }
      html += `${fsLongLine('snake.prg', snakeEntry)} snake.prg\n`;
      html += `${fsLongLine('solitaire.prg', solitaireEntry)} solitaire.prg`;
    } else {
      html = 'snake.prg  solitaire.prg';
    }
    appendPreHTML(html);
    return;
  }

  const entries = [...state.fsFiles.entries()];
  const dots    = entries.filter(([n]) => n.startsWith('.'));
  const regular = entries.filter(([n]) => !n.startsWith('.'));
  regular.sort(([a], [b]) => a.localeCompare(b));
  dots.sort(([a], [b]) => a.localeCompare(b));

  let html = '';
  if (showLong) {
    html += `total 1337\n`;
    const dirColor = '#7c70da';
    const dotColor = '#888888';

    const addLine = (name, entry, displayName) => {
      const prefix = fsLongLine(name, entry);
      const isDir  = entry.type === 'dir';
      const isDot  = entry.dot || name.startsWith('.');
      const nameHtml = isDir
        ? `<span style="color:${dirColor}">${displayName}</span>`
        : isDot
          ? `<span style="color:${dotColor}">${displayName}</span>`
          : displayName;
      html += `${prefix} ${nameHtml}\n`;
    };

    addLine('.', { type: 'dir', perms: 'drwxr-xr-x', links: 9,   owner: 'jared', group: 'staff', size: 288,  mtime: 'May  3 14:22' }, '.');
    addLine('..', { type: 'dir', perms: 'drwxr-xr-x', links: 4,  owner: 'root',  group: 'wheel', size: 4096, mtime: 'Jan  1  2038' }, '..');

    for (const [name, entry] of dots)    addLine(name, entry, name);
    for (const [name, entry] of regular) addLine(name, entry, name);
  } else {
    const visible = (showAll ? [...dots, ...regular] : regular).map(([n, e]) => {
      const isDir = e.type === 'dir';
      return isDir
        ? `<span style="color:#7c70da">${n}/</span>`
        : n;
    });
    html = visible.join('  ');
  }

  appendPreHTML(html);
}

// ── CD ────────────────────────────────────────────────────────────────────────

function eggCd(args) {
  const target = args[0] || '~';

  if (target === 'games' && !state.fsDir) {
    state.fsDir = 'games';
    updateEggDisplay();
    return;
  }

  if ((target === '..' || target === '~' || target === '/home/jared') && state.fsDir) {
    state.fsDir = null;
    updateEggDisplay();
    return;
  }

  const responses = {
    '~':           "You're already home.\n(Are you ever truly home?)",
    '..':          "cd: ..: You can't leave. There is only this terminal.",
    '/':           "cd: /: You don't have a physical form. You cannot go here.",
    '/etc':        "cd: /etc: Permission denied. (Also — this is a website.)",
    '/home':       "cd: /home: jared is NOT home right now. Please try again later.",
    '/home/jared': "cd: /home/jared: jared is NOT home right now. Please try again later.",
    'node_modules':"cd: node_modules: Are you SURE? This path is 47 levels deep\nand still growing. Estimated traversal time: your entire career.",
    '.git':        "cd: .git: You don't want to go here. Trust me. Nobody goes there.",
    '.ssh':        "cd: .ssh: Nice try.",
    '.env':        "cd: .env: That's not a directory. That's a crime scene.",
  };

  const msg = responses[target] || `cd: ${target}: No such file or directory`;
  appendPreText(`bash: ${msg}`, '#ff4444');
}

// ── MKDIR ─────────────────────────────────────────────────────────────────────

function eggMkdir(args) {
  initFs();
  const name = args[0];

  if (!name) {
    appendPreText('mkdir: missing operand\nUsage: mkdir <dirname>', '#ff4444');
    return;
  }

  if (state.fsFiles.has(name)) {
    appendPreText(`mkdir: cannot create directory '${name}': File exists`, '#ff4444');
    return;
  }

  state.fsFiles.set(name, {
    type: 'dir', perms: 'drwxr-xr-x', links: 2,
    owner: 'jared', group: 'staff', size: 64, mtime: fmtMtime(new Date()),
  });
}

// ── TOUCH ─────────────────────────────────────────────────────────────────────

function eggTouch(args) {
  initFs();
  const name = args[0];

  if (!name) {
    appendPreText('touch: missing file operand\nUsage: touch <filename>', '#ff4444');
    return;
  }

  if (!state.fsFiles.has(name)) {
    state.fsFiles.set(name, {
      type: 'file', perms: '-rw-r--r--', links: 1,
      owner: 'jared', group: 'staff', size: 0, mtime: fmtMtime(new Date()),
    });
  }
}

// ── NANO / VI ─────────────────────────────────────────────────────────────────

function eggNanoVi(filename, editorType) {
  initFs();
  const isVi = editorType === 'vi';

  if (!filename) {
    state.mode = 'menu';
    appendPreText(`${editorType}: missing filename`, '#ff4444');
    return;
  }

  if (filename.startsWith('.')) {
    state.mode = 'menu';
    eggDotfileError(filename, editorType);
    return;
  }

  const entry = state.fsFiles.get(filename);
  if (entry && entry.corrupted) {
    const hexDump = Array.from({ length: 24 }, () =>
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join(' ');
    const ov  = makeOverlay('#000');
    const pre = document.createElement('pre');
    pre.className = 'egg-text';
    pre.style.cssText = 'color:#ff4444;padding:40px;';
    pre.textContent = `  "${filename}"  1 line  11 characters\n\n  <CORRUPTED>\n\n  ${hexDump}\n\n  This file cannot be recovered.`;
    ov.appendChild(pre);
    onceKeyDismiss(ov);
    return;
  }

  const ov = makeOverlay('#000');
  ov.style.cssText = 'display:flex;flex-direction:column;';

  const header = document.createElement('div');
  header.className = 'egg-editor-header';
  header.textContent = isVi
    ? `"${filename}" [New File]`
    : `  GNU nano 7.2               ${filename}`;
  ov.appendChild(header);

  const body = document.createElement('pre');
  body.className = 'egg-editor-body';
  ov.appendChild(body);

  const statusBar = document.createElement('div');
  statusBar.className = 'egg-editor-status';
  statusBar.innerHTML = isVi
    ? `<span class="egg-editor-mode">-- INSERT --</span>&nbsp;&nbsp;&nbsp;ESC to save and exit`
    : `<span class="egg-editor-mode">^X</span> Exit&nbsp;&nbsp;&nbsp;<span class="egg-editor-mode">^O</span> Write Out&nbsp;&nbsp;&nbsp;<span class="egg-editor-mode">^W</span> Where Is&nbsp;&nbsp;&nbsp;<span class="egg-editor-mode">^K</span> Cut`;
  ov.appendChild(statusBar);

  let editorBuffer = '';

  const updateBody = () => {
    body.textContent = editorBuffer || (isVi ? '\n~\n~\n~\n~\n~\n~' : '');
  };
  updateBody();

  const triggerSave = async () => {
    document.removeEventListener('keydown', keyHandler, true);
    const lines = editorBuffer.split('\n').length;
    statusBar.innerHTML = `<span class="egg-editor-mode"> Writing... Done. (${lines} line${lines !== 1 ? 's' : ''}) </span>`;
    if (!state.fsFiles.has(filename)) {
      state.fsFiles.set(filename, {
        type: 'file', perms: '-rw-r--r--', links: 1,
        owner: 'jared', group: 'staff', size: editorBuffer.length, mtime: fmtMtime(new Date()),
      });
    }
    state.fsFiles.get(filename).corrupted = true;
    await new Promise(r => setTimeout(r, 900));
    removeOverlay();
  };

  const keyHandler = e => {
    e.stopPropagation();
    if (isVi) {
      if (e.key === 'Escape') { triggerSave(); return; }
    } else {
      if ((e.ctrlKey && e.key === 'x') || e.key === 'Escape') { triggerSave(); return; }
    }
    if (e.key === 'Backspace')    { editorBuffer = editorBuffer.slice(0, -1); }
    else if (e.key === 'Enter')   { editorBuffer += '\n'; }
    else if (e.key.length === 1)  { editorBuffer += e.key; }
    updateBody();
  };

  document.addEventListener('keydown', keyHandler, true);
}

// ── CHMOD ─────────────────────────────────────────────────────────────────────

function eggChmod(args) {
  const mode = args[0];
  const file = args[1];

  const msgs = {
    '777': `chmod: changing permissions of '${file || 'file'}': Operation not permitted\n(Protected by corporate policy, union rules, and ancient dark magic.)`,
    '000': `chmod: changing permissions of '${file || 'file'}': Making this more inaccessible would cause a paradox.`,
    '600': `chmod: changing permissions of '${file || 'file'}': Already as private as it's going to get.`,
  };
  appendPreText(msgs[mode] || `chmod: changing permissions of '${file || 'file'}': lol no`, '#ff4444');
}

// ── CHOWN ─────────────────────────────────────────────────────────────────────

function eggChown(args) {
  const newOwner = args[0];
  const file     = args[1];
  const msg = newOwner === 'root'
    ? `chown: changing ownership of '${file || 'file'}': Are you the Chosen One? Prophecy says no.`
    : `chown: changing ownership of '${file || 'file'}': Permission denied\n(jared is the only owner here. forever.)`;
  appendPreText(msg, '#ff4444');
}

// ── PWD ───────────────────────────────────────────────────────────────────────

function eggPwd() {
  const path = state.fsDir
    ? '/home/jared/universe/earth/internet/ratner.me/~/games'
    : '/home/jared/universe/earth/internet/ratner.me/~';
  appendPreText(path, '#00ff41');
}

// ── CAT ───────────────────────────────────────────────────────────────────────

function eggCat(args) {
  initFs();
  const name = args[0];

  if (!name) {
    appendPreText('cat: missing operand\nUsage: cat <filename>', '#ff4444');
    return;
  }

  if (name.startsWith('.')) {
    eggDotfileError(name, 'cat');
    return;
  }

  // project files (e.g. cat ratnerme.md) → render the project's detail block
  const projectIdx = PROJECT_FILES.indexOf(name);
  if (projectIdx !== -1) {
    renderProjectDetail(projectIdx);
    return;
  }

  const entry = state.fsFiles.get(name);
  if (!entry) {
    appendPreText(`cat: ${name}: No such file or directory`, '#ff4444');
  } else if (entry.corrupted) {
    appendPreText('<CORRUPTED>', '#ff4444');
  } else if (CAT_CONTENT[name]) {
    appendPreText(CAT_CONTENT[name], '#00ff41');
  } else {
    appendPreText('(empty file)', '#888');
  }
}

// ── RM ────────────────────────────────────────────────────────────────────────

async function eggRm(args) {
  initFs();
  const flags   = args.filter(a => a.startsWith('-')).join('');
  const targets = args.filter(a => !a.startsWith('-'));
  const name    = targets[0];

  if (!name) {
    appendPreText('rm: missing operand\nUsage: rm [-rf] <file>', '#ff4444');
    return;
  }

  if (name.startsWith('.')) {
    eggDotfileError(name, 'rm');
    return;
  }

  if (name === 'node_modules' && /[rf]/.test(flags)) {
    const pre = appendPreText('', '#00ff41');
    const counts = [1, 42, 314, 2718, 31415, '∞'];
    for (const c of counts) {
      await new Promise(r => setTimeout(r, 380));
      pre.textContent += `Deleting... (${c} files)\n`;
      scrollBottom();
    }
    await new Promise(r => setTimeout(r, 500));
    pre.textContent += '\nestimated completion: heat death of universe';
    scrollBottom();
    return;
  }

  const existed = state.fsFiles.has(name);
  if (existed) {
    state.fsFiles.delete(name);
    appendPreText(`removed '${name}'`, '#00ff41');
  } else {
    appendPreText(`rm: cannot remove '${name}': No such file or directory`, '#ff4444');
  }
}

// ── WHOAMI ────────────────────────────────────────────────────────────────────

function eggWhoami() {
  appendPreText('jared\n\n(are you sure about that?)', '#00ff41');
}

// ── UNAME ─────────────────────────────────────────────────────────────────────

function eggUname(args) {
  const full = args.join('').includes('a');
  appendPreText(
    full
      ? 'ratner-OS 9000.1 #1 SMP PREEMPT built-from-vibes x86_64 ratner.me GNU/coffee'
      : 'ratner-OS',
    '#00ff41'
  );
}

// ── CLEAR ─────────────────────────────────────────────────────────────────────

function eggClear() {
  $terminal.innerHTML = '';
  renderMenu();
}

export {
  eggLs, eggCd, eggMkdir, eggTouch, eggNanoVi,
  eggChmod, eggChown, eggPwd, eggCat, eggRm,
  eggWhoami, eggUname, eggClear,
};
