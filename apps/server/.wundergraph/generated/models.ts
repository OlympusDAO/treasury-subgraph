// Code generated by wunderctl. DO NOT EDIT.

import type function_LatestProtocolMetrics from "../operations/latest/protocolMetrics";
import type function_LatestTokenRecords from "../operations/latest/tokenRecords";
import type function_LatestTokenSupplies from "../operations/latest/tokenSupplies";
import type function_PaginatedProtocolMetrics from "../operations/paginated/protocolMetrics";
import type function_PaginatedTokenRecords from "../operations/paginated/tokenRecords";
import type function_PaginatedTokenSupplies from "../operations/paginated/tokenSupplies";
import type { ExtractInput, ExtractResponse } from "@wundergraph/sdk/operations";
import type { OperationErrors } from "./ts-operation-errors";

export type JSONValue = string | number | boolean | JSONObject | Array<JSONValue>;

export type JSONObject = { [key: string]: JSONValue };
import type { GraphQLError } from "@wundergraph/sdk/client";

export interface ProtocolMetricsInput {
	pageSize?: number;
	startDate: string;
	endDate: string;
}

export interface TokenRecordsInput {
	pageSize?: number;
	startDate: string;
	endDate: string;
}

export interface TokenSuppliesInput {
	pageSize?: number;
	startDate: string;
	endDate: string;
}

export type PaginatedProtocolMetricsInput = ExtractInput<typeof function_PaginatedProtocolMetrics>;

export type PaginatedTokenRecordsInput = ExtractInput<typeof function_PaginatedTokenRecords>;

export type PaginatedTokenSuppliesInput = ExtractInput<typeof function_PaginatedTokenSupplies>;

export interface InternalProtocolMetricsInput {
	pageSize?: number;
	startDate: string;
	endDate: string;
}

export interface InternalTokenRecordsInput {
	pageSize?: number;
	startDate: string;
	endDate: string;
}

export interface InternalTokenSuppliesInput {
	pageSize?: number;
	startDate: string;
	endDate: string;
}

export interface InternalPaginatedProtocolMetricsInput {
	startDate: string;
	dateOffset?: number;
}

export interface InternalPaginatedTokenRecordsInput {
	startDate: string;
	dateOffset?: number;
}

export interface InternalPaginatedTokenSuppliesInput {
	startDate: string;
	dateOffset?: number;
	pageSize?: number;
}

export interface InjectedProtocolMetricsInput {
	pageSize?: number;
	startDate: string;
	endDate: string;
}

export interface InjectedTokenRecordsInput {
	pageSize?: number;
	startDate: string;
	endDate: string;
}

export interface InjectedTokenSuppliesInput {
	pageSize?: number;
	startDate: string;
	endDate: string;
}

export interface ProtocolMetricsResponse {
	data?: ProtocolMetricsResponseData;
	errors?: GraphQLError[];
}

export interface ProtocolMetricsLatestResponse {
	data?: ProtocolMetricsLatestResponseData;
	errors?: GraphQLError[];
}

export interface TokenRecordsResponse {
	data?: TokenRecordsResponseData;
	errors?: GraphQLError[];
}

export interface TokenRecordsLatestResponse {
	data?: TokenRecordsLatestResponseData;
	errors?: GraphQLError[];
}

export interface TokenSuppliesResponse {
	data?: TokenSuppliesResponseData;
	errors?: GraphQLError[];
}

export interface TokenSuppliesLatestResponse {
	data?: TokenSuppliesLatestResponseData;
	errors?: GraphQLError[];
}

export interface LatestProtocolMetricsResponse {
	data?: LatestProtocolMetricsResponseData;
	errors?: GraphQLError[];
}

export interface LatestTokenRecordsResponse {
	data?: LatestTokenRecordsResponseData;
	errors?: GraphQLError[];
}

export interface LatestTokenSuppliesResponse {
	data?: LatestTokenSuppliesResponseData;
	errors?: GraphQLError[];
}

export interface PaginatedProtocolMetricsResponse {
	data?: PaginatedProtocolMetricsResponseData;
	errors?: GraphQLError[];
}

export interface PaginatedTokenRecordsResponse {
	data?: PaginatedTokenRecordsResponseData;
	errors?: GraphQLError[];
}

