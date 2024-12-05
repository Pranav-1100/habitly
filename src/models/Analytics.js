const db = require('../config/database');

class AnalyticsModel {
  static async getHabitStats(user_id, startDate, endDate) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          h.id,
          h.title,
          h.frequency,
          h.streak,
          COUNT(CASE WHEN hl.completed = 1 THEN 1 END) as completions,
          COUNT(hl.id) as total_occurrences,
          ROUND(CAST(COUNT(CASE WHEN hl.completed = 1 THEN 1 END) AS FLOAT) / 
                CAST(COUNT(hl.id) AS FLOAT) * 100, 2) as completion_rate
        FROM habits h
        LEFT JOIN habit_logs hl ON h.id = hl.habit_id
        WHERE h.user_id = ?
        AND hl.date >= ?
        AND hl.date <= ?
        GROUP BY h.id
        ORDER BY completion_rate DESC`,
        [user_id, startDate, endDate],
        (err, stats) => {
          if (err) reject(err);
          resolve(stats);
        }
      );
    });
  }

  static async getTaskStats(user_id, startDate, endDate) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          priority,
          COUNT(*) as total,
          COUNT(CASE WHEN completed = 1 THEN 1 END) as completed,
          ROUND(CAST(COUNT(CASE WHEN completed = 1 THEN 1 END) AS FLOAT) / 
                CAST(COUNT(*) AS FLOAT) * 100, 2) as completion_rate
        FROM tasks
        WHERE user_id = ?
        AND created_at >= ?
        AND created_at <= ?
        GROUP BY priority`,
        [user_id, startDate, endDate],
        (err, stats) => {
          if (err) reject(err);
          resolve(stats);
        }
      );
    });
  }

  static async getDailyProgress(user_id, startDate, endDate) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          date(created_at) as date,
          COUNT(CASE WHEN completed = 1 THEN 1 END) as completed_tasks,
          COUNT(*) as total_tasks
        FROM tasks
        WHERE user_id = ?
        AND created_at >= ?
        AND created_at <= ?
        GROUP BY date(created_at)
        ORDER BY date(created_at)`,
        [user_id, startDate, endDate],
        (err, progress) => {
          if (err) reject(err);
          resolve(progress);
        }
      );
    });
  }

  static async getProductivityScore(user_id, date) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          ROUND(
            (
              (SELECT COUNT(*) FROM tasks 
               WHERE user_id = ? AND completed = 1 
               AND date(created_at) = date(?)) * 1.0 /
              NULLIF((SELECT COUNT(*) FROM tasks 
                     WHERE user_id = ? 
                     AND date(created_at) = date(?)), 0) +
              (SELECT COUNT(*) FROM habits h
               JOIN habit_logs hl ON h.id = hl.habit_id
               WHERE h.user_id = ? AND hl.completed = 1 
               AND date(hl.date) = date(?)) * 1.0 /
              NULLIF((SELECT COUNT(*) FROM habits h
                     JOIN habit_logs hl ON h.id = hl.habit_id
                     WHERE h.user_id = ? 
                     AND date(hl.date) = date(?)), 0)
            ) * 50, 2
          ) as productivity_score`,
        [user_id, date, user_id, date, user_id, date, user_id, date],
        (err, result) => {
          if (err) reject(err);
          resolve(result ? result.productivity_score || 0 : 0);
        }
      );
    });
  }

  // Add method to get streak data
  static async getStreakData(user_id) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          h.id,
          h.title,
          h.streak,
          h.frequency,
          MAX(hl.date) as last_completion_date
        FROM habits h
        LEFT JOIN habit_logs hl ON h.id = hl.habit_id AND hl.completed = 1
        WHERE h.user_id = ?
        GROUP BY h.id
        ORDER BY h.streak DESC`,
        [user_id],
        (err, streaks) => {
          if (err) reject(err);
          resolve(streaks);
        }
      );
    });
  }

  // Add method to get week-over-week comparison
  static async getWeekComparison(user_id, currentWeekStart, previousWeekStart) {
    return new Promise((resolve, reject) => {
      db.all(`
        WITH WeeklyStats AS (
          SELECT 
            CASE 
              WHEN date(created_at) >= date(?) THEN 'current'
              ELSE 'previous'
            END as week_type,
            COUNT(*) as total_tasks,
            COUNT(CASE WHEN completed = 1 THEN 1 END) as completed_tasks,
            ROUND(CAST(COUNT(CASE WHEN completed = 1 THEN 1 END) AS FLOAT) / 
                  CAST(COUNT(*) AS FLOAT) * 100, 2) as completion_rate
          FROM tasks
          WHERE user_id = ?
            AND date(created_at) >= date(?)
            AND date(created_at) < date(?, '+14 days')
          GROUP BY week_type
        )
        SELECT * FROM WeeklyStats`,
        [currentWeekStart, user_id, previousWeekStart, previousWeekStart],
        (err, comparison) => {
          if (err) reject(err);
          resolve(comparison);
        }
      );
    });
  }

  // Add method to get habit completion patterns
  static async getHabitPatterns(user_id, days = 30) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          h.id,
          h.title,
          strftime('%w', hl.date) as day_of_week,
          COUNT(CASE WHEN hl.completed = 1 THEN 1 END) as completions,
          COUNT(*) as total_occurrences
        FROM habits h
        LEFT JOIN habit_logs hl ON h.id = hl.habit_id
        WHERE h.user_id = ?
          AND hl.date >= date('now', ?)
        GROUP BY h.id, day_of_week
        ORDER BY h.id, day_of_week`,
        [user_id, `-${days} days`],
        (err, patterns) => {
          if (err) reject(err);
          resolve(patterns);
        }
      );
    });
  }
}

module.exports = AnalyticsModel;
