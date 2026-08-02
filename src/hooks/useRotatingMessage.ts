import { useEffect, useState } from 'react';

const INTERVAL_MS = 2500;

const LOADING_MESSAGES = [
    'Locating nearby stores…',
    'Searching the area…',
    'Finding the closest option…',
    'Almost ready…',
];

export const useRotatingMessage = (active: boolean): string => {
    const [index, setIndex] = useState<number>(0);

    useEffect(() => {
        if (!active) return;
        setIndex(0);
        const interval = setInterval(() => setIndex((i) => (i + 1) % LOADING_MESSAGES.length), INTERVAL_MS);
        return () => clearInterval(interval);
    }, [active]);

    return LOADING_MESSAGES[index];
};
