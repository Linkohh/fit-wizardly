import { describe, expect, it } from 'vitest';
import { CHANGELOG } from './changelog';

const SEMVER = /^\d+\.\d+\.\d+$/;
const ISO_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

function compareSemver(a: string, b: string): number {
  const [aMajor, aMinor, aPatch] = a.split('.').map(Number);
  const [bMajor, bMinor, bPatch] = b.split('.').map(Number);
  return aMajor - bMajor || aMinor - bMinor || aPatch - bPatch;
}

describe('CHANGELOG', () => {
  it('starts with the version the app ships as (bump package.json and add notes together)', () => {
    // vitest.config.ts defines __APP_VERSION__ as a test placeholder, so compare against package.json directly.
    return import('../../package.json').then(({ version }) => {
      expect(CHANGELOG[0].version).toBe(version);
    });
  });

  it('is ordered newest first with unique, valid versions', () => {
    const versions = CHANGELOG.map((entry) => entry.version);
    expect(new Set(versions).size).toBe(versions.length);

    for (const version of versions) expect(version).toMatch(SEMVER);
    for (let index = 1; index < versions.length; index += 1) {
      expect(compareSemver(versions[index - 1], versions[index])).toBeGreaterThan(0);
    }
  });

  it('gives every release a name, a month and at least one highlight', () => {
    for (const entry of CHANGELOG) {
      expect(entry.name.trim()).not.toBe('');
      expect(entry.date).toMatch(ISO_MONTH);
      const bulletCount = Object.values(entry.highlights).flat().length;
      expect(bulletCount).toBeGreaterThan(0);
    }
  });
});
