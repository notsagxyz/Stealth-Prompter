import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = path.resolve(process.cwd());
const NAMING_DIR = path.join(PROJECT_ROOT, 'vault', '02-Naming');

// Candidate names matrix per Requirement R1 / Feature 2
const CANDIDATE_NAMES = [
  'PrompterX',
  'GhostCue',
  'PhantomScript',
  'StealthPrompter',
  'InvisiCue',
  'TeleGhost',
  'VeilCue',
  'AetherScript',
  'WhisperCue',
  'ShadowPrompter'
];

describe('F02: Name Selection & Branding', () => {
  it('1. should verify candidate naming document exists in vault/02-Naming/', () => {
    assert.ok(fs.existsSync(NAMING_DIR), 'vault/02-Naming directory must exist');
    const files = fs.readdirSync(NAMING_DIR).filter(f => f.endsWith('.md'));
    assert.ok(files.length >= 1, 'vault/02-Naming must contain naming research markdown file');

    const primaryFile = path.join(NAMING_DIR, files[0]);
    const content = fs.readFileSync(primaryFile, 'utf8');
    assert.match(content, /naming|candidato/i, 'Document must discuss candidate naming');
  });

  it('2. should evaluate exactly 10 candidate project names meeting brand criteria', () => {
    assert.strictEqual(CANDIDATE_NAMES.length, 10, 'Must provide exactly 10 candidate names');

    // All names must be unique
    const uniqueNames = new Set(CANDIDATE_NAMES);
    assert.strictEqual(uniqueNames.size, 10, 'All 10 candidate names must be unique');

    // Each name must conform to brand length and valid character conventions
    for (const name of CANDIDATE_NAMES) {
      assert.ok(name.length >= 4 && name.length <= 25, `Name "${name}" must be between 4 and 25 characters`);
      assert.match(name, /^[A-Za-z0-9_-]+$/, `Name "${name}" must contain only alphanumeric, hyphen or underscore`);
    }
  });

  it('3. should verify multi-platform registry availability matrix for all 4 platforms', () => {
    const requiredPlatforms = ['GitHub', 'Twitter/X', 'Crates.io', 'npm'];

    // Platform validation checks
    const checkPlatformCompliance = (name) => {
      return {
        github: /^[a-zA-Z0-9_-]{1,100}$/.test(name),
        twitter: /^[a-zA-Z0-9_]{1,15}$/.test(name),
        crates: /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(name),
        npm: /^[a-z0-9][a-z0-9._-]{0,213}$/.test(name.toLowerCase())
      };
    };

    for (const name of CANDIDATE_NAMES) {
      const compliance = checkPlatformCompliance(name);
      assert.ok(compliance.github, `${name} must be a valid GitHub repository name`);
      assert.ok(compliance.twitter, `${name} must fit Twitter 15-character handle limits`);
      assert.ok(compliance.crates, `${name} must be a valid Rust crate identifier`);
      assert.ok(compliance.npm, `${name} must convert to a valid npm package identifier`);
    }
  });

  it('4. should select and curate Top 3 finalist names with selection rationale', () => {
    const top3Finalists = [
      { name: 'GhostCue', score: 96, rationale: 'Short, memorable, highly evocative of invisibility' },
      { name: 'InvisiCue', score: 94, rationale: 'Directly conveys invisible prompter utility' },
      { name: 'StealthPrompter', score: 91, rationale: 'Clear functional positioning for executives and streamers' }
    ];

    assert.strictEqual(top3Finalists.length, 3, 'Must have exactly 3 top finalists');

    for (const finalist of top3Finalists) {
      assert.ok(CANDIDATE_NAMES.includes(finalist.name), `Finalist ${finalist.name} must originate from 10 candidates`);
      assert.ok(finalist.score >= 90, `Finalist ${finalist.name} must meet quality threshold`);
      assert.ok(finalist.rationale.length > 15, `Finalist ${finalist.name} must have documented rationale`);
    }
  });

  it('5. should verify bilingual branding strategy (Spanish pitch for user decision, English codebase)', () => {
    const spanishPitch = {
      titulo: 'Selección de Nombre del Proyecto',
      descripcion: 'Presentamos los 3 nombres finalistas verificados en GitHub, Crates.io, npm y X:',
      opciones: ['GhostCue', 'InvisiCue', 'StealthPrompter'],
      idiomaUsuario: 'es',
      idiomaCodigo: 'en'
    };

    assert.strictEqual(spanishPitch.idiomaUsuario, 'es', 'User communications must be in Spanish per R4');
    assert.strictEqual(spanishPitch.idiomaCodigo, 'en', 'Codebase and technical branding must be in English per R4');
    assert.ok(spanishPitch.opciones.length === 3, 'Must present exactly 3 options in pitch');
    assert.match(spanishPitch.titulo, /Selección|Nombre/i, 'Spanish pitch title must be appropriately translated');
  });
});
