# Handoff: Coordinator, theme crossfade restored, 2026-11-24

> Requested by Lincoln after device testing: "the light/dark/system switch in the menu snaps instead of the fluid transition it used to have."

## Status
- **Result:** done. A tapped Light / System / Dark change crossfades over 920 ms again.
- **Checks:**
  - lint: 0 errors, 4 warnings (the existing ones)
  - typecheck: pass
  - tests: **1175/1175**
  - build: pass
  - Playwright chromium: **12 passed** (2 new)

## Why it snapped (investigation)
- **Not caused by the launch project.** Commit `32a89e8` "Fix theme sync regression" (2026-05-02, before Day 0):
  - removed the theme-transition code in `App.tsx`, about 150 lines, which used a View Transition outside the drawer and a CSS colour fade inside it
  - cut `--theme-transition-duration` from 920 ms to 50 ms
  - added Playwright tests that require the switch to be instant and "transition-free"
- **The drawer can't fade with CSS alone.** Its background is a gradient, which CSS transitions can't interpolate. That's why it snapped.
- **Checked every project-era change to the theme code:** `index.css`, `themeStore`, `Header.tsx`, `App.tsx`. Nothing from Days 0–7 affected this. #84's `MotionConfig reducedMotion="user"` only affects Framer Motion when the OS has Reduce Motion on.

## What changed
- **`src/lib/themeFade.ts` (new):** `changeThemeWithFade(nextTheme, applyChange)` and `themeShownBy(mode)`.
  - It wraps the change in `document.startViewTransition()`, and the change runs inside `flushSync`. The store update and ThemeProvider's `dark` class land in the same step, so the store, the class and the screen never disagree. That was the May concern.
  - It uses its own `data-theme-fade` attribute. The legacy `data-theme-transition` rules (50 ms) never fire, and the May tests that check that attribute still pass unchanged.
  - **No fade, change applied immediately, when:**
    - Reduce Motion is on
    - the browser has no View Transitions (older iOS Safari, for example)
    - the visible theme doesn't change (for example System while the OS is light)
    - starting the transition throws
  - With quick repeat taps, only the latest fade clears the attribute.
  - OS theme changes in System mode are not faded, as before.
- **`src/components/theme/ThemeModePill.tsx`:** the click goes through `changeThemeWithFade`. It covers every pill: the desktop header, the mobile header, the drawer quick controls and Profile. No changes in `Header.tsx`, `Profile.tsx` or `themeStore.ts`.
- **`src/index.css`:**
  - new tokens: `--theme-fade-duration: 920ms` and `--theme-fade-ease: cubic-bezier(0.22, 1, 0.36, 1)` (the pre-May values)
  - three rules scoped to `html[data-theme-fade]`
  - `::view-transition { pointer-events: none }`, so the drawer stays tappable during the fade

## Tests
- **`src/lib/themeFade.test.ts` (6 tests):**
  - fades, and applies inside the transition
  - Reduce Motion: immediate, no fade
  - no View Transitions: immediate
  - same visible theme: no fade
  - a throw falls back to immediate
  - two quick taps: only the latest clears the attribute
- **`playwright/header.mobile-drawer.spec.ts`:**
  - **New:** "crossfades a tapped theme change while the theme itself applies at once". The fade attribute is set on tap, the theme applies in under 250 ms, every view-transition animation is 920 ms, the legacy attribute stays null, and the attribute clears afterwards.
  - **New:** "applies a tapped theme change with no crossfade when Reduce Motion is on".
  - **Changed: `armThemeSyncProbe`.** It used to read exactly one frame after the click. The View Transition applies the change one frame later, after the browser captures the old screen, so the probe now waits until both `<html>` and the drawer have changed (1.5 s cap). It still asserts they changed less than 50 ms apart, so the sync guarantee from May is kept.
- **Measured** in headless Chromium (software rendering), iPhone 13 drawer:
  - Dark: theme applied at 75 ms, fade visible at 99 ms after the tap
  - Light: 50 ms and 111 ms
  - Fade progress is linear over 920 ms.

## Ownership
- `ThemeModePill.tsx` and `index.css` theme rules sit in Lane C's area this wave. This was a coordinator change at Lincoln's request, kept to one line in the pill. **Lane C:** please note it before you touch the theme pill or the header.

## Unverified
- **Real devices.** iOS Safari supports View Transitions from 18. On older iOS it falls back to the instant switch. Lincoln's check:
  1. In the mobile menu, tap Dark, then Light. It should fade over about 1 s, and the menu should stay tappable.
  2. With Settings, Accessibility, Reduce Motion on, it should switch instantly.
- **The duration is one token.** If 920 ms feels slow, change `--theme-fade-duration` in `src/index.css` (350 ms was the other option offered).
