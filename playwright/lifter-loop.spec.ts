import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';

/**
 * Lifter loop, as a guest with no Supabase (roadmap 3.5, Lane D Day 4).
 *
 * onboarding → wizard → plan → start day 1 → log two sets → reload partway → finish and
 * rate → reload (History, Plan) → new page on the same saved storage. Saved data lives in IndexedDB (`fitwizard` / `kv`, contract #2),
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
  // Onboarding hands over to the wizard with the goal filled in from the interest (#76).
  await expect(page).toHaveURL(/\/wizard$/);
}

async function wizardStep(page: Page, stepNumber: number) {
  await expect(page.getByRole('paragraph').filter({ hasText: `Step ${stepNumber} of 6` })).toBeVisible();
}

async function generatePlanWithWizard(page: Page) {
  await wizardStep(page, 2);
  const next = page.getByRole('button', { name: 'Next', exact: true });

  // 1. Goal: pre-filled as Muscle Growth; go back and choose Strength. The radio input
  //    is visually hidden; the card heading is what a user clicks.
  await page.getByRole('navigation', { name: 'Plan progress' }).getByRole('button', { name: /^Training Goal/ }).click();
  await wizardStep(page, 1);
  await expect(page.getByRole('radio', { name: /Muscle Growth/ })).toBeChecked();
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

interface AxeFinding {
  screen: string;
  id: string;
  impact: string;
  help: string;
  targets: string[];
  html: string[];
}

/**
 * Serious or critical axe findings that are known and owned (handoff 2026-11-24-lane-d-day-5.md).
 * Format: `screen:rule`.
 */
const KNOWN_AXE_FINDINGS = new Set([
  // Footer text (muted on the living background): Lane C.
  'wizard:color-contrast',
  // WizardStepper step buttons: aria-label is the long label, visible text the short one
  // (src/components/wizard/WizardStepper.tsx:58): Lane B, DEBT-106.
  'wizard:label-content-name-mismatch',
  'workout:color-contrast',
  // Toast close button has no name; it lives in src/components/ui/toast.tsx: coordinator decision.
  'plan:button-name',
  'workout:button-name',
  // Plan week cards (white text on bg-primary/55): Lane B.
  'plan:color-contrast',
  // History page (text-primary/60, text-cyan-400, "Toggle exercise stats" chip): unassigned.
  'history:color-contrast',
  'history:label-content-name-mismatch',
]);

/**
 * Wait until finite CSS/Web Animations have finished, so axe sees settled colours and
 * visibility (e.g. the wizard stepper's colour transition). Infinite animations (pulses,
 * the living background) are ignored, since they never finish.
 */
async function waitForAnimationsToSettle(page: Page) {
  await page.waitForFunction(
    () =>
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getComputedTiming().endTime !== Infinity)
        .every((animation) => animation.playState !== 'running' && animation.playState !== 'pending'),
    undefined,
    { timeout: 10_000 },
  );
  // Two frames for animations driven from requestAnimationFrame to write their last values.
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
}

/**
 * Axe pass (roadmap 3.4, Lane D Day 5): serious and critical WCAG 2.1 A/AA violations on one screen.
 * Results are attached to the test report; the test asserts on them at the end.
 */
