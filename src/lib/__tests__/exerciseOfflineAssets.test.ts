import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('exercise offline assets', () => {
  it('includes static exercise catalogs in the PWA asset cache config', async () => {
    const configPath = path.resolve(process.cwd(), 'vite.config.ts');
    const config = await fs.readFile(configPath, 'utf8');

    expect(config).toContain('exercise-data/wger-snapshot.v1.json');
    expect(config).toContain('exercise-data/legacy-exercises.v1.json');
  });
});
