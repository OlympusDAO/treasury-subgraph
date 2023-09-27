import { Redis } from "@upstash/redis";

const TTL = 60 * 60;
const CHUNK_SIZE = 500;

const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunkedRecords: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    chunkedRecords.push(chunk);
  }

  return chunkedRecords;
}

const getClient = () => {
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

export async function getCachedRecord<T>(key: string): Promise<T | null> {
  const FUNC = "getCachedRecord";
  const startTime = Date.now();

  let result: T | null = null;
  try {
    result = await getClient().get(key) as T | null;
    if (result) {
      console.log(`${FUNC}: Cache hit for ${key}`);
    }
  }
  // Catch any errors. Worst-case is that the cache value is not used and a query is performed instead.
  catch (e) {
    console.error(`${FUNC}: Failed to get cache for ${key}`, e);
  }

  const endTime = Date.now();
  console.log(`${FUNC}: ${endTime - startTime}ms elapsed for key ${key}`);

  return result;
}

export async function getCachedRecords<T>(key: string): Promise<T[] | null> {
  const FUNC = "getCachedRecords";
  const startTime = Date.now();

  let result: T[] | null = null;
  try {
    // Get the length of the list
    const length = await getClient().llen(key);
    if (length === 0) {
      return null;
    }

    result = [];
    console.log(`${FUNC}: ${length} records found in cache for ${key}`);

    // Get the list in chunks of CHUNK_SIZE
    for (let i = 0; i < length; i += CHUNK_SIZE) {
      const chunk = await getClient().lrange(key, i, i + CHUNK_SIZE - 1) as T[];
      result.push(...chunk);
    }

    console.log(`${FUNC}: Cache hit for ${key}`);
  }
  // Catch any errors. Worst-case is that the cache value is not used and a query is performed instead.
  catch (e) {
    console.error(`${FUNC}: Failed to get cache for ${key}`, e);
  }

  const endTime = Date.now();
  console.log(`${FUNC}: ${endTime - startTime}ms elapsed for key ${key}`);

  return result;
}

export async function setCachedRecord<T>(key: string, value: T extends Array<any> ? never : T): Promise<void> {
  const FUNC = "setCachedRecord";
  const startTime = Date.now();
  const client = getClient();

  try {
    // Set the value and expiry for 1 hour
    await client.set(key, value, { ex: TTL });
    console.log(`${FUNC}: Updated cache for ${key}`);
  }
  // Catch any errors. Worst-case is that the cache is not updated
  catch (e) {
    console.error(`${FUNC}: Failed to update cache for ${key}`, e);
  }

  const endTime = Date.now();
  console.log(`${FUNC}: ${endTime - startTime}ms elapsed for key ${key}`);
}

export async function setCachedRecords<T>(key: string, records: T[]): Promise<void> {
  const FUNC = "setCachedRecords";
  const startTime = Date.now();
  const client = getClient();

  try {
    // Clear the list
    console.log(`${FUNC}: Clearing cache for ${key}`);
    await client.del(key);

    // Divide the array into smaller chunks, to avoid the maximum request size
    const chunkedRecords = chunkArray(records, CHUNK_SIZE);
    console.log(`${FUNC}: ${chunkedRecords.length} chunks for ${key}`);
    for (const chunk of chunkedRecords) {
      await client.rpush(key, ...chunk);
    }

    // Set the value and expiry for 1 hour
    await client.expire(key, TTL);
    console.log(`${FUNC}: Updated cache for ${key}`);
  }
  // Catch any errors. Worst-case is that the cache is not updated
  catch (e) {
    console.error(`${FUNC}: Failed to update cache for ${key}`, e);
  }

  const endTime = Date.now();
  console.log(`${FUNC}: ${endTime - startTime}ms elapsed for key ${key}`);
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
