/**
 * Kisan Saathi - Farmer Crop Intelligence Platform
 * Backend: Node.js + Express + MongoDB (Mongoose)
 *
 * Architecture decisions:
 * - Express over Fastify for wider ecosystem familiarity in Indian dev community
 * - MongoDB for flexible crop data schema (varies heavily by crop/region)
 * - JWT auth with phone OTP (no email dependency — many farmers lack email)
 * - Rate limiting per phone number to prevent abuse
 * - All API responses include both English + local language fields
 */

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");

// Route imports
const authRoutes = require("./routes/auth");
const cropRoutes = require("./routes/crops");
const communityRoutes = require("./routes/community");
const mandiRoutes = require("./routes/mandi");
const transportRoutes = require("./routes/transport");
const chatbotRoutes = require("./routes/chatbot");
const uploadRoutes = require("./routes/upload");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security & Middleware ─────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json({ limit: "5mb" })); // 5MB for image uploads
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined"));

// Global rate limiter — generous for rural users on slow connections
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: "Too many requests. Please wait and try again." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Strict limiter for auth routes (OTP abuse prevention)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { error: "Too many OTP requests. Try after 1 hour." },
});

// ── Database Connection ────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // Connection pool: keep low since many users on 2G/3G make short requests
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => {
  console.error("❌ MongoDB connection failed:", err.message);
  process.exit(1);
});

// ── Health Check ───────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/mandi", mandiRoutes);
app.use("/api/transport", transportRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/upload", uploadRoutes);

// ── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: "Validation failed", details: messages });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid token. Please login again." });
  }

  // Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "Image too large. Max 5MB allowed." });
  }

  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// ── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

app.listen(PORT, () => {
  console.log(`🌾 Kisan Saathi API running on port ${PORT}`);
});

module.exports = app;
