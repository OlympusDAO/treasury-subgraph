import { ProtocolMetric } from "./protocolMetricHelper";
import { TokenRecord } from "./tokenRecordHelper";
import { TokenSupply } from "./tokenSupplyHelper";

//
// Customised for the treasury-subgraph repo
//

const OHM_ADDRESSES: string[] = [
  "0x64aa3364f17a4d01c6f1751fd97c2bd3d7e7f1d5".toLowerCase(), // Mainnet
  "0xf0cb2dc0db5e6c66B9a70Ac27B06b878da017028".toLowerCase(), // Arbitrum
];

const GOHM_ADDRESSES: string[] = [
  "0x0ab87046fBb341D058F17CBC4c1133F25a20a52f".toLowerCase(), // Mainnet
  "0x8D9bA570D6cb60C7e3e0F31343Efe75AB8E65FB1".toLowerCase(), // Arbitrum
];

const getOhmAddresses = (): string[] => {
  return OHM_ADDRESSES;
};

const getGOhmAddresses = (): string[] => {
  return GOHM_ADDRESSES;
};

export type RecordContainer = {
  tokenRecords: TokenRecord[];
  tokenSupplies: TokenSupply[];
  protocolMetrics: ProtocolMetric[];
};

export type Metric = {
  date: string;
  block: number;
  timestamp: number;
  ohmIndex: number;
  ohmTotalSupply: number;
  ohmCirculatingSupply: number;
  ohmFloatingSupply: number;
  ohmBackedSupply: number;
  ohmPrice: number;
  marketCap: number;
  treasuryMarketValue: number;
  treasuryLiquidBacking: number;
  treasuryLiquidBackingPerOhmFloating: number;
  treasuryLiquidBackingPerOhmBacked: number;
};

//
//  The rest of the file should be kept in sync with TreasuryQueryHelper in olympus-frontend
//

const TOKEN_SUPPLY_TYPE_BONDS_DEPOSITS = "OHM Bonds (Burnable Deposits)";
const TOKEN_SUPPLY_TYPE_BONDS_PREMINTED = "OHM Bonds (Pre-minted)";
const TOKEN_SUPPLY_TYPE_BONDS_VESTING_DEPOSITS = "OHM Bonds (Vesting Deposits)";
const TOKEN_SUPPLY_TYPE_BONDS_VESTING_TOKENS = "OHM Bonds (Vesting Tokens)";
const TOKEN_SUPPLY_TYPE_LIQUIDITY = "Liquidity";
const TOKEN_SUPPLY_TYPE_BOOSTED_LIQUIDITY_VAULT = "Boosted Liquidity Vault";
const TOKEN_SUPPLY_TYPE_OFFSET = "Manual Offset";
const TOKEN_SUPPLY_TYPE_TOTAL_SUPPLY = "Total Supply";
const TOKEN_SUPPLY_TYPE_TREASURY = "Treasury";
const TOKEN_SUPPLY_TYPE_LENDING = "Lending";

const CATEGORY_STABLE = "Stable";
const CATEGORY_VOLATILE = "Volatile";
const CATEGORY_POL = "Protocol-Owned Liquidity";

let supportedTokens: string[];
const getSupportedTokens = (): string[] => {
  if (!supportedTokens) {
    const tokens: string[] = [];
    tokens.push(...getOhmAddresses());
    tokens.push(...getGOhmAddresses());

    supportedTokens = tokens;
  }

  return supportedTokens;
};

const isSupportedToken = (record: TokenSupply) => {
  if (!getSupportedTokens().includes(record.tokenAddress.toLowerCase())) {
    return false;
  }

  return true;
};

const getBalanceMultiplier = (record: TokenSupply, ohmIndex: number): number => {
  if (getOhmAddresses().includes(record.tokenAddress.toLowerCase())) {
    return 1;
  }

  if (getGOhmAddresses().includes(record.tokenAddress.toLowerCase())) {
    return ohmIndex;
  }

  throw new Error(`Unsupported token address: ${record.tokenAddress}`);
};

