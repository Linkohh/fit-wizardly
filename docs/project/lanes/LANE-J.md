# Lanes J1 and J2: Translation

**Mission:** Every screen a lifter uses in v1 works fully in Spanish, with no English hard-coded into components. German and Portuguese stay hidden (decision D3) until they're complete.

**Active:** Days 8–10. There are two agents. Each owns a set of folders and a key namespace so they never edit the same lines. With fewer agents, lanes B and C can take J1 and J2 on their off days.

## Read first
- `docs/project/README.md`
- `src/lib/i18n.ts`
- `src/locales/localeParity.test.ts` and `src/test/fixtures/localeGaps.json` (the ratchet)
- `docs/SESSION_LOG.md`: search for DEBT-011 and DEBT-019

## How to convert a component
1. Add `const { t } = useTranslation();` (from `react-i18next`).
2. Replace each user-visible string with `t('namespace.component.key', 'English fallback')`. Keep the English fallback identical to today's text, so the English UI doesn't change.
3. For plurals and numbers, use i18next interpolation (`t('logging.sets_done', '{{count}} sets done', { count })`) and the plural suffixes (`_one`, `_other`). Never concatenate translated fragments.
4. Translate `aria-label`, `title`, `placeholder` and toast messages too.
5. Dates and numbers: use `Intl.DateTimeFormat(i18n.language)` / `Intl.NumberFormat`, or the existing `date-fns` locale if the component already uses one.
6. Add every key to `en.json` (English) and `es.json` (Spanish), **only inside your namespace**. Write Spanish that is neutral and suitable for Latin America, uses the informal "tú" form, and keeps fitness terms people actually use: RIR, RPE, series, repeticiones, "1RM".
7. Don't translate exercise names that come from data files (the wger catalogue). That is out of scope.

---

## Lane J1: logging and analytics

**Owns:**
- `src/components/logging/*`. That includes `SetLogger.tsx`, `ReadinessCheck.tsx`, `SupersetIndicator.tsx`, `WarmUpSets.tsx`, `WorkoutSummary.tsx` (text only; Lane H owns the share logic), `RestTimer.tsx` (text only) and `WorkoutLogger.tsx`.
- `src/components/analytics/*`, the 10 cards. For example `StrengthCurve.tsx`, `VolumeHealth.tsx`, `PeriodizationTimeline.tsx`, `SessionRescueCard.tsx` and `WeeklyCoachSummaryCard.tsx`.
- `src/components/history/*`.
- `src/pages/Analytics.tsx` and `src/pages/History.tsx` (text only).

**Namespaces:** `logging.*`, `analytics.*`, `history.*`.

| Day | Task |
|---|---|
| 8 | Convert every file listed above to `t()` with English fallbacks. Add the English keys. Run the app in English: nothing should look different. |
| 9 | Write the Spanish for every new key. Switch the app to Spanish and go through a full workout and the Analytics page. Fix any text that is cut off or wraps badly; Spanish runs about 25% longer. |
| 10 | Update `src/test/fixtures/localeGaps.json` so the ratchet records the smaller gap for `es`. Add a test that renders `SetLogger` and `StrengthCurve` in Spanish and checks for a known translated label. |

**Done when:**
- A search for JSX text nodes with capitalised English words in these folders returns only data-driven values.
- The ratchet shows a smaller `es` gap.
- Tests are green.

---

## Lane J2: nutrition, pages, and the muscle selector

**Owns:**
- `src/components/nutrition/*`: `FoodLogger.tsx`, `HydrationTracker.tsx`, `MacroCalculator.tsx`, `MealSuggestions.tsx`, `NutritionInsights.tsx`, `NutritionLearn.tsx`, `SmartRemaining.tsx` and `NutritionSkeleton.tsx`.
- `src/pages/Nutrition.tsx`, `src/pages/Onboarding.tsx`, `src/pages/UserGuide.tsx` (text only).
- `src/features/mcl/components/MuscleSelector/ui/*`: Sculpt, Surface/Deep, Front/Back/Side, search and regions (DEBT-019). Muscle **names** come from `src/features/mcl/data/muscles.ts`. Translate them only if the data has a display-name field you can key; otherwise list them as a follow-up.
- About long-form copy (DEBT-011) in `src/components/about/*` and `src/data/changelog.ts`: **only if time remains**. Changelog entries for past versions can stay in English.

**Namespaces:** `nutrition.*`, `pages.*`, `mcl.*`, `about.*`.

| Day | Task |
|---|---|
| 8 | Convert the nutrition components and the three pages to `t()`, and add the English keys. |
| 9 | Convert the MCL UI controls (DEBT-019). |
| 10 | Write the Spanish for every new key. Go through Nutrition, the Guide, Onboarding and the wizard muscle step in Spanish. Update the ratchet, and add one Spanish render test for `FoodLogger` and one for the MCL controls. |

**Done when:** the same three checks as J1 pass, for these folders.

---

## Conflict rule for J1 and J2

Both lanes add keys to `en.json` and `es.json`. Each lane only touches its own top-level namespace objects. If a merge conflict happens, keep both sides; the conflicts are always in different objects. The `pages.*` namespace belongs to J2. J1 puts its page text in `analytics.*` and `history.*`.
