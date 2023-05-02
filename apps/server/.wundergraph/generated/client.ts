import type {
	ClientConfig,
	CreateClientConfig,
	User,
	UploadRequestOptions,
	OperationMetadata,
	OperationsDefinition,
	OperationRequestOptions,
	SubscriptionRequestOptions,
	SubscriptionEventHandler,
	FetchUserRequestOptions,
	UploadValidationOptions,
	QueryRequestOptions,
	MutationRequestOptions,
	ClientOperationErrors,
	ExtractProfileName,
	ExtractMeta,
	GraphQLError,
} from "@wundergraph/sdk/client";
import { Client } from "@wundergraph/sdk/client";
import type { OperationErrors } from "./ts-operation-errors";

import type { PublicCustomClaims } from "./claims";
import type {
	ProtocolMetricsResponse,
	ProtocolMetricsInput,
	ProtocolMetricsResponseData,
	ProtocolMetricsLatestResponse,
	ProtocolMetricsLatestResponseData,
	TokenRecordsResponse,
	TokenRecordsInput,
	TokenRecordsResponseData,
	TokenRecordsLatestResponse,
	TokenRecordsLatestResponseData,
	TokenSuppliesResponse,
	TokenSuppliesInput,
	TokenSuppliesResponseData,
	TokenSuppliesLatestResponse,
	TokenSuppliesLatestResponseData,
	LatestProtocolMetricsResponse,
	LatestProtocolMetricsResponseData,
	LatestTokenRecordsResponse,
	LatestTokenRecordsResponseData,
	LatestTokenSuppliesResponse,
	LatestTokenSuppliesResponseData,
	PaginatedProtocolMetricsResponse,
	PaginatedProtocolMetricsInput,
	PaginatedProtocolMetricsResponseData,
	PaginatedTokenRecordsResponse,
	PaginatedTokenRecordsInput,
	PaginatedTokenRecordsResponseData,
	PaginatedTokenSuppliesResponse,
	PaginatedTokenSuppliesInput,
	PaginatedTokenSuppliesResponseData,
} from "./models";
export type UserRole = "admin" | "user";

export const WUNDERGRAPH_S3_ENABLED = false;
export const WUNDERGRAPH_AUTH_ENABLED = false;

export const defaultClientConfig: ClientConfig = {
	applicationHash: "e70c9844",
	baseURL: "https://jem-federated-subgraph.wundergraph.dev",
	sdkVersion: "0.149.1",
};

export const operationMetadata: OperationMetadata = {
	protocolMetrics: {
		requiresAuthentication: false,
	},
	protocolMetricsLatest: {
		requiresAuthentication: false,
	},
	tokenRecords: {
		requiresAuthentication: false,
	},
	tokenRecordsLatest: {
		requiresAuthentication: false,
	},
	tokenSupplies: {
		requiresAuthentication: false,
	},
	tokenSuppliesLatest: {
		requiresAuthentication: false,
	},
	"latest/protocolMetrics": {
		requiresAuthentication: false,
	},
	"latest/tokenRecords": {
		requiresAuthentication: false,
	},
	"latest/tokenSupplies": {
		requiresAuthentication: false,
	},
	"paginated/protocolMetrics": {
		requiresAuthentication: false,
	},
	"paginated/tokenRecords": {
		requiresAuthentication: false,
	},
	"paginated/tokenSupplies": {
		requiresAuthentication: false,
	},
};

export type PublicUser = User<UserRole, PublicCustomClaims>;

