import { createOperation, z } from '../../generated/wundergraph.factory';
import { RawInternalProtocolMetricsResponseData } from '../../generated/models';
import { ProtocolMetric, flattenRecords, sortRecordsDescending } from '../../protocolMetricHelper';
import { getOffsetDays, getNextStartDate, getNextEndDate, getISO8601DateString } from '../../dateHelper';
import { getCacheKey, getCachedRecords, setCachedRecords } from '../../cacheHelper';
import { UpstreamSubgraphError } from '../../upstreamSubgraphError';
import { BadRequestError } from '../../badRequestError';

/**
 * This custom query will return a flat array containing ProtocolMetric objects from
 * across all endpoints.
 * 
 * It also handles pagination to work around the Graph Protocol's 1000 record limit.
 * 
 * NOTE: this is not recommended for public use, and is superseded by the Metric queries.
 */
export default createOperation.query({
  errors: [BadRequestError, UpstreamSubgraphError],
  input: z.object({
    startDate: z.string({ description: "The start date in the YYYY-MM-DD format." }),
    dateOffset: z.number({ description: "The number of days to paginate by. Reduce the value if data is missing." }).optional(),
    // No need for crossChainDataComplete, as ProtocolMetrics are only available on the Ethereum subgraph
    ignoreCache: z.boolean({ description: "If true, ignores the cache and queries the subgraphs directly." }).optional(),
  }),
  handler: async (ctx) => {
    const FUNC = "paginated/protocolMetrics";
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
      const cachedData = await getCachedRecords<ProtocolMetric>(cacheKey, log);
      if (cachedData) {
        return cachedData;
      }
    }

    log.info(`${FUNC}: No cached data found, querying subgraphs...`);
    const offsetDays: number = getOffsetDays(ctx.input.dateOffset);

    // Combine across pages and endpoints
    const combinedProtocolMetrics: RawInternalProtocolMetricsResponseData["treasuryEthereum_protocolMetrics"] = [];

    let currentStartDate: Date = getNextStartDate(offsetDays, finalStartDate, null);
    let currentEndDate: Date = getNextEndDate(null);

    while (currentStartDate.getTime() >= finalStartDate.getTime()) {
      currentStartDate = getNextStartDate(offsetDays, finalStartDate, currentEndDate);

      log.info(`${FUNC}: Querying for ${getISO8601DateString(currentStartDate)} to ${getISO8601DateString(currentEndDate)}`);
      const queryResult = await ctx.operations.query({
        operationName: "raw/internal/protocolMetrics",
        input: {
          startDate: getISO8601DateString(currentStartDate),
          endDate: getISO8601DateString(currentEndDate),
        },
      });

      if (!queryResult.data) {
        throw new UpstreamSubgraphError({ message: `${FUNC}: No data returned for date range ${getISO8601DateString(currentStartDate)} to ${getISO8601DateString(currentEndDate)}` });
      }

      // Collapse the data into a single array, and add a missing property
      // ProtocolMetrics are only generated for the Ethereum mainnet subgraph at the moment, so there is no need for a cross-chain consistency check
      combinedProtocolMetrics.push(...flattenRecords(queryResult.data, true, log));

      // Ensures that a finalStartDate close to the current date (within the first page) is handled correctly
      // There is probably a cleaner way to do this, but this works for now
      if (currentStartDate == finalStartDate) {
        log.info(`${FUNC}: Reached final start date.`);
        break;
      }

      currentEndDate = currentStartDate;
      log.info(`${FUNC}: Set currentEndDate to: ${currentEndDate.toISOString()}`);
    }

    const sortedRecords = sortRecordsDescending(combinedProtocolMetrics);

    // Update the cache
    await setCachedRecords(cacheKey, sortedRecords, log);

    log.info(`${FUNC}: Returning ${combinedProtocolMetrics.length} records.`);
    return sortedRecords;
  },
});
