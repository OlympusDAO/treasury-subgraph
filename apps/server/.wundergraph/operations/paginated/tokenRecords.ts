import { RequestLogger } from '@wundergraph/sdk/server';
import { getCacheKey, getCachedRecords, setCachedRecords } from '../../cacheHelper';
import { getOffsetDays, getNextStartDate, getNextEndDate, getISO8601DateString } from '../../dateHelper';
import { TokenRecordsResponseData } from '../../generated/models';
import { createOperation, z } from '../../generated/wundergraph.factory';
import { TokenRecord, flattenRecords, isCrossChainRecordDataComplete, sortRecordsDescending } from '../../tokenRecordHelper';

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
const shouldProcessRecords = (records: TokenRecordsResponseData, hasProcessedFirstDate: boolean, log: RequestLogger, crossChainDataComplete: boolean | undefined): boolean => {
  if (hasProcessedFirstDate === true) {
    return true;
  }

  if (!crossChainDataComplete) {
    return true;
  }

  const arbitrumTokenRecords = records.treasuryArbitrum_tokenRecords;
  const ethereumTokenRecords = records.treasuryEthereum_tokenRecords;

  if (isCrossChainRecordDataComplete(arbitrumTokenRecords, ethereumTokenRecords)) {
    log.info(`Cross-chain data is complete.`);
    return true;
  }

  log.info(`Cross-chain data is incomplete.`);
  return false;
}

/**
 * This custom query will return a flat array containing TokenRecord objects from
 * across all endpoints.
 * 
 * It also handles pagination to work around the Graph Protocol's 1000 record limit.
 */
export default createOperation.query({
  input: z.object({
    startDate: z.string({ description: "The start date in the YYYY-MM-DD format." }),
    dateOffset: z.number({ description: "The number of days to paginate by. Reduce the value if data is missing." }).optional(),
    crossChainDataComplete: z.boolean({ description: "If true, returns data up to the most recent day in which all subgraphs have data." }).optional(),
    ignoreCache: z.boolean({ description: "If true, ignores the cache and queries the subgraphs directly." }).optional(),
  }),
  handler: async (ctx) => {
    const FUNC = "paginated/tokenRecords";
    const log = ctx.log;

    log.info(`${FUNC}: Commencing query`);
    log.info(`${FUNC}: Input: ${JSON.stringify(ctx.input)}`);
    const finalStartDate: Date = new Date(ctx.input.startDate);
    log.info(`${FUNC}: finalStartDate: ${finalStartDate.toISOString()}`);
    if (isNaN(finalStartDate.getTime())) {
      throw new Error(`startDate should be in the YYYY-MM-DD format.`);
    }

    // Return cached data if it exists
    const cacheKey = getCacheKey(FUNC, ctx.input);
    if (!ctx.input.ignoreCache) {
      const cachedData = await getCachedRecords<TokenRecord>(cacheKey, log);
      if (cachedData) {
        return cachedData;
      }
    }

    log.info(`${FUNC}: No cached data found, querying subgraphs...`);
    const offsetDays: number = getOffsetDays(ctx.input.dateOffset);

    // Combine across pages and endpoints
    const combinedTokenRecords: TokenRecordsResponseData["treasuryEthereum_tokenRecords"] = [];

    let currentStartDate: Date = getNextStartDate(offsetDays, finalStartDate, null);
    let currentEndDate: Date = getNextEndDate(null);
    let hasProcessedFirstDate = false;

    while (currentStartDate.getTime() >= finalStartDate.getTime()) {
      log.info(`${FUNC}: Querying for ${getISO8601DateString(currentStartDate)} to ${getISO8601DateString(currentEndDate)}`);
      const queryResult = await ctx.operations.query({
        operationName: "tokenRecords",
        input: {
          startDate: getISO8601DateString(currentStartDate),
          endDate: getISO8601DateString(currentEndDate),
        },
      });

      if (queryResult.data && shouldProcessRecords(queryResult.data, hasProcessedFirstDate, log, ctx.input.crossChainDataComplete)) {
        // Collapse the data into a single array
        combinedTokenRecords.push(...flattenRecords(queryResult.data, true, log));

        // This prevents checking for consistent cross-chain data a second time
        hasProcessedFirstDate = true;
      }

      currentEndDate = currentStartDate;
      currentStartDate = getNextStartDate(offsetDays, finalStartDate, currentEndDate);

      // Ensures that a finalStartDate close to the current date (within the first page) is handled correctly
      // There is probably a cleaner way to do this, but this works for now
      if (currentStartDate == finalStartDate) {
        log.info(`${FUNC}: Reached final start date.`);
        break;
      }
    }

    const sortedRecords = sortRecordsDescending(combinedTokenRecords);

    // Update the cache
    await setCachedRecords(cacheKey, sortedRecords, log);

    log.info(`${FUNC}: Returning ${sortedRecords.length} records.`);
    return sortedRecords;
  },
});
