const bcrypt = require('bcrypt');
const UserRepository = require('../database/userRepository');
const ProfileRepository = require('../database/profileRepository');

class ProfileService {
  /**
   * Retrieves a user's profile by username.
   */
  async getProfileByUsername(username) {
    const userId = await UserRepository.getUserIdByUsername(username);

    if (!userId) {
      const error = new Error("User doesn't exist!");
      error.status = 404;
      throw error;
    }

    const profile = await ProfileRepository.getProfileByUserId(userId.userid);

    if (!profile) {
      const error = new Error("Profile not found!");
      error.status = 404;
      throw error;
    }

    return {
      username: profile.username,
      firstName: profile.firstName,
      lastName: profile.lastName,
      dob: profile.dob,
      email: profile.email
    };
  }

  /**
   * Updates an adult user's profile.
   */
  async updateAdultProfile(username, newUsername, firstName, lastName, dob, email, profilePic, oldPassword, newPassword) {
    const userId = await UserRepository.getUserIdByUsername(username);

    if (!userId) {
      const error = new Error("User not found.");
      error.status = 404;
      throw error;
    }

    // Check user type
    const userType = await UserRepository.userType(userId.userid);
    if (userType !== 'adult') {
      const error = new Error("This operation is only allowed for adult users.");
      error.status = 403;
      throw error;
    }

    // Check if new username is available
    if (username !== newUsername) {
      const usernameExists = await UserRepository.usernameExists(newUsername);
      if (usernameExists) {
        const error = new Error("New username is already taken.");
        error.status = 400;
        throw error;
      }
    }

    // Handle password change if requested
    if (oldPassword && newPassword) {
      await this._updatePassword(userId.userid, oldPassword, newPassword);
    }

    // Update username if changed
    if (username !== newUsername) {
      await ProfileRepository.updateUsername(userId.userid, newUsername);
    }

    // Update profile information
    await ProfileRepository.updateUserProfile(userId.userid, firstName, lastName, profilePic, dob);

    // Update email for adult user
    await ProfileRepository.updateAdultEmail(userId.userid, email);

    return true;
  }

  /**
   * Helper method to update a user's password.
   */
  async _updatePassword(userId, oldPassword, newPassword) {
    // Verify old password
    const currentPasswordHash = await UserRepository.getHashedPassword(userId);

    if (!currentPasswordHash) {
      const error = new Error("User not found.");
      error.status = 404;
      throw error;
    }

    const isMatch = await bcrypt.compare(oldPassword, currentPasswordHash);
    if (!isMatch) {
      const error = new Error("Incorrect old password");
      error.status = 400;
      throw error;
    }

    // Check password history
    const passwordHistory = await ProfileRepository.getPasswordHistory(userId);

    const passwordMatches = await Promise.all(
      passwordHistory.map(ph => bcrypt.compare(newPassword, ph.password))
    );

    const isReused = passwordMatches.some(match => match);
    if (isReused) {
      const error = new Error("Password recently used");
      error.status = 400;
      throw error;
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in User table
    await ProfileRepository.updatePassword(userId, hashedPassword);

    // Add to password history
    await UserRepository.updatePasswordHistory(userId, hashedPassword, 5);

    return true;
  }
}

module.exports = new ProfileService();