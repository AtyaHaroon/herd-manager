// src/pages/Medication.jsx - MEDICATION MANAGEMENT (Medicine Master)

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getCollection,
  deleteDocument,
  COLLECTIONS,
} from "../../firebase/firestore";
import Toast from "../../components/Common/Toast";
import Loader from "../../components/Common/Loader";
import AddMedicineModal from "../Add/AddMedicineModal";

const Medication = () => {
  const { currentUser } = useAuth();
  const farmId = currentUser?.farmId;

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDisease, setFilterDisease] = useState("all");

  const isMounted = useRef(true);

  // Load data
  const loadData = useCallback(async () => {
    if (!farmId || !isMounted.current) return;

    setLoading(true);
    try {
      const medicinesData = await getCollection(COLLECTIONS.MEDICINES, [
        { field: "farmId", operator: "==", value: farmId },
      ]);

      if (isMounted.current) {
        setMedicines(medicinesData || []);
      }
    } catch (error) {
      console.error("Error loading medicines:", error);
      if (isMounted.current) {
        setToastMessage("Failed to load medicines.");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [farmId]);

  useEffect(() => {
    isMounted.current = true;
    loadData();

    return () => {
      isMounted.current = false;
    };
  }, [loadData]);

  // Get unique diseases for filter
  const uniqueDiseases = React.useMemo(() => {
    const diseases = new Set();
    medicines.forEach((m) => {
      if (m.disease) diseases.add(m.disease);
    });
    return Array.from(diseases).sort();
  }, [medicines]);

  // Filter medicines
  const filteredMedicines = medicines.filter((m) => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      const match =
        m.name?.toLowerCase().includes(term) ||
        m.disease?.toLowerCase().includes(term) ||
        m.treatment?.toLowerCase().includes(term) ||
        m.description?.toLowerCase().includes(term) ||
        m.usage?.toLowerCase().includes(term);
      if (!match) return false;
    }

    if (filterDisease !== "all" && m.disease !== filterDisease) {
      return false;
    }

    return true;
  });

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this medicine?")) {
      return;
    }

    setUpdating(true);
    try {
      await deleteDocument(COLLECTIONS.MEDICINES, id);
      setToastMessage("Medicine deleted successfully");
      await loadData();
    } catch (error) {
      console.error("Error deleting medicine:", error);
      setToastMessage("Failed to delete medicine");
    } finally {
      setUpdating(false);
    }
  };

  // Handle edit
  const handleEdit = (medicine) => {
    setEditingMedicine(medicine);
    setIsModalOpen(true);
  };

  // Handle add
  const handleAdd = () => {
    setEditingMedicine(null);
    setIsModalOpen(true);
  };

  // Handle modal success
  const handleModalSuccess = () => {
    loadData();
    setToastMessage(editingMedicine ? "Medicine updated!" : "Medicine added!");
  };

  // Stats
  const stats = {
    total: medicines.length,
    withPrice: medicines.filter((m) => m.price && m.price > 0).length,
    withDisease: medicines.filter((m) => m.disease).length,
    withDosage: medicines.filter((m) => m.dosage).length,
    totalValue: medicines.reduce(
      (sum, m) => sum + (parseFloat(m.price) || 0),
      0,
    ),
  };

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

  return (
    <div className="panel active">
      {/* Header */}
      <div className="panel-head">
        <div>
          <h2>Medication Management</h2>
          <div className="desc">Manage medicines, treatments, and dosages</div>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>
          + Add Medicine
        </button>
      </div>

      {/* Stats */}
      <div className="overview-grid">
        <div className="ov-card">
          <span className="ov-num">{stats.total}</span>
          <span className="ov-lbl">Total Medicines</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(76, 175, 80, 0.08)" }}
        >
          <span className="ov-num">{stats.withPrice}</span>
          <span className="ov-lbl">With Price</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(33, 150, 243, 0.08)" }}
        >
          <span className="ov-num">{stats.withDisease}</span>
          <span className="ov-lbl">Diseases Covered</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(255, 152, 0, 0.08)" }}
        >
          <span className="ov-num">{stats.withDosage}</span>
          <span className="ov-lbl">With Dosage</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(217, 162, 59, 0.08)" }}
        >
          <span className="ov-num">
            PKR {stats.totalValue.toLocaleString()}
          </span>
          <span className="ov-lbl">Total Value</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by name, disease, treatment..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 2 }}
        />
        <select
          value={filterDisease}
          onChange={(e) => setFilterDisease(e.target.value)}
          style={{ flex: 1 }}
        >
          <option value="all">All Diseases</option>
          {uniqueDiseases.map((disease) => (
            <option key={disease} value={disease}>
              {disease}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Price (PKR)</th>
              <th>Disease</th>
              <th>Treatment</th>
              <th>Dosage</th>
              <th>Usage</th>
              <th>Description</th>
              <th style={{ minWidth: "100px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMedicines.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty">
                  {searchTerm || filterDisease !== "all"
                    ? "No medicines match your search criteria."
                    : "No medicines added yet. Click 'Add Medicine' to get started!"}
                </td>
              </tr>
            ) : (
              filteredMedicines.map((medicine, index) => (
                <tr
                  key={medicine.id}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <td>
                    <strong>{medicine.name}</strong>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: "var(--gold)" }}>
                      {medicine.price ? `PKR ${medicine.price}` : "—"}
                    </span>
                  </td>
                  <td>
                    <span
                      className="pill"
                      style={{
                        background: "rgba(33, 150, 243, 0.12)",
                        color: "#0d47a1",
                        fontSize: "0.5rem",
                      }}
                    >
                      {medicine.disease || "—"}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: "0.6rem", color: "#766d5d" }}>
                      {medicine.treatment || "—"}
                    </span>
                  </td>
                  <td>
                    <span
                      className="pill"
                      style={{
                        background: "rgba(255, 152, 0, 0.12)",
                        color: "#e65100",
                        fontSize: "0.5rem",
                      }}
                    >
                      {medicine.dosage || "—"}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: "0.6rem", color: "#766d5d" }}>
                      {medicine.usage || "—"}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: "0.6rem", color: "#766d5d" }}>
                      {medicine.description || "—"}
                    </span>
                  </td>
                  <td>
                    <div
                      style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}
                    >
                      <button
                        className="btn btn-ghost btn-small"
                        onClick={() => handleEdit(medicine)}
                        disabled={updating}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-small"
                        onClick={() => handleDelete(medicine.id)}
                        disabled={updating}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <AddMedicineModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMedicine(null);
        }}
        onSuccess={handleModalSuccess}
        editData={editingMedicine}
      />

      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </div>
  );
};

export default Medication;
