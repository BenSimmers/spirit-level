export const NETWORK_ERROR = 'Network error. Check your connection and try again.';

export const isAbort = (e: unknown): boolean => e instanceof Error && e.name === 'AbortError';

export const errorMessage = (e: unknown, fallback: string): string =>
    e instanceof Error ? e.message : fallback;
