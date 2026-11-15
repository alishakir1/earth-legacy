import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.erth.jigsaw',
  appName: 'Earth Legacy',
  webDir: 'dist',
  backgroundColor: '#07171e',
  loggingBehavior: 'debug',
  // Retain the Android 0.5.0 origin so existing local saves remain accessible.
  server: {hostname: 'appassets.androidplatform.net', androidScheme: 'https', iosScheme: 'capacitor'},
  android: {allowMixedContent: false},
  plugins: {SystemBars: {style: 'DARK', initialViewportFitValueHint: 'cover'}},
  ios: {contentInset: 'never', preferredContentMode: 'mobile', allowsLinkPreview: false}
};
export default config;
