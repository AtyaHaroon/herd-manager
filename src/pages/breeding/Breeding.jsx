// src/pages/Breeding.jsx - "Pending" Replaced with "Suspected"

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { breedingService } from "../../services/breedingService";
import { goatService } from "../../services/goatService";
import AddBreedingModal from "../Add/AddBreedingModal";
import ConfirmModal from "../../components/Common/ConfirmModal";
import Toast from "../../components/Common/Toast";
import Loader from "../../components/Common/Loader";
import { formatDate } from "../../utils/helpers";

const Breeding = () => {
  const { currentUser } = useAuth();
  const [breedingRecords, setBreedingRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [goats, setGoats] = useState([]);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterResult, setFilterResult] = useState("all");
  const [toastMessage, setToastMessage] = useState("");
  const [updating, setUpdating] = useState(false);

  const farmId = currentUser?.farmId;

  // ✅ Helper: Check if date is passed
  const isDatePassed = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(dateString + "T00:00:00");
    return checkDate <= today;
  };

  // ✅ Helper: Get days difference
  const getDaysDiff = (dateString) => {
    if (!dateString) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(dateString + "T00:00:00");
    const diff = Math.ceil((today - checkDate) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // ✅ Helper: Get status label with overdue
  const getStatusLabel = (record) => {
    const result = record.result;

    if (result === "Pregnant")
      return { label: "Pregnant", className: "pill healthy" };
    if (result === "Not Pregnant")
      return { label: "Not Pregnant", className: "pill overdue" };
    if (result === "Pending Second Scan")
      return { label: "Second Scan", className: "pill due" };
    if (result === "Due") return { label: "Due", className: "pill due" };

    // ✅ "Suspected" - Default status after adding breeding
    if (result === "Suspected" || !result) {
      // Check if heat check date is passed
      if (record.followUpDate && isDatePassed(record.followUpDate)) {
        if (!record.heatCheckCompleted) {
          return { label: "Overdue", className: "pill overdue" };
        }
      }
      return { label: "Suspected", className: "pill due" };
    }

    return { label: result || "Suspected", className: "pill due" };
  };

  const loadGoats = useCallback(async () => {
    if (!farmId) return;
    try {
      const data = await goatService.getByFarmId(farmId);
      setGoats(data);
    } catch (error) {
      console.error("Error loading goats:", error);
    }
  }, [farmId]);

  const loadBreedingRecords = useCallback(async () => {
    if (!farmId) return;
    setLoading(true);
    try {
      const data = await breedingService.getByFarmId(farmId);
      const sorted = data.sort(
        (a, b) => new Date(b.matingDate) - new Date(a.matingDate),
      );
      setBreedingRecords(sorted);
      setFilteredRecords(sorted);
    } catch (error) {
      console.error("Error loading breeding records:", error);
      setToastMessage("Failed to load breeding records.");
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    loadGoats();
    loadBreedingRecords();
  }, [loadGoats, loadBreedingRecords]);

  useEffect(() => {
    let result = breedingRecords;
    if (filterType !== "all") {
      result = result.filter((r) => r.breedingType === filterType);
    }
    if (filterResult !== "all") {
      result = result.filter((r) => r.result === filterResult);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.buckTagId?.toLowerCase().includes(term) ||
          r.doeTagId?.toLowerCase().includes(term) ||
          r.notes?.toLowerCase().includes(term) ||
          r.aiTechnician?.toLowerCase().includes(term),
      );
    }
    setFilteredRecords(result);
  }, [searchTerm, filterType, filterResult, breedingRecords]);

  const handleAddNew = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (record) => {
    setRecordToDelete(record);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      await breedingService.delete(recordToDelete.id);
      setToastMessage("Breeding record deleted successfully.");
      await loadBreedingRecords();
    } catch (error) {
      console.error("Error deleting record:", error);
      setToastMessage("Failed to delete record.");
    } finally {
      setDeleteConfirmOpen(false);
      setRecordToDelete(null);
    }
  };

  const handleModalSuccess = () => {
    loadBreedingRecords();
    setToastMessage(
      editingRecord ? "Breeding record updated!" : "Breeding record added!",
    );
  };

  // ✅ STEP 1: Complete Heat Check
  const handleCompleteHeatCheck = async (recordId) => {
    setUpdating(true);
    try {
      const record = breedingRecords.find((r) => r.id === recordId);
      if (!record) return;

      await breedingService.update(recordId, {
        ...record,
        heatCheckCompleted: true,
        heatCheckDate: new Date().toISOString().split("T")[0],
        result: "Due",
        updatedAt: new Date(),
      });

      setToastMessage("Heat Check completed! Now do Early US.");
      await loadBreedingRecords();
    } catch (error) {
      console.error("Error completing heat check:", error);
      setToastMessage("Failed to complete heat check.");
    } finally {
      setUpdating(false);
    }
  };

  // ✅ STEP 2: Early US Result
  const handleEarlyUS = async (recordId, result) => {
    setUpdating(true);
    try {
      const record = breedingRecords.find((r) => r.id === recordId);
      if (!record) return;

      const updates = {
        earlyUSResult: result,
        earlyUSDate: new Date().toISOString().split("T")[0],
        updatedAt: new Date(),
      };

      if (result === "Conceived") {
        updates.result = "Pregnant";

        if (record.doeId) {
          try {
            const goat = await goatService.getById(record.doeId);
            if (goat) {
              await goatService.update(record.doeId, {
                ...goat,
                status: "Pregnant",
                isPregnant: true,
                expectedKiddingDate: record.expectedKiddingDate,
                updatedAt: new Date(),
              });
            }
          } catch (error) {
            console.error("Error updating goat status:", error);
          }
        }
        setToastMessage("Early US: Conceived! Goat is Pregnant.");
      } else if (result === "Not Conceived") {
        updates.result = "Not Pregnant";
        setToastMessage("Early US: Not Conceived.");
      } else if (result === "Suspected") {
        updates.result = "Pending Second Scan";
        setToastMessage("Early US: Suspected. Need Second Scan.");
      }

      await breedingService.update(recordId, {
        ...record,
        ...updates,
      });

      await loadBreedingRecords();
    } catch (error) {
      console.error("Error updating Early US:", error);
      setToastMessage("Failed to update.");
    } finally {
      setUpdating(false);
    }
  };

  // ✅ STEP 3: Second Scan Result
  const handleSecondScan = async (recordId, result) => {
    setUpdating(true);
    try {
      const record = breedingRecords.find((r) => r.id === recordId);
      if (!record) return;

      if (result === "Pregnant") {
        await breedingService.update(recordId, {
          ...record,
          result: "Pregnant",
          secondScanResult: "Pregnant",
          secondScanDate: new Date().toISOString().split("T")[0],
          updatedAt: new Date(),
        });

        if (record.doeId) {
          try {
            const goat = await goatService.getById(record.doeId);
            if (goat) {
              await goatService.update(record.doeId, {
                ...goat,
                status: "Pregnant",
                isPregnant: true,
                expectedKiddingDate: record.expectedKiddingDate,
                updatedAt: new Date(),
              });
            }
          } catch (error) {
            console.error("Error updating goat status:", error);
          }
        }
        setToastMessage("Second Scan: Pregnant!");
      } else {
        await breedingService.update(recordId, {
          ...record,
          result: "Not Pregnant",
          secondScanResult: "Not Pregnant",
          secondScanDate: new Date().toISOString().split("T")[0],
          updatedAt: new Date(),
        });
        setToastMessage("Second Scan: Not Pregnant");
      }

      await loadBreedingRecords();
    } catch (error) {
      console.error("Error updating second scan:", error);
      setToastMessage("Failed to update.");
    } finally {
      setUpdating(false);
    }
  };

  const getGoatTagId = (id) => {
    if (!id) return "Unknown";
    const goat = goats.find((g) => g.id === id);
    if (goat) return goat.tagId;
    return "Unknown";
  };

  const getBuckDisplay = (record) => {
    if (record.buckTagId) return record.buckTagId;
    if (record.buckId) return getGoatTagId(record.buckId);
    return "Unknown";
  };

  const getDoeDisplay = (record) => {
    if (record.doeTagId) return record.doeTagId;
    if (record.doeId) return getGoatTagId(record.doeId);
    return "Unknown";
  };

  const getMatingDateDisplay = (record) => {
    const date = record.matingDate || record.inseminationDate;
    if (date) return formatDate(date);
    return "—";
  };

  const getDaysSinceMating = (record) => {
    const date = record.matingDate || record.inseminationDate;
    if (!date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const matingDate = new Date(date + "T00:00:00");
    const diff = Math.ceil((today - matingDate) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getTypeBadge = (type) => {
    if (type === "Natural") {
      return { className: "pill income", label: "Natural" };
    } else if (type === "AI") {
      return { className: "pill healthy", label: "AI" };
    }
    return { className: "pill", label: type || "Unknown" };
  };

  // ✅ Stats - "Suspected" instead of "Pending"
  const stats = {
    total: breedingRecords.length,
    pregnant: breedingRecords.filter((r) => r.result === "Pregnant").length,
    notPregnant: breedingRecords.filter(
      (r) => r.result === "Not Conceived" || r.result === "Not Pregnant",
    ).length,
    suspected: breedingRecords.filter(
      (r) => r.result === "Suspected" || !r.result,
    ).length,
    due: breedingRecords.filter((r) => r.result === "Due").length,
    pendingSecondScan: breedingRecords.filter(
      (r) => r.result === "Pending Second Scan",
    ).length,
    natural: breedingRecords.filter((r) => r.breedingType === "Natural").length,
    ai: breedingRecords.filter((r) => r.breedingType === "AI").length,
  };

  return (
    <div className="panel active">
      <div className="panel-head">
        <div>
          <h2>Breeding Management</h2>
          <div className="desc">
            Track breeding records, heat check, and pregnancy diagnosis
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleAddNew}>
          + Add Breeding Record
        </button>
      </div>

      {/* ✅ Stats - "Suspected" instead of "Pending" */}
      <div className="overview-grid">
        <div className="ov-card">
          <span className="ov-num">{stats.total}</span>
          <span className="ov-lbl">Total Records</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(76, 175, 80, 0.12)" }}
        >
          <span className="ov-num">{stats.pregnant}</span>
          <span className="ov-lbl">Pregnant</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(244, 67, 54, 0.12)" }}
        >
          <span className="ov-num">{stats.notPregnant}</span>
          <span className="ov-lbl">Not Pregnant</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(255, 152, 0, 0.12)" }}
        >
          <span className="ov-num">{stats.suspected}</span>
          <span className="ov-lbl">Suspected</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(33, 150, 243, 0.12)" }}
        >
          <span className="ov-num">{stats.due}</span>
          <span className="ov-lbl">Due</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(156, 39, 176, 0.12)" }}
        >
          <span className="ov-num">{stats.pendingSecondScan}</span>
          <span className="ov-lbl">Second Scan</span>
        </div>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by Buck, Doe, Technician..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="Natural">Natural</option>
          <option value="AI">AI</option>
        </select>
        <select
          value={filterResult}
          onChange={(e) => setFilterResult(e.target.value)}
        >
          <option value="all">All Results</option>
          <option value="Suspected">Suspected</option>
          <option value="Due">Due</option>
          <option value="Pregnant">Pregnant</option>
          <option value="Not Pregnant">Not Pregnant</option>
          <option value="Pending Second Scan">Second Scan</option>
        </select>
      </div>

      {loading && (
        <div
          style={{ display: "flex", justifyContent: "center", padding: "40px" }}
        >
          <Loader />
        </div>
      )}

      {!loading && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Buck</th>
                <th>Doe</th>
                <th>Type</th>
                <th>Result</th>
                <th>Protocol</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty">
                    {searchTerm ||
                    filterType !== "all" ||
                    filterResult !== "all"
                      ? "No records match your search criteria."
                      : "No breeding records yet."}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, index) => {
                  const isSuspected =
                    record.result === "Suspected" || !record.result;
                  const isDue = record.result === "Due";
                  const isPregnant = record.result === "Pregnant";
                  const isNotPregnant = record.result === "Not Pregnant";
                  const isPendingSecondScan =
                    record.result === "Pending Second Scan";

                  const needsAction = isSuspected || isDue;

                  const isHeatCheckComplete =
                    record.heatCheckCompleted === true;
                  const isEarlyUSComplete =
                    record.earlyUSResult && record.earlyUSResult !== "";
                  const isSecondScanComplete =
                    record.secondScanResult && record.secondScanResult !== "";

                  const isHeatCheckOverdue =
                    record.followUpDate &&
                    isDatePassed(record.followUpDate) &&
                    !record.heatCheckCompleted;

                  const isEarlyUSOverdue =
                    record.earlyUltrasoundDate &&
                    isDatePassed(record.earlyUltrasoundDate) &&
                    !record.earlyUSResult;

                  const isSecondScanOverdue =
                    record.secondScanDate &&
                    isDatePassed(record.secondScanDate) &&
                    !record.secondScanResult;

                  const statusInfo = getStatusLabel(record);

                  const showHeatCheck = needsAction && !isHeatCheckComplete;
                  const showEarlyUS =
                    needsAction && isHeatCheckComplete && !isEarlyUSComplete;
                  const showSecondScan =
                    isPendingSecondScan && !isSecondScanComplete;

                  return (
                    <tr
                      key={record.id}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <td>
                        <strong>{getMatingDateDisplay(record)}</strong>
                        <br />
                        <span style={{ fontSize: "0.55rem", color: "#766d5d" }}>
                          {getDaysSinceMating(record) !== null &&
                            `${getDaysSinceMating(record)} days ago`}
                        </span>
                      </td>
                      <td>
                        <strong>{getBuckDisplay(record)}</strong>
                      </td>
                      <td>
                        <strong>{getDoeDisplay(record)}</strong>
                      </td>
                      <td>
                        <span
                          className={
                            getTypeBadge(record.breedingType).className
                          }
                        >
                          {getTypeBadge(record.breedingType).label}
                        </span>
                      </td>
                      <td>
                        <span className={statusInfo.className}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td>
                        <div
                          className="protocol-details"
                          style={{ fontSize: "0.6rem" }}
                        >
                          <span>
                            Heat Check:{" "}
                            {record.heatCheckCompleted ? (
                              <span
                                className="pill healthy"
                                style={{ fontSize: "0.5rem" }}
                              >
                                Completed
                              </span>
                            ) : isHeatCheckOverdue ? (
                              <span
                                className="pill overdue"
                                style={{ fontSize: "0.5rem" }}
                              >
                                Overdue
                              </span>
                            ) : (
                              <span
                                className="pill due"
                                style={{ fontSize: "0.5rem" }}
                              >
                                Pending
                              </span>
                            )}
                            {record.followUpDate && (
                              <span
                                className={`status-badge ${
                                  isDatePassed(record.followUpDate)
                                    ? "passed"
                                    : "due"
                                }`}
                              >
                                {isDatePassed(record.followUpDate)
                                  ? `Overdue by ${getDaysDiff(
                                      record.followUpDate,
                                    )} days`
                                  : `${getDaysDiff(
                                      record.followUpDate,
                                    )} days left`}
                              </span>
                            )}
                          </span>

                          <span>
                            Early US:{" "}
                            {record.earlyUSResult ? (
                              <span
                                className={
                                  record.earlyUSResult === "Conceived"
                                    ? "pill healthy"
                                    : record.earlyUSResult === "Not Conceived"
                                    ? "pill overdue"
                                    : "pill due"
                                }
                                style={{ fontSize: "0.5rem" }}
                              >
                                {record.earlyUSResult}
                              </span>
                            ) : isEarlyUSOverdue ? (
                              <span
                                className="pill overdue"
                                style={{ fontSize: "0.5rem" }}
                              >
                                Overdue
                              </span>
                            ) : (
                              <span
                                className="pill due"
                                style={{ fontSize: "0.5rem" }}
                              >
                                Pending
                              </span>
                            )}
                            {record.earlyUltrasoundDate && (
                              <span
                                className={`status-badge ${
                                  isDatePassed(record.earlyUltrasoundDate)
                                    ? "passed"
                                    : "due"
                                }`}
                              >
                                {isDatePassed(record.earlyUltrasoundDate)
                                  ? `Overdue by ${getDaysDiff(
                                      record.earlyUltrasoundDate,
                                    )} days`
                                  : `${getDaysDiff(
                                      record.earlyUltrasoundDate,
                                    )} days left`}
                              </span>
                            )}
                          </span>

                          {isPendingSecondScan && (
                            <span>
                              Second Scan:{" "}
                              {record.secondScanResult ? (
                                <span
                                  className={
                                    record.secondScanResult === "Pregnant"
                                      ? "pill healthy"
                                      : "pill overdue"
                                  }
                                  style={{ fontSize: "0.5rem" }}
                                >
                                  {record.secondScanResult}
                                </span>
                              ) : isSecondScanOverdue ? (
                                <span
                                  className="pill overdue"
                                  style={{ fontSize: "0.5rem" }}
                                >
                                  Overdue
                                </span>
                              ) : (
                                <span
                                  className="pill due"
                                  style={{ fontSize: "0.5rem" }}
                                >
                                  Pending
                                </span>
                              )}
                              {record.secondScanDate && (
                                <span
                                  className={`status-badge ${
                                    isDatePassed(record.secondScanDate)
                                      ? "passed"
                                      : "due"
                                  }`}
                                >
                                  {isDatePassed(record.secondScanDate)
                                    ? `Overdue by ${getDaysDiff(
                                        record.secondScanDate,
                                      )} days`
                                    : `${getDaysDiff(
                                        record.secondScanDate,
                                      )} days left`}
                                </span>
                              )}
                            </span>
                          )}

                          <span>
                            Kidding:{" "}
                            {formatDate(record.expectedKiddingDate) || "—"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="actions-container">
                          <button
                            className="btn btn-ghost btn-small action-btn"
                            onClick={() => handleEdit(record)}
                            disabled={updating}
                          >
                            Edit
                          </button>

                          {showHeatCheck && (
                            <button
                              className={`btn btn-small action-btn complete-btn ${
                                isHeatCheckOverdue
                                  ? "btn-danger"
                                  : "btn-primary"
                              }`}
                              onClick={() => handleCompleteHeatCheck(record.id)}
                              disabled={updating}
                            >
                              {isHeatCheckOverdue
                                ? "Complete Heat Check (Overdue)"
                                : "Complete Heat Check"}
                            </button>
                          )}

                          {showEarlyUS && (
                            <div className="action-group">
                              <span className="action-label">Early US</span>
                              <button
                                className="btn btn-success btn-small action-btn"
                                onClick={() =>
                                  handleEarlyUS(record.id, "Conceived")
                                }
                                disabled={updating}
                              >
                                Conceived
                              </button>
                              <button
                                className="btn btn-danger btn-small action-btn"
                                onClick={() =>
                                  handleEarlyUS(record.id, "Not Conceived")
                                }
                                disabled={updating}
                              >
                                Not Conceived
                              </button>
                              <button
                                className="btn btn-warning btn-small action-btn"
                                onClick={() =>
                                  handleEarlyUS(record.id, "Suspected")
                                }
                                disabled={updating}
                                style={{ background: "#ff9800", color: "#fff" }}
                              >
                                Suspected
                              </button>
                            </div>
                          )}

                          {showSecondScan && (
                            <div className="action-group">
                              <span className="action-label">Second Scan</span>
                              <button
                                className="btn btn-success btn-small action-btn"
                                onClick={() =>
                                  handleSecondScan(record.id, "Pregnant")
                                }
                                disabled={updating}
                              >
                                Pregnant
                              </button>
                              <button
                                className="btn btn-danger btn-small action-btn"
                                onClick={() =>
                                  handleSecondScan(record.id, "Not Pregnant")
                                }
                                disabled={updating}
                              >
                                Not Pregnant
                              </button>
                            </div>
                          )}

                          {isPregnant && (
                            <span className="status-done">Pregnant</span>
                          )}

                          {isNotPregnant && (
                            <span className="status-failed">Not Pregnant</span>
                          )}

                          <button
                            className="btn btn-danger btn-small action-btn delete-btn"
                            onClick={() => handleDeleteClick(record)}
                            disabled={updating}
                          >
                            Delete
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

      <AddBreedingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        editData={editingRecord}
        goats={goats}
        defaultStatus="Suspected"
      />

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Breeding Record"
        message="Are you sure you want to delete this breeding record?"
        confirmText="Delete"
        confirmVariant="danger"
      />

      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </div>
  );
};

export default Breeding;
