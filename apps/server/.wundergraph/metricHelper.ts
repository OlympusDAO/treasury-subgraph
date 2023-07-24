import { CATEGORY_POL, CATEGORY_STABLE, CATEGORY_VOLATILE, CHAIN_ARBITRUM, CHAIN_ETHEREUM, CHAIN_FANTOM, CHAIN_POLYGON, TOKEN_SUPPLY_TYPE_BONDS_DEPOSITS, TOKEN_SUPPLY_TYPE_BONDS_PREMINTED, TOKEN_SUPPLY_TYPE_BONDS_VESTING_DEPOSITS, TOKEN_SUPPLY_TYPE_BOOSTED_LIQUIDITY_VAULT, TOKEN_SUPPLY_TYPE_LENDING, TOKEN_SUPPLY_TYPE_LIQUIDITY, TOKEN_SUPPLY_TYPE_OFFSET, TOKEN_SUPPLY_TYPE_TOTAL_SUPPLY, TOKEN_SUPPLY_TYPE_TREASURY } from "./constants";
import { ProtocolMetric } from "./protocolMetricHelper";
import { TokenRecord, isCrossChainRecordDataComplete } from "./tokenRecordHelper";
import { TokenSupply, isCrossChainSupplyDataComplete } from "./tokenSupplyHelper";

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

type ChainValues = {
  [CHAIN_ARBITRUM]: number;
  [CHAIN_ETHEREUM]: number;
  [CHAIN_FANTOM]: number;
  [CHAIN_POLYGON]: number;
};

type ChainRecords = {
  [CHAIN_ARBITRUM]: TokenRecord[];
  [CHAIN_ETHEREUM]: TokenRecord[];
  [CHAIN_FANTOM]: TokenRecord[];
  [CHAIN_POLYGON]: TokenRecord[];
};

type ChainSupplies = {
  [CHAIN_ARBITRUM]: TokenSupply[];
  [CHAIN_ETHEREUM]: TokenSupply[];
  [CHAIN_FANTOM]: TokenSupply[];
  [CHAIN_POLYGON]: TokenSupply[];
};

export type Metric = {
  date: string;
  /**
   * The block for each chain.
   */
  blocks: ChainValues;
  /**
   * The Unix epoch timestamp (in seconds) for each chain.
   */
  timestamps: ChainValues;
  /**
   * The OHM index at the snapshot.
   */
  ohmIndex: number;
  /**
   * The OHM APY at the snapshot.
   */
  ohmApy: number;
  ohmTotalSupply: number;
  ohmTotalSupplyComponents: ChainValues;
  ohmTotalSupplyRecords?: ChainSupplies;
  ohmCirculatingSupply: number;
  ohmCirculatingSupplyComponents: ChainValues;
  ohmCirculatingSupplyRecords?: ChainSupplies;
  ohmFloatingSupply: number;
  ohmFloatingSupplyComponents: ChainValues;
  ohmFloatingSupplyRecords?: ChainSupplies;
  ohmBackedSupply: number;
  gOhmBackedSupply: number;
  ohmBackedSupplyComponents: ChainValues;
  ohmBackedSupplyRecords?: ChainSupplies;
  ohmPrice: number;
  gOhmPrice: number;
  marketCap: number;
  sOhmCirculatingSupply: number;
  sOhmTotalValueLocked: number;
  treasuryMarketValue: number;
  treasuryMarketValueComponents: ChainValues;
  treasuryMarketValueRecords?: ChainRecords;
  treasuryLiquidBacking: number;
  treasuryLiquidBackingComponents: ChainValues;
  treasuryLiquidBackingRecords?: ChainRecords;
  treasuryLiquidBackingPerOhmFloating: number;
  treasuryLiquidBackingPerOhmBacked: number;
  treasuryLiquidBackingPerGOhmBacked: number;
};

