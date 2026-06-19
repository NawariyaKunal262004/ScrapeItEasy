/**
 * Verification Service
 * =====================
 * Handles cross-platform data verification and accuracy scoring
 */

const Levenshtein = require("js-levenshtein");

// ─── Data Matching Algorithms ────────────────────────────────────────────────

/**
 * Exact match - strings are identical
 */
function exactMatch(str1, str2) {
  if (!str1 || !str2) return false;
  return String(str1).toLowerCase().trim() === String(str2).toLowerCase().trim();
}

/**
 * Fuzzy match - strings are similar (using Levenshtein distance)
 * @param {string} str1
 * @param {string} str2
 * @param {number} threshold - 0-1, how similar they need to be (0.8 = 80%)
 */
function fuzzyMatch(str1, str2, threshold = 0.85) {
  if (!str1 || !str2) return false;

  const s1 = String(str1).toLowerCase().trim();
  const s2 = String(str2).toLowerCase().trim();

  if (s1 === s2) return true;

  // Calculate similarity using Levenshtein distance
  const distance = Levenshtein(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  const similarity = 1 - distance / maxLength;

  return similarity >= threshold;
}

/**
 * Phone number matching - normalized comparison
 */
function phoneMatch(phone1, phone2) {
  if (!phone1 || !phone2) return false;

  const normalize = (p) => String(p).replace(/[\s\-()+ ]/g, "").replace(/^(91|0)/, "");
  return normalize(phone1) === normalize(phone2);
}

/**
 * Email matching - case-insensitive
 */
function emailMatch(email1, email2) {
  if (!email1 || !email2) return false;
  return String(email1).toLowerCase().trim() === String(email2).toLowerCase().trim();
}

// ─── Main Verification Engine ────────────────────────────────────────────────

async function verifyLeadAcrossPllatforms(
  leadId,
  leadData,
  sourcePlatforms,
  verificationRules
) {
  /**
   * Cross-verify lead data across multiple platforms
   * Returns: {
   *   accuracyScore: 0-100,
   *   verificationStatus: 'verified'|'suspicious'|'unverified',
   *   matchedFields: { fieldName: matchCount },
   *   flags: [],
   *   details: "Human readable explanation"
   * }
   */

  if (!sourcePlatforms || sourcePlatforms.length === 0) {
    return {
      accuracyScore: 0,
      verificationStatus: "unverified",
      matchedFields: {},
      flags: ["no_cross_platform_data"],
      details: "No cross-platform data available for verification.",
    };
  }

  const matchedFields = {};
  let totalMatches = 0;
  const flags = [];

  // ─── Check for duplicates ────────────────────────────────────────────

  const businessNameHash = {};
  const phoneHash = {};
  const emailHash = {};

  for (const source of sourcePlatforms) {
    const data = source.data || {};

    if (data.businessName) {
      const key = data.businessName.toLowerCase().trim();
      businessNameHash[key] = (businessNameHash[key] || 0) + 1;
    }

    if (data.phone) {
      const key = String(data.phone).replace(/[\s\-()+ ]/g, "").replace(/^(91|0)/, "");
      phoneHash[key] = (phoneHash[key] || 0) + 1;
    }

    if (data.email) {
      const key = data.email.toLowerCase().trim();
      emailHash[key] = (emailHash[key] || 0) + 1;
    }
  }

  // ─── Compare all platform data ────────────────────────────────────────

  for (const rule of verificationRules) {
    if (!rule.isActive) continue;

    const field = rule.fieldToMatch;
    const requiredMatches = rule.requiredMatches || 2;

    if (field === "businessName") {
      const maxCount = Math.max(...Object.values(businessNameHash), 0);
      matchedFields.businessName = maxCount;
      totalMatches += maxCount > 1 ? 1 : 0;

      if (maxCount > 1) {
        flags.push("business_name_verified");
      }
    }

    if (field === "phone") {
      const maxCount = Math.max(...Object.values(phoneHash), 0);
      matchedFields.phone = maxCount;
      totalMatches += maxCount > 1 ? 1 : 0;

      if (maxCount > 1) {
        flags.push("phone_verified");
      }
    }

    if (field === "email") {
      const maxCount = Math.max(...Object.values(emailHash), 0);
      matchedFields.email = maxCount;
      totalMatches += maxCount > 1 ? 1 : 0;

      if (maxCount > 1) {
        flags.push("email_verified");
      }
    }
  }

  // ─── Calculate accuracy score ────────────────────────────────────────

  let accuracyScore = 0;

  if (matchedFields.businessName && matchedFields.businessName > 1) {
    accuracyScore += 30;
  }
  if (matchedFields.phone && matchedFields.phone > 1) {
    accuracyScore += 40;
  }
  if (matchedFields.email && matchedFields.email > 1) {
    accuracyScore += 30;
  }

  // Boost for multiple platforms
  if (sourcePlatforms.length >= 3) {
    accuracyScore = Math.min(100, accuracyScore + 10);
  }

  // ─── Determine verification status ────────────────────────────────────

  let verificationStatus = "unverified";

  if (accuracyScore >= 80) {
    verificationStatus = "verified";
    flags.push("verified_legitimate");
  } else if (accuracyScore >= 50 && accuracyScore < 80) {
    verificationStatus = "verified";
    flags.push("requires_manual_review");
  } else if (accuracyScore > 0 && accuracyScore < 50) {
    verificationStatus = "suspicious";
    flags.push("suspicious_pattern");
  }

  // ─── Generate human-readable explanation ────────────────────────────

  let details = "";

  if (verificationStatus === "verified") {
    const matchCount = Object.values(matchedFields).filter((v) => v > 1).length;
    details = `Lead verified across ${sourcePlatforms.length} platforms with ${matchCount} matching field(s).`;
  } else if (verificationStatus === "suspicious") {
    details = `Lead data appears inconsistent across platforms. Manual review recommended.`;
  } else {
    details = `Insufficient data to verify lead legitimacy. Requires data from multiple platforms.`;
  }

  return {
    accuracyScore: Math.round(accuracyScore),
    verificationStatus,
    matchedFields,
    flags: [...new Set(flags)], // Remove duplicates
    details,
  };
}

/**
 * Batch verify multiple leads
 */
async function batchVerifyLeads(leads, verificationRules) {
  const results = [];

  for (const lead of leads) {
    const result = await verifyLeadAcrossPllatforms(
      lead._id,
      lead,
      lead.sourcePlatforms || [],
      verificationRules
    );

    results.push({
      leadId: lead._id,
      ...result,
    });
  }

  return results;
}

module.exports = {
  exactMatch,
  fuzzyMatch,
  phoneMatch,
  emailMatch,
  verifyLeadAcrossPllatforms,
  batchVerifyLeads,
};
