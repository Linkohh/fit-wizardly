# iOS Development Guide

This guide explains how to run Fit Wizardly on iOS using Capacitor with live reload support.

## Prerequisites

- **macOS** with Xcode installed (iOS development requires a Mac)
- **Xcode Command Line Tools**: `xcode-select --install`
- **iOS Simulator** or a physical iOS device
- **Node.js** and project dependencies installed

## Quick Start

### First-Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Build the web app
npm run build

# 3. Sync to iOS project
npm run ios:sync

# 4. Open Xcode (optional, for native configuration)
npm run ios:open
```

### Daily Development Workflow

Run both web and iOS simultaneously for the best development experience:

```bash
# Terminal 1: Start the web dev server
npm run dev

# Terminal 2: Run iOS with live reload
npm run ios:dev
```

Changes to your React code will automatically reload in the iOS Simulator.

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run ios:dev` | Run iOS app with live reload (connects to dev server) |
| `npm run ios:open` | Open the iOS project in Xcode |
| `npm run ios:sync` | Sync web assets and plugins to iOS |

## How Live Reload Works

When you run `npm run ios:dev`:

1. Capacitor launches the iOS Simulator
2. The app connects to your local dev server (from `npm run dev`)
3. Any changes you make are instantly reflected in the app
4. No need to rebuild or reinstall

The `--external` flag makes your dev server accessible to the iOS Simulator over the network.

## Running on a Physical Device

1. Connect your iOS device via USB
2. Open Xcode: `npm run ios:open`
3. Select your device as the target
4. Trust the developer certificate on your device (Settings > General > Device Management)
5. Run from Xcode or use: `npm run ios:dev`

## Troubleshooting

### App shows blank screen

1. Ensure `npm run dev` is running
2. Check that your Mac's firewall allows connections
3. Verify the dev server is accessible: visit `http://localhost:8080` in Safari

### Live reload not working

1. Restart both `npm run dev` and `npm run ios:dev`
2. Reset the iOS Simulator: Device > Erase All Content and Settings
3. Re-sync: `npm run ios:sync`

### Build errors in Xcode

1. Clean the build: Product > Clean Build Folder (Cmd+Shift+K)
2. Re-sync: `npm run ios:sync`
3. Update CocoaPods (if used): `cd ios/App && pod install`

### Network issues on device

For physical devices, ensure your Mac and iPhone are on the same network. The `--external` flag binds the server to your machine's IP address.

## Project Structure

```
ios/
├── App/
│   ├── App/
│   │   ├── Info.plist          # iOS app configuration
│   │   ├── AppDelegate.swift   # App lifecycle
│   │   └── Assets.xcassets/    # App icons and images
│   └── App.xcodeproj/          # Xcode project
└── debug.xcconfig              # Debug build settings
```

## Configuration

### capacitor.config.ts

The Capacitor configuration is in the project root:

```typescript
const config: CapacitorConfig = {
  appId: 'com.fitwizardly.app',
  appName: 'Fit Wizardly',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};
```

When using `--live --external`, Capacitor automatically configures the server URL.

### Info.plist

Located at `ios/App/App/Info.plist`. Key settings:

- **NSAppTransportSecurity**: Allows HTTP connections for local development
- **CFBundleDisplayName**: App name shown on device
- **UISupportedInterfaceOrientations**: Portrait and landscape support

## Building for Production

```bash
# 1. Create production build
npm run build

# 2. Sync to iOS
npm run ios:sync

# 3. Open Xcode
npm run ios:open

# 4. Archive and distribute from Xcode
# Product > Archive
```

## Additional Resources

- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [Xcode Documentation](https://developer.apple.com/documentation/xcode)
- [App Store Connect](https://appstoreconnect.apple.com)
