import { TokenSuppliesLatestResponseData } from '../../generated/models';
import { createOperation } from '../../generated/wundergraph.factory';
import { setBlockchainProperty } from '../../tokenSupplyHelper';

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

    // Collapse the data into a single array, and add a missing property
    const combinedTokenSupplies: TokenSuppliesLatestResponseData["treasuryEthereum_tokenSupplies"] = [];

    console.log(`Got ${queryResult.data.treasuryArbitrum_tokenSupplies.length} Arbitrum records.`);
    combinedTokenSupplies.push(...setBlockchainProperty(queryResult.data.treasuryArbitrum_tokenSupplies, "Arbitrum"));

    console.log(`Got ${queryResult.data.treasuryEthereum_tokenSupplies.length} Ethereum records.`);
    combinedTokenSupplies.push(...setBlockchainProperty(queryResult.data.treasuryEthereum_tokenSupplies, "Ethereum"));

    console.log(`Got ${queryResult.data.treasuryFantom_tokenSupplies.length} Fantom records.`);
    combinedTokenSupplies.push(...setBlockchainProperty(queryResult.data.treasuryFantom_tokenSupplies, "Fantom"));

    console.log(`Got ${queryResult.data.treasuryPolygon_tokenSupplies.length} Polygon records.`);
    combinedTokenSupplies.push(...setBlockchainProperty(queryResult.data.treasuryPolygon_tokenSupplies, "Polygon"));

    console.log(`Returning ${combinedTokenSupplies.length} records.`);
    return combinedTokenSupplies;
  },
});
