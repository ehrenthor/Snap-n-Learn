const db = require('../database/db');

class ProfileRepository {
  /**
   * Retrieves a user's complete profile by user ID.
   */
  async getProfileByUserId(userId) {
    try {
      const query = `
        SELECT u.userid,
               u.username,
               u.createdAt,
               up.firstName,
               up.lastName,
               up.profileImageFilePath,
               up.dob,
               au.email
        FROM User u
        LEFT JOIN UserProfile up ON u.userid = up.userid
        LEFT JOIN AdultUser au ON u.userid = au.userid
        WHERE u.userid = ? AND u.isDeleted = FALSE
        LIMIT 1
      `;

      const [rows] = await db.execute(query, [userId]);

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error retrieving profile by user ID:', error);
      throw new Error('Failed to retrieve user profile');
    }
  }

  /**
   * Updates a user's username.
   */
  async updateUsername(userId, newUsername) {
    try {
      const query = `
        UPDATE User
        SET username = ?
        WHERE userid = ? AND isDeleted = FALSE
      `;

      await db.execute(query, [newUsername, userId]);
      return true;
    } catch (error) {
      console.error('Error updating username:', error);
      throw new Error('Failed to update username');
    }
  }

  /**
   * Updates a user's profile information.
   */
  async updateUserProfile(userId, firstName, lastName, profileImageFilePath, dob) {
    try {
      const query = `
        UPDATE UserProfile
        SET firstName = ?,
            lastName = ?,
            profileImageFilePath = ?,
            dob = ?
        WHERE userid = ?
      `;

      await db.execute(query, [firstName, lastName, profileImageFilePath, dob, userId]);
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }

  /**
   * Updates an adult user's email.
   */
  async updateAdultEmail(userId, email) {
    try {
      const query = `
        UPDATE AdultUser
        SET email = ?
        WHERE userid = ?
      `;

      await db.execute(query, [email, userId]);
      return true;
    } catch (error) {
      console.error('Error updating adult email:', error);
      throw new Error('Failed to update adult email');
    }
  }

  /**
   * Updates a user's password.
   */
  async updatePassword(userId, hashedPassword) {
    try {
      const query = `
        UPDATE User
        SET password = ?
        WHERE userid = ? AND isDeleted = FALSE
      `;

      await db.execute(query, [hashedPassword, userId]);
      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      throw new Error('Failed to update password');
    }
  }

  /**
   * Retrieves a user's password history.
   */
  async getPasswordHistory(userId) {
    try {
      const query = `
        SELECT password
        FROM PasswordHistory
        WHERE userid = ?
        ORDER BY createdAt DESC
      `;

      const [rows] = await db.execute(query, [userId]);
      return rows;
    } catch (error) {
      console.error('Error retrieving password history:', error);
      throw new Error('Failed to retrieve password history');
    }
  }
}

module.exports = new ProfileRepository();