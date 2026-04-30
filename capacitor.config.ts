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
      initializeForTesting: false,
      appId: 'ca-app-pub-1547050289305054~9520542653', // ⚠️ À remplacer par l'ID avec le tilde (~)
    }
  }
};

export default config;