//
//  The rest of the file should be kept in sync with TreasuryQueryHelper in olympus-frontend
//

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
 * The block from which the inclusion of BLV in floating and circulating supply
 * was changed for the Ethereum subgraph.
 */
const ETHEREUM_BLV_INCLUSION_BLOCK = "17620000";

const isBLVIncluded = (records: TokenSupply[]): boolean => {
  // Filter for Ethereum records
  const ethereumRecords = records.filter(record => record.blockchain === CHAIN_ETHEREUM);
  if (!ethereumRecords.length) {
    return false;
  }

  // Get the block number of the first Ethereum record
  const firstEthereumRecord = ethereumRecords[0];
  const firstEthereumRecordBlock = firstEthereumRecord.block;

  // If the first Ethereum record is before the BLV inclusion block, then BLV is included in calculations
  if (Number(firstEthereumRecordBlock) < Number(ETHEREUM_BLV_INCLUSION_BLOCK)) {
    return true;
  }

  return false;
}

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
 * - minus: OHM in boosted liquidity vaults (before `BLV_INCLUSION_BLOCK`)
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
  ];

  if (isBLVIncluded(records)) {
    includedTypes.push(TOKEN_SUPPLY_TYPE_BOOSTED_LIQUIDITY_VAULT);
  }

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
 * - minus: OHM in boosted liquidity vaults (before `BLV_INCLUSION_BLOCK`)
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
    TOKEN_SUPPLY_TYPE_LIQUIDITY,
  ];

  if (isBLVIncluded(records)) {
    includedTypes.push(TOKEN_SUPPLY_TYPE_BOOSTED_LIQUIDITY_VAULT);
  }

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
 * - minus: OHM in boosted liquidity vaults
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
    TOKEN_SUPPLY_TYPE_LIQUIDITY,
    TOKEN_SUPPLY_TYPE_BOOSTED_LIQUIDITY_VAULT,
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

export const getGOhmBackedSupply = (backedSupply: number, ohmIndex: number): number => {
  return backedSupply / ohmIndex;
}

//
// TokenRecord metrics
//

const reduce = (
  records: TokenRecord[],
  valueExcludingOhm = false,
): number => {
  return records.reduce((previousValue, currentRecord) => {
    return previousValue + (valueExcludingOhm ? +currentRecord.valueExcludingOhm : +currentRecord.value);
  }, 0);
}

export const getTreasuryAssetValue = (
  records: TokenRecord[],
  liquidBacking: boolean,
  categories = [CATEGORY_STABLE, CATEGORY_VOLATILE, CATEGORY_POL],
): [number, TokenRecord[]] => {
  const filteredRecords = records.filter(record => categories.includes(record.category) && (liquidBacking ? record.isLiquid == true : true));

  return [reduce(filteredRecords, liquidBacking), filteredRecords];
};

export const getLiquidBackingPerOhmBacked = (liquidBacking: number, backedSupply: number) =>
  liquidBacking / backedSupply;

export const getLiquidBackingPerOhmFloating = (liquidBacking: number, floatingSupply: number) =>
  liquidBacking / floatingSupply;

export const getLiquidBackingPerGOhmBacked = (liquidBacking: number, backedSupply: number, ohmIndex: number) => {
  return liquidBacking / getGOhmBackedSupply(backedSupply, ohmIndex);
}

const filterByChain = (tokenRecords: TokenRecord[], tokenSupplies: TokenSupply[], chain: string): [TokenRecord[], TokenSupply[]] => {
  const filteredRecords = tokenRecords.filter(record => record.blockchain === chain);
  const filteredSupplies = tokenSupplies.filter(record => record.blockchain === chain);

  return [filteredRecords, filteredSupplies];
}

const getBlock = (tokenRecords: TokenRecord[]): number => {
  if (!tokenRecords.length) {
    return 0;
  }

  return +tokenRecords[0].block;
}

