import { expect, test, type Page } from '@playwright/test';

const ONBOARDING_STORAGE_KEY = 'fitwizard-onboarding';
const CONSENT_STORAGE_KEY = 'fitwizard_consent_v1';
const ANALYTICS_CONSENT_STORAGE_KEY = 'fitwizard_analytics_consent';
const WGER_API_PATTERN = '**/api/v2/exerciseinfo/**';
const TRENDING_EXERCISE_PATTERN = '**/rest/v1/rpc/get_trending_exercises';

async function seedOnboarding(page: Page) {
  await page.addInitScript(({ storageKey, consentKey, analyticsConsentKey }) => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        state: {
          isComplete: true,
          hasStarted: true,
          userData: {
            displayName: 'Codex',
            avatarEmoji: '💪',
            role: 'user',
            interestedGoals: ['strength'],
          },
        },
        version: 0,
      })
    );
    window.localStorage.setItem(consentKey, new Date().toISOString());
    window.localStorage.setItem(analyticsConsentKey, 'false');
  }, {
    storageKey: ONBOARDING_STORAGE_KEY,
    consentKey: CONSENT_STORAGE_KEY,
    analyticsConsentKey: ANALYTICS_CONSENT_STORAGE_KEY,
  });
}

async function openExercises(page: Page) {
  await page.route(WGER_API_PATTERN, (route) => route.abort());
  await page.route(TRENDING_EXERCISE_PATTERN, (route) => route.abort());
  await seedOnboarding(page);
  await page.goto('/exercises');
  await expect(page.getByRole('heading', { name: /premium exercise library/i })).toBeVisible();
  await expect(page.getByText(/backup boot sequence active/i)).toBeVisible();
}

async function closeExerciseDetails(page: Page) {
  const phoneCloseButton = page.getByRole('button', { name: /close exercise details/i });
  const standardCloseButton = page.getByRole('button', { name: /^close$/i });

  if (await phoneCloseButton.count()) {
    await phoneCloseButton.click();
    return;
  }

  await standardCloseButton.first().click();
}

test.describe('exercise library smoke', () => {
  test.describe('desktop', () => {
    test.use({ viewport: { width: 1440, height: 960 } });

    test('renders the desktop catalog and opens/closes a detail surface', async ({ page }) => {
      await openExercises(page);

      const firstCard = page.getByRole('button', { name: /^Open / }).first();
      const accessibleName = await firstCard.getAttribute('aria-label');
      const exerciseName = accessibleName?.replace(/^Open\s+/, '') ?? '';

      await firstCard.click();
      await expect(page.getByRole('heading', { name: exerciseName, exact: true })).toBeVisible();
      await closeExerciseDetails(page);
      await expect(page.getByRole('heading', { name: exerciseName, exact: true })).toHaveCount(0);
    });
  });

  test.describe('tablet', () => {
    test.use({
      viewport: { width: 834, height: 1194 },
      hasTouch: true,
      isMobile: false,
    });

    test('keeps filters usable and catalog cards visible on tablet', async ({ page }) => {
      await openExercises(page);

      const search = page.getByRole('textbox', { name: /search exercise library/i });
      await search.fill('press');
      await expect(search).toHaveValue('press');
      await expect(page.getByRole('button', { name: /^Open / }).first()).toBeVisible();
    });
  });

  test.describe('mobile', () => {
    test.skip(({ browserName }) => browserName === 'firefox', 'Firefox does not support mobile contexts');
    test.use({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });

    test('uses the phone detail drawer and preserves local-first fallback behavior', async ({ page }) => {
      await openExercises(page);

      const firstCard = page.getByRole('button', { name: /^Open / }).first();
      await firstCard.click();

      await expect(page.getByRole('button', { name: /close exercise details/i })).toBeVisible();
      await expect(page.getByText(/source and license/i)).toBeVisible();
      await closeExerciseDetails(page);
    });
  });
});
