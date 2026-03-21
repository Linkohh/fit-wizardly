import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, '..', '..');
const ALLOWED_SUFFIXES = [
  path.join('src', 'data', 'exercises.ts'),
];

const BLOCKED_IMPORT_PATTERNS = [
  /from\s+['"]@\/data\/exercises['"]/,
  /from\s+['"].*\/data\/wger-snapshot\.json['"]/,
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
});
