import { describe, expect, it } from 'vitest';
import { waitForHydration } from './hydration';
import { translate } from '@/lib/translate';

function fakeStore(hydrated: boolean) {
  const listeners = new Set<() => void>();
  let done = hydrated;
  return {
    finish() {
      done = true;
      for (const listener of listeners) listener();
    },
    persist: {
      hasHydrated: () => done,
      onFinishHydration: (listener: () => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    },
    listenerCount: () => listeners.size,
  };
}

describe('waitForHydration', () => {
  it('resolves straight away when the store has already loaded', async () => {
    await expect(waitForHydration(fakeStore(true))).resolves.toBeUndefined();
  });

  it('waits until the store finishes loading, then stops listening', async () => {
    const store = fakeStore(false);
    let resolved = false;
    const waiting = waitForHydration(store).then(() => {
      resolved = true;
    });

    await Promise.resolve();
    expect(resolved).toBe(false);

    store.finish();
    await waiting;
    expect(resolved).toBe(true);
    expect(store.listenerCount()).toBe(0);
  });
});

describe('translate', () => {
  it('fills in placeholders in the English fallback', () => {
    expect(translate('missing.key', 'Badge unlocked: {{name}}', { name: 'First Steps' })).toBe('Badge unlocked: First Steps');
  });
});
