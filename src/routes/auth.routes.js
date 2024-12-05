const express = require('express');
const { body } = require('express-validator');
const AuthService = require('../services/auth.service');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth.middleware');
const UserModel = require('../models/User'); // Import the UserModel

const router = express.Router();

// Validation schemas
const registerSchema = [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const loginSchema = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').exists().withMessage('Password is required')
];

router.post('/register', registerSchema, validate, async (req, res, next) => {
  try {
    const result = await AuthService.register(req.body);
    res.status(201).json({
      message: 'User registered successfully',
      ...result
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', loginSchema, validate, async (req, res, next) => {
  try {
    const result = await AuthService.login(req.body);
    res.json({
      message: 'Login successful',
      ...result
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', auth, async (req, res, next) => {
  try {
    // Use UserModel to fetch the user by ID
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
