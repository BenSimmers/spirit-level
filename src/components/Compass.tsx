import { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import type { LiquorStore, UserLocation } from '../types';
import { calculateBearing } from '../utils/geo';

const BRASS = '#c8960c';
const BRASS_DARK = '#6b4c00';
const BEZEL_OUTER = '#2e1a00';
const PARCHMENT = '#f0dca4';
const ROSE_LINE = '#c8a96e';
const SEPIA = '#1a0800';
const CRIMSON = '#8b0000';
const IVORY = '#e8dfc0';

interface Props {
  heading: number;
  store: LiquorStore | null;
  userLocation: UserLocation | null;
}

const { width } = Dimensions.get('window');
export const COMPASS_SIZE = Math.min(width * 0.82, 320);
const NEEDLE_HALF = COMPASS_SIZE * 0.21;

export const Compass: React.FC<Props> = ({ heading, store, userLocation }) => {
  const needleAnim = useRef(new Animated.Value(0)).current;
  const lastAngleRef = useRef(0);

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
  }, [heading, store, userLocation]);

  const rotate = needleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1deg'],
    extrapolate: 'extend',
  });

  return (
    <View style={styles.outerBezel}>
      <View style={styles.innerBezel}>
        <View style={styles.compassFace}>
          {[0, 22.5, 45, 67.5].map((angle) => (
            <View
              key={angle}
              style={[styles.roseLine, { transform: [{ rotate: `${angle}deg` }] }]}
            />
          ))}
          {Array.from({ length: 72 }).map((_, i) => {
            const deg = i * 5;
            const isCardinal = deg % 90 === 0;
            const isIntercardinal = deg % 45 === 0;
            return (
              <View
                key={i}
                style={[
                  styles.tick,
                  {
                    transform: [
                      { rotate: `${deg}deg` },
                      { translateY: -(COMPASS_SIZE / 2 - 16) },
                    ],
                    height: isCardinal ? 18 : isIntercardinal ? 12 : 6,
                    width: isCardinal ? 3 : 1.5,
                    opacity: isCardinal ? 1 : isIntercardinal ? 0.75 : 0.4,
                  },
                ]}
              />
            );
          })}

          <Text style={[styles.cardinal, styles.cardinalN]}>N</Text>
          <Text style={[styles.cardinal, styles.cardinalS]}>S</Text>
          <Text style={[styles.cardinal, styles.cardinalE]}>E</Text>
          <Text style={[styles.cardinal, styles.cardinalW]}>W</Text>

          <Animated.View style={[styles.needleWrap, { transform: [{ rotate }] }]}>
            <View style={styles.needleNorth} />
            <View style={styles.needleSouth} />
          </Animated.View>

          <View style={styles.jewelOuter}>
            <View style={styles.jewelInner} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerBezel: {
    width: COMPASS_SIZE + 22,
    height: COMPASS_SIZE + 22,
    borderRadius: (COMPASS_SIZE + 22) / 2,
    backgroundColor: BEZEL_OUTER,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.65,
    shadowRadius: 14,
    elevation: 20,
  },
  innerBezel: {
    width: COMPASS_SIZE + 10,
    height: COMPASS_SIZE + 10,
    borderRadius: (COMPASS_SIZE + 10) / 2,
    backgroundColor: BRASS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassFace: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    borderRadius: COMPASS_SIZE / 2,
    backgroundColor: PARCHMENT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: BRASS_DARK,
  },
  roseLine: {
    position: 'absolute',
    width: 1.5,
    height: COMPASS_SIZE * 0.82,
    backgroundColor: ROSE_LINE,
    opacity: 0.35,
  },
  tick: {
    position: 'absolute',
    backgroundColor: BRASS_DARK,
    top: '50%',
    left: '50%',
    marginLeft: -1,
    transformOrigin: 'top',
  },
  cardinal: {
    position: 'absolute',
    color: SEPIA,
    fontWeight: '900',
    fontSize: 22,
    letterSpacing: -0.5,
  },
  cardinalN: { top: 26 },
  cardinalS: { bottom: 26 },
  cardinalE: { right: 20 },
  cardinalW: { left: 20 },
  needleWrap: {
    position: 'absolute',
    width: NEEDLE_HALF * 0.6,
    height: NEEDLE_HALF * 2,
    alignItems: 'center',
  },
  needleNorth: {
    width: 0,
    height: 0,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderBottomWidth: NEEDLE_HALF,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: CRIMSON,
  },
  needleSouth: {
    width: 0,
    height: 0,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: NEEDLE_HALF,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: IVORY,
  },
  jewelOuter: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: BRASS,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BRASS_DARK,
  },
  jewelInner: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: BRASS_DARK,
  },
});
