// src/components/Common/Input.jsx
import React, { useState } from "react";

const Input = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  error = "",
  maxLength,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // Agar type "password" hai to toggle karna hai, warna normal type rahega
  const inputType =
    type === "password" ? (showPassword ? "text" : "password") : type;

  return (
    <div className="field">
      <label htmlFor={name}>
        {label}
        {required && (
          <span style={{ color: "var(--danger)", marginLeft: "2px" }}>*</span>
        )}
      </label>
      <div style={{ position: "relative" }}>
        <input
          id={name}
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          className={`field-input ${error ? "input-error" : ""}`}
          style={{ paddingRight: type === "password" ? "40px" : "12px" }} // Space for icon
          aria-required={required}
          {...props}
        />

        {/* ✅ Password Eye Icon */}
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              color: "#766d5d",
              fontSize: "1rem",
              display: "flex",
              alignItems: "center",
            }}
          >
            {showPassword ? "👁️" : "👁️‍🗨️"}
          </button>
        )}
      </div>

      {error && (
        <div
          style={{
            color: "#b0473e",
            fontSize: "0.65rem",
            marginTop: "4px",
            fontWeight: "600",
          }}
        >
          ⚠ {error}
        </div>
      )}
    </div>
  );
};

export default Input;
