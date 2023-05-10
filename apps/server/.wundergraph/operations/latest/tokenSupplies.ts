import { createOperation } from '../../generated/wundergraph.factory';
import { flattenRecords } from '../../tokenSupplyHelper';

/**
 * This custom query will return a flat array containing the latest TokenSupply objects for
 * each endpoint.
 */
export default createOperation.query({
  handler: async (ctx) => {
    console.log(`Commencing latest query for TokenSupply`);

    const queryResult = await ctx.operations.query({
      operationName: "tokenSuppliesLatest",
    });

    if (!queryResult.data) {
      console.log(`No data returned.`);
      return [];
    }

    return flattenRecords(queryResult.data, true, false);
  },
});
