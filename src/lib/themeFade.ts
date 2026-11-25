import { flushSync } from 'react-dom';

/**
 * Crossfade for theme changes the user taps (Light / System / Dark).
 *
 * History: until May 2026 a theme switch faded over 920 ms. Commit 32a89e8
 * ("Fix theme sync regression") removed that, so switches now snap. This
 * brings the fade back without the old problem:
 *
 * - The theme change itself still happens in one synchronous step. `flushSync`
 *   runs the store update and ThemeProvider's layout effect (which sets the
 *   `dark` class on <html>) inside the View Transition callback, so the store,
 *   the class and the screen never disagree.
 * - The fade is a View Transition snapshot crossfade, so gradients (the drawer
 *   and the living background) fade too; CSS transitions can't interpolate them.
 * - It uses its own `data-theme-fade` attribute, not the old
 *   `data-theme-transition` one, so none of the legacy transition rules fire.
 * - The overlay ignores pointer events (index.css), so the drawer stays usable.
 * - No fade when Reduce Motion is on, when the browser has no View Transitions
 *   (older iOS Safari, for example), or when the visible theme won't change.
 *   In those cases the change applies immediately, exactly as before.
 * - OS theme changes in System mode are not faded (they don't come through here).
 */

export const THEME_FADE_ATTRIBUTE = 'data-theme-fade';

type ResolvedTheme = 'light' | 'dark';

interface ViewTransitionLike {
  finished: Promise<void>;
}

type DocumentWithViewTransitions = Document & {
  startViewTransition?: (callback: () => void) => ViewTransitionLike;
};

/**
 * Every selection gets a number. A fade's change runs a frame late (the browser
 * captures the old screen first), so a newer tap can land in between; the late
 * change then does nothing, and the newest choice wins.
 */
let latestSelection = 0;

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** The theme a mode shows right now ('system' follows the OS), as themeStore resolves it. */
export function themeShownBy(mode: 'light' | 'dark' | 'system'): ResolvedTheme {
  if (mode !== 'system') return mode;
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function currentTheme(): ResolvedTheme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/**
 * Runs `applyChange` (which must update the theme store) with a crossfade when
 * the visible theme goes from one to the other. Never throws; falls back to an
 * immediate change.
 */
export function changeThemeWithFade(nextTheme: ResolvedTheme, applyChange: () => void): void {
  const doc = document as DocumentWithViewTransitions;
  const root = document.documentElement;
  const selectionId = ++latestSelection;
  const canFade =
    typeof doc.startViewTransition === 'function' && !prefersReducedMotion() && nextTheme !== currentTheme();

  if (!canFade) {
    // Also ends any earlier fade's attribute: that fade's own clear() no longer matches.
    root.removeAttribute(THEME_FADE_ATTRIBUTE);
    applyChange();
    return;
  }

  root.setAttribute(THEME_FADE_ATTRIBUTE, nextTheme === 'dark' ? 'to-dark' : 'to-light');

  const clear = () => {
    // A newer tap may have started its own fade; only the latest one clears.
    if (selectionId === latestSelection) root.removeAttribute(THEME_FADE_ATTRIBUTE);
  };

  try {
    const transition = doc.startViewTransition!(() => {
      // Stale: a newer tap has already chosen. Skip, so it can't be overwritten.
      if (selectionId !== latestSelection) return;
      flushSync(applyChange);
    });
    transition.finished.then(clear, clear);
  } catch (error) {
    console.error('[FitWizard] Theme fade failed; applying the theme directly.', error);
    clear();
    applyChange();
  }
}
