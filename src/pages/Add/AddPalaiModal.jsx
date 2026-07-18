// src/pages/palai/AddPalaiModal.jsx
import React, { useState, useEffect } from "react";
import Modal from "../../components/Common/Modal";
import Button from "../../components/Common/Button";
import Input from "../../components/Common/Input";
import Toast from "../../components/Common/Toast";
import { palaiPackageService } from "../../services/palaiPackageService";

const AddPalaiModal = ({ isOpen, onClose, onSuccess, editData, farmId }) => {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    features: [],
  });

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          name: editData.name || "",
          price: editData.price || "",
          features: editData.features || [],
        });
      } else {
        setFormData({
          name: "",
          price: "",
          features: [],
        });
      }
    }
  }, [isOpen, editData]);

  // Add new feature
  const addFeature = () => {
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, ""],
    }));
  };

  // Remove a feature
  const removeFeature = (index) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  // Update feature value
  const updateFeature = (index, val) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.map((item, i) => (i === index ? val : item)),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setToastMessage("Package name is required.");
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setToastMessage("Valid price is required.");
      return;
    }

    setLoading(true);
    try {
      const dataToSave = {
        farmId: farmId,
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        features: formData.features.filter((f) => f.trim() !== ""),
        createdAt: editData ? editData.createdAt : new Date(),
        updatedAt: new Date(),
      };

      if (editData) {
        await palaiPackageService.update(editData.id, dataToSave);
      } else {
        await palaiPackageService.add(dataToSave);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving package:", error);
      setToastMessage("Failed to save package.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={editData ? "Edit Package" : "Add New Package"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="form-grid">
            <Input
              label="Package Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Premium, Standard"
              style={{ textTransform: "capitalize" }} // ✅ Auto Capitalize for name
            />
          </div>

          {/* Features Section */}
          <div
            style={{
              marginTop: "16px",
              borderTop: "1px solid var(--line)",
              paddingTop: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <label
                style={{
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  color: "var(--pasture-light)",
                }}
              >
                Package Features
              </label>
              <Button
                type="button"
                variant="primary"
                size="small"
                onClick={addFeature}
              >
                + Add Feature
              </Button>
            </div>

            {formData.features.map((feature, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  gap: "8px",
                  marginTop: "8px",
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1 }}>
                  <Input
                    label="Feature Name"
                    type="text"
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    placeholder="e.g., Seasonal oil & butter"
                    style={{ textTransform: "capitalize" }} // ✅ Auto Capitalize for features
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeFeature(index)}
                  style={{
                    background: "transparent",
                    border: "1px solid #b0473e",
                    color: "#b0473e",
                    borderRadius: "6px",
                    padding: "6px 10px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    marginTop: "20px",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}

            {formData.features.length === 0 && (
              <div
                style={{ color: "#999", fontSize: "0.7rem", padding: "8px 0" }}
              >
                No features added yet. Click "Add Feature" to include package
                features.
              </div>
            )}
          </div>

          {/* ✅ Price Field - Last mein rakha hai */}
          <div
            style={{
              marginTop: "20px",
              borderTop: "1px solid var(--line)",
              paddingTop: "16px",
            }}
          >
            <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
              <Input
                label="Package Price (PKR)"
                type="number"
                name="price"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="e.g., 9500"
                step="100"
              />
            </div>
          </div>

          <div className="modal-actions">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : editData ? "Update" : "Add Package"}
            </Button>
          </div>
        </form>
      </Modal>

      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </>
  );
};

export default AddPalaiModal;
