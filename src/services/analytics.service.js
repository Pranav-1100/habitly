const AnalyticsModel = require('../models/Analytics');

class AnalyticsService {
  static async getUserAnalytics(user_id, timeRange = '7days') {
    const endDate = new Date();
    const startDate = this.calculateStartDate(timeRange);

    const [
      habitStats,
      taskStats,
      dailyProgress,
      productivityScore
    ] = await Promise.all([
      AnalyticsModel.getHabitStats(user_id, startDate, endDate),
      AnalyticsModel.getTaskStats(user_id, startDate, endDate),
      AnalyticsModel.getDailyProgress(user_id, startDate, endDate),
      AnalyticsModel.getProductivityScore(user_id, endDate)
    ]);

    return {
      habitStats: this.processHabitStats(habitStats),
      taskStats: this.processTaskStats(taskStats),
      dailyProgress: this.processDailyProgress(dailyProgress),
      productivityScore,
      timeRange,
      summary: this.generateSummary(habitStats, taskStats, productivityScore)
    };
  }

  static calculateStartDate(timeRange) {
    const date = new Date();
    switch (timeRange) {
      case '7days':
        date.setDate(date.getDate() - 7);
        break;
      case '30days':
        date.setDate(date.getDate() - 30);
        break;
      case '90days':
        date.setDate(date.getDate() - 90);
        break;
      default:
        date.setDate(date.getDate() - 7);
    }
    return date;
  }

  static processHabitStats(habitStats) {
    return {
      totalHabits: habitStats.length,
      averageCompletionRate: this.calculateAverage(habitStats, 'completion_rate'),
      bestPerformingHabits: habitStats
        .sort((a, b) => b.completion_rate - a.completion_rate)
        .slice(0, 3),
      streakDistribution: this.calculateStreakDistribution(habitStats),
      habitsByFrequency: this.groupHabitsByFrequency(habitStats)
    };
  }

  static processTaskStats(taskStats) {
    return {
      totalTasks: taskStats.reduce((sum, stat) => sum + stat.total, 0),
      completionRateByPriority: taskStats.reduce((acc, stat) => {
        acc[stat.priority] = {
          total: stat.total,
          completed: stat.completed,
          completionRate: stat.completion_rate
        };
        return acc;
      }, {}),
      overallCompletionRate: this.calculateOverallCompletionRate(taskStats)
    };
  }

  static processDailyProgress(dailyProgress) {
    return dailyProgress.map(day => ({
      date: day.date,
      completionRate: (day.completed_tasks / day.total_tasks) * 100,
      totalTasks: day.total_tasks,
      completedTasks: day.completed_tasks
    }));
  }

  static generateSummary(habitStats, taskStats, productivityScore) {
    const averageHabitCompletion = this.calculateAverage(habitStats, 'completion_rate');
    const overallTaskCompletion = this.calculateOverallCompletionRate(taskStats);

    return {
      productivityScore,
      habitPerformance: this.getPerformanceLevel(averageHabitCompletion),
      taskPerformance: this.getPerformanceLevel(overallTaskCompletion),
      recommendations: this.generateRecommendations(
        averageHabitCompletion,
        overallTaskCompletion,
        habitStats,
        taskStats
      )
    };
  }

  static calculateAverage(items, field) {
    if (!items.length) return 0;
    return items.reduce((sum, item) => sum + item[field], 0) / items.length;
  }

  static calculateStreakDistribution(habits) {
    return habits.reduce((acc, habit) => {
      const streakRange = this.getStreakRange(habit.streak);
      acc[streakRange] = (acc[streakRange] || 0) + 1;
      return acc;
    }, {});
  }

  static getStreakRange(streak) {
    if (streak === 0) return '0';
    if (streak <= 7) return '1-7';
    if (streak <= 30) return '8-30';
    return '30+';
  }

  static groupHabitsByFrequency(habits) {
    return habits.reduce((acc, habit) => {
      acc[habit.frequency] = (acc[habit.frequency] || 0) + 1;
      return acc;
    }, {});
  }

  static calculateOverallCompletionRate(taskStats) {
    const totals = taskStats.reduce((acc, stat) => {
      acc.completed += stat.completed;
      acc.total += stat.total;
      return acc;
    }, { completed: 0, total: 0 });

    return totals.total ? (totals.completed / totals.total) * 100 : 0;
  }

  static getPerformanceLevel(percentage) {
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Fair';
    return 'Needs Improvement';
  }

  static generateRecommendations(habitCompletion, taskCompletion, habits, tasks) {
    const recommendations = [];

    // Habit-based recommendations
    if (habitCompletion < 60) {
      recommendations.push('Consider reducing the number of concurrent habits to focus on building stronger foundations.');
    }

    // Streak-based recommendations
    const longStreakHabits = habits.filter(h => h.streak > 30).length;
    if (longStreakHabits > 0) {
      recommendations.push(`Great job maintaining ${longStreakHabits} habits with 30+ day streaks! Consider adding a new habit to your routine.`);
    }

    // Task-based recommendations
    if (taskCompletion < 50) {
      recommendations.push('Try breaking down tasks into smaller, more manageable subtasks.');
    }

    return recommendations;
  }

  // Additional helper methods for specific analytics needs
  static async getWeeklyComparison(user_id) {
    const currentWeekEnd = new Date();
    const currentWeekStart = new Date(currentWeekEnd);
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);

    const previousWeekEnd = new Date(currentWeekStart);
    const previousWeekStart = new Date(previousWeekEnd);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);

    const [currentWeek, previousWeek] = await Promise.all([
      this.getWeekStats(user_id, currentWeekStart, currentWeekEnd),
      this.getWeekStats(user_id, previousWeekStart, previousWeekEnd)
    ]);

    return {
      currentWeek,
      previousWeek,
      comparison: this.compareWeeks(currentWeek, previousWeek)
    };
  }

  static async getWeekStats(user_id, startDate, endDate) {
    const [habits, tasks] = await Promise.all([
      AnalyticsModel.getHabitStats(user_id, startDate, endDate),
      AnalyticsModel.getTaskStats(user_id, startDate, endDate)
    ]);

    return {
      habitCompletionRate: this.calculateAverage(habits, 'completion_rate'),
      taskCompletionRate: this.calculateOverallCompletionRate(tasks),
      totalActivities: habits.length + tasks.reduce((sum, t) => sum + t.total, 0)
    };
  }

  static compareWeeks(currentWeek, previousWeek) {
    return {
      habitImprovement: ((currentWeek.habitCompletionRate - previousWeek.habitCompletionRate) / previousWeek.habitCompletionRate) * 100,
      taskImprovement: ((currentWeek.taskCompletionRate - previousWeek.taskCompletionRate) / previousWeek.taskCompletionRate) * 100,
      activityChange: currentWeek.totalActivities - previousWeek.totalActivities
    };
  }
}

module.exports = AnalyticsService;
