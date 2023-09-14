import { getOffsetDays, getNextStartDate, getNextEndDate, getISO8601DateString } from '../../dateHelper';
import { TokenRecordsResponseData } from '../../generated/models';
import { createOperation, z } from '../../generated/wundergraph.factory';
import { flattenRecords, isCrossChainRecordDataComplete, sortRecordsDescending } from '../../tokenRecordHelper';

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
const shouldProcessRecords = (records: TokenRecordsResponseData, hasProcessedFirstDate: boolean, crossChainDataComplete: boolean | undefined): boolean => {
  if (hasProcessedFirstDate === true) {
    return true;
  }

  if (!crossChainDataComplete) {
    return true;
  }

  const arbitrumTokenRecords = records.treasuryArbitrum_tokenRecords;
  const ethereumTokenRecords = records.treasuryEthereum_tokenRecords;

  if (isCrossChainRecordDataComplete(arbitrumTokenRecords, ethereumTokenRecords)) {
    console.log(`Cross-chain data is complete.`);
    return true;
  }

  console.log(`Cross-chain data is incomplete.`);
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
  }),
  handler: async (ctx) => {
    const FUNC = "paginated/tokenRecords";
    console.log(`${FUNC}: Commencing paginated query for TokenRecord`);
    console.log(`${FUNC}: Input: ${JSON.stringify(ctx.input)}`);
    const finalStartDate: Date = new Date(ctx.input.startDate);
    console.log(`${FUNC}: finalStartDate: ${finalStartDate.toISOString()}`);
    if (isNaN(finalStartDate.getTime())) {
      throw new Error(`startDate should be in the YYYY-MM-DD format.`);
    }

    const offsetDays: number = getOffsetDays(ctx.input.dateOffset);

    // Combine across pages and endpoints
    const combinedTokenRecords: TokenRecordsResponseData["treasuryEthereum_tokenRecords"] = [];

    let currentStartDate: Date = getNextStartDate(offsetDays, finalStartDate, null);
    let currentEndDate: Date = getNextEndDate(null);
    let hasProcessedFirstDate = false;

    while (currentStartDate.getTime() >= finalStartDate.getTime()) {
      console.log(`${FUNC}: Querying for ${getISO8601DateString(currentStartDate)} to ${getISO8601DateString(currentEndDate)}`);
      const queryResult = await ctx.operations.query({
        operationName: "tokenRecords",
        input: {
          startDate: getISO8601DateString(currentStartDate),
          endDate: getISO8601DateString(currentEndDate),
        },
      });

      if (queryResult.data && shouldProcessRecords(queryResult.data, hasProcessedFirstDate, ctx.input.crossChainDataComplete)) {
        // Collapse the data into a single array
        combinedTokenRecords.push(...flattenRecords(queryResult.data, true));

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

    console.log(`${FUNC}: Returning ${combinedTokenRecords.length} records.`);
    return sortRecordsDescending(combinedTokenRecords);
  },
});
