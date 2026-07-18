// src/pages/VaccineManagement.jsx - VACCINE MASTER (Updated with ConfirmModal & Toast)

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getCollection,
  deleteDocument,
  COLLECTIONS,
} from "../../firebase/firestore";
import Toast from "../../components/Common/Toast";
import Loader from "../../components/Common/Loader";
import ConfirmModal from "../../components/Common/ConfirmModal"; // ✅ Import ConfirmModal
import AddVaccineModal from "../Add/AddVaccineModal";

const VaccineManagement = () => {
  const { currentUser } = useAuth();
  const farmId = currentUser?.farmId;

  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVaccine, setEditingVaccine] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [vaccineToDelete, setVaccineToDelete] = useState(null);

  const isMounted = useRef(true);

  // ✅ Load data
  const loadData = useCallback(async () => {
    if (!farmId || !isMounted.current) return;

    setLoading(true);
    try {
      const vaccinesData = await getCollection(COLLECTIONS.VACCINES, [
        { field: "farmId", operator: "==", value: farmId },
      ]);

      if (isMounted.current) {
        setVaccines(vaccinesData || []);
      }
    } catch (error) {
      console.error("Error loading vaccines:", error);
      if (isMounted.current) {
        setToastMessage("Failed to load vaccines.");
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

  // ✅ Filter vaccines
  const filteredVaccines = vaccines.filter((v) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      v.name?.toLowerCase().includes(term) ||
      v.description?.toLowerCase().includes(term) ||
      v.recommendedAge?.toLowerCase().includes(term)
    );
  });

  // ✅ Handle delete click - Opens ConfirmModal
  const handleDeleteClick = (vaccine) => {
    setVaccineToDelete(vaccine);
    setDeleteConfirmOpen(true);
  };

  // ✅ Confirm delete
  const confirmDelete = async () => {
    if (!vaccineToDelete) return;

    setUpdating(true);
    try {
      await deleteDocument(COLLECTIONS.VACCINES, vaccineToDelete.id);
      setToastMessage(
        `Vaccine "${vaccineToDelete.name}" deleted successfully.`,
      );
      await loadData();
    } catch (error) {
      console.error("Error deleting vaccine:", error);
      setToastMessage("Failed to delete vaccine.");
    } finally {
      setUpdating(false);
      setDeleteConfirmOpen(false);
      setVaccineToDelete(null);
    }
  };

  // ✅ Handle edit
  const handleEdit = (vaccine) => {
    setEditingVaccine(vaccine);
    setIsModalOpen(true);
  };

  // ✅ Handle add
  const handleAdd = () => {
    setEditingVaccine(null);
    setIsModalOpen(true);
  };

  // ✅ Handle modal success
  const handleModalSuccess = () => {
    loadData();
    setToastMessage(editingVaccine ? "Vaccine updated!" : "Vaccine added!");
  };

  // ✅ Stats
  const stats = {
    total: vaccines.length,
    withSchedule: vaccines.filter((v) => v.scheduleDays && v.scheduleDays > 0)
      .length,
    withPrice: vaccines.filter((v) => v.price && v.price > 0).length,
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
          <h2>Vaccine Management</h2>
          <div className="desc">Add, edit, and manage vaccine inventory</div>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>
          + Add Vaccine
        </button>
      </div>

      {/* Stats */}
      <div className="overview-grid">
        <div className="ov-card">
          <span className="ov-num">{stats.total}</span>
          <span className="ov-lbl">Total Vaccines</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(76, 175, 80, 0.12)" }}
        >
          <span className="ov-num">{stats.withSchedule}</span>
          <span className="ov-lbl">With Schedule</span>
        </div>
        <div
          className="ov-card"
          style={{ background: "rgba(255, 152, 0, 0.12)" }}
        >
          <span className="ov-num">{stats.withPrice}</span>
          <span className="ov-lbl">With Price</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by name, description, or recommended age..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Price (PKR)</th>
              <th>Schedule (Days)</th>
              <th>Recommended Age</th>
              <th>Description</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVaccines.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty">
                  {searchTerm
                    ? "No vaccines match your search."
                    : "No vaccines added yet. Click 'Add Vaccine' to get started!"}
                </td>
              </tr>
            ) : (
              filteredVaccines.map((vaccine, index) => (
                <tr
                  key={vaccine.id}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <td>
                    <strong>{vaccine.name}</strong>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: "var(--gold)" }}>
                      {vaccine.price ? `PKR ${vaccine.price}` : "—"}
                    </span>
                  </td>
                  <td>
                    <span className="pill healthy">
                      {vaccine.scheduleDays
                        ? `${vaccine.scheduleDays} days`
                        : "—"}
                    </span>
                  </td>
                  <td>{vaccine.recommendedAge || "—"}</td>
                  <td>
                    <span style={{ fontSize: "0.65rem", color: "#766d5d" }}>
                      {vaccine.description || "—"}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: "0.6rem", color: "#766d5d" }}>
                      {vaccine.notes || "—"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button
                        className="btn btn-ghost btn-small"
                        onClick={() => handleEdit(vaccine)}
                        disabled={updating}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-small"
                        onClick={() => handleDeleteClick(vaccine)} // ✅ Changed
                        disabled={updating}
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

      {/* ✅ Add Vaccine Modal */}
      <AddVaccineModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingVaccine(null);
        }}
        onSuccess={handleModalSuccess}
        editData={editingVaccine}
      />

      {/* ✅ Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Vaccine"
        message={`Are you sure you want to delete vaccine "${vaccineToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={updating}
      />

      {/* ✅ Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </div>
  );
};

export default VaccineManagement;
