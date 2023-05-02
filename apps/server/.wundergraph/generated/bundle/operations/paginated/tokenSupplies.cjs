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

// operations/paginated/tokenSupplies.ts
var tokenSupplies_exports = {};
__export(tokenSupplies_exports, {
  default: () => tokenSupplies_default
});
module.exports = __toCommonJS(tokenSupplies_exports);
var import_date_fns = require("date-fns");

// generated/wundergraph.factory.ts
var import_operations = require("@wundergraph/sdk/operations");
var import_operations2 = require("@wundergraph/sdk/operations");
var createOperation = (0, import_operations.createOperationFactory)();

// operations/paginated/tokenSupplies.ts
var OFFSET_DAYS = 10;
var getISO8601DateString = (date) => {
  return date.toISOString().split("T")[0];
};
var getNextEndDate = (currentDate) => {
  const tomorrowDate = (0, import_date_fns.addDays)(new Date(), 1);
  tomorrowDate.setUTCHours(0, 0, 0, 0);
  return currentDate === null ? tomorrowDate : currentDate;
};
var getOffsetDays = (dateOffset) => {
  if (!dateOffset) {
    return OFFSET_DAYS;
  }
  return dateOffset;
};
var getNextStartDate = (offsetDays, finalStartDate, currentDate) => {
  const newEndDate = getNextEndDate(currentDate);
  const newStartDate = (0, import_date_fns.addDays)(newEndDate, -offsetDays);
  return newStartDate.getTime() < finalStartDate.getTime() ? finalStartDate : newStartDate;
};
var tokenSupplies_default = createOperation.query({
  input: import_operations2.z.object({
    startDate: import_operations2.z.string({ description: "The start date in the YYYY-MM-DD format." }),
    dateOffset: import_operations2.z.number({ description: "The number of days to paginate by. Reduce the value if data is missing." }).optional(),
    pageSize: import_operations2.z.number({ description: "The number of records per page. Increase the value if data is missing." }).optional()
  }),
  handler: async (ctx) => {
    console.log(`Commencing paginated query for TokenSupply`);
    console.log(`Input: ${JSON.stringify(ctx.input)}`);
    const finalStartDate = new Date(ctx.input.startDate);
    console.log(`finalStartDate: ${finalStartDate.toISOString()}`);
    if (isNaN(finalStartDate.getTime())) {
      throw new Error(`startDate should be in the YYYY-MM-DD format.`);
    }
    const offsetDays = getOffsetDays(ctx.input.dateOffset);
    const combinedTokenSupplies = [];
    let currentStartDate = getNextStartDate(offsetDays, finalStartDate, null);
    let currentEndDate = getNextEndDate(null);
    while (currentStartDate.getTime() > finalStartDate.getTime()) {
      console.log(`Querying for ${getISO8601DateString(currentStartDate)} to ${getISO8601DateString(currentEndDate)}`);
      const queryResult = await ctx.operations.query({
        operationName: "tokenSupplies",
        input: {
          startDate: getISO8601DateString(currentStartDate),
          endDate: getISO8601DateString(currentEndDate)
        }
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
      currentEndDate = currentStartDate;
      currentStartDate = getNextStartDate(offsetDays, finalStartDate, currentEndDate);
    }
    console.log(`Returning ${combinedTokenSupplies.length} records.`);
    return combinedTokenSupplies;
  }
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
//# sourceMappingURL=tokenSupplies.cjs.map
