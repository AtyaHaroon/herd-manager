// src/components/Common/PromptModal.jsx - UPDATED
import React, { useState, useEffect } from "react";
import Button from "./Button";
import Modal from "./Modal";
import Input from "./Input";

const PromptModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Enter Password",
  message = "Please enter your password to confirm:",
  placeholder = "Enter your password",
  inputType = "password",
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
}) => {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setValue("");
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (value.trim()) {
      onConfirm(value);
      setValue("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && value.trim()) {
      handleConfirm();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      className="prompt-modal"
      showCloseButton={!loading}
    >
      <div style={{ padding: "4px 0 8px" }}>
        <p
          style={{
            fontSize: "0.85rem",
            color: "#16302e",
            marginBottom: "12px",
            lineHeight: "1.5",
          }}
        >
          {message}
        </p>
        <Input
          type={inputType}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus
        />
        <div className="modal-actions">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={loading || !value.trim()}
          >
            {loading ? "Loading..." : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PromptModal;
