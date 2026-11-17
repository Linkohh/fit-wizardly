# Lane H: Native

**Mission:** Make FitWizard work and feel like a real app on iPhone, Android and desktop:
- sign-in that works on phones
- sessions that last
- notifications, native share and proper status bars
- projects that are ready to sign and ship

**Active:** Days 1–12. Lane H is the longest lane; it runs alone in Wave 4.

## Read first
- `docs/project/README.md`
- `docs/project/CONTRACTS.md` #6, #7, #10
- `docs/IOS_DEVELOPMENT.md`
- `capacitor.config.ts`
- `ios/App/App/Info.plist`
- `android/app/build.gradle`
- `src/hooks/useHaptics.ts` (the pattern for every native helper)
- `src/lib/platform.ts`
- `docs/LAUNCH_ROADMAP.md` items 0.6 and 2.1–2.7

## Owns
- `capacitor.config.ts`, `ios/**`, `android/**`, `resources/**`, `api/**`
- `src/lib/supabase.ts`
- In `src/stores/authStore.ts`, the sign-in actions from about line 228 onward (Lane E owns lines 16–70)
- `src/components/auth/*`
- The `index.html` fonts block (Day 2 onward)
- `vercel.json` on Day 2 only (font CSP)
- `src/lib/apiBase.ts`, plus the call sites in `src/lib/motivation/motivationQuoteClient.ts`, `src/lib/services/api/exerciseApiAdapter.ts` and `src/features/exercise-library/service.ts` (around line 267)
- `package.json`: the `name` and `scripts` fields
- New hooks: `useShare`, `useLocalNotifications`, `useStatusBarTheme`, `useKeyboard`
- In `src/components/logging/RestTimer.tsx`, the notification calls
- In `src/components/logging/WorkoutSummary.tsx`, the share block (around lines 330–370) and the share URL (line 30)
- The docs link in `src/components/CommandPalette.tsx` (line 204, one line only)
- The reminders block in `src/pages/Profile.tsx` (Day 6)
- Adding the Android job to `.github/workflows/ci.yml` (Day 7)
- `src-tauri/**` (Day 12), and the Tauri branch in `src/lib/storage/appStorage.ts` (Day 12 exception)
- Appending ADR 12 to `docs/DECISIONS.md`
- Locale keys: `auth.*`, `notifications.*`, `native.*`

## Must not touch
Stores other than `authStore`'s sign-in area, sync code, `supabase/`, routing.

## Contracts
- **Provides:** #6 API base (Day 2), #7 email code (Day 3), #10 native helpers (Days 5–6)
- **Uses:** #2 storage (Day 12)

## Environment
- Cloud sessions are Linux. **You can't build or run iOS here**, and Android builds need the Android SDK, which may not be installed.
- You can edit native config and run `npx cap sync` (it copies web assets and updates plugin lists).
- Leave Xcode archive steps to Lincoln and write exact instructions in your handoff.
- If you install the Android SDK (`sdkmanager`) and `./gradlew assembleDebug` succeeds, say so. Otherwise mark the native build as **unverified**.

---

## Day 1: Name and native project fixes (0.6, 2.5, 2.6)

### Steps
1. **Name: FitWizard.**
   - `capacitor.config.ts` `appName`: `'FitWizard'`.
   - `ios/App/App/Info.plist`: set `CFBundleDisplayName` to `FitWizard`, and change the `NSMotionUsageDescription` text to say "FitWizard uses…".
   - `android/app/src/main/res/values/strings.xml`: set `app_name` and `title_activity_main` to `FitWizard`.
   - `package.json` `name`: `fitwizard`. Run `npm install` so the lockfile's root name matches.
   - **Keep the bundle id `com.fitwizardly.app`** everywhere, including `package_name` and `custom_url_scheme`.
2. **iOS `Info.plist`:**
   - Delete the whole `NSAppTransportSecurity` block (lines 69–73). It allows arbitrary insecure loads, which App Review flags. All the app's hosts use HTTPS.
   - Change `UIRequiredDeviceCapabilities` from `armv7` to `arm64`.
   - `UISupportedInterfaceOrientations`: portrait only. Delete the `~ipad` array.
   - In `project.pbxproj`, set `TARGETED_DEVICE_FAMILY = 1` in both build configurations (lines 338 and 359), which makes the app iPhone only (decision **D4**). If D4 is answered "include iPad", leave this alone.
