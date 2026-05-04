'use strict';

// ── STATE ────────────────────────────────────────────────────────────────────

const state = {
  mode: 'boot',       // 'boot' | 'menu' | 'easter' | 'browser'
  bootAborted: false,
  menuIndex: 0,
  eggBuffer: '',
  eggTimer: null,
  eggOverlay: null,
  fsFiles: null,
  fsDir: null,        // null = root, 'games' = ~/games
};

export { state };
