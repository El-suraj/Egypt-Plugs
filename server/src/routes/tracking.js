const express = require('express');
const { db } = require('../db/schema');

const router = express.Router();

const STATUS_LABELS = {
  received_cairo:     'Received in Cairo',
  packed:             'Packed in Sack',
  shipped:            'Shipped from Cairo',
  arrived_destination:'Arrived at Destination',
  out_for_delivery:   'Out for Delivery',
  delivered:          'Delivered',
  hold:               'On Hold',
  returned:           'Returned',
};

// GET /api/tracking/:tracking_id  — public, no auth
router.get('/:tracking_id', async (req, res) => {
  try {
    const id = req.params.tracking_id.toUpperCase().trim();

    const result = await db.execute({
      sql: `SELECT p.tracking_id, p.destination, p.status, p.receiver_name,
                   p.collector_name, p.parcel_type, p.quantity, p.weight,
                   p.created_at, p.updated_at
            FROM parcels p
            WHERE p.tracking_id = ?`,
      args: [id]
    });

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Parcel not found',
        message: `No parcel found with tracking number "${id}". Please check and try again.`
      });
    }

    const parcel = result.rows[0];

    const timeline = await db.execute({
      sql: `SELECT t.status, t.note, t.office, t.created_at
            FROM tracking_timeline t
            WHERE t.parcel_id = (SELECT id FROM parcels WHERE tracking_id = ?)
            ORDER BY t.created_at ASC`,
      args: [id]
    });

    // Format for public consumption — don't expose internal IDs
    const formattedTimeline = timeline.rows.map(t => ({
      status: t.status,
      label: STATUS_LABELS[t.status] || t.status,
      note: t.note,
      office: t.office,
      timestamp: t.created_at,
      done: true,
    }));

    // Add pending steps
    const allSteps = ['received_cairo', 'packed', 'shipped', 'arrived_destination', 'out_for_delivery', 'delivered'];
    const completedStatuses = new Set(formattedTimeline.map(t => t.status));
    const currentIdx = allSteps.indexOf(parcel.status);

    const fullTimeline = allSteps.map(step => {
      const completed = completedStatuses.has(step);
      const existing = formattedTimeline.find(t => t.status === step);
      return {
        status: step,
        label: STATUS_LABELS[step],
        note: existing?.note || null,
        office: existing?.office || null,
        timestamp: existing?.timestamp || null,
        done: completed,
        current: step === parcel.status && step !== 'delivered',
      };
    });

    res.json({
      tracking_id: parcel.tracking_id,
      destination: parcel.destination,
      status: parcel.status,
      status_label: STATUS_LABELS[parcel.status] || parcel.status,
      parcel_type: parcel.parcel_type,
      quantity: parcel.quantity,
      weight: parcel.weight,
      receiver_name: parcel.receiver_name,
      collector_name: parcel.status === 'delivered' ? parcel.collector_name : null,
      registered_at: parcel.created_at,
      last_updated: parcel.updated_at,
      timeline: fullTimeline,
      is_delivered: parcel.status === 'delivered',
      is_held: parcel.status === 'hold',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
