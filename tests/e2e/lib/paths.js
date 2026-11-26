import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveProjectRoot() {
  if (process.env.E2E_PROJECT_ROOT) {
    return path.resolve(process.env.E2E_PROJECT_ROOT);
  }
  return path.resolve(__dirname, '../../..');
}

export const PROJECT_ROOT = resolveProjectRoot();
export const TESTS_E2E_DIR = path.join(PROJECT_ROOT, 'tests', 'e2e');
export const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
export const SRC_DIR = path.join(PROJECT_ROOT, 'src');
export const SRC_TAURI_DIR = path.join(PROJECT_ROOT, 'src-tauri');
export const SRC_TAURI_ICONS_DIR = path.join(SRC_TAURI_DIR, 'icons');
export const ASSETS_DIR = path.join(PROJECT_ROOT, 'assets');
export const VAULT_DIR = path.join(PROJECT_ROOT, 'vault');
export const SCRIPTS_DIR = path.join(PROJECT_ROOT, 'scripts');
export const REMOTION_DIR = path.join(PROJECT_ROOT, 'remotion');
export const GITHUB_DIR = path.join(PROJECT_ROOT, '.github');

export function fromRoot(...segments) {
  return path.join(PROJECT_ROOT, ...segments);
}

export function walkFiles(dirPath, options = {}) {
  const {
    extensions = null,
    ignoreDirs = new Set(['node_modules', 'target', '.git', 'dist', 'temp_analysis']),
  } = options;

  const results = [];
  if (!fs.existsSync(dirPath)) return results;

  function recurse(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!ignoreDirs.has(entry.name)) {
          recurse(fullPath);
        }
      } else if (entry.isFile()) {
        if (!extensions || extensions.some((ext) => entry.name.toLowerCase().endsWith(ext))) {
          results.push(fullPath);
        }
      }
    }
  }

  recurse(dirPath);
  return results;
}

export function readTextSafe(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

export function readJsonSafe(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}
