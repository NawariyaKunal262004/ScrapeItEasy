const mongoose = require("mongoose");

// ─── Lead Verification Schema ─────────────────────────────────────────────────
// Stores verification results and cross-platform data for leads
const leadVerificationSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },
    // Cross-platform data
    sourcePlatforms: {
      type: [
        {
          platformId: mongoose.Schema.Types.ObjectId,
          platformName: String,
          data: mongoose.Schema.Types.Mixed,
          scrapedDate: Date,
        },
      ],
      default: [],
    },
    // Verification results
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "suspicious", "unverified"],
      default: "pending",
    },
    matchedFields: {
      type: Map,
      of: Number,
      description: "Field -> count of platforms where data matches",
    },
    accuracyScore: {
      type: Number,
      min: 0,
      max: 100,
      description: "Overall confidence in lead legitimacy",
    },
    verificationDetails: {
      type: String,
      description: "Human-readable verification result explanation",
    },
    // Flags
    flags: {
      type: [
        {
          type: String,
          enum: [
            "duplicate",
            "invalid_data",
            "suspicious_pattern",
            "requires_manual_review",
            "verified_legitimate",
          ],
        },
      ],
      default: [],
    },
    verifiedBy: mongoose.Schema.Types.ObjectId,
    organizationId: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true }
);

module.exports = mongoose.model("LeadVerification", leadVerificationSchema);
