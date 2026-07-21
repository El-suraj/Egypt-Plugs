const express = require('express');
const { db } = require('../db/schema');
const { authenticate, requireRole } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();

// In-memory settings store (in production these would live in a settings table)
// We write them to a simple JSON via the DB for persistence
const DEFAULT_SETTINGS = {
  company: {
    name: 'Egypt Plugs Air Shipping Services',
    cairoPhone: '+20 123 456 7890',
    kanoPhone:  '+234 803 123 4567',
    abujaPhone: '+234 803 987 6543',
    email: 'info@egyptplugs.com',
    address: 'Cairo, Egypt',
  },
  shipping: {
    destinations: ['Kano', 'Abuja', 'Lagos'],
    parcelTypes: ['Personal Items', 'Electronics', 'Documents', 'Food Items', 'Clothing', 'Fragile Items'],
    paymentMethods: ['Cash', 'Bank Transfer', 'Mobile Money'],
    sackCapacity: 50,
    defaultCurrency: 'EGP',
  },
  notifications: {
    whatsappEnabled: false,
    sendOnCreate: true,
    sendOnShip: true,
    sendOnArrive: true,
    sendOnDeliver: true,
  },
  rates: {
    baseRatePerKg: 250,
    kanoRate: 250,
    abujaRate: 280,
    lagosRate: 300,
  }
};

// GET /api/settings — returns all app settings
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await db.execute(`SELECT value FROM audit_logs WHERE action = 'settings_store' ORDER BY created_at DESC LIMIT 1`);
    if (result.rows.length > 0) {
      try {
        return res.json(JSON.parse(result.rows[0].value));
      } catch {
        return res.json(DEFAULT_SETTINGS);
      }
    }
    res.json(DEFAULT_SETTINGS);
  } catch (err) {
    res.json(DEFAULT_SETTINGS);
  }
});

// PATCH /api/settings — update settings (admin only)
router.patch('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const newSettings = { ...DEFAULT_SETTINGS, ...req.body };
    // Persist in audit_logs as a simple key-value store (no extra table needed)
    await db.execute({
      sql: `INSERT INTO audit_logs (action, user_id, details) VALUES ('settings_store', ?, ?)`,
      args: [req.user.id, JSON.stringify(newSettings)]
    });
    res.json({ message: 'Settings updated', settings: newSettings });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/settings/destinations — just the destinations list
router.get('/destinations', authenticate, async (req, res) => {
  res.json({ destinations: DEFAULT_SETTINGS.shipping.destinations });
});

// GET /api/settings/parcel-types
router.get('/parcel-types', authenticate, async (req, res) => {
  res.json({ parcel_types: DEFAULT_SETTINGS.shipping.parcelTypes });
});

// GET /api/settings/rates — shipping rates per destination
router.get('/rates', authenticate, async (req, res) => {
  res.json({ rates: DEFAULT_SETTINGS.rates });
});

// GET /api/settings/users — all staff users (admin only)
router.get('/users', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const result = await db.execute(
      `SELECT id, username, name, email, role, office, created_at, last_login FROM users ORDER BY created_at ASC`
    );
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/settings/users — create staff user (admin only)
router.post('/users', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { username, password, name, email, role, office } = req.body;
    if (!username || !password || !name || !role || !office)
      return res.status(400).json({ error: 'username, password, name, role, office are required' });

    const validRoles = ['cairo_staff', 'kano_staff', 'abuja_staff', 'admin'];
    if (!validRoles.includes(role))
      return res.status(400).json({ error: `role must be one of: ${validRoles.join(', ')}` });

    const hash = await bcrypt.hash(password, 10);
    const result = await db.execute({
      sql: `INSERT INTO users (username, password_hash, name, email, role, office) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [username, hash, name, email || null, role, office]
    });

    await db.execute({
      sql: `INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details) VALUES (?, ?, ?, ?, ?)`,
      args: ['user_created', 'user', Number(result.lastInsertRowid), req.user.id, JSON.stringify({ username, role, office })]
    });

    res.status(201).json({ user_id: Number(result.lastInsertRowid), message: 'User created successfully' });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Username or email already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/settings/users/:id — update user (admin only)
router.patch('/users/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, role, office, password } = req.body;
    const updates = [];
    const args = [];

    if (name)   { updates.push('name = ?');   args.push(name); }
    if (email)  { updates.push('email = ?');  args.push(email); }
    if (role)   { updates.push('role = ?');   args.push(role); }
    if (office) { updates.push('office = ?'); args.push(office); }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updates.push('password_hash = ?');
      args.push(hash);
    }

    if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

    args.push(req.params.id);
    await db.execute({ sql: `UPDATE users SET ${updates.join(', ')} WHERE id = ?`, args });

    res.json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/settings/users/:id (admin only, cannot delete self)
router.delete('/users/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    if (Number(req.params.id) === req.user.id)
      return res.status(400).json({ error: 'Cannot delete your own account' });

    await db.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [req.params.id] });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/settings/profile — current user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT id, username, name, email, role, office, created_at, last_login FROM users WHERE id = ?`,
      args: [req.user.id]
    });
    res.json({ profile: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/settings/profile — update own profile
router.patch('/profile', authenticate, async (req, res) => {
  try {
    const { name, email } = req.body;
    await db.execute({
      sql: `UPDATE users SET name=COALESCE(?,name), email=COALESCE(?,email) WHERE id=?`,
      args: [name || null, email || null, req.user.id]
    });
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/settings/change-password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: 'currentPassword and newPassword are required' });
    if (newPassword.length < 6)
      return res.status(400).json({ error: 'New password must be at least 6 characters' });

    const result = await db.execute({ sql: 'SELECT password_hash FROM users WHERE id = ?', args: [req.user.id] });
    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

    const hash = await bcrypt.hash(newPassword, 10);
    await db.execute({ sql: 'UPDATE users SET password_hash = ? WHERE id = ?', args: [hash, req.user.id] });

    await db.execute({
      sql: `INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details) VALUES ('password_changed','user',?,?,?)`,
      args: [req.user.id, req.user.id, JSON.stringify({ changed_by: req.user.username })]
    });

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
