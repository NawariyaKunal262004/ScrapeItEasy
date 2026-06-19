/**
 * Platforms API Routes
 * =====================
 * Manage available scraping platforms (add, edit, delete, list)
 */

const express = require("express");
const router = express.Router();
const Platform = require("../models/Platform");
const Organization = require("../models/Organization");

// ─── GET All Platforms ────────────────────────────────────────────────────────
// GET /api/platforms
// Get all available platforms or filtered by organization
router.get("/", async (req, res) => {
  try {
    const { organizationId, isActive } = req.query;
    const filter = {};

    if (organizationId) filter.organizationId = organizationId;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const platforms = await Platform.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: platforms.length,
      data: platforms,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── GET Platform by ID ────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const platform = await Platform.findById(req.params.id);

    if (!platform) {
      return res.status(404).json({ success: false, error: "Platform not found" });
    }

    res.json({ success: true, data: platform });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── CREATE New Platform ────────────────────────────────────────────────────────
// POST /api/platforms
router.post("/", async (req, res) => {
  try {
    const {
      name,
      description,
      url,
      category,
      scrapingMethod,
      requiredFields,
      optionalFields,
      creditsPerScrape,
      rateLimit,
      organizationId,
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ success: false, error: "Platform name is required" });
    }

    // Check if platform with same name already exists
    const existing = await Platform.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, error: "Platform with this name already exists" });
    }

    // If organizationId provided, verify organization exists
    if (organizationId) {
      const org = await Organization.findById(organizationId);
      if (!org) {
        return res.status(400).json({ success: false, error: "Organization not found" });
      }
    }

    const platform = await Platform.create({
      name,
      description,
      url,
      category,
      scrapingMethod,
      requiredFields,
      optionalFields,
      creditsPerScrape,
      rateLimit,
      organizationId,
    });

    // If organization provided, add platform to their enabled platforms
    if (organizationId) {
      await Organization.findByIdAndUpdate(
        organizationId,
        { $addToSet: { enabledPlatforms: platform._id } },
        { new: true }
      );
    }

    res.status(201).json({
      success: true,
      message: "Platform created successfully",
      data: platform,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── UPDATE Platform ────────────────────────────────────────────────────────────
// PUT /api/platforms/:id
router.put("/:id", async (req, res) => {
  try {
    const { name, description, url, category, scrapingMethod, requiredFields, optionalFields, creditsPerScrape, rateLimit, isActive } = req.body;

    const platform = await Platform.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        url,
        category,
        scrapingMethod,
        requiredFields,
        optionalFields,
        creditsPerScrape,
        rateLimit,
        isActive,
      },
      { new: true, runValidators: true }
    );

    if (!platform) {
      return res.status(404).json({ success: false, error: "Platform not found" });
    }

    res.json({
      success: true,
      message: "Platform updated successfully",
      data: platform,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── DELETE Platform ────────────────────────────────────────────────────────────
// DELETE /api/platforms/:id
router.delete("/:id", async (req, res) => {
  try {
    const platform = await Platform.findByIdAndDelete(req.params.id);

    if (!platform) {
      return res.status(404).json({ success: false, error: "Platform not found" });
    }

    // Remove platform from all organizations
    await Organization.updateMany(
      { enabledPlatforms: req.params.id },
      { $pull: { enabledPlatforms: req.params.id } }
    );

    res.json({
      success: true,
      message: "Platform deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── TOGGLE Platform Status ────────────────────────────────────────────────────
// PATCH /api/platforms/:id/toggle
router.patch("/:id/toggle", async (req, res) => {
  try {
    const platform = await Platform.findById(req.params.id);

    if (!platform) {
      return res.status(404).json({ success: false, error: "Platform not found" });
    }

    platform.isActive = !platform.isActive;
    await platform.save();

    res.json({
      success: true,
      message: `Platform ${platform.isActive ? "activated" : "deactivated"}`,
      data: platform,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