/**
 * Returns the sum of balances for different supply types.
 *
 * Note that this will return positive or negative balances, depending on the type.
 *
 * For example, passing [TOKEN_SUPPLY_TYPE_LIQUIDITY, TOKEN_SUPPLY_TYPE_TREASURY]
 * in the {includedTypes} parameter will return a number that is
 * the sum of the supplyBalance property all records with matching types.
 *
 * @param records TokenSupply records for the given day
 * @param ohmIndex The index of OHM for the given day
 * @param includedTypes
 * @returns [balance, included records]
 */
const getSupplyBalanceForTypes = (
  records: TokenSupply[],
  includedTypes: string[],
  ohmIndex: number,
): [number, TokenSupply[]] => {
  const filteredRecords = records.filter(record => isSupportedToken(record) && includedTypes.includes(record.type));

  const supplyBalance = filteredRecords.reduce(
    (previousValue, record) => previousValue + +record.supplyBalance * getBalanceMultiplier(record, ohmIndex),
    0,
  );

  return [supplyBalance, filteredRecords];
};

/**
 * For a given array of TokenSupply records (assumed to be at the same point in time),
 * this function returns the OHM circulating supply.
 *
 * Circulating supply is defined as:
 * - OHM total supply
 * - minus: OHM in circulating supply wallets
 * - minus: migration offset
 * - minus: pre-minted OHM for bonds
 * - minus: OHM user deposits for bonds
 *
 * @param records TokenSupply records for the given day
 * @param ohmIndex The index of OHM for the given day
 * @returns
 */
export const getOhmCirculatingSupply = (records: TokenSupply[], ohmIndex: number): [number, TokenSupply[]] => {
  const includedTypes = [
    TOKEN_SUPPLY_TYPE_TOTAL_SUPPLY,
    TOKEN_SUPPLY_TYPE_TREASURY,
    TOKEN_SUPPLY_TYPE_OFFSET,
    TOKEN_SUPPLY_TYPE_BONDS_PREMINTED,
    TOKEN_SUPPLY_TYPE_BONDS_VESTING_DEPOSITS,
    TOKEN_SUPPLY_TYPE_BONDS_DEPOSITS,
    TOKEN_SUPPLY_TYPE_BOOSTED_LIQUIDITY_VAULT,
  ];

  return getSupplyBalanceForTypes(records, includedTypes, ohmIndex);
};

/**
 * For a given array of TokenSupply records (assumed to be at the same point in time),
 * this function returns the OHM floating supply.
 *
 * Floating supply is defined as:
 * - OHM total supply
 * - minus: OHM in circulating supply wallets
 * - minus: migration offset
 * - minus: pre-minted OHM for bonds
 * - minus: OHM user deposits for bonds
 * - minus: protocol-owned OHM in liquidity pools
 *
 * @param records TokenSupply records for the given day
 * @param ohmIndex The index of OHM for the given day
 * @returns
 */
export const getOhmFloatingSupply = (records: TokenSupply[], ohmIndex: number): [number, TokenSupply[]] => {
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

  return getSupplyBalanceForTypes(records, includedTypes, ohmIndex);
};

/**
 * For a given array of TokenSupply records (assumed to be at the same point in time),
 * this function returns the OHM backed supply.
 *
 * Backed supply is the quantity of OHM backed by treasury assets.
 *
 * Backed supply is calculated as:
 * - OHM total supply
 * - minus: OHM in circulating supply wallets
 * - minus: migration offset
 * - minus: pre-minted OHM for bonds
 * - minus: OHM user deposits for bonds
 * - minus: protocol-owned OHM in liquidity pools
 * - minus: OHM minted and deployed into lending markets
 *
 * @param records TokenSupply records for the given day
 * @param ohmIndex The index of OHM for the given day
 */
export const getOhmBackedSupply = (records: TokenSupply[], ohmIndex: number): [number, TokenSupply[]] => {
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

  return getSupplyBalanceForTypes(records, includedTypes, ohmIndex);
};

