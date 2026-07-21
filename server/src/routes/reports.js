const express = require("express");
const { db } = require("../db/schema");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

// ── GET /api/reports/summary ─────────────────────────────────────────────
// High-level KPIs for a date range (default: this month)
router.get("/summary", authenticate, async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFrom =
      from ||
      new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0];
    const dateTo = to || new Date().toISOString().split("T")[0];

    const [parcels, weight, revenue, customers, delivered, pending] =
      await Promise.all([
        db.execute({
          sql: `SELECT COUNT(*) as n FROM parcels WHERE date(created_at) BETWEEN ? AND ?`,
          args: [dateFrom, dateTo],
        }),
        db.execute({
          sql: `SELECT COALESCE(SUM(weight),0) as n FROM parcels WHERE date(created_at) BETWEEN ? AND ?`,
          args: [dateFrom, dateTo],
        }),
        db.execute({
          sql: `SELECT COALESCE(SUM(amount),0) as n FROM payments WHERE type='payment' AND date(created_at) BETWEEN ? AND ?`,
          args: [dateFrom, dateTo],
        }),
        db.execute({
          sql: `SELECT COUNT(DISTINCT customer_id) as n FROM parcels WHERE date(created_at) BETWEEN ? AND ?`,
          args: [dateFrom, dateTo],
        }),
        db.execute({
          sql: `SELECT COUNT(*) as n FROM parcels WHERE status='delivered' AND date(updated_at) BETWEEN ? AND ?`,
          args: [dateFrom, dateTo],
        }),
        db.execute({
          sql: `SELECT COUNT(*) as n FROM parcels WHERE status IN ('received_cairo','packed','shipped') AND date(created_at) BETWEEN ? AND ?`,
          args: [dateFrom, dateTo],
        }),
      ]);

    res.json({
      period: { from: dateFrom, to: dateTo },
      totalParcels: parcels.rows[0].n,
      totalWeight: weight.rows[0].n,
      totalRevenue: revenue.rows[0].n,
      uniqueCustomers: customers.rows[0].n,
      delivered: delivered.rows[0].n,
      pending: pending.rows[0].n,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/reports/shipments-by-day ────────────────────────────────────
router.get("/shipments-by-day", authenticate, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const result = await db.execute({
      sql: `SELECT date(created_at) as day, COUNT(*) as parcels, COALESCE(SUM(weight),0) as weight
            FROM parcels
            WHERE created_at >= date('now', ? || ' days')
            GROUP BY date(created_at)
            ORDER BY day ASC`,
      args: [`-${days}`],
    });
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/reports/revenue-by-day ──────────────────────────────────────
router.get("/revenue-by-day", authenticate, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const result = await db.execute({
      sql: `SELECT date(created_at) as day, COALESCE(SUM(amount),0) as revenue, COUNT(*) as transactions
            FROM payments
            WHERE type = 'payment' AND created_at >= date('now', ? || ' days')
            GROUP BY date(created_at)
            ORDER BY day ASC`,
      args: [`-${days}`],
    });
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/reports/by-destination ──────────────────────────────────────
router.get("/by-destination", authenticate, async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFrom =
      from ||
      new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0];
    const dateTo = to || new Date().toISOString().split("T")[0];

    const result = await db.execute({
      sql: `SELECT destination,
                   COUNT(*) as parcels,
                   COALESCE(SUM(weight),0) as weight,
                   COALESCE(SUM(total_amount),0) as revenue,
                   COALESCE(SUM(amount_paid),0) as collected,
                   SUM(CASE WHEN status='delivered' THEN 1 ELSE 0 END) as delivered,
                   SUM(CASE WHEN status='hold' THEN 1 ELSE 0 END) as on_hold
            FROM parcels
            WHERE date(created_at) BETWEEN ? AND ?
            GROUP BY destination
            ORDER BY parcels DESC`,
      args: [dateFrom, dateTo],
    });
    res.json({ data: result.rows, period: { from: dateFrom, to: dateTo } });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/reports/by-status ────────────────────────────────────────────
router.get("/by-status", authenticate, async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT status,
             COUNT(*) as count,
             COALESCE(SUM(weight),0) as weight,
             COALESCE(SUM(total_amount),0) as value
      FROM parcels
      GROUP BY status
      ORDER BY count DESC
    `);
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/reports/by-parcel-type ──────────────────────────────────────
router.get("/by-parcel-type", authenticate, async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFrom =
      from ||
      new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0];
    const dateTo = to || new Date().toISOString().split("T")[0];

    const result = await db.execute({
      sql: `SELECT parcel_type,
                   COUNT(*) as count,
                   COALESCE(SUM(weight),0) as weight,
                   COALESCE(SUM(total_amount),0) as revenue
            FROM parcels
            WHERE date(created_at) BETWEEN ? AND ?
            GROUP BY parcel_type
            ORDER BY count DESC`,
      args: [dateFrom, dateTo],
    });
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/reports/top-customers ────────────────────────────────────────
router.get("/top-customers", authenticate, async (req, res) => {
  try {
    const { limit = 10, from, to } = req.query;
    const dateFrom =
      from ||
      new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0];
    const dateTo = to || new Date().toISOString().split("T")[0];

    const result = await db.execute({
      sql: `SELECT c.id, c.name, c.phone, c.city, c.type,
                   COUNT(p.id) as shipments,
                   COALESCE(SUM(p.weight),0) as total_weight,
                   COALESCE(SUM(p.total_amount),0) as total_spent,
                   COALESCE(SUM(p.amount_paid),0) as total_paid,
                   COALESCE(SUM(p.total_amount) - SUM(p.amount_paid), 0) as outstanding
            FROM customers c
            JOIN parcels p ON p.customer_id = c.id
            WHERE date(p.created_at) BETWEEN ? AND ?
            GROUP BY c.id, c.name, c.phone, c.city, c.type
            ORDER BY total_spent DESC
            LIMIT ?`,
      args: [dateFrom, dateTo, Number(limit)],
    });
    res.json({ data: result.rows, period: { from: dateFrom, to: dateTo } });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/reports/staff-performance ────────────────────────────────────
router.get(
  "/staff-performance",
  authenticate,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { from, to } = req.query;
      const dateFrom =
        from ||
        new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          .toISOString()
          .split("T")[0];
      const dateTo = to || new Date().toISOString().split("T")[0];

      const result = await db.execute({
        sql: `SELECT u.id, u.name, u.office, u.role,
                   COUNT(DISTINCT p.id) as parcels_created,
                   COALESCE(SUM(p.total_amount),0) as revenue_generated,
                   COUNT(DISTINCT pay.id) as payments_recorded,
                   COALESCE(SUM(pay.amount),0) as payments_collected
            FROM users u
            LEFT JOIN parcels p ON p.created_by = u.id AND date(p.created_at) BETWEEN ? AND ?
            LEFT JOIN payments pay ON pay.recorded_by = u.id AND date(pay.created_at) BETWEEN ? AND ?
            WHERE u.role != 'admin' OR 1=1
            GROUP BY u.id, u.name, u.office, u.role
            ORDER BY parcels_created DESC`,
        args: [dateFrom, dateTo, dateFrom, dateTo],
      });
      res.json({ data: result.rows, period: { from: dateFrom, to: dateTo } });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  },
);

// ── GET /api/reports/sack-manifest/:sack_id ──────────────────────────────
router.get("/sack-manifest/:sack_id", authenticate, async (req, res) => {
  try {
    const sackResult = await db.execute({
      sql: `SELECT s.*, u.name as created_by_name FROM sacks s LEFT JOIN users u ON s.created_by = u.id WHERE s.id = ?`,
      args: [req.params.sack_id],
    });
    if (sackResult.rows.length === 0)
      return res.status(404).json({ error: "Sack not found" });

    const parcels = await db.execute({
      sql: `SELECT p.tracking_id, p.receiver_name, p.receiver_phone, p.destination,
                   p.parcel_type, p.quantity, p.weight, p.declared_value,
                   p.total_amount, p.amount_paid, p.status, p.description,
                   c.name as customer_name, c.phone as customer_phone
            FROM parcels p
            JOIN customers c ON p.customer_id = c.id
            WHERE p.sack_id = ?
            ORDER BY p.id ASC`,
      args: [req.params.sack_id],
    });

    const totals = parcels.rows.reduce(
      (acc, p) => ({
        count: acc.count + 1,
        weight: acc.weight + Number(p.weight),
        value: acc.value + Number(p.declared_value),
        amount: acc.amount + Number(p.total_amount),
      }),
      { count: 0, weight: 0, value: 0, amount: 0 },
    );

    res.json({ sack: sackResult.rows[0], parcels: parcels.rows, totals });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/reports/outstanding-balances ────────────────────────────────
router.get("/outstanding-balances", authenticate, async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT c.id, c.name, c.phone, c.city,
             COUNT(DISTINCT p.id) as parcels_with_balance,
             COALESCE(SUM(p.total_amount - p.amount_paid), 0) as outstanding,
             MIN(p.created_at) as oldest_date,
             MAX(p.created_at) as newest_date
      FROM customers c
      JOIN parcels p ON p.customer_id = c.id
      WHERE p.amount_paid < p.total_amount AND p.total_amount > 0
      GROUP BY c.id, c.name, c.phone, c.city
      HAVING SUM(p.total_amount - p.amount_paid) > 0
      ORDER BY outstanding DESC
    `);
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/reports/delivery-performance ────────────────────────────────
router.get("/delivery-performance", authenticate, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    // Average days from received_cairo to delivered per destination
    const result = await db.execute({
      sql: `SELECT p.destination,
                   COUNT(*) as total_delivered,
                   ROUND(AVG(julianday(p.updated_at) - julianday(p.created_at)), 1) as avg_days_to_deliver
            FROM parcels p
            WHERE p.status = 'delivered'
              AND p.created_at >= date('now', ? || ' days')
            GROUP BY p.destination`,
      args: [`-${days}`],
    });

    const statusBreakdown = await db.execute({
      sql: `SELECT status, COUNT(*) as count
            FROM parcels
            WHERE created_at >= date('now', ? || ' days')
            GROUP BY status`,
      args: [`-${days}`],
    });

    res.json({
      performance: result.rows,
      statusBreakdown: statusBreakdown.rows,
      period_days: days,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/reports/audit-log ────────────────────────────────────────────
router.get(
  "/audit-log",
  authenticate,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { limit = 50, offset = 0, user_id, action } = req.query;
      let where = ["1=1"];
      let args = [];
      if (user_id) {
        where.push("a.user_id = ?");
        args.push(user_id);
      }
      if (action) {
        where.push("a.action = ?");
        args.push(action);
      }
      args.push(Number(limit), Number(offset));

      const result = await db.execute({
        sql: `SELECT a.*, u.name as user_name, u.office
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE ${where.join(" AND ")}
            ORDER BY a.created_at DESC
            LIMIT ? OFFSET ?`,
        args,
      });
      res.json({ logs: result.rows });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  },
);

module.exports = router;
