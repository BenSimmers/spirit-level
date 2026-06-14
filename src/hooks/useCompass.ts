import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { compassLogger as log } from '../logger';
import { haversineDistance } from '../utils/geo';
import type { LiquorStore, StoreProvider, UserLocation } from '../types';

// Must match the ~1 km cache grid in storeCache.ts (toFixed(2) ≈ 1.1 km)
const REFETCH_THRESHOLD_M = 1000;

export const useCompass = (storeProvider: StoreProvider) => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [heading, setHeading] = useState(0);
  const [store, setStore] = useState<LiquorStore | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const headingSub = useRef<Location.LocationSubscription | null>(null);
  const lastFetchedLocation = useRef<UserLocation | null>(null);
  const abortController = useRef<AbortController | null>(null);

  const loadStore = useCallback(async (lat: number, lng: number, skipCache = false) => {
    const prev = lastFetchedLocation.current;
    if (!skipCache && prev) {
      const moved = haversineDistance(prev.lat, prev.lng, lat, lng);
      if (moved < REFETCH_THRESHOLD_M) {
        log.debug(`skipping fetch — only moved ${moved.toFixed(0)}m`);
        return;
      }
    }
    lastFetchedLocation.current = { lat, lng };

    // Cancel any previous in-flight request
    abortController.current?.abort();
    abortController.current = new AbortController();

    setLoading(true);
    setError(null);
    try {
      setStore(await storeProvider(lat, lng, abortController.current.signal, skipCache));
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [storeProvider]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (status !== 'granted') {
          setError('Location permission denied. Please enable it in Settings.');
          return;
        }

        // Stage 1 — fast Balanced fix (~1s), triggers store fetch immediately
        const fastLoc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        setUserLocation({ lat: fastLoc.coords.latitude, lng: fastLoc.coords.longitude });

        // Stage 2 — high-accuracy fix, silently updates if meaningfully different
        const preciseLoc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        if (cancelled) return;
        setUserLocation({ lat: preciseLoc.coords.latitude, lng: preciseLoc.coords.longitude });

        headingSub.current = await Location.watchHeadingAsync((h) => {
          setHeading(h.magHeading ?? h.trueHeading ?? 0);
        });
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to get location.');
      }
    })();

    return () => {
      cancelled = true;
      headingSub.current?.remove();
      abortController.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (userLocation) loadStore(userLocation.lat, userLocation.lng);
  }, [userLocation, loadStore]);

  const refresh = useCallback(() => {
    if (userLocation) loadStore(userLocation.lat, userLocation.lng, true);
  }, [userLocation, loadStore]);

  return { userLocation, heading, store, error, loading, refresh };
};
