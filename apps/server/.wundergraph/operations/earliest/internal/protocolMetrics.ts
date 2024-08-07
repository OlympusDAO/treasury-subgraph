import { UpstreamSubgraphError } from '../../../upstreamSubgraphError';
import { createOperation } from '../../../generated/wundergraph.factory';
import { flattenRecords } from '../../../protocolMetricHelper';

/**
 * This custom query will return a flat array containing the earliest ProtocolMetric object for
 * each blockchain.
 *
 * NOTE: this is not available for public use, and is superseded by the Metric queries.
 */
export default createOperation.query({
  errors: [UpstreamSubgraphError],
  handler: async (ctx) => {
    const FUNC = `earliest/internal/protocolMetrics`;
    const log = ctx.log;
    log.info(`${FUNC}: Commencing query`);

    const queryResult = await ctx.operations.query({
      operationName: "raw/internal/protocolMetricsEarliest",
    });

    if (!queryResult.data) {
      throw new UpstreamSubgraphError({ message: `${FUNC}: No data returned. Error: ${queryResult.error}` });
    }

    // Combine across pages and endpoints
    const flatRecords = flattenRecords(queryResult.data, false, log);
    log.info(`${FUNC}: Returning ${flatRecords.length} records.`);
    return flatRecords;
  },
});
