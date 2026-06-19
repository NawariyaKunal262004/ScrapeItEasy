/**
 * Lead Verification API Routes
 * =============================
 * Verify lead data across multiple platforms
 */

const express = require("express");
const router = express.Router();
const Lead = require("../models/Lead");
const LeadVerification = require("../models/LeadVerification");
const VerificationRule = require("../models/VerificationRule");
const Organization = require("../models/Organization");
const verificationService = require("../services/verificationService");

// ─── VERIFY Lead Against Organization Rules ────────────────────────────────────
// POST /api/lead-verification/:leadId/verify
router.post("/:leadId/verify", async (req, res) => {
  try {
    const { organizationId } = req.body;

    // Get the lead
    const lead = await Lead.findById(req.params.leadId);
    if (!lead) {
      return res.status(404).json({ success: false, error: "Lead not found" });
    }

    // Get organization and its verification rules
    const org = await Organization.findById(organizationId).populate("verificationRules");
    if (!org) {
      return res.status(404).json({ success: false, error: "Organization not found" });
    }

    // Perform verification
    const verificationResult = await verificationService.verifyLeadAcrossPllatforms(
      lead._id,
      lead,
      lead.sourcePlatforms || [],
      org.verificationRules
    );

    // Save verification result
    const verification = await LeadVerification.findOneAndUpdate(
      { leadId: lead._id, organizationId },
      {
        ...verificationResult,
        leadId: lead._id,
        organizationId,
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: "Lead verified",
      data: verification,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET Verification Result ──────────────────────────────────────────────────
// GET /api/lead-verification/:leadId
router.get("/:leadId", async (req, res) => {
  try {
    const { organizationId } = req.query;

    const filter = { leadId: req.params.leadId };
    if (organizationId) filter.organizationId = organizationId;

    const verification = await LeadVerification.findOne(filter).populate("leadId");

    if (!verification) {
      return res.status(404).json({ success: false, error: "Verification not found" });
    }

    res.json({ success: true, data: verification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── BATCH Verify Leads ────────────────────────────────────────────────────────
// POST /api/lead-verification/batch
router.post("/batch", async (req, res) => {
  try {
    const { leadIds, organizationId } = req.body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ success: false, error: "Lead IDs array is required" });
    }

    if (!organizationId) {
      return res.status(400).json({ success: false, error: "Organization ID is required" });
    }

    // Get leads
    const leads = await Lead.find({ _id: { $in: leadIds } });

    // Get organization and its verification rules
    const org = await Organization.findById(organizationId).populate("verificationRules");
    if (!org) {
      return res.status(404).json({ success: false, error: "Organization not found" });
    }

    // Verify each lead
    const results = [];
    for (const lead of leads) {
      const verificationResult = await verificationService.verifyLeadAcrossPllatforms(
        lead._id,
        lead,
        lead.sourcePlatforms || [],
        org.verificationRules
      );

      const verification = await LeadVerification.findOneAndUpdate(
        { leadId: lead._id, organizationId },
        {
          ...verificationResult,
          leadId: lead._id,
          organizationId,
        },
        { upsert: true, new: true }
      );

      results.push(verification);
    }

    res.json({
      success: true,
      message: `${results.length} leads verified`,
      data: results,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET Verification Statistics ──────────────────────────────────────────────
// GET /api/lead-verification/stats/:organizationId
router.get("/stats/:organizationId", async (req, res) => {
  try {
    const verifications = await LeadVerification.find({
      organizationId: req.params.organizationId,
    });

    const stats = {
      total: verifications.length,
      verified: verifications.filter((v) => v.verificationStatus === "verified").length,
      suspicious: verifications.filter((v) => v.verificationStatus === "suspicious").length,
      unverified: verifications.filter((v) => v.verificationStatus === "unverified").length,
      averageAccuracy: Math.round(
        verifications.reduce((sum, v) => sum + (v.accuracyScore || 0), 0) / (verifications.length || 1)
      ),
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET Verifications by Status ───────────────────────────────────────────────
// GET /api/lead-verification/status/:organizationId
router.get("/status/:organizationId", async (req, res) => {
  try {
    const { status } = req.query;

    const filter = { organizationId: req.params.organizationId };
    if (status) filter.verificationStatus = status;

    const verifications = await LeadVerification.find(filter)
      .populate("leadId")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: verifications.length,
      data: verifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── APPROVE Verification ─────────────────────────────────────────────────────
// PATCH /api/lead-verification/:leadId/approve
router.patch("/:leadId/approve", async (req, res) => {
  try {
    const { organizationId, approvedBy } = req.body;

    const verification = await LeadVerification.findOneAndUpdate(
      { leadId: req.params.leadId, organizationId },
      {
        verificationStatus: "verified",
        flags: { $addToSet: "verified_legitimate" },
        verifiedBy: approvedBy,
      },
      { new: true }
    );

    if (!verification) {
      return res.status(404).json({ success: false, error: "Verification not found" });
    }

    res.json({
      success: true,
      message: "Lead approved",
      data: verification,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── REJECT Verification ──────────────────────────────────────────────────────
// PATCH /api/lead-verification/:leadId/reject
router.patch("/:leadId/reject", async (req, res) => {
  try {
    const { organizationId, reason } = req.body;

    const verification = await LeadVerification.findOneAndUpdate(
      { leadId: req.params.leadId, organizationId },
      {
        verificationStatus: "suspicious",
        verificationDetails: reason,
        flags: { $addToSet: "suspicious_pattern" },
      },
      { new: true }
    );

    if (!verification) {
      return res.status(404).json({ success: false, error: "Verification not found" });
    }

    res.json({
      success: true,
      message: "Lead rejected",
      data: verification,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
