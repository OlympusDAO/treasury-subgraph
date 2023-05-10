import { createOperation } from '../../generated/wundergraph.factory';
import { flattenRecords } from '../../protocolMetricHelper';

/**
 * This custom query will return a flat array containing the latest ProtocolMetric objects for
 * each endpoint.
 */
export default createOperation.query({
  handler: async (ctx) => {
    console.log(`Commencing earliest query for ProtocolMetric`);

    const queryResult = await ctx.operations.query({
      operationName: "protocolMetricsEarliest",
    });

    if (!queryResult.data) {
      console.log(`No data returned.`);
      return [];
    }

    // Combine across pages and endpoints
    const flatRecords = flattenRecords(queryResult.data);
    console.log(`Returning ${flatRecords.length} records.`);
    return flatRecords;
  },
});
