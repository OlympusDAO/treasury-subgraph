import { configureWunderGraphApplication, cors, EnvironmentVariable, introspect, templates } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const protocolMetricsEthereum = introspect.graphql({
	apiNamespace: "protocolMetricsEthereum",
	url: `https://gateway.thegraph.com/api/${process.env.SUBGRAPH_API_KEY}/subgraphs/id/DTcDcUSBRJjz9NeoK5VbXCVzYbRTyuBwdPUqMi8x32pY`,
});

const protocolMetricsArbitrum = introspect.graphql({
	apiNamespace: "protocolMetricsArbitrum",
	url: "https://api.studio.thegraph.com/proxy/28103/protocol-metrics-arbitrum/1.1.6",
});

const protocolMetricsFantom = introspect.graphql({
	apiNamespace: "protocolMetricsArbitrum",
	url: "https://api.thegraph.com/subgraphs/name/olympusdao/protocol-metrics-fantom",
});

const protocolMetricsPolygon = introspect.graphql({
	apiNamespace: "protocolMetricsArbitrum",
	url: "https://api.thegraph.com/subgraphs/name/olympusdao/protocol-metrics-polygon",
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [protocolMetricsArbitrum, protocolMetricsEthereum, protocolMetricsFantom, protocolMetricsPolygon],
	server,
	operations,
	codeGenerators: [
		{
			templates: [
				// use all the typescript react templates to generate a client
				...templates.typescript.all,
			],
		},
	],
	cors: {
		...cors.allowAll,
		allowedOrigins:
			process.env.NODE_ENV === 'production'
				? [
					// change this before deploying to production to the actual domain where you're deploying your app
					'http://localhost:3000',
				]
				: ['http://localhost:3000', new EnvironmentVariable('WG_ALLOWED_ORIGIN')],
	},
	security: {
		enableGraphQLEndpoint: process.env.NODE_ENV !== 'production' || process.env.GITPOD_WORKSPACE_ID !== undefined,
	},
});
