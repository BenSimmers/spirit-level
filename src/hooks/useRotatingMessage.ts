import React from "react";

const LOADING_MESSAGES = [
    'Sniffing out the nearest bottle shop…',
    'Consulting the spirits…',
    'Following the scent of hops…',
    'Dowsing for Dan Murphy\'s…',
    'Triangulating the closest cold one…',
    'Interrogating the locals…',
    'Checking under every rock…',
    'The compass never lies…',
    'Almost there, promise…',
];

const useRotatingMessage = (active: boolean, intervalMs = 2500): string => {
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
