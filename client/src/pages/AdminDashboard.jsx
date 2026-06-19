import React, { useState } from "react";
import PlatformManagement from "../components/PlatformManagement";
import VerificationRulesManager from "../components/VerificationRulesManager";
import LeadVerificationDashboard from "../components/LeadVerificationDashboard";
import "../styles/admin-dashboard.css";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("platforms");

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>🛠️ ScrapeItEasy Admin Dashboard</h1>
        <p>Manage platforms, verification rules, and lead data quality</p>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === "platforms" ? "active" : ""}`}
          onClick={() => setActiveTab("platforms")}
        >
          📱 Platforms
        </button>
        <button
          className={`tab-btn ${activeTab === "rules" ? "active" : ""}`}
          onClick={() => setActiveTab("rules")}
        >
          ✓ Verification Rules
        </button>
        <button
          className={`tab-btn ${activeTab === "verification" ? "active" : ""}`}
          onClick={() => setActiveTab("verification")}
        >
          📊 Lead Verification
        </button>
      </div>

      <div className="admin-content">
        {activeTab === "platforms" && <PlatformManagement />}
        {activeTab === "rules" && <VerificationRulesManager />}
        {activeTab === "verification" && <LeadVerificationDashboard />}
      </div>

      <div className="admin-info">
        <h3>📚 How It Works</h3>
        <ul>
          <li>
            <strong>Platforms:</strong> Add scraping sources and define their
            data fields
          </li>
          <li>
            <strong>Verification Rules:</strong> Create rules to cross-verify
            lead data
          </li>
          <li>
            <strong>Lead Verification:</strong> Review verification results and
            approve/reject leads
          </li>
        </ul>
      </div>
    </div>
  );
}

export default AdminDashboard;
