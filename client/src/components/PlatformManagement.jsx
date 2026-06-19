import React, { useState, useEffect } from "react";
import "../styles/admin-dashboard.css";

export function PlatformManagement() {
  const [platforms, setPlatforms] = useState([]);
  const [newPlatform, setNewPlatform] = useState({
    name: "",
    description: "",
    url: "",
    category: "directory",
    scrapingMethod: "web_scrape",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const fetchPlatforms = async () => {
    try {
      const res = await fetch("/api/platforms");
      const data = await res.json();
      setPlatforms(data.data || []);
    } catch (err) {
      console.error("Error fetching platforms:", err);
    }
  };

  const handleAddPlatform = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/platforms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlatform),
      });

      if (res.ok) {
        setNewPlatform({
          name: "",
          description: "",
          url: "",
          category: "directory",
          scrapingMethod: "web_scrape",
        });
        fetchPlatforms();
        alert("Platform added successfully!");
      }
    } catch (err) {
      alert("Error adding platform: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePlatform = async (id) => {
    try {
      const res = await fetch(`/api/platforms/${id}/toggle`, {
        method: "PATCH",
      });

      if (res.ok) {
        fetchPlatforms();
      }
    } catch (err) {
      console.error("Error toggling platform:", err);
    }
  };

  const handleDeletePlatform = async (id) => {
    if (window.confirm("Are you sure you want to delete this platform?")) {
      try {
        const res = await fetch(`/api/platforms/${id}`, {
          method: "DELETE",
        });

        if (res.ok) {
          fetchPlatforms();
          alert("Platform deleted");
        }
      } catch (err) {
        console.error("Error deleting platform:", err);
      }
    }
  };

  return (
    <div className="admin-card">
      <h2>📱 Platform Management</h2>

      <div className="form-section">
        <h3>Add New Platform</h3>
        <form onSubmit={handleAddPlatform} className="admin-form">
          <input
            type="text"
            placeholder="Platform Name"
            value={newPlatform.name}
            onChange={(e) =>
              setNewPlatform({ ...newPlatform, name: e.target.value })
            }
            required
          />

          <input
            type="text"
            placeholder="Description"
            value={newPlatform.description}
            onChange={(e) =>
              setNewPlatform({ ...newPlatform, description: e.target.value })
            }
          />

          <input
            type="url"
            placeholder="Platform URL"
            value={newPlatform.url}
            onChange={(e) =>
              setNewPlatform({ ...newPlatform, url: e.target.value })
            }
          />

          <select
            value={newPlatform.category}
            onChange={(e) =>
              setNewPlatform({ ...newPlatform, category: e.target.value })
            }
          >
            <option value="directory">Directory</option>
            <option value="classifieds">Classifieds</option>
            <option value="maps">Maps</option>
            <option value="social">Social</option>
            <option value="api">API</option>
            <option value="custom">Custom</option>
          </select>

          <button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Platform"}
          </button>
        </form>
      </div>

      <div className="platforms-list">
        <h3>Active Platforms</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Method</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {platforms.map((platform) => (
              <tr key={platform._id}>
                <td>{platform.name}</td>
                <td>{platform.category}</td>
                <td>{platform.scrapingMethod}</td>
                <td>
                  <span
                    className={`badge ${
                      platform.isActive ? "badge-active" : "badge-inactive"
                    }`}
                  >
                    {platform.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <button
                    className="btn-toggle"
                    onClick={() => handleTogglePlatform(platform._id)}
                  >
                    {platform.isActive ? "Disable" : "Enable"}
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeletePlatform(platform._id)}
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

export default PlatformManagement;
