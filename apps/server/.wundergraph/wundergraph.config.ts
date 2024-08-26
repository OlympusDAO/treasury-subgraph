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
	url: resolveSubgraphUrl("https://gateway-arbitrum.network.thegraph.com/api/[api-key]/deployments/id/Qmam2fnfYzj6srEGC49XxsFyMwngs7xKwjGWZc7jnEU97h"), // 5.2.6
	schemaExtension: schemaExtension,
});

const treasuryArbitrum = introspect.graphql({
	apiNamespace: "treasuryArbitrum",
	url: resolveSubgraphUrl("https://gateway-arbitrum.network.thegraph.com/api/[api-key]/deployments/id/QmNQfMN2GjnGYx2mGo92gAc7z47fMbTMRR9M1gGEUjLZHX"), // 1.7.9
	schemaExtension: schemaExtension,
});

const treasuryFantom = introspect.graphql({
	apiNamespace: "treasuryFantom",
	url: resolveSubgraphUrl("https://gateway-arbitrum.network.thegraph.com/api/[api-key]/deployments/id/QmNUJtrE5Hiwj5eBeF5gSubY2vhuMdjaZnZsaq6vVY2aba"), // 1.0.4
	schemaExtension: schemaExtension,
});

const treasuryPolygon = introspect.graphql({
	apiNamespace: "treasuryPolygon",
	url: resolveSubgraphUrl("https://gateway-arbitrum.network.thegraph.com/api/[api-key]/deployments/id/QmdDUpqEzfKug1ER6HWM8c7U6wf3wtEtRBvXV7LkVoBi9f"), // 1.1.1
	schemaExtension: schemaExtension,
});

const treasuryBase = introspect.graphql({
	apiNamespace: "treasuryBase",
	url: resolveSubgraphUrl("https://gateway-arbitrum.network.thegraph.com/api/[api-key]/deployments/id/QmdqJ1zoExrs8u2T93wXSRWSx5VSKqKWTV4gCE2vszGwgt"), // 0.0.2
	schemaExtension: schemaExtension,
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [treasuryArbitrum, treasuryEthereum, treasuryFantom, treasuryPolygon, treasuryBase],
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
