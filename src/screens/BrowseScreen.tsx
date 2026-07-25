import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { openInMaps } from '../components/StoreCard';
import { useNearbyPlaces } from '../hooks/useNearbyPlaces';
import { CATEGORY_LABELS, PLACE_CATEGORIES } from '../types';
import type { NearbyPlace, PlaceCategory } from '../types';
import { formatDistance } from '../utils/geo';

type Filter = PlaceCategory | 'all';

const FILTERS: Filter[] = ['all', ...PLACE_CATEGORIES];

const filterLabel = (f: Filter): string => (f === 'all' ? 'All' : CATEGORY_LABELS[f]);

export const BrowseScreen: React.FC = () => {
  const [filter, setFilter] = useState<Filter>('all');
  const { places, error, loading, refresh } = useNearbyPlaces();

  const visiblePlaces = useMemo(
    () => (filter === 'all' ? places : places.filter((p) => p.category === filter)),
    [places, filter],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Browse</Text>
      </View>

      <View style={styles.chipRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.chip, filter === f && styles.chipActive]}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{filterLabel(f)}</Text>
          </Pressable>
        ))}
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={visiblePlaces}
          keyExtractor={(item, i) => `${item.name}-${item.lat}-${item.lng}-${i}`}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#c8960c" />}
          renderItem={({ item }) => <PlaceRow place={item} />}
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.emptyText}>No places found nearby.</Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

const PlaceRow: React.FC<{ place: NearbyPlace }> = ({ place }) => (
  <Pressable style={styles.row} onPress={() => openInMaps(place)}>
    <View style={styles.rowMain}>
      <Text style={styles.rowName} numberOfLines={1}>{place.name}</Text>
      {place.vicinity ? <Text style={styles.rowVicinity} numberOfLines={1}>{place.vicinity}</Text> : null}
      {place.category !== 'other' && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{CATEGORY_LABELS[place.category]}</Text>
        </View>
      )}
    </View>
    <Text style={styles.rowDist}>{formatDistance(place.distance)}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#100a02',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerTitle: {
    color: '#a08050',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#c8960c55',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipActive: {
    backgroundColor: '#c8960c22',
    borderColor: '#c8960c',
  },
  chipText: {
    color: '#a08050',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#c8960c',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1c1005',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#c8960c33',
    marginBottom: 10,
  },
  rowMain: {
    flex: 1,
    marginRight: 12,
  },
  rowName: {
    color: '#f0dca4',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  rowVicinity: {
    color: '#a08050',
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#c8960c55',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#c8960c',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowDist: {
    color: '#c8960c',
    fontSize: 14,
    fontWeight: '700',
  },
  errorBox: {
    marginHorizontal: 20,
    backgroundColor: '#2a1000',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#6b2000',
  },
  errorText: {
    color: '#e07040',
    textAlign: 'center',
    fontSize: 13,
  },
  emptyText: {
    color: '#a08050',
    textAlign: 'center',
    marginTop: 40,
    fontStyle: 'italic',
  },
});
