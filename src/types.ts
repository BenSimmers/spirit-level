export type GooglePlace = {
    displayName?: { text: string };
    location?: { latitude: number; longitude: number };
    shortFormattedAddress?: string;
    primaryType?: string;
}

export type LiquorStore = {
    name: string;
    lat: number;
    lng: number;
    distance: number;
    vicinity: string;
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
