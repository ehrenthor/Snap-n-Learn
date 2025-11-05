const { v4: uuidv4 } = require('uuid');
const db = require("../database/db");
const chatRepository = require("../database/chatRepository"); // Import chatRepository for deleting notes

/**
 * Creates a new session for a child user.
 * @param {string} childId - The ID of the child user
 * @returns {Promise<string>} The created session ID
 */
async function createSession(childId) {
  const sessionId = uuidv4();
  const query = `
      INSERT INTO Session (sessionId, childId)
      VALUES (?, ?)
  `;
  await db.execute(query, [sessionId, childId]);
  // Add child as participant
  await addSessionParticipant(sessionId, childId, 'Child');
  return sessionId;
}

/**
 * Adds a participant to a session.
 * @param {string} sessionId - The session ID
 * @param {string} userId - The user ID
 * @param {string} userType - The user type (Child or Adult)
 * @returns {Promise<void>}
 */
async function addSessionParticipant(sessionId, userId, userType) {
  const query = `
      INSERT INTO SessionParticipant (sessionId, userId, userType)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE lastHeartbeat = CURRENT_TIMESTAMP,
                              isOnline      = TRUE
  `;
  await db.execute(query, [sessionId, userId, userType]);
}

/**
 * Updates the heartbeat timestamp for a session participant.
 * @param {string} sessionId - The session ID
 * @param {string} userId - The user ID
 * @returns {Promise<void>}
 */
async function updateHeartbeat(sessionId, userId) {
  const query = `
      UPDATE SessionParticipant
      SET lastHeartbeat = CURRENT_TIMESTAMP,
          isOnline      = TRUE
      WHERE sessionId = ?
        AND userId = ?
  `;
  await db.execute(query, [sessionId, userId]);
}

/**
 * Marks a session participant as offline based on heartbeat timeout.
 * This function is intended for quick updates to the isOnline status.
 * @param {string} sessionId - The session ID
 * @param {string} userId - The user ID
 * @returns {Promise<void>}
 */
async function markParticipantOffline(sessionId, userId) {
  const query = `
      UPDATE SessionParticipant
      SET isOnline = FALSE
      WHERE sessionId = ?
        AND userId = ?
  `;
  await db.execute(query, [sessionId, userId]);
}

/**
 * Ends a session explicitly. Usually called when a session logically concludes.
 * @param {string} sessionId - The session ID
 * @returns {Promise<void>}
 */
async function endSession(sessionId) {
  const query = `
      UPDATE Session
      SET endTime  = CURRENT_TIMESTAMP,
          isActive = FALSE
      WHERE sessionId = ?
        AND isActive = TRUE
  `;
  await db.execute(query, [sessionId]);

  // Delete associated notes when session ends
  await chatRepository.deleteNotesBySession(sessionId);  // Ensure that this function is implemented in chatRepository
}


/**
 * Gets the latest active session for a child.
 * @param {string} childId - The child user ID
 * @returns {Promise<object|null>} The latest active session object or null if none found
 */
async function getActiveSessionsByChild(childId) {
  // Fetch the latest active session
  const query = `
      SELECT *
      FROM Session
      WHERE childId = ?
        AND isActive = TRUE
      ORDER BY startTime DESC
      LIMIT 1
  `;
  try {
    const [rows] = await db.execute(query, [childId]);
    // Ensure we return the actual session object, not the array
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error("Database error fetching active session by child:", error);
    throw error; // Rethrow the error after logging
  }
}


/**
 * Gets all active sessions that an adult should monitor.
 * @param {string} adultId - The adult user ID
 * @returns {Promise<Array<object>>} List of active sessions
 */
async function getActiveSessionsForAdult(adultId) {

  const query = `
      SELECT s.*
      FROM Session s
               JOIN AdultChild ac ON s.childId = ac.childId
      WHERE ac.adultId = ?
        AND s.isActive = TRUE
  `;
  try {
    const [rows] = await db.execute(query, [adultId]);
    return rows;
  } catch (error) {
    console.error("Database error fetching active sessions for adult:", error);
    throw error;
  }
}


/**
 * Marks participants as offline if they haven't sent a heartbeat recently.
 * This is for updating the 'isOnline' status frequently.
 * @param {number} timeoutMinutes - Minutes of inactivity before marking offline. Defaults to 5.
 * @returns {Promise<void>}
 */
async function markInactiveParticipantsOffline(timeoutMinutes = 5) {
  // Check if the SessionParticipant table exists
  try {
    await db.execute(`SELECT 1
                      FROM SessionParticipant
                      LIMIT 1`);
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.warn("SessionParticipant table not found, skipping participant offline check.");
      return; // Table doesn't exist yet, nothing to clean up
    } else {
      console.error("Database error checking SessionParticipant table:", error);
      throw error; // Rethrow other errors
    }
  }

  const query = `
      UPDATE SessionParticipant
      SET isOnline = FALSE
      WHERE isOnline = TRUE
        AND TIMESTAMPDIFF(MINUTE, lastHeartbeat, CURRENT_TIMESTAMP) > ?
  `;
  try {
    const [result] = await db.execute(query, [timeoutMinutes]);
  } catch (error) {
    console.error("Database error marking inactive participants offline:", error);
  }
}

/**
 * Ends sessions that have been inactive for a specified duration.
 * Inactivity is defined as no participant sending a heartbeat within the timeout period.
 * @param {number} timeoutHours - Hours of inactivity before ending the session. Defaults to 1.
 * @returns {Promise<void>}
 */
async function endStaleSessions(timeoutHours = 1) {
  // Check if required tables exist
  try {
    await db.execute(`SELECT 1
                      FROM Session
                      LIMIT 1`);
    await db.execute(`SELECT 1
                      FROM SessionParticipant
                      LIMIT 1`);
  } catch (error) {
    console.error("Database error checking tables for stale session cleanup:", error);
    throw error; // Rethrow other errors

  }

  const query = `
      UPDATE Session s
      SET s.isActive = FALSE,
          s.endTime  = CURRENT_TIMESTAMP
      WHERE s.isActive = TRUE
        AND s.sessionId IN (
          -- Find session IDs where the most recent heartbeat from ANY participant is older than the timeout
          SELECT sp.sessionId
          FROM SessionParticipant sp
          GROUP BY sp.sessionId
          HAVING TIMESTAMPDIFF(HOUR, MAX(sp.lastHeartbeat), CURRENT_TIMESTAMP) > ?);
  `;

  try {
    const [result] = await db.execute(query, [timeoutHours]);
  } catch (error) {
    console.error(`Database error ending stale sessions (timeout: ${timeoutHours} hours):`, error);
  }
}


module.exports = {
  createSession,
  addSessionParticipant,
  updateHeartbeat,
  markParticipantOffline,
  endSession,
  getActiveSessionsByChild,
  getActiveSessionsForAdult,
  markInactiveParticipantsOffline,
  endStaleSessions
};
