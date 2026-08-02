import { useEffect, useState } from "react";

const INTERVAL_MS = 2500;

const LOADING_MESSAGES = [
  "Locating nearby stores…",
  "Searching the area…",
  "Finding the closest option…",
  "Almost ready…",
] as const;

export const useRotatingMessage = (active: boolean): string => {
  const [index, setIndex] = useState<number>(0);

  useEffect(() => {
    if (!active) return;
    setIndex(0);
    const interval = setInterval(
      () => setIndex((i) => (i + 1) % LOADING_MESSAGES.length),
      INTERVAL_MS,
    );
    return () => clearInterval(interval);
  }, [active]);

  // Index is always in range via the modulo above; the fallback just keeps the
  // return total for the compiler without an assertion.
  return LOADING_MESSAGES[index] ?? LOADING_MESSAGES[0];
};
