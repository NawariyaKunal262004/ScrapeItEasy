// ─── Leads Route ──────────────────────────────────────────────────────────────
// GET  /api/leads          – fetch all leads (with optional filters)
// DELETE /api/leads/:id    – delete a single lead

const express = require("express");
const router = express.Router();
const Lead = require("../models/Lead");

// GET /api/leads
// Supports query params: ?city=Jaipur&category=Restaurant&platform=JustDial
router.get("/", async (req, res) => {
  try {
    const filter = {};

    // Apply optional filters if provided
    if (req.query.city) filter.city = new RegExp(req.query.city, "i");
    if (req.query.category) filter.category = new RegExp(req.query.category, "i");
    if (req.query.platform) filter.sourcePlatform = new RegExp(req.query.platform, "i");

    // Return newest leads first
    const leads = await Lead.find(filter).sort({ scrapedDate: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/leads/:id
router.delete("/:id", async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ message: "Lead deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
