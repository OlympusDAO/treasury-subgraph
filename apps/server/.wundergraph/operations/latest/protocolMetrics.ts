import { createOperation } from '../../generated/wundergraph.factory';
import { flattenRecords } from '../../protocolMetricHelper';

/**
 * This custom query will return a flat array containing the latest ProtocolMetric objects for
 * each endpoint.
 * 
 * NOTE: this is not recommended for public use, and is superceded by the Metric queries.
 */
export default createOperation.query({
  handler: async (ctx) => {
    console.log(`Commencing latest query for ProtocolMetric`);

    const queryResult = await ctx.operations.query({
      operationName: "protocolMetricsLatest",
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
