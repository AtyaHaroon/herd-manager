// src/pages/Purchases.jsx - CLEAN VERSION (No Emojis)

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { goatService } from "../../services/goatService";
import Toast from "../../components/Common/Toast";
import Loader from "../../components/Common/Loader";
import {
  formatDate,
  formatCurrencyShort,
  formatCurrencyFull,
} from "../../utils/helpers";
import { GOAT_SOURCE_TYPES } from "../../utils/constants";

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

// ============================================================
// Main Component
// ============================================================

const Purchases = () => {
  const { currentUser } = useAuth();
  const [purchasedGoats, setPurchasedGoats] = useState([]);
  const [filteredGoats, setFilteredGoats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterBreed, setFilterBreed] = useState("all");
  const [filterPurchaseType, setFilterPurchaseType] = useState("all");

  const farmId = currentUser?.farmId;

  // ============================================================
  // Data Loading
  // ============================================================

  const loadPurchasedGoats = useCallback(async () => {
    if (!farmId) return;
    setLoading(true);
    try {
      const allGoats = await goatService.getByFarmId(farmId);
      const purchased = allGoats.filter(
        (goat) => goat.sourceType === GOAT_SOURCE_TYPES.PURCHASED,
      );
      setPurchasedGoats(purchased);
      setFilteredGoats(purchased);
    } catch (error) {
      console.error("Error loading purchased goats:", error);
      setToastMessage("Failed to load purchased goats.");
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    loadPurchasedGoats();
  }, [loadPurchasedGoats]);

  // ============================================================
  // Search & Filter Logic
  // ============================================================

  useEffect(() => {
    let result = purchasedGoats;

    if (filterStatus !== "all") {
      result = result.filter((g) => g.status === filterStatus);
    }

    if (filterBreed !== "all") {
      result = result.filter((g) => g.breed === filterBreed);
    }

    if (filterPurchaseType !== "all") {
      result = result.filter((g) => g.purchaseType === filterPurchaseType);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (g) =>
          g.tagId?.toLowerCase().includes(term) ||
          g.sellerName?.toLowerCase().includes(term) ||
          g.purchaseContact?.toLowerCase().includes(term) ||
          g.breed?.toLowerCase().includes(term),
      );
    }

    setFilteredGoats(result);
  }, [
    searchTerm,
    filterStatus,
    filterBreed,
    filterPurchaseType,
    purchasedGoats,
  ]);

  // ============================================================
  // Stats Calculation
  // ============================================================

  const stats = {
    total: purchasedGoats.length,
    local: purchasedGoats.filter((g) => g.purchaseType === "Local").length,
    imported: purchasedGoats.filter((g) => g.purchaseType === "Imported")
      .length,
    healthy: purchasedGoats.filter((g) => g.status === "Healthy").length,
    pregnant: purchasedGoats.filter((g) => g.status === "Pregnant").length,
    lactating: purchasedGoats.filter((g) => g.status === "Lactating").length,
    totalPrice: purchasedGoats.reduce(
      (sum, g) => sum + (g.purchasePrice || 0),
      0,
    ),
  };

  // ============================================================
  // Filter Options
  // ============================================================

  const uniqueBreeds = [
    ...new Set(purchasedGoats.map((g) => g.breed).filter(Boolean)),
  ];
  const purchaseTypes = ["Local", "Imported"];

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="panel active">
      {/* Header */}
      <div className="panel-head">
        <div>
          <h2>Purchased Goats</h2>
          <div className="desc">
            View and manage all purchased goats with their purchase details
          </div>
        </div>
      </div>

      {/* Stats Overview - Color Coded */}
      <div className="overview-grid">
        <div className="ov-card" style={{ borderLeft: "4px solid #16302e" }}>
          <span className="ov-num">{stats.total}</span>
          <span className="ov-lbl">Total Purchased</span>
        </div>
        <div className="ov-card" style={{ borderLeft: "4px solid #4caf50" }}>
          <span className="ov-num">{stats.local}</span>
          <span className="ov-lbl">Local</span>
        </div>
        <div className="ov-card" style={{ borderLeft: "4px solid #2196f3" }}>
          <span className="ov-num">{stats.imported}</span>
          <span className="ov-lbl">Imported</span>
        </div>
        <div className="ov-card" style={{ borderLeft: "4px solid #d9a23b" }}>
          <span className="ov-num">
            {formatCurrencyShort(stats.totalPrice)}
          </span>
          <span className="ov-lbl">Total Investment</span>
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
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by Tag, Seller, Contact, or Breed..."
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
        <select
          value={filterBreed}
          onChange={(e) => setFilterBreed(e.target.value)}
        >
          <option value="all">All Breeds</option>
          {uniqueBreeds.map((breed) => (
            <option key={breed} value={breed}>
              {breed}
            </option>
          ))}
        </select>
        <select
          value={filterPurchaseType}
          onChange={(e) => setFilterPurchaseType(e.target.value)}
        >
          <option value="all">All Types</option>
          {purchaseTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
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
                <th>Seller</th>
                <th>Contact</th>
                <th>Purchase Date</th>
                <th>Price</th>
                <th>Type</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredGoats.length === 0 ? (
                <tr>
                  <td colSpan="11" className="empty">
                    {searchTerm ||
                    filterStatus !== "all" ||
                    filterBreed !== "all" ||
                    filterPurchaseType !== "all"
                      ? "No purchased goats match your search criteria."
                      : "No purchased goats found. Add goats with 'Purchased' source type."}
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
                    <td>{goat.sellerName || "—"}</td>
                    <td>{goat.purchaseContact || "—"}</td>
                    <td>
                      {goat.purchaseDate ? formatDate(goat.purchaseDate) : "—"}
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 600,
                          color: "var(--gold)",
                          cursor: "default",
                        }}
                        title={
                          goat.purchasePrice
                            ? formatCurrencyFull(goat.purchasePrice)
                            : "—"
                        }
                      >
                        {goat.purchasePrice
                          ? formatCurrencyShort(goat.purchasePrice)
                          : "—"}
                      </span>
                    </td>
                    <td>
                      {/* ✅ Color-coded purchase type pill */}
                      <span
                        className="pill"
                        style={
                          goat.purchaseType === "Local"
                            ? {
                                background: "rgba(76, 175, 80, 0.15)",
                                color: "#2e7d32",
                                fontWeight: 600,
                              }
                            : goat.purchaseType === "Imported"
                            ? {
                                background: "rgba(33, 150, 243, 0.15)",
                                color: "#0d47a1",
                                fontWeight: 600,
                              }
                            : {
                                background: "rgba(158, 158, 158, 0.15)",
                                color: "#616161",
                              }
                        }
                      >
                        {goat.purchaseType || "—"}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.65rem", color: "#766d5d" }}>
                        {goat.purchaseNote || "—"}
                      </span>
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

export default Purchases;
