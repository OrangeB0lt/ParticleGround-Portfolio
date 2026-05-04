'use strict';

// ── CONFIG ───────────────────────────────────────────────────────────────────

const LINKEDIN_URL = 'https://www.linkedin.com/in/jaredratner/';
const MEDIUM_URL   = 'https://medium.com/@jared.ratner2';
const GITHUB_URL   = 'https://github.com/OrangeB0lt';

const MENU_ITEMS = [
  { label: 'RESUME',    action: 'resume'   },
  { label: 'ABOUT ME',  action: 'about'    },
  { label: 'PROJECTS',  action: 'projects' },
  { label: 'SKILLS',    action: 'skills'   },
  { label: 'CONTACT',   action: 'contact'  },
  { label: 'MAN JARED', action: 'manjared' },
  { label: 'LINKEDIN',  action: 'linkedin' },
  { label: 'MEDIUM',    action: 'medium'   },
];

const FORTUNES = [
  '"It works on my machine." -- famous last words',
  'Have you tried turning it off and on again?',
  'The on-call rotation does not negotiate\nwith sleep schedules.',
  'kubectl delete pod --all is not a\nmonitoring strategy.',
  'There are 2 hard problems in CS: cache\ninvalidation, naming, and off-by-one errors.',
  'Your YAML indentation is wrong.\nIt is always your YAML indentation.',
  '"Just a quick config change." -- last words\nbefore the outage',
  'Terraform plan looks good.\nTerraform apply: surprise.',
  'The docs said "optional".\nThe prod box disagreed.',
  'git push --force in production: a memoir.',
  'Monitoring is not a substitute for\nnot breaking things.',
  '"I will add the tests later." -- an autobiography',
  'The pipeline failed because you forgot\nthe semicolon. Again.',
  'Always read the Terraform destroy output.\nAlways.',
  'chmod 777 is not a solution. It is a confession.',
];

const PROJECTS = [
  {
    name:  'S.P.A.C.E.',
    desc:  'Tower defense strategy game',
    perms: '-rwxr-xr-x',
    long:  'Space Paradox And Combat Environment — browser-based tower defense built with Phaser 3. Custom enemy pathing, multiple tower types, and escalating wave difficulty. Live at spacetower.space.',
    stack: ['JavaScript', 'Phaser 3', 'HTML5 Canvas', 'CSS'],
    link:  'https://github.com/OrangeB0lt/S.P.A.C.E.',
  },
  {
    name:  'generic-app-docker',
    desc:  'Full-stack Docker Compose starter',
    perms: 'drwxr-xr-x',
    long:  'Production-ready boilerplate for spinning up a full-stack app in one command. FastAPI backend on :8000, React + Vite frontend on :3000, PostgreSQL 16. Designed to be cloned and shipped.',
    stack: ['Python', 'FastAPI', 'React', 'Vite', 'PostgreSQL', 'Docker'],
    link:  'https://github.com/OrangeB0lt/generic-app-docker',
  },
  {
    name:  'ollama-api-local',
    desc:  'Local API bridge for Ollama LLM server',
    perms: '-rwxr-xr-x',
    long:  'Lightweight API layer that proxies requests between a local application and a locally-running Ollama instance. Fully on-prem LLM inference — no cloud, no telemetry, no vendor lock-in.',
    stack: ['Python', 'Ollama', 'REST API'],
    link:  'https://github.com/OrangeB0lt/ollama-api-local',
  },
  {
    name:  'monty',
    desc:  'Bytecode interpreter in C',
    perms: '-rwxr-xr-x',
    long:  'A C implementation of a stack/queue-based interpreter for Monty bytecode scripts. Supports push, pop, swap, arithmetic ops, and dual stack/queue modes. Written from scratch.',
    stack: ['C', 'Systems Programming', 'Data Structures'],
    link:  'https://github.com/OrangeB0lt/monty',
  },
  {
    name:  'ParticleGround-Portfolio',
    desc:  'This site — C64 terminal portfolio',
    perms: 'drwxr-xr-x',
    long:  'Commodore 64-themed interactive portfolio. Zero frameworks — vanilla JS, CSS, HTML. Boot sequence, terminal navigation, animated skill bars, simulated browser popup, and easter eggs. Try typing "matrix".',
    stack: ['JavaScript', 'CSS', 'HTML', 'Canvas API'],
    link:  'https://github.com/OrangeB0lt/ParticleGround-Portfolio',
  },
];

const EGG_COMMANDS = new Set([
  'matrix', 'starwars', 'startrek', 'cowsay', 'nyan', 'sudo', 'hack', 'help',
  'ls', 'cd', 'mkdir', 'touch', 'nano', 'vi', 'vim',
  'chmod', 'chown', 'pwd', 'cat', 'rm', 'whoami', 'uname', 'clear',
  './snake.prg', './solitaire.prg',
]);

export {
  LINKEDIN_URL, MEDIUM_URL, GITHUB_URL,
  MENU_ITEMS, FORTUNES, PROJECTS, EGG_COMMANDS,
};
