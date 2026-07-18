// src/pages/Add/AddMedicineModal.jsx - ADD/EDIT MEDICINE MODAL (No Icons)

import React, { useState, useEffect } from "react";
import Modal from "../../components/Common/Modal";
import Button from "../../components/Common/Button";
import Input from "../../components/Common/Input";
import { useAuth } from "../../context/AuthContext";
import {
  addDocument,
  updateDocument,
  COLLECTIONS,
} from "../../firebase/firestore";
import Toast from "../../components/Common/Toast";

const AddMedicineModal = ({ isOpen, onClose, onSuccess, editData }) => {
  const { currentUser } = useAuth();
  const farmId = currentUser?.farmId;

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    disease: "",
    treatment: "",
    dosage: "",
    usage: "",
    description: "",
    notes: "",
    farmId: farmId || "",
  });

  // Common diseases suggestions
  const commonDiseases = [
    "PPR (Peste des Petits Ruminants)",
    "FMD (Foot and Mouth Disease)",
    "Enterotoxemia",
    "Pneumonia",
    "Mastitis",
    "Foot Rot",
    "Internal Parasites",
    "External Parasites (Mites/Lice)",
    "Orf (Contagious Ecthyma)",
    "Caprine Arthritis Encephalitis (CAE)",
    "Caseous Lymphadenitis (CL)",
    "Anthrax",
    "Brucellosis",
    "Tetanus",
    "Coccidiosis",
    "Ketosis",
    "Pregnancy Toxemia",
    "Milk Fever",
    "Bluetongue",
    "Johne's Disease",
    "Q Fever",
    "Ringworm",
    "Pink Eye",
  ];

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          name: editData.name || "",
          price: editData.price || "",
          disease: editData.disease || "",
          treatment: editData.treatment || "",
          dosage: editData.dosage || "",
          usage: editData.usage || "",
          description: editData.description || "",
          notes: editData.notes || "",
          farmId: editData.farmId || farmId || "",
        });
      } else {
        setFormData({
          name: "",
          price: "",
          disease: "",
          treatment: "",
          dosage: "",
          usage: "",
          description: "",
          notes: "",
          farmId: farmId || "",
        });
      }
      setErrors({});
    }
  }, [isOpen, editData, farmId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim() === "") {
      newErrors.name = "Medicine name is required";
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "Valid price is required";
    }

    if (!formData.disease || formData.disease.trim() === "") {
      newErrors.disease = "Disease is required";
    }

    if (formData.notes && formData.notes.length > 200) {
      newErrors.notes = "Notes cannot exceed 200 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const dataToSave = {
        farmId: farmId,
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        disease: formData.disease.trim(),
        treatment: formData.treatment || "",
        dosage: formData.dosage || "",
        usage: formData.usage || "",
        description: formData.description || "",
        notes: formData.notes || "",
        updatedAt: new Date(),
      };

      if (editData) {
        await updateDocument(COLLECTIONS.MEDICINES, editData.id, dataToSave);
        setToastMessage("Medicine updated successfully!");
      } else {
        dataToSave.createdAt = new Date();
        await addDocument(COLLECTIONS.MEDICINES, dataToSave);
        setToastMessage("Medicine added successfully!");
      }

      if (onSuccess) {
        await onSuccess();
      }
      onClose();
    } catch (error) {
      console.error("Error saving medicine:", error);
      setToastMessage("Failed to save: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={editData ? "Edit Medicine" : "Add Medicine"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="form-grid">
            {/* Medicine Name */}
            <div className="field half">
              <Input
                label="Medicine Name *"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Albendazole, Oxytetracycline"
                error={errors.name}
                disabled={loading}
              />
            </div>

            {/* Price */}
            <div className="field half">
              <Input
                label="Price (PKR) *"
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="e.g., 500"
                step="10"
                min="0"
                error={errors.price}
                disabled={loading}
              />
            </div>

            {/* Disease */}
            <div className="field full-width">
              <label>
                Disease / Condition *
                <span style={{ color: "var(--danger)", marginLeft: "2px" }}>
                  *
                </span>
              </label>
              <select
                name="disease"
                value={formData.disease}
                onChange={handleChange}
                className="field-input"
                disabled={loading}
                style={{
                  borderColor: errors.disease ? "var(--danger)" : "",
                }}
              >
                <option value="">Select a disease...</option>
                {commonDiseases.map((disease) => (
                  <option key={disease} value={disease}>
                    {disease}
                  </option>
                ))}
                <option value="__other__">Other (Type below)</option>
              </select>
              {formData.disease === "__other__" && (
                <Input
                  type="text"
                  name="disease_custom"
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      disease: e.target.value,
                    }));
                  }}
                  placeholder="Enter disease name..."
                  disabled={loading}
                  style={{ marginTop: "4px" }}
                />
              )}
              {errors.disease && (
                <div className="error-text">{errors.disease}</div>
              )}
            </div>

            {/* Treatment */}
            <div className="field full-width">
              <label>Treatment / Administration</label>
              <select
                name="treatment"
                value={formData.treatment}
                onChange={handleChange}
                className="field-input"
                disabled={loading}
              >
                <option value="">Select treatment method...</option>
                <option value="Oral">Oral (Tablet/Syrup)</option>
                <option value="Injection (IM)">Injection (IM)</option>
                <option value="Injection (IV)">Injection (IV)</option>
                <option value="Injection (SC)">Injection (SC)</option>
                <option value="Topical">Topical (Cream/Ointment)</option>
                <option value="Drench">Drench</option>
                <option value="Pour-on">Pour-on</option>
                <option value="Dipping">Dipping</option>
                <option value="Spray">Spray</option>
                <option value="Feed Additive">Feed Additive</option>
                <option value="Water Additive">Water Additive</option>
                <option value="Other">Other</option>
              </select>
              <small style={{ color: "#766d5d", fontSize: "0.55rem" }}>
                How should this medicine be administered?
              </small>
            </div>

            {/* Dosage */}
            <div className="field half">
              <Input
                label="Dosage"
                type="text"
                name="dosage"
                value={formData.dosage}
                onChange={handleChange}
                placeholder="e.g., 5ml/50kg, 1 tablet/day"
                disabled={loading}
              />
              <small style={{ color: "#766d5d", fontSize: "0.55rem" }}>
                Recommended dosage amount
              </small>
            </div>

            {/* Usage */}
            <div className="field half">
              <Input
                label="Usage / Frequency"
                type="text"
                name="usage"
                value={formData.usage}
                onChange={handleChange}
                placeholder="e.g., Daily for 5 days, Once"
                disabled={loading}
              />
              <small style={{ color: "#766d5d", fontSize: "0.55rem" }}>
                How often to use this medicine
              </small>
            </div>

            {/* Description */}
            <div className="field full-width">
              <Input
                label="Description"
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="e.g., Broad-spectrum antibiotic for respiratory infections"
                disabled={loading}
              />
            </div>

            {/* Notes */}
            <div className="field full-width">
              <Input
                label="Notes"
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any additional notes (max 200 chars)..."
                maxLength={200}
                error={errors.notes}
                disabled={loading}
              />
              <small style={{ color: "#766d5d", fontSize: "0.55rem" }}>
                {formData.notes?.length || 0}/200 characters
              </small>
            </div>
          </div>

          <div className="modal-actions">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Saving..."
                : editData
                ? "Update Medicine"
                : "Add Medicine"}
            </Button>
          </div>
        </form>
      </Modal>

      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </>
  );
};

export default AddMedicineModal;
