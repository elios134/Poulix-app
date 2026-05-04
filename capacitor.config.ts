import { CapacitorConfig } from '@capacitor/cli';

const admobAppId =
  process.env.ADMOB_APP_ID?.trim() ||
  'ca-app-pub-3940256099942544~3347511713';

const config: CapacitorConfig = {
  appId: 'com.poulpix',
  appName: 'Poulpix',
  webDir: 'www',
  server: {
    // androidScheme: 'https'
  },
  plugins: {
    AdMob: {
      initializeForTesting: false,
      appId: admobAppId,
    }
  }
};

export default config;