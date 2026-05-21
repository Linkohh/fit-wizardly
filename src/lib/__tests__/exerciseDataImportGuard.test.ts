import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, '..', '..');
const ALLOWED_SUFFIXES: string[] = [];

const BLOCKED_IMPORT_PATTERNS = [
  /from\s+['"]@\/data\/exercises['"]/,
  /from\s+['"].*\/data\/wger-snapshot\.json['"]/,
];

const BLOCKED_SOURCE_DATA_REFERENCES = [
  'src/data/exercises.ts',
  'src/features/exercise-library/data/wger-snapshot.json',
  'sync:exercise-assets',
];

const BLOCKED_WGER_WORKOUT_ENDPOINTS = [
  '/api/v2/routine',
  '/api/v2/day',
  '/api/v2/slot',
  '/api/v2/slot-entry',
  '/api/v2/workoutsession',
  '/api/v2/workoutlog',
  '/api/v2/templates',
  '/api/v2/public-templates',
];

async function collectSourceFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === '__tests__' || entry.name === 'test') {
          return [];
        }

        return collectSourceFiles(fullPath);
      }

      if (!entry.isFile() || !/\.(ts|tsx)$/.test(entry.name)) {
        return [];
      }

      return [fullPath];
    })
  );

  return files.flat();
}

function isAllowedFile(filePath: string) {
  return ALLOWED_SUFFIXES.some((suffix) => filePath.endsWith(suffix));
}

async function readIfExists(filePath: string) {
  const exists = await fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);

  if (!exists) {
    return null;
  }

  return fs.readFile(filePath, 'utf8');
}

describe('exercise dataset import guard', () => {
  it('does not allow direct dataset imports outside repository/test code', async () => {
    const files = await collectSourceFiles(SRC_DIR);
    const violations: string[] = [];

    await Promise.all(
      files.map(async (filePath) => {
        if (isAllowedFile(filePath)) {
          return;
        }

        const content = await fs.readFile(filePath, 'utf8');
        if (BLOCKED_IMPORT_PATTERNS.some((pattern) => pattern.test(content))) {
          violations.push(path.relative(process.cwd(), filePath));
        }
      })
    );

    expect(violations).toEqual([]);
  });

  it('does not leave sync tooling pointed at removed source datasets', async () => {
    const files = [
      path.resolve(process.cwd(), 'package.json'),
      path.resolve(process.cwd(), 'scripts/sync-wger-snapshot.mjs'),
      path.resolve(process.cwd(), 'scripts/migrate-exercises.ts'),
    ];
    const violations: string[] = [];

    await Promise.all(
      files.map(async (filePath) => {
        const content = await readIfExists(filePath);
        if (!content) {
          return;
        }

        const blockedReference = BLOCKED_SOURCE_DATA_REFERENCES.find((reference) =>
          content.includes(reference)
        );

        if (blockedReference) {
          violations.push(`${path.relative(process.cwd(), filePath)} -> ${blockedReference}`);
        }
      })
    );

    expect(violations).toEqual([]);
  });

  it('keeps wger integration limited to public exercise gathering endpoints', async () => {
    const files = [
      ...(await collectSourceFiles(SRC_DIR)),
      path.resolve(process.cwd(), 'scripts/sync-wger-snapshot.mjs'),
    ];
    const violations: string[] = [];

    await Promise.all(
      files.map(async (filePath) => {
        if (filePath.endsWith('exerciseDataImportGuard.test.ts')) {
          return;
        }

        const content = await readIfExists(filePath);
        if (!content) {
          return;
        }

        const blockedEndpoint = BLOCKED_WGER_WORKOUT_ENDPOINTS.find((endpoint) =>
          content.includes(endpoint)
        );

        if (blockedEndpoint) {
          violations.push(`${path.relative(process.cwd(), filePath)} -> ${blockedEndpoint}`);
        }
      })
    );

    expect(violations).toEqual([]);
  });
});
