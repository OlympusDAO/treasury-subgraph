import { createOperation, z } from '../../generated/wundergraph.factory';
import { flattenRecords } from '../../tokenSupplyHelper';

/**
 * This custom query will return a flat array containing the latest TokenSupply objects for
 * each endpoint.
 */
export default createOperation.query({
  input: z.object({
    arbitrumBlock: z.number({ description: "Arbitrum block number" }),
    ethereumBlock: z.number({ description: "Ethereum block number" }),
    fantomBlock: z.number({ description: "Fantom block number" }),
    polygonBlock: z.number({ description: "Polygon block number" }),
  }),
  handler: async (ctx) => {
    console.log(`Commencing latest query for TokenSupply`);

    const queryResult = await ctx.operations.query({
      operationName: "tokenSuppliesAtBlock",
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

    return flattenRecords(queryResult.data, true, false);
  },
});
