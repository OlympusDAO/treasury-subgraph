import { addDays } from "date-fns";
import { createTestServer } from "../.wundergraph/generated/testing";
import { getISO8601DateString } from "./dateHelper";
import { CHAIN_ARBITRUM, CHAIN_ETHEREUM, CHAIN_FANTOM, CHAIN_POLYGON } from "../.wundergraph/constants";
import { getFirstRecord } from "./tokenRecordHelper";
import { parseNumber } from "./numberHelper";
import { clearCache } from "./cacheHelper";

const wg = createTestServer();

beforeAll(async () => {
  await wg.start();
}, 10 * 1000);

afterAll(async () => {
  await wg.stop();
});

beforeEach(async () => {
  await clearCache();
});

const getStartDate = (days: number = -5): string => {
  return getISO8601DateString(addDays(new Date(), days));
}

describe("paginated", () => {
  test("returns recent results", async () => {
    const result = await wg.client().query({
      operationName: "paginated/tokenRecords",
      input: {
        startDate: getStartDate(-1),
      }
    });

    const records = result.data;
    const recordLength = records ? records.length : 0;
    expect(recordLength).toBeGreaterThan(0);
  });

  test("cached results are equal", async () => {
    const result = await wg.client().query({
      operationName: "paginated/tokenRecords",
      input: {
        startDate: getStartDate(-1),
      },
    });

    const records = result.data;

    const resultTwo = await wg.client().query({
      operationName: "paginated/tokenRecords",
      input: {
        startDate: getStartDate(-1),
      },
    });

    expect(resultTwo.data).toEqual(records);
  });

  test("returns results", async () => {
    const result = await wg.client().query({
      operationName: "paginated/tokenRecords",
      input: {
        startDate: getStartDate(-5),
      }
    });

    const records = result.data;
    const recordLength = records ? records.length : 0;
    expect(recordLength).toBeGreaterThan(0);
  });

  test("returns results when crossChainDataComplete is true", async () => {
    const result = await wg.client().query({
      operationName: "paginated/tokenRecords",
      input: {
        startDate: getStartDate(-5),
        crossChainDataComplete: true,
      }
    });

    const records = result.data;
    const recordLength = records ? records.length : 0;
    expect(recordLength).toBeGreaterThan(0);
  });

  test("returns blockchain property for Arbitrum", async () => {
    const result = await wg.client().query({
      operationName: "paginated/tokenRecords",
      input: {
        startDate: getStartDate(),
      }
    });

    const records = result.data;
    const filteredRecords = records ? records.filter((record) => record.blockchain === CHAIN_ARBITRUM) : [];
    expect(filteredRecords.length).toBeGreaterThan(0);
  });

  test("returns blockchain property for Ethereum", async () => {
    const result = await wg.client().query({
      operationName: "paginated/tokenRecords",
      input: {
        startDate: getStartDate(),
      }
    });

    const records = result.data;
    const filteredRecords = records ? records.filter((record) => record.blockchain === CHAIN_ETHEREUM) : [];
    expect(filteredRecords.length).toBeGreaterThan(0);
  });

  test("returns blockchain property for Fantom", async () => {
    const result = await wg.client().query({
      operationName: "paginated/tokenRecords",
      input: {
        startDate: getStartDate(),
      }
    });

    const records = result.data;
    const filteredRecords = records ? records.filter((record) => record.blockchain === CHAIN_FANTOM) : [];
    expect(filteredRecords.length).toBeGreaterThan(0);
  });

  test("returns blockchain property for Polygon", async () => {
    const result = await wg.client().query({
      operationName: "paginated/tokenRecords",
      input: {
        startDate: getStartDate(),
      }
    });

    const records = result.data;
    const filteredRecords = records ? records.filter((record) => record.blockchain === CHAIN_POLYGON) : [];
    expect(filteredRecords.length).toBeGreaterThan(0);
  });
});

describe("latest", () => {
  test("returns the latest results for each chain", async () => {
    // Grab the results from the raw operation
    const rawResult = await wg.client().query({
      operationName: "tokenRecordsLatest",
    });

    // Raw data has an array property for each chain
    const arbitrumRawResult = rawResult.data?.treasuryArbitrum_tokenRecords[0];
    const ethereumRawResult = rawResult.data?.treasuryEthereum_tokenRecords[0];
    const fantomRawResult = rawResult.data?.treasuryFantom_tokenRecords[0];
    const polygonRawResult = rawResult.data?.treasuryPolygon_tokenRecords[0];

    // Grab the results from the latest operation
    const result = await wg.client().query({
      operationName: "latest/tokenRecords",
    });

    // Latest records is collapsed into a flat array
    const records = result.data;
    const arbitrumResult = getFirstRecord(records, CHAIN_ARBITRUM);
    const ethereumResult = getFirstRecord(records, CHAIN_ETHEREUM);
    const fantomResult = getFirstRecord(records, CHAIN_FANTOM);
    const polygonResult = getFirstRecord(records, CHAIN_POLYGON);

    // Check that the block is the same
    expect(arbitrumResult?.block).toEqual(arbitrumRawResult?.block);
    expect(ethereumResult?.block).toEqual(ethereumRawResult?.block);
    expect(fantomResult?.block).toEqual(fantomRawResult?.block);
    expect(polygonResult?.block).toEqual(polygonRawResult?.block);

    // Check that the array length is the same
    const recordLength = records ? records.length : 0;
    expect(recordLength).toEqual(4);
  });

  test("cached results are equal", async () => {
    const result = await wg.client().query({
      operationName: "latest/tokenRecords",
    });

    const records = result.data;

    const resultTwo = await wg.client().query({
      operationName: "latest/tokenRecords",
    });

    expect(resultTwo.data).toEqual(records);
  });
});

