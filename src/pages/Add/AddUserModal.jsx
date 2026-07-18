// pages/Add/AddUserModal.jsx
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { createUserWithoutLogin } from "../../firebase/auth";
import { USER_ROLES } from "../../utils/constants";
import FormModal from "../../components/Common/FormModal";
import Toast from "../../components/Common/Toast";
import PromptModal from "../../components/Common/PromptModal";
import {
  isValidEmail,
  isValidUsername,
  isValidContact,
  formatContact,
} from "../../utils/validators";
import { auth } from "../../firebase/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

const AddUserModal = ({ isOpen, onClose, onUserAdded }) => {
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: USER_ROLES.WORKER,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [addedUser, setAddedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [promptLoading, setPromptLoading] = useState(false);

  const formFields = [
    {
      name: "fullName",
      label: "Full Name",
      type: "text",
      placeholder: "Enter full name",
      required: false,
      error: errors.fullName,
    },
    {
      name: "email",
      label: "Email Address",
      type: "email",
      placeholder: "Enter email address",
      required: false,
      error: errors.email,
    },
    {
      name: "phone",
      label: "Phone Number",
      type: "tel",
      placeholder: "03XX-XXXXXXX",
      maxLength: 15,
      error: errors.phone,
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      placeholder: "Create password (min 6 chars)",
      required: false,
      error: errors.password,
    },
    {
      name: "confirmPassword",
      label: "Confirm Password",
      type: "password",
      placeholder: "Confirm password",
      required: false,
      error: errors.confirmPassword,
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const digits = value.replace(/\D/g, "");
      const formatted = formatContact(digits);
      setFormData((prev) => ({ ...prev, [name]: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    let errorMsg = "";

    if (name === "fullName" && value) {
      if (!isValidUsername(value)) {
        errorMsg = "Please enter a valid name";
      }
    }
    if (name === "email" && value) {
      if (!isValidEmail(value)) {
        errorMsg = "Please enter a valid email address";
      }
    }
    if (name === "phone" && value) {
      const cleanContact = value.replace(/\D/g, "");
      if (!isValidContact(cleanContact)) {
        errorMsg =
          "Please enter a valid 11-digit Pakistan number (03XX-XXXXXXX)";
      }
    }
    if (name === "password" && value && value.length < 6) {
      errorMsg = "Password must be at least 6 characters";
    }
    if (name === "confirmPassword" && value) {
      if (value !== formData.password) {
        errorMsg = "Passwords do not match";
      }
    }

    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName) newErrors.fullName = "Name is required";
    if (!formData.email) newErrors.email = "Email is required";
    else if (!isValidEmail(formData.email)) newErrors.email = "Invalid email";

    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const reLoginAsOwner = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error("Failed to re-login as Owner:", error);
      return false;
    }
  };

  const handlePromptConfirm = async (password) => {
    setPromptLoading(true);
    try {
      const ownerEmail = currentUser?.email;
      const reloginSuccess = await reLoginAsOwner(ownerEmail, password);

      if (!reloginSuccess) {
        setToastMessage("⚠️ Incorrect password. Please try again.");
        setPromptLoading(false);
        return;
      }

      await createUser();
      setIsPromptOpen(false);
    } catch (error) {
      console.error("Error during prompt confirmation:", error);
      setToastMessage("❌ Authentication failed. Please try again.");
    } finally {
      setPromptLoading(false);
    }
  };

  const createUser = async () => {
    try {
      setLoading(true);
      setAddedUser(null);

      const ownerFarmId = currentUser.farmId;

      if (!ownerFarmId) {
        setToastMessage("❌ Owner farm not found. Please contact support.");
        setLoading(false);
        return;
      }

      await createUserWithoutLogin(
        formData.email,
        formData.password,
        formData.fullName,
        formData.phone || "",
        formData.role,
        ownerFarmId,
        currentUser.uid,
      );

      setAddedUser({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        farmId: ownerFarmId,
      });

      setToastMessage(`✅ ${formData.fullName} added successfully!`);

      setFormData({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        role: USER_ROLES.WORKER,
      });

      if (onUserAdded) {
        onUserAdded();
      }

      setTimeout(() => {
        onClose();
        setToastMessage("");
        setAddedUser(null);
        setShowPassword(false);
      }, 5000);
    } catch (error) {
      console.error("Error adding user:", error);
      setToastMessage(error.message || "Failed to add user");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }
    setIsPromptOpen(true);
  };

  const handleModalClose = () => {
    if (!loading) {
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        role: USER_ROLES.WORKER,
      });
      setErrors({});
      setToastMessage("");
      setAddedUser(null);
      setShowPassword(false);
      onClose();
    }
  };

  const copyPassword = (password) => {
    navigator.clipboard.writeText(password);
    setToastMessage("Password copied to clipboard!");
    setTimeout(() => setToastMessage(""), 2000);
  };

  return (
    <>
      <FormModal
        isOpen={isOpen}
        onClose={handleModalClose}
        title="Add New User"
        fields={formFields}
        formData={formData}
        onChange={handleChange}
        onBlur={handleBlur}
        onSubmit={handleSubmit}
        loading={loading}
        submitLabel={loading ? "Adding User..." : "Add User"}
      >
        {/* Role Select */}
        <div className="field">
          <label>Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="field-input"
            style={{ padding: "12px" }}
          >
            <option value={USER_ROLES.MANAGER}>Manager</option>
            <option value={USER_ROLES.WORKER}>Worker</option>
          </select>
          <small style={{ color: "#666", fontSize: "0.75rem" }}>
            {formData.role === USER_ROLES.MANAGER
              ? "Access to all features but cannot manage users"
              : "Limited access to assigned tasks only"}
          </small>
        </div>

        {/* Success Message */}
        {addedUser && (
          <div
            style={{
              background: "#e8f5e9",
              border: "2px solid #4caf50",
              borderRadius: "10px",
              padding: "16px",
              marginTop: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>✅</span>
              <strong style={{ color: "#2e7d32" }}>
                User Added Successfully!
              </strong>
            </div>

            <div style={{ fontSize: "0.85rem", color: "#1b5e20" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "4px 0",
                }}
              >
                <span>Name:</span>
                <strong>{addedUser.fullName}</strong>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "4px 0",
                }}
              >
                <span>Email:</span>
                <strong>{addedUser.email}</strong>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "4px 0",
                  alignItems: "center",
                }}
              >
                <span>Password:</span>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <strong
                    style={{
                      background: "#fff",
                      padding: "2px 10px",
                      borderRadius: "4px",
                      fontFamily: "monospace",
                      fontSize: "0.9rem",
                    }}
                  >
                    {showPassword ? addedUser.password : "••••••••"}
                  </strong>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px 6px",
                    }}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyPassword(addedUser.password)}
                    style={{
                      background: "#2e7d32",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      padding: "2px 10px",
                      cursor: "pointer",
                      fontSize: "0.65rem",
                      fontWeight: 600,
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "4px 0",
                }}
              >
                <span>Role:</span>
                <strong>{addedUser.role}</strong>
              </div>
            </div>

            <div
              style={{
                marginTop: "10px",
                fontSize: "0.7rem",
                color: "#555",
                background: "#fff",
                padding: "8px",
                borderRadius: "6px",
                border: "1px dashed #4caf50",
              }}
            >
              ⚠️ Please share these credentials with the user. They can login
              immediately.
            </div>
          </div>
        )}
      </FormModal>

      <PromptModal
        isOpen={isPromptOpen}
        onClose={() => setIsPromptOpen(false)}
        onConfirm={handlePromptConfirm}
        title="Confirm Password"
        message="Please enter your password to confirm adding a new user:"
        placeholder="Enter your password"
        inputType="password"
        confirmText="Confirm"
        cancelText="Cancel"
        loading={promptLoading}
      />

      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
    </>
  );
};

export default AddUserModal;
