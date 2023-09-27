import { getCacheKey, getCachedRecords, setCachedRecords } from '../../cacheHelper';
import { createOperation, z } from '../../generated/wundergraph.factory';
import { TokenSupply, flattenRecords } from '../../tokenSupplyHelper';

/**
 * This custom query will return a flat array containing the latest TokenSupply objects for
 * each endpoint.
 */
export default createOperation.query({
  input: z.object({
    ignoreCache: z.boolean({ description: "If true, ignores the cache and queries the subgraphs directly." }).optional(),
  }),
  handler: async (ctx) => {
    const FUNC = "latest/tokenSupplies";
    console.log(`${FUNC}: Commencing latest query for TokenSupply`);

    // Return cached data if it exists
    const cacheKey = getCacheKey(FUNC, ctx.input);
    if (!ctx.input.ignoreCache) {
      const cachedData = await getCachedRecords<TokenSupply>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    console.log(`${FUNC}: No cached data found, querying subgraphs...`);
    const queryResult = await ctx.operations.query({
      operationName: "tokenSuppliesLatest",
    });

    if (!queryResult.data) {
      console.log(`${FUNC}: No data returned.`);
      return [];
    }

    // Combine across pages and endpoints
    const flatRecords = flattenRecords(queryResult.data, true, false);

    // Update the cache
    await setCachedRecords<TokenSupply>(cacheKey, flatRecords);

    console.log(`${FUNC}: Returning ${flatRecords.length} records.`);
    return flatRecords;
  },
});
