

# Finalized AUDIT_AND_IDEAS.md -- Verified and Ready for Implementation

## Overview

This plan creates one file -- **`AUDIT_AND_IDEAS.md`** -- in the project root. Every line number, file path, and code snippet has been verified against the current codebase as of this session. The document is formatted for consumption by both human developers and AI coding agents.

---

## Document Contents (Verified Against Codebase)

The file will contain the following sections, each item following this consistent template:

```text
### [SECTION.NUMBER] Item Title
- Priority: CRITICAL / HIGH / MEDIUM / LOW
- Effort: S (1-2h) / M (3-8h) / L (1-3d) / XL (1+ week)
- Impact: One sentence describing user/business value
- Files: Exact paths to create or modify with line numbers
- Dependencies: Other items that must be done first (if any)
- Current Code: (exact code with file path and line number)
- Proposed Code: (replacement code)
- Why: Engineering and/or CPT-level fitness rationale
```

---

### Quick Wins Summary Table (Top of Document)

| # | ID | Title | Priority | Effort | Impact |
|---|-----|-------|----------|--------|--------|
| 1 | 1.1 | Nutrition Page Light Mode Fix | CRITICAL | S | Fixes invisible text for ~50% of users |
| 2 | 1.2 | SetLogger Touch Targets | HIGH | S | Prevents misclicks during workouts |
| 3 | 3.1 | "Last Time" History Data | HIGH | M | Enables progressive overload tracking |
| 4 | 2.1 | Rest Timer Between Sets | HIGH | M | #1 most-requested fitness app feature |
| 5 | 3.2 | Difficulty Rating Picker | MEDIUM | S | Replaces hardcoded RPE value |
| 6 | 3.3 | Share Workout Card | MEDIUM | M | Social growth via image sharing |
| 7 | 1.3 | Nutrition Tabs Mobile Overflow | MEDIUM | S | Fixes broken layout on iPhone SE |
| 8 | 5.2 | Offline Queue Wiring | HIGH | M | Prevents data loss in gym basements |
| 9 | 1.5 | Confetti on PR Detection | MEDIUM | S | Emotional reward, hook already built |

---

### Section 1: UI/UX Polish (12 items)

**[1.1] Nutrition Page Light Mode Breakage** -- CRITICAL / Effort: S

Every hardcoded `white` and `black` pattern across three files:

- `src/pages/Nutrition.tsx`:
  - Line 59: `hover:text-white` --> `hover:text-foreground`
  - Line 62: `from-white to-white/50` --> `from-foreground to-foreground/50`
  - Line 71: `bg-white/5 border-white/10 hover:bg-white/10 hover:text-white` --> `bg-muted/50 border-border hover:bg-muted hover:text-foreground`
  - Line 80: `bg-white/5 border-white/10` --> `bg-muted/50 border-border`
  - Line 81: `hover:bg-white/10 hover:text-white` --> `hover:bg-muted hover:text-foreground`
  - Line 88: `hover:bg-white/10 hover:text-white` --> `hover:bg-muted hover:text-foreground`
  - Line 100: `hover:text-white` --> `hover:text-foreground`
  - Line 131: `bg-white/5` --> `bg-muted/50`
  - Line 187: `bg-white/5` --> `bg-muted/50`
  - Line 191: `text-white/80` --> `text-foreground/80`
  - Line 198: `bg-white/5 border-white/5 hover:bg-white/10` --> `bg-muted/50 border-border/50 hover:bg-muted`
  - Line 200: `text-white` --> `text-foreground`
  - Line 241: `bg-white/10` --> `bg-muted/20`

- `src/components/nutrition/HydrationTracker.tsx`:
  - Line 59: `text-blue-100` --> `text-blue-600 dark:text-blue-100`
  - Line 68: `bg-black/20` --> `bg-muted/30`
  - Line 82: `text-white/80` --> `text-foreground/80`
  - Lines 91, 98, 105: `bg-white/5` --> `bg-muted/50`

