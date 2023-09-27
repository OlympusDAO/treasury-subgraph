import { getCachedData, setCachedData } from '../../cacheHelper';
import { createOperation } from '../../generated/wundergraph.factory';
import { TokenRecord, flattenRecords } from '../../tokenRecordHelper';

/**
 * This custom query will return a flat array containing the latest TokenRecord objects for
 * each endpoint.
 */
export default createOperation.query({
  handler: async (ctx) => {
    const FUNC = "latest/tokenRecords";
    console.log(`${FUNC}: Commencing latest query for TokenRecord`);

    // Return cached data if it exists
    const cachedData = await getCachedData<TokenRecord[]>(FUNC);
    if (cachedData) {
      console.log(`${FUNC}: Returning cached data`);
      return cachedData;
    }

    const queryResult = await ctx.operations.query({
      operationName: "tokenRecordsLatest",
    });

    if (!queryResult.data) {
      console.log(`${FUNC}: No data returned.`);
      return [];
    }

    // Combine across pages and endpoints
    const flatRecords = flattenRecords(queryResult.data, false);

    // Update the cache
    await setCachedData<TokenRecord[]>(FUNC, flatRecords);
    console.log(`${FUNC}: Updated cache`);

    console.log(`${FUNC}: Returning ${flatRecords.length} records.`);
    return flatRecords;
  },
});
