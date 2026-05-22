import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fitwizardly.app',
  appName: 'Fit Wizardly',
  webDir: 'dist',
  server: {
    // When using `cap run ios -l` (or `npm run ios:live`), Capacitor injects
    // a temporary server URL automatically. No manual IP config needed.
    androidScheme: 'https',
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
