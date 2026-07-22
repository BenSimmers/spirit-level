import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AGE_VERIFIED_KEY, AgeGate } from './src/components/AgeGate';
import { Compass } from './src/components/Compass';
import { StoreCard } from './src/components/StoreCard';
import { StoreMap } from './src/components/StoreMap';
import { useCompass } from './src/hooks/useCompass';
import { fetchNearestStore } from './src/api/googlePlaces';
import { useRotatingMessage } from './src/hooks/useRotatingMessage';

export default function App() {
  const [ageVerified, setAgeVerified] = useState<boolean | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const { userLocation, heading, store, error, loading, refresh } = useCompass(fetchNearestStore);
  const loadingMessage = useRotatingMessage(loading);

  useEffect(() => {
    AsyncStorage.getItem(AGE_VERIFIED_KEY).then((v) => setAgeVerified(v === 'true'));
  }, []);

  const statusText = React.useMemo(() => {
    if (!userLocation) return 'Acquiring location…';
    if (loading) return loadingMessage;
    return null;
  }, [userLocation, loading, loadingMessage]);

  if (ageVerified === null) {
    return <View style={styles.blank} />;
  }

  if (!ageVerified) {
    return (
      <SafeAreaProvider>
        <AgeGate onVerified={() => setAgeVerified(true)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Compass</Text>
            <Pressable
              style={[styles.refreshIconBtn, (loading || !userLocation) && styles.refreshIconBtnDisabled]}
              onPress={refresh}
              disabled={loading || !userLocation}
            >
              <Text style={styles.refreshIcon}>↻</Text>
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
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>
              {store && userLocation && (
                <StoreMap store={store} userLocation={userLocation} variant="full" style={styles.modalMap} />
              )}
            </SafeAreaView>
          </SafeAreaProvider>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  blank: {
    flex: 1,
    backgroundColor: '#100a02',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#100a02',
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
    color: '#a08050',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  refreshIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#c8960c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIconBtnDisabled: {
    opacity: 0.35,
  },
  refreshIcon: {
    color: '#c8960c',
    fontSize: 18,
    fontWeight: '700',
  },
  statusSlot: {
    minHeight: 34,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: '#a08050',
    fontSize: 14,
    fontStyle: 'italic',
  },
  errorBox: {
    backgroundColor: '#2a1000',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#6b2000',
    width: '100%',
  },
  errorText: {
    color: '#e07040',
    textAlign: 'center',
    fontSize: 13,
  },
  mapThumbWrap: {
    width: '100%',
  },
  disclaimer: {
    color: '#4a3a20',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#100a02',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalTitle: {
    color: '#f0dca4',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c8960c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: '#c8960c',
    fontSize: 15,
    fontWeight: '700',
  },
  modalMap: {
    flex: 1,
    height: undefined,
    borderRadius: 0,
    borderWidth: 0,
    marginBottom: 0,
  },
});