describe("earliest", () => {
  test("returns the earliest results for each chain", async () => {
    // Grab the results from the raw operation
    const rawResult = await wg.client().query({
      operationName: "tokenRecordsEarliest",
    });

    // Raw data has an array property for each chain
    const arbitrumRawResult = rawResult.data?.treasuryArbitrum_tokenRecords[0];
    const ethereumRawResult = rawResult.data?.treasuryEthereum_tokenRecords[0];
    const fantomRawResult = rawResult.data?.treasuryFantom_tokenRecords[0];
    const polygonRawResult = rawResult.data?.treasuryPolygon_tokenRecords[0];

    // Grab the results from the earliest operation
    const result = await wg.client().query({
      operationName: "earliest/tokenRecords",
    });

    // Latest records is collapsed into a flat array
    const records = result.data;
    const arbitrumResult = getFirstRecord(records, CHAIN_ARBITRUM);
    const ethereumResult = getFirstRecord(records, CHAIN_ETHEREUM);
    const fantomResult = getFirstRecord(records, CHAIN_FANTOM);
    const polygonResult = getFirstRecord(records, CHAIN_POLYGON);

    // Check that the block is the same
    expect(arbitrumResult?.block).toEqual(arbitrumRawResult?.block);
    expect(ethereumResult?.block).toEqual(ethereumRawResult?.block);
    expect(fantomResult?.block).toEqual(fantomRawResult?.block);
    expect(polygonResult?.block).toEqual(polygonRawResult?.block);

    // Check that the array length is the same
    const recordLength = records ? records.length : 0;
    expect(recordLength).toEqual(4);
  });

  test("cached results are equal", async () => {
    const result = await wg.client().query({
      operationName: "earliest/tokenRecords",
    });

    const records = result.data;

    const resultTwo = await wg.client().query({
      operationName: "earliest/tokenRecords",
    });

    expect(resultTwo.data).toEqual(records);
  });
});

describe("atBlock", () => {
  test("returns the results for each chain at the specified block", async () => {
    const startDate = getISO8601DateString(addDays(new Date(), -1));

    // Grab the results for the previous day (hence not the result of the latest query)
    const rawResult = await wg.client().query({
      operationName: "paginated/tokenRecords",
      input: {
        startDate: startDate,
      },
    });

    // Raw data has an array property for each chain
    const arbitrumRawResult = getFirstRecord(rawResult.data, CHAIN_ARBITRUM, startDate);
    const arbitrumRawBlock = parseNumber(arbitrumRawResult?.block);
    const ethereumRawResult = getFirstRecord(rawResult.data, CHAIN_ETHEREUM, startDate);
    const ethereumRawBlock = parseNumber(ethereumRawResult?.block);
    const fantomRawResult = getFirstRecord(rawResult.data, CHAIN_FANTOM, startDate);
    const fantomRawBlock = parseNumber(fantomRawResult?.block);
    const polygonRawResult = getFirstRecord(rawResult.data, CHAIN_POLYGON, startDate);
    const polygonRawBlock = parseNumber(polygonRawResult?.block);

    // Grab the results from the earliest operation
    const result = await wg.client().query({
      operationName: "atBlock/tokenRecords",
      input: {
        arbitrumBlock: arbitrumRawBlock,
        ethereumBlock: ethereumRawBlock,
        fantomBlock: fantomRawBlock,
        polygonBlock: polygonRawBlock,
      }
    });

    // Latest records is collapsed into a flat array
    const records = result.data;
    const arbitrumResult = getFirstRecord(records, CHAIN_ARBITRUM);
    const ethereumResult = getFirstRecord(records, CHAIN_ETHEREUM);
    const fantomResult = getFirstRecord(records, CHAIN_FANTOM);
    const polygonResult = getFirstRecord(records, CHAIN_POLYGON);

    // Check that the block is the same
    expect(parseNumber(arbitrumResult?.block)).toEqual(arbitrumRawBlock);
    expect(parseNumber(ethereumResult?.block)).toEqual(ethereumRawBlock);
    expect(parseNumber(fantomResult?.block)).toEqual(fantomRawBlock);
    expect(parseNumber(polygonResult?.block)).toEqual(polygonRawBlock);
  });
});

// describe("converts to numbers", () => {
//   test("success", async () => {
//     const result = await wg.client().query({
//       operationName: "paginated/tokenRecords",
//       input: {
//         startDate: getStartDate(),
//       }
//     });

//     const records = result.data;
//     const record = records ? records[0] : undefined;
//     expect(typeof record?.balance).toBe("number");
//   })
// });
