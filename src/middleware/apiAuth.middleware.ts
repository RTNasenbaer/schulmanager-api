import { Request, Response, NextFunction } from 'express';
import { config } from '../config/config';

/**
 * API Key Authentication Middleware
 * Validates X-API-Key header for all API routes
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string;

  // Skip authentication for health check endpoint
  if (req.path === '/health' || req.path.startsWith('/health')) {
    return next();
  }

  // Validate API key
  if (!apiKey) {
    res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_API_KEY',
        message: 'API key is required. Please provide X-API-Key header.',
        statusCode: 401,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (apiKey !== config.api.key) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'Invalid API key provided.',
        statusCode: 401,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // API key is valid, proceed
  next();
}
