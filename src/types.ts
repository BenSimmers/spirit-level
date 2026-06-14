export type OverpassElement = {
    lat: number;
    lon: number;
    tags?: Record<string, string>;
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
