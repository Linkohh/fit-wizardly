# iOS development guide

How to build and run FitWizard on iOS with Capacitor, in the Simulator or on an iPhone, with or without live reload.

> This guide replaces the old root file `IOS_XCODE_COMPATIBILITY.md` (merged here on 2026-11-17). Release steps (signing, archive, TestFlight) belong in Lane H's mobile release doc once it exists.

## The app at a glance

| Setting | Value | Where it's set |
|---|---|---|
| Display name | **FitWizard** | `capacitor.config.ts` (`appName`), `ios/App/App/Info.plist` (`CFBundleDisplayName`) |
| Bundle ID | `com.fitwizardly.app` (kept from the original name on purpose) | `capacitor.config.ts` (`appId`) |
| Devices | **iPhone only** | `project.pbxproj`: `TARGETED_DEVICE_FAMILY = 1` |
| Orientation | **Portrait only** | `Info.plist`: `UISupportedInterfaceOrientations` lists only `UIInterfaceOrientationPortrait` |
| Minimum iOS | 15.0 | `project.pbxproj` (`IPHONEOS_DEPLOYMENT_TARGET`), `ios/App/CapApp-SPM/Package.swift` |
| Native dependencies | **Swift Package Manager** (no CocoaPods) | `ios/App/CapApp-SPM/Package.swift` |
| Web assets | `dist/` | `capacitor.config.ts` (`webDir`) |
| Privacy manifest | `ios/App/App/PrivacyInfo.xcprivacy` | See [`store/DATA_INVENTORY.md`](store/DATA_INVENTORY.md) for what it must match |

## Prerequisites

- A Mac with Xcode installed from the Mac App Store. iOS builds cannot run on Linux or Windows.
- Xcode command line tools: `xcode-select --install`.
- Node 22 and the project's dependencies: `npm ci`.
- An iOS Simulator (installed with Xcode) or an iPhone.

You don't need CocoaPods. Native plugins are Swift packages. `npx cap sync ios` keeps `ios/App/CapApp-SPM/Package.swift` up to date, and Xcode resolves the packages when it opens the project. Don't edit `Package.swift` by hand; the Capacitor CLI manages it.

## Commands

Every command below is a script in `package.json`.

| Command | Runs | What it does |
|---|---|---|
| `npm run dev` | `vite` | Starts the web dev server on `http://localhost:8080` (localhost only) |
| `npm run build` | `vite build` | Builds the web app into `dist/` |
| `npm run ios:sync` | `npx cap sync ios` | Copies `dist/` into the iOS project and updates the native plugin list. Run it after `npm run build` and after adding or removing a Capacitor plugin |
| `npm run ios:open` | `npx cap open ios` | Opens the Xcode project. Use it for signing, icons, permissions, devices and archives |
| `npm run ios:dev` | `npx cap run ios` | Syncs, then installs and launches the **bundled** app from `dist/` on a Simulator or device you pick. No dev server is involved, so it can't show a blank screen from a missing server. It does **not** run `npm run build`, so build first |
| `npm run ios:live` | `node scripts/dev-ios-live.mjs` | Live reload. Starts Vite with `--host ::` (or reuses a server already on port 8080), waits for it, then runs `npx cap run ios -l` pointed at the Mac's LAN address, so it works on the Simulator and on an iPhone on the same Wi-Fi. Ctrl+C stops both |
| `npm run ios:live:cap` | `npx cap run ios -l --host=localhost --port=8080` | **Simulator only** (an iPhone can't reach `localhost` on the Mac). Run it on its own only when Vite is already running |
| `npm run dev:ios` | `node scripts/dev-ios-live.mjs` | Alias of `ios:live` |

`node scripts/dev-ios-live.mjs --help` prints the script's own usage notes.

## First-time setup

```bash
npm ci
npm run build
npm run ios:sync
npm run ios:open    # optional: lets Xcode resolve the Swift packages once
```

## Choosing a workflow

### Web browser (fastest UI work)

```bash
npm run dev
```

Open `http://localhost:8080`. Use this for anything that doesn't need a native API.

### Bundled app in the Simulator (recommended for native features)

```bash
npm run build
npm run ios:dev
```

Pick a Simulator when prompted. The app runs from the files in `dist/`, exactly as it will ship. Rebuild and rerun to see changes.

### Live reload in the Simulator

```bash
npm run ios:live
```

The script starts the dev server and launches the app pointed at it. Code changes reload in the Simulator without reinstalling. If `npm run dev` is already running, the script reuses it.

### On an iPhone

1. Connect the iPhone by USB (or pair it in Xcode over the network).
2. Run `npm run build && npm run ios:sync`, then `npm run ios:open`.
3. In Xcode, choose your iPhone as the run destination. Under the App target's **Signing & Capabilities**, select your team. The team is not stored in the repository on purpose.
4. Press Run. The first time, trust the developer certificate on the iPhone: Settings → General → VPN & Device Management.

`npm run ios:dev` also works once signing is set up; pick the iPhone from its list.

Live reload on a physical iPhone is **not verified yet**. `npm run ios:live` now gives Capacitor the Mac's LAN address (for example `192.168.1.20`) instead of `localhost` whenever the dev server listens on it, so the iPhone can reach the dev server as long as both are on the same Wi-Fi and the network allows device-to-device traffic (guest and office networks often don't). If it reuses a Vite server that is localhost-only (a plain `npm run dev`), it falls back to `localhost` and warns: the Simulator still works, and for an iPhone you restart that server with `npm run dev -- --host ::`. `npm run ios:live:cap` still uses `localhost` and works only in the Simulator. Until someone checks this on a device, the bundled build is the safe choice on a phone.

