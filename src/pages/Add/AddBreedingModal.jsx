// src/pages/Add/AddBreedingModal.jsx - FINAL FIXED WITH PROPER ALIGNMENT

import React, { useState, useEffect, useCallback } from "react";
import Modal from "../../components/Common/Modal";
import Button from "../../components/Common/Button";
import { useAuth } from "../../context/AuthContext";
import { breedingService } from "../../services/breedingService";
import Toast from "../../components/Common/Toast";
import { formatDate } from "../../utils/helpers";

const AddBreedingModal = ({ isOpen, onClose, onSuccess, editData, goats }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toastMessage, setToastMessage] = useState("");

  const today = new Date().toISOString().split("T")[0];

  // Helper: Get goat age from DOB
  const getGoatAge = (goat) => {
    if (!goat || !goat.dob) return "Age: —";
    const birthDate = new Date(goat.dob + "T00:00:00");
    const todayDate = new Date();
    let age = todayDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = todayDate.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && todayDate.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    if (age > 0) {
      return `Age: ${age} yr${age > 1 ? "s" : ""}`;
    }
    const days = Math.floor((todayDate - birthDate) / (1000 * 60 * 60 * 24));
    return `Age: ${days} days`;
  };

  const [formData, setFormData] = useState({
    farmId: currentUser?.farmId || "",
    buckId: "",
    buckTagId: "",
    buckName: "",
    doeId: "",
    doeTagId: "",
    doeName: "",
    matingDate: "",
    inseminationDate: "",
    returnCycleDays: 21,
    breedingType: "Natural",
    matingSubType: "Hand Mating",
    aiSubType: "Cervical",
    notes: "",
    aiTechnician: "",
    aiTechnicianContact: "",
    semenSource: "Farm",
    semenQuality: "Good",
    followUpDate: "",
    followUpResult: "Pending",
    earlyUltrasoundDate: "",
    earlyUltrasoundResult: "Pending",
    expectedKiddingDate: "",
    result: "Pending",
    aiProtocolComplete: false,
    aiProtocolDate: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Mating Sub-types options
  const naturalSubTypes = ["Hand Mating", "Pen Mating", "Pasture Mating"];
  const aiSubTypes = ["Cervical", "Laparoscopic", "Transcervical"];

  // Filter goats
  const maleGoats = goats.filter(
    (g) => g.gender === "M" && g.isActive !== false && g.stage !== "Kid",
  );
  const femaleGoats = goats.filter(
    (g) =>
      g.gender === "F" &&
      g.isActive !== false &&
      g.stage !== "Kid" && //  Adult does only
      g.status !== "Pregnant", //  Already pregnant nahi honi chahiye
  );

  // resetForm wrapped in useCallback
  const resetForm = useCallback(() => {
    setFormData({
      farmId: currentUser?.farmId || "",
      buckId: "",
      buckTagId: "",
      buckName: "",
      doeId: "",
      doeTagId: "",
      doeName: "",
      matingDate: "",
      inseminationDate: "",
      returnCycleDays: 21,
      breedingType: "Natural",
      matingSubType: "Hand Mating",
      aiSubType: "Cervical",
      notes: "",
      aiTechnician: "",
      aiTechnicianContact: "",
      semenSource: "Farm",
      semenQuality: "Good",
      followUpDate: "",
      followUpResult: "Pending",
      earlyUltrasoundDate: "",
      earlyUltrasoundResult: "Pending",
      expectedKiddingDate: "",
      result: "Pending",
      aiProtocolComplete: false,
      aiProtocolDate: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    setErrors({});
  }, [currentUser?.farmId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  // Load edit data or reset
  useEffect(() => {
    if (editData) {
      setFormData({
        farmId: editData.farmId || currentUser?.farmId || "",
        buckId: editData.buckId || "",
        buckTagId: editData.buckTagId || "",
        buckName: editData.buckName || "",
        doeId: editData.doeId || "",
        doeTagId: editData.doeTagId || "",
        doeName: editData.doeName || "",
        matingDate: editData.matingDate || "",
        inseminationDate: editData.inseminationDate || "",
        returnCycleDays: editData.returnCycleDays || 21,
        breedingType: editData.breedingType || "Natural",
        matingSubType: editData.matingSubType || "Hand Mating",
        aiSubType: editData.aiSubType || "Cervical",
        notes: editData.notes || "",
        aiTechnician: editData.aiTechnician || "",
        aiTechnicianContact: editData.aiTechnicianContact || "",
        semenSource: editData.semenSource || "Farm",
        semenQuality: editData.semenQuality || "Good",
        followUpDate: editData.followUpDate || "",
        followUpResult: editData.followUpResult || "Pending",
        earlyUltrasoundDate: editData.earlyUltrasoundDate || "",
        earlyUltrasoundResult: editData.earlyUltrasoundResult || "Pending",
        expectedKiddingDate: editData.expectedKiddingDate || "",
        result: editData.result || "Pending",
        aiProtocolComplete: editData.aiProtocolComplete || false,
        aiProtocolDate: editData.aiProtocolDate || "",
        createdAt: editData.createdAt || new Date(),
        updatedAt: new Date(),
      });
    } else {
      resetForm();
    }
  }, [editData, currentUser, resetForm]);

  // Calculate dates based on insemination date (for AI) or mating date (for Natural)
  const calculateDates = (date) => {
    if (!date) return {};

    const baseDate = new Date(date + "T00:00:00");
    const result = {};

    const followDate = new Date(baseDate);
    followDate.setDate(followDate.getDate() + 18);
    result.followUpDate = followDate.toISOString().split("T")[0];

    const earlyUSDate = new Date(baseDate);
    earlyUSDate.setDate(earlyUSDate.getDate() + 28);
    result.earlyUltrasoundDate = earlyUSDate.toISOString().split("T")[0];

    const kiddingDate = new Date(baseDate);
    kiddingDate.setDate(kiddingDate.getDate() + 150);
    result.expectedKiddingDate = kiddingDate.toISOString().split("T")[0];

    return result;
  };

  // Get min/max dates for validation
  const getMinFollowUpDate = () => {
    const dateToUse = isAI ? formData.inseminationDate : formData.matingDate;
    if (!dateToUse) return "";
    const date = new Date(dateToUse + "T00:00:00");
    date.setDate(date.getDate() + 18);
    return date.toISOString().split("T")[0];
  };

  const getMaxFollowUpDate = () => {
    const dateToUse = isAI ? formData.inseminationDate : formData.matingDate;
    if (!dateToUse) return "";
    const date = new Date(dateToUse + "T00:00:00");
    date.setDate(date.getDate() + 21);
    return date.toISOString().split("T")[0];
  };

  const getMinEarlyUltrasoundDate = () => {
    if (!formData.followUpDate) return "";
    const date = new Date(formData.followUpDate + "T00:00:00");
    date.setDate(date.getDate() + 1);
    return date.toISOString().split("T")[0];
  };

  const getMaxEarlyUltrasoundDate = () => {
    const dateToUse = isAI ? formData.inseminationDate : formData.matingDate;
    if (!dateToUse) return "";
    const date = new Date(dateToUse + "T00:00:00");
    date.setDate(date.getDate() + 35);
    return date.toISOString().split("T")[0];
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === "checkbox" ? checked : value;

    setFormData((prev) => {
      const updated = { ...prev, [name]: finalValue };

      if (name === "buckId") {
        const selected = goats.find((g) => g.id === value);
        if (selected) {
          updated.buckTagId = selected.tagId;
          updated.buckName = selected.name || selected.tagId;
        }
      }

      if (name === "doeId") {
        const selected = goats.find((g) => g.id === value);
        if (selected) {
          updated.doeTagId = selected.tagId;
          updated.doeName = selected.name || selected.tagId;
        }
      }

      // For Natural breeding - calculate from mating date
      if (name === "matingDate" && value && !isAI) {
        const dates = calculateDates(value);
        updated.followUpDate = dates.followUpDate || "";
        updated.earlyUltrasoundDate = dates.earlyUltrasoundDate || "";
        updated.expectedKiddingDate = dates.expectedKiddingDate || "";
        updated.followUpResult = "Pending";
        updated.earlyUltrasoundResult = "Pending";
        updated.result = "Pending";
        updated.aiProtocolComplete = false;
      }

      // For AI - calculate from insemination date
      if (name === "inseminationDate" && value && isAI) {
        const dates = calculateDates(value);
        updated.followUpDate = dates.followUpDate || "";
        updated.earlyUltrasoundDate = dates.earlyUltrasoundDate || "";
        updated.expectedKiddingDate = dates.expectedKiddingDate || "";
        updated.followUpResult = "Pending";
        updated.earlyUltrasoundResult = "Pending";
        updated.result = "Pending";
        updated.aiProtocolComplete = false;
      }

      if (name === "breedingType" && value === "Natural") {
        updated.aiTechnician = "";
        updated.aiTechnicianContact = "";
        updated.semenSource = "Farm";
        updated.semenQuality = "Good";
        updated.inseminationDate = "";
        updated.aiSubType = "Cervical";
        updated.matingSubType = "Hand Mating";
      }

      if (name === "breedingType" && value === "AI") {
        updated.matingSubType = "Hand Mating";
        updated.matingDate = "";
        if (!updated.inseminationDate) {
          updated.inseminationDate = "";
        }
      }

      return updated;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (formData.breedingType === "Natural") {
      if (!formData.buckId) {
        newErrors.buckId = "Please select a buck";
      }
      if (!formData.matingDate) {
        newErrors.matingDate = "Mating date is required";
      }
      if (formData.matingDate && formData.matingDate > today) {
        newErrors.matingDate = "Mating date cannot be in the future";
      }
      if (formData.buckId === formData.doeId) {
        newErrors.buckId = "Buck and Doe cannot be the same";
      }
    } else {
      // AI validation
      if (!formData.buckTagId) {
        newErrors.buckTagId = "Please enter buck tag ID or semen source ID";
      }
      if (!formData.inseminationDate) {
        newErrors.inseminationDate = "Insemination date is required for AI";
      }
      if (formData.inseminationDate && formData.inseminationDate > today) {
        newErrors.inseminationDate =
          "Insemination date cannot be in the future";
      }
      if (!formData.aiTechnician) {
        newErrors.aiTechnician = "Technician name is required for AI";
      }
    }

    if (!formData.doeId) {
      newErrors.doeId = "Please select a doe";
    }

    if (formData.followUpDate) {
      const dateToUse = isAI ? formData.inseminationDate : formData.matingDate;
      if (dateToUse) {
        const baseDate = new Date(dateToUse + "T00:00:00");
        const followDate = new Date(formData.followUpDate + "T00:00:00");
        const daysDiff = Math.ceil(
          (followDate - baseDate) / (1000 * 60 * 60 * 24),
        );

        if (followDate <= baseDate) {
          newErrors.followUpDate = "Follow-up must be after breeding date";
        } else if (daysDiff < 18) {
          newErrors.followUpDate = `Min 18 days after breeding (${daysDiff} days)`;
        } else if (daysDiff > 21) {
          newErrors.followUpDate = `Should be 18-21 days (${daysDiff} days)`;
        }
      }
    }

    if (formData.earlyUltrasoundDate) {
      const dateToUse = isAI ? formData.inseminationDate : formData.matingDate;
      if (dateToUse && formData.followUpDate) {
        const baseDate = new Date(dateToUse + "T00:00:00");
        const usDate = new Date(formData.earlyUltrasoundDate + "T00:00:00");
        const daysDiff = Math.ceil((usDate - baseDate) / (1000 * 60 * 60 * 24));

        if (usDate <= new Date(formData.followUpDate + "T00:00:00")) {
          newErrors.earlyUltrasoundDate = "US must be after follow-up";
        } else if (daysDiff < 28) {
          newErrors.earlyUltrasoundDate = `Min 28 days after breeding (${daysDiff} days)`;
        } else if (daysDiff > 35) {
          newErrors.earlyUltrasoundDate = `Should be 28-35 days (${daysDiff} days)`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      let expectedKiddingDate = formData.expectedKiddingDate;
      const dateToUse = isAI ? formData.inseminationDate : formData.matingDate;

      if (!expectedKiddingDate && dateToUse) {
        const dates = calculateDates(dateToUse);
        expectedKiddingDate = dates.expectedKiddingDate;
      }

      const dataToSave = {
        ...formData,
        expectedKiddingDate: expectedKiddingDate,
        result: "Pending",
        updatedAt: new Date(),
        matingDate: isAI ? null : formData.matingDate,
        inseminationDate: isAI ? formData.inseminationDate : null,
      };

      console.log("Saving breeding record:", dataToSave);

      if (editData) {
        await breedingService.update(editData.id, dataToSave);
        setToastMessage("Breeding record updated successfully!");
      } else {
        const docId = await breedingService.add(dataToSave);
        console.log("Breeding record saved with ID:", docId);
        setToastMessage("Breeding record added successfully!");
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving breeding record:", error);
      setToastMessage("Failed to save breeding record: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isAI = formData.breedingType === "AI";

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={editData ? "Edit Breeding Record" : "Add Breeding Record"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div
            className="form-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px 16px",
              padding: "4px 0",
            }}
          >
            {/* Breeding Type - Full Width */}
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "var(--clay-deep)",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Breeding Type *
              </label>
              <select
                name="breedingType"
                value={formData.breedingType}
                onChange={handleChange}
                className="field-input"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "0.8rem",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  background: "#fff",
                }}
              >
                <option value="Natural">Natural</option>
                <option value="AI">AI</option>
              </select>
            </div>

            {/* For Natural Breeding */}
            {!isAI && (
              <>
                {/* Buck | Doe */}
                <div className="field">
                  <label
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      color: "var(--clay-deep)",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Buck *
                  </label>
                  <select
                    name="buckId"
                    value={formData.buckId}
                    onChange={handleChange}
                    className="field-input"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      fontSize: "0.8rem",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                      background: "#fff",
                    }}
                  >
                    <option value="">Select Buck</option>
                    {maleGoats.map((goat) => (
                      <option key={goat.id} value={goat.id}>
                        {goat.tagId} - {goat.breed} ({getGoatAge(goat)})
                      </option>
                    ))}
                  </select>
                  {errors.buckId && (
                    <div
                      className="error-text"
                      style={{
                        fontSize: "0.65rem",
                        color: "#d32f2f",
                        marginTop: "2px",
                      }}
                    >
                      {errors.buckId}
                    </div>
                  )}
                </div>

                <div className="field">
                  <label
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      color: "var(--clay-deep)",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Doe *
                  </label>
                  <select
                    name="doeId"
                    value={formData.doeId}
                    onChange={handleChange}
                    className="field-input"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      fontSize: "0.8rem",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                      background: "#fff",
                    }}
                  >
                    <option value="">Select Doe</option>
                    {femaleGoats.map((goat) => (
                      <option key={goat.id} value={goat.id}>
                        {goat.tagId} - {goat.breed} ({getGoatAge(goat)})
                      </option>
                    ))}
                  </select>
                  {errors.doeId && (
                    <div
                      className="error-text"
                      style={{
                        fontSize: "0.65rem",
                        color: "#d32f2f",
                        marginTop: "2px",
                      }}
                    >
                      {errors.doeId}
                    </div>
                  )}
                </div>

                {/* Mating Date | Mating Sub-Type */}
                <div className="field">
                  <label
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      color: "var(--clay-deep)",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Mating Date *
                  </label>
                  <input
                    type="date"
                    name="matingDate"
                    value={formData.matingDate}
                    onChange={handleChange}
                    className="field-input"
                    max={today}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      fontSize: "0.8rem",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                    }}
                  />
                  {errors.matingDate && (
                    <div
                      className="error-text"
                      style={{
                        fontSize: "0.65rem",
                        color: "#d32f2f",
                        marginTop: "2px",
                      }}
                    >
                      {errors.matingDate}
                    </div>
                  )}
                </div>

                <div className="field">
                  <label
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      color: "var(--clay-deep)",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Mating Sub-Type *
                  </label>
                  <select
                    name="matingSubType"
                    value={formData.matingSubType}
                    onChange={handleChange}
                    className="field-input"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      fontSize: "0.8rem",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                      background: "#fff",
                    }}
                  >
                    {naturalSubTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* For AI Breeding */}
            {isAI && (
              <>
                {/* Buck Tag ID | Doe */}
                <div className="field">
                  <label
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      color: "var(--clay-deep)",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Buck Tag ID (Semen Source) *
                  </label>
                  <input
                    type="text"
                    name="buckTagId"
                    value={formData.buckTagId}
                    onChange={handleChange}
                    className="field-input"
                    placeholder="Enter buck tag ID"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      fontSize: "0.8rem",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                    }}
                  />
                  {errors.buckTagId && (
                    <div
                      className="error-text"
                      style={{
                        fontSize: "0.65rem",
                        color: "#d32f2f",
                        marginTop: "2px",
                      }}
                    >
                      {errors.buckTagId}
                    </div>
                  )}
                  <small
                    style={{
                      color: "#766d5d",
                      fontSize: "0.5rem",
                      display: "block",
                      marginTop: "2px",
                    }}
                  >
                    Enter the buck's tag ID used for semen collection
                  </small>
                </div>

                <div className="field">
                  <label
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      color: "var(--clay-deep)",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Doe *
                  </label>
                  <select
                    name="doeId"
                    value={formData.doeId}
                    onChange={handleChange}
                    className="field-input"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      fontSize: "0.8rem",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                      background: "#fff",
                    }}
                  >
                    <option value="">Select Doe</option>
                    {femaleGoats.map((goat) => (
                      <option key={goat.id} value={goat.id}>
                        {goat.tagId} - {goat.breed} ({getGoatAge(goat)})
                      </option>
                    ))}
                  </select>
                  {errors.doeId && (
                    <div
                      className="error-text"
                      style={{
                        fontSize: "0.65rem",
                        color: "#d32f2f",
                        marginTop: "2px",
                      }}
                    >
                      {errors.doeId}
                    </div>
                  )}
                </div>

                {/* Insemination Date | AI Sub-Type */}
                <div className="field">
                  <label
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      color: "var(--clay-deep)",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Insemination Date *
                  </label>
                  <input
                    type="date"
                    name="inseminationDate"
                    value={formData.inseminationDate}
                    onChange={handleChange}
                    className="field-input"
                    max={today}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      fontSize: "0.8rem",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                    }}
                  />
                  {errors.inseminationDate && (
                    <div
                      className="error-text"
                      style={{
                        fontSize: "0.65rem",
                        color: "#d32f2f",
                        marginTop: "2px",
                      }}
                    >
                      {errors.inseminationDate}
                    </div>
                  )}
                </div>

                <div className="field">
                  <label
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      color: "var(--clay-deep)",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    AI Sub-Type *
                  </label>
                  <select
                    name="aiSubType"
                    value={formData.aiSubType}
                    onChange={handleChange}
                    className="field-input"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      fontSize: "0.8rem",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                      background: "#fff",
                    }}
                  >
                    {aiSubTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* AI Technician | Contact */}
                <div className="field">
                  <label
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      color: "var(--clay-deep)",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    AI Technician *
                  </label>
                  <input
                    type="text"
                    name="aiTechnician"
                    value={formData.aiTechnician}
                    onChange={handleChange}
                    className="field-input"
                    placeholder="e.g., Dr. Ahmed"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      fontSize: "0.8rem",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                    }}
                  />
                  {errors.aiTechnician && (
                    <div
                      className="error-text"
                      style={{
                        fontSize: "0.65rem",
                        color: "#d32f2f",
                        marginTop: "2px",
                      }}
                    >
                      {errors.aiTechnician}
                    </div>
                  )}
                </div>

                <div className="field">
                  <label
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      color: "var(--clay-deep)",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Technician Contact
                  </label>
                  <input
                    type="text"
                    name="aiTechnicianContact"
                    value={formData.aiTechnicianContact}
                    onChange={handleChange}
                    className="field-input"
                    placeholder="Phone or email"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      fontSize: "0.8rem",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                    }}
                  />
                </div>

                {/* Semen Source | Semen Quality */}
                <div className="field">
                  <label
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      color: "var(--clay-deep)",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Semen Source
                  </label>
                  <select
                    name="semenSource"
                    value={formData.semenSource}
                    onChange={handleChange}
                    className="field-input"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      fontSize: "0.8rem",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                      background: "#fff",
                    }}
                  >
                    <option value="Farm">Farm</option>
                    <option value="Imported">Imported</option>
                    <option value="Frozen">Frozen</option>
                    <option value="Fresh">Fresh</option>
                  </select>
                </div>

                <div className="field">
                  <label
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      color: "var(--clay-deep)",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Semen Quality
                  </label>
                  <select
                    name="semenQuality"
                    value={formData.semenQuality}
                    onChange={handleChange}
                    className="field-input"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      fontSize: "0.8rem",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                      background: "#fff",
                    }}
                  >
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </>
            )}

            {/* Protocol Timeline Section - Full Width */}
            <div
              className="field"
              style={{
                gridColumn: "1 / -1",
                borderTop: "1px solid #e0e0e0",
                paddingTop: "12px",
                marginTop: "4px",
              }}
            >
              <label
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  color: "var(--clay-deep)",
                }}
              >
                Protocol Timeline
              </label>
            </div>

            {/* Follow-up Date - Left */}
            <div className="field">
              <label
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "var(--clay-deep)",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Follow-up
              </label>
              <input
                type="date"
                name="followUpDate"
                value={formData.followUpDate}
                onChange={handleChange}
                className="field-input"
                min={getMinFollowUpDate()}
                max={getMaxFollowUpDate()}
                disabled={
                  !isAI ? !formData.matingDate : !formData.inseminationDate
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "0.8rem",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  background: (
                    !isAI ? formData.matingDate : formData.inseminationDate
                  )
                    ? "#fff"
                    : "#f5f5f5",
                }}
              />
              {errors.followUpDate && (
                <div
                  className="error-text"
                  style={{
                    fontSize: "0.65rem",
                    color: "#d32f2f",
                    marginTop: "2px",
                  }}
                >
                  {errors.followUpDate}
                </div>
              )}
              <small
                style={{
                  color: "#766d5d",
                  fontSize: "0.5rem",
                  display: "block",
                  marginTop: "2px",
                }}
              >
                18-21 days
              </small>
            </div>

            {/* Early Ultrasound - Right */}
            <div className="field">
              <label
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "var(--clay-deep)",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Early US
              </label>
              <input
                type="date"
                name="earlyUltrasoundDate"
                value={formData.earlyUltrasoundDate}
                onChange={handleChange}
                className="field-input"
                min={getMinEarlyUltrasoundDate()}
                max={getMaxEarlyUltrasoundDate()}
                disabled={!formData.followUpDate}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "0.8rem",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  background: formData.followUpDate ? "#fff" : "#f5f5f5",
                }}
              />
              {errors.earlyUltrasoundDate && (
                <div
                  className="error-text"
                  style={{
                    fontSize: "0.65rem",
                    color: "#d32f2f",
                    marginTop: "2px",
                  }}
                >
                  {errors.earlyUltrasoundDate}
                </div>
              )}
              <small
                style={{
                  color: "#766d5d",
                  fontSize: "0.5rem",
                  display: "block",
                  marginTop: "2px",
                }}
              >
                28-35 days
              </small>
            </div>

            {/* Expected Kidding - Full Width */}
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <div
                style={{
                  padding: "10px 14px",
                  background: "#f5f8f7",
                  borderRadius: "6px",
                  border: "1px solid #e0e0e0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: "var(--clay-deep)",
                  }}
                >
                  Expected Kidding
                </span>
                <span
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: "var(--clay-deep)",
                  }}
                >
                  {formData.expectedKiddingDate
                    ? formatDate(formData.expectedKiddingDate)
                    : "—"}
                </span>
                <span
                  style={{
                    fontSize: "0.5rem",
                    background: "rgba(15, 122, 117, 0.1)",
                    padding: "2px 12px",
                    borderRadius: "12px",
                    color: "var(--clay-deep)",
                  }}
                >
                  Auto
                </span>
              </div>
            </div>

            {/* Notes - Full Width */}
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "var(--clay-deep)",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="field-input"
                placeholder="Additional info..."
                rows="2"
                style={{
                  width: "100%",
                  resize: "vertical",
                  minHeight: "50px",
                  padding: "8px 12px",
                  fontSize: "0.8rem",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                }}
              />
            </div>
          </div>

          <div
            className="modal-actions"
            style={{
              marginTop: "16px",
              paddingTop: "12px",
              borderTop: "1px solid #e0e0e0",
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
            }}
          >
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={loading}
              size="small"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} size="small">
              {loading ? "Saving..." : editData ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </Modal>

      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </>
  );
};

export default AddBreedingModal;
