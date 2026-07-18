// pages/UserManagement.jsx - NO ICONS

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getCollection,
  updateDocument,
  deleteDocument,
  COLLECTIONS,
} from "../../firebase/firestore";
import { USER_ROLES } from "../../utils/constants";

import Toast from "../../components/Common/Toast";
import Loader from "../../components/Common/Loader";
import ConfirmModal from "../../components/Common/ConfirmModal";
import AddUserModal from "../Add/AddUserModal";

const UserManagement = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [updating, setUpdating] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState({
    userId: null,
    userName: "",
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (currentUser?.role !== USER_ROLES.OWNER) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const farmUsers = await getCollection(COLLECTIONS.USERS, [
        { field: "farmId", operator: "==", value: currentUser.farmId },
      ]);
      setUsers(farmUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      setToastMessage("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUserRole = async (userId, newRole) => {
    try {
      setUpdating(true);
      await updateDocument(COLLECTIONS.USERS, userId, { role: newRole });
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
      setToastMessage(`Role updated successfully!`);
    } catch (error) {
      console.error("Error updating role:", error);
      setToastMessage("Failed to update role");
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveUser = (userId, userName) => {
    setConfirmData({ userId, userName });
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    const { userId, userName } = confirmData;
    setConfirmLoading(true);
    try {
      await deleteDocument(COLLECTIONS.USERS, userId);
      setUsers(users.filter((u) => u.id !== userId));
      setToastMessage(`${userName} removed successfully!`);
      setIsConfirmOpen(false);
    } catch (error) {
      console.error("Error removing user:", error);
      setToastMessage("Failed to remove user");
    } finally {
      setConfirmLoading(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case USER_ROLES.OWNER:
        return "#125E5A";
      case USER_ROLES.MANAGER:
        return "#2E86AB";
      case USER_ROLES.WORKER:
        return "#F39C12";
      default:
        return "#666";
    }
  };

  const getStatusBadgeStyle = (status) => {
    if (status === "Active") {
      return {
        background: "rgba(63, 85, 53, 0.12)",
        color: "#125E5A",
      };
    }
    return {
      background: "rgba(156, 59, 46, 0.13)",
      color: "#b0473e",
    };
  };

  if (currentUser?.role !== USER_ROLES.OWNER) {
    return (
      <div className="panel active">
        <div style={{ padding: "40px", textAlign: "center" }}>
          <h2>Access Denied</h2>
          <p>You don't have permission to manage users.</p>
        </div>
      </div>
    );
  }

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
      <div className="panel-head">
        <div>
          <h2>User Management</h2>
          <div className="desc">Manage users in your farm</div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setIsAddUserModalOpen(true)}
        >
          + Add User
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Contact</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty">
                  No users found in your farm. Add your first user!
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.fullName}</strong>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.phone || "—"}</td>
                  <td>
                    <span
                      className="pill"
                      style={{
                        background: getRoleBadgeColor(user.role),
                        color: "#fff",
                      }}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span
                      className="pill"
                      style={getStatusBadgeStyle(user.status)}
                    >
                      {user.status || "Active"}
                    </span>
                  </td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        gap: "4px",
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      {user.userId !== currentUser.uid && (
                        <>
                          <select
                            value={user.role}
                            onChange={(e) =>
                              updateUserRole(user.id, e.target.value)
                            }
                            disabled={updating}
                            style={{
                              padding: "3px 8px",
                              border: "1.5px solid #d7e8e6",
                              borderRadius: "6px",
                              fontSize: "0.6rem",
                              background: "#fff",
                              outline: "none",
                              fontFamily: "Manrope, sans-serif",
                            }}
                          >
                            <option value={USER_ROLES.OWNER}>Owner</option>
                            <option value={USER_ROLES.MANAGER}>Manager</option>
                            <option value={USER_ROLES.WORKER}>Worker</option>
                          </select>
                          <button
                            className="btn btn-danger btn-small"
                            onClick={() =>
                              handleRemoveUser(user.id, user.fullName)
                            }
                            disabled={updating}
                          >
                            Remove
                          </button>
                        </>
                      )}
                      {user.userId === currentUser.uid && (
                        <span
                          style={{
                            fontSize: "0.6rem",
                            color: "#666",
                            fontWeight: 600,
                          }}
                        >
                          (You)
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onUserAdded={fetchUsers}
      />

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setConfirmData({ userId: null, userName: "" });
        }}
        onConfirm={handleConfirmDelete}
        title="Confirm Remove"
        message={`Are you sure you want to remove "${confirmData.userName}"? This action cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
        confirmVariant="danger"
        loading={confirmLoading}
      />

      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </div>
  );
};

export default UserManagement;
