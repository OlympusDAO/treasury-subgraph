import { getCacheKey, getCachedRecord, setCachedRecord } from '../../cacheHelper';
import { UpstreamSubgraphError } from '../../upstreamSubgraphError';
import { createOperation, z } from '../../generated/wundergraph.factory';
import { ProtocolMetric, flattenRecords } from '../../protocolMetricHelper';

/**
 * This custom query will return a flat array containing the latest ProtocolMetric object for
 * each blockchain.
 *
 * NOTE: this is not available for public use, and is superseded by the Metric queries.
 *
 * TODO: remove this query once the Metric queries are in use in the frontend
 */
export default createOperation.query({
  errors: [UpstreamSubgraphError],
  input: z.object({
    ignoreCache: z.boolean({ description: "If true, ignores the cache and queries the subgraphs directly." }).optional(),
  }),
  handler: async (ctx) => {
    const FUNC = "latest/protocolMetrics";
    const log = ctx.log;
    log.info(`${FUNC}: Commencing query`);

    // Return cached data if it exists
    const cacheKey = getCacheKey(FUNC, ctx.input);
    if (!ctx.input.ignoreCache) {
      const cachedData = await getCachedRecord<ProtocolMetric[]>(cacheKey, log);
      if (cachedData) {
        return cachedData;
      }
    }

    log.info(`${FUNC}: No cached data found, querying subgraphs...`);
    const queryResult = await ctx.operations.query({
      operationName: "raw/internal/protocolMetricsLatest",
    });

    if (!queryResult.data) {
      throw new UpstreamSubgraphError({ message: `${FUNC}: No data returned. Error: ${queryResult.error}` });
    }

    // Combine across pages and endpoints
    const flatRecords = flattenRecords(queryResult.data, false, log);

    // Update the cache
    await setCachedRecord(cacheKey, flatRecords, log);

    log.info(`${FUNC}: Returning ${flatRecords.length} records.`);
    return flatRecords;
  },
});
