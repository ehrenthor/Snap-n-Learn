const db = require('./db');
const { v4: uuidv4 } = require('uuid');


class UserRepository {
  /**
   * Creates a base user record in the User table.
   * This is a helper method used by other user creation methods.
   */
  async _createBaseUser(username, passwordHash, connection) {
    try {
      const userId = uuidv4();
      const query = `
          INSERT INTO User (userid, username, password)
          VALUES (?, ?, ?)
      `;
      await connection.execute(query, [userId, username, passwordHash]);

      return userId;
    } catch (error) {
      console.error('Error creating base user:', error);
      throw new Error('Failed to create user');
    }
  }

  /**
   * Creates an adult user with the given information.
   */
  async createAdultUser(username, passwordHash, email) {
    // Get a connection from the pool
    const connection = await db.getConnection();

    try {
      // Start transaction
      await connection.beginTransaction();

      // Create base user
      const userId = await this._createBaseUser(username, passwordHash, connection);

      // Create adult user
      const query = `
          INSERT INTO AdultUser (userid, email)
          VALUES (?, ?)
      `;
      await connection.execute(query, [userId, email]);

      // Add to password history
      await this.updatePasswordHistory(userId, passwordHash, 5, connection);

      // Commit the transaction
      await connection.commit();

      return userId;
    } catch (error) {
      // Rollback in case of error
      await connection.rollback();
      console.error('Error creating adult user:', error);
      throw new Error('Failed to create adult user');
    } finally {
      // Release the connection back to the pool
      connection.release();
    }
  }

  /**
   * Creates a child user with the given information.
   */
  async createChildUser(username, passwordHash, isLocked = false, canUploadImage = true,
                        dailySessionLimit = null, complexityLevel = 2) {
    // Get a connection from the pool
    const connection = await db.getConnection();

    try {
      // Start transaction
      await connection.beginTransaction();

      // Create base user
      const userId = await this._createBaseUser(username, passwordHash, connection);

      // Create child user
      const query = `
          INSERT INTO ChildUser (userid, is_locked, can_upload_image, daily_session_limit, complexity_level)
          VALUES (?, ?, ?, ?, ?)
      `;
      await connection.execute(query, [userId, isLocked, canUploadImage, dailySessionLimit, complexityLevel]);

      // Commit the transaction
      await connection.commit();

      return userId;
    } catch (error) {
      // Rollback in case of error
      await connection.rollback();
      console.error('Error creating child user:', error);
      throw new Error('Failed to create child user');
    } finally {
      // Release the connection back to the pool
      connection.release();
    }
  }

  /**
   * Associates an adult user with a child user.
   */
  async addChild(adultUserId, childUserId) {
    try {
      const query = `
          INSERT INTO AdultChild (adultId, childId)
          VALUES (?, ?)
      `;
      await db.execute(query, [adultUserId, childUserId]);
      return true;
    } catch (error) {
      console.error('Error adding child to adult:', error);
      throw new Error('Failed to associate adult with child');
    }
  }

  /**
   * Creates an admin user
   */
  async createAdminUser(username, passwordHash, email) {
    // Get a connection from the pool
    const connection = await db.getConnection();

    try {
      // Start transaction
      await connection.beginTransaction();

      // Create base user
      const userId = await this._createBaseUser(username, passwordHash, connection);

      // Create admin user
      const query = `
          INSERT INTO AdminUser (userid, email)
          VALUES (?, ?)
      `;
      await connection.execute(query, [userId, email]);

      // Add to password history
      await this.updatePasswordHistory(userId, passwordHash, 5, connection);

      // Commit the transaction
      await connection.commit();

      return userId;
    } catch (error) {
      // Rollback in case of error
      await connection.rollback();
      console.error('Error creating admin user:', error);
      throw new Error('Failed to create admin user');
    } finally {
      // Release the connection back to the pool
      connection.release();
    }
  }

