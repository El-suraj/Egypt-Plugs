const express = require('express');
const { db } = require('../db/schema');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [parcelsToday, weightToday, pending, awaitingPickup, revenueToday] = await Promise.all([
      db.execute({ sql: `SELECT COUNT(*) as n FROM parcels WHERE date(created_at)=date('now')`, args: [] }),
      db.execute({ sql: `SELECT COALESCE(SUM(weight),0) as n FROM parcels WHERE date(created_at)=date('now')`, args: [] }),
      db.execute({ sql: `SELECT COUNT(*) as n FROM parcels WHERE status IN ('received_cairo','packed')`, args: [] }),
      db.execute({ sql: `SELECT COUNT(*) as n FROM parcels WHERE status = 'arrived_destination'`, args: [] }),
      db.execute({ sql: `SELECT COALESCE(SUM(amount),0) as n FROM payments WHERE date(created_at)=date('now') AND type='payment'`, args: [] }),
    ]);

    // Yesterday comparison
    const [parcelYest, weightYest, revenueYest] = await Promise.all([
      db.execute({ sql: `SELECT COUNT(*) as n FROM parcels WHERE date(created_at)=date('now','-1 day')`, args: [] }),
      db.execute({ sql: `SELECT COALESCE(SUM(weight),0) as n FROM parcels WHERE date(created_at)=date('now','-1 day')`, args: [] }),
      db.execute({ sql: `SELECT COALESCE(SUM(amount),0) as n FROM payments WHERE date(created_at)=date('now','-1 day') AND type='payment'`, args: [] }),
    ]);

    // Destinations
    const destinations = await db.execute({
      sql: `SELECT destination, COUNT(*) as count FROM parcels WHERE date(created_at)=date('now') GROUP BY destination ORDER BY count DESC`,
      args: []
    });

    // Recent activity
    const activity = await db.execute({
      sql: `SELECT 'parcel' as type, p.tracking_id as ref, p.status as status, p.created_at as created_at, c.name as customer_name, u.name as staff_name
            FROM parcels p JOIN customers c ON p.customer_id=c.id LEFT JOIN users u ON p.created_by=u.id
            ORDER BY p.created_at DESC LIMIT 10`,
      args: []
    });

    const pct = (a, b) => b === 0 ? 0 : Math.round(((a - b) / b) * 100);

    res.json({
      parcelsToday: parcelsToday.rows[0].n,
      weightToday: weightToday.rows[0].n,
      pendingShipments: pending.rows[0].n,
      awaitingPickup: awaitingPickup.rows[0].n,
      revenueToday: revenueToday.rows[0].n,
      changes: {
        parcels: pct(parcelsToday.rows[0].n, parcelYest.rows[0].n),
        weight: pct(weightToday.rows[0].n, weightYest.rows[0].n),
        revenue: pct(revenueToday.rows[0].n, revenueYest.rows[0].n),
      },
      destinations: destinations.rows,
      activity: activity.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/dashboard/arrivals - for Kano/Abuja offices
router.get('/arrivals', authenticate, async (req, res) => {
  try {
    const office = req.user.office;
    const dest = office === 'Cairo' ? null : office;

    let destFilter = dest ? 'AND p.destination = ?' : '';
    let args = dest ? [dest] : [];

    const arrived = await db.execute({
      sql: `SELECT p.*, c.name as customer_name, s.sack_number FROM parcels p
            JOIN customers c ON p.customer_id = c.id
            LEFT JOIN sacks s ON p.sack_id = s.id
            WHERE p.status = 'arrived_destination' ${destFilter}
            ORDER BY p.updated_at DESC`,
      args
    });

    const outForDelivery = await db.execute({
      sql: `SELECT p.*, c.name as customer_name FROM parcels p
            JOIN customers c ON p.customer_id = c.id
            WHERE p.status = 'out_for_delivery' ${destFilter}
            ORDER BY p.updated_at DESC`,
      args
    });

    const deliveredToday = await db.execute({
      sql: `SELECT COUNT(*) as n FROM parcels p WHERE p.status = 'delivered' AND date(p.updated_at) = date('now') ${destFilter}`,
      args
    });

    res.json({
      arrived: arrived.rows,
      outForDelivery: outForDelivery.rows,
      deliveredToday: deliveredToday.rows[0].n,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
