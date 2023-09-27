import { Redis } from "@upstash/redis";

export const clearCache = async () => {
  console.log(`Clearing the cache`);
  // Clear the cache
  const client = new Redis({
    url: process.env.UPSTASH_REDIS_URL || "",
    token: process.env.UPSTASH_REDIS_TOKEN || "",
  });

  await client.flushdb();
};
