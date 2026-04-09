import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.golfmaps.app",
  appName: "GolfMaps",
  webDir: "dist",
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
    // Required so the app can hit the Fly-hosted course API from WKWebView.
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 800,
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
      backgroundColor: "#F5F0E8",
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
    Camera: {
      // Used by the scorecard uploader. iOS will prompt for permission the
      // first time the user taps "Upload scorecard photo".
      permissions: ["camera", "photos"],
    },
  },
  server: {
    androidScheme: "https",
    iosScheme: "capacitor",
  },
};

export default config;
