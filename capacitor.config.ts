/// <reference types="@capacitor/splash-screen" />
import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.fitwizardly.app',
  appName: 'FitWizard',
  webDir: 'dist',
  server: {
    // When using `cap run ios -l` (or `npm run ios:live`), Capacitor injects
    // a temporary server URL automatically. No manual IP config needed.
    androidScheme: 'https',
  },
  // CapacitorHttp is intentionally NOT enabled (roadmap F-05). With it on, every
  // window.fetch/XHR on native was rerouted through the native HTTP stack, which
  // bypasses CORS and the WebView's normal request handling. Requests now go
  // through the WebView like on the web, so cross-origin hosts must send CORS
  // headers (see docs/project/handoffs/2026-11-17-lane-h-day-1.md for wger).
  plugins: {
    SplashScreen: {
      // Hidden by useStatusBarTheme() once the persisted stores have loaded,
      // so people never see a blank WebView or the loading screen flash.
      launchAutoHide: false,
      showSpinner: false,
    },
    Keyboard: {
      // iOS: shrink only <body> when the keyboard opens, so fixed headers
      // stay put and inputs can be scrolled into view (useKeyboard).
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
