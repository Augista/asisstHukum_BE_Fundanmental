const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/response');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return errorResponse(res, 401, 'No token provided', 'NO_TOKEN');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Token has expired', 'TOKEN_EXPIRED');
    }
    if (err.name === 'JsonWebTokenError') {
      return errorResponse(res, 401, 'Invalid token', 'INVALID_TOKEN');
    }
    return errorResponse(res, 401, 'Authentication failed', 'AUTH_FAILED');
  }
}

function authorizeRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, 'Unauthorized', 'UNAUTHORIZED');
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    const userRole = req.user.role.toUpperCase();
    const normalizedRoles = roles.map(role => role.toUpperCase());

    if (!normalizedRoles.includes(userRole)) {
      return errorResponse(res, 403, 'Insufficient permissions', 'FORBIDDEN');
    }

    next();
  };
}

module.exports = {
  authenticate,
  authMiddleware: authenticate,
  authorizeRole
};

