import { createOperation, z } from '../../generated/wundergraph.factory';
import { getISO8601DateString } from '../../dateHelper';
import { Metric, RecordContainer, getMetricObject, sortRecordsDescending } from '../../metricHelper';
import { getCacheKey, getCachedRecords, setCachedRecords } from '../../cacheHelper';
import { UpstreamSubgraphError } from '../../upstreamSubgraphError';
import { BadRequestError } from '../../badRequestError';

/**
 * This custom query will return a flat array containing Metric objects from
 * across all endpoints.
 * 
 * It also handles pagination to work around the Graph Protocol's 1000 record limit.
 */
export default createOperation.query({
  errors: [BadRequestError, UpstreamSubgraphError],
  input: z.object({
    startDate: z.string({ description: "The start date in the YYYY-MM-DD format." }),
    dateOffset: z.number({ description: "The number of days to paginate by. Reduce the value if data is missing." }).optional(),
    // Provides the option to restrict to ensure consistency of dates across chains
    crossChainDataComplete: z.boolean({ description: "If true, returns data for the most recent day in which all subgraphs have data." }).optional(),
    // Returns the records used to calculate each metric. This is disabled by default, as it can be a lot of data.
    includeRecords: z.boolean({ description: "If true, includes the records used to calculate each metric." }).optional(),
    ignoreCache: z.boolean({ description: "If true, ignores the cache and queries the subgraphs directly." }).optional(),
  }),
  handler: async (ctx) => {
    const FUNC = "paginated/metrics";
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
      const cachedData = await getCachedRecords<Metric>(cacheKey, log);
      if (cachedData) {
        return cachedData;
      }
    }

    log.info(`${FUNC}: No cached data found, querying subgraphs...`);
    const finalStartDateString = getISO8601DateString(finalStartDate);

    const metricRecords: Metric[] = [];
    const byDateRecords: Map<string, RecordContainer> = new Map();

    const protocolMetricsQueryResult = await ctx.operations.query({
      operationName: "paginated/protocolMetrics",
      input: {
        startDate: finalStartDateString,
        dateOffset: ctx.input.dateOffset,
        ignoreCache: ctx.input.ignoreCache,
      },
    });

    // Group by date
    if (protocolMetricsQueryResult.data) {
      protocolMetricsQueryResult.data.forEach((record) => {
        const date = record.date;
        let recordContainer = byDateRecords.get(date) || {
          protocolMetrics: [],
          tokenRecords: [],
          tokenSupplies: [],
        };

        recordContainer.protocolMetrics.push(record);
        byDateRecords.set(date, recordContainer);
      });

      log.info(`${FUNC}: Processed ${protocolMetricsQueryResult.data.length} ProtocolMetric records.`);
    }

    const tokenRecordsQueryResult = await ctx.operations.query({
      operationName: "paginated/tokenRecords",
      input: {
        startDate: finalStartDateString,
        dateOffset: ctx.input.dateOffset,
        crossChainDataComplete: ctx.input.crossChainDataComplete,
        ignoreCache: ctx.input.ignoreCache,
      },
    });

    // Group by date
    if (tokenRecordsQueryResult.data) {
      tokenRecordsQueryResult.data.forEach((record) => {
        const date = record.date;
        let recordContainer = byDateRecords.get(date) || {
          protocolMetrics: [],
          tokenRecords: [],
          tokenSupplies: [],
        };

        recordContainer.tokenRecords.push(record);
        byDateRecords.set(date, recordContainer);
      });

      log.info(`${FUNC}: Processed ${tokenRecordsQueryResult.data.length} TokenRecord records.`);
    }

    const tokenSuppliesQueryResult = await ctx.operations.query({
      operationName: "paginated/tokenSupplies",
      input: {
        startDate: finalStartDateString,
        dateOffset: ctx.input.dateOffset,
        crossChainDataComplete: ctx.input.crossChainDataComplete,
        ignoreCache: ctx.input.ignoreCache,
      },
    });

    // Group by date
    let latestTokenSupplyDate: string | null = null;
    if (tokenSuppliesQueryResult.data) {
      tokenSuppliesQueryResult.data.forEach((record) => {
        const date = record.date;
        let recordContainer = byDateRecords.get(date) || {
          protocolMetrics: [],
          tokenRecords: [],
          tokenSupplies: [],
        };

        recordContainer.tokenSupplies.push(record);
        byDateRecords.set(date, recordContainer);

        // Record the latest date
        if (!latestTokenSupplyDate || new Date(date) > new Date(latestTokenSupplyDate)) {
          log.info(`${FUNC}: Found latest date: ${date}`);
          latestTokenSupplyDate = date;
        }
      });

      log.info(`${FUNC}: Processed ${tokenSuppliesQueryResult.data.length} TokenSupply records.`);
    }

    // If crossChainDataComplete is true, filter out incomplete records
    if (ctx.input.crossChainDataComplete == true && latestTokenSupplyDate) {
      const latestDate: Date = new Date(latestTokenSupplyDate);
      // TokenRecord and TokenSupply records would have already been filtered to the latest complete date,
      // but ProtocolMetric records would not be, as they are not cross-chain
      // Remove by byDateRecords any keys that are later than latestTokenSupplyDate
      byDateRecords.forEach((recordContainer, date) => {
        if (new Date(date) > latestDate) {
          log.info(`${FUNC}: Removing incomplete records for date ${date}.`);
          byDateRecords.delete(date);
        }
      });
    }

    // Convert into new Metric objects
    byDateRecords.forEach((recordContainer, date) => {
      const metricRecord: Metric = getMetricObject(log, recordContainer.tokenRecords, recordContainer.tokenSupplies, recordContainer.protocolMetrics, { includeRecords: ctx.input.includeRecords, dateFallback: date });

      metricRecords.push(metricRecord);
    });

    const sortedRecords = sortRecordsDescending(metricRecords);

    // Update the cache
    // Only if includeRecords is false, as the size becomes too large
    if (!ctx.input.includeRecords) {
      await setCachedRecords(cacheKey, sortedRecords, log);
    }

    log.info(`${FUNC}: Returning ${sortedRecords.length} records.`);
    return sortedRecords;
  },
});
