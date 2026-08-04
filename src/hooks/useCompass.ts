import * as Location from "expo-location";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated } from "react-native";
import { compassLogger as log } from "../logger";
import { NETWORK_ERROR, errorMessage, isAbort } from "../utils/errors";
import { calculateBearing, hasMovedBeyondThreshold, haversineDistance } from "../utils/geo";
import { requestLocationAccess, watchUserPosition } from "../utils/location";
import type { LiquorStore, StoreProvider, UserLocation } from "../types";

const POSITION_TIMEOUT_MS = 10_000;

const HEADING_EPSILON_DEG = 0.5;

const shortestDelta = (from: number, to: number): number => ((to - from + 540) % 360) - 180;

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T | null> =>
  Promise.race([promise, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);

export const useCompass = (storeProvider: StoreProvider) => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [store, setStore] = useState<LiquorStore | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const headingSub = useRef<Location.LocationSubscription | null>(null);
  const positionSub = useRef<Location.LocationSubscription | null>(null);
  const lastFetchedLocation = useRef<UserLocation | null>(null);
  const abortController = useRef<AbortController | null>(null);

  const needleAngle = useRef(new Animated.Value(0)).current;
  const headingRef = useRef(0);
  const bearingRef = useRef<number | null>(null);
  const lastAngleRef = useRef(0);

  const animateNeedle = useCallback(() => {
    const bearing = bearingRef.current;
    if (bearing === null) return;
    // Accumulate unwrapped degrees so the needle takes the short way round
    // instead of unwinding through 0/360.
    const next =
      lastAngleRef.current + shortestDelta(lastAngleRef.current, bearing - headingRef.current);
    lastAngleRef.current = next;
    Animated.spring(needleAngle, {
      toValue: next,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();
  }, [needleAngle]);

  const loadStore = useCallback(
    async (lat: number, lng: number, skipCache = false) => {
      const prev = lastFetchedLocation.current;
      const next = { lat, lng };
      if (!skipCache && prev && !hasMovedBeyondThreshold(prev, next)) {
        log.debug("skipping fetch — inside refetch threshold");
        return;
      }
      lastFetchedLocation.current = next;

      // Cancel any previous in-flight request
      abortController.current?.abort();
      abortController.current = new AbortController();

      setLoading(true);
      setError(null);
      try {
        setStore(await storeProvider(lat, lng, abortController.current.signal, skipCache));
      } catch (e) {
        if (isAbort(e)) return;
        setError(errorMessage(e, NETWORK_ERROR));
      } finally {
        setLoading(false);
      }
    },
    [storeProvider],
  );

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

        // Start the compass before waiting on a GPS fix
        headingSub.current = await Location.watchHeadingAsync((h) => {
          const next = h.magHeading >= 0 ? h.magHeading : (h.trueHeading ?? 0);
          if (Math.abs(shortestDelta(headingRef.current, next)) < HEADING_EPSILON_DEG) return;
          headingRef.current = next;
          animateNeedle();
        });
        if (cancelled) return;

        // Stage 0 — last known position: instant when available, may be stale
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (cancelled) return;
        if (lastKnown) {
          setUserLocation({ lat: lastKnown.coords.latitude, lng: lastKnown.coords.longitude });
        }

        // Stage 1 — fast Balanced fix, triggers store fetch immediately
        const fastLoc = await withTimeout(
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          POSITION_TIMEOUT_MS,
        );
        if (cancelled) return;
        if (fastLoc) {
          setUserLocation({ lat: fastLoc.coords.latitude, lng: fastLoc.coords.longitude });
        } else if (!lastKnown) {
          setError("Couldn’t get a GPS fix. Make sure location is enabled and try again.");
          return;
        }

        // Stage 2 — stay subscribed. The first callback is the high-accuracy fix
        // that used to be a one-shot here; every one after it is what keeps the
        // bearing and the distance readout honest as the user walks.
        const sub = await watchUserPosition(setUserLocation);
        if (cancelled) {
          sub.remove();
          return;
        }
        positionSub.current = sub;
      } catch (e) {
        if (cancelled) return;
        setError(errorMessage(e, "Failed to get location."));
      }
    })();

    return () => {
      cancelled = true;
      headingSub.current?.remove();
      positionSub.current?.remove();
      abortController.current?.abort();
    };
    // animateNeedle is stable for the hook's lifetime, so this still runs once
  }, [animateNeedle]);

  useEffect(() => {
    if (userLocation) loadStore(userLocation.lat, userLocation.lng);
  }, [userLocation, loadStore]);

  // Bearing only moves when the target or our position does — recompute here and
  useEffect(() => {
    if (!store || !userLocation) {
      bearingRef.current = null;
      return;
    }
    bearingRef.current = calculateBearing(userLocation.lat, userLocation.lng, store.lat, store.lng);
    animateNeedle();
  }, [store, userLocation, animateNeedle]);

  // `store.distance` is fixed at fetch time, and we deliberately don't refetch
  // until REFETCH_THRESHOLD_M — so recompute it against the live position rather
  // than let the readout sit on the distance from wherever the fetch happened.
  const liveStore = useMemo(() => {
    if (!store || !userLocation) return store;
    return {
      ...store,
      distance: haversineDistance(userLocation.lat, userLocation.lng, store.lat, store.lng),
    };
  }, [store, userLocation]);

  const refresh = useCallback(() => {
    if (userLocation) loadStore(userLocation.lat, userLocation.lng, true);
  }, [userLocation, loadStore]);

  return { userLocation, needleAngle, store: liveStore, error, loading, refresh };
};
