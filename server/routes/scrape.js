// ─── Scrape Route ─────────────────────────────────────────────────────────────
// POST /api/scrape
// Receives scraping parameters from the frontend,
// calls the JavaScript scraper, saves results to MongoDB.

const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { scrapePlatform } = require("../utils/scraper");

const Lead = require("../models/Lead");
const ScrapeHistory = require("../models/ScrapeHistory");

// Helper: build a unique hash from business name + phone
function buildHash(businessName, phone) {
  const raw = (businessName + phone).toLowerCase().replace(/\s+/g, "");
  return crypto.createHash("md5").update(raw).digest("hex");
}

// POST /api/scrape
router.post("/", async (req, res) => {
  const { platform, city, category } = req.body;

  // Basic validation
  if (!platform || !city || !category) {
    return res
      .status(400)
      .json({ error: "platform, city, and category are required." });
  }

  try {
    // Call the JavaScript scraper
    const leads = await scrapePlatform(platform, city, category);

    // Save each lead to MongoDB, skipping existing ones
    let savedCount = 0;
    for (const lead of leads) {
      // Skip records with no business name
      if (!lead.businessName) continue;

      const hash = buildHash(lead.businessName, lead.phone || "");

      // Check if this lead already exists
      const alreadyExists = await Lead.findOne({ uniqueHash: hash });
      if (alreadyExists) continue;

      try {
        await Lead.create({
          ...lead,
          uniqueHash: hash,
          scrapedDate: new Date(),
        });
        savedCount++;
      } catch (dbErr) {
        // Duplicate key — safe to skip
        if (dbErr.code === 11000) continue;
        console.error("DB insert error:", dbErr.message);
      }
    }

    // Log this scrape run
    await ScrapeHistory.create({
      platform,
      city,
      category,
      totalScraped: leads.length,
      newlySaved: savedCount,
      status: "success",
    });

    return res.json({
      message: "Scraping complete.",
      totalScraped: leads.length,
      newlySaved: savedCount,
    });
  } catch (error) {
    console.error("Scraping error:", error);

    await ScrapeHistory.create({
      platform,
      city,
      category,
      status: "error",
      errorMessage: error.message || "Unknown scraping error.",
    });

    return res.status(500).json({
      error: "Scraping failed.",
      details: error.message,
    });
  }
});

module.exports = router;