  /**
   * Updates the password history for a user, keeping only the most recent entries.
   */
  async updatePasswordHistory(userId, passwordHash, numberToKeep, connection = null) {
    // Determine if we need to manage the connection or use the provided one
    const shouldReleaseConnection = !connection;
    if (shouldReleaseConnection) {
      connection = await db.getConnection();
    }

    try {
      // Add new password to history
      const addQuery = `
          INSERT INTO PasswordHistory (userid, password)
          VALUES (?, ?)
      `;
      await connection.execute(addQuery, [userId, passwordHash]);

      // Get count of history entries
      const [countRows] = await connection.execute(
        'SELECT COUNT(*) as count FROM PasswordHistory WHERE userid = ?',
        [userId]
      );

      const count = countRows[0].count;

      // Delete oldest entries if we have more than numberToKeep
      if (count > numberToKeep) {
        const deleteQuery = `
            DELETE
            FROM PasswordHistory
            WHERE userid = ?
            ORDER BY createdAt ASC
            LIMIT ?
        `;
        await connection.execute(deleteQuery, [userId, count - numberToKeep]);
      }

      return true;
    } catch (error) {
      console.error('Error updating password history:', error);
      throw new Error('Failed to update password history');
    } finally {
      // Only release the connection if we created it
      if (shouldReleaseConnection) {
        connection.release();
      }
    }
  }

  /**
   * Create a user's profile information.
   */
  async createUserProfile(userId, firstName, lastName, profileImageFilePath, dob) {
    try {
      const query = `
          INSERT INTO UserProfile (userid, firstName, lastName, dob)
          VALUES (?, ?, ?, ?)
      `;

      await db.execute(query, [userId, firstName, lastName, dob]);
      return true;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw new Error('Failed to create user profile');
    }
  }

