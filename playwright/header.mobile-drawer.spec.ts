import { devices, expect, test, type Page } from '@playwright/test';

const ONBOARDING_STORAGE_KEY = 'fitwizard-onboarding';
const CONSENT_STORAGE_KEY = 'fitwizard_consent_v1';
const ANALYTICS_CONSENT_STORAGE_KEY = 'fitwizard_analytics_consent';
const TRAINER_STORAGE_KEY = 'fitwizard-trainer';
const iPhone13 = devices['iPhone 13'];

async function seedMobileDrawerState(page: Page) {
  await page.addInitScript(
    ({ onboardingKey, consentKey, analyticsConsentKey, trainerKey }) => {
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
    },
    {
      onboardingKey: ONBOARDING_STORAGE_KEY,
      consentKey: CONSENT_STORAGE_KEY,
      analyticsConsentKey: ANALYTICS_CONSENT_STORAGE_KEY,
      trainerKey: TRAINER_STORAGE_KEY,
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

  test('shows the aetheric mobile drawer, supports dismissal, and closes through navigation', async ({ page }) => {
    await seedMobileDrawerState(page);
    await page.goto('/');

    const openMenuButton = page.getByRole('button', { name: /open menu/i });
    await expect(openMenuButton).toBeVisible();

    await openMenuButton.click();

    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    await expect(page.getByTestId('mobile-drawer-profile')).toBeVisible();
    await expect(page.getByTestId('mobile-drawer-profile').getByText('Codex')).toBeVisible();
    await expect(page.getByTestId('mobile-drawer-profile').getByText('Pro Trainer Mode')).toBeVisible();

    const mobileNavigation = drawer.getByRole('navigation', { name: /mobile navigation/i });
    await expect(mobileNavigation).toBeVisible();

    for (const label of [
      'Home',
      'Create Plan',
      'View Plan',
      'Exercises',
      'History',
      'Analytics',
      'Circles',
      'Nutrition',
      'Clients',
      'Templates',
      'Revenue',
    ]) {
      await expect(mobileNavigation.getByRole('link', { name: label })).toBeVisible();
    }

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
});
