import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorBanner, RefreshButton } from '../components/common';
import { Compass } from '../components/Compass';
import { StoreCard } from '../components/StoreCard';
import { StoreMap } from '../components/StoreMap';
import { StoreMapModal } from '../components/StoreMapModal';
import { useCompass } from '../hooks/useCompass';
import { fetchNearestStore } from '../api/googlePlaces';
import { useRotatingMessage } from '../hooks/useRotatingMessage';
import { colors, fonts } from '../theme';

export const CompassScreen: React.FC = () => {
  const [mapExpanded, setMapExpanded] = useState(false);
  const { userLocation, needleAngle, store, error, loading, refresh } = useCompass(fetchNearestStore);
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
          <RefreshButton onPress={refresh} disabled={loading || !userLocation} />
        </View>

        <View style={styles.statusSlot}>
          {error ? (
            <ErrorBanner message={error} style={styles.errorBanner} />
          ) : statusText ? (
            <Text style={styles.statusText}>{statusText}</Text>
          ) : null}
        </View>

        <Compass needleAngle={needleAngle} store={store} userLocation={userLocation} loading={loading} />

        {store && userLocation && (
          <Pressable onPress={() => setMapExpanded(true)} style={styles.mapThumbWrap}>
            <StoreMap store={store} userLocation={userLocation} dimmed={loading} variant="thumbnail" />
          </Pressable>
        )}

        {store && <StoreCard store={store} dimmed={loading} />}

        <Text style={styles.disclaimer}>Locates nearby stores only · No purchases made through this app</Text>
      </ScrollView>

      <StoreMapModal
        store={store}
        userLocation={userLocation}
        visible={mapExpanded}
        onClose={() => setMapExpanded(false)}
      />
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
  errorBanner: {
    width: '100%',
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
});
