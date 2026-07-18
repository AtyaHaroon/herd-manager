// src/pages/FeedMix.jsx - FIXED (removed unused formatDate import)

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { feedInventoryService } from "../../services/feedInventoryService";
import { feedMixService } from "../../services/feedMixService";
import Toast from "../../components/Common/Toast";
import Loader from "../../components/Common/Loader";
import Modal from "../../components/Common/Modal";
import Button from "../../components/Common/Button";
import Input from "../../components/Common/Input";
import ConfirmModal from "../../components/Common/ConfirmModal";

const FeedMix = () => {
  const { currentUser } = useAuth();
  const farmId = currentUser?.farmId;

  const [feedItems, setFeedItems] = useState([]);
  const [feedMixes, setFeedMixes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMix, setEditingMix] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [mixToDelete, setMixToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    ingredients: [],
    status: "Active",
  });

  const [ingredientForm, setIngredientForm] = useState({
    feedId: "",
    percentage: 0,
  });

  const loadData = useCallback(async () => {
    if (!farmId) return;
    setLoading(true);
    try {
      const [items, mixes] = await Promise.all([
        feedInventoryService.getByFarmId(farmId),
        feedMixService.getByFarmId(farmId),
      ]);
      setFeedItems(items || []);
      setFeedMixes(mixes || []);
    } catch (error) {
      console.error("Error loading feed data:", error);
      setToastMessage("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddMix = () => {
    setEditingMix(null);
    setFormData({
      name: "",
      description: "",
      ingredients: [],
      status: "Active",
    });
    setIngredientForm({ feedId: "", percentage: 0 });
    setIsModalOpen(true);
  };

  const handleEditMix = (mix) => {
    setEditingMix(mix);
    setFormData({
      name: mix.name || "",
      description: mix.description || "",
      ingredients: mix.ingredients || [],
      status: mix.status || "Active",
    });
    setIsModalOpen(true);
  };

  const handleMixChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleIngredientChange = (e) => {
    const { name, value } = e.target;
    setIngredientForm((prev) => ({ ...prev, [name]: value }));
  };

  const addIngredient = () => {
    if (!ingredientForm.feedId) {
      setToastMessage("Please select a feed");
      return;
    }
    if (!ingredientForm.percentage || ingredientForm.percentage <= 0) {
      setToastMessage("Please enter a valid percentage");
      return;
    }

    // Check if ingredient already exists
    if (formData.ingredients.some((i) => i.feedId === ingredientForm.feedId)) {
      setToastMessage("This feed is already added");
      return;
    }

    // Check if total exceeds 100%
    const currentTotal = formData.ingredients.reduce(
      (sum, i) => sum + (i.percentage || 0),
      0,
    );
    if (currentTotal + parseFloat(ingredientForm.percentage) > 100) {
      setToastMessage(
        `Total percentage cannot exceed 100%. Current: ${currentTotal}%`,
      );
      return;
    }

    const feed = feedItems.find((f) => f.id === ingredientForm.feedId);
    setFormData((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          feedId: ingredientForm.feedId,
          feedName: feed?.name || "Unknown",
          percentage: parseFloat(ingredientForm.percentage),
        },
      ],
    }));

    setIngredientForm({ feedId: "", percentage: 0 });
  };

  const removeIngredient = (index) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const handleMixSubmit = async () => {
    try {
      if (!formData.name.trim()) {
        setToastMessage("Mix name is required");
        return;
      }
      if (formData.ingredients.length === 0) {
        setToastMessage("Please add at least one ingredient");
        return;
      }

      const totalPercentage = formData.ingredients.reduce(
        (sum, i) => sum + (i.percentage || 0),
        0,
      );
      if (totalPercentage !== 100) {
        setToastMessage(
          `Total percentage must be exactly 100%. Current: ${totalPercentage}%`,
        );
        return;
      }

      const dataToSave = {
        farmId: farmId,
        name: formData.name.trim(),
        description: formData.description || "",
        ingredients: formData.ingredients,
        status: formData.status,
        updatedAt: new Date(),
      };

      if (editingMix) {
        await feedMixService.update(editingMix.id, dataToSave);
        setToastMessage("Feed mix updated successfully!");
      } else {
        dataToSave.createdAt = new Date();
        await feedMixService.add(dataToSave);
        setToastMessage("Feed mix added successfully!");
      }

      await loadData();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving feed mix:", error);
      setToastMessage("Failed to save: " + error.message);
    }
  };

  const handleDeleteClick = (mix) => {
    setMixToDelete(mix);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!mixToDelete) return;
    try {
      await feedMixService.delete(mixToDelete.id);
      setToastMessage(`Deleted ${mixToDelete.name}`);
      await loadData();
    } catch (error) {
      console.error("Error deleting feed mix:", error);
      setToastMessage("Failed to delete feed mix.");
    } finally {
      setDeleteConfirmOpen(false);
      setMixToDelete(null);
    }
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
          <h2>Feed Mixes</h2>
          <div className="desc">
            Create and manage feed formulations with nutrient calculations
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleAddMix}>
          + Create Feed Mix
        </button>
      </div>

      {/* Stats */}
      <div className="overview-grid">
        <div className="ov-card">
          <span className="ov-num">{feedMixes.length}</span>
          <span className="ov-lbl">Total Mixes</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(76, 175, 80, 0.08)" }}
        >
          <span className="ov-num">
            {feedMixes.filter((m) => m.status === "Active").length}
          </span>
          <span className="ov-lbl">Active</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(255, 152, 0, 0.08)" }}
        >
          <span className="ov-num">{feedItems.length}</span>
          <span className="ov-lbl">Available Feeds</span>
        </div>
      </div>

      {/* Feed Mixes Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mix Name</th>
              <th>Ingredients</th>
              <th>Protein</th>
              <th>Energy</th>
              <th>Fiber</th>
              <th>Cost/kg</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {feedMixes.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty">
                  No feed mixes created yet.
                </td>
              </tr>
            ) : (
              feedMixes.map((mix) => (
                <tr key={mix.id}>
                  <td>
                    <strong>{mix.name}</strong>
                    {mix.description && (
                      <span
                        style={{
                          fontSize: "0.5rem",
                          color: "#766d5d",
                          display: "block",
                        }}
                      >
                        {mix.description}
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: "0.6rem" }}>
                      {mix.ingredients?.map((ing, i) => (
                        <span key={i}>
                          {ing.feedName}: {ing.percentage}%
                          {i < mix.ingredients.length - 1 && ", "}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className="pill healthy">
                      {mix.protein?.toFixed(1) || 0}%
                    </span>
                  </td>
                  <td>{mix.energy?.toFixed(1) || 0}</td>
                  <td>{mix.fiber?.toFixed(1) || 0}%</td>
                  <td>
                    <span style={{ fontWeight: 600, color: "var(--gold)" }}>
                      PKR {mix.costPerKg?.toFixed(2) || 0}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`pill ${
                        mix.status === "Active" ? "healthy" : "sold"
                      }`}
                    >
                      {mix.status || "Active"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button
                        className="btn btn-ghost btn-small"
                        onClick={() => handleEditMix(mix)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-small"
                        onClick={() => handleDeleteClick(mix)}
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Mix Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMix ? "Edit Feed Mix" : "Create Feed Mix"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleMixSubmit();
          }}
        >
          <div className="form-grid">
            <div className="field full-width">
              <Input
                label="Mix Name *"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleMixChange}
                placeholder="e.g., Goat Grower Mix, Lactation Mix"
                required
              />
            </div>

            <div className="field full-width">
              <Input
                label="Description"
                type="text"
                name="description"
                value={formData.description}
                onChange={handleMixChange}
                placeholder="e.g., 50% Corn, 20% Soybean, 30% Alfalfa"
              />
            </div>

            <div className="field full-width">
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleMixChange}
                className="field-input"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Draft">Draft</option>
              </select>
            </div>

            {/* Ingredients Section */}
            <div
              className="field full-width"
              style={{ borderTop: "1px solid var(--line)", paddingTop: "12px" }}
            >
              <label style={{ fontWeight: 700 }}>Ingredients</label>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginTop: "8px",
                  flexWrap: "wrap",
                }}
              >
                <select
                  name="feedId"
                  value={ingredientForm.feedId}
                  onChange={handleIngredientChange}
                  className="field-input"
                  style={{ flex: 2, minWidth: "150px" }}
                >
                  <option value="">Select Feed...</option>
                  {feedItems.map((feed) => (
                    <option key={feed.id} value={feed.id}>
                      {feed.name} ({feed.stockQuantity || 0} {feed.unit})
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  name="percentage"
                  value={ingredientForm.percentage}
                  onChange={handleIngredientChange}
                  placeholder="%"
                  step="0.1"
                  min="0"
                  max="100"
                  style={{ flex: 1, minWidth: "80px" }}
                />
                <Button type="button" onClick={addIngredient} size="small">
                  Add
                </Button>
              </div>

              {/* Ingredient List */}
              {formData.ingredients.length > 0 && (
                <div style={{ marginTop: "8px" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr auto",
                      gap: "4px",
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      color: "#766d5d",
                    }}
                  >
                    <span>Feed</span>
                    <span>Percentage</span>
                    <span>Amount (kg/100kg)</span>
                    <span></span>
                  </div>
                  {formData.ingredients.map((ing, index) => (
                    <div
                      key={index}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr auto",
                        gap: "4px",
                        padding: "4px 0",
                        borderBottom: "1px solid var(--line)",
                      }}
                    >
                      <span>{ing.feedName}</span>
                      <span>{ing.percentage}%</span>
                      <span>{ing.percentage} kg</span>
                      <button
                        type="button"
                        className="btn btn-danger btn-small"
                        onClick={() => removeIngredient(index)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "0.6rem",
                      fontWeight: 700,
                    }}
                  >
                    Total:{" "}
                    {formData.ingredients.reduce(
                      (sum, i) => sum + (i.percentage || 0),
                      0,
                    )}
                    %
                    {formData.ingredients.reduce(
                      (sum, i) => sum + (i.percentage || 0),
                      0,
                    ) !== 100 && (
                      <span
                        style={{ color: "var(--danger)", marginLeft: "8px" }}
                      >
                        ⚠️ Must equal 100%
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Nutrient Preview */}
            {formData.ingredients.length > 0 &&
              formData.ingredients.reduce(
                (sum, i) => sum + (i.percentage || 0),
                0,
              ) === 100 && (
                <div
                  className="field full-width"
                  style={{
                    backgroundColor: "rgba(15, 122, 117, 0.05)",
                    borderRadius: "8px",
                    padding: "12px",
                    border: "1px solid var(--line)",
                  }}
                >
                  <label style={{ fontWeight: 700 }}>
                    Calculated Nutrient Composition
                  </label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "8px",
                      marginTop: "8px",
                    }}
                  >
                    <div>
                      <strong>Protein:</strong>{" "}
                      <span className="pill healthy">
                        {(formData.protein || 0).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <strong>Energy:</strong>{" "}
                      {(formData.energy || 0).toFixed(1)}
                    </div>
                    <div>
                      <strong>Fiber:</strong> {(formData.fiber || 0).toFixed(1)}
                      %
                    </div>
                    <div>
                      <strong>Fat:</strong> {(formData.fat || 0).toFixed(1)}%
                    </div>
                    <div>
                      <strong>Calcium:</strong>{" "}
                      {(formData.calcium || 0).toFixed(1)}%
                    </div>
                    <div>
                      <strong>Phosphorus:</strong>{" "}
                      {(formData.phosphorus || 0).toFixed(1)}%
                    </div>
                  </div>
                  <div style={{ marginTop: "8px" }}>
                    <strong>Cost per kg:</strong>{" "}
                    <span style={{ color: "var(--gold)", fontWeight: 700 }}>
                      PKR {(formData.costPerKg || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
          </div>

          <div className="modal-actions">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingMix ? "Update Mix" : "Create Mix"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Feed Mix"
        message={`Are you sure you want to delete "${mixToDelete?.name}"?`}
        confirmText="Delete"
        confirmVariant="danger"
      />

      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </div>
  );
};

export default FeedMix;
