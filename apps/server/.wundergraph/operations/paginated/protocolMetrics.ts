import { addDays } from 'date-fns';
import { createOperation, z } from '../../generated/wundergraph.factory';
import { ProtocolMetricsResponseData } from '../../generated/models';
import { sortRecordsDescending } from '../../protocolMetricHelper';

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
 * This custom query will return a flat array containing ProtocolMetric objects from
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
    console.log(`Commencing paginated query for ProtocolMetric`);
    console.log(`Input: ${JSON.stringify(ctx.input)}`);
    const finalStartDate: Date = new Date(ctx.input.startDate);
    console.log(`finalStartDate: ${finalStartDate.toISOString()}`);
    if (isNaN(finalStartDate.getTime())) {
      throw new Error(`startDate should be in the YYYY-MM-DD format.`);
    }

    const offsetDays: number = getOffsetDays(ctx.input.dateOffset);

    // Combine across pages and endpoints
    const combinedProtocolMetrics: ProtocolMetricsResponseData["treasuryEthereum_protocolMetrics"] = [];

    let currentStartDate: Date = getNextStartDate(offsetDays, finalStartDate, null);
    let currentEndDate: Date = getNextEndDate(null);

    while (currentStartDate.getTime() > finalStartDate.getTime()) {
      console.log(`Querying for ${getISO8601DateString(currentStartDate)} to ${getISO8601DateString(currentEndDate)}`);
      const queryResult = await ctx.operations.query({
        operationName: "protocolMetrics",
        input: {
          startDate: getISO8601DateString(currentStartDate),
          endDate: getISO8601DateString(currentEndDate),
        },
      });

      const currentProtocolMetrics: ProtocolMetricsResponseData["treasuryEthereum_protocolMetrics"] = [];

      if (queryResult.data) {
        console.log(`Got ${queryResult.data.treasuryArbitrum_protocolMetrics.length} Arbitrum records.`);
        currentProtocolMetrics.push(...queryResult.data.treasuryArbitrum_protocolMetrics);
        console.log(`Got ${queryResult.data.treasuryEthereum_protocolMetrics.length} Ethereum records.`);
        currentProtocolMetrics.push(...queryResult.data.treasuryEthereum_protocolMetrics);
        console.log(`Got ${queryResult.data.treasuryFantom_protocolMetrics.length} Fantom records.`);
        currentProtocolMetrics.push(...queryResult.data.treasuryFantom_protocolMetrics);
        console.log(`Got ${queryResult.data.treasuryPolygon_protocolMetrics.length} Polygon records.`);
        currentProtocolMetrics.push(...queryResult.data.treasuryPolygon_protocolMetrics);
      }

      // Push to the combined array
      combinedProtocolMetrics.push(...currentProtocolMetrics);

      currentEndDate = currentStartDate;
      currentStartDate = getNextStartDate(offsetDays, finalStartDate, currentEndDate);
    }

    console.log(`Returning ${combinedProtocolMetrics.length} records.`);
    return sortRecordsDescending(combinedProtocolMetrics);
  },
});
