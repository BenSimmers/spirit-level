import React, { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import type { LiquorStore, UserLocation } from '../types';
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
                <Marker
                    coordinate={{ latitude: store.lat, longitude: store.lng }}
                    title={store.name}
                    description={store.vicinity || undefined}
                    pinColor="#c8960c"
                    onCalloutPress={() => openInMaps(store)}
                />
            </MapView>
            {isThumbnail && (
                <View style={styles.expandHint}>
                    <Text style={styles.expandHintText}>Tap to expand</Text>
                </View>
            )}
        </View>
    );
};

// Google Maps (Android) styling to match the app's dark palette;
// iOS Apple Maps uses userInterfaceStyle="dark" instead
const DARK_MAP_STYLE = [
    { elementType: 'geometry', stylers: [{ color: '#1c1005' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#a08050' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#100a02' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a1c08' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1420' }] },
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];

const styles = StyleSheet.create({
    mapCard: {
        width: '100%',
        height: 180,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#c8960c55',
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
        backgroundColor: '#100a02cc',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    expandHintText: {
        color: '#f0dca4',
        fontSize: 10,
        fontWeight: '600',
    },
});
