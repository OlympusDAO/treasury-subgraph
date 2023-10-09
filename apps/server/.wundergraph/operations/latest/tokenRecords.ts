import { getCacheKey, getCachedRecords, setCachedRecords } from '../../cacheHelper';
import { UpstreamSubgraphError } from '../../upstreamSubgraphError';
import { createOperation, z } from '../../generated/wundergraph.factory';
import { TokenRecord, flattenRecords } from '../../tokenRecordHelper';

/**
 * This custom query will return a flat array containing the latest TokenRecord object for
 * each blockchain.
 */
export default createOperation.query({
  errors: [UpstreamSubgraphError],
  input: z.object({
    ignoreCache: z.boolean({ description: "If true, ignores the cache and queries the subgraphs directly." }).optional(),
  }),
  handler: async (ctx) => {
    const FUNC = "latest/tokenRecords";
    const log = ctx.log;
    log.info(`${FUNC}: Commencing query`);

    // Return cached data if it exists
    const cacheKey = getCacheKey(FUNC, ctx.input);
    if (!ctx.input.ignoreCache) {
      const cachedData = await getCachedRecords<TokenRecord>(cacheKey, log);
      if (cachedData) {
        return cachedData;
      }
    }

    const queryResult = await ctx.operations.query({
      operationName: "tokenRecordsLatest",
    });

    if (!queryResult.data) {
      throw new UpstreamSubgraphError({ message: `${FUNC}: No data returned.` });
    }

    // Combine across pages and endpoints
    const flatRecords = flattenRecords(queryResult.data, false, log);

    // Update the cache
    await setCachedRecords(cacheKey, flatRecords, log);

    log.info(`${FUNC}: Returning ${flatRecords.length} records.`);
    return flatRecords;
  },
});
