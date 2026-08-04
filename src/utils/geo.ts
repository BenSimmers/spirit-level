import type { UserLocation } from "../types";

export const toRad = (deg: number): number => (deg * Math.PI) / 180;

export const calculateBearing = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const dLon = toRad(lon2 - lon1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);
  const bearingX = Math.sin(dLon) * Math.cos(lat2Rad);
  const bearingY =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  return (Math.atan2(bearingX, bearingY) * (180 / Math.PI) + 360) % 360;
};

export const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6_371_000; // Earth radius in metres
  const deltaLat = toRad(lat2 - lat1);
  const deltaLon = toRad(lon2 - lon1);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(deltaLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

// How far the user must travel before results are worth refetching. Kept at the
// same scale as the ~1.1 km grid in storeCacheKey, so a refetch usually lands in
// a new cache cell rather than re-reading the one we already have.
export const REFETCH_THRESHOLD_M = 1000;

export const hasMovedBeyondThreshold = (from: UserLocation, to: UserLocation): boolean =>
  haversineDistance(from.lat, from.lng, to.lat, to.lng) >= REFETCH_THRESHOLD_M;

export const formatDistance = (metres: number): string =>
  metres < 1000 ? `${Math.round(metres)} m` : `${(metres / 1000).toFixed(1)} km`;

const CARDINALS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

export type Cardinal = (typeof CARDINALS)[number];

export const bearingToCardinal = (bearing: number): Cardinal => {
  const normalised = ((bearing % 360) + 360) % 360;
  // Math.round can reach 8 (e.g. 359°), so wrap back onto the tuple.
  const i = Math.round(normalised / 45) % CARDINALS.length;
  // `?? CARDINALS[0]` keeps this total for the compiler without an assertion;
  // the modulo already guarantees the index is in range.
  return CARDINALS[i] ?? CARDINALS[0];
};
