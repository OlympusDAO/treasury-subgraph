import { getOffsetDays, getNextStartDate, getNextEndDate, getISO8601DateString } from '../../dateHelper';
import { TokenRecordsResponseData } from '../../generated/models';
import { createOperation, z } from '../../generated/wundergraph.factory';
import { flattenRecords, sortRecordsDescending } from '../../tokenRecordHelper';

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
  }),
  handler: async (ctx) => {
    console.log(`Commencing paginated query for TokenRecord`);
    console.log(`Input: ${JSON.stringify(ctx.input)}`);
    const finalStartDate: Date = new Date(ctx.input.startDate);
    console.log(`finalStartDate: ${finalStartDate.toISOString()}`);
    if (isNaN(finalStartDate.getTime())) {
      throw new Error(`startDate should be in the YYYY-MM-DD format.`);
    }

    const offsetDays: number = getOffsetDays(ctx.input.dateOffset);

    // Combine across pages and endpoints
    const combinedTokenRecords: TokenRecordsResponseData["treasuryEthereum_tokenRecords"] = [];

    let currentStartDate: Date = getNextStartDate(offsetDays, finalStartDate, null);
    console.log(`first startDate = ${currentStartDate}`);
    let currentEndDate: Date = getNextEndDate(null);
    console.log(`first endDate = ${currentEndDate}`);

    while (currentStartDate.getTime() >= finalStartDate.getTime()) {
      console.log(`Querying for ${getISO8601DateString(currentStartDate)} to ${getISO8601DateString(currentEndDate)}`);
      const queryResult = await ctx.operations.query({
        operationName: "tokenRecords",
        input: {
          startDate: getISO8601DateString(currentStartDate),
          endDate: getISO8601DateString(currentEndDate),
        },
      });

      // Collapse the data into a single array
      if (queryResult.data) {
        combinedTokenRecords.push(...flattenRecords(queryResult.data, true));
      }

      currentEndDate = currentStartDate;
      currentStartDate = getNextStartDate(offsetDays, finalStartDate, currentEndDate);

      // Ensures that a finalStartDate close to the current date (within the first page) is handled correctly
      // There is probably a cleaner way to do this, but this works for now
      if (currentStartDate == finalStartDate) {
        console.log(`Reached final start date.`);
        break;
      }
    }

    console.log(`Returning ${combinedTokenRecords.length} records.`);
    return sortRecordsDescending(combinedTokenRecords);
  },
});
