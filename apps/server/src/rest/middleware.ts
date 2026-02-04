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
 *
 * Note: Express's default query parser may have already parsed the JSON,
 * so we need to handle both string and object cases.
 */
export function parseWgVariables(req: Request): Record<string, unknown> {
  const wgVariables = req.query.wg_variables;

  // No wg_variables provided
  if (!wgVariables) {
    return {};
  }

  // Express may have already parsed it as an object
  if (typeof wgVariables === 'object') {
    return wgVariables as Record<string, unknown>;
  }

  // It's a string - try to parse it
  if (typeof wgVariables === 'string') {
    try {
      // Try direct parse first (Express might have already decoded)
      let parsed = JSON.parse(wgVariables);

      // If parse succeeded but result is a string, try decoding and parsing again
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }

      return parsed as Record<string, unknown>;
    } catch {
      // If direct parse fails, try URL-decoding first
      try {
        const decoded = decodeURIComponent(wgVariables);
        let parsed = JSON.parse(decoded);

        // Handle double-encoded case
        if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed);
        }

        return parsed as Record<string, unknown>;
      } catch (e) {
        throw new Error(`Invalid wg_variables parameter: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  return {};
}
