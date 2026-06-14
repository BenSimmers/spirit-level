import { SEARCH_RADIUS_M } from '../config';
import { readStoreCache, storeCacheKey, writeStoreCache } from '../cache/storeCache';
import { overpassLogger as log } from '../logger';
import type { LiquorStore, OverpassElement } from '../types';
import { haversineDistance } from '../utils/geo';

/**
 * Fetch the nearest liquor store via the Overpass API.
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

  const around = `(around:${SEARCH_RADIUS_M},${userLat},${userLng})`;

  const shopTypes = ['alcohol', 'liquor', 'wine', 'beer', 'bottle'];
  const shopNodes = shopTypes
    .map((t) => `node["shop"="${t}"]${around};way["shop"="${t}"]${around};`)
    .join('');

  const query = `[out:json][timeout:25];(${shopNodes});out center;`;

  log.debug('sending query');
  const t0 = Date.now();

  let res!: Response;
  for (let attempt = 1; attempt <= 3; attempt++) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal,
    });
    log.info(`attempt ${attempt} → ${res.status} in ${Date.now() - t0}ms`);
    if (res.status !== 429) break;
    await new Promise<void>((resolve, reject) => {
      if (signal.aborted) { reject(new DOMException('Aborted', 'AbortError')); return; }
      const tid = setTimeout(resolve, 4000);
      signal.addEventListener('abort', () => { clearTimeout(tid); reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
    });
  }

  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
  const data = await res.json();
  log.info(`elements returned: ${data.elements?.length ?? 0}`, data.remark ?? '');

  if (!data.elements?.length) {
    throw new Error(`No liquor stores found within ${SEARCH_RADIUS_M / 1000} km.`);
  }

  const nearest = (data.elements as OverpassElement[])
    .map((el) => {
      // ways return center coords; nodes return lat/lon directly
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (lat == null || lon == null) return null;
      return { el, lat, lon, dist: haversineDistance(userLat, userLng, lat, lon) };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.dist - b.dist)[0];

  if (!nearest) throw new Error(`No liquor stores found within ${SEARCH_RADIUS_M / 1000} km.`);

  const { el, lat: elLat, lon: elLon, dist } = nearest;
  const tags = el.tags ?? {};
  const address = [tags['addr:housenumber'], tags['addr:street'], tags['addr:city']]
    .filter(Boolean)
    .join(' ');

  const store: LiquorStore = {
    name: tags.name ?? 'Liquor Store',
    lat: elLat,
    lng: elLon,
    distance: dist,
    vicinity: address,
  };

  await writeStoreCache(key, store);
  return store;
}

