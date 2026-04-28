# Preview B Merge Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `preview_b` safe to promote into `main` without shipping the deployed onboarding crash or failing merge checks.

**Architecture:** Keep the merge as a fast-forward promotion from `origin/main` to `preview_b`, but fix release-blocking defects on `preview_b` first. The main functional fix is in onboarding persistence; the rest is test alignment and repository hygiene so CI and review stay trustworthy.

**Tech Stack:** Vite, React, TypeScript, Zustand persist, Vitest, Playwright, Vercel static deployment.

---

## Current Findings

- `preview_b` is 27 commits ahead of `origin/main`; `origin/main` has 0 commits not contained in `preview_b`.
- Local `main` is stale compared with `origin/main`; treat `origin/main` as the production baseline.
- Local validation passed: `npm run lint`, `npm run test:run`, `npm run build`, `npm --prefix server run test`, `npm --prefix server run build`.
- Deployed preview blocker: `https://fitswizardbeta.vercel.app/onboarding` crashes with `TypeError: Cannot read properties of undefined (reading 'trim')` from `canProceed`.
- Added Playwright spec blocker: `npx playwright test playwright/header.mobile-drawer.spec.ts --project=chromium` failed 3 of 5 tests.
- Hygiene blockers: `git diff --check origin/main...preview_b` fails on two `config 4.xml` files; `src/components/Header 2.tsx` is unused; `.claude/settings.local.json` remains tracked even though ignored.

## File Structure

- Modify: `src/stores/onboardingStore.ts` - persist sanitizer and merge behavior for complete `userData`.
- Modify: `src/test/onboardingStore.test.ts` - regression coverage for missing legacy persisted fields.
- Modify: `playwright/header.mobile-drawer.spec.ts` - align drawer expectations with authenticated trainer gating, or seed a real authenticated trainer state if that is the intended scenario.
- Remove from branch: `src/components/Header 2.tsx` - unused duplicate component.
- Remove from branch: `android/app/src/main/res/xml/config 4.xml` - duplicate generated config file with whitespace errors.
- Remove from branch: `ios/App/App/config 4.xml` - duplicate generated config file with whitespace errors.
- Remove from Git tracking: `.claude/settings.local.json` - machine-local settings; keep ignored locally.

### Task 1: Fix Onboarding Persisted-State Crash

**Files:**
- Modify: `src/stores/onboardingStore.ts`
- Test: `src/test/onboardingStore.test.ts`

- [ ] **Step 1: Write the failing regression test**

Add a test that hydrates legacy persisted onboarding data missing `displayName`.

```ts
it('hydrates legacy onboarding data with a safe display name fallback', async () => {
  window.localStorage.setItem(
    'fitwizard-onboarding',
    JSON.stringify({
      state: {
        isComplete: false,
        hasStarted: true,
        currentStep: 'welcome',
        userData: {
          avatarEmoji: '💪',
          role: 'user',
          interestedGoals: [],
        },
      },
      version: 0,
    }),
  );

  await useOnboardingStore.persist.rehydrate();

  const state = useOnboardingStore.getState();
  expect(state.userData.displayName).toBe('');
  expect(state.canProceed()).toBe(false);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:run -- src/test/onboardingStore.test.ts`

Expected: FAIL before implementation because `displayName` is `undefined`.

- [ ] **Step 3: Implement a complete sanitizer**

In `src/stores/onboardingStore.ts`, make `sanitizeOnboardingPersistedState` preserve or default every `OnboardingUserData` field.

```ts
const sanitizeOnboardingPersistedState = (state: Partial<OnboardingState> | undefined) => ({
  isComplete: Boolean(state?.isComplete),
  hasStarted: Boolean(state?.hasStarted),
  currentStep: state?.currentStep ?? 'welcome',
  userData: {
    ...initialUserData,
    ...state?.userData,
    displayName:
      typeof state?.userData?.displayName === 'string'
        ? state.userData.displayName
        : initialUserData.displayName,
    avatarEmoji: state?.userData?.avatarEmoji ?? initialUserData.avatarEmoji,
    role: state?.userData?.role ?? initialUserData.role,
    interestedGoals: Array.isArray(state?.userData?.interestedGoals)
      ? state.userData.interestedGoals
      : initialUserData.interestedGoals,
  },
});
```

