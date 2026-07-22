import AsyncStorage from '@react-native-async-storage/async-storage';
import { cacheLogger as log } from '../logger';
import type { LiquorStore } from '../types';

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// toFixed(2) ≈ 1.1 km grid — keep in sync with REFETCH_THRESHOLD_M in useCompass
export const storeCacheKey = (lat: number, lng: number) =>
    `places_cache_${lat.toFixed(2)},${lng.toFixed(2)}`;

// In-memory layer so repeated calls within a session are instant
const memCache = new Map<string, { store: LiquorStore; ts: number }>();

export const readStoreCache = async (key: string): Promise<LiquorStore | null> => {
    const mem = memCache.get(key);
    if (mem && Date.now() - mem.ts < CACHE_TTL_MS) return mem.store;
    try {
        const raw = await AsyncStorage.getItem(key);
        if (!raw) return null;
        const { store, ts } = JSON.parse(raw) as { store: LiquorStore; ts: number };
        if (Date.now() - ts > CACHE_TTL_MS) return null;
        memCache.set(key, { store, ts });
        return store;
    } catch (e) {
        log.warn('readStoreCache failed', e);
        return null;
    }
}

export const writeStoreCache = async (key: string, store: LiquorStore): Promise<void> => {
    const entry = { store, ts: Date.now() };
    memCache.set(key, entry);
    try {
        await AsyncStorage.setItem(key, JSON.stringify(entry));
    } catch (e) {
        log.warn('writeStoreCache failed', e);
    }
}
