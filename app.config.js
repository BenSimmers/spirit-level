// Extends app.json with values that come from the environment.
// The Maps SDK for Android needs the key baked in at prebuild time;
// iOS uses Apple Maps and needs no key.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
      },
    },
  },
});
