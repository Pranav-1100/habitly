const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');


dotenv.config();

class App {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupSecurity();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cors());

    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('dev'));
    }

    this.app.use(compression());
  }

  setupSecurity() {
    this.app.use(helmet());

    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per window
    });
    this.app.use('/api/', limiter);

    this.app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });
  }

  setupRoutes() {
    this.app.get('/health', (req, res) => {
      res.status(200).json({ status: 'OK', timestamp: new Date() });
    });

    const apiRouter = express.Router();
    this.app.use('/api', apiRouter);

    apiRouter.use('/auth', require('../routes/auth.routes'));
    apiRouter.use('/habits', require('../routes/habit.routes'));
    apiRouter.use('/tasks', require('../routes/task.routes'));
    apiRouter.use('/rewards', require('../routes/reward.routes'));
    apiRouter.use('/calendar', require('../routes/calendar.routes'));



    this.app.use('*', (req, res) => {
      res.status(404).json({
        status: 'error',
        message: 'Resource not found',
      });
    });
  }

  setupErrorHandling() {
    this.app.use((err, req, res, next) => {
      console.error(err.stack);

      if (err.name === 'ValidationError') {
        return res.status(400).json({
          status: 'error',
          message: 'Validation Error',
          errors: err.errors,
        });
      }

      if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
          status: 'error',
          message: 'Unauthorized Access',
        });
      }

      const statusCode = err.statusCode || 500;
      const message =
        process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message;

      res.status(statusCode).json({
        status: 'error',
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
      });
    });
  }

  getApp() {
    return this.app;
  }
}

const app = new App().getApp(); // Export the Express app instance
module.exports = app;
