import { devices, expect, test, type Page } from '@playwright/test';

const ONBOARDING_STORAGE_KEY = 'fitwizard-onboarding';
const CONSENT_STORAGE_KEY = 'fitwizard_consent_v1';
const ANALYTICS_CONSENT_STORAGE_KEY = 'fitwizard_analytics_consent';
const TRAINER_STORAGE_KEY = 'fitwizard-trainer';
const THEME_STORAGE_KEY = 'fitwizard-theme';
const INSTALL_COACH_STORAGE_KEY = 'fitwizard-install-coach-v1';
const iPhone13 = devices['iPhone 13'];

type ThemeProbeFrame = {
  bodyBackground: string;
  drawerMutationAt: number | null;
  drawerResolvedTheme: string | null;
  maxSyncDeltaMs: number | null;
  rootMutationAt: number | null;
  rootDark: boolean;
  themeTransition: string | null;
  themeTransitionContext: string | null;
};

async function seedMobileDrawerState(
  page: Page,
  options: {
    themeMode?: 'light' | 'dark' | 'system';
    trainerMode?: boolean;
  } = {},
) {
  const { themeMode = 'system', trainerMode = false } = options;

  await page.addInitScript(
    ({ onboardingKey, consentKey, analyticsConsentKey, trainerKey, themeKey, installCoachKey, mode, trainerMode }) => {
      window.localStorage.setItem(
        onboardingKey,
        JSON.stringify({
          state: {
            isComplete: true,
            hasStarted: true,
            userData: {
              displayName: 'Codex',
              avatarEmoji: '💪',
              role: 'coach',
              interestedGoals: ['strength'],
            },
          },
          version: 0,
        }),
      );
      window.localStorage.setItem(consentKey, new Date().toISOString());
      window.localStorage.setItem(analyticsConsentKey, 'false');
      window.localStorage.setItem(
        trainerKey,
        JSON.stringify({
          state: {
            isTrainerMode: trainerMode,
            clients: [],
            selectedClientId: null,
            assignments: [],
            templates: [],
            messages: [],
          },
          version: 0,
        }),
      );
      window.localStorage.setItem(
        themeKey,
        JSON.stringify({
          state: {
            mode,
          },
          version: 0,
        }),
      );
      window.localStorage.setItem(
        installCoachKey,
        JSON.stringify({
          state: {
            hasSeenCoach: true,
            dismissed: true,
            installed: false,
          },
          version: 0,
        }),
      );
    },
    {
      onboardingKey: ONBOARDING_STORAGE_KEY,
      consentKey: CONSENT_STORAGE_KEY,
      analyticsConsentKey: ANALYTICS_CONSENT_STORAGE_KEY,
      trainerKey: TRAINER_STORAGE_KEY,
      themeKey: THEME_STORAGE_KEY,
      installCoachKey: INSTALL_COACH_STORAGE_KEY,
      mode: themeMode,
      trainerMode,
    },
  );
}

async function armThemeSyncProbe(page: Page) {
  await page.evaluate(() => {
    const probeWindow = window as Window & { __fitWizardThemeProbe?: ThemeProbeFrame };
    probeWindow.__fitWizardThemeProbe = undefined;

    const drawer = document.querySelector('.aetheric-drawer');
    const mutationTimes = {
      drawer: null as number | null,
      root: null as number | null,
    };

    const rootObserver = new MutationObserver(() => {
      mutationTimes.root ??= performance.now();
    });

    rootObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    const drawerObserver = drawer
      ? new MutationObserver(() => {
          mutationTimes.drawer ??= performance.now();
        })
      : null;

    drawerObserver?.observe(drawer, {
      attributes: true,
      attributeFilter: ['data-resolved-theme'],
    });

    const readFrame = () => {
      const drawer = document.querySelector('.aetheric-drawer');
      const maxSyncDeltaMs =
        mutationTimes.root !== null && mutationTimes.drawer !== null
          ? Math.abs(mutationTimes.root - mutationTimes.drawer)
          : null;

      return {
        bodyBackground: getComputedStyle(document.body).backgroundColor,
        drawerMutationAt: mutationTimes.drawer,
        drawerResolvedTheme: drawer?.getAttribute('data-resolved-theme') ?? null,
        maxSyncDeltaMs,
        rootMutationAt: mutationTimes.root,
        rootDark: document.documentElement.classList.contains('dark'),
        themeTransition: document.documentElement.getAttribute('data-theme-transition'),
        themeTransitionContext: document.documentElement.getAttribute('data-theme-transition-context'),
      };
    };

    document.addEventListener(
      'click',
      () => {
        requestAnimationFrame(() => {
          rootObserver.disconnect();
          drawerObserver?.disconnect();
          probeWindow.__fitWizardThemeProbe = readFrame();
        });
      },
      { capture: true, once: true },
    );
  });
}

