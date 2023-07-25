import { createOperation } from '../../generated/wundergraph.factory';
import { flattenRecords } from '../../protocolMetricHelper';

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
    console.log(`Commencing latest query for ProtocolMetric`);

    const queryResult = await ctx.operations.query({
      operationName: "raw/internal/protocolMetricsLatest",
    });

    if (!queryResult.data) {
      console.log(`No data returned.`);
      return [];
    }

    // Combine across pages and endpoints
    const flatRecords = flattenRecords(queryResult.data, false);
    console.log(`Returning ${flatRecords.length} records.`);
    return flatRecords;
  },
});
