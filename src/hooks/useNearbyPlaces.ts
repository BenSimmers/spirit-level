import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Location from "expo-location";
import { fetchNearbyPlaces } from "../api/googlePlaces";
import { browseLogger as log } from "../logger";
import { NETWORK_ERROR, errorMessage, isAbort } from "../utils/errors";
import { hasMovedBeyondThreshold, haversineDistance } from "../utils/geo";
import { requestLocationAccess, watchUserPosition } from "../utils/location";
import type { NearbyPlace, UserLocation } from "../types";

export const useNearbyPlaces = () => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const positionSub = useRef<Location.LocationSubscription | null>(null);
  const lastFetchedLocation = useRef<UserLocation | null>(null);
  const abortController = useRef<AbortController | null>(null);

  const loadPlaces = useCallback(async (lat: number, lng: number, force = false) => {
    const prev = lastFetchedLocation.current;
    const next = { lat, lng };
    // fetchNearbyPlaces is deliberately never cached, so without this the
    // position watch would turn every 10 m of walking into a fresh Places call.
    if (!force && prev && !hasMovedBeyondThreshold(prev, next)) {
      log.debug("skipping fetch — inside refetch threshold");
      return;
    }
    lastFetchedLocation.current = next;

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

        // Then stay subscribed, so the distances track the user as they walk.
        const sub = await watchUserPosition(setUserLocation);
        if (cancelled) {
          sub.remove();
          return;
        }
        positionSub.current = sub;
      } catch (e) {
        if (cancelled) return;
        log.warn("location failed", e);
        setError(errorMessage(e, "Failed to get location."));
      }
    })();

    return () => {
      cancelled = true;
      positionSub.current?.remove();
      abortController.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (userLocation) loadPlaces(userLocation.lat, userLocation.lng);
  }, [userLocation, loadPlaces]);

  const livePlaces = useMemo(() => {
    if (!userLocation) return places;
    return places
      .map((p) => ({
        ...p,
        distance: haversineDistance(userLocation.lat, userLocation.lng, p.lat, p.lng),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [places, userLocation]);

  const refresh = useCallback(() => {
    if (userLocation) loadPlaces(userLocation.lat, userLocation.lng, true);
  }, [userLocation, loadPlaces]);

  return { places: livePlaces, userLocation, error, loading, refresh };
};
