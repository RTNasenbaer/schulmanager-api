import { Router } from 'express';
import {
  getCancelledToday,
  getCancelledTomorrow,
  getCancelledByDate,
  getWeekCancelled,
} from '../controllers/cancelled.controller';

const router = Router();

/**
 * GET /api/cancelled/today
 * Ausgefallene Stunden für heute
 */
router.get('/today', getCancelledToday);

/**
 * GET /api/cancelled/tomorrow
 * Ausgefallene Stunden für morgen
 */
router.get('/tomorrow', getCancelledTomorrow);

/**
 * GET /api/cancelled/week
 * Ausgefallene Stunden für die aktuelle Woche
 */
router.get('/week', getWeekCancelled);

/**
 * GET /api/cancelled/date/:date
 * Ausgefallene Stunden für ein bestimmtes Datum
 * Format: YYYY-MM-DD
 */
router.get('/date/:date', getCancelledByDate);

export default router;
