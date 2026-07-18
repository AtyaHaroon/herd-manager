// src/pages/goats/PalaiGoats.jsx - WITHOUT EMOJIS

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { goatService } from "../../services/goatService";
import Toast from "../../components/Common/Toast";
import Loader from "../../components/Common/Loader";
import { formatDate } from "../../utils/helpers";

// ============================================================
// Helper Functions
// ============================================================

/** Get status badge CSS class */
const getStatusBadgeClass = (status) => {
  const statusMap = {
    Healthy: "healthy",
    Pregnant: "pregnant",
    Lactating: "lactating",
    Dry: "dry",
    Sold: "sold",
    Dead: "dead",
    Quarantine: "quarantine",
    Active: "healthy",
    Deceased: "dead",
    Culled: "sold",
    Sick: "quarantine",
    Recovering: "healthy",
  };
  return statusMap[status] || "healthy";
};

/** Get gender display name */
const getGenderDisplay = (gender, stage) => {
  if (stage === "Kid") return "Kid";
  if (gender === "M") return "Buck";
  if (gender === "F") return "Doe";
  return gender || "—";
};

/** Format age from years to readable string */
const getAgeDisplay = (ageInYears) => {
  if (!ageInYears && ageInYears !== 0) return "—";

  const totalDays = Math.round(ageInYears * 365.25);
  if (totalDays === 0) return "< 1 day";

  const years = Math.floor(totalDays / 365);
  const remainingDays = totalDays % 365;
  const months = Math.floor(remainingDays / 30.44);
  const days = Math.round(remainingDays % 30.44);

  const parts = [];

  if (years > 0) {
    parts.push(`${years} yr${years > 1 ? "s" : ""}`);
  }

  if (months > 0) {
    parts.push(`${months} mon${months > 1 ? "s" : ""}`);
  }

  if (days > 0 && years === 0) {
    parts.push(`${days} day${days > 1 ? "s" : ""}`);
  } else if (days > 0 && years > 0 && months === 0) {
    parts.push(`${days} day${days > 1 ? "s" : ""}`);
  }

  if (years === 0 && months === 0 && days > 0) {
    return `${days} day${days > 1 ? "s" : ""}`;
  }

  return parts.join(" ") || "< 1 day";
};

