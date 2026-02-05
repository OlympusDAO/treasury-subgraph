import { addDays } from "date-fns";
import { startTestServer, stopTestServer } from "./setup/testServer";
import { getISO8601DateString } from "./dateHelper";
import { CHAIN_ARBITRUM, CHAIN_BASE, CHAIN_ETHEREUM, CHAIN_FANTOM, CHAIN_POLYGON } from "../src/core/constants";
import { getFirstRecord } from "./tokenRecordHelper";
import { parseNumber } from "./numberHelper";
import request from 'supertest';

let app: any;

beforeAll(async () => {
  const server = await startTestServer();
  app = server.app;
}, 10 * 1000);

afterAll(async () => {
  await stopTestServer();
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
    const response = await request(app)
      .get('/operations/paginated/tokenRecords')
      .query({
        wg_variables: JSON.stringify({ startDate: getStartDate(-1) })
      });

    const records = response.body.data;
    const recordLength = records ? records.length : 0;
    expect(recordLength).toBeGreaterThan(0);
  });

  test("subsequent results are equal", async () => {
    const response = await request(app)
      .get('/operations/paginated/tokenRecords')
      .query({
        wg_variables: JSON.stringify({ startDate: getStartDate(-1) })
      });

    const records = response.body.data;

    const responseTwo = await request(app)
      .get('/operations/paginated/tokenRecords')
      .query({
        wg_variables: JSON.stringify({ startDate: getStartDate(-1) })
      });

    expect(responseTwo.body.data).toEqual(records);
  }, 20 * 1000);

  test("returns recent results beyond first page", async () => {
    const startDateString = getStartDate(-20);
    const response = await request(app)
      .get('/operations/paginated/tokenRecords')
      .query({
        wg_variables: JSON.stringify({ startDate: startDateString })
      });

    const records = response.body.data;
    const recordsNotNull = records ? records : [];
    // Most recent date
    expect(recordsNotNull[0].date).toEqual(getISO8601DateString(new Date()));
    // Last date
    expect(recordsNotNull[recordsNotNull.length - 1].date).toEqual(startDateString);
  });

  test("subsequent results are equal, long timeframe", async () => {
    // This tests both setting and getting a large amount of data, which can error out
    const response = await request(app)
      .get('/operations/paginated/tokenRecords')
      .query({
        wg_variables: JSON.stringify({ startDate: getStartDate(-60) })
      });

    const records = response.body.data;

    const responseTwo = await request(app)
      .get('/operations/paginated/tokenRecords')
      .query({
        wg_variables: JSON.stringify({ startDate: getStartDate(-60) })
      });

    expect(responseTwo.body.data).toEqual(records);
  }, 30 * 1000);

  test("returns results", async () => {
    const response = await request(app)
      .get('/operations/paginated/tokenRecords')
      .query({
        wg_variables: JSON.stringify({ startDate: getStartDate(-5) })
      });

    const records = response.body.data;
    const recordLength = records ? records.length : 0;
    expect(recordLength).toBeGreaterThan(0);
  });

  test("returns results when crossChainDataComplete is true", async () => {
    const response = await request(app)
      .get('/operations/paginated/tokenRecords')
      .query({
        wg_variables: JSON.stringify({
          startDate: getStartDate(-5),
          crossChainDataComplete: true
        })
      });

    const records = response.body.data;
    const recordLength = records ? records.length : 0;
    expect(recordLength).toBeGreaterThan(0);
  });

  test("returns blockchain property for Arbitrum", async () => {
    const response = await request(app)
      .get('/operations/paginated/tokenRecords')
      .query({
        wg_variables: JSON.stringify({ startDate: getStartDate() })
      });

    const records = response.body.data;
    const filteredRecords = records ? records.filter((record: any) => record.blockchain === CHAIN_ARBITRUM) : [];
    expect(filteredRecords.length).toBeGreaterThan(0);
  });

  test("returns blockchain property for Ethereum", async () => {
    const response = await request(app)
      .get('/operations/paginated/tokenRecords')
      .query({
        wg_variables: JSON.stringify({ startDate: getStartDate() })
      });

    const records = response.body.data;
    const filteredRecords = records ? records.filter((record: any) => record.blockchain === CHAIN_ETHEREUM) : [];
    expect(filteredRecords.length).toBeGreaterThan(0);
  });

  test("returns blockchain property for Fantom", async () => {
    const response = await request(app)
      .get('/operations/paginated/tokenRecords')
      .query({
        wg_variables: JSON.stringify({ startDate: getStartDate() })
      });

    const records = response.body.data;
    const filteredRecords = records ? records.filter((record: any) => record.blockchain === CHAIN_FANTOM) : [];
    expect(filteredRecords.length).toBeGreaterThan(0);
  });

  test("returns blockchain property for Polygon", async () => {
    const response = await request(app)
      .get('/operations/paginated/tokenRecords')
      .query({
        wg_variables: JSON.stringify({ startDate: getStartDate() })
      });

    const records = response.body.data;
    const filteredRecords = records ? records.filter((record: any) => record.blockchain === CHAIN_POLYGON) : [];
    expect(filteredRecords.length).toBeGreaterThan(0);
  });
});

