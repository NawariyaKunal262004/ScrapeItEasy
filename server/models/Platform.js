const mongoose = require("mongoose");

// ─── Platform Schema ──────────────────────────────────────────────────────────
// Stores all available scraping platforms
const platformSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: String,
    url: String,
    category: {
      type: String,
      enum: ["directory", "classifieds", "maps", "social", "api", "custom"],
      default: "directory",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    scrapingMethod: {
      type: String,
      enum: ["web_scrape", "api", "manual", "import"],
      default: "web_scrape",
    },
    requiredFields: {
      type: [String],
      default: ["businessName", "phone", "email", "city"],
    },
    optionalFields: {
      type: [String],
      default: ["ownerName", "profileUrl", "address", "website"],
    },
    creditsPerScrape: {
      type: Number,
      default: 1,
    },
    rateLimit: {
      requestsPerHour: { type: Number, default: 100 },
      requestsPerDay: { type: Number, default: 1000 },
    },
    createdBy: mongoose.Schema.Types.ObjectId,
    organizationId: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Platform", platformSchema);