- `src/components/nutrition/FoodLogger.tsx`:
  - Line 98: `hover:bg-white/10` --> `hover:bg-muted`
  - Line 108: `border-white/20` --> `border-border`
  - Line 120: `bg-white/5 border-white/5` --> `bg-muted/50 border-border/50`
  - Line 134: `bg-black/20` --> `bg-muted/30`
  - Line 139: `hover:text-white` --> `hover:text-foreground`
  - Line 163: `bg-black/20 border-white/10` --> `bg-muted/30 border-border`
  - Line 170: `bg-white/5 border-white/10` --> `bg-muted/50 border-border`
  - Line 176: `text-white` --> `text-foreground`
  - Lines 214, 241, 252, 262, 272, 282: All custom food inputs use `bg-black/20 border-white/10` --> `bg-muted/30 border-border`
  - Line 296: `border-white/10` --> `border-border`
  - Line 304: `hover:bg-white/5` --> `hover:bg-muted/50`

- `src/components/nutrition/NutritionInsights.tsx`:
  - Lines 94, 241, 251, 313: `bg-white/5` bar track backgrounds --> `bg-muted/10`
  - Line 99, 221, 276, 334: `glass-card` class audit for light mode

- `src/components/ui/ProgressRing.tsx`:
  - Line 39: `text-white/5` (background ring) --> `text-muted/20`
  - Line 65: `group-hover:text-white` --> `group-hover:text-foreground`
  - Line 66: `text-white/30 group-hover:text-white/50` --> `text-muted-foreground/50 group-hover:text-muted-foreground`

**[1.2] SetLogger Touch Targets** -- HIGH / Effort: S

File: `src/components/logging/SetLogger.tsx`
Lines: 129, 145 (weight buttons), 163, 186 (rep buttons)

All four buttons currently use `className="h-8 w-8"` (32px). Apple HIG and WCAG 2.5.5 require 44px minimum.

Before (line 129): `className="h-8 w-8"`
After: `className="h-8 w-8 min-h-[44px] min-w-[44px]"`

Apply to all four Button instances at lines 129, 145, 163, 186.

**[1.3] Nutrition Tabs Mobile Overflow** -- MEDIUM / Effort: S

File: `src/pages/Nutrition.tsx`, lines 111-119

Before (line 112):
```
<TabsTrigger ...>
    <LayoutDashboard className="w-4 h-4" /> Dashboard
</TabsTrigger>
```

After:
```
<TabsTrigger ...>
    <LayoutDashboard className="w-4 h-4" />
    <span className="hidden sm:inline">Dashboard</span>
</TabsTrigger>
```

Apply same pattern to "Insights" (line 115) and "Learn" (line 118).

**[1.4] WorkoutLogger Header Mobile Collision** -- MEDIUM / Effort: S

File: `src/components/logging/WorkoutLogger.tsx`, lines 149-167

The Cancel button, timer, and badge share one row. On 320px screens they collide. Fix: wrap the timer in a responsive container that stacks on mobile.

**[1.5] Confetti on PR Detection** -- MEDIUM / Effort: S

File: `src/components/logging/WorkoutSummary.tsx`

Line 256: `{/* Confetti animation placeholder */}` -- currently just CSS keyframes.

The `useConfetti` hook exists at `src/hooks/useConfetti.ts` (exports `{ fire }` method at line 102). Wire it:

```tsx
// Add at top of WorkoutSummary component (line 26):
const { fire: fireConfetti } = useConfetti();

// Add useEffect after workoutPRs calculation (after line 29):
useEffect(() => {
  if (workoutPRs.length > 0) {
    fireConfetti();
  }
}, []); // Fire once on mount
```

**[1.6] Meal Delete Button Touch Accessibility** -- MEDIUM / Effort: S

File: `src/pages/Nutrition.tsx`, line 218

Before: `className="... opacity-0 group-hover:opacity-100"`
After: `className="... opacity-100 sm:opacity-0 sm:group-hover:opacity-100"`

Touch devices have no hover state, so the delete button is permanently invisible on mobile.

**[1.7] HydrationTracker Circle Light Mode** -- LOW / Effort: S

File: `src/components/nutrition/HydrationTracker.tsx`, line 68

Before: `bg-black/20 backdrop-blur-sm`
After: `bg-muted/30 backdrop-blur-sm`

**[1.8-1.12] Additional items** covering: skeleton loading for Nutrition dashboard, favorites scroll fade indicators in `FoodLogger.tsx` line 118, empty state illustration upgrades for 4 pages, and full `glass-card` CSS class audit.

