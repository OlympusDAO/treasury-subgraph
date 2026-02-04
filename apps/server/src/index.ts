import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import cors from 'cors';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { restRouter } from './rest';

const PORT = process.env.PORT || 9991;

async function startServer() {
  const app = express();

  // Enable CORS for all origins with credentials support
  // credentials: true allows cookies and auth headers to be sent/received
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());

  // Use simple query parser to preserve raw JSON in wg_variables
  // The default 'qs' parser tries to parse {} as nested objects, breaking JSON params
  app.set('query parser', 'simple');

  // Mount REST API router (before GraphQL)
  app.use('/operations', restRouter);

  // Health check endpoint (before GraphQL)
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '2.0.0',
    });
  });

  // Create Apollo Server
  const server = new ApolloServer({
    typeDefs: typeDefs as any, // Cast to bypass graphql version conflict
    resolvers,
    introspection: process.env.NODE_ENV !== 'production',
    context: ({ req }) => {
      return {
        req,
        // You can add request-specific context here
      };
    },
    formatError: (error) => {
      // Log errors but don't expose internal details
      console.error('GraphQL Error:', error);
      return {
        message: error.message,
        code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
        path: error.path,
      };
    },
  });

  await server.start();

  // Apply GraphQL middleware
  server.applyMiddleware({ app, path: '/graphql' });

  // Start listening
  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    console.log(`📊 Health check at http://localhost:${PORT}/health`);
    console.log(`🔌 REST API at http://localhost:${PORT}/operations`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down gracefully...');
    await server.stop();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

// Start the server
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
