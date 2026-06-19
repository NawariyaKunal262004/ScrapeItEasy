// ─── History Page ─────────────────────────────────────────────────────────────
// Shows a log of all past scrape runs.

import React, { useState, useEffect } from "react";

const API = "";

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/api/history`)
      .then((r) => r.json())
      .then((data) => {
        setHistory(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  function formatDateTime(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <div>
      <div className="page-header">
        <h1>Scrape History</h1>
        <p>A log of every scraping job that has been run. Showing the last 50 runs.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="empty-state"><p>Loading history...</p></div>
      ) : history.length === 0 ? (
        <div className="empty-state">
          <h3>No scrape history yet</h3>
          <p>Run the scraper from the Dashboard to see results here.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date &amp; Time</th>
                <th>Platform</th>
                <th>City</th>
                <th>Category</th>
                <th>Total Fetched</th>
                <th>Newly Saved</th>
                <th>Skipped</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((run) => (
                <tr key={run._id} className="scrape-log-row">
                  <td>{formatDateTime(run.ranAt)}</td>
                  <td>
                    <span className="badge badge-platform">{run.platform}</span>
                  </td>
                  <td>{run.city}</td>
                  <td>{run.category}</td>
                  <td style={{ textAlign: "right" }}>{run.totalScraped}</td>
                  <td style={{ textAlign: "right", fontWeight: 600, color: "var(--success)" }}>
                    +{run.newlySaved}
                  </td>
                  <td style={{ textAlign: "right", color: "var(--ink-soft)" }}>
                    {run.totalScraped - run.newlySaved}
                  </td>
                  <td>
                    {run.status === "success" ? (
                      <span className="badge badge-success">OK</span>
                    ) : (
                      <span
                        className="badge badge-error"
                        title={run.errorMessage}
                      >
                        Error
                      </span>
                    )}
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

export default History;
