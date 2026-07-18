// src/pages/GoatVaccinations.jsx - ONLY DUE/OVERDUE GOATS UPDATE

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { goatService } from "../../services/goatService";
import {
  getCollection,
  deleteDocument,
  addDocument,
  COLLECTIONS,
} from "../../firebase/firestore";
import Toast from "../../components/Common/Toast";
import Loader from "../../components/Common/Loader";
import Input from "../../components/Common/Input";
import { formatDate, getVaccineStatus, generateId } from "../../utils/helpers";
import Modal from "../../components/Common/Modal";
import Button from "../../components/Common/Button";

// ✅ Helper: Check if goat is pregnant
const isGoatPregnant = (goat) => {
  if (!goat) return false;
  return goat.status === "Pregnant" || goat.isPregnant === true;
};

// ✅ Helper: Get latest vaccine status for a goat
const getGoatVaccineStatus = (goatId, vaccines) => {
  const goatVaccines = vaccines.filter((v) => v.goatId === goatId);
  if (goatVaccines.length === 0) return "overdue"; // No vaccine = Overdue

  // Get latest vaccine by date
  const latest = goatVaccines.sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  )[0];
  const status = getVaccineStatus(latest.next);
  return status.status; // "healthy", "due", "overdue"
};

const GoatVaccinations = () => {
  const { currentUser } = useAuth();
  const farmId = currentUser?.farmId;

  const [goatVaccines, setGoatVaccines] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [goats, setGoats] = useState([]);
  const [vaccines, setVaccines] = useState([]);

  // ✅ Bulk vaccination states
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedVaccineId, setSelectedVaccineId] = useState("");
  const [selectedVaccine, setSelectedVaccine] = useState(null);
  const [bulkDate, setBulkDate] = useState("");
  const [bulkDoseNumber, setBulkDoseNumber] = useState("1");
  const [bulkNotes, setBulkNotes] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [eligibleGoats, setEligibleGoats] = useState([]);
  const [pregnantGoats, setPregnantGoats] = useState([]);
  const [alreadyDoneGoats, setAlreadyDoneGoats] = useState([]);

  const [goatFilter, setGoatFilter] = useState("all");
  const [vaccineFilter, setVaccineFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const isMounted = useRef(true);

  // ✅ Load data
  const loadData = useCallback(async () => {
    if (!farmId || !isMounted.current) return;

    setLoading(true);
    try {
      const [goatsData, vaccinesData, goatVaccinesData] = await Promise.all([
        goatService.getByFarmId(farmId),
        getCollection(COLLECTIONS.VACCINES, [
          { field: "farmId", operator: "==", value: farmId },
        ]),
        getCollection(COLLECTIONS.GOAT_VACCINES, [
          { field: "farmId", operator: "==", value: farmId },
        ]),
      ]);

      if (isMounted.current) {
        setGoats(goatsData || []);
        setVaccines(vaccinesData || []);
        const sorted = (goatVaccinesData || []).sort(
          (a, b) => new Date(b.date) - new Date(a.date),
        );
        setGoatVaccines(sorted);
        setFilteredRecords(sorted);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      if (isMounted.current) {
        setToastMessage("Failed to load data.");
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
    let result = goatVaccines;

    if (goatFilter !== "all") {
      result = result.filter((v) => v.goatId === goatFilter);
    }

    if (vaccineFilter !== "all") {
      result = result.filter((v) => v.vaccineId === vaccineFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((v) => {
        const status = getVaccineStatus(v.next);
        return status.status === statusFilter;
      });
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (v) =>
          v.vaccineName?.toLowerCase().includes(term) ||
          v.goatTagId?.toLowerCase().includes(term) ||
          v.notes?.toLowerCase().includes(term),
      );
    }

    result.sort((a, b) => new Date(b.date) - new Date(a.date));
    setFilteredRecords(result);
  }, [goatVaccines, goatFilter, vaccineFilter, statusFilter, searchTerm]);

  // ✅ Get goat info
  const getGoatInfo = (id) => {
    const goat = goats.find((g) => g.id === id);
    return goat ? `${goat.tagId} - ${goat.breed}` : "Unknown";
  };

  // ✅ Get vaccine name
  const getVaccineName = (id) => {
    const vaccine = vaccines.find((v) => v.id === id);
    return vaccine ? vaccine.name : "Unknown";
  };

  // ✅ Get status badge - NO ICONS
  const getStatusBadge = (nextDate) => {
    const status = getVaccineStatus(nextDate);
    const badgeMap = {
      healthy: { className: "pill healthy", label: "Up to Date" },
      due: { className: "pill due", label: "Due Soon" },
      overdue: { className: "pill overdue", label: "Overdue" },
    };
    return badgeMap[status.status] || badgeMap["healthy"];
  };

  // ✅ Stats
  const stats = {
    total: goatVaccines.length,
    healthy: goatVaccines.filter((v) => {
      const status = getVaccineStatus(v.next);
      return status.status === "healthy";
    }).length,
    due: goatVaccines.filter((v) => {
      const status = getVaccineStatus(v.next);
      return status.status === "due";
    }).length,
    overdue: goatVaccines.filter((v) => {
      const status = getVaccineStatus(v.next);
      return status.status === "overdue";
    }).length,
    totalCost: goatVaccines.reduce(
      (sum, v) => sum + (parseFloat(v.price) || 0),
      0,
    ),
  };

  // ✅ Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) {
      return;
    }

    setUpdating(true);
    try {
      await deleteDocument(COLLECTIONS.GOAT_VACCINES, id);
      setToastMessage("Record deleted successfully");
      await loadData();
    } catch (error) {
      console.error("Error deleting record:", error);
      setToastMessage("Failed to delete record");
    } finally {
      setUpdating(false);
    }
  };

  // ✅ Handle edit
  const handleEdit = (record) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  // ✅ Handle modal success
  const handleModalSuccess = () => {
    loadData();
    setToastMessage(
      editingRecord ? "Record updated!" : "Vaccine record added!",
    );
  };

  // ✅ Open bulk vaccination modal
  const handleBulkVaccinate = () => {
    setSelectedVaccineId("");
    setSelectedVaccine(null);
    setBulkDate("");
    setBulkDoseNumber("1");
    setBulkNotes("");
    setEligibleGoats([]);
    setPregnantGoats([]);
    setAlreadyDoneGoats([]);
    setIsBulkModalOpen(true);
  };

  // ✅ Handle vaccine selection for bulk
  const handleBulkVaccineSelect = (e) => {
    const vaccineId = e.target.value;
    const vaccine = vaccines.find((v) => v.id === vaccineId);
    setSelectedVaccineId(vaccineId);
    setSelectedVaccine(vaccine || null);

    if (vaccine) {
      // ✅ Check each goat's status
      const dueGoats = [];
      const pregnantList = [];
      const alreadyDone = [];

      goats.forEach((goat) => {
        // Check if pregnant
        if (isGoatPregnant(goat)) {
          pregnantList.push(goat);
          return;
        }

        // Check vaccine status for this specific vaccine
        const goatVaccinesList = goatVaccines.filter(
          (v) => v.goatId === goat.id && v.vaccineId === vaccineId,
        );

        if (goatVaccinesList.length === 0) {
          // No vaccine record for this vaccine -> Overdue
          dueGoats.push(goat);
        } else {
          // Get latest status
          const latest = goatVaccinesList.sort(
            (a, b) => new Date(b.date) - new Date(a.date),
          )[0];
          const status = getVaccineStatus(latest.next);

          if (status.status === "healthy") {
            // Already up to date
            alreadyDone.push(goat);
          } else {
            // Due or Overdue
            dueGoats.push(goat);
          }
        }
      });

      setEligibleGoats(dueGoats);
      setPregnantGoats(pregnantList);
      setAlreadyDoneGoats(alreadyDone);
    } else {
      setEligibleGoats([]);
      setPregnantGoats([]);
      setAlreadyDoneGoats([]);
    }
  };

  // ✅ Handle bulk date change - auto calculate next dates
  const handleBulkDateChange = (e) => {
    setBulkDate(e.target.value);
  };

  // ✅ Calculate next date
  const calculateNextDate = (date, days) => {
    if (!date || !days) return "";
    const givenDate = new Date(date + "T00:00:00");
    const nextDate = new Date(givenDate);
    nextDate.setDate(nextDate.getDate() + parseInt(days));
    return nextDate.toISOString().split("T")[0];
  };

  // ✅ Submit bulk vaccination
  const handleBulkSubmit = async () => {
    if (!selectedVaccineId) {
      setToastMessage("Please select a vaccine");
      return;
    }

    if (!bulkDate) {
      setToastMessage("Please select a date");
      return;
    }

    if (eligibleGoats.length === 0) {
      setToastMessage("No eligible goats found for vaccination");
      return;
    }

    setBulkLoading(true);
    try {
      const scheduleDays = selectedVaccine?.scheduleDays || 0;
      const nextDate = calculateNextDate(bulkDate, scheduleDays);

      let successCount = 0;
      let skipCount = 0;

      for (const goat of eligibleGoats) {
        try {
          const dataToSave = {
            farmId: farmId,
            goatId: goat.id,
            goatTagId: goat.tagId,
            vaccineId: selectedVaccineId,
            vaccineName: selectedVaccine?.name || "",
            date: bulkDate,
            next: nextDate,
            doseNumber: bulkDoseNumber || "1",
            price: selectedVaccine?.price || 0,
            notes: bulkNotes || "",
            dueDateEntries: [
              {
                id: generateId(),
                days: scheduleDays.toString(),
                nextDate: nextDate,
              },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await addDocument(COLLECTIONS.GOAT_VACCINES, dataToSave);
          successCount++;
        } catch (error) {
          console.error(`Error vaccinating goat ${goat.tagId}:`, error);
          skipCount++;
        }
      }

      setToastMessage(
        `✅ Bulk vaccination complete! ${successCount} goats vaccinated, ${skipCount} failed. ` +
          `${pregnantGoats.length} pregnant skipped, ${alreadyDoneGoats.length} already up to date skipped.`,
      );

      setIsBulkModalOpen(false);
      await loadData();
    } catch (error) {
      console.error("Error in bulk vaccination:", error);
      setToastMessage("Failed to complete bulk vaccination");
    } finally {
      setBulkLoading(false);
    }
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

  return (
    <div className="panel active">
      {/* Header */}
      <div className="panel-head">
        <div>
          <h2>Goat Vaccinations</h2>
          <div className="desc">Track and manage goat vaccination records</div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            className="btn btn-primary"
            onClick={handleBulkVaccinate}
            disabled={vaccines.length === 0 || goats.length === 0}
            title={
              vaccines.length === 0
                ? "Add vaccines first in Vaccine Management"
                : goats.length === 0
                ? "No goats available"
                : ""
            }
            style={{ background: "var(--pasture)" }}
          >
            + Bulk Vaccinate
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="overview-grid">
        <div className="ov-card">
          <span className="ov-num">{stats.total}</span>
          <span className="ov-lbl">Total Records</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(76, 175, 80, 0.12)" }}
        >
          <span className="ov-num">{stats.healthy}</span>
          <span className="ov-lbl">Up to Date</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(255, 152, 0, 0.12)" }}
        >
          <span className="ov-num">{stats.due}</span>
          <span className="ov-lbl">Due Soon</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(244, 67, 54, 0.12)" }}
        >
          <span className="ov-num">{stats.overdue}</span>
          <span className="ov-lbl">Overdue</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(217, 162, 59, 0.12)" }}
        >
          <span className="ov-num">PKR {stats.totalCost.toLocaleString()}</span>
          <span className="ov-lbl">Total Cost</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by goat tag, vaccine, notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={goatFilter}
          onChange={(e) => setGoatFilter(e.target.value)}
        >
          <option value="all">All Goats</option>
          {goats.map((g) => (
            <option key={g.id} value={g.id}>
              {g.tagId} - {g.breed}
            </option>
          ))}
        </select>
        <select
          value={vaccineFilter}
          onChange={(e) => setVaccineFilter(e.target.value)}
        >
          <option value="all">All Vaccines</option>
          {vaccines.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="healthy">Up to Date</option>
          <option value="due">Due Soon</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Goat</th>
              <th>Vaccine</th>
              <th>Dose</th>
              <th>Date Given</th>
              <th>Next Due</th>
              <th>Status</th>
              <th>Price</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty">
                  {searchTerm ||
                  goatFilter !== "all" ||
                  vaccineFilter !== "all" ||
                  statusFilter !== "all"
                    ? "No records match your search criteria."
                    : vaccines.length === 0
                    ? "No vaccines available. Go to Vaccine Management to add vaccines first."
                    : "No vaccination records found. Use Bulk Vaccinate to vaccinate all eligible goats!"}
                </td>
              </tr>
            ) : (
              filteredRecords.map((record, index) => {
                const statusBadge = getStatusBadge(record.next);
                const status = getVaccineStatus(record.next);

                return (
                  <tr
                    key={record.id}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
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
                      <strong>
                        {record.vaccineName || getVaccineName(record.vaccineId)}
                      </strong>
                    </td>
                    <td>
                      <span className="pill" style={{ fontSize: "0.5rem" }}>
                        Dose {record.doseNumber || "1"}
                      </span>
                    </td>
                    <td>{formatDate(record.date)}</td>
                    <td>
                      {formatDate(record.next)}
                      {status.status === "overdue" && (
                        <span
                          style={{
                            fontSize: "0.5rem",
                            color: "var(--danger)",
                            display: "block",
                          }}
                        >
                          {Math.abs(status.days)} days overdue
                        </span>
                      )}
                      {status.status === "due" && (
                        <span
                          style={{
                            fontSize: "0.5rem",
                            color: "var(--gold)",
                            display: "block",
                          }}
                        >
                          {status.days} days left
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={statusBadge.className}>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: "var(--gold)" }}>
                        PKR {record.price || 0}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.65rem", color: "#766d5d" }}>
                        {record.notes || "—"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button
                          className="btn btn-ghost btn-small"
                          onClick={() => handleEdit(record)}
                          disabled={updating}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => handleDelete(record.id)}
                          disabled={updating}
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

      {/* Bulk Vaccination Modal */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => {
          if (!bulkLoading) {
            setIsBulkModalOpen(false);
          }
        }}
        title="Bulk Vaccination"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleBulkSubmit();
          }}
        >
          <div className="form-grid">
            {/* Vaccine Selection */}
            <div className="field full-width">
              <label>Select Vaccine *</label>
              <select
                value={selectedVaccineId}
                onChange={handleBulkVaccineSelect}
                className="field-input"
                disabled={bulkLoading}
              >
                <option value="">Select a vaccine...</option>
                {vaccines.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              {selectedVaccine && (
                <small style={{ color: "#766d5d", fontSize: "0.55rem" }}>
                  Schedule: {selectedVaccine.scheduleDays} days | Price: PKR{" "}
                  {selectedVaccine.price}
                  {selectedVaccine.recommendedAge &&
                    ` | Recommended: ${selectedVaccine.recommendedAge}`}
                </small>
              )}
            </div>

            {/* Date Given */}
            <div className="field half">
              <Input
                label="Date Given *"
                type="date"
                name="bulkDate"
                value={bulkDate}
                onChange={handleBulkDateChange}
                disabled={bulkLoading}
                max={new Date().toISOString().split("T")[0]}
              />
              <small style={{ color: "#766d5d", fontSize: "0.55rem" }}>
                Cannot be in the future
              </small>
            </div>

            {/* Dose Number */}
            <div className="field half">
              <Input
                label="Dose Number"
                type="text"
                name="bulkDoseNumber"
                value={bulkDoseNumber}
                onChange={(e) => setBulkDoseNumber(e.target.value)}
                placeholder="e.g., 1, 2, 3"
                disabled={bulkLoading}
              />
              <small style={{ color: "#766d5d", fontSize: "0.55rem" }}>
                Leave as 1 for first dose
              </small>
            </div>

            {/* Notes */}
            <div className="field full-width">
              <Input
                label="Notes"
                type="text"
                name="bulkNotes"
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                placeholder="Any additional notes (max 200 chars)..."
                maxLength={200}
                disabled={bulkLoading}
              />
            </div>

            {/* Summary */}
            <div
              className="field full-width"
              style={{
                backgroundColor: "rgba(15, 122, 117, 0.05)",
                borderRadius: "8px",
                padding: "12px",
                border: "1px solid var(--line)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  textAlign: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.5rem", color: "#766d5d" }}>
                    Total Goats
                  </span>
                  <br />
                  <strong style={{ fontSize: "0.9rem" }}>{goats.length}</strong>
                </div>
                <div>
                  <span
                    style={{
                      fontSize: "0.5rem",
                      color: "var(--success)",
                      
                    }}
                  >
                    Due / Overdue
                  </span>
                  <br />
                  <strong style={{ fontSize: "0.9rem", color: "#4caf50" }}>
                    {eligibleGoats.length}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.5rem", color: "var(--danger)" }}>
                    Pregnant (Skipped)
                  </span>
                  <br />
                  <strong
                    style={{ fontSize: "0.9rem", color: "var(--danger)" }}
                  >
                    {pregnantGoats.length}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.5rem", color: "#9e9e9e" }}>
                    Already Up to Date
                  </span>
                  <br />
                  <strong style={{ fontSize: "0.9rem", color: "#9e9e9e" }}>
                    {alreadyDoneGoats.length}
                  </strong>
                </div>
              </div>
            </div>

            {/* ✅ Pregnant goats skipped */}
            {pregnantGoats.length > 0 && (
              <div
                className="field full-width"
                style={{
                  color: "var(--danger)",
                  fontSize: "0.65rem",
                  padding: "6px 10px",
                  background: "rgba(176, 71, 62, 0.08)",
                  borderRadius: "6px",
                  border: "1px solid rgba(176, 71, 62, 0.2)",
                }}
              >
                ⛔ {pregnantGoats.length} pregnant goat(s) will be skipped.
                <br />
                <small style={{ fontSize: "0.5rem" }}>
                  {pregnantGoats
                    .map((g) => `${g.tagId} (${g.breed})`)
                    .join(", ")}
                </small>
              </div>
            )}

            {/* ✅ Already up to date goats skipped */}
            {alreadyDoneGoats.length > 0 && (
              <div
                className="field full-width"
                style={{
                  color: "#9e9e9e",
                  fontSize: "0.65rem",
                  padding: "6px 10px",
                  background: "rgba(158, 158, 158, 0.08)",
                  borderRadius: "6px",
                  border: "1px solid rgba(158, 158, 158, 0.2)",
                }}
              >
                ℹ️ {alreadyDoneGoats.length} goat(s) already up to date,
                skipped.
                <br />
                <small style={{ fontSize: "0.5rem" }}>
                  {alreadyDoneGoats
                    .map((g) => `${g.tagId} (${g.breed})`)
                    .join(", ")}
                </small>
              </div>
            )}

            {eligibleGoats.length === 0 && selectedVaccine && (
              <div
                className="field full-width"
                style={{
                  color: "var(--danger)",
                  fontSize: "0.65rem",
                  padding: "6px 10px",
                  background: "rgba(176, 71, 62, 0.08)",
                  borderRadius: "6px",
                  border: "1px solid rgba(176, 71, 62, 0.2)",
                }}
              >
                ⛔ No eligible goats found. All goats are either pregnant or
                already up to date.
              </div>
            )}
          </div>

          <div className="modal-actions">
            <Button
              variant="ghost"
              onClick={() => setIsBulkModalOpen(false)}
              disabled={bulkLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                bulkLoading ||
                !selectedVaccineId ||
                !bulkDate ||
                eligibleGoats.length === 0
              }
            >
              {bulkLoading
                ? `Vaccinating ${eligibleGoats.length} goats...`
                : `Vaccinate ${eligibleGoats.length} Goats`}
            </Button>
          </div>
        </form>
      </Modal>

      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </div>
  );
};

export default GoatVaccinations;