export class WunderGraphClient extends Client {
	query<
		OperationName extends Extract<keyof Operations["queries"], string>,
		Input extends Operations["queries"][OperationName]["input"] = Operations["queries"][OperationName]["input"],
		Response extends Operations["queries"][OperationName]["response"] = Operations["queries"][OperationName]["response"]
	>(options: OperationName extends string ? QueryRequestOptions<OperationName, Input> : OperationRequestOptions) {
		return super.query<OperationRequestOptions, Response["data"], Response["error"]>(options);
	}
	mutate<
		OperationName extends Extract<keyof Operations["mutations"], string>,
		Input extends Operations["mutations"][OperationName]["input"] = Operations["mutations"][OperationName]["input"],
		Response extends Operations["mutations"][OperationName]["response"] = Operations["mutations"][OperationName]["response"]
	>(options: OperationName extends string ? MutationRequestOptions<OperationName, Input> : OperationRequestOptions) {
		return super.mutate<OperationRequestOptions, Response["data"], Response["error"]>(options);
	}
	subscribe<
		OperationName extends Extract<keyof Operations["subscriptions"], string>,
		Input extends Operations["subscriptions"][OperationName]["input"] = Operations["subscriptions"][OperationName]["input"],
		Response extends Operations["subscriptions"][OperationName]["response"] = Operations["subscriptions"][OperationName]["response"]
	>(
		options: OperationName extends string
			? SubscriptionRequestOptions<OperationName, Input>
			: SubscriptionRequestOptions,
		cb?: SubscriptionEventHandler<Response["data"], Response["error"]>
	) {
		return super.subscribe<OperationRequestOptions, Response["data"], Response["error"]>(options, cb);
	}
	public login(authProviderID: Operations["authProvider"], redirectURI?: string) {
		return super.login(authProviderID, redirectURI);
	}
	public async fetchUser<TUser extends PublicUser = PublicUser>(options?: FetchUserRequestOptions) {
		return super.fetchUser<TUser>(options);
	}
}

export const createClient = (config?: CreateClientConfig) => {
	return new WunderGraphClient({
		...defaultClientConfig,
		...config,
		operationMetadata,
		csrfEnabled: false,
	});
};

export type Queries = {
	protocolMetrics: {
		input: ProtocolMetricsInput;
		response: { data?: ProtocolMetricsResponse["data"]; error?: ClientOperationErrors };
		requiresAuthentication: false;
		liveQuery: boolean;
	};
	protocolMetricsLatest: {
		input?: undefined;
		response: { data?: ProtocolMetricsLatestResponse["data"]; error?: ClientOperationErrors };
		requiresAuthentication: false;
		liveQuery: boolean;
	};
	tokenRecords: {
		input: TokenRecordsInput;
		response: { data?: TokenRecordsResponse["data"]; error?: ClientOperationErrors };
		requiresAuthentication: false;
		liveQuery: boolean;
	};
	tokenRecordsLatest: {
		input?: undefined;
		response: { data?: TokenRecordsLatestResponse["data"]; error?: ClientOperationErrors };
		requiresAuthentication: false;
		liveQuery: boolean;
	};
	tokenSupplies: {
		input: TokenSuppliesInput;
		response: { data?: TokenSuppliesResponse["data"]; error?: ClientOperationErrors };
		requiresAuthentication: false;
		liveQuery: boolean;
	};
	tokenSuppliesLatest: {
		input?: undefined;
		response: { data?: TokenSuppliesLatestResponse["data"]; error?: ClientOperationErrors };
		requiresAuthentication: false;
		liveQuery: boolean;
	};
	"latest/protocolMetrics": {
		input?: undefined;
		response: { data?: LatestProtocolMetricsResponseData; error?: OperationErrors["latest/protocolMetrics"] };
		requiresAuthentication: false;
		liveQuery: boolean;
	};
	"latest/tokenRecords": {
		input?: undefined;
		response: { data?: LatestTokenRecordsResponseData; error?: OperationErrors["latest/tokenRecords"] };
		requiresAuthentication: false;
		liveQuery: boolean;
	};
	"latest/tokenSupplies": {
		input?: undefined;
		response: { data?: LatestTokenSuppliesResponseData; error?: OperationErrors["latest/tokenSupplies"] };
		requiresAuthentication: false;
		liveQuery: boolean;
	};
	"paginated/protocolMetrics": {
		input: PaginatedProtocolMetricsInput;
		response: { data?: PaginatedProtocolMetricsResponseData; error?: OperationErrors["paginated/protocolMetrics"] };
		requiresAuthentication: false;
		liveQuery: boolean;
	};
	"paginated/tokenRecords": {
		input: PaginatedTokenRecordsInput;
		response: { data?: PaginatedTokenRecordsResponseData; error?: OperationErrors["paginated/tokenRecords"] };
		requiresAuthentication: false;
		liveQuery: boolean;
	};
	"paginated/tokenSupplies": {
		input: PaginatedTokenSuppliesInput;
		response: { data?: PaginatedTokenSuppliesResponseData; error?: OperationErrors["paginated/tokenSupplies"] };
		requiresAuthentication: false;
		liveQuery: boolean;
	};
};

