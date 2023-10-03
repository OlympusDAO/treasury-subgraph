import { createClient } from "redis";

export const clearCache = async () => {
  if (!process.env.CACHE_ENABLED) {
    return;
  }

  console.log(`Clearing the cache`);
  // Clear the cache
  const client = createClient({
    url: process.env.UPSTASH_REDIS_URL || ""
  });

  await client.connect();

  await client.flushDb();

  await client.disconnect();
  console.log(`Cache cleared`);
};
