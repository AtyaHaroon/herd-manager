// src/pages/feed/WeightTracking.jsx - FIXED IMPORT PATH
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { goatService } from "../../services/goatService";
import { growthService } from "../../services/growthService";
// ✅ FIXED: Use Common (capital C) to match the folder name convention used in other imports
import Toast from "../../components/Common/Toast";
import Loader from "../../components/Common/Loader";
import Modal from "../../components/Common/Modal";
import Button from "../../components/Common/Button";
import Input from "../../components/Common/Input";
import ConfirmModal from "../../components/Common/ConfirmModal";
import { formatDate } from "../../utils/helpers";

const WeightTracking = () => {
  const { currentUser } = useAuth();
  const farmId = currentUser?.farmId;

  const [goats, setGoats] = useState([]);
  const [selectedGoat, setSelectedGoat] = useState(null);
  const [weightHistory, setWeightHistory] = useState([]);
  const [growthMetrics, setGrowthMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  const [formData, setFormData] = useState({
    weight: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const loadData = useCallback(async () => {
    if (!farmId) return;
    setLoading(true);
    try {
      const goatsData = await goatService.getByFarmId(farmId);
      setGoats(goatsData || []);
    } catch (error) {
      console.error("Error loading goats:", error);
      setToastMessage("Failed to load goats.");
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  const loadWeightData = useCallback(async (goatId) => {
    if (!goatId) return;
    try {
      const [history, metrics] = await Promise.all([
        growthService.getWeightHistory(goatId),
        growthService.getGrowthMetrics(goatId),
      ]);
      setWeightHistory(history || []);
      setGrowthMetrics(metrics);
    } catch (error) {
      console.error("Error loading weight data:", error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedGoat) {
      loadWeightData(selectedGoat);
    }
  }, [selectedGoat, loadWeightData]);

  const handleGoatSelect = (goatId) => {
    setSelectedGoat(goatId);
  };

  const handleAddWeight = () => {
    setFormData({
      weight: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleWeightChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleWeightSubmit = async () => {
    if (!selectedGoat) {
      setToastMessage("Please select a goat");
      return;
    }
    if (!formData.weight || parseFloat(formData.weight) <= 0) {
      setToastMessage("Please enter a valid weight");
      return;
    }

    try {
      await growthService.addWeightRecord({
        goatId: selectedGoat,
        weight: parseFloat(formData.weight),
        date: formData.date,
        notes: formData.notes || "",
        farmId: farmId,
      });
      setToastMessage("Weight record added!");
      await loadWeightData(selectedGoat);
      await loadData();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding weight:", error);
      setToastMessage("Failed to add weight: " + error.message);
    }
  };

  const handleDeleteClick = (record) => {
    setRecordToDelete(record);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      await growthService.deleteWeightRecord(recordToDelete.id);
      setToastMessage("Weight record deleted.");
      await loadWeightData(selectedGoat);
      await loadData();
    } catch (error) {
      console.error("Error deleting weight record:", error);
      setToastMessage("Failed to delete record.");
    } finally {
      setDeleteConfirmOpen(false);
      setRecordToDelete(null);
    }
  };

  const getGoatInfo = (id) => {
    const goat = goats.find((g) => g.id === id);
    return goat
      ? `${goat.tagId} - ${goat.breed} (${goat.weight || 0} kg)`
      : "Select a goat";
  };

  if (loading) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", padding: "40px" }}
      >
        <Loader />
      </div>
    );
  }

  return (
    <div className="panel active">
      <div className="panel-head">
        <div>
          <h2>Weight Tracking & Growth</h2>
          <div className="desc">
            Track goat weights, ADG, FCR, and growth predictions
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleAddWeight}
          disabled={!selectedGoat}
        >
          + Add Weight
        </button>
      </div>

      {/* Goat Selector */}
      <div className="filter-bar">
        <select
          value={selectedGoat || ""}
          onChange={(e) => handleGoatSelect(e.target.value)}
          style={{ minWidth: "200px" }}
        >
          <option value="">Select a goat...</option>
          {goats.map((goat) => (
            <option key={goat.id} value={goat.id}>
              {goat.tagId} - {goat.breed} ({goat.weight || 0} kg)
            </option>
          ))}
        </select>
      </div>

      {selectedGoat && (
        <>
          {/* Growth Metrics */}
          <div className="overview-grid">
            <div className="ov-card">
              <span className="ov-num">
                {growthMetrics?.currentWeight?.toFixed(1) || "—"}
              </span>
              <span className="ov-lbl">Current Weight (kg)</span>
            </div>
            <div
              className="ov-card"
              style={{ background: "rgba(76, 175, 80, 0.08)" }}
            >
              <span className="ov-num">
                {growthMetrics?.adg?.toFixed(3) || "—"}
              </span>
              <span className="ov-lbl">ADG (kg/day)</span>
            </div>
            <div
              className="ov-card"
              style={{ background: "rgba(33, 150, 243, 0.08)" }}
            >
              <span className="ov-num">
                {growthMetrics?.fcr?.toFixed(2) || "—"}
              </span>
              <span className="ov-lbl">FCR</span>
            </div>
            <div
              className="ov-card"
              style={{ background: "rgba(217, 162, 59, 0.08)" }}
            >
              <span className="ov-num">
                {growthMetrics?.weightGain?.toFixed(1) || "—"}
              </span>
              <span className="ov-lbl">Total Gain (kg)</span>
            </div>
            <div
              className="ov-card"
              style={{ background: "rgba(156, 39, 176, 0.08)" }}
            >
              <span className="ov-num">
                {growthMetrics?.daysTracked || "—"}
              </span>
              <span className="ov-lbl">Days Tracked</span>
            </div>
            <div
              className="ov-card"
              style={{ background: "rgba(244, 67, 54, 0.08)" }}
            >
              <span className="ov-num">
                {growthMetrics?.daysToTarget || "—"}
              </span>
              <span className="ov-lbl">Days to 50 kg</span>
            </div>
          </div>

          {/* Weight History Table */}
          <div className="table-wrap" style={{ marginTop: "16px" }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Weight (kg)</th>
                  <th>Gain (kg)</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {weightHistory.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty">
                      No weight records for this goat.
                    </td>
                  </tr>
                ) : (
                  weightHistory.map((record, index) => {
                    const previous =
                      index < weightHistory.length - 1
                        ? weightHistory[index + 1]
                        : null;
                    const gain = previous
                      ? record.weight - previous.weight
                      : null;
                    return (
                      <tr key={record.id}>
                        <td>{formatDate(record.date)}</td>
                        <td>
                          <strong>{record.weight} kg</strong>
                        </td>
                        <td>
                          {gain !== null ? (
                            <span
                              style={{
                                color:
                                  gain > 0 ? "var(--pasture)" : "var(--danger)",
                              }}
                            >
                              {gain > 0 ? "+" : ""}
                              {gain.toFixed(1)} kg
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          <span
                            style={{ fontSize: "0.65rem", color: "#766d5d" }}
                          >
                            {record.notes || "—"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-danger btn-small"
                            onClick={() => handleDeleteClick(record)}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Growth Prediction */}
          {growthMetrics && growthMetrics.adg && growthMetrics.adg > 0 && (
            <div
              style={{
                marginTop: "16px",
                padding: "16px",
                backgroundColor: "rgba(15, 122, 117, 0.08)",
                borderRadius: "10px",
                border: "1px solid rgba(15, 122, 117, 0.2)",
              }}
            >
              <h4 style={{ margin: "0 0 8px 0" }}>Growth Prediction</h4>
              <p style={{ margin: "0", fontSize: "0.9rem" }}>
                {growthMetrics.daysToTarget !== null ? (
                  <>
                    <strong>
                      At current growth rate ({growthMetrics.adg.toFixed(3)}{" "}
                      kg/day), will reach 50 kg in{" "}
                      <span style={{ color: "var(--gold)", fontWeight: 700 }}>
                        {growthMetrics.daysToTarget} days
                      </span>
                    </strong>
                    <br />
                    <small style={{ color: "#766d5d" }}>
                      Current: {growthMetrics.currentWeight?.toFixed(1) || 0} kg
                      → Target: 50 kg (Gain needed:{" "}
                      {(50 - (growthMetrics.currentWeight || 0)).toFixed(1)} kg)
                    </small>
                  </>
                ) : (
                  "Insufficient data for prediction. Continue tracking weight."
                )}
              </p>
              {growthMetrics.fcr && (
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: "0.8rem",
                    color: "#555",
                  }}
                >
                  Feed Conversion Ratio (FCR):{" "}
                  <strong>{growthMetrics.fcr.toFixed(2)}</strong> (
                  {growthMetrics.feedConsumption?.toFixed(1) || 0} kg feed
                  consumed)
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Add Weight Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Add Weight - ${getGoatInfo(selectedGoat)}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleWeightSubmit();
          }}
        >
          <div className="form-grid">
            <div className="field half">
              <Input
                label="Weight (kg) *"
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleWeightChange}
                step="0.1"
                min="0.1"
                placeholder="e.g., 32"
                required
              />
            </div>

            <div className="field half">
              <Input
                label="Date"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleWeightChange}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="field full-width">
              <Input
                label="Notes"
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleWeightChange}
                placeholder="Any observations..."
              />
            </div>
          </div>

          <div className="modal-actions">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Weight</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Weight Record"
        message={`Are you sure you want to delete this weight record?`}
        confirmText="Delete"
        confirmVariant="danger"
      />

      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </div>
  );
};

export default WeightTracking;
