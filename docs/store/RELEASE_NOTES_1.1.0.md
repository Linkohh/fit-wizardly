# Release notes: FitWizard 1.1.0 (draft)

> **Draft, 2026-11-18 (Lane A, Day 3).** Built from the Wave 1 work merged into `preview_b` (#44–#69). Wave 2 adds more before release (see "Still to come"). On Day 7, Lane A finishes this file and copies it into `src/data/changelog.ts`, whose test requires the top entry to match `package.json`.
>
> The sections match `ChangelogHighlights` in `src/data/changelog.ts`: **New**, **Improved**, **Fixed**. Keep bullets short and in user language. Don't mention AI, and don't make medical claims.

**Name:** Your training, kept safe

## New
- Your workouts, plans, personal records, meals, body measurements, readiness check-ins and badges are now saved on your device. They're still there after you close the app or restart your phone.
- If the app closes mid-workout, you can pick up where you left off. If you start a different workout instead, FitWizard asks whether to resume the unfinished one or discard it.
- Earning a badge now shows a notification.
- Sign in and your training is backed up to your account and kept in step across your devices: workouts, records, meals, measurements, check-ins, badges and custom exercises. It syncs when you sign in, come back online or reopen the app, and you can see the status on your Profile.
- Sign in with a 6-digit code from your email. Type it in the app, or tap the link in the email on the web. If the code doesn't arrive, you can ask for a new one after a minute.

## Improved
- Your weekly goal now counts finished workouts, not generated plans. It's set from your plan's training days, and it starts fresh every Monday.
- Signing out keeps your training data on this device, and the app tells you so.
- The language menu offers English and Español. Other languages return when their translations are complete.
- Screen readers now pronounce the app in the language you picked.
- New-user screens are clearer: History, Analytics and Nutrition tell you what to do next, with one button to create a plan, start today's workout or log a meal.
- Faster to load and smaller to install: icons and the logo are a fraction of their old size, and the exercise catalogue downloads only when you open the library.
- The exercise library works offline after you've opened it once.
- Fonts now load from FitWizard itself, so opening the app no longer contacts Google.
- Exercise search goes through FitWizard's own server, which makes it work the same way on the web and on phones.

## Fixed
- Removed wording that promised features the app doesn't have, and removed placeholder pictures and sample badges that weren't real.
- Hidden features (social circles and the coach tools) no longer appear in menus, search, the guide or your badge list.
- The command palette no longer links to pages that don't exist.
- Badges that couldn't be earned have been removed.
- Exported PDF plans read cleanly: day titles no longer repeat ("Day 1: Day 1"), column headings stay on one line, and emoji no longer print as stray symbols.

## Still to come before 1.1.0 ships (Wave 2, not merged yet)
Add these on Day 7 if they merge:
- Syncing your changes before you sign out, with a warning if some haven't been sent (Lane E, Day 7).
- Delete your account from inside the app, and erase data on this device (Lane F, Day 4).
- Optional crash reports and product analytics, both off unless you opt in (Lane C, Days 3–5).
- Rewritten privacy policy and terms (Lane A, Day 4).

## Left out on purpose
These are internal and mean nothing to users: database migrations 007 and 008, the API origin allowlist and rate limit, dead-code removal, and doc fixes.

The native app items (the FitWizard name, iPhone-only and portrait-only, Android release settings) go in the store "What's new" text for the first native release, not here. Lane A writes that on Day 6 (`LISTING.md`).
