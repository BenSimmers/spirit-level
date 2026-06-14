import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Compass } from './src/components/Compass';
import { StoreCard } from './src/components/StoreCard';
import { useCompass } from './src/hooks/useCompass';
import React from 'react';

export default function App() {
  const { userLocation, heading, store, error, loading, refresh } = useCompass();

  const statusText = React.useMemo(() => {
    if (!userLocation) {
      return 'Acquiring location…';
    }
    if (loading) {
      return 'Searching for nearby stores…';
    }
    return null;
  }, [userLocation, loading]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : statusText ? (
        <Text style={styles.statusText}>{statusText}</Text>
      ) : null}
      <Compass heading={heading} store={store} userLocation={userLocation} />
      {store && <StoreCard store={store} />}
      {userLocation && !loading && (
        <Pressable style={styles.refreshBtn} onPress={refresh}>
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#100a02',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#c8960c',
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  statusText: {
    color: '#a08050',
    marginBottom: 16,
    fontSize: 14,
    fontStyle: 'italic',
  },
  errorBox: {
    backgroundColor: '#2a1000',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#6b2000',
    width: '100%',
  },
  errorText: {
    color: '#e07040',
    textAlign: 'center',
    fontSize: 13,
  },
  refreshBtn: {
    backgroundColor: '#c8960c',
    borderRadius: 8,
    paddingHorizontal: 36,
    paddingVertical: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#6b4c00',
  },
  refreshText: {
    color: '#100a02',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
