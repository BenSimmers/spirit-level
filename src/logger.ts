type LogLevel = "debug" | "info" | "warn" | "error";

const at =
  (tag: string, level: LogLevel) =>
  (...args: unknown[]): void => {
    if (!__DEV__) return;
    // eslint-disable-next-line no-console
    console[level](`[${tag}]`, ...args);
  };

const createLogger = (tag: string) => ({
  debug: at(tag, "debug"),
  info: at(tag, "info"),
  warn: at(tag, "warn"),
  error: at(tag, "error"),
});

export const placesLogger = createLogger("places");
export const cacheLogger = createLogger("cache");
export const compassLogger = createLogger("compass");
export const browseLogger = createLogger("browse");
