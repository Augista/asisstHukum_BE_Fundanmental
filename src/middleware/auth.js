const jwt = require('jsonwebtoken');

// Authentication middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized - No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Contains: id, email, role
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Role-based authorization middleware factory
function authorizeRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Convert allowedRoles to array if string
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    // Convert to uppercase for case-insensitive comparison
    const userRole = req.user.role.toUpperCase();
    const normalizedRoles = roles.map(role => role.toUpperCase());

    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Forbidden - Insufficient permissions' });
    }

    next();
  };
}

// Export both middleware functions
module.exports = {
  authenticate,
  authMiddleware: authenticate, // Alias for backward compatibility
  authorizeRole
};