## Auth email (sign-in code)

The app signs people in with one email that holds both a magic link and a 6-digit code. On the web either works. The native app has no deep links, so **the code is the only way in on iPhone and Android**: if the email has no code, nobody can sign in from the app.

One-time setup in the Supabase dashboard (decision L11). The setting names below are from memory and couldn't be checked from the build environment, so **confirm each one in the dashboard**:

1. **Authentication → Email Templates → Magic Link.** Add the code to the body, near the top, for example:
   ```html
   <h2>Your FitWizard code: {{ .Token }}</h2>
   <p>Enter it in the app, or tap the link below on this device.</p>
   <p><a href="{{ .ConfirmationURL }}">Sign in to FitWizard</a></p>
   ```
   Keep the `{{ .ConfirmationURL }}` link for web users. Set the subject to something like "Your FitWizard sign-in code".
2. **Code length:** under Authentication → Providers → Email (or Authentication → Sign In / Providers), find **Email OTP Length** and check it is **6**. The app's input has exactly six boxes.
3. **Code lifetime:** in the same place, set **Email OTP Expiration** to **600** seconds (10 minutes). The app uses 10 minutes to tell "expired" from "wrong" (`EMAIL_CODE_TTL_MS` in `src/components/auth/EmailCodeStep.tsx`), because Supabase returns the same error for both. If you choose another value, change that constant too.
4. **Resend limit:** the app's "Resend code" button waits 60 seconds, which matches Supabase's usual limit of one email per address per 60 seconds. Check Authentication → Rate Limits if resends fail.
5. **Custom domain (L3):** when the production domain is added, also add it to **`ALLOWED_ORIGINS`** in the Vercel project (Production and Preview). Otherwise every `/api/*` call from that domain gets a 403 (DEBT-075). Also add the domain under Authentication → URL Configuration (Site URL and Redirect URLs) so the magic link returns to it.
6. **Test:** on the beta site, sign in with a real address. The email should show the code and the link, and typing the code should sign you in. Then do the same in the iOS or Android app.

## Troubleshooting

### The build fails

Run `npm run ios:open`, then Product → Clean Build Folder (Shift+Cmd+K), and build again in Xcode to see the exact error.

### Swift packages won't resolve

In Xcode: File → Packages → Reset Package Caches, then File → Packages → Resolve Package Versions. If a plugin is missing from the package list, run `npm run ios:sync` again.

### A new plugin doesn't work

Stop any running dev server, run `npm run build && npm run ios:sync`, then run the app again. Native plugin code is only picked up by a sync.

### Blank screen with live reload

1. Check that the dev server answers at `http://localhost:8080` in Safari on the Mac.
2. Stop everything and run `npm run ios:live` again. It starts the server itself if none is running.
3. If it's still blank, use the bundled build (`npm run build && npm run ios:dev`) to rule out the dev server.

### Live reload stops updating

Restart `npm run ios:live`. If that doesn't help, reset the Simulator (Device → Erase All Content and Settings) and run `npm run ios:sync`.

## Project structure

```
ios/
├── App/
│   ├── App/
│   │   ├── AppDelegate.swift      # App lifecycle
│   │   ├── SceneDelegate.swift    # Scene lifecycle
│   │   ├── Info.plist             # Name, orientation, permission strings
│   │   ├── PrivacyInfo.xcprivacy  # Apple privacy manifest
│   │   ├── Assets.xcassets/       # App icon and images
│   │   └── Base.lproj/            # Launch screen and storyboard
│   ├── App.xcodeproj/             # Xcode project
│   └── CapApp-SPM/                # Swift package that pulls in Capacitor and its plugins (managed by the CLI)
└── debug.xcconfig                 # Debug build settings (CAPACITOR_DEBUG)
```

Generated files that are git-ignored: `App/App/public` (the copied web assets), `App/App/capacitor.config.json`, `App/App/config.xml` and `DerivedData`.

## Configuration

### `capacitor.config.ts`

Lives in the project root. It sets `appId`, `appName` (`FitWizard`) and `webDir` (`dist`). When you run with `-l` (live reload), Capacitor injects the dev server address for that run only; nothing in the file needs changing.

`CapacitorHttp` is deliberately **off**. Requests on iOS go through the WebView, as on the web, so cross-origin hosts must send CORS headers.

### `Info.plist`

At `ios/App/App/Info.plist`. Key settings:

- `CFBundleDisplayName`: `FitWizard`, the name under the icon.
- `UISupportedInterfaceOrientations`: portrait only. There is no iPad orientation list, because the app is iPhone-only.
- `UIRequiredDeviceCapabilities`: `arm64`.
- `NSMotionUsageDescription`: the permission text for motion access.
- There is no `NSAppTransportSecurity` exception. All production traffic is HTTPS.

## Building for the App Store

```bash
npm run build
npm run ios:sync
npm run ios:open
```

Then in Xcode: set the signing team, choose "Any iOS Device (arm64)" as the destination, and use Product → Archive. Before uploading, right-click the archive in the Organizer and choose **Generate Privacy Report**. Check that it matches the privacy manifest and [`store/DATA_INVENTORY.md`](store/DATA_INVENTORY.md).

## More reading

- [Capacitor iOS documentation](https://capacitorjs.com/docs/ios)
- [Capacitor and Swift Package Manager](https://capacitorjs.com/docs/ios/spm)
- [Xcode documentation](https://developer.apple.com/documentation/xcode)
- [App Store Connect](https://appstoreconnect.apple.com)
