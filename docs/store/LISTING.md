# Store listing copy (App Store and Google Play)

> **Draft, 2026-11-26 (Lane A, Day 6; roadmap 4.3).** Written against the app on `preview_b` at `b7dc219`. Lane A finalises it on Day 9, after the final build and the screenshots.
>
> **What the listing may say.** It must match the merged app:
> - **For lifters.** It covers plans, logging, history, nutrition and the exercise library. Circles (social) and the coach tools are **off** in v1 (`src/lib/featureFlags.ts`), so the copy says nothing about friends, groups, challenges, clients or coaching.
> - **No "AI" claim** (roadmap 0.1, Lane B #51). The plan comes from rules (`src/lib/planGenerator.ts`), and the copy says so in plain words.
> - **Free, with no in-app purchases.** There is no payment code; the Pro subscription is after launch.
> - **No medical claims.** The listing ends with the disclaimer line from [`COMPLIANCE.md`](COMPLIANCE.md) §3.
>
> **Character limits are checked by a script.** `node scripts/store-screenshots.mjs --check-copy` reads every `listing:` block below and fails if one is over its limit or uses a banned word. Banned words include "AI", "coach", "circle", "subscription" and medical-claim words. Add `--strict` to fail on `[bracketed placeholders]` inside a block as well; use it on Day 9. The URL and contact table isn't a block, so check its placeholders by eye. To change the copy, edit the text inside a block, keep the `<!-- listing:… -->` line above it, and re-run the check. `scripts/store-screenshots.test.ts` runs the same check in `npm run test:run`.
>
> **Limits** are from each console as last known. Apple: name 30, subtitle 30, promotional text 170, description 4,000, keywords 100, What's New 4,000. Google: title 30, short description 80, full description 4,000, release notes 500. Google's help pages can't be reached from the agent environment, so **Lincoln checks Google's limits in Play Console** when he pastes the copy.

## Placeholders (Lincoln)

| Placeholder | Question | Blocks |
|---|---|---|
| `[domain: Lincoln to provide, L3]` | Which domain will the app's web pages use? | Support, privacy and marketing URLs |
| `[support email: Lincoln to provide]` | Which public support address? Not a personal one | Support contact on both stores; Google requires an email |
| `[copyright holder: Lincoln to provide]` | Your legal name or company, as it should appear after "©" | Apple's Copyright field |
| `[minimum age: Lincoln to confirm, 13?]` | Minimum age, matching the privacy policy and `COMPLIANCE.md` §1 | Age-rating notes below |
| App name "FitWizard" | L5 (name and trademark search) is still open. Is the name cleared? | Both stores' name fields |

## App name and category

| Field | Apple | Google |
|---|---|---|
| Name / title | `FitWizard` (block `name` below) | `FitWizard` (the same block) |
| Primary category | **Health & Fitness** | **Health & Fitness** |
| Secondary category (Apple, optional) | Lifestyle, or leave empty. Recommended: **leave empty** | — |
| Price | **Free** | **Free** |
| In-app purchases | **None** | **None**. "Contains ads": **No** (`COMPLIANCE.md` §1) |
| Age rating | From the questionnaire; expected **4+** (`COMPLIANCE.md` §1). Not directed at children; minimum age `[minimum age: Lincoln to confirm, 13?]` | Expected **Everyone** |

<!-- listing:name max=30 -->
```text
FitWizard
```

## Apple: subtitle (30)

<!-- listing:apple-subtitle max=30 -->
```text
Lifting plans and workout log
```

## Google: short description (80)

<!-- listing:google-short max=80 -->
```text
Build a lifting plan for your muscles and equipment, then log every set.
```

## Apple: promotional text (170)

Shown above the description and can be changed without a new build.

<!-- listing:apple-promo max=170 -->
```text
Pick your goal, your equipment and the muscles you want to train. FitWizard builds the plan, and you log every set. Free, and no account needed.
```

## Apple: keywords (100)

Comma-separated with no spaces. Apple already searches the name and the category, so neither is repeated here.

<!-- listing:apple-keywords max=100 -->
```text
workout,gym,lifting,strength,weightlifting,planner,tracker,log,hypertrophy,muscle,sets,reps,routine
```

## Full description (Apple 4,000 · Google 4,000)

The same text for both stores. Apple shows plain text, so the bullets are "•" characters.

<!-- listing:description max=4000 -->
```text
FitWizard builds a strength training plan around you, then helps you follow it one set at a time.

Tell it your goal, the equipment you have and the muscles you want to train. FitWizard turns that into a weekly plan with exercises, sets, reps, rest and effort targets. When it's time to train, the workout logger walks you through every set.

BUILD YOUR PLAN
• Choose a goal: strength, muscle growth or general fitness.
• Pick your equipment, from a full gym to bodyweight only.
• Choose muscles on an interactive body map, with front, back and side views and deeper layers, or search for a muscle by name.
• Flag movements to leave out, and set how many days a week you train and how long each session lasts.
• Get a full body, upper/lower or push/pull/legs split, with reps-in-reserve targets that build week by week, deload weeks, and a warning if a muscle is getting more volume than it can recover from.
• Export your plan as a PDF.

LOG YOUR WORKOUTS
• Log weight, reps and effort (reps in reserve or RPE) for every set.
• Warm-up sets, supersets, a rest timer and a plate calculator are built in.
• On your phone, get a notification when your rest is over, and reminders on your training days.
• If the app closes mid-workout, pick up where you left off.
• Rate each workout when you finish, and share a summary card.

SEE YOUR PROGRESS
• History of every workout you've finished.
• Analytics with volume trends, a strength curve and personal records.
• A quick daily readiness check-in (sleep, energy, soreness, stress) to help you choose how hard to train.
• Streaks, a weekly goal and badges you earn by training.

NUTRITION
• Log meals and track calories and macros against your targets.
• Look up packaged foods by their barcode number (Open Food Facts).
• Track water and save the meals you eat often.

EXERCISE LIBRARY
• Browse and search exercises with instructions and the muscles they work.
• Save favourites and create your own exercises.

YOUR DATA, YOUR CHOICE
• No account needed. As a guest, everything stays on your device.
• Works offline.
• Sign in with a code sent to your email to back up your training and keep it in step across your devices.
• Download a copy of your data, or delete your account and all its data, from your Profile.
• No ads.

Light and dark themes, and support for screen readers and Reduce Motion.

FitWizard is free.

FitWizard gives general fitness information and is not medical advice. Talk to a doctor before starting a new exercise or nutrition programme.
```

## What's new

- **Apple:** the first version of an app has no "What's New" field. Use the block below from the first update onward, and keep it for TestFlight's "What to Test".
- **Google:** the first production release and the closed test both ask for release notes (500). Use the short block.
- The web app's own notes are in [`RELEASE_NOTES_1.1.0.md`](RELEASE_NOTES_1.1.0.md). Those cover what changed since the web 1.0. These cover the first phone release, including the phone-only features from #83 and #89.

<!-- listing:whats-new-apple max=4000 -->
```text
The first FitWizard release for iPhone.
• Build a lifting plan from your goal, equipment and the muscles you choose, then log every set.
• Everything is saved on your phone. Sign in with an email code to back it up and use it on your other devices.
• Get a notification when your rest is over, and reminders on the days you train.
• Share a workout summary with your phone's share sheet.
• The status bar follows your light or dark theme, and the keyboard keeps the field you're typing in visible.
```

<!-- listing:whats-new-google max=500 -->
```text
The first FitWizard release for Android.
• Build a lifting plan from your goal, equipment and muscles, then log every set.
• Saved on your phone; sign in with an email code to back up and sync.
• Rest-over notifications and training-day reminders.
• Share a workout summary.
```

## URLs and contact

| Field | Value | Notes |
|---|---|---|
| Support URL (Apple, required) | `https://[domain: Lincoln to provide, L3]/about` | The About page links to the guide and the legal pages. A dedicated support page doesn't exist yet. Lincoln: is `/about` acceptable, or do you want a support page? (Default: `/about`.) |
| Marketing URL (Apple, optional) | `https://[domain: Lincoln to provide, L3]/` | |
| Privacy policy URL (both) | `https://[domain: Lincoln to provide, L3]/legal?tab=privacy` | Same as [`APPLE_PRIVACY.md`](APPLE_PRIVACY.md) Step 3 |
| Account deletion URL (Google) | `https://[domain: Lincoln to provide, L3]/legal?tab=privacy#delete-account` | [`COMPLIANCE.md`](COMPLIANCE.md) §4 |
| Support email (Google required; Apple App Review contact) | `[support email: Lincoln to provide]` | Must not be a personal address |
| Copyright (Apple) | `2026 [copyright holder: Lincoln to provide]` | Apple adds the "©" |

## Screenshots

- Produced by [`scripts/store-screenshots.mjs`](../../scripts/store-screenshots.mjs) into `docs/store/screenshots/` (git-ignored). The script header lists the sizes and how to run it.
- Six screens, in this order: home, the plan builder's muscle step, the generated plan, the workout logger mid-set, history, analytics.
- They show guest mode with demo data that the script creates through the app itself, so no sign-in and no Supabase are needed.
- **Day 9** runs it on the final build. Check each image for placeholder text and for any Circles or coach entry point before uploading.

## Checks before pasting (Day 9)

- [ ] `node scripts/store-screenshots.mjs --check-copy --strict` passes, so no placeholder is left.
- [ ] Every feature named above is in the submitted build. In particular, notifications and the share sheet are unverified on devices until Day 8 (Lane H).
- [ ] Languages: the listing doesn't name languages yet. Once Lanes J1 and J2 complete Spanish (Gate 3), add a Spanish listing, or a line saying the app is in English and Spanish.
- [ ] If the submitted build includes PostHog or Sentry keys (L6), the description doesn't need to change, but the privacy forms do ([`APPLE_PRIVACY.md`](APPLE_PRIVACY.md), [`GOOGLE_DATA_SAFETY.md`](GOOGLE_DATA_SAFETY.md)).
