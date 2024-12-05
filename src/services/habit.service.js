const HabitModel = require('../models/Habit');
const RewardService = require('./reward.service');

class HabitService {
  static async createHabit(user_id, habitData) {
    const habit = await HabitModel.create({
      user_id,
      ...habitData
    });
    return habit;
  }

  static async getHabits(user_id) {
    const habits = await HabitModel.findAll(user_id);
    return habits;
  }

  static async getHabitById(id, user_id) {
    const habit = await HabitModel.findById(id, user_id);
    if (!habit) {
      throw new Error('Habit not found');
    }
    return habit;
  }

  static async updateStreak(id, user_id, completed) {
    const habit = await HabitModel.findById(id, user_id);
    if (!habit) {
      throw new Error('Habit not found');
    }
  
    let newStreak = habit.streak;
    if (completed) {
      newStreak += 1;
      
      // Process rewards for habit completion
      const rewardResult = await RewardService.processHabitCompletion(user_id, {
        ...habit,
        streak: newStreak
      });
  
      await HabitModel.updateStreak(id, user_id, newStreak);
      
      return {
        streak: newStreak,
        rewards: rewardResult
      };
    } else {
      newStreak = 0; // Reset streak if habit is broken
      await HabitModel.updateStreak(id, user_id, newStreak);
      return { streak: newStreak };
    }
  }
  

  static async deleteHabit(id, user_id) {
    const habit = await HabitModel.findById(id, user_id);
    if (!habit) {
      throw new Error('Habit not found');
    }

    const result = await HabitModel.delete(id, user_id);
    return result;
  }

  static async updateStreak(id, user_id, completed) {
    const habit = await HabitModel.findById(id, user_id);
    if (!habit) {
      throw new Error('Habit not found');
    }

    let newStreak = habit.streak;
    if (completed) {
      newStreak += 1;
    } else {
      newStreak = 0; // Reset streak if habit is broken
    }

    await HabitModel.updateStreak(id, user_id, newStreak);
    return { streak: newStreak };
  }

  static validateFrequency(frequency) {
    const validFrequencies = ['daily', 'weekly', 'custom'];
    if (!validFrequencies.includes(frequency)) {
      throw new Error('Invalid frequency value');
    }
    return true;
  }
}

module.exports = HabitService;
