const db = require('../config/database');

class TaskModel {
  static async create(taskData) {
    const { user_id, title, description, priority, due_date } = taskData;
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO tasks (user_id, title, description, priority, due_date, completed) VALUES (?, ?, ?, ?, ?, 0)',
        [user_id, title, description, priority, due_date],
        function(err) {
          if (err) reject(err);
          resolve({ id: this.lastID, ...taskData, completed: false });
        }
      );
    });
  }

  static async findById(id, user_id) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
        [id, user_id],
        (err, task) => {
          if (err) reject(err);
          resolve(task);
        }
      );
    });
  }

  static async findAll(user_id, filters = {}) {
    const { priority, completed, due_date } = filters;
    let query = 'SELECT * FROM tasks WHERE user_id = ?';
    const params = [user_id];

    if (priority) {
      query += ' AND priority = ?';
      params.push(priority);
    }

    if (completed !== undefined) {
      query += ' AND completed = ?';
      params.push(completed ? 1 : 0);
    }

    if (due_date) {
      query += ' AND date(due_date) = date(?)';
      params.push(due_date);
    }

    query += ' ORDER BY due_date ASC';

    return new Promise((resolve, reject) => {
      db.all(query, params, (err, tasks) => {
        if (err) reject(err);
        resolve(tasks);
      });
    });
  }

  static async update(id, user_id, taskData) {
    const { title, description, priority, due_date } = taskData;
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE tasks SET title = ?, description = ?, priority = ?, due_date = ? WHERE id = ? AND user_id = ?',
        [title, description, priority, due_date, id, user_id],
        function(err) {
          if (err) reject(err);
          resolve({ changes: this.changes });
        }
      );
    });
  }

  static async toggleComplete(id, user_id, completed) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE tasks SET completed = ? WHERE id = ? AND user_id = ?',
        [completed ? 1 : 0, id, user_id],
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
        'DELETE FROM tasks WHERE id = ? AND user_id = ?',
        [id, user_id],
        function(err) {
          if (err) reject(err);
          resolve({ changes: this.changes });
        }
      );
    });
  }
}

module.exports = TaskModel;

