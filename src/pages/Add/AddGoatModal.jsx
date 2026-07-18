// src/pages/Add/AddGoatModal.jsx - WITH VACCINATION STATUS (COMPLETED/DUE) + QUARANTINE DAYS

import React, { useState, useEffect } from "react";
import Modal from "../../components/Common/Modal";
import Button from "../../components/Common/Button";
import Input from "../../components/Common/Input";
import { useGoatForm } from "../../hooks/useGoatForm";
import { goatService } from "../../services/goatService";
import { GOAT_SOURCE_TYPES, PURCHASE_TYPES } from "../../utils/constants";
import Toast from "../../components/Common/Toast";
import { palaiPackageService } from "../../services/palaiPackageService";
import {
  getCollection,
  addDocument,
  COLLECTIONS,
} from "../../firebase/firestore";
import { generateId } from "../../utils/helpers";

// ✅ Status Options
const GOAT_HEALTH_STATUS = {
  HEALTHY: "Healthy",
  PREGNANT: "Pregnant",
  LACTATING: "Lactating",
  DRY: "Dry",
  SOLD: "Sold",
  DEAD: "Dead",
  QUARANTINE: "Quarantine",
};

// ✅ Get status options based on gender
const getStatusOptions = (gender) => {
  const commonStatuses = [
    GOAT_HEALTH_STATUS.HEALTHY,
    GOAT_HEALTH_STATUS.SOLD,
    GOAT_HEALTH_STATUS.DEAD,
    GOAT_HEALTH_STATUS.QUARANTINE,
  ];

  const femaleStatuses = [
    GOAT_HEALTH_STATUS.PREGNANT,
    GOAT_HEALTH_STATUS.LACTATING,
    GOAT_HEALTH_STATUS.DRY,
  ];

  if (gender === "F") {
    return [...commonStatuses, ...femaleStatuses];
  }

  return commonStatuses;
};

// ✅ Helper: Get age in Years, Months & Days
const getAgeDisplay = (dob) => {
  if (!dob) return "—";

  const birthDate = new Date(dob + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(birthDate.getTime())) return "—";
  if (birthDate > today) return "Future date";

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += lastMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years === 0 && months === 0 && days === 0) {
    return "Today (0 days)";
  }

  const parts = [];

  if (years > 0) {
    parts.push(`${years} yr${years > 1 ? "s" : ""}`);
  }

  if (months > 0) {
    parts.push(`${months} month${months > 1 ? "s" : ""}`);
  }

  if (days > 0) {
    parts.push(`${days} day${days > 1 ? "s" : ""}`);
  }

  if (years === 0 && months === 0 && days > 0) {
    return `${days} day${days > 1 ? "s" : ""}`;
  }

  return parts.length > 0 ? parts.join(" ") : "< 1 day";
};

// ✅ Helper: Calculate age in years (for storage)
const calculateAgeInYears = (dob) => {
  if (!dob) return 0;

  const birthDate = new Date(dob + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(birthDate.getTime())) return 0;
  if (birthDate > today) return 0;

  const diffTime = today - birthDate;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  let ageInYears = diffDays / 365.25;

  if (ageInYears < 0) ageInYears = 0;

  return Math.round(ageInYears * 100) / 100;
};

// ✅ Helper: Get stage based on age and gender
const getStage = (ageInYears, gender) => {
  if (ageInYears < 1) return "Kid";
  return gender === "F" ? "Doe" : "Buck";
};

