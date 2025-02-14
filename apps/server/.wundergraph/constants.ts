export const CHAIN_ARBITRUM = "Arbitrum";
export const CHAIN_ETHEREUM = "Ethereum";
export const CHAIN_FANTOM = "Fantom";
export const CHAIN_POLYGON = "Polygon";
export const CHAIN_BASE = "Base";
export const CHAIN_BERACHAIN = "Berachain";

export enum Chains {
  ARBITRUM = CHAIN_ARBITRUM,
  ETHEREUM = CHAIN_ETHEREUM,
  FANTOM = CHAIN_FANTOM,
  POLYGON = CHAIN_POLYGON,
  BASE = CHAIN_BASE,
  BERACHAIN = CHAIN_BERACHAIN,
};

export const TOKEN_SUPPLY_TYPE_BONDS_DEPOSITS = "OHM Bonds (Burnable Deposits)";
export const TOKEN_SUPPLY_TYPE_BONDS_PREMINTED = "OHM Bonds (Pre-minted)";
export const TOKEN_SUPPLY_TYPE_BONDS_VESTING_DEPOSITS = "OHM Bonds (Vesting Deposits)";
export const TOKEN_SUPPLY_TYPE_BONDS_VESTING_TOKENS = "OHM Bonds (Vesting Tokens)";
export const TOKEN_SUPPLY_TYPE_LIQUIDITY = "Liquidity";
export const TOKEN_SUPPLY_TYPE_BOOSTED_LIQUIDITY_VAULT = "Boosted Liquidity Vault";
export const TOKEN_SUPPLY_TYPE_OFFSET = "Manual Offset";
export const TOKEN_SUPPLY_TYPE_TOTAL_SUPPLY = "Total Supply";
export const TOKEN_SUPPLY_TYPE_TREASURY = "Treasury";
export const TOKEN_SUPPLY_TYPE_LENDING = "Lending";

/**
 * If adding any new categories, be sure to update the getSupplyCategories function.
 */
export enum TokenSupplyCategories {
  BONDS_DEPOSITS = "BondsDeposits",
  BONDS_PREMINTED = "BondsPreminted",
  BONDS_VESTING_DEPOSITS = "BondsDepositsVesting",
  BONDS_VESTING_TOKENS = "BondsTokensVesting",
  BOOSTED_LIQUIDITY_VAULT = "BoostedLiquidityVault",
  LENDING = "LendingMarkets",
  LIQUIDITY = "ProtocolOwnedLiquidity",
  MIGRATION_OFFSET = "MigrationOffset",
  TOTAL_SUPPLY = "TotalSupply",
  TREASURY = "Treasury",
};

export const CATEGORY_STABLE = "Stable";
export const CATEGORY_VOLATILE = "Volatile";
export const CATEGORY_POL = "Protocol-Owned Liquidity";
