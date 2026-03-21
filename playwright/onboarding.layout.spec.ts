import { expect, test, type Page } from '@playwright/test';

const ONBOARDING_STORAGE_KEY = 'fitwizard-onboarding';
const CONSENT_STORAGE_KEY = 'fitwizard_consent_v1';
const ANALYTICS_CONSENT_STORAGE_KEY = 'fitwizard_analytics_consent';

async function seedOnboardingWelcome(page: Page) {
  await page.addInitScript(
    ({ storageKey, consentKey, analyticsConsentKey }) => {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          state: {
            isComplete: false,
            hasStarted: false,
            userData: {
              displayName: '',
              avatarEmoji: '💪',
              role: 'user',
              interestedGoals: [],
            },
          },
          version: 0,
        }),
      );
      window.localStorage.setItem(consentKey, new Date().toISOString());
      window.localStorage.setItem(analyticsConsentKey, 'false');
    },
    {
      storageKey: ONBOARDING_STORAGE_KEY,
      consentKey: CONSENT_STORAGE_KEY,
      analyticsConsentKey: ANALYTICS_CONSENT_STORAGE_KEY,
    },
  );
}

async function openOnboarding(page: Page) {
  await seedOnboardingWelcome(page);
  await page.goto('/');
  await page.waitForURL((url) => url.pathname === '/onboarding', { timeout: 5000 });
  await expect(page.locator('header')).toBeVisible();
  await expect(page.getByRole('heading', { name: /let's personalize your experience/i })).toBeVisible();
}

async function expectTopRowBelowHeader(page: Page) {
  const header = page.locator('header');
  const topRow = page.getByTestId('onboarding-top-row');
  const skipButton = page.getByRole('button', { name: /skip for now/i });
  const progressCounter = topRow.getByText(/^1\/3$/);

  await expect(topRow).toBeVisible();
  await expect(skipButton).toBeVisible();
  await expect(progressCounter).toBeVisible();
  await expect(page.getByLabel(/what should we call you\?/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /^next$/i })).toBeVisible();

  const headerBox = await header.boundingBox();
  const topRowBox = await topRow.boundingBox();

  expect(headerBox).not.toBeNull();
  expect(topRowBox).not.toBeNull();
  expect(topRowBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height - 1);
}

async function expectSkipWithoutScroll(page: Page) {
  const startScrollY = await page.evaluate(() => window.scrollY);
  await page.getByRole('button', { name: /skip for now/i }).click();
  await page.waitForURL((url) => url.pathname === '/', { timeout: 5000 });
  expect(await page.evaluate(() => window.scrollY)).toBe(startScrollY);
}

test.describe('onboarding layout regression', () => {
  test.describe('desktop chromium', () => {
    test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium-only desktop coverage');
    test.use({ viewport: { width: 1440, height: 960 } });

    test('keeps onboarding controls below the shared header and allows skipping immediately', async ({ page }) => {
      await openOnboarding(page);
      await expectTopRowBelowHeader(page);
      await expectSkipWithoutScroll(page);
    });
  });

  test.describe('tablet webkit', () => {
    test.skip(({ browserName }) => browserName !== 'webkit', 'WebKit-only tablet coverage');
    test.use({
      viewport: { width: 834, height: 1194 },
      hasTouch: true,
      isMobile: false,
    });

    test('keeps onboarding controls below the shared header and allows skipping immediately', async ({ page }) => {
      await openOnboarding(page);
      await expectTopRowBelowHeader(page);
      await expectSkipWithoutScroll(page);
    });
  });

  test.describe('phone webkit', () => {
    test.skip(({ browserName }) => browserName !== 'webkit', 'WebKit-only phone coverage');
    test.use({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });

    test('keeps onboarding controls below the shared header and allows skipping immediately', async ({ page }) => {
      await openOnboarding(page);
      await expectTopRowBelowHeader(page);
      await expectSkipWithoutScroll(page);
    });
  });
});
