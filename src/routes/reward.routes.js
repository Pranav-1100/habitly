const express = require('express');
const auth = require('../middleware/auth.middleware');
const RewardService = require('../services/reward.service');

const router = express.Router();

// Get user's rewards, points, badges, and level
router.get('/', auth, async (req, res, next) => {
  try {
    const rewards = await RewardService.getUserRewards(req.user.id);
    res.json(rewards);
  } catch (error) {
    next(error);
  }
});

// Get available badges and their requirements
router.get('/badges', auth, (req, res) => {
  res.json(RewardService.BADGES);
});

module.exports = router;
