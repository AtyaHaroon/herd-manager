// src/pages/palai/PalaiPackages.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { palaiPackageService } from "../../services/palaiPackageService";
import Toast from "../../components/Common/Toast";
import Loader from "../../components/Common/Loader";
import AddPalaiModal from "../Add/AddPalaiModal";

const PalaiPackages = () => {
  const { currentUser } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);

  const farmId = currentUser?.farmId;

  const loadPackages = useCallback(async () => {
    if (!farmId) return;
    setLoading(true);
    try {
      const data = await palaiPackageService.getByFarmId(farmId);
      setPackages(data);
    } catch (error) {
      console.error("Error loading Palai packages:", error);
      setToastMessage("Failed to load packages.");
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  const handleAddNew = () => {
    setEditingPackage(null);
    setIsModalOpen(true);
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    loadPackages();
    setToastMessage(
      editingPackage
        ? "Package updated successfully!"
        : "Package added successfully!",
    );
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" package?`))
      return;
    try {
      await palaiPackageService.delete(id);
      setToastMessage(`Package "${name}" deleted successfully.`);
      loadPackages();
    } catch (error) {
      console.error("Error deleting package:", error);
      setToastMessage("Failed to delete package.");
    }
  };

  return (
    <div className="panel active">
      <div className="panel-head">
        <div>
          <h2>Palai Packages</h2>
          <div className="desc">
            Manage your customized Palai service packages.
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleAddNew}>
          + Add Package
        </button>
      </div>

      {loading && (
        <div
          style={{ display: "flex", justifyContent: "center", padding: "40px" }}
        >
          <Loader />
        </div>
      )}

      {!loading && (
        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          }}
        >
          {packages.length === 0 ? (
            <div className="empty" style={{ gridColumn: "1 / -1" }}>
              No packages created yet. Click "Add Package" to get started!
            </div>
          ) : (
            packages.map((pkg) => (
              <div
                key={pkg.id}
                className="card"
                style={{
                  padding: "0",
                  overflow: "hidden",
                  borderRadius: "12px",
                  border: "1px solid #000",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  background: "#fff",
                }}
              >
                {/* Header Section (Teal color) */}
                <div
                  style={{
                    background: "#12807c",
                    padding: "20px 16px 10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontFamily: "Fraunces, serif",
                        fontSize: "1.3rem",
                        color: "#fff",
                        fontWeight: "bold",
                        textTransform: "capitalize", // ✅ Auto Capitalize Title Case
                      }}
                    >
                      {pkg.name}
                    </h3>
                  </div>
                  {/* Edit/Delete buttons */}
                  <div
                    style={{ display: "flex", gap: "4px", marginTop: "-4px" }}
                  >
                    <button
                      className="btn btn-ghost btn-small"
                      onClick={() => handleEdit(pkg)}
                      style={{
                        padding: "2px 8px",
                        background: "rgba(255,255,255,0.2)",
                        color: "#fff",
                        border: "none",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => handleDelete(pkg.id, pkg.name)}
                      style={{
                        padding: "2px 8px",
                        background: "rgba(255,255,255,0.2)",
                        color: "#fff",
                        border: "none",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Features List */}
                <div
                  style={{
                    padding: "16px 20px 30px",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {(pkg.features || []).map((feature, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "0.8rem",
                        color: "#222",
                        textTransform: "capitalize", // ✅ Auto Capitalize Title Case
                      }}
                    >
                      {/* Bullet point (dot) */}
                      <span style={{ fontSize: "0.6rem" }}>•</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                  {(!pkg.features || pkg.features.length === 0) && (
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
                </div>

                {/* ✅ Price Ribbon with Arrow/Chevron Shape (Chhota aur Fit Content) */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "0 10px 16px", // Thoda padding neeche se
                  }}
                >
                  <div
                    style={{
                      background: "#000",
                      padding: "4px 20px", // ✅ Padding chhota kiya
                      position: "relative",
                      width: "fit-content", // ✅ Width ab text ke hisaab se
                      textAlign: "center",
                    }}
                  >
                    {/* Left Arrow (Chhota) */}
                    <div
                      style={{
                        position: "absolute",
                        left: "-8px", // ✅ Arrow ko thoda andar shift kiya
                        top: "0",
                        width: "0",
                        height: "0",
                        borderTop: "12px solid transparent", // ✅ Height chhota
                        borderBottom: "12px solid transparent",
                        borderRight: "8px solid #000",
                      }}
                    ></div>
                    {/* Right Arrow (Chhota) */}
                    <div
                      style={{
                        position: "absolute",
                        right: "-8px",
                        top: "0",
                        width: "0",
                        height: "0",
                        borderTop: "12px solid transparent",
                        borderBottom: "12px solid transparent",
                        borderLeft: "8px solid #000",
                      }}
                    ></div>

                    <span
                      style={{
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: "0.95rem", // ✅ Font size thoda chhota
                        fontFamily: "Fraunces, serif",
                      }}
                    >
                      Rs {pkg.price}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <AddPalaiModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        editData={editingPackage}
        farmId={farmId}
      />

      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </div>
  );
};

export default PalaiPackages;
