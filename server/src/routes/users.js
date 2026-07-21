const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db/schema');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/users - admin only
router.get('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const result = await db.execute(
      `SELECT id, username, name, email, role, office, created_at, last_login FROM users ORDER BY created_at DESC`
    );
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/users - admin only
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { username, password, name, email, role, office } = req.body;
    if (!username || !password || !name || !role || !office) {
      return res.status(400).json({ error: 'All fields required' });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await db.execute({
      sql: `INSERT INTO users (username, password_hash, name, email, role, office) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [username, hash, name, email || null, role, office]
    });
    res.status(201).json({ user_id: Number(result.lastInsertRowid) });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Username already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/users/:id - admin only
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
    await db.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [req.params.id] });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
