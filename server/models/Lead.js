// ─── Lead Model ───────────────────────────────────────────────────────────────
// Defines the shape of a single business lead stored in MongoDB.

const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    // Business details
    businessName: { type: String, required: true, trim: true },
    ownerName: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    category: { type: String, trim: true, default: "" },
    sourcePlatform: { type: String, trim: true, default: "" },
    profileUrl: { type: String, trim: true, default: "" },

    // Unique hash to prevent duplicate records.
    // Created from: businessName + phone (lowercased and stripped of spaces).
    uniqueHash: { type: String, required: true, unique: true },

    // When this record was scraped
    scrapedDate: { type: Date, default: Date.now },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

module.exports = mongoose.model("Lead", leadSchema);
