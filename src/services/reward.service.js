const RewardModel = require('../models/Reward');

class RewardService {
  // Badge definitions with their point requirements
  static BADGES = {
    EARLY_BIRD: {
      name: 'Early Bird',
      points: 50,
      description: 'Complete morning habits consistently'
    },
    STREAK_MASTER: {
      name: 'Streak Master',
      points: 100,
      description: 'Maintain a habit streak for 30 days'
    },
    TASK_WARRIOR: {
      name: 'Task Warrior',
      points: 75,
      description: 'Complete 50 tasks'
    },
    PRODUCTIVITY_GURU: {
      name: 'Productivity Guru',
      points: 150,
      description: 'Complete all daily tasks for a week'
    },
    FITNESS_PRO: {
      name: 'Fitness Pro',
      points: 100,
      description: 'Complete fitness-related habits consistently'
    }
  };

  static async getUserRewards(user_id) {
    const [rewards, totalPoints, badges] = await Promise.all([
      RewardModel.findByUser(user_id),
      RewardModel.getTotalPoints(user_id),
      RewardModel.getBadges(user_id)
    ]);

    return {
      rewards,
      totalPoints,
      badges,
      level: this.calculateLevel(totalPoints)
    };
  }

  static async awardPoints(user_id, points, reason) {
    const reward = await RewardModel.create({
      user_id,
      badge: reason,
      points
    });

    const totalPoints = await RewardModel.getTotalPoints(user_id);
    const newBadges = await this.checkForNewBadges(user_id, totalPoints);

    return {
      reward,
      totalPoints,
      newBadges,
      level: this.calculateLevel(totalPoints)
    };
  }

  static async checkForNewBadges(user_id, totalPoints) {
    const currentBadges = await RewardModel.getBadges(user_id);
    const newBadges = [];

    for (const [key, badge] of Object.entries(this.BADGES)) {
      if (!currentBadges.includes(badge.name) && totalPoints >= badge.points) {
        const reward = await RewardModel.create({
          user_id,
          badge: badge.name,
          points: 0 // Badge awards don't give additional points
        });
        newBadges.push(badge.name);
      }
    }

    return newBadges;
  }

  static calculateLevel(points) {
    // Level calculation formula: level = floor(sqrt(points/100)) + 1
    // This creates a progressive level system where each level requires more points
    return Math.floor(Math.sqrt(points / 100)) + 1;
  }

  static async processHabitCompletion(user_id, habit) {
    let points = 10; // Base points for completing a habit

    // Bonus points for streaks
    if (habit.streak > 0) {
      if (habit.streak % 7 === 0) points += 20; // Weekly streak bonus
      if (habit.streak % 30 === 0) points += 50; // Monthly streak bonus
    }

    return await this.awardPoints(user_id, points, 'Habit Completion');
  }

  static async processTaskCompletion(user_id, task) {
    let points = 5; // Base points for completing a task

    // Bonus points based on priority
    switch (task.priority) {
      case 'high':
        points += 10;
        break;
      case 'medium':
        points += 5;
        break;
    }

    return await this.awardPoints(user_id, points, 'Task Completion');
  }
}

module.exports = RewardService;
