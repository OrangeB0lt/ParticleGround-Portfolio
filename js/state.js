'use strict';

// ── STATE ────────────────────────────────────────────────────────────────────

const state = {
  mode: 'boot',       // 'boot' | 'menu' | 'easter' | 'browser'
  bootAborted: false,
  menuIndex: 0,

  // line editor
  eggBuffer: '',
  eggCursor: 0,            // 0..eggBuffer.length
  eggTimer: null,          // cursor blink-pause timer
  eggTyping: false,        // true while user is actively typing (suppresses blink)

  // tab completion
  eggSuggest: null,        // string[]: multi-match listing
  eggTabState: null,       // {matches, idx, prefix, replaceFrom} for cycling

  // history
  eggHistory: [],          // newest at end
  eggHistoryIndex: null,   // null = editing fresh line; int = walking history
  eggHistoryDraft: '',     // in-progress line stashed when you press Up

  // ghost-text autosuggest
  eggGhost: '',

  // reverse-i-search modal substate
  eggReverseSearch: null,  // {query, matchIdx} | null

  // overlays + fake fs
  eggOverlay: null,
  fsFiles: null,
  fsDir: null,             // null = root, 'games' = ~/games
};

export { state };
