// components/Layout/Navbar.jsx - WITH FARM LOGO SUPPORT

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getInitials } from "../../utils/helpers";
import { getDocument, COLLECTIONS } from "../../firebase/firestore";

const Navbar = ({ toggleSidebar, isSidebarOpen }) => {
  const { currentUser, logout } = useAuth();
  const [farmName, setFarmName] = useState("");
  const [farmLogo, setFarmLogo] = useState(null);
  const [loading, setLoading] = useState(true);

  const userInitials = currentUser
    ? getInitials(currentUser.fullName || currentUser.name || "User")
    : "U";

  // ✅ Fetch farm name and logo from database using farmId
  useEffect(() => {
    const fetchFarmData = async () => {
      if (!currentUser?.farmId) {
        setLoading(false);
        return;
      }

      try {
        const farmData = await getDocument(
          COLLECTIONS.FARMS,
          currentUser.farmId,
        );
        if (farmData) {
          setFarmName(farmData.name || "");
          setFarmLogo(farmData.logoImageUrl || null);
        } else {
          setFarmName("");
          setFarmLogo(null);
        }
      } catch (error) {
        console.error("Error fetching farm data:", error);
        setFarmName("");
        setFarmLogo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFarmData();
  }, [currentUser?.farmId]);

  return (
    <header className="topbar">
      <button
        className="hamburger"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        ☰
      </button>

      <div className="brand">
        {/* ✅ Farm Logo - Show uploaded logo if exists, otherwise default icon */}
        {farmLogo ? (
          <img
            src={farmLogo}
            alt={farmName || "Farm Logo"}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              objectFit: "cover",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          />
        ) : (
          <svg viewBox="0 0 64 64" width="28" height="28">
            <circle cx="32" cy="32" r="30" fill="#125E5A" />
            <path
              d="M20 38c0-9 5-16 12-16s12 7 12 16"
              stroke="#EFF7F6"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="26" cy="26" r="2.4" fill="#EFF7F6" />
            <circle cx="38" cy="26" r="2.4" fill="#EFF7F6" />
            <path
              d="M22 18l3 5M42 18l-3 5"
              stroke="#C98A2B"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          </svg>
        )}

        <span
          style={{
            fontFamily: "Fraunces, serif",
            fontWeight: 700,
            fontSize: "0.95rem",
            color: "#fff",
            marginLeft: "4px",
          }}
        >
          {loading ? "LOADING..." : (farmName || "MY FARM").toUpperCase()}
        </span>
      </div>

      <div className="spacer"></div>
      <div className="top-actions">
        {currentUser && (
          <div className="user-badge">
            <div
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "50%",
                background: "#0f7a75",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.7rem",
                fontWeight: "bold",
                border: "2px solid #fff",
              }}
            >
              {userInitials}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                lineHeight: "1.2",
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  color: "#fff",
                  whiteSpace: "nowrap",
                }}
              >
                {currentUser.fullName || currentUser.name || "User"}
              </span>
              <span
                style={{
                  fontSize: "0.6rem",
                  color: "rgba(255,255,255,0.7)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {currentUser.role || "Worker"}
              </span>
            </div>

            <span className="logout-link" onClick={logout}>
              Logout
            </span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
