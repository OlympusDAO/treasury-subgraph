import { configureWunderGraphApplication, cors, introspect, templates } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

/**
 * The TokenSupply type on non-Ethereum chains has not historically had a blockchain property.
 * 
 * Re-indexing the historical data is very time-consuming, so we modify the schema to add this field,
 * and add it to each record in the operations.
 * 
 * NOTE: this is currently ignored by Wundergraph
 */
const schemaExtension: string =
	`
extend type TokenSupply {
	blockchain: String
}
`;

const resolveSubgraphUrl = (url: string): string => {
	// Validate that the required environment variables are set
	if (!process.env.ARBITRUM_SUBGRAPH_API_KEY) {
		throw new Error("ARBITRUM_SUBGRAPH_API_KEY is not set");
	}

	return url.replace("[api-key]", process.env.ARBITRUM_SUBGRAPH_API_KEY);
};

const treasuryEthereum = introspect.graphql({
	apiNamespace: "treasuryEthereum",
	url: resolveSubgraphUrl("https://gateway-arbitrum.network.thegraph.com/api/[api-key]/deployments/id/Qmd7wgnNTijSpV1JDM3yUE8Exy4EGG1jw3yyQKdTKvYiig"), // 5.1.3
	schemaExtension: schemaExtension,
});

const treasuryArbitrum = introspect.graphql({
	apiNamespace: "treasuryArbitrum",
	url: resolveSubgraphUrl("https://gateway-arbitrum.network.thegraph.com/api/[api-key]/deployments/id/QmRf3fo7tVsXsj9cQZSgT3Y2R67Hv41T1Ph559oQAmTLe1"), // 1.6.4
	schemaExtension: schemaExtension,
});

const treasuryFantom = introspect.graphql({
	apiNamespace: "treasuryFantom",
	url: "https://api.thegraph.com/subgraphs/name/olympusdao/protocol-metrics-fantom",
	schemaExtension: schemaExtension,
});

const treasuryPolygon = introspect.graphql({
	apiNamespace: "treasuryPolygon",
	url: "https://api.thegraph.com/subgraphs/name/olympusdao/protocol-metrics-polygon",
	schemaExtension: schemaExtension,
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [treasuryArbitrum, treasuryEthereum, treasuryFantom, treasuryPolygon],
	server,
	operations,
	codeGenerators: [
		{
			// all is required for the testing server
			templates: [...templates.typescript.all]
		},
	],
	cors: {
		...cors.allowAll,
	},
	security: {
		enableGraphQLEndpoint: process.env.NODE_ENV !== 'production' || process.env.GITPOD_WORKSPACE_ID !== undefined,
	},
});
