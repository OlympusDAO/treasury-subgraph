import { Request, Response, NextFunction } from 'express';
import { WundergraphResponse } from './types';

/**
 * Wrap response data in Wundergraph-compatible format
 * Wundergraph returns { data: {...}, errors?: [...] }
 */
export function wundergraphResponse<T>(data: T, errors?: Array<{ message: string }>): WundergraphResponse<T> {
  const response: WundergraphResponse<T> = { data };
  if (errors && errors.length > 0) {
    response.errors = errors;
  }
  return response;
}

/**
 * Express middleware to handle errors and wrap responses
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Error handler middleware
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('REST API Error:', err);

  const response = wundergraphResponse(null as never, [
    { message: err.message || 'Internal server error' }
  ]);
  res.status(500).json(response);
}

/**
 * Parse wg_variables query parameter
 * Wundergraph uses: ?wg_variables={"param1":"value1","param2":value2}
 */
export function parseWgVariables(req: Request): Record<string, unknown> | null {
  const wgVariables = req.query.wg_variables as string;

  if (!wgVariables) {
    return {};
  }

  try {
    // Handle URL-encoded JSON
    const decoded = decodeURIComponent(wgVariables);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch (e) {
    throw new Error(`Invalid wg_variables parameter: ${e}`);
  }
}
