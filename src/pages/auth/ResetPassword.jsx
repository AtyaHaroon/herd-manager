// pages/ResetPassword.jsx - WITH REAL-TIME VALIDATION

import React, { useState, useEffect } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import Button from "../../components/Common/Button";
import Input from "../../components/Common/Input";
import Toast from "../../components/Common/Toast";
import { ROUTES } from "../../utils/constants";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [toastMessage, setToastMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidCode, setIsValidCode] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const { token } = useParams();
  const [searchParams] = useSearchParams();

  const oobCode = token || searchParams.get("oobCode");

  // ✅ Real-time validation
  useEffect(() => {
    const newErrors = {};

    if (touched.password) {
      if (!password) {
        newErrors.password = "Password is required";
      } else if (password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }
    }

    if (touched.confirmPassword) {
      if (!confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (confirmPassword !== password) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
  }, [password, confirmPassword, touched]);

  // ✅ Check if code is valid on page load
  useEffect(() => {
    const checkCode = async () => {
      if (!oobCode) {
        setIsValidCode(false);
        setToastMessage("No reset code found");
        return;
      }

      try {
        console.log("🔍 Checking code:", oobCode);
        const email = await verifyPasswordResetCode(auth, oobCode);
        console.log("✅ Valid code for email:", email);
        setEmail(email);
        setIsValidCode(true);
        setToastMessage(`Reset password for ${email}`);
      } catch (error) {
        console.error("❌ Invalid code:", error);
        setIsValidCode(false);
        setToastMessage(
          "Invalid or expired reset link. Please request a new one.",
        );
      }
    };

    checkCode();
  }, [oobCode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    if (name === "password") {
      setPassword(value);
    } else if (name === "confirmPassword") {
      setConfirmPassword(value);
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const hasError = (fieldName) => {
    return touched[fieldName] && errors[fieldName];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Mark all fields as touched
    setTouched({ password: true, confirmPassword: true });

    if (!password || !confirmPassword) {
      setToastMessage("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setToastMessage("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setToastMessage("Password must be at least 6 characters");
      return;
    }

    if (!oobCode) {
      setToastMessage("Invalid reset link. Please try again.");
      return;
    }

    try {
      setLoading(true);
      console.log("🔄 Resetting password for code:", oobCode);
      await confirmPasswordReset(auth, oobCode, password);
      setIsSubmitted(true);
      setToastMessage("✅ Password reset successfully!");
      setTimeout(() => navigate(ROUTES.LOGIN), 3000);
    } catch (error) {
      console.error("❌ Reset error:", error);
      setToastMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ❌ Agar code invalid hai
  if (!isValidCode && oobCode) {
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
            <Link to={ROUTES.REGISTER} className="auth-nav-link">
              Sign Up
            </Link>
            <Link to={ROUTES.LOGIN} className="auth-nav-link active">
              Sign In
            </Link>
          </div>
        </header>

        <div className="auth-card">
          <h1>🔑 Invalid Reset Link</h1>
          <p className="subtitle" style={{ color: "#dc3545" }}>
            {toastMessage ||
              "This password reset link is invalid or has expired."}
          </p>
          <br />
          <p style={{ fontSize: "14px", color: "#666" }}>
            Reset links expire after 1 hour for security reasons.
          </p>
          <br />
          <Button
            variant="primary"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
          >
            Request New Reset Link
          </Button>
          <br />
          <br />
          <div className="auth-links" style={{ justifyContent: "center" }}>
            <Link to={ROUTES.LOGIN}>← Back to Sign In</Link>
          </div>
        </div>
      </div>
    );
  }

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
          <Link to={ROUTES.REGISTER} className="auth-nav-link">
            Sign Up
          </Link>
          <Link to={ROUTES.LOGIN} className="auth-nav-link active">
            Sign In
          </Link>
        </div>
      </header>

      <div className="auth-card">
        <h1>Set New Password</h1>
        {email && (
          <p className="subtitle" style={{ color: "#0f7a75" }}>
            Resetting password for: <strong>{email}</strong>
          </p>
        )}
        <p className="subtitle">
          {isSubmitted
            ? "✅ Password updated successfully!"
            : "Enter your new password below"}
        </p>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit}>
            <Input
              label="New Password"
              type="password"
              name="password"
              value={password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter new password (min 6 characters)"
              error={hasError("password") ? errors.password : ""}
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Confirm new password"
              error={hasError("confirmPassword") ? errors.confirmPassword : ""}
              required
            />
            <Button
              type="submit"
              variant="primary"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        ) : (
          <div className="reset-success">
            <div className="success-icon">✅</div>
            <p className="success-message">
              Your password has been reset successfully!
            </p>
            <Button
              variant="primary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => navigate(ROUTES.LOGIN)}
            >
              Go to Sign In
            </Button>
          </div>
        )}

        <div
          className="auth-links"
          style={{ justifyContent: "center", marginTop: "14px" }}
        >
          <Link to={ROUTES.LOGIN}>← Back to Sign In</Link>
        </div>

        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      </div>
    </div>
  );
};

export default ResetPassword;
