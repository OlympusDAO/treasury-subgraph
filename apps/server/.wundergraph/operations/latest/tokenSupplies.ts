import { getCacheKey, getCachedRecord, setCachedRecord } from '../../cacheHelper';
import { UpstreamSubgraphError } from '../../upstreamSubgraphError';
import { createOperation, z } from '../../generated/wundergraph.factory';
import { TokenSupply, flattenRecords } from '../../tokenSupplyHelper';

/**
 * This custom query will return a flat array containing the latest TokenSupply object for
 * each blockchain.
 */
export default createOperation.query({
  errors: [UpstreamSubgraphError],
  input: z.object({
    ignoreCache: z.boolean({ description: "If true, ignores the cache and queries the subgraphs directly." }).optional(),
  }),
  handler: async (ctx) => {
    const FUNC = "latest/tokenSupplies";
    const log = ctx.log;
    log.info(`${FUNC}: Commencing query`);

    // Return cached data if it exists
    const cacheKey = getCacheKey(FUNC, ctx.input);
    if (!ctx.input.ignoreCache) {
      const cachedData = await getCachedRecord<TokenSupply[]>(cacheKey, log);
      if (cachedData) {
        return cachedData;
      }
    }

    log.info(`${FUNC}: No cached data found, querying subgraphs...`);
    const queryResult = await ctx.operations.query({
      operationName: "tokenSuppliesLatest",
    });

    if (!queryResult.data) {
      throw new UpstreamSubgraphError({ message: `${FUNC}: No data returned.` });
    }

    // Combine across pages and endpoints
    const flatRecords = flattenRecords(queryResult.data, true, false, log);

    // Update the cache
    await setCachedRecord(cacheKey, flatRecords, log);

    log.info(`${FUNC}: Returning ${flatRecords.length} records.`);
    return flatRecords;
  },
});
