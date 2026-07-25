import { GOOGLE_MAPS_API_KEY, SEARCH_RADIUS_M } from '../config';
import { readStoreCache, storeCacheKey, writeStoreCache } from '../cache/storeCache';
import { placesLogger as log } from '../logger';
import { PLACE_CATEGORIES } from '../types';
import type { GooglePlace, LiquorStore, NearbyPlace } from '../types';
import { haversineDistance } from '../utils/geo';

const PLACES_URL = 'https://places.googleapis.com/v1/places:searchNearby';
const FIELD_MASK = [
  'places.displayName',
  'places.location',
  'places.shortFormattedAddress',
  'places.primaryType',
  'places.rating',
  'places.userRatingCount',
  'places.nationalPhoneNumber',
  'places.currentOpeningHours.openNow',
].join(',');

// Places API (New) nearby-search types that map to bottle shops
const INCLUDED_TYPES = ['liquor_store'];

// Nearby-search results within SEARCH_RADIUS_M, across the given place types, with retry
// on transient failures (429 rate limit, 5xx, network errors).
async function searchNearby(
  userLat: number,
  userLng: number,
  includedTypes: string[],
  maxResultCount: number,
  signal: AbortSignal,
): Promise<GooglePlace[]> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Missing Google Maps API key. Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env.');
  }

  const body = JSON.stringify({
    includedTypes,
    maxResultCount,
    rankPreference: 'DISTANCE',
    locationRestriction: {
      circle: {
        center: { latitude: userLat, longitude: userLng },
        radius: SEARCH_RADIUS_M,
      },
    },
  });

  log.debug('sending query', includedTypes);
  const t0 = Date.now();

  const MAX_ATTEMPTS = 3;
  let res: Response | null = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    try {
      res = await fetch(PLACES_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': FIELD_MASK,
        },
        body,
        signal,
      });
      log.info(`attempt ${attempt} → ${res.status} in ${Date.now() - t0}ms`);
      // 429 = rate limited, 5xx = server overloaded — both transient
      if (res.status !== 429 && res.status < 500) break;
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') throw e;
      log.info(`attempt ${attempt} → network error in ${Date.now() - t0}ms`, e);
      res = null;
    }
    if (attempt === MAX_ATTEMPTS) break;
    const delay = res?.status === 429 ? 4000 : 2000;
    await new Promise<void>((resolve, reject) => {
      if (signal.aborted) { reject(new DOMException('Aborted', 'AbortError')); return; }
      const tid = setTimeout(resolve, delay);
      signal.addEventListener('abort', () => { clearTimeout(tid); reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
    });
  }

  if (!res) throw new Error('Network error. Check your connection and try again.');

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    log.warn(`Places HTTP ${res.status}`, detail);
    throw new Error(`Places HTTP ${res.status}`);
  }

  const data = (await res.json()) as { places?: GooglePlace[] };
  log.info(`places returned: ${data.places?.length ?? 0}`);
  return data.places ?? [];
}

/**
 * Fetch the nearest liquor store via the Google Places API (New).
 * @param signal     AbortSignal managed by the caller (useCompass hook).
 * @param skipCache  When true, bypasses the read cache (manual refresh).
 */
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
      log.debug('cache hit', key);
      return cached;
    }
  }

  const places = await searchNearby(userLat, userLng, INCLUDED_TYPES, 5, signal);

  // includedTypes matches places where liquor_store is ANY of their types, so
  // grocery/convenience chains that also sell alcohol (e.g. Trader Joe's) can
  // slip in. Restrict to places whose PRIMARY type is actually liquor_store.
  // rankPreference: DISTANCE means results arrive nearest-first.
  const place = places.find((p) => p.primaryType === 'liquor_store');
  if (!place?.location) {
    throw new Error(`No liquor stores found within ${SEARCH_RADIUS_M / 1000} km.`);
  }

  const { latitude: lat, longitude: lng } = place.location;
  const store: LiquorStore = {
    name: place.displayName?.text ?? 'Liquor Store',
    lat,
    lng,
    distance: haversineDistance(userLat, userLng, lat, lng),
    vicinity: place.shortFormattedAddress ?? '',
    rating: place.rating,
    ratingCount: place.userRatingCount,
    phone: place.nationalPhoneNumber,
    openNow: place.currentOpeningHours?.openNow,
  };

  await writeStoreCache(key, store);
  return store;
}

/**
 * Fetch nearby liquor stores, bars, and night clubs for the Browse screen's
 * category filter. Always fresh — not cached like fetchNearestStore.
 */
export async function fetchNearbyPlaces(
  userLat: number,
  userLng: number,
  signal: AbortSignal,
): Promise<NearbyPlace[]> {
  const places = await searchNearby(userLat, userLng, PLACE_CATEGORIES, 20, signal);

  return places
    .filter((p): p is GooglePlace & { location: { latitude: number; longitude: number } } => !!p.location)
    .map((p) => ({
      name: p.displayName?.text ?? 'Unknown',
      lat: p.location.latitude,
      lng: p.location.longitude,
      distance: haversineDistance(userLat, userLng, p.location.latitude, p.location.longitude),
      vicinity: p.shortFormattedAddress ?? '',
      rating: p.rating,
      ratingCount: p.userRatingCount,
      phone: p.nationalPhoneNumber,
      openNow: p.currentOpeningHours?.openNow,
      category: (PLACE_CATEGORIES as string[]).includes(p.primaryType ?? '')
        ? (p.primaryType as NearbyPlace['category'])
        : 'other',
    }))
    .sort((a, b) => a.distance - b.distance);
}
