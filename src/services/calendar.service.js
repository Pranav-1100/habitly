const GoogleCalendarService = require('./calendar/google.calendar.service');
const MicrosoftCalendarService = require('./calendar/microsoft.calendar.service');
const CalendarModel = require('../models/Calendar');

class CalendarService {
    static async connectGoogleCalendar(userId) {
        const googleService = new GoogleCalendarService();
        const authUrl = googleService.getAuthUrl();
        return { authUrl };
    }

    static async handleGoogleCallback(userId, authCode) {
        const googleService = new GoogleCalendarService();
        const tokens = await googleService.getTokens(authCode);
        
        await CalendarModel.saveCalendarSync({
            user_id: userId,
            provider: 'google',
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: new Date(Date.now() + tokens.expires_in * 1000)
        });

        return { success: true };
    }

    static async connectMicrosoftCalendar(userId) {
        const microsoftAuthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${process.env.MICROSOFT_CLIENT_ID}&response_type=code&redirect_uri=${process.env.MICROSOFT_REDIRECT_URI}&scope=Calendars.ReadWrite`;
        return { authUrl: microsoftAuthUrl };
    }

    static async handleMicrosoftCallback(userId, authCode) {
        const microsoftService = new MicrosoftCalendarService();
        const tokens = await microsoftService.getTokens(authCode);
        
        await CalendarModel.saveCalendarSync({
            user_id: userId,
            provider: 'microsoft',
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: new Date(Date.now() + tokens.expires_in * 1000)
        });

        return { success: true };
    }
  // Initialize calendar service based on provider
  static getCalendarService(provider, credentials) {
    switch (provider) {
      case 'google':
        return new GoogleCalendarService(credentials);
      case 'microsoft':
        return new MicrosoftCalendarService(credentials.access_token);
      default:
        throw new Error('Unsupported calendar provider');
    }
  }

  // Sync habits and tasks with calendar
  static async syncToCalendar(userId, items, type = 'habit') {
    try {
      const calendarSync = await CalendarModel.getCalendarSync(userId);
      if (!calendarSync) {
        throw new Error('No calendar connected');
      }

      const calendarService = this.getCalendarService(
        calendarSync.provider, 
        {
          access_token: calendarSync.access_token,
          refresh_token: calendarSync.refresh_token
        }
      );

      for (const item of items) {
        // Convert habit/task to calendar event format
        const eventData = this.convertToCalendarEvent(item, type);
        
        // Create or update calendar event
        if (item.calendar_event_id) {
          await calendarService.updateEvent(item.calendar_event_id, eventData);
        } else {
          const event = await calendarService.createEvent(eventData);
          // Save the calendar event ID reference
          await this.saveCalendarEventRef(item.id, event.id, type);
        }
      }

      return { success: true, message: 'Calendar sync completed' };
    } catch (error) {
      throw new Error(`Calendar sync failed: ${error.message}`);
    }
  }

  // Convert habit/task to calendar event format
  static convertToCalendarEvent(item, type) {
    if (type === 'habit') {
      return {
        title: `[Habit] ${item.title}`,
        description: item.description || '',
        startTime: this.getHabitTime(item),
        endTime: this.getHabitEndTime(item),
        recurrence: this.getHabitRecurrence(item.frequency)
      };
    } else {
      return {
        title: `[Task] ${item.title}`,
        description: item.description || '',
        startTime: item.due_date,
        endTime: this.getTaskEndTime(item.due_date),
        priority: item.priority
      };
    }
  }

  // Calculate habit time based on frequency
  static getHabitTime(habit) {
    const now = new Date();
    switch (habit.frequency) {
      case 'daily':
        // Set for tomorrow if today's time has passed
        const preferredTime = habit.preferred_time || '09:00';
        const [hours, minutes] = preferredTime.split(':');
        now.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        if (now < new Date()) {
          now.setDate(now.getDate() + 1);
        }
        return now;
      case 'weekly':
        // Set for next occurrence of preferred day
        const preferredDay = habit.preferred_day || 1; // Monday as default
        now.setDate(now.getDate() + (preferredDay + 7 - now.getDay()) % 7);
        return now;
      default:
        return now;
    }
  }

  // Get habit end time (default duration: 30 minutes)
  static getHabitEndTime(startTime) {
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 30);
    return endTime;
  }

  // Get task end time (default duration: 1 hour)
  static getTaskEndTime(dueDate) {
    const endTime = new Date(dueDate);
    endTime.setHours(endTime.getHours() + 1);
    return endTime;
  }

  // Generate recurrence rule based on habit frequency
  static getHabitRecurrence(frequency) {
    switch (frequency) {
      case 'daily':
        return 'FREQ=DAILY';
      case 'weekly':
        return 'FREQ=WEEKLY';
      case 'monthly':
        return 'FREQ=MONTHLY';
      default:
        return null;
    }
  }

  // Save calendar event reference
  static async saveCalendarEventRef(itemId, eventId, type) {
    const tableName = type === 'habit' ? 'habits' : 'tasks';
    await CalendarModel.updateCalendarEventId(tableName, itemId, eventId);
  }

  // Import calendar events as tasks
  static async importCalendarEvents(userId, startDate, endDate) {
    try {
      const calendarSync = await CalendarModel.getCalendarSync(userId);
      if (!calendarSync) {
        throw new Error('No calendar connected');
      }

      const calendarService = this.getCalendarService(
        calendarSync.provider,
        {
          access_token: calendarSync.access_token,
          refresh_token: calendarSync.refresh_token
        }
      );

      const events = await calendarService.listEvents(startDate, endDate);
      
      // Convert events to tasks
      const tasks = events.map(event => ({
        title: event.title,
        description: event.description,
        due_date: event.startTime,
        priority: 'medium',
        calendar_event_id: event.id
      }));

      // Save tasks
      for (const task of tasks) {
        await CalendarModel.createTaskFromEvent(userId, task);
      }

      return { success: true, imported: tasks.length };
    } catch (error) {
      throw new Error(`Failed to import calendar events: ${error.message}`);
    }
  }
}

module.exports = CalendarService;
