var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// operations/latest/protocolMetrics.ts
var protocolMetrics_exports = {};
__export(protocolMetrics_exports, {
  default: () => protocolMetrics_default
});
module.exports = __toCommonJS(protocolMetrics_exports);

// generated/wundergraph.factory.ts
var import_operations = require("@wundergraph/sdk/operations");
var import_operations2 = require("@wundergraph/sdk/operations");
var createOperation = (0, import_operations.createOperationFactory)();

// operations/latest/protocolMetrics.ts
var protocolMetrics_default = createOperation.query({
  handler: async (ctx) => {
    console.log(`Commencing latest query for ProtocolMetric`);
    const combinedProtocolMetrics = [];
    const queryResult = await ctx.operations.query({
      operationName: "protocolMetricsLatest"
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
  }
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
//# sourceMappingURL=protocolMetrics.cjs.map
