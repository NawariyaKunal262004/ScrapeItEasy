// ─── ScrapeHistory Model ──────────────────────────────────────────────────────
// Keeps a log of every scraping job that was run.

const mongoose = require("mongoose");

const scrapeHistorySchema = new mongoose.Schema(
  {
    platform: { type: String, required: true },
    city: { type: String, required: true },
    category: { type: String, required: true },

    // How many leads were returned by the scraper
    totalScraped: { type: Number, default: 0 },

    // How many were actually saved (after removing duplicates)
    newlySaved: { type: Number, default: 0 },

    // "success" or "error"
    status: { type: String, default: "success" },

    // Error message if status is "error"
    errorMessage: { type: String, default: "" },

    // When this scrape ran
    ranAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ScrapeHistory", scrapeHistorySchema);
