import { addDays } from "date-fns";
import { createTestServer } from "../.wundergraph/generated/testing";
import { getISO8601DateString } from "./dateHelper";
import { CHAIN_ARBITRUM, CHAIN_ETHEREUM, CHAIN_FANTOM, CHAIN_POLYGON, TOKEN_SUPPLY_TYPE_BONDS_DEPOSITS, TOKEN_SUPPLY_TYPE_BONDS_PREMINTED, TOKEN_SUPPLY_TYPE_BONDS_VESTING_DEPOSITS, TOKEN_SUPPLY_TYPE_BOOSTED_LIQUIDITY_VAULT, TOKEN_SUPPLY_TYPE_LENDING, TOKEN_SUPPLY_TYPE_LIQUIDITY, TOKEN_SUPPLY_TYPE_OFFSET, TOKEN_SUPPLY_TYPE_TOTAL_SUPPLY, TOKEN_SUPPLY_TYPE_TREASURY } from "../.wundergraph/constants";
import { getSupplyBalanceForTypes } from "./metricsHelper";
import { TokenRecord, filterReduce, filter as filterTokenRecords, getFirstRecord as getFirstTokenRecord } from "./tokenRecordHelper";
import { TokenSupply, filter as filterTokenSupplies, getFirstRecord as getFirstTokenSupplies } from "./tokenSupplyHelper";
import { ProtocolMetric } from "./protocolMetricHelper";
import { parseNumber } from "./numberHelper";

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