export interface PaginatedTokenSuppliesResponse {
	data?: PaginatedTokenSuppliesResponseData;
	errors?: GraphQLError[];
}

export interface ProtocolMetricsResponseData {
	treasuryArbitrum_protocolMetrics: {
		id: string;
		block: string;
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
		timestamp: string;
		totalValueLocked: string;
	}[];
	treasuryEthereum_protocolMetrics: {
		id: string;
		block: string;
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
		timestamp: string;
		totalValueLocked: string;
	}[];
	treasuryFantom_protocolMetrics: {
		id: string;
		block: string;
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
		timestamp: string;
		totalValueLocked: string;
	}[];
	treasuryPolygon_protocolMetrics: {
		id: string;
		block: string;
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
		timestamp: string;
		totalValueLocked: string;
	}[];
}

export interface ProtocolMetricsLatestResponseData {
	treasuryArbitrum_protocolMetrics: {
		id: string;
		block: string;
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
		timestamp: string;
		totalValueLocked: string;
	}[];
	treasuryEthereum_protocolMetrics: {
		id: string;
		block: string;
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
		timestamp: string;
		totalValueLocked: string;
	}[];
	treasuryFantom_protocolMetrics: {
		id: string;
		block: string;
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
		timestamp: string;
		totalValueLocked: string;
	}[];
	treasuryPolygon_protocolMetrics: {
		id: string;
		block: string;
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
		timestamp: string;
		totalValueLocked: string;
	}[];
}

export interface TokenRecordsResponseData {
	treasuryArbitrum_tokenRecords: {
		id: string;
		balance: string;
		block: string;
		blockchain: string;
		category: string;
		date: string;
		isBluechip: boolean;
		isLiquid: boolean;
		multiplier: string;
		rate: string;
		source: string;
		sourceAddress: string;
		timestamp: string;
		token: string;
		tokenAddress: string;
		value: string;
		valueExcludingOhm: string;
	}[];
	treasuryEthereum_tokenRecords: {
		id: string;
		balance: string;
		block: string;
		blockchain: string;
		category: string;
		date: string;
		isBluechip: boolean;
		isLiquid: boolean;
		multiplier: string;
		rate: string;
		source: string;
		sourceAddress: string;
		timestamp: string;
		token: string;
		tokenAddress: string;
		value: string;
		valueExcludingOhm: string;
	}[];
	treasuryFantom_tokenRecords: {
		id: string;
		balance: string;
		block: string;
		blockchain: string;
		category: string;
		date: string;
		isBluechip: boolean;
		isLiquid: boolean;
		multiplier: string;
		rate: string;
		source: string;
		sourceAddress: string;
		timestamp: string;
		token: string;
		tokenAddress: string;
		value: string;
		valueExcludingOhm: string;
	}[];
	treasuryPolygon_tokenRecords: {
		id: string;
		balance: string;
		block: string;
		blockchain: string;
		category: string;
		date: string;
		isBluechip: boolean;
		isLiquid: boolean;
		multiplier: string;
		rate: string;
		source: string;
		sourceAddress: string;
		timestamp: string;
		token: string;
		tokenAddress: string;
		value: string;
		valueExcludingOhm: string;
	}[];
}

export interface TokenRecordsLatestResponseData {
	treasuryArbitrum_tokenRecords: {
		id: string;
		balance: string;
		block: string;
		blockchain: string;
		category: string;
		date: string;
		isBluechip: boolean;
		isLiquid: boolean;
		multiplier: string;
		rate: string;
		source: string;
		sourceAddress: string;
		timestamp: string;
		token: string;
		tokenAddress: string;
		value: string;
		valueExcludingOhm: string;
	}[];
	treasuryEthereum_tokenRecords: {
		id: string;
		balance: string;
		block: string;
		blockchain: string;
		category: string;
		date: string;
		isBluechip: boolean;
		isLiquid: boolean;
		multiplier: string;
		rate: string;
		source: string;
		sourceAddress: string;
		timestamp: string;
		token: string;
		tokenAddress: string;
		value: string;
		valueExcludingOhm: string;
	}[];
	treasuryFantom_tokenRecords: {
		id: string;
		balance: string;
		block: string;
		blockchain: string;
		category: string;
		date: string;
		isBluechip: boolean;
		isLiquid: boolean;
		multiplier: string;
		rate: string;
		source: string;
		sourceAddress: string;
		timestamp: string;
		token: string;
		tokenAddress: string;
		value: string;
		valueExcludingOhm: string;
	}[];
	treasuryPolygon_tokenRecords: {
		id: string;
		balance: string;
		block: string;
		blockchain: string;
		category: string;
		date: string;
		isBluechip: boolean;
		isLiquid: boolean;
		multiplier: string;
		rate: string;
		source: string;
		sourceAddress: string;
		timestamp: string;
		token: string;
		tokenAddress: string;
		value: string;
		valueExcludingOhm: string;
	}[];
}

