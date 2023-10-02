import { RequestLogger } from "@wundergraph/sdk/server";

import { RedisClientType, createClient } from "redis";

const TTL = 60 * 60;
const CHUNK_SIZE = 1000;

/**
 * Source: https://stackoverflow.com/a/76352488
 */
type CachedJsonElement = null | boolean | number | string | Date | CachedJSONArray | CachedJSONObject;
interface CachedJSONObject {
  [key: string]: CachedJsonElement;
  [key: number]: CachedJsonElement;
}
type CachedJSONArray = Array<CachedJsonElement>;

const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunkedRecords: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    chunkedRecords.push(chunk);
  }

  return chunkedRecords;
}

const getClient = (): RedisClientType => {
  if (!process.env.UPSTASH_REDIS_URL) {
    throw new Error("UPSTASH_REDIS_URL is not set");
  }

  // if (!process.env.UPSTASH_REDIS_TOKEN) {
  //   throw new Error("UPSTASH_REDIS_TOKEN is not set");
  // }

  return createClient({
    url: process.env.UPSTASH_REDIS_URL,
  });
}

export async function getCachedRecord<T>(key: string, log: RequestLogger): Promise<T | null> {
  const FUNC = `getCachedRecord: ${key}`;
  const startTime = Date.now();
  const client = getClient();

  let result: T | null = null;
  try {
    await client.connect();

    const initialResult = await client.get(key);
    if (initialResult) {
      log.info(`${FUNC}: Cache hit`);
      result = JSON.parse(initialResult) as T;
    }
  }
  // Catch any errors. Worst-case is that the cache value is not used and a query is performed instead.
  catch (e) {
    log.error(`${FUNC}: Failed to get cache`, e);
  }
  finally {
    await client.disconnect();
  }

  const endTime = Date.now();
  log.info(`${FUNC}: ${endTime - startTime}ms elapsed`);

  return result;
}

export async function getCachedRecords<T>(key: string, log: RequestLogger): Promise<T[] | null> {
  const FUNC = `getCachedRecords: ${key}`;
  const startTime = Date.now();
  const client = getClient();

  let result: T[] | null = null;
  try {
    await client.connect();

    // Get the length of the list
    const length = await client.lLen(key);
    if (length === 0) {
      log.info(`${FUNC}: Cache miss`);
      return null;
    }

    result = [];
    log.info(`${FUNC}: ${length} records found in cache`);

    // Get the list in chunks of CHUNK_SIZE
    for (let i = 0; i < length; i += CHUNK_SIZE) {
      const chunkStartTime = Date.now();
      log.info(`${FUNC}: Getting chunk`);

      const chunk = await client.lRange(key, i, i + CHUNK_SIZE - 1);
      result.push(...(chunk.map(record => JSON.parse(record) as T)));

      log.info(`${FUNC}: Chunk retrieved in ${Date.now() - chunkStartTime}ms`);
    }

    log.info(`${FUNC}: Cache hit`);
  }
  // Catch any errors. Worst-case is that the cache value is not used and a query is performed instead.
  catch (e) {
    log.error(`${FUNC}: Failed to get cache`, e);
  }
  finally {
    await client.disconnect();
  }

  const endTime = Date.now();
  log.info(`${FUNC}: ${endTime - startTime}ms elapsed`);

  return result;
}

export async function setCachedRecord(key: string, value: CachedJsonElement, log: RequestLogger): Promise<void> {
  const FUNC = `setCachedRecord: ${key}`;
  const startTime = Date.now();
  const client = getClient();

  try {
    await client.connect();

    // Set the value and expiry for 1 hour
    await client.json.set(key, "$", value);
    log.info(`${FUNC}: Updated cache`);
  }
  // Catch any errors. Worst-case is that the cache is not updated
  catch (e) {
    log.error(`${FUNC}:  Failed to update cache`, e);
  }
  finally {
    await client.disconnect();
  }

  const endTime = Date.now();
  log.info(`${FUNC}: ${endTime - startTime}ms elapsed`);
}

export async function setCachedRecords(key: string, records: CachedJsonElement[], log: RequestLogger): Promise<void> {
  const FUNC = `setCachedRecords: ${key}`;
  const startTime = Date.now();
  const client = getClient();

  try {
    await client.connect();

    /**
     * Use an isolated client to ensure that the list is cleared and populated in a single transaction.
     * 
     * Otherwise there is a risk that records are added to the list before it is cleared, which would result in duplicate records.
     */
    await client.executeIsolated(async isolatedClient => {
      log.info(`${FUNC}: Starting transaction`);

      // Throw an error if the key is modified during the transaction
      await isolatedClient.watch(key);

      // Clear the list
      log.info(`${FUNC}: Clearing cache`);
      await isolatedClient.del(key);

      // TODO chunk based on size of content

      // Divide the array into smaller chunks, to avoid the maximum request size
      const chunkedRecords = chunkArray(records, CHUNK_SIZE);
      log.info(`${FUNC}: ${chunkedRecords.length} chunks to insert`);
      for (const chunk of chunkedRecords) {
        await isolatedClient.rPush(key, chunk.map(record => JSON.stringify(record)));
      }

      // Set the value and expiry for 1 hour
      await isolatedClient.expire(key, TTL);
    });

    log.info(`${FUNC}: Updated cache`);
  }
  // Catch any errors. Worst-case is that the cache is not updated
  catch (e) {
    log.error(`${FUNC}: Failed to update cache`);
    log.error("message" in e ? e.message : "No error message available");
    log.error("stack" in e ? e.stack : "No error stack available");
  }
  finally {
    await client.disconnect();
  }

  const endTime = Date.now();
  log.info(`${FUNC}: ${endTime - startTime}ms elapsed`);
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
