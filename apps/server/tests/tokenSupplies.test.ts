import { addDays } from "date-fns";
import type { Application } from "express";
import request from "supertest";
import {
  CHAIN_ARBITRUM,
  CHAIN_BASE,
  CHAIN_BERACHAIN,
  CHAIN_ETHEREUM,
  CHAIN_FANTOM,
  CHAIN_POLYGON,
} from "../src/core/constants";
import { getISO8601DateString } from "./dateHelper";
import { parseNumber } from "./numberHelper";
import { startTestServer, stopTestServer } from "./setup/testServer";
import { getFirstRecord } from "./tokenSupplyHelper";

let app: Application;

beforeAll(async () => {
  const server = await startTestServer();
  app = server.app;
});

afterAll(async () => {
  await stopTestServer();
});

beforeEach(async () => {
  //
});

const getStartDate = (days: number = -5): string => {
  return getISO8601DateString(addDays(new Date(), days));
};

jest.setTimeout(10 * 1000);

describe("paginated", () => {
  test("returns recent results", async () => {
    const response = await request(app)
      .get("/operations/paginated/tokenSupplies")
      .query({
        wg_variables: JSON.stringify({ startDate: getStartDate(-1) }),
      });

    const records = response.body.data;
    const recordLength = records ? records.length : 0;
    expect(recordLength).toBeGreaterThan(0);
  });

  test("returns recent results beyond first page", async () => {
    const startDateString = getStartDate(-20);
    const response = await request(app)
      .get("/operations/paginated/tokenSupplies")
      .query({
        wg_variables: JSON.stringify({ startDate: startDateString }),
      });

    const records = response.body.data;
    const recordsNotNull = records ? records : [];
    // Most recent date
    expect(recordsNotNull[0].date).toEqual(getISO8601DateString(new Date()));
    // Last date
    expect(recordsNotNull[recordsNotNull.length - 1].date).toEqual(startDateString);
  });

  test(
    "subsequent results are equal",
    async () => {
      const response = await request(app)
        .get("/operations/paginated/tokenSupplies")
        .query({
          wg_variables: JSON.stringify({ startDate: getStartDate(-1) }),
        });

      const records = response.body.data;

      const responseTwo = await request(app)
        .get("/operations/paginated/tokenSupplies")
        .query({
          wg_variables: JSON.stringify({ startDate: getStartDate(-1) }),
        });

      expect(responseTwo.body.data).toEqual(records);
    },
    20 * 1000
  );

  test(
    "subsequent results are equal, long timeframe",
    async () => {
      // This tests both setting and getting a large amount of data, which can error out
      const response = await request(app)
        .get("/operations/paginated/tokenSupplies")
        .query({
          wg_variables: JSON.stringify({ startDate: getStartDate(-60) }),
        });

      const records = response.body.data;

      const responseTwo = await request(app)
        .get("/operations/paginated/tokenSupplies")
        .query({
          wg_variables: JSON.stringify({ startDate: getStartDate(-60) }),
        });

      expect(responseTwo.body.data).toEqual(records);
    },
    30 * 1000
  );

  test("returns results", async () => {
    const response = await request(app)
      .get("/operations/paginated/tokenSupplies")
      .query({
        wg_variables: JSON.stringify({ startDate: getStartDate(-5) }),
      });

    const records = response.body.data;
    const recordLength = records ? records.length : 0;
    expect(recordLength).toBeGreaterThan(0);
  });

  test("returns results when crossChainDataComplete is true", async () => {
    const response = await request(app)
      .get("/operations/paginated/tokenSupplies")
      .query({
        wg_variables: JSON.stringify({
          startDate: getStartDate(-5),
          crossChainDataComplete: true,
        }),
      });

    const records = response.body.data;
    const recordLength = records ? records.length : 0;
    expect(recordLength).toBeGreaterThan(0);
  });

  test("returns blockchain property for Arbitrum", async () => {
    const response = await request(app)
      .get("/operations/paginated/tokenSupplies")
      .query({
        wg_variables: JSON.stringify({ startDate: getStartDate() }),
      });

    const records = response.body.data;
    const filteredRecords = records
      ? records.filter((record: { blockchain?: string }) => record.blockchain === CHAIN_ARBITRUM)
      : [];
    expect(filteredRecords.length).toBeGreaterThan(0);
  });

  test("returns blockchain property for Ethereum", async () => {
    const response = await request(app)
      .get("/operations/paginated/tokenSupplies")
      .query({
        wg_variables: JSON.stringify({ startDate: getStartDate() }),
      });

    const records = response.body.data;
    const filteredRecords = records
      ? records.filter((record: { blockchain?: string }) => record.blockchain === CHAIN_ETHEREUM)
      : [];
    expect(filteredRecords.length).toBeGreaterThan(0);
  });

  test("returns blockchain property for Fantom", async () => {
    const response = await request(app)
      .get("/operations/paginated/tokenSupplies")
      .query({
        wg_variables: JSON.stringify({ startDate: getStartDate() }),
      });

    const records = response.body.data;
    const filteredRecords = records
      ? records.filter((record: { blockchain?: string }) => record.blockchain === CHAIN_FANTOM)
      : [];
    expect(filteredRecords.length).toBe(0); // 0 TokenSupply on this blockchain
  });

  test("returns blockchain property for Polygon", async () => {
    const response = await request(app)
      .get("/operations/paginated/tokenSupplies")
      .query({
        wg_variables: JSON.stringify({ startDate: getStartDate() }),
      });

    const records = response.body.data;
    const filteredRecords = records
      ? records.filter((record: { blockchain?: string }) => record.blockchain === CHAIN_POLYGON)
      : [];
    expect(filteredRecords.length).toBe(0); // 0 TokenSupply on this blockchain
  });
});

