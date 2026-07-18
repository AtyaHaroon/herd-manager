// src/pages/FeedAssignment.jsx - 3.5% FOR ALL TYPES, NO ICONS

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { goatService } from "../../services/goatService";
import { feedMixService } from "../../services/feedMixService";
import { feedAssignmentService } from "../../services/feedAssignmentService";
import Toast from "../../components/Common/Toast";
import Loader from "../../components/Common/Loader";
import Modal from "../../components/Common/Modal";
import Button from "../../components/Common/Button";
import Input from "../../components/Common/Input";
import ConfirmModal from "../../components/Common/ConfirmModal";
import { formatDate } from "../../utils/helpers";

// ✅ Feed Assignment Types
const ASSIGNMENT_TYPES = {
  BREEDING: "Breeding",
  FATTENING: "Fattening",
  KID_STARTER: "Kid Starter",
};

// ✅ Fixed feed percentage for all types (3.5%)
const FEED_PERCENTAGE = 3.5;

// ✅ Type labels
const ASSIGNMENT_LABELS = {
  [ASSIGNMENT_TYPES.BREEDING]: "Breeding - For breeding bucks & does",
  [ASSIGNMENT_TYPES.FATTENING]: "Fattening - For meat production",
  [ASSIGNMENT_TYPES.KID_STARTER]: "Kid Starter - For growing kids",
};

