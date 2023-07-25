import { createOperation, z } from '../../../generated/wundergraph.factory';
import { flattenRecords } from '../../../protocolMetricHelper';

/**
 * This custom query will return a flat array containing the ProtocolMetric objects for
 * a specific block.
 * 
 * NOTE: this is not available for public use, and is superseded by the Metric queries.
 */
export default createOperation.query({
  input: z.object({
    arbitrumBlock: z.number({ description: "Arbitrum block number" }),
    ethereumBlock: z.number({ description: "Ethereum block number" }),
    fantomBlock: z.number({ description: "Fantom block number" }),
    polygonBlock: z.number({ description: "Polygon block number" }),
  }),
  handler: async (ctx) => {
    console.log(`Commencing atBlock query for ProtocolMetric`);

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
      console.log(`No data returned.`);
      return [];
    }

    // Combine across pages and endpoints
    const flatRecords = flattenRecords(queryResult.data, false);
    console.log(`Returning ${flatRecords.length} records.`);
    return flatRecords;
  },
});
