import { TokenSuppliesResponseData } from "../.wundergraph/generated/models";

type TokenSupply = TokenSuppliesResponseData["treasuryEthereum_tokenSupplies"][0];

const OHM_ADDRESSES: string[] = [
  "0x64aa3364f17a4d01c6f1751fd97c2bd3d7e7f1d5".toLowerCase(), // Mainnet
  "0xf0cb2dc0db5e6c66B9a70Ac27B06b878da017028".toLowerCase(), // Arbitrum
  "0x060cb087a9730e13aa191f31a6d86bff8dfcdcc0".toLowerCase(), // Base
];

const GOHM_ADDRESSES: string[] = [
  "0x0ab87046fBb341D058F17CBC4c1133F25a20a52f".toLowerCase(), // Mainnet
  "0x8D9bA570D6cb60C7e3e0F31343Efe75AB8E65FB1".toLowerCase(), // Arbitrum
];

const getBalanceMultiplier = (record: TokenSupply, ohmIndex: number): number => {
  if (OHM_ADDRESSES.includes(record.tokenAddress.toLowerCase())) {
    return 1;
  }

  if (GOHM_ADDRESSES.includes(record.tokenAddress.toLowerCase())) {
    return ohmIndex;
  }

  throw new Error(`Unsupported token address: ${record.tokenAddress}`);
};

/**
 * Independent implementation of this function from apps/server/src/helpers/metricsHelper.ts.
 * Otherwise, changes to that function would not break this test.
 */
export const getSupplyBalanceForTypes = (
  records: TokenSupply[],
  includedTypes: string[],
  ohmIndex: number,
): [number, TokenSupply[]] => {
  const filteredRecords = records.filter(record => includedTypes.includes(record.type));

  const supplyBalance = filteredRecords.reduce(
    (previousValue, record) => previousValue + +record.supplyBalance * getBalanceMultiplier(record, ohmIndex),
    0,
  );

  return [supplyBalance, filteredRecords];
};