---

### Section 2: New Features (7 items)

**[2.1] Rest Timer Between Sets** -- HIGH / Effort: M

New file: `src/components/logging/RestTimer.tsx`

Integration point: `src/components/logging/WorkoutLogger.tsx`

The prescription's `restSeconds` field is already displayed at line 203 (`{prescription.restSeconds}s rest`) but never used functionally. After each `SetLogger` at line 222-231, conditionally render when a set is completed and the next set is not:

```tsx
// After the SetLogger at line 231:
{set.completed && !allSetsCompleted && isActive && (
  <RestTimer
    durationSeconds={prescription.restSeconds}
    onComplete={() => { /* auto-advance focus */ }}
    onSkip={() => { /* dismiss */ }}
  />
)}
```

RestTimer component blueprint:
- Reuses `ProgressRing` from `src/components/ui/ProgressRing.tsx` (circular countdown)
- Uses `useHaptics().success()` from `src/hooks/useHaptics.ts` (line 214) on timer completion
- Audio: optional beep via Web Audio API
- State: `useEffect` with `setInterval` for countdown, auto-starts on mount, `onComplete` callback when reaches 0
- "Skip Rest" button to dismiss early

Store change: Add `restTimerEndTime: number | null` to `ActiveWorkout` interface at `src/stores/planStore.ts` line 54.

**[2.2] Workout History Page** -- MEDIUM / Effort: L

New files:
- `src/pages/History.tsx`
- `src/components/history/CalendarHeatmap.tsx`
- `src/components/history/WorkoutHistoryCard.tsx`

Route: Add to `src/App.tsx` after line 165:
```tsx
<Route path="/history" element={
  <RequireAuth>
    <HistoryPage />
  </RequireAuth>
} />
```

Nav: Add to `src/components/Header.tsx` navItems array (line 46-67):
```tsx
{ path: '/history', label: t('nav.history', 'History') },
```

Data source: `usePlanStore().workoutLogs` (line 74 of `planStore.ts`, capped at 100 entries).

CalendarHeatmap: 7-column grid (Mon-Sun), rows = weeks. Each cell colored by volume intensity (gray = no workout, green shades = volume). Uses `date-fns` (already installed). Click a day to expand `WorkoutHistoryCard`.

**[2.3] Profile / Settings Page** -- MEDIUM / Effort: M

New file: `src/pages/Profile.tsx`
Route: `/profile` (protected)

Consolidates scattered settings:
- Weight unit: currently `planStore.preferredWeightUnit` (line 78 of `planStore.ts`)
- Theme: currently in Header dropdown (lines 195-230 of `Header.tsx`)
- Language: currently `LanguageSelector` in Header (line 233)
- Trainer mode: currently `trainerStore` toggle in Header (lines 236-261)
- Display name: `achievementStore.userName`

Sections: Personal info, Preferences, Account (sign out, data export, delete), Privacy link.

**[2.4] Body Measurements Tracker** -- LOW / Effort: L

New store: `src/stores/measurementsStore.ts`
New component: `src/components/measurements/BodyTracker.tsx`
New type in `src/types/fitness.ts`: `BodyMeasurement` interface

**[2.5] Superset Visual Pairing** -- LOW / Effort: M

The `supersetGroup` field exists on `ExercisePrescription` (line 183 of `src/types/fitness.ts`) but is completely unused in UI.

In `src/components/plan/WorkoutDayCard.tsx`: Group exercises with matching `supersetGroup` values visually (A1/A2 notation, shared background).

In `src/components/logging/WorkoutLogger.tsx`: Show paired exercises in a circuit flow.

**[2.6] Warm-Up and Cool-Down Generation** -- LOW / Effort: M

`WorkoutDay` type has `warmUp?: string[]` and `coolDown?: string[]` (lines 194-195 of `src/types/fitness.ts`). `WorkoutDayCard.tsx` already renders these (lines 41-73) but the data is typically empty.

Fix: Update `src/lib/planGenerator.ts` to populate these arrays dynamically based on the day's target muscles.

**[2.7] Exercise Demo Media** -- LOW / Effort: L

