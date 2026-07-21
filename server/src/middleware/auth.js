const jwt = require('jsonwebtoken');
const { db } = require('../db/schema');

const JWT_SECRET = process.env.JWT_SECRET || 'egypt-plugs-secret-2025';

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await db.execute({
      sql: 'SELECT id, username, name, email, role, office FROM users WHERE id = ?',
      args: [decoded.userId]
    });
    if (result.rows.length === 0) return res.status(401).json({ error: 'User not found' });
    req.user = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

function requireCairoOrAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (!['cairo_staff', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Only Cairo staff can perform this action' });
  }
  next();
}

module.exports = { authenticate, requireRole, requireCairoOrAdmin, JWT_SECRET };