const getTimestamp = (tokenRecords: TokenRecord[]): number => {
  if (!tokenRecords.length) {
    return 0;
  }

  return +tokenRecords[0].timestamp;
}

export const getMetricObject = (tokenRecords: TokenRecord[], tokenSupplies: TokenSupply[], protocolMetrics: ProtocolMetric[], includeRecords = false): Metric | null => {
  if (!tokenRecords.length || !tokenSupplies.length || !protocolMetrics.length) {
    return null;
  }

  const ohmIndex: number = +protocolMetrics[0].currentIndex;
  const ohmApy: number = +protocolMetrics[0].currentAPY;
  const ohmPrice: number = +protocolMetrics[0].ohmPrice;
  const gOhmPrice: number = +protocolMetrics[0].gOhmPrice;
  const ohmCirculatingSupply: number = getOhmCirculatingSupply(tokenSupplies, ohmIndex)[0];
  const ohmFloatingSupply = getOhmFloatingSupply(tokenSupplies, ohmIndex);
  const ohmBackedSupply = getOhmBackedSupply(tokenSupplies, ohmIndex);
  const liquidBacking = getTreasuryAssetValue(tokenRecords, true);

  const sOhmCirculatingSupply: number = +protocolMetrics[0].sOhmCirculatingSupply;
  const sOhmTotalValueLocked: number = +protocolMetrics[0].totalValueLocked;

  // Obtain per-chain arrays
  const [arbitrumTokenRecords, arbitrumTokenSupplies] = filterByChain(tokenRecords, tokenSupplies, CHAIN_ARBITRUM);
  const [ethereumTokenRecords, ethereumTokenSupplies] = filterByChain(tokenRecords, tokenSupplies, CHAIN_ETHEREUM);
  const [fantomTokenRecords, fantomTokenSupplies] = filterByChain(tokenRecords, tokenSupplies, CHAIN_FANTOM);
  const [polygonTokenRecords, polygonTokenSupplies] = filterByChain(tokenRecords, tokenSupplies, CHAIN_POLYGON);

  // Per-chain supply
  const ohmTotalSupplyArbitrum = getOhmTotalSupply(arbitrumTokenSupplies, ohmIndex);
  const ohmTotalSupplyEthereum = getOhmTotalSupply(ethereumTokenSupplies, ohmIndex);
  const ohmTotalSupplyFantom = getOhmTotalSupply(fantomTokenSupplies, ohmIndex);
  const ohmTotalSupplyPolygon = getOhmTotalSupply(polygonTokenSupplies, ohmIndex);

  const ohmCirculatingSupplyArbitrum = getOhmCirculatingSupply(arbitrumTokenSupplies, ohmIndex);
  const ohmCirculatingSupplyEthereum = getOhmCirculatingSupply(ethereumTokenSupplies, ohmIndex);
  const ohmCirculatingSupplyFantom = getOhmCirculatingSupply(fantomTokenSupplies, ohmIndex);
  const ohmCirculatingSupplyPolygon = getOhmCirculatingSupply(polygonTokenSupplies, ohmIndex);

  const ohmFloatingSupplyArbitrum = getOhmFloatingSupply(arbitrumTokenSupplies, ohmIndex);
  const ohmFloatingSupplyEthereum = getOhmFloatingSupply(ethereumTokenSupplies, ohmIndex);
  const ohmFloatingSupplyFantom = getOhmFloatingSupply(fantomTokenSupplies, ohmIndex);
  const ohmFloatingSupplyPolygon = getOhmFloatingSupply(polygonTokenSupplies, ohmIndex);

  const ohmBackedSupplyArbitrum = getOhmBackedSupply(arbitrumTokenSupplies, ohmIndex);
  const ohmBackedSupplyEthereum = getOhmBackedSupply(ethereumTokenSupplies, ohmIndex);
  const ohmBackedSupplyFantom = getOhmBackedSupply(fantomTokenSupplies, ohmIndex);
  const ohmBackedSupplyPolygon = getOhmBackedSupply(polygonTokenSupplies, ohmIndex);

  // Per-chain token records
  const marketValueArbitrum = getTreasuryAssetValue(arbitrumTokenRecords, false);
  const marketValueEthereum = getTreasuryAssetValue(ethereumTokenRecords, false);
  const marketValueFantom = getTreasuryAssetValue(fantomTokenRecords, false);
  const marketValuePolygon = getTreasuryAssetValue(polygonTokenRecords, false);

  const liquidBackingArbitrum = getTreasuryAssetValue(arbitrumTokenRecords, true);
  const liquidBackingEthereum = getTreasuryAssetValue(ethereumTokenRecords, true);
  const liquidBackingFantom = getTreasuryAssetValue(fantomTokenRecords, true);
  const liquidBackingPolygon = getTreasuryAssetValue(polygonTokenRecords, true);

  return {
    date: tokenRecords[0].date,
    blocks: {
      [CHAIN_ARBITRUM]: getBlock(arbitrumTokenRecords),
      [CHAIN_ETHEREUM]: getBlock(ethereumTokenRecords),
      [CHAIN_FANTOM]: getBlock(fantomTokenRecords),
      [CHAIN_POLYGON]: getBlock(polygonTokenRecords),
    },
    timestamps: {
      [CHAIN_ARBITRUM]: getTimestamp(arbitrumTokenRecords),
      [CHAIN_ETHEREUM]: getTimestamp(ethereumTokenRecords),
      [CHAIN_FANTOM]: getTimestamp(fantomTokenRecords),
      [CHAIN_POLYGON]: getTimestamp(polygonTokenRecords),
    },
    ohmIndex: ohmIndex,
    ohmApy: ohmApy,
    ohmTotalSupply: getOhmTotalSupply(tokenSupplies, ohmIndex)[0],
    ohmTotalSupplyComponents: {
      [CHAIN_ARBITRUM]: ohmTotalSupplyArbitrum[0],
      [CHAIN_ETHEREUM]: ohmTotalSupplyEthereum[0],
      [CHAIN_FANTOM]: ohmTotalSupplyFantom[0],
      [CHAIN_POLYGON]: ohmTotalSupplyPolygon[0],
    },
    ohmCirculatingSupply: ohmCirculatingSupply,
    ohmCirculatingSupplyComponents: {
      [CHAIN_ARBITRUM]: ohmCirculatingSupplyArbitrum[0],
      [CHAIN_ETHEREUM]: ohmCirculatingSupplyEthereum[0],
      [CHAIN_FANTOM]: ohmCirculatingSupplyFantom[0],
      [CHAIN_POLYGON]: ohmCirculatingSupplyPolygon[0],
    },
    ohmFloatingSupply: getOhmFloatingSupply(tokenSupplies, ohmIndex)[0],
    ohmFloatingSupplyComponents: {
      [CHAIN_ARBITRUM]: ohmFloatingSupplyArbitrum[0],
      [CHAIN_ETHEREUM]: ohmFloatingSupplyEthereum[0],
      [CHAIN_FANTOM]: ohmFloatingSupplyFantom[0],
      [CHAIN_POLYGON]: ohmFloatingSupplyPolygon[0],
    },
    ohmBackedSupply: ohmBackedSupply[0],
    gOhmBackedSupply: getGOhmBackedSupply(ohmBackedSupply[0], ohmIndex),
    ohmBackedSupplyComponents: {
      [CHAIN_ARBITRUM]: ohmBackedSupplyArbitrum[0],
      [CHAIN_ETHEREUM]: ohmBackedSupplyEthereum[0],
      [CHAIN_FANTOM]: ohmBackedSupplyFantom[0],
      [CHAIN_POLYGON]: ohmBackedSupplyPolygon[0],
    },
    ohmPrice: ohmPrice,
    gOhmPrice: gOhmPrice,
    marketCap: ohmPrice * ohmCirculatingSupply,
    sOhmCirculatingSupply: sOhmCirculatingSupply,
    sOhmTotalValueLocked: sOhmTotalValueLocked,
    treasuryMarketValue: getTreasuryAssetValue(tokenRecords, false)[0],
    treasuryMarketValueComponents: {
      [CHAIN_ARBITRUM]: marketValueArbitrum[0],
      [CHAIN_ETHEREUM]: marketValueEthereum[0],
      [CHAIN_FANTOM]: marketValueFantom[0],
      [CHAIN_POLYGON]: marketValuePolygon[0],
    },
    treasuryLiquidBacking: liquidBacking[0],
    treasuryLiquidBackingComponents: {
      [CHAIN_ARBITRUM]: liquidBackingArbitrum[0],
      [CHAIN_ETHEREUM]: liquidBackingEthereum[0],
      [CHAIN_FANTOM]: liquidBackingFantom[0],
      [CHAIN_POLYGON]: liquidBackingPolygon[0],
    },
    treasuryLiquidBackingPerOhmFloating: getLiquidBackingPerOhmFloating(liquidBacking[0], ohmFloatingSupply[0]),
    treasuryLiquidBackingPerOhmBacked: getLiquidBackingPerOhmBacked(liquidBacking[0], ohmBackedSupply[0]),
    treasuryLiquidBackingPerGOhmBacked: getLiquidBackingPerGOhmBacked(liquidBacking[0], ohmBackedSupply[0], ohmIndex),
    // Optional properties
    ...includeRecords ? {
      ohmTotalSupplyRecords: {
        [CHAIN_ARBITRUM]: ohmTotalSupplyArbitrum[1],
        [CHAIN_ETHEREUM]: ohmTotalSupplyEthereum[1],
        [CHAIN_FANTOM]: ohmTotalSupplyFantom[1],
        [CHAIN_POLYGON]: ohmTotalSupplyPolygon[1],
      },
      ohmCirculatingSupplyRecords: {
        [CHAIN_ARBITRUM]: ohmCirculatingSupplyArbitrum[1],
        [CHAIN_ETHEREUM]: ohmCirculatingSupplyEthereum[1],
        [CHAIN_FANTOM]: ohmCirculatingSupplyFantom[1],
        [CHAIN_POLYGON]: ohmCirculatingSupplyPolygon[1],
      },
      ohmFloatingSupplyRecords: {
        [CHAIN_ARBITRUM]: ohmFloatingSupplyArbitrum[1],
        [CHAIN_ETHEREUM]: ohmFloatingSupplyEthereum[1],
        [CHAIN_FANTOM]: ohmFloatingSupplyFantom[1],
        [CHAIN_POLYGON]: ohmFloatingSupplyPolygon[1],
      },
      ohmBackedSupplyRecords: {
        [CHAIN_ARBITRUM]: ohmBackedSupplyArbitrum[1],
        [CHAIN_ETHEREUM]: ohmBackedSupplyEthereum[1],
        [CHAIN_FANTOM]: ohmBackedSupplyFantom[1],
        [CHAIN_POLYGON]: ohmBackedSupplyPolygon[1],
      },
      treasuryMarketValueRecords: {
        [CHAIN_ARBITRUM]: marketValueArbitrum[1],
        [CHAIN_ETHEREUM]: marketValueEthereum[1],
        [CHAIN_FANTOM]: marketValueFantom[1],
        [CHAIN_POLYGON]: marketValuePolygon[1],
      },
      treasuryLiquidBackingRecords: {
        [CHAIN_ARBITRUM]: liquidBackingArbitrum[1],
        [CHAIN_ETHEREUM]: liquidBackingEthereum[1],
        [CHAIN_FANTOM]: liquidBackingFantom[1],
        [CHAIN_POLYGON]: liquidBackingPolygon[1],
      },
    } : {},
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
