import { getCacheKey, getCachedRecords, setCachedRecords } from '../../cacheHelper';
import { getOffsetDays, getNextStartDate, getNextEndDate, getISO8601DateString } from '../../dateHelper';
import { TokenSuppliesResponseData } from '../../generated/models';
import { createOperation, z } from '../../generated/wundergraph.factory';
import { TokenSupply, flattenRecords, isCrossChainSupplyDataComplete, sortRecordsDescending } from '../../tokenSupplyHelper';

/**
 * Determines whether the provided records should be processed further.
 * 
 * This is used to skip processing records if the cross-chain data is incomplete (when the flag is provided).
 * 
 * @param records 
 * @param hasProcessedFirstDate 
 * @param crossChainDataComplete 
 * @returns 
 */
const shouldProcessRecords = (records: TokenSuppliesResponseData, hasProcessedFirstDate: boolean, crossChainDataComplete: boolean | undefined): boolean => {
  if (hasProcessedFirstDate === true) {
    return true;
  }

  if (!crossChainDataComplete) {
    return true;
  }

  const arbitrumTokenRecords = records.treasuryArbitrum_tokenSupplies;
  const ethereumTokenRecords = records.treasuryEthereum_tokenSupplies;

  if (isCrossChainSupplyDataComplete(arbitrumTokenRecords, ethereumTokenRecords)) {
    console.log(`Cross-chain data is complete.`);
    return true;
  }

  console.log(`Cross-chain data is incomplete.`);
  return false;
}

/**
 * This custom query will return a flat array containing TokenSupply objects from
 * across all endpoints.
 * 
 * As TokenSupply snapshots can be created at different blocks, this operation
 * returns the latest snapshot for each day.
 * 
 * It also handles pagination to work around the Graph Protocol's 1000 record limit.
 */
export default createOperation.query({
  input: z.object({
    startDate: z.string({ description: "The start date in the YYYY-MM-DD format." }),
    dateOffset: z.number({ description: "The number of days to paginate by. Reduce the value if data is missing." }).optional(),
    pageSize: z.number({ description: "The number of records per page. Increase the value if data is missing." }).optional(),
    crossChainDataComplete: z.boolean({ description: "If true, returns data up to the most recent day in which all subgraphs have data." }).optional(),
    ignoreCache: z.boolean({ description: "If true, ignores the cache and queries the subgraphs directly." }).optional(),
  }),
  handler: async (ctx) => {
    const FUNC = "paginated/tokenSupplies";
    console.log(`${FUNC}: Commencing paginated query for TokenSupply`);
    console.log(`${FUNC}: Input: ${JSON.stringify(ctx.input)}`);
    const finalStartDate: Date = new Date(ctx.input.startDate);
    console.log(`${FUNC}: finalStartDate: ${finalStartDate.toISOString()}`);
    if (isNaN(finalStartDate.getTime())) {
      throw new Error(`startDate should be in the YYYY-MM-DD format.`);
    }

    // Return cached data if it exists
    const cacheKey = getCacheKey(FUNC, ctx.input);
    if (!ctx.input.ignoreCache) {
      const cachedData = await getCachedRecords<TokenSupply>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    console.log(`${FUNC}: No cached data found, querying subgraphs...`);
    const offsetDays: number = getOffsetDays(ctx.input.dateOffset);

    // Combine across pages and endpoints
    const combinedTokenSupplies: TokenSuppliesResponseData["treasuryEthereum_tokenSupplies"] = [];

    let currentStartDate: Date = getNextStartDate(offsetDays, finalStartDate, null);
    let currentEndDate: Date = getNextEndDate(null);
    let hasProcessedFirstDate = false;

    while (currentStartDate.getTime() >= finalStartDate.getTime()) {
      console.log(`${FUNC}: Querying for ${getISO8601DateString(currentStartDate)} to ${getISO8601DateString(currentEndDate)}`);
      const queryResult = await ctx.operations.query({
        operationName: "tokenSupplies",
        input: {
          startDate: getISO8601DateString(currentStartDate),
          endDate: getISO8601DateString(currentEndDate),
        },
      });

      if (queryResult.data && shouldProcessRecords(queryResult.data, hasProcessedFirstDate, ctx.input.crossChainDataComplete)) {
        // Collapse the data into a single array, and add a missing property
        combinedTokenSupplies.push(...flattenRecords(queryResult.data, true, true));

        // This prevents checking for consistent cross-chain data a second time
        hasProcessedFirstDate = true;
      }

      currentEndDate = currentStartDate;
      currentStartDate = getNextStartDate(offsetDays, finalStartDate, currentEndDate);

      // Ensures that a finalStartDate close to the current date (within the first page) is handled correctly
      // There is probably a cleaner way to do this, but this works for now
      if (currentStartDate == finalStartDate) {
        console.log(`${FUNC}: Reached final start date.`);
        break;
      }
    }

    const sortedRecords = sortRecordsDescending(combinedTokenSupplies);

    // Update the cache
    await setCachedRecords<TokenSupply>(cacheKey, sortedRecords);

    console.log(`${FUNC}: Returning ${sortedRecords.length} records.`);
    return sortedRecords;
  },
});
