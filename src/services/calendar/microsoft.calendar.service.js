const { Client } = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch');

class MicrosoftCalendarService {
  constructor(accessToken) {
    this.client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });
  }

  // List all calendar events
  async listEvents(startTime = new Date(), maxResults = 100) {
    try {
      const response = await this.client
        .api('/me/calendar/events')
        .select('id,subject,body,start,end,recurrence')
        .top(maxResults)
        .filter(`start/dateTime ge '${startTime.toISOString()}'`)
        .orderby('start/dateTime')
        .get();

      return response.value.map(event => ({
        id: event.id,
        title: event.subject,
        description: event.body.content,
        startTime: event.start.dateTime,
        endTime: event.end.dateTime,
        recurrence: event.recurrence,
        status: event.status
      }));
    } catch (error) {
      throw new Error(`Failed to fetch Microsoft Calendar events: ${error.message}`);
    }
  }

  // Create new calendar event
  async createEvent(eventData) {
    try {
      const event = {
        subject: eventData.title,
        body: {
          contentType: 'text',
          content: eventData.description
        },
        start: {
          dateTime: new Date(eventData.startTime).toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: new Date(eventData.endTime).toISOString(),
          timeZone: 'UTC'
        }
      };

      const response = await this.client
        .api('/me/calendar/events')
        .post(event);

      return {
        id: response.id,
        title: response.subject,
        status: response.status
      };
    } catch (error) {
      throw new Error(`Failed to create Microsoft Calendar event: ${error.message}`);
    }
  }

  // Update existing calendar event
  async updateEvent(eventId, eventData) {
    try {
      const event = {
        subject: eventData.title,
        body: {
          contentType: 'text',
          content: eventData.description
        },
        start: {
          dateTime: new Date(eventData.startTime).toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: new Date(eventData.endTime).toISOString(),
          timeZone: 'UTC'
        }
      };

      const response = await this.client
        .api(`/me/calendar/events/${eventId}`)
        .update(event);

      return {
        id: response.id,
        title: response.subject,
        status: response.status
      };
    } catch (error) {
      throw new Error(`Failed to update Microsoft Calendar event: ${error.message}`);
    }
  }

  // Delete calendar event
  async deleteEvent(eventId) {
    try {
      await this.client
        .api(`/me/calendar/events/${eventId}`)
        .delete();
      return true;
    } catch (error) {
      throw new Error(`Failed to delete Microsoft Calendar event: ${error.message}`);
    }
  }
}

