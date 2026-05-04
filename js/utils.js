'use strict';

import { state } from './state.js';
import { $terminal, $screen } from './dom.js';

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

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

function promptPrefix() {
  const dir = state.fsDir ? `~/${state.fsDir}` : '~';
  return `jared@ratner.me:${dir}$`;
}

function appendOutput(html, cls = 'egg-output') {
  return appendHTML($terminal, html, cls);
}

function appendPreText(text, color) {
  const pre = document.createElement('pre');
  pre.className = 'egg-output-pre';
  if (color) pre.style.color = color;
  pre.textContent = text;
  $terminal.appendChild(pre);
  scrollBottom();
  return pre;
}

function appendPreHTML(html, color) {
  const pre = document.createElement('pre');
  pre.className = 'egg-output-pre';
  if (color) pre.style.color = color;
  pre.innerHTML = html;
  $terminal.appendChild(pre);
  scrollBottom();
  return pre;
}

function appendCmdLine(echoText) {
  const div = document.createElement('div');
  div.className = 'cmd-line';
  div.innerHTML = `<span class="prompt">${promptPrefix()}</span> ${escapeHTML(echoText)}`;
  $terminal.appendChild(div);
  scrollBottom();
  return div;
}

export {
  delay, typeText, typeLine,
  appendHTML, scrollBottom, escapeHTML, promptPrefix,
  appendOutput, appendPreText, appendPreHTML, appendCmdLine,
};
