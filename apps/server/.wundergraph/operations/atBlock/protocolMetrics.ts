import { createOperation, z } from '../../generated/wundergraph.factory';
import { flattenRecords } from '../../protocolMetricHelper';

/**
 * This custom query will return a flat array containing the ProtocolMetric objects for
 * a specific block.
 */
export default createOperation.query({
  input: z.object({
    arbtriumBlock: z.number({ description: "Arbitrum block number" }),
    ethereumBlock: z.number({ description: "Ethereum block number" }),
    fantomBlock: z.number({ description: "Fantom block number" }),
    polygonBlock: z.number({ description: "Polygon block number" }),
  }),
  handler: async (ctx) => {
    console.log(`Commencing atBlock query for ProtocolMetric`);

    const queryResult = await ctx.operations.query({
      operationName: "protocolMetricsAtBlock",
      input: {
        arbitrumBlock: ctx.input.arbtriumBlock.toString(),
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
