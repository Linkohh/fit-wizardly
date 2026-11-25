import { expect, test, type Page } from '@playwright/test';

/**
 * Wizard Enter key (DEBT-025, Lane D Day 6).
 *
 * Enter on a focused muscle selects it and must not advance the wizard. Enter on the page
 * background still advances. Chromium only, like the lifter loop. Theme is not changed here.
 */

test.skip(({ browserName }) => browserName !== 'chromium', 'Runs on chromium only.');

async function wizardStep(page: Page, stepNumber: number) {
  await expect(page.getByRole('paragraph').filter({ hasText: `Step ${stepNumber} of 6` })).toBeVisible();
}

async function blurToBackground(page: Page) {
  await page.evaluate(() => {
    const active = document.activeElement;
    if (active instanceof HTMLElement || active instanceof SVGElement) active.blur();
  });
  await expect.poll(() => page.evaluate(() => document.activeElement === document.body)).toBe(true);
}

async function openWizardAtLimitations(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'I Agree & Continue' }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByLabel('What should we call you?').fill('E2E Keyboard');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: /^Gain Muscle/ }).click();
  await page.getByRole('button', { name: "Let's Go!" }).click();
  await expect(page).toHaveURL(/\/wizard$/);
  // The goal comes pre-filled from onboarding, so the wizard opens on Limitations.
  await wizardStep(page, 2);
}

test('Enter on a focused muscle selects it without changing the step; Enter on the background advances', async ({
  page,
}) => {
  await openWizardAtLimitations(page);

  // Background Enter advances: Limitations (no input needed) → Equipment.
  await blurToBackground(page);
  await page.keyboard.press('Enter');
  await wizardStep(page, 3);

  // Enter on a focused button activates only that button: the preset is chosen, the step stays.
  const fullGym = page.getByRole('button', { name: 'Full Gym' });
  await fullGym.focus();
  await page.keyboard.press('Enter');
  await wizardStep(page, 3);

  await blurToBackground(page);
  await page.keyboard.press('Enter');
  await wizardStep(page, 4);

  // Focus the first enabled muscle on the body map and press Enter.
  const muscle = page.locator('svg [role="button"][aria-pressed="false"][tabindex="0"]').first();
  await expect(muscle).toBeVisible();
  const muscleName = await muscle.getAttribute('aria-label');
  expect(muscleName).toBeTruthy();
  await muscle.focus();
  await page.keyboard.press('Enter');

  await expect(page.locator(`svg [role="button"][aria-label="${muscleName}"]`).first()).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByText(/^\d+ muscle groups? selected$/)).toBeVisible();
  // Give a stray step change time to happen before asserting it didn't.
  await page.waitForTimeout(300);
  await wizardStep(page, 4);

  // Enter on the background still advances, now that the step is valid.
  await blurToBackground(page);
  await page.keyboard.press('Enter');
  await wizardStep(page, 5);
});
