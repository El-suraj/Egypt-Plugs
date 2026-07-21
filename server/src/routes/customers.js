const express = require("express");
const { db } = require("../db/schema");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// GET /api/customers
router.get("/", authenticate, async (req, res) => {
  try {
    const { search, status, type, city, limit = 20, offset = 0 } = req.query;
    let where = ["1=1"];
    let args = [];
    if (status) {
      where.push("c.status = ?");
      args.push(status);
    }
    if (type) {
      where.push("c.type = ?");
      args.push(type);
    }
    if (city) {
      where.push("c.city = ?");
      args.push(city);
    }
    if (search) {
      where.push("(c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)");
      args.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countArgs = [...args];
    args.push(Number(limit), Number(offset));

    const result = await db.execute({
      sql: `SELECT c.id, c.name, c.phone, c.email, c.whatsapp, c.city, c.type, c.status, c.balance, c.created_at, c.created_by,
                   COUNT(DISTINCT p.id) as total_shipments,
                   COALESCE(SUM(p.weight), 0) as total_weight,
                   COALESCE(SUM(p.total_amount), 0) as total_spent,
                   COALESCE(SUM(p.amount_paid), 0) as total_paid,
                   COALESCE(SUM(p.total_amount) - SUM(p.amount_paid), 0) as outstanding_balance,
                   MAX(p.created_at) as last_shipment_at
            FROM customers c
            LEFT JOIN parcels p ON p.customer_id = c.id
            WHERE ${where.join(" AND ")}
            GROUP BY c.id, c.name, c.phone, c.email, c.whatsapp, c.city, c.type, c.status, c.balance, c.created_at, c.created_by
            ORDER BY last_shipment_at DESC NULLS LAST
            LIMIT ? OFFSET ?`,
      args,
    });

    const countResult = await db.execute({
      sql: `SELECT COUNT(*) as total FROM customers c WHERE ${where.join(" AND ")}`,
      args: countArgs,
    });

    res.json({ customers: result.rows, total: countResult.rows[0].total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/customers/stats
router.get("/stats", authenticate, async (req, res) => {
  try {
    const total = (await db.execute("SELECT COUNT(*) as n FROM customers"))
      .rows[0].n;
    const active = (
      await db.execute(
        `SELECT COUNT(*) as n FROM customers WHERE status = 'Active'`,
      )
    ).rows[0].n;
    const vip = (
      await db.execute(`SELECT COUNT(*) as n FROM customers WHERE type = 'VIP'`)
    ).rows[0].n;
    const revenue = (
      await db.execute("SELECT COALESCE(SUM(total_amount),0) as n FROM parcels")
    ).rows[0].n;
    const thisMonth = (
      await db.execute(
        `SELECT COUNT(*) as n FROM customers WHERE created_at >= date('now','start of month')`,
      )
    ).rows[0].n;
    res.json({ total, active, vip, revenue, thisMonth });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/customers/:id
router.get("/:id", authenticate, async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT c.id, c.name, c.phone, c.email, c.whatsapp, c.city, c.type, c.status, c.balance, c.created_at, c.created_by,
                   COUNT(DISTINCT p.id) as total_shipments,
                   COALESCE(SUM(p.total_amount),0) as total_spent,
                   COALESCE(SUM(p.amount_paid),0) as total_paid
            FROM customers c LEFT JOIN parcels p ON p.customer_id = c.id
            WHERE c.id = ?
            GROUP BY c.id, c.name, c.phone, c.email, c.whatsapp, c.city, c.type, c.status, c.balance, c.created_at, c.created_by`,
      args: [req.params.id],
    });
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Customer not found" });

    const parcels = await db.execute({
      sql: `SELECT * FROM parcels WHERE customer_id = ? ORDER BY created_at DESC LIMIT 10`,
      args: [req.params.id],
    });
    const payments = await db.execute({
      sql: `SELECT * FROM payments WHERE customer_id = ? ORDER BY created_at DESC LIMIT 10`,
      args: [req.params.id],
    });
    res.json({
      customer: result.rows[0],
      parcels: parcels.rows,
      payments: payments.rows,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/customers
router.post("/", authenticate, async (req, res) => {
  try {
    const { name, phone, email, whatsapp, city, type } = req.body;
    if (!name || !phone)
      return res.status(400).json({ error: "Name and phone are required" });

    const result = await db.execute({
      sql: `INSERT INTO customers (name, phone, email, whatsapp, city, type, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        name,
        phone,
        email || null,
        whatsapp || phone,
        city || null,
        type || "New",
        req.user.id,
      ],
    });
    res.status(201).json({ customer_id: Number(result.lastInsertRowid) });
  } catch (err) {
    if (err.message?.includes("UNIQUE"))
      return res.status(409).json({ error: "Customer already exists" });
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/customers/:id
router.patch("/:id", authenticate, async (req, res) => {
  try {
    const { name, phone, email, city, type, status } = req.body;
    await db.execute({
      sql: `UPDATE customers SET name=COALESCE(?,name), phone=COALESCE(?,phone), email=COALESCE(?,email),
            city=COALESCE(?,city), type=COALESCE(?,type), status=COALESCE(?,status) WHERE id=?`,
      args: [
        name || null,
        phone || null,
        email || null,
        city || null,
        type || null,
        status || null,
        req.params.id,
      ],
    });
    res.json({ message: "Customer updated" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
