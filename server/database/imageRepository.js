const db = require('./db'); // Assuming db.js is in the same directory

/**
 * Retrieves the complexity level for a specific child user.
 * Fetches the 'complexity_level' setting from the ChildUser table based on the user ID.
 * Defaults to 2 if the user is not found or an error occurs, though errors are logged.
 *
 * @param {string} userId - The unique ID of the child user.
 * @returns {Promise<number>} The complexity level (0-4).
 * @throws {Error} Rethrows database errors after logging.
 */
async function getChildComplexityLevel(userId) {
  try {
    const [rows] = await db.query(
      'SELECT complexity_level FROM ChildUser WHERE userid = ?',
      [userId]
    );
    if (rows.length > 0) {
      return rows[0].complexity_level;
    }
    // Default complexity if user specific setting not found
    console.warn(`No complexity level found for userId: ${userId}, defaulting to 2.`);
    return 2;
  } catch (dbError) {
    console.error(`Database error fetching complexity for userId ${userId}:`, dbError);
    // Rethrowing allows the calling service to handle the failure appropriately
    throw new Error('Failed to retrieve user complexity settings');
  }
}

/**
 * Saves the metadata and details of a generated image caption to the database.
 * Inserts a new record into the Image table, including file paths, caption text,
 * and other relevant metadata generated during the image processing workflow.
 *
 * @param {object} recordData - An object containing the image record details.
 * @param {string} recordData.chatId - The unique identifier for the image/chat entry.
 * @param {string} recordData.userId - The ID of the user who uploaded the image.
 * @param {string} recordData.imageFileName - The filename of the stored image.
 * @param {string} recordData.audioFileName - The filename of the stored audio caption.
 * @param {object} recordData.caption - The caption object { text: string, generatedAt: string }.
 * @param {object} recordData.metadata - The metadata object { complexityLevel: number, model: string, promptVersion: string }.
 * @returns {Promise<void>}
 * @throws {Error} Rethrows database errors after logging.
 */
async function saveImageRecord(recordData) {
  const {
    chatId,
    userId,
    imageFileName,
    audioFileName,
    caption,
    metadata,
    challengeDetails,
    objectAudioPaths
  } = recordData;
  try {
    await db.query(
      'INSERT INTO Image (serial, userid, filePath, audioFilePath, caption, metadata, challengeDetails, objectAudioPaths, uploadedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [
        chatId,
        userId,
        imageFileName,
        audioFileName,
        JSON.stringify(caption),
        JSON.stringify(metadata),
        JSON.stringify(challengeDetails),
        JSON.stringify(objectAudioPaths)
      ]
    );
  } catch (dbError) {
    console.error(`Database error saving image record for userId ${userId}:`, dbError);
    throw new Error('Failed to save image caption details');
  }
}

/**
 * Retrieves image details (file paths, caption) for a given chat ID,
 * ensuring the requesting user has permission to access it.
 * Access is granted if the user owns the image or is linked to the owner
 * via the AdultChild relationship table.
 *
 * @param {string} chatId - The unique serial ID of the image record.
 * @param {string} userId - The ID of the user requesting access.
 * @returns {Promise<object | null>} An object containing { filePath, audioFilePath, caption, metadata } if found and accessible, otherwise null.
 * @throws {Error} Rethrows database errors after logging.
 */
async function getImageDetailsForUser(chatId, userId) {
  try {
    const [rows] = await db.query(`
        SELECT
            i.filePath,
            i.audioFilePath,
            i.caption,
            i.metadata,
            i.objectAudioPaths,
            i.userid AS ownerId
        FROM Image i
        WHERE i.serial = ?
          AND i.status = 'active' -- Ensure image is active
          AND (
            -- Case 1: The requesting user is the owner
            i.userid = ? OR
            -- Case 2: Check AdultChild relationship
            EXISTS (SELECT 1
                    FROM AdultChild ac
                    WHERE
                       -- Requesting user is adult, image owner is linked child
                        (ac.adultId = ? AND ac.childId = i.userid)
                       OR
                       -- Requesting user is child, image owner is linked adult
                        (ac.childId = ? AND ac.adultId = i.userid))
            )
    `, [chatId, userId, userId, userId]); // Pass userId for all placeholders

    if (rows.length > 0) {
      return {
        filePath: rows[0].filePath,
        audioFilePath: rows[0].audioFilePath,
        caption: rows[0].caption,
        metadata: rows[0].metadata,
        objectAudioPaths: rows[0].objectAudioPaths,
        ownerId: rows[0].ownerId
      };
    } else {
      // No record found or access denied based on the WHERE clause conditions.
      return null;
    }
  } catch (dbError) {
    console.error(`Database error fetching image details for chatId ${chatId}, userId ${userId}:`, dbError);
    throw new Error('Failed to retrieve image details due to a database issue');
  }
}

/**
 * Retrieves challenge details
 *
 * @param {string} chatId - The unique serial ID of the image record.
 * @returns {Promise<object | null>} An object containing { filePath, audioFilePath, caption } if found and accessible, otherwise null.
 * @throws {Error} Rethrows database errors after logging.
 */
async function getChallengeDetails(chatId) {
  try {
    const [rows] = await db.query(`
        SELECT filePath, caption, challengeDetails
        FROM Image
        WHERE serial = ?
    `, [chatId]);

    if (rows.length > 0) {
      return {
        filePath: rows[0].filePath,
        caption: rows[0].caption,
        challengeDetails: rows[0].challengeDetails
      };
    } else {
      return null;
    }
  } catch (dbError) {
    console.error(`Database error fetching challenge details for chatId ${chatId}: `, dbError);
    throw new Error('Failed to retrieve challenge details due to a database issue');
  }
}

