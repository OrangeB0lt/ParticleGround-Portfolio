'use strict';

// ── DOM ──────────────────────────────────────────────────────────────────────
// Module-level DOM lookups. Tests must call setupDOM() before importing main.js
// (or any module that transitively imports this) so these resolve against the mock.

const $terminal = document.getElementById('terminal');
const $screen   = document.getElementById('screen');
const $eggInput = document.getElementById('egg-input');

export { $terminal, $screen, $eggInput };
