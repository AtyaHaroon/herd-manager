// src/pages/Milk.jsx - Fixed (Removed unused getGoatInfo)

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { goatService } from "../../services/goatService";
import { milkService } from "../../services/milkService";
import { kiddingService } from "../../services/kiddingService";
import AddMilkModal from "../Add/AddMilkModal";
import Toast from "../../components/Common/Toast";
import Loader from "../../components/Common/Loader";
import { formatDate, formatCurrencyFull } from "../../utils/helpers";
import ConfirmModal from "../../components/Common/ConfirmModal";

// Milk Usage Types
const MILK_USAGE = {
  SOLD: "Sold",
  WASTED: "Wasted",
  STOCK: "Stock",
};

const Milk = () => {
  const { currentUser } = useAuth();
  const farmId = currentUser?.farmId;

  const [goats, setGoats] = useState([]);
  const [allGoats, setAllGoats] = useState([]);
  const [milkRecords, setMilkRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [kiddingRecords, setKiddingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  // Filters
  const [dateFilter, setDateFilter] = useState("");
  const [goatFilter, setGoatFilter] = useState("all");
  const [usageFilter, setUsageFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  // Delete state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  const loadData = useCallback(async () => {
    if (!farmId) return;
    setLoading(true);
    try {
      const [allGoatsData, lactatingGoatsData, milkData, kiddingData] =
        await Promise.all([
          goatService.getByFarmId(farmId),
          goatService.getLactatingByFarmId(farmId),
          milkService.getByFarmId(farmId),
          kiddingService.getByFarmId(farmId),
        ]);

      setAllGoats(allGoatsData);
      setGoats(lactatingGoatsData);
      setMilkRecords(milkData);
      setKiddingRecords(kiddingData);
    } catch (error) {
      console.error("Error loading data:", error);
      setToastMessage("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter Logic
  useEffect(() => {
    let filtered = [...milkRecords];

    if (dateFilter) {
      filtered = filtered.filter((r) => r.date === dateFilter);
    }

    if (monthFilter !== "") {
      filtered = filtered.filter((r) => {
        const recordDate = new Date(r.date + "T00:00:00");
        return recordDate.getMonth() === parseInt(monthFilter);
      });
    }

    if (yearFilter !== "") {
      filtered = filtered.filter((r) => {
        const recordDate = new Date(r.date + "T00:00:00");
        return recordDate.getFullYear() === parseInt(yearFilter);
      });
    }

    if (goatFilter !== "all") {
      filtered = filtered.filter((r) => r.goatId === goatFilter);
    }

    if (usageFilter !== "all") {
      filtered = filtered.filter((r) => r.usageType === usageFilter);
    }

    filtered.sort((a, b) => b.date.localeCompare(a.date));
    setFilteredRecords(filtered);
  }, [
    milkRecords,
    dateFilter,
    goatFilter,
    usageFilter,
    monthFilter,
    yearFilter,
  ]);

  // ✅ Get goat tag ID from ALL goats
  const getGoatTagId = (id) => {
    const goat = allGoats.find((g) => g.id === id);
    return goat ? goat.tagId : "Unknown";
  };

  // ✅ Get goat breed from ALL goats
  const getGoatBreed = (id) => {
    const goat = allGoats.find((g) => g.id === id);
    return goat ? goat.breed : "Unknown";
  };

  const getKidsCountForGoat = (goatId) => {
    const kidRecords = kiddingRecords.filter(
      (k) => k.goatId === goatId && k.status === "Delivered",
    );
    return kidRecords.reduce((sum, k) => sum + (k.kidCount || 0), 0);
  };

  const getUsageBadge = (type) => {
    const badges = {
      [MILK_USAGE.SOLD]: { className: "pill income", label: "Sold" },
      [MILK_USAGE.WASTED]: { className: "pill overdue", label: "Wasted" },
      [MILK_USAGE.STOCK]: { className: "pill healthy", label: "Stock" },
    };
    return badges[type] || badges[MILK_USAGE.SOLD];
  };

  const handleAddRecord = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (record) => {
    setRecordToDelete(record);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      await milkService.delete(recordToDelete.id);
      setToastMessage("Record deleted successfully");
      loadData();
    } catch (error) {
      console.error("Error deleting record:", error);
      setToastMessage("Failed to delete record");
    } finally {
      setDeleteConfirmOpen(false);
      setRecordToDelete(null);
    }
  };

  const handleModalSuccess = () => {
    loadData();
  };

  // Stats
  const totalRecords = milkRecords.length;
  const totalMilkProduced = milkRecords.reduce(
    (sum, r) => sum + parseFloat(r.amount || 0),
    0,
  );

  const totalKidsConsumption = milkRecords.reduce((sum, r) => {
    const kidsCount = getKidsCountForGoat(r.goatId);
    const perKid = kidsCount > 0 ? parseFloat(r.amount || 0) * 0.1 : 0;
    return sum + perKid * kidsCount;
  }, 0);

  const totalMilkSold = milkRecords
    .filter((r) => r.usageType === MILK_USAGE.SOLD)
    .reduce((sum, r) => sum + parseFloat(r.usageAmount || 0), 0);

  const totalMilkWasted = milkRecords
    .filter((r) => r.usageType === MILK_USAGE.WASTED)
    .reduce((sum, r) => sum + parseFloat(r.usageAmount || 0), 0);

  const totalMilkStocked = milkRecords
    .filter((r) => r.usageType === MILK_USAGE.STOCK)
    .reduce((sum, r) => sum + parseFloat(r.usageAmount || 0), 0);

  const totalRevenue = milkRecords
    .filter((r) => r.usageType === MILK_USAGE.SOLD)
    .reduce(
      (sum, r) =>
        sum + parseFloat(r.usagePrice || 0) * parseFloat(r.usageAmount || 0),
      0,
    );

  const totalNetMilk = totalMilkProduced - totalKidsConsumption;

  if (loading) {
    return (
      <div className="panel active">
        <div
          style={{ display: "flex", justifyContent: "center", padding: "40px" }}
        >
          <Loader />
        </div>
      </div>
    );
  }

  // Get unique years for filter
  const uniqueYears = [
    ...new Set(
      milkRecords.map((r) => new Date(r.date + "T00:00:00").getFullYear()),
    ),
  ].sort((a, b) => b - a);

  return (
    <div className="panel active">
      <div className="panel-head">
        <div>
          <h2>Milk Management</h2>
          <div className="desc">
            Track daily milk production, sales, wastage, and stock. Kids consume
            10% per kid automatically.
            {goats.length === 0 && " (No lactating goats found)"}
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleAddRecord}
          disabled={goats.length === 0}
        >
          + Bulk Log Milk
        </button>
      </div>

      {/* Stats Overview */}
      <div className="overview-grid">
        <div className="ov-card">
          <span className="ov-num">{totalRecords}</span>
          <span className="ov-lbl">Records</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(33, 150, 243, 0.08)" }}
        >
          <span className="ov-num">{totalMilkProduced.toFixed(1)} L</span>
          <span className="ov-lbl">Produced</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(76, 175, 80, 0.08)" }}
        >
          <span className="ov-num">{totalNetMilk.toFixed(1)} L</span>
          <span className="ov-lbl">Net Available</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(255, 152, 0, 0.08)" }}
        >
          <span className="ov-num">{totalKidsConsumption.toFixed(1)} L</span>
          <span className="ov-lbl">Kids Consumed</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(217, 162, 59, 0.08)" }}
        >
          <span className="ov-num">{totalMilkSold.toFixed(1)} L</span>
          <span className="ov-lbl">Sold</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(244, 67, 54, 0.08)" }}
        >
          <span className="ov-num">{totalMilkWasted.toFixed(1)} L</span>
          <span className="ov-lbl">Wasted</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(33, 150, 243, 0.08)" }}
        >
          <span className="ov-num">{totalMilkStocked.toFixed(1)} L</span>
          <span className="ov-lbl">Stocked</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(15, 122, 117, 0.08)" }}
        >
          <span className="ov-num">{formatCurrencyFull(totalRevenue)}</span>
          <span className="ov-lbl">Revenue</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar" style={{ flexWrap: "wrap", gap: "8px" }}>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{ width: "auto", minWidth: "120px" }}
        />
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          style={{ width: "auto", minWidth: "100px" }}
        >
          <option value="">All Months</option>
          <option value="0">January</option>
          <option value="1">February</option>
          <option value="2">March</option>
          <option value="3">April</option>
          <option value="4">May</option>
          <option value="5">June</option>
          <option value="6">July</option>
          <option value="7">August</option>
          <option value="8">September</option>
          <option value="9">October</option>
          <option value="10">November</option>
          <option value="11">December</option>
        </select>
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          style={{ width: "auto", minWidth: "100px" }}
        >
          <option value="">All Years</option>
          {uniqueYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <select
          value={goatFilter}
          onChange={(e) => setGoatFilter(e.target.value)}
          style={{ width: "auto", minWidth: "150px" }}
        >
          <option value="all">All Goats</option>
          {goats.map((g) => (
            <option key={g.id} value={g.id}>
              {g.tagId} - {g.breed} (Kids: {getKidsCountForGoat(g.id)})
            </option>
          ))}
        </select>
        <select
          value={usageFilter}
          onChange={(e) => setUsageFilter(e.target.value)}
          style={{ width: "auto", minWidth: "120px" }}
        >
          <option value="all">All Usage</option>
          <option value={MILK_USAGE.SOLD}>Sold</option>
          <option value={MILK_USAGE.WASTED}>Wasted</option>
          <option value={MILK_USAGE.STOCK}>Stock</option>
        </select>
        {(dateFilter ||
          monthFilter ||
          yearFilter ||
          goatFilter !== "all" ||
          usageFilter !== "all") && (
          <button
            className="btn btn-ghost btn-small"
            onClick={() => {
              setDateFilter("");
              setMonthFilter("");
              setYearFilter("");
              setGoatFilter("all");
              setUsageFilter("all");
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Goat (Tag ID)</th>
              <th>Yield</th>
              <th>Kids</th>
              <th>Kids Consumed</th>
              <th>Usage</th>
              <th>Amount</th>
              <th>Revenue</th>
              <th>Net Milk</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan="11" className="empty">
                  {goats.length === 0
                    ? "No lactating goats found. Goats become Lactating after kidding."
                    : dateFilter ||
                      monthFilter ||
                      yearFilter ||
                      goatFilter !== "all" ||
                      usageFilter !== "all"
                    ? "No records match your search criteria."
                    : "No milk records found. Log your first bulk milk record!"}
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => {
                const totalAmount = parseFloat(record.amount || 0);
                const kidsCount = getKidsCountForGoat(record.goatId);
                const perKidConsumption = kidsCount > 0 ? totalAmount * 0.1 : 0;
                const kidsConsumption = perKidConsumption * kidsCount;
                const netMilk = Math.max(0, totalAmount - kidsConsumption);

                const usageType = record.usageType || MILK_USAGE.SOLD;
                const usageAmount = parseFloat(record.usageAmount || 0);
                const usagePrice = parseFloat(record.usagePrice || 0);
                const remaining = netMilk - usageAmount;

                const usageBadge = getUsageBadge(usageType);

                // ✅ Get goat tag ID and breed from allGoats
                const goatTagId = getGoatTagId(record.goatId);
                const goatBreed = getGoatBreed(record.goatId);

                // ✅ Check if it's a bulk entry
                const isBulk = record.isBulk === true;

                return (
                  <tr key={record.id}>
                    <td>{formatDate(record.date)}</td>
                    <td>
                      <strong style={{ fontSize: "0.85rem" }}>
                        {goatTagId}
                      </strong>
                      <span
                        style={{
                          fontSize: "0.5rem",
                          color: "#766d5d",
                          display: "block",
                        }}
                      >
                        {goatBreed}
                      </span>
                      {isBulk && (
                        <span
                          style={{
                            fontSize: "0.45rem",
                            color: "#1976d2",
                            display: "block",
                            fontWeight: 600,
                          }}
                        >
                          Bulk Entry
                        </span>
                      )}
                    </td>
                    <td>
                      <strong>{totalAmount.toFixed(1)} L</strong>
                    </td>
                    <td>
                      <span className="pill due">{kidsCount} kids</span>
                    </td>
                    <td>
                      <span style={{ color: "#ff9800", fontWeight: 600 }}>
                        {kidsConsumption.toFixed(1)} L
                      </span>
                      <br />
                      <small style={{ fontSize: "0.5rem", color: "#766d5d" }}>
                        ({perKidConsumption.toFixed(1)} L/kid)
                      </small>
                    </td>
                    <td>
                      <span className={usageBadge.className}>
                        {usageBadge.label}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>
                        {usageAmount > 0 ? `${usageAmount.toFixed(1)} L` : "—"}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: "var(--gold)", fontWeight: 700 }}>
                        {usagePrice > 0 && usageAmount > 0
                          ? formatCurrencyFull(usageAmount * usagePrice)
                          : usageType === MILK_USAGE.STOCK
                          ? "—"
                          : "—"}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          color: remaining >= 0 ? "#4caf50" : "var(--danger)",
                          fontWeight: 700,
                          fontSize: "0.9rem",
                        }}
                      >
                        {remaining.toFixed(1)} L
                      </span>
                      <br />
                      <small style={{ fontSize: "0.5rem", color: "#766d5d" }}>
                        {remaining >= 0 && netMilk > 0
                          ? `${((remaining / netMilk) * 100).toFixed(
                              0,
                            )}% available`
                          : remaining < 0
                          ? "Overused!"
                          : "No milk available"}
                      </small>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.65rem", color: "#766d5d" }}>
                        {record.notes || "—"}
                      </span>
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "4px",
                          flexDirection: "column",
                        }}
                      >
                        <button
                          className="btn btn-ghost btn-small"
                          onClick={() => handleEditRecord(record)}
                          style={{ width: "100%" }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => handleDeleteClick(record)}
                          style={{ width: "100%" }}
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

      {/* Modals */}
      <AddMilkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        editData={editingRecord}
        goats={goats}
        kiddingRecords={kiddingRecords}
      />

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Milk Record"
        message="Are you sure you want to delete this milk record?"
        confirmText="Delete"
        confirmVariant="danger"
      />

      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </div>
  );
};

export default Milk;
