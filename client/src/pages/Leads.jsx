// ─── Leads Page ───────────────────────────────────────────────────────────────
// Shows all stored leads with filter controls and CSV/Excel export buttons.

import React, { useState, useEffect } from "react";

const API = "";

function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter state
  const [filterCity, setFilterCity] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");

  // Fetch leads from the server
  async function fetchLeads() {
    setLoading(true);
    setError("");
    try {
      // Build query params for any active filters
      const params = new URLSearchParams();
      if (filterCity) params.append("city", filterCity);
      if (filterCategory) params.append("category", filterCategory);
      if (filterPlatform) params.append("platform", filterPlatform);

      const res = await fetch(`${API}/api/leads?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch leads.");
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Delete a single lead
  async function deleteLead(id) {
    if (!window.confirm("Delete this lead? This cannot be undone.")) return;
    try {
      await fetch(`${API}/api/leads/${id}`, { method: "DELETE" });
      setLeads((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  }

  // Fetch on mount and whenever filters change
  useEffect(() => {
    const timer = setTimeout(fetchLeads, 300); // debounce 300ms
    return () => clearTimeout(timer);
  }, [filterCity, filterCategory, filterPlatform]);

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric"
    });
  }

  return (
    <div>
      <div className="page-header">
        <h1>Business Leads</h1>
        <p>All validated, deduplicated leads stored in the database.</p>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div className="toolbar">
        <input
          className="filter-input"
          type="text"
          placeholder="Filter by city..."
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
        />
        <input
          className="filter-input"
          type="text"
          placeholder="Filter by category..."
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        />
        <input
          className="filter-input"
          type="text"
          placeholder="Filter by platform..."
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value)}
        />

        <span style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>
          {leads.length} record{leads.length !== 1 ? "s" : ""}
        </span>

        {/* Export buttons */}
        <div className="toolbar-right">
          <a
            className="btn btn-secondary btn-sm"
            href={`${API}/api/export/csv`}
            target="_blank"
            rel="noreferrer"
          >
            Export CSV
          </a>
          <a
            className="btn btn-secondary btn-sm"
            href={`${API}/api/export/excel`}
            target="_blank"
            rel="noreferrer"
          >
            Export Excel
          </a>
        </div>
      </div>

      {/* ── Error ─────────────────────────────────────────────────────────────── */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* ── Table ─────────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="empty-state">
          <p>Loading leads...</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="empty-state">
          <h3>No leads found</h3>
          <p>Run the scraper from the Dashboard to collect leads.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Business Name</th>
                <th>Owner</th>
                <th>Phone</th>
                <th>Email</th>
                <th>City</th>
                <th>Category</th>
                <th>Platform</th>
                <th>Profile</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, idx) => (
                <tr key={lead._id}>
                  <td style={{ color: "var(--ink-soft)", fontSize: "0.78rem" }}>
                    {idx + 1}
                  </td>
                  <td>
                    <strong>{lead.businessName}</strong>
                  </td>
                  <td>{lead.ownerName || "—"}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
                    {lead.phone || "—"}
                  </td>
                  <td>{lead.email || "—"}</td>
                  <td>{lead.city || "—"}</td>
                  <td>{lead.category || "—"}</td>
                  <td>
                    <span className="badge badge-platform">
                      {lead.sourcePlatform || "—"}
                    </span>
                  </td>
                  <td className="td-url">
                    {lead.profileUrl ? (
                      <a href={lead.profileUrl} target="_blank" rel="noreferrer">
                        View
                      </a>
                    ) : "—"}
                  </td>
                  <td style={{ whiteSpace: "nowrap", fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                    {formatDate(lead.scrapedDate)}
                  </td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteLead(lead._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Leads;
