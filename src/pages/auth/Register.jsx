// pages/Register.jsx - WITH SIMPLE OWNER NOTE

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/Common/Button";
import Input from "../../components/Common/Input";
import Toast from "../../components/Common/Toast";
import { ROUTES, USER_ROLES } from "../../utils/constants";
import uploadToCloudinary from "../../utils/imageUpload";
import {
  addDocument,
  COLLECTIONS,
  checkFieldUniqueness,
  setDocument,
} from "../../firebase/firestore";
import {
  isValidEmail,
  isValidUsername,
  isValidContact,
  formatContact,
} from "../../utils/validators";

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    contact: "",
    password: "",
    confirmPassword: "",
    farmName: "",
    location: "",
    city: "",
    country: "",
  });
  const [errors, setErrors] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "contact") {
      const digits = value.replace(/\D/g, "");
      const formatted = formatContact(digits);
      setFormData((prev) => ({ ...prev, [name]: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (name === "confirmPassword" || name === "password") {
      validatePasswordMatch(
        formData.password,
        name === "confirmPassword" ? value : formData.confirmPassword,
      );
    }
  };

  const validatePasswordMatch = (pass, confirmPass) => {
    if (confirmPass && pass !== confirmPass) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Passwords do not match",
      }));
    } else {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    let errorMsg = "";

    if (name === "username" && value) {
      if (!isValidUsername(value)) {
        errorMsg = "3-20 chars, letters, numbers & _ only";
      }
    }
    if (name === "email" && value) {
      if (!isValidEmail(value)) {
        errorMsg = "Please enter a valid email address";
      }
    }
    if (name === "contact" && value) {
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "image/png") {
      setToastMessage("Only PNG image format is allowed.");
      e.target.value = null;
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToastMessage("Image size should be less than 5MB.");
      e.target.value = null;
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleNextStep = async (e) => {
    e.preventDefault();
    const { username, email, contact, password, confirmPassword } = formData;
    let newErrors = {};

    if (!username) newErrors.username = "Username is required";
    else if (!isValidUsername(username))
      newErrors.username = "3-20 chars, letters, numbers & _ only";

    if (!email) newErrors.email = "Email is required";
    else if (!isValidEmail(email))
      newErrors.email = "Please enter a valid email";

    if (!contact) newErrors.contact = "Contact number is required";
    else {
      const cleanContact = contact.replace(/\D/g, "");
      if (!isValidContact(cleanContact))
        newErrors.contact =
          "Enter a valid 11-digit Pakistan number (03XX-XXXXXXX)";
    }

    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    if (!confirmPassword)
      newErrors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        try {
          const emailExists = await checkFieldUniqueness(
            COLLECTIONS.USERS,
            "email",
            email,
          );
          if (emailExists) {
            setErrors((prev) => ({
              ...prev,
              email: "This email is already registered",
            }));
            setLoading(false);
            return;
          }

          const contactExists = await checkFieldUniqueness(
            COLLECTIONS.USERS,
            "phone",
            contact.replace(/\D/g, ""),
          );
          if (contactExists) {
            setErrors((prev) => ({
              ...prev,
              contact: "This contact number is already in use",
            }));
            setLoading(false);
            return;
          }
        } catch (permissionError) {
          console.warn(
            "Permission denied for uniqueness check, proceeding anyway:",
            permissionError,
          );
        }

        setStep(2);
      } catch (error) {
        setToastMessage("Error checking uniqueness. Please try again.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBackStep = () => {
    setStep(1);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const {
      username,
      email,
      contact,
      password,
      farmName,
      location,
      city,
      country,
    } = formData;

    if (!farmName) {
      setErrors({ farmName: "Farm name is required" });
      return;
    }

    try {
      setLoading(true);
      console.log("1. Starting registration for:", email);

      const user = await register(
        email,
        password,
        username,
        contact,
        USER_ROLES.OWNER,
      );
      console.log("2. User created in Firebase Auth:", user.uid);

      let logoURL = null;
      if (logoFile) {
        try {
          logoURL = await uploadToCloudinary(logoFile);
          console.log("3. Logo uploaded:", logoURL);
        } catch (uploadError) {
          console.warn("Logo upload failed:", uploadError);
          setToastMessage("Account created, but logo upload failed.");
        }
      }

      console.log("4. Creating farm document with ownerId:", user.uid);
      const farmData = {
        farmId: user.uid,
        name: farmName,
        location: location || "",
        city: city || "",
        country: country || "",
        logoImageUrl: logoURL || null,
        ownerId: user.uid,
        createdAt: new Date(),
      };

      const farmId = await addDocument(COLLECTIONS.FARMS, farmData);
      console.log("5. Farm created with ID:", farmId);

      console.log("6. Updating user document with farmId:", farmId);

      await setDocument(COLLECTIONS.USERS, user.uid, {
        userId: user.uid,
        fullName: username,
        email: email,
        phone: contact,
        role: USER_ROLES.OWNER,
        status: "Active",
        farmId: farmId,
        createdBy: null,
        updatedAt: new Date(),
      });
      console.log("7. User document updated with farmId");

      setToastMessage("✅ Account created successfully! Please login.");
      setTimeout(() => {
        navigate(ROUTES.LOGIN);
      }, 2000);
    } catch (error) {
      console.error("Registration error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      if (error.code === "auth/email-already-in-use") {
        setToastMessage(
          "This email is already registered. Please login instead.",
        );
      } else {
        setToastMessage(
          error.message || "Registration failed. Please try again.",
        );
      }
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <header className="topbar auth-topbar">
        <div className="brand">
          <svg viewBox="0 0 64 64" width="28" height="28">
            <circle cx="32" cy="32" r="30" fill="#125E5A" />
            <path
              d="M20 38c0-9 5-16 12-16s12 7 12 16"
              stroke="#EFF7F6"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="26" cy="26" r="2.4" fill="#EFF7F6" />
            <circle cx="38" cy="26" r="2.4" fill="#EFF7F6" />
            <path
              d="M22 18l3 5M42 18l-3 5"
              stroke="#C98A2B"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          </svg>
          <span>Goat Manager</span>
        </div>
        <div className="spacer"></div>
        <div className="top-actions auth-nav-links">
          <Link to={ROUTES.REGISTER} className="auth-nav-link active">
            Sign Up
          </Link>
          <Link to={ROUTES.LOGIN} className="auth-nav-link">
            Sign In
          </Link>
        </div>
      </header>

      <div className="auth-card">
        <div className="brand-icon">🐐</div>
        <h1>{step === 1 ? "Create Account" : "Setup Farm"}</h1>
        <p className="subtitle">
          {step === 1
            ? "Enter your personal details"
            : "Tell us about your farm"}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: step === 1 ? "#125E5A" : "#d7e8e6",
            }}
          ></div>
          <div
            style={{
              width: "40px",
              height: "2px",
              background: "#d7e8e6",
              alignSelf: "center",
            }}
          ></div>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: step === 2 ? "#125E5A" : "#d7e8e6",
            }}
          ></div>
        </div>

        {/* ✅ SIMPLE OWNER NOTE - No icon, clean and minimal */}
        <div
          style={{
            background: "#f0f7f6",
            padding: "10px 14px",
            borderRadius: "10px",
            marginBottom: "16px",
            border: "1px solid #d7e8e6",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#125E5A",
            }}
          >
            Registering as <span style={{ fontWeight: 700 }}>Owner</span>
          </div>
          <div
            style={{
              fontSize: "0.6rem",
              color: "#5b6a68",
              marginTop: "2px",
            }}
          >
            You'll have full access to manage your farm and users
          </div>
        </div>

        <form onSubmit={step === 1 ? handleNextStep : handleSubmit}>
          {step === 1 && (
            <>
              <Input
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter Username"
                maxLength="20"
                error={errors.username}
              />
              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter your email"
                error={errors.email}
              />
              <Input
                label="Contact"
                type="tel"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="03XX-XXXXXXX"
                maxLength="15"
                error={errors.contact}
              />

              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Create a password (min 6 chars)"
                error={errors.password}
              />
              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Confirm your password"
                error={errors.confirmPassword}
              />

              <Button
                type="submit"
                variant="primary"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  marginTop: "20px",
                }}
                disabled={loading}
              >
                {loading ? "Checking uniqueness..." : "Next: Farm Details →"}
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <Input
                label="Farm Name"
                name="farmName"
                value={formData.farmName}
                onChange={handleChange}
                placeholder="Enter farm name"
                required
                error={errors.farmName}
              />
              <Input
                label="Location / Address"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Farm location"
              />
              <Input
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
              />
              <Input
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Country"
              />

              <div className="input-group" style={{ marginTop: "15px" }}>
                <label>Farm Logo (PNG only)</label>
                <input
                  type="file"
                  accept=".png, image/png"
                  onChange={handleFileChange}
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    width: "100%",
                  }}
                />
                {logoPreview && (
                  <div style={{ marginTop: "10px" }}>
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      style={{
                        width: "80px",
                        height: "80px",
                        objectFit: "contain",
                        borderRadius: "8px",
                        border: "1px solid #ddd",
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBackStep}
                  style={{ flex: 1, justifyContent: "center" }}
                  disabled={loading}
                >
                  ← Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  style={{ flex: 2, justifyContent: "center" }}
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Create Account & Farm"}
                </Button>
              </div>
            </>
          )}
        </form>

        <div
          className="auth-links"
          style={{ justifyContent: "center", marginTop: "14px" }}
        >
          <Link to={ROUTES.LOGIN}>← Already have an account? Sign In</Link>
        </div>

        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      </div>
    </div>
  );
};

export default Register;
