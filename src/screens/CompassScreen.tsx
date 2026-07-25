import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Compass } from '../components/Compass';
import { StoreCard } from '../components/StoreCard';
import { StoreDetailSheet } from '../components/StoreDetailSheet';
import { StoreMap } from '../components/StoreMap';
import { useCompass } from '../hooks/useCompass';
import { fetchNearestStore } from '../api/googlePlaces';
import { useRotatingMessage } from '../hooks/useRotatingMessage';
import { colors, fonts } from '../theme';

export const CompassScreen: React.FC = () => {
  const [mapExpanded, setMapExpanded] = useState(false);
  const { userLocation, heading, store, error, loading, refresh } = useCompass(fetchNearestStore);
  const loadingMessage = useRotatingMessage(loading);

  const statusText = React.useMemo(() => {
    if (!userLocation) return 'Acquiring location…';
    if (loading) return loadingMessage;
    return null;
  }, [userLocation, loading, loadingMessage]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Compass</Text>
          <Pressable
            style={[styles.refreshIconBtn, (loading || !userLocation) && styles.refreshIconBtnDisabled]}
            onPress={refresh}
            disabled={loading || !userLocation}
          >
            <Ionicons name="refresh" size={16} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.statusSlot}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : statusText ? (
            <Text style={styles.statusText}>{statusText}</Text>
          ) : null}
        </View>

        <Compass heading={heading} store={store} userLocation={userLocation} loading={loading} />

        {store && userLocation && (
          <Pressable onPress={() => setMapExpanded(true)} style={styles.mapThumbWrap}>
            <StoreMap store={store} userLocation={userLocation} dimmed={loading} variant="thumbnail" />
          </Pressable>
        )}

        {store && <StoreCard store={store} dimmed={loading} />}

        <Text style={styles.disclaimer}>Locates nearby stores only · No purchases made through this app</Text>
      </ScrollView>

      <Modal
        visible={mapExpanded}
        animationType="slide"
        onRequestClose={() => setMapExpanded(false)}
      >
        {/* Modal renders into a separate native root on iOS, so insets from
            the outer SafeAreaProvider don't reach it — needs its own. */}
        <SafeAreaProvider>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>{store?.name}</Text>
              <Pressable style={styles.modalCloseBtn} onPress={() => setMapExpanded(false)}>
                <Ionicons name="close" size={16} color={colors.primary} />
              </Pressable>
            </View>
            <View style={styles.modalMapWrap}>
              {store && userLocation && (
                <StoreMap store={store} userLocation={userLocation} variant="full" style={styles.modalMap} />
              )}
              {store && <StoreDetailSheet store={store} />}
            </View>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerTitle: {
    color: colors.primary,
    fontFamily: fonts.label,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  refreshIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIconBtnDisabled: {
    opacity: 0.35,
  },
  statusSlot: {
    minHeight: 34,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    fontStyle: 'italic',
  },
  errorBox: {
    backgroundColor: colors.dangerBg,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    width: '100%',
  },
  errorText: {
    color: colors.danger,
    fontFamily: fonts.body,
    textAlign: 'center',
    fontSize: 13,
  },
  mapThumbWrap: {
    width: '100%',
  },
  disclaimer: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalTitle: {
    color: colors.headline,
    fontFamily: fonts.headline,
    fontSize: 16,
    flex: 1,
    marginRight: 12,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalMapWrap: {
    flex: 1,
  },
  modalMap: {
    flex: 1,
    height: undefined,
    borderRadius: 0,
    borderWidth: 0,
    marginBottom: 0,
  },
});
