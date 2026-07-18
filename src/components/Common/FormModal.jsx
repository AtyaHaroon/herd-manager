// src/components/Common/FormModal.jsx - UPDATED
import React from "react";
import Modal from "./Modal";
import Button from "./Button";
import Input from "./Input";

const FormModal = ({
  isOpen,
  onClose,
  title,
  fields = [],
  formData = {},
  onChange,
  onBlur,
  onSubmit,
  loading = false,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  children,
  showCloseButton = true,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      showCloseButton={showCloseButton && !loading}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {fields.map((field) => {
            if (field.type === "select") {
              return (
                <div
                  className={`field ${field.fullWidth ? "full-width" : "half"}`}
                  key={field.name}
                >
                  <label htmlFor={field.name}>
                    {field.label}
                    {field.required && (
                      <span
                        style={{ color: "var(--danger)", marginLeft: "2px" }}
                      >
                        *
                      </span>
                    )}
                  </label>
                  <select
                    id={field.name}
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={onChange}
                    onBlur={onBlur}
                    className="field-input"
                    required={field.required}
                    disabled={field.disabled}
                  >
                    <option value="">Select...</option>
                    {field.options &&
                      field.options.map((option) => {
                        if (typeof option === "string") {
                          return (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          );
                        }
                        return (
                          <option key={option.value} value={option.value}>
                            {option.label || option.value}
                          </option>
                        );
                      })}
                  </select>
                  {field.error && (
                    <div className="error-text">⚠ {field.error}</div>
                  )}
                  {field.hint && <div className="hint">{field.hint}</div>}
                </div>
              );
            }

            if (field.type === "textarea") {
              return (
                <div
                  className={`field ${field.fullWidth ? "full-width" : "half"}`}
                  key={field.name}
                >
                  <label htmlFor={field.name}>
                    {field.label}
                    {field.required && (
                      <span
                        style={{ color: "var(--danger)", marginLeft: "2px" }}
                      >
                        *
                      </span>
                    )}
                  </label>
                  <textarea
                    id={field.name}
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={onChange}
                    onBlur={onBlur}
                    className="field-input"
                    placeholder={field.placeholder || ""}
                    required={field.required}
                    disabled={field.disabled}
                    rows={field.rows || 3}
                  />
                  {field.error && (
                    <div className="error-text">⚠ {field.error}</div>
                  )}
                  {field.hint && <div className="hint">{field.hint}</div>}
                </div>
              );
            }

            if (field.type === "checkbox") {
              return (
                <div
                  className={`field full-width checkbox-field`}
                  key={field.name}
                >
                  <label>
                    <input
                      type="checkbox"
                      name={field.name}
                      checked={formData[field.name] || false}
                      onChange={onChange}
                      disabled={field.disabled}
                    />
                    {field.label}
                  </label>
                  {field.error && (
                    <div className="error-text">⚠ {field.error}</div>
                  )}
                </div>
              );
            }

            if (field.type === "radio") {
              return (
                <div className={`field full-width`} key={field.name}>
                  <label>{field.label}</label>
                  <div className="radio-group">
                    {field.options &&
                      field.options.map((option) => (
                        <label key={option.value}>
                          <input
                            type="radio"
                            name={field.name}
                            value={option.value}
                            checked={formData[field.name] === option.value}
                            onChange={onChange}
                            disabled={field.disabled}
                          />
                          {option.label || option.value}
                        </label>
                      ))}
                  </div>
                  {field.error && (
                    <div className="error-text">⚠ {field.error}</div>
                  )}
                </div>
              );
            }

            // Default Input
            return (
              <div
                className={`field ${field.fullWidth ? "full-width" : "half"}`}
                key={field.name}
              >
                <Input
                  label={field.label}
                  type={field.type || "text"}
                  name={field.name}
                  value={formData[field.name] || ""}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder={field.placeholder || ""}
                  required={field.required || false}
                  error={field.error || ""}
                  maxLength={field.maxLength}
                  disabled={field.disabled}
                />
                {field.hint && <div className="hint">{field.hint}</div>}
              </div>
            );
          })}
        </div>

        {children}

        <div className="modal-actions">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default FormModal;
