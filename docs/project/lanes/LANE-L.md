# Lane L: Lincoln (human tasks)

The AI lanes can't do these tasks. They need your accounts, your dashboards, your devices, or your judgement. Several of them take days of waiting, so **start the long ones on Day 1**.

## Every day
- **L12: Review and merge.** Merge PRs into `preview_b` in this order: **F → E → C → H → B → D → J → A**. If a later PR conflicts after an earlier merge, ask that lane's agent to rebase. Don't fix it yourself.
- **Start the next day's lanes** once the day's merges are done, using the kickoff prompt in `docs/project/README.md`.
- **Answer questions in handoffs.** Each handoff has a "Questions for Lincoln" section.

## Day 0
- [ ] **L0** Review and merge the Day 0 PR into `preview_b`. Then start the Wave 1 lanes (A, B, C, D, E, F, H) from their task cards or the kickoff prompt. With 4 agents, run A+B, C+D, E+F and H.

## Day 1 (start early: these involve waiting)
- [ ] **D1–D6** Answer the open decisions in `BOARD.md`. Each has a default that applies if you don't answer by the day it's needed.
- [ ] **L4 Developer accounts.**
  - Enrol in the Apple Developer Program and create a Google Play Console developer account. **Check the current fees on each site.** Apple identity verification can take several days.
  - Once approved, create the app records with bundle id `com.fitwizardly.app` and app name FitWizard.
  - On Google Play, read the current testing requirements for new personal accounts. At the time of writing that's a closed test with **12+ testers for 14 days** before production; verify it.
- [ ] **L1 Revoke the old Supabase key** (SEC-001).
  - First confirm that both Vercel sites (`main` and `preview_b`) use the new publishable key. In the browser, the requests to Supabase should carry an `sb_publishable_…` key.
  - Then, in the Supabase dashboard, go to Settings → API and revoke or rotate the legacy anon JWT. Follow `docs/VERCEL_SECRET_ROTATION.md`.

## Day 2
- [ ] **L3 Domain.** The code mentions `fitwizard.app`, and it's unknown whether you own it. Confirm, or buy a domain, then point it at the Vercel production project. Tell Lane H the final origin. It becomes `VITE_PUBLIC_APP_ORIGIN` and the share URL.

## Day 3
- [ ] **L5 Name check.** Search "FitWizard" in the App Store, on Google Play, and in the USPTO trademark search. If there's a conflict, decide on a name before Wave 3 store copy is final.
- [ ] **L6 Monitoring accounts.**
  - Create a Sentry project (React) and a PostHog project (EU cloud).
  - Add these Vercel environment variables to both the Preview and Production environments: `VITE_SENTRY_DSN`, `VITE_POSTHOG_KEY`, and optionally `SENTRY_AUTH_TOKEN` (build-only, for source maps).
- [ ] **L10 Staging Supabase project.**
  - Create a second Supabase project for testing.
  - Apply migrations `001`–`008` in order, following `docs/SUPABASE_MIGRATIONS.md`.
  - Deploy the `delete-account` function there, following `supabase/functions/delete-account/README.md`.
  - Point the beta site's Vercel variables at staging if you want Gate 1 testing isolated from production.
- [ ] **L11 Email template.** In the Supabase dashboard, go to Authentication → Email Templates → Magic Link, and add the 6-digit code (`{{ .Token }}`). Do this for both staging and production. Lane H's Day 3 handoff has the exact text.
- [ ] **Gate 1.** Work through the checklist in `BOARD.md`.

## By Day 7
- [ ] **L8 Testers.** Recruit at least 12 people with Android phones for the closed test. Collect their Google account emails. Recruit a few iPhone testers for TestFlight too.
- [ ] **L2 Production database.**
  - Run the verification queries in `docs/SUPABASE_MIGRATIONS.md` against production.
  - Apply any missing migrations: 002 and 004 may be missing (SEC-005). Then apply 007 and 008.
  - Deploy `delete-account` to production.
- [ ] **Gate 2.** Work through the checklist in `BOARD.md`, including:
  - merging `preview_b` into `main`
  - tagging `v1.1.0`
  - uploading the first Android build to the closed test (this starts the 14-day clock)
  - uploading the first iOS build to TestFlight

## Days 8–10
- [ ] **L7 Devices.** Have a real iPhone, a real Android phone, and a Mac with Xcode ready. Run the device checklist in `docs/RELEASE_MOBILE.md` (Lane H, Day 8) and report failures in the Lane H session.
- [ ] **L9 Legal review.**
  - Send `docs/store/PRIVACY_FOR_REVIEW.md` and the Terms to a qualified person for review.
  - Decide the policy's support email: use a public support address, not a personal one.
  - Confirm the data region, the age policy, and the governing law.
- [ ] **Store forms.** Copy the answers from `docs/store/APPLE_PRIVACY.md` and `docs/store/GOOGLE_DATA_SAFETY.md` into the consoles. Check every answer against the live form wording.
- [ ] **Gate 3, then submit.**
  - Submit iOS for review.
  - Submit Android for production once the 14-day closed test is complete.

## Days 11–12
- [ ] Upload the PWABuilder package to Microsoft Partner Center (if you want Windows store presence). Build and notarise the Tauri macOS app on your Mac, following `docs/RELEASE_DESKTOP.md`.

## Things to keep in mind
- **You're the bottleneck by design.** Seven lanes can open about seven PRs a day. If review falls behind, pause lanes rather than merging without reading.
- **Never paste secrets into a chat or a PR.** Keys go into Vercel or Supabase settings directly.
- **The agents work in cloud containers.** They can't open your Supabase dashboard, run Xcode, or test on your phone. Those steps are yours.
