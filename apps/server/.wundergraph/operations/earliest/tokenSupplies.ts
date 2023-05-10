import { createOperation } from '../../generated/wundergraph.factory';
import { flattenRecords } from '../../tokenSupplyHelper';

/**
 * This custom query will return a flat array containing the latest TokenSupply objects for
 * each endpoint.
 */
export default createOperation.query({
  handler: async (ctx) => {
    console.log(`Commencing earliest query for TokenSupply`);

    const queryResult = await ctx.operations.query({
      operationName: "tokenSuppliesEarliest",
    });

    if (!queryResult.data) {
      console.log(`No data returned.`);
      return [];
    }

    // Combine across pages and endpoints
    const flatRecords = flattenRecords(queryResult.data, true, false);
    console.log(`Returning ${flatRecords.length} records.`);
    return flatRecords;
  },
});
