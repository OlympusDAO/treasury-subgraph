import { createOperation, z } from '../../generated/wundergraph.factory';
import { RawInternalProtocolMetricsResponseData } from '../../generated/models';
import { flattenRecords, sortRecordsDescending } from '../../protocolMetricHelper';
import { getOffsetDays, getNextStartDate, getNextEndDate, getISO8601DateString } from '../../dateHelper';

/**
 * This custom query will return a flat array containing ProtocolMetric objects from
 * across all endpoints.
 * 
 * It also handles pagination to work around the Graph Protocol's 1000 record limit.
 * 
 * NOTE: this is not recommended for public use, and is superseded by the Metric queries.
 */
export default createOperation.query({
  input: z.object({
    startDate: z.string({ description: "The start date in the YYYY-MM-DD format." }),
    dateOffset: z.number({ description: "The number of days to paginate by. Reduce the value if data is missing." }).optional(),
  }),
  handler: async (ctx) => {
    const FUNC = "paginated/protocolMetrics";
    console.log(`${FUNC}: Commencing paginated query for ProtocolMetric`);
    console.log(`${FUNC}: Input: ${JSON.stringify(ctx.input)}`);
    const finalStartDate: Date = new Date(ctx.input.startDate);
    console.log(`${FUNC}: finalStartDate: ${finalStartDate.toISOString()}`);
    if (isNaN(finalStartDate.getTime())) {
      throw new Error(`startDate should be in the YYYY-MM-DD format.`);
    }

    const offsetDays: number = getOffsetDays(ctx.input.dateOffset);

    // Combine across pages and endpoints
    const combinedProtocolMetrics: RawInternalProtocolMetricsResponseData["treasuryEthereum_protocolMetrics"] = [];

    let currentStartDate: Date = getNextStartDate(offsetDays, finalStartDate, null);
    let currentEndDate: Date = getNextEndDate(null);

    while (currentStartDate.getTime() >= finalStartDate.getTime()) {
      console.log(`${FUNC}: Querying for ${getISO8601DateString(currentStartDate)} to ${getISO8601DateString(currentEndDate)}`);
      const queryResult = await ctx.operations.query({
        operationName: "raw/internal/protocolMetrics",
        input: {
          startDate: getISO8601DateString(currentStartDate),
          endDate: getISO8601DateString(currentEndDate),
        },
      });

      // Collapse the data into a single array
      if (queryResult.data) {
        // Collapse the data into a single array, and add a missing property
        // ProtocolMetrics are only generated for the Ethereum mainnet subgraph at the moment, so there is no need for a cross-chain consistency check
        combinedProtocolMetrics.push(...flattenRecords(queryResult.data, true));
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

    console.log(`${FUNC}: Returning ${combinedProtocolMetrics.length} records.`);
    return sortRecordsDescending(combinedProtocolMetrics);
  },
});
