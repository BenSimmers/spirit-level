import { GOOGLE_MAPS_API_KEY, SEARCH_RADIUS_M } from "../config";
import { readStoreCache, storeCacheKey, writeStoreCache } from "../cache/storeCache";
import { placesLogger as log } from "../logger";
import { PLACE_CATEGORIES, isPlaceCategory } from "../types";
import type { GooglePlace, LiquorStore, NearbyPlace } from "../types";
import { NETWORK_ERROR, isAbort } from "../utils/errors";
import { haversineDistance } from "../utils/geo";
import { asArray, asBoolean, asNumber, asRecord, asString } from "../utils/parse";

const PLACES_URL = "https://places.googleapis.com/v1/places:searchNearby";

const FIELD_MASK = [
  "places.displayName",
  "places.location",
  "places.shortFormattedAddress",
  "places.primaryType",
  "places.rating",
  "places.userRatingCount",
  "places.nationalPhoneNumber",
  "places.currentOpeningHours.openNow",
].join(",");

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;
const RATE_LIMIT_DELAY_MS = 4000;

// Hermes doesn't reliably expose DOMException; this shape is what isAbort() checks for.
const abortError = (): Error => Object.assign(new Error("Aborted"), { name: "AbortError" });

// 429 = rate limited, 5xx = server overloaded — both worth another attempt
const isTransient = (status: number): boolean => status === 429 || status >= 500;

// Parsed, not asserted. Beyond dropping the cast, this is what stops a malformed
// or partial `location` from reaching haversineDistance and yielding a NaN
// distance that then sorts unpredictably and renders as "NaN m".
const parsePlace = (value: unknown): GooglePlace | undefined => {
  const o = asRecord(value);
  if (!o) return undefined;

  const name = asString(asRecord(o.displayName)?.text);
  const location = asRecord(o.location);
  const latitude = asNumber(location?.latitude);
  const longitude = asNumber(location?.longitude);
  const hours = asRecord(o.currentOpeningHours);

  return {
    displayName: name != null ? { text: name } : undefined,
    location: latitude != null && longitude != null ? { latitude, longitude } : undefined,
    shortFormattedAddress: asString(o.shortFormattedAddress),
    primaryType: asString(o.primaryType),
    rating: asNumber(o.rating),
    userRatingCount: asNumber(o.userRatingCount),
    nationalPhoneNumber: asString(o.nationalPhoneNumber),
    currentOpeningHours: hours != null ? { openNow: asBoolean(hours.openNow) } : undefined,
  };
};

const delay = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal.aborted) return reject(abortError());
    const onAbort = () => {
      clearTimeout(tid);
      reject(abortError());
    };
    const tid = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal.addEventListener("abort", onAbort, { once: true });
  });

type Located = GooglePlace & { location: NonNullable<GooglePlace["location"]> };

const hasLocation = (p: GooglePlace): p is Located => p.location != null;

const toStore = (
  p: Located,
  userLat: number,
  userLng: number,
  fallbackName: string,
): LiquorStore => ({
  name: p.displayName?.text ?? fallbackName,
  lat: p.location.latitude,
  lng: p.location.longitude,
  distance: haversineDistance(userLat, userLng, p.location.latitude, p.location.longitude),
  vicinity: p.shortFormattedAddress ?? "",
  rating: p.rating,
  ratingCount: p.userRatingCount,
  phone: p.nationalPhoneNumber,
  openNow: p.currentOpeningHours?.openNow,
});

// Returns the last response even when every attempt failed, so the caller can
// report the real status instead of a generic network error.
async function postWithRetry(body: string, signal: AbortSignal): Promise<Response> {
  const t0 = Date.now();
  let last: Response | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (signal.aborted) throw abortError();
    try {
      last = await fetch(PLACES_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
          "X-Goog-FieldMask": FIELD_MASK,
        },
        body,
        signal,
      });
      log.info(`attempt ${attempt} → ${last.status} in ${Date.now() - t0}ms`);
      if (!isTransient(last.status)) return last;
    } catch (e) {
      if (isAbort(e)) throw e;
      log.info(`attempt ${attempt} → network error in ${Date.now() - t0}ms`, e);
      last = null;
    }
    if (attempt < MAX_ATTEMPTS) {
      await delay(last?.status === 429 ? RATE_LIMIT_DELAY_MS : RETRY_DELAY_MS, signal);
    }
  }

  if (!last) throw new Error(NETWORK_ERROR);
  return last;
}

// Nearest-first results within SEARCH_RADIUS_M, across the given place types.
async function searchNearby(
  userLat: number,
  userLng: number,
  includedTypes: readonly string[],
  maxResultCount: number,
  signal: AbortSignal,
): Promise<GooglePlace[]> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("Missing Google Maps API key. Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env.");
  }

  log.debug("sending query", includedTypes);
  const res = await postWithRetry(
    JSON.stringify({
      includedTypes,
      maxResultCount,
      rankPreference: "DISTANCE",
      locationRestriction: {
        circle: { center: { latitude: userLat, longitude: userLng }, radius: SEARCH_RADIUS_M },
      },
    }),
    signal,
  );

  if (!res.ok) {
    log.warn(`Places HTTP ${res.status}`, await res.text().catch(() => ""));
    throw new Error(`Places HTTP ${res.status}`);
  }

  const body: unknown = await res.json();
  const places = asArray(asRecord(body)?.places).flatMap((p) => parsePlace(p) ?? []);
  log.info(`places returned: ${places.length}`);
  return places;
}

/** Nearest liquor store, cached per ~1 km grid cell. `skipCache` forces a fresh fetch. */
export async function fetchNearestStore(
  userLat: number,
  userLng: number,
  signal: AbortSignal,
  skipCache = false,
): Promise<LiquorStore> {
  const key = storeCacheKey(userLat, userLng);

  if (!skipCache) {
    const cached = await readStoreCache(key);
    if (cached) {
      log.debug("cache hit", key);
      return cached;
    }
  }

  const places = await searchNearby(userLat, userLng, ["liquor_store"], 5, signal);

  // includedTypes matches places where liquor_store is ANY of their types, so
  // grocery/convenience chains that also sell alcohol (e.g. Trader Joe's) can
  // slip in. Restrict to places whose PRIMARY type is liquor_store — DISTANCE
  // ranking means the first survivor is the nearest.
  const place = places.filter(hasLocation).find((p) => p.primaryType === "liquor_store");
  if (!place) throw new Error(`No liquor stores found within ${SEARCH_RADIUS_M / 1000} km.`);

  const store = toStore(place, userLat, userLng, "Liquor Store");
  await writeStoreCache(key, store);
  return store;
}

/** All nearby venues for the Browse screen's category filter. Always fresh — never cached. */
export async function fetchNearbyPlaces(
  userLat: number,
  userLng: number,
  signal: AbortSignal,
): Promise<NearbyPlace[]> {
  const places = await searchNearby(userLat, userLng, PLACE_CATEGORIES, 20, signal);

  return places
    .filter(hasLocation)
    .map(
      (p): NearbyPlace => ({
        ...toStore(p, userLat, userLng, "Unknown"),
        category: isPlaceCategory(p.primaryType) ? p.primaryType : "other",
      }),
    )
    .sort((a, b) => a.distance - b.distance);
}