3. **Privacy manifest.** Create `ios/App/App/PrivacyInfo.xcprivacy`:
   - `NSPrivacyTracking` false, `NSPrivacyTrackingDomains` empty.
   - `NSPrivacyCollectedDataTypes`: email address (app functionality, linked to the user), fitness data (app functionality, linked), crash data, and product interaction (analytics, not linked, opt-in). Match this to `docs/store/DATA_INVENTORY.md` when it lands, and flag anything uncertain.
   - `NSPrivacyAccessedAPITypes`: UserDefaults (`CA92.1`, used by `@capacitor/preferences`), File timestamp (`C617.1`), System boot time if any plugin needs it. **Check the current list of required reason codes in Apple's docs and in each plugin's own privacy manifest.**
   - Add the file to the Xcode project: edit `project.pbxproj` to add a `PBXFileReference`, a `PBXBuildFile` in the App target's Resources phase, and an entry in the App group, following how `Info.plist`/`Assets.xcassets` are listed. If you're not confident, leave the file in place and give Lincoln the one-step instruction instead: drag it into the App group in Xcode with "Copy items" off and the App target ticked.
4. **Signing:** leave `DEVELOPMENT_TEAM` empty (Lincoln sets it in Xcode after L4). Document this.
5. **Android:**
   - `android/app/build.gradle`: add a `signingConfigs.release` that reads `storeFile`, `storePassword`, `keyAlias` and `keyPassword` from `android/keystore.properties` if that file exists, otherwise skipping signing. Use it in `buildTypes.release`.
   - Set `minifyEnabled true` and `shrinkResources true`.
   - Add `keystore.properties` and `*.jks` / `*.keystore` to `android/.gitignore`.
   - Add `android/keystore.properties.example` with placeholder keys.
   - `AndroidManifest.xml`: change `android:allowBackup="true"` to `"false"`. Also add `android:dataExtractionRules`/`fullBackupContent` only if lint requires them.
   - `proguard-rules.pro`: add Capacitor's recommended keep rules (check the Capacitor 8 docs).
6. **Capacitor:** in `capacitor.config.ts`, remove `plugins.CapacitorHttp.enabled: true` (roadmap finding F-05).
   - Search for anything that relied on native HTTP bypassing CORS. The wger fetch in `src/features/exercise-library/service.ts` (around line 267) calls `wger.de` directly on native. Check whether wger sends CORS headers. If it doesn't, keep the native path working by routing through `apiUrl('/api/proxy-wger…')` once Day 2 lands; note this in the handoff.
7. **Scripts** in `package.json`:
   - `"android:sync": "npx cap sync android"`
   - `"android:open": "npx cap open android"`
   - `"android:run": "npx cap run android"`
8. Run `npm run build && npx cap sync`. Commit only real config changes; ignore generated assets that `.gitignore` already covers.

### Done when
- [ ] `grep -rn "Fit Wizardly" ios android capacitor.config.ts package.json` returns nothing.
- [ ] `Info.plist` has no ATS block and only portrait.
- [ ] The release signing config reads from the ignored properties file.
- [ ] `allowBackup` is false.
- [ ] `CapacitorHttp` is gone, and the effect on wger is documented.

---

## Day 2: Self-hosted fonts, API base, API hardening (2.5, 2.3)

### Steps
1. **Fonts.**
   - `npm install @fontsource/outfit @fontsource/plus-jakarta-sans @fontsource/unbounded`.
   - Import only the weights used (`index.html` lines 13–16 request Outfit 300–700, Plus Jakarta Sans 500–800, Unbounded 700/900) in a new `src/styles/fonts.css`. Import that file from `src/main.tsx`; Lane C owns `main.tsx` from Day 3, so this one import line is your exception for today.
   - Delete the three Google Fonts `<link>` tags from `index.html`.
   - In `vercel.json`, remove `https://fonts.googleapis.com` from `style-src` and `https://fonts.gstatic.com` from `font-src`.
   - Check that the typography looks unchanged, in screenshots before and after.
