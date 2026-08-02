import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { LiquorStore, UserLocation } from '../types';
import { colors, fonts } from '../theme';
import { StoreDetailSheet } from './StoreDetailSheet';
import { StoreMap } from './StoreMap';

type Props = {
    /** Null while nothing is selected; the modal stays mounted but hidden. */
    store: LiquorStore | null;
    userLocation?: UserLocation | null;
    visible: boolean;
    onClose: () => void;
}

export const StoreMapModal: React.FC<Props> = ({ store, userLocation, visible, onClose }) => {
    const [mapAreaHeight, setMapAreaHeight] = useState(0);

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            {/* Modal renders into a separate native root on iOS, so insets from
                the outer SafeAreaProvider don't reach it — needs its own. */}
            <SafeAreaProvider>
                <SafeAreaView style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title} numberOfLines={1}>{store?.name}</Text>
                        <Pressable style={styles.closeBtn} onPress={onClose}>
                            <Ionicons name="close" size={16} color={colors.primary} />
                        </Pressable>
                    </View>
                    <View
                        style={styles.mapWrap}
                        onLayout={e => setMapAreaHeight(e.nativeEvent.layout.height)}
                    >
                        {store && userLocation && (
                            <StoreMap store={store} userLocation={userLocation} variant="full" style={styles.map} />
                        )}
                        {store && (
                            <StoreDetailSheet
                                store={store}
                                userLocation={userLocation}
                                containerHeight={mapAreaHeight}
                            />
                        )}
                    </View>
                </SafeAreaView>
            </SafeAreaProvider>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    title: {
        color: colors.headline,
        fontFamily: fonts.headline,
        fontSize: 16,
        flex: 1,
        marginRight: 12,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mapWrap: {
        flex: 1,
    },
    map: {
        flex: 1,
        height: undefined,
        borderRadius: 0,
        borderWidth: 0,
        marginBottom: 0,
    },
});
