const { defineCapacitorConfig } = require('@quasar/app-vite/capacitor')

module.exports = defineCapacitorConfig({
  appId: 'com.worthward.app',
  appName: 'Worthward',
  plugins: {
    FirebaseAuthentication: {
      providers: ['google.com'],
      skipNativeAuth: true,
    },
    NativePurchases: {
      // Purchases are acknowledged only after the backend has verified and granted access.
      autoFinishTransactions: false,
    },
    SplashScreen: {
      launchAutoHide: false,
      androidScaleType: 'CENTER_CROP',
    },
  },
})
