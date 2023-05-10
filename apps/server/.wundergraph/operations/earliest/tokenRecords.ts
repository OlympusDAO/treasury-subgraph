import { createOperation } from '../../generated/wundergraph.factory';
import { flattenRecords } from '../../tokenRecordHelper';

/**
 * This custom query will return a flat array containing the latest TokenRecord objects for
 * each endpoint.
 */
export default createOperation.query({
  handler: async (ctx) => {
    console.log(`Commencing earliest query for TokenRecord`);

    const queryResult = await ctx.operations.query({
      operationName: "tokenRecordsEarliest",
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
