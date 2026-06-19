import React, { useState, useEffect } from "react";
import "../styles/admin-dashboard.css";

export function VerificationRulesManager() {
  const [rules, setRules] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [newRule, setNewRule] = useState({
    name: "",
    description: "",
    ruleType: "match_across_platforms",
    fieldToMatch: "phone",
    requiredMatches: 2,
    matchingPlatforms: [],
    confidenceWeight: 1,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRules();
    fetchPlatforms();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await fetch("/api/verification-rules");
      const data = await res.json();
      setRules(data.data || []);
    } catch (err) {
      console.error("Error fetching rules:", err);
    }
  };

  const fetchPlatforms = async () => {
    try {
      const res = await fetch("/api/platforms");
      const data = await res.json();
      setPlatforms(data.data || []);
    } catch (err) {
      console.error("Error fetching platforms:", err);
    }
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/verification-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRule),
      });

      if (res.ok) {
        setNewRule({
          name: "",
          description: "",
          ruleType: "match_across_platforms",
          fieldToMatch: "phone",
          requiredMatches: 2,
          matchingPlatforms: [],
          confidenceWeight: 1,
        });
        fetchRules();
        alert("Rule added successfully!");
      }
    } catch (err) {
      alert("Error adding rule: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (id) => {
    if (window.confirm("Delete this verification rule?")) {
      try {
        const res = await fetch(`/api/verification-rules/${id}`, {
          method: "DELETE",
        });

        if (res.ok) {
          fetchRules();
          alert("Rule deleted");
        }
      } catch (err) {
        console.error("Error deleting rule:", err);
      }
    }
  };

  return (
    <div className="admin-card">
      <h2>✓ Verification Rules</h2>

      <div className="form-section">
        <h3>Create New Verification Rule</h3>
        <form onSubmit={handleAddRule} className="admin-form">
          <input
            type="text"
            placeholder="Rule Name"
            value={newRule.name}
            onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
            required
          />

          <input
            type="text"
            placeholder="Description"
            value={newRule.description}
            onChange={(e) =>
              setNewRule({ ...newRule, description: e.target.value })
            }
          />

          <select
            value={newRule.ruleType}
            onChange={(e) =>
              setNewRule({ ...newRule, ruleType: e.target.value })
            }
          >
            <option value="match_across_platforms">Match Across Platforms</option>
            <option value="field_validation">Field Validation</option>
            <option value="fuzzy_match">Fuzzy Match</option>
            <option value="custom">Custom</option>
          </select>

          <select
            value={newRule.fieldToMatch}
            onChange={(e) =>
              setNewRule({ ...newRule, fieldToMatch: e.target.value })
            }
          >
            <option value="businessName">Business Name</option>
            <option value="phone">Phone</option>
            <option value="email">Email</option>
            <option value="ownerName">Owner Name</option>
          </select>

          <input
            type="number"
            placeholder="Required Matches"
            value={newRule.requiredMatches}
            onChange={(e) =>
              setNewRule({
                ...newRule,
                requiredMatches: parseInt(e.target.value),
              })
            }
            min="1"
          />

          <label>Select Platforms to Match Against:</label>
          <div className="checkbox-group">
            {platforms.map((platform) => (
              <label key={platform._id}>
                <input
                  type="checkbox"
                  checked={newRule.matchingPlatforms.includes(platform._id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setNewRule({
                        ...newRule,
                        matchingPlatforms: [
                          ...newRule.matchingPlatforms,
                          platform._id,
                        ],
                      });
                    } else {
                      setNewRule({
                        ...newRule,
                        matchingPlatforms: newRule.matchingPlatforms.filter(
                          (id) => id !== platform._id
                        ),
                      });
                    }
                  }}
                />
                {platform.name}
              </label>
            ))}
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Rule"}
          </button>
        </form>
      </div>

      <div className="rules-list">
        <h3>Active Rules</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Field</th>
              <th>Required Matches</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule._id}>
                <td>{rule.name}</td>
                <td>{rule.ruleType}</td>
                <td>{rule.fieldToMatch}</td>
                <td>{rule.requiredMatches}</td>
                <td>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteRule(rule._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default VerificationRulesManager;