export type Mutations = {};

export type Subscriptions = {};

export type LiveQueries = {
	protocolMetrics: {
		input: ProtocolMetricsInput;
		response: { data?: ProtocolMetricsResponse["data"]; error?: ClientOperationErrors };
		liveQuery: true;
		requiresAuthentication: false;
	};
	protocolMetricsLatest: {
		input?: undefined;
		response: { data?: ProtocolMetricsLatestResponse["data"]; error?: ClientOperationErrors };
		liveQuery: true;
		requiresAuthentication: false;
	};
	tokenRecords: {
		input: TokenRecordsInput;
		response: { data?: TokenRecordsResponse["data"]; error?: ClientOperationErrors };
		liveQuery: true;
		requiresAuthentication: false;
	};
	tokenRecordsLatest: {
		input?: undefined;
		response: { data?: TokenRecordsLatestResponse["data"]; error?: ClientOperationErrors };
		liveQuery: true;
		requiresAuthentication: false;
	};
	tokenSupplies: {
		input: TokenSuppliesInput;
		response: { data?: TokenSuppliesResponse["data"]; error?: ClientOperationErrors };
		liveQuery: true;
		requiresAuthentication: false;
	};
	tokenSuppliesLatest: {
		input?: undefined;
		response: { data?: TokenSuppliesLatestResponse["data"]; error?: ClientOperationErrors };
		liveQuery: true;
		requiresAuthentication: false;
	};
	"latest/protocolMetrics": {
		input?: undefined;
		response: { data?: LatestProtocolMetricsResponse["data"]; error?: ClientOperationErrors };
		liveQuery: true;
		requiresAuthentication: false;
	};
	"latest/tokenRecords": {
		input?: undefined;
		response: { data?: LatestTokenRecordsResponse["data"]; error?: ClientOperationErrors };
		liveQuery: true;
		requiresAuthentication: false;
	};
	"latest/tokenSupplies": {
		input?: undefined;
		response: { data?: LatestTokenSuppliesResponse["data"]; error?: ClientOperationErrors };
		liveQuery: true;
		requiresAuthentication: false;
	};
	"paginated/protocolMetrics": {
		input: PaginatedProtocolMetricsInput;
		response: { data?: PaginatedProtocolMetricsResponse["data"]; error?: ClientOperationErrors };
		liveQuery: true;
		requiresAuthentication: false;
	};
	"paginated/tokenRecords": {
		input: PaginatedTokenRecordsInput;
		response: { data?: PaginatedTokenRecordsResponse["data"]; error?: ClientOperationErrors };
		liveQuery: true;
		requiresAuthentication: false;
	};
	"paginated/tokenSupplies": {
		input: PaginatedTokenSuppliesInput;
		response: { data?: PaginatedTokenSuppliesResponse["data"]; error?: ClientOperationErrors };
		liveQuery: true;
		requiresAuthentication: false;
	};
};

export interface Operations extends OperationsDefinition<Queries, Mutations, Subscriptions, UserRole, {}> {}
