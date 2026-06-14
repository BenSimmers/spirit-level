import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { fetchNearestStore } from '../api/overpass';
import type { LiquorStore, UserLocation } from '../types';

export const useCompass = () => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [heading, setHeading] = useState(0);
  const [store, setStore] = useState<LiquorStore | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const headingSub = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied. Please enable it in Settings.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });

      headingSub.current = await Location.watchHeadingAsync((h) => {
        setHeading(h.magHeading ?? h.trueHeading ?? 0);
      });
    })();

    return () => {
      headingSub.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (userLocation) loadStore(userLocation.lat, userLocation.lng);
  }, [userLocation]);

  async function loadStore(lat: number, lng: number) {
    setLoading(true);
    setError(null);
    try {
      setStore(await fetchNearestStore(lat, lng));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  function refresh() {
    if (userLocation) loadStore(userLocation.lat, userLocation.lng);
  }

  return { userLocation, heading, store, error, loading, refresh };
}
