import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * Lifter loop, as a guest with no Supabase (roadmap 3.5, Lane D Day 4).
 *
 * onboarding → wizard → plan → start day 1 → log two sets → reload → new page on the
 * same saved storage. Saved data lives in IndexedDB (`fitwizard` / `kv`, contract #2),
 * so the storage-state hand-off includes IndexedDB.
 *
 * Sync shows nothing in demo mode, so the sync row is not asserted.
 * Chromium only: CI runs `--project=chromium`.
 */

const PLAN_STORE_KEY = 'fitwizard-plans';
const DAY_ONE = 'Full Body A';

test.skip(({ browserName }) => browserName !== 'chromium', 'The lifter loop runs on chromium only.');

async function acceptConsent(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'I Agree & Continue' }).click();
}

async function completeOnboarding(page: Page) {
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByLabel('What should we call you?').fill('E2E Lifter');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: /^Gain Muscle/ }).click();
  await page.getByRole('button', { name: "Let's Go!" }).click();
  await expect(page).toHaveURL(/\/$/);
}

async function wizardStep(page: Page, stepNumber: number) {
  await expect(page.getByRole('paragraph').filter({ hasText: `Step ${stepNumber} of 6` })).toBeVisible();
}

async function generatePlanWithWizard(page: Page) {
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Create Plan' }).click();
  await wizardStep(page, 1);
  const next = page.getByRole('button', { name: 'Next', exact: true });

  // 1. Goal. The radio input is visually hidden; the card heading is what a user clicks.
  await page.getByRole('heading', { name: 'Strength', exact: true }).click();
  await expect(page.getByRole('radio', { name: /Strength/ })).toBeChecked();
  await next.click();

  // 2. Limitations: none.
  await wizardStep(page, 2);
  await next.click();

  // 3. Equipment preset.
  await wizardStep(page, 3);
  await page.getByRole('button', { name: 'Full Gym' }).click();
  await next.click();

  // 4. Muscles through the search, not pixel clicks on the body map.
  await wizardStep(page, 4);
  await page.getByRole('searchbox', { name: 'Search muscles by name or nickname' }).fill('chest');
  await page
    .getByRole('region', { name: /Muscles matching/ })
    .getByRole('button', { name: 'Pectoralis Major', exact: true })
    .click();
  await expect(page.getByText('1 muscle groups selected')).toBeVisible();
  await next.click();

  // 5. Schedule: keep the defaults (3 days, 60 min).
  await wizardStep(page, 5);
  await expect(page.getByRole('radio', { name: '3 days per week' })).toBeChecked();
  await next.click();

  // 6. Review → generate.
  await wizardStep(page, 6);
  await page.getByRole('button', { name: 'Generate Plan' }).click();
  await expect(page).toHaveURL(/\/plan$/);
}

async function expectPlanShown(page: Page) {
  await expect(page.getByRole('heading', { name: 'Your Workout Plan', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: DAY_ONE, level: 3 })).toBeVisible();
}

async function startDayOne(page: Page) {
  await page.getByRole('button', { name: 'Start Workout' }).first().click();
  await expect(page).toHaveURL(/\/workout\/[^/]+\/0$/);
  await expect(page.getByRole('heading', { name: 'Daily Readiness Check' })).toBeVisible();
  await page.getByRole('button', { name: 'Skip For Today' }).click();
  await expect(page.getByRole('heading', { name: DAY_ONE, level: 1 })).toBeVisible();
}

function setGroup(page: Page, setNumber: number): Locator {
  return page.getByRole('group', { name: `Set ${setNumber}`, exact: true });
}

async function logSet(page: Page, setNumber: number, weight: string, reps: string) {
  const set = setGroup(page, setNumber);
  await set.getByRole('spinbutton', { name: 'Weight (lbs)' }).fill(weight);
  await set.getByRole('spinbutton', { name: 'Reps' }).fill(reps);
  // RIR 3 ("Moderate"), set from the keyboard: Home is 0, then three steps up.
  const rir = set.getByRole('slider');
  await rir.press('Home');
  for (let step = 0; step < 3; step += 1) await rir.press('ArrowRight');
  await expect(set.getByText('3 - Moderate')).toBeVisible();
  await set.getByRole('button', { name: 'Complete Set' }).click();
  await expect(set.getByRole('img', { name: 'Set completed' })).toBeVisible();
}

