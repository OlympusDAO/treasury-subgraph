import { addDays } from "date-fns";
import { createTestServer } from "../.wundergraph/generated/testing";
import { getISO8601DateString } from "./dateHelper";

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
      operationName: "paginated/tokenSupplies",
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
      operationName: "paginated/tokenSupplies",
      input: {
        startDate: getStartDate(-5),
      }
    });

    const records = result.data;
    const recordLength = records ? records.length : 0;
    expect(recordLength).toBeGreaterThan(0);
  });
});

describe("blockchain property", () => {
  test("Arbitrum", async () => {
    const result = await wg.client().query({
      operationName: "paginated/tokenSupplies",
      input: {
        startDate: getStartDate(),
      }
    });

    const records = result.data;
    const filteredRecords = records ? records.filter((record) => record.blockchain === "Arbitrum") : [];
    expect(filteredRecords.length).toBeGreaterThan(0);
  });

  test("Ethereum", async () => {
    const result = await wg.client().query({
      operationName: "paginated/tokenSupplies",
      input: {
        startDate: getStartDate(),
      }
    });

    const records = result.data;
    const filteredRecords = records ? records.filter((record) => record.blockchain === "Ethereum") : [];
    expect(filteredRecords.length).toBeGreaterThan(0);
  });

  test("Fantom", async () => {
    const result = await wg.client().query({
      operationName: "paginated/tokenSupplies",
      input: {
        startDate: getStartDate(),
      }
    });

    const records = result.data;
    const filteredRecords = records ? records.filter((record) => record.blockchain === "Fantom") : [];
    expect(filteredRecords.length).toBe(0); // 0 TokenSupply on this blockchain
  });

  test("Polygon", async () => {
    const result = await wg.client().query({
      operationName: "paginated/tokenSupplies",
      input: {
        startDate: getStartDate(),
      }
    });

    const records = result.data;
    const filteredRecords = records ? records.filter((record) => record.blockchain === "Polygon") : [];
    expect(filteredRecords.length).toBe(0); // 0 TokenSupply on this blockchain
  });
});
