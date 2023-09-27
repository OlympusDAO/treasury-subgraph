import { Redis } from "@upstash/redis";

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

export async function getCachedData<T>(key: string): Promise<T | null> {
  const result = await getClient().get(key) as T | null;
  if (result) {
    console.log(`Cache hit for ${key}`);
  }

  return result;
}

export async function setCachedData<T>(key: string, value: T): Promise<void> {
  const client = getClient();

  // Set the value and expiry for 1 hour
  await client.set(key, value, { ex: 60 * 60 });

  console.log(`Updated cache for ${key}`);
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
