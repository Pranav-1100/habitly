const db = require('../config/database');

class HabitModel {
  static async create(habitData) {
    const { user_id, title, description, frequency } = habitData;
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO habits (user_id, title, description, frequency, streak) VALUES (?, ?, ?, ?, 0)',
        [user_id, title, description, frequency],
        function(err) {
          if (err) reject(err);
          resolve({ id: this.lastID, ...habitData, streak: 0 });
        }
      );
    });
  }

  static async findById(id, user_id) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM habits WHERE id = ? AND user_id = ?',
        [id, user_id],
        (err, habit) => {
          if (err) reject(err);
          resolve(habit);
        }
      );
    });
  }

  static async findAll(user_id) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC',
        [user_id],
        (err, habits) => {
          if (err) reject(err);
          resolve(habits);
        }
      );
    });
  }

  static async update(id, user_id, habitData) {
    const { title, description, frequency } = habitData;
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE habits SET title = ?, description = ?, frequency = ? WHERE id = ? AND user_id = ?',
        [title, description, frequency, id, user_id],
        function(err) {
          if (err) reject(err);
          resolve({ changes: this.changes });
        }
      );
    });
  }

  static async updateStreak(id, user_id, streak) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE habits SET streak = ? WHERE id = ? AND user_id = ?',
        [streak, id, user_id],
        function(err) {
          if (err) reject(err);
          resolve({ changes: this.changes });
        }
      );
    });
  }

  static async delete(id, user_id) {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM habits WHERE id = ? AND user_id = ?',
        [id, user_id],
        function(err) {
          if (err) reject(err);
          resolve({ changes: this.changes });
        }
      );
    });
  }

  static async getStreak(id, user_id) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT streak FROM habits WHERE id = ? AND user_id = ?',
        [id, user_id],
        (err, result) => {
          if (err) reject(err);
          resolve(result ? result.streak : 0);
        }
      );
    });
  }
}

module.exports = HabitModel;
