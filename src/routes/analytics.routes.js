const express = require('express');
const { query } = require('express-validator');
const auth = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const AnalyticsService = require('../services/analytics.service');

const router = express.Router();

// Validation schemas
const timeRangeSchema = [
  query('timeRange')
    .optional()
    .isIn(['7days', '30days', '90days'])
    .withMessage('Invalid time range')
];

// Get overall analytics
router.get('/', auth, timeRangeSchema, validate, async (req, res, next) => {
  try {
    const analytics = await AnalyticsService.getUserAnalytics(
      req.user.id,
      req.query.timeRange
    );
    res.json(analytics);
  } catch (error) {
    next(error);
  }
});

// Get weekly comparison
router.get('/weekly-comparison', auth, async (req, res, next) => {
  try {
    const comparison = await AnalyticsService.getWeeklyComparison(req.user.id);
    res.json(comparison);
  } catch (error) {
    next(error);
  }
});

// Get habit statistics
router.get('/habits', auth, timeRangeSchema, validate, async (req, res, next) => {
  try {
    const habitStats = await AnalyticsService.getHabitAnalytics(
      req.user.id,
      req.query.timeRange
    );
    res.json(habitStats);
  } catch (error) {
    next(error);
  }
});

// Get task statistics
router.get('/tasks', auth, timeRangeSchema, validate, async (req, res, next) => {
  try {
    const taskStats = await AnalyticsService.getTaskAnalytics(
      req.user.id,
      req.query.timeRange
    );
    res.json(taskStats);
  } catch (error) {
    next(error);
  }
});

// Get productivity score
router.get('/productivity-score', auth, async (req, res, next) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const score = await AnalyticsService.getProductivityScore(req.user.id, date);
    res.json(score);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