async function readThemeSyncProbe(page: Page) {
  await page.waitForFunction(() => Boolean((window as Window & { __fitWizardThemeProbe?: ThemeProbeFrame }).__fitWizardThemeProbe));
  return page.evaluate(
    () => (window as Window & { __fitWizardThemeProbe: ThemeProbeFrame }).__fitWizardThemeProbe,
  );
}

test.describe('desktop header theme controls', () => {
  test('uses the shared compact theme pill and applies root theme synchronously', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 980 });
    await page.emulateMedia({ colorScheme: 'light' });
    await seedMobileDrawerState(page, { themeMode: 'system' });
    await page.goto('/');

    const themeToggle = page.getByTestId('desktop-header-theme-toggle');
    await expect(themeToggle).toBeVisible();

    const themePillOrder = await themeToggle
      .getByRole('button')
      .evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label')));
    expect(themePillOrder).toEqual(['Light', 'System', 'Dark']);

    const lightButton = themeToggle.getByRole('button', { name: 'Light' });
    const systemButton = themeToggle.getByRole('button', { name: 'System' });
    const darkButton = themeToggle.getByRole('button', { name: 'Dark' });

    await expect(systemButton).toHaveAttribute('data-selected', 'true');

    await darkButton.click();
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true);

    await expect(darkButton).toHaveAttribute('data-selected', 'true');
    await expect(lightButton).toHaveAttribute('data-selected', 'false');
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute('data-theme-transition'))).toBeNull();
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute('data-theme-transition-context'))).toBeNull();

    await lightButton.click();
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(false);

    await expect(lightButton).toHaveAttribute('data-selected', 'true');
    await expect(systemButton).toHaveAttribute('data-selected', 'false');
  });
});

