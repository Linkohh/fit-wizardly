import '@testing-library/jest-dom';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear: () => {
      store.clear();
    },
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

function ensureStorage(name: 'localStorage' | 'sessionStorage') {
  let storage: Storage | undefined;

  try {
    storage = window[name];
  } catch {
    storage = undefined;
  }

  if (
    storage &&
    typeof storage.clear === 'function' &&
    typeof storage.getItem === 'function' &&
    typeof storage.removeItem === 'function' &&
    typeof storage.setItem === 'function'
  ) {
    return;
  }

  const replacement = createMemoryStorage();
  Object.defineProperty(window, name, {
    configurable: true,
    value: replacement,
  });
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value: replacement,
  });
}

ensureStorage('localStorage');
ensureStorage('sessionStorage');

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// jsdom lacks IntersectionObserver (used by framer-motion's useInView/whileInView).
// This no-op never reports intersections; tests that need visibility stub their own.
if (!('IntersectionObserver' in window)) {
  class NoopIntersectionObserver {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds: ReadonlyArray<number> = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: NoopIntersectionObserver,
  });
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: NoopIntersectionObserver,
  });
}
