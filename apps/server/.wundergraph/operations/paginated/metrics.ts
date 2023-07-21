import { createOperation, z } from '../../generated/wundergraph.factory';
import { getISO8601DateString } from '../../dateHelper';
import { Metric, RecordContainer, getMetricObject, sortRecordsDescending } from '../../metricHelper';

/**
 * This custom query will return a flat array containing Metric objects from
 * across all endpoints.
 * 
 * It also handles pagination to work around the Graph Protocol's 1000 record limit.
 */
export default createOperation.query({
  input: z.object({
    startDate: z.string({ description: "The start date in the YYYY-MM-DD format." }),
    dateOffset: z.number({ description: "The number of days to paginate by. Reduce the value if data is missing." }).optional(),
    crossChainDataComplete: z.boolean({ description: "If true, returns data for the most recent day in which all subgraphs have data." }).optional(),
  }),
  handler: async (ctx) => {
    console.log(`Commencing paginated query for Metric`);
    console.log(`Input: ${JSON.stringify(ctx.input)}`);
    const finalStartDate: Date = new Date(ctx.input.startDate);
    console.log(`finalStartDate: ${finalStartDate.toISOString()}`);
    if (isNaN(finalStartDate.getTime())) {
      throw new Error(`startDate should be in the YYYY-MM-DD format.`);
    }

    const finalStartDateString = getISO8601DateString(finalStartDate);

    const metricRecords: Metric[] = [];
    const byDateRecords: Map<string, RecordContainer> = new Map();

    const protocolMetricsQueryResult = await ctx.operations.query({
      operationName: "paginated/protocolMetrics",
      input: {
        startDate: finalStartDateString,
        dateOffset: ctx.input.dateOffset,
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

      console.log(`Processed ${protocolMetricsQueryResult.data.length} ProtocolMetric records.`);
    }

    const tokenRecordsQueryResult = await ctx.operations.query({
      operationName: "paginated/tokenRecords",
      input: {
        startDate: finalStartDateString,
        dateOffset: ctx.input.dateOffset,
        crossChainDataComplete: ctx.input.crossChainDataComplete,
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

      console.log(`Processed ${tokenRecordsQueryResult.data.length} TokenRecord records.`);
    }

    const tokenSuppliesQueryResult = await ctx.operations.query({
      operationName: "paginated/tokenSupplies",
      input: {
        startDate: finalStartDateString,
        dateOffset: ctx.input.dateOffset,
        crossChainDataComplete: ctx.input.crossChainDataComplete,
      },
    });

    // Group by date
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
      });

      console.log(`Processed ${tokenSuppliesQueryResult.data.length} TokenSupply records.`);
    }

    // Convert into new Metric objects
    byDateRecords.forEach((recordContainer, date) => {
      const metricRecord: Metric | null = getMetricObject(recordContainer.tokenRecords, recordContainer.tokenSupplies, recordContainer.protocolMetrics);
      if (!metricRecord) {
        console.log(`Skipping date ${date} because it is missing data.`);
        return;
      }

      metricRecords.push(metricRecord);
    });

    return sortRecordsDescending(metricRecords);
  },
});