test.describe('mobile header drawer flow', () => {
  test.skip(({ browserName }) => browserName === 'firefox', 'Firefox does not support mobile contexts');
  test.use({
    viewport: iPhone13.viewport,
    userAgent: iPhone13.userAgent,
    deviceScaleFactor: iPhone13.deviceScaleFactor,
    isMobile: iPhone13.isMobile,
    hasTouch: iPhone13.hasTouch,
  });

  test('shows the compact aetheric drawer in light system mode without horizontal overflow', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await seedMobileDrawerState(page, { themeMode: 'system' });
    await page.goto('/');

    const openMenuButton = page.getByRole('button', { name: /open menu/i });
    await expect(openMenuButton).toBeVisible();

    await openMenuButton.click();

    const drawer = page.locator('.aetheric-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('data-theme-mode', 'system');
    await expect(drawer).toHaveAttribute('data-resolved-theme', 'light');
    const drawerBox = await drawer.boundingBox();
    const drawerPosition = await drawer.evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        position: styles.position,
        right: styles.right,
        borderTopLeftRadius: styles.borderTopLeftRadius,
        borderBottomLeftRadius: styles.borderBottomLeftRadius,
        borderTopRightRadius: styles.borderTopRightRadius,
        borderBottomRightRadius: styles.borderBottomRightRadius,
      };
    });
    expect(drawerBox).not.toBeNull();
    expect(drawerBox!.y).toBeLessThan(2);
    expect(drawerPosition.position).toBe('fixed');
    expect(drawerPosition.right).toBe('0px');
    expect(drawerPosition.borderTopLeftRadius).not.toBe('0px');
    expect(drawerPosition.borderBottomLeftRadius).not.toBe('0px');
    expect(drawerPosition.borderTopRightRadius).toBe('0px');
    expect(drawerPosition.borderBottomRightRadius).toBe('0px');

    const scrollViewport = drawer
      .getByTestId('mobile-drawer-scroll-area')
      .locator('[data-radix-scroll-area-viewport]');

    const initialNavScrollTop = await scrollViewport.evaluate((element) => element.scrollTop);
    expect(initialNavScrollTop).toBe(0);
    const navOverflow = await scrollViewport
      .evaluate((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }));
    expect(navOverflow.scrollWidth).toBeLessThanOrEqual(navOverflow.clientWidth + 1);
    const scrollViewportChrome = await scrollViewport.evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        maskImage: styles.maskImage,
        webkitMaskImage: styles.getPropertyValue('-webkit-mask-image'),
      };
    });
    expect(scrollViewportChrome.maskImage === 'none' && scrollViewportChrome.webkitMaskImage === 'none').toBe(
      false,
    );

    await expect(page.getByTestId('mobile-drawer-profile')).toBeVisible();
    await expect(page.getByTestId('mobile-drawer-profile').getByText('Codex')).toBeVisible();
    await expect(page.getByTestId('mobile-drawer-profile').getByText('Personal Mode')).toBeVisible();
    await expect(page.getByTestId('mobile-drawer-profile').getByText('System • Light')).toHaveCount(0);

    const lightThemeTokens = await drawer.evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        background: styles.getPropertyValue('--aetheric-bg').trim(),
        text: styles.getPropertyValue('--aetheric-text').trim(),
      };
    });

    expect(lightThemeTokens.background).toBe('#f6f0ff');
    expect(lightThemeTokens.text).toBe('#201532');

    const mobileNavigation = drawer.getByRole('navigation', { name: /mobile navigation/i });
    await expect(mobileNavigation).toBeVisible();

    for (const label of ['Home', 'Create Plan', 'View Plan', 'Exercises', 'History', 'Analytics']) {
      await expect(mobileNavigation.getByRole('link', { name: label })).toBeVisible();
    }

    const historyLink = mobileNavigation.getByRole('link', { name: 'History' });
    const analyticsLink = mobileNavigation.getByRole('link', { name: 'Analytics' });
    await expect(historyLink).toBeInViewport();
    await expect(analyticsLink).toBeInViewport();

    await expect(drawer.getByText('Coach Tools')).toHaveCount(0);

    const footer = page.getByTestId('mobile-drawer-footer');
    await expect(footer.getByText('FitWizard')).toBeVisible();
    await expect(footer.getByText('Motion Tilt')).toBeVisible();
    await expect(footer.getByText('Settings & Profile')).toBeVisible();
    await expect(footer.getByText('Coach Mode')).toBeVisible();
    await expect(footer.getByText('Quick Controls')).toBeVisible();
    const themePillOrder = await footer
      .getByTestId('mobile-drawer-theme-toggle')
      .getByRole('button')
      .evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label')));
    expect(themePillOrder).toEqual(['Light', 'System', 'Dark']);
    await expect(footer.getByRole('switch', { name: /coach mode/i })).not.toBeChecked();
    await expect(footer.getByRole('switch', { name: /coach mode/i })).toBeEnabled();

    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);

    await openMenuButton.click();
    await expect(drawer).toBeVisible();

    await footer.getByRole('link', { name: /settings & profile/i }).click();
    await page.waitForURL((url) => url.pathname === '/profile');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /open menu/i })).toBeVisible();
  });

  test('applies direct quick-controls theme selections without misrouting taps', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await seedMobileDrawerState(page, { themeMode: 'system' });
    await page.goto('/');

    await page.getByRole('button', { name: /open menu/i }).click();

    const drawer = page.locator('.aetheric-drawer');
    const footer = page.getByTestId('mobile-drawer-footer');
    const lightButton = footer.getByRole('button', { name: 'Light' });
    const systemButton = footer.getByRole('button', { name: 'System' });
    const darkButton = footer.getByRole('button', { name: 'Dark' });

    const readBlurState = async () =>
      page.evaluate(() => {
        const drawerElement = document.querySelector('[role="dialog"]');
        const overlayElement = document.querySelector('.backdrop-premium');

        if (!drawerElement || !overlayElement) {
          return null;
        }

        const resolveBackdropFilter = (styles: CSSStyleDeclaration) => {
          const standardFilter = styles.backdropFilter;
          if (standardFilter && standardFilter !== 'none') {
            return standardFilter;
          }

          return styles.getPropertyValue('-webkit-backdrop-filter');
        };

        const drawerStyles = getComputedStyle(drawerElement);
        const overlayStyles = getComputedStyle(overlayElement);

        return {
          drawerBlur: resolveBackdropFilter(drawerStyles),
          overlayBlur: resolveBackdropFilter(overlayStyles),
          drawerOpenContext:
            document.documentElement.getAttribute('data-theme-transition-context') === 'drawer-open',
        };
      });

    await expect(drawer).toHaveAttribute('data-theme-mode', 'system');
    await expect(drawer).toHaveAttribute('data-resolved-theme', 'dark');
    await expect(systemButton).toHaveAttribute('data-selected', 'true');

    const initialBlurState = await readBlurState();
    expect(initialBlurState).not.toBeNull();
    expect(initialBlurState?.drawerBlur).not.toBe('none');
    expect(initialBlurState?.overlayBlur).not.toBe('none');

    const initialBodyBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await armThemeSyncProbe(page);
    await lightButton.tap();
    const lightProbe = await readThemeSyncProbe(page);

    await expect(drawer).toBeVisible();
    expect(lightProbe.maxSyncDeltaMs).not.toBeNull();
    expect(lightProbe.maxSyncDeltaMs).toBeLessThan(50);
    expect(lightProbe.rootDark).toBe(false);
    expect(lightProbe.drawerResolvedTheme).toBe('light');
    expect(lightProbe.themeTransition).toBeNull();
    expect(lightProbe.themeTransitionContext).toBeNull();
    expect(lightProbe.bodyBackground).not.toBe(initialBodyBackground);
    await expect(drawer).toHaveAttribute('data-theme-mode', 'light');
    await expect(drawer).toHaveAttribute('data-resolved-theme', 'light');
    await expect(lightButton).toHaveAttribute('data-selected', 'true');

    const finalBlurState = await readBlurState();
    expect(finalBlurState).not.toBeNull();
    expect(finalBlurState?.drawerOpenContext).toBe(false);
    expect(finalBlurState?.drawerBlur).not.toBe('none');
    expect(finalBlurState?.overlayBlur).not.toBe('none');

    await armThemeSyncProbe(page);
    await systemButton.tap();
    const systemProbe = await readThemeSyncProbe(page);
    expect(systemProbe.maxSyncDeltaMs).not.toBeNull();
    expect(systemProbe.maxSyncDeltaMs).toBeLessThan(50);
    expect(systemProbe.rootDark).toBe(true);
    expect(systemProbe.drawerResolvedTheme).toBe('dark');
    expect(systemProbe.themeTransition).toBeNull();
    await expect(drawer).toHaveAttribute('data-theme-mode', 'system');
    await expect(drawer).toHaveAttribute('data-resolved-theme', 'dark');
    await expect(systemButton).toHaveAttribute('data-selected', 'true');

    await darkButton.tap();
    await expect(drawer).toHaveAttribute('data-theme-mode', 'dark');
    await expect(drawer).toHaveAttribute('data-resolved-theme', 'dark');
    await expect(darkButton).toHaveAttribute('data-selected', 'true');
  });

  test('keeps theme sync transition-free when navigating away after a theme switch', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await seedMobileDrawerState(page, { themeMode: 'system' });
    await page.goto('/');

    await page.getByRole('button', { name: /open menu/i }).click();

    const drawer = page.locator('.aetheric-drawer');
    const footer = page.getByTestId('mobile-drawer-footer');
    const lightButton = footer.getByRole('button', { name: 'Light' });
    const settingsLink = footer.getByRole('link', { name: /settings & profile/i });

    await lightButton.tap();
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute('data-theme-transition-context'))).toBeNull();
    await expect(drawer).toHaveAttribute('data-resolved-theme', 'light');
    await settingsLink.click();

    await page.waitForURL((url) => url.pathname === '/profile');
    await expect(drawer).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute('data-theme-transition'))).toBeNull();
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute('data-theme-transition-context'))).toBeNull();
    await expect(page.getByTestId('profile-theme-toggle')).toBeVisible();
  });

  test('switches the drawer to dark aetheric styling when the theme resolves dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await seedMobileDrawerState(page, { themeMode: 'system' });
    await page.goto('/');

    await page.getByRole('button', { name: /open menu/i }).click();

    const drawer = page.locator('.aetheric-drawer');
    await expect(drawer).toHaveAttribute('data-theme-mode', 'system');
    await expect(drawer).toHaveAttribute('data-resolved-theme', 'dark');
    await expect(page.getByTestId('mobile-drawer-profile').getByText('System • Dark')).toHaveCount(0);
    await expect(page.getByTestId('mobile-drawer-profile').getByText('Personal Mode')).toBeVisible();

    const themeTokens = await drawer.evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        background: styles.getPropertyValue('--aetheric-bg').trim(),
        text: styles.getPropertyValue('--aetheric-text').trim(),
      };
    });

    expect(themeTokens.background).toBe('#0c0c1f');
    expect(['#ffffff', '#fff']).toContain(themeTokens.text);
  });
});
