// src/pages/Add/AddMilkModal.jsx - BULK ENTRY (Fixed Warnings)

import React, { useState, useEffect } from "react";
import Modal from "../../components/Common/Modal";
import Button from "../../components/Common/Button";
import { useAuth } from "../../context/AuthContext";
import { milkService } from "../../services/milkService";
import { goatService } from "../../services/goatService";
import Toast from "../../components/Common/Toast";

// ✅ Milk Usage Types
const MILK_USAGE = {
  SOLD: "Sold",
  WASTED: "Wasted",
  STOCK: "Stock",
};

const AddMilkModal = ({
  isOpen,
  onClose,
  onSuccess,
  editData,
  goats,
  kiddingRecords,
}) => {
  const { currentUser } = useAuth();
  const farmId = currentUser?.farmId;

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [allLactatingGoats, setAllLactatingGoats] = useState([]);

  // ✅ Load all lactating goats with their kid counts
  useEffect(() => {
    const loadLactatingGoats = async () => {
      if (!farmId || !isOpen) return;
      try {
        const data = await goatService.getLactatingByFarmId(farmId);
        const withKids = data.map((goat) => {
          const kids =
            kiddingRecords?.filter(
              (k) => k.goatId === goat.id && k.status === "Delivered",
            ) || [];
          const kidCount = kids.reduce((sum, k) => sum + (k.kidCount || 0), 0);
          return { ...goat, kidCount };
        });
        setAllLactatingGoats(withKids);
      } catch (error) {
        console.error("Error loading lactating goats:", error);
      }
    };
    loadLactatingGoats();
  }, [farmId, isOpen, kiddingRecords]);

  // ✅ Get total kids count across all lactating goats
  const getTotalKidsCount = () => {
    return allLactatingGoats.reduce((sum, g) => sum + (g.kidCount || 0), 0);
  };

  // ✅ Get total lactating goats count
  const getTotalGoatsCount = () => {
    return allLactatingGoats.length;
  };

  // ✅ Initial form data - BULK MODE
  const initialFormData = {
    date: editData?.date || new Date().toISOString().split("T")[0],
    time: editData?.time || "Morning",
    totalAmount: editData?.totalAmount || "",
    usageType: editData?.usageType || MILK_USAGE.SOLD,
    usageAmount: editData?.usageAmount || "",
    usagePrice: editData?.usagePrice || "",
    notes: editData?.notes || "",
    goatEntries: editData?.goatEntries || [],
  };

  const [formData, setFormData] = useState(initialFormData);

  // ✅ Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          date: editData.date || "",
          time: editData.time || "Morning",
          totalAmount: editData.totalAmount || "",
          usageType: editData.usageType || MILK_USAGE.SOLD,
          usageAmount: editData.usageAmount || "",
          usagePrice: editData.usagePrice || "",
          notes: editData.notes || "",
          goatEntries: editData.goatEntries || [],
        });
      } else {
        setFormData({
          date: new Date().toISOString().split("T")[0],
          time: "Morning",
          totalAmount: "",
          usageType: MILK_USAGE.SOLD,
          usageAmount: "",
          usagePrice: "",
          notes: "",
          goatEntries: [],
        });
      }
      setErrors({});
    }
  }, [isOpen, editData]);

  // ✅ Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (name === "usageType") {
      if (value === MILK_USAGE.STOCK) {
        setFormData((prev) => ({
          ...prev,
          usageType: value,
          usageAmount: "",
          usagePrice: "",
        }));
      }
    }
  };

  // ✅ Calculate bulk consumption info with EQUAL DISTRIBUTION
  const getBulkConsumptionInfo = (totalAmount) => {
    const totalKids = getTotalKidsCount();
    const totalGoats = getTotalGoatsCount();

    if (totalKids === 0 || totalAmount === 0 || totalGoats === 0) {
      return {
        totalKids: 0,
        totalGoats: 0,
        totalConsumption: 0,
        netMilk: totalAmount,
        perKidConsumption: 0,
        perGoatMilk: totalAmount / (totalGoats || 1),
        goatDetails: [],
        totalAmount: totalAmount,
      };
    }

    // ✅ 10% per kid of TOTAL milk
    const perKidConsumption = totalAmount * 0.1;
    const totalConsumption = perKidConsumption * totalKids;
    const netMilk = Math.max(0, totalAmount - totalConsumption);

    // ✅ Per goat distribution - EQUALLY divide net milk
    const perGoatMilk = totalGoats > 0 ? netMilk / totalGoats : 0;

    // ✅ Per goat details
    const goatDetails = allLactatingGoats.map((goat) => {
      const kidCount = goat.kidCount || 0;

      return {
        goatId: goat.id,
        tagId: goat.tagId,
        breed: goat.breed,
        kidCount: kidCount,
        amount: perGoatMilk, // Equal share
        kidsConsumption: 0,
        netMilk: perGoatMilk,
        usageType: formData.usageType,
        usageAmount: 0,
        usagePrice: formData.usagePrice || 0,
      };
    });

    return {
      totalKids,
      totalGoats,
      totalConsumption,
      netMilk,
      perKidConsumption,
      perGoatMilk,
      goatDetails,
      totalAmount: totalAmount,
    };
  };

  // ✅ Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.date) {
      newErrors.date = "Please select a date";
    }

    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
      newErrors.totalAmount = "Please enter a valid total amount";
    }

    const totalGoats = getTotalGoatsCount();
    if (totalGoats === 0) {
      newErrors.totalAmount = "No lactating goats available";
    }

    const totalAmount = parseFloat(formData.totalAmount) || 0;
    const bulkInfo = getBulkConsumptionInfo(totalAmount);
    const netMilk = bulkInfo.netMilk;

    if (formData.usageType === MILK_USAGE.SOLD) {
      if (!formData.usageAmount || parseFloat(formData.usageAmount) <= 0) {
        newErrors.usageAmount = "Please enter sold amount";
      }
      if (!formData.usagePrice || parseFloat(formData.usagePrice) <= 0) {
        newErrors.usagePrice = "Please enter sale price";
      }
      const soldAmount = parseFloat(formData.usageAmount) || 0;
      if (soldAmount > netMilk) {
        newErrors.usageAmount = `Cannot sell more than net milk (${netMilk.toFixed(
          1,
        )} L available)`;
      }
    }

    if (formData.usageType === MILK_USAGE.WASTED) {
      if (!formData.usageAmount || parseFloat(formData.usageAmount) <= 0) {
        newErrors.usageAmount = "Please enter wasted amount";
      }
      const wastedAmount = parseFloat(formData.usageAmount) || 0;
      if (wastedAmount > netMilk) {
        newErrors.usageAmount = `Cannot waste more than net milk (${netMilk.toFixed(
          1,
        )} L available)`;
      }
    }

    if (formData.usageType === MILK_USAGE.STOCK) {
      if (netMilk <= 0) {
        newErrors.usageAmount = "No milk available to stock";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Handle submit - Creates individual entries for each goat
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const totalAmount = parseFloat(formData.totalAmount);
      const bulkInfo = getBulkConsumptionInfo(totalAmount);
      const { goatDetails, netMilk, totalKids, totalConsumption } = bulkInfo;

      const usageAmount = parseFloat(formData.usageAmount) || 0;
      const usagePrice = parseFloat(formData.usagePrice) || 0;

      // ✅ Create individual entries for each goat with EQUAL distribution
      const entries = goatDetails.map((goat) => {
        let goatUsageAmount = 0;
        let goatUsagePrice = 0;

        if (formData.usageType === MILK_USAGE.SOLD) {
          const share = netMilk > 0 ? goat.amount / netMilk : 0;
          goatUsageAmount = usageAmount * share;
          goatUsagePrice = usagePrice;
        } else if (formData.usageType === MILK_USAGE.WASTED) {
          const share = netMilk > 0 ? goat.amount / netMilk : 0;
          goatUsageAmount = usageAmount * share;
        } else if (formData.usageType === MILK_USAGE.STOCK) {
          goatUsageAmount = goat.amount;
          goatUsagePrice = 0;
        }

        return {
          farmId: farmId,
          goatId: goat.goatId,
          goatTagId: goat.tagId,
          date: formData.date,
          time: formData.time,
          amount: goat.amount,
          usageType: formData.usageType,
          usageAmount: goatUsageAmount,
          usagePrice: goatUsagePrice,
          notes: formData.notes || "",
          kidsConsumption: 0,
          netMilk: goat.netMilk,
          kidsCount: goat.kidCount,
          perKidConsumption: totalAmount * 0.1,
          isBulk: true,
          bulkTotalAmount: totalAmount,
          bulkTotalKids: totalKids,
          bulkTotalConsumption: totalConsumption,
          bulkNetMilk: netMilk,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      let successCount = 0;
      let failCount = 0;

      for (const entry of entries) {
        try {
          await milkService.add(entry);
          successCount++;
        } catch (error) {
          console.error("Error saving entry for goat:", entry.goatTagId, error);
          failCount++;
        }
      }

      setToastMessage(
        `✅ Bulk milk logged! ${successCount} goats updated, ${failCount} failed. ` +
          `Total: ${totalAmount}L, Kids: ${totalKids}, Net: ${netMilk.toFixed(
            1,
          )}L, Per Goat: ${bulkInfo.perGoatMilk.toFixed(1)}L`,
      );

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving bulk milk:", error);
      setToastMessage("Failed to save: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = parseFloat(formData.totalAmount) || 0;
  const totalGoats = getTotalGoatsCount();
  const totalKids = getTotalKidsCount();
  const bulkInfo = getBulkConsumptionInfo(totalAmount);
  const netMilkAvailable = bulkInfo.netMilk;
  const perGoatMilk = bulkInfo.perGoatMilk;
  const usageAmount = parseFloat(formData.usageAmount) || 0;
  const usagePrice = parseFloat(formData.usagePrice) || 0;
  const canUseMilk = netMilkAvailable > 0 && totalGoats > 0;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={editData ? "Edit Bulk Milk Record" : "Bulk Milk Logging"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="form-grid">
            {/* ✅ SUMMARY CARD - Shows Total Breakdown */}
            <div
              className="field full-width"
              style={{
                backgroundColor: "rgba(15, 122, 117, 0.06)",
                borderRadius: "10px",
                padding: "16px 20px",
                border: "2px solid rgba(15, 122, 117, 0.15)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  gap: "12px",
                  textAlign: "center",
                  borderBottom: "1px solid rgba(15, 122, 117, 0.1)",
                  paddingBottom: "10px",
                  marginBottom: "10px",
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: "0.6rem",
                      color: "#766d5d",
                      fontWeight: 600,
                    }}
                  >
                    Total Milk
                  </span>
                  <br />
                  <strong style={{ fontSize: "1.4rem", color: "#1976d2" }}>
                    {totalAmount > 0 ? `${totalAmount.toFixed(1)} L` : "—"}
                  </strong>
                </div>
                <div>
                  <span
                    style={{
                      fontSize: "0.6rem",
                      color: "#766d5d",
                      fontWeight: 600,
                    }}
                  >
                    Kids Consumption
                  </span>
                  <br />
                  <strong style={{ fontSize: "1.4rem", color: "#ff9800" }}>
                    {totalAmount > 0 && totalKids > 0
                      ? `${bulkInfo.totalConsumption.toFixed(1)} L`
                      : "0 L"}
                  </strong>
                  <br />
                  <small style={{ fontSize: "0.45rem", color: "#766d5d" }}>
                    ({totalKids} kids × {(totalAmount * 0.1).toFixed(1)} L/kid)
                  </small>
                </div>
                <div>
                  <span
                    style={{
                      fontSize: "0.6rem",
                      color: "#766d5d",
                      fontWeight: 600,
                    }}
                  >
                    Net Milk
                  </span>
                  <br />
                  <strong style={{ fontSize: "1.6rem", color: "#4caf50" }}>
                    {totalAmount > 0 ? `${netMilkAvailable.toFixed(1)} L` : "—"}
                  </strong>
                </div>
                <div>
                  <span
                    style={{
                      fontSize: "0.6rem",
                      color: "#766d5d",
                      fontWeight: 600,
                    }}
                  >
                    Per Goat (Equal)
                  </span>
                  <br />
                  <strong style={{ fontSize: "1.4rem", color: "#1976d2" }}>
                    {totalAmount > 0 && totalGoats > 0
                      ? `${perGoatMilk.toFixed(1)} L`
                      : "—"}
                  </strong>
                  <br />
                  <small style={{ fontSize: "0.45rem", color: "#766d5d" }}>
                    {totalGoats} goats equally
                  </small>
                </div>
              </div>

              {/* ✅ Goats list with their share */}
              {totalAmount > 0 && totalGoats > 0 && (
                <div
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "rgba(255,255,255,0.7)",
                    borderRadius: "6px",
                    maxHeight: "80px",
                    overflowY: "auto",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px 14px",
                      fontSize: "0.65rem",
                      color: "#555",
                    }}
                  >
                    {bulkInfo.goatDetails.map((g) => (
                      <span key={g.goatId} style={{ fontWeight: 500 }}>
                        <strong style={{ color: "#16302e" }}>{g.tagId}</strong>
                        <span style={{ color: "#4caf50", fontWeight: 600 }}>
                          {" "}
                          {g.amount.toFixed(1)} L
                        </span>
                        {g.kidCount > 0 && (
                          <span
                            style={{ color: "#766d5d", fontSize: "0.55rem" }}
                          >
                            {" "}
                            ({g.kidCount} kids)
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                  <small
                    style={{
                      fontSize: "0.5rem",
                      color: "#999",
                      display: "block",
                      marginTop: "4px",
                    }}
                  >
                    * Milk equally distributed among all {totalGoats} lactating
                    goats
                  </small>
                </div>
              )}
            </div>

            {/* ✅ Date & Time */}
            <div className="field half">
              <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={`field-input ${errors.date ? "input-error" : ""}`}
                disabled={loading}
                max={new Date().toISOString().split("T")[0]}
                style={{ fontSize: "0.85rem", padding: "10px 12px" }}
              />
              {errors.date && <div className="error-text">{errors.date}</div>}
            </div>

            <div className="field half">
              <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                Time *
              </label>
              <select
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="field-input"
                disabled={loading}
                style={{ fontSize: "0.85rem", padding: "10px 12px" }}
              >
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
              </select>
            </div>

            {/* ✅ Total Amount - Bulk entry */}
            <div className="field full-width">
              <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                Total Milk Yield (Liters) *
              </label>
              <input
                type="number"
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleChange}
                className={`field-input ${
                  errors.totalAmount ? "input-error" : ""
                }`}
                placeholder="Enter total milk from all goats"
                step="0.1"
                min="0.1"
                disabled={loading || totalGoats === 0}
                style={{ fontSize: "0.9rem", padding: "10px 12px" }}
              />
              {errors.totalAmount && (
                <div className="error-text">{errors.totalAmount}</div>
              )}
              {totalGoats === 0 && (
                <small style={{ color: "var(--danger)", fontSize: "0.6rem" }}>
                  No lactating goats available. Goats become lactating after
                  kidding.
                </small>
              )}
              {totalGoats > 0 && (
                <small style={{ color: "#766d5d", fontSize: "0.6rem" }}>
                  Enter total milk collected from all {totalGoats} lactating
                  goats
                </small>
              )}
            </div>

            {/* ✅ USAGE TYPE */}
            <div
              className="field full-width"
              style={{ borderTop: "1px solid var(--line)", paddingTop: "14px" }}
            >
              <label style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                How was the remaining milk used? *
                <span style={{ color: "var(--danger)", marginLeft: "2px" }}>
                  *
                </span>
              </label>
              <div
                className="radio-group"
                style={{
                  display: "flex",
                  gap: "20px",
                  flexWrap: "wrap",
                  marginTop: "8px",
                }}
              >
                <label className="radio-label" style={{ fontSize: "0.85rem" }}>
                  <input
                    type="radio"
                    name="usageType"
                    value={MILK_USAGE.SOLD}
                    checked={formData.usageType === MILK_USAGE.SOLD}
                    onChange={handleChange}
                    disabled={loading || !canUseMilk}
                    style={{ transform: "scale(1.1)", marginRight: "6px" }}
                  />
                  Sold
                </label>
                <label className="radio-label" style={{ fontSize: "0.85rem" }}>
                  <input
                    type="radio"
                    name="usageType"
                    value={MILK_USAGE.WASTED}
                    checked={formData.usageType === MILK_USAGE.WASTED}
                    onChange={handleChange}
                    disabled={loading || !canUseMilk}
                    style={{ transform: "scale(1.1)", marginRight: "6px" }}
                  />
                  Wasted
                </label>
                <label
                  className="radio-label"
                  style={{ fontSize: "0.85rem", fontWeight: 600 }}
                >
                  <input
                    type="radio"
                    name="usageType"
                    value={MILK_USAGE.STOCK}
                    checked={formData.usageType === MILK_USAGE.STOCK}
                    onChange={handleChange}
                    disabled={loading || !canUseMilk}
                    style={{
                      accentColor: "#1976d2",
                      transform: "scale(1.1)",
                      marginRight: "6px",
                    }}
                  />
                  Stock
                </label>
              </div>
              {!canUseMilk && totalAmount > 0 && (
                <small style={{ color: "var(--danger)", fontSize: "0.6rem" }}>
                  No milk available after kids consumption.
                </small>
              )}
              {canUseMilk && (
                <small
                  style={{
                    color: "#766d5d",
                    fontSize: "0.6rem",
                    display: "block",
                    marginTop: "4px",
                  }}
                >
                  {formData.usageType === MILK_USAGE.STOCK
                    ? `All ${netMilkAvailable.toFixed(
                        1,
                      )} L will be added to stock`
                    : `Available: ${netMilkAvailable.toFixed(1)} L`}
                </small>
              )}
            </div>

            {/* ✅ Sold Details */}
            {formData.usageType === MILK_USAGE.SOLD && (
              <>
                <div className="field half">
                  <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                    Amount Sold (L) *
                  </label>
                  <input
                    type="number"
                    name="usageAmount"
                    value={formData.usageAmount}
                    onChange={handleChange}
                    className={`field-input ${
                      errors.usageAmount ? "input-error" : ""
                    }`}
                    placeholder={`Max: ${netMilkAvailable.toFixed(1)} L`}
                    step="0.1"
                    min="0.1"
                    max={netMilkAvailable || undefined}
                    disabled={loading}
                    style={{ fontSize: "0.85rem", padding: "10px 12px" }}
                  />
                  <small style={{ color: "#766d5d", fontSize: "0.6rem" }}>
                    Available: {netMilkAvailable.toFixed(1)} L
                  </small>
                  {errors.usageAmount && (
                    <div className="error-text">{errors.usageAmount}</div>
                  )}
                </div>

                <div className="field half">
                  <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                    Sale Price (PKR/L) *
                  </label>
                  <input
                    type="number"
                    name="usagePrice"
                    value={formData.usagePrice}
                    onChange={handleChange}
                    className={`field-input ${
                      errors.usagePrice ? "input-error" : ""
                    }`}
                    placeholder="e.g., 300"
                    step="10"
                    min="0"
                    disabled={loading}
                    style={{ fontSize: "0.85rem", padding: "10px 12px" }}
                  />
                  <small style={{ color: "#766d5d", fontSize: "0.6rem" }}>
                    Price per liter
                  </small>
                  {errors.usagePrice && (
                    <div className="error-text">{errors.usagePrice}</div>
                  )}
                </div>

                {usageAmount > 0 && usagePrice > 0 && (
                  <div
                    className="field full-width"
                    style={{
                      backgroundColor: "rgba(217, 162, 59, 0.08)",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      border: "1px solid rgba(217, 162, 59, 0.2)",
                    }}
                  >
                    <span style={{ fontSize: "0.75rem", color: "#555" }}>
                      Total Revenue:{" "}
                      <strong
                        style={{ color: "var(--gold)", fontSize: "1rem" }}
                      >
                        {new Intl.NumberFormat("en-PK", {
                          style: "currency",
                          currency: "PKR",
                          minimumFractionDigits: 0,
                        }).format(usageAmount * usagePrice)}
                      </strong>
                      <span
                        style={{
                          fontSize: "0.55rem",
                          color: "#766d5d",
                          marginLeft: "8px",
                        }}
                      >
                        ({usagePrice} PKR/L × {usageAmount} L)
                      </span>
                    </span>
                  </div>
                )}
              </>
            )}

            {/* ✅ Wasted Details */}
            {formData.usageType === MILK_USAGE.WASTED && (
              <div className="field half">
                <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                  Amount Wasted (L) *
                </label>
                <input
                  type="number"
                  name="usageAmount"
                  value={formData.usageAmount}
                  onChange={handleChange}
                  className={`field-input ${
                    errors.usageAmount ? "input-error" : ""
                  }`}
                  placeholder={`Max: ${netMilkAvailable.toFixed(1)} L`}
                  step="0.1"
                  min="0.1"
                  max={netMilkAvailable || undefined}
                  disabled={loading}
                  style={{ fontSize: "0.85rem", padding: "10px 12px" }}
                />
                <small style={{ color: "#766d5d", fontSize: "0.6rem" }}>
                  Available: {netMilkAvailable.toFixed(1)} L
                </small>
                {errors.usageAmount && (
                  <div className="error-text">{errors.usageAmount}</div>
                )}
              </div>
            )}

            {/* ✅ Stock Info */}
            {formData.usageType === MILK_USAGE.STOCK && (
              <div
                className="field full-width"
                style={{
                  backgroundColor: "rgba(33, 150, 243, 0.08)",
                  borderRadius: "10px",
                  padding: "14px 18px",
                  border: "2px solid rgba(33, 150, 243, 0.25)",
                }}
              >
                <div>
                  <strong style={{ color: "#1976d2", fontSize: "1rem" }}>
                    Stock Added: {netMilkAvailable.toFixed(1)} L
                  </strong>
                  <br />
                  <small style={{ color: "#555", fontSize: "0.6rem" }}>
                    All remaining milk ({netMilkAvailable.toFixed(1)} L) will be
                    added to stock inventory across {totalGoats} goats.
                    {netMilkAvailable === 0 && " (No milk to stock)"}
                  </small>
                </div>
              </div>
            )}

            {/* ✅ Notes */}
            <div className="field full-width">
              <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="field-input"
                placeholder="Any observations (e.g., health, feed changes, buyer details)"
                rows="2"
                disabled={loading}
                style={{
                  resize: "vertical",
                  minHeight: "60px",
                  fontSize: "0.85rem",
                  padding: "10px 12px",
                }}
              />
            </div>

            {/* ✅ Per Goat Distribution Summary at Bottom */}
            {totalAmount > 0 && totalGoats > 0 && (
              <div
                className="field full-width"
                style={{
                  backgroundColor: "rgba(15, 122, 117, 0.04)",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  border: "1px solid var(--line)",
                }}
              >
                <div style={{ fontSize: "0.7rem", color: "#555" }}>
                  <strong>
                    Summary: Total {totalAmount.toFixed(1)} L → Net{" "}
                    {netMilkAvailable.toFixed(1)} L → {totalGoats} Goats ×{" "}
                    {perGoatMilk.toFixed(1)} L each
                  </strong>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "6px 12px",
                      marginTop: "6px",
                      fontSize: "0.65rem",
                    }}
                  >
                    {bulkInfo.goatDetails.map((g) => (
                      <span key={g.goatId}>
                        <strong style={{ color: "#16302e" }}>{g.tagId}</strong>
                        <span style={{ color: "#4caf50", fontWeight: 600 }}>
                          {" "}
                          {g.amount.toFixed(1)} L
                        </span>
                        {g.kidCount > 0 && (
                          <span
                            style={{ color: "#766d5d", fontSize: "0.55rem" }}
                          >
                            {" "}
                            ({g.kidCount} kids)
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div
            className="modal-actions"
            style={{ marginTop: "16px", paddingTop: "12px" }}
          >
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
              style={{ fontSize: "0.85rem", padding: "8px 20px" }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || totalGoats === 0}
              style={{ fontSize: "0.85rem", padding: "8px 24px" }}
            >
              {loading
                ? `Saving ${totalGoats} entries...`
                : editData
                ? "Update Bulk Record"
                : `Log Milk (${totalGoats} Goats)`}
            </Button>
          </div>
        </form>
      </Modal>

      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </>
  );
};

export default AddMilkModal;
