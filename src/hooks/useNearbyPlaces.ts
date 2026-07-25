import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchNearbyPlaces } from '../api/googlePlaces';
import { browseLogger as log } from '../logger';
import type { NearbyPlace, UserLocation } from '../types';

export const useNearbyPlaces = () => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const abortController = useRef<AbortController | null>(null);

  const loadPlaces = useCallback(async (lat: number, lng: number) => {
    abortController.current?.abort();
    abortController.current = new AbortController();

    setLoading(true);
    setError(null);
    try {
      setPlaces(await fetchNearbyPlaces(lat, lng, abortController.current.signal));
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

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

        if (!(await Location.hasServicesEnabledAsync())) {
          if (cancelled) return;
          setError('Location services are turned off. Please enable them in Settings.');
          return;
        }

        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (cancelled) return;
        setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      } catch (e) {
        if (cancelled) return;
        log.warn('location failed', e);
        setError(e instanceof Error ? e.message : 'Failed to get location.');
      }
    })();

    return () => {
      cancelled = true;
      abortController.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (userLocation) loadPlaces(userLocation.lat, userLocation.lng);
  }, [userLocation, loadPlaces]);

  const refresh = useCallback(() => {
    if (userLocation) loadPlaces(userLocation.lat, userLocation.lng);
  }, [userLocation, loadPlaces]);

  return { places, error, loading, refresh };
};
