// src/pages/Kidding.jsx - FIXED (Buck ID showing, No Icons)

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { kiddingService } from "../../services/kiddingService";
import { goatService } from "../../services/goatService";
import Toast from "../../components/Common/Toast";
import Loader from "../../components/Common/Loader";
import ConfirmModal from "../../components/Common/ConfirmModal";
import { formatDate } from "../../utils/helpers";

// ✅ Helper: Get stage based on age and gender
const getStageForKid = (ageInYears, gender) => {
  if (ageInYears < 1) return "Kid";
  return gender === "F" ? "Doe" : "Buck";
};

// ✅ Helper: Get health status based on weight and age
const getHealthStatus = (weight, ageInYears) => {
  if (!weight) return "Healthy";

  if (ageInYears < 1) {
    if (weight < 1.5) return "Weak";
    if (weight >= 1.5 && weight < 2) return "Healthy (Low Weight)";
    return "Healthy";
  }

  if (weight < 20) return "Weak";
  if (weight >= 20 && weight < 25) return "Healthy (Low Weight)";
  if (weight >= 25 && weight <= 45) return "Healthy";
  if (weight > 45) return "Overweight";

  return "Healthy";
};

// ✅ Helper: Get status badge class (No Icons)
const getStatusBadgeClass = (status) => {
  const statusMap = {
    Healthy: "healthy",
    "Healthy (Low Weight)": "due",
    Weak: "overdue",
    Overweight: "sold",
    Stillborn: "dead",
    Dead: "dead",
  };
  return statusMap[status] || "healthy";
};

// ✅ Helper: Get kid status badge with label (No Icons)
const getKidStatusBadge = (status) => {
  const statusMap = {
    Healthy: { className: "pill healthy", label: "Healthy" },
    "Healthy (Low Weight)": { className: "pill due", label: "Low Weight" },
    Weak: { className: "pill overdue", label: "Weak" },
    Overweight: { className: "pill sold", label: "Overweight" },
    Stillborn: { className: "pill dead", label: "Stillborn" },
    Dead: { className: "pill dead", label: "Dead" },
  };
  return statusMap[status] || statusMap["Healthy"];
};

