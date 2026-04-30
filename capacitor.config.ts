import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.poulpix',
  appName: 'Poulpix',
  webDir: 'www',
  server: {
    // androidScheme: 'https'
  },
  plugins: {
    AdMob: {
      initializeForTesting: true,
      appId: 'ca-app-pub-3940256099942544~3347511713', // ID de test Android
    }
  }
};

export default config;