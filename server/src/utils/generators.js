const { db } = require('../db/schema');

// Format: KNO-250521-0042  (DEST-YYMMDD-SERIAL)
async function generateTrackingId(destination) {
  const prefixMap = { Kano: 'KNO', Abuja: 'ABJ', Lagos: 'LGS' };
  const prefix = prefixMap[destination] || 'GEN';
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateStr = `${yy}${mm}${dd}`;

  const pattern = `${prefix}-${dateStr}-%`;
  const result = await db.execute({
    sql: `SELECT tracking_id FROM parcels WHERE tracking_id LIKE ? ORDER BY id DESC LIMIT 1`,
    args: [pattern]
  });

  let serial = 1;
  if (result.rows.length > 0) {
    const last = result.rows[0].tracking_id;
    const lastSerial = parseInt(last.split('-')[2], 10);
    serial = lastSerial + 1;
  }

  return `${prefix}-${dateStr}-${String(serial).padStart(4, '0')}`;
}

// Format: SACK-KNO-250521-08
async function generateSackNumber(destination) {
  const prefixMap = { Kano: 'KNO', Abuja: 'ABJ', Lagos: 'LGS' };
  const prefix = prefixMap[destination] || 'GEN';
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateStr = `${yy}${mm}${dd}`;

  const pattern = `SACK-${prefix}-${dateStr}-%`;
  const result = await db.execute({
    sql: `SELECT sack_number FROM sacks WHERE sack_number LIKE ? ORDER BY id DESC LIMIT 1`,
    args: [pattern]
  });

  let serial = 1;
  if (result.rows.length > 0) {
    const last = result.rows[0].sack_number;
    const parts = last.split('-');
    serial = parseInt(parts[parts.length - 1], 10) + 1;
  }

  return `SACK-${prefix}-${dateStr}-${String(serial).padStart(2, '0')}`;
}

module.exports = { generateTrackingId, generateSackNumber };
