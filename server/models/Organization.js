const mongoose = require("mongoose");

// ─── Organization Schema ──────────────────────────────────────────────────────
// Stores organization-level settings and configurations
const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: String,
    adminEmail: {
      type: String,
      required: true,
    },
    // Platforms this org uses
    enabledPlatforms: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Platform",
      default: [],
    },
    // Verification rules this org uses
    verificationRules: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "VerificationRule",
      default: [],
    },
    // Settings
    settings: {
      minAccuracyScoreForApproval: { type: Number, default: 70 },
      requireMultiplePlatformVerification: { type: Boolean, default: true },
      autoApproveHighConfidence: { type: Boolean, default: false },
      enableFuzzyMatching: { type: Boolean, default: true },
    },
    // Usage tracking
    totalLeadsScraped: { type: Number, default: 0 },
    totalLeadsVerified: { type: Number, default: 0 },
    creditsUsed: { type: Number, default: 0 },
    members: {
      type: [
        {
          userId: mongoose.Schema.Types.ObjectId,
          email: String,
          role: { type: String, enum: ["admin", "editor", "viewer"], default: "viewer" },
        },
      ],
      default: [],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Organization", organizationSchema);
