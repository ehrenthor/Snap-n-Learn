const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Utility functions for working with JWT tokens in the application.
 * Provides methods to extract user information from tokens and validate
 * authentication state without duplicating token parsing logic across
 * multiple routes.
 */

/**
 * Generates a JWT token with user information.
 * @param {string} userid - The user's ID
 * @param {string} username - The user's username
 * @param {string} userType - The user's type (Adult, Child, System Admin)
 * @returns {string} JWT token
 */
const generateToken = (userid, username, userType) => {
  return jwt.sign(
    { userid, username, userType },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

/**
 * Extracts the user ID from a JWT token.
 * @param {Object} req - Express request object containing the JWT token in cookies
 * @returns {string|null} The user ID if token is valid, null otherwise
 */
const getUserId = (req) => {
  try {
    const token = req.cookies.token;
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userid;
  } catch (error) {
    console.error('Error extracting user ID from token:', error.message);
    return null;
  }
};

/**
 * Extracts the user type from a JWT token.
 * @param {Object} req - Express request object containing the JWT token in cookies
 * @returns {string|null} The user type if token is valid, null otherwise
 */
const getUserType = (req) => {
  try {
    const token = req.cookies.token;
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userType;
  } catch (error) {
    console.error('Error extracting user type from token:', error.message);
    return null;
  }
};

/**
 * Extracts the username from a JWT token.
 * @param {Object} req - Express request object containing the JWT token in cookies
 * @returns {string|null} The username if token is valid, null otherwise
 */
const getUsername = (req) => {
  try {
    const token = req.cookies.token;
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.username;
  } catch (error) {
    console.error('Error extracting username from token:', error.message);
    return null;
  }
};

/**
 * Checks if the request has a valid JWT token.
 * @param {Object} req - Express request object containing the JWT token in cookies
 * @returns {boolean} True if the token is valid, false otherwise
 */
const isAuthenticated = (req) => {
  try {
    const token = req.cookies.token;
    if (!token) return false;

    jwt.verify(token, process.env.JWT_SECRET);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Creates a middleware function that checks if the user has a specific type.
 * @param {string|string[]} allowedTypes - User type(s) that are allowed to access the route
 * @returns {Function} Express middleware function
 */
const requireUserType = (allowedTypes) => {
  return (req, res, next) => {
    try {
      const token = req.cookies.token;
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userType = decoded.userType;

      // Check if user type is allowed
      const types = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];
      if (!types.includes(userType)) {
        return res.status(403).json({ error: 'Unauthorized access' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
};

/**
 * Middleware that requires authentication for a route.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireAuth = (req, res, next) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

module.exports = {
  generateToken,
  getUserId,
  getUserType,
  getUsername,
  isAuthenticated,
  requireUserType,
  requireAuth
};