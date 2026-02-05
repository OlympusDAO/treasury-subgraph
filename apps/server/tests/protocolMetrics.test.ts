import { addDays } from "date-fns";
import { startTestServer, stopTestServer } from "./setup/testServer";
import { getISO8601DateString } from "./dateHelper";
import request from 'supertest';

let app: any;

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
}

jest.setTimeout(10 * 1000);

describe("latest", () => {
  test("subsequent results are equal", async () => {
    const response = await request(app)
      .get('/operations/latest/protocolMetrics');

    const records = response.body.data;

    const responseTwo = await request(app)
      .get('/operations/latest/protocolMetrics');

    expect(responseTwo.body.data).toEqual(records);
  }, 20 * 1000);
});

describe("paginated", () => {
  test("returns recent results", async () => {
    const response = await request(app)
      .get('/operations/paginated/protocolMetrics')
      .query({
        wg_variables: JSON.stringify({ startDate: getStartDate(-1) })
      });

    const records = response.body.data;
    const recordLength = records ? records.length : 0;
    expect(recordLength).toBeGreaterThan(0);
  });


  test("returns recent results beyond first page", async () => {
    const startDateString = getStartDate(-20);
    const response = await request(app)
      .get('/operations/paginated/protocolMetrics')
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

  test("subsequent results are equal", async () => {
    const response = await request(app)
      .get('/operations/paginated/protocolMetrics')
      .query({
        wg_variables: JSON.stringify({ startDate: getStartDate(-1) })
      });

    const records = response.body.data;

    const responseTwo = await request(app)
      .get('/operations/paginated/protocolMetrics')
      .query({
        wg_variables: JSON.stringify({ startDate: getStartDate(-1) })
      });

    expect(responseTwo.body.data).toEqual(records);
  }, 20 * 1000);

  test("subsequent results are equal, long timeframe", async () => {
    // This tests both setting and getting a large amount of data, which can error out
    const response = await request(app)
      .get('/operations/paginated/protocolMetrics')
      .query({
        wg_variables: JSON.stringify({ startDate: getStartDate(-60) })
      });

    const records = response.body.data;

    const responseTwo = await request(app)
      .get('/operations/paginated/protocolMetrics')
      .query({
        wg_variables: JSON.stringify({ startDate: getStartDate(-60) })
      });

    expect(responseTwo.body.data).toEqual(records);
  }, 20 * 1000);

  test("returns results", async () => {
    const response = await request(app)
      .get('/operations/paginated/protocolMetrics')
      .query({
        wg_variables: JSON.stringify({ startDate: getStartDate(-5) })
      });

    const records = response.body.data;
    const recordLength = records ? records.length : 0;
    expect(recordLength).toBeGreaterThan(0);
  });
});
