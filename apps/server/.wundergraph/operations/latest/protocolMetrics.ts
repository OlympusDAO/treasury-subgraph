import { getCachedData, setCachedData } from '../../cacheHelper';
import { createOperation } from '../../generated/wundergraph.factory';
import { ProtocolMetric, flattenRecords } from '../../protocolMetricHelper';

/**
 * This custom query will return a flat array containing the latest ProtocolMetric objects for
 * each endpoint.
 * 
 * NOTE: this is not available for public use, and is superseded by the Metric queries.
 * 
 * TODO: remove this query once the Metric queries are in use in the frontend
 */
export default createOperation.query({
  handler: async (ctx) => {
    const FUNC = "latest/protocolMetrics";
    console.log(`${FUNC}: Commencing latest query for ProtocolMetric`);

    // Return cached data if it exists
    const cachedData = await getCachedData<ProtocolMetric[]>(FUNC);
    if (cachedData) {
      console.log(`${FUNC}: Returning cached data`);
      return cachedData;
    }

    console.log(`${FUNC}: No cached data found, querying subgraphs...`);
    const queryResult = await ctx.operations.query({
      operationName: "raw/internal/protocolMetricsLatest",
    });

    if (!queryResult.data) {
      console.log(`${FUNC}: No data returned.`);
      return [];
    }

    // Combine across pages and endpoints
    const flatRecords = flattenRecords(queryResult.data, false);

    // Update the cache
    await setCachedData<ProtocolMetric[]>(FUNC, flatRecords);
    console.log(`${FUNC}: Updated cache`);

    console.log(`${FUNC}: Returning ${flatRecords.length} records.`);
    return flatRecords;
  },
});
