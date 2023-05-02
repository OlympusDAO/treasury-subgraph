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

// operations/latest/tokenRecords.ts
var tokenRecords_exports = {};
__export(tokenRecords_exports, {
  default: () => tokenRecords_default
});
module.exports = __toCommonJS(tokenRecords_exports);

// generated/wundergraph.factory.ts
var import_operations = require("@wundergraph/sdk/operations");
var import_operations2 = require("@wundergraph/sdk/operations");
var createOperation = (0, import_operations.createOperationFactory)();

// operations/latest/tokenRecords.ts
var tokenRecords_default = createOperation.query({
  handler: async (ctx) => {
    console.log(`Commencing latest query for TokenRecord`);
    const combinedTokenRecords = [];
    const queryResult = await ctx.operations.query({
      operationName: "tokenRecordsLatest"
    });
    if (queryResult.data) {
      console.log(`Got ${queryResult.data.treasuryArbitrum_tokenRecords.length} Arbitrum records.`);
      combinedTokenRecords.push(...queryResult.data.treasuryArbitrum_tokenRecords);
      console.log(`Got ${queryResult.data.treasuryEthereum_tokenRecords.length} Ethereum records.`);
      combinedTokenRecords.push(...queryResult.data.treasuryEthereum_tokenRecords);
      console.log(`Got ${queryResult.data.treasuryFantom_tokenRecords.length} Fantom records.`);
      combinedTokenRecords.push(...queryResult.data.treasuryFantom_tokenRecords);
      console.log(`Got ${queryResult.data.treasuryPolygon_tokenRecords.length} Polygon records.`);
      combinedTokenRecords.push(...queryResult.data.treasuryPolygon_tokenRecords);
    }
    console.log(`Returning ${combinedTokenRecords.length} records.`);
    return combinedTokenRecords;
  }
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
//# sourceMappingURL=tokenRecords.cjs.map