const AddGoatModal = ({ isOpen, onClose, onSuccess, editData }) => {
  const {
    formData,
    handleInputChange,
    parentOptions,
    loadingParents,
    resetForm,
    tagIdError,
    setTagIdError,
    checkTagIdUnique,
  } = useGoatForm(editData);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toastMessage, setToastMessage] = useState("");
  const [ageDisplay, setAgeDisplay] = useState("");

  // ✅ Palai related state
  const [palaiPackages, setPalaiPackages] = useState([]);
  const [loadingPalai, setLoadingPalai] = useState(false);
  const [selectedPalaiPackage, setSelectedPalaiPackage] = useState(null);
  const [palaiFeatures, setPalaiFeatures] = useState([]);
  const [newFeatureName, setNewFeatureName] = useState("");
  const [newFeaturePrice, setNewFeaturePrice] = useState("");

  // ✅ Vaccination related state
  const [isVaccinated, setIsVaccinated] = useState(false);
  const [vaccinesList, setVaccinesList] = useState([]);
  const [selectedVaccineIds, setSelectedVaccineIds] = useState([]);
  const [loadingVaccines, setLoadingVaccines] = useState(false);

  const farmId = formData.farmId;

  // ✅ Get status options based on current gender
  const statusOptions = getStatusOptions(formData.gender);

  // ✅ Calculate age display whenever DOB changes
  useEffect(() => {
    if (formData.dob) {
      const display = getAgeDisplay(formData.dob);
      setAgeDisplay(display);
    } else {
      setAgeDisplay("—");
    }
  }, [formData.dob]);

  // ✅ Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
      setErrors({});
      setTagIdError("");
      setAgeDisplay("—");
      setSelectedPalaiPackage(null);
      setPalaiFeatures([]);
      setNewFeatureName("");
      setNewFeaturePrice("");
      setIsVaccinated(false);
      setSelectedVaccineIds([]);
    }
  }, [isOpen, resetForm, setTagIdError]);

  // ✅ When editing, recalculate age from DOB
  useEffect(() => {
    if (isOpen && editData && editData.dob) {
      const display = getAgeDisplay(editData.dob);
      setAgeDisplay(display);
    }
  }, [isOpen, editData]);

  // ✅ Load Palai packages when farmId is available
  useEffect(() => {
    const fetchPalaiPackages = async () => {
      if (!farmId) return;
      setLoadingPalai(true);
      try {
        const data = await palaiPackageService.getByFarmId(farmId);
        setPalaiPackages(data || []);
      } catch (error) {
        console.error("Error loading Palai packages:", error);
      } finally {
        setLoadingPalai(false);
      }
    };
    fetchPalaiPackages();
  }, [farmId]);

  // ✅ Load Vaccines when farmId is available
  useEffect(() => {
    const fetchVaccines = async () => {
      if (!farmId) return;
      setLoadingVaccines(true);
      try {
        console.log("✅ Fetching vaccines for farm:", farmId);
        const data = await getCollection(COLLECTIONS.VACCINES, [
          { field: "farmId", operator: "==", value: farmId },
        ]);
        console.log("✅ Vaccines loaded:", data?.length || 0);
        setVaccinesList(data || []);
      } catch (error) {
        console.error("❌ Error loading vaccines:", error);
        setToastMessage("Failed to load vaccines: " + error.message);
      } finally {
        setLoadingVaccines(false);
      }
    };
    fetchVaccines();
  }, [farmId]);

  // ✅ When user selects a Palai package, load its features
  useEffect(() => {
    if (selectedPalaiPackage) {
      const packageFeatures = (selectedPalaiPackage.features || []).map(
        (f) => ({
          name: f,
          price: 0,
        }),
      );
      setPalaiFeatures(packageFeatures);
      setNewFeatureName("");
      setNewFeaturePrice("");
    } else {
      setPalaiFeatures([]);
    }
  }, [selectedPalaiPackage]);

  // ✅ Add Custom Feature (Name + Price)
  const handleAddCustomFeature = () => {
    if (newFeatureName.trim() !== "") {
      const price = parseFloat(newFeaturePrice) || 0;
      setPalaiFeatures((prev) => [
        ...prev,
        { name: newFeatureName.trim(), price: price },
      ]);
      setNewFeatureName("");
      setNewFeaturePrice("");
    }
  };

  // ✅ Remove a feature
  const handleRemoveFeature = (index) => {
    setPalaiFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  // ✅ Calculate Total Palai Price
  const calculateTotalPalaiPrice = () => {
    const basePrice = selectedPalaiPackage ? selectedPalaiPackage.price : 0;
    const customFeaturesTotal = palaiFeatures.reduce(
      (sum, f) => sum + (f.price || 0),
      0,
    );
    return basePrice + customFeaturesTotal;
  };

  // ✅ Toggle vaccine selection - MULTIPLE SELECT
  const handleToggleVaccine = (vaccineId) => {
    setSelectedVaccineIds((prev) => {
      if (prev.includes(vaccineId)) {
        return prev.filter((id) => id !== vaccineId);
      } else {
        return [...prev, vaccineId];
      }
    });
  };

  // ✅ Validate form
  const validateForm = async () => {
    const newErrors = {};

    if (!formData.tagId.trim()) {
      newErrors.tagId = "Tag ID is required";
    } else {
      const isUnique = await checkTagIdUnique(formData.tagId);
      if (!isUnique) {
        newErrors.tagId = "Tag ID already exists in this farm";
        setTagIdError("Tag ID already exists");
      }
    }

    if (!formData.breed.trim()) {
      newErrors.breed = "Breed is required";
    }

    if (!formData.dob) {
      newErrors.dob = "Date of birth is required";
    } else {
      const selectedDate = new Date(formData.dob + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate > today) {
        newErrors.dob = "Date of birth cannot be in the future";
      }
    }

    if (!formData.weight || formData.weight <= 0) {
      newErrors.weight = "Valid weight is required";
    }

    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }

    if (!formData.status) {
      newErrors.status = "Status is required";
    }

    if (formData.gender === "M") {
      const femaleOnlyStatuses = ["Pregnant", "Lactating", "Dry"];
      if (femaleOnlyStatuses.includes(formData.status)) {
        newErrors.status = `${formData.status} is only for female goats`;
      }
    }

    // ✅ Quarantine Days Validation
    if (formData.status === "Quarantine") {
      if (!formData.quarantineDays || formData.quarantineDays <= 0) {
        newErrors.quarantineDays = "Please enter valid quarantine days (1-30)";
      } else if (formData.quarantineDays > 30) {
        newErrors.quarantineDays = "Quarantine days cannot exceed 30";
      }
    }

    if (formData.status === "Pregnant") {
      if (!formData.expectedKiddingDate) {
        newErrors.expectedKiddingDate = "Expected kidding date is required";
      } else {
        const dueDate = new Date(formData.expectedKiddingDate + "T00:00:00");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dueDate < today) {
          newErrors.expectedKiddingDate = "Due date cannot be in the past";
        }
      }
    }

    if (formData.sourceType === GOAT_SOURCE_TYPES.HOMEBRED) {
      if (!formData.motherId && !formData.fatherId) {
        newErrors.parents =
          "At least one parent is required for home-bred goats";
      }
    } else if (formData.sourceType === GOAT_SOURCE_TYPES.PURCHASED) {
      if (!formData.purchaseContact.trim()) {
        newErrors.purchaseContact = "Contact is required for purchased goats";
      }
      if (!formData.purchaseDate) {
        newErrors.purchaseDate = "Purchase date is required";
      } else {
        const purchaseDate = new Date(formData.purchaseDate + "T00:00:00");
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (purchaseDate > today) {
          newErrors.purchaseDate = "Purchase date cannot be in the future";
        }
      }
      if (!formData.sellerName.trim()) {
        newErrors.sellerName = "Seller name is required";
      }
      if (!formData.purchasePrice || formData.purchasePrice <= 0) {
        newErrors.purchasePrice = "Valid purchase price is required";
      }
      if (!formData.purchaseType) {
        newErrors.purchaseType = "Purchase type is required";
      }
    } else if (formData.sourceType === "Palai") {
      if (!selectedPalaiPackage) {
        newErrors.palaiPackage = "Please select a Palai package";
      }
      if (palaiFeatures.length === 0) {
        newErrors.palaiFeatures = "At least one feature is required";
      }
    }

    // ✅ Vaccination validation
    if (isVaccinated && selectedVaccineIds.length === 0) {
      newErrors.vaccine = "Please select at least one vaccine";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Handle submit - WITH VACCINATION STATUS (COMPLETED/DUE) + QUARANTINE
  const handleSubmit = async () => {
    const isValid = await validateForm();
    if (!isValid) return;

    setLoading(true);
    try {
      const ageInYears = calculateAgeInYears(formData.dob);
      const stage = getStage(ageInYears, formData.gender);

      const dataToSave = {
        farmId: formData.farmId,
        tagId: formData.tagId.trim(),
        breed: formData.breed.trim(),
        dob: formData.dob,
        age: ageInYears,
        weight: parseFloat(formData.weight),
        gender: formData.gender,
        status: formData.status,
        stage: stage,
        sourceType: formData.sourceType,
        isPregnant: formData.status === "Pregnant",
        expectedKiddingDate:
          formData.status === "Pregnant" ? formData.expectedKiddingDate : null,
        motherId: formData.motherId || null,
        fatherId: formData.fatherId || null,
        purchaseContact: formData.purchaseContact || null,
        purchaseDate: formData.purchaseDate || null,
        sellerName: formData.sellerName || null,
        purchasePrice: formData.purchasePrice
          ? parseFloat(formData.purchasePrice)
          : null,
        purchaseType: formData.purchaseType || null,
        purchaseNote: formData.purchaseNote || null,
        isActive: true,
        createdAt: editData ? formData.createdAt : new Date(),
        updatedAt: new Date(),
        palaiPackageName: selectedPalaiPackage
          ? selectedPalaiPackage.name
          : null,
        palaiPackagePrice: selectedPalaiPackage
          ? selectedPalaiPackage.price
          : null,
        palaiFeatures: palaiFeatures,
        palaiTotalPrice: calculateTotalPalaiPrice(),
        // ✅ Quarantine Fields
        quarantineDays:
          formData.status === "Quarantine" ? formData.quarantineDays : null,
        quarantineStartDate:
          formData.status === "Quarantine"
            ? new Date().toISOString().split("T")[0]
            : null,
        quarantineCompletedDate: null,
      };

      let newGoatId;

      if (editData) {
        await goatService.update(editData.id, dataToSave);
        setToastMessage("Goat updated successfully!");
        newGoatId = editData.id;
      } else {
        newGoatId = await goatService.add(dataToSave);
        setToastMessage("Goat added successfully!");
      }

      // ✅ If vaccinated, create vaccination records for selected vaccines
      if (isVaccinated && selectedVaccineIds.length > 0 && newGoatId) {
        try {
          console.log("✅ Creating vaccination records for goat:", newGoatId);
          console.log("✅ Selected vaccines:", selectedVaccineIds);

          const todayDate = new Date().toISOString().split("T")[0];
          let successCount = 0;

          for (const vaccine of vaccinesList) {
            const isSelected = selectedVaccineIds.includes(vaccine.id);
            const scheduleDays = vaccine?.scheduleDays || 0;

            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + parseInt(scheduleDays));
            const nextDateStr = nextDate.toISOString().split("T")[0];

            const status = isSelected ? "Completed" : "Due";

            const vaccineData = {
              farmId: farmId,
              goatId: newGoatId,
              goatTagId: formData.tagId.trim(),
              vaccineId: vaccine.id,
              vaccineName: vaccine?.name || "",
              date: isSelected ? todayDate : null,
              next: nextDateStr,
              doseNumber: isSelected ? "1" : "0",
              price: vaccine?.price || 0,
              status: status,
              notes: isSelected
                ? "Initial vaccination upon addition"
                : "Pending vaccination - due on " + nextDateStr,
              dueDateEntries: [
                {
                  id: generateId(),
                  days: scheduleDays.toString(),
                  nextDate: nextDateStr,
                },
              ],
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            try {
              await addDocument(COLLECTIONS.GOAT_VACCINES, vaccineData);
              successCount++;
              console.log(
                `✅ Vaccine "${vaccine.name}" saved with status: ${status}`,
              );
            } catch (err) {
              console.error(
                `❌ Failed to save vaccine "${vaccine.name}":`,
                err,
              );
            }
          }

          if (formData.status === "Quarantine") {
            setToastMessage(
              `Goat added! ${successCount} vaccination records created. ${formData.quarantineDays} days quarantine started.`,
            );
          } else {
            setToastMessage(
              `Goat added! ${successCount} vaccination records created.`,
            );
          }
        } catch (vaccineError) {
          console.error("❌ Error saving vaccine records:", vaccineError);
          setToastMessage(
            "Goat added but some vaccine records failed: " +
              vaccineError.message,
          );
        }
      } else {
        if (formData.status === "Quarantine") {
          setToastMessage(
            `Goat added! ${formData.quarantineDays} days quarantine started.`,
          );
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("❌ Error saving goat:", error);
      setToastMessage("Failed to save goat: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const todayDate = new Date().toISOString().split("T")[0];
  const ageInYears = calculateAgeInYears(formData.dob);
  const currentStage = getStage(ageInYears, formData.gender);

  const getMonthsInfo = () => {
    if (!formData.dob) return "";
    const birthDate = new Date(formData.dob + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (birthDate > today) return "";

    const diffTime = today - birthDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    const months = Math.floor(diffDays / 30.44);
    const days = Math.round(diffDays % 30.44);

    if (months === 0) return `${days} days old`;
    if (days === 0) return `${months} months old`;
    return `${months} months, ${days} days old`;
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={editData ? "Edit Goat" : "Add New Goat"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="form-grid">
            {/* Tag ID */}
            <Input
              label="Tag ID"
              type="text"
              name="tagId"
              value={formData.tagId}
              onChange={handleInputChange}
              placeholder="e.g., GT-001"
              error={errors.tagId || tagIdError}
            />

            {/* Breed */}
            <Input
              label="Breed"
              type="text"
              name="breed"
              value={formData.breed}
              onChange={handleInputChange}
              placeholder="e.g., Beetal, Saanen"
              error={errors.breed}
            />

            {/* DOB */}
            <div className="field half">
              <label>Date of Birth *</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                className={`field-input ${errors.dob ? "input-error" : ""}`}
                max={todayDate}
              />
              {errors.dob && <div className="error-text">{errors.dob}</div>}
              <small style={{ color: "#999", fontSize: "0.55rem" }}>
                Date cannot be in the future
              </small>
            </div>

            {/* Age Display */}
            <div className="field half">
              <label>Age (Auto Calculated)</label>
              <input
                type="text"
                value={ageDisplay}
                readOnly
                className="field-input"
                style={{
                  backgroundColor: "#f5f5f5",
                  color: "#16302e",
                  fontWeight: "600",
                }}
              />
              <small style={{ color: "#766d5d", fontSize: "0.6rem" }}>
                {formData.dob ? getMonthsInfo() : "Select DOB to calculate age"}
              </small>
            </div>

            {/* Weight */}
            <Input
              label="Weight (kg)"
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleInputChange}
              placeholder="e.g., 25.5"
              step="0.1"
              error={errors.weight}
            />

            {/* Gender */}
            <div className="field">
              <label>Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="field-input"
              >
                <option value="">Select Gender</option>
                <option value="F">Female</option>
                <option value="M">Male</option>
              </select>
              {errors.gender && (
                <div className="error-text">{errors.gender}</div>
              )}
            </div>

            {/* Status */}
            <div className="field">
              <label>Current Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="field-input"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {errors.status && (
                <div className="error-text">{errors.status}</div>
              )}
              {formData.gender === "M" && (
                <small style={{ color: "#766d5d", fontSize: "0.55rem" }}>
                  Males can only be: Healthy, Sold, Dead, or Quarantine
                </small>
              )}
              {formData.gender === "F" && (
                <small style={{ color: "#766d5d", fontSize: "0.55rem" }}>
                  Females can be: Healthy, Pregnant, Lactating, Dry, Sold, Dead,
                  or Quarantine
                </small>
              )}
            </div>

            {/* ✅ QUARANTINE DAYS FIELD */}
            {formData.status === "Quarantine" && (
              <div className="field half">
                <label>Quarantine Days *</label>
                <input
                  type="number"
                  name="quarantineDays"
                  value={formData.quarantineDays || ""}
                  onChange={handleInputChange}
                  placeholder="e.g., 14"
                  className={`field-input ${
                    errors.quarantineDays ? "input-error" : ""
                  }`}
                  min="1"
                  max="30"
                />
                {errors.quarantineDays && (
                  <div className="error-text">{errors.quarantineDays}</div>
                )}
                <small style={{ color: "#766d5d", fontSize: "0.55rem" }}>
                  Enter number of days for quarantine (1-30 days)
                </small>
              </div>
            )}

            {/* Due Date */}
            {formData.status === "Pregnant" && (
              <div className="field half">
                <label>Expected Kidding Date *</label>
                <input
                  type="date"
                  name="expectedKiddingDate"
                  value={formData.expectedKiddingDate || ""}
                  onChange={handleInputChange}
                  className={`field-input ${
                    errors.expectedKiddingDate ? "input-error" : ""
                  }`}
                  min={todayDate}
                />
                {errors.expectedKiddingDate && (
                  <div className="error-text">{errors.expectedKiddingDate}</div>
                )}
                <small style={{ color: "#766d5d", fontSize: "0.55rem" }}>
                  Expected kidding date (approximately 150 days from mating)
                </small>
              </div>
            )}

            {/* Stage - Auto */}
            <div className="field">
              <label>Stage (Auto)</label>
              <input
                type="text"
                value={currentStage}
                readOnly
                className="field-input"
                style={{ backgroundColor: "#f5f5f5", color: "#666" }}
              />
              <small style={{ color: "#999", fontSize: "0.55rem" }}>
                {ageInYears < 1 && ageInYears > 0
                  ? `Kid (${Math.round(ageInYears * 12)} months old)`
                  : ageInYears >= 1
                  ? formData.gender === "F"
                    ? "Doe (adult female)"
                    : "Buck (adult male)"
                  : "Enter DOB to calculate stage"}
              </small>
            </div>

            {/* Source Type */}
            <div className="field full-width">
              <label>Source Type *</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="sourceType"
                    value={GOAT_SOURCE_TYPES.HOMEBRED}
                    checked={formData.sourceType === GOAT_SOURCE_TYPES.HOMEBRED}
                    onChange={handleInputChange}
                  />
                  HomeBred
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="sourceType"
                    value={GOAT_SOURCE_TYPES.PURCHASED}
                    checked={
                      formData.sourceType === GOAT_SOURCE_TYPES.PURCHASED
                    }
                    onChange={handleInputChange}
                  />
                  Purchased
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="sourceType"
                    value="Palai"
                    checked={formData.sourceType === "Palai"}
                    onChange={handleInputChange}
                  />
                  Palai
                </label>
              </div>
            </div>

            {/* HomeBred Fields */}
            {formData.sourceType === GOAT_SOURCE_TYPES.HOMEBRED && (
              <>
                <div className="field half">
                  <label>Mother (Female - optional)</label>
                  <select
                    name="motherId"
                    value={formData.motherId}
                    onChange={handleInputChange}
                    className="field-input"
                    disabled={loadingParents}
                  >
                    <option value="">Select Mother</option>
                    {parentOptions.mothers.map((mother) => (
                      <option key={mother.id} value={mother.id}>
                        {mother.tagId} - {mother.breed}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field half">
                  <label>Father (Male - optional)</label>
                  <select
                    name="fatherId"
                    value={formData.fatherId}
                    onChange={handleInputChange}
                    className="field-input"
                    disabled={loadingParents}
                  >
                    <option value="">Select Father</option>
                    {parentOptions.fathers.map((father) => (
                      <option key={father.id} value={father.id}>
                        {father.tagId} - {father.breed}
                      </option>
                    ))}
                  </select>
                </div>

                {errors.parents && (
                  <div className="error-text full-width">{errors.parents}</div>
                )}
              </>
            )}

            {/* Purchased Fields */}
            {formData.sourceType === GOAT_SOURCE_TYPES.PURCHASED && (
              <>
                <Input
                  label="Contact"
                  type="text"
                  name="purchaseContact"
                  value={formData.purchaseContact}
                  onChange={handleInputChange}
                  placeholder="e.g., 03XX-XXXXXXX"
                  error={errors.purchaseContact}
                />

                <div className="field half">
                  <label>Purchase Date *</label>
                  <input
                    type="date"
                    name="purchaseDate"
                    value={formData.purchaseDate}
                    onChange={handleInputChange}
                    className={`field-input ${
                      errors.purchaseDate ? "input-error" : ""
                    }`}
                    max={todayDate}
                  />
                  {errors.purchaseDate && (
                    <div className="error-text">{errors.purchaseDate}</div>
                  )}
                  <small style={{ color: "#999", fontSize: "0.55rem" }}>
                    Date cannot be in the future
                  </small>
                </div>

                <Input
                  label="Seller Name"
                  type="text"
                  name="sellerName"
                  value={formData.sellerName}
                  onChange={handleInputChange}
                  placeholder="e.g., Ahmed Farms"
                  error={errors.sellerName}
                />

                <Input
                  label="Purchase Price (PKR)"
                  type="number"
                  name="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleInputChange}
                  placeholder="e.g., 25000"
                  step="100"
                  error={errors.purchasePrice}
                />

                <div className="field">
                  <label>Purchase Type *</label>
                  <select
                    name="purchaseType"
                    value={formData.purchaseType}
                    onChange={handleInputChange}
                    className="field-input"
                  >
                    {Object.values(PURCHASE_TYPES).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {errors.purchaseType && (
                    <div className="error-text">{errors.purchaseType}</div>
                  )}
                </div>

                <Input
                  label="Note"
                  type="text"
                  name="purchaseNote"
                  value={formData.purchaseNote}
                  onChange={handleInputChange}
                  placeholder="Any additional notes..."
                />
              </>
            )}

            {/* Palai Fields */}
            {formData.sourceType === "Palai" && (
              <>
                <div className="field full-width">
                  <label>Select Palai Package *</label>
                  <select
                    value={selectedPalaiPackage ? selectedPalaiPackage.id : ""}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const pkg = palaiPackages.find(
                        (p) => p.id === selectedId,
                      );
                      setSelectedPalaiPackage(pkg || null);
                    }}
                    className="field-input"
                    disabled={loadingPalai}
                  >
                    <option value="">Select a package...</option>
                    {palaiPackages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} - Rs {pkg.price}
                      </option>
                    ))}
                  </select>
                  {errors.palaiPackage && (
                    <div className="error-text">{errors.palaiPackage}</div>
                  )}
                  {loadingPalai && (
                    <small style={{ color: "#999", fontSize: "0.55rem" }}>
                      Loading packages...
                    </small>
                  )}
                </div>

                {selectedPalaiPackage && (
                  <div className="field full-width">
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
                        Package Features (Customizable)
                      </label>
                    </div>

                    <div
                      style={{
                        border: "1px solid var(--line)",
                        borderRadius: "8px",
                        padding: "12px",
                        backgroundColor: "#f9f9f9",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        marginBottom: "10px",
                      }}
                    >
                      {palaiFeatures.length > 0 ? (
                        palaiFeatures.map((feature, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: "0.8rem",
                              color: "#222",
                              textTransform: "capitalize",
                              padding: "2px 0",
                              borderBottom: "1px dashed #e0e0e0",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <span style={{ fontSize: "0.6rem" }}>•</span>
                              <span>{feature.name}</span>
                              {feature.price > 0 && (
                                <span
                                  style={{
                                    fontSize: "0.7rem",
                                    color: "var(--gold)",
                                    fontWeight: "600",
                                    marginLeft: "4px",
                                  }}
                                >
                                  (+ Rs {feature.price})
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFeature(idx)}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "#b0473e",
                                cursor: "pointer",
                                fontSize: "0.7rem",
                                fontWeight: "bold",
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      ) : (
                        <span
                          style={{
                            color: "#999",
                            fontStyle: "italic",
                            fontSize: "0.7rem",
                          }}
                        >
                          No features added yet.
                        </span>
                      )}
                      {errors.palaiFeatures && (
                        <div className="error-text">{errors.palaiFeatures}</div>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ flex: 2 }}>
                        <Input
                          label="Custom Feature"
                          type="text"
                          value={newFeatureName}
                          onChange={(e) => setNewFeatureName(e.target.value)}
                          placeholder="e.g., Free Delivery"
                          style={{ textTransform: "capitalize" }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <Input
                          label="Price (PKR)"
                          type="number"
                          value={newFeaturePrice}
                          onChange={(e) => setNewFeaturePrice(e.target.value)}
                          placeholder="e.g., 500"
                          step="100"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="primary"
                        size="small"
                        onClick={handleAddCustomFeature}
                        style={{ marginTop: "20px" }}
                      >
                        + Add
                      </Button>
                    </div>
                    <small
                      style={{
                        color: "#766d5d",
                        fontSize: "0.55rem",
                        display: "block",
                        marginTop: "4px",
                      }}
                    >
                      Add custom features with their prices.
                    </small>

                    <div
                      style={{
                        marginTop: "16px",
                        padding: "10px",
                        backgroundColor: "#e8f5e9",
                        borderRadius: "8px",
                        border: "1px solid #c8e6c9",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: "0.9rem",
                          color: "#2e7d32",
                        }}
                      >
                        Total Palai Price:
                      </span>
                      <span
                        style={{
                          fontWeight: "bold",
                          fontSize: "1.1rem",
                          color: "var(--gold)",
                        }}
                      >
                        Rs {calculateTotalPalaiPrice()}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ✅ VACCINATION SECTION */}
            <div
              className="field full-width"
              style={{
                marginTop: "8px",
                borderTop: "1px solid var(--line)",
                paddingTop: "12px",
              }}
            >
              <label
                style={{
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  color: "var(--pasture-light)",
                  marginBottom: "4px",
                  display: "block",
                }}
              >
                Is Vaccinated?
              </label>
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <label
                  className="radio-label"
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <input
                    type="checkbox"
                    checked={isVaccinated}
                    onChange={(e) => {
                      setIsVaccinated(e.target.checked);
                      if (!e.target.checked) {
                        setSelectedVaccineIds([]);
                      }
                    }}
                  />
                  Yes, Vaccinate
                </label>
              </div>
              <small style={{ color: "#766d5d", fontSize: "0.55rem" }}>
                Check this to select vaccines. Selected = Completed, Unselected
                = Due
              </small>
            </div>

            {/* ✅ Vaccine Options */}
            {isVaccinated && (
              <div className="field full-width">
                <label>
                  Select Vaccines *
                  <span
                    style={{
                      fontSize: "0.55rem",
                      color: "#766d5d",
                      marginLeft: "8px",
                    }}
                  >
                    (Checked = Completed, Unchecked = Due)
                  </span>
                </label>
                {loadingVaccines ? (
                  <div style={{ padding: "8px", color: "#766d5d" }}>
                    Loading vaccines...
                  </div>
                ) : vaccinesList.length === 0 ? (
                  <div
                    style={{
                      padding: "8px",
                      color: "#b0473e",
                      fontSize: "0.8rem",
                    }}
                  >
                    ⚠️ No vaccines found. Please add vaccines in Vaccine
                    Management first.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: "6px",
                      border: "1px solid var(--line)",
                      borderRadius: "8px",
                      padding: "12px",
                      backgroundColor: "#f9f9f9",
                    }}
                  >
                    {vaccinesList.map((vaccine) => {
                      const isSelected = selectedVaccineIds.includes(
                        vaccine.id,
                      );
                      return (
                        <label
                          key={vaccine.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            backgroundColor: isSelected
                              ? "rgba(76, 175, 80, 0.1)"
                              : "transparent",
                            border: isSelected
                              ? "1px solid #4caf50"
                              : "1px solid transparent",
                            fontSize: "0.8rem",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleVaccine(vaccine.id)}
                          />
                          <span>
                            {vaccine.name}
                            <span
                              style={{
                                fontSize: "0.55rem",
                                color: "#766d5d",
                                marginLeft: "4px",
                              }}
                            >
                              (Days: {vaccine.scheduleDays || 0})
                            </span>
                          </span>
                          {isSelected ? (
                            <span
                              style={{
                                fontSize: "0.55rem",
                                color: "#4caf50",
                                fontWeight: "bold",
                              }}
                            >
                              ✅ Completed
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: "0.55rem",
                                color: "#ff9800",
                                fontWeight: "bold",
                              }}
                            >
                              ⏳ Due
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
                {errors.vaccine && (
                  <div className="error-text">{errors.vaccine}</div>
                )}
                {selectedVaccineIds.length > 0 && (
                  <small style={{ color: "#4caf50", fontSize: "0.55rem" }}>
                    ✅ {selectedVaccineIds.length} vaccine(s) selected as
                    Completed.
                    {vaccinesList.length - selectedVaccineIds.length} vaccine(s)
                    will be marked as Due.
                  </small>
                )}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : editData ? "Update" : "Add Goat"}
            </Button>
          </div>
        </form>
      </Modal>

      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </>
  );
};

export default AddGoatModal;
