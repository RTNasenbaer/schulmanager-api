import { Router } from 'express';
import {
  getTodayTimetable,
  getTomorrowTimetable,
  getTimetableByDate,
  getWeekTimetable,
} from '../controllers/timetable.controller';

const router = Router();

/**
 * @route   GET /api/timetable/today
 * @desc    Get today's timetable
 * @access  Public (should be protected with API key in production)
 */
router.get('/today', getTodayTimetable);

/**
 * @route   GET /api/timetable/tomorrow
 * @desc    Get tomorrow's timetable
 * @access  Public (should be protected with API key in production)
 */
router.get('/tomorrow', getTomorrowTimetable);

/**
 * @route   GET /api/timetable/week
 * @desc    Get current week's timetable
 * @access  Public (should be protected with API key in production)
 */
router.get('/week', getWeekTimetable);

/**
 * @route   GET /api/timetable/date/:date
 * @desc    Get timetable for specific date (YYYY-MM-DD)
 * @access  Public (should be protected with API key in production)
 */
router.get('/date/:date', getTimetableByDate);

export default router;
