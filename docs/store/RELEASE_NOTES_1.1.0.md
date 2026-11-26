# Release notes: FitWizard 1.1.0 (draft)

> **Draft, 2026-11-18 (Lane A, Day 3); updated 2026-11-26 (Day 6).** Built from the work merged into `preview_b`: Wave 1 (#44–#69) and Wave 2 so far (#73, #74, #76–#78, #80–#93). Wave 2 adds more before release (see "Still to come"). On Day 7, Lane A finishes this file and copies it into `src/data/changelog.ts`, whose test requires the top entry to match `package.json`.
>
> The sections match `ChangelogHighlights` in `src/data/changelog.ts`: **New**, **Improved**, **Fixed**. Keep bullets short and in user language. Don't mention AI, and don't make medical claims.

**Name:** Your training, kept safe

## New
- Your workouts, plans, personal records, meals, body measurements, readiness check-ins and badges are now saved on your device. They're still there after you close the app or restart your phone.
- If the app closes mid-workout, you can pick up where you left off. If you start a different workout instead, FitWizard asks whether to resume the unfinished one or discard it.
- Earning a badge now shows a notification.
- Sign in and your training is backed up to your account and kept in step across your devices: workouts, records, meals, measurements, check-ins, badges and custom exercises. It syncs when you sign in, come back online or reopen the app, and you can see the status on your Profile.
- Sign in with a 6-digit code from your email. Type it in the app, or tap the link in the email on the web. If the code doesn't arrive, you can ask for a new one after a minute.
- You stay signed in after you close the app or the browser.
- Delete your account and all its data from Profile → Details, or, without an account, erase everything FitWizard keeps on this device. Download your data first if you want a copy: the export now includes everything the app stores, including badges, custom exercises and favourites.
- A new privacy policy and terms that say plainly what the app stores, where, and who receives it, with a page that explains how to delete your account.
- A **Sign out** button on your Profile. Signing out sends your last changes to your account first, warns you if some couldn't be sent (for example when you're offline), then removes your training from this device. It stays in your account for next time.

## Improved
- Your weekly goal now counts finished workouts, not generated plans. It's set from your plan's training days, and it starts fresh every Monday.
- Plans now sync like the rest of your training. Delete a plan and it's gone from your other devices too, and edits to a plan reach your account.
- Switching between Light, Dark and System fades smoothly again instead of snapping.
- Screen readers name every slider (sleep, energy, soreness, stress, reps in reserve), and buttons in the muscle selector are easier to tap.
- The app follows your device's Reduce Motion setting.
- The muscle selector switches theme with the rest of the app, and selected muscles are readable in the light theme.
- The Start Over dialog in the plan builder is translated.
- Pressing Enter on a button or a muscle in the plan builder now does just that, instead of also jumping to the next step.
- The language menu offers English and Español. Other languages return when their translations are complete.
- Screen readers now pronounce the app in the language you picked.
- New-user screens are clearer: History, Analytics and Nutrition tell you what to do next, with one button to create a plan, start today's workout or log a meal.
- Faster to load and smaller to install: icons and the logo are a fraction of their old size, and the exercise catalogue downloads only when you open the library.
- The exercise library works offline after you've opened it once.
- Fonts now load from FitWizard itself, so opening the app no longer contacts Google.
- Fewer taps to your first plan: after the welcome screens you go straight to the plan builder, your goal carries over, and there are one-tap choices for "no injuries" and "let FitWizard choose" muscles. First plans start at 3 sessions of 45 minutes.
- Sign-in errors, such as too many code requests, now show in your language.
- Exercise search goes through FitWizard's own server, which makes it work the same way on the web and on phones.

## Fixed
- Removed wording that promised features the app doesn't have, and removed placeholder pictures and sample badges that weren't real.
- Hidden features (social circles and the coach tools) no longer appear in menus, search, the guide or your badge list.
- The command palette no longer links to pages that don't exist.
- Badges that couldn't be earned have been removed.
- Exported PDF plans read cleanly: day titles no longer repeat ("Day 1: Day 1"), column headings stay on one line, and emoji no longer print as stray symbols.
- Every set in a workout can be logged. Before, every second set locked.
- You can finish and rate a workout, and it appears in History.
- Sets you've saved show as done after the app reloads.
- Plan cards show real numbers, such as "6-12 reps" and "90s rest", instead of placeholder text.
- The workout logger no longer shows raw labels such as "workout.notes".
- Full body plans no longer end with an empty day, days use different exercises when there are enough to choose from, and each session's sets are shared fairly across the muscles you picked.
- Reps-in-reserve colours are easier to read in the light theme.

## Still to come before 1.1.0 ships (Wave 2, not merged yet)
Add these on Day 7 if they merge:
- Optional crash reports and product analytics, both off unless you opt in (Lane C, Days 4–5; #75 waits on Lincoln's `$pageview` decision).

## Left out on purpose
These are internal and mean nothing to users: database migrations 007 and 008, the API origin allowlist and rate limit, dead-code removal, retiring the unused Express server (#80), the accessibility test in CI, the dependency security updates and the CI audit gate and Dependabot (#91, #93), the Android CI build (#92), and doc fixes.

The native app items (the FitWizard name, iPhone-only and portrait-only, Android release settings, and from #83 the status bar that follows the theme, the splash screen that waits for your data, the keyboard that keeps the field in view, the phone's own share sheet for workout cards, and from #89 workout reminders on your training days and a notification when your rest is over) go in the store "What's new" text for the first native release, not here. Lane A wrote that on Day 6, in [`LISTING.md`](LISTING.md) → "What's new". The iOS privacy manifest and export-compliance changes (#92) are store paperwork, not user-facing.
