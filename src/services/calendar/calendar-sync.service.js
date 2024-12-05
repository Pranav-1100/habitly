const cron = require('node-cron');
const HabitModel = require('../../models/Habit');
const TaskModel = require('../../models/Task');
const UserModel = require('../../models/User');
const CalendarService = require('../calendar.service');
const TokenRefreshHandler = require('./token-refresh.handler');

class CalendarSyncService {
    static async syncToCalendar(userId) {
        // Get user's habits and tasks
        const [habits, tasks] = await Promise.all([
            HabitModel.findAll(userId),
            TaskModel.findAll(userId)
        ]);

        // Sync to calendar
        await Promise.all([
            CalendarService.syncToCalendar(userId, habits, 'habit'),
            CalendarService.syncToCalendar(userId, tasks, 'task')
        ]);
    }

    static async importFromCalendar(userId) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        await CalendarService.importCalendarEvents(userId, startDate, endDate);
    }


    static async syncWithRetry(userId, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await this.syncToCalendar(userId);
                break;
            } catch (error) {
                if (error.code === 'TOKEN_EXPIRED') {
                    await TokenRefreshHandler.refreshTokenIfNeeded(calendarSync);
                    continue;
                }
                if (attempt === maxRetries) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }

    static initializeAutoSync() {
        // Run every 4 hours
        cron.schedule('0 */4 * * *', async () => {
            const users = await UserModel.findAllWithCalendarSync();
            for (const user of users) {
                try {
                    await this.syncWithRetry(user.id);
                } catch (error) {
                    console.error(`Calendar sync failed for user ${user.id}:`, error);
                }
            }
        });
    }
}

module.exports = CalendarSyncService;

