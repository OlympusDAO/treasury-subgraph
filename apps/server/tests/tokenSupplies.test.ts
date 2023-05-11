import { addDays } from "date-fns";
import { createTestServer } from "../.wundergraph/generated/testing";
import { getISO8601DateString } from "./dateHelper";
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

describe("blockchain property", () => {
  test(CHAIN_ARBITRUM, async () => {
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

  test(CHAIN_ETHEREUM, async () => {
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

  test(CHAIN_FANTOM, async () => {
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

  test(CHAIN_POLYGON, async () => {
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
