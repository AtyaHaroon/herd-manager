// src/pages/Add/AddVaccineModal.jsx - SINGLE ERROR FIX

import React, { useState, useEffect, useRef } from "react";
import Modal from "../../components/Common/Modal";
import Button from "../../components/Common/Button";
import Input from "../../components/Common/Input";
import { useAuth } from "../../context/AuthContext";
import {
  addDocument,
  updateDocument,
  getCollection,
  COLLECTIONS,
} from "../../firebase/firestore";
import Toast from "../../components/Common/Toast";

const AddVaccineModal = ({ isOpen, onClose, onSuccess, editData }) => {
  const { currentUser } = useAuth();
  const farmId = currentUser?.farmId;

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameChecked, setNameChecked] = useState(false);
  const [isNameAvailable, setIsNameAvailable] = useState(false);

  // ✅ Track original name when field gets focus
  const [originalName, setOriginalName] = useState("");

  // ✅ Refs
  const nameValidatedRef = useRef(false);
  const isMountedRef = useRef(true);
  const validationTimeoutRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    scheduleDays: "",
    recommendedAge: "",
    description: "",
    notes: "",
    farmId: farmId || "",
  });

  // ✅ Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
        validationTimeoutRef.current = null;
      }
    };
  }, []);

  // ✅ Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          name: editData.name || "",
          price: editData.price || "",
          scheduleDays: editData.scheduleDays || "",
          recommendedAge: editData.recommendedAge || "",
          description: editData.description || "",
          notes: editData.notes || "",
          farmId: editData.farmId || farmId || "",
        });
        setIsNameAvailable(true);
        nameValidatedRef.current = true;
        setNameChecked(true);
        setOriginalName(editData.name || "");
      } else {
        setFormData({
          name: "",
          price: "",
          scheduleDays: "",
          recommendedAge: "",
          description: "",
          notes: "",
          farmId: farmId || "",
        });
        setIsNameAvailable(false);
        nameValidatedRef.current = false;
        setNameChecked(false);
        setOriginalName("");
      }
      setErrors({});
      setIsCheckingName(false);

      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
        validationTimeoutRef.current = null;
      }
    }
  }, [isOpen, editData, farmId]);

  // ✅ Check if vaccine name already exists
  const checkVaccineNameExists = async (name, excludeId = null) => {
    if (!name || name.trim() === "" || !farmId) return false;

    try {
      console.log("🔍 Checking vaccine name:", name);
      const vaccines = await getCollection(COLLECTIONS.VACCINES, [
        { field: "farmId", operator: "==", value: farmId },
        { field: "name", operator: "==", value: name.trim() },
      ]);

      console.log("📊 Found:", vaccines?.length || 0);

      if (excludeId) {
        return vaccines.some((v) => v.id !== excludeId);
      }
      return vaccines && vaccines.length > 0;
    } catch (error) {
      console.error("Error checking vaccine name:", error);
      return false;
    }
  };

  // ✅ Validate name function
  const validateName = async (nameValue, showChecking = true) => {
    if (!nameValue || nameValue.trim() === "") {
      setErrors((prev) => ({ ...prev, name: "Vaccine name is required" }));
      setIsNameAvailable(false);
      nameValidatedRef.current = false;
      setNameChecked(true);
      return false;
    }

    if (showChecking) {
      setIsCheckingName(true);
    }

    try {
      const exists = await checkVaccineNameExists(
        nameValue,
        editData?.id || null,
      );

      if (exists) {
        // ✅ ONLY set the error message - status indicator will show separately
        setErrors((prev) => ({
          ...prev,
          name: `⚠️ Vaccine "${nameValue.trim()}" already exists in your farm. Please use a different name.`,
        }));
        setIsNameAvailable(false);
        nameValidatedRef.current = false;
        setNameChecked(true);
        return false;
      } else {
        setErrors((prev) => ({ ...prev, name: "" }));
        setIsNameAvailable(true);
        nameValidatedRef.current = true;
        setNameChecked(true);
        return true;
      }
    } catch (error) {
      console.error("Error validating name:", error);
      return false;
    } finally {
      setIsCheckingName(false);
    }
  };

  // ✅ Handle focus - Store original name
  const handleFocus = (e) => {
    const { name, value } = e.target;
    if (name === "name") {
      setOriginalName(value || "");
    }
  };

  // ✅ Handle input change - Only reset validation state, NO AUTO-VALIDATION
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // ✅ For name field: Reset validation state if name changed
    if (name === "name") {
      // ✅ Clear any pending validation
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
        validationTimeoutRef.current = null;
      }

      // ✅ If name is empty, show required error
      if (!value || value.trim() === "") {
        setErrors((prev) => ({ ...prev, name: "Vaccine name is required" }));
        setIsNameAvailable(false);
        nameValidatedRef.current = false;
        setNameChecked(false);
        return;
      }

      // ✅ Reset validation state - will re-validate on blur
      setNameChecked(false);
      setIsNameAvailable(false);
      nameValidatedRef.current = false;

      // ✅ Clear any existing error (will show new error on blur)
      setErrors((prev) => ({ ...prev, name: "" }));
    }
  };

  // ✅ Handle blur - MAIN VALIDATION HAPPENS HERE
  const handleBlur = async (e) => {
    const { name, value } = e.target;

    if (name === "name") {
      // ✅ Clear any pending validation
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
        validationTimeoutRef.current = null;
      }

      // ✅ Validate on blur
      if (value && value.trim()) {
        // ✅ Check if name changed from original
        const nameChanged = value.trim() !== originalName.trim();

        // ✅ Validate if: not validated before OR name changed
        if (!nameValidatedRef.current || nameChanged) {
          console.log("🔍 Blur validation - name changed:", nameChanged);
          await validateName(value, true);
        } else {
          // ✅ Already validated and name not changed
          console.log("✅ Name already validated, skipping blur validation");
        }
      } else {
        // ✅ Empty name
        setErrors((prev) => ({ ...prev, name: "Vaccine name is required" }));
        setIsNameAvailable(false);
        nameValidatedRef.current = false;
        setNameChecked(true);
      }
    }
  };

  // ✅ Validate entire form
  const validateForm = async () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim() === "") {
      newErrors.name = "Vaccine name is required";
    } else {
      const exists = await checkVaccineNameExists(
        formData.name,
        editData?.id || null,
      );
      if (exists) {
        newErrors.name = `⚠️ Vaccine "${formData.name.trim()}" already exists in your farm. Please use a different name.`;
      }
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "Valid price is required";
    }

    if (!formData.scheduleDays || parseInt(formData.scheduleDays) <= 0) {
      newErrors.scheduleDays = "Valid schedule days is required";
    } else if (parseInt(formData.scheduleDays) > 730) {
      newErrors.scheduleDays = "Schedule days cannot exceed 730 (2 years)";
    }

    if (formData.notes && formData.notes.length > 200) {
      newErrors.notes = "Notes cannot exceed 200 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Handle Submit
  const handleSubmit = async () => {
    // ✅ Validate name one more time
    if (formData.name && formData.name.trim()) {
      const isValid = await validateName(formData.name, true);
      if (!isValid) return;
    }

    const isValid = await validateForm();
    if (!isValid) return;

    setLoading(true);
    try {
      const dataToSave = {
        farmId: farmId,
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        scheduleDays: parseInt(formData.scheduleDays),
        recommendedAge: formData.recommendedAge || "",
        description: formData.description || "",
        notes: formData.notes || "",
        updatedAt: new Date(),
      };

      if (editData) {
        await updateDocument(COLLECTIONS.VACCINES, editData.id, dataToSave);
        setToastMessage("✅ Vaccine updated successfully!");
      } else {
        dataToSave.createdAt = new Date();
        await addDocument(COLLECTIONS.VACCINES, dataToSave);
        setToastMessage("✅ Vaccine added successfully!");
      }

      if (onSuccess) {
        await onSuccess();
      }
      onClose();
    } catch (error) {
      console.error("Error saving vaccine:", error);
      setToastMessage("❌ Failed to save: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={editData ? "Edit Vaccine" : "Add Vaccine"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="form-grid">
            {/* Vaccine Name */}
            <div className="field full-width">
              <Input
                label="Vaccine Name *"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="e.g., PPR, FMD, Enterotoxemia"
                error={errors.name} // ✅ This shows the error message
                disabled={loading || isCheckingName}
              />

              {/* ✅ Status Indicators - ONLY SHOW WHEN NO ERROR FROM INPUT */}
              <div style={{ marginTop: "4px", minHeight: "20px" }}>
                {isCheckingName && (
                  <span style={{ color: "#766d5d", fontSize: "0.6rem" }}>
                    🔄 Checking availability...
                  </span>
                )}

                {/* ✅ Only show status if there is NO error from Input component */}
                {!isCheckingName &&
                  nameChecked &&
                  isNameAvailable &&
                  formData.name &&
                  formData.name.trim() &&
                  !errors.name && (
                    <span
                      style={{
                        color: "#4caf50",
                        fontSize: "0.6rem",
                        fontWeight: "600",
                      }}
                    >
                      ✅ Name is available
                    </span>
                  )}

                {/* ✅ DON'T show this separately - error already shows in Input */}
                {/* This is removed to avoid double error */}

                {(!formData.name || formData.name.trim() === "") && (
                  <span style={{ color: "#999", fontSize: "0.55rem" }}>
                    Enter a unique vaccine name
                  </span>
                )}
              </div>
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

            {/* Schedule Days */}
            <div className="field half">
              <Input
                label="Schedule (Days) *"
                type="number"
                name="scheduleDays"
                value={formData.scheduleDays}
                onChange={handleChange}
                placeholder="e.g., 365"
                step="1"
                min="1"
                max="730"
                error={errors.scheduleDays}
                disabled={loading}
              />
              <small style={{ color: "#766d5d", fontSize: "0.55rem" }}>
                Days after which next dose is due (max 730 days)
              </small>
            </div>

            {/* Recommended Age */}
            <div className="field full-width">
              <Input
                label="Recommended Age"
                type="text"
                name="recommendedAge"
                value={formData.recommendedAge}
                onChange={handleChange}
                placeholder="e.g., 3 months, 6 months, 1 year"
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div className="field full-width">
              <Input
                label="Description"
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="e.g., Peste des Petits Ruminants vaccine"
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
            <Button
              type="submit"
              disabled={
                loading ||
                isCheckingName ||
                (formData.name &&
                  formData.name.trim() !== "" &&
                  !isNameAvailable &&
                  !editData)
              }
            >
              {loading ? "Saving..." : editData ? "Update" : "Add Vaccine"}
            </Button>
          </div>
        </form>
      </Modal>

      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </>
  );
};

export default AddVaccineModal;
