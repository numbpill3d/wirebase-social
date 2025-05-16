/**
 * Authentication helper functions for Wirebase
 * Provides middleware and utility functions for authentication
 */

/**
 * Middleware to ensure user is authenticated
 * Redirects to login page if not authenticated
 */
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }

  req.session.returnTo = req.originalUrl;
  res.redirect('/users/login');
};

/**
 * Middleware to ensure user has a specific role
 * @param {string} role - The required role
 */
const ensureRole = (role) => {
  return (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === role) {
      return next();
    }
    
    res.status(403).render('error', {
      title: 'Access Denied',
      errorCode: 403,
      message: 'You do not have permission to access this resource.'
    });
  };
};

/**
 * Middleware to ensure API authentication
 * For API routes that require authentication
 */
const ensureApiAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json({
    success: false,
    message: 'Authentication required'
  });
};

module.exports = {
  ensureAuthenticated,
  ensureRole,
  ensureApiAuth
};
