import React, { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import type { LiquorStore, UserLocation } from '../types';
import { colors, fonts } from '../theme';
import { formatDistance } from '../utils/geo';
import { openInMaps } from './StoreCard';

type Props = {
    store: LiquorStore;
    userLocation: UserLocation;
    dimmed?: boolean;
    variant?: 'full' | 'thumbnail';
    style?: StyleProp<ViewStyle>;
}

// Padding multiplier so both the user and the store sit inside the viewport
const REGION_PADDING = 2.5;
const MIN_DELTA = 0.01;

const regionFor = (store: LiquorStore, user: UserLocation): Region => ({
    latitude: (store.lat + user.lat) / 2,
    longitude: (store.lng + user.lng) / 2,
    latitudeDelta: Math.max(Math.abs(store.lat - user.lat) * REGION_PADDING, MIN_DELTA),
    longitudeDelta: Math.max(Math.abs(store.lng - user.lng) * REGION_PADDING, MIN_DELTA),
});

export const StoreMap: React.FC<Props> = ({ store, userLocation, dimmed = false, variant = 'full', style }) => {
    const mapRef = useRef<MapView>(null);
    const region = useMemo(() => regionFor(store, userLocation), [store, userLocation]);
    const isThumbnail = variant === 'thumbnail';

    // initialRegion is only read on mount; follow store/user updates manually
    useEffect(() => {
        mapRef.current?.animateToRegion(region, 400);
    }, [region]);

    return (
        <View style={[styles.mapCard, isThumbnail && styles.mapCardThumbnail, dimmed && styles.mapCardDimmed, style]}>
            <MapView
                ref={mapRef}
                style={[styles.map, isThumbnail && styles.mapNonInteractive]}
                initialRegion={region}
                showsUserLocation
                showsMyLocationButton={false}
                toolbarEnabled={false}
                userInterfaceStyle="dark"
                customMapStyle={Platform.OS === 'android' ? DARK_MAP_STYLE : undefined}
                scrollEnabled={!isThumbnail}
                zoomEnabled={!isThumbnail}
                rotateEnabled={!isThumbnail}
                pitchEnabled={!isThumbnail}
            >
                {isThumbnail ? (
                    <Marker
                        coordinate={{ latitude: store.lat, longitude: store.lng }}
                        title={store.name}
                        description={store.vicinity || undefined}
                        pinColor={colors.primary}
                        onCalloutPress={() => openInMaps(store)}
                    />
                ) : (
                    <Marker
                        coordinate={{ latitude: store.lat, longitude: store.lng }}
                        anchor={{ x: 0.5, y: 1 }}
                        onCalloutPress={() => openInMaps(store)}
                    >
                        <View style={styles.markerWrap}>
                            <View style={styles.markerBadge}>
                                <Ionicons name="storefront-outline" size={18} color={colors.background} />
                            </View>
                            <View style={styles.markerLabelPill}>
                                <Text style={styles.markerLabelText} numberOfLines={1}>{store.name}</Text>
                            </View>
                        </View>
                    </Marker>
                )}
            </MapView>
            {isThumbnail && (
                <View style={styles.expandHint}>
                    <Text style={styles.expandHintText}>Tap to expand</Text>
                </View>
            )}
            {!isThumbnail && (
                <View style={styles.distanceBadge} pointerEvents="none">
                    <Ionicons name="navigate-circle-outline" size={16} color={colors.primary} />
                    <Text style={styles.distanceBadgeText}>{formatDistance(store.distance)}</Text>
                </View>
            )}
        </View>
    );
};

// Google Maps (Android) styling to match the app's dark palette;
// iOS Apple Maps uses userInterfaceStyle="dark" instead
const DARK_MAP_STYLE = [
    { elementType: 'geometry', stylers: [{ color: colors.surface }] },
    { elementType: 'labels.text.fill', stylers: [{ color: colors.body }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: colors.background }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: colors.surfaceAlt }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1420' }] },
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];

const styles = StyleSheet.create({
    mapCard: {
        width: '100%',
        height: 180,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 14,
    },
    mapCardThumbnail: {
        height: 84,
        marginBottom: 10,
    },
    mapCardDimmed: {
        opacity: 0.45,
    },
    map: {
        flex: 1,
    },
    mapNonInteractive: {
        pointerEvents: 'none',
    },
    expandHint: {
        position: 'absolute',
        right: 8,
        bottom: 8,
        backgroundColor: colors.surfaceAlt + 'ee',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    expandHintText: {
        color: colors.headline,
        fontFamily: fonts.label,
        fontSize: 10,
    },
    distanceBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.background + 'dd',
        borderRadius: 14,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: colors.border,
    },
    distanceBadgeText: {
        color: colors.headline,
        fontFamily: fonts.labelBold,
        fontSize: 12,
    },
    markerWrap: {
        alignItems: 'center',
    },
    markerBadge: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.background,
    },
    markerLabelPill: {
        marginTop: 4,
        maxWidth: 140,
        backgroundColor: colors.background + 'e6',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    markerLabelText: {
        color: colors.headline,
        fontFamily: fonts.labelBold,
        fontSize: 11,
    },
});
