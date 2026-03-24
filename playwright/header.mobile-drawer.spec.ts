import { devices, expect, test, type Page } from '@playwright/test';

const ONBOARDING_STORAGE_KEY = 'fitwizard-onboarding';
const CONSENT_STORAGE_KEY = 'fitwizard_consent_v1';
const ANALYTICS_CONSENT_STORAGE_KEY = 'fitwizard_analytics_consent';
const TRAINER_STORAGE_KEY = 'fitwizard-trainer';
const THEME_STORAGE_KEY = 'fitwizard-theme';
const iPhone13 = devices['iPhone 13'];

async function seedMobileDrawerState(
  page: Page,
  options: {
    themeMode?: 'light' | 'dark' | 'system';
  } = {},
) {
  const { themeMode = 'system' } = options;

  await page.addInitScript(
    ({ onboardingKey, consentKey, analyticsConsentKey, trainerKey, themeKey, mode }) => {
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
            isTrainerMode: true,
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
    },
    {
      onboardingKey: ONBOARDING_STORAGE_KEY,
      consentKey: CONSENT_STORAGE_KEY,
      analyticsConsentKey: ANALYTICS_CONSENT_STORAGE_KEY,
      trainerKey: TRAINER_STORAGE_KEY,
      themeKey: THEME_STORAGE_KEY,
      mode: themeMode,
    },
  );
}

test.describe('mobile header drawer flow', () => {
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

    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('data-theme-mode', 'system');
    await expect(drawer).toHaveAttribute('data-resolved-theme', 'light');
    const drawerBox = await drawer.boundingBox();
    const drawerPosition = await drawer.evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        position: styles.position,
        right: styles.right,
      };
    });
    expect(drawerBox).not.toBeNull();
    expect(drawerBox!.y).toBeLessThan(2);
    expect(drawerPosition.position).toBe('fixed');
    expect(drawerPosition.right).toBe('0px');

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

    await expect(page.getByTestId('mobile-drawer-profile')).toBeVisible();
    await expect(page.getByTestId('mobile-drawer-profile').getByText('Codex')).toBeVisible();
    await expect(page.getByTestId('mobile-drawer-profile').getByText('Pro Trainer Mode')).toBeVisible();
    await expect(page.getByTestId('mobile-drawer-profile').getByText('System • Light')).toBeVisible();

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

    await expect(drawer.getByText('Trainer tools')).toBeVisible();

    const footer = page.getByTestId('mobile-drawer-footer');
    await expect(footer.getByText('Theme')).toBeVisible();
    await expect(footer.getByText('Motion Tilt')).toBeVisible();
    await expect(footer.getByText('Settings & Profile')).toBeVisible();
    await expect(footer.getByText('Trainer Mode')).toBeVisible();
    await expect(footer.getByText('Aetheric controls')).toBeVisible();
    await expect(footer.getByRole('switch', { name: /trainer mode/i })).toBeChecked();

    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);

    await openMenuButton.click();
    await expect(drawer).toBeVisible();

    await footer.getByRole('link', { name: /settings & profile/i }).click();
    await page.waitForURL((url) => url.pathname === '/profile');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /open menu/i })).toBeVisible();
  });

  test('switches the drawer to dark aetheric styling when the theme resolves dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await seedMobileDrawerState(page, { themeMode: 'system' });
    await page.goto('/');

    await page.getByRole('button', { name: /open menu/i }).click();

    const drawer = page.getByRole('dialog');
    await expect(drawer).toHaveAttribute('data-theme-mode', 'system');
    await expect(drawer).toHaveAttribute('data-resolved-theme', 'dark');
    await expect(page.getByTestId('mobile-drawer-profile').getByText('System • Dark')).toBeVisible();

    const themeTokens = await drawer.evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        background: styles.getPropertyValue('--aetheric-bg').trim(),
        text: styles.getPropertyValue('--aetheric-text').trim(),
      };
    });

    expect(themeTokens.background).toBe('#0c0c1f');
    expect(themeTokens.text).toBe('#ffffff');
  });
});
