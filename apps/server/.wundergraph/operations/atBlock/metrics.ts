import { UpstreamSubgraphError } from '../../upstreamSubgraphError';
import { createOperation, z } from '../../generated/wundergraph.factory';
import { Metric, getMetricObject } from '../../metricHelper';

/**
 * This custom query will return the Metric object for a specific block.
 */
export default createOperation.query({
  errors: [UpstreamSubgraphError],
  input: z.object({
    arbitrumBlock: z.number({ description: "Arbitrum block number" }),
    ethereumBlock: z.number({ description: "Ethereum block number" }),
    fantomBlock: z.number({ description: "Fantom block number" }),
    polygonBlock: z.number({ description: "Polygon block number" }),
  }),
  handler: async (ctx) => {
    const FUNC = `atBlock/metrics`;
    const log = ctx.log;
    log.info(`${FUNC}: Commencing query`);

    const input = {
      arbitrumBlock: ctx.input.arbitrumBlock,
      ethereumBlock: ctx.input.ethereumBlock,
      fantomBlock: ctx.input.fantomBlock,
      polygonBlock: ctx.input.polygonBlock,
    };

    const protocolMetricsQueryResult = await ctx.operations.query({
      operationName: "atBlock/internal/protocolMetrics",
      input: input,
    });

    const tokenRecordsQueryResult = await ctx.operations.query({
      operationName: "atBlock/tokenRecords",
      input: input,
    });

    const tokenSuppliesQueryResult = await ctx.operations.query({
      operationName: "atBlock/tokenSupplies",
      input: input,
    });

    const metricRecord: Metric | null = getMetricObject(log, tokenRecordsQueryResult.data || [], tokenSuppliesQueryResult.data || [], protocolMetricsQueryResult.data || []);
    if (!metricRecord) {
      throw new UpstreamSubgraphError({ message: `${FUNC}: Could not generate metric record for block ${JSON.stringify(input)}` });
    }

    return metricRecord;
  },
});
