import { createOperation, z } from '../../generated/wundergraph.factory';
import { flattenRecords } from '../../tokenRecordHelper';

/**
 * This custom query will return a flat array containing the latest TokenRecord objects for
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
    const FUNC = "atBlock/tokenRecords";
    const log = ctx.log;
    log.info(`${FUNC}: Commencing query`);

    const queryResult = await ctx.operations.query({
      operationName: "tokenRecordsAtBlock",
      input: {
        arbitrumBlock: ctx.input.arbitrumBlock.toString(),
        ethereumBlock: ctx.input.ethereumBlock.toString(),
        fantomBlock: ctx.input.fantomBlock.toString(),
        polygonBlock: ctx.input.polygonBlock.toString(),
      },
    });

    if (!queryResult.data) {
      log.info(`${FUNC}: No data returned.`);
      return [];
    }

    // Combine across pages and endpoints
    const flatRecords = flattenRecords(queryResult.data, false, log);
    log.info(`${FUNC}: Returning ${flatRecords.length} records.`);
    return flatRecords;
  },
});
