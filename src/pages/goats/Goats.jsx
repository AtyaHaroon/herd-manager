// src/pages/Goats.jsx - WITH SELL/DEAD MODALS (No Extra Page)

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { goatService } from "../../services/goatService";
import AddGoatModal from "../Add/AddGoatModal";
import ConfirmModal from "../../components/Common/ConfirmModal";
import Modal from "../../components/Common/Modal";
import Button from "../../components/Common/Button";
import Toast from "../../components/Common/Toast";
import Loader from "../../components/Common/Loader";
import { formatDate, formatCurrencyFull } from "../../utils/helpers";

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

/** Get source badge CSS class */
const getSourceBadgeClass = (source) => {
  if (source === "HomeBred") return "homebred";
  if (source === "Purchased") return "purchased";
  if (source === "Palai") return "palai";
  return "";
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

/** Get quarantine days remaining */
const getQuarantineDaysLeft = (goat) => {
  if (!goat.quarantineStartDate || !goat.quarantineDays) return null;
  const startDate = new Date(goat.quarantineStartDate + "T00:00:00");
  startDate.setDate(startDate.getDate() + parseInt(goat.quarantineDays));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

// ============================================================
// Main Component
// ============================================================

const Goats = () => {
  const { currentUser } = useAuth();
  const [goats, setGoats] = useState([]);
  const [filteredGoats, setFilteredGoats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoat, setEditingGoat] = useState(null);

  // Delete state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [goatToDelete, setGoatToDelete] = useState(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");
  const [toastMessage, setToastMessage] = useState("");

  // Sell Modal states
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [selectedGoat, setSelectedGoat] = useState(null);
  const [sellForm, setSellForm] = useState({
    saleDate: "",
    salePrice: "",
    buyerName: "",
    buyerContact: "",
    saleNotes: "",
  });

  // Dead Modal states
  const [deadModalOpen, setDeadModalOpen] = useState(false);
  const [deadForm, setDeadForm] = useState({
    deathDate: "",
    deathReason: "",
    deathNotes: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const farmId = currentUser?.farmId;

  // ============================================================
  // Data Loading
  // ============================================================

  const loadGoats = useCallback(async () => {
    if (!farmId) return;
    setLoading(true);
    try {
      const data = await goatService.getByFarmId(farmId);
      setGoats(data);
      setFilteredGoats(data);
    } catch (error) {
      console.error("Error loading goats:", error);
      setToastMessage("Failed to load goat data.");
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    loadGoats();
  }, [loadGoats]);

  // ============================================================
  // Search & Filter Logic
  // ============================================================

  useEffect(() => {
    let result = goats;

    if (filterStatus === "active") {
      result = result.filter((g) => g.status !== "Sold" && g.status !== "Dead");
    } else if (filterStatus !== "all") {
      result = result.filter((g) => g.status === filterStatus);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (g) =>
          g.tagId?.toLowerCase().includes(term) ||
          g.breed?.toLowerCase().includes(term) ||
          g.buyerName?.toLowerCase().includes(term) ||
          g.deathReason?.toLowerCase().includes(term),
      );
    }

    setFilteredGoats(result);
  }, [searchTerm, filterStatus, goats]);

  // ============================================================
  // CRUD Handlers
  // ============================================================

  const handleAddNew = () => {
    setEditingGoat(null);
    setIsModalOpen(true);
  };

  const handleEdit = (goat) => {
    setEditingGoat(goat);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (goat) => {
    setGoatToDelete(goat);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!goatToDelete) return;
    try {
      await goatService.delete(goatToDelete.id);
      setToastMessage(`Goat ${goatToDelete.tagId} deleted successfully.`);
      await loadGoats();
    } catch (error) {
      console.error("Error deleting goat:", error);
      setToastMessage("Failed to delete goat.");
    } finally {
      setDeleteConfirmOpen(false);
      setGoatToDelete(null);
    }
  };

  // ============================================================
  // Quarantine Handler
  // ============================================================

  const handleCompleteQuarantine = async (goat) => {
    try {
      await goatService.update(goat.id, {
        status: "Healthy",
        quarantineDays: null,
        quarantineStartDate: null,
        quarantineCompletedDate: new Date().toISOString().split("T")[0],
        updatedAt: new Date(),
      });
      setToastMessage(`${goat.tagId} quarantine completed! Status: Healthy`);
      await loadGoats();
    } catch (error) {
      console.error("Error completing quarantine:", error);
      setToastMessage("Failed to complete quarantine.");
    }
  };

  // ============================================================
  // Sell & Dead Modal Handlers
  // ============================================================

  const handleOpenSell = (goat) => {
    setSelectedGoat(goat);
    setSellForm({
      saleDate: new Date().toISOString().split("T")[0],
      salePrice: "",
      buyerName: "",
      buyerContact: "",
      saleNotes: "",
    });
    setSellModalOpen(true);
  };

  const handleOpenDead = (goat) => {
    setSelectedGoat(goat);
    setDeadForm({
      deathDate: new Date().toISOString().split("T")[0],
      deathReason: "",
      deathNotes: "",
    });
    setDeadModalOpen(true);
  };

  const handleSellSubmit = async () => {
    if (!selectedGoat) return;

    if (!sellForm.saleDate) {
      setToastMessage("Please select sale date");
      return;
    }
    if (!sellForm.salePrice || sellForm.salePrice <= 0) {
      setToastMessage("Please enter valid sale price");
      return;
    }
    if (!sellForm.buyerName.trim()) {
      setToastMessage("Please enter buyer name");
      return;
    }

    setSubmitting(true);
    try {
      await goatService.update(selectedGoat.id, {
        status: "Sold",
        isActive: false,
        saleDate: sellForm.saleDate,
        salePrice: parseFloat(sellForm.salePrice),
        buyerName: sellForm.buyerName.trim(),
        buyerContact: sellForm.buyerContact.trim() || null,
        saleNotes: sellForm.saleNotes.trim() || null,
        updatedAt: new Date(),
      });
      setToastMessage(`${selectedGoat.tagId} marked as Sold!`);
      setSellModalOpen(false);
      setSelectedGoat(null);
      await loadGoats();
    } catch (error) {
      console.error("Error marking as sold:", error);
      setToastMessage("Failed to mark as sold.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeadSubmit = async () => {
    if (!selectedGoat) return;

    if (!deadForm.deathDate) {
      setToastMessage("Please select death date");
      return;
    }
    if (!deadForm.deathReason.trim()) {
      setToastMessage("Please enter death reason");
      return;
    }

    setSubmitting(true);
    try {
      await goatService.update(selectedGoat.id, {
        status: "Dead",
        isActive: false,
        deathDate: deadForm.deathDate,
        deathReason: deadForm.deathReason.trim(),
        deathNotes: deadForm.deathNotes.trim() || null,
        updatedAt: new Date(),
      });
      setToastMessage(`${selectedGoat.tagId} marked as Dead!`);
      setDeadModalOpen(false);
      setSelectedGoat(null);
      await loadGoats();
    } catch (error) {
      console.error("Error marking as dead:", error);
      setToastMessage("Failed to mark as dead.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalSuccess = () => {
    loadGoats();
    setToastMessage(
      editingGoat ? "Goat updated successfully!" : "Goat added successfully!",
    );
  };

  // ============================================================
  // Stats Calculation
  // ============================================================

  const stats = {
    total: goats.length,
    healthy: goats.filter((g) => g.status === "Healthy").length,
    pregnant: goats.filter((g) => g.status === "Pregnant").length,
    lactating: goats.filter((g) => g.status === "Lactating").length,
    quarantine: goats.filter((g) => g.status === "Quarantine").length,
    sold: goats.filter((g) => g.status === "Sold").length,
    dead: goats.filter((g) => g.status === "Dead").length,
  };

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="panel active">
      {/* Header */}
      <div className="panel-head">
        <div>
          <h2>Goat Management</h2>
          <div className="desc">Manage all goats with detailed records</div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button className="btn btn-primary" onClick={handleAddNew}>
            + Add Goat
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="overview-grid">
        <div className="ov-card">
          <span className="ov-num">{stats.total}</span>
          <span className="ov-lbl">Total Goats</span>
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
        <div className="ov-card" style={{ borderLeft: "4px solid #ff5722" }}>
          <span className="ov-num">{stats.quarantine}</span>
          <span className="ov-lbl">Quarantine</span>
        </div>
        <div className="ov-card" style={{ borderLeft: "4px solid #2e7d32" }}>
          <span className="ov-num">{stats.sold}</span>
          <span className="ov-lbl">Sold</span>
        </div>
        <div className="ov-card" style={{ borderLeft: "4px solid #b0473e" }}>
          <span className="ov-num">{stats.dead}</span>
          <span className="ov-lbl">Dead</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by Tag ID, Breed, Buyer, or Death Reason..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="active">Active Only</option>
          <option value="all">All Goats</option>
          <option value="Healthy">Healthy</option>
          <option value="Pregnant">Pregnant</option>
          <option value="Lactating">Lactating</option>
          <option value="Dry">Dry</option>
          <option value="Quarantine">Quarantine</option>
          <option value="Sold">Sold</option>
          <option value="Dead">Dead</option>
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
                <th>Weight</th>
                <th>DOB</th>
                <th>Age</th>
                <th>Status</th>
                <th>Stage</th>
                <th>Source</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGoats.length === 0 ? (
                <tr>
                  <td colSpan="10" className="empty">
                    {searchTerm || filterStatus !== "active"
                      ? "No goats match your search criteria."
                      : "No goats added yet. Click 'Add Goat' to get started!"}
                  </td>
                </tr>
              ) : (
                filteredGoats.map((goat, index) => {
                  const daysLeft = getQuarantineDaysLeft(goat);
                  const isQuarantineComplete =
                    goat.status === "Quarantine" &&
                    goat.quarantineDays &&
                    daysLeft === 0;
                  const isActive = !["Sold", "Dead"].includes(goat.status);

                  return (
                    <tr
                      key={goat.id}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <td>
                        <strong>{goat.tagId}</strong>
                      </td>
                      <td>{goat.breed || "—"}</td>
                      <td>{getGenderDisplay(goat.gender, goat.stage)}</td>
                      <td>{goat.weight ? `${goat.weight} kg` : "—"}</td>
                      <td>{formatDate(goat.dob)}</td>
                      <td>
                        {getAgeDisplay(goat.age)}
                        {/* Quarantine days remaining */}
                        {goat.status === "Quarantine" &&
                          goat.quarantineDays && (
                            <span
                              style={{
                                display: "block",
                                fontSize: "0.5rem",
                                color: daysLeft > 0 ? "#ff9800" : "#4caf50",
                                fontWeight: 600,
                              }}
                            >
                              {daysLeft > 0
                                ? `${daysLeft} days left`
                                : "Ready to complete"}
                            </span>
                          )}
                        {/* Sold/Dead badge */}
                        {(goat.status === "Sold" || goat.status === "Dead") && (
                          <span
                            style={{
                              display: "block",
                              fontSize: "0.5rem",
                              color:
                                goat.status === "Sold" ? "#2e7d32" : "#b0473e",
                              fontWeight: 600,
                            }}
                          >
                            {goat.status === "Sold"
                              ? goat.saleDate
                                ? `Sold on ${formatDate(goat.saleDate)}`
                                : "Sold"
                              : goat.deathDate
                              ? `Died on ${formatDate(goat.deathDate)}`
                              : "Dead"}
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`pill ${getStatusBadgeClass(goat.status)}`}
                        >
                          {goat.status}
                        </span>
                      </td>
                      <td>
                        <span
                          className="pill"
                          style={{
                            background: "rgba(15, 122, 117, 0.08)",
                            color: "var(--clay-deep)",
                          }}
                        >
                          {goat.stage || "—"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`pill ${getSourceBadgeClass(
                            goat.sourceType,
                          )}`}
                        >
                          {goat.sourceType || "—"}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "4px",
                            flexWrap: "wrap",
                          }}
                        >
                          {/* Edit button for ALL goats */}
                          <button
                            className="btn btn-ghost btn-small"
                            onClick={() => handleEdit(goat)}
                          >
                            Edit
                          </button>

                          {/* Sell button - only for Active goats */}
                          {isActive && (
                            <button
                              className="btn btn-success btn-small"
                              onClick={() => handleOpenSell(goat)}
                              title="Mark as Sold"
                              style={{
                                background: "#4caf50",
                                color: "#fff",
                                border: "none",
                              }}
                            >
                              Sell
                            </button>
                          )}

                          {/* Dead button - only for Active goats */}
                          {isActive && (
                            <button
                              className="btn btn-danger btn-small"
                              onClick={() => handleOpenDead(goat)}
                              title="Mark as Dead"
                              style={{
                                background: "#b0473e",
                                color: "#fff",
                                border: "none",
                              }}
                            >
                              Dead
                            </button>
                          )}

                          {/* Complete Quarantine Button */}
                          {isQuarantineComplete && (
                            <button
                              className="btn btn-success btn-small"
                              onClick={() => handleCompleteQuarantine(goat)}
                              title="Quarantine period complete. Click to set status to Healthy."
                              style={{
                                background: "#2196f3",
                                color: "#fff",
                                border: "none",
                              }}
                            >
                              Complete
                            </button>
                          )}

                          {/* Delete button for ALL goats */}
                          <button
                            className="btn btn-danger btn-small"
                            onClick={() => handleDeleteClick(goat)}
                            style={{
                              background: "transparent",
                              color: "#b0473e",
                              border: "1px solid #b0473e",
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Sell Modal */}
      <Modal
        isOpen={sellModalOpen}
        onClose={() => {
          setSellModalOpen(false);
          setSelectedGoat(null);
        }}
        title="Mark as Sold"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSellSubmit();
          }}
        >
          <div className="form-grid">
            <div className="field full-width">
              <label>Goat</label>
              <input
                type="text"
                value={
                  selectedGoat
                    ? `${selectedGoat.tagId} - ${selectedGoat.breed}`
                    : ""
                }
                readOnly
                className="field-input"
                style={{ backgroundColor: "#f5f5f5", fontWeight: 600 }}
              />
            </div>

            <div className="field half">
              <label>Sale Date *</label>
              <input
                type="date"
                name="saleDate"
                value={sellForm.saleDate}
                onChange={(e) =>
                  setSellForm({ ...sellForm, saleDate: e.target.value })
                }
                className="field-input"
                max={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="field half">
              <label>Sale Price (PKR) *</label>
              <input
                type="number"
                name="salePrice"
                value={sellForm.salePrice}
                onChange={(e) =>
                  setSellForm({ ...sellForm, salePrice: e.target.value })
                }
                placeholder="e.g., 50000"
                className="field-input"
                min="0"
                step="100"
                required
              />
            </div>

            <div className="field half">
              <label>Buyer Name *</label>
              <input
                type="text"
                name="buyerName"
                value={sellForm.buyerName}
                onChange={(e) =>
                  setSellForm({ ...sellForm, buyerName: e.target.value })
                }
                placeholder="e.g., Muhammad Ali"
                className="field-input"
                required
              />
            </div>

            <div className="field half">
              <label>Buyer Contact</label>
              <input
                type="text"
                name="buyerContact"
                value={sellForm.buyerContact}
                onChange={(e) =>
                  setSellForm({ ...sellForm, buyerContact: e.target.value })
                }
                placeholder="e.g., 03XX-XXXXXXX"
                className="field-input"
              />
            </div>

            <div className="field full-width">
              <label>Sale Notes</label>
              <textarea
                name="saleNotes"
                value={sellForm.saleNotes}
                onChange={(e) =>
                  setSellForm({ ...sellForm, saleNotes: e.target.value })
                }
                placeholder="Any additional notes about the sale..."
                className="field-input"
                rows="2"
                style={{ resize: "vertical", minHeight: "50px" }}
              />
            </div>
          </div>

          <div className="modal-actions">
            <Button
              variant="ghost"
              onClick={() => setSellModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Mark as Sold"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Dead Modal */}
      <Modal
        isOpen={deadModalOpen}
        onClose={() => {
          setDeadModalOpen(false);
          setSelectedGoat(null);
        }}
        title="Mark as Dead"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleDeadSubmit();
          }}
        >
          <div className="form-grid">
            <div className="field full-width">
              <label>Goat</label>
              <input
                type="text"
                value={
                  selectedGoat
                    ? `${selectedGoat.tagId} - ${selectedGoat.breed}`
                    : ""
                }
                readOnly
                className="field-input"
                style={{ backgroundColor: "#f5f5f5", fontWeight: 600 }}
              />
            </div>

            <div className="field half">
              <label>Death Date *</label>
              <input
                type="date"
                name="deathDate"
                value={deadForm.deathDate}
                onChange={(e) =>
                  setDeadForm({ ...deadForm, deathDate: e.target.value })
                }
                className="field-input"
                max={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="field half">
              <label>Death Reason *</label>
              <select
                name="deathReason"
                value={deadForm.deathReason}
                onChange={(e) =>
                  setDeadForm({ ...deadForm, deathReason: e.target.value })
                }
                className="field-input"
                required
              >
                <option value="">Select reason...</option>
                <option value="Disease">Disease</option>
                <option value="Accident">Accident</option>
                <option value="Old Age">Old Age</option>
                <option value="Predator">Predator</option>
                <option value="Childbirth">Childbirth</option>
                <option value="Unknown">Unknown</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="field full-width">
              <label>Death Notes</label>
              <textarea
                name="deathNotes"
                value={deadForm.deathNotes}
                onChange={(e) =>
                  setDeadForm({ ...deadForm, deathNotes: e.target.value })
                }
                placeholder="Additional details about the death..."
                className="field-input"
                rows="2"
                style={{ resize: "vertical", minHeight: "50px" }}
              />
            </div>
          </div>

          <div className="modal-actions">
            <Button
              variant="ghost"
              onClick={() => setDeadModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Mark as Dead"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modals */}
      <AddGoatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        editData={editingGoat}
      />

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Goat"
        message={`Are you sure you want to delete goat "${goatToDelete?.tagId}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
      />

      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </div>
  );
};

export default Goats;
