import { useEffect, useState } from 'react';
import { getNativePlatform, isNativeApp } from '@/lib/platform';

/**
 * Native on-screen keyboard (contract #10, roadmap 2.4).
 *
 * - iOS: resizes only `<body>` when the keyboard opens (also set in
 *   capacitor.config.ts) and keeps WebView scrolling on, so a focused input
 *   can be scrolled into view.
 * - Android: the activity already resizes for the keyboard (`adjustResize`),
 *   so only the open state is tracked.
 * - Both: when the keyboard has opened, the focused input is scrolled to the
 *   middle of the screen so it isn't hidden behind the keyboard.
 *
 * `@capacitor/keyboard` loads with a dynamic `import()` only on native. On the
 * web this hook does nothing and `isOpen` stays false.
 */

export interface KeyboardState {
  isOpen: boolean;
  /** Keyboard height in CSS pixels while open, 0 when closed. */
  height: number;
}

export interface UseKeyboardOptions {
  /** Scroll the focused input into view when the keyboard opens. Default true. */
  scrollFocusedIntoView?: boolean;
}

type KeyboardModule = typeof import('@capacitor/keyboard');

let keyboardPromise: Promise<KeyboardModule | null> | null = null;
let iosConfigured = false;

function loadKeyboard(): Promise<KeyboardModule | null> {
  if (!keyboardPromise) {
    keyboardPromise = import('@capacitor/keyboard').catch(() => {
      keyboardPromise = null;
      return null;
    });
  }
  return keyboardPromise;
}

async function configureIos(module: KeyboardModule): Promise<void> {
  if (iosConfigured || getNativePlatform() !== 'ios') return;
  iosConfigured = true;
  try {
    await module.Keyboard.setResizeMode({ mode: module.KeyboardResize.Body });
    await module.Keyboard.setScroll({ isDisabled: false });
  } catch (error) {
    iosConfigured = false;
    console.error('[Keyboard] iOS setup failed:', error);
  }
}

function scrollFocusedInputIntoView(): void {
  if (typeof document === 'undefined') return;
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return;
  if (!active.matches('input, textarea, select, [contenteditable="true"]')) return;
  active.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

/** Test helper: forget the cached plugin and iOS setup. */
export function resetKeyboardForTests(): void {
  keyboardPromise = null;
  iosConfigured = false;
}

export function useKeyboard(options: UseKeyboardOptions = {}): KeyboardState {
  const { scrollFocusedIntoView = true } = options;
  const [state, setState] = useState<KeyboardState>({ isOpen: false, height: 0 });

  useEffect(() => {
    if (!isNativeApp()) return;

    let isCancelled = false;
    const handles: Array<{ remove: () => Promise<void> }> = [];

    void loadKeyboard().then(async (module) => {
      if (!module || isCancelled) return;
      await configureIos(module);

      const listeners = await Promise.all([
        module.Keyboard.addListener('keyboardWillShow', (info) => {
          setState({ isOpen: true, height: info.keyboardHeight });
        }),
        module.Keyboard.addListener('keyboardDidShow', (info) => {
          setState({ isOpen: true, height: info.keyboardHeight });
          if (scrollFocusedIntoView) scrollFocusedInputIntoView();
        }),
        module.Keyboard.addListener('keyboardWillHide', () => {
          setState({ isOpen: false, height: 0 });
        }),
      ]).catch((error: unknown) => {
        console.error('[Keyboard] Failed to register listeners:', error);
        return [];
      });

      if (isCancelled) {
        listeners.forEach((handle) => void handle.remove());
      } else {
        handles.push(...listeners);
      }
    });

    return () => {
      isCancelled = true;
      handles.forEach((handle) => void handle.remove());
    };
  }, [scrollFocusedIntoView]);

  return state;
}
