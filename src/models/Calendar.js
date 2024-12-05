const db = require('../config/database');

class CalendarModel {
  static async saveCalendarSync(userData) {
    const { user_id, provider, access_token, refresh_token, expires_at } = userData;
    
    return new Promise((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO calendar_sync 
        (user_id, provider, access_token, refresh_token, expires_at) 
        VALUES (?, ?, ?, ?, ?)`,
        [user_id, provider, access_token, refresh_token, expires_at],
        function(err) {
          if (err) reject(err);
          resolve({ id: this.lastID });
        }
      );
    });
  }

  static async getCalendarSync(user_id) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM calendar_sync WHERE user_id = ?',
        [user_id],
        (err, sync) => {
          if (err) reject(err);
          resolve(sync);
        }
      );
    });
  }

  static async saveCalendarEvent(eventData) {
    const { user_id, external_id, title, start_time, end_time, description } = eventData;
    
    return new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO calendar_events 
        (user_id, external_id, title, start_time, end_time, description) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [user_id, external_id, title, start_time, end_time, description],
        function(err) {
          if (err) reject(err);
          resolve({ id: this.lastID, ...eventData });
        }
      );
    });
  }

  static async getCalendarEvents(user_id, startDate, endDate) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM calendar_events 
        WHERE user_id = ? 
        AND start_time >= ? 
        AND start_time <= ?
        ORDER BY start_time ASC`,
        [user_id, startDate, endDate],
        (err, events) => {
          if (err) reject(err);
          resolve(events);
        }
      );
    });
  }
}

module.exports = CalendarModel;
