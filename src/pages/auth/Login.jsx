// pages/Login.jsx - UPDATED
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/Common/Button";
import Input from "../../components/Common/Input";
import Toast from "../../components/Common/Toast";
import { ROUTES } from "../../utils/constants";
import { isValidEmail } from "../../utils/validators";

const Login = () => {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [toastMessage, setToastMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, loginWithGoogleProvider, authInitialized, currentUser } =
    useAuth();

  // ✅ Real-time validation - isValidEmail USE KAREIN
  useEffect(() => {
    const newErrors = {};

    if (touched.emailOrUsername) {
      if (!emailOrUsername) {
        newErrors.emailOrUsername = "Email or username is required";
      } else if (
        emailOrUsername.includes("@") &&
        !isValidEmail(emailOrUsername)
      ) {
        // ✅ Agar email hai toh validate karein
        newErrors.emailOrUsername = "Please enter a valid email address";
      }
    }

    if (touched.password) {
      if (!password) {
        newErrors.password = "Password is required";
      } else if (password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }
    }

    setErrors(newErrors);
  }, [emailOrUsername, password, touched]);

  // ✅ Watch for currentUser change and navigate
  useEffect(() => {
    if (currentUser) {
      console.log("User detected, navigating to dashboard...");
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [currentUser, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    if (name === "emailOrUsername") {
      setEmailOrUsername(value);
    } else if (name === "password") {
      setPassword(value);
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

    setTouched({ emailOrUsername: true, password: true });

    if (!emailOrUsername || !password) {
      setToastMessage("Please fill in all fields");
      return;
    }

    // ✅ Email validation if it looks like email
    if (emailOrUsername.includes("@") && !isValidEmail(emailOrUsername)) {
      setToastMessage("Please enter a valid email address");
      return;
    }

    if (!authInitialized) {
      setToastMessage("Authentication is initializing, please wait...");
      return;
    }

    try {
      setLoading(true);
      console.log("Attempting login with:", emailOrUsername);

      await login(emailOrUsername, password);

      console.log("Login successful, waiting for auth state...");
    } catch (error) {
      console.error("Login error:", error);
      setToastMessage(error.message || "Login failed. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await loginWithGoogleProvider();
    } catch (error) {
      setToastMessage(error.message);
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
        <div className="brand-icon">🐐</div>
        <h1>Welcome Back</h1>
        <p className="subtitle">Sign in to manage your herd</p>

        <form onSubmit={handleSubmit}>
          <Input
            label="Email or Username"
            type="text"
            name="emailOrUsername"
            value={emailOrUsername}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Enter email or username"
            error={hasError("emailOrUsername") ? errors.emailOrUsername : ""}
          />
          <Input
            label="Password"
            type="password"
            name="password"
            value={password}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Enter password"
            error={hasError("password") ? errors.password : ""}
          />
          <Button
            type="submit"
            variant="primary"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={loading || !authInitialized}
          >
            {loading
              ? "Signing in..."
              : !authInitialized
              ? "Initializing..."
              : "Sign In"}
          </Button>
        </form>

        <div className="auth-links">
          <Link to={ROUTES.FORGOT_PASSWORD}>Forgot password?</Link>
          <Link to={ROUTES.REGISTER}>Create account →</Link>
        </div>

        <div className="divider">or continue with</div>

        <button
          className="google-btn"
          onClick={handleGoogleLogin}
          disabled={loading || !authInitialized}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 000 24c0 3.77.87 7.35 2.56 10.56l7.97-5.97z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z"
            />
          </svg>
          Sign in with Google
        </button>

        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      </div>
    </div>
  );
};

export default Login;