- [ ] **Step 4: Run focused tests**

Run: `npm run test:run -- src/test/onboardingStore.test.ts src/components/onboarding/OnboardingFlow.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/stores/onboardingStore.ts src/test/onboardingStore.test.ts
git commit -m "Fix onboarding persisted state hydration"
```

### Task 2: Fix Or Re-scope Mobile Drawer Playwright Coverage

**Files:**
- Modify: `playwright/header.mobile-drawer.spec.ts`
- Possibly modify: `src/components/Header.tsx`
- Possibly modify: `src/components/header/mobile-drawer-model.ts`

- [ ] **Step 1: Decide the intended unauthenticated drawer behavior**

Current app behavior with the test seed is `Guest User` and `Personal Mode` because trainer mode is gated by `profile?.is_trainer === true`. If that is correct, update the Playwright expectations away from `Codex` and `Coach Mode`.

- [ ] **Step 2: Update the failing expectations**

For unauthenticated coverage, replace profile assertions with:

```ts
await expect(page.getByTestId('mobile-drawer-profile').getByText('Guest User')).toBeVisible();
await expect(page.getByTestId('mobile-drawer-profile').getByText('Personal Mode')).toBeVisible();
```

If authenticated coach coverage is required instead, add proper auth test scaffolding rather than relying only on `fitwizard-trainer` localStorage.

- [ ] **Step 3: Investigate blur-token failure**

Run the failing test and inspect `test-results/.../error-context.md`. If `drawerBlur` is `none` because CSS intentionally changed, update the assertion to the actual supported token. If the glass effect regressed, fix the drawer/overlay CSS in `src/index.css` or `src/components/ui/sheet.tsx`.

- [ ] **Step 4: Run focused Playwright**

Run: `npx playwright test playwright/header.mobile-drawer.spec.ts --project=chromium`

Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add playwright/header.mobile-drawer.spec.ts src/components/Header.tsx src/components/header/mobile-drawer-model.ts src/index.css src/components/ui/sheet.tsx
git commit -m "Stabilize mobile drawer regression coverage"
```

### Task 3: Remove Merge Hygiene Noise

**Files:**
- Remove: `src/components/Header 2.tsx`
- Remove: `android/app/src/main/res/xml/config 4.xml`
- Remove: `ios/App/App/config 4.xml`
- Untrack: `.claude/settings.local.json`

- [ ] **Step 1: Remove unused and duplicate files**

Run:

```bash
git rm "src/components/Header 2.tsx"
git rm "android/app/src/main/res/xml/config 4.xml"
git rm "ios/App/App/config 4.xml"
git rm --cached ".claude/settings.local.json"
```

- [ ] **Step 2: Verify no references remain**

Run: `rg -n "Header 2|config 4|settings.local" .`

Expected: no production references except `.gitignore` comments if retained.

- [ ] **Step 3: Verify diff hygiene**

Run: `git diff --check origin/main...HEAD`

Expected: no output and exit code 0.

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "Remove local and duplicate generated files"
```

### Task 4: Full Release Verification

**Files:**
- No code changes expected.

- [ ] **Step 1: Run local gates**

```bash
npm run lint
npm run test:run
npm run build
npm --prefix server run test
npm --prefix server run build
npx playwright test playwright/header.mobile-drawer.spec.ts --project=chromium
git diff --check origin/main...HEAD
```

Expected: all pass. Lint warnings may remain, but no errors.

- [ ] **Step 2: Redeploy preview and smoke test Vercel**

Open `https://fitswizardbeta.vercel.app/` and verify:

- `/onboarding` renders the first onboarding step instead of the global error boundary.
- Browser console has no runtime errors.
- Mobile drawer opens and closes, theme controls respond, and profile state matches the intended auth state.

- [ ] **Step 3: Promote to main**

```bash
git fetch --all --prune
git switch main
git merge --ff-only origin/main
git merge --ff-only preview_b
git push origin main
```

Expected: fast-forward merge succeeds.

- [ ] **Step 4: Production smoke test**

Open `https://fit-wizardly.vercel.app/` after Vercel production deploy completes and repeat the onboarding and mobile drawer checks.
