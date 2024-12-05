const db = require('../config/database');

class RewardModel {
  static async create(rewardData) {
    const { user_id, badge, points } = rewardData;
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO rewards (user_id, badge, points) VALUES (?, ?, ?)',
        [user_id, badge, points],
        function(err) {
          if (err) reject(err);
          resolve({ id: this.lastID, ...rewardData });
        }
      );
    });
  }

  static async findByUser(user_id) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM rewards WHERE user_id = ? ORDER BY earned_at DESC',
        [user_id],
        (err, rewards) => {
          if (err) reject(err);
          resolve(rewards);
        }
      );
    });
  }

  static async getTotalPoints(user_id) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT SUM(points) as total_points FROM rewards WHERE user_id = ?',
        [user_id],
        (err, result) => {
          if (err) reject(err);
          resolve(result ? result.total_points || 0 : 0);
        }
      );
    });
  }

  static async getBadges(user_id) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT DISTINCT badge FROM rewards WHERE user_id = ?',
        [user_id],
        (err, badges) => {
          if (err) reject(err);
          resolve(badges.map(b => b.badge));
        }
      );
    });
  }
}

module.exports = RewardModel;
