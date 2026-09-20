const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'arhatpro_super_secure_jwt_secret_2026';

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Access token required. Please login.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Malformed authorization token.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    // View-Only Audit Impersonation Guard
    // If Super Admin is impersonating an agency, block all mutating requests (POST, PUT, DELETE)
    if (req.user.isImpersonating && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      // Exclude impersonation control endpoints
      if (!req.path.includes('/api/auth/impersonate')) {
        return res.status(403).json({
          error: '🔒 View-Only Audit Mode: Cannot modify or mutate data while impersonating an agency. Action blocked.',
          isImpersonating: true
        });
      }
    }

    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired session token. Please login again.' });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized: Insufficient permissions for this action.' });
    }
    next();
  };
}

module.exports = {
  authenticate,
  requireRole,
  JWT_SECRET
};
