const cron = require('node-cron');
const HabitModel = require('../models/Habit');
const TaskModel = require('../models/Task');

class NotificationService {
  static async initializeNotifications() {
    // Check for daily habits every day at midnight
    cron.schedule('0 0 * * *', async () => {
      await this.checkDailyHabits();
    });

    // Check for upcoming tasks every hour
    cron.schedule('0 * * * *', async () => {
      await this.checkUpcomingTasks();
    });
  }

  static async checkDailyHabits() {
    try {
      // Get all habits and check which ones need attention
      const habits = await HabitModel.findAllDue();
      for (const habit of habits) {
        // In a real application, you would send notifications through a proper
        // notification service (e.g., web push notifications, email, etc.)
        console.log(`Reminder: Complete your habit "${habit.title}"`);
      }
    } catch (error) {
      console.error('Error checking daily habits:', error);
    }
  }

  static async checkUpcomingTasks() {
    try {
      // Get tasks due in the next 24 hours
      const tasks = await TaskModel.findUpcoming(24);
      for (const task of tasks) {
        console.log(`Reminder: Task "${task.title}" is due soon`);
      }
    } catch (error) {
      console.error('Error checking upcoming tasks:', error);
    }
  }

  // In a real application, you would implement actual notification sending:
  static async sendNotification(user_id, title, message) {
    // Example implementation:
    // 1. Check user's notification preferences
    // 2. Send push notification if enabled
    // 3. Send email if enabled
    // 4. Log notification in notification history
    console.log(`[Notification for user ${user_id}]: ${title} - ${message}`);
  }
}

module.exports = NotificationService;
