/**
 * Verification Rules API Routes
 * ==============================
 * Manage data verification rules for cross-platform validation
 */

const express = require("express");
const router = express.Router();
const VerificationRule = require("../models/VerificationRule");
const Organization = require("../models/Organization");

// ─── GET All Verification Rules ────────────────────────────────────────────────
// GET /api/verification-rules
router.get("/", async (req, res) => {
  try {
    const { organizationId, isActive } = req.query;
    const filter = {};

    if (organizationId) filter.organizationId = organizationId;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const rules = await VerificationRule.find(filter)
      .populate("matchingPlatforms", "name description")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: rules.length,
      data: rules,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET Rule by ID ────────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const rule = await VerificationRule.findById(req.params.id).populate("matchingPlatforms");

    if (!rule) {
      return res.status(404).json({ success: false, error: "Rule not found" });
    }

    res.json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── CREATE New Verification Rule ──────────────────────────────────────────────
// POST /api/verification-rules
router.post("/", async (req, res) => {
  try {
    const {
      name,
      description,
      ruleType,
      fieldToMatch,
      requiredMatches,
      matchingPlatforms,
      confidenceWeight,
      customValidation,
      organizationId,
    } = req.body;

    if (!name || !ruleType) {
      return res.status(400).json({
        success: false,
        error: "Rule name and type are required",
      });
    }

    // Validate rule type
    const validTypes = ["match_across_platforms", "field_validation", "fuzzy_match", "custom"];
    if (!validTypes.includes(ruleType)) {
      return res.status(400).json({ success: false, error: "Invalid rule type" });
    }

    // If organizationId provided, verify it exists
    if (organizationId) {
      const org = await Organization.findById(organizationId);
      if (!org) {
        return res.status(400).json({ success: false, error: "Organization not found" });
      }
    }

    const rule = await VerificationRule.create({
      name,
      description,
      ruleType,
      fieldToMatch,
      requiredMatches,
      matchingPlatforms,
      confidenceWeight,
      customValidation,
      organizationId,
    });

    // Add rule to organization if provided
    if (organizationId) {
      await Organization.findByIdAndUpdate(
        organizationId,
        { $addToSet: { verificationRules: rule._id } },
        { new: true }
      );
    }

    res.status(201).json({
      success: true,
      message: "Verification rule created successfully",
      data: rule,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── UPDATE Verification Rule ─────────────────────────────────────────────────
// PUT /api/verification-rules/:id
router.put("/:id", async (req, res) => {
  try {
    const {
      name,
      description,
      ruleType,
      fieldToMatch,
      requiredMatches,
      matchingPlatforms,
      confidenceWeight,
      customValidation,
      isActive,
    } = req.body;

    const rule = await VerificationRule.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        ruleType,
        fieldToMatch,
        requiredMatches,
        matchingPlatforms,
        confidenceWeight,
        customValidation,
        isActive,
      },
      { new: true, runValidators: true }
    ).populate("matchingPlatforms");

    if (!rule) {
      return res.status(404).json({ success: false, error: "Rule not found" });
    }

    res.json({
      success: true,
      message: "Rule updated successfully",
      data: rule,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── DELETE Verification Rule ─────────────────────────────────────────────────
// DELETE /api/verification-rules/:id
router.delete("/:id", async (req, res) => {
  try {
    const rule = await VerificationRule.findByIdAndDelete(req.params.id);

    if (!rule) {
      return res.status(404).json({ success: false, error: "Rule not found" });
    }

    // Remove rule from all organizations
    await Organization.updateMany(
      { verificationRules: req.params.id },
      { $pull: { verificationRules: req.params.id } }
    );

    res.json({
      success: true,
      message: "Rule deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── TEST Verification Rule ────────────────────────────────────────────────────
// POST /api/verification-rules/:id/test
router.post("/:id/test", async (req, res) => {
  try {
    const { testData } = req.body;

    if (!testData) {
      return res.status(400).json({ success: false, error: "Test data is required" });
    }

    const rule = await VerificationRule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({ success: false, error: "Rule not found" });
    }

    // Test the rule with provided data
    let testResult = true;

    if (rule.ruleType === "match_across_platforms") {
      // Test if data matches across platforms
      const { platforms } = testData;
      if (!platforms || platforms.length < rule.requiredMatches) {
        testResult = false;
      }
    }

    res.json({
      success: true,
      message: "Rule test completed",
      testResult,
      rule,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
