import { RequestLogger } from "@wundergraph/sdk/server";

const TTL = 60 * 60 * 1000;

/**
 * Provides a rudimentary in-memory cache for the server.
 */
const cache = new Map<string, [number, unknown]>();

const isCacheEnabled = (): boolean => {
  if (!process.env.CACHE_ENABLED) {
    return false;
  }

  if (process.env.CACHE_ENABLED === "true") {
    return true;
  }

  return false;
}

export async function getCachedRecord<T>(key: string, log: RequestLogger): Promise<T | null> {
  const FUNC = `getCachedRecord: ${key}`;

  if (!isCacheEnabled()) {
    log.info(`${FUNC}: Cache not enabled`);
    return null;
  }

  // Attempt to get a cached result
  const cachedResultWrapper = cache.get(key);
  if (!cachedResultWrapper) {
    log.info(`${FUNC}: Cache miss`);
    return null;
  }

  // Check that the result is within the TTL
  const currentTimestampMs = Date.now();
  const resultTimestampMs = cachedResultWrapper[0];
  if (currentTimestampMs - resultTimestampMs > TTL) {
    log.info(`${FUNC}: Cache expired`);
    cache.delete(key);
    return null;
  }

  // Otherwise return the value
  log.info(`${FUNC}: Cache hit`);
  return cachedResultWrapper[1] as T;
}

export async function setCachedRecord(key: string, value: unknown, log: RequestLogger): Promise<void> {
  const FUNC = `setCachedRecord: ${key}`;

  if (!isCacheEnabled()) {
    log.info(`${FUNC}: Cache not enabled`);
    return;
  }

  cache.set(key, [Date.now(), value]);
  log.info(`${FUNC}: Updated cache`);
}

export const getCacheKey = (name: string, input?: Record<string, unknown>): string => {
  if (!input) {
    return name;
  }

  // Ensure that the input does not include the ignoreCache flag, otherwise it will not match subsequent requests
  const cleanInput = JSON.parse(JSON.stringify(input));
  delete cleanInput["ignoreCache"];

  return `${name}?${JSON.stringify(cleanInput)}`;
}