describe("latest", () => {
  test("returns the latest results for each chain", async () => {
    // Grab the results from the raw operation
    const rawResponse = await request(app)
      .get('/operations/tokenRecordsLatest');

    // Raw data has an array property for each chain
    const arbitrumRawResult = rawResponse.body.data?.treasuryArbitrum_tokenRecords[0];
    const ethereumRawResult = rawResponse.body.data?.treasuryEthereum_tokenRecords[0];
    const fantomRawResult = rawResponse.body.data?.treasuryFantom_tokenRecords[0];
    const polygonRawResult = rawResponse.body.data?.treasuryPolygon_tokenRecords[0];

    // Grab the results from the latest operation
    const response = await request(app)
      .get('/operations/latest/tokenRecords');

    // Latest records is collapsed into a flat array
    const records = response.body.data;
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

  test("subsequent results are equal", async () => {
    const response = await request(app)
      .get('/operations/latest/tokenRecords');

    const records = response.body.data;

    const responseTwo = await request(app)
      .get('/operations/latest/tokenRecords');

    expect(responseTwo.body.data).toEqual(records);
  }, 20 * 1000);
});

describe("earliest", () => {
  test("returns the earliest results for each chain", async () => {
    // Grab the results from the raw operation
    const rawResponse = await request(app)
      .get('/operations/tokenRecordsEarliest');

    // Raw data has an array property for each chain
    const arbitrumRawResult = rawResponse.body.data?.treasuryArbitrum_tokenRecords[0];
    const ethereumRawResult = rawResponse.body.data?.treasuryEthereum_tokenRecords[0];
    const fantomRawResult = rawResponse.body.data?.treasuryFantom_tokenRecords[0];
    const polygonRawResult = rawResponse.body.data?.treasuryPolygon_tokenRecords[0];

    // Grab the results from the earliest operation
    const response = await request(app)
      .get('/operations/earliest/tokenRecords');

    // Latest records is collapsed into a flat array
    const records = response.body.data;
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

  test("subsequent results are equal", async () => {
    const response = await request(app)
      .get('/operations/earliest/tokenRecords');

    const records = response.body.data;

    const responseTwo = await request(app)
      .get('/operations/earliest/tokenRecords');

    expect(responseTwo.body.data).toEqual(records);
  }, 20 * 1000);
});

describe("atBlock", () => {
  test("returns the results for each chain at the specified block", async () => {
    const startDate = getISO8601DateString(addDays(new Date(), -1));

    // Grab the results for the previous day (hence not the result of the latest query)
    const rawResponse = await request(app)
      .get('/operations/paginated/tokenRecords')
      .query({
        wg_variables: JSON.stringify({ startDate: startDate })
      });

    // Raw data has an array property for each chain
    const arbitrumRawResult = getFirstRecord(rawResponse.body.data, CHAIN_ARBITRUM, startDate);
    const arbitrumRawBlock = parseNumber(arbitrumRawResult?.block);
    const baseRawResult = getFirstRecord(rawResponse.body.data, CHAIN_BASE, startDate);
    const baseRawBlock = parseNumber(baseRawResult?.block);
    const ethereumRawResult = getFirstRecord(rawResponse.body.data, CHAIN_ETHEREUM, startDate);
    const ethereumRawBlock = parseNumber(ethereumRawResult?.block);
    const fantomRawResult = getFirstRecord(rawResponse.body.data, CHAIN_FANTOM, startDate);
    const fantomRawBlock = parseNumber(fantomRawResult?.block);
    const polygonRawResult = getFirstRecord(rawResponse.body.data, CHAIN_POLYGON, startDate);
    const polygonRawBlock = parseNumber(polygonRawResult?.block);

    // Grab the results from the earliest operation
    const response = await request(app)
      .get('/operations/atBlock/tokenRecords')
      .query({
        wg_variables: JSON.stringify({
          arbitrumBlock: arbitrumRawBlock,
          baseBlock: baseRawBlock,
          ethereumBlock: ethereumRawBlock,
          fantomBlock: fantomRawBlock,
          polygonBlock: polygonRawBlock,
        })
      });

    // Latest records is collapsed into a flat array
    const records = response.body.data;
    const arbitrumResult = getFirstRecord(records, CHAIN_ARBITRUM);
    const baseResult = getFirstRecord(records, CHAIN_BASE);
    const ethereumResult = getFirstRecord(records, CHAIN_ETHEREUM);
    const fantomResult = getFirstRecord(records, CHAIN_FANTOM);
    const polygonResult = getFirstRecord(records, CHAIN_POLYGON);

    // Check that the block is the same
    expect(parseNumber(arbitrumResult?.block)).toEqual(arbitrumRawBlock);
    expect(parseNumber(baseResult?.block)).toEqual(baseRawBlock);
    expect(parseNumber(ethereumResult?.block)).toEqual(ethereumRawBlock);
    expect(parseNumber(fantomResult?.block)).toEqual(fantomRawBlock);
    expect(parseNumber(polygonResult?.block)).toEqual(polygonRawBlock);
  });
});