/**
 * Soft deletes an image record by marking its status as deleted in the database.
 *
 * @async
 * @param {string} chatId - The unique ID (serial) of the image record to delete.
 * @param {string} userId - The ID of the user requesting the deletion.
 * @returns {Promise<boolean>} - Returns true if the image record was successfully marked as deleted.
 * @throws {Error} If the image record does not exist or the update fails.
 */
async function deleteImageRecordByChatId(chatId, userId) {
  // Check if the image exists for the user
  const [image] = await db.query('SELECT * FROM Image WHERE serial = ? AND userid = ?', [chatId, userId]);

  if (image.length === 0) {
    throw new Error('Image not found or access denied');
  }

  // Update the status to 'deleted' (assuming the status column exists)
  const result = await db.query('UPDATE Image SET status = ? WHERE serial = ? AND userid = ?', ['deleted', chatId, userId]);

  if (result.affectedRows === 0) {
    throw new Error('Failed to mark the image as deleted');
  }

  return true;
}

/*
 * Retrieves image and caption.
 */
async function getImages(userid) {
  try {
    const [rows] = await db.query(
      'SELECT * FROM Image WHERE userid = ? AND status = ?',
      [userid, "active"]
    );
    return rows;
  } catch (dbError) {
    console.error(`Database error fetching images for childId ${userid}:`, dbError);
    // Rethrowing allows the calling service to handle the failure appropriately
    throw new Error('Failed to retrieve image for child');
  }
}

/*
 * Retrieves image and caption order by bookmarks.
 */
async function getSortedImages(userid) {
  try {
    const [rows] = await db.query(
      'SELECT * FROM Image WHERE userid = ? AND status = ? ORDER BY isBookmarked DESC, uploadedAt DESC',
      [userid, "active"]
    );
    return rows;
  } catch (dbError) {
    console.error(`Database error fetching images for childId ${userid}:`, dbError);
    // Rethrowing allows the calling service to handle the failure appropriately
    throw new Error('Failed to retrieve image for child');
  }
}

/**
 * Toggles the bookmark status of an image.
 *
 * @async
 * @param {string} chatId - The unique ID of the image/chat
 * @param {string} userId - The user making the request
 * @returns {Promise<boolean>} - The new bookmark status
 * @throws {Error} If the update fails or the image is not found
 */
async function getBookmarkStatus(chatId, userId) {
  const [rows] = await db.query(
    'SELECT isBookmarked FROM Image WHERE serial = ? AND userid = ?',
    [chatId, userId]
  );
  return rows[0]; // return the row (can be undefined if not found)
}

async function updateBookmarkStatus(chatId, userId, newStatus) {
  await db.query(
    'UPDATE Image SET isBookmarked = ? WHERE serial = ? AND userid = ?',
    [newStatus, chatId, userId]
  );
}

/**
 * Gets daily image upload statistics for a user within a date range.
 *
 * @param {string} userId - The user ID to get statistics for
 * @param {Date} dateStart - The start date of the range (inclusive)
 * @param {Date} dateEnd - The end date of the range (inclusive)
 * @returns {Promise<Object>} Object with dates as keys and upload counts as values
 */
async function getImageUploadStatsByUserInDateRange(userId, dateStart, dateEnd) {
  // Get timezone from environment variable or use default
  const tz = process.env.DEFAULT_TIMEZONE || '+08:00';

  const start = new Date(dateStart);
  const end = new Date(dateEnd);

  // Build UTC bounds:
  const startDate = new Date(Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate(),
    0, 0, 0
  ));

  const nextDay = new Date(end);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  const endDate = new Date(Date.UTC(
    nextDay.getUTCFullYear(),
    nextDay.getUTCMonth(),
    nextDay.getUTCDate(),
    0, 0, 0
  ));

  // Create a map of all dates in range with zero counts
  const result = {};
  const currentDate = new Date(startDate);

  while (currentDate < endDate) {
    const dateKey = currentDate.toISOString().slice(0, 10).replace(/-/g, '');
    result[dateKey] = 0;
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Query to get actual counts
  const [rows] = await db.execute(
    `SELECT DATE_FORMAT(CONVERT_TZ(uploadedAt, '+00:00', ?), '%Y%m%d') AS date,
            COUNT(*)                                                   AS count
     FROM Image
     WHERE userid = ?
       AND uploadedAt >= CONVERT_TZ(?, '+00:00', ?)
       AND uploadedAt <= CONVERT_TZ(?, '+00:00', ?)
       AND status != 'deleted'
     GROUP BY date
     ORDER BY date`,
    [tz, userId, startDate.toISOString(), tz, endDate.toISOString(), tz]
  );

  // Fill in actual counts
  rows.forEach(row => {
    result[row.date] = row.count;
  });

  return result;
}

/**
 * Insert new quiz result.
 */
async function challengeCompleted(chatId) {
  try {
    const query = `
        UPDATE Image
        SET challengeDone = 1
        WHERE serial = ?
    `;

    await db.execute(query, [chatId]);
    return true;
  } catch (error) {
    console.error('Error completing the challenge:', error);
    throw new Error('Failed to complete the challenge.');
  }
}

module.exports = {
  getChildComplexityLevel,
  saveImageRecord,
  getImageDetailsForUser,
  getImageUploadStatsByUserInDateRange,
  getChallengeDetails,
  deleteImageRecordByChatId,
  getImages,
  getSortedImages,
  getBookmarkStatus,
  updateBookmarkStatus,
  challengeCompleted
};