describe("latest", () => {
  test("returns the latest results for each chain", async () => {
    // Grab the results from the raw operation
    const rawResponse = await request(app).get("/operations/tokenSuppliesLatest");

    // Raw data has an array property for each chain
    const arbitrumRawResult = rawResponse.body.data?.treasuryArbitrum_tokenSupplies[0];
    const baseRawResult = rawResponse.body.data?.treasuryBase_tokenSupplies[0];
    const ethereumRawResult = rawResponse.body.data?.treasuryEthereum_tokenSupplies[0];
    const fantomRawResult = rawResponse.body.data?.treasuryFantom_tokenSupplies[0];
    const polygonRawResult = rawResponse.body.data?.treasuryPolygon_tokenSupplies[0];
    const berachainRawResult = rawResponse.body.data?.treasuryBerachain_tokenSupplies?.[0];

    // Calculate the expected count based on how many of the raw results were defined. This is because there may not be TokenSupply records on every chain.
    const expectedCount = [
      arbitrumRawResult,
      baseRawResult,
      ethereumRawResult,
      fantomRawResult,
      polygonRawResult,
      berachainRawResult,
    ].filter((result) => result !== undefined).length;

    // Grab the results from the latest operation
    const response = await request(app).get("/operations/latest/tokenSupplies");

    // Latest records is collapsed into a flat array
    const records = response.body.data;
    const arbitrumResult = getFirstRecord(records, CHAIN_ARBITRUM);
    const baseResult = getFirstRecord(records, CHAIN_BASE);
    const ethereumResult = getFirstRecord(records, CHAIN_ETHEREUM);
    const fantomResult = getFirstRecord(records, CHAIN_FANTOM);
    const polygonResult = getFirstRecord(records, CHAIN_POLYGON);
    const _berachainResult = getFirstRecord(records, CHAIN_BERACHAIN);

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

  test(
    "subsequent results are equal",
    async () => {
      const response = await request(app).get("/operations/latest/tokenSupplies");

      const records = response.body.data;

      const responseTwo = await request(app).get("/operations/latest/tokenSupplies");
      const data2 = responseTwo.body.data;

      // For arrays, exclude _meta.timestamp from each item
      const excludeTimestamp = (item: Record<string, unknown>) => {
        if (!item || !item._meta) return item;
        const { timestamp, ...restMeta } = item._meta as {
          timestamp: unknown;
          [key: string]: unknown;
        };
        return { ...item, _meta: restMeta };
      };

      const cleanRecords = Array.isArray(records) ? records.map(excludeTimestamp) : records;
      const cleanData2 = Array.isArray(data2) ? data2.map(excludeTimestamp) : data2;

      expect(cleanData2).toEqual(cleanRecords);
    },
    20 * 1000
  );
});

describe("earliest", () => {
  test("returns the earliest results for each chain", async () => {
    // Grab the results from the raw operation
    const rawResponse = await request(app).get("/operations/tokenSuppliesEarliest");

    // Raw data has an array property for each chain
    const arbitrumRawResult = rawResponse.body.data?.treasuryArbitrum_tokenSupplies[0];
    const baseRawResult = rawResponse.body.data?.treasuryBase_tokenSupplies[0];
    const ethereumRawResult = rawResponse.body.data?.treasuryEthereum_tokenSupplies[0];
    const fantomRawResult = rawResponse.body.data?.treasuryFantom_tokenSupplies[0];
    const polygonRawResult = rawResponse.body.data?.treasuryPolygon_tokenSupplies[0];
    const berachainRawResult = rawResponse.body.data?.treasuryBerachain_tokenSupplies?.[0];

    // Calculate the expected count based on how many of the raw results were defined. This is because there may not be TokenSupply records on every chain.
    const expectedCount = [
      arbitrumRawResult,
      baseRawResult,
      ethereumRawResult,
      fantomRawResult,
      polygonRawResult,
      berachainRawResult,
    ].filter((result) => result !== undefined).length;

    // Grab the results from the earliest operation
    const response = await request(app).get("/operations/earliest/tokenSupplies");

    // Latest records is collapsed into a flat array
    const records = response.body.data;
    const arbitrumResult = getFirstRecord(records, CHAIN_ARBITRUM);
    const baseResult = getFirstRecord(records, CHAIN_BASE);
    const ethereumResult = getFirstRecord(records, CHAIN_ETHEREUM);
    const fantomResult = getFirstRecord(records, CHAIN_FANTOM);
    const polygonResult = getFirstRecord(records, CHAIN_POLYGON);
    const _berachainResult = getFirstRecord(records, CHAIN_BERACHAIN);

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

  test(
    "subsequent results are equal",
    async () => {
      const response = await request(app).get("/operations/earliest/tokenSupplies");

      const records = response.body.data;

      const responseTwo = await request(app).get("/operations/earliest/tokenSupplies");

      expect(responseTwo.body.data).toEqual(records);
    },
    20 * 1000
  );
});

describe("atBlock", () => {
  test("returns the results for each chain at the specified block", async () => {
    const startDate = getISO8601DateString(addDays(new Date(), -1));

    // Grab the results for the previous day (hence not the result of the latest query)
    const rawResponse = await request(app)
      .get("/operations/paginated/tokenSupplies")
      .query({
        wg_variables: JSON.stringify({ startDate: startDate }),
      });

    // Raw data has an array property for each chain
    const arbitrumRawBlock = getFirstRecord(
      rawResponse.body.data,
      CHAIN_ARBITRUM,
      startDate
    )?.block;
    const baseRawBlock = getFirstRecord(rawResponse.body.data, CHAIN_BASE, startDate)?.block;
    const ethereumRawBlock = getFirstRecord(
      rawResponse.body.data,
      CHAIN_ETHEREUM,
      startDate
    )?.block;
    const fantomRawBlock = getFirstRecord(rawResponse.body.data, CHAIN_FANTOM, startDate)?.block;
    const polygonRawBlock = getFirstRecord(rawResponse.body.data, CHAIN_POLYGON, startDate)?.block;

    // Grab the results from the earliest operation
    const response = await request(app)
      .get("/operations/atBlock/tokenSupplies")
      .query({
        wg_variables: JSON.stringify({
          arbitrumBlock: parseNumber(arbitrumRawBlock),
          baseBlock: parseNumber(baseRawBlock),
          ethereumBlock: parseNumber(ethereumRawBlock),
          fantomBlock: parseNumber(fantomRawBlock),
          polygonBlock: parseNumber(polygonRawBlock),
        }),
      });

    // Latest records is collapsed into a flat array
    const records = response.body.data;
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
//     const response = await request(app)
//       .get('/operations/paginated/tokenSupplies')
//       .query({
//         wg_variables: JSON.stringify({ startDate: getStartDate() })
//       });
//
//     const records = response.body.data;
//     const record = records ? records[0] : undefined;
//     expect(typeof record?.balance).toBe("number");
//   })
// });
