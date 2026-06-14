export const toRad = (deg: number): number => (deg * Math.PI) / 180;

export const calculateBearing = (
    lat1: number, lon1: number,
    lat2: number, lon2: number,
): number => {
    const dLon = toRad(lon2 - lon1);
    const lat1Rad = toRad(lat1);
    const lat2Rad = toRad(lat2);
    const bearingX = Math.sin(dLon) * Math.cos(lat2Rad);
    const bearingY = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    return (Math.atan2(bearingX, bearingY) * (180 / Math.PI) + 360) % 360;
}

export const haversineDistance = (
    lat1: number, lon1: number,
    lat2: number, lon2: number,
): number => {
    const R = 6_371_000; // Earth radius in metres
    const deltaLat = toRad(lat2 - lat1);
    const deltaLon = toRad(lon2 - lon1);
    const a =
        Math.sin(deltaLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(deltaLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}

export const formatDistance = (metres: number): string => metres < 1000 ? `${Math.round(metres)} m` : `${(metres / 1000).toFixed(1)} km`;
