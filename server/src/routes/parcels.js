const express = require('express');
const multer = require('multer');
const path = require('path');
const { db } = require('../db/schema');
const { authenticate, requireCairoOrAdmin } = require('../middleware/auth');
const { generateTrackingId } = require('../utils/generators');

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `parcel_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/parcels - list with filters
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, destination, search, sack_id, limit = 50, offset = 0 } = req.query;
    let where = ['1=1'];
    let args = [];

    if (status) { where.push('p.status = ?'); args.push(status); }
    if (destination) { where.push('p.destination = ?'); args.push(destination); }
    if (sack_id) { where.push('p.sack_id = ?'); args.push(sack_id); }
    if (search) {
      where.push('(p.tracking_id LIKE ? OR c.name LIKE ? OR p.receiver_name LIKE ?)');
      args.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const sql = `
      SELECT p.*, c.name as customer_name, c.phone as customer_phone,
             u1.name as created_by_name, u2.name as updated_by_name,
             s.sack_number
      FROM parcels p
      JOIN customers c ON p.customer_id = c.id
      LEFT JOIN users u1 ON p.created_by = u1.id
      LEFT JOIN users u2 ON p.updated_by = u2.id
      LEFT JOIN sacks s ON p.sack_id = s.id
      WHERE ${where.join(' AND ')}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;
    args.push(Number(limit), Number(offset));

    const result = await db.execute({ sql, args });
    const countResult = await db.execute({
      sql: `SELECT COUNT(*) as total FROM parcels p JOIN customers c ON p.customer_id = c.id WHERE ${where.slice(0, -2).join(' AND ') || '1=1'}`,
      args: args.slice(0, -2)
    });

    res.json({ parcels: result.rows, total: countResult.rows[0]?.total || result.rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/parcels/:tracking_id
router.get('/:tracking_id', authenticate, async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT p.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
                   u1.name as created_by_name, u2.name as updated_by_name, s.sack_number
            FROM parcels p
            JOIN customers c ON p.customer_id = c.id
            LEFT JOIN users u1 ON p.created_by = u1.id
            LEFT JOIN users u2 ON p.updated_by = u2.id
            LEFT JOIN sacks s ON p.sack_id = s.id
            WHERE p.tracking_id = ?`,
      args: [req.params.tracking_id]
    });
    if (result.rows.length === 0) return res.status(404).json({ error: 'Parcel not found' });

    const parcel = result.rows[0];

    // Get timeline
    const timeline = await db.execute({
      sql: `SELECT t.*, u.name as updated_by_name FROM tracking_timeline t
            LEFT JOIN users u ON t.updated_by = u.id
            WHERE t.parcel_id = ? ORDER BY t.created_at ASC`,
      args: [parcel.id]
    });

    // Get photos
    const photos = await db.execute({
      sql: `SELECT * FROM parcel_photos WHERE parcel_id = ? ORDER BY uploaded_at DESC`,
      args: [parcel.id]
    });

    res.json({ parcel, timeline: timeline.rows, photos: photos.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/parcels - create new shipment (Cairo staff only)
router.post('/', authenticate, requireCairoOrAdmin, upload.array('photos', 5), async (req, res) => {
  try {
    const {
      customer_id, receiver_name, receiver_phone, destination,
      parcel_type, quantity, weight, declared_value, description,
      notes, total_amount, amount_paid, payment_method
    } = req.body;

    if (!customer_id || !receiver_name || !receiver_phone || !destination || !parcel_type || !weight) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const tracking_id = await generateTrackingId(destination);
    const paid = parseFloat(amount_paid) || 0;
    const total = parseFloat(total_amount) || 0;

    const result = await db.execute({
      sql: `INSERT INTO parcels (tracking_id, customer_id, receiver_name, receiver_phone, destination,
              parcel_type, quantity, weight, declared_value, description, notes,
              total_amount, amount_paid, payment_method, status, created_by, updated_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'received_cairo', ?, ?)`,
      args: [tracking_id, customer_id, receiver_name, receiver_phone, destination,
             parcel_type, quantity || 1, weight, declared_value || 0, description || null,
             notes || null, total, paid, payment_method || 'Cash',
             req.user.id, req.user.id]
    });

    const parcelId = Number(result.lastInsertRowid);

    // Add first timeline event
    await db.execute({
      sql: `INSERT INTO tracking_timeline (parcel_id, status, note, office, updated_by) VALUES (?, ?, ?, ?, ?)`,
      args: [parcelId, 'received_cairo', 'Parcel registered and payment confirmed', req.user.office, req.user.id]
    });

    // Record payment if paid
    if (paid > 0) {
      await db.execute({
        sql: `INSERT INTO payments (customer_id, parcel_id, amount, payment_method, type, recorded_by) VALUES (?, ?, ?, ?, 'payment', ?)`,
        args: [customer_id, parcelId, paid, payment_method || 'Cash', req.user.id]
      });
    }

    // Save uploaded photos
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await db.execute({
          sql: `INSERT INTO parcel_photos (parcel_id, file_url, file_type, uploaded_by) VALUES (?, ?, 'item_photo', ?)`,
          args: [parcelId, `/uploads/${file.filename}`, req.user.id]
        });
      }
    }

    // Audit log
    await db.execute({
      sql: `INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`,
      args: ['parcel_created', 'parcel', parcelId, req.user.id, JSON.stringify({ tracking_id }), req.ip]
    });

    res.status(201).json({ tracking_id, parcel_id: parcelId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/parcels/:tracking_id/status - update status
router.patch('/:tracking_id/status', authenticate, async (req, res) => {
  try {
    const { status, note, collector_name } = req.body;

    const validTransitions = {
      cairo_staff: ['packed', 'shipped', 'hold', 'returned'],
      kano_staff: ['arrived_destination', 'out_for_delivery', 'delivered', 'hold', 'returned'],
      abuja_staff: ['arrived_destination', 'out_for_delivery', 'delivered', 'hold', 'returned'],
      admin: ['received_cairo', 'packed', 'shipped', 'arrived_destination', 'out_for_delivery', 'delivered', 'hold', 'returned'],
    };

    const allowed = validTransitions[req.user.role] || [];
    if (!allowed.includes(status)) {
      return res.status(403).json({ error: `Your role cannot set status to "${status}"` });
    }

    const parcelResult = await db.execute({
      sql: 'SELECT * FROM parcels WHERE tracking_id = ?',
      args: [req.params.tracking_id]
    });
    if (parcelResult.rows.length === 0) return res.status(404).json({ error: 'Parcel not found' });

    const parcel = parcelResult.rows[0];
    const updates = { status, updated_by: req.user.id };
    if (status === 'delivered' && collector_name) updates.collector_name = collector_name;

    await db.execute({
      sql: `UPDATE parcels SET status = ?, updated_by = ?, updated_at = datetime('now')${status === 'delivered' && collector_name ? ', collector_name = ?' : ''} WHERE tracking_id = ?`,
      args: status === 'delivered' && collector_name
        ? [status, req.user.id, collector_name, req.params.tracking_id]
        : [status, req.user.id, req.params.tracking_id]
    });

    const statusLabels = {
      packed: 'Packed in sack',
      shipped: 'Sack departed via Air',
      arrived_destination: `Arrived at ${parcel.destination} office`,
      out_for_delivery: 'Out for delivery',
      delivered: `Delivered to ${collector_name || parcel.receiver_name}`,
      hold: 'Parcel placed on hold',
      returned: 'Parcel returned',
    };

    await db.execute({
      sql: `INSERT INTO tracking_timeline (parcel_id, status, note, office, updated_by) VALUES (?, ?, ?, ?, ?)`,
      args: [parcel.id, status, note || statusLabels[status] || status, req.user.office, req.user.id]
    });

    await db.execute({
      sql: `INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`,
      args: ['status_updated', 'parcel', parcel.id, req.user.id, JSON.stringify({ tracking_id: req.params.tracking_id, status }), req.ip]
    });

    res.json({ message: 'Status updated', tracking_id: req.params.tracking_id, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/parcels/:tracking_id/sack - assign to sack
router.patch('/:tracking_id/sack', authenticate, requireCairoOrAdmin, async (req, res) => {
  try {
    const { sack_id } = req.body;
    const sackResult = await db.execute({ sql: 'SELECT * FROM sacks WHERE id = ?', args: [sack_id] });
    if (sackResult.rows.length === 0) return res.status(404).json({ error: 'Sack not found' });
    if (sackResult.rows[0].status !== 'open') return res.status(400).json({ error: 'Sack is not open' });

    await db.execute({
      sql: `UPDATE parcels SET sack_id = ?, status = 'packed', updated_by = ?, updated_at = datetime('now') WHERE tracking_id = ?`,
      args: [sack_id, req.user.id, req.params.tracking_id]
    });

    const parcel = (await db.execute({ sql: 'SELECT id FROM parcels WHERE tracking_id = ?', args: [req.params.tracking_id] })).rows[0];
    await db.execute({
      sql: `INSERT INTO tracking_timeline (parcel_id, status, note, office, updated_by) VALUES (?, 'packed', ?, ?, ?)`,
      args: [parcel.id, `Packed in sack ${sackResult.rows[0].sack_number}`, req.user.office, req.user.id]
    });

    res.json({ message: 'Parcel added to sack' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Public tracking - no auth required
router.get('/public/:tracking_id', async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT p.tracking_id, p.destination, p.status, p.receiver_name, p.collector_name, p.created_at, p.updated_at
            FROM parcels p WHERE p.tracking_id = ?`,
      args: [req.params.tracking_id]
    });
    if (result.rows.length === 0) return res.status(404).json({ error: 'Parcel not found' });

    const timeline = await db.execute({
      sql: `SELECT status, note, office, created_at FROM tracking_timeline WHERE parcel_id = (SELECT id FROM parcels WHERE tracking_id = ?) ORDER BY created_at ASC`,
      args: [req.params.tracking_id]
    });

    res.json({ parcel: result.rows[0], timeline: timeline.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
