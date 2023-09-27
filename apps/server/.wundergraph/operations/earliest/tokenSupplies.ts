import { getCacheKey, getCachedData, setCachedData } from '../../cacheHelper';
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
    const FUNC = "earliest/tokenSupplies";
    console.log(`${FUNC}: Commencing earliest query for TokenSupply`);

    // Return cached data if it exists
    const cacheKey = getCacheKey(FUNC, ctx.input);
    if (!ctx.input.ignoreCache) {
      const cachedData = await getCachedData<TokenSupply[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    console.log(`${FUNC}: No cached data found, querying subgraphs...`);
    const queryResult = await ctx.operations.query({
      operationName: "tokenSuppliesEarliest",
    });

    if (!queryResult.data) {
      console.log(`${FUNC}: No data returned.`);
      return [];
    }

    // Combine across pages and endpoints
    const flatRecords = flattenRecords(queryResult.data, true, false);

    // Update the cache
    await setCachedData<TokenSupply[]>(cacheKey, flatRecords);

    console.log(`${FUNC}: Returning ${flatRecords.length} records.`);
    return flatRecords;
  },
});
