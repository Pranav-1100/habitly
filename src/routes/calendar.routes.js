// src/routes/calendar.routes.js
const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const CalendarService = require('../services/calendar.service');

const router = express.Router();

// Get Google Calendar Auth URL
router.get('/connect/google', auth, async (req, res, next) => {
  try {
    const result = await CalendarService.connectGoogleCalendar(req.user.id);
    res.json({ authUrl: result.authUrl });
  } catch (error) {
    next(error);
  }
});

// Get Microsoft Calendar Auth URL
router.get('/connect/microsoft', auth, async (req, res, next) => {
  try {
    const result = await CalendarService.connectMicrosoftCalendar(req.user.id);
    res.json({ authUrl: result.authUrl });
  } catch (error) {
    next(error);
  }
});

// Handle Google Calendar OAuth Callback
router.get('/callback/google', auth, async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ message: 'Authorization code is required' });
    }
    
    const result = await CalendarService.handleGoogleCallback(req.user.id, code);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Handle Microsoft Calendar OAuth Callback
router.get('/callback/microsoft', auth, async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ message: 'Authorization code is required' });
    }

    const result = await CalendarService.handleMicrosoftCallback(req.user.id, code);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Sync calendar events
router.post('/sync', auth, async (req, res, next) => {
  try {
    const result = await CalendarService.syncCalendarEvents(req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get upcoming events
router.get('/events', auth, async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const events = await CalendarService.getUpcomingEvents(req.user.id, days);
    res.json(events);
  } catch (error) {
    next(error);
  }
});

// Export to calendar
router.post('/export', auth, async (req, res, next) => {
  try {
    const result = await CalendarService.exportToCalendar(req.user.id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get connected calendars
router.get('/connected', auth, async (req, res, next) => {
  try {
    const calendars = await CalendarService.getConnectedCalendars(req.user.id);
    res.json(calendars);
  } catch (error) {
    next(error);
  }
});

// Disconnect calendar
router.delete('/disconnect/:provider', auth, async (req, res, next) => {
  try {
    const { provider } = req.params;
    if (!['google', 'microsoft'].includes(provider)) {
      return res.status(400).json({ message: 'Invalid provider' });
    }
    
    await CalendarService.disconnectCalendar(req.user.id, provider);
    res.json({ message: 'Calendar disconnected successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;