  /**
   * Updates a user's profile information.
   */
  async updateUserProfile(userId, firstName, lastName, profileImageFilePath, dob) {
    try {
      const query = `
          UPDATE UserProfile
          SET firstName            = ?,
              lastName             = ?,
              profileImageFilePath = ?,
              dob                  = ?
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
   * Updates the last seen timestamp for a child user.
   */
  async updateLastSeen(childId) {
    try {
      const query = `
          UPDATE ChildUser
          SET last_seen = CURRENT_TIMESTAMP
          WHERE userid = ?
      `;

      await db.execute(query, [childId]);
      return true;
    } catch (error) {
      console.error('Error updating last seen timestamp:', error);
      throw new Error('Failed to update last seen timestamp');
    }
  }


  /**
   * Checks if a username already exists.
   */
  async usernameExists(username) {
    try {
      const [rows] = await db.execute(
        'SELECT 1 FROM User WHERE username = ?',
        [username]
      );

      return rows.length > 0;
    } catch (error) {
      console.error('Error checking if username exists:', error);
      throw new Error('Failed to check username existence');
    }
  }

  /**
   * Checks if an email already exists in AdultUser or SystemUser.
   */
  /**
   * Updates child user information.
   */
  async updateChildInfo(uuid, isLocked, canUploadImage, dailySessionLimit, complexityLevel) {
    try {
      const query = `
          UPDATE ChildUser
          SET is_locked           = ?,
              can_upload_image    = ?,
              daily_session_limit = ?,
              complexity_level    = ?
          WHERE userid = ?
      `;

      await db.execute(query, [isLocked, canUploadImage, dailySessionLimit, complexityLevel, uuid]);
      return true;
    } catch (error) {
      console.error('Error updating child info:', error);
      throw new Error('Failed to update child information');
    }
  }

  async emailExists(email) {
    try {
      const [adultRows] = await db.execute(
        'SELECT 1 FROM AdultUser WHERE email = ? LIMIT 1',
        [email]
      );

      if (adultRows.length > 0) return true;

      const [systemRows] = await db.execute(
        'SELECT 1 FROM AdminUser WHERE email = ? LIMIT 1',
        [email]
      );

      return systemRows.length > 0;
    } catch (error) {
      console.error('Error checking if email exists:', error);
      throw new Error('Failed to check email existence');
    }
  }

  /**
   * Determines the type of user (adult, child, system).
   */
  async userType(uuid) {
    try {
      // Check if user doesn't exist
      const [userRows] = await db.execute(
        'SELECT 1 FROM User WHERE userid = ? AND isDeleted = TRUE LIMIT 1',
        // 'SELECT 1 FROM User WHERE userid = ? AND isDeleted = FALSE LIMIT 1',
        [uuid]
      );

      //if (userRows.length === 0) return null;

      // Check each user type
      const [adultRows] = await db.execute(
        'SELECT 1 FROM AdultUser WHERE userid = ? LIMIT 1',
        [uuid]
      );

      if (adultRows.length > 0 && userRows.length === 0) {
        return 'adult';
      } else if (adultRows.length > 0) {
        return {
          userType: 'adult',
          isDeleted: true
        }
      }
      ;

      const [childRows] = await db.execute(
        'SELECT 1 FROM ChildUser WHERE userid = ? LIMIT 1',
        [uuid]
      );

      if (childRows.length > 0 && userRows.length === 0) {
        return 'child';
      } else if (childRows.length > 0) {
        return {
          userType: 'child',
          isDeleted: true
        }
      }
      ;

      const [adminRows] = await db.execute(
        'SELECT 1 FROM AdminUser WHERE userid = ? LIMIT 1',
        [uuid]
      );

      if (adminRows.length > 0 && userRows.length === 0) {
        return 'admin';
      } else if (adminRows.length > 0) {
        return {
          userType: 'admin',
          isDeleted: true
        }
      }
      ;
    } catch (error) {
      console.error('Error determining user type:', error);
      throw new Error('Failed to determine user type');
    }
  }

  /**
   * Retrieves the hashed password for a user.
   */
  async getHashedPassword(uuid) {
    try {
      const [rows] = await db.execute(
        'SELECT password FROM User WHERE userid = ? AND isDeleted = FALSE LIMIT 1',
        [uuid]
      );

      return rows.length > 0 ? rows[0].password : null;
    } catch (error) {
      console.error('Error retrieving hashed password:', error);
      throw new Error('Failed to retrieve password');
    }
  }

  /**
   * Retrieves a user's profile information.
   */
  async getProfile(uuid) {
    try {
      const query = `
          SELECT u.username,
                 p.firstName,
                 p.lastName,
                 p.dob,
                 COALESCE(a.email, s.email, NULL) as email
          FROM User u
                   LEFT JOIN UserProfile p ON u.userid = p.userid
                   LEFT JOIN AdultUser a ON u.userid = a.userid
                   LEFT JOIN SystemUser s ON u.userid = s.userid
          WHERE u.userid = ?
            AND u.isDeleted = FALSE
          LIMIT 1
      `;

      const [rows] = await db.execute(query, [uuid]);

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error retrieving user profile:', error);
      throw new Error('Failed to retrieve user profile');
    }
  }

  /**
   * Retrieves the IDs of all children associated with an adult user.
   */
  async getChildrens(adultId) {
    try {
      const query = `
          SELECT c.childId
          FROM AdultChild c
                   JOIN User u ON c.childId = u.userid
          WHERE c.adultId = ?
            AND u.isDeleted = FALSE
      `;

      const [rows] = await db.execute(query, [adultId]);

      return rows.map(row => row.childId);
    } catch (error) {
      console.error('Error retrieving children:', error);
      throw new Error('Failed to retrieve children');
    }
  }

  /**
   * Retrieves information about a child user.
   */
  async getChildrenInfo(uuid) {
    try {
      const query = `
          SELECT is_locked           as isLocked,
                 can_upload_image    as canUploadImage,
                 daily_session_limit as dailySessionLimit,
                 complexity_level    as complexityLevel,
                 last_seen           as lastSeen
          FROM ChildUser
          WHERE userid = ?
          LIMIT 1
      `;

      const [rows] = await db.execute(query, [uuid]);

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error retrieving child info:', error);
      throw new Error('Failed to retrieve child information');
    }
  }

  /**
   * Retrieves a user ID by username.
   */
  async getUserIdByUsername(username) {
    try {
      const [rows] = await db.execute(
        'SELECT userid FROM User WHERE username = ? AND isDeleted = FALSE LIMIT 1',
        [username]
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error retrieving user by username:', error);
      throw new Error('Failed to retrieve user by username');
    }
  }

  /**
   * Retrieves a user by username.
   * @param {string} username - The username to search for
   * @returns {Object|null} User object if found, null otherwise
   */
  async getUserByUsername(username) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM User WHERE username = ? AND isDeleted = FALSE LIMIT 1',
        [username]
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error retrieving user by username:', error);
      throw new Error('Failed to retrieve user by username');
    }
  }

  /**
   * Retrieves all children associated with an adult user.
   */
  async getChildrenByAdultId(adultId) {
    try {
      const query = `
          SELECT u.userid,
                 u.username,
                 u.createdAt,
                 u.isDeleted,
                 c.is_locked,
                 c.can_upload_image,
                 c.daily_session_limit,
                 c.complexity_level,
                 c.last_seen
          FROM AdultChild ac
                   JOIN User u ON ac.childId = u.userid
                   JOIN ChildUser c ON u.userid = c.userid
          WHERE ac.adultId = ?
            AND u.isDeleted = FALSE
      `;

      const [rows] = await db.execute(query, [adultId]);

      // Transform the data to camelCase for consistency
      return rows.map(row => ({
        userId: row.userid,
        username: row.username,
        createdAt: row.createdAt,
        isDeleted: row.isDeleted,
        isLocked: Boolean(row.is_locked),
        canUploadImage: Boolean(row.can_upload_image),
        dailySessionLimit: row.daily_session_limit,
        complexityLevel: row.complexity_level,
        lastSeen: row.last_seen
      }));
    } catch (error) {
      console.error('Error retrieving children by adult ID:', error);
      throw new Error('Failed to retrieve children');
    }
  }

  /**
   * Retrieves detailed information about a child user.
   */
  async getChildDetailsByUserId(userId) {
    try {
      const query = `
          SELECT u.username,
                 u.userid,
                 c.is_locked,
                 c.can_upload_image,
                 c.daily_session_limit,
                 c.complexity_level,
                 c.last_seen
          FROM User u
                   JOIN ChildUser c ON u.userid = c.userid
          WHERE u.userid = ?
            AND u.isDeleted = FALSE
      `;

      const [rows] = await db.execute(query, [userId]);

      if (rows.length === 0) {
        return null;
      }

      // Transform to camelCase for consistency
      return {
        username: rows[0].username,
        userid: rows[0].userid,
        isLocked: Boolean(rows[0].is_locked),
        canUploadImage: Boolean(rows[0].can_upload_image),
        dailySessionLimit: rows[0].daily_session_limit,
        complexityLevel: rows[0].complexity_level,
        lastSeen: rows[0].last_seen
      };
    } catch (error) {
      console.error('Error retrieving child details:', error);
      throw new Error('Failed to retrieve child details');
    }
  }

  /**
   * Retrieves detailed information about a child user by username.
   */
  async getChildDetailsByUsername(username) {
    try {
      const query = `
          SELECT u.userid,
                 u.username,
                 c.is_locked,
                 c.can_upload_image,
                 c.daily_session_limit,
                 c.complexity_level,
                 c.last_seen
          FROM User u
                   JOIN ChildUser c ON u.userid = c.userid
          WHERE u.username = ?
            AND u.isDeleted = FALSE
      `;

      const [rows] = await db.execute(query, [username]);

      if (rows.length === 0) {
        return null;
      }

      // Transform to camelCase for consistency
      return {
        userId: rows[0].userid,
        username: rows[0].username,
        isLocked: Boolean(rows[0].is_locked),
        canUploadImage: Boolean(rows[0].can_upload_image),
        dailySessionLimit: rows[0].daily_session_limit,
        complexityLevel: rows[0].complexity_level,
        lastSeen: rows[0].last_seen
      };
    } catch (error) {
      console.error('Error retrieving child details by username:', error);
      throw new Error('Failed to retrieve child details');
    }


  }

  /**
   * Retrieves all users in the database.
   */
  async getAllUsers() {
    try {
      const query = 'SELECT * FROM User';
      const [users] = await db.execute(query);
      return users;
    } catch (error) {
      throw new Error('Error retrieving users from database');
    }

  }

  async getUserById(userId) {
    const trimmedId = userId.trim();
    const [rows] = await db.query(
      `SELECT userid, username, password, createdAt, isDeleted
       FROM User
       WHERE userid = ?`,
      [trimmedId]
    );

    if (rows.length === 0) {
      throw new Error(`User with ID ${trimmedId} not found`);
    }

    return rows[0];
  }

  async updateSuspension(userId, suspend) {
    const trimmedId = userId.trim();
    const [rows] = await db.query(
      `SELECT userid
       FROM User
       WHERE userid = ?`,
      [trimmedId]
    );
    if (rows.length === 0) {
      throw new Error(`User with ID ${trimmedId} not found`);
    }

    await db.query(
      `UPDATE User
       SET isDeleted = ?
       WHERE userid = ?`,
      [suspend, trimmedId]
    );

    return true;
  }

}

module.exports = new UserRepository();