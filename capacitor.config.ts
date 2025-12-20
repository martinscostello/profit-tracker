import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.profittracker.app',
  appName: 'DailyProfit',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
      backgroundColor: '#16A34A'
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '740425791784-9fjocgu3er172e39uohspf1udq6e0are.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  },
  server: {
    androidScheme: 'https',
    hostname: 'localhost',
    allowNavigation: ['*']
  }
};

export default config;
