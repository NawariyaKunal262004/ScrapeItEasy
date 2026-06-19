// ─── Scrape Route ─────────────────────────────────────────────────────────────
// POST /api/scrape
// Receives scraping parameters from the frontend,
// calls the Python scraper, saves results to MongoDB.

const express = require("express");
const router = express.Router();
const { spawn } = require("child_process"); // used to run the Python script
const path = require("path");
const crypto = require("crypto");

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

  // Path to the Python scraper script
  const pythonScript = path.join(
    __dirname,
    "../../python-scraper/scraper.py"
  );

  // Arguments passed to the Python script
  const args = [platform, city, category];

  let rawOutput = "";
  let errorOutput = "";

  // Spawn the Python process
  // "python3" might need to be "python" on Windows — see README
  const pythonProcess = spawn("python3", [pythonScript, ...args]);

  // Collect stdout (the JSON data from the scraper)
  pythonProcess.stdout.on("data", (data) => {
    rawOutput += data.toString();
  });

  // Collect stderr (error messages or debug logs)
  pythonProcess.stderr.on("data", (data) => {
    errorOutput += data.toString();
  });

  // When the Python process finishes
  pythonProcess.on("close", async (code) => {
    if (code !== 0) {
      // Python exited with an error
      console.error("Python scraper error:", errorOutput);

      await ScrapeHistory.create({
        platform,
        city,
        category,
        status: "error",
        errorMessage: errorOutput || "Unknown error from Python scraper.",
      });

      return res.status(500).json({
        error: "Scraping failed.",
        details: errorOutput,
      });
    }

    // Try to parse the JSON that Python returned
    let leads = [];
    try {
      leads = JSON.parse(rawOutput);
    } catch (parseError) {
      console.error("Failed to parse Python output:", rawOutput);
      return res
        .status(500)
        .json({ error: "Invalid JSON from scraper.", raw: rawOutput });
    }

    // Save each lead to MongoDB, skipping existing ones
    let savedCount = 0;
    for (const lead of leads) {
      // Skip records with no business name (already filtered in Python too)
      if (!lead.businessName) continue;

      const hash = buildHash(lead.businessName, lead.phone || "");

      // upsert=false means we skip if this hash already exists
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
  });
});

module.exports = router;
