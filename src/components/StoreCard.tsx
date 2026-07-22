import { Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { LiquorStore } from '../types';
import { formatDistance } from '../utils/geo';
import React from 'react';

// interface Props {
type Props = {
    store: LiquorStore;
    dimmed?: boolean;
}

export const openInMaps = async (store: LiquorStore): Promise<void> => {
    // Parentheses break the geo: label delimiters and survive encodeURIComponent
    const label = encodeURIComponent(store.name.replace(/[()]/g, ''));
    const coords = `${store.lat},${store.lng}`;
    const urls = Platform.OS === 'ios'
        ? [`maps:0,0?q=${label}@${coords}`]
        : [`geo:${coords}?q=${coords}(${label})`];
    // Web fallback for devices with no native maps app (e.g. bare emulators)
    urls.push(`https://www.google.com/maps/search/?api=1&query=${coords}`);

    for (const url of urls) {
        try {
            await Linking.openURL(url);
            return;
        } catch {
            // try the next candidate
        }
    }
    Alert.alert('No maps app found', 'Install Google Maps to get directions.');
};

export const StoreCard: React.FC<Props> = ({ store, dimmed = false }) => (
    <View style={[styles.infoCard, dimmed && styles.infoCardDimmed]}>
        <Text style={styles.storeName}>{store.name}</Text>
        <Text style={styles.storeVicinity}>{store.vicinity}</Text>
        <Text style={styles.storeDist}>{formatDistance(store.distance)} away</Text>
        <Pressable style={styles.mapsBtn} onPress={() => openInMaps(store)}>
            <Text style={styles.mapsBtnText}>Open in Maps</Text>
        </Pressable>
    </View>
);

const styles = StyleSheet.create({
    infoCard: {
        backgroundColor: '#1c1005',
        borderRadius: 10,
        padding: 20,
        width: '100%',
        borderWidth: 1,
        borderColor: '#c8960c55',
        alignItems: 'center',
        marginBottom: 14,
    },
    infoCardDimmed: {
        opacity: 0.45,
    },
    storeName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#f0dca4',
        marginBottom: 4,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    storeVicinity: {
        color: '#a08050',
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 10,
        fontStyle: 'italic',
    },
    storeDist: {
        color: '#c8960c',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 14,
        letterSpacing: 0.5,
    },
    mapsBtn: {
        backgroundColor: '#c8960c22',
        borderWidth: 1,
        borderColor: '#c8960c',
        borderRadius: 6,
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    mapsBtnText: {
        color: '#c8960c',
        fontWeight: '700',
        fontSize: 14,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
});
