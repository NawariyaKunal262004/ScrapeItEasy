/**
 * ScrapeItEasy – JavaScript Scraper Utils
 * =========================================
 * This module handles all scraping logic for different platforms.
 * Returns cleaned, validated business leads.
 */

// ─── Data Quality Helpers ─────────────────────────────────────────────────────

function isValidEmail(email) {
  if (!email) return false;
  const pattern = /^[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}$/;
  return pattern.test(String(email).trim());
}

function isValidPhone(phone) {
  if (!phone) return false;
  // Strip spaces, dashes, parentheses, leading +91 or 0
  let cleaned = String(phone).replace(/[\s\-()+ ]/g, "");
  cleaned = cleaned.replace(/^(91|0)/, "");
  return cleaned.length >= 8 && cleaned.length <= 12 && /^\d+$/.test(cleaned);
}

function cleanPhone(phone) {
  if (!phone) return "";
  let cleaned = String(phone).replace(/[\s\-()+ ]/g, "");
  cleaned = cleaned.replace(/^(91|0)/, "");
  return cleaned;
}

function cleanText(text) {
  if (!text) return "";
  return String(text)
    .replace(/\s+/g, " ")
    .trim();
}

function validateAndClean(lead) {
  /**
   * Apply data quality rules to a single lead object.
   * Returns the cleaned lead or null if the lead should be discarded.
   */

  // Rule 1: Must have a business name
  const biz = cleanText(lead.businessName || "");
  if (!biz) return null;

  // Rule 2: Clean all fields
  const owner = cleanText(lead.ownerName || "");
  let phone = cleanPhone(lead.phone || "");
  let email = cleanText(lead.email || "");
  const city = cleanText(lead.city || "");
  const category = cleanText(lead.category || "");
  const platform = cleanText(lead.sourcePlatform || "");
  const url = cleanText(lead.profileUrl || "");

  // Rule 3: Validate phone if present
  if (phone && !isValidPhone(phone)) {
    phone = "";
  }

  // Rule 4: Validate email if present
  if (email && !isValidEmail(email)) {
    email = "";
  }

  // Rule 5: Must have at least a phone OR an email
  if (!phone && !email) {
    return null;
  }

  return {
    businessName: biz,
    ownerName: owner,
    phone,
    email,
    city,
    category,
    sourcePlatform: platform,
    profileUrl: url,
  };
}

function deduplicate(leads) {
  /**
   * Remove duplicates using businessName + phone hash.
   */
  const crypto = require("crypto");
  const seen = new Set();
  const unique = [];

  for (const lead of leads) {
    const key = (lead.businessName.toLowerCase() + lead.phone).replace(/\s/g, "");
    const hash = crypto.createHash("md5").update(key).digest("hex");

    if (!seen.has(hash)) {
      seen.add(hash);
      unique.push(lead);
    }
  }

  return unique;
}

// ─── Mock Data Generator ──────────────────────────────────────────────────────

function generateMockLeads(platform, city, category) {
  /**
   * Returns realistic mock lead data for development.
   * In production, replace with real scraper calls.
   */
  const sampleBusinesses = [
    {
      businessName: `${category} Hub ${city}`,
      ownerName: "Rajesh Sharma",
      phone: "9876543210",
      email: "rajesh@example.com",
      profileUrl: "https://example.com/rajesh",
    },
    {
      businessName: `Global ${category} Services`,
      ownerName: "Priya Mehta",
      phone: "9988776655",
      email: "priya.mehta@globalservices.in",
      profileUrl: "https://example.com/priya",
    },
    {
      businessName: `${city} ${category} Experts`,
      ownerName: "Anil Kumar",
      phone: "8877665544",
      email: "",
      profileUrl: "https://example.com/anil",
    },
    {
      businessName: `Premier ${category} Solutions`,
      ownerName: "Sunita Verma",
      phone: "7766554433",
      email: "sunita@premiersolutions.co.in",
      profileUrl: "https://example.com/sunita",
    },
    {
      businessName: `New Age ${category}`,
      ownerName: "",
      phone: "9001122334",
      email: "info@newage.in",
      profileUrl: "https://example.com/newage",
    },
    {
      businessName: `${city} Royal ${category}`,
      ownerName: "Vijay Singh",
      phone: "invalid",
      email: "not-an-email",
      profileUrl: "",
    },
    {
      businessName: "",
      ownerName: "Ghost Business",
      phone: "9123456789",
      email: "ghost@example.com",
      profileUrl: "",
    },
    {
      businessName: `Star ${category} ${city}`,
      ownerName: "Meena Gupta",
      phone: "9512345678",
      email: "meena@star.in",
      profileUrl: "https://example.com/star",
    },
    {
      businessName: `Elite ${category} Group`,
      ownerName: "Deepak Joshi",
      phone: "8901234567",
      email: "deepak@elite.in",
      profileUrl: "https://example.com/elite",
    },
    {
      businessName: `${category} Pro ${city}`,
      ownerName: "Kavita Nair",
      phone: "7890123456",
      email: "kavita@catpro.in",
      profileUrl: "https://example.com/catpro",
    },
  ];

  // Tag each record
  for (const biz of sampleBusinesses) {
    biz.city = city;
    biz.category = category;
    biz.sourcePlatform = platform;
  }

  return sampleBusinesses;
}

// ─── Platform Scrapers ────────────────────────────────────────────────────────

async function scrapeJustdial(city, category) {
  console.log(`[scraper] JustDial scraping not yet implemented. Using mock data.`);
  return generateMockLeads("JustDial", city, category);
}

async function scrapeTradeIndia(city, category) {
  console.log(`[scraper] TradeIndia scraping not yet implemented. Using mock data.`);
  return generateMockLeads("TradeIndia", city, category);
}

async function scrapeIndiaMART(city, category) {
  console.log(`[scraper] IndiaMART scraping not yet implemented. Using mock data.`);
  return generateMockLeads("IndiaMART", city, category);
}

async function scrapeGoogleMaps(city, category) {
  console.log(`[scraper] Google Maps scraping not yet implemented. Using mock data.`);
  return generateMockLeads("Google Maps", city, category);
}

// ─── Main Scraper Function ────────────────────────────────────────────────────

async function scrapePlatform(platform, city, category) {
  /**
   * Main entry point for scraping.
   * Returns validated, deduplicated leads.
   */

  console.log(`[scraper] Starting: platform=${platform}, city=${city}, category=${category}`);

  const platformMap = {
    tradeindia: scrapeTradeIndia,
    justdial: scrapeJustdial,
    indiamart: scrapeIndiaMART,
    googlemaps: scrapeGoogleMaps,
  };

  const scrapeFn = platformMap[platform.toLowerCase().replace(/\s/g, "")];
  if (!scrapeFn) {
    console.log(`[scraper] Unknown platform: ${platform}`);
    return [];
  }

  // Run the scraper
  const rawLeads = await scrapeFn(city, category);
  console.log(`[scraper] Raw leads fetched: ${rawLeads.length}`);

  // Clean and validate each lead
  const cleaned = [];
  for (const lead of rawLeads) {
    const result = validateAndClean(lead);
    if (result) {
      cleaned.push(result);
    }
  }

  console.log(`[scraper] After validation: ${cleaned.length}`);

  // Remove duplicates
  const final = deduplicate(cleaned);
  console.log(`[scraper] After deduplication: ${final.length}`);

  return final;
}

module.exports = {
  scrapePlatform,
  generateMockLeads,
  validateAndClean,
  deduplicate,
};
