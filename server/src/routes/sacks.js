const express = require("express");
const { db } = require("../db/schema");
const { authenticate, requireCairoOrAdmin } = require("../middleware/auth");
const { generateSackNumber } = require("../utils/generators");

const router = express.Router();

// GET /api/sacks
router.get("/", authenticate, async (req, res) => {
  try {
    const { status, destination } = req.query;
    let where = ["1=1"];
    let args = [];
    if (status) {
      where.push("s.status = ?");
      args.push(status);
    }
    if (destination) {
      where.push("s.destination = ?");
      args.push(destination);
    }

    const result = await db.execute({
      sql: `SELECT s.id, s.sack_number, s.destination, s.flight_batch, s.status, s.capacity, s.created_by, s.created_at, s.shipped_at, s.arrived_at, s.updated_at,
                   u.name as created_by_name,
                   COUNT(p.id) as parcel_count,
                   COALESCE(SUM(p.weight), 0) as total_weight,
                   COALESCE(SUM(p.declared_value), 0) as total_value
            FROM sacks s
            LEFT JOIN users u ON s.created_by = u.id
            LEFT JOIN parcels p ON p.sack_id = s.id
            WHERE ${where.join(" AND ")}
            GROUP BY s.id, s.sack_number, s.destination, s.flight_batch, s.status, s.capacity, s.created_by, s.created_at, s.shipped_at, s.arrived_at, s.updated_at, u.name
            ORDER BY s.created_at DESC`,
      args,
    });
    res.json({ sacks: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/sacks/:id
router.get("/:id", authenticate, async (req, res) => {
  try {
    const sackResult = await db.execute({
      sql: `SELECT s.id, s.sack_number, s.destination, s.flight_batch, s.status, s.capacity, s.created_by, s.created_at, s.shipped_at, s.arrived_at, s.updated_at,
                   u.name as created_by_name,
                   COUNT(p.id) as parcel_count,
                   COALESCE(SUM(p.weight), 0) as total_weight,
                   COALESCE(SUM(p.declared_value), 0) as total_value
            FROM sacks s
            LEFT JOIN users u ON s.created_by = u.id
            LEFT JOIN parcels p ON p.sack_id = s.id
            WHERE s.id = ?
            GROUP BY s.id, s.sack_number, s.destination, s.flight_batch, s.status, s.capacity, s.created_by, s.created_at, s.shipped_at, s.arrived_at, s.updated_at, u.name`,
      args: [req.params.id],
    });
    if (sackResult.rows.length === 0)
      return res.status(404).json({ error: "Sack not found" });

    const parcels = await db.execute({
      sql: `SELECT p.*, c.name as customer_name FROM parcels p
            JOIN customers c ON p.customer_id = c.id
            WHERE p.sack_id = ? ORDER BY p.created_at ASC`,
      args: [req.params.id],
    });

    res.json({ sack: sackResult.rows[0], parcels: parcels.rows });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/sacks - create sack
router.post("/", authenticate, requireCairoOrAdmin, async (req, res) => {
  try {
    const { destination, flight_batch, capacity } = req.body;
    if (!destination)
      return res.status(400).json({ error: "Destination is required" });

    const sack_number = await generateSackNumber(destination);
    const result = await db.execute({
      sql: `INSERT INTO sacks (sack_number, destination, flight_batch, capacity, created_by) VALUES (?, ?, ?, ?, ?)`,
      args: [
        sack_number,
        destination,
        flight_batch || null,
        capacity || 50,
        req.user.id,
      ],
    });

    res
      .status(201)
      .json({ sack_number, sack_id: Number(result.lastInsertRowid) });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/sacks/:id/status
router.patch("/:id/status", authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ["open", "closed", "shipped", "arrived", "cancelled"];
    if (!valid.includes(status))
      return res.status(400).json({ error: "Invalid status" });

    const extra = {};
    if (status === "shipped") extra.shipped_at = new Date().toISOString();
    if (status === "arrived") extra.arrived_at = new Date().toISOString();

    let setSql = `status = ?, updated_at = datetime('now')`;
    let args = [status];
    if (extra.shipped_at) {
      setSql += ", shipped_at = ?";
      args.push(extra.shipped_at);
    }
    if (extra.arrived_at) {
      setSql += ", arrived_at = ?";
      args.push(extra.arrived_at);
    }
    args.push(req.params.id);

    await db.execute({ sql: `UPDATE sacks SET ${setSql} WHERE id = ?`, args });

    // If shipped, update all packed parcels to shipped
    if (status === "shipped") {
      await db.execute({
        sql: `UPDATE parcels SET status = 'shipped', updated_at = datetime('now') WHERE sack_id = ? AND status = 'packed'`,
        args: [req.params.id],
      });
    }
    // If arrived, update all shipped parcels to arrived_destination
    if (status === "arrived") {
      await db.execute({
        sql: `UPDATE parcels SET status = 'arrived_destination', updated_at = datetime('now') WHERE sack_id = ? AND status = 'shipped'`,
        args: [req.params.id],
      });
    }

    res.json({ message: "Sack status updated", status });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Preview next sack number
router.get("/preview/next", authenticate, async (req, res) => {
  try {
    const { destination } = req.query;
    const sack_number = await generateSackNumber(destination || "Kano");
    res.json({ sack_number });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
