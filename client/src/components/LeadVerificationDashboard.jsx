import React, { useState, useEffect } from "react";
import "../styles/admin-dashboard.css";

export function LeadVerificationDashboard() {
  const [verifications, setVerifications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    suspicious: 0,
    unverified: 0,
    averageAccuracy: 0,
  });
  const [filter, setFilter] = useState("all");
  const [organizationId, setOrganizationId] = useState(
    localStorage.getItem("organizationId") || ""
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (organizationId) {
      fetchStats();
      fetchVerifications();
    }
  }, [organizationId, filter]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/lead-verification/stats/${organizationId}`);
      const data = await res.json();
      setStats(data.data || {});
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchVerifications = async () => {
    try {
      let url = `/api/lead-verification/status/${organizationId}`;
      if (filter !== "all") {
        url += `?status=${filter}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setVerifications(data.data || []);
    } catch (err) {
      console.error("Error fetching verifications:", err);
    }
  };

  const handleApprove = async (leadId) => {
    try {
      const res = await fetch(`/api/lead-verification/${leadId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });

      if (res.ok) {
        fetchVerifications();
        fetchStats();
        alert("Lead approved!");
      }
    } catch (err) {
      console.error("Error approving lead:", err);
    }
  };

  const handleReject = async (leadId) => {
    const reason = prompt("Reason for rejection:");
    if (reason) {
      try {
        const res = await fetch(`/api/lead-verification/${leadId}/reject`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organizationId, reason }),
        });

        if (res.ok) {
          fetchVerifications();
          fetchStats();
          alert("Lead rejected!");
        }
      } catch (err) {
        console.error("Error rejecting lead:", err);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "verified":
        return "status-verified";
      case "suspicious":
        return "status-suspicious";
      case "unverified":
        return "status-unverified";
      default:
        return "status-pending";
    }
  };

  return (
    <div className="admin-card">
      <h2>📊 Lead Verification Dashboard</h2>

      <div className="org-selector">
        <input
          type="text"
          placeholder="Organization ID"
          value={organizationId}
          onChange={(e) => setOrganizationId(e.target.value)}
        />
        <button onClick={() => localStorage.setItem("organizationId", organizationId)}>
          Set Organization
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-box">
          <h3>Total</h3>
          <p className="stat-number">{stats.total}</p>
        </div>
        <div className="stat-box verified">
          <h3>Verified</h3>
          <p className="stat-number">{stats.verified}</p>
        </div>
        <div className="stat-box suspicious">
          <h3>Suspicious</h3>
          <p className="stat-number">{stats.suspicious}</p>
        </div>
        <div className="stat-box unverified">
          <h3>Unverified</h3>
          <p className="stat-number">{stats.unverified}</p>
        </div>
        <div className="stat-box">
          <h3>Avg Accuracy</h3>
          <p className="stat-number">{stats.averageAccuracy}%</p>
        </div>
      </div>

      <div className="filter-section">
        <button
          className={filter === "all" ? "filter-active" : ""}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={filter === "verified" ? "filter-active" : ""}
          onClick={() => setFilter("verified")}
        >
          Verified
        </button>
        <button
          className={filter === "suspicious" ? "filter-active" : ""}
          onClick={() => setFilter("suspicious")}
        >
          Suspicious
        </button>
        <button
          className={filter === "unverified" ? "filter-active" : ""}
          onClick={() => setFilter("unverified")}
        >
          Unverified
        </button>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Business Name</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Accuracy</th>
            <th>Platforms</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {verifications.map((v) => (
            <tr key={v._id}>
              <td>{v.leadId?.businessName || "N/A"}</td>
              <td>{v.leadId?.phone || "N/A"}</td>
              <td>
                <span className={`status ${getStatusColor(v.verificationStatus)}`}>
                  {v.verificationStatus}
                </span>
              </td>
              <td>
                <div className="accuracy-bar">
                  <div
                    className="accuracy-fill"
                    style={{ width: `${v.accuracyScore}%` }}
                  ></div>
                  <span>{v.accuracyScore}%</span>
                </div>
              </td>
              <td>{v.sourcePlatforms?.length || 0}</td>
              <td>
                <button
                  className="btn-approve"
                  onClick={() => handleApprove(v.leadId._id)}
                >
                  Approve
                </button>
                <button
                  className="btn-reject"
                  onClick={() => handleReject(v.leadId._id)}
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LeadVerificationDashboard;
