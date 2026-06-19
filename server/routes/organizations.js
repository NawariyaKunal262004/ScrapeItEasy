/**
 * Organization API Routes
 * ========================
 * Manage organizations and their configurations
 */

const express = require("express");
const router = express.Router();
const Organization = require("../models/Organization");
const Platform = require("../models/Platform");
const VerificationRule = require("../models/VerificationRule");

// ─── GET All Organizations ────────────────────────────────────────────────────
// GET /api/organizations
router.get("/", async (req, res) => {
  try {
    const { isActive } = req.query;
    const filter = {};

    if (isActive !== undefined) filter.isActive = isActive === "true";

    const orgs = await Organization.find(filter)
      .populate("enabledPlatforms", "name description")
      .populate("verificationRules", "name ruleType")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orgs.length,
      data: orgs,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET Organization by ID ────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id)
      .populate("enabledPlatforms")
      .populate("verificationRules");

    if (!org) {
      return res.status(404).json({ success: false, error: "Organization not found" });
    }

    res.json({ success: true, data: org });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── CREATE Organization ──────────────────────────────────────────────────────
// POST /api/organizations
router.post("/", async (req, res) => {
  try {
    const { name, description, adminEmail, enabledPlatforms, verificationRules, settings } = req.body;

    if (!name || !adminEmail) {
      return res.status(400).json({
        success: false,
        error: "Organization name and admin email are required",
      });
    }

    const org = await Organization.create({
      name,
      description,
      adminEmail,
      enabledPlatforms,
      verificationRules,
      settings,
    });

    res.status(201).json({
      success: true,
      message: "Organization created successfully",
      data: org,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── UPDATE Organization ──────────────────────────────────────────────────────
// PUT /api/organizations/:id
router.put("/:id", async (req, res) => {
  try {
    const { name, description, adminEmail, settings, isActive } = req.body;

    const org = await Organization.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        adminEmail,
        settings,
        isActive,
      },
      { new: true, runValidators: true }
    )
      .populate("enabledPlatforms")
      .populate("verificationRules");

    if (!org) {
      return res.status(404).json({ success: false, error: "Organization not found" });
    }

    res.json({
      success: true,
      message: "Organization updated successfully",
      data: org,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── ADD Platform to Organization ──────────────────────────────────────────────
// POST /api/organizations/:id/platforms
router.post("/:id/platforms", async (req, res) => {
  try {
    const { platformId } = req.body;

    if (!platformId) {
      return res.status(400).json({ success: false, error: "Platform ID is required" });
    }

    const org = await Organization.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { enabledPlatforms: platformId } },
      { new: true }
    ).populate("enabledPlatforms");

    if (!org) {
      return res.status(404).json({ success: false, error: "Organization not found" });
    }

    res.json({
      success: true,
      message: "Platform added to organization",
      data: org,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── REMOVE Platform from Organization ─────────────────────────────────────────
// DELETE /api/organizations/:id/platforms/:platformId
router.delete("/:id/platforms/:platformId", async (req, res) => {
  try {
    const org = await Organization.findByIdAndUpdate(
      req.params.id,
      { $pull: { enabledPlatforms: req.params.platformId } },
      { new: true }
    ).populate("enabledPlatforms");

    if (!org) {
      return res.status(404).json({ success: false, error: "Organization not found" });
    }

    res.json({
      success: true,
      message: "Platform removed from organization",
      data: org,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── ADD Verification Rule to Organization ────────────────────────────────────
// POST /api/organizations/:id/verification-rules
router.post("/:id/verification-rules", async (req, res) => {
  try {
    const { ruleId } = req.body;

    if (!ruleId) {
      return res.status(400).json({ success: false, error: "Rule ID is required" });
    }

    const org = await Organization.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { verificationRules: ruleId } },
      { new: true }
    ).populate("verificationRules");

    if (!org) {
      return res.status(404).json({ success: false, error: "Organization not found" });
    }

    res.json({
      success: true,
      message: "Verification rule added to organization",
      data: org,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── REMOVE Verification Rule from Organization ────────────────────────────────
// DELETE /api/organizations/:id/verification-rules/:ruleId
router.delete("/:id/verification-rules/:ruleId", async (req, res) => {
  try {
    const org = await Organization.findByIdAndUpdate(
      req.params.id,
      { $pull: { verificationRules: req.params.ruleId } },
      { new: true }
    ).populate("verificationRules");

    if (!org) {
      return res.status(404).json({ success: false, error: "Organization not found" });
    }

    res.json({
      success: true,
      message: "Verification rule removed from organization",
      data: org,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET Organization Settings ────────────────────────────────────────────────
// GET /api/organizations/:id/settings
router.get("/:id/settings", async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);

    if (!org) {
      return res.status(404).json({ success: false, error: "Organization not found" });
    }

    res.json({
      success: true,
      data: org.settings,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── UPDATE Organization Settings ─────────────────────────────────────────────
// PUT /api/organizations/:id/settings
router.put("/:id/settings", async (req, res) => {
  try {
    const { minAccuracyScoreForApproval, requireMultiplePlatformVerification, autoApproveHighConfidence, enableFuzzyMatching } = req.body;

    const org = await Organization.findByIdAndUpdate(
      req.params.id,
      {
        settings: {
          minAccuracyScoreForApproval,
          requireMultiplePlatformVerification,
          autoApproveHighConfidence,
          enableFuzzyMatching,
        },
      },
      { new: true }
    );

    if (!org) {
      return res.status(404).json({ success: false, error: "Organization not found" });
    }

    res.json({
      success: true,
      message: "Settings updated",
      data: org.settings,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
