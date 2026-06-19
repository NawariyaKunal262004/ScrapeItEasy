const mongoose = require("mongoose");

// ─── Verification Rule Schema ─────────────────────────────────────────────────
// Stores rules for cross-verifying data across multiple platforms
const verificationRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      example: "Phone Match Across 2 Platforms",
    },
    description: String,
    ruleType: {
      type: String,
      enum: ["match_across_platforms", "field_validation", "fuzzy_match", "custom"],
      required: true,
    },
    // For "match_across_platforms" rules
    fieldToMatch: {
      type: String,
      example: "phone",
      enum: ["businessName", "phone", "email", "ownerName", "address"],
    },
    requiredMatches: {
      type: Number,
      default: 2,
      description: "Number of platforms that must have matching data",
    },
    matchingPlatforms: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Platform",
      description: "Which platforms to check for matches",
    },
    // Accuracy scoring
    confidenceWeight: {
      type: Number,
      default: 1,
      min: 0,
      max: 10,
      description: "How much this rule affects confidence score",
    },
    // Custom validation function
    customValidation: {
      type: String,
      description: "JavaScript function for custom validation logic",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    organizationId: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true }
);

module.exports = mongoose.model("VerificationRule", verificationRuleSchema);
