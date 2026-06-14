import React from "react";


const LOADING_MESSAGES = [
    'Locating nearby stores…',
    'Searching the area…',
    'Checking OpenStreetMap data…',
    'Finding the closest option…',
    'Almost ready…',
];


export const useRotatingMessage = (active: boolean, intervalMs = 2500): string => {
    const [index, setIndex] = React.useState(0);
    React.useEffect(() => {
        if (!active) return;
        setIndex(0);
        const interval = setInterval(() => {
            setIndex((i) => (i + 1) % LOADING_MESSAGES.length);
        }, intervalMs);
        return () => clearInterval(interval);
    }, [active, intervalMs]);

    return LOADING_MESSAGES[index];
}
