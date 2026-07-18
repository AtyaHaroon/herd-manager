// src/components/Common/Modal.jsx - UPDATED
import React, { useEffect, useRef } from "react";
import Button from "./Button";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  onSave,
  saveLabel = "Save",
  showCloseButton = true,
  className = "",
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
      modalRef.current?.focus();
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`modal-bg open ${className}`}
      onClick={handleBackdropClick}
      ref={modalRef}
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
    >
      <div className="modal" role="document">
        {title && (
          <h3>
            {title}
            {showCloseButton && (
              <button
                className="modal-close-btn"
                onClick={onClose}
                aria-label="Close modal"
              >
              </button>
            )}
          </h3>
        )}

        <div className="modal-scrollable">{children}</div>

        {onSave && (
          <div className="modal-actions">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onSave}>{saveLabel}</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
