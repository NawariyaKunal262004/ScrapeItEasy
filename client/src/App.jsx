// ─── App.jsx ──────────────────────────────────────────────────────────────────
// Root component. Manages which page is currently shown.
// We use simple state instead of React Router to keep things minimal.

import React, { useState } from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import History from "./pages/History";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  // "dashboard" | "leads" | "history" | "admin"
  const [activePage, setActivePage] = useState("dashboard");

  return (
    <div className="app-wrapper">
      <Navbar activePage={activePage} setActivePage={setActivePage} />

      <main className="main-content">
        {activePage === "dashboard" && <Dashboard />}
        {activePage === "leads" && <Leads />}
        {activePage === "history" && <History />}
        {activePage === "admin" && <AdminDashboard />}
      </main>
    </div>
  );
}

export default App;
