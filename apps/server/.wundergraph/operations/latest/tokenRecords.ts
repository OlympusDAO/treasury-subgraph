import { getCacheKey, getCachedRecords, setCachedRecords } from '../../cacheHelper';
import { createOperation, z } from '../../generated/wundergraph.factory';
import { TokenRecord, flattenRecords } from '../../tokenRecordHelper';

/**
 * This custom query will return a flat array containing the latest TokenRecord objects for
 * each endpoint.
 */
export default createOperation.query({
  input: z.object({
    ignoreCache: z.boolean({ description: "If true, ignores the cache and queries the subgraphs directly." }).optional(),
  }),
  handler: async (ctx) => {
    const FUNC = "latest/tokenRecords";
    console.log(`${FUNC}: Commencing latest query for TokenRecord`);

    // Return cached data if it exists
    const cacheKey = getCacheKey(FUNC, ctx.input);
    if (!ctx.input.ignoreCache) {
      const cachedData = await getCachedRecords<TokenRecord>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    const queryResult = await ctx.operations.query({
      operationName: "tokenRecordsLatest",
    });

    if (!queryResult.data) {
      console.log(`${FUNC}: No data returned.`);
      return [];
    }

    // Combine across pages and endpoints
    const flatRecords = flattenRecords(queryResult.data, false);

    // Update the cache
    await setCachedRecords<TokenRecord>(cacheKey, flatRecords);

    console.log(`${FUNC}: Returning ${flatRecords.length} records.`);
    return flatRecords;
  },
});
