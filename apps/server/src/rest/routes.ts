import { Router } from 'express';
import { asyncHandler } from './middleware';
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
  router.get('/health', asyncHandler(healthHandler));

  // Latest endpoints (4)
  router.get('/latest/metrics', asyncHandler(latestMetricsHandler));
  router.get('/latest/tokenRecords', asyncHandler(latestTokenRecordsHandler));
  router.get('/latest/tokenSupplies', asyncHandler(latestTokenSuppliesHandler));
  router.get('/latest/protocolMetrics', asyncHandler(latestProtocolMetricsHandler));

  // Earliest endpoints (4)
  router.get('/earliest/metrics', asyncHandler(earliestMetricsHandler));
  router.get('/earliest/tokenRecords', asyncHandler(earliestTokenRecordsHandler));
  router.get('/earliest/tokenSupplies', asyncHandler(earliestTokenSuppliesHandler));
  router.get('/earliest/protocolMetrics', asyncHandler(earliestProtocolMetricsHandler));

  // Paginated endpoints (4)
  router.get('/paginated/metrics', asyncHandler(paginatedMetricsHandler));
  router.get('/paginated/tokenRecords', asyncHandler(paginatedTokenRecordsHandler));
  router.get('/paginated/tokenSupplies', asyncHandler(paginatedTokenSuppliesHandler));
  router.get('/paginated/protocolMetrics', asyncHandler(paginatedProtocolMetricsHandler));

  // AtBlock endpoints (4)
  router.get('/atBlock/metrics', asyncHandler(atBlockMetricsHandler));
  router.get('/atBlock/tokenRecords', asyncHandler(atBlockTokenRecordsHandler));
  router.get('/atBlock/tokenSupplies', asyncHandler(atBlockTokenSuppliesHandler));
  router.get('/atBlock/internal/protocolMetrics', asyncHandler(atBlockInternalProtocolMetricsHandler));
}