2. **API base** (contract #6). Create `src/lib/apiBase.ts`:

   ```ts
   export function apiUrl(path: `/api/${string}`): string {
     if (!isNativeApp()) return path;
     const origin = import.meta.env.VITE_PUBLIC_APP_ORIGIN;
     if (!origin) { devLog('[apiBase] VITE_PUBLIC_APP_ORIGIN missing on native'); return path; }
     return `${origin.replace(/\/$/, '')}${path}`;
   }
   ```

   - Use it in `motivationQuoteClient.ts:137`, `exerciseApiAdapter.ts:95` and `service.ts:267`.
   - Add `VITE_PUBLIC_APP_ORIGIN=` to `.env.example` in a "Native" block, with a comment that it's the deployed web origin, for example `https://fitwizard.app` (L3).
   - Tests: on web the path is unchanged; on native it gets the prefix.
3. **API hardening** (`api/*.ts`):
   - **CORS:** replace `Access-Control-Allow-Origin: *` with an allowlist read from `ALLOWED_ORIGINS`. Include the production and beta origins, `capacitor://localhost` and `https://localhost`. Return a 403 for any other origin, but allow requests with no `Origin` header (same-origin GETs).
   - **Rate limit:** a simple per-IP fixed window held in memory (for example 60 requests per minute per function instance), returning 429. Document that it's per instance and best-effort; Vercel's firewall rules are the long-term fix.
   - **`proxy-wger.ts`:** match the dev proxy in `vite.config.ts`. Require `https:`, use `redirect: 'error'`, keep the host allowlist, and return a generic error message instead of `err.message`.
   - Update the existing `api/*.test.ts` files.
4. **Share and docs URLs** (finished after L3):
   - `WorkoutSummary.tsx:30` default and `CommandPalette.tsx:204`: if Lincoln has confirmed a domain, use it.
   - If not, keep `VITE_SHARE_BASE_URL` as the source, and make the palette's docs link point to `/guide` instead of the external `docs.fitwizardly.com`.

**Done when:**
- [ ] The Network tab shows no requests to Google Fonts.
- [ ] The API tests cover allowed and blocked origins and the 429.
- [ ] The native call sites use `apiUrl`.

---

## Day 3: Email-code sign-in (2.1)

### Steps
1. In `authStore.ts`, add `verifyEmailCode(email, code)` (contract #7):
   - Call `supabase.auth.verifyOtp({ email, token: code.trim(), type: 'email' })`, then `return { error }`.
   - The existing `onAuthStateChange` handler takes care of the rest (profile creation and so on).
2. Keep `signInWithEmail` as is. It sends one email, and once Lincoln updates the template (L11) that email holds both the link and the code.
3. In `src/components/auth/AuthModal.tsx`, after a successful send, switch to a **code step**:
   - Six boxes using `src/components/ui/input-otp.tsx`, with `autoComplete="one-time-code"` and `inputMode="numeric"`.
   - Submit automatically when the sixth digit is entered.
   - Errors: "That code isn't right." / "That code has expired. Send a new one."
   - "Resend code" is disabled for 60 seconds, with a countdown.
   - "Use a different email" goes back to the first step.
   - On native, show the code step only. The email link can't open the app because there are no deep links (by design).
4. Write the template instructions in `docs/IOS_DEVELOPMENT.md` (a short "Auth email" section; agreed exception) **and** in your handoff for L11:
   - Supabase dashboard → Authentication → Email Templates → Magic Link: add `Your FitWizard code: {{ .Token }}`.
   - Also check that the OTP expiry is sensible (for example 10 minutes) and that the code length matches 6. **Confirm the current setting names in the Supabase dashboard.**
5. If contract #9 has merged, add `track('signed_in')`.
6. Tests, in `AuthModal.test.tsx`:
   - Send moves to the code step.
   - Six digits call `verifyEmailCode`.
   - Error messages show.
   - The resend cooldown works with fake timers.
   - Unit-test `verifyEmailCode` with `supabase.auth.verifyOtp` mocked.

**Done when:**
- [ ] The tests pass.
- [ ] Lincoln confirms on the beta site at Gate 1 that a real code works.

---

## Day 4: Sessions that last (2.2; decision D2, default yes)

### Steps
1. In `src/lib/supabase.ts` (lines 68–74):
   - **Native:** a storage adapter built on `@capacitor/preferences` (`npm install @capacitor/preferences`), with `getItem`/`setItem`/`removeItem` mapped to `Preferences.get/set/remove`. Load it lazily.
   - **Web:** `window.localStorage` (the Supabase default).
   - Remove the `sessionStorage` choice.
2. Migration: if a session exists in `sessionStorage` under the Supabase key, copy it once to the new storage so nobody is signed out by this update.
3. `authStore` sign-out already calls `supabase.auth.signOut()`. Confirm it removes the session from the new storage.
4. Append ADR 12 to `docs/DECISIONS.md`:

   > **12. Persistent sessions (2026-11).** The session token lives in `@capacitor/preferences` on native and in `localStorage` on the web, so users stay signed in across restarts. This trades a larger window if an XSS occurs (mitigated by the strict CSP and no third-party scripts) for an app that doesn't sign people out every time it closes. Revisit with a cookie-based backend if one is added.

5. Tests: on native the adapter is used (with `Preferences` mocked); on web it's `localStorage`; the one-time migration runs once.

**Done when:** you sign in, close the tab, open a new one, and you're still signed in. The tests pass.

---

## Day 5: Native helpers, part 1 (2.4)

1. Install the plugins:
   ```sh
   npm install @capacitor/status-bar @capacitor/splash-screen @capacitor/keyboard @capacitor/share
   ```
   Then run `npx cap sync`.
2. Hooks (contract #10), each modelled on `useHaptics.ts`: load the plugin with a dynamic `import()` only on native, and do nothing on the web.
   - `useStatusBarTheme()`: subscribe to `themeStore`, and call `StatusBar.setStyle` with `Style.Dark` or `Style.Light`, plus `setBackgroundColor` on Android. Mount it once in `src/App.tsx`; this is a one-line exception, so coordinate with Lane C in the handoff.
   - **Splash:** set `launchAutoHide: false` in `capacitor.config.ts`, and call `SplashScreen.hide()` once `useStoresHydrated()` (contract #2) is true. Do this from a small effect in your status-bar hook file, or in `HydrationGate` through a handoff to Lane E.
   - `useKeyboard()`: set `Keyboard.setResizeMode('body')` / `setScroll`, and expose `isOpen`. Use it so the `SetLogger` inputs aren't covered by the keyboard (coordinate with Lane D, which owns `SetLogger`).
   - `useShare()`: on native, `Share.share({ title, text, url, files })` (files need a temporary file through `@capacitor/filesystem`). On the web, the existing `navigator.share` path. Replace the share block in `WorkoutSummary.tsx` (around lines 330–370) with `useShare()`, keeping the clipboard fallback.
3. Write tests for each hook: a no-op on the web, and the plugin calls on native with the plugin mocked.

**Done when:** the hooks exist exactly as specified in contract #10, and the share flow works on the web as before.

---

## Day 6: Local notifications (2.4)

1. Run `npm install @capacitor/local-notifications`, then `npx cap sync`.
2. `useLocalNotifications()` (contract #10):
   - `requestPermission()`.
   - `scheduleRestEnd(at, body)` / `cancelRestEnd()`, using fixed id 1001.
   - `scheduleWorkoutReminders(days, hour, minute)` / `cancelWorkoutReminders()`, using ids 2001–2007, one weekly schedule per weekday.
   - On the web, all of these are no-ops. Web push is out of scope.
3. **Rest timer** (`RestTimer.tsx`):
   - When a rest starts on native, schedule "Rest over. Time for your next set." at `restTimerEndTime`.
   - Cancel it if the user skips or adjusts the timer (reschedule on adjust).
   - Ask for permission **the first time** a rest timer starts. If the user declines, never ask again; store the decision under the key `fitwizard-notif-asked`.
4. **Reminders** (Profile reminders block): a toggle "Workout reminders", day chips that default to the plan's training days, and a time picker. Save the settings through a small `preferences` entry. You may add a field to `preferencesStore` through a handoff to Lane E, or keep the settings in your own `useReminderSettings` storage key. Turning the toggle off cancels the reminders.
5. **Android:** check whether Android 13+ needs the `POST_NOTIFICATIONS` permission declared in the manifest, and whether exact alarms need `SCHEDULE_EXACT_ALARM`. Prefer inexact scheduling so that permission isn't needed. **Check the plugin docs for Capacitor 8.**
6. Tests:
   - Scheduling and cancelling call the plugin with the right ids.
   - The permission prompt appears only once.
   - Reminders follow the chosen days.

**Done when:** the tests pass. Lincoln checks a real notification on a device on Day 8.

---

## Day 7: Android CI and iOS archive guide (4.5)

1. Add an `android` job to `.github/workflows/ci.yml`:
   - `ubuntu-latest`, Node 22, Java 21 (`actions/setup-java`, Temurin).
   - Run `npm ci`, `npm run build`, `npx cap sync android`, then `cd android && ./gradlew bundleRelease`.
   - Upload `android/app/build/outputs/bundle/release/*.aab` as an artifact.
   - If `ANDROID_KEYSTORE_BASE64` and the password secrets exist, decode the keystore into `keystore.properties`. Otherwise, build unsigned and note it.
   - Run this job on pushes to `main` and `preview_b` only, not on every PR, to save minutes.
2. Write `docs/RELEASE_MOBILE.md` (an agreed exception) with exact steps for Lincoln:
   - **iOS:** `npm run build && npm run ios:sync && npm run ios:open`, then in Xcode: set the team, bump the version (Lane A has done this), Product → Archive → Distribute → App Store Connect → TestFlight.
   - **Android:** download the CI artifact, or build locally with `./gradlew bundleRelease`, then upload it to the Play closed testing track. Include the one-time Play App Signing setup and the keystore backup warning.

**Done when:** the job is green on `preview_b`, or its failure is documented, and the release doc is complete.

---

## Days 8–9: Real devices (2.7)

Lincoln runs this checklist on a real iPhone and a real Android phone using the Gate 2 builds. You fix what fails. Put the checklist in `docs/RELEASE_MOBILE.md` so it can be reused:

- [ ] Install, then onboarding, then the wizard (muscle hold-and-slide, page scroll past the map, selected list), then plan, workout and summary.
- [ ] Kill the app mid-workout and reopen it: the workout resumes. Kill it after a workout: the history is there.
- [ ] Sign in with the email code. Restart: still signed in.
- [ ] Airplane mode: log a workout, reconnect, and it syncs. A second device shows it.
- [ ] Rest-timer notification with the app in the background. A reminder fires.
- [ ] Share a workout card through the native share sheet.
- [ ] Safe areas on a notched iPhone: header, bottom sheets, consent modal.
- [ ] Android: the system back button walks back through history and exits from home.
- [ ] Keyboard: `SetLogger` inputs and the food logger stay visible.
- [ ] Dark and light mode, including the status bar.
- [ ] Haptics, the edge-swipe back gesture, and header blur (DEBT-012, DEBT-015, DEBT-026).
- [ ] Delete account. Erase guest data.

For each failure: reproduce it, fix it if it's in your files, or hand it to the owning lane with the steps to reproduce.

## Day 10: v1.2.0 native versions

- Bump the Xcode `MARKETING_VERSION` to 1.2.0 and `CURRENT_PROJECT_VERSION` by one.
- Bump Android `versionName "1.2.0"` and `versionCode` by one.
- This must merge together with Lane A's Day 10 PR.
- Update `docs/RELEASE_MOBILE.md` with anything learned in Wave 3.

---

## Day 11: Desktop PWA and Microsoft Store

1. Desktop check at 1280, 1440 and 1920 px:
   - No stretched layouts; content uses a sensible max width.
   - Keyboard: Tab order, `Esc` closes sheets, the ⌘K/Ctrl+K command palette works.
   - The installed window (Chrome/Edge "Install app") opens to `/` with the right title and icon.
   - Fix anything in your files and hand off the rest.
2. Microsoft Store: package the PWA with PWABuilder (pwabuilder.com) against the production URL. Write the steps and the required manifest fields in `docs/RELEASE_DESKTOP.md`. Lincoln uploads it to Partner Center. Check what PWABuilder currently requires: maskable icons, screenshots in the manifest, and so on. If manifest fields are needed, add them in `vite.config.ts` through a handoff to Lane D, or edit it directly if Lane D is inactive in Wave 4. That is an agreed exception.

## Day 12: Tauri wrapper for macOS (and Windows)

1. `npm install -D @tauri-apps/cli`, then `npx tauri init`:
   - The app name is FitWizard, the identifier is `com.fitwizardly.app`, `frontendDist` is `../dist`, and the dev URL is `http://localhost:8080`.
   - Commit `src-tauri/` without its `target/` directory.
2. Add a Tauri branch to `src/lib/storage/appStorage.ts` (agreed exception) using `@tauri-apps/plugin-fs` in the app-data directory. Detect Tauri with `'__TAURI_INTERNALS__' in window`.
3. Add CSP for the Tauri window in `tauri.conf.json`, mirroring `vercel.json`.
4. Add scripts `"desktop:dev": "tauri dev"` and `"desktop:build": "tauri build"`.
5. Write `docs/RELEASE_DESKTOP.md` covering macOS signing and notarisation, which needs an Apple Developer ID (L4), and the Windows installer. **The build can't be verified on Linux for macOS**: state what was and wasn't built.

**Done when:** `npm run desktop:dev` opens the app on a machine with Rust installed (Lincoln or a local session verifies), storage works, and the release doc is written.
