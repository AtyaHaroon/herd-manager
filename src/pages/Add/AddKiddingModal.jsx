// src/pages/Add/AddKiddingModal.jsx - FIXED (Father/Buck ID auto-display)

import React, { useState, useEffect, useRef } from "react";
import Modal from "../../components/Common/Modal";
import Button from "../../components/Common/Button";
import { useAuth } from "../../context/AuthContext";
import Toast from "../../components/Common/Toast";
import { generateId } from "../../utils/helpers";
import { goatService } from "../../services/goatService";
import { breedingService } from "../../services/breedingService";
import { addDocument, COLLECTIONS } from "../../firebase/firestore";

// Helper: Get stage - KIDS are always "Kid" regardless of gender


// Helper: Get health status based on weight and age
const getHealthStatus = (weight, ageInYears) => {
  if (!weight) return "Healthy";

  if (ageInYears < 1) {
    if (weight < 1.5) return "Weak";
    if (weight >= 1.5 && weight < 2) return "Healthy (Low Weight)";
    return "Healthy";
  }

  if (weight < 20) return "Weak";
  if (weight >= 20 && weight < 25) return "Healthy (Low Weight)";
  if (weight >= 25 && weight <= 45) return "Healthy";
  if (weight > 45) return "Overweight";

  return "Healthy";
};

