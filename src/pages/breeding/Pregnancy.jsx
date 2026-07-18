// src/pages/Pregnancy.jsx - FIXED (No Suspected, No Icons, No Warnings)

import React, { useState, useEffect, useCallback, useRef } from "react";
import Modal from "../../components/Common/Modal";
import Toast from "../../components/Common/Toast";
import Button from "../../components/Common/Button";
import { formatDate } from "../../utils/helpers";
import { goatService } from "../../services/goatService";
import { breedingService } from "../../services/breedingService";
import { useAuth } from "../../context/AuthContext";
import Loader from "../../components/Common/Loader";
import ConfirmModal from "../../components/Common/ConfirmModal";
import AddKiddingModal from "../../pages/Add/AddKiddingModal";
import { getCollection, COLLECTIONS } from "../../firebase/firestore";

const Pregnancy = () => {
  const { currentUser } = useAuth();

  const [pregnancies, setPregnancies] = useState([]);
  const [pregnantGoats, setPregnantGoats] = useState([]);
  const [conceivedBreedings, setConceivedBreedings] = useState([]);
  const [goats, setGoats] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({
    goatId: "",
    status: "Confirmed",
    dueDate: "",
    notes: "",
    source: "manual",
    breedingId: null,
  });
  const [toastMessage, setToastMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  const [isKiddingModalOpen, setIsKiddingModalOpen] = useState(false);
  const [deliveryRecord, setDeliveryRecord] = useState(null);
  const [deliveryAction, setDeliveryAction] = useState(null);

  const isMounted = useRef(true);
  const farmId = currentUser?.farmId;

  // ✅ Load all data
  const loadData = useCallback(async () => {
    if (!farmId || !isMounted.current) return;

    setLoading(true);
    try {
      const goatsData = await goatService.getByFarmId(farmId);
      setGoats(goatsData);

      // ✅ Get pregnant goats directly from goat status
      const pregnantGoatsList = goatsData.filter(
        (g) => g.status === "Pregnant" && g.isActive !== false,
      );
      setPregnantGoats(pregnantGoatsList);

      // ✅ Get all breeding records
      const breedingData = await breedingService.getByFarmId(farmId);
      console.log("Breeding data loaded:", breedingData.length);

      // ✅ Filter: Pregnant, Conceived, or Due (all active pregnancies)
      const conceivedList = breedingData.filter(
        (b) =>
          b.result === "Pregnant" ||
          b.result === "Conceived" ||
          b.result === "Due",
      );
      console.log("Conceived/Pregnant/Due breedings:", conceivedList.length);
      setConceivedBreedings(conceivedList);

      // ✅ Get kidding records from Firebase
      const kiddingData = await getCollection(COLLECTIONS.KIDDING, [
        { field: "farmId", operator: "==", value: farmId },
      ]);

      const deliveredGoatIds = new Set();
      (kiddingData || []).forEach((k) => {
        if (k.goatId) {
          deliveredGoatIds.add(k.goatId);
        }
      });

      const combinedPregnancies = [];
      const processedGoatIds = new Set();

      // ✅ 1. Pregnant goats from goat status
      pregnantGoatsList.forEach((goat) => {
        const isDelivered = deliveredGoatIds.has(goat.id);
        const dueDate = goat.expectedKiddingDate || "";

        combinedPregnancies.push({
          id: `preg-goat-${goat.id}`,
          goatId: goat.id,
          goatTagId: goat.tagId,
          goatBreed: goat.breed,
          status: isDelivered ? "Delivered" : "Confirmed",
          dueDate: dueDate,
          notes: isDelivered
            ? "Delivered - From goat status (Pregnant)"
            : "From goat status (Pregnant)",
          source: "goatStatus",
          breedingId: null,
          createdAt: goat.updatedAt || new Date(),
          isDelivered: isDelivered,
          kiddingRecord: null,
          goatStatus: goat.status,
        });
        processedGoatIds.add(goat.id);
      });

      // ✅ 2. Conceived/Pregnant/Due breeding records -> Auto create pregnancy
      conceivedList.forEach((breeding) => {
        // Check if this goat already has a pregnancy record
        const exists = combinedPregnancies.some(
          (p) => p.goatId === breeding.doeId,
        );

        if (!exists && breeding.doeId) {
          const goat = goatsData.find((g) => g.id === breeding.doeId);
          if (goat) {
            const isDelivered = deliveredGoatIds.has(goat.id);

            combinedPregnancies.push({
              id: `breed-${breeding.id}`,
              goatId: breeding.doeId,
              goatTagId: goat.tagId,
              goatBreed: goat.breed,
              status: isDelivered ? "Delivered" : "Confirmed",
              dueDate: breeding.expectedKiddingDate || "",
              notes: isDelivered
                ? "Delivered - From breeding record"
                : `From breeding record (${breeding.result})`,
              source: "breeding",
              breedingId: breeding.id,
              matingDate: breeding.matingDate,
              breedingType: breeding.breedingType,
              createdAt: breeding.createdAt || new Date(),
              isDelivered: isDelivered,
              kiddingRecord: null,
              goatStatus: goat.status,
              breedingResult: breeding.result,
            });
            processedGoatIds.add(breeding.doeId);
          }
        }
      });

      // ✅ 3. Also check for goats marked as pregnant but not in breeding
      goatsData.forEach((goat) => {
        if (
          goat.status === "Pregnant" &&
          !processedGoatIds.has(goat.id) &&
          goat.isActive !== false
        ) {
          const isDelivered = deliveredGoatIds.has(goat.id);
          combinedPregnancies.push({
            id: `preg-fallback-${goat.id}`,
            goatId: goat.id,
            goatTagId: goat.tagId,
            goatBreed: goat.breed,
            status: isDelivered ? "Delivered" : "Confirmed",
            dueDate: goat.expectedKiddingDate || "",
            notes: isDelivered
              ? "Delivered - Fallback"
              : "From goat status (Pregnant) - Fallback",
            source: "goatStatus",
            breedingId: null,
            createdAt: goat.updatedAt || new Date(),
            isDelivered: isDelivered,
            kiddingRecord: null,
            goatStatus: goat.status,
          });
        }
      });

      // ✅ Sort: Active pregnancies first, then delivered
      const sorted = combinedPregnancies.sort((a, b) => {
        // Delivered at the end
        if (a.isDelivered && !b.isDelivered) return 1;
        if (!a.isDelivered && b.isDelivered) return -1;
        // Sort by due date
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate) - new Date(b.dueDate);
        }
        return 0;
      });

      console.log("Total pregnancies:", sorted.length);

      if (isMounted.current) {
        setPregnancies(sorted);
      }
    } catch (error) {
      console.error("Error loading pregnancy data:", error);
      if (isMounted.current) {
        setToastMessage("Error loading data: " + error.message);
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

  // ✅ Save only manual records to localStorage
  const savePregnancies = (records) => {
    try {
      const manualRecords = records.filter(
        (p) => p.source === "manual" || !p.source,
      );
      const savedData = localStorage.getItem("goatManagerData");
      const data = savedData ? JSON.parse(savedData) : {};
      data.pregnancy = manualRecords;
      localStorage.setItem("goatManagerData", JSON.stringify(data));
    } catch (error) {
      console.error("Error saving pregnancy records:", error);
      setToastMessage("Error saving records");
    }
  };

  const getGoatInfo = (id) => {
    const goat = goats.find((g) => g.id === id);
    return goat ? `${goat.tagId} - ${goat.breed}` : "Unknown";
  };

  const getStatusBadge = (status) => {
    const badges = {
      Confirmed: { className: "pill healthy", label: "Confirmed" },
      "Not Pregnant": { className: "pill expense", label: "Not Pregnant" },
      Delivered: { className: "pill income", label: "Delivered" },
    };
    return badges[status] || badges["Confirmed"];
  };

  const getSourceBadge = (source) => {
    const badges = {
      manual: { className: "pill", label: "Manual" },
      goatStatus: { className: "pill healthy", label: "From Goat" },
      breeding: { className: "pill income", label: "From Breeding" },
    };
    return badges[source] || badges["manual"];
  };

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate + "T00:00:00");
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const isDueDatePassed = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate + "T00:00:00");
    return due <= today;
  };

  // ✅ Handle delivery action - Opens AddKiddingModal
  const handleDeliveryAction = (record, action) => {
    setDeliveryRecord(record);
    setDeliveryAction(action);
    setIsKiddingModalOpen(true);
  };

  // ✅ Handle kidding success
  const handleKiddingSuccess = useCallback(async () => {
    setToastMessage("Kidding record saved successfully!");
    setIsKiddingModalOpen(false);
    setDeliveryRecord(null);
    setDeliveryAction(null);
    await loadData();
  }, [loadData]);

  // ✅ Remove Manual Add - Only editing existing manual records
  const handleEditRecord = (record) => {
    if (record.source && record.source !== "manual") {
      setToastMessage("Auto-detected records cannot be edited directly");
      return;
    }
    if (record.isDelivered) {
      setToastMessage("Delivered records cannot be edited");
      return;
    }
    setEditingRecord(record);
    setFormData({
      goatId: record.goatId || "",
      status: record.status || "Confirmed",
      dueDate: record.dueDate || "",
      notes: record.notes || "",
      source: "manual",
      breedingId: null,
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (record) => {
    if (record.source && record.source !== "manual") {
      setToastMessage("Auto-detected records cannot be deleted directly");
      return;
    }
    if (record.isDelivered) {
      setToastMessage("Delivered records cannot be deleted");
      return;
    }
    setRecordToDelete(record);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!recordToDelete) return;
    const updatedRecords = pregnancies.filter(
      (r) => r.id !== recordToDelete.id,
    );
    setPregnancies(updatedRecords);
    savePregnancies(updatedRecords);
    setToastMessage("Pregnancy record deleted successfully");
    setDeleteConfirmOpen(false);
    setRecordToDelete(null);
  };

  // ✅ Edit manual record submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.goatId) {
      setToastMessage("Please select a goat");
      return;
    }

    if (formData.status === "Confirmed" && !formData.dueDate) {
      setToastMessage("Due date is required for confirmed pregnancies");
      return;
    }

    let updatedRecords;

    if (editingRecord) {
      updatedRecords = pregnancies.map((r) =>
        r.id === editingRecord.id
          ? {
              ...r,
              goatId: formData.goatId,
              status: formData.status,
              dueDate: formData.dueDate,
              notes: formData.notes,
              source: "manual",
              updatedAt: new Date(),
            }
          : r,
      );
      setToastMessage("Pregnancy record updated successfully");
    }

    setPregnancies(updatedRecords);
    savePregnancies(updatedRecords);
    setIsModalOpen(false);
    setEditingRecord(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
  };

  // ✅ Filter records for stats
  const activePregnancies = pregnancies.filter((p) => !p.isDelivered);
  const deliveredPregnancies = pregnancies.filter(
    (p) => p.isDelivered === true,
  );

  const dueIn30Days = activePregnancies.filter((p) => {
    const days = getDaysUntilDue(p.dueDate);
    return days !== null && days <= 30 && days > 0;
  });

  const overdue = activePregnancies.filter((p) => {
    const days = getDaysUntilDue(p.dueDate);
    return days !== null && days < 0;
  });

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
          <h2>Pregnancy Management</h2>
          <div className="desc">
            Pregnancy records are auto-created from breeding records. Manage
            deliveries and track pregnancy status.
          </div>
        </div>
        <div style={{ fontSize: "0.7rem", color: "#766d5d" }}>
          Total: {pregnancies.length} | Active: {activePregnancies.length} |
          Delivered: {deliveredPregnancies.length}
        </div>
      </div>

      {/* Stats without icons */}
      <div className="overview-grid">
        <div className="ov-card">
          <span className="ov-num">{activePregnancies.length}</span>
          <span className="ov-lbl">Active Pregnancies</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(76, 175, 80, 0.12)" }}
        >
          <span className="ov-num">{deliveredPregnancies.length}</span>
          <span className="ov-lbl">Delivered</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(33, 150, 243, 0.12)" }}
        >
          <span className="ov-num">{dueIn30Days.length}</span>
          <span className="ov-lbl">Due in 30 Days</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(244, 67, 54, 0.12)" }}
        >
          <span className="ov-num">{overdue.length}</span>
          <span className="ov-lbl">Overdue</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(15, 122, 117, 0.08)" }}
        >
          <span className="ov-num">{pregnantGoats.length}</span>
          <span className="ov-lbl">From Goats</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(156, 39, 176, 0.08)" }}
        >
          <span className="ov-num">{conceivedBreedings.length}</span>
          <span className="ov-lbl">From Breeding</span>
        </div>
      </div>

      <div className="table-wrap" style={{ marginTop: "16px" }}>
        <table>
          <thead>
            <tr>
              <th>Goat</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Days Left</th>
              <th>Source</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pregnancies.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty">
                  No pregnancy records found.
                  <br />
                  <small style={{ color: "#766d5d" }}>
                    Pregnancy records are auto-created when a breeding record is
                    marked as "Conceived" or a goat is marked as "Pregnant".
                  </small>
                </td>
              </tr>
            ) : (
              pregnancies.map((record) => {
                const daysLeft = getDaysUntilDue(record.dueDate);
                const statusBadge = getStatusBadge(record.status);
                const sourceBadge = getSourceBadge(record.source || "manual");
                const isManual = record.source === "manual" || !record.source;
                const isDuePassed = isDueDatePassed(record.dueDate);
                const isDelivered = record.isDelivered === true;

                return (
                  <tr key={record.id}>
                    <td>
                      <strong>
                        {record.goatTagId || getGoatInfo(record.goatId)}
                      </strong>
                      {record.goatBreed && (
                        <span
                          style={{
                            fontSize: "0.6rem",
                            color: "#766d5d",
                            display: "block",
                          }}
                        >
                          {record.goatBreed}
                        </span>
                      )}
                      {record.goatStatus &&
                        record.goatStatus !== "Pregnant" &&
                        !isDelivered && (
                          <span
                            style={{
                              fontSize: "0.5rem",
                              color: "var(--danger)",
                              display: "block",
                            }}
                          >
                            Status: {record.goatStatus}
                          </span>
                        )}
                      {record.breedingResult && (
                        <span
                          style={{
                            fontSize: "0.5rem",
                            color: "var(--pasture)",
                            display: "block",
                          }}
                        >
                          Breeding: {record.breedingResult}
                        </span>
                      )}
                    </td>
                    <td>
                      {isDelivered ? (
                        <span className="pill income">Delivered</span>
                      ) : (
                        <span className={statusBadge.className}>
                          {statusBadge.label}
                        </span>
                      )}
                    </td>
                    <td>{record.dueDate ? formatDate(record.dueDate) : "—"}</td>
                    <td>
                      {record.status === "Confirmed" &&
                      record.dueDate &&
                      !isDelivered ? (
                        <span
                          style={{
                            color:
                              daysLeft < 0
                                ? "var(--danger)"
                                : daysLeft <= 30
                                ? "var(--gold)"
                                : "var(--pasture)",
                            fontWeight: 700,
                          }}
                        >
                          {daysLeft < 0
                            ? `${Math.abs(daysLeft)} days overdue`
                            : `${daysLeft} days`}
                        </span>
                      ) : isDelivered ? (
                        <span
                          style={{ color: "var(--pasture)", fontWeight: 700 }}
                        >
                          Delivered
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span className={sourceBadge.className}>
                        {sourceBadge.label}
                      </span>
                      {record.breedingType && (
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
                      <span style={{ fontSize: "0.75rem", color: "#766d5d" }}>
                        {record.notes || "—"}
                      </span>
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          alignItems: "stretch",
                        }}
                      >
                        {/* Delivery Actions - Opens AddKiddingModal */}
                        {!isDelivered &&
                          record.status === "Confirmed" &&
                          record.dueDate &&
                          isDuePassed && (
                            <div
                              style={{
                                display: "flex",
                                gap: "3px",
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                className="btn btn-success btn-small action-btn"
                                onClick={() =>
                                  handleDeliveryAction(record, "delivered")
                                }
                                style={{ flex: 1, minWidth: "45px" }}
                              >
                                Delivered
                              </button>
                              <button
                                className="btn btn-danger btn-small action-btn"
                                onClick={() =>
                                  handleDeliveryAction(record, "notDelivered")
                                }
                                style={{ flex: 1, minWidth: "45px" }}
                              >
                                Failed
                              </button>
                            </div>
                          )}

                        {/* Delivered Status */}
                        {isDelivered && (
                          <span
                            className="pill income"
                            style={{
                              fontSize: "0.6rem",
                              width: "100%",
                              textAlign: "center",
                            }}
                          >
                            Done
                          </span>
                        )}

                        {/* Due Soon Badge */}
                        {!isDelivered &&
                          record.status === "Confirmed" &&
                          record.dueDate &&
                          !isDuePassed &&
                          daysLeft !== null &&
                          daysLeft <= 7 && (
                            <span
                              className="pill due"
                              style={{
                                fontSize: "0.6rem",
                                width: "100%",
                                textAlign: "center",
                              }}
                            >
                              Due Soon
                            </span>
                          )}

                        {/* Edit/Delete - Only for manual records */}
                        {isManual && !isDelivered && (
                          <div style={{ display: "flex", gap: "3px" }}>
                            <button
                              className="btn btn-ghost btn-small"
                              onClick={() => handleEditRecord(record)}
                              style={{ flex: 1 }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger btn-small"
                              onClick={() => handleDeleteClick(record)}
                              style={{ flex: 1 }}
                            >
                              Delete
                            </button>
                          </div>
                        )}

                        {/* Auto label */}
                        {!isManual && !isDelivered && (
                          <span
                            style={{
                              fontSize: "0.55rem",
                              color: "#766d5d",
                              width: "100%",
                              textAlign: "center",
                            }}
                          >
                            Auto
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Manual Pregnancy Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title="Edit Pregnancy Record"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field full-width">
              <label>Select Goat *</label>
              <select
                name="goatId"
                value={formData.goatId}
                onChange={(e) =>
                  setFormData({ ...formData, goatId: e.target.value })
                }
                className="field-input"
              >
                <option value="">Select a goat...</option>
                {goats
                  .filter((g) => g.gender === "F")
                  .map((goat) => (
                    <option key={goat.id} value={goat.id}>
                      {goat.tagId} - {goat.breed} ({goat.status})
                    </option>
                  ))}
              </select>
              <small style={{ color: "#766d5d", fontSize: "0.55rem" }}>
                Only female goats are shown
              </small>
            </div>

            <div className="field half">
              <label>Pregnancy Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="field-input"
              >
                <option value="Confirmed">Confirmed</option>
                <option value="Not Pregnant">Not Pregnant</option>
              </select>
            </div>

            <div className="field half">
              <label>Due Date {formData.status === "Confirmed" && "*"}</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                className="field-input"
                required={formData.status === "Confirmed"}
              />
            </div>

            <div className="field full-width">
              <label>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="field-input"
                placeholder="Any additional information..."
                rows="2"
                style={{ resize: "vertical", minHeight: "60px" }}
              />
            </div>
          </div>

          <div className="modal-actions">
            <Button variant="ghost" onClick={handleModalClose}>
              Cancel
            </Button>
            <Button type="submit">Update Record</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Pregnancy Record"
        message="Are you sure you want to delete this pregnancy record? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
      />

      {/* Kidding Modal */}
      <AddKiddingModal
        isOpen={isKiddingModalOpen}
        onClose={() => {
          setIsKiddingModalOpen(false);
          setDeliveryRecord(null);
          setDeliveryAction(null);
        }}
        onSuccess={handleKiddingSuccess}
        editData={null}
        pregnancyData={deliveryRecord}
        action={deliveryAction}
        goats={goats}
      />

      {/* Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </div>
  );
};

export default Pregnancy;
