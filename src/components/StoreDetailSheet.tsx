import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    PanResponder,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { LiquorStore, UserLocation } from '../types';
import { colors, fonts } from '../theme';
import { bearingToCardinal, calculateBearing, formatDistance } from '../utils/geo';
import { callStore, openInMaps } from './StoreCard';

type Props = {
    store: LiquorStore;
    userLocation?: UserLocation | null;
    /** Height of the area the sheet is anchored in; drives how far it can travel. */
    containerHeight?: number;
}

// Fraction of the container the sheet covers once dragged all the way up
const EXPANDED_RATIO = 0.85;
// A flick past this velocity snaps in its own direction regardless of position
const FLICK_VELOCITY = 0.5;
// Movement below this is treated as a tap, not a drag
const TAP_SLOP = 6;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const StoreDetailSheet: React.FC<Props> = ({ store, userLocation, containerHeight = 0 }) => {
    const { height: windowHeight } = useWindowDimensions();
    const { phone } = store;

    const expandedHeight = (containerHeight || windowHeight) * EXPANDED_RATIO;
    const [collapsedHeight, setCollapsedHeight] = useState(0);
    const [expanded, setExpanded] = useState(false);

    // Until the summary has been measured we can't know the travel distance, so
    // the sheet renders at its natural height and stays put.
    const measured = collapsedHeight > 0 && expandedHeight > collapsedHeight;
    const travel = measured ? expandedHeight - collapsedHeight : 0;

    const translateY = useRef(new Animated.Value(0)).current;
    const expandedRef = useRef(false);
    const dragStartRef = useRef(0);

    const snapTo = useCallback((toValue: number) => {
        expandedRef.current = toValue === 0;
        setExpanded(toValue === 0);
        Animated.spring(translateY, {
            toValue,
            useNativeDriver: false,
            speed: 14,
            bounciness: 2,
        }).start();
    }, [translateY]);

    // Re-anchor whenever the travel distance changes (first measure, rotation)
    useEffect(() => {
        translateY.setValue(expandedRef.current ? 0 : travel);
    }, [travel, translateY]);

    const panResponder = useMemo(() => PanResponder.create({
        // Capture so a drag that starts on the action buttons still moves the sheet
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
            travel > 0 && Math.abs(gesture.dy) > TAP_SLOP && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
            dragStartRef.current = expandedRef.current ? 0 : travel;
        },
        onPanResponderMove: (_, gesture) => {
            translateY.setValue(clamp(dragStartRef.current + gesture.dy, 0, travel));
        },
        onPanResponderRelease: (_, gesture) => {
            const released = clamp(dragStartRef.current + gesture.dy, 0, travel);
            const shouldExpand = gesture.vy < -FLICK_VELOCITY
                ? true
                : gesture.vy > FLICK_VELOCITY
                    ? false
                    : released < travel / 2;
            snapTo(shouldExpand ? 0 : travel);
        },
        onPanResponderTerminate: () => snapTo(expandedRef.current ? 0 : travel),
    }), [travel, snapTo, translateY]);

    const toggle = () => snapTo(expandedRef.current ? travel : 0);

    const bearing = userLocation
        ? calculateBearing(userLocation.lat, userLocation.lng, store.lat, store.lng)
        : null;

    return (
        <Animated.View
            style={[
                styles.sheet,
                measured && { height: expandedHeight },
                { transform: [{ translateY }] },
            ]}
        >
            <View
                style={styles.summary}
                {...panResponder.panHandlers}
                onLayout={e => setCollapsedHeight(e.nativeEvent.layout.height)}
            >
                <Pressable onPress={toggle} hitSlop={12} style={styles.handleTap}>
                    <View style={styles.handle} />
                </Pressable>

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
                    {phone && (
                        <Pressable style={[styles.btn, styles.btnSecondary]} onPress={() => callStore(phone)}>
                            <Ionicons name="call-outline" size={16} color={colors.headline} />
                            <Text style={styles.btnSecondaryText}>Contact</Text>
                        </Pressable>
                    )}
                    <Pressable style={[styles.btn, styles.btnPrimary]} onPress={() => openInMaps(store)}>
                        <Ionicons name="navigate-outline" size={16} color={colors.background} />
                        <Text style={styles.btnPrimaryText}>Get Directions</Text>
                    </Pressable>
                </View>

                <Pressable onPress={toggle} style={styles.moreRow} hitSlop={8}>
                    <Text style={styles.moreText}>{expanded ? 'Hide details' : 'Details'}</Text>
                    <Ionicons name={expanded ? 'chevron-down' : 'chevron-up'} size={14} color={colors.primary} />
                </Pressable>
            </View>

            <ScrollView
                style={styles.details}
                contentContainerStyle={styles.detailsContent}
                scrollEnabled={expanded}
                showsVerticalScrollIndicator={false}
            >
                <DetailRow icon="walk-outline" label="Distance" value={formatDistance(store.distance)} />
                {bearing != null && (
                    <DetailRow
                        icon="compass-outline"
                        label="Direction"
                        value={`${bearingToCardinal(bearing)} · ${Math.round(bearing)}°`}
                    />
                )}
                {store.openNow != null && (
                    <DetailRow
                        icon="time-outline"
                        label="Status"
                        value={store.openNow ? 'Open now' : 'Closed'}
                    />
                )}
                {store.rating != null && (
                    <DetailRow
                        icon="star-outline"
                        label="Rating"
                        value={`${store.rating.toFixed(1)} out of 5${store.ratingCount != null ? ` · ${store.ratingCount} reviews` : ''}`}
                    />
                )}
                {phone && (
                    <DetailRow icon="call-outline" label="Phone" value={phone} onPress={() => callStore(phone)} />
                )}
                {store.vicinity ? (
                    <DetailRow icon="location-outline" label="Address" value={store.vicinity} />
                ) : null}
                <DetailRow
                    icon="map-outline"
                    label="Coordinates"
                    value={`${store.lat.toFixed(5)}, ${store.lng.toFixed(5)}`}
                />

                <Text style={styles.disclaimer}>
                    Details come from Google Places and may be out of date — call ahead before travelling.
                </Text>
            </ScrollView>
        </Animated.View>
    );
};

