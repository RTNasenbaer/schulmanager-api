import { Router } from 'express';
import {
  getSubstitutionsToday,
  getTomorrowSubstitutions,
  getSubstitutionsByDate,
} from '../controllers/substitution.controller';

const router = Router();

/**
 * @route   GET /api/substitutions/today
 * @desc    Get today's substitutions
 * @access  Public (should be protected with API key in production)
 */
router.get('/today', getSubstitutionsToday);

/**
 * @route   GET /api/substitutions/tomorrow
 * @desc    Get tomorrow's substitutions
 * @access  Public (should be protected with API key in production)
 */
router.get('/tomorrow', getTomorrowSubstitutions);

/**
 * @route   GET /api/substitutions/date/:date
 * @desc    Get substitutions for specific date (YYYY-MM-DD)
 * @access  Public (should be protected with API key in production)
 */
router.get('/date/:date', getSubstitutionsByDate);

export default router;
