import { TokenRecord, filterLatestBlockByDay } from "../.wundergraph/tokenRecordHelper";

const getSampleRecord = (id: string, date: string, block: number): TokenRecord => {
  return {
    id: id,
    date: date,
    block: block,
    timestamp: 0,
    balance: "0",
    blockchain: "",
    category: "",
    isBluechip: false,
    isLiquid: false,
    multiplier: "0",
    rate: "0",
    value: "0",
    valueExcludingOhm: "0",
    source: "",
    sourceAddress: "",
    token: "",
    tokenAddress: "",
  }
}

describe("filterLatestBlockByDay", () => {
  it("should return the latest block for each day", () => {
    const records = [
      getSampleRecord("1", "2021-01-01", 1),
      getSampleRecord("2", "2021-01-01", 2),
      getSampleRecord("3", "2021-01-02", 3),
      getSampleRecord("4", "2021-01-02", 4),
      getSampleRecord("5", "2021-01-03", 5),
      getSampleRecord("6", "2021-01-03", 6),
    ];

    const expected = [
      getSampleRecord("2", "2021-01-01", 2),
      getSampleRecord("4", "2021-01-02", 4),
      getSampleRecord("6", "2021-01-03", 6),
    ];

    const actual = filterLatestBlockByDay(records);

    expect(actual).toEqual(expected);
  });
});