const AddKiddingModal = ({
  isOpen,
  onClose,
  onSuccess,
  editData,
  pregnancyData,
  action,
  goats,
}) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const isMounted = useRef(true);
  const farmId = currentUser?.farmId;

  const [formData, setFormData] = useState({
    goatId: "",
    goatTagId: "",
    pregnancyId: "",
    kiddingDate: "",
    kidCount: 0,
    maleCount: 0,
    femaleCount: 0,
    aliveCount: 0,
    stillbornCount: 0,
    birthWeight: "",
    notes: "",
    status: action === "delivered" ? "Delivered" : "Not Delivered",
    motherId: "",
    fatherId: "",
    fatherTagId: "", // ✅ Added to store buck tag ID
    fatherName: "", // ✅ Added to store buck display name
    breedingType: "",
    breedingId: "",
    farmId: currentUser?.farmId || "",
  });

  const [kids, setKids] = useState([]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ✅ FIXED: Fetch breeding data with proper buck info
  useEffect(() => {
    const fetchBreedingData = async () => {
      if (!isOpen || !pregnancyData || !isMounted.current) return;

      try {
        let fatherId = "";
        let fatherTagId = "";
        let fatherName = "";
        let breedingType = "";
        let breedingId = "";

        if (pregnancyData.breedingId) {
          const data = await breedingService.getById(pregnancyData.breedingId);
          if (data && isMounted.current) {
            // ✅ Try buckId first, then buckTagId
            if (data.buckId) {
              fatherId = data.buckId;
              // Get buck info from goats list
              const buck = goats?.find((g) => g.id === data.buckId);
              if (buck) {
                fatherTagId = buck.tagId;
                fatherName = buck.tagId;
              }
            } else if (data.buckTagId) {
              // ✅ If only buckTagId exists, use it directly
              fatherTagId = data.buckTagId;
              fatherName = data.buckTagId;
              // Try to find goat with this tag ID
              const buck = goats?.find((g) => g.tagId === data.buckTagId);
              if (buck) {
                fatherId = buck.id;
                fatherName = buck.tagId;
              }
            }

            breedingType = data.breedingType || "";
            breedingId = pregnancyData.breedingId || "";
          }
        } else if (pregnancyData.goatId) {
          // If no breedingId, try to find breeding record by goat
          if (farmId) {
            const allBreedings = await breedingService.getByFarmId(farmId);
            const breeding = allBreedings.find(
              (b) =>
                b.doeId === pregnancyData.goatId &&
                (b.result === "Conceived" ||
                  b.result === "Pregnant" ||
                  b.result === "Due"),
            );
            if (breeding && isMounted.current) {
              // ✅ Same logic for breeding found by doe
              if (breeding.buckId) {
                fatherId = breeding.buckId;
                const buck = goats?.find((g) => g.id === breeding.buckId);
                if (buck) {
                  fatherTagId = buck.tagId;
                  fatherName = buck.tagId;
                }
              } else if (breeding.buckTagId) {
                fatherTagId = breeding.buckTagId;
                fatherName = breeding.buckTagId;
                const buck = goats?.find((g) => g.tagId === breeding.buckTagId);
                if (buck) {
                  fatherId = buck.id;
                }
              }
              breedingType = breeding.breedingType || "";
              breedingId = breeding.id || "";
            }
          }
        }

        if (isMounted.current) {
          setFormData((prev) => ({
            ...prev,
            motherId: pregnancyData.goatId || "",
            fatherId: fatherId,
            fatherTagId: fatherTagId,
            fatherName: fatherName,
            breedingType: breedingType,
            breedingId: breedingId,
            farmId: farmId || "",
          }));
        }
      } catch (error) {
        console.error("Error fetching breeding data:", error);
      }
    };

    fetchBreedingData();
  }, [isOpen, pregnancyData, farmId, goats]);

  // Set initial data
  useEffect(() => {
    if (isOpen && pregnancyData && isMounted.current) {
      setFormData((prev) => ({
        ...prev,
        goatId: pregnancyData.goatId || "",
        goatTagId: pregnancyData.goatTagId || "",
        pregnancyId: pregnancyData.id || "",
        kiddingDate: new Date().toISOString().split("T")[0],
        status: action === "delivered" ? "Delivered" : "Not Delivered",
        farmId: farmId || "",
      }));

      if (action === "delivered") {
        setKids([
          {
            id: generateId(),
            tagId: "",
            gender: "",
            birthWeight: "",
            status: "Healthy",
            dob: new Date().toISOString().split("T")[0],
          },
        ]);
      } else {
        setKids([]);
      }
    }
  }, [isOpen, pregnancyData, action, farmId]);

  // Reset form on close
  useEffect(() => {
    if (!isOpen && isMounted.current) {
      setFormData({
        goatId: "",
        goatTagId: "",
        pregnancyId: "",
        kiddingDate: "",
        kidCount: 0,
        maleCount: 0,
        femaleCount: 0,
        aliveCount: 0,
        stillbornCount: 0,
        birthWeight: "",
        notes: "",
        status: "",
        motherId: "",
        fatherId: "",
        fatherTagId: "",
        fatherName: "",
        breedingType: "",
        breedingId: "",
        farmId: farmId || "",
      });
      setKids([]);
    }
  }, [isOpen, farmId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleKidChange = (index, field, value) => {
    const updatedKids = [...kids];
    updatedKids[index] = { ...updatedKids[index], [field]: value };
    setKids(updatedKids);
    calculateStats(updatedKids);
  };

  // Calculate stats including health status based on weight
  const calculateStats = (kidsList) => {
    const maleCount = kidsList.filter((k) => k.gender === "Male").length;
    const femaleCount = kidsList.filter((k) => k.gender === "Female").length;

    const kidsWithStatus = kidsList.map((k) => {
      if (k.status === "Stillborn") return k;

      const birthDate = new Date(k.dob + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let ageInYears = 0;
      if (birthDate <= today) {
        const diffTime = today - birthDate;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        ageInYears = diffDays / 365.25;
      }

      const healthStatus = getHealthStatus(k.birthWeight, ageInYears);
      return { ...k, status: healthStatus };
    });

    const aliveCount = kidsWithStatus.filter(
      (k) => k.status !== "Stillborn" && k.status !== "Dead",
    ).length;
    const stillbornCount = kidsList.filter(
      (k) => k.status === "Stillborn",
    ).length;

    let totalBirthWeight = 0;
    let weightCount = 0;
    kidsList.forEach((k) => {
      if (k.birthWeight && !isNaN(parseFloat(k.birthWeight))) {
        totalBirthWeight += parseFloat(k.birthWeight);
        weightCount++;
      }
    });
    const avgBirthWeight =
      weightCount > 0 ? (totalBirthWeight / weightCount).toFixed(1) : "";

    setFormData((prev) => ({
      ...prev,
      kidCount: kidsList.length,
      maleCount: maleCount,
      femaleCount: femaleCount,
      aliveCount: aliveCount,
      stillbornCount: stillbornCount,
      birthWeight: avgBirthWeight,
    }));

    setKids(kidsWithStatus);
  };

  const addKid = () => {
    if (kids.length >= 6) {
      setToastMessage("Maximum 6 kids allowed per pregnancy");
      return;
    }
    const updatedKids = [
      ...kids,
      {
        id: generateId(),
        tagId: "",
        gender: "",
        birthWeight: "",
        status: "Healthy",
        dob: formData.kiddingDate || new Date().toISOString().split("T")[0],
      },
    ];
    setKids(updatedKids);
    calculateStats(updatedKids);
  };

  const removeKid = (index) => {
    if (kids.length <= 1) {
      setToastMessage("At least one kid is required");
      return;
    }
    const updatedKids = kids.filter((_, i) => i !== index);
    setKids(updatedKids);
    calculateStats(updatedKids);
  };

  // ✅ FIXED: Get father display - shows buck tag ID
  const getFatherDisplay = () => {
    if (formData.fatherName) return formData.fatherName;
    if (formData.fatherTagId) return formData.fatherTagId;
    if (formData.fatherId) {
      const goat = goats?.find((g) => g.id === formData.fatherId);
      return goat ? goat.tagId : "Unknown";
    }
    return "—";
  };

  // ✅ Get breeding type display
  const getBreedingTypeDisplay = () => {
    if (formData.breedingType) return formData.breedingType;
    return "—";
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!formData.goatId) {
      setToastMessage("Please select a goat");
      return;
    }

    if (!formData.kiddingDate) {
      setToastMessage("Kidding date is required");
      return;
    }

    if (formData.status === "Delivered" && kids.length === 0) {
      setToastMessage("Please add at least one kid for delivered pregnancy");
      return;
    }

    setLoading(true);
    try {
      const maleCount = kids.filter((k) => k.gender === "Male").length;
      const femaleCount = kids.filter((k) => k.gender === "Female").length;
      const aliveCount = kids.filter(
        (k) => k.status !== "Stillborn" && k.status !== "Dead",
      ).length;
      const stillbornCount = kids.filter(
        (k) => k.status === "Stillborn",
      ).length;

      let totalBirthWeight = 0;
      let weightCount = 0;
      kids.forEach((k) => {
        if (k.birthWeight && !isNaN(parseFloat(k.birthWeight))) {
          totalBirthWeight += parseFloat(k.birthWeight);
          weightCount++;
        }
      });
      const avgBirthWeight =
        weightCount > 0 ? String(totalBirthWeight / weightCount) : "";

      const kiddingRecord = {
        farmId: farmId,
        goatId: formData.goatId,
        goatTagId: formData.goatTagId,
        pregnancyId: formData.pregnancyId,
        kiddingDate: formData.kiddingDate,
        status: formData.status,
        kidCount: kids.length,
        maleCount: maleCount,
        femaleCount: femaleCount,
        aliveCount: aliveCount,
        stillbornCount: stillbornCount,
        birthWeight: avgBirthWeight,
        notes: formData.notes || "",
        kids: kids.map((k) => ({
          id: k.id,
          tagId: k.tagId || "",
          gender: k.gender || "",
          birthWeight: k.birthWeight || "",
          status: k.status || "Healthy",
          dob: k.dob || formData.kiddingDate,
        })),
        motherId: formData.motherId || "",
        fatherId: formData.fatherId || "",
        fatherTagId: formData.fatherTagId || "",
        breedingType: formData.breedingType || "",
        breedingId: formData.breedingId || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docId = await addDocument(COLLECTIONS.KIDDING, kiddingRecord);
      console.log("Kidding record saved with ID:", docId);

      if (formData.status === "Delivered" && kids.length > 0) {
        // Update mother goat status
        try {
          const motherGoat = await goatService.getById(formData.goatId);
          if (motherGoat) {
            await goatService.update(formData.goatId, {
              ...motherGoat,
              status: "Lactating",
              updatedAt: new Date(),
            });
            console.log("Mother goat status updated to Lactating");
          }
        } catch (error) {
          console.error("Error updating mother goat status:", error);
        }

        // Update breeding record
        if (formData.breedingId) {
          try {
            const breeding = await breedingService.getById(formData.breedingId);
            if (breeding) {
              await breedingService.update(formData.breedingId, {
                ...breeding,
                result: "Delivered",
                kiddingDate: formData.kiddingDate,
                updatedAt: new Date(),
              });
              console.log("Breeding record updated to Delivered");
            }
          } catch (error) {
            console.error("Error updating breeding record:", error);
          }
        }

        // Save each kid as a goat
        for (const kid of kids) {
          if (kid.tagId && kid.tagId.trim() !== "") {
            try {
              const existingGoats = await goatService.getByFarmIdAndTagId(
                farmId,
                kid.tagId.trim(),
              );

              if (existingGoats && existingGoats.length > 0) {
                console.warn(
                  `Kid with tag ${kid.tagId} already exists, skipping`,
                );
                continue;
              }

              const motherGoat = await goatService.getById(formData.goatId);

              const birthDate = new Date(formData.kiddingDate + "T00:00:00");
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              let ageInYears = 0;
              if (birthDate <= today) {
                const diffTime = today - birthDate;
                const diffDays = diffTime / (1000 * 60 * 60 * 24);
                ageInYears = diffDays / 365.25;
              }

              const stage = "Kid";
              const healthStatus =
                kid.status === "Stillborn"
                  ? "Dead"
                  : getHealthStatus(kid.birthWeight, ageInYears);

              const genderCode = kid.gender === "Male" ? "M" : "F";

              const kidData = {
                farmId: farmId,
                tagId: kid.tagId.trim(),
                breed: motherGoat?.breed || "Unknown",
                dob: formData.kiddingDate,
                age: ageInYears,
                weight: kid.birthWeight ? parseFloat(kid.birthWeight) : 0,
                gender: genderCode,
                status: healthStatus,
                stage: stage,
                sourceType: "HomeBred",
                isPregnant: false,
                motherId: formData.goatId,
                fatherId: formData.fatherId || null,
                isActive: kid.status !== "Stillborn",
                kiddingId: docId,
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              await goatService.add(kidData);
              console.log(
                `Kid ${kid.tagId} added as goat with stage: ${stage}`,
              );
            } catch (error) {
              console.error("Error adding kid as goat:", error);
            }
          }
        }
      }

      setToastMessage(
        formData.status === "Delivered"
          ? "Kidding saved! Kids added to goat inventory."
          : "Kidding record saved.",
      );

      if (onSuccess) {
        await onSuccess();
      }

      onClose();
    } catch (error) {
      console.error("Error saving kidding record:", error);
      setToastMessage("Failed to save kidding record: " + error.message);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const getGoatInfo = (id) => {
    if (!id) return "Select a goat";
    const goat = goats?.find((g) => g.id === id);
    return goat ? `${goat.tagId} - ${goat.breed}` : "Unknown";
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          action === "delivered" ? "Record Kidding" : "Record Failed Kidding"
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="form-grid">
            {/* Mother Goat */}
            <div className="field full-width">
              <label>Goat (Mother)</label>
              <input
                type="text"
                value={getGoatInfo(formData.goatId)}
                readOnly
                className="field-input"
                style={{ backgroundColor: "#f5f5f5", fontWeight: 600 }}
              />
            </div>

            {/* ✅ Father Info - NOW SHOWING BUCK TAG ID */}
            <div className="field half">
              <label>Father (Buck)</label>
              <input
                type="text"
                value={getFatherDisplay()}
                readOnly
                className="field-input"
                style={{
                  backgroundColor: "#f5f5f5",
                  fontWeight: 600,
                  color: "var(--clay-deep)",
                }}
              />
              {formData.fatherTagId && (
                <small style={{ color: "#766d5d", fontSize: "0.5rem" }}>
                  Buck Tag: {formData.fatherTagId}
                </small>
              )}
            </div>

            {/* Breeding Type */}
            <div className="field half">
              <label>Breeding Type</label>
              <input
                type="text"
                value={getBreedingTypeDisplay()}
                readOnly
                className="field-input"
                style={{
                  backgroundColor: "#f5f5f5",
                  color:
                    formData.breedingType === "AI"
                      ? "var(--pasture)"
                      : "var(--gold)",
                  fontWeight: 600,
                }}
              />
            </div>

            {/* Kidding Date */}
            <div className="field half">
              <label>Kidding Date *</label>
              <input
                type="date"
                name="kiddingDate"
                value={formData.kiddingDate}
                onChange={handleChange}
                className="field-input"
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Status */}
            <div className="field half">
              <label>Status</label>
              <input
                type="text"
                value={formData.status}
                readOnly
                className="field-input"
                style={{
                  backgroundColor: "#f5f5f5",
                  color:
                    formData.status === "Delivered"
                      ? "var(--pasture)"
                      : "var(--danger)",
                  fontWeight: 600,
                }}
              />
            </div>

            {/* Auto-calculated Stats */}
            {action === "delivered" && (
              <>
                <div
                  className="field full-width"
                  style={{
                    backgroundColor: "rgba(15, 122, 117, 0.05)",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    border: "1px solid var(--line)",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "8px",
                      textAlign: "center",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "0.5rem", color: "#766d5d" }}>
                        Total Kids
                      </span>
                      <br />
                      <strong style={{ fontSize: "0.9rem" }}>
                        {formData.kidCount || 0}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.5rem", color: "#766d5d" }}>
                        Alive
                      </span>
                      <br />
                      <strong
                        style={{ fontSize: "0.9rem", color: "var(--pasture)" }}
                      >
                        {formData.aliveCount || 0}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.5rem", color: "#766d5d" }}>
                        Stillborn
                      </span>
                      <br />
                      <strong
                        style={{ fontSize: "0.9rem", color: "var(--danger)" }}
                      >
                        {formData.stillbornCount || 0}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.5rem", color: "#766d5d" }}>
                        Avg Weight
                      </span>
                      <br />
                      <strong style={{ fontSize: "0.9rem" }}>
                        {formData.birthWeight || "—"} kg
                      </strong>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "0.45rem",
                      color: "#766d5d",
                      textAlign: "center",
                      marginTop: "4px",
                    }}
                  >
                    Kid stage: Kid (regardless of gender)
                  </div>
                </div>

                <div
                  className="field full-width"
                  style={{
                    borderTop: "1px solid var(--line)",
                    paddingTop: "12px",
                    marginTop: "4px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <label style={{ fontWeight: 700 }}>Kids Details</label>
                    <button
                      type="button"
                      className="btn btn-primary btn-small"
                      onClick={addKid}
                    >
                      + Add Kid
                    </button>
                  </div>
                  <small style={{ color: "#766d5d", fontSize: "0.55rem" }}>
                    Max 6 kids. All kids are "Kid" stage.
                  </small>
                </div>

                {kids.map((kid, index) => {
                  const birthDate = new Date(kid.dob + "T00:00:00");
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  let ageInYears = 0;
                  if (birthDate <= today) {
                    const diffTime = today - birthDate;
                    const diffDays = diffTime / (1000 * 60 * 60 * 24);
                    ageInYears = diffDays / 365.25;
                  }
                  const previewStatus =
                    kid.status === "Stillborn"
                      ? "Stillborn"
                      : getHealthStatus(kid.birthWeight, ageInYears);
                  const statusBadge =
                    {
                      Healthy: "healthy",
                      "Healthy (Low Weight)": "due",
                      Weak: "overdue",
                      Overweight: "sold",
                      Stillborn: "dead",
                    }[previewStatus] || "healthy";

                  return (
                    <div
                      key={kid.id}
                      className="field full-width"
                      style={{
                        border: "1px solid var(--line)",
                        borderRadius: "8px",
                        padding: "12px",
                        marginBottom: "8px",
                        backgroundColor: "rgba(15, 122, 117, 0.03)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "8px",
                        }}
                      >
                        <strong style={{ fontSize: "0.7rem" }}>
                          Kid #{index + 1} (Stage: Kid)
                        </strong>
                        {kids.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-danger btn-small"
                            onClick={() => removeKid(index)}
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "8px",
                        }}
                      >
                        <div className="field">
                          <label style={{ fontSize: "0.6rem" }}>Tag ID</label>
                          <input
                            type="text"
                            value={kid.tagId}
                            onChange={(e) =>
                              handleKidChange(index, "tagId", e.target.value)
                            }
                            className="field-input"
                            placeholder="e.g., K-001"
                            style={{ fontSize: "0.7rem", padding: "4px 8px" }}
                          />
                        </div>

                        <div className="field">
                          <label style={{ fontSize: "0.6rem" }}>Gender</label>
                          <select
                            value={kid.gender}
                            onChange={(e) =>
                              handleKidChange(index, "gender", e.target.value)
                            }
                            className="field-input"
                            style={{ fontSize: "0.7rem", padding: "4px 8px" }}
                          >
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                          <small
                            style={{
                              color: "#766d5d",
                              fontSize: "0.45rem",
                              display: "block",
                            }}
                          >
                            All kids are "Kid" stage
                          </small>
                        </div>

                        <div className="field">
                          <label style={{ fontSize: "0.6rem" }}>
                            Birth Weight (kg)
                          </label>
                          <input
                            type="number"
                            value={kid.birthWeight}
                            onChange={(e) =>
                              handleKidChange(
                                index,
                                "birthWeight",
                                e.target.value,
                              )
                            }
                            className="field-input"
                            placeholder="e.g., 2.5"
                            step="0.1"
                            style={{ fontSize: "0.7rem", padding: "4px 8px" }}
                          />
                        </div>

                        <div className="field">
                          <label style={{ fontSize: "0.6rem" }}>
                            Status (Auto)
                          </label>
                          <select
                            value={kid.status}
                            onChange={(e) =>
                              handleKidChange(index, "status", e.target.value)
                            }
                            className="field-input"
                            style={{ fontSize: "0.7rem", padding: "4px 8px" }}
                          >
                            <option value="Healthy">Healthy (Auto)</option>
                            <option value="Healthy (Low Weight)">
                              Low Weight (Auto)
                            </option>
                            <option value="Weak">Weak (Auto)</option>
                            <option value="Overweight">
                              Overweight (Auto)
                            </option>
                            <option value="Stillborn">Stillborn</option>
                          </select>
                          {kid.birthWeight && (
                            <span
                              className={`pill ${statusBadge}`}
                              style={{
                                fontSize: "0.45rem",
                                marginTop: "2px",
                                display: "inline-block",
                              }}
                            >
                              {previewStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {kids.length === 0 && (
                  <div
                    className="field full-width"
                    style={{
                      textAlign: "center",
                      padding: "16px",
                      color: "#766d5d",
                    }}
                  >
                    No kids added yet. Click "Add Kid" to add.
                  </div>
                )}
              </>
            )}

            {/* Notes */}
            <div className="field full-width">
              <label>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="field-input"
                placeholder="Any additional notes..."
                rows="2"
                style={{ resize: "vertical", minHeight: "60px" }}
              />
            </div>
          </div>

          <div className="modal-actions">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Kidding Record"}
            </Button>
          </div>
        </form>
      </Modal>

      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </>
  );
};

export default AddKiddingModal;
