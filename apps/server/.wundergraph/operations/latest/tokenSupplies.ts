import { getCachedData, setCachedData } from '../../cacheHelper';
import { createOperation } from '../../generated/wundergraph.factory';
import { TokenSupply, flattenRecords } from '../../tokenSupplyHelper';

/**
 * This custom query will return a flat array containing the latest TokenSupply objects for
 * each endpoint.
 */
export default createOperation.query({
  handler: async (ctx) => {
    const FUNC = "latest/tokenSupplies";
    console.log(`${FUNC}: Commencing latest query for TokenSupply`);

    // Return cached data if it exists
    const cachedData = await getCachedData<TokenSupply[]>(FUNC);
    if (cachedData) {
      console.log(`${FUNC}: Returning cached data`);
      return cachedData;
    }

    console.log(`${FUNC}: No cached data found, querying subgraphs...`);
    const queryResult = await ctx.operations.query({
      operationName: "tokenSuppliesLatest",
    });

    if (!queryResult.data) {
      console.log(`${FUNC}: No data returned.`);
      return [];
    }

    // Combine across pages and endpoints
    const flatRecords = flattenRecords(queryResult.data, true, false);
    console.log(`${FUNC}: Returning ${flatRecords.length} records.`);

    // Update the cache
    await setCachedData<TokenSupply[]>(FUNC, flatRecords);
    console.log(`${FUNC}: Updated cache`);

    return flatRecords;
  },
});
