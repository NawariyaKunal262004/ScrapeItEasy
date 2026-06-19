// ─── ScrapeItEasy – Express Server Entry Point ───────────────────────────────
// This file starts the server, connects to MongoDB, and registers all routes.

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const leadsRouter = require("./routes/leads");
const scrapeRouter = require("./routes/scrape");
const exportRouter = require("./routes/export");
const historyRouter = require("./routes/history");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

// ── Serve static files from client/dist ────────────────────────────────────────
const clientDistPath = path.join(__dirname, "../client/dist");
app.use(express.static(clientDistPath));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/leads", leadsRouter);
app.use("/api/scrape", scrapeRouter);
app.use("/api/export", exportRouter);
app.use("/api/history", historyRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "ScrapeItEasy server is running." });
});

// ── Fallback to client for client-side routing ─────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

// ── Connect to MongoDB, then start server ─────────────────────────────────────
console.log("Mongo URI:", process.env.MONGODB_URI);
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/scrapeiteasy")
  .then(() => {
    console.log("Connected to MongoDB.");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
