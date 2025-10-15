import { Request, Response, NextFunction } from 'express';
import { schulmanagerService } from '../services/schulmanager.service';

// Local type definition
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; statusCode: number };
  timestamp: string;
}
import { cacheService } from '../services/cache.service';
import { config } from '../config/config';

/**
 * Cancelled Classes Controller
 * Handles all cancelled classes requests
 */

/**
 * GET /api/cancelled/today
 * Ausfallende Stunden für heute abrufen
 */
export async function getCancelledToday(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `cancelled:default:${today}`;

    const cancelledClasses = await cacheService.getOrSet(
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
        return await schulmanagerService.getCancelledClasses(today);
      },
      config.cache.ttl.substitutions
    );

    const response: ApiResponse = {
      success: true,
      data: {
        date: today,
        cancelledClasses: cancelledClasses,
        count: cancelledClasses.length,
        hasCancellations: cancelledClasses.length > 0,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/cancelled/tomorrow
 * Ausfallende Stunden für morgen abrufen
 */
export async function getCancelledTomorrow(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];
    
    const cacheKey = `cancelled:default:${tomorrowDate}`;

    const cancelledClasses = await cacheService.getOrSet(
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
        return await schulmanagerService.getCancelledClasses(tomorrowDate);
      },
      config.cache.ttl.substitutions
    );

    const response: ApiResponse = {
      success: true,
      data: {
        date: tomorrowDate,
        cancelledClasses: cancelledClasses,
        count: cancelledClasses.length,
        hasCancellations: cancelledClasses.length > 0,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/cancelled/date/:date
 * Ausgefallene Stunden für ein bestimmtes Datum abrufen
 */
export async function getCancelledByDate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { date } = req.params;

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE_FORMAT',
          message: 'Date must be in YYYY-MM-DD format',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const cacheKey = `cancelled:default:${date}`;

    const cancelledClasses = await cacheService.getOrSet(
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
        return await schulmanagerService.getCancelledClasses(date);
      },
      config.cache.ttl.substitutions
    );

    const response: ApiResponse = {
      success: true,
      data: {
        date: date,
        cancelledClasses: cancelledClasses,
        count: cancelledClasses.length,
        hasCancellations: cancelledClasses.length > 0,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/cancelled/week
 * Ausgefallene Stunden für die aktuelle Woche abrufen
 */
export async function getWeekCancelled(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const today = new Date();
    const monday = new Date(today);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    const mondayDate = monday.toISOString().split('T')[0];
    
    const cacheKey = `cancelled:week:${mondayDate}`;

    const weekCancelled = await cacheService.getOrSet(
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
        
        // Get the full week schedule
        const weekSchedule = await schulmanagerService.getWeekSchedule(today);
        
        // Extract only cancelled classes from each day
        const cancelledByDay: Record<string, any[]> = {};
        let totalCancelled = 0;
        
        for (const [day, lessons] of Object.entries(weekSchedule)) {
          const cancelled = lessons.filter((lesson: any) => lesson.isCancelled);
          cancelledByDay[day] = cancelled;
          totalCancelled += cancelled.length;
        }
        
        return {
          days: cancelledByDay,
          totalCancelled: totalCancelled,
        };
      },
      config.cache.ttl.timetable
    );

    const response: ApiResponse = {
      success: true,
      data: {
        weekStart: mondayDate,
        ...weekCancelled,
        hasCancellations: weekCancelled.totalCancelled > 0,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
}
