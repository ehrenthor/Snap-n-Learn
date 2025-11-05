const bcrypt = require('bcrypt');
const { v7: uuidv7 } = require('uuid');
const UserRepository = require('../database/userRepository');

class UserService {
  /**
   * Registers a new adult user in the system.
   */
  async registerAdult(username, firstName, lastName, dob, password, email) {
    const usernameExists = await UserRepository.usernameExists(username);
    if (usernameExists) {
      const error = new Error("Username is already taken.");
      error.status = 400;
      throw error;
    }

    const emailExists = await UserRepository.emailExists(email);
    if (emailExists) {
      const error = new Error("Email is already in use.");
      error.status = 400;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userId = await UserRepository.createAdultUser(username, hashedPassword, email);

    // Create the user profile
    await UserRepository.createUserProfile(userId, firstName, lastName, null, dob);

    return userId;
  }

  /**
   * Registers a new child user in the system and associates them with an adult.
   */
  async registerChild(username, firstName, lastName, dob, password, adultUsername) {
    const usernameExists = await UserRepository.usernameExists(username);
    if (usernameExists) {
      const error = new Error("Username is already taken.");
      error.status = 400;
      throw error;
    }

    // Get adult user ID from username
    const adultUser = await UserRepository.getUserIdByUsername(adultUsername);
    if (!adultUser) {
      const error = new Error("Adult user not found.");
      error.status = 404;
      throw error;
    }

    // Verify the adult is actually an adult user
    const userType = await UserRepository.userType(adultUser.userid);
    if (userType !== 'adult') {
      const error = new Error("Specified user is not an adult account.");
      error.status = 400;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const childId = await UserRepository.createChildUser(username, hashedPassword);

    // Associate child with adult
    await UserRepository.addChild(adultUser.userid, childId);

    return childId;
  }

  /**
   * Retrieves all children associated with an adult user by username.
   */
  async getChildrenByAdultUsername(username) {
    // Get adult user ID from username
    const adultUser = await UserRepository.getUserIdByUsername(username);
    if (!adultUser) {
      const error = new Error("Adult not found.");
      error.status = 404;
      throw error;
    }

    // Verify the user is actually an adult
    const userType = await UserRepository.userType(adultUser.userid);
    if (userType !== 'adult') {
      const error = new Error("Specified user is not an adult account.");
      error.status = 400;
      throw error;
    }

    // Get all children for this adult
    const children = await UserRepository.getChildrenByAdultId(adultUser.userid);
    return children;
  }

  /**
   * Retrieves detailed information about a child user by username.
   */
  async getChildDetailsByUsername(username) {
    // Get child user ID from username
    const childUser = await UserRepository.getUserIdByUsername(username);
    if (!childUser) {
      const error = new Error("Child not found.");
      error.status = 404;
      throw error;
    }

    // Verify the user is actually a child
    const userType = await UserRepository.userType(childUser.userid);
    if (userType !== 'child') {
      const error = new Error("Specified user is not a child account.");
      error.status = 400;
      throw error;
    }

    // Get child details
    const childDetails = await UserRepository.getChildDetailsByUserId(childUser.userid);
    if (!childDetails) {
      const error = new Error("Child details not found.");
      error.status = 404;
      throw error;
    }

    return childDetails;
  }

  /**
   * Verify the account is a valid child account.
   */
  async verifyChildLogin(username) {
    // Get child user ID from username
    const childUser = await UserRepository.getUserIdByUsername(username);
    if (!childUser) {
      const error = new Error("Child not found.");
      error.status = 404;
      throw error;
    }

    // Verify the user is actually a child
    const userType = await UserRepository.userType(childUser.userid);
    if (userType !== 'child') {
      const error = new Error("Specified user is not a child account.");
      error.status = 400;
      throw error;
    }
    
    const childDetails = await UserRepository.getChildDetailsByUserId(childUser.userid);
    if (!childDetails) {
      const error = new Error("Child details not found.");
      error.status = 404;
      throw error;
    }

      // Check if the child account is locked
    if (childDetails.isLocked) {
      const error = new Error("This account is locked. Please contact an administrator.");
      error.status = 403; // Forbidden
      throw error;
    }
    
    return childUser;
  }

  /**
   * Updates settings for a child user.
   */
  async updateChildSettings(username, isLocked, canUploadImage, dailySessionLimit, complexityLevel) {
    // Get child user ID from username
    const childUser = await UserRepository.getUserIdByUsername(username);
    if (!childUser) {
      const error = new Error("Child not found.");
      error.status = 404;
      throw error;
    }

    // Verify the user is actually a child
    const userType = await UserRepository.userType(childUser.userid);
    if (userType !== 'child') {
      const error = new Error("Specified user is not a child account.");
      error.status = 400;
      throw error;
    }

    // Convert and validate input values
    const isLockedBool = isLocked === true || isLocked === "true";
    const canUploadImageBool = canUploadImage === true || canUploadImage === "true";
    const dailySessionLimitNum = parseInt(dailySessionLimit, 10) || null;

    // Validate complexity level (0-4)
    let complexityLevelNum = parseInt(complexityLevel, 10) || 2;
    if (complexityLevelNum < 0) complexityLevelNum = 0;
    if (complexityLevelNum > 4) complexityLevelNum = 4;

    // Update child settings
    await UserRepository.updateChildInfo(
      childUser.userid,
      isLockedBool,
      canUploadImageBool,
      dailySessionLimitNum,
      complexityLevelNum
    );

    return true;
  }

  async getUserIdByUsername(username) {
    // Query the database to fetch the user ID by username
    const user = await UserRepository.getUserIdByUsername(username);
    if (!user) {
      const error = new Error("User not found.");
      error.status = 404;
      throw error;
    }

    return user.userid;  // Return the user ID
  }

  /**
   * Registers a new admin user in the system.
   */
  async registerAdmin(username, firstName, lastName, dob, password, email) {
    const usernameExists = await UserRepository.usernameExists(username);
    if (usernameExists) {
      const error = new Error("Username is already taken.");
      error.status = 400;
      throw error;
    }

    const emailExists = await UserRepository.emailExists(email);
    if (emailExists) {
      const error = new Error("Email is already in use.");
      error.status = 400;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userId = await UserRepository.createAdminUser(username, hashedPassword, email);

    // Create the user profile for the admin
    await UserRepository.updateUserProfile(userId, firstName, lastName, null, dob);

    return userId;
  }

  /**
   * Retrieves all children associated with an adult user by user ID.
   */
  async getChildrenByAdultId(adultId) {
    const children = await UserRepository.getChildrens(adultId);
    return children;
  }

 /**
   * Retrieves all users in the system.
   */
  async getAllUsers() {
    try {
      const allUsers = await UserRepository.getAllUsers();
      if (!allUsers) {
        const error = new Error("Users not found.");
        error.status = 404;
        throw error;
      }

      const usersWithType = await Promise.all(
        allUsers.map(async (user) => {
          const type = await UserRepository.userType(user.userid);
          const modifiedUser = { ...user.toObject?.() ?? user };
          modifiedUser.userType = type.isDeleted ? type.userType : type;
          return modifiedUser;
        })
      );
      return usersWithType;
    } catch (error) {
      throw new Error('Error retrieving users');
    }
  }

  /**
   * Retrieves detailed information about a user by userid.
   */
  async getUserbyId(userId) {
    const user = await UserRepository.getUserById(userId);
    if (!user) {
      const error = new Error("User not found.");
      error.status = 404;
      throw error;
    }

    const userType = await UserRepository.userType(userId);
    if (!userType) {
      const error = new Error("User not found.");
      error.status = 404;
      throw error;
    }

    return { user: user,
            userType: userType};
  }

  /**
   * Suspends or unsuspends a user.
   */
  async suspendUser(userId, suspend, userType) {
    if (userType === "Adult" && suspend) {
      const children = await UserRepository.getChildrenByAdultId(userId);

      await Promise.all(
        children.map(child => {
          if (!child.isDeleted) {
            return UserRepository.updateSuspension(child.userId, suspend);
          }
          return Promise.resolve();
        })
      );
    }

    await UserRepository.updateSuspension(userId, suspend);
    return true;
  }

  /**
   * Delete child account.
   */
  async deleteChild(username) {
    const childId = await UserRepository.getUserIdByUsername(username);
    if (!childId) {
      const error = new Error("Child not found.");
      error.status = 404;
      throw error;
    }

    await UserRepository.updateSuspension(childId.userid, true);

    return true;
  }
}

module.exports = new UserService();