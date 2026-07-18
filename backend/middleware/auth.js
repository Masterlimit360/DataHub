const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'jb_datahub_super_secret_key_change_me_in_prod';

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token missing or invalid format.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    console.error('[Auth Middleware] Token verification failed:', error.message);
    return res.status(401).json({ error: 'Session expired or token invalid. Please log in again.' });
  }
}

module.exports = {
  requireAdmin,
  JWT_SECRET
};