/** Format currency in PKR */
const formatCurrency = (amount) => {
  if (!amount) return "—";
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// ============================================================
// Main Component
// ============================================================

const PalaiGoats = () => {
  const { currentUser } = useAuth();
  const [palaiGoats, setPalaiGoats] = useState([]);
  const [filteredGoats, setFilteredGoats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const farmId = currentUser?.farmId;

  // ============================================================
  // Data Loading
  // ============================================================

  const loadPalaiGoats = useCallback(async () => {
    if (!farmId) return;
    setLoading(true);
    try {
      const allGoats = await goatService.getByFarmId(farmId);
      const palai = allGoats.filter((goat) => goat.sourceType === "Palai");
      setPalaiGoats(palai);
      setFilteredGoats(palai);
    } catch (error) {
      console.error("Error loading Palai goats:", error);
      setToastMessage("Failed to load Palai goats.");
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    loadPalaiGoats();
  }, [loadPalaiGoats]);

  // ============================================================
  // Search & Filter Logic
  // ============================================================

  useEffect(() => {
    let result = palaiGoats;

    if (filterStatus !== "all") {
      result = result.filter((g) => g.status === filterStatus);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (g) =>
          g.tagId?.toLowerCase().includes(term) ||
          g.breed?.toLowerCase().includes(term) ||
          g.palaiPackageName?.toLowerCase().includes(term),
      );
    }

    setFilteredGoats(result);
  }, [searchTerm, filterStatus, palaiGoats]);

  // ============================================================
  // Stats Calculation
  // ============================================================

  const stats = {
    total: palaiGoats.length,
    healthy: palaiGoats.filter((g) => g.status === "Healthy").length,
    pregnant: palaiGoats.filter((g) => g.status === "Pregnant").length,
    lactating: palaiGoats.filter((g) => g.status === "Lactating").length,
    totalPalaiPrice: palaiGoats.reduce(
      (sum, g) => sum + (g.palaiTotalPrice || g.palaiPackagePrice || 0),
      0,
    ),
    withPackage: palaiGoats.filter((g) => g.palaiPackageName).length,
  };

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="panel active">
      {/* Header */}
      <div className="panel-head">
        <div>
          <h2>
            <span style={{ color: "#d9a23b" }}>Palai</span> Goats
          </h2>
          <div className="desc">
            View all goats under Palai packages with their details
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="overview-grid">
        <div className="ov-card" style={{ borderLeft: "4px solid #d9a23b" }}>
          <span className="ov-num">{stats.total}</span>
          <span className="ov-lbl">Total Palai Goats</span>
        </div>
        <div className="ov-card" style={{ borderLeft: "4px solid #4caf50" }}>
          <span className="ov-num">{stats.healthy}</span>
          <span className="ov-lbl">Healthy</span>
        </div>
        <div className="ov-card" style={{ borderLeft: "4px solid #ff9800" }}>
          <span className="ov-num">{stats.pregnant}</span>
          <span className="ov-lbl">Pregnant</span>
        </div>
        <div className="ov-card" style={{ borderLeft: "4px solid #2196f3" }}>
          <span className="ov-num">{stats.lactating}</span>
          <span className="ov-lbl">Lactating</span>
        </div>
        <div className="ov-card" style={{ borderLeft: "4px solid #d9a23b" }}>
          <span className="ov-num">
            {formatCurrency(stats.totalPalaiPrice)}
          </span>
          <span className="ov-lbl">Total Palai Value</span>
        </div>
        <div className="ov-card" style={{ borderLeft: "4px solid #9c27b0" }}>
          <span className="ov-num">{stats.withPackage}</span>
          <span className="ov-lbl">With Package</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by Tag, Breed, or Package..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="Healthy">Healthy</option>
          <option value="Pregnant">Pregnant</option>
          <option value="Lactating">Lactating</option>
          <option value="Dry">Dry</option>
          <option value="Sold">Sold</option>
          <option value="Dead">Dead</option>
          <option value="Quarantine">Quarantine</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div
          style={{ display: "flex", justifyContent: "center", padding: "40px" }}
        >
          <Loader />
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tag ID</th>
                <th>Breed</th>
                <th>Gender</th>
                <th>Age</th>
                <th>Status</th>
                <th>Package</th>
                <th>Package Price</th>
                <th>Total Price</th>
                <th>Features</th>
              </tr>
            </thead>
            <tbody>
              {filteredGoats.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty">
                    {searchTerm || filterStatus !== "all"
                      ? "No Palai goats match your search criteria."
                      : "No Palai goats found. Add goats with 'Palai' source type in Add Goat modal."}
                  </td>
                </tr>
              ) : (
                filteredGoats.map((goat, index) => (
                  <tr
                    key={goat.id}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <td>
                      <strong>{goat.tagId}</strong>
                      {/* Palai Badge */}
                      <span
                        style={{
                          display: "inline-block",
                          marginLeft: "6px",
                          fontSize: "0.45rem",
                          fontWeight: "700",
                          background:
                            "linear-gradient(135deg, #d9a23b, #b8862b)",
                          color: "#fff",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        Palai
                      </span>
                    </td>
                    <td>{goat.breed || "—"}</td>
                    <td>{getGenderDisplay(goat.gender, goat.stage)}</td>
                    <td>{getAgeDisplay(goat.age)}</td>
                    <td>
                      <span
                        className={`pill ${getStatusBadgeClass(goat.status)}`}
                      >
                        {goat.status}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 600,
                          color: "#b8862b",
                          fontSize: "0.7rem",
                        }}
                      >
                        {goat.palaiPackageName || "—"}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: "var(--gold)" }}>
                        {goat.palaiPackagePrice
                          ? formatCurrency(goat.palaiPackagePrice)
                          : "—"}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color: "#2e7d32",
                          fontSize: "0.8rem",
                        }}
                      >
                        {goat.palaiTotalPrice
                          ? formatCurrency(goat.palaiTotalPrice)
                          : goat.palaiPackagePrice
                          ? formatCurrency(goat.palaiPackagePrice)
                          : "—"}
                      </span>
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "2px",
                          maxWidth: "200px",
                        }}
                      >
                        {goat.palaiFeatures && goat.palaiFeatures.length > 0 ? (
                          goat.palaiFeatures.map((feature, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: "0.5rem",
                                background: "rgba(217, 162, 59, 0.12)",
                                color: "#9a6a1d",
                                padding: "1px 6px",
                                borderRadius: "4px",
                                whiteSpace: "nowrap",
                                textTransform: "capitalize",
                              }}
                            >
                              {feature.name}
                              {feature.price > 0 &&
                                ` (+${formatCurrency(feature.price)})`}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: "0.6rem", color: "#999" }}>
                            No features
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </div>
  );
};

export default PalaiGoats;
