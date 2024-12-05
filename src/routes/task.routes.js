const express = require('express');
const { body, query } = require('express-validator');
const auth = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const TaskService = require('../services/task.service');

const router = express.Router();

// Validation schemas
const taskSchema = [
    body('title')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Title must be between 3 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters'),
    body('priority')
      .trim()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Invalid priority value'),
    body('due_date')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format')
  ];
  
  const filterSchema = [
    query('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Invalid priority filter'),
    query('completed')
      .optional()
      .isBoolean()
      .withMessage('Completed filter must be boolean'),
    query('due_date')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format for due date filter')
  ];
  
  // Routes
  router.post('/', auth, taskSchema, validate, async (req, res, next) => {
    try {
      const task = await TaskService.createTask(req.user.id, req.body);
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  });
  
  router.get('/', auth, filterSchema, validate, async (req, res, next) => {
    try {
      const filters = {
        priority: req.query.priority,
        completed: req.query.completed === 'true',
        due_date: req.query.due_date
      };
      const tasks = await TaskService.getTasks(req.user.id, filters);
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  });
  
  router.get('/:id', auth, async (req, res, next) => {
    try {
      const task = await TaskService.getTaskById(req.params.id, req.user.id);
      res.json(task);
    } catch (error) {
      next(error);
    }
  });
  
  router.put('/:id', auth, taskSchema, validate, async (req, res, next) => {
    try {
      const task = await TaskService.updateTask(req.params.id, req.user.id, req.body);
      res.json(task);
    } catch (error) {
      next(error);
    }
  });
  
  router.patch('/:id/complete', auth, async (req, res, next) => {
    try {
      const { completed = true } = req.body;
      const task = await TaskService.toggleTaskComplete(req.params.id, req.user.id, completed);
      res.json(task);
    } catch (error) {
      next(error);
    }
  });
  
  router.delete('/:id', auth, async (req, res, next) => {
    try {
      await TaskService.deleteTask(req.params.id, req.user.id);
      res.json({ message: 'Task deleted successfully' });
    } catch (error) {
      next(error);
    }
  });
  
  module.exports = router;
  


  