const { db } = require("./src/db/schema");

(async () => {
  try {
    const q1 = await db.execute({
      sql: "SELECT COALESCE(SUM(amount),0) as n FROM payments WHERE type='payment'",
      args: [],
    });
    console.log("q1", q1.rows[0]);

    const q2 = await db.execute({
      sql: "SELECT COALESCE(SUM(amount),0) as n FROM payments WHERE type='payment' AND created_at >= DATE_TRUNC('month', CURRENT_DATE)::date",
      args: [],
    });
    console.log("q2", q2.rows[0]);

    const q3 = await db.execute({
      sql: "SELECT COALESCE(SUM(total_amount - amount_paid),0) as n FROM parcels WHERE amount_paid < total_amount",
      args: [],
    });
    console.log("q3", q3.rows[0]);

    const q4 = await db.execute({
      sql: "SELECT COUNT(DISTINCT customer_id) as n FROM parcels WHERE amount_paid < total_amount",
      args: [],
    });
    console.log("q4", q4.rows[0]);

    const q5 = await db.execute({
      sql: "SELECT COUNT(*) as n FROM payments WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)::date",
      args: [],
    });
    console.log("q5", q5.rows[0]);

    const q6 = await db.execute({
      sql: "SELECT SUM(CASE WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at)) / 86400.0 <= 30 THEN (total_amount-amount_paid) ELSE 0 END) as d30, SUM(CASE WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at)) / 86400.0 BETWEEN 31 AND 60 THEN (total_amount-amount_paid) ELSE 0 END) as d60, SUM(CASE WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at)) / 86400.0 BETWEEN 61 AND 90 THEN (total_amount-amount_paid) ELSE 0 END) as d90, SUM(CASE WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at)) / 86400.0 > 90 THEN (total_amount-amount_paid) ELSE 0 END) as d90plus FROM parcels WHERE amount_paid < total_amount",
      args: [],
    });
    console.log("q6", q6.rows[0]);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
