import { addDays } from "date-fns";
import { createTestServer } from "../.wundergraph/generated/testing";
import { getISO8601DateString } from "./dateHelper";
import { TokenRecordsResponseData } from "../.wundergraph/generated/models";
import { CHAIN_ARBITRUM, CHAIN_ETHEREUM, CHAIN_FANTOM, CHAIN_POLYGON } from "../.wundergraph/constants";

const wg = createTestServer();

beforeAll(async () => {
  await wg.start();
});

afterAll(async () => {
  await wg.stop();
});

const getStartDate = (days: number = -5): string => {
  return getISO8601DateString(addDays(new Date(), days));
}

type TokenRecord = TokenRecordsResponseData["treasuryEthereum_tokenRecords"][0];

const getFirstRecordByChain = (records: TokenRecord[] | undefined, chain: string): TokenRecord | null => {
  if (!records) {
    return null;
  }

  const filteredRecords = records.filter((record) => record.blockchain === chain);
  return filteredRecords.length > 0 ? filteredRecords[0] : null;
}

const getFirstRecordByChainByDate = (records: TokenRecord[] | undefined, chain: string, date: string): TokenRecord | null => {
  if (!records) {
    return null;
  }

  const filteredRecords = records.filter((record) => record.blockchain === chain && record.date == date);
  return filteredRecords.length > 0 ? filteredRecords[0] : null;
}

describe("paginated", () => {
  test("returns recent results", async () => {
    const result = await wg.client().query({
      operationName: "paginated/metrics",
      input: {
        startDate: getStartDate(-1),
      }
    });

    const records = result.data;
    const recordLength = records ? records.length : 0;
    expect(recordLength).toBeGreaterThan(0);
  });

  test("returns results", async () => {
    const result = await wg.client().query({
      operationName: "paginated/metrics",
      input: {
        startDate: getStartDate(-5),
      }
    });

    const records = result.data;
    const recordLength = records ? records.length : 0;
    expect(recordLength).toBeGreaterThan(0);
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
    const arbitrumRawBlock: number = arbitrumRawResult?.block ? parseInt(arbitrumRawResult.block) : 0;
    const ethereumRawResult = rawResult.data?.treasuryEthereum_tokenRecords[0];
    const ethereumRawBlock: number = ethereumRawResult?.block ? parseInt(ethereumRawResult.block) : 0;
    const fantomRawResult = rawResult.data?.treasuryFantom_tokenRecords[0];
    const fantomRawBlock: number = fantomRawResult?.block ? parseInt(fantomRawResult.block) : 0;
    const polygonRawResult = rawResult.data?.treasuryPolygon_tokenRecords[0];
    const polygonRawBlock: number = polygonRawResult?.block ? parseInt(polygonRawResult.block) : 0;

    // Grab the results from the latest operation
    const result = await wg.client().query({
      operationName: "latest/metrics",
    });

    // Single record
    const record = result.data;

    expect(record).not.toBeNull();

    // Check that the block is the same
    expect(record?.blocks.Arbitrum).toEqual(arbitrumRawBlock);
    expect(record?.blocks.Ethereum).toEqual(ethereumRawBlock);
    expect(record?.blocks.Fantom).toEqual(fantomRawBlock);
    expect(record?.blocks.Polygon).toEqual(polygonRawBlock);
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
    const arbitrumRawBlock: number = arbitrumRawResult?.block ? parseInt(arbitrumRawResult.block) : 0;
    const ethereumRawResult = rawResult.data?.treasuryEthereum_tokenRecords[0];
    const ethereumRawBlock: number = ethereumRawResult?.block ? parseInt(ethereumRawResult.block) : 0;
    const fantomRawResult = rawResult.data?.treasuryFantom_tokenRecords[0];
    const fantomRawBlock: number = fantomRawResult?.block ? parseInt(fantomRawResult.block) : 0;
    const polygonRawResult = rawResult.data?.treasuryPolygon_tokenRecords[0];
    const polygonRawBlock: number = polygonRawResult?.block ? parseInt(polygonRawResult.block) : 0;

    // Grab the results from the earliest operation
    const result = await wg.client().query({
      operationName: "earliest/metrics",
    });

    // Single record
    const record = result.data;

    expect(record).not.toBeNull();

    // Check that the block is the same
    expect(record?.blocks.Arbitrum).toEqual(arbitrumRawBlock);
    expect(record?.blocks.Ethereum).toEqual(ethereumRawBlock);
    expect(record?.blocks.Fantom).toEqual(fantomRawBlock);
    expect(record?.blocks.Polygon).toEqual(polygonRawBlock);
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
    const arbitrumRawResult = getFirstRecordByChainByDate(rawResult.data, CHAIN_ARBITRUM, startDate);
    const arbitrumRawBlock: number = arbitrumRawResult?.block ? parseInt(arbitrumRawResult.block) : 0;
    const ethereumRawResult = getFirstRecordByChainByDate(rawResult.data, CHAIN_ETHEREUM, startDate);
    const ethereumRawBlock: number = ethereumRawResult?.block ? parseInt(ethereumRawResult.block) : 0;
    const fantomRawResult = getFirstRecordByChainByDate(rawResult.data, CHAIN_FANTOM, startDate);
    const fantomRawBlock: number = fantomRawResult?.block ? parseInt(fantomRawResult.block) : 0;
    const polygonRawResult = getFirstRecordByChainByDate(rawResult.data, CHAIN_POLYGON, startDate);
    const polygonRawBlock: number = polygonRawResult?.block ? parseInt(polygonRawResult.block) : 0;

    // Grab the results from the earliest operation
    const result = await wg.client().query({
      operationName: "atBlock/metrics",
      input: {
        arbitrumBlock: arbitrumRawBlock,
        ethereumBlock: ethereumRawBlock,
        fantomBlock: fantomRawBlock,
        polygonBlock: polygonRawBlock,
      }
    });

    // Single record
    const record = result.data;

    expect(record).not.toBeNull();

    // Check that the block is the same
    expect(record?.blocks.Arbitrum).toEqual(arbitrumRawBlock);
    expect(record?.blocks.Ethereum).toEqual(ethereumRawBlock);
    expect(record?.blocks.Fantom).toEqual(fantomRawBlock);
    expect(record?.blocks.Polygon).toEqual(polygonRawBlock);
  });
});
