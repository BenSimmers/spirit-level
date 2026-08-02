import { useCallback, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { fetchNearbyPlaces } from "../api/googlePlaces";
import { browseLogger as log } from "../logger";
import { NETWORK_ERROR, errorMessage, isAbort } from "../utils/errors";
import { requestLocationAccess } from "../utils/location";
import type { NearbyPlace, UserLocation } from "../types";

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
      if (isAbort(e)) return;
      setError(errorMessage(e, NETWORK_ERROR));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const access = await requestLocationAccess();
        if (cancelled) return;
        if (!access.ok) {
          setError(access.error);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      } catch (e) {
        if (cancelled) return;
        log.warn("location failed", e);
        setError(errorMessage(e, "Failed to get location."));
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

  return { places, userLocation, error, loading, refresh };
};
