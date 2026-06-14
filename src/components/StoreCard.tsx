import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { LiquorStore } from '../types';
import { formatDistance } from '../utils/geo';
import React from 'react';

// interface Props {
type Props = {
    store: LiquorStore;
}

export const OpenInMaps = ({ store }: { store: LiquorStore }): void => {
    const label = encodeURIComponent(store.name);
    const url = Platform.OS === 'ios'
        ? `maps:0,0?q=${label}@${store.lat},${store.lng}`
        : `geo:${store.lat},${store.lng}?q=${store.lat},${store.lng}(${label})`;
    Linking.openURL(url).catch(() =>
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lng}`),
    );
};

export const StoreCard: React.FC<Props> = ({ store }) => (
    <View style={styles.infoCard}>
        <Text style={styles.storeName}>{store.name}</Text>
        <Text style={styles.storeVicinity}>{store.vicinity}</Text>
        <Text style={styles.storeDist}>{formatDistance(store.distance)} away</Text>
        <Pressable style={styles.mapsBtn} onPress={() => OpenInMaps({ store })}>
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
