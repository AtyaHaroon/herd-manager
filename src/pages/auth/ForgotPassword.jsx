// pages/ForgotPassword.jsx - WITH REAL-TIME VALIDATION

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/Common/Button";
import Input from "../../components/Common/Input";
import Toast from "../../components/Common/Toast";
import { ROUTES } from "../../utils/constants";
import { isValidEmail } from "../../utils/validators";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [toastMessage, setToastMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  // ✅ Real-time validation
  useEffect(() => {
    const newErrors = {};

    if (touched.email) {
      if (!email) {
        newErrors.email = "Email is required";
      } else if (!isValidEmail(email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    setErrors(newErrors);
  }, [email, touched]);

  const handleChange = (e) => {
    setEmail(e.target.value);
    setTouched((prev) => ({ ...prev, email: true }));
  };

  const handleBlur = () => {
    setTouched((prev) => ({ ...prev, email: true }));
  };

  const hasError = (fieldName) => {
    return touched[fieldName] && errors[fieldName];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Mark as touched
    setTouched({ email: true });

    if (!email) {
      setToastMessage("Please enter your email");
      return;
    }

    if (!isValidEmail(email)) {
      setToastMessage("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email);
      setIsSubmitted(true);
      setToastMessage("Password reset link sent to " + email);
    } catch (error) {
      setToastMessage(error.message);
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
          <Link to={ROUTES.REGISTER} className="auth-nav-link">
            Sign Up
          </Link>
          <Link to={ROUTES.LOGIN} className="auth-nav-link active">
            Sign In
          </Link>
        </div>
      </header>

      <div className="auth-card">
        <h1>Reset Password</h1>
        <p className="subtitle">
          {isSubmitted
            ? "Check your email for the reset link"
            : "We'll send you a link to reset your password"}
        </p>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              name="email"
              value={email}
              onBlur={handleBlur}
              onChange={handleChange}
              placeholder="Enter your registered email"
              error={hasError("email") ? errors.email : ""}
            />
            <Button
              type="submit"
              variant="primary"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        ) : (
          <div className="reset-success">
            <p className="success-message ">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <Button
              variant="primary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => navigate(ROUTES.LOGIN)}
            >
              Back to Sign In
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

export default ForgotPassword;
