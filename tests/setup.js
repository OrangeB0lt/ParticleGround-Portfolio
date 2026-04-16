/**
 * Minimal DOM mock that satisfies main.js's DOM requirements.
 * Call setupDOM() before dynamically importing main.js so the
 * module-level getElementById calls get real mock objects.
 */

function createEl(id = '') {
  const ch = [];
  let _inner = '';

  const el = {
    id,
    className: '',
    scrollTop: 0,
    scrollHeight: 100,
    clientWidth: 960,
    clientHeight: 640,
    style: {},
    dataset: {},

    get innerHTML() { return _inner; },
    set innerHTML(v) {
      _inner = v;
      if (v === '') ch.length = 0;
    },

    get textContent() {
      return ch.reduce((acc, c) => acc + (c.textContent || ''), _inner.replace(/<[^>]*>/g, ''));
    },
    set textContent(v) {
      _inner = '';
      ch.length = 0;
      ch.push({ textContent: v, innerHTML: '', style: {}, dataset: {}, className: '', children: [], classList: fakeClassList(), appendChild: () => {}, querySelector: () => null, querySelectorAll: () => [], addEventListener: () => {}, removeEventListener: () => {}, remove: () => {}, insertAdjacentHTML(_, h) { this.innerHTML += h; } });
    },

    get children() { return ch; },

    classList: fakeClassList(),

    appendChild(child) { ch.push(child); return child; },
    querySelector()    { return null; },
    querySelectorAll() { return []; },
    addEventListener() {},
    removeEventListener() {},
    insertAdjacentHTML(pos, html) { _inner += html; },
    remove() {},
  };
  return el;
}

function fakeClassList() {
  const s = new Set();
  return {
    add(c)          { s.add(c); },
    remove(c)       { s.delete(c); },
    toggle(c, f)    { f !== undefined ? (f ? s.add(c) : s.delete(c)) : (s.has(c) ? s.delete(c) : s.add(c)); },
    contains(c)     { return s.has(c); },
    get size()      { return s.size; },
    [Symbol.iterator]() { return s[Symbol.iterator](); },
  };
}

export function setupDOM() {
  globalThis.__TEST_ENV__ = true;

  const map = {};
  const getOrCreate = id => { if (!map[id]) map[id] = createEl(id); return map[id]; };

  globalThis.document = {
    getElementById: getOrCreate,
    createElement(tag) {
      const el = createEl();
      if (tag === 'canvas') {
        el.width  = 0;
        el.height = 0;
        el.getContext = () => ({
          fillStyle: '',
          font: '',
          fillRect:  () => {},
          fillText:  () => {},
        });
      }
      return el;
    },
    addEventListener:    () => {},
    removeEventListener: () => {},
  };

  globalThis.window = {
    open:        () => {},
    innerWidth:  1920,
    innerHeight: 1080,
  };

  return {
    getEl: id => getOrCreate(id),
    reset: id => { map[id] = createEl(id); return map[id]; },
  };
}

export { createEl, fakeClassList };
