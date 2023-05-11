import { createOperation } from '../../generated/wundergraph.factory';
import { Metric, getMetricObject } from '../../metricHelper';
import { getBlockByChain } from '../../tokenRecordHelper';
import { CHAIN_ARBITRUM, CHAIN_ETHEREUM, CHAIN_FANTOM, CHAIN_POLYGON } from '../../constants';

/**
 * This custom query will return the latest Metric object.
 */
export default createOperation.query({
  handler: async (ctx) => {
    console.log(`Commencing latest query for Metric`);

    // Get the latest block for each blockchain
    const latestQueryResult = await ctx.operations.query({
      operationName: "latest/tokenRecords",
    });

    const arbitrumBlock = getBlockByChain(latestQueryResult.data || [], CHAIN_ARBITRUM);
    const ethereumBlock = getBlockByChain(latestQueryResult.data || [], CHAIN_ETHEREUM);
    const fantomBlock = getBlockByChain(latestQueryResult.data || [], CHAIN_FANTOM);
    const polygonBlock = getBlockByChain(latestQueryResult.data || [], CHAIN_POLYGON);

    if (!arbitrumBlock || !ethereumBlock || !fantomBlock || !polygonBlock) {
      return null;
    }

    const input = {
      arbitrumBlock,
      ethereumBlock,
      fantomBlock,
      polygonBlock,
    };

    const protocolMetricsQueryResult = await ctx.operations.query({
      operationName: "atBlock/protocolMetrics",
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

    const metricRecord: Metric | null = getMetricObject(tokenRecordsQueryResult.data || [], tokenSuppliesQueryResult.data || [], protocolMetricsQueryResult.data || []);
    return metricRecord;
  },
});
