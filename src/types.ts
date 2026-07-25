export type GooglePlace = {
    displayName?: { text: string };
    location?: { latitude: number; longitude: number };
    shortFormattedAddress?: string;
    primaryType?: string;
    rating?: number;
    userRatingCount?: number;
    nationalPhoneNumber?: string;
    currentOpeningHours?: { openNow?: boolean };
}

export type LiquorStore = {
    name: string;
    lat: number;
    lng: number;
    distance: number;
    vicinity: string;
    rating?: number;
    ratingCount?: number;
    phone?: string;
    openNow?: boolean;
}

export type PlaceCategory = 'liquor_store' | 'bar' | 'pub' | 'sports_bar' | 'brewery' | 'wine_bar';
export const PLACE_CATEGORIES: PlaceCategory[] = ['liquor_store', 'bar', 'pub', 'sports_bar', 'brewery', 'wine_bar'];

export const CATEGORY_LABELS: Record<PlaceCategory, string> = {
    liquor_store: 'Liquor Store',
    bar: 'Bar',
    pub: 'Pub',
    sports_bar: 'Sports Bar',
    brewery: 'Brewery',
    wine_bar: 'Wine Bar',
};

export type NearbyPlace = LiquorStore & {
    // 'other' covers results whose primaryType falls outside PLACE_CATEGORIES
    category: PlaceCategory | 'other';
}

export type UserLocation = {
    lat: number;
    lng: number;
}

export type StoreProvider = (
    userLat: number,
    userLng: number,
    signal: AbortSignal,
    skipCache?: boolean,
) => Promise<LiquorStore>;
