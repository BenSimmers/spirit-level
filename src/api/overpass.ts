import { SEARCH_RADIUS_M } from '../config';
import type { LiquorStore, OverpassElement } from '../types';
import { haversineDistance } from '../utils/geo';

export async function fetchNearestStore(lat: number, lng: number): Promise<LiquorStore> {
  const around = `(around:${SEARCH_RADIUS_M},${lat},${lng})`;

  const shopNodes = ['alcohol', 'liquor', 'wine']
    .map((t) => `node["shop"="${t}"]${around};`)
    .join('');

  const query =
    `[out:json][timeout:25];` +
    `(${shopNodes});` +
    `out body 50;`;

  console.log('[overpass] sending query', query);
  const t0 = Date.now();

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  console.log(`[overpass] response ${res.status} in ${Date.now() - t0}ms`);

  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
  const data = await res.json();

  if (!data.elements?.length) {
    throw new Error(`No liquor stores found within ${SEARCH_RADIUS_M / 1000} km.`);
  }

  const nearest = (data.elements as OverpassElement[])
    .map((el) => ({ el, dist: haversineDistance(lat, lng, el.lat, el.lon) }))
    .sort((a, b) => a.dist - b.dist)[0];

  const { el, dist } = nearest;
  const tags = el.tags ?? {};
  const address = [tags['addr:housenumber'], tags['addr:street'], tags['addr:city']]
    .filter(Boolean)
    .join(' ');

  return {
    name: tags.name ?? 'Liquor Store',
    lat: el.lat,
    lng: el.lon,
    distance: dist,
    vicinity: address,
  };
}
