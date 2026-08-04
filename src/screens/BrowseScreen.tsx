import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ErrorBanner, RefreshButton } from "../components/common";
import { callStore } from "../components/StoreCard";
import { StoreMapModal } from "../components/StoreMapModal";
import { useNearbyPlaces } from "../hooks/useNearbyPlaces";
import { CATEGORY_LABELS, PLACE_CATEGORIES } from "../types";
import type { NearbyPlace, PlaceCategory } from "../types";
import { colors, fonts } from "../theme";
import { formatDistance } from "../utils/geo";

type Filter = PlaceCategory | "all";

const FILTERS: Filter[] = ["all", ...PLACE_CATEGORIES];

const filterLabel = (f: Filter): string => (f === "all" ? "All" : CATEGORY_LABELS[f]);

export const BrowseScreen: React.FC = () => {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<NearbyPlace | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const { places, userLocation, error, loading, refresh } = useNearbyPlaces();

  const openMap = (place: NearbyPlace) => {
    setSelected(place);
    setMapVisible(true);
  };

  const visiblePlaces = useMemo(() => {
    const byCategory = filter === "all" ? places : places.filter((p) => p.category === filter);
    const query = search.trim().toLowerCase();
    if (!query) return byCategory;
    return byCategory.filter(
      (p) => p.name.toLowerCase().includes(query) || p.vicinity.toLowerCase().includes(query),
    );
  }, [places, filter, search]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Compass</Text>
        <RefreshButton onPress={refresh} disabled={loading} />
      </View>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Browse</Text>
        <Text style={styles.headerSubtitle}>Explore premium venues in your vicinity.</Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={17} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search destinations…"
          placeholderTextColor={colors.muted}
          autoCorrect={false}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRowOuter}
        contentContainerStyle={styles.chipRow}
      >
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.chip, filter === f && styles.chipActive]}
          >
            <Text
              style={[styles.chipText, filter === f && styles.chipTextActive]}
              numberOfLines={1}
            >
              {filterLabel(f)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {error ? (
        <ErrorBanner message={error} style={styles.errorBanner} />
      ) : (
        <FlatList
          data={visiblePlaces}
          // Coordinates identify a place independently of its position in the
          // list, so rows move rather than remount when the sort order shifts.
          keyExtractor={(item) => `${item.name}-${item.lat}-${item.lng}`}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => <PlaceRow place={item} onPress={() => openMap(item)} />}
          ListEmptyComponent={
            !loading ? <Text style={styles.emptyText}>No places found nearby.</Text> : null
          }
        />
      )}

      {/* `selected` outlives `mapVisible` so the sheet doesn't blank out
          mid-way through the dismiss animation. */}
      <StoreMapModal
        store={selected}
        userLocation={userLocation}
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
      />
    </SafeAreaView>
  );
};

const PlaceRow: React.FC<{ place: NearbyPlace; onPress: () => void }> = ({ place, onPress }) => {
  const { phone } = place;

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowTop}>
        <View style={styles.rowMain}>
          <View style={styles.rowNameLine}>
            <Text style={styles.rowName} numberOfLines={1}>
              {place.name}
            </Text>
            {place.category !== "other" && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{CATEGORY_LABELS[place.category]}</Text>
              </View>
            )}
          </View>
          {place.vicinity ? (
            <Text style={styles.rowVicinity} numberOfLines={1}>
              {place.vicinity}
            </Text>
          ) : null}
        </View>
        <Text style={styles.rowDist}>{formatDistance(place.distance)}</Text>
      </View>
      {phone && (
        <Pressable style={styles.callBtn} onPress={() => callStore(phone)}>
          <Ionicons name="call-outline" size={13} color={colors.body} />
          <Text style={styles.callBtnText}>Call</Text>
        </Pressable>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  topBarTitle: {
    color: colors.primary,
    fontFamily: fonts.label,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerTitle: {
    color: colors.headline,
    fontFamily: fonts.headline,
    fontSize: 28,
  },
  headerSubtitle: {
    color: colors.body,
    fontFamily: fonts.body,
    fontSize: 14,
    marginTop: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: colors.headline,
    fontFamily: fonts.body,
    fontSize: 14,
    height: "100%",
  },
  chipRowOuter: {
    flexGrow: 0,
    height: 48,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
  },
  chip: {
    height: 32,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  chipActive: {
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.muted,
    fontFamily: fonts.labelBold,
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  chipTextActive: {
    color: colors.primary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  rowMain: {
    flex: 1,
    marginRight: 12,
  },
  rowNameLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  rowName: {
    color: colors.headline,
    fontFamily: fonts.headline,
    fontSize: 15,
    flexShrink: 1,
  },
  rowVicinity: {
    color: colors.body,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  badge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.tertiary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.secondary,
    fontFamily: fonts.labelBold,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rowDist: {
    color: colors.primary,
    fontFamily: fonts.headlineSemi,
    fontSize: 15,
  },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 12,
  },
  callBtnText: {
    color: colors.body,
    fontFamily: fonts.labelBold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  errorBanner: {
    marginHorizontal: 20,
  },
  emptyText: {
    color: colors.muted,
    fontFamily: fonts.body,
    textAlign: "center",
    marginTop: 40,
    fontStyle: "italic",
  },
});
