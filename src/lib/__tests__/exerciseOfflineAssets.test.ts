import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

async function readViteConfig(): Promise<string> {
  const configPath = path.resolve(process.cwd(), 'vite.config.ts');
  return fs.readFile(configPath, 'utf8');
}

describe('exercise offline assets', () => {
  it('keeps the exercise catalogs out of the PWA precache', async () => {
    const config = await readViteConfig();
    const includeAssets = config.match(/includeAssets:\s*\[([\s\S]*?)\]/)?.[1] ?? '';

    expect(includeAssets).not.toBe('');
    expect(includeAssets).not.toContain('exercise-data/');
  });

  it('caches the exercise catalogs at runtime so they work offline after one online visit', async () => {
    const config = await readViteConfig();

    expect(config).toContain("url.pathname.startsWith('/exercise-data/')");
    expect(config).toContain("handler: 'StaleWhileRevalidate'");
    expect(config).toContain("cacheName: 'exercise-data'");
  });
});
