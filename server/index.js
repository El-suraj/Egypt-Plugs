const path = require("path");
require("dotenv").config();
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const { initDB } = require("./src/db/schema");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const rawClientUrl = process.env.CLIENT_URL || "http://localhost:5173";
const allowedOrigins = rawClientUrl
  .split(",")
  .map((url) => url.trim().replace(/\/$/, ""));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/$/, "");
      if (
        allowedOrigins.includes(normalizedOrigin) ||
        allowedOrigins.includes("*") ||
        process.env.NODE_ENV !== "production"
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./src/routes/auth"));
app.use("/api/parcels", require("./src/routes/parcels"));
app.use("/api/sacks", require("./src/routes/sacks"));
app.use("/api/customers", require("./src/routes/customers"));
app.use("/api/payments", require("./src/routes/payments"));
app.use("/api/dashboard", require("./src/routes/dashboard"));
app.use("/api/users", require("./src/routes/users"));
app.use("/api/reports", require("./src/routes/reports"));
app.use("/api/settings", require("./src/routes/settings"));
app.use("/api/tracking", require("./src/routes/tracking"));

// Health check
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", time: new Date().toISOString(), version: "1.0.0" }),
);

// 404 handler - Express 5 syntax
app.use("/api/{*path}", (req, res) =>
  res.status(404).json({ error: "Route not found" }),
);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

async function start() {
  try {
    await initDB();
    console.log("✅ Database ready");
    app.listen(PORT, () => {
      console.log(`🚀 Egypt Plugs API → http://localhost:${PORT}`);
      console.log(`📋 Routes:`);
      console.log(`   POST   /api/auth/login`);
      console.log(`   GET    /api/auth/me`);
      console.log(`   GET    /api/parcels`);
      console.log(`   POST   /api/parcels`);
      console.log(`   GET    /api/parcels/:tracking_id`);
      console.log(`   PATCH  /api/parcels/:tracking_id/status`);
      console.log(`   PATCH  /api/parcels/:tracking_id/sack`);
      console.log(`   GET    /api/parcels/public/:tracking_id`);
      console.log(`   GET    /api/sacks`);
      console.log(`   POST   /api/sacks`);
      console.log(`   GET    /api/sacks/:id`);
      console.log(`   PATCH  /api/sacks/:id/status`);
      console.log(`   GET    /api/customers`);
      console.log(`   POST   /api/customers`);
      console.log(`   GET    /api/customers/:id`);
      console.log(`   PATCH  /api/customers/:id`);
      console.log(`   GET    /api/payments`);
      console.log(`   POST   /api/payments`);
      console.log(`   GET    /api/payments/stats`);
      console.log(`   GET    /api/payments/balances`);
      console.log(`   GET    /api/dashboard/stats`);
      console.log(`   GET    /api/dashboard/arrivals`);
      console.log(`   GET    /api/reports/...`);
      console.log(`   GET    /api/tracking/:tracking_id  (public)`);
      console.log(`   GET    /api/users`);
      console.log(`   POST   /api/users`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
