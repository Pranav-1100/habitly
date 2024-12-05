const { google } = require('googleapis');

class GoogleCalendarService {
  constructor(credentials) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    if (credentials) {
      this.oauth2Client.setCredentials(credentials);
    }
    
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  // Get OAuth URL for user authorization
  getAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar'],
      prompt: 'consent'
    });
  }

  // Exchange auth code for tokens
  async getTokens(code) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  // List all calendar events
  async listEvents(timeMin = new Date(), maxResults = 100) {
    try {
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      });
      
      return response.data.items.map(event => ({
        id: event.id,
        title: event.summary,
        description: event.description,
        startTime: event.start.dateTime || event.start.date,
        endTime: event.end.dateTime || event.end.date,
        recurrence: event.recurrence,
        status: event.status
      }));
    } catch (error) {
      throw new Error(`Failed to fetch Google Calendar events: ${error.message}`);
    }
  }

  // Create new calendar event
  async createEvent(eventData) {
    try {
      const event = {
        summary: eventData.title,
        description: eventData.description,
        start: {
          dateTime: new Date(eventData.startTime).toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: new Date(eventData.endTime).toISOString(),
          timeZone: 'UTC'
        },
        reminders: {
          useDefault: true
        }
      };

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: event
      });

      return {
        id: response.data.id,
        title: response.data.summary,
        link: response.data.htmlLink,
        status: response.data.status
      };
    } catch (error) {
      throw new Error(`Failed to create Google Calendar event: ${error.message}`);
    }
  }

  // Update existing calendar event
  async updateEvent(eventId, eventData) {
    try {
      const event = {
        summary: eventData.title,
        description: eventData.description,
        start: {
          dateTime: new Date(eventData.startTime).toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: new Date(eventData.endTime).toISOString(),
          timeZone: 'UTC'
        }
      };

      const response = await this.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: event
      });

      return {
        id: response.data.id,
        title: response.data.summary,
        status: response.data.status
      };
    } catch (error) {
      throw new Error(`Failed to update Google Calendar event: ${error.message}`);
    }
  }

  // Delete calendar event
  async deleteEvent(eventId) {
    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      });
      return true;
    } catch (error) {
      throw new Error(`Failed to delete Google Calendar event: ${error.message}`);
    }
  }
}
