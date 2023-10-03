import { createClient } from "redis";

export const clearCache = async () => {
  const FUNC = "clearCache";

  if (!process.env.CACHE_ENABLED) {
    console.log(`${FUNC}: Cache is not enabled`);
    return;
  }

  console.log(`${FUNC}: Clearing the cache`);
  // Clear the cache
  const client = createClient({
    url: process.env.UPSTASH_REDIS_URL || ""
  });

  await client.connect();

  await client.flushDb();

  await client.disconnect();
  console.log(`${FUNC}: Cache cleared`);
};
