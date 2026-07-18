// src/pages/RolePages.jsx - NO ICONS

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getCollection,
  updateDocument,
  COLLECTIONS,
} from "../../firebase/firestore";
import { USER_ROLES, ROUTES } from "../../utils/constants";
import Toast from "../../components/Common/Toast";
import Loader from "../../components/Common/Loader";

const DASHBOARD_PAGE = {
  id: "dashboard",
  label: "Dashboard",
  path: ROUTES.DASHBOARD,
  alwaysVisible: true,
};

const TOGGLEABLE_PAGES = [
  {
    id: "goats",
    label: "Goats",
    path: ROUTES.GOATS,
    alwaysVisible: false,
  },
  {
    id: "purchases",
    label: "Purchases",
    path: ROUTES.PURCHASES,
    alwaysVisible: false,
  },
  {
    id: "milk",
    label: "Milk",
    path: ROUTES.MILK,
    alwaysVisible: false,
  },
  {
    id: "vaccines",
    label: "Vaccines",
    path: ROUTES.VACCINES,
    alwaysVisible: false,
  },
  {
    id: "breeding",
    label: "Breeding",
    path: ROUTES.BREEDING,
    alwaysVisible: false,
  },
  {
    id: "pregnancy",
    label: "Pregnancy",
    path: ROUTES.PREGNANCY,
    alwaysVisible: false,
  },
  {
    id: "kidding",
    label: "Kidding",
    path: ROUTES.KIDDING,
    alwaysVisible: false,
  },
  {
    id: "feed",
    label: "Feed",
    path: ROUTES.FEED,
    alwaysVisible: false,
  },
  {
    id: "medication",
    label: "Medication",
    path: ROUTES.MEDICATION,
    alwaysVisible: false,
  },
  {
    id: "financial",
    label: "Financial",
    path: ROUTES.FINANCIAL,
    alwaysVisible: false,
  },
  {
    id: "reports",
    label: "Reports",
    path: ROUTES.REPORTS,
    alwaysVisible: false,
  },
];

const ALL_PAGES = [DASHBOARD_PAGE, ...TOGGLEABLE_PAGES];

