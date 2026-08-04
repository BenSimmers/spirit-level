import * as Location from "expo-location";
import type { UserLocation } from "../types";

type LocationAccess = { ok: true } | { ok: false; error: string };

// Walking pace is ~1.4 m/s, so these keep the distance readouts moving without
// waking the GPS harder than the UI can justify.
const POSITION_DISTANCE_INTERVAL_M = 10;

const POSITION_TIME_INTERVAL_MS = 5_000;

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

// Both hooks need the same thing once permission is granted: a high-accuracy
// stream of positions, in our own shape, until the subscription is removed.
export const watchUserPosition = (
  onChange: (location: UserLocation) => void,
): Promise<Location.LocationSubscription> =>
  Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      distanceInterval: POSITION_DISTANCE_INTERVAL_M,
      timeInterval: POSITION_TIME_INTERVAL_MS,
    },
    (l) => onChange({ lat: l.coords.latitude, lng: l.coords.longitude }),
  );