const FeedAssignment = () => {
  const { currentUser } = useAuth();
  const farmId = currentUser?.farmId;

  const [goats, setGoats] = useState([]);
  const [feedMixes, setFeedMixes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    assignmentType: ASSIGNMENT_TYPES.BREEDING,
    feedMixId: "",
    goatIds: [],
    quantity: 0,
    numberOfGoats: 0,
    startDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Selected goats with their weights
  const [selectedGoatsData, setSelectedGoatsData] = useState([]);

  // Load all data
  const loadData = useCallback(async () => {
    if (!farmId) return;
    setLoading(true);
    try {
      const [goatsData, mixesData, assignmentsData] = await Promise.all([
        goatService.getByFarmId(farmId),
        feedMixService.getByFarmId(farmId),
        feedAssignmentService.getByFarmId(farmId),
      ]);
      setGoats(goatsData || []);
      setFeedMixes(mixesData || []);
      setAssignments(assignmentsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      setToastMessage("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate feed per goat based on weight (3.5% fixed)
  const calculateFeedPerGoat = useCallback((goatWeight) => {
    if (!goatWeight || goatWeight <= 0) return 0;
    return Math.round(((goatWeight * FEED_PERCENTAGE) / 100) * 10) / 10;
  }, []);

  // Calculate total feed for all selected goats
  const calculateTotalFeed = useCallback(
    (goatsData) => {
      if (!goatsData || goatsData.length === 0) return 0;
      let total = 0;
      goatsData.forEach((goat) => {
        const perGoat = calculateFeedPerGoat(goat.weight);
        total += perGoat;
      });
      return Math.round(total * 10) / 10;
    },
    [calculateFeedPerGoat],
  );

  // Get average weight of selected goats
  const getAverageWeight = useCallback((goatsData) => {
    if (!goatsData || goatsData.length === 0) return 0;
    const totalWeight = goatsData.reduce((sum, g) => sum + (g.weight || 0), 0);
    return Math.round((totalWeight / goatsData.length) * 10) / 10;
  }, []);

  // Get min and max weight
  const getWeightRange = useCallback((goatsData) => {
    if (!goatsData || goatsData.length === 0) return { min: 0, max: 0 };
    const weights = goatsData.map((g) => g.weight || 0).filter((w) => w > 0);
    if (weights.length === 0) return { min: 0, max: 0 };
    return {
      min: Math.min(...weights),
      max: Math.max(...weights),
    };
  }, []);

  // Auto-calculate when goats change
  useEffect(() => {
    if (selectedGoatsData.length > 0) {
      const totalFeed = calculateTotalFeed(selectedGoatsData);
      const perGoatAvg =
        selectedGoatsData.length > 0
          ? Math.round((totalFeed / selectedGoatsData.length) * 10) / 10
          : 0;

      setFormData((prev) => ({
        ...prev,
        quantity: perGoatAvg,
        numberOfGoats: selectedGoatsData.length,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        quantity: 0,
        numberOfGoats: selectedGoatsData.length,
      }));
    }
  }, [selectedGoatsData, calculateTotalFeed]);

  // Handle add new assignment
  const handleAddAssignment = () => {
    setEditingAssignment(null);
    setFormData({
      assignmentType: ASSIGNMENT_TYPES.BREEDING,
      feedMixId: "",
      goatIds: [],
      quantity: 0,
      numberOfGoats: 0,
      startDate: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setSelectedGoatsData([]);
    setIsModalOpen(true);
  };

  // Handle edit assignment
  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);

    const selectedGoats = (assignment.goatIds || [])
      .map((id) => goats.find((g) => g.id === id))
      .filter((g) => g !== undefined);

    setSelectedGoatsData(selectedGoats);

    setFormData({
      assignmentType: assignment.assignmentType || ASSIGNMENT_TYPES.BREEDING,
      feedMixId: assignment.feedMixId || "",
      goatIds: assignment.goatIds || [],
      quantity: assignment.quantity || 0,
      numberOfGoats: assignment.numberOfGoats || 0,
      startDate: assignment.startDate || new Date().toISOString().split("T")[0],
      notes: assignment.notes || "",
    });

    setIsModalOpen(true);
  };

  // Handle form field change
  const handleAssignmentChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Toggle goat selection
  const toggleGoatSelection = (goatId) => {
    setSelectedGoatsData((prev) => {
      const exists = prev.find((g) => g.id === goatId);
      if (exists) {
        return prev.filter((g) => g.id !== goatId);
      } else {
        const goat = goats.find((g) => g.id === goatId);
        return goat ? [...prev, goat] : prev;
      }
    });
  };

  // Select/Deselect all goats
  const toggleAllGoats = () => {
    if (selectedGoatsData.length === goats.length) {
      setSelectedGoatsData([]);
    } else {
      setSelectedGoatsData([...goats]);
    }
  };

  // Submit assignment
  const handleAssignmentSubmit = async () => {
    try {
      if (!formData.feedMixId) {
        setToastMessage("Please select a feed mix");
        return;
      }
      if (selectedGoatsData.length === 0) {
        setToastMessage("Please select at least one goat");
        return;
      }
      if (!formData.quantity || formData.quantity <= 0) {
        setToastMessage(
          "Feed quantity is automatically calculated. Please select goats first.",
        );
        return;
      }

      const goatIds = selectedGoatsData.map((g) => g.id);
      const goatWeights = selectedGoatsData.map((g) => g.weight || 0);
      const totalFeed = calculateTotalFeed(selectedGoatsData);

      const dataToSave = {
        farmId: farmId,
        assignmentType: formData.assignmentType,
        feedMixId: formData.feedMixId,
        goatIds: goatIds,
        quantity: parseFloat(formData.quantity),
        numberOfGoats: selectedGoatsData.length,
        startDate: formData.startDate,
        notes: formData.notes || "",
        status: "Active",
        goatWeights: goatWeights,
        goatDetails: selectedGoatsData.map((g) => ({
          id: g.id,
          tagId: g.tagId,
          weight: g.weight || 0,
          breed: g.breed,
        })),
        totalFeed: totalFeed,
        feedPercentage: FEED_PERCENTAGE,
        averageWeight: getAverageWeight(selectedGoatsData),
      };

      if (editingAssignment) {
        await feedAssignmentService.update(editingAssignment.id, dataToSave);
        setToastMessage("Assignment updated successfully!");
      } else {
        await feedAssignmentService.add(dataToSave);
        setToastMessage("Assignment created successfully!");
      }

      await loadData();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving assignment:", error);
      setToastMessage("Failed to save: " + error.message);
    }
  };

  // Delete assignment
  const handleDeleteClick = (assignment) => {
    setAssignmentToDelete(assignment);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!assignmentToDelete) return;
    try {
      await feedAssignmentService.delete(assignmentToDelete.id);
      setToastMessage("Assignment deleted.");
      await loadData();
    } catch (error) {
      console.error("Error deleting assignment:", error);
      setToastMessage("Failed to delete assignment.");
    } finally {
      setDeleteConfirmOpen(false);
      setAssignmentToDelete(null);
    }
  };

  // Helper functions
  const getGoatDisplay = (goat) => {
    return `${goat.tagId} (${goat.weight || 0} kg) - ${goat.breed}`;
  };

  const getFeedMixName = (id) => {
    const mix = feedMixes.find((m) => m.id === id);
    return mix ? mix.name : "Unknown";
  };

  const getAssignmentTypeBadge = (type) => {
    const styles = {
      [ASSIGNMENT_TYPES.BREEDING]: {
        className: "pill healthy",
        label: "Breeding",
      },
      [ASSIGNMENT_TYPES.FATTENING]: {
        className: "pill income",
        label: "Fattening",
      },
      [ASSIGNMENT_TYPES.KID_STARTER]: {
        className: "pill due",
        label: "Kid Starter",
      },
    };
    return styles[type] || styles[ASSIGNMENT_TYPES.BREEDING];
  };

  // Calculate summary stats
  const avgWeight = getAverageWeight(selectedGoatsData);
  const totalFeed = calculateTotalFeed(selectedGoatsData);
  const weightRange = getWeightRange(selectedGoatsData);
  const selectedCount = selectedGoatsData.length;

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
          <h2>Feed Assignments</h2>
          <div className="desc">
            Assign feed mixes to goats with automatic weight-based calculation (
            {FEED_PERCENTAGE}% of body weight)
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleAddAssignment}>
          + Assign Feed
        </button>
      </div>

      {/* Stats */}
      <div className="overview-grid">
        <div className="ov-card">
          <span className="ov-num">{assignments.length}</span>
          <span className="ov-lbl">Total Assignments</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(76, 175, 80, 0.08)" }}
        >
          <span className="ov-num">
            {assignments.filter((a) => a.status === "Active").length}
          </span>
          <span className="ov-lbl">Active</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(33, 150, 243, 0.08)" }}
        >
          <span className="ov-num">{goats.length}</span>
          <span className="ov-lbl">Total Goats</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(217, 162, 59, 0.08)" }}
        >
          <span className="ov-num">{feedMixes.length}</span>
          <span className="ov-lbl">Feed Mixes</span>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Feed Mix</th>
              <th>Goats</th>
              <th>Per Goat</th>
              <th>Total Feed</th>
              <th>Start Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty">
                  No feed assignments yet.
                </td>
              </tr>
            ) : (
              assignments.map((assignment) => {
                const typeBadge = getAssignmentTypeBadge(
                  assignment.assignmentType,
                );
                return (
                  <tr key={assignment.id}>
                    <td>
                      <span className={typeBadge.className}>
                        {typeBadge.label}
                      </span>
                    </td>
                    <td>
                      <strong>{getFeedMixName(assignment.feedMixId)}</strong>
                    </td>
                    <td>
                      <div style={{ fontSize: "0.6rem" }}>
                        {assignment.goatDetails
                          ?.map((g) => `${g.tagId} (${g.weight} kg)`)
                          .join(", ") ||
                          assignment.goatIds
                            ?.map((id) => {
                              const goat = goats.find((g) => g.id === id);
                              return goat
                                ? `${goat.tagId} (${goat.weight || 0} kg)`
                                : id;
                            })
                            .join(", ")}
                      </div>
                      <span style={{ fontSize: "0.5rem", color: "#766d5d" }}>
                        {assignment.numberOfGoats || 0} goats
                        {assignment.averageWeight &&
                          ` | Avg: ${assignment.averageWeight} kg`}
                      </span>
                    </td>
                    <td>
                      <strong>{assignment.quantity || 0} kg</strong>
                      <span
                        style={{
                          fontSize: "0.5rem",
                          color: "#766d5d",
                          display: "block",
                        }}
                      >
                        ({assignment.feedPercentage || FEED_PERCENTAGE}% of body
                        weight)
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: "var(--pasture)" }}>
                        {assignment.totalFeed ||
                          (assignment.quantity || 0) *
                            (assignment.numberOfGoats || 0)}{" "}
                        kg/day
                      </strong>
                    </td>
                    <td>{formatDate(assignment.startDate)}</td>
                    <td>
                      <span
                        className={`pill ${
                          assignment.status === "Active" ? "healthy" : "sold"
                        }`}
                      >
                        {assignment.status || "Active"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button
                          className="btn btn-ghost btn-small"
                          onClick={() => handleEditAssignment(assignment)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => handleDeleteClick(assignment)}
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

      {/* Add/Edit Assignment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAssignment ? "Edit Feed Assignment" : "Assign Feed"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAssignmentSubmit();
          }}
        >
          <div className="form-grid">
            {/* Assignment Type */}
            <div className="field full-width">
              <label>Assignment Type *</label>
              <select
                name="assignmentType"
                value={formData.assignmentType}
                onChange={handleAssignmentChange}
                className="field-input"
              >
                <option value={ASSIGNMENT_TYPES.BREEDING}>Breeding</option>
                <option value={ASSIGNMENT_TYPES.FATTENING}>Fattening</option>
                <option value={ASSIGNMENT_TYPES.KID_STARTER}>
                  Kid Starter
                </option>
              </select>
              <small style={{ color: "#766d5d", fontSize: "0.55rem" }}>
                {ASSIGNMENT_LABELS[formData.assignmentType]} | Feed:{" "}
                {FEED_PERCENTAGE}% of body weight
              </small>
            </div>

            {/* Feed Mix */}
            <div className="field full-width">
              <label>Feed Mix *</label>
              <select
                name="feedMixId"
                value={formData.feedMixId}
                onChange={handleAssignmentChange}
                className="field-input"
              >
                <option value="">Select Feed Mix...</option>
                {feedMixes
                  .filter((m) => m.status === "Active")
                  .map((mix) => (
                    <option key={mix.id} value={mix.id}>
                      {mix.name} (Protein: {mix.protein?.toFixed(1) || 0}%,
                      Cost: PKR {mix.costPerKg?.toFixed(2) || 0}/kg)
                    </option>
                  ))}
              </select>
            </div>

            {/* Select Goats */}
            <div className="field full-width">
              <label>Select Goats *</label>
              <div
                style={{
                  maxHeight: "200px",
                  overflowY: "auto",
                  border: "1px solid var(--line)",
                  borderRadius: "8px",
                  padding: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "4px 0",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedCount === goats.length}
                    onChange={toggleAllGoats}
                  />
                  <span style={{ fontWeight: 700 }}>
                    Select All ({goats.length} goats)
                  </span>
                </div>
                {goats.map((goat) => (
                  <div
                    key={goat.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "4px 0",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedGoatsData.some((g) => g.id === goat.id)}
                      onChange={() => toggleGoatSelection(goat.id)}
                    />
                    <span>
                      {getGoatDisplay(goat)}
                      {goat.status && (
                        <span
                          style={{
                            fontSize: "0.5rem",
                            color: "#766d5d",
                            marginLeft: "4px",
                          }}
                        >
                          ({goat.status})
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Auto-calculated Feed Summary */}
            {selectedCount > 0 && (
              <div
                className="field full-width"
                style={{
                  backgroundColor: "rgba(15, 122, 117, 0.08)",
                  borderRadius: "8px",
                  padding: "16px",
                  border: "2px solid var(--pasture)",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "12px",
                    textAlign: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.5rem", color: "#766d5d" }}>
                      Selected Goats
                    </div>
                    <strong
                      style={{ fontSize: "1.1rem", color: "var(--pasture)" }}
                    >
                      {selectedCount}
                    </strong>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.5rem", color: "#766d5d" }}>
                      Avg Weight
                    </div>
                    <strong
                      style={{ fontSize: "1.1rem", color: "var(--pasture)" }}
                    >
                      {avgWeight} kg
                    </strong>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.5rem", color: "#766d5d" }}>
                      Feed per Goat
                    </div>
                    <strong
                      style={{ fontSize: "1.1rem", color: "var(--gold)" }}
                    >
                      {formData.quantity} kg
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "12px",
                    paddingTop: "12px",
                    borderTop: "1px solid var(--line)",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                    textAlign: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.5rem", color: "#766d5d" }}>
                      Weight Range
                    </div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                      {weightRange.min > 0
                        ? `${weightRange.min} - ${weightRange.max} kg`
                        : "—"}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.5rem", color: "#766d5d" }}>
                      Total Feed Required
                    </div>
                    <strong
                      style={{ fontSize: "0.85rem", color: "var(--gold)" }}
                    >
                      {totalFeed} kg/day
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "0.55rem",
                    color: "#766d5d",
                    textAlign: "center",
                  }}
                >
                  Auto-calculated from goat weights × {FEED_PERCENTAGE}% body
                  weight
                </div>
              </div>
            )}

            {/* Start Date */}
            <div className="field half">
              <Input
                label="Start Date"
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleAssignmentChange}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Notes */}
            <div className="field half">
              <Input
                label="Notes"
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleAssignmentChange}
                placeholder="Any additional notes..."
              />
            </div>
          </div>

          <div className="modal-actions">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingAssignment ? "Update Assignment" : "Assign Feed"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Assignment"
        message="Are you sure you want to delete this assignment?"
        confirmText="Delete"
        confirmVariant="danger"
      />

      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </div>
  );
};

export default FeedAssignment;