const Kidding = () => {
  const { currentUser } = useAuth();
  const farmId = currentUser?.farmId;

  const [kiddingRecords, setKiddingRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [goats, setGoats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // ✅ Delete state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isMounted = useRef(true);

  // ✅ Load all data
  const loadData = useCallback(async () => {
    if (!farmId || !isMounted.current) return;

    setLoading(true);
    try {
      const [kiddingData, goatsData] = await Promise.all([
        kiddingService.getByFarmId(farmId),
        goatService.getByFarmId(farmId),
      ]);

      if (isMounted.current) {
        setGoats(goatsData);
        const sorted = (kiddingData || []).sort(
          (a, b) => new Date(b.kiddingDate) - new Date(a.kiddingDate),
        );
        setKiddingRecords(sorted);
        setFilteredRecords(sorted);
      }
    } catch (error) {
      console.error("Error loading kidding records:", error);
      if (isMounted.current) {
        setToastMessage("Failed to load kidding records.");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [farmId]);

  useEffect(() => {
    isMounted.current = true;
    loadData();

    return () => {
      isMounted.current = false;
    };
  }, [loadData]);

  // ✅ Filter logic
  useEffect(() => {
    let result = kiddingRecords;

    if (filterStatus !== "all") {
      result = result.filter((r) => {
        return r.kids?.some((k) => k.status === filterStatus);
      });
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.goatTagId?.toLowerCase().includes(term) ||
          r.notes?.toLowerCase().includes(term) ||
          r.kids?.some((k) => k.tagId?.toLowerCase().includes(term)),
      );
    }

    setFilteredRecords(result);
  }, [searchTerm, filterStatus, kiddingRecords]);

  // ✅ Get goat info by ID
  const getGoatInfo = (id) => {
    if (!id) return "Unknown";
    const goat = goats.find((g) => g.id === id);
    return goat ? `${goat.tagId} - ${goat.breed}` : "Unknown";
  };

  // ✅ Get father info - FIXED: Shows buck tag ID
  const getFatherInfo = (record) => {
    // First check if fatherTagId exists directly in record
    if (record.fatherTagId) {
      return record.fatherTagId;
    }

    // Then check if fatherId exists
    if (record.fatherId) {
      const goat = goats.find((g) => g.id === record.fatherId);
      if (goat) return goat.tagId;
    }

    // Check breeding record for buck info
    if (record.breedingId) {
      // Try to find buck from breeding data stored in record
      if (record.buckTagId) return record.buckTagId;
      if (record.buckId) {
        const goat = goats.find((g) => g.id === record.buckId);
        if (goat) return goat.tagId;
      }
    }

    return "—";
  };

  // ✅ Get actual goat data for a kid
  const getGoatForKid = (kidId) => {
    if (!kidId) return null;
    return goats.find((g) => g.id === kidId) || null;
  };

  // ✅ Handle delete click
  const handleDeleteClick = (record) => {
    setRecordToDelete(record);
    setDeleteConfirmOpen(true);
  };

  // ✅ Confirm delete
  const confirmDelete = async () => {
    if (!recordToDelete) return;

    setDeleting(true);
    try {
      await kiddingService.delete(recordToDelete.id);
      setToastMessage(
        `Kidding record for ${
          recordToDelete.goatTagId || "goat"
        } deleted successfully.`,
      );
      await loadData();
    } catch (error) {
      console.error("Error deleting kidding record:", error);
      setToastMessage("Failed to delete kidding record.");
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setRecordToDelete(null);
    }
  };

  // ✅ Stats
  const stats = {
    total: kiddingRecords.length,
    totalKids: kiddingRecords.reduce(
      (sum, r) => sum + (r.kidCount || r.numberOfKids || 0),
      0,
    ),
    healthyKids: kiddingRecords.reduce((sum, r) => {
      if (!r.kids) return sum;
      return (
        sum +
        r.kids.filter(
          (k) => k.status === "Healthy" || k.status === "Healthy (Low Weight)",
        ).length
      );
    }, 0),
    weakKids: kiddingRecords.reduce((sum, r) => {
      if (!r.kids) return sum;
      return sum + r.kids.filter((k) => k.status === "Weak").length;
    }, 0),
    stillbornKids: kiddingRecords.reduce((sum, r) => {
      if (!r.kids) return sum;
      return sum + r.kids.filter((k) => k.status === "Stillborn").length;
    }, 0),
  };

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

  // ✅ Get unique statuses for filter
  const uniqueStatuses = [
    ...new Set(
      kiddingRecords.flatMap((r) => r.kids?.map((k) => k.status) || []),
    ),
  ].filter(Boolean);

  return (
    <div className="panel active">
      {/* Header */}
      <div className="panel-head">
        <div>
          <h2>Kidding Records</h2>
          <div className="desc">
            Track all kidding events, birth details, and kids information. Kids
            status auto-updates based on weight and age.
          </div>
        </div>
        <div style={{ fontSize: "0.7rem", color: "#766d5d" }}>
          Total Kids: {stats.totalKids} | Healthy: {stats.healthyKids} | Weak:{" "}
          {stats.weakKids} | Stillborn: {stats.stillbornKids}
        </div>
      </div>

      {/* Stats Overview - No Icons */}
      <div className="overview-grid">
        <div className="ov-card">
          <span className="ov-num">{stats.total}</span>
          <span className="ov-lbl">Total Records</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(76, 175, 80, 0.08)" }}
        >
          <span className="ov-num">{stats.totalKids}</span>
          <span className="ov-lbl">Total Kids Born</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(76, 175, 80, 0.12)" }}
        >
          <span className="ov-num">{stats.healthyKids}</span>
          <span className="ov-lbl">Healthy</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(255, 152, 0, 0.12)" }}
        >
          <span className="ov-num">{stats.weakKids}</span>
          <span className="ov-lbl">Weak</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(244, 67, 54, 0.12)" }}
        >
          <span className="ov-num">{stats.stillbornKids}</span>
          <span className="ov-lbl">Stillborn</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by Goat Tag or Kid Tag..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Kid Status</option>
          {uniqueStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Kidding Date</th>
              <th>Mother (Dam)</th>
              <th>Father (Buck)</th>
              <th>Breeding Type</th>
              <th>Kid Details</th>
              <th>Notes</th>
              <th style={{ width: "80px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty">
                  {searchTerm || filterStatus !== "all"
                    ? "No kidding records match your search criteria."
                    : "No kidding records yet. Kidding records are created from Pregnancy page when a goat delivers."}
                </td>
              </tr>
            ) : (
              filteredRecords.map((record, index) => {
                const kids = record.kids || [];
                const kidCount =
                  kids.length || record.kidCount || record.numberOfKids || 0;

                // ✅ Get father display using the fixed function
                const fatherDisplay = getFatherInfo(record);

                return (
                  <tr
                    key={record.id}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <td>
                      <strong>{formatDate(record.kiddingDate)}</strong>
                    </td>
                    <td>
                      <strong>{getGoatInfo(record.goatId)}</strong>
                      {record.goatTagId && (
                        <span
                          style={{
                            fontSize: "0.5rem",
                            color: "#766d5d",
                            display: "block",
                          }}
                        >
                          Tag: {record.goatTagId}
                        </span>
                      )}
                    </td>
                    <td>
                      <strong>{fatherDisplay}</strong>
                      {record.breedingType && fatherDisplay !== "—" && (
                        <span
                          style={{
                            fontSize: "0.5rem",
                            color: "#766d5d",
                            display: "block",
                          }}
                        >
                          {record.breedingType}
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`pill ${
                          record.breedingType === "AI" ? "healthy" : "income"
                        }`}
                        style={{ fontSize: "0.55rem" }}
                      >
                        {record.breedingType || "Natural"}
                      </span>
                    </td>
                    <td>
                      {kids.length > 0 ? (
                        <div
                          className="kids-details"
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                          }}
                        >
                          {kids.map((kid, idx) => {
                            const kidGoat = getGoatForKid(kid.id);
                            const age = kidGoat?.age || 0;
                            const stage = getStageForKid(age, kid.gender);
                            const healthStatus = getHealthStatus(
                              kid.birthWeight,
                              age,
                            );

                            const finalStatus =
                              kid.status === "Stillborn"
                                ? "Stillborn"
                                : healthStatus;
                            const statusBadge = getKidStatusBadge(finalStatus);
                            const badgeClass = getStatusBadgeClass(finalStatus);

                            return (
                              <div
                                key={kid.id || idx}
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "4px 8px",
                                  background: "rgba(15, 122, 117, 0.05)",
                                  borderRadius: "6px",
                                  border: "1px solid var(--line)",
                                }}
                              >
                                <span
                                  style={{
                                    fontWeight: 700,
                                    fontSize: "0.65rem",
                                  }}
                                >
                                  {kid.tagId || `Kid ${idx + 1}`}
                                </span>

                                <span
                                  style={{
                                    fontSize: "0.55rem",
                                    color: "#766d5d",
                                  }}
                                >
                                  {kid.gender || "Unknown"}
                                </span>

                                <span
                                  style={{
                                    fontSize: "0.55rem",
                                    color: "var(--pasture)",
                                  }}
                                >
                                  Stage: {stage}
                                </span>

                                {kid.birthWeight && (
                                  <span
                                    style={{
                                      fontSize: "0.55rem",
                                      color: "#766d5d",
                                    }}
                                  >
                                    {kid.birthWeight} kg
                                  </span>
                                )}

                                {age > 0 && (
                                  <span
                                    style={{
                                      fontSize: "0.5rem",
                                      color: "#766d5d",
                                    }}
                                  >
                                    Age: {age.toFixed(1)} yrs
                                  </span>
                                )}

                                <span
                                  className={`pill ${badgeClass}`}
                                  style={{ fontSize: "0.5rem" }}
                                >
                                  {statusBadge.label}
                                </span>
                              </div>
                            );
                          })}
                          {kids.length === 0 && (
                            <span
                              style={{ color: "#766d5d", fontSize: "0.6rem" }}
                            >
                              No individual kid records
                            </span>
                          )}
                        </div>
                      ) : kidCount > 0 ? (
                        <span style={{ color: "#766d5d", fontSize: "0.6rem" }}>
                          {kidCount} kid(s) - Details not available
                        </span>
                      ) : (
                        <span style={{ color: "#766d5d", fontSize: "0.6rem" }}>
                          No kids recorded
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: "0.65rem", color: "#766d5d" }}>
                        {record.notes || "—"}
                      </span>
                      {record.birthWeight && (
                        <span
                          style={{
                            fontSize: "0.5rem",
                            color: "var(--pasture)",
                            display: "block",
                          }}
                        >
                          Avg Weight: {record.birthWeight} kg
                        </span>
                      )}
                    </td>
                    {/* Actions Column with Delete Button - No Icon */}
                    <td>
                      <button
                        className="btn btn-danger btn-small"
                        onClick={() => handleDeleteClick(record)}
                        disabled={deleting}
                        style={{ width: "100%" }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Kidding Record"
        message={`Are you sure you want to delete the kidding record for "${
          recordToDelete?.goatTagId || "goat"
        }" on ${formatDate(
          recordToDelete?.kiddingDate,
        )}? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={deleting}
      />

      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </div>
  );
};

export default Kidding;
