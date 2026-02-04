// Core types for subgraph data
// Replaces WunderGraph generated types

export interface TokenRecord {
  id: string;
  balance: string;
  block: string | number;
  blockchain?: string;
  category: string;
  date: string;
  isBluechip: boolean;
  isLiquid: boolean;
  multiplier: string;
  rate: string;
  source: string;
  sourceAddress: string;
  timestamp: string | number;
  token: string;
  tokenAddress: string;
  value: string;
  valueExcludingOhm: string;
}

export interface TokenSupply {
  id: string;
  balance: string;
  block: string | number;
  blockchain?: string;
  date: string;
  pool?: string | null;
  poolAddress?: string | null;
  source: string;
  sourceAddress: string;
  supplyBalance: string;
  timestamp: string | number;
  token: string;
  tokenAddress: string;
  type: string;
}

export interface ProtocolMetric {
  id: string;
  block: string | number;
  blockchain?: string;
  currentAPY: string;
  currentIndex: string;
  date: string;
  gOhmPrice: string;
  gOhmTotalSupply: string;
  nextDistributedOhm: string;
  nextEpochRebase: string;
  ohmPrice: string;
  ohmTotalSupply: string;
  sOhmCirculatingSupply: string;
  timestamp: string | number;
  totalValueLocked: string;
}

// Aggregated response types (replaces WunderGraph generated types)
export interface TokenRecordsResponse {
  treasuryArbitrum_tokenRecords: TokenRecord[];
  treasuryEthereum_tokenRecords: TokenRecord[];
  treasuryFantom_tokenRecords: TokenRecord[];
  treasuryPolygon_tokenRecords: TokenRecord[];
  treasuryBase_tokenRecords: TokenRecord[];
  treasuryBerachain_tokenRecords: TokenRecord[];
}

export interface TokenSuppliesResponse {
  treasuryArbitrum_tokenSupplies: TokenSupply[];
  treasuryEthereum_tokenSupplies: TokenSupply[];
  treasuryFantom_tokenSupplies: TokenSupply[];
  treasuryPolygon_tokenSupplies: TokenSupply[];
  treasuryBase_tokenSupplies: TokenSupply[];
  treasuryBerachain_tokenSupplies: TokenSupply[];
}

export interface ProtocolMetricsResponse {
  treasuryArbitrum_protocolMetrics: ProtocolMetric[];
  treasuryEthereum_protocolMetrics: ProtocolMetric[];
  treasuryFantom_protocolMetrics: ProtocolMetric[];
  treasuryPolygon_protocolMetrics: ProtocolMetric[];
  treasuryBase_protocolMetrics: ProtocolMetric[];
  treasuryBerachain_protocolMetrics: ProtocolMetric[];
}

// Logger interface (replaces RequestLogger from @wundergraph/sdk/server)
export interface Logger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug?(message: string, ...args: unknown[]): void;
}

// Simple console logger implementation
export class ConsoleLogger implements Logger {
  constructor(private context: string = '') {}

  private format(message: string): string {
    return this.context ? `${this.context}: ${message}` : message;
  }

  info(message: string, ...args: unknown[]): void {
    console.info(this.format(message), ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(this.format(message), ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(this.format(message), ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    if (process.env.DEBUG) {
      console.debug(this.format(message), ...args);
    }
  }
}
