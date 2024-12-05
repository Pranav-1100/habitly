const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const HabitService = require('../services/habit.service');

const router = express.Router();

// Validation schemas
const habitSchema = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('frequency')
    .trim()
    .isIn(['daily', 'weekly', 'custom'])
    .withMessage('Invalid frequency value')
];

// Routes
router.post('/', auth, habitSchema, validate, async (req, res, next) => {
  try {
    const habit = await HabitService.createHabit(req.user.id, req.body);
    res.status(201).json(habit);
  } catch (error) {
    next(error);
  }
});

router.get('/', auth, async (req, res, next) => {
  try {
    const habits = await HabitService.getHabits(req.user.id);
    res.json(habits);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', auth, async (req, res, next) => {
  try {
    const habit = await HabitService.getHabitById(req.params.id, req.user.id);
    res.json(habit);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', auth, habitSchema, validate, async (req, res, next) => {
  try {
    const habit = await HabitService.updateHabit(req.params.id, req.user.id, req.body);
    res.json(habit);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    await HabitService.deleteHabit(req.params.id, req.user.id);
    res.json({ message: 'Habit deleted successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/complete', auth, async (req, res, next) => {
  try {
    const result = await HabitService.updateStreak(req.params.id, req.user.id, true);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/reset', auth, async (req, res, next) => {
  try {
    const result = await HabitService.updateStreak(req.params.id, req.user.id, false);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