`Exercise` type has `videoUrl`, `gifUrl`, `imageUrl` fields (lines 160-164 of `src/types/fitness.ts`) -- currently empty for most exercises.

In `src/components/exercises/ExerciseDetailModal.tsx`: Add a video/GIF embed section when URLs are populated.

---

### Section 3: Sub-Feature Enhancements (10 items)

**[3.1] "Last Time" Historical Data in SetLogger** -- HIGH / Effort: M

The most impactful "small" change. Users currently see empty weight/rep fields with no context.

Step 1 -- New store method in `src/stores/planStore.ts` (add after `getWorkoutLogsForPlan` at line 447):

```typescript
getLastPerformance: (exerciseId: string): SetLog[] | null => {
  const logs = get().workoutLogs;
  // workoutLogs are sorted newest-first (line 413: [workoutLog, ...state.workoutLogs])
  for (const log of logs) {
    const exerciseLog = log.exercises.find(
      e => e.exerciseId === exerciseId && !e.skipped
    );
    if (exerciseLog) {
      return exerciseLog.sets.filter(s => s.completed);
    }
  }
  return null;
},
```

Step 2 -- Pass to SetLogger in `src/components/logging/WorkoutLogger.tsx` (modify lines 222-231):

```tsx
const lastPerformance = getLastPerformance(prescription.exercise.id);

<SetLogger
  key={idx}
  setNumber={idx + 1}
  targetReps={prescription.reps}
  targetRIR={prescription.rir}
  previousSet={set.completed ? set : undefined}
  historicalSet={lastPerformance?.[idx]}  // NEW PROP
  defaultWeightUnit={preferredWeightUnit}
  onComplete={handleSetComplete}
  isActive={...}
/>
```

Step 3 -- Update `src/components/logging/SetLogger.tsx`:

Add to props interface (line 10-18):
```typescript
historicalSet?: SetLog;
```

Add pre-fill logic (after line 32):
```typescript
useEffect(() => {
  if (historicalSet && !previousSet && weight === 0) {
    setWeight(historicalSet.weight);
  }
}, [historicalSet]);
```

Add display text (after line 123, inside the weight label):
```tsx
{historicalSet && (
  <span className="text-[10px] text-muted-foreground ml-1">
    Last: {historicalSet.weight}{defaultWeightUnit} x {historicalSet.reps}
  </span>
)}
```

**[3.2] Difficulty Rating Picker** -- MEDIUM / Effort: S

File: `src/components/logging/WorkoutLogger.tsx`

Lines 262 and 290 both hardcode `handleFinishWorkout('just_right')`.

The `PerceivedDifficulty` type (line 255 of `src/types/fitness.ts`) supports 4 options: `too_easy | just_right | challenging | too_hard`.

`WorkoutSummary.tsx` lines 65-83 already defines emoji mappings for all 4 options.

Fix: Add state `const [showDifficultySheet, setShowDifficultySheet] = useState(false);`

Change line 262: `onClick={() => setShowDifficultySheet(true)}`
Change line 290: `onClick={() => setShowDifficultySheet(true)}`

Add a Sheet/Dialog that renders 4 emoji buttons (reuse the emojis from WorkoutSummary), each calling `handleFinishWorkout(selectedDifficulty)`.

**[3.3] Share Workout Card** -- MEDIUM / Effort: M

File: `src/components/logging/WorkoutSummary.tsx`, lines 238-241

Before:
```tsx
onClick={() => {
  // TODO: Implement share functionality
}}
```

After:
```tsx
onClick={async () => {
  try {
    const element = document.getElementById('workout-summary-card');
    if (!element) return;

    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(element, {
      backgroundColor: '#0a0a0a',
      scale: 2,
    });
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), 'image/png')
    );

    if (navigator.share && navigator.canShare?.({
      files: [new File([blob], 'workout.png', { type: 'image/png' })]
    })) {
      await navigator.share({
        title: 'My FitWizard Workout',
        text: `Completed ${log.dayName} - ${log.duration}min`,
        files: [new File([blob], 'workout.png', { type: 'image/png' })],
      });
    } else {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      toast.success('Workout card copied to clipboard!');
    }
  } catch (err) {
    console.error('Share failed:', err);
    toast.error('Could not share workout');
  }
}}
```