type DetailRowProps = {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    value: string;
    onPress?: () => void;
}

const DetailRow: React.FC<DetailRowProps> = ({ icon, label, value, onPress }) => {
    const body = (
        <View style={styles.detailRow}>
            <Ionicons name={icon} size={16} color={colors.muted} style={styles.detailIcon} />
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={[styles.detailValue, onPress && styles.detailValueLink]} numberOfLines={2}>{value}</Text>
        </View>
    );

    return onPress ? <Pressable onPress={onPress}>{body}</Pressable> : body;
};

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
    },
    // Vertical padding lives here, not on the sheet: the measured height of this
    // block is exactly what stays on screen when collapsed.
    summary: {
        paddingTop: 10,
        paddingBottom: 18,
    },
    handleTap: {
        alignSelf: 'center',
        paddingVertical: 6,
        paddingHorizontal: 24,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.border,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
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
    moreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingTop: 14,
        paddingBottom: 4,
    },
    moreText: {
        color: colors.primary,
        fontFamily: fonts.labelBold,
        fontSize: 11,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    details: {
        flex: 1,
    },
    detailsContent: {
        paddingBottom: 28,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 11,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    detailIcon: {
        width: 18,
    },
    detailLabel: {
        color: colors.muted,
        fontFamily: fonts.label,
        fontSize: 11,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        width: 96,
    },
    detailValue: {
        flex: 1,
        color: colors.headline,
        fontFamily: fonts.bodyMedium,
        fontSize: 13,
        textAlign: 'right',
    },
    detailValueLink: {
        color: colors.primary,
    },
    disclaimer: {
        color: colors.muted,
        fontFamily: fonts.body,
        fontSize: 11,
        lineHeight: 16,
        marginTop: 16,
    },
});
