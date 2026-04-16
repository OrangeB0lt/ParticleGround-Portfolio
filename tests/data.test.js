/**
 * Data integrity tests — validates all configuration constants:
 * FORTUNES, PROJECTS, MENU_ITEMS, EGG_COMMANDS, and URL constants.
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { setupDOM } from './setup.js';

setupDOM();

const {
  MENU_ITEMS, PROJECTS, FORTUNES, EGG_COMMANDS,
  LINKEDIN_URL, MEDIUM_URL, GITHUB_URL,
} = await import('../js/main.js');

// ── FORTUNES ─────────────────────────────────────────────────────────────────

describe('FORTUNES', () => {
  it('has exactly 15 entries', () => {
    assert.strictEqual(FORTUNES.length, 15);
  });

  it('every entry is a non-empty string', () => {
    for (let i = 0; i < FORTUNES.length; i++) {
      assert.strictEqual(typeof FORTUNES[i], 'string', `[${i}] not a string`);
      assert.ok(FORTUNES[i].trim().length > 0, `[${i}] is blank`);
    }
  });

  it('no duplicate fortunes', () => {
    const uniq = new Set(FORTUNES);
    assert.strictEqual(uniq.size, FORTUNES.length, 'Duplicate fortune detected');
  });

  it('all fortunes are under 200 characters', () => {
    for (let i = 0; i < FORTUNES.length; i++) {
      assert.ok(FORTUNES[i].length <= 200, `[${i}] exceeds 200 chars: ${FORTUNES[i].length}`);
    }
  });
});

// ── PROJECTS ─────────────────────────────────────────────────────────────────

describe('PROJECTS', () => {
  it('has exactly 5 entries', () => {
    assert.strictEqual(PROJECTS.length, 5);
  });

  it('every project has required string fields', () => {
    const required = ['name', 'desc', 'perms', 'long', 'link'];
    for (let i = 0; i < PROJECTS.length; i++) {
      for (const field of required) {
        assert.strictEqual(typeof PROJECTS[i][field], 'string', `[${i}].${field} not a string`);
        assert.ok(PROJECTS[i][field].trim().length > 0, `[${i}].${field} is blank`);
      }
    }
  });

  it('every project has a non-empty stack array', () => {
    for (let i = 0; i < PROJECTS.length; i++) {
      assert.ok(Array.isArray(PROJECTS[i].stack), `[${i}].stack not an array`);
      assert.ok(PROJECTS[i].stack.length > 0, `[${i}].stack is empty`);
      for (const tech of PROJECTS[i].stack) {
        assert.strictEqual(typeof tech, 'string', `[${i}].stack entry not a string`);
      }
    }
  });

  it('perms string matches unix format', () => {
    for (let i = 0; i < PROJECTS.length; i++) {
      assert.match(
        PROJECTS[i].perms,
        /^[d-][rwx-]{9}$/,
        `[${i}].perms invalid: "${PROJECTS[i].perms}"`
      );
    }
  });

  it('project names are lowercase kebab-case', () => {
    for (let i = 0; i < PROJECTS.length; i++) {
      assert.match(
        PROJECTS[i].name,
        /^[a-z0-9-]+$/,
        `[${i}].name invalid: "${PROJECTS[i].name}"`
      );
    }
  });

  it('project names are unique', () => {
    const names = PROJECTS.map(p => p.name);
    assert.strictEqual(new Set(names).size, names.length, 'Duplicate project name');
  });

  it('link fields are non-empty strings (URL format)', () => {
    for (let i = 0; i < PROJECTS.length; i++) {
      assert.ok(PROJECTS[i].link.startsWith('https://'), `[${i}].link not https`);
    }
  });
});

// ── MENU_ITEMS ────────────────────────────────────────────────────────────────

describe('MENU_ITEMS', () => {
  it('has exactly 8 entries', () => {
    assert.strictEqual(MENU_ITEMS.length, 8);
  });

  it('every item has a non-empty string label and action', () => {
    for (let i = 0; i < MENU_ITEMS.length; i++) {
      assert.strictEqual(typeof MENU_ITEMS[i].label,  'string', `[${i}].label not string`);
      assert.strictEqual(typeof MENU_ITEMS[i].action, 'string', `[${i}].action not string`);
      assert.ok(MENU_ITEMS[i].label.trim().length  > 0, `[${i}].label blank`);
      assert.ok(MENU_ITEMS[i].action.trim().length > 0, `[${i}].action blank`);
    }
  });

  it('labels are uppercase', () => {
    for (let i = 0; i < MENU_ITEMS.length; i++) {
      assert.strictEqual(
        MENU_ITEMS[i].label,
        MENU_ITEMS[i].label.toUpperCase(),
        `[${i}].label not uppercase: "${MENU_ITEMS[i].label}"`
      );
    }
  });

  it('contains all required actions', () => {
    const actions = new Set(MENU_ITEMS.map(m => m.action));
    for (const a of ['resume', 'about', 'projects', 'skills', 'contact', 'manjared', 'linkedin', 'medium']) {
      assert.ok(actions.has(a), `Missing action: "${a}"`);
    }
  });

  it('action values are unique', () => {
    const actions = MENU_ITEMS.map(m => m.action);
    assert.strictEqual(new Set(actions).size, actions.length, 'Duplicate action value');
  });

  it('LINKEDIN and MEDIUM are the last two items', () => {
    const last2 = MENU_ITEMS.slice(-2).map(m => m.action);
    assert.ok(last2.includes('linkedin'), 'LINKEDIN not in last 2');
    assert.ok(last2.includes('medium'),   'MEDIUM not in last 2');
  });
});

// ── EGG_COMMANDS ─────────────────────────────────────────────────────────────

describe('EGG_COMMANDS', () => {
  it('is a Set', () => {
    assert.ok(EGG_COMMANDS instanceof Set);
  });

  it('has exactly 7 commands', () => {
    assert.strictEqual(EGG_COMMANDS.size, 7);
  });

  it('contains all expected commands', () => {
    for (const cmd of ['matrix', 'starwars', 'lolcow', 'nyan', 'sudo', 'hack', 'help']) {
      assert.ok(EGG_COMMANDS.has(cmd), `Missing command: "${cmd}"`);
    }
  });

  it('all commands are lowercase strings', () => {
    for (const cmd of EGG_COMMANDS) {
      assert.strictEqual(typeof cmd, 'string');
      assert.strictEqual(cmd, cmd.toLowerCase(), `Not lowercase: "${cmd}"`);
    }
  });

  it('no command contains spaces', () => {
    for (const cmd of EGG_COMMANDS) {
      assert.ok(!/\s/.test(cmd), `Command has whitespace: "${cmd}"`);
    }
  });
});

// ── URL CONSTANTS ─────────────────────────────────────────────────────────────

describe('URL constants', () => {
  it('LINKEDIN_URL is a valid https URL', () => {
    assert.ok(LINKEDIN_URL.startsWith('https://'), `LINKEDIN_URL: ${LINKEDIN_URL}`);
    assert.ok(LINKEDIN_URL.includes('linkedin.com'), `LINKEDIN_URL missing domain`);
  });

  it('GITHUB_URL points to OrangeB0lt', () => {
    assert.ok(GITHUB_URL.includes('OrangeB0lt'), `GITHUB_URL: ${GITHUB_URL}`);
    assert.ok(GITHUB_URL.startsWith('https://github.com'), `GITHUB_URL: ${GITHUB_URL}`);
  });

  it('MEDIUM_URL is a valid https URL', () => {
    assert.ok(MEDIUM_URL.startsWith('https://'), `MEDIUM_URL: ${MEDIUM_URL}`);
    assert.ok(MEDIUM_URL.includes('medium.com'), `MEDIUM_URL missing domain`);
  });
});
