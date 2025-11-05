const { isAuthenticated, getUserType } = require('./utils/jwtUtils');

/**
 * Configuration for public routes that don't require authentication.
 * Easily extendable by adding new paths to the array.
 */
const publicPaths = [
  '/',
  '/api/users/login',
  '/api/users/register',
  '/faq'
];

/**
 * Middleware to check if the current path is in the public paths list.
 * @param {string} path - The path to check
 * @returns {boolean} - Whether the path is public
 */
const isPublicPath = (path) => {
  return publicPaths.some(publicPath => {
    // Handle exact matches
    if (publicPath === path) return true;

    // Handle wildcard paths like '/api/public/*'
    if (publicPath.endsWith('*')) {
      const basePublicPath = publicPath.slice(0, -1);
      return path.startsWith(basePublicPath);
    }

    return false;
  });
};

/**
 * Middleware to protect routes that require authentication.
 * Allows public paths through without authentication.
 */
const requireAuth = (req, res, next) => {
  // Allow access to public paths without authentication
  if (isPublicPath(req.path)) {
    return next();
  }

  // Check if user is authenticated
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  next();
};

/**
 * Middleware factory to protect routes that require specific user types.
 * @param {string|string[]} allowedTypes - User type(s) allowed to access the route
 * @returns {Function} - Express middleware
 */
const requireRole = (allowedTypes) => {
  return (req, res, next) => {
    // Allow access to public paths without authentication
    if (isPublicPath(req.path)) {
      return next();
    }

    // Check if user is authenticated
    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user type from token
    const userType = getUserType(req);

    // Convert allowedTypes to array if it's a string
    const types = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];

    // Check if user type is allowed
    if (!types.includes(userType)) {
      return res.status(403).json({ error: 'You do not have permission to access this resource' });
    }

    next();
  };
};

module.exports = {
  publicPaths,
  isPublicPath,
  requireAuth,
  requireRole
};