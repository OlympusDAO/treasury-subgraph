import { Router } from 'express';
import {
  healthHandler,
  latestMetricsHandler,
  latestTokenRecordsHandler,
  latestTokenSuppliesHandler,
  latestProtocolMetricsHandler,
} from './handlers/latest';
import {
  earliestMetricsHandler,
  earliestTokenRecordsHandler,
  earliestTokenSuppliesHandler,
  earliestProtocolMetricsHandler,
} from './handlers/earliest';
import {
  paginatedMetricsHandler,
  paginatedTokenRecordsHandler,
  paginatedTokenSuppliesHandler,
  paginatedProtocolMetricsHandler,
} from './handlers/paginated';
import {
  atBlockMetricsHandler,
  atBlockTokenRecordsHandler,
  atBlockTokenSuppliesHandler,
  atBlockInternalProtocolMetricsHandler,
} from './handlers/atBlock';

/**
 * Register all REST routes
 * Routes exactly match Wundergraph's shape
 */
export function registerRoutes(router: Router): void {
  // Health check
  router.get('/health', healthHandler);

  // Latest endpoints (4)
  router.get('/latest/metrics', latestMetricsHandler);
  router.get('/latest/tokenRecords', latestTokenRecordsHandler);
  router.get('/latest/tokenSupplies', latestTokenSuppliesHandler);
  router.get('/latest/protocolMetrics', latestProtocolMetricsHandler);

  // Earliest endpoints (4)
  router.get('/earliest/metrics', earliestMetricsHandler);
  router.get('/earliest/tokenRecords', earliestTokenRecordsHandler);
  router.get('/earliest/tokenSupplies', earliestTokenSuppliesHandler);
  router.get('/earliest/protocolMetrics', earliestProtocolMetricsHandler);

  // Paginated endpoints (4)
  router.get('/paginated/metrics', paginatedMetricsHandler);
  router.get('/paginated/tokenRecords', paginatedTokenRecordsHandler);
  router.get('/paginated/tokenSupplies', paginatedTokenSuppliesHandler);
  router.get('/paginated/protocolMetrics', paginatedProtocolMetricsHandler);

  // AtBlock endpoints (4)
  router.get('/atBlock/metrics', atBlockMetricsHandler);
  router.get('/atBlock/tokenRecords', atBlockTokenRecordsHandler);
  router.get('/atBlock/tokenSupplies', atBlockTokenSuppliesHandler);
  router.get('/atBlock/internal/protocolMetrics', atBlockInternalProtocolMetricsHandler);
}
