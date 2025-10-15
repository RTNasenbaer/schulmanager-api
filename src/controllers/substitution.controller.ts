import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../../shared/types/api-response.types';
import { schulmanagerService } from '../services/schulmanager.service';
import { cacheService } from '../services/cache.service';
import { config } from '../config/config';

/**
 * Substitution Controller
 * Handles all substitution-related requests
 */

/**
 * GET /api/substitutions/today
 * Vertretungsplan für heute abrufen
 */
export async function getTodaySubstitutions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = cacheService.getSubstitutionsKey('default', today);

    const substitutions = await cacheService.getOrSet(
      cacheKey,
      async () => {
        if (!schulmanagerService.isAuthenticated()) {
          const loginSuccess = await schulmanagerService.login(
            config.schulmanager.email,
            config.schulmanager.password
          );
          if (!loginSuccess) {
            throw new Error('Failed to login to Schulmanager');
          }
        }
        return await schulmanagerService.getSubstitutions(today);
      },
      config.cache.ttl.substitutions
    );

    const response: ApiResponse = {
      success: true,
      data: {
        date: today,
        substitutions: substitutions,
        count: substitutions.length,
        hasSubstitutions: substitutions.length > 0,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/substitutions/tomorrow
 * Vertretungsplan für morgen abrufen
 */
export async function getTomorrowSubstitutions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];
    
    const cacheKey = cacheService.getSubstitutionsKey('default', tomorrowDate);

    const substitutions = await cacheService.getOrSet(
      cacheKey,
      async () => {
        if (!schulmanagerService.isAuthenticated()) {
          const loginSuccess = await schulmanagerService.login(
            config.schulmanager.email,
            config.schulmanager.password
          );
          if (!loginSuccess) {
            throw new Error('Failed to login to Schulmanager');
          }
        }
        return await schulmanagerService.getSubstitutions(tomorrowDate);
      },
      config.cache.ttl.substitutions
    );

    const response: ApiResponse = {
      success: true,
      data: {
        date: tomorrowDate,
        substitutions: substitutions,
        count: substitutions.length,
        hasSubstitutions: substitutions.length > 0,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/substitutions/date/:date
 * Vertretungsplan für bestimmtes Datum abrufen
 */
export async function getSubstitutionsByDate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { date } = req.params;

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE',
          message: 'Date must be in format YYYY-MM-DD',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const cacheKey = cacheService.getSubstitutionsKey('default', date);

    const substitutions = await cacheService.getOrSet(
      cacheKey,
      async () => {
        if (!schulmanagerService.isAuthenticated()) {
          const loginSuccess = await schulmanagerService.login(
            config.schulmanager.email,
            config.schulmanager.password
          );
          if (!loginSuccess) {
            throw new Error('Failed to login to Schulmanager');
          }
        }
        return await schulmanagerService.getSubstitutions(date);
      },
      config.cache.ttl.substitutions
    );

    const response: ApiResponse = {
      success: true,
      data: {
        date,
        substitutions: substitutions,
        count: substitutions.length,
        hasSubstitutions: substitutions.length > 0,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
}
