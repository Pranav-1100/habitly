const TaskModel = require('../models/Task');
const RewardService = require('./reward.service');


class TaskService {
  static async createTask(user_id, taskData) {
    this.validatePriority(taskData.priority);
    const task = await TaskModel.create({
      user_id,
      ...taskData
    });
    return task;
  }

  static async getTasks(user_id, filters = {}) {
    const tasks = await TaskModel.findAll(user_id, filters);
    return tasks;
  }

  static async getTaskById(id, user_id) {
    const task = await TaskModel.findById(id, user_id);
    if (!task) {
      throw new Error('Task not found');
    }
    return task;
  }

  static async updateTask(id, user_id, taskData) {
    if (taskData.priority) {
      this.validatePriority(taskData.priority);
    }

    const task = await TaskModel.findById(id, user_id);
    if (!task) {
      throw new Error('Task not found');
    }

    const result = await TaskModel.update(id, user_id, {
      ...task,
      ...taskData
    });

    if (result.changes === 0) {
      throw new Error('No changes made to task');
    }

    return await TaskModel.findById(id, user_id);
  }

  static async toggleTaskComplete(id, user_id, completed) {
    const task = await TaskModel.findById(id, user_id);
    if (!task) {
      throw new Error('Task not found');
    }
  
    await TaskModel.toggleComplete(id, user_id, completed);
    const updatedTask = await TaskModel.findById(id, user_id);
  
    if (completed && !task.completed) {
      // Only process rewards when task is being marked as completed
      const rewardResult = await RewardService.processTaskCompletion(user_id, updatedTask);
      return {
        task: updatedTask,
        rewards: rewardResult
      };
    }
  
    return { task: updatedTask };
  }  

  static async deleteTask(id, user_id) {
    const task = await TaskModel.findById(id, user_id);
    if (!task) {
      throw new Error('Task not found');
    }

    const result = await TaskModel.delete(id, user_id);
    return result;
  }

  static validatePriority(priority) {
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority)) {
      throw new Error('Invalid priority value');
    }
    return true;
  }
}

module.exports = TaskService;
