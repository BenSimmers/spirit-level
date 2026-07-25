import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { LiquorStore } from '../types';
import { colors, fonts } from '../theme';
import { callStore, openInMaps } from './StoreCard';

type Props = {
    store: LiquorStore;
}

export const StoreDetailSheet: React.FC<Props> = ({ store }) => (
    <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.topRow}>
            {store.rating != null ? (
                <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color={colors.primary} />
                    <Text style={styles.ratingText}>
                        {store.rating.toFixed(1)}
                        {store.ratingCount != null ? ` (${store.ratingCount} reviews)` : ''}
                    </Text>
                </View>
            ) : <View />}
            {store.openNow != null && (
                <View style={[styles.statusChip, store.openNow ? styles.statusChipOpen : styles.statusChipClosed]}>
                    <Text style={[styles.statusChipText, store.openNow ? styles.statusChipTextOpen : styles.statusChipTextClosed]}>
                        {store.openNow ? 'Open now' : 'Closed'}
                    </Text>
                </View>
            )}
        </View>

        <Text style={styles.name} numberOfLines={2}>{store.name}</Text>

        {store.vicinity ? (
            <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={15} color={colors.body} />
                <Text style={styles.address} numberOfLines={2}>{store.vicinity}</Text>
            </View>
        ) : null}

        <View style={styles.buttonRow}>
            {store.phone && (
                <Pressable style={[styles.btn, styles.btnSecondary]} onPress={() => callStore(store.phone!)}>
                    <Ionicons name="call-outline" size={16} color={colors.headline} />
                    <Text style={styles.btnSecondaryText}>Contact</Text>
                </Pressable>
            )}
            <Pressable
                style={[styles.btn, styles.btnPrimary, !store.phone && styles.btnFull]}
                onPress={() => openInMaps(store)}
            >
                <Ionicons name="navigate-outline" size={16} color={colors.background} />
                <Text style={styles.btnPrimaryText}>Get Directions</Text>
            </Pressable>
        </View>
    </View>
);

const styles = StyleSheet.create({
    sheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 24,
    },
    handle: {
        alignSelf: 'center',
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.border,
        marginBottom: 14,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    ratingText: {
        color: colors.body,
        fontFamily: fonts.bodyMedium,
        fontSize: 13,
    },
    statusChip: {
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderWidth: 1,
    },
    statusChipOpen: {
        backgroundColor: colors.primaryMuted,
        borderColor: colors.primary,
    },
    statusChipClosed: {
        backgroundColor: colors.surfaceAlt,
        borderColor: colors.border,
    },
    statusChipText: {
        fontFamily: fonts.labelBold,
        fontSize: 10,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    statusChipTextOpen: {
        color: colors.primary,
    },
    statusChipTextClosed: {
        color: colors.muted,
    },
    name: {
        color: colors.headline,
        fontFamily: fonts.headline,
        fontSize: 22,
        marginBottom: 8,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        marginBottom: 20,
    },
    address: {
        flex: 1,
        color: colors.body,
        fontFamily: fonts.body,
        fontSize: 13,
        lineHeight: 18,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
    },
    btn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 10,
        paddingVertical: 13,
    },
    btnFull: {
        flex: 1,
    },
    btnSecondary: {
        backgroundColor: colors.surfaceAlt,
        borderWidth: 1,
        borderColor: colors.border,
    },
    btnSecondaryText: {
        color: colors.headline,
        fontFamily: fonts.labelBold,
        fontSize: 13,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    btnPrimary: {
        backgroundColor: colors.primary,
    },
    btnPrimaryText: {
        color: colors.background,
        fontFamily: fonts.labelBold,
        fontSize: 13,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
});
