import AsyncStorage from "@react-native-async-storage/async-storage";
import { cacheLogger as log } from "../logger";
import type { LiquorStore } from "../types";
import { asBoolean, asNumber, asRecord, asString } from "../utils/parse";

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export const storeCacheKey = (lat: number, lng: number) =>
  `places_cache_${lat.toFixed(2)},${lng.toFixed(2)}`;

type CacheEntry = { store: LiquorStore; ts: number };
const memCache = new Map<string, CacheEntry>();

const parseEntry = (value: unknown): CacheEntry | null => {
  const o = asRecord(value);
  const ts = asNumber(o?.ts);
  const store = asRecord(o?.store);
  if (ts == null || store == null) return null;

  const name = asString(store.name);
  const lat = asNumber(store.lat);
  const lng = asNumber(store.lng);
  const distance = asNumber(store.distance);
  if (name == null || lat == null || lng == null || distance == null) return null;

  return {
    ts,
    store: {
      name,
      lat,
      lng,
      distance,
      vicinity: asString(store.vicinity) ?? "",
      rating: asNumber(store.rating),
      ratingCount: asNumber(store.ratingCount),
      phone: asString(store.phone),
      openNow: asBoolean(store.openNow),
    },
  };
};

export const readStoreCache = async (key: string): Promise<LiquorStore | null> => {
  const mem = memCache.get(key);
  if (mem && Date.now() - mem.ts < CACHE_TTL_MS) return mem.store;
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const entry = parseEntry(JSON.parse(raw));
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL_MS) return null;
    memCache.set(key, entry);
    return entry.store;
  } catch (e) {
    log.warn("readStoreCache failed", e);
    return null;
  }
};

export const writeStoreCache = async (key: string, store: LiquorStore): Promise<void> => {
  const entry = { store, ts: Date.now() };
  memCache.set(key, entry);
  try {
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    log.warn("writeStoreCache failed", e);
  }
};
