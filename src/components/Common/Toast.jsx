// src/components/Common/Toast.jsx - FIXED

import React, { useEffect, useState } from "react";

const Toast = ({ message, duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) setTimeout(onClose, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]); // ✅ Proper dependencies

  if (!message) return null;

  return (
    <div id="toast" className={isVisible ? "show" : ""}>
      {message}
    </div>
  );
};

export default Toast;
