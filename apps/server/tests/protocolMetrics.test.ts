import { addDays } from "date-fns";
import { createTestServer } from "../.wundergraph/generated/testing";
import { getISO8601DateString } from "./dateHelper";
import { clearCache } from "./cacheHelper";

const wg = createTestServer();

beforeAll(async () => {
  await wg.start();
});

afterAll(async () => {
  await wg.stop();
});

beforeEach(async () => {
  await clearCache();
});

const getStartDate = (days: number = -5): string => {
  return getISO8601DateString(addDays(new Date(), days));
}

describe("latest", () => {
  test("cached results are equal", async () => {
    const result = await wg.client().query({
      operationName: "latest/protocolMetrics",
    });

    const records = result.data;

    const resultTwo = await wg.client().query({
      operationName: "latest/protocolMetrics",
    });

    expect(resultTwo.data).toEqual(records);
  });
});

describe("paginated", () => {
  test("returns recent results", async () => {
    const result = await wg.client().query({
      operationName: "paginated/protocolMetrics",
      input: {
        startDate: getStartDate(-1),
      },
    });

    const records = result.data;
    const recordLength = records ? records.length : 0;
    expect(recordLength).toBeGreaterThan(0);
  });

  test("cached results are equal", async () => {
    const result = await wg.client().query({
      operationName: "paginated/protocolMetrics",
      input: {
        startDate: getStartDate(-1),
      },
    });

    const records = result.data;

    const resultTwo = await wg.client().query({
      operationName: "paginated/protocolMetrics",
      input: {
        startDate: getStartDate(-1),
      },
    });

    expect(resultTwo.data).toEqual(records);
  });

  test("returns results", async () => {
    const result = await wg.client().query({
      operationName: "paginated/protocolMetrics",
      input: {
        startDate: getStartDate(-5),
      },
    });

    const records = result.data;
    const recordLength = records ? records.length : 0;
    expect(recordLength).toBeGreaterThan(0);
  });
});
