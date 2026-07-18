// src/components/Common/ConfirmModal.jsx - UPDATED
import React from "react";
import Button from "./Button";
import Modal from "./Modal";

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm",
  message = "Are you sure?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "primary",
  loading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      className="confirm-modal"
      showCloseButton={!loading}
    >
      <div style={{ padding: "4px 0 8px" }}>
        <p
          style={{
            fontSize: "0.9rem",
            color: "#16302e",
            marginBottom: "16px",
            lineHeight: "1.6",
          }}
        >
          {message}
        </p>
        <div className="modal-actions">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Loading..." : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
