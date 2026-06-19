// ─── History Route ────────────────────────────────────────────────────────────
// GET /api/history – returns all past scrape runs

const express = require("express");
const router = express.Router();
const ScrapeHistory = require("../models/ScrapeHistory");

// GET /api/history
router.get("/", async (req, res) => {
  try {
    // Most recent runs first, limit to last 50
    const history = await ScrapeHistory.find()
      .sort({ ranAt: -1 })
      .limit(50);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
