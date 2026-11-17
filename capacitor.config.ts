import type { CapacitorConfig } from '@capacitor/cli';

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
};

export default config;
