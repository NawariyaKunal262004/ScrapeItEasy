// ─── Dashboard Page ───────────────────────────────────────────────────────────
// The main scraper control panel.
// Users select a platform, enter a city and category, then hit Scrape.

import React, { useState, useEffect } from "react";

// The base URL for API calls — Vite proxies /api to http://localhost:5000
const API = "";

const PLATFORMS = [
  { value: "googlemaps", label: "Google Maps" },
  { value: "justdial", label: "JustDial" },
  { value: "tradeindia", label: "TradeIndia" },
  { value: "indiamart", label: "IndiaMART" },
];

function Dashboard() {
  const [platform, setPlatform] = useState("googlemaps");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);  // { totalScraped, newlySaved }
  const [error, setError] = useState("");
  const [totalLeads, setTotalLeads] = useState(null);

  // Fetch total lead count on mount
  useEffect(() => {
    fetch(`${API}/api/leads`)
      .then((r) => r.json())
      .then((data) => setTotalLeads(Array.isArray(data) ? data.length : 0))
      .catch(() => {});
  }, [result]); // refresh count after each scrape

  async function handleScrape() {
    if (!city.trim() || !category.trim()) {
      setError("Please enter both a city and a category.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`${API}/api/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, city: city.trim(), category: category.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Scraping failed. Check server logs.");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError("Could not reach the server. Is it running on port 5000?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Lead Scraper</h1>
        <p>Select a platform, enter a location and category, and collect verified business leads.</p>
      </div>

      <div className="dashboard-grid">
        {/* ── Left: Scrape Form ─────────────────────────────────────────────── */}
        <div>
          <div className="card">
            <div className="card-header">
              <h2>Scrape Parameters</h2>
            </div>
            <div className="card-body">

              {/* Platform Select */}
              <div className="form-group">
                <label htmlFor="platform">Source Platform</label>
                <div className="select-wrapper">
                  <select
                    id="platform"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* City Input */}
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  type="text"
                  placeholder="e.g. Jaipur"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleScrape()}
                />
              </div>

              {/* Category Input */}
              <div className="form-group">
                <label htmlFor="category">Business Category / Niche</label>
                <input
                  id="category"
                  type="text"
                  placeholder="e.g. Interior Designers"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleScrape()}
                />
              </div>

              {/* Scrape Button */}
              <button
                className="btn btn-primary"
                onClick={handleScrape}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    Scraping...
                  </>
                ) : (
                  "Run Scraper"
                )}
              </button>

              {/* Error */}
              {error && <div className="alert alert-error">{error}</div>}

              {/* Success result */}
              {result && (
                <div className="result-summary">
                  <h3>Scrape Complete</h3>
                  <div className="result-row">
                    <span>Raw records fetched</span>
                    <strong>{result.totalScraped}</strong>
                  </div>
                  <div className="result-row">
                    <span>New leads saved</span>
                    <strong>{result.newlySaved}</strong>
                  </div>
                  <div className="result-row">
                    <span>Duplicates / invalid skipped</span>
                    <strong>{result.totalScraped - result.newlySaved}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Info Box ─────────────────────────────────────────────────────── */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header"><h2>Quality Rules</h2></div>
            <div className="card-body" style={{ fontSize: "0.83rem", color: "var(--ink-mid)", lineHeight: 1.8 }}>
              <div>Records without a business name are discarded.</div>
              <div>Invalid phone numbers and emails are removed.</div>
              <div>Records with no phone and no email are skipped.</div>
              <div>Duplicates are detected by name + phone hash.</div>
              <div>Previously saved businesses are never re-imported.</div>
            </div>
          </div>
        </div>

        {/* ── Right: Stats ──────────────────────────────────────────────────── */}
        <div>
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-label">Total Leads</div>
              <div className="stat-value">{totalLeads ?? "—"}</div>
              <div className="stat-sub">in database</div>
            </div>
            <div className="stat-card" style={{ borderLeftColor: "var(--success)" }}>
              <div className="stat-label">Last Saved</div>
              <div className="stat-value">{result?.newlySaved ?? "—"}</div>
              <div className="stat-sub">this run</div>
            </div>
            <div className="stat-card" style={{ borderLeftColor: "#d69e2e" }}>
              <div className="stat-label">Skipped</div>
              <div className="stat-value">
                {result != null ? result.totalScraped - result.newlySaved : "—"}
              </div>
              <div className="stat-sub">duplicates / invalid</div>
            </div>
          </div>

          {/* How it works */}
          <div className="card">
            <div className="card-header"><h2>How It Works</h2></div>
            <div className="card-body">
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  ["1. Configure", "Choose a platform, city, and business category above."],
                  ["2. Scrape", "The server calls a Python scraper for the selected platform."],
                  ["3. Validate", "Python removes invalid phone numbers, emails, and blank records."],
                  ["4. Deduplicate", "Node.js skips any business already stored in the database."],
                  ["5. Export", "Go to the Leads page to filter and download your clean data."],
                ].map(([step, desc]) => (
                  <div key={step} style={{ display: "flex", gap: 14 }}>
                    <div style={{
                      flexShrink: 0,
                      width: 28, height: 28,
                      background: "var(--navy-100)",
                      color: "var(--navy-800)",
                      borderRadius: "var(--radius)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.72rem", fontWeight: 700,
                    }}>
                      {step.split(".")[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--ink)" }}>{step.split(". ")[1]}</div>
                      <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)", marginTop: 2 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
