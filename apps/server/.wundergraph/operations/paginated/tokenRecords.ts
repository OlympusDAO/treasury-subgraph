import { addDays } from 'date-fns';
import { TokenRecordsResponseData } from '../../generated/models';
import { createOperation, z } from '../../generated/wundergraph.factory';
import { flattenRecords, sortRecordsDescending } from '../../tokenRecordHelper';

/**
 * The Graph Protocol's server has a limit of 1000 records per query (per endpoint).
 * 
 * There are on average 50 records per day (for Ethereum, which has the most records),
 * so we can query 10 days at a time to stay under the limit.
 */
const OFFSET_DAYS = 10;

const getISO8601DateString = (date: Date): string => {
  return date.toISOString().split("T")[0];
}

const getNextEndDate = (currentDate: Date | null): Date => {
  // If currentDate is null (first time being used), set the end date as tomorrow
  const tomorrowDate: Date = addDays(new Date(), 1);
  tomorrowDate.setUTCHours(0, 0, 0, 0);

  return currentDate === null ? tomorrowDate : currentDate;
}

const getOffsetDays = (dateOffset?: number): number => {
  if (!dateOffset) {
    return OFFSET_DAYS;
  }

  return dateOffset;
}

const getNextStartDate = (offsetDays: number, finalStartDate: Date, currentDate: Date | null): Date => {
  const newEndDate: Date = getNextEndDate(currentDate);

  // Subtract OFFSET_DAYS from the end date to get the new start date
  const newStartDate: Date = addDays(newEndDate, -offsetDays);

  // If the new start date is before the final start date, use the final start date
  return newStartDate.getTime() < finalStartDate.getTime() ? finalStartDate : newStartDate;
};

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
