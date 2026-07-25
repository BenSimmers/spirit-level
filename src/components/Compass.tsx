import { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import type { LiquorStore, UserLocation } from '../types';
import { colors, fonts } from '../theme';
import { bearingToCardinal, calculateBearing, formatDistance } from '../utils/geo';

interface Props {
  heading: number;
  store: LiquorStore | null;
  userLocation: UserLocation | null;
  loading?: boolean;
}

const { width } = Dimensions.get('window');
export const COMPASS_SIZE = Math.min(width * 0.68, 250);
const NEEDLE_LENGTH = COMPASS_SIZE * 0.33;

const TICK_STYLES = Array.from({ length: 72 }, (_, i) => {
  const deg = i * 5;
  const isCardinal = deg % 90 === 0;
  const isIntercardinal = deg % 45 === 0;
  return {
    transform: [
      { rotate: `${deg}deg` },
      { translateY: -(COMPASS_SIZE / 2 - 14) },
    ],
    height: isCardinal ? 14 : isIntercardinal ? 9 : 5,
    width: isCardinal ? 2 : 1,
    backgroundColor: isCardinal ? colors.secondary : 'rgba(255,255,255,0.18)',
  } as const;
});

export const Compass: React.FC<Props> = ({ heading, store, userLocation, loading = false }) => {
  const needleAnim = useRef(new Animated.Value(0)).current;
  const lastAngleRef = useRef(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse the ring while loading
  useEffect(() => {
    if (!loading) {
      pulseAnim.setValue(1);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.25, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [loading, pulseAnim]);

  useEffect(() => {
    if (!store || !userLocation) return;
    const bearing = calculateBearing(userLocation.lat, userLocation.lng, store.lat, store.lng);
    const raw = bearing - heading;
    const prev = lastAngleRef.current;
    const delta = ((raw - prev + 540) % 360) - 180;
    const next = prev + delta;
    lastAngleRef.current = next;
    Animated.spring(needleAnim, {
      toValue: next,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();
  }, [heading, needleAnim, store, userLocation]);

  const rotate = needleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1deg'],
    extrapolate: 'extend',
  });

  // Absolute (not heading-relative) direction, so the label doesn't flicker as the phone turns
  const targetLabel = useMemo(() => {
    if (!store || !userLocation) return null;
    const bearing = calculateBearing(userLocation.lat, userLocation.lng, store.lat, store.lng);
    return `${formatDistance(store.distance)} · ${bearingToCardinal(bearing)}`;
  }, [store, userLocation]);

  return (
    <View style={styles.wrap}>
      {loading && (
        <Animated.View
          style={[styles.loadingRing, { opacity: pulseAnim }]}
          pointerEvents="none"
        />
      )}
      <View style={styles.compassFace}>
        {TICK_STYLES.map((tickStyle, i) => (
          <View key={i} style={[styles.tick, tickStyle]} />
        ))}

        <Text style={[styles.cardinal, styles.cardinalN]}>N</Text>
        <Text style={[styles.cardinal, styles.cardinalMuted, styles.cardinalS]}>S</Text>
        <Text style={[styles.cardinal, styles.cardinalMuted, styles.cardinalE]}>E</Text>
        <Text style={[styles.cardinal, styles.cardinalMuted, styles.cardinalW]}>W</Text>

        <Animated.View style={[styles.needle, { transform: [{ rotate }] }]} />
        <View style={styles.pivot} />

        {targetLabel && (
          <View style={styles.labelPill} pointerEvents="none">
            <Text style={styles.labelText}>{targetLabel}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: COMPASS_SIZE + 16,
    height: COMPASS_SIZE + 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  loadingRing: {
    position: 'absolute',
    width: COMPASS_SIZE + 16,
    height: COMPASS_SIZE + 16,
    borderRadius: (COMPASS_SIZE + 16) / 2,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  compassFace: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    borderRadius: COMPASS_SIZE / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  tick: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -1,
    transformOrigin: 'top',
  },
  cardinal: {
    position: 'absolute',
    fontFamily: fonts.headlineSemi,
    fontSize: 18,
    color: colors.primary,
  },
  cardinalMuted: {
    color: colors.muted,
  },
  cardinalN: { top: 22 },
  cardinalS: { bottom: 22 },
  cardinalE: { right: 18 },
  cardinalW: { left: 18 },
  needle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 2.5,
    height: NEEDLE_LENGTH,
    marginLeft: -1.25,
    marginTop: -NEEDLE_LENGTH,
    backgroundColor: colors.primary,
    borderRadius: 1.5,
    transformOrigin: 'bottom',
  },
  pivot: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 16,
    height: 16,
    marginTop: -8,
    marginLeft: -8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  labelPill: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: colors.surfaceAlt + 'ee',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  labelText: {
    color: colors.headline,
    fontFamily: fonts.labelBold,
    fontSize: 12,
    letterSpacing: 0.3,
  },
});
