// Settings.jsx
import React from "react";
import Toast from "../../components/Common/Toast";
import { useState } from "react";

const Settings = () => {
  const [toastMessage, setToastMessage] = useState("");

  const handleClearData = () => {
    if (
      window.confirm(
        "Are you sure you want to delete ALL data? This cannot be undone!",
      )
    ) {
      localStorage.removeItem("goatManagerData");
      setToastMessage("All data cleared successfully! Refresh the page.");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  return (
    <div className="panel active">
      <div className="panel-head">
        <div>
          <h2> Settings</h2>
          <div className="desc">Users, roles, farms, backup, profile</div>
        </div>
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}
      >
        <div className="card">
          <h3 style={{ fontSize: "0.9rem" }}> Users & Roles</h3>
          <button
            className="btn btn-ghost btn-small"
            onClick={() => alert("Manage users")}
          >
            Manage
          </button>
        </div>
        <div className="card">
          <h3 style={{ fontSize: "0.9rem" }}>Farms</h3>
          <button
            className="btn btn-ghost btn-small"
            onClick={() => alert("Manage farms")}
          >
            Manage
          </button>
        </div>
        <div className="card">
          <h3 style={{ fontSize: "0.9rem" }}> Backup</h3>
          <button
            className="btn btn-ghost btn-small"
            onClick={() => alert("Backup initiated")}
          >
            Backup
          </button>
        </div>
        <div className="card">
          <h3 style={{ fontSize: "0.9rem" }}>Change Password</h3>
          <button
            className="btn btn-ghost btn-small"
            onClick={() => alert("Password change")}
          >
            Change
          </button>
        </div>
        <div className="card" style={{ gridColumn: "1 / -1" }}>
          <h3 style={{ fontSize: "0.9rem", color: "#d32f2f" }}>
             Danger Zone
          </h3>
          <button className="btn btn-danger" onClick={handleClearData}>
            Clear All Data (Local Storage)
          </button>
        </div>
      </div>
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </div>
  );
};

export default Settings;
