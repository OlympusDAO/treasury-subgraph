import { Request, Response } from 'express';
import { resolvers } from '../../graphql/resolvers';
import { parseWgVariables, wundergraphResponse } from '../middleware';

/**
 * GET /operations/earliest/metrics
 * Query params (via wg_variables): { ignoreCache?: boolean }
 */
export async function earliestMetricsHandler(req: Request, res: Response): Promise<void> {
  const params = parseWgVariables(req) as { ignoreCache?: boolean };
  const result = await resolvers.Query.earliestMetrics(null, params);
  res.json(wundergraphResponse(result));
}

/**
 * GET /operations/earliest/tokenRecords
 * Query params (via wg_variables): { ignoreCache?: boolean }
 */
export async function earliestTokenRecordsHandler(req: Request, res: Response): Promise<void> {
  const params = parseWgVariables(req) as { ignoreCache?: boolean };
  const result = await resolvers.Query.earliestTokenRecords(null, params);
  res.json(wundergraphResponse(result));
}

/**
 * GET /operations/earliest/tokenSupplies
 * Query params (via wg_variables): { ignoreCache?: boolean }
 */
export async function earliestTokenSuppliesHandler(req: Request, res: Response): Promise<void> {
  const params = parseWgVariables(req) as { ignoreCache?: boolean };
  const result = await resolvers.Query.earliestTokenSupplies(null, params);
  res.json(wundergraphResponse(result));
}

/**
 * GET /operations/earliest/protocolMetrics
 * Query params (via wg_variables): { ignoreCache?: boolean }
 */
export async function earliestProtocolMetricsHandler(req: Request, res: Response): Promise<void> {
  const params = parseWgVariables(req) as { ignoreCache?: boolean };
  const result = await resolvers.Query.earliestProtocolMetrics(null, params);
  res.json(wundergraphResponse(result));
}
