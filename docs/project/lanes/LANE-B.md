# Lane B: Honesty & First-Run

**Mission:**
- Everything the app says about itself is true.
- No screen shows made-up data.
- The language choice works.
- A new user reaches a first plan quickly and never meets a blank screen.

**Active:** Days 1–5 (Days 6–7 off). With 4 agents, this lane is paired with Lane A.

## Read first
- `docs/project/README.md`
- `docs/LAUNCH_ROADMAP.md` items 0.1, 0.4, 0.5, 3.6
- `src/lib/i18n.ts`
- `src/locales/localeParity.test.ts`

## Owns
- `index.html` meta tags only. The fonts block is Lane H's.
- AI wording in `src/pages/Legal.tsx`, `src/pages/UserGuide.tsx` and `src/components/legal/ConsentModal.tsx` (**Day 1 only**; Lane C owns `ConsentModal.tsx` from Wave 2).
- The About components (`src/components/about/*`), `src/data/changelog.ts` (wording only, Day 1), `src/components/exercises/ExerciseDetailModal.tsx`, `src/components/exercises/ExerciseBadges.tsx`, `src/components/nutrition/MealSuggestions.tsx`.
- `src/pages/Profile.tsx`: the **language, units and theme** block only. Lane C owns the coach toggle, F the account block, E the sync indicator, H the reminders.
- `src/components/LanguageSelector.tsx` (delete it).
- `src/pages/History.tsx`, `src/pages/Analytics.tsx` (empty-state markup only), and the empty state in `src/pages/Nutrition.tsx`.
- Day 4: `src/components/onboarding/**`, `src/components/wizard/steps/**` (except `GoalStep.tsx` coach code, which is Lane C's), and step configuration in `src/pages/Wizard.tsx`.
- Locale keys: `tagline`, `profile.*`, `emptyStates.*`, `onboarding.*`.

## Must not touch
`vite.config.ts` (Lane D changes the manifest text), stores, routing, nav, `Header.tsx`.

## Contracts
- Uses #1 (feature flags).
- Uses #9 (analytics) from Day 4 if it has merged. Otherwise skip the tracking calls and note it in the handoff.

---

## Day 1: Remove the AI claim (0.1) and fake content (0.5)

### Steps
1. Search the repo, excluding `node_modules`, `docs/` and the `.md` files at the root:

   ```sh
   grep -rnE "\bAI\b|[Aa]rtificial intelligence|KI-gestützt|con IA|com IA" \
     index.html src --include=*.tsx --include=*.ts --include=*.json --include=*.html
   ```

   Known hits:
   - `index.html` lines 9 and 29, plus the title and any Twitter tags
   - `src/locales/en.json`, `es.json`, `de.json` and `pt.json` line 4 (`tagline`)
   - `src/components/legal/ConsentModal.tsx` line 126: "Your AI workout companion is ready." Hardcoded, so it also needs a `t()` key. Found on the Lane E Day 1 smoke test.
   - `src/pages/UserGuide.tsx` lines 15, 27, 93–135 (the "Wisdom AI" section)
   - the unused `ProgressionRecommendations.tsx` and `SplitRecommender.tsx`: leave these alone. Lane D deletes unused files on Day 2. Just list them in your handoff.
2. Replacement wording:
   - Tagline (en): **"Science-based workout plans, built around you."**
   - es: "Planes de entrenamiento basados en la ciencia, hechos para ti."
   - de: "Wissenschaftlich fundierte Trainingspläne, auf dich zugeschnitten."
   - pt: "Planos de treino baseados em ciência, feitos para você."
   - Meta description: "FitWizard builds science-based workout plans around your goals, equipment and schedule, then helps you log every set and track your progress."
3. `UserGuide.tsx`: delete the Wisdom AI tab, its trigger and its content (the Wisdom chat isn't shown anywhere in the app). Rewrite line 15 to: "Everything you need to know about planning, logging and tracking your training."
4. Check `src/components/about/*`, `Legal.tsx` and `src/data/changelog.ts` for AI wording. Change only wording. Don't change past version numbers or dates in the changelog.
5. **0.5 fake content:**
   - `ExerciseBadges.tsx:10` picks badges with `exerciseId.length % 2`. Remove its use from `ExerciseDetailModal.tsx` and delete the component and any test for it.
   - `MealSuggestions.tsx` loads `images.unsplash.com` images, which the production CSP (`vercel.json` `img-src`) blocks. Remove the `imageUrl` field and render an icon or colour tile instead (use a `lucide-react` icon per meal type). Don't add a new external host.
6. Update any test that asserted the old text.

### Done when
- [ ] The search in step 1 returns nothing in `index.html` or `src/`, except the two unused files you listed.
- [ ] The About page, Guide and install prompt read correctly in en and es (start the app and check).
- [ ] `ExerciseBadges` is gone. `MealSuggestions` makes no network image requests (check the DevTools Network tab).
- [ ] Lint, typecheck and tests are green. Handoff written.

---

## Day 2: Language picker (0.4)

> **Carried over from Day 1 handoffs (added 2026-11-17 by the coordinator).** Do these too:
> - `src/components/auth/AuthModal.tsx:86` says "account-backed features like circles and trainer tools", which is untrue with both flags off. Reword it to "Sync your plans and history across devices". DEBT-049. (Lane H owns `auth/*`, but this one-line wording change is an agreed exception for today.)
> - `src/pages/UserGuide.tsx` spells the name "FitWizardly". Change it to "FitWizard". DEBT-047.


### Steps
1. In `src/lib/i18n.ts`, add `launchReady: boolean` to each `AVAILABLE_LANGUAGES` entry: `en: true`, `es: true`, `de: false`, `pt: false` (decision **D3**; default English + Spanish). Export `LAUNCH_LANGUAGES = AVAILABLE_LANGUAGES.filter(l => l.launchReady)`.
2. In `getInitialLanguage()`, if the stored or browser language is supported but not launch-ready, fall back to `en`. This makes German and Portuguese users see English rather than a half-translated UI. Add a test.
3. In `Profile.tsx`, replace the hardcoded `<SelectItem>` list (around lines 215–222) with `LAUNCH_LANGUAGES.map(...)`. Call `changeLanguage(val)` from `@/lib/i18n` instead of `i18n.changeLanguage`, because only the helper saves the choice. Remove French.
4. Move the visible strings in that Profile block (Language, Units, Theme, the labels and descriptions) into `profile.*` keys in `en.json` and `es.json`.
5. `pt.json` defines `"wizard"` twice (lines 13 and 154). Merge the two objects into one **by editing the text**, keeping every key from both, then check that `localeParity.test.ts` still passes. **Do not use a JSON parser for this.** It keeps only the second copy and silently drops the first, which happened once already and was reverted (see the Lane E Day 2 handoff).
6. Delete `src/components/LanguageSelector.tsx` (unused), plus any test or barrel export for it.
7. Add a test, `src/pages/Profile.language.test.tsx`: change to Spanish → `localStorage['fitwizard-language'] === 'es'` → re-render → the UI is in Spanish.

### Done when
- [ ] The picker shows English and Español only.
- [ ] The choice survives a reload.
- [ ] `pt.json` has a single `wizard` key.
- [ ] Tests are green.

---

## Day 3: Empty states (3.6a)

> **Carried over from Day 2 handoffs and review (added 2026-11-18 by the coordinator).** Do these too:
> - `src/lib/i18n.ts`: set `document.documentElement.lang` on start and on `i18n.on('languageChanged')` (DEBT-063). Add a test.
> - Allowed one-word exception: `src/lib/analyticsIntelligence.ts:840` "FitWizardly" → "FitWizard" (DEBT-062).


For each screen, a first-time user should see one sentence explaining what will appear and one clear button for the next step. Use the existing card and button components, semantic colours, and `emptyStates.*` keys.

| Screen | Condition | Message | Action |
|---|---|---|---|
| `History.tsx` | No workout logs | "Your finished workouts will show up here." | **Start today's workout** → `/plan` (or **Create a plan** → `/wizard` if there's no plan) |
| `Analytics.tsx` | Fewer than 2 workouts | "Log two workouts to see your trends." | Same as above |
| `Nutrition.tsx` | No meals today | "Nothing logged today." | **Log a meal** (opens the existing food logger) |

- Check the existing `PlanSkeleton` and `NutritionSkeleton` components (they exist but aren't used). Use them as loading states where data is being hydrated. Lane E's `useStoresHydrated()` (contract #2) tells you when hydration is done. If it hasn't merged yet, stub it to `true`.
- Add a test per screen for the empty state.

**Done when:** a fresh browser profile shows the three empty states with working buttons, and the tests pass.

---

## Day 4: Fewer taps to the first plan (3.6c)

> **Carried over from Day 3 handoffs (added 2026-11-21 by the coordinator).** Do these too:
> - `FoodLogger` is now a `forwardRef` component with `openLogger()` (#68). Keep that handle if you touch Nutrition.
> - Don't change the onboarding role step or coach paths. They're hidden by the flags (Lane C), so count taps on the lifter path only.


### Steps
1. **Measure first.** On a phone-sized viewport (390×844), count taps and screens from a fresh install to the generated plan:
   - onboarding: welcome → role → goals (role is skipped when the coach flag is off, after Lane C's Day 2)
   - the wizard's 6 steps
   - Write the count in your handoff.
2. For each wizard step, list which answers the plan generator actually reads (`src/lib/planGenerator.ts`, `generatePlanFromExercises(exercises, selections)`). Any step whose answers have a sensible default can be **pre-filled and skippable**. Don't remove inputs the generator needs.
3. Make these changes:
   - Onboarding "goals" and the wizard "goal" step ask the same question. Pre-fill the wizard goal from onboarding and skip that step when it's already answered. The user can still go back to change it.
   - Constraints (injuries) defaults to "none" with a one-tap "No injuries" continue.
   - Schedule defaults to 3 days × 45 minutes, which can be changed.
   - Don't change the Anatomy step's behaviour, because it's the product's signature step. Do make sure it has a visible "Let FitWizard choose" option if there isn't one already.
4. If contract #9 (analytics) has merged, add `track('wizard_step_completed', { step })` and `track('onboarding_completed')`.
5. Update the wizard and onboarding tests (`src/components/onboarding/OnboardingFlow.test.tsx`, `src/stores/wizardStore.test.ts`).

### Done when
- [ ] The tap count is lower than the measured baseline, with before and after numbers in the handoff.
- [ ] Every generator input is still settable.
- [ ] Tests are green.

---

## Day 5: Buffer

Fix bugs Lincoln files from the Gate 1 smoke test that fall in Lane B's files. If there are none, use the time to finish converting the remaining hard-coded English on the screens you touched to `t()`.