describe("paginated", () => {
  test("recent results", async () => {
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

  test("crossChainDataComplete true", async () => {
    const result = await wg.client().query({
      operationName: "paginated/metrics",
      input: {
        startDate: getStartDate(-5),
        crossChainDataComplete: true,
      }
    });

    const records = result.data;
    const recordLength = records ? records.length : 0;
    expect(recordLength).toBeGreaterThan(0);
  });

  test("includeRecords true", async () => {
    const result = await wg.client().query({
      operationName: "paginated/metrics",
      input: {
        startDate: getStartDate(-5),
        includeRecords: true,
      }
    });

    const records = result.data;
    const recordLength = records ? records.length : 0;
    expect(recordLength).toBeGreaterThan(0);

    const firstRecord = records![0];
    const totalSupplyRecords = firstRecord.ohmTotalSupplyRecords;
    const circulatingSupplyRecords = firstRecord.ohmCirculatingSupplyRecords;
    const floatingSupplyRecords = firstRecord.ohmFloatingSupplyRecords;
    const backedSupplyRecords = firstRecord.ohmBackedSupplyRecords;
    const treasuryMarketValueRecords = firstRecord.treasuryMarketValueRecords;
    const treasuryLiquidBackingRecords = firstRecord.treasuryLiquidBackingRecords;

    expect(totalSupplyRecords?.Arbitrum.length).toBeGreaterThan(0);
    expect(totalSupplyRecords?.Ethereum.length).toBeGreaterThan(0);

    expect(circulatingSupplyRecords?.Arbitrum.length).toBeGreaterThan(0);
    expect(circulatingSupplyRecords?.Ethereum.length).toBeGreaterThan(0);

    expect(floatingSupplyRecords?.Arbitrum.length).toBeGreaterThan(0);
    expect(floatingSupplyRecords?.Ethereum.length).toBeGreaterThan(0);

    expect(backedSupplyRecords?.Arbitrum.length).toBeGreaterThan(0);
    expect(backedSupplyRecords?.Ethereum.length).toBeGreaterThan(0);

    expect(treasuryMarketValueRecords?.Arbitrum.length).toBeGreaterThan(0);
    expect(treasuryMarketValueRecords?.Ethereum.length).toBeGreaterThan(0);

    expect(treasuryLiquidBackingRecords?.Arbitrum.length).toBeGreaterThan(0);
    expect(treasuryLiquidBackingRecords?.Ethereum.length).toBeGreaterThan(0);
  }, 10000);

  test("includeRecords false", async () => {
    const result = await wg.client().query({
      operationName: "paginated/metrics",
      input: {
        startDate: getStartDate(-5),
        includeRecords: false,
      }
    });

    const records = result.data;
    const recordLength = records ? records.length : 0;
    expect(recordLength).toBeGreaterThan(0);

    const firstRecord = records![0];
    const totalSupplyRecords = firstRecord.ohmTotalSupplyRecords;
    const circulatingSupplyRecords = firstRecord.ohmCirculatingSupplyRecords;
    const floatingSupplyRecords = firstRecord.ohmFloatingSupplyRecords;
    const backedSupplyRecords = firstRecord.ohmBackedSupplyRecords;
    const treasuryMarketValueRecords = firstRecord.treasuryMarketValueRecords;
    const treasuryLiquidBackingRecords = firstRecord.treasuryLiquidBackingRecords;

    expect(totalSupplyRecords).not.toBeDefined();
    expect(circulatingSupplyRecords).not.toBeDefined();
    expect(floatingSupplyRecords).not.toBeDefined();
    expect(backedSupplyRecords).not.toBeDefined();
    expect(treasuryMarketValueRecords).not.toBeDefined();
    expect(treasuryLiquidBackingRecords).not.toBeDefined();
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
    const arbitrumRawBlock: number = parseNumber(arbitrumRawResult?.block);
    const arbitrumRawTimestamp: number = parseNumber(arbitrumRawResult?.timestamp);
    const ethereumRawResult = rawResult.data?.treasuryEthereum_tokenRecords[0];
    const ethereumRawBlock: number = parseNumber(ethereumRawResult?.block);
    const ethereumRawTimestamp: number = parseNumber(ethereumRawResult?.timestamp);
    const fantomRawResult = rawResult.data?.treasuryFantom_tokenRecords[0];
    const fantomRawBlock: number = parseNumber(fantomRawResult?.block);
    const fantomRawTimestamp: number = parseNumber(fantomRawResult?.timestamp);
    const polygonRawResult = rawResult.data?.treasuryPolygon_tokenRecords[0];
    const polygonRawBlock: number = parseNumber(polygonRawResult?.block);
    const polygonRawTimestamp: number = parseNumber(polygonRawResult?.timestamp);

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

    // Check that the timestamp is the same
    expect(record?.timestamps.Arbitrum).toEqual(arbitrumRawTimestamp);
    expect(record?.timestamps.Ethereum).toEqual(ethereumRawTimestamp);
    expect(record?.timestamps.Fantom).toEqual(fantomRawTimestamp);
    expect(record?.timestamps.Polygon).toEqual(polygonRawTimestamp);
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
    const arbitrumRawBlock: number = parseNumber(arbitrumRawResult?.block);
    const arbitrumRawTimestamp: number = parseNumber(arbitrumRawResult?.timestamp);
    const ethereumRawResult = rawResult.data?.treasuryEthereum_tokenRecords[0];
    const ethereumRawBlock: number = parseNumber(ethereumRawResult?.block);
    const ethereumRawTimestamp: number = parseNumber(ethereumRawResult?.timestamp);
    const fantomRawResult = rawResult.data?.treasuryFantom_tokenRecords[0];
    const fantomRawBlock: number = parseNumber(fantomRawResult?.block);
    const fantomRawTimestamp: number = parseNumber(fantomRawResult?.timestamp);
    const polygonRawResult = rawResult.data?.treasuryPolygon_tokenRecords[0];
    const polygonRawBlock: number = parseNumber(polygonRawResult?.block);
    const polygonRawTimestamp: number = parseNumber(polygonRawResult?.timestamp);

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

    // Check that the timestamp is the same
    expect(record?.timestamps.Arbitrum).toEqual(arbitrumRawTimestamp);
    expect(record?.timestamps.Ethereum).toEqual(ethereumRawTimestamp);
    expect(record?.timestamps.Fantom).toEqual(fantomRawTimestamp);
    expect(record?.timestamps.Polygon).toEqual(polygonRawTimestamp);
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
    const arbitrumRawResult = getFirstTokenRecord(rawResult.data, CHAIN_ARBITRUM, startDate);
    const arbitrumRawBlock: number = parseNumber(arbitrumRawResult?.block);
    const arbitrumRawTimestamp: number = parseNumber(arbitrumRawResult?.timestamp);
    const ethereumRawResult = getFirstTokenRecord(rawResult.data, CHAIN_ETHEREUM, startDate);
    const ethereumRawBlock: number = parseNumber(ethereumRawResult?.block);
    const ethereumRawTimestamp: number = parseNumber(ethereumRawResult?.timestamp);
    const fantomRawResult = getFirstTokenRecord(rawResult.data, CHAIN_FANTOM, startDate);
    const fantomRawBlock: number = parseNumber(fantomRawResult?.block);
    const fantomRawTimestamp: number = parseNumber(fantomRawResult?.timestamp);
    const polygonRawResult = getFirstTokenRecord(rawResult.data, CHAIN_POLYGON, startDate);
    const polygonRawBlock: number = parseNumber(polygonRawResult?.block);
    const polygonRawTimestamp: number = parseNumber(polygonRawResult?.timestamp);

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

    // Check that the timestamp is the same
    expect(record?.timestamps.Arbitrum).toEqual(arbitrumRawTimestamp);
    expect(record?.timestamps.Ethereum).toEqual(ethereumRawTimestamp);
    expect(record?.timestamps.Fantom).toEqual(fantomRawTimestamp);
    expect(record?.timestamps.Polygon).toEqual(polygonRawTimestamp);
  });
});

describe("metrics", () => {
  const START_DATE = getStartDate(-1);

  const getRecords = async (startDate: string): Promise<[TokenRecord[], TokenSupply[], ProtocolMetric[]]> => {
    // Grab the TokenRecord results
    const rawTokenRecordsResult = await wg.client().query({
      operationName: "paginated/tokenRecords",
      input: {
        startDate: startDate,
      },
    });
    const combinedTokenRecords = filterTokenRecords(rawTokenRecordsResult.data, undefined, START_DATE);

    // Grab the results from the raw TokenSupply operation
    const rawTokenSuppliesResult = await wg.client().query({
      operationName: "paginated/tokenSupplies",
      input: {
        startDate: startDate,
      },
    });
    const combinedTokenSupplies = filterTokenSupplies(rawTokenSuppliesResult.data, undefined, START_DATE);

    // Grab the results from the raw TokenSupply operation
    const rawProtocolMetricsResult = await wg.client().query({
      operationName: "paginated/protocolMetrics",
      input: {
        startDate: START_DATE,
      },
    });
    const combinedProtocolMetrics = rawProtocolMetricsResult.data || [];

    return [combinedTokenRecords, combinedTokenSupplies, combinedProtocolMetrics];
  };

  test("total supply is accurate", async () => {
    const [combinedTokenRecords, combinedTokenSupplies, combinedProtocolMetrics] = await getRecords(START_DATE);

    // Raw data has an array property for each chain
    const arbitrumTokenRecords = filterTokenRecords(combinedTokenRecords, CHAIN_ARBITRUM);
    const ethereumTokenRecords = filterTokenRecords(combinedTokenRecords, CHAIN_ETHEREUM);
    const fantomTokenRecords = filterTokenRecords(combinedTokenRecords, CHAIN_FANTOM);
    const polygonTokenRecords = filterTokenRecords(combinedTokenRecords, CHAIN_POLYGON);

    // Raw data has an array property for each chain
    const arbitrumTokenSupplies = filterTokenSupplies(combinedTokenSupplies, CHAIN_ARBITRUM);
    const ethereumTokenSupplies = filterTokenSupplies(combinedTokenSupplies, CHAIN_ETHEREUM);
    const fantomTokenSupplies = filterTokenSupplies(combinedTokenSupplies, CHAIN_FANTOM);
    const polygonTokenSupplies = filterTokenSupplies(combinedTokenSupplies, CHAIN_POLYGON);

    // Raw data has an array property for each chain
    const ethereumProtocolMetrics = combinedProtocolMetrics.filter(record => record.block === ethereumTokenRecords[0].block);
    const ohmIndex = +ethereumProtocolMetrics[0].currentIndex;

    // Calculate expected results
    const includedTypes = [TOKEN_SUPPLY_TYPE_TOTAL_SUPPLY];
    const expectedSupply = getSupplyBalanceForTypes(combinedTokenSupplies, includedTypes, ohmIndex)[0];
    const expectedArbitrumSupply = getSupplyBalanceForTypes(arbitrumTokenSupplies, includedTypes, ohmIndex)[0];
    const expectedEthereumSupply = getSupplyBalanceForTypes(ethereumTokenSupplies, includedTypes, ohmIndex)[0];
    const expectedFantomSupply = getSupplyBalanceForTypes(fantomTokenSupplies, includedTypes, ohmIndex)[0];
    const expectedPolygonSupply = getSupplyBalanceForTypes(polygonTokenSupplies, includedTypes, ohmIndex)[0];

    // Grab the results from the latest operation
    const result = await wg.client().query({
      operationName: "paginated/metrics",
      input: {
        startDate: START_DATE,
      },
    });

    // Fetch the Metric record for the same date
    const records = result.data;
    const record = records?.filter(record => record.date === START_DATE)[0];

    expect(record).not.toBeNull();
    expect(record?.ohmTotalSupply).toBeCloseTo(expectedSupply);
    expect(record?.ohmTotalSupplyComponents.Arbitrum).toBeCloseTo(expectedArbitrumSupply);
    expect(record?.ohmTotalSupplyComponents.Ethereum).toBeCloseTo(expectedEthereumSupply);
    expect(record?.ohmTotalSupplyComponents.Fantom).toBeCloseTo(expectedFantomSupply);
    expect(record?.ohmTotalSupplyComponents.Polygon).toBeCloseTo(expectedPolygonSupply);
  }, 10000);

  test("circulating supply is accurate", async () => {
    const [combinedTokenRecords, combinedTokenSupplies, combinedProtocolMetrics] = await getRecords(START_DATE);

    // Raw data has an array property for each chain
    const arbitrumTokenRecords = filterTokenRecords(combinedTokenRecords, CHAIN_ARBITRUM);
    const ethereumTokenRecords = filterTokenRecords(combinedTokenRecords, CHAIN_ETHEREUM);
    const fantomTokenRecords = filterTokenRecords(combinedTokenRecords, CHAIN_FANTOM);
    const polygonTokenRecords = filterTokenRecords(combinedTokenRecords, CHAIN_POLYGON);

    // Raw data has an array property for each chain
    const arbitrumTokenSupplies = filterTokenSupplies(combinedTokenSupplies, CHAIN_ARBITRUM);
    const ethereumTokenSupplies = filterTokenSupplies(combinedTokenSupplies, CHAIN_ETHEREUM);
    const fantomTokenSupplies = filterTokenSupplies(combinedTokenSupplies, CHAIN_FANTOM);
    const polygonTokenSupplies = filterTokenSupplies(combinedTokenSupplies, CHAIN_POLYGON);

    // Raw data has an array property for each chain
    const ethereumProtocolMetrics = combinedProtocolMetrics.filter(record => record.block === ethereumTokenRecords[0].block);

    const ohmIndex = +ethereumProtocolMetrics[0].currentIndex;

    // Calculate expected results
    const includedTypes = [
      TOKEN_SUPPLY_TYPE_TOTAL_SUPPLY,
      TOKEN_SUPPLY_TYPE_TREASURY,
      TOKEN_SUPPLY_TYPE_OFFSET,
      TOKEN_SUPPLY_TYPE_BONDS_PREMINTED,
      TOKEN_SUPPLY_TYPE_BONDS_VESTING_DEPOSITS,
      TOKEN_SUPPLY_TYPE_BONDS_DEPOSITS,
    ];
    const expectedSupply = getSupplyBalanceForTypes(combinedTokenSupplies, includedTypes, ohmIndex)[0];
    const expectedArbitrumSupply = getSupplyBalanceForTypes(arbitrumTokenSupplies, includedTypes, ohmIndex)[0];
    const expectedEthereumSupply = getSupplyBalanceForTypes(ethereumTokenSupplies, includedTypes, ohmIndex)[0];
    const expectedFantomSupply = getSupplyBalanceForTypes(fantomTokenSupplies, includedTypes, ohmIndex)[0];
    const expectedPolygonSupply = getSupplyBalanceForTypes(polygonTokenSupplies, includedTypes, ohmIndex)[0];

    // Grab the results from the latest operation
    const result = await wg.client().query({
      operationName: "paginated/metrics",
      input: {
        startDate: START_DATE,
      },
    });

    // Fetch the Metric record for the same date
    const records = result.data;
    const record = records?.filter(record => record.date === START_DATE)[0];

    expect(record).not.toBeNull();
    expect(record?.ohmCirculatingSupply).toBeCloseTo(expectedSupply);
    expect(record?.ohmCirculatingSupplyComponents.Arbitrum).toBeCloseTo(expectedArbitrumSupply);
    expect(record?.ohmCirculatingSupplyComponents.Ethereum).toBeCloseTo(expectedEthereumSupply);
    expect(record?.ohmCirculatingSupplyComponents.Fantom).toBeCloseTo(expectedFantomSupply);
    expect(record?.ohmCirculatingSupplyComponents.Polygon).toBeCloseTo(expectedPolygonSupply);
  }, 10000);

  test("floating supply is accurate", async () => {
    const [combinedTokenRecords, combinedTokenSupplies, combinedProtocolMetrics] = await getRecords(START_DATE);

    // Raw data has an array property for each chain
    const arbitrumTokenRecords = filterTokenRecords(combinedTokenRecords, CHAIN_ARBITRUM);
    const ethereumTokenRecords = filterTokenRecords(combinedTokenRecords, CHAIN_ETHEREUM);
    const fantomTokenRecords = filterTokenRecords(combinedTokenRecords, CHAIN_FANTOM);
    const polygonTokenRecords = filterTokenRecords(combinedTokenRecords, CHAIN_POLYGON);

    // Raw data has an array property for each chain
    const arbitrumTokenSupplies = filterTokenSupplies(combinedTokenSupplies, CHAIN_ARBITRUM);
    const ethereumTokenSupplies = filterTokenSupplies(combinedTokenSupplies, CHAIN_ETHEREUM);
    const fantomTokenSupplies = filterTokenSupplies(combinedTokenSupplies, CHAIN_FANTOM);
    const polygonTokenSupplies = filterTokenSupplies(combinedTokenSupplies, CHAIN_POLYGON);

    // Raw data has an array property for each chain
    const ethereumProtocolMetrics = combinedProtocolMetrics.filter(record => record.block === ethereumTokenRecords[0].block);

    const ohmIndex = +ethereumProtocolMetrics[0].currentIndex;

    // Calculate expected results
    const includedTypes = [
      TOKEN_SUPPLY_TYPE_TOTAL_SUPPLY,
      TOKEN_SUPPLY_TYPE_TREASURY,
      TOKEN_SUPPLY_TYPE_OFFSET,
      TOKEN_SUPPLY_TYPE_BONDS_PREMINTED,
      TOKEN_SUPPLY_TYPE_BONDS_VESTING_DEPOSITS,
      TOKEN_SUPPLY_TYPE_BONDS_DEPOSITS,
      TOKEN_SUPPLY_TYPE_LIQUIDITY,
    ];
    const expectedSupply = getSupplyBalanceForTypes(combinedTokenSupplies, includedTypes, ohmIndex)[0];
    const expectedArbitrumSupply = getSupplyBalanceForTypes(arbitrumTokenSupplies, includedTypes, ohmIndex)[0];
    const expectedEthereumSupply = getSupplyBalanceForTypes(ethereumTokenSupplies, includedTypes, ohmIndex)[0];
    const expectedFantomSupply = getSupplyBalanceForTypes(fantomTokenSupplies, includedTypes, ohmIndex)[0];
    const expectedPolygonSupply = getSupplyBalanceForTypes(polygonTokenSupplies, includedTypes, ohmIndex)[0];

    // Grab the results from the latest operation
    const result = await wg.client().query({
      operationName: "paginated/metrics",
      input: {
        startDate: START_DATE,
      },
    });

    // Fetch the Metric record for the same date
    const records = result.data;
    const record = records?.filter(record => record.date === START_DATE)[0];

    expect(record).not.toBeNull();
    expect(record?.ohmFloatingSupply).toBeCloseTo(expectedSupply);
    expect(record?.ohmFloatingSupplyComponents.Arbitrum).toBeCloseTo(expectedArbitrumSupply);
    expect(record?.ohmFloatingSupplyComponents.Ethereum).toBeCloseTo(expectedEthereumSupply);
    expect(record?.ohmFloatingSupplyComponents.Fantom).toBeCloseTo(expectedFantomSupply);
    expect(record?.ohmFloatingSupplyComponents.Polygon).toBeCloseTo(expectedPolygonSupply);
  }, 10000);

  test("backed supply is accurate", async () => {
    const [combinedTokenRecords, combinedTokenSupplies, combinedProtocolMetrics] = await getRecords(START_DATE);

    // Raw data has an array property for each chain
    const arbitrumTokenRecords = filterTokenRecords(combinedTokenRecords, CHAIN_ARBITRUM);
    const ethereumTokenRecords = filterTokenRecords(combinedTokenRecords, CHAIN_ETHEREUM);
    const fantomTokenRecords = filterTokenRecords(combinedTokenRecords, CHAIN_FANTOM);
    const polygonTokenRecords = filterTokenRecords(combinedTokenRecords, CHAIN_POLYGON);

    // Raw data has an array property for each chain
    const arbitrumTokenSupplies = filterTokenSupplies(combinedTokenSupplies, CHAIN_ARBITRUM);
    const ethereumTokenSupplies = filterTokenSupplies(combinedTokenSupplies, CHAIN_ETHEREUM);
    const fantomTokenSupplies = filterTokenSupplies(combinedTokenSupplies, CHAIN_FANTOM);
    const polygonTokenSupplies = filterTokenSupplies(combinedTokenSupplies, CHAIN_POLYGON);

    // Raw data has an array property for each chain
    const ethereumProtocolMetrics = combinedProtocolMetrics.filter(record => record.block === ethereumTokenRecords[0].block);

    const ohmIndex = +ethereumProtocolMetrics[0].currentIndex;

    // Calculate expected results
    const includedTypes = [
      TOKEN_SUPPLY_TYPE_TOTAL_SUPPLY,
      TOKEN_SUPPLY_TYPE_TREASURY,
      TOKEN_SUPPLY_TYPE_OFFSET,
      TOKEN_SUPPLY_TYPE_BONDS_PREMINTED,
      TOKEN_SUPPLY_TYPE_BONDS_VESTING_DEPOSITS,
      TOKEN_SUPPLY_TYPE_BONDS_DEPOSITS,
      TOKEN_SUPPLY_TYPE_BOOSTED_LIQUIDITY_VAULT,
      TOKEN_SUPPLY_TYPE_LIQUIDITY,
      TOKEN_SUPPLY_TYPE_LENDING,
    ];
    const expectedSupply = getSupplyBalanceForTypes(combinedTokenSupplies, includedTypes, ohmIndex)[0];
    const expectedArbitrumSupply = getSupplyBalanceForTypes(arbitrumTokenSupplies, includedTypes, ohmIndex)[0];
    const expectedEthereumSupply = getSupplyBalanceForTypes(ethereumTokenSupplies, includedTypes, ohmIndex)[0];
    const expectedFantomSupply = getSupplyBalanceForTypes(fantomTokenSupplies, includedTypes, ohmIndex)[0];
    const expectedPolygonSupply = getSupplyBalanceForTypes(polygonTokenSupplies, includedTypes, ohmIndex)[0];

    // Grab the results from the latest operation
    const result = await wg.client().query({
      operationName: "paginated/metrics",
      input: {
        startDate: START_DATE,
      },
    });

    // Fetch the Metric record for the same date
    const records = result.data;
    const record = records?.filter(record => record.date === START_DATE)[0];

    expect(record).not.toBeNull();
    expect(record?.ohmBackedSupply).toBeCloseTo(expectedSupply);
    expect(record?.ohmBackedSupplyComponents.Arbitrum).toBeCloseTo(expectedArbitrumSupply);
    expect(record?.ohmBackedSupplyComponents.Ethereum).toBeCloseTo(expectedEthereumSupply);
    expect(record?.ohmBackedSupplyComponents.Fantom).toBeCloseTo(expectedFantomSupply);
    expect(record?.ohmBackedSupplyComponents.Polygon).toBeCloseTo(expectedPolygonSupply);
  }, 10000);

  test("gOHM backed supply is accurate", async () => {
    // Grab the results from the latest operation
    const result = await wg.client().query({
      operationName: "paginated/metrics",
      input: {
        startDate: START_DATE,
      },
    });

    // Fetch the Metric record for the same date
    const records = result.data;
    const record = records?.filter(record => record.date === START_DATE)[0];

    expect(record).not.toBeNull();
    // The calculation logic of the backed supply metrics is already tested, so this just checks that the derived metric is correct
    expect(record?.gOhmBackedSupply).toBeCloseTo(record?.ohmBackedSupply! / record?.ohmIndex!);
  });

  test("treasury market value is accurate", async () => {
    const [combinedTokenRecords, combinedTokenSupplies, combinedProtocolMetrics] = await getRecords(START_DATE);

    // Raw data has an array property for each chain
    const arbitrumTokenRecords = filterTokenRecords(combinedTokenRecords, CHAIN_ARBITRUM);
    const ethereumTokenRecords = filterTokenRecords(combinedTokenRecords, CHAIN_ETHEREUM);
    const fantomTokenRecords = filterTokenRecords(combinedTokenRecords, CHAIN_FANTOM);
    const polygonTokenRecords = filterTokenRecords(combinedTokenRecords, CHAIN_POLYGON);

    const marketValue = filterReduce(combinedTokenRecords, () => true);
    const marketValueArbitrum = filterReduce(arbitrumTokenRecords, () => true);
    const marketValueEthereum = filterReduce(ethereumTokenRecords, () => true);
    const marketValueFantom = filterReduce(fantomTokenRecords, () => true);
    const marketValuePolygon = filterReduce(polygonTokenRecords, () => true);

    // Grab the results from the latest operation
    const result = await wg.client().query({
      operationName: "paginated/metrics",
      input: {
        startDate: START_DATE,
      },
    });

    // Fetch the Metric record for the same date
    const records = result.data;
    const record = records?.filter(record => record.date === START_DATE)[0];

    expect(record).not.toBeNull();
    expect(record?.treasuryMarketValue).toBeCloseTo(marketValue);
    expect(record?.treasuryMarketValueComponents.Arbitrum).toBeCloseTo(marketValueArbitrum);
    expect(record?.treasuryMarketValueComponents.Ethereum).toBeCloseTo(marketValueEthereum);
    expect(record?.treasuryMarketValueComponents.Fantom).toBeCloseTo(marketValueFantom);
    expect(record?.treasuryMarketValueComponents.Polygon).toBeCloseTo(marketValuePolygon);
  });

  test("treasury liquid backing is accurate", async () => {
    const [combinedTokenRecords, combinedTokenSupplies, combinedProtocolMetrics] = await getRecords(START_DATE);

    // Raw data has an array property for each chain
    const arbitrumTokenRecords = filterTokenRecords(combinedTokenRecords, CHAIN_ARBITRUM);
    const ethereumTokenRecords = filterTokenRecords(combinedTokenRecords, CHAIN_ETHEREUM);
    const fantomTokenRecords = filterTokenRecords(combinedTokenRecords, CHAIN_FANTOM);
    const polygonTokenRecords = filterTokenRecords(combinedTokenRecords, CHAIN_POLYGON);

    const liquidBackingValue = filterReduce(combinedTokenRecords, (value) => value.isLiquid == true, true);
    const liquidBackingValueArbitrum = filterReduce(arbitrumTokenRecords, (value) => value.isLiquid == true, true);
    const liquidBackingValueEthereum = filterReduce(ethereumTokenRecords, (value) => value.isLiquid == true, true);
    const liquidBackingValueFantom = filterReduce(fantomTokenRecords, (value) => value.isLiquid == true, true);
    const liquidBackingValuePolygon = filterReduce(polygonTokenRecords, (value) => value.isLiquid == true, true);

    // Grab the results from the latest operation
    const result = await wg.client().query({
      operationName: "paginated/metrics",
      input: {
        startDate: START_DATE,
      },
    });

    // Fetch the Metric record for the same date
    const records = result.data;
    const record = records?.filter(record => record.date === START_DATE)[0];

    expect(record).not.toBeNull();
    expect(record?.treasuryLiquidBacking).toBeCloseTo(liquidBackingValue);
    expect(record?.treasuryLiquidBackingComponents.Arbitrum).toBeCloseTo(liquidBackingValueArbitrum);
    expect(record?.treasuryLiquidBackingComponents.Ethereum).toBeCloseTo(liquidBackingValueEthereum);
    expect(record?.treasuryLiquidBackingComponents.Fantom).toBeCloseTo(liquidBackingValueFantom);
    expect(record?.treasuryLiquidBackingComponents.Polygon).toBeCloseTo(liquidBackingValuePolygon);
  });

  test("OHM index", async () => {
    const [combinedTokenRecords, combinedTokenSupplies, combinedProtocolMetrics] = await getRecords(START_DATE);

    const ohmIndex = +combinedProtocolMetrics.filter(record => record.date === START_DATE)[0].currentIndex;

    // Grab the results from the latest operation
    const result = await wg.client().query({
      operationName: "paginated/metrics",
      input: {
        startDate: START_DATE,
      },
    });

    // Fetch the Metric record for the same date
    const records = result.data;
    const record = records?.filter(record => record.date === START_DATE)[0];

    expect(record).not.toBeNull();
    expect(record?.ohmIndex).toEqual(ohmIndex);
  });

  test("liquid backing metrics", async () => {
    // Grab the results from the latest operation
    const result = await wg.client().query({
      operationName: "paginated/metrics",
      input: {
        startDate: START_DATE,
      },
    });

    // Fetch the Metric record for the same date
    const records = result.data;
    const record = records?.filter(record => record.date === START_DATE)[0];

    expect(record).not.toBeNull();
    // The calculation logic of the liquid backing and backed supply metrics are already tested above, so this just checks that the derived metric is correct
    expect(record?.treasuryLiquidBackingPerOhmBacked).toBeCloseTo(record?.treasuryLiquidBacking! / record?.ohmBackedSupply!);
    expect(record?.treasuryLiquidBackingPerGOhmBacked).toBeCloseTo(record?.treasuryLiquidBacking! / record?.gOhmBackedSupply!);
  });
});
