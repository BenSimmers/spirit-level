import { Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { LiquorStore } from '../types';
import { colors, fonts } from '../theme';
import { formatDistance } from '../utils/geo';
import React from 'react';

type Props = {
    store: LiquorStore;
    dimmed?: boolean;
}


/**
 * Opens the given store in the device's default maps app, or Google Maps in a browser if no maps app is available. If the device cannot open any of these, an alert is shown.
 * @param store The store to open in maps. 
 */
const urls = {
    ios: (store: LiquorStore) => `maps:0,0?q=${encodeURIComponent(store.name.replace(/[()]/g, ''))}@${store.lat},${store.lng}`,
    android: (store: LiquorStore) => `geo:${store.lat},${store.lng}?q=${store.lat},${store.lng}(${encodeURIComponent(store.name.replace(/[()]/g, ''))})`,
    web: (store: LiquorStore) => `https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lng}`,
};

export const openInMaps = async (store: LiquorStore): Promise<void> => {
    const url = urls[Platform.OS as keyof typeof urls](store);
    try {
        await Linking.openURL(url);
    } catch {
        Alert.alert('No maps app found', 'Install Google Maps to get directions.');
    }
    Alert.alert('No maps app found', 'Install Google Maps to get directions.');
};

export const callStore = async (phone: string): Promise<void> => {
    try {
        await Linking.openURL(`tel:${phone}`);
    } catch {
        Alert.alert('Unable to place call');
    }
};

export const StoreCard: React.FC<Props> = ({ store, dimmed = false }) => (
    <View style={[styles.infoCard, dimmed && styles.infoCardDimmed]}>
        <Text style={styles.storeName}>{store.name}</Text>
        <Text style={styles.storeVicinity}>{store.vicinity}</Text>
        <Text style={styles.storeDist}>{formatDistance(store.distance)} away</Text>
        <Pressable style={styles.mapsBtn} onPress={() => openInMaps(store)}>
            <Text style={styles.mapsBtnText}>Open in Maps</Text>
            <Ionicons name="open-outline" size={15} color={colors.primary} />
        </Pressable>
    </View>
);

const styles = StyleSheet.create({
    infoCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 20,
        width: '100%',
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        marginBottom: 14,
    },
    infoCardDimmed: {
        opacity: 0.45,
    },
    storeName: {
        fontSize: 18,
        fontFamily: fonts.headline,
        color: colors.headline,
        marginBottom: 4,
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    storeVicinity: {
        color: colors.body,
        fontFamily: fonts.body,
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 10,
        fontStyle: 'italic',
    },
    storeDist: {
        color: colors.primary,
        fontSize: 22,
        fontFamily: fonts.headline,
        marginBottom: 14,
        letterSpacing: 0.3,
    },
    mapsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: 8,
        paddingHorizontal: 24,
        paddingVertical: 10,
        width: '100%',
        justifyContent: 'center',
    },
    mapsBtnText: {
        color: colors.primary,
        fontFamily: fonts.labelBold,
        fontSize: 13,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});
