import { getOffsetDays, getNextStartDate, getNextEndDate, getISO8601DateString } from '../../dateHelper';
import { TokenSuppliesResponseData } from '../../generated/models';
import { createOperation, z } from '../../generated/wundergraph.factory';
import { flattenRecords, sortRecordsDescending } from '../../tokenSupplyHelper';

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
  }),
  handler: async (ctx) => {
    console.log(`Commencing paginated query for TokenSupply`);
    console.log(`Input: ${JSON.stringify(ctx.input)}`);
    const finalStartDate: Date = new Date(ctx.input.startDate);
    console.log(`finalStartDate: ${finalStartDate.toISOString()}`);
    if (isNaN(finalStartDate.getTime())) {
      throw new Error(`startDate should be in the YYYY-MM-DD format.`);
    }

    const offsetDays: number = getOffsetDays(ctx.input.dateOffset);

    // Combine across pages and endpoints
    const combinedTokenSupplies: TokenSuppliesResponseData["treasuryEthereum_tokenSupplies"] = [];

    let currentStartDate: Date = getNextStartDate(offsetDays, finalStartDate, null);
    let currentEndDate: Date = getNextEndDate(null);

    while (currentStartDate.getTime() >= finalStartDate.getTime()) {
      console.log(`Querying for ${getISO8601DateString(currentStartDate)} to ${getISO8601DateString(currentEndDate)}`);
      const queryResult = await ctx.operations.query({
        operationName: "tokenSupplies",
        input: {
          startDate: getISO8601DateString(currentStartDate),
          endDate: getISO8601DateString(currentEndDate),
        },
      });

      // Collapse the data into a single array, and add a missing property
      if (queryResult.data) {
        combinedTokenSupplies.push(...flattenRecords(queryResult.data, true, true));
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

    console.log(`Returning ${combinedTokenSupplies.length} records.`);
    return sortRecordsDescending(combinedTokenSupplies);
  },
});
