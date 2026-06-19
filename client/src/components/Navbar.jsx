// ─── Navbar Component ─────────────────────────────────────────────────────────

import React from "react";

function Navbar({ activePage, setActivePage }) {
  const navItems = [
    { key: "dashboard", label: "Scraper" },
    { key: "leads", label: "Leads" },
    { key: "history", label: "History" },
    { key: "admin", label: "Admin" },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand mark */}
        <button
          className="navbar-brand"
          onClick={() => setActivePage("dashboard")}
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <div className="brand-mark">S</div>
          <span className="brand-name">
            Scrape<span>It</span>Easy
          </span>
        </button>

        {/* Navigation links */}
        <div className="navbar-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`nav-btn ${activePage === item.key ? "active" : ""}`}
              onClick={() => setActivePage(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
