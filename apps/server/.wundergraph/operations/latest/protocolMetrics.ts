import { createOperation } from '../../generated/wundergraph.factory';
import { ProtocolMetricsLatestResponseData } from '../../generated/models';

/**
 * This custom query will return a flat array containing the latest ProtocolMetric objects for
 * each endpoint.
 */
export default createOperation.query({
  handler: async (ctx) => {
    console.log(`Commencing latest query for ProtocolMetric`);

    // Combine across pages and endpoints
    const combinedProtocolMetrics: ProtocolMetricsLatestResponseData["treasuryEthereum_protocolMetrics"] = [];

    const queryResult = await ctx.operations.query({
      operationName: "protocolMetricsLatest",
    });

    if (queryResult.data) {
      console.log(`Got ${queryResult.data.treasuryArbitrum_protocolMetrics.length} Arbitrum records.`);
      combinedProtocolMetrics.push(...queryResult.data.treasuryArbitrum_protocolMetrics);
      console.log(`Got ${queryResult.data.treasuryEthereum_protocolMetrics.length} Ethereum records.`);
      combinedProtocolMetrics.push(...queryResult.data.treasuryEthereum_protocolMetrics);
      console.log(`Got ${queryResult.data.treasuryFantom_protocolMetrics.length} Fantom records.`);
      combinedProtocolMetrics.push(...queryResult.data.treasuryFantom_protocolMetrics);
      console.log(`Got ${queryResult.data.treasuryPolygon_protocolMetrics.length} Polygon records.`);
      combinedProtocolMetrics.push(...queryResult.data.treasuryPolygon_protocolMetrics);
    }

    console.log(`Returning ${combinedProtocolMetrics.length} records.`);
    return combinedProtocolMetrics;
  },
});