async function axeScan(page: Page, testInfo: TestInfo, screen: string): Promise<AxeFinding[]> {
  await waitForAnimationsToSettle(page);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const findings = results.violations
    .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    .map((violation) => ({
      screen,
      id: violation.id,
      impact: violation.impact ?? 'unknown',
      help: violation.help,
      targets: violation.nodes.slice(0, 5).map((node) => node.target.join(' ')),
      html: violation.nodes.slice(0, 5).map((node) => node.html.slice(0, 160)),
    }));
  await testInfo.attach(`axe-${screen}`, {
    body: JSON.stringify(findings, null, 2),
    contentType: 'application/json',
  });
  return findings;
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

interface SavedPlanState {
  activeWorkout?: { exercises?: Array<{ sets?: Array<{ completed?: boolean; weight: number; reps: number; rir: number }> }> } | null;
  workoutLogs?: Array<{ dayName?: string }>;
}

/** The plan store as saved in IndexedDB (`fitwizard` / `kv`, contract #2). */
async function savedPlanState(page: Page): Promise<SavedPlanState> {
  return page.evaluate(async (key) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('fitwizard');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      if (!db.objectStoreNames.contains('kv')) return {};
      const raw = await new Promise<unknown>((resolve, reject) => {
        const request = db.transaction('kv', 'readonly').objectStore('kv').get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      if (typeof raw !== 'string') return {};
      return ((JSON.parse(raw) as { state?: unknown }).state ?? {}) as Record<string, unknown>;
    } finally {
      db.close();
    }
  }, PLAN_STORE_KEY) as Promise<SavedPlanState>;
}

/** Completed sets of the first exercise in the saved in-progress workout. */
async function savedCompletedSets(page: Page): Promise<Array<{ weight: number; reps: number; rir: number }>> {
  const sets = (await savedPlanState(page)).activeWorkout?.exercises?.[0]?.sets ?? [];
  return sets.filter((set) => set.completed).map(({ weight, reps, rir }) => ({ weight, reps, rir }));
}

/** Day names of the saved finished workouts. */
async function savedWorkoutLogDays(page: Page): Promise<string[]> {
  return ((await savedPlanState(page)).workoutLogs ?? []).map((log) => log.dayName ?? '');
}

const EXPECTED_SETS = [
  { weight: 40, reps: 10, rir: 3 },
  { weight: 42.5, reps: 8, rir: 3 },
];

/** After a reload partway through: both saved sets show as done, set 3 is next and prefilled. */
async function expectSavedSetsShown(page: Page) {
  await expect(page.getByRole('heading', { name: DAY_ONE, level: 1 })).toBeVisible();
  for (const [index, saved] of EXPECTED_SETS.entries()) {
    const set = setGroup(page, index + 1);
    await expect(set.getByRole('img', { name: 'Set completed' })).toBeVisible();
    await expect(set.getByRole('spinbutton', { name: 'Weight (lbs)' })).toHaveValue(String(saved.weight));
    await expect(set.getByRole('spinbutton', { name: 'Reps' })).toHaveValue(String(saved.reps));
  }
  const third = setGroup(page, 3);
  await expect(third.getByRole('button', { name: 'Complete Set' })).toBeVisible();
  await expect(third.getByRole('spinbutton', { name: 'Weight (lbs)' })).toHaveValue('42.5');
}

async function finishAndRate(page: Page) {
  await page.getByRole('button', { name: 'Finish workout', exact: true }).click();
  const rating = page.getByRole('alertdialog', { name: 'How was the workout?' });
  await rating.getByRole('button', { name: 'Just Right' }).click();
  await expect(page.getByRole('heading', { name: /Workout Complete!/ })).toBeVisible();
}

async function expectHistoryShowsWorkout(page: Page) {
  await expect(page).toHaveURL(/\/history$/);
  await expect(page.getByTestId('history-empty-state')).toHaveCount(0);
  await expect(page.getByText(DAY_ONE).first()).toBeVisible();
}

test.describe('lifter loop (guest)', () => {
  test('plans, logs, reloads partway, finishes, and keeps it all on a new page', async ({ page, browser }, testInfo) => {
    // The full loop plus four axe scans (about 2 s each) runs close to the 30 s default.
    test.setTimeout(90_000);
    const axeFindings: AxeFinding[] = [];
    await acceptConsent(page);
    await completeOnboarding(page);
    axeFindings.push(...(await axeScan(page, testInfo, 'wizard')));
    await generatePlanWithWizard(page);
    await expectPlanShown(page);
    axeFindings.push(...(await axeScan(page, testInfo, 'plan')));

    await startDayOne(page);
    axeFindings.push(...(await axeScan(page, testInfo, 'workout')));
    await logSet(page, 1, '40', '10');
    await logSet(page, 2, '42.5', '8');
    await expect.poll(() => savedCompletedSets(page)).toEqual(EXPECTED_SETS);

    // Reload partway through the workout: the saved sets come back as done.
    const workoutUrl = page.url();
    await page.reload();
    await expect(page).toHaveURL(workoutUrl);
    await expectSavedSetsShown(page);

    await finishAndRate(page);
    await page.getByRole('button', { name: 'Done' }).click();
    await expectPlanShown(page);
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'History' }).click();
    await expectHistoryShowsWorkout(page);
    axeFindings.push(...(await axeScan(page, testInfo, 'history')));
    await expect.poll(() => savedWorkoutLogDays(page)).toEqual([DAY_ONE]);

    // Reload: History still has the workout and Plan still has the plan.
    await page.reload();
    await expectHistoryShowsWorkout(page);
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'View Plan' }).click();
    await expectPlanShown(page);

    // Close the context, then open a new page on the same saved storage.
    const storageState = await page.context().storageState({ indexedDB: true });
    await page.context().close();

    const nextContext = await browser.newContext({ storageState });
    try {
      const nextPage = await nextContext.newPage();
      await nextPage.goto('/history');
      await expectHistoryShowsWorkout(nextPage);
      expect(await savedWorkoutLogDays(nextPage)).toEqual([DAY_ONE]);
      await nextPage.goto('/plan');
      await expectPlanShown(nextPage);
    } finally {
      await nextContext.close();
    }

    // No serious or critical axe violations on Wizard, Plan, Workout or History beyond the
    // known ones below, each listed with its owner in the Lane D Day 5 handoff. Remove an
    // entry when its fix merges; a new violation fails here.
    const unexpected = axeFindings.filter((finding) => !KNOWN_AXE_FINDINGS.has(`${finding.screen}:${finding.id}`));
    expect(unexpected, JSON.stringify(unexpected, null, 2)).toEqual([]);
  });
});