/** Completed sets of the first exercise in the saved in-progress workout (IndexedDB). */
async function savedCompletedSets(page: Page): Promise<Array<{ weight: number; reps: number; rir: number }>> {
  return page.evaluate(async (key) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('fitwizard');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      if (!db.objectStoreNames.contains('kv')) return [];
      const raw = await new Promise<unknown>((resolve, reject) => {
        const request = db.transaction('kv', 'readonly').objectStore('kv').get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      if (typeof raw !== 'string') return [];
      const parsed = JSON.parse(raw) as {
        state?: { activeWorkout?: { exercises?: Array<{ sets?: Array<{ completed?: boolean; weight: number; reps: number; rir: number }> }> } };
      };
      const sets = parsed.state?.activeWorkout?.exercises?.[0]?.sets ?? [];
      return sets.filter((set) => set.completed).map(({ weight, reps, rir }) => ({ weight, reps, rir }));
    } finally {
      db.close();
    }
  }, PLAN_STORE_KEY);
}

const EXPECTED_SETS = [
  { weight: 40, reps: 10, rir: 3 },
  { weight: 42.5, reps: 8, rir: 3 },
];

/**
 * After a reload, the first unlogged set (3) is prefilled from saved set 2. This holds both
 * before and after WorkoutLogger passes `loggedSet` (DEBT-095), unlike checks on sets 1–2.
 */
async function expectSavedSetsPrefilled(page: Page) {
  await expect(page.getByRole('heading', { name: DAY_ONE, level: 1 })).toBeVisible();
  await expect(setGroup(page, 3).getByRole('spinbutton', { name: 'Weight (lbs)' })).toHaveValue('42.5');
  await expect(setGroup(page, 3).getByRole('spinbutton', { name: 'Reps' })).toHaveValue('8');
}

test.describe('lifter loop (guest)', () => {
  test('plans, logs two sets, and keeps them through a reload and a new page', async ({ page, browser }) => {
    await acceptConsent(page);
    await completeOnboarding(page);
    await generatePlanWithWizard(page);
    await expectPlanShown(page);

    await startDayOne(page);
    await logSet(page, 1, '40', '10');
    await logSet(page, 2, '42.5', '8');
    await expect.poll(() => savedCompletedSets(page)).toEqual(EXPECTED_SETS);

    // Reload partway through the workout.
    const workoutUrl = page.url();
    await page.reload();
    await expect(page).toHaveURL(workoutUrl);
    await expectSavedSetsPrefilled(page);
    expect(await savedCompletedSets(page)).toEqual(EXPECTED_SETS);

    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'View Plan' }).click();
    await expectPlanShown(page);

    // Close the context, then open a new page on the same saved storage.
    const storageState = await page.context().storageState({ indexedDB: true });
    await page.context().close();

    const nextContext = await browser.newContext({ storageState });
    try {
      const nextPage = await nextContext.newPage();
      await nextPage.goto('/plan');
      await expectPlanShown(nextPage);
      expect(await savedCompletedSets(nextPage)).toEqual(EXPECTED_SETS);

      await nextPage.goto(workoutUrl);
      await expectSavedSetsPrefilled(nextPage);
    } finally {
      await nextContext.close();
    }
  });

  // DEBT-095: SetLogger can show a saved set as done (`loggedSet`, Lane D Day 4), but
  // WorkoutLogger.tsx doesn't pass it yet, so after a reload the saved sets look unlogged.
  test.fixme('shows saved sets as completed after a reload', async ({ page }) => {
    await acceptConsent(page);
    await completeOnboarding(page);
    await generatePlanWithWizard(page);
    await startDayOne(page);
    await logSet(page, 1, '40', '10');
    await logSet(page, 2, '42.5', '8');
    await expect.poll(() => savedCompletedSets(page)).toEqual(EXPECTED_SETS);

    await page.reload();
    await expect(setGroup(page, 1).getByRole('img', { name: 'Set completed' })).toBeVisible();
    await expect(setGroup(page, 2).getByRole('img', { name: 'Set completed' })).toBeVisible();
    await expect(setGroup(page, 3).getByRole('button', { name: 'Complete Set' })).toBeVisible();
  });

  // DEBT-094: nothing in WorkoutLogger.tsx opens the "How was the workout?" dialog, so a
  // workout can't be finished or rated from the UI. Persistence (contract #2) has merged;
  // this step is blocked by the missing control, not by storage.
  test.fixme('finishes and rates the workout, and History keeps it after a reload', async ({ page }) => {
    await acceptConsent(page);
    await completeOnboarding(page);
    await generatePlanWithWizard(page);
    await startDayOne(page);
    await logSet(page, 1, '40', '10');
    await logSet(page, 2, '42.5', '8');

    await page.getByRole('button', { name: /finish workout/i }).click();
    const rating = page.getByRole('alertdialog', { name: 'How was the workout?' });
    await rating.getByRole('button', { name: 'Just Right' }).click();

    await page.goto('/history');
    await page.reload();
    await expect(page.getByRole('main').getByText(DAY_ONE)).toBeVisible();

    await page.goto('/plan');
    await expectPlanShown(page);
  });
});