Also add `id="workout-summary-card"` to the main container div at line 86.

**[3.4] Plate Calculator** -- LOW / Effort: M

New file: `src/components/tools/PlateCalculator.tsx`

When user enters a barbell weight in `SetLogger`, show what plates to load per side. Standard plates: 45, 35, 25, 10, 5, 2.5 lbs (or metric equivalents).

**[3.5] RPE as Alternative to RIR** -- LOW / Effort: S

Add toggle in `SetLogger.tsx` between RIR (current, lines 196-217) and RPE (10 - RIR). Some users prefer RPE scale. Store toggle preference in `planStore.ts`.

**[3.6] Meal Templates** -- LOW / Effort: M

`FoodLogger.tsx` has favorites (lines 115-127) but no meal groupings. Add "Save as Meal" to save food combinations as a template for one-tap re-logging.

**[3.7] Weekly Calorie Trend Line** -- LOW / Effort: M

`NutritionInsights.tsx` has a bar chart (lines 71-173) but no rolling average line chart. Add a `LineChart` using Recharts (already installed) showing 7-day calories consumed vs. target.

**[3.8-3.10] Additional items** covering: Exercise history in detail modal, custom exercise creation, and inline estimated 1RM display using the existing Epley formula from `OneRepMaxCalculator`.

---

### Section 4: Fitness Domain Intelligence (5 items)

**[4.1] Periodization Timeline Visualization** -- MEDIUM / Effort: M

Replace the badge list on `src/pages/Plan.tsx` lines 159-187 with a visual horizontal timeline.

New component: `src/components/plan/PeriodizationTimeline.tsx`

Uses `rirProgression` array from Plan type (`src/types/fitness.ts`, line 217). 4 segments representing weeks, colored by intensity, current week highlighted with pulsing border, deload week visually distinct.

**[4.2] Daily Readiness Score** -- LOW / Effort: M

New component: `src/components/logging/ReadinessCheck.tsx`

Pre-workout modal asking: sleep quality, muscle soreness, energy level, stress (1-5 scale each). Takes under 10 seconds.

Integration: In `WorkoutLogger.tsx`, show before `startWorkout` fires (line 68-71). If overall score < 2.5, suggest lighter session.

**[4.3] Progressive Overload Visualization** -- LOW / Effort: L

New component: `src/components/charts/StrengthCurve.tsx`

Line chart of estimated 1RM per exercise over time using Recharts. Highlight PRs as gold dots. Data source: `planStore.workoutLogs` and `planStore.personalRecords`.

**[4.4] Volume Landmark Warnings (MRV)** -- LOW / Effort: M

After completing a week, compare actual logged volume per muscle to known MRV thresholds. If volume exceeds MRV, show warning. Uses `weeklyVolume` array from Plan type (line 201 in `fitness.ts`).

**[4.5] Training Split Auto-Recommendation** -- LOW / Effort: M

If logged frequency consistently differs from plan, suggest a better split. New function `suggestSplitAdjustment()` in `src/lib/progressionEngine.ts`.

---

### Section 5: Architecture and Code Quality (5 items)

**[5.1] Supabase Type Stubs -- VERIFIED COMPLETE**

The `src/types/supabase.ts` file already contains proper type definitions for all referenced tables: `exercise_interactions` (line 464+), `user_exercise_preferences`, `profiles` (line 233), `circles` (line 192), `circle_members` (line 153), `circle_activities` (line 41), `circle_challenges` (line 83), `challenge_participants` (line 422), `activity_reactions` (line 293), `activity_comments` (line 332), `circle_posts` (line 374), and `plans` (line 266).

Status: No action needed. These types are already comprehensive.

**[5.2] Offline Workout Logging** -- HIGH / Effort: M

File: `src/lib/offlineSupport.ts`

The `OfflineQueue` class exists (lines 98-124) and is exported as `offlineQueue` (line 126), but it is **never imported anywhere** in the codebase.

Integration plan:
1. In `src/stores/planStore.ts`, inside `completeWorkout` (lines 418-436): Check `!navigator.onLine`. If offline, call `offlineQueue.add({ operation: 'save', data: workoutLog })`.
2. In `src/App.tsx`: Add `useEffect` that listens for `window.addEventListener('online')` and calls `offlineQueue.getQueue()` to flush pending operations.
3. In `src/components/Header.tsx`: The `useNetworkStatus` hook is already called in `App.tsx` (line 225) and shows toast notifications. Optionally add a visual wifi-off icon in the header when `!navigator.onLine`.