/**
 * For a given array of TokenSupply records (assumed to be at the same point in time),
 * this function returns the OHM total supply.
 *
 * @param records TokenSupply records for the given day
 * @param ohmIndex The index of OHM for the given day
 * @returns
 */
export const getOhmTotalSupply = (records: TokenSupply[], ohmIndex: number): [number, TokenSupply[]] => {
  return getSupplyBalanceForTypes(records, [TOKEN_SUPPLY_TYPE_TOTAL_SUPPLY], ohmIndex);
}

//
// TokenRecord metrics
//

export const filterReduce = (
  records: TokenRecord[],
  filterPredicate: (value: TokenRecord) => unknown,
  valueExcludingOhm = false,
): number => {
  return records.filter(filterPredicate).reduce((previousValue, currentRecord) => {
    return previousValue + (valueExcludingOhm ? +currentRecord.valueExcludingOhm : +currentRecord.value);
  }, 0);
};

export const getTreasuryAssetValue = (
  records: TokenRecord[],
  liquidBacking: boolean,
  categories = [CATEGORY_STABLE, CATEGORY_VOLATILE, CATEGORY_POL],
): number => {
  if (liquidBacking) {
    return filterReduce(records, record => categories.includes(record.category) && record.isLiquid == true, true);
  }

  return filterReduce(records, record => categories.includes(record.category), false);
};

export const getLiquidBackingPerOhmBacked = (tokenRecords: TokenRecord[], tokenSupplies: TokenSupply[], ohmIndex: number) =>
  getTreasuryAssetValue(tokenRecords, true) / getOhmBackedSupply(tokenSupplies, ohmIndex)[0];

export const getLiquidBackingPerOhmFloating = (tokenRecords: TokenRecord[], tokenSupplies: TokenSupply[], ohmIndex: number) =>
  getTreasuryAssetValue(tokenRecords, true) / getOhmFloatingSupply(tokenSupplies, ohmIndex)[0];

export const getMetricObject = (tokenRecords: TokenRecord[], tokenSupplies: TokenSupply[], protocolMetrics: ProtocolMetric[]): Metric | null => {
  if (!tokenRecords.length || !tokenSupplies.length || !protocolMetrics.length) {
    return null;
  }

  const currentOhmIndex: number = +protocolMetrics[0].currentIndex;
  const ohmPrice: number = +protocolMetrics[0].ohmPrice;
  const ohmCirculatingSupply: number = getOhmCirculatingSupply(tokenSupplies, currentOhmIndex)[0];

  return {
    date: tokenRecords[0].date,
    block: +tokenRecords[0].block,
    timestamp: +tokenRecords[0].timestamp,
    ohmIndex: currentOhmIndex,
    ohmTotalSupply: getOhmTotalSupply(tokenSupplies, currentOhmIndex)[0],
    ohmCirculatingSupply: ohmCirculatingSupply,
    ohmFloatingSupply: getOhmFloatingSupply(tokenSupplies, currentOhmIndex)[0],
    ohmBackedSupply: getOhmBackedSupply(tokenSupplies, currentOhmIndex)[0],
    ohmPrice: ohmPrice,
    marketCap: ohmPrice * ohmCirculatingSupply,
    treasuryMarketValue: getTreasuryAssetValue(tokenRecords, false),
    treasuryLiquidBacking: getTreasuryAssetValue(tokenRecords, true),
    treasuryLiquidBackingPerOhmFloating: getLiquidBackingPerOhmFloating(tokenRecords, tokenSupplies, currentOhmIndex),
    treasuryLiquidBackingPerOhmBacked: getLiquidBackingPerOhmBacked(tokenRecords, tokenSupplies, currentOhmIndex),
  }
};

export const sortRecordsDescending = (records: Metric[]): Metric[] => {
  return records.sort((a, b) => {
    const aTime = new Date(a.date).getTime();
    const bTime = new Date(b.date).getTime();

    if (aTime > bTime) {
      return -1;
    } else if (aTime < bTime) {
      return 1;
    } else {
      return 0;
    }
  });
};
