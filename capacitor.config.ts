import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.poulpix',
  appName: 'Poulpix',
  webDir: 'www',
  server: {
    // androidScheme: 'https'
  },
  plugins: {
    // AdMob — décommenter et remplir avec tes vrais IDs
    // AdMob: {
    //   appId: {
    //     android: 'ca-app-pub-XXXXXXXX~XXXXXXXXXX',
    //     ios:     'ca-app-pub-XXXXXXXX~XXXXXXXXXX',
    //   }
    // }
  }
};

export default config;
