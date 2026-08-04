/**
 * Runtime narrowers for values crossing a trust boundary — network payloads and
 * AsyncStorage blobs. The compiler has no ground truth for either, so `x as T`
 * there is an unchecked claim rather than a type check. These narrow from
 * `unknown` instead, which is what makes the resulting types honest.
 */

export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export const asRecord = (v: unknown): Record<string, unknown> | undefined =>
  isRecord(v) ? v : undefined;

export const asString = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

/** Rejects NaN and ±Infinity, which JSON.parse happily produces from `1e999`. */
export const asNumber = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

export const asBoolean = (v: unknown): boolean | undefined =>
  typeof v === "boolean" ? v : undefined;

export const asArray = (v: unknown): readonly unknown[] => (Array.isArray(v) ? v : []);
