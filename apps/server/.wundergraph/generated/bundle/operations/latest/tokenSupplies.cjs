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

// operations/latest/tokenSupplies.ts
var tokenSupplies_exports = {};
__export(tokenSupplies_exports, {
  default: () => tokenSupplies_default
});
module.exports = __toCommonJS(tokenSupplies_exports);

// generated/wundergraph.factory.ts
var import_operations = require("@wundergraph/sdk/operations");
var import_operations2 = require("@wundergraph/sdk/operations");
var createOperation = (0, import_operations.createOperationFactory)();

// operations/latest/tokenSupplies.ts
var tokenSupplies_default = createOperation.query({
  handler: async (ctx) => {
    console.log(`Commencing latest query for TokenSupply`);
    const combinedTokenSupplies = [];
    const queryResult = await ctx.operations.query({
      operationName: "tokenSuppliesLatest"
    });
    if (queryResult.data) {
      console.log(`Got ${queryResult.data.treasuryArbitrum_tokenSupplies.length} Arbitrum records.`);
      combinedTokenSupplies.push(...queryResult.data.treasuryArbitrum_tokenSupplies);
      console.log(`Got ${queryResult.data.treasuryEthereum_tokenSupplies.length} Ethereum records.`);
      combinedTokenSupplies.push(...queryResult.data.treasuryEthereum_tokenSupplies);
      console.log(`Got ${queryResult.data.treasuryFantom_tokenSupplies.length} Fantom records.`);
      combinedTokenSupplies.push(...queryResult.data.treasuryFantom_tokenSupplies);
      console.log(`Got ${queryResult.data.treasuryPolygon_tokenSupplies.length} Polygon records.`);
      combinedTokenSupplies.push(...queryResult.data.treasuryPolygon_tokenSupplies);
    }
    console.log(`Returning ${combinedTokenSupplies.length} records.`);
    return combinedTokenSupplies;
  }
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
//# sourceMappingURL=tokenSupplies.cjs.map
