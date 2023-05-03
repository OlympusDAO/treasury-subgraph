import { addDays } from 'date-fns';
import { TokenSuppliesResponseData } from '../../generated/models';
import { createOperation, z } from '../../generated/wundergraph.factory';
import { filterLatestBlockByDay } from '../../tokenSupplyHelper';

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

    while (currentStartDate.getTime() > finalStartDate.getTime()) {
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
        console.log(`Got ${queryResult.data.treasuryArbitrum_tokenSupplies.length} Arbitrum records.`);
        combinedTokenSupplies.push(...filterLatestBlockByDay(
          queryResult.data.treasuryArbitrum_tokenSupplies.map(record => {
            return { ...record, blockchain: "Arbitrum" };
          })));

        console.log(`Got ${queryResult.data.treasuryEthereum_tokenSupplies.length} Ethereum records.`);
        combinedTokenSupplies.push(...filterLatestBlockByDay(
          queryResult.data.treasuryEthereum_tokenSupplies.map(record => {
            return { ...record, blockchain: "Ethereum" };
          })));

        console.log(`Got ${queryResult.data.treasuryFantom_tokenSupplies.length} Fantom records.`);
        combinedTokenSupplies.push(...filterLatestBlockByDay(
          queryResult.data.treasuryFantom_tokenSupplies.map(record => {
            return { ...record, blockchain: "Fantom" };
          })));

        console.log(`Got ${queryResult.data.treasuryPolygon_tokenSupplies.length} Polygon records.`);
        combinedTokenSupplies.push(...filterLatestBlockByDay(
          queryResult.data.treasuryPolygon_tokenSupplies.map(record => {
            return { ...record, blockchain: "Polygon" };
          })));
      }

      currentEndDate = currentStartDate;
      currentStartDate = getNextStartDate(offsetDays, finalStartDate, currentEndDate);
    }

    console.log(`Returning ${combinedTokenSupplies.length} records.`);
    return combinedTokenSupplies;
  },
});