const RolePages = () => {
  const { currentUser } = useAuth();
  const [roleConfigs, setRoleConfigs] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [selectedRole, setSelectedRole] = useState(USER_ROLES.MANAGER);

  const loadRoleConfigs = useCallback(async () => {
    if (currentUser?.role !== USER_ROLES.OWNER) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const configs = await getCollection(COLLECTIONS.ROLE_CONFIGS, [
        { field: "farmId", operator: "==", value: currentUser.farmId },
      ]);

      if (configs && configs.length > 0) {
        setRoleConfigs(configs[0]);
      } else {
        const defaultConfig = {
          farmId: currentUser.farmId,
          [USER_ROLES.MANAGER]: ALL_PAGES.map((p) => p.id),
          [USER_ROLES.WORKER]: ALL_PAGES.map((p) => p.id),
          updatedAt: new Date(),
        };
        setRoleConfigs(defaultConfig);
      }
    } catch (error) {
      console.error("Error loading role configs:", error);
      setToastMessage("Failed to load page configurations");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadRoleConfigs();
  }, [loadRoleConfigs]);

  const getVisiblePages = (role) => {
    const configured = roleConfigs[role] || [];
    const dashboardAlwaysVisible = ["dashboard"];
    const allVisible = [...new Set([...dashboardAlwaysVisible, ...configured])];
    return allVisible;
  };

  const togglePage = (pageId) => {
    if (pageId === "dashboard") {
      setToastMessage("Dashboard is always visible and cannot be hidden");
      return;
    }

    const currentPages = getVisiblePages(selectedRole);
    const newPages = currentPages.includes(pageId)
      ? currentPages.filter((p) => p !== pageId)
      : [...currentPages, pageId];

    setRoleConfigs((prev) => ({
      ...prev,
      [selectedRole]: newPages,
      updatedAt: new Date(),
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const configData = {
        ...roleConfigs,
        updatedAt: new Date(),
      };

      const existing = await getCollection(COLLECTIONS.ROLE_CONFIGS, [
        { field: "farmId", operator: "==", value: currentUser.farmId },
      ]);

      if (existing && existing.length > 0) {
        await updateDocument(
          COLLECTIONS.ROLE_CONFIGS,
          existing[0].id,
          configData,
        );
      } else {
        const { addDocument } = await import("../firebase/firestore");
        await addDocument(COLLECTIONS.ROLE_CONFIGS, configData);
      }

      setToastMessage(`Page configurations saved for ${selectedRole}s!`);
    } catch (error) {
      console.error("Error saving configs:", error);
      setToastMessage("Failed to save configurations");
    } finally {
      setSaving(false);
    }
  };

  const getPageStatus = (pageId) => {
    if (pageId === "dashboard") {
      return "always-visible";
    }
    const visiblePages = getVisiblePages(selectedRole);
    return visiblePages.includes(pageId) ? "visible" : "hidden";
  };

  if (currentUser?.role !== USER_ROLES.OWNER) {
    return (
      <div className="panel active">
        <div style={{ padding: "40px", textAlign: "center" }}>
          <h2>Access Denied</h2>
          <p>Only Farm Owners can manage page visibility.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="panel active">
        <div
          style={{ display: "flex", justifyContent: "center", padding: "40px" }}
        >
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className="panel active">
      <div className="panel-head">
        <div>
          <h2>Role Page Visibility</h2>
          <div className="desc">
            Control which pages are visible to Managers and Workers
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Role Selector */}
      <div className="filter-bar" style={{ marginBottom: "16px" }}>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          style={{
            padding: "8px 14px",
            borderRadius: "10px",
            border: "1.5px solid var(--line)",
            fontFamily: "Manrope, sans-serif",
            fontWeight: 600,
            background: "#fff",
            fontSize: "0.75rem",
          }}
        >
          <option value={USER_ROLES.MANAGER}>Manager</option>
          <option value={USER_ROLES.WORKER}>Worker</option>
        </select>
        <span
          style={{ fontSize: "0.7rem", color: "#766d5d", marginLeft: "8px" }}
        >
          Toggle pages to show/hide for {selectedRole}s
        </span>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            background: "#e3f2fd",
            padding: "6px 14px",
            borderRadius: "8px",
            fontSize: "0.7rem",
            border: "2px solid #2196f3",
          }}
        >
          Dashboard: <strong>Always Visible</strong> (Cannot be hidden)
        </div>
        <div
          style={{
            background: "#e8f5e9",
            padding: "6px 14px",
            borderRadius: "8px",
            fontSize: "0.7rem",
          }}
        >
          Visible: <strong>{getVisiblePages(selectedRole).length - 1}</strong>{" "}
          pages
        </div>
        <div
          style={{
            background: "#fce4ec",
            padding: "6px 14px",
            borderRadius: "8px",
            fontSize: "0.7rem",
          }}
        >
          Hidden:{" "}
          <strong>
            {TOGGLEABLE_PAGES.length -
              (getVisiblePages(selectedRole).length - 1)}
          </strong>{" "}
          pages
        </div>
        <div
          style={{
            background: "#fff3e0",
            padding: "6px 14px",
            borderRadius: "8px",
            fontSize: "0.7rem",
          }}
        >
          Total: <strong>{ALL_PAGES.length}</strong> pages
        </div>
      </div>

      {/* Page Grid */}
      <div
        className="grid"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}
      >
        {ALL_PAGES.map((page) => {
          const status = getPageStatus(page.id);
          const isVisible = status === "visible" || status === "always-visible";
          const isDashboard = page.id === "dashboard";

          const getStyles = () => {
            if (isDashboard) {
              return {
                background: "linear-gradient(135deg, #2196f3, #1976d2)",
                border: "3px solid #0d47a1",
                color: "#fff",
                cursor: "not-allowed",
                boxShadow: "0 4px 12px rgba(33, 150, 243, 0.3)",
              };
            }
            return {
              background: isVisible
                ? "linear-gradient(135deg, #e8f5e9, #c8e6c9)"
                : "linear-gradient(135deg, #fce4ec, #ffcdd2)",
              border: `2px solid ${isVisible ? "#81c784" : "#ef9a9a"}`,
              cursor: "pointer",
            };
          };

          return (
            <div
              key={page.id}
              onClick={() => togglePage(page.id)}
              style={{
                ...getStyles(),
                borderRadius: "12px",
                padding: "14px 12px",
                textAlign: "center",
                transition: "all 0.2s ease",
                position: "relative",
                minHeight: "80px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: isDashboard ? "#fff" : "#16302e",
                }}
              >
                {page.label}
              </div>
              <div
                style={{
                  fontSize: "0.5rem",
                  marginTop: "4px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: isDashboard
                    ? "#bbdefb"
                    : isVisible
                    ? "#2e7d32"
                    : "#c62828",
                }}
              >
                {isDashboard
                  ? "Always Visible"
                  : isVisible
                  ? "Visible"
                  : "Hidden"}
              </div>
              {isDashboard && (
                <div
                  style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-6px",
                    background: "#ffd700",
                    color: "#000",
                    fontSize: "0.5rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "10px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  }}
                >
                  LOCKED
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: "20px",
          padding: "12px 16px",
          background: "#fff",
          borderRadius: "12px",
          border: "1px solid var(--line)",
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          fontSize: "0.65rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              background: "#2196f3",
              padding: "2px 10px",
              borderRadius: "4px",
              color: "#fff",
              fontWeight: 700,
            }}
          >
            ALWAYS
          </span>
          <span>
            <strong>Dashboard</strong> - Always visible (Cannot be hidden)
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              background: "#e8f5e9",
              padding: "2px 8px",
              borderRadius: "4px",
            }}
          >
            VISIBLE
          </span>
          <span>Visible - Click to hide</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              background: "#fce4ec",
              padding: "2px 8px",
              borderRadius: "4px",
            }}
          >
            HIDDEN
          </span>
          <span>Hidden - Click to show</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              background: "#fff3e0",
              padding: "2px 8px",
              borderRadius: "4px",
            }}
          >
            TOGGLE
          </span>
          <span>
            <strong>All other pages are toggleable</strong> - Owner has full
            control
          </span>
        </div>
      </div>

      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </div>
  );
};

export default RolePages;
