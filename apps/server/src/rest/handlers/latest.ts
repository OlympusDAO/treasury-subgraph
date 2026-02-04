import { Request, Response } from 'express';
import { resolvers } from '../../graphql/resolvers';
import { parseWgVariables, wundergraphResponse } from '../middleware';

/**
 * Health check handler
 */
export async function healthHandler(_req: Request, res: Response): Promise<void> {
  const result = await resolvers.Query.health();
  res.json(wundergraphResponse(result));
}

/**
 * GET /operations/latest/metrics
 * Query params (via wg_variables): { ignoreCache?: boolean }
 */
export async function latestMetricsHandler(req: Request, res: Response): Promise<void> {
  const params = parseWgVariables(req) as { ignoreCache?: boolean };
  const result = await resolvers.Query.latestMetrics(null, params);
  res.json(wundergraphResponse(result));
}

/**
 * GET /operations/latest/tokenRecords
 * Query params (via wg_variables): { ignoreCache?: boolean }
 */
export async function latestTokenRecordsHandler(req: Request, res: Response): Promise<void> {
  const params = parseWgVariables(req) as { ignoreCache?: boolean };
  const result = await resolvers.Query.latestTokenRecords(null, params);
  res.json(wundergraphResponse(result));
}

/**
 * GET /operations/latest/tokenSupplies
 * Query params (via wg_variables): { ignoreCache?: boolean }
 */
export async function latestTokenSuppliesHandler(req: Request, res: Response): Promise<void> {
  const params = parseWgVariables(req) as { ignoreCache?: boolean };
  const result = await resolvers.Query.latestTokenSupplies(null, params);
  res.json(wundergraphResponse(result));
}

/**
 * GET /operations/latest/protocolMetrics
 * Query params (via wg_variables): { ignoreCache?: boolean }
 */
export async function latestProtocolMetricsHandler(req: Request, res: Response): Promise<void> {
  const params = parseWgVariables(req) as { ignoreCache?: boolean };
  const result = await resolvers.Query.latestProtocolMetrics(null, params);
  res.json(wundergraphResponse(result));
}
