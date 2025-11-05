const bcrypt = require('bcrypt');
const UserRepository = require('../database/userRepository');

class AuthService {
  /**
   * Authenticates a user by username and password.
   * @param {string} username - The username to authenticate
   * @param {string} password - The password to verify
   * @returns {Object} User information including userid, username, and userType
   * @throws {Error} If authentication fails
   */
  async authenticateUser(username, password) {
    // Get user by username
    const user = await UserRepository.getUserByUsername(username);

    if (!user) {
      const error = new Error("Invalid credentials!");
      error.status = 404;
      throw error;
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      const error = new Error("Invalid credentials!");
      error.status = 400;
      throw error;
    }

    // Determine user type
    const userType = await UserRepository.userType(user.userid);

    // Map repository user type to frontend-friendly format
    let formattedUserType;
    switch(userType) {
      case 'adult':
        formattedUserType = "Adult";
        break;
      case 'child':
        formattedUserType = "Child";
        break;
      case 'admin':
        formattedUserType = "Admin";
        break;
      default:
        formattedUserType = "Unknown";
    }

    // Update last seen timestamp if it's a child user
    if (userType === 'child') {
      await UserRepository.updateLastSeen(user.userid);
    }

    // Return user information
    return {
      userid: user.userid,
      username: user.username,
      userType: formattedUserType
    };
  }
}

module.exports = new AuthService();