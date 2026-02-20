# 🛡️ FitWizard Audit & Implementation Roadmap

> **Status:** Living Document — Last verified: 2026-02-20  
> **Goal:** Transition from "Prototype" to "Production-Grade Product"  
> **Philosophy:** Fix the foundation before adding more decoration.  
> **Audience:** Human developers and AI coding agents (Claude, Copilot, etc.)

---

## Table of Contents

- [Quick Wins Summary](#-quick-wins-summary)
- [Section 1: UI/UX Polish (13 items)](#section-1-uiux-polish-13-items)
- [Section 2: New Features](#section-2-new-features-7-items)
- [Section 3: Sub-Feature Enhancements](#section-3-sub-feature-enhancements-10-items)
- [Section 4: Fitness Domain Intelligence](#section-4-fitness-domain-intelligence-5-items)
- [Section 5: Architecture & Code Quality](#section-5-architecture--code-quality-5-items)
- [Section 6: Growth & Monetization](#section-6-growth--monetization-3-items)
- [Phase Timeline](#phase-timeline)

---

## 🏁 Quick Wins Summary

High impact, low effort. Start here.

| # | ID  | Title                          | Priority | Effort | Impact                                        |
|---|-----|--------------------------------|----------|--------|-----------------------------------------------|
| 1 | 1.1 | ✅ Nutrition Page Light Mode Fix  | CRITICAL | S      | Fixes invisible text for ~50% of users        |
| 2 | 1.2 | ✅ SetLogger Touch Targets        | HIGH     | S      | Prevents misclicks during workouts            |
| 3 | 3.1 | ✅ "Last Time" History Data       | HIGH     | M      | Enables progressive overload tracking         |
| 4 | 2.1 | ✅ Rest Timer Between Sets        | HIGH     | M      | #1 most-requested fitness app feature         |
| 5 | 3.2 | ✅ Difficulty Rating Picker       | MEDIUM   | S      | Replaces hardcoded RPE value                  |
| 6 | 3.3 | ✅ Share Workout Card             | MEDIUM   | M      | Social growth via image sharing               |
| 7 | 1.3 | ✅ Nutrition Tabs Mobile Overflow | MEDIUM   | S      | Fixes broken layout on iPhone SE              |
| 8 | 5.2 | ✅ Offline Queue Wiring           | HIGH     | M      | Prevents data loss in gym basements           |
| 9 | 1.5 | ✅ Confetti on PR Detection       | MEDIUM   | S      | Emotional reward, hook already built          |
| 10 | 1.6 | ✅ Meal Delete Button             | MEDIUM   | S      | Makes delete accessible on mobile             |
| 11 | 1.8 | ✅ Nutrition Skeleton             | LOW      | S      | Prevents layout shift on load                 |
| 12 | 1.9 | ✅ Quick Win Refinements          | MEDIUM   | S      | Haptics, Sound, Animations                    |
| 13 | 6.1 | ✅ PWA Manifest                   | HIGH     | S      | "Add to Home Screen" capability               |
| 14 | 2.2 | ✅ Workout History Page           | MEDIUM   | L      | View past workouts & consistency              |
| 15 | 1.9 | ✅ FoodLogger Favorites Scroll    | LOW      | S      | Visual cue for horizontal scrolling           |
| 16 | 1.12| ✅ NutritionInsights Bar Color    | LOW      | S      | Fixes invisible score bar in light mode       |
| 17 | 1.13| ✅ Header & Navigation Restore    | HIGH     | S      | Restores core nav features (Theme/Trainer)    |


---

## Section 1: UI/UX Polish (12 items)

These items fix immediate visual bugs and usability issues found in the current codebase.

---

### [1.1] Nutrition Page Light Mode Breakage ✅

- **Priority:** CRITICAL
- **Effort:** S (1-2h)
- **Impact:** Fixes invisible text and broken UI for all light-mode users (~50% of mobile users default to light mode)
- **Files:** `src/pages/Nutrition.tsx`, `src/components/nutrition/HydrationTracker.tsx`, `src/components/nutrition/FoodLogger.tsx`, `src/components/nutrition/NutritionInsights.tsx`, `src/components/ui/ProgressRing.tsx`
- **Dependencies:** None

The app was designed dark-mode-first. Hardcoded `white` and `black` color patterns make entire sections invisible in light mode. Every instance must be replaced with semantic design tokens.

#### File: `src/pages/Nutrition.tsx`

| Line | Current Code | Replacement |
|------|-------------|-------------|
| 59 | `hover:text-white` | `hover:text-foreground` |
| 62 | `from-white to-white/50` | `from-foreground to-foreground/50` |
| 71 | `bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 ... hover:text-white` | `bg-muted/50 border border-border hover:bg-muted hover:border-ring/20 ... hover:text-foreground` |
| 80 | `bg-white/5 rounded-xl p-1 border border-white/10` | `bg-muted/50 rounded-xl p-1 border border-border` |
| 81 | `hover:bg-white/10 ... hover:text-white` | `hover:bg-muted ... hover:text-foreground` |
| 88 | `hover:bg-white/10 ... hover:text-white` | `hover:bg-muted ... hover:text-foreground` |
| 100 | `hover:text-white` | `hover:text-foreground` |
| 131 | `bg-white/5` | `bg-muted/50` |
| 187 | `bg-white/5` | `bg-muted/50` |
| 191 | `text-white/80` | `text-foreground/80` |
| 198 | `bg-white/5 border border-white/5 hover:bg-white/10` | `bg-muted/50 border border-border/50 hover:bg-muted` |
| 200 | `text-white` | `text-foreground` |
| 241 | `bg-white/10` | `bg-muted/20` |

**Example — Line 71 (Edit Goals button):**

```tsx
// BEFORE (line 71):
className="inline-flex items-center gap-2 px-4 py-2 mt-3 text-sm font-medium rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-muted-foreground hover:text-white"

// AFTER:
className="inline-flex items-center gap-2 px-4 py-2 mt-3 text-sm font-medium rounded-xl bg-muted/50 border border-border hover:bg-muted hover:border-ring/20 transition-all text-muted-foreground hover:text-foreground"
```

**Example — Line 198 (Meal log row):**

```tsx
// BEFORE (line 198):
<div className="group flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all ..."

// AFTER:
<div className="group flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50 hover:bg-muted transition-all ..."
```

#### File: `src/components/nutrition/HydrationTracker.tsx`

| Line | Current Code | Replacement |
|------|-------------|-------------|
| 59 | `text-blue-100` | `text-blue-600 dark:text-blue-100` |
| 68 | `bg-black/20 backdrop-blur-sm` | `bg-muted/30 backdrop-blur-sm` |
| 82 | `text-white/80` | `text-foreground/80` |
| 91 | `bg-white/5` | `bg-muted/50` |
| 98 | `bg-white/5` | `bg-muted/50` |
| 105 | `bg-white/5` | `bg-muted/50` |

**Example — Line 59 (Current water amount):**

```tsx
// BEFORE (line 59):
<div className="text-3xl font-bold text-blue-100">{currentAmount} ...

// AFTER:
<div className="text-3xl font-bold text-blue-600 dark:text-blue-100">{currentAmount} ...
```

**Example — Line 68 (Circle background):**

```tsx
// BEFORE (line 68):
className="w-40 h-40 rounded-full border-4 flex items-center justify-center relative bg-black/20 backdrop-blur-sm ..."

// AFTER:
className="w-40 h-40 rounded-full border-4 flex items-center justify-center relative bg-muted/30 backdrop-blur-sm ..."
```

#### File: `src/components/nutrition/FoodLogger.tsx`

| Line | Current Code | Replacement |
|------|-------------|-------------|
| 98 | `hover:bg-white/10` | `hover:bg-muted` |
| 108 | `border-dashed border-white/20` | `border-dashed border-border` |
| 120 | `bg-white/5 ... border border-white/5` | `bg-muted/50 ... border border-border/50` |
| 134 | `bg-black/20` | `bg-muted/30` |
| 139 | `"text-muted-foreground hover:text-white"` | `"text-muted-foreground hover:text-foreground"` |
| 163 | `bg-black/20 border border-white/10` | `bg-muted/30 border border-border` |
| 170 | `hover:bg-white/5 ... hover:border-white/10` | `hover:bg-muted/50 ... hover:border-border` |
| 176 | `text-white` | `text-foreground` |
| 214 | `bg-white/5 border border-white/5` | `bg-muted/50 border border-border/50` |
| 241 | `bg-black/20 border border-white/10` | `bg-muted/30 border border-border` |
| 252 | `bg-black/20 border border-white/10` | `bg-muted/30 border border-border` |
| 262 | `bg-black/20 border border-white/10` | `bg-muted/30 border border-border` |
| 272 | `bg-black/20 border border-white/10` | `bg-muted/30 border border-border` |
| 282 | `bg-black/20 border border-white/10` | `bg-muted/30 border border-border` |
| 296 | `border-white/10` | `border-border` |
| 304 | `hover:bg-white/5` | `hover:bg-muted/50` |

**Example — Line 134 (Logging tabs container):**

```tsx
// BEFORE (line 134):
<div className="flex p-1 bg-black/20 rounded-xl mb-4">

// AFTER:
<div className="flex p-1 bg-muted/30 rounded-xl mb-4">
```

**Example — Line 241 (Custom food name input):**

```tsx
// BEFORE (line 241):
className="w-full bg-black/20 border border-white/10 rounded-xl p-3 outline-none focus:ring-2 ring-primary/50"
// AFTER:
className="w-full bg-muted/30 border border-border rounded-xl p-3 outline-none focus:ring-2 ring-primary/50"
```

#### File: `src/components/nutrition/NutritionInsights.tsx`

| Line | Current Code | Replacement |
|------|-------------|-------------|
| 94 | `'rgba(255,255,255,0.08)'` (JS color) | `'hsl(var(--muted))'` or `'rgba(128,128,128,0.08)'` |
| 241 | `bg-white/5 h-3 rounded-full` | `bg-muted/10 h-3 rounded-full` |
| 251 | `bg-white/5 h-3 rounded-full` | `bg-muted/10 h-3 rounded-full` |
| 298 | `color: 'bg-white'` (Calories bar) | `color: 'bg-foreground'` |
| 313 | `bg-white/5 h-2 rounded-full` | `bg-muted/10 h-2 rounded-full` |

> **Note:** Lines 99, 221, 276, 334 use the `glass-card` CSS class. Audit this class in `src/index.css` to ensure it uses semantic tokens.

#### File: `src/components/ui/ProgressRing.tsx`

| Line | Current Code | Replacement |
|------|-------------|-------------|
| 39 | `className="text-white/5"` | `className="text-muted/20"` |
| 65 | `group-hover:text-white` | `group-hover:text-foreground` |
| 66 | `text-white/30 group-hover:text-white/50` | `text-muted-foreground/50 group-hover:text-muted-foreground` |

**Example — Line 39 (Background ring):**

```tsx
// BEFORE (line 39):
className="text-white/5"

// AFTER:
className="text-muted/20"
```

**Why:** This component is used on the Nutrition dashboard to show calorie/macro progress rings. With `text-white/5`, the background ring is invisible in light mode, making it look like a floating number with no context.

---

### [1.2] SetLogger Touch Targets ✅

- **Priority:** HIGH
- **Effort:** S (1-2h)
- **Impact:** Prevents misclicks during workouts — users are often sweaty and distracted
- **Files:** `src/components/logging/SetLogger.tsx`
- **Dependencies:** None

All four increment/decrement buttons are `h-8 w-8` (32px). Apple HIG and WCAG 2.5.5 both require 44px minimum touch targets.

**Affected Lines:** 129, 145, 163, 186

```tsx
// BEFORE (lines 129, 145, 163, 186):
className="h-8 w-8"

// AFTER:
className="h-8 w-8 min-h-[44px] min-w-[44px]"
```

**Why (CPT rationale):** During a working set, grip fatigue and sweat reduce fine motor control. A 32px button requires precision that a fatigued lifter doesn't have. The 44px minimum is a usability floor, not a ceiling.

---

### [1.3] Nutrition Tabs Mobile Overflow ✅

- **Priority:** MEDIUM
- **Effort:** S (1h)
- **Impact:** Fixes broken layout on iPhone SE (375px) and smaller devices
- **Files:** `src/pages/Nutrition.tsx`, lines 111-119
- **Dependencies:** None

The three tab labels "Dashboard", "Insights", "Learn" overflow on screens < 375px.

```tsx
// BEFORE (line 112):
<TabsTrigger value="dashboard" className="py-3 rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
    <LayoutDashboard className="w-4 h-4" /> Dashboard
</TabsTrigger>

// AFTER:
<TabsTrigger value="dashboard" className="py-3 rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
    <LayoutDashboard className="w-4 h-4" />
    <span className="hidden sm:inline">Dashboard</span>
</TabsTrigger>
```

Apply the same `<span className="hidden sm:inline">` pattern to:
- Line 115: "Insights"
- Line 118: "Learn"

On screens < 640px, only icons show. Labels appear at the `sm:` breakpoint and above.

---

### [1.4] WorkoutLogger Header Mobile Collision ✅

- **Priority:** MEDIUM
- **Effort:** S (1h)
- **Impact:** Prevents UI elements from overlapping on 320px screens
- **Files:** `src/components/logging/WorkoutLogger.tsx`, lines 149-167
- **Dependencies:** None

The Cancel button, timer display, and exercise count badge share one flex row. On 320px screens (iPhone SE 1st gen), these elements collide.

```tsx
// BEFORE (line 149):
<div className="flex items-center justify-between">
    <Button variant="ghost" size="sm" onClick={() => setShowCancelDialog(true)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t('workout.cancel')}
    </Button>
    <div className="flex items-center gap-2 text-lg font-mono">
        <Timer className="h-5 w-5 text-primary" />
        <span className="font-semibold">{formattedTime}</span>
    </div>
    <Badge variant="outline" className="font-semibold">
        {completedExercises}/{totalExercises}
    </Badge>
</div>

// AFTER:
<div className="flex items-center justify-between gap-2">
    <Button variant="ghost" size="sm" onClick={() => setShowCancelDialog(true)} className="shrink-0">
        <ArrowLeft className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">{t('workout.cancel')}</span>
    </Button>
    <div className="flex items-center gap-2 text-base sm:text-lg font-mono">
        <Timer className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        <span className="font-semibold">{formattedTime}</span>
    </div>
    <Badge variant="outline" className="font-semibold shrink-0">
        {completedExercises}/{totalExercises}
    </Badge>
</div>
```

On mobile: hide the "Cancel" text (arrow icon only), reduce timer font size.

---

### [1.5] Confetti on PR Detection ✅

- **Priority:** MEDIUM
- **Effort:** S (30min)
- **Impact:** Emotional reward when users hit a personal record — the hook is already built
- **Files:** `src/components/logging/WorkoutSummary.tsx`
- **Dependencies:** None

**Current state:** Line 256 has `{/* Confetti animation placeholder */}` followed by a CSS keyframe for `bounce-slow`. The actual confetti is never fired.

The `useConfetti` hook exists at `src/hooks/useConfetti.ts` and exports a `fire` method (line 102/141).

**Implementation:**

```tsx
// Add import at top of WorkoutSummary.tsx:
import { useConfetti } from '@/hooks/useConfetti';
import { useEffect } from 'react';

// Add inside WorkoutSummary component (after line 29, after workoutPRs calculation):
const { fire: fireConfetti } = useConfetti();

useEffect(() => {
    if (workoutPRs.length > 0) {
        // Small delay so the user sees the summary before confetti
        const timer = setTimeout(() => fireConfetti(), 500);
        return () => clearTimeout(timer);
    }
}, []); // Fire once on mount
```

After wiring confetti, the CSS keyframe block at lines 257-265 (`animate-bounce-slow`) can remain for the Trophy icon animation — it's separate from confetti.

---

### [1.6] Meal Delete Button Touch Accessibility ✅

- **Priority:** MEDIUM
- **Effort:** S (15min)
- **Impact:** Makes the delete button visible on mobile (currently requires hover, which doesn't exist on touch)
- **Files:** `src/pages/Nutrition.tsx`, line 218
- **Dependencies:** None

```tsx
// BEFORE (line 218):
className="p-2 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"

// AFTER:
className="p-2 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
```

**Why:** Touch devices have no hover state. With `opacity-0`, the delete button is permanently invisible on phones. The fix shows it always on mobile, while preserving the hover-reveal effect on desktop.

---

### [1.7] HydrationTracker Circle Light Mode ✅

- **Priority:** LOW
- **Effort:** S (15min)
- **Impact:** Removes dark smudge on the hydration circle in light mode
- **Files:** `src/components/nutrition/HydrationTracker.tsx`, line 68
- **Dependencies:** None

```tsx
// BEFORE (line 68):
className="... bg-black/20 backdrop-blur-sm ..."

// AFTER:
className="... bg-muted/30 backdrop-blur-sm ..."
```

---

### [1.8] Skeleton Loading for Nutrition Dashboard ✅

- **Priority:** LOW
- **Effort:** S (1h)
- **Impact:** Prevents layout shift and blank states while nutrition data loads
- **Files:** Create `src/components/nutrition/NutritionSkeleton.tsx`
- **Dependencies:** None

The Plan page has `PlanSkeleton.tsx` but the Nutrition page has no loading skeleton. Create a `NutritionSkeleton.tsx` using the same shimmer pattern from `src/components/plan/PlanSkeleton.tsx`.

---

### [1.9] FoodLogger Favorites Scroll Indicator ✅

- **Priority:** LOW
- **Effort:** S (30min)
- **Impact:** Visual affordance that the favorites list is scrollable
- **Files:** `src/components/nutrition/FoodLogger.tsx`, line 118
- **Dependencies:** None

The favorites horizontal scroll uses `scrollbar-hide` but has no visual indicator that more items exist off-screen.

```tsx
// Add gradient fade edges to the scroll container:
// BEFORE (line 118):
<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">

// AFTER:
<div className="relative">
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
        {/* ...favorites... */}
    </div>
    {favorites.length > 2 && (
        <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
    )}
</div>
```

**Completed Actions:**
- Implemented the gradient fade in `FoodLogger.tsx`.

---

### [1.10] Empty State Illustrations

- **Priority:** LOW
- **Effort:** M (3h)
- **Impact:** Polishes the empty states from plain icons to illustrated SVGs
- **Files:** Multiple pages
- **Dependencies:** None

Currently, empty states use a simple icon + text pattern. Replace with richer illustrated SVGs:

| File | Line | Current Icon | Suggested Upgrade |
|------|------|-------------|-------------------|
| `src/components/logging/WorkoutLogger.tsx` | 78 | `<Dumbbell>` | Illustrated dumbbell with motion lines |
| `src/pages/Nutrition.tsx` | 187-188 | `<UtensilsCrossed>` | Illustrated plate with utensils |
| `src/components/nutrition/FoodLogger.tsx` | 209 | `<Heart>` | Illustrated star/bookmark |
| `src/pages/Plan.tsx` | 66-67 | `<Wand2>` | Illustrated wizard wand with sparkles |

---

### [1.9] Quick Win Refinements ✅

- **Priority:** MEDIUM
- **Effort:** S (1h)
- **Impact:** Adds polish and improved feedback (Haptics, Sound, Animations)
- **Files:** `src/hooks/useHaptics.ts`, `src/components/logging/RestTimer.tsx`, `src/pages/Nutrition.tsx`, `src/components/ui/ProgressRing.tsx`
- **Dependencies:** `@capacitor/haptics`

**Completed Actions:**
- **Haptics:** Added subtle vibration on Rest Timer completion and Meal Delete actions.
- **Sound:** Added a "ding" oscillator sound to the Rest Timer.
- **Animations:** Nutrition progress rings now smoothly fill up on load.
- **WorkoutLogger:** Added slide animations and tactile haptic feedback to navigation buttons.

---

### [6.1] PWA Manifest ✅

- **Priority:** HIGH
- **Effort:** S (1h)
- **Impact:** Enables "Add to Home Screen" functionality for native app feel.
- **Files:** `public/manifest.json`, `index.html`
- **Dependencies:** None

**Completed Actions:**
- Created `manifest.json` with app identity, icons, and theme colors.
- Linked manifest in `index.html`.
- Added meta viewport tag for mobile optimization.

---

---

### [1.11] Glass Card Light Mode Audit ✅

- **Priority:** LOW
- **Effort:** S (1h)
- **Impact:** Ensures the `glass-card` CSS class works correctly in light mode
- **Files:** `src/index.css` (audit only), multiple component files
- **Dependencies:** None

The `glass-card` class is used extensively in `NutritionInsights.tsx` (lines 99, 221, 276, 334), `HydrationTracker.tsx` (line 35), `FoodLogger.tsx` (line 94), and `Nutrition.tsx` (lines 128, 180, 234). Verified that the CSS definition in `index.css` uses semantic tokens.

---

### [1.12] NutritionInsights Score Bar Color ✅

- **Priority:** LOW
- **Effort:** S (15min)
- **Impact:** Fixes the "Calories" score bar being invisible in light mode
- **Files:** `src/components/nutrition/NutritionInsights.tsx`, line 298
- **Dependencies:** Item 1.1

```tsx
// BEFORE (line 298):
<ScoreBreakdownRow label="Calories" value={score.breakdown.calorieAdherence} max={40} color="bg-white" />

// AFTER:
<ScoreBreakdownRow label="Calories" value={score.breakdown.calorieAdherence} max={40} color="bg-foreground" />
```

**Status:** Verified. Line 298 already uses `bg-foreground`. This was likely fixed as part of Item 1.1 (Nutrition Page Light Mode Fix).

// AFTER:
<ScoreBreakdownRow label="Calories" value={score.breakdown.calorieAdherence} max={40} color="bg-foreground" />
```

**Why:** `bg-white` makes the bar invisible on a white background. `bg-foreground` adapts to both themes.

**Completed Actions:**
- Updated `NutritionInsights.tsx` to use `color="bg-foreground"` for the calorie bar.

---

### [1.13] Header & Navigation Restore ✅

- **Priority:** HIGH
- **Effort:** S (1h)
- **Impact:** Restores missing core navigation features and fixes conditional visibility logic.
- **Files:** `src/components/Header.tsx`
- **Dependencies:** None

**Completed Actions:**
- **Restored Theme Toggle:** Added Sun/Moon icon toggle to the desktop header and mobile menu.
- **Fixed Clients Tab:** Made the "Clients" tab visibility conditional on Trainer Mode (hidden for regular users).
- **Added Trainer Mode Toggle:** Added the Trainer Mode toggle to both the mobile menu and the desktop user profile dropdown for easy access.

---

## Section 2: New Features (7 items)

New pages, components, and capabilities to add.

---

### [2.1] Rest Timer Between Sets ✅

- **Priority:** HIGH
- **Effort:** M (3-5h)
- **Impact:** The #1 most-requested feature in fitness apps — keeps users engaged in the app between sets instead of switching to Instagram
- **Files:**
  - Create: `src/components/logging/RestTimer.tsx`
  - Modify: `src/components/logging/WorkoutLogger.tsx`
  - Modify: `src/stores/planStore.ts` (optional: add `restTimerEndTime` to `ActiveWorkout`)
- **Dependencies:** None

**Completed Actions:**
- Created `RestTimer.tsx` with haptic feedback and sound.
- Integrated into `WorkoutLogger.tsx` to appear automatically after sets.
- Added skipping and duration adjustment controls.

**Context:** The `prescription.restSeconds` field is already displayed at `WorkoutLogger.tsx` line 203 (`{prescription.restSeconds}s rest`) but is never used functionally.

**Component Blueprint — `src/components/logging/RestTimer.tsx`:**

```tsx
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useHaptics } from '@/hooks/useHaptics';
import { SkipForward, Play, Pause } from 'lucide-react';

interface RestTimerProps {
    durationSeconds: number;
    onComplete: () => void;
    onSkip: () => void;
}

export function RestTimer({ durationSeconds, onComplete, onSkip }: RestTimerProps) {
    const [remaining, setRemaining] = useState(durationSeconds);
    const [isPaused, setIsPaused] = useState(false);
    const { success: hapticSuccess } = useHaptics();

    useEffect(() => {
        if (isPaused || remaining <= 0) return;

        const interval = setInterval(() => {
            setRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    hapticSuccess(); // Vibrate on completion
                    onComplete();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isPaused, remaining, onComplete, hapticSuccess]);

    const progress = ((durationSeconds - remaining) / durationSeconds) * 100;

    return (
        <div className="flex flex-col items-center py-6 px-4 rounded-xl bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-top-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Rest Timer</span>

            <ProgressRing
                label=""
                current={durationSeconds - remaining}
                target={durationSeconds}
                color="text-primary"
                size="lg"
            />

            <div className="text-3xl font-mono font-bold mt-2 tabular-nums">
                {Math.floor(remaining / 60)}:{(remaining % 60).toString().padStart(2, '0')}
            </div>

            <div className="flex gap-3 mt-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPaused(!isPaused)}
                >
                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSkip}
                    className="text-muted-foreground"
                >
                    <SkipForward className="h-4 w-4 mr-1" />
                    Skip Rest
                </Button>
            </div>
        </div>
    );
}
```

**Integration in `WorkoutLogger.tsx`:**

Insert after the `SetLogger` map (after line 232), inside the `CardContent`:

```tsx
// After the SetLogger map, before </CardContent>:
{!currentExercise.skipped && (() => {
    const lastCompletedIdx = currentExercise.sets.findLastIndex(s => s.completed);
    const hasNextSet = lastCompletedIdx >= 0 && lastCompletedIdx < currentExercise.sets.length - 1;
    const nextSetNotDone = hasNextSet && !currentExercise.sets[lastCompletedIdx + 1].completed;

    return hasNextSet && nextSetNotDone ? (
        <RestTimer
            durationSeconds={prescription.restSeconds}
            onComplete={() => { /* auto-focus next set */ }}
            onSkip={() => { /* dismiss timer */ }}
        />
    ) : null;
})()}
```

**Optional Store Change — `src/stores/planStore.ts` line 54:**

```typescript
interface ActiveWorkout {
    // ... existing fields ...
    restTimerEndTime: number | null; // NEW: Timestamp when rest timer expires
}
```

This allows persisting the timer across re-renders if the user navigates away and back.

---

### [2.2] Workout History Page ✅

- **Priority:** MEDIUM
- **Effort:** L (1-2 days)
- **Impact:** Users can review past workouts, track consistency, and see progress over time
- **Files:**
  - Create: `src/pages/History.tsx`
  - Create: `src/components/history/WorkoutHistoryCard.tsx`
  - Create: `src/components/history/CalendarHeatmap.tsx` (optional)
  - Modify: `src/App.tsx` (add route after line 165)
  - Modify: `src/components/Header.tsx` (add nav item to `navItems` array, line 46-67)
- **Dependencies:** None

**Completed Actions:**
- Implemented `HistoryPage` fetching data from `usePlanStore.workoutLogs`.
- Created `WorkoutHistoryCard` for itemized workout display.
- Added `/history` route and navigation link.
- **Note:** `CalendarHeatmap` was marked optional and omitted for the initial release to focus on the list view.

---

### [2.3] Profile / Settings Page ✅

- **Priority:** MEDIUM
- **Effort:** M (4-6h)
- **Impact:** Consolidates scattered settings into one discoverable location
- **Files:**
  - Create: `src/pages/Profile.tsx`
  - Modify: `src/App.tsx` (add route)
  - Modify: `src/components/Header.tsx` (add nav item or profile icon)
- **Dependencies:** None

**Completed Actions:**
- Created `Profile.tsx` with sections for Theme, Language, Units, Trainer Mode, and Data Export.
- Updated `Header.tsx` to link to Profile and removed inline settings.
- Added `/profile` route.

**Currently scattered across:**

| Setting | Current Location | Store |
|---------|-----------------|-------|
| Weight unit | Header (hidden) | `planStore.preferredWeightUnit` (line 78) |
| Theme | Header dropdown (lines 195-230) | `themeStore` |
| Language | Header `LanguageSelector` (line 233) | `i18next` |
| Trainer mode | Header toggle (lines 236-261) | `trainerStore` |
| Display name | Onboarding only | `achievementStore.userName` |

**Sections for Profile page:**
1. Personal Info (display name, avatar)
2. Preferences (weight unit, theme, language, click sounds, haptics)
3. Account (sign out, data export as JSON, delete account)
4. Privacy (link to `/legal`)

---

### [2.4] Body Measurements Tracker ✅

- **Priority:** LOW
- **Effort:** L (1-2 days)
- **Impact:** Allows users to track body composition changes over time
- **Files:**
  - Create: `src/stores/measurementsStore.ts`
  - Create: `src/components/measurements/BodyTracker.tsx`
  - Modify: `src/types/fitness.ts` (add `BodyMeasurement` interface)
- **Dependencies:** Item 2.3 (Profile page to host the component)

**Completed Actions:**
- Created `measurementsStore.ts` with local persistence.
- Implemented `BodyTracker.tsx` with Recharts visualization.
- Integrated into `Profile.tsx`.

**New Type:**

```typescript
export interface BodyMeasurement {
    id: string;
    date: string; // ISO date
    weight?: number;
    bodyFat?: number;
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    thighs?: number;
    unit: 'imperial' | 'metric';
}
```

Uses Recharts (already installed) for line charts showing trends over time.

---

### [2.5] Superset Visual & Logical Pairing ✅

- **Priority:** LOW
- **Effort:** M (4-6h)
- **Impact:** Critical flow improvement for circuit/superset training
- **Refinement:**
    1. **Visual:** Group exercises with brackets/color bands in `WorkoutDayCard`.
    2. **Logical:** Auto-advance navigation. If Ex A and B are paired:
       - Complete A.1 -> Auto-focus B.1
       - Complete B.1 -> Auto-switch back to A.2
       - (Support "Jump to next set" override)

**Completed Actions:**
- **Visual:** Updated `WorkoutDayCard.tsx` to group superset exercises with a distinct border and label.
- **Logical:** Updated `WorkoutLogger.tsx` to automatically navigate to the next exercise in the superset upon set completion.

---

### [2.6] Smart Warm-Up Generation ✅

- **Priority:** LOW
- **Effort:** M (4-6h)
- **Impact:** Reduces injury risk; auto-calculates warm-up sets
- **Refinement:**
    - Don't just list "Push-ups".
    - **Auto-calculate ramp-up sets:**
      - Set 1: 50% working weight x 10
      - Set 2: 70% working weight x 5
      - Set 3: 90% working weight x 2
    - Insert these rows dynamically into `WorkoutLogger`.

**Completed Actions:**
- Implemented `WarmUpSets.tsx` with percentage-based logic (50/70/90%).
- Integrated into `WorkoutLogger.tsx`, using the **Max Weight** from previous workout history as the baseline.

---

### [2.7] Exercise Demo Media ✅
- **Priority:** LOW
- **Effort:** L (1-2 days)
- **Impact:** Correct form education
- **Refinement:**
    - Add `videoUrl` support to `ExerciseDetailModal`.
    - **Fallback:** If no video, auto-generate a "Muscle Highlight" SVG using the `MCL` component data (highlighting primary/secondary muscles).

**Completed Actions:**
- Implemented `ExerciseMuscleHighlight` component.
- Integrated video player with muscle highlight fallback in `ExerciseDetailModal`.
- Added logic to map legacy muscle groups to MCL data.

---

## Section 3: Sub-Feature Enhancements (Refined)

### [3.4] Integrated Plate Calculator ✅

- **Priority:** LOW
- **Effort:** M (3-4h)
- **Impact:** Instant math assistance during logging
- **Refinement:**
    - **Not just a standalone tool.**
    - Add a small "Calculator" icon inside the `SetLogger` weight input.
    - Tapping it opens a drawer showing the exact plate loading for true/false inputs (45s, 35s, 25s, etc.).

**Completed Actions:** (Pulled forward to Phase 2)
- Created `PlateCalculator.tsx` with visual plate stack.
- Integrated into `SetLogger.tsx` with a calculator icon that appears for weights >= 45lbs.

---

### [3.5] RPE Toggle in SetLogger ✅

- **Priority:** LOW
- **Effort:** S (2h)
- **Impact:** Lets users log effort via either RIR or RPE while preserving progression compatibility
- **Files:** `src/components/logging/SetLogger.tsx`, `src/types/fitness.ts`
- **Dependencies:** None

**Completed Actions:**
- Added RIR/RPE effort mode toggle in `SetLogger.tsx`.
- Added derived RIR logic when logging with RPE to preserve existing progression logic.
- Extended `SetLog` in `src/types/fitness.ts` with optional `rpe` and `effortMode`.

---

### [3.6] Smart Meal Shortcuts (Quick Log) ⏳ TODO

- **Priority:** LOW
- **Effort:** M (4h)
- **Impact:** Drastically reduces friction (typing food names is slow)
- **Refinement:**
    1. **"Copy Previous Meal":** One-tap to clone "Yesterday's Breakfast".
    2. **"Saved Meals":** Group foods (Oats + Whey + Berries) into a "Morning Oats" template.

---

### [3.7] Energy Balance Trend (Calories vs Weight) ⏳ TODO

- **Priority:** LOW
- **Effort:** M (3-5h)
- **Impact:** The "Truth" chart — shows if you are actually in a surplus/deficit
- **Refinement:**
    - Dual-axis chart in `NutritionInsights`.
    - **Left Axis:** Calories (Bar)
    - **Right Axis:** Body Weight (Line)
    - **Insight:** "You are averaging 2800kcal and weight is +0.5lbs/week. Est TDEE: 2550kcal."

---

### [3.8] Exercise History in Detail Modal ✅

- **Priority:** LOW
- **Effort:** M (3h)
- **Impact:** Users can see their performance history for any exercise
- **Files:** `src/components/exercises/ExerciseDetailModal.tsx`
- **Dependencies:** None

Add a "History" section to the exercise detail modal showing: last performed date, best weight, best volume, and a mini chart of estimated 1RM over time. Pull data from `planStore.workoutLogs`.

**Completed Actions:**
- Implemented History tab in `ExerciseDetailModal.tsx`.
- Added empty state + populated state with last performed date, best weight, best volume, and mini e1RM chart from workout logs.

---

### [3.9] Custom Exercise Creation ✅

- **Priority:** LOW
- **Effort:** M (4h)
- **Impact:** Users can add exercises not in the library
- **Files:**
  - Modify: `src/components/exercises/ExercisesBrowser.tsx`
  - Create: `src/stores/customExerciseStore.ts`
- **Dependencies:** None

Add a form in the Exercise Browser to create user-defined exercises with name, primary muscles, equipment, and cues. Store in a new `customExercises` array.

**Completed Actions:**
- Created persisted `customExerciseStore` (`add/update/delete/list`) in `src/stores/customExerciseStore.ts`.
- Added custom exercise creation UI in `ExercisesBrowser.tsx`.
- Merged custom exercises into browser filtering/search flow.

---

### [3.10] Inline Estimated 1RM Display ✅

- **Priority:** LOW
- **Effort:** S (1h)
- **Impact:** Immediate feedback on strength level after each set
- **Files:** `src/components/logging/SetLogger.tsx`
- **Dependencies:** None

The `OneRepMaxCalculator` component exists at `src/components/tools/OneRepMaxCalculator.tsx`. Extract the Epley formula and show inline estimated 1RM in SetLogger after completing a set:

``` 
Estimated 1RM = weight × (1 + reps / 30)
```

Display as a small chip below the completed set: "Est. 1RM: 225 lbs"

**Completed Actions:**
- Added inline estimated 1RM chip after set completion in `SetLogger.tsx`.

---

## Section 4: Fitness Domain Intelligence (5 items)

Features that leverage exercise science to make FitWizard smarter.

---

### [4.1] Periodization Timeline Visualization ✅

- **Priority:** MEDIUM
- **Effort:** M (4-6h)
- **Impact:** Replaces a text-based badge list with a visual timeline that users can actually understand
- **Files:**
  - Create: `src/components/plan/PeriodizationTimeline.tsx`
  - Modify: `src/pages/Plan.tsx` (replace lines 159-187)
- **Dependencies:** None

**Current state:** `Plan.tsx` lines 159-187 render `rirProgression` as a row of `<Badge>` components. This is hard to parse.

**Proposed:** A horizontal bar divided into 4 segments (one per week), each colored by intensity:
- Normal weeks: Primary color, increasing intensity
- Deload week (`isDeload: true`): Lighter shade, "Recovery" label
- Current week (`planStore.currentWeek`): Pulsing border highlight
- Each segment shows the target RIR number

Uses `rirProgression` array from Plan type (`src/types/fitness.ts`, line 217 — `rirProgression: RIRProgression[]`).

**Completed Actions:**
- Added `src/components/plan/PeriodizationTimeline.tsx`.
- Replaced badge-row progression display in `src/pages/Plan.tsx` with timeline segments, deload labeling, and current-week highlighting.

---

### [4.2] Daily Readiness Score ✅

- **Priority:** LOW
- **Effort:** M (4-6h)
- **Impact:** Adjusts workout intensity based on how the user feels — a key feature in modern periodization
- **Files:**
  - Create: `src/components/logging/ReadinessCheck.tsx`
  - Create: `src/types/readiness.ts`
  - Modify: `src/components/logging/WorkoutLogger.tsx`
- **Dependencies:** None

**New Type:**

```typescript
interface ReadinessEntry {
    date: string;
    sleepQuality: 1 | 2 | 3 | 4 | 5;
    muscleSoreness: 1 | 2 | 3 | 4 | 5;
    energyLevel: 1 | 2 | 3 | 4 | 5;
    stressLevel: 1 | 2 | 3 | 4 | 5;
    overallScore: number; // Computed average
}
```

**Integration:** In `WorkoutLogger.tsx`, show `ReadinessCheck` before `startWorkout` fires (line 68-71). A quick 4-question slider modal (takes <10 seconds). If overall score < 2.5, suggest: "Consider a lighter session today — reduce volume by 20%."

**Why (CPT rationale):** Auto-regulation is the gold standard in modern strength training. Training hard when under-recovered leads to injury and stagnation. A readiness check captures the data needed for intelligent auto-regulation.

**Completed Actions:**
- Added strict readiness type in `src/types/readiness.ts`.
- Refactored readiness persistence/computation in `src/stores/readinessStore.ts` using 1-5 inputs and computed `overallScore`.
- Added pre-workout readiness flow in `src/components/logging/ReadinessCheck.tsx`.
- Gated workout start in `src/components/logging/WorkoutLogger.tsx` (submit or skip required before `startWorkout`).
- Added low-readiness recommendation (`overallScore < 2.5`) and removed global readiness popup from app shell.

---

### [4.3] Progressive Overload Visualization (Strength Curve) ✅

- **Priority:** LOW
- **Effort:** L (1-2 days)
- **Impact:** Visual proof of progress — the strongest motivator for continued training
- **Files:**
  - Create: `src/components/charts/StrengthCurve.tsx`
- **Dependencies:** None

Line chart of estimated 1RM per exercise over time using Recharts (already installed). Highlight PRs as gold dots.

**Data sources:**
- `planStore.workoutLogs` — historical sets with weight × reps
- `planStore.personalRecords` — explicit PR entries

**Completed Actions:**
- Completed existing implementation in `src/components/analytics/StrengthCurve.tsx` (component path differs from original proposal).
- Removed hardcoded default selection and derived first available exercise dynamically.
- Added PR-point highlighting with gold dots while preserving e1RM line.

---

### [4.4] Volume Landmark Warnings (MRV Detection) ✅

- **Priority:** LOW
- **Effort:** M (4-6h)
- **Impact:** Prevents overtraining by warning when volume exceeds Maximum Recoverable Volume
- **Files:**
  - Modify: `src/lib/progressionEngine.ts`
  - Modify: `src/pages/Plan.tsx`
- **Dependencies:** None

**Context:** `weeklyVolume` on Plan tracks sets per muscle with `isWithinCap` (line 198-202 of `src/types/fitness.ts`).

After completing a week, compare actual logged volume per muscle group to known MRV thresholds (e.g., Chest MRV ≈ 22 sets/week for intermediates). If volume exceeds MRV, show an orange warning banner.

**MRV Reference Values (per Dr. Mike Israetel):**

| Muscle Group | MEV | MAV | MRV |
|-------------|-----|-----|-----|
| Chest | 8 | 12-18 | 22 |
| Back | 8 | 14-22 | 25 |
| Quads | 6 | 12-18 | 20 |
| Hamstrings | 4 | 10-16 | 20 |
| Delts | 6 | 16-22 | 26 |
| Biceps | 4 | 14-20 | 26 |
| Triceps | 4 | 10-14 | 18 |

**Completed Actions:**
- Added MRV landmark constants and evaluation helpers in `src/lib/progressionEngine.ts`.
- Added Plan-page MRV warning banner in `src/pages/Plan.tsx`.
- Updated analytics volume logic in `src/components/analytics/VolumeHealth.tsx` to use muscle-specific MRV thresholds instead of a fixed heuristic.

---

### [4.5] Training Split Auto-Recommendation ✅

- **Priority:** LOW
- **Effort:** M (4-6h)
- **Impact:** Suggests a better split if actual training frequency consistently differs from plan
- **Files:**
  - Modify: `src/lib/progressionEngine.ts`
- **Dependencies:** Item 2.2 (History page for data)

If the user planned 5 days/week but consistently trains 3 days/week (based on `workoutLogs`), suggest switching from PPL to Upper/Lower or Full Body. New function: `suggestSplitAdjustment()` in `progressionEngine.ts`.

**Completed Actions:**
- Added `suggestSplitAdjustment()` in `src/lib/progressionEngine.ts`.
- Surfaced recommendation banner in `src/pages/Plan.tsx` when adherence mismatch persists.

---

## Section 5: Architecture & Code Quality (5 items)

Technical improvements that don't change user-facing behavior but improve reliability.

---

### [5.1] Supabase Type Stubs — ✅ VERIFIED COMPLETE

- **Priority:** N/A
- **Status:** No action needed

The `src/types/supabase.ts` file already contains comprehensive type definitions for all referenced tables:
- `exercise_interactions` (line 464+)
- `user_exercise_preferences`
- `profiles` (line 233)
- `circles` (line 192)
- `circle_members` (line 153)
- `circle_activities` (line 41)
- `circle_challenges` (line 83)
- `challenge_participants` (line 422)
- `activity_reactions` (line 293)
- `activity_comments` (line 332)
- `circle_posts` (line 374)
- `plans` (line 266)

---

### [5.2] Offline Workout Logging ✅

- **Priority:** HIGH
- **Effort:** M (3-5h)
- **Impact:** Prevents data loss when users work out in gym basements with no signal
- **Files:**
  - Modify: `src/stores/planStore.ts`
  - Modify: `src/App.tsx`
  - Modify: `src/components/Header.tsx` (optional)
  - (Existing: `src/lib/offlineSupport.ts`)
- **Dependencies:** None

**Current state:** The `OfflineQueue` class exists in `src/lib/offlineSupport.ts` (lines 98-124) and is exported as `offlineQueue` (line 126), but it is **never imported anywhere** in the codebase.

**Step 1 — Wire into `planStore.ts`**

Inside `completeWorkout` (lines 369-438), after creating the `workoutLog` and before posting to circles:

```typescript
import { offlineQueue } from '@/lib/offlineSupport';

// Inside completeWorkout, after line 416 (set state), before line 418 (circle posting):
if (!navigator.onLine) {
    offlineQueue.add({
        operation: 'save',
        data: workoutLog,
    });
    toast.info('Workout saved locally. It will sync when you reconnect.');
    return workoutLog;
}
```

**Step 2 — Flush queue on reconnect in `App.tsx`**

```typescript
import { offlineQueue } from '@/lib/offlineSupport';

// Inside the App component (after line 247):
useEffect(() => {
    const handleOnline = async () => {
        const queue = offlineQueue.getQueue();
        if (queue.length > 0) {
            toast.info(`Syncing ${queue.length} offline workout(s)...`);
            for (const op of queue) {
                try {
                    // Process each queued operation
                    // (Post to circles, sync to backend, etc.)
                    offlineQueue.remove(op.id);
                } catch (err) {
                    console.error('Failed to sync queued operation:', err);
                }
            }
            toast.success('All workouts synced!');
        }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
}, []);
```

**Step 3 — Visual indicator in `Header.tsx` (optional)**

The `useNetworkStatus` hook is already called in `App.tsx` (line 225) and shows toast notifications. Optionally add a small wifi-off icon next to the logo when `!navigator.onLine`.

---

### [5.3] Performance: Exercise Library Lazy Loading ✅ PARTIAL

- **Priority:** LOW
- **Effort:** S (1h)
- **Impact:** Reduces initial bundle size as the exercise library grows
- **Files:** Files that import `src/data/exerciseLibrary.json`
- **Dependencies:** None

`src/data/exerciseLibrary.json` is statically imported and bundled into the main chunk. Convert to dynamic `import()` for code splitting:

```typescript
// BEFORE:
import exerciseLibrary from '@/data/exerciseLibrary.json';

// AFTER:
const exerciseLibrary = await import('@/data/exerciseLibrary.json');
```

Or use React `lazy()` for the components that depend on it.

**Completed Actions (Stability Slice):**
- Added async exercise repository loader (`src/lib/exerciseRepository.ts`) with caching.
- Migrated exercise UI paths to lazy dataset loading:
  - `src/components/exercises/ExercisesBrowser.tsx`
  - `src/components/exercises/ExerciseOfTheDay.tsx`
  - `src/components/exercises/RelatedExercises.tsx`
  - `src/components/plan/ExerciseSwapModal.tsx`
- Plan-generation path was intentionally left unchanged this cycle.

---

### [5.4] Testing Gaps ✅ PARTIAL

- **Priority:** LOW
- **Effort:** L (1-2 weeks cumulative)
- **Impact:** Prevents regressions as the codebase grows
- **Files:** Various test files
- **Dependencies:** None

**Existing tests (verified):**

| Test File | Coverage |
|-----------|----------|
| `src/components/exercises/__tests__/ExerciseCard.test.tsx` | Exercise card rendering |
| `src/components/exercises/__tests__/ExerciseDetailModal.test.tsx` | Detail modal |
| `src/components/exercises/__tests__/ExercisesBrowser.test.tsx` | Browser component |
| `src/lib/__tests__/planGenerator.test.ts` | Plan generation logic |
| `src/lib/__tests__/planValidation.test.ts` | Plan validation |
| `src/lib/__tests__/suggestExercises.test.ts` | Exercise suggestions |
| `src/lib/__tests__/clickFeedback.test.ts` | Click feedback utility |
| `src/lib/pdfExport.test.ts` | PDF export |
| `src/test/exercises.test.ts` | Exercise data integrity |
| `src/test/onboardingStore.test.ts` | Onboarding store |
| `src/features/mcl/hooks/useMuscleSelection.test.ts` | Muscle selection hook |

**Missing coverage (prioritized):**

1. **Workout logging flow** — Start → log sets → complete → summary → PR detection
2. **Progression engine edge cases** — Empty logs, single-set exercises, deload weeks
3. **Nutrition store operations** — Add/remove meals, hydration updates, date navigation
4. **Circle store operations** — Create/join circles, post activities, reactions

**Completed Actions (Stability Slice):**
- Added `src/components/logging/__tests__/WorkoutLogger.test.tsx`.
- Added `src/lib/__tests__/progressionEngine.phase3.test.ts`.
- Added `src/stores/__tests__/nutritionStore.test.ts`.
- Added `src/stores/__tests__/circleStore.test.ts`.
- Repaired and updated exercise tests to keep the full suite green.

---

### [5.5] Accessibility Audit Checklist ✅ PARTIAL

- **Priority:** MEDIUM
- **Effort:** M (4-8h)
- **Impact:** Makes the app usable for all users, including those with disabilities
- **Files:** Multiple components
- **Dependencies:** None

**Identified issues:**

| Issue | File | Line(s) | Fix |
|-------|------|---------|-----|
| RIR color-only indicators | `SetLogger.tsx` | 70-84 | Add `aria-label` with `getRIRLabel()` text. Colors (`text-red-500`, `text-orange-500`, etc.) are the only differentiator — colorblind users can't distinguish them. The `getRIRLabel()` function exists (line 77) but its output isn't always visible. |
| Delete button invisible to keyboard | `Nutrition.tsx` | 218 | Fix with item 1.6 (opacity change). Also add `aria-label="Remove meal"`. |
| Modal focus trapping | Various | — | Audit focus trapping in: `ExerciseSwapModal`, `AuthModal`, `CreateCircleModal`, `BadgeUnlockModal`. Radix Dialog handles this by default, but verify custom implementations. |
| Skip-to-content link | `Header.tsx` | — | Add `<a href="#main-content" className="sr-only focus:not-sr-only">Skip to content</a>` before the nav. |
| Wizard keyboard navigation | `src/pages/Wizard.tsx` | — | Ensure wizard steps can be navigated with Tab/Enter/Space keys. |

**Completed Actions (Stability Slice):**
- Added valid skip-link target (`id="main-content"`) in `src/App.tsx`.
- Made meal delete action keyboard-visible and added ARIA labeling in `src/pages/Nutrition.tsx`.
- Ensured dialog naming/description coverage in exercise modal tests and components.

---

## Section 6: Growth & Monetization (3 items)

Features that drive user acquisition, retention, and revenue.

---

### [6.1] PWA Manifest ✅ DONE

- **Priority:** HIGH
- **Effort:** S (1-2h)
- **Impact:** Enables "Add to Home Screen" on iOS/Android — the app feels native
- **Files:**
  - Create: `public/manifest.json`
  - Modify: `index.html` (add manifest link)
- **Dependencies:** None

**Icons already exist:**
- `public/favicon.png`
- `public/apple-touch-icon.png`
- `public/logo.png`

**Create `public/manifest.json`:**

```json
{
    "name": "FitWizard",
    "short_name": "FitWizard",
    "description": "Your AI-powered workout companion",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#0a0a0a",
    "theme_color": "#8B5CF6",
    "icons": [
        {
            "src": "/favicon.png",
            "sizes": "192x192",
            "type": "image/png"
        },
        {
            "src": "/apple-touch-icon.png",
            "sizes": "512x512",
            "type": "image/png"
        }
    ]
}
```

**Add to `index.html` `<head>`:**

```html
<link rel="manifest" href="/manifest.json" />
```

---

### [6.2] Shareable Branded Workout Cards ✅

- **Priority:** LOW
- **Effort:** M (3-4h, extends item 3.3)
- **Impact:** Branded sharing drives organic user acquisition
- **Files:** `src/components/logging/WorkoutSummary.tsx`
- **Dependencies:** Item 3.3 (basic share functionality)

Extend the share card from item 3.3 with:
- FitWizard logo watermark in corner
- Branded color scheme matching the app's gradient
- Deep link URL back to app (e.g., "fitwizard.app/join")
- "Generated by FitWizard" footer text

**Completed Actions:**
- Implemented branded share-card image generation in `src/components/logging/WorkoutSummary.tsx`.
- Added watermark/footer/deep-link support via `VITE_SHARE_BASE_URL` with fallback `https://fitwizard.app/join`.
- Added native share + file share + clipboard fallback paths.

---

### [6.3] Coach Portal Expansion

- **Priority:** LOW
- **Effort:** XL (1+ weeks)
- **Impact:** Monetization opportunity — coaches pay for premium features
- **Files:**
  - Modify: `src/stores/trainerStore.ts`
  - Modify: `src/components/TrainerGuard.tsx`
  - Modify: `src/pages/Clients.tsx`
  - Create: Multiple new components
- **Dependencies:** Cloud/Supabase backend for multi-user data

**Existing infrastructure:**
- `trainerStore.ts` — basic trainer mode state
- `TrainerGuard.tsx` — route protection
- `Clients.tsx` — minimal client list page

**Expansion roadmap:**
1. ✅ Plan assignment to clients (Implemented via `AssignPlanDialog` & `ClientDetails`)
2. ✅ Client details & management (Implemented `ClientCard`, `AddClientDialog`)
3. ✅ Client progress dashboards (Implemented `ClientProgress` & `BodyTracker` charts)
4. ✅ Template marketplace (Implemented `TemplateLibrary` & `SaveTemplateDialog`)
5. ✅ Client communication (Implemented `ClientMessages` tab)
6. ✅ Revenue dashboard (Implemented `Revenue` placeholder & pro upgrade flow)

---

## 📅 Phase Timeline

### Phase 1 — Quick Wins (Week 1)

| ID | Item | Status | Est. Hours |
|----|------|--------|-----------|
| 1.1 | Nutrition Light Mode Fix | ✅ DONE | 2h |
| 1.2 | SetLogger Touch Targets | ✅ DONE | 1h |
| 1.3 | Nutrition Tabs Overflow | ✅ DONE | 1h |
| 1.5 | Confetti on PR | ✅ DONE | 0.5h |
| 1.6 | Meal Delete Button | ✅ DONE | 0.25h |
| 2.1 | Rest Timer | ✅ DONE | 4h |
| 3.1 | "Last Time" Data | ✅ DONE | 4h |
| 3.2 | Difficulty Picker | ✅ DONE | 2h |
| 3.3 | Share Workout Card | ✅ DONE | 3h |
| 5.2 | Offline Queue Wiring | ✅ DONE | 3h |
| **Total** | | | **~21h** |

### Phase 2 — Core Features (Weeks 2-3)

| ID | Item | Status | Est. Hours |
|----|------|--------|-----------|
| 2.2 | History Page | ✅ DONE | 12h |
| 2.3 | **Profile/Settings** | ✅ DONE | 6h |
| 2.5 | Superset (Visual + Logic) | ✅ DONE | 6h |
| 2.6 | Smart Warm-Ups | ✅ DONE | 5h |
| 3.4 | Plate Calc (Integrated) | ✅ DONE | 4h |
| 3.6 | Smart Meal Shortcuts | ✅ DONE | 4h |
| 3.7 | Energy Balance Trend | ✅ DONE | 3h |
| 6.1 | PWA Manifest | ✅ DONE | 1h |
| **Total Remaining** | | | **~28h** |

### Phase 3 — Domain Intelligence (Weeks 3-4)

| ID | Item | Status | Est. Hours |
|----|------|--------|-----------|
| 4.1 | Periodization Timeline | ✅ DONE | 5h |
| 4.2 | Readiness Score | ✅ DONE | 5h |
| 4.3 | Strength Curve | ✅ DONE | 10h |
| 4.4 | MRV Warnings | ✅ DONE | 5h |
| 4.5 | Split Auto-Recommendation | ✅ DONE | 5h |
| 2.4 | Body Measurements | ✅ DONE | 10h |
| **Total** | | | **~40h** |

### Phase 4 — Growth & Stability (Ongoing)

| ID | Item | Status | Est. Hours |
|----|------|--------|-----------|
| 5.3 | Lazy Loading | ✅ PARTIAL | 1h |
| 5.4 | Test Coverage | ✅ PARTIAL | 20h+ |
| 5.5 | Accessibility Audit | ✅ PARTIAL | 6h |
| 6.2 | Branded Cards | ✅ DONE | 4h |
| 6.3 | Coach Portal (Phase 2 Done) | ✅ PARTIAL | 40h+ |
| 2.7 | Exercise Media | ✅ DONE | 12h |
| 3.5 | RPE Toggle | ✅ DONE | 2h |
| 3.8-3.10 | Detail Modal, Custom Exercises, 1RM | ✅ DONE | 8h |
| **Total** | | | **~93h+** |

---

## Item Template

For agents adding new items to this document, use this template:

```markdown
### [SECTION.NUMBER] Item Title

- **Priority:** CRITICAL / HIGH / MEDIUM / LOW
- **Effort:** S (1-2h) / M (3-8h) / L (1-3d) / XL (1+ week)
- **Impact:** One sentence describing user/business value
- **Files:** Exact paths to create or modify with line numbers
- **Dependencies:** Other items that must be done first (if any)

**Current Code:**

```tsx
// File: path/to/file.tsx, line XX
<current code>
```

**Proposed Code:**

```tsx
<replacement code>
```

**Why:**
Engineering and/or CPT-level fitness rationale for the change.
```

---

## Verification Notes

- All line numbers/statuses verified against the codebase as of **2026-02-20**
- File paths are relative to the project root
- Code examples are taken directly from the source files
- CPT (Certified Personal Trainer) rationale provided for fitness-specific features
- MRV values sourced from Dr. Mike Israetel's research (Renaissance Periodization)

---

> *"Amateurs sit and wait for inspiration, the rest of us just get up and go to work."*  
> — Stephen King
