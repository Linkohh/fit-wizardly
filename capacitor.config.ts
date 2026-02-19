import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fitwizardly.app',
  appName: 'Fit Wizardly',
  webDir: 'dist',
  server: {
    // When using `cap run ios --live --external`, Capacitor automatically
    // injects the server URL. No manual IP config needed.
    androidScheme: 'https',
  },
};

export default config;
