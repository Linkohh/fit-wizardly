# Releasing the mobile apps

> **Written 2026-11-26 (Lane H, Day 7).** Exact steps for Lincoln to ship FitWizard to TestFlight (iOS) and the Play closed testing track (Android). Store-console labels move around; if a menu name below doesn't match, search the console's help for the step's name. Nothing here was run on a Mac or uploaded to a store from the agent session.

| | iOS | Android |
|---|---|---|
| Bundle / application id | `com.fitwizardly.app` | `com.fitwizardly.app` |
| Display name | FitWizard | FitWizard |
| Version today | `MARKETING_VERSION = 1.0`, build `1` (`ios/App/App.xcodeproj/project.pbxproj`) | `versionName "1.0"`, `versionCode 1` (`android/app/build.gradle`) |
| Where it's built | Your Mac, in Xcode | GitHub Actions (`android` job in `.github/workflows/ci.yml`) or your machine |
| Needs from you | Apple Developer account (L4), team set in Xcode | Play Console account, upload keystore |

Versions move to 1.2.0 on Day 10 (Lane H, together with Lane A's release PR). Every upload needs a **higher build number** than the last one: `CURRENT_PROJECT_VERSION` on iOS, `versionCode` on Android.

---

## iOS: TestFlight

### Before the first archive (once)

1. Apple Developer Program membership is active (L4).
2. In [App Store Connect](https://appstoreconnect.apple.com) → **Apps** → **+** → **New App**: platform iOS, name FitWizard, bundle ID `com.fitwizardly.app` (register it under Certificates, Identifiers & Profiles → Identifiers first if it isn't offered), SKU of your choice.
3. Fill **App Privacy** from [`docs/store/APPLE_PRIVACY.md`](store/APPLE_PRIVACY.md). `ios/App/App/PrivacyInfo.xcprivacy` already matches it (DEBT-126).
4. Export compliance is answered in the build: `Info.plist` has `ITSAppUsesNonExemptEncryption = NO` (the app uses only HTTPS), so App Store Connect won't ask per build (DEBT-128).

### Each release

1. In the repo on your Mac:

   ```sh
   git checkout preview_b && git pull     # or main, for a production build
   npm ci
   npm run build && npm run ios:sync && npm run ios:open
   ```

   `.env` must hold the production values (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_PUBLIC_APP_ORIGIN`, plus the L6 keys if this build ships them) **before** `npm run build`, because Vite bakes them into the bundle.
2. In Xcode, select the **App** project → **App** target → **Signing & Capabilities**:
   - Tick **Automatically manage signing**.
   - **Team:** your team. `DEVELOPMENT_TEAM` is empty in the repo on purpose; Xcode writes it into `project.pbxproj`. Don't commit that change unless you want the team id in git (it isn't a secret, just noise).
3. **General** tab → **Identity**: set **Version** (for example `1.2.0`) and **Build** (one higher than the last upload). These write `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION`.
4. In the toolbar's device menu, choose **Any iOS Device (arm64)**. Archive is greyed out while a Simulator is selected.
5. **Product → Archive.** When it finishes, the Organizer window opens.
6. Select the new archive → **Distribute App** → **App Store Connect** → **Upload** (Xcode may call this **TestFlight & App Store**). Keep the defaults (upload symbols, automatic signing) → **Upload**.
7. Wait for the "processing complete" email (usually 10–30 minutes). Then App Store Connect → your app → **TestFlight**:
   - Internal testers (your own team): add them under **Internal Testing**; no review.
   - External testers: create a group, add the build; the first build goes through Beta App Review (about a day).

### If the archive fails

- "No signing certificate": Xcode → Settings → Accounts → your Apple ID → **Manage Certificates** → **+** → Apple Distribution.
- Swift packages won't resolve: File → Packages → **Reset Package Caches**, then run `npm run ios:sync` again.
- Upload rejected for a missing privacy reason: compare the email's API category with `NSPrivacyAccessedAPITypes` in `PrivacyInfo.xcprivacy` and send it to Lane H.

---

## Android: Play closed testing

### One-time setup

1. **Create the upload keystore** (on your machine, never in the repo):

   ```sh
   keytool -genkeypair -v -keystore fitwizard-release.jks -alias fitwizard \
     -keyalg RSA -keysize 2048 -validity 10000
   ```

   > [!WARNING]
   > **Back up the keystore and both passwords now**, in two places (for example a password manager plus an offline copy). With Play App Signing (next step) a lost upload key can be reset through Play support, but that takes days and blocks every update until it's done. Without Play App Signing, a lost key means you can never update the app again.

2. **Local builds:** copy `android/keystore.properties.example` to `android/keystore.properties`, put the `.jks` file in `android/`, and fill in the real passwords. Both files are git-ignored (`android/.gitignore`).
3. **CI builds:** add these four repository secrets on GitHub (Settings → Secrets and variables → Actions → **New repository secret**):

   | Secret | Value |
   |---|---|
   | `ANDROID_KEYSTORE_BASE64` | `base64 -w0 fitwizard-release.jks` (on macOS: `base64 -i fitwizard-release.jks`) |
   | `ANDROID_KEYSTORE_PASSWORD` | the store password |
   | `ANDROID_KEY_ALIAS` | `fitwizard` (or the alias you chose) |
   | `ANDROID_KEY_PASSWORD` | the key password |

   Until all four exist, the CI job builds an **unsigned** bundle and says so in a notice. Play rejects unsigned bundles, so use a local build until the secrets are in.
4. **Play Console** ([play.google.com/console](https://play.google.com/console)) → **Create app**: name FitWizard, app, free, accept the declarations.
5. **Play App Signing:** on the first upload to any track, Play offers to manage the app signing key. Accept **Let Google manage and protect your app signing key** (the default). Your keystore then becomes the *upload* key only.
6. Complete the **App content** forms (privacy policy URL, data safety, ads: none, target audience, health apps declaration) from `docs/store/`.

### Each release

1. Get a signed `.aab`, either:
   - **CI:** push to `preview_b` or `main` (or open a `lane-h/*` PR). On the run's summary page, download the **android-release-aab** artifact (kept 14 days) and unzip it to get `app-release.aab`. Check the run's notices: if it says "Unsigned Android build", the secrets aren't set.
   - **Local:**

     ```sh
     npm ci
     npm run build && npm run android:sync
     cd android && ./gradlew bundleRelease
     # output: android/app/build/outputs/bundle/release/app-release.aab
     ```

     Needs Java 21 and the Android SDK (Android Studio installs both; open it once with `npm run android:open`).
2. Bump `versionCode` (and `versionName` if it's a new version) in `android/app/build.gradle` before building if this isn't the first upload. Play refuses a `versionCode` it has seen.
3. Play Console → your app → **Test and release** → **Testing** → **Closed testing** → create a track (or use **Alpha**) → **Create new release** → upload the `.aab` → release notes → **Review release** → **Start rollout**.
4. Add testers (an email list or a Google Group) under the track's **Testers** tab and share the opt-in link.

> **The 14-day clock.** New personal Play developer accounts must run a closed test with at least 12 opted-in testers for 14 days in a row before they can apply for production. Start the closed test at Gate 2 so the clock runs during Wave 3. Check the current numbers in the Play Console help before relying on them; Google has changed them before.

---

## Device checklist

Added on Days 8–9 (Lane H brief, "Real devices").