**[5.3] Performance: Exercise Library Lazy Loading** -- LOW / Effort: S

`src/data/exerciseLibrary.json` is imported statically. Convert to dynamic `import()` for code splitting, especially as the library grows beyond 200+ exercises.

**[5.4] Testing Gaps** -- LOW / Effort: L

Existing tests (verified):
- `src/components/exercises/__tests__/ExerciseCard.test.tsx`
- `src/components/exercises/__tests__/ExerciseDetailModal.test.tsx`
- `src/components/exercises/__tests__/ExercisesBrowser.test.tsx`
- `src/lib/__tests__/planGenerator.test.ts`
- `src/lib/__tests__/planValidation.test.ts`
- `src/lib/__tests__/suggestExercises.test.ts`
- `src/lib/__tests__/clickFeedback.test.ts`
- `src/lib/pdfExport.test.ts`
- `src/test/exercises.test.ts`
- `src/test/onboardingStore.test.ts`
- `src/features/mcl/hooks/useMuscleSelection.test.ts`

Missing coverage:
- Workout logging flow (start -> log sets -> complete -> summary)
- Progression engine edge cases
- Nutrition store operations
- Circle store operations

**[5.5] Accessibility Audit Checklist** -- MEDIUM / Effort: M

- SetLogger RIR color indicators (lines 70-84): `text-red-500`, `text-orange-500`, `text-yellow-500`, `text-green-500` -- need text alternatives for colorblind users. The `getRIRLabel()` at line 77 provides text but isn't always visible.
- Nutrition meal delete button (line 218): `opacity-0` is invisible to screen readers and keyboard users.
- Modal focus trapping audit across: `ExerciseSwapModal`, `AuthModal`, `CreateCircleModal`, `BadgeUnlockModal`.
- Skip-to-content link in `Header.tsx`.
- Keyboard navigation through wizard steps.

---

### Section 6: Growth and Monetization (3 items)

**[6.1] PWA Manifest** -- HIGH / Effort: S

Icons exist: `public/favicon.png`, `public/apple-touch-icon.png`.
Missing: `public/manifest.json` for "Add to Home Screen" on mobile browsers.

**[6.2] Shareable Workout Cards** -- Covered in 3.3, expanded with branded FitWizard logo overlay.

**[6.3] Coach Portal Expansion** -- LOW / Effort: XL

`src/stores/trainerStore.ts`, `src/components/TrainerGuard.tsx`, and `src/pages/Clients.tsx` exist but are minimal. Expand with plan assignment, client progress dashboards, and template sharing.

---

### Phase Timeline

**Phase 1 -- Quick Wins (Week 1):**
Items 1.1, 1.2, 1.3, 1.5, 1.6, 2.1, 3.1, 3.2, 3.3, 5.2

**Phase 2 -- Core Features (Weeks 2-3):**
Items 2.2, 2.3, 2.5, 2.6, 3.4, 3.6, 3.7, 6.1

**Phase 3 -- Domain Intelligence (Weeks 3-4):**
Items 4.1, 4.2, 4.3, 4.4, 4.5, 2.4

**Phase 4 -- Growth and Stability (Ongoing):**
Items 5.3, 5.4, 5.5, 6.2, 6.3, 2.7, 3.8-3.10

---

### Closing

The document will close with:

> *"Amateurs sit and wait for inspiration, the rest of us just get up and go to work."*

---

## Technical Details

- **File created**: `AUDIT_AND_IDEAS.md` in the project root
- **Format**: Markdown with consistent heading structure, fenced code blocks with file paths and verified line references, tables for quick reference
- **Estimated length**: ~2,500 lines covering 50+ items
- **Audience**: Human developers and AI coding agents (Claude, Copilot, etc.)
- **All line numbers verified**: Against the current codebase as of this session
- **Correction from earlier drafts**: Item 5.1 (Supabase type stubs) was previously listed as needed work, but the types already exist in `src/types/supabase.ts` -- this has been updated to reflect the actual state

