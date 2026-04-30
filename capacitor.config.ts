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
      appId: 'ca-app-pub-1547050289305054/8364297093', // ID de test Android
    }
  }
};

export default config;