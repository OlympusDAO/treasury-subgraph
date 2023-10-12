import { getCacheKey, getCachedRecords, setCachedRecords } from '../../cacheHelper';
import { getOffsetDays, getNextStartDate, getNextEndDate, getISO8601DateString } from '../../dateHelper';
import { TokenRecordsResponseData } from '../../generated/models';
import { createOperation, z } from '../../generated/wundergraph.factory';
import { TokenRecord, filterCompleteRecords, flattenRecords, isCrossChainRecordDataComplete, sortRecordsDescending } from '../../tokenRecordHelper';
import { BadRequestError } from '../../badRequestError';
import { UpstreamSubgraphError } from '../../upstreamSubgraphError';

/**
 * This custom query will return a flat array containing TokenRecord objects from
 * across all endpoints.
 * 
 * It also handles pagination to work around the Graph Protocol's 1000 record limit.
 */
export default createOperation.query({
  errors: [BadRequestError, UpstreamSubgraphError],
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
      throw new BadRequestError({ message: `startDate should be in the YYYY-MM-DD format.` });
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
      currentStartDate = getNextStartDate(offsetDays, finalStartDate, currentEndDate);

      log.info(`${FUNC}: Querying for ${getISO8601DateString(currentStartDate)} to ${getISO8601DateString(currentEndDate)}`);
      const queryResult = await ctx.operations.query({
        operationName: "tokenRecords",
        input: {
          startDate: getISO8601DateString(currentStartDate),
          endDate: getISO8601DateString(currentEndDate),
        },
      });

      if (!queryResult.data) {
        throw new UpstreamSubgraphError({ message: `${FUNC}: No data returned for date range ${getISO8601DateString(currentStartDate)} to ${getISO8601DateString(currentEndDate)}` });
      }

      let data: TokenRecordsResponseData = queryResult.data;

      // If the first set of data has not been processed (in which case there may be lagging indexing) and cross-chain data should be complete, filter the records
      if (!hasProcessedFirstDate && ctx.input.crossChainDataComplete == true) {
        data = filterCompleteRecords(data, log);
      }

      // This prevents checking for consistent cross-chain data a second time
      hasProcessedFirstDate = true;

      // Flatten the data and add it to the combined array
      combinedTokenRecords.push(...flattenRecords(data, true, log));

      // Ensures that a finalStartDate close to the current date (within the first page) is handled correctly
      // There is probably a cleaner way to do this, but this works for now
      if (currentStartDate == finalStartDate) {
        log.info(`${FUNC}: Reached final start date.`);
        break;
      }

      currentEndDate = currentStartDate;
      log.info(`${FUNC}: Set currentEndDate to: ${currentEndDate.toISOString()}`);
    }

    const sortedRecords = sortRecordsDescending(combinedTokenRecords);

    // Update the cache
    await setCachedRecords(cacheKey, sortedRecords, log);

    log.info(`${FUNC}: Returning ${sortedRecords.length} records.`);
    return sortedRecords;
  },
});
