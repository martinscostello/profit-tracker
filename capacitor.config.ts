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
      scopes: ['profile', 'email', 'https://www.googleapis.com/auth/spreadsheets.readonly'],
      serverClientId: '740425791784-9fjocgu3er172e39uohspf1udq6e0are.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  },
  server: {
    androidScheme: 'http', // CRITICAL: Allow HTTP to avoid Mixed Content errors with http API
    cleartext: true,
    allowNavigation: ['*', 'http://192.168.1.200:5000']
  }
};

export default config;
