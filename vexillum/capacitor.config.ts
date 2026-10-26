import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.funwithflags.app',
  appName: "Clark Galloway's Vexillum",
  webDir: 'dist',
  backgroundColor: '#020617',
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#020617',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#020617',
    },
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
