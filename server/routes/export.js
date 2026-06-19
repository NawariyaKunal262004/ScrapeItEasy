// ─── Export Route ─────────────────────────────────────────────────────────────
// GET /api/export/csv    – download all leads as CSV
// GET /api/export/excel  – download all leads as .xlsx

const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { createObjectCsvWriter } = require("csv-writer");
const ExcelJS = require("exceljs");
const Lead = require("../models/Lead");

// Directory to temporarily store export files
const EXPORTS_DIR = path.join(__dirname, "../../exports");
if (!fs.existsSync(EXPORTS_DIR)) fs.mkdirSync(EXPORTS_DIR, { recursive: true });

// Columns used in both CSV and Excel exports
const COLUMNS = [
  { id: "businessName", title: "Business Name" },
  { id: "ownerName", title: "Owner Name" },
  { id: "phone", title: "Phone" },
  { id: "email", title: "Email" },
  { id: "city", title: "City" },
  { id: "category", title: "Category" },
  { id: "sourcePlatform", title: "Source Platform" },
  { id: "profileUrl", title: "Profile URL" },
  { id: "scrapedDate", title: "Scraped Date" },
];

// Helper: fetch all leads from DB and format dates
async function fetchLeads() {
  const leads = await Lead.find().sort({ scrapedDate: -1 }).lean();
  return leads.map((l) => ({
    businessName: l.businessName || "",
    ownerName: l.ownerName || "",
    phone: l.phone || "",
    email: l.email || "",
    city: l.city || "",
    category: l.category || "",
    sourcePlatform: l.sourcePlatform || "",
    profileUrl: l.profileUrl || "",
    scrapedDate: l.scrapedDate
      ? new Date(l.scrapedDate).toLocaleDateString("en-IN")
      : "",
  }));
}

// ── CSV Export ────────────────────────────────────────────────────────────────
router.get("/csv", async (req, res) => {
  try {
    const leads = await fetchLeads();
    const filePath = path.join(EXPORTS_DIR, "leads.csv");

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: COLUMNS,
    });

    await csvWriter.writeRecords(leads);

    // Send the file to the browser for download
    res.download(filePath, "ScrapeItEasy_Leads.csv", () => {
      // Delete temp file after sending
      fs.unlink(filePath, () => {});
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Excel Export ──────────────────────────────────────────────────────────────
router.get("/excel", async (req, res) => {
  try {
    const leads = await fetchLeads();
    const filePath = path.join(EXPORTS_DIR, "leads.xlsx");

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ScrapeItEasy";

    const sheet = workbook.addWorksheet("Leads");

    // Define columns
    sheet.columns = COLUMNS.map((col) => ({
      header: col.title,
      key: col.id,
      width: 25,
    }));

    // Style the header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1A365D" }, // dark navy
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 20;

    // Add data rows
    leads.forEach((lead) => sheet.addRow(lead));

    // Zebra-stripe rows for readability
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: rowNumber % 2 === 0 ? "FFF0F4FA" : "FFFFFFFF" },
      };
    });

    // Add borders to all cells
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFD1D5DB" } },
          left: { style: "thin", color: { argb: "FFD1D5DB" } },
          bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
          right: { style: "thin", color: { argb: "FFD1D5DB" } },
        };
      });
    });

    await workbook.xlsx.writeFile(filePath);

    res.download(filePath, "ScrapeItEasy_Leads.xlsx", () => {
      fs.unlink(filePath, () => {});
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
