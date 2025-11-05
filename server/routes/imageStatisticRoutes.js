const express = require('express');
const imageStatisticsService = require('../services/imageStatisticsService');
const userService = require('../services/userService');
const { getUserId } = require("../utils/jwtUtils");

const router = express.Router();

/**
 * POST /stats/:userId
 * Retrieves daily image upload statistics for a given user ID within a specified date range.
 * Expects 'dateStart' and 'dateEnd' (YYYY-MM-DD format) in the request body.
 */
router.post('/:userId', async (req, res) => {
  const { userId } = req.params;
  const { dateStart, dateEnd } = req.body; // Expecting { "dateStart": "YYYY-MM-DD", "dateEnd": "YYYY-MM-DD" }

  // Input validation
  if (!userId || !dateStart || !dateEnd) {
    return res.status(400).json({ error: 'Missing required parameters: userId, dateStart, or dateEnd.' });
  }

  try {
    const requesterUserId = getUserId(req);
    const childIds = await userService.getChildrenByAdultId(requesterUserId);

    if (!childIds.includes(userId)) {
      return res.status(403).json({ error: 'You do not have permission to access this user\'s statistics.' });
    }

    const stats = await imageStatisticsService.getDailyImageStats(userId, dateStart, dateEnd);
    res.status(200).json(stats);
  } catch (error) {
    console.error(`Error fetching image stats for user ${userId}:`, error);
    if (error.message.includes('Invalid date') || error.message.includes('Start date cannot be after end date')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'An error occurred while fetching image statistics.' });
  }
});

module.exports = router;