export interface TokenSuppliesResponseData {
	treasuryArbitrum_tokenSupplies: {
		id: string;
		balance: string;
		block: string;
		date: string;
		pool?: string;
		poolAddress?: string;
		source?: string;
		sourceAddress?: string;
		supplyBalance: string;
		timestamp: string;
		token: string;
		tokenAddress: string;
		type: string;
	}[];
	treasuryEthereum_tokenSupplies: {
		id: string;
		balance: string;
		block: string;
		date: string;
		pool?: string;
		poolAddress?: string;
		source?: string;
		sourceAddress?: string;
		supplyBalance: string;
		timestamp: string;
		token: string;
		tokenAddress: string;
		type: string;
	}[];
	treasuryFantom_tokenSupplies: {
		id: string;
		balance: string;
		block: string;
		date: string;
		pool?: string;
		poolAddress?: string;
		source?: string;
		sourceAddress?: string;
		supplyBalance: string;
		timestamp: string;
		token: string;
		tokenAddress: string;
		type: string;
	}[];
	treasuryPolygon_tokenSupplies: {
		id: string;
		balance: string;
		block: string;
		date: string;
		pool?: string;
		poolAddress?: string;
		source?: string;
		sourceAddress?: string;
		supplyBalance: string;
		timestamp: string;
		token: string;
		tokenAddress: string;
		type: string;
	}[];
}

export interface TokenSuppliesLatestResponseData {
	treasuryArbitrum_tokenSupplies: {
		id: string;
		balance: string;
		block: string;
		date: string;
		pool?: string;
		poolAddress?: string;
		source?: string;
		sourceAddress?: string;
		supplyBalance: string;
		timestamp: string;
		token: string;
		tokenAddress: string;
		type: string;
	}[];
	treasuryEthereum_tokenSupplies: {
		id: string;
		balance: string;
		block: string;
		date: string;
		pool?: string;
		poolAddress?: string;
		source?: string;
		sourceAddress?: string;
		supplyBalance: string;
		timestamp: string;
		token: string;
		tokenAddress: string;
		type: string;
	}[];
	treasuryFantom_tokenSupplies: {
		id: string;
		balance: string;
		block: string;
		date: string;
		pool?: string;
		poolAddress?: string;
		source?: string;
		sourceAddress?: string;
		supplyBalance: string;
		timestamp: string;
		token: string;
		tokenAddress: string;
		type: string;
	}[];
	treasuryPolygon_tokenSupplies: {
		id: string;
		balance: string;
		block: string;
		date: string;
		pool?: string;
		poolAddress?: string;
		source?: string;
		sourceAddress?: string;
		supplyBalance: string;
		timestamp: string;
		token: string;
		tokenAddress: string;
		type: string;
	}[];
}

export type LatestProtocolMetricsResponseData = ExtractResponse<typeof function_LatestProtocolMetrics>;

export type LatestTokenRecordsResponseData = ExtractResponse<typeof function_LatestTokenRecords>;

export type LatestTokenSuppliesResponseData = ExtractResponse<typeof function_LatestTokenSupplies>;

export type PaginatedProtocolMetricsResponseData = ExtractResponse<typeof function_PaginatedProtocolMetrics>;

export type PaginatedTokenRecordsResponseData = ExtractResponse<typeof function_PaginatedTokenRecords>;

export type PaginatedTokenSuppliesResponseData = ExtractResponse<typeof function_PaginatedTokenSupplies>;
