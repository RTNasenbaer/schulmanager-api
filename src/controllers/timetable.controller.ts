import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../../shared/types/api-response.types';
import { schulmanagerService } from '../services/schulmanager.service';
import { cacheService } from '../services/cache.service';
import { config } from '../config/config';

/**
 * Timetable Controller
 * Handles all timetable-related requests
 */

/**
 * GET /api/timetable/today
 * Stundenplan für heute abrufen
 */
export async function getTodayTimetable(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = cacheService.getTimetableKey('default', today);

    // Try to get from cache first
    const lessons = await cacheService.getOrSet(
      cacheKey,
      async () => {
        // Login if not already logged in
        if (!schulmanagerService['isLoggedIn']) {
          const loginSuccess = await schulmanagerService.login(
            config.schulmanager.email,
            config.schulmanager.password
          );
          if (!loginSuccess) {
            throw new Error('Failed to login to Schulmanager');
          }
        }

        // Fetch timetable
        return await schulmanagerService.getTimetable(today);
      },
      config.cache.ttl.timetable
    );

    const response: ApiResponse = {
      success: true,
      data: {
        date: today,
        lessons: lessons,
        count: lessons.length,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/timetable/tomorrow
 * Stundenplan für morgen abrufen
 */
export async function getTomorrowTimetable(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];
    
    const cacheKey = cacheService.getTimetableKey('default', tomorrowDate);

    const lessons = await cacheService.getOrSet(
      cacheKey,
      async () => {
        if (!schulmanagerService['isLoggedIn']) {
          const loginSuccess = await schulmanagerService.login(
            config.schulmanager.email,
            config.schulmanager.password
          );
          if (!loginSuccess) {
            throw new Error('Failed to login to Schulmanager');
          }
        }
        return await schulmanagerService.getTimetable(tomorrowDate);
      },
      config.cache.ttl.timetable
    );

    const response: ApiResponse = {
      success: true,
      data: {
        date: tomorrowDate,
        lessons: lessons,
        count: lessons.length,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/timetable/date/:date
 * Stundenplan für bestimmtes Datum abrufen
 */
export async function getTimetableByDate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { date } = req.params;

    // Basic date validation
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

    const cacheKey = cacheService.getTimetableKey('default', date);

    const lessons = await cacheService.getOrSet(
      cacheKey,
      async () => {
        if (!schulmanagerService['isLoggedIn']) {
          const loginSuccess = await schulmanagerService.login(
            config.schulmanager.email,
            config.schulmanager.password
          );
          if (!loginSuccess) {
            throw new Error('Failed to login to Schulmanager');
          }
        }
        return await schulmanagerService.getTimetable(date);
      },
      config.cache.ttl.timetable
    );

    const response: ApiResponse = {
      success: true,
      data: {
        date,
        lessons: lessons,
        count: lessons.length,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/timetable/week
 * Stundenplan für die aktuelle Woche abrufen
 */
export async function getWeekTimetable(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cacheKey = 'timetable:week:current';

    const weekSchedule = await cacheService.getOrSet(
      cacheKey,
      async () => {
        if (!schulmanagerService['isLoggedIn']) {
          const loginSuccess = await schulmanagerService.login(
            config.schulmanager.email,
            config.schulmanager.password
          );
          if (!loginSuccess) {
            throw new Error('Failed to login to Schulmanager');
          }
        }
        return await schulmanagerService.getWeekSchedule();
      },
      config.cache.ttl.timetable
    );

    // Get current week number
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(
      ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
    );

    const response: ApiResponse = {
      success: true,
      data: {
        weekNumber,
        year: now.getFullYear(),
        schedule: weekSchedule,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
}
