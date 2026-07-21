const express = require("express");
const { db } = require("../db/schema");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// GET /api/payments
router.get("/", authenticate, async (req, res) => {
  try {
    const { customer_id, type, limit = 30, offset = 0 } = req.query;
    let where = ["1=1"];
    let args = [];
    if (customer_id) {
      where.push("pay.customer_id = ?");
      args.push(customer_id);
    }
    if (type) {
      where.push("pay.type = ?");
      args.push(type);
    }
    const countArgs = [...args];
    args.push(Number(limit), Number(offset));

    const result = await db.execute({
      sql: `SELECT pay.*, c.name as customer_name, p.tracking_id, u.name as recorded_by_name
            FROM payments pay
            JOIN customers c ON pay.customer_id = c.id
            LEFT JOIN parcels p ON pay.parcel_id = p.id
            LEFT JOIN users u ON pay.recorded_by = u.id
            WHERE ${where.join(" AND ")}
            ORDER BY pay.created_at DESC
            LIMIT ? OFFSET ?`,
      args,
    });
    const countResult = await db.execute({
      sql: `SELECT COUNT(*) as total FROM payments pay WHERE ${where.join(" AND ")}`,
      args: countArgs,
    });
    res.json({ payments: result.rows, total: countResult.rows[0].total });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/payments/stats
router.get("/stats", authenticate, async (req, res) => {
  try {
    const revenue = (
      await db.execute(
        `SELECT COALESCE(SUM(amount),0) as n FROM payments WHERE type='payment'`,
      )
    ).rows[0].n;
    const thisMonth = (
      await db.execute(
        `SELECT COALESCE(SUM(amount),0) as n FROM payments WHERE type='payment' AND created_at >= DATE_TRUNC('month', CURRENT_DATE)::date`,
      )
    ).rows[0].n;
    const outstanding = (
      await db.execute(
        `SELECT COALESCE(SUM(total_amount - amount_paid),0) as n FROM parcels WHERE amount_paid < total_amount`,
      )
    ).rows[0].n;
    const customersWithBalance = (
      await db.execute(
        `SELECT COUNT(DISTINCT customer_id) as n FROM parcels WHERE amount_paid < total_amount`,
      )
    ).rows[0].n;
    const txCount = (
      await db.execute(
        `SELECT COUNT(*) as n FROM payments WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)::date`,
      )
    ).rows[0].n;
    const aging = await db.execute(`
      SELECT
        SUM(CASE WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at)) / 86400.0 <= 30 THEN (total_amount-amount_paid) ELSE 0 END) as d30,
        SUM(CASE WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at)) / 86400.0 BETWEEN 31 AND 60 THEN (total_amount-amount_paid) ELSE 0 END) as d60,
        SUM(CASE WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at)) / 86400.0 BETWEEN 61 AND 90 THEN (total_amount-amount_paid) ELSE 0 END) as d90,
        SUM(CASE WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at)) / 86400.0 > 90 THEN (total_amount-amount_paid) ELSE 0 END) as d90plus
      FROM parcels WHERE amount_paid < total_amount
    `);
    res.json({
      revenue,
      thisMonth,
      outstanding,
      customersWithBalance,
      txCount,
      aging: aging.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/payments - record a payment
router.post("/", authenticate, async (req, res) => {
  try {
    const { customer_id, parcel_id, amount, payment_method, type, notes } =
      req.body;
    if (!customer_id || !amount)
      return res.status(400).json({ error: "Customer and amount required" });

    const result = await db.execute({
      sql: `INSERT INTO payments (customer_id, parcel_id, amount, payment_method, type, notes, recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        customer_id,
        parcel_id || null,
        parseFloat(amount),
        payment_method || "Cash",
        type || "payment",
        notes || null,
        req.user.id,
      ],
    });

    // Update parcel amount_paid if parcel_id given
    if (parcel_id) {
      await db.execute({
        sql: `UPDATE parcels SET amount_paid = amount_paid + ? WHERE id = ?`,
        args: [parseFloat(amount), parcel_id],
      });
    }

    res.status(201).json({ payment_id: Number(result.lastInsertRowid) });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/payments/balances - customer balance summary
router.get("/balances", authenticate, async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT c.id, c.name, c.phone, c.city,
             COUNT(DISTINCT p.id) as total_shipments,
             COALESCE(SUM(p.total_amount),0) as total_spent,
             COALESCE(SUM(p.amount_paid),0) as total_paid,
             COALESCE(SUM(p.total_amount) - SUM(p.amount_paid), 0) as balance,
             CASE
               WHEN COALESCE(SUM(p.total_amount) - SUM(p.amount_paid), 0) = 0 THEN 'Paid'
               WHEN COALESCE(SUM(p.amount_paid), 0) = 0 THEN 'Unpaid'
               ELSE 'Partial'
             END as payment_status
      FROM customers c
      LEFT JOIN parcels p ON p.customer_id = c.id
      GROUP BY c.id, c.name, c.phone, c.city
      ORDER BY balance DESC
    `);
    res.json({ balances: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
