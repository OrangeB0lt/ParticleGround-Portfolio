'use strict';

import { state } from './state.js';
import { updateEggDisplay } from './egg-input.js';

// ── EXTERNAL LINKS ───────────────────────────────────────────────────────────

function launchExternal(name, url) {
  state.mode = 'browser';
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
  winctrls.textContent = '[◼][◻]';
  const title = document.createElement('div');
  title.className = 'sim-browser-title';
  title.textContent = `NETSCAPE C64 — ${name}`;
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
  nav.textContent = '[<] [>] [↺]';
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
    state.mode = 'menu';
    updateEggDisplay();
  }, 150);
}

export { launchExternal, showBrowser, showBlockedScreen, closeBrowser };
