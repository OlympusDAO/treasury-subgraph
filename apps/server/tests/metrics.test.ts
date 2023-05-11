import { addDays } from "date-fns";
import { createTestServer } from "../.wundergraph/generated/testing";
import { getISO8601DateString } from "./dateHelper";
import { CHAIN_ARBITRUM, CHAIN_ETHEREUM, CHAIN_FANTOM, CHAIN_POLYGON, TOKEN_SUPPLY_TYPE_BONDS_DEPOSITS, TOKEN_SUPPLY_TYPE_BONDS_PREMINTED, TOKEN_SUPPLY_TYPE_BONDS_VESTING_DEPOSITS, TOKEN_SUPPLY_TYPE_BOOSTED_LIQUIDITY_VAULT, TOKEN_SUPPLY_TYPE_LENDING, TOKEN_SUPPLY_TYPE_LIQUIDITY, TOKEN_SUPPLY_TYPE_OFFSET, TOKEN_SUPPLY_TYPE_TOTAL_SUPPLY, TOKEN_SUPPLY_TYPE_TREASURY } from "../.wundergraph/constants";
import { getSupplyBalanceForTypes } from "./metricsHelper";
import { TokenRecord, filter as filterTokenRecords, getFirstRecord as getFirstTokenRecord } from "./tokenRecordHelper";
import { TokenSupply, filter as filterTokenSupplies, getFirstRecord as getFirstTokenSupplies } from "./tokenSupplyHelper";
import { ProtocolMetric } from "./protocolMetricHelper";

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
    const arbitrumRawResult = getFirstTokenRecord(rawResult.data, CHAIN_ARBITRUM, startDate);
    const arbitrumRawBlock: number = arbitrumRawResult?.block ? parseInt(arbitrumRawResult.block) : 0;
    const ethereumRawResult = getFirstTokenRecord(rawResult.data, CHAIN_ETHEREUM, startDate);
    const ethereumRawBlock: number = ethereumRawResult?.block ? parseInt(ethereumRawResult.block) : 0;
    const fantomRawResult = getFirstTokenRecord(rawResult.data, CHAIN_FANTOM, startDate);
    const fantomRawBlock: number = fantomRawResult?.block ? parseInt(fantomRawResult.block) : 0;
    const polygonRawResult = getFirstTokenRecord(rawResult.data, CHAIN_POLYGON, startDate);
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

// TODO test metric logic
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
    expect(record?.ohmTotalSupply).toEqual(expectedSupply);
    expect(record?.ohmTotalSupplyComponents.Arbitrum).toEqual(expectedArbitrumSupply);
    expect(record?.ohmTotalSupplyComponents.Ethereum).toEqual(expectedEthereumSupply);
    expect(record?.ohmTotalSupplyComponents.Fantom).toEqual(expectedFantomSupply);
    expect(record?.ohmTotalSupplyComponents.Polygon).toEqual(expectedPolygonSupply);
  });

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
      TOKEN_SUPPLY_TYPE_BOOSTED_LIQUIDITY_VAULT,
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
    expect(record?.ohmCirculatingSupply).toEqual(expectedSupply);
    expect(record?.ohmCirculatingSupplyComponents.Arbitrum).toEqual(expectedArbitrumSupply);
    expect(record?.ohmCirculatingSupplyComponents.Ethereum).toEqual(expectedEthereumSupply);
    expect(record?.ohmCirculatingSupplyComponents.Fantom).toEqual(expectedFantomSupply);
    expect(record?.ohmCirculatingSupplyComponents.Polygon).toEqual(expectedPolygonSupply);
  });

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
      TOKEN_SUPPLY_TYPE_BOOSTED_LIQUIDITY_VAULT,
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
    expect(record?.ohmFloatingSupply).toEqual(expectedSupply);
    expect(record?.ohmFloatingSupplyComponents.Arbitrum).toEqual(expectedArbitrumSupply);
    expect(record?.ohmFloatingSupplyComponents.Ethereum).toEqual(expectedEthereumSupply);
    expect(record?.ohmFloatingSupplyComponents.Fantom).toEqual(expectedFantomSupply);
    expect(record?.ohmFloatingSupplyComponents.Polygon).toEqual(expectedPolygonSupply);
  });

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
    expect(record?.ohmBackedSupply).toEqual(expectedSupply);
    expect(record?.ohmBackedSupplyComponents.Arbitrum).toEqual(expectedArbitrumSupply);
    expect(record?.ohmBackedSupplyComponents.Ethereum).toEqual(expectedEthereumSupply);
    expect(record?.ohmBackedSupplyComponents.Fantom).toEqual(expectedFantomSupply);
    expect(record?.ohmBackedSupplyComponents.Polygon).toEqual(expectedPolygonSupply);
  });
});
