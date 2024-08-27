import { addDays } from "date-fns";
import { createTestServer } from "../.wundergraph/generated/testing";
import { getISO8601DateString } from "./dateHelper";
import { CHAIN_ARBITRUM, CHAIN_BASE, CHAIN_ETHEREUM, CHAIN_FANTOM, CHAIN_POLYGON } from "../.wundergraph/constants";
import { getFirstRecord } from "./tokenSupplyHelper";
import { parseNumber } from "./numberHelper";

const wg = createTestServer();

beforeAll(async () => {
  await wg.start();
});

afterAll(async () => {
  await wg.stop();
});

beforeEach(async () => {
  //
});

const getStartDate = (days: number = -5): string => {
  return getISO8601DateString(addDays(new Date(), days));
}

jest.setTimeout(10 * 1000);

describe("paginated", () => {
  test("returns recent results", async () => {
    const result = await wg.client().query({
      operationName: "paginated/tokenSupplies",
      input: {
        startDate: getStartDate(-1),
      }
    });

    const records = result.data;
    const recordLength = records ? records.length : 0;
    expect(recordLength).toBeGreaterThan(0);
  });

  test("returns recent results beyond first page", async () => {
    const startDateString = getStartDate(-20); // default date offset of 10
    const result = await wg.client().query({
      operationName: "paginated/tokenSupplies",
      input: {
        startDate: startDateString,
      }
    });

    const records = result.data;
    const recordsNotNull = records ? records : [];
    // Most recent date
    expect(recordsNotNull[0].date).toEqual(getISO8601DateString(new Date()));
    // Last date
    expect(recordsNotNull[recordsNotNull.length - 1].date).toEqual(startDateString);
  });

  test("subsequent results are equal", async () => {
    const result = await wg.client().query({
      operationName: "paginated/tokenSupplies",
      input: {
        startDate: getStartDate(-1),
      },
    });

    const records = result.data;

    const resultTwo = await wg.client().query({
      operationName: "paginated/tokenSupplies",
      input: {
        startDate: getStartDate(-1),
      },
    });

    expect(resultTwo.data).toEqual(records);
  }, 20 * 1000);

  test("subsequent results are equal, long timeframe", async () => {
    // This tests both setting and getting a large amount of data, which can error out
    const result = await wg.client().query({
      operationName: "paginated/tokenSupplies",
      input: {
        startDate: getStartDate(-60),
      },
    });

    const records = result.data;

    const resultTwo = await wg.client().query({
      operationName: "paginated/tokenSupplies",
      input: {
        startDate: getStartDate(-60),
      },
    });

    expect(resultTwo.data).toEqual(records);
  }, 30 * 1000);

  test("returns results", async () => {
    const result = await wg.client().query({
      operationName: "paginated/tokenSupplies",
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
      operationName: "paginated/tokenSupplies",
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
      operationName: "paginated/tokenSupplies",
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
      operationName: "paginated/tokenSupplies",
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
      operationName: "paginated/tokenSupplies",
      input: {
        startDate: getStartDate(),
      }
    });

    const records = result.data;
    const filteredRecords = records ? records.filter((record) => record.blockchain === CHAIN_FANTOM) : [];
    expect(filteredRecords.length).toBe(0); // 0 TokenSupply on this blockchain
  });

  test("returns blockchain property for Polygon", async () => {
    const result = await wg.client().query({
      operationName: "paginated/tokenSupplies",
      input: {
        startDate: getStartDate(),
      }
    });

    const records = result.data;
    const filteredRecords = records ? records.filter((record) => record.blockchain === CHAIN_POLYGON) : [];
    expect(filteredRecords.length).toBe(0); // 0 TokenSupply on this blockchain
  });
});

describe("latest", () => {
  test("returns the latest results for each chain", async () => {
    // Grab the results from the raw operation
    const rawResult = await wg.client().query({
      operationName: "tokenSuppliesLatest",
    });

    // Raw data has an array property for each chain
    const arbitrumRawResult = rawResult.data?.treasuryArbitrum_tokenSupplies[0];
    const baseRawResult = rawResult.data?.treasuryBase_tokenSupplies[0];
    const ethereumRawResult = rawResult.data?.treasuryEthereum_tokenSupplies[0];
    const fantomRawResult = rawResult.data?.treasuryFantom_tokenSupplies[0];
    const polygonRawResult = rawResult.data?.treasuryPolygon_tokenSupplies[0];

    // Calculate the expected count based on how many of the raw results were defined. This is because there may not be TokenSupply records on every chain.
    const expectedCount = [arbitrumRawResult, baseRawResult, ethereumRawResult, fantomRawResult, polygonRawResult].filter((result) => result !== undefined).length;

    // Grab the results from the latest operation
    const result = await wg.client().query({
      operationName: "latest/tokenSupplies",
    });

    // Latest records is collapsed into a flat array
    const records = result.data;
    const arbitrumResult = getFirstRecord(records, CHAIN_ARBITRUM);
    const baseResult = getFirstRecord(records, CHAIN_BASE);
    const ethereumResult = getFirstRecord(records, CHAIN_ETHEREUM);
    const fantomResult = getFirstRecord(records, CHAIN_FANTOM);
    const polygonResult = getFirstRecord(records, CHAIN_POLYGON);

    // Check that the block is the same
    expect(arbitrumResult?.block).toEqual(arbitrumRawResult?.block);
    expect(baseResult?.block).toEqual(baseRawResult?.block);
    expect(ethereumResult?.block).toEqual(ethereumRawResult?.block);
    expect(fantomResult?.block).toEqual(fantomRawResult?.block);
    expect(polygonResult?.block).toEqual(polygonRawResult?.block);

    // Check that the array length is the same
    const recordLength = records ? records.length : 0;
    expect(recordLength).toEqual(expectedCount);
  });

  test("subsequent results are equal", async () => {
    const result = await wg.client().query({
      operationName: "latest/tokenSupplies",
    });

    const records = result.data;

    const resultTwo = await wg.client().query({
      operationName: "latest/tokenSupplies",
    });

    expect(resultTwo.data).toEqual(records);
  }, 20 * 1000);
});

