const db = require('../config/database');

class UserModel {
  static async findByEmail(email) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) reject(err);
        resolve(user);
      });
    });
  }

  static async create(userData) {
    const { username, email, password } = userData;
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, password],
        function(err) {
          if (err) reject(err);
          resolve({ id: this.lastID, username, email });
        }
      );
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT id, username, email FROM users WHERE id = ?', [id], (err, user) => {
        if (err) reject(err);
        resolve(user);
      });
    });
  }
}

module.exports = UserModel;
