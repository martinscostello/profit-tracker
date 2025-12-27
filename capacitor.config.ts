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
      serverClientId: '104181077468-lemhostdlkt6pc4om5fr1o77tvhqebup.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  },
  server: {
    androidScheme: 'http', // CRITICAL: Allow HTTP to avoid Mixed Content errors with http API
    cleartext: true,
    allowNavigation: ['*', 'http://192.168.1.181:3001', 'http://10.0.2.2:3001', 'http://localhost:3001']
  }
};

export default config;
