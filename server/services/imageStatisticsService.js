const imageRepo = require('../database/imageRepository'); // Assuming your repo file is named imageRepository.js

/**
 * Retrieves daily image upload statistics for a specific user within a given date range.
 * It fetches data from the repository layer and formats it as needed.
 *
 * @param {string} userId - The UUID of the user.
 * @param {string | Date} dateStart - The start date of the range (inclusive).
 * @param {string | Date} dateEnd - The end date of the range (inclusive).
 * @returns {Promise<Object>} An object mapping dates ('YYYYMMDD') to upload counts.
 */
async function getDailyImageStats(userId, dateStart, dateEnd) {
  // Convert string dates to Date objects if necessary
  const startDate = typeof dateStart === 'string' ? new Date(dateStart) : dateStart;
  const endDate = typeof dateEnd === 'string' ? new Date(dateEnd) : dateEnd;

  // Basic validation for dates
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error('Invalid date format provided.');
  }
  if (startDate > endDate) {
    throw new Error('Start date cannot be after end date.');
  }

  const stats = await imageRepo.getImageUploadStatsByUserInDateRange(userId, startDate, endDate);
  return stats;
}

module.exports = {
  getDailyImageStats,
};