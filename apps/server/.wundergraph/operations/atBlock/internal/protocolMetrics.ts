import { UpstreamSubgraphError } from '../../../upstreamSubgraphError';
import { createOperation, z } from '../../../generated/wundergraph.factory';
import { flattenRecords } from '../../../protocolMetricHelper';

/**
 * This custom query will return a flat array containing the ProtocolMetric objects for
 * a specific block.
 *
 * NOTE: this is not available for public use, and is superseded by the Metric queries.
 */
export default createOperation.query({
  errors: [UpstreamSubgraphError],
  input: z.object({
    arbitrumBlock: z.number({ description: "Arbitrum block number" }),
    ethereumBlock: z.number({ description: "Ethereum block number" }),
    fantomBlock: z.number({ description: "Fantom block number" }),
    polygonBlock: z.number({ description: "Polygon block number" }),
  }),
  handler: async (ctx) => {
    const FUNC = `atBlock/internal/protocolMetrics`;
    const log = ctx.log;
    log.info(`${FUNC}: Commencing query`);

    const queryResult = await ctx.operations.query({
      operationName: "raw/internal/protocolMetricsAtBlock",
      input: {
        arbitrumBlock: ctx.input.arbitrumBlock.toString(),
        ethereumBlock: ctx.input.ethereumBlock.toString(),
        fantomBlock: ctx.input.fantomBlock.toString(),
        polygonBlock: ctx.input.polygonBlock.toString(),
      },
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
