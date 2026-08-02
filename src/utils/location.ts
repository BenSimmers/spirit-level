import * as Location from "expo-location";

type LocationAccess = { ok: true } | { ok: false; error: string };

// Both location hooks need this same preamble before any position call.
export const requestLocationAccess = async (): Promise<LocationAccess> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    return { ok: false, error: "Location permission denied. Please enable it in Settings." };
  }
  // On Android, permission can be granted while the device-wide location
  // toggle is off — getCurrentPositionAsync then hangs forever.
  if (!(await Location.hasServicesEnabledAsync())) {
    return {
      ok: false,
      error: "Location services are turned off. Please enable them in Settings.",
    };
  }
  return { ok: true };
};
