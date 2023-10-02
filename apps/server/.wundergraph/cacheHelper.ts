import { Redis } from "@upstash/redis";
import { RequestLogger } from "@wundergraph/sdk/server";

const TTL = 60 * 60;
const CHUNK_SIZE = 1500;

const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunkedRecords: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    chunkedRecords.push(chunk);
  }

  return chunkedRecords;
}

const getClient = (): Redis => {
  if (!process.env.UPSTASH_REDIS_URL) {
    throw new Error("UPSTASH_REDIS_URL is not set");
  }

  if (!process.env.UPSTASH_REDIS_TOKEN) {
    throw new Error("UPSTASH_REDIS_TOKEN is not set");
  }

  return new Redis({
    url: process.env.UPSTASH_REDIS_URL,
    token: process.env.UPSTASH_REDIS_TOKEN,
  });
}

export async function getCachedRecord<T>(key: string, log: RequestLogger): Promise<T | null> {
  const FUNC = `getCachedRecord: ${key}`;
  const startTime = Date.now();

  let result: T | null = null;
  try {
    result = await getClient().get(key) as T | null;
    if (result) {
      log.info(`${FUNC}: Cache hit`);
    }
  }
  // Catch any errors. Worst-case is that the cache value is not used and a query is performed instead.
  catch (e) {
    log.error(`${FUNC}: Failed to get cache`, e);
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
    // Get the length of the list
    const length = await client.llen(key);
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

      const chunk = await client.lrange(key, i, i + CHUNK_SIZE - 1) as T[];
      result.push(...chunk);

      log.info(`${FUNC}: Chunk retrieved in ${Date.now() - chunkStartTime}ms`);
    }

    log.info(`${FUNC}: Cache hit`);
  }
  // Catch any errors. Worst-case is that the cache value is not used and a query is performed instead.
  catch (e) {
    log.error(`${FUNC}: Failed to get cache`, e);
  }

  const endTime = Date.now();
  log.info(`${FUNC}: ${endTime - startTime}ms elapsed`);

  return result;
}

export async function setCachedRecord<T>(key: string, value: T extends Array<any> ? never : T, log: RequestLogger): Promise<void> {
  const FUNC = `setCachedRecord: ${key}`;
  const startTime = Date.now();
  const client = getClient();

  try {
    // Set the value and expiry for 1 hour
    await client.set(key, value, { ex: TTL });
    log.info(`${FUNC}: Updated cache`);
  }
  // Catch any errors. Worst-case is that the cache is not updated
  catch (e) {
    log.error(`${FUNC}:  Failed to update cache`, e);
  }

  const endTime = Date.now();
  log.info(`${FUNC}: ${endTime - startTime}ms elapsed`);
}

export async function setCachedRecords<T>(key: string, records: T[], log: RequestLogger): Promise<void> {
  const FUNC = `setCachedRecords: ${key}`;
  const startTime = Date.now();
  const client = getClient();

  try {
    /**
     * Use a transaction to ensure that the list is cleared and populated in a single request.
     * 
     * Otherwise there is a risk that records are added to the list before it is cleared, which would result in duplicate records.
     */
    log.info(`${FUNC}: Starting transaction`);
    const pipeline = client.multi();

    // Clear the list
    log.info(`${FUNC}: Clearing cache`);
    pipeline.del(key);

    // Divide the array into smaller chunks, to avoid the maximum request size
    const chunkedRecords = chunkArray(records, CHUNK_SIZE);
    log.info(`${FUNC}: ${chunkedRecords.length} chunks to insert`);
    for (const chunk of chunkedRecords) {
      pipeline.rpush(key, ...chunk);
    }

    // Set the value and expiry for 1 hour
    pipeline.expire(key, TTL);

    // Execute the transaction
    await pipeline.exec();

    log.info(`${FUNC}: Updated cache`);
  }
  // Catch any errors. Worst-case is that the cache is not updated
  catch (e) {
    log.error(`${FUNC}: Failed to update cache`);
    log.error("message" in e ? e.message : "No error message available");
    log.error("stack" in e ? e.stack : "No error stack available");
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
