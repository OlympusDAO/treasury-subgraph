import { TokenRecordsLatestResponseData } from '../../generated/models';
import { createOperation } from '../../generated/wundergraph.factory';

/**
 * This custom query will return a flat array containing the latest TokenRecord objects for
 * each endpoint.
 */
export default createOperation.query({
  handler: async (ctx) => {
    console.log(`Commencing latest query for TokenRecord`);

    // Combine across pages and endpoints
    const combinedTokenRecords: TokenRecordsLatestResponseData["treasuryEthereum_tokenRecords"] = [];

    const queryResult = await ctx.operations.query({
      operationName: "tokenRecordsLatest",
    });

    if (queryResult.data) {
      console.log(`Got ${queryResult.data.treasuryArbitrum_tokenRecords.length} Arbitrum records.`);
      combinedTokenRecords.push(...queryResult.data.treasuryArbitrum_tokenRecords);
      console.log(`Got ${queryResult.data.treasuryEthereum_tokenRecords.length} Ethereum records.`);
      combinedTokenRecords.push(...queryResult.data.treasuryEthereum_tokenRecords);
      console.log(`Got ${queryResult.data.treasuryFantom_tokenRecords.length} Fantom records.`);
      combinedTokenRecords.push(...queryResult.data.treasuryFantom_tokenRecords);
      console.log(`Got ${queryResult.data.treasuryPolygon_tokenRecords.length} Polygon records.`);
      combinedTokenRecords.push(...queryResult.data.treasuryPolygon_tokenRecords);
    }

    console.log(`Returning ${combinedTokenRecords.length} records.`);
    return combinedTokenRecords;
  },
});