describe("earliest", () => {
  test("returns the earliest results for each chain", async () => {
    // Grab the results from the raw operation
    const rawResult = await wg.client().query({
      operationName: "tokenSuppliesEarliest",
    });

    // Raw data has an array property for each chain
    const arbitrumRawResult = rawResult.data?.treasuryArbitrum_tokenSupplies[0];
    const baseRawResult = rawResult.data?.treasuryBase_tokenSupplies[0];
    const ethereumRawResult = rawResult.data?.treasuryEthereum_tokenSupplies[0];
    const fantomRawResult = rawResult.data?.treasuryFantom_tokenSupplies[0];
    const polygonRawResult = rawResult.data?.treasuryPolygon_tokenSupplies[0];

    // Calculate the expected count based on how many of the raw results were defined. This is because there may not be TokenSupply records on every chain.
    const expectedCount = [arbitrumRawResult, baseRawResult, ethereumRawResult, fantomRawResult, polygonRawResult].filter((result) => result !== undefined).length;

    // Grab the results from the earliest operation
    const result = await wg.client().query({
      operationName: "earliest/tokenSupplies",
    });

    // Latest records is collapsed into a flat array
    const records = result.data;
    const arbitrumResult = getFirstRecord(records, CHAIN_ARBITRUM);
    const baseResult = getFirstRecord(records, CHAIN_BASE);
    const ethereumResult = getFirstRecord(records, CHAIN_ETHEREUM);
    const fantomResult = getFirstRecord(records, CHAIN_FANTOM);
    const polygonResult = getFirstRecord(records, CHAIN_POLYGON);

    // Check that the block is the same
    expect(arbitrumResult?.block).toEqual(arbitrumRawResult?.block);
    expect(baseResult?.block).toEqual(baseRawResult?.block);
    expect(ethereumResult?.block).toEqual(ethereumRawResult?.block);
    expect(fantomResult?.block).toEqual(fantomRawResult?.block);
    expect(polygonResult?.block).toEqual(polygonRawResult?.block);

    // Check that the array length is the same
    const recordLength = records ? records.length : 0;
    expect(recordLength).toEqual(expectedCount);
  });

  test("subsequent results are equal", async () => {
    const result = await wg.client().query({
      operationName: "earliest/tokenSupplies",
    });

    const records = result.data;

    const resultTwo = await wg.client().query({
      operationName: "earliest/tokenSupplies",
    });

    expect(resultTwo.data).toEqual(records);
  }, 20 * 1000);
});

describe("atBlock", () => {
  test("returns the results for each chain at the specified block", async () => {
    const startDate = getISO8601DateString(addDays(new Date(), -1));

    // Grab the results for the previous day (hence not the result of the latest query)
    const rawResult = await wg.client().query({
      operationName: "paginated/tokenSupplies",
      input: {
        startDate: startDate,
      },
    });

    // Raw data has an array property for each chain
    const arbitrumRawBlock = getFirstRecord(rawResult.data, CHAIN_ARBITRUM, startDate)?.block;
    const baseRawBlock = getFirstRecord(rawResult.data, CHAIN_BASE, startDate)?.block;
    const ethereumRawBlock = getFirstRecord(rawResult.data, CHAIN_ETHEREUM, startDate)?.block;
    const fantomRawBlock = getFirstRecord(rawResult.data, CHAIN_FANTOM, startDate)?.block;
    const polygonRawBlock = getFirstRecord(rawResult.data, CHAIN_POLYGON, startDate)?.block;

    // Grab the results from the earliest operation
    const result = await wg.client().query({
      operationName: "atBlock/tokenSupplies",
      input: {
        arbitrumBlock: parseNumber(arbitrumRawBlock),
        baseBlock: parseNumber(baseRawBlock),
        ethereumBlock: parseNumber(ethereumRawBlock),
        fantomBlock: parseNumber(fantomRawBlock),
        polygonBlock: parseNumber(polygonRawBlock),
      }
    });

    // Latest records is collapsed into a flat array
    const records = result.data;
    const arbitrumResult = getFirstRecord(records, CHAIN_ARBITRUM);
    const baseResult = getFirstRecord(records, CHAIN_BASE);
    const ethereumResult = getFirstRecord(records, CHAIN_ETHEREUM);
    const fantomResult = getFirstRecord(records, CHAIN_FANTOM);
    const polygonResult = getFirstRecord(records, CHAIN_POLYGON);

    // Check that the block is the same
    expect(arbitrumResult?.block).toEqual(arbitrumRawBlock);
    expect(baseResult?.block).toEqual(baseRawBlock);
    expect(ethereumResult?.block).toEqual(ethereumRawBlock);
    expect(fantomResult?.block).toEqual(fantomRawBlock);
    expect(polygonResult?.block).toEqual(polygonRawBlock);
  });
});

// describe("converts to numbers", () => {
//   test("success", async () => {
//     const result = await wg.client().query({
//       operationName: "paginated/tokenSupplies",
//       input: {
//         startDate: getStartDate(),
//       }
//     });

//     const records = result.data;
//     const record = records ? records[0] : undefined;
//     expect(typeof record?.balance).toBe("number");
//   })
// });
