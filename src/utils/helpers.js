// utils/helpers.js - COMPLETE WITH ALL FUNCTIONS

import { VACCINE_STATUS } from "./constants";

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
};

export const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const daysUntil = (dateString) => {
  const date = new Date(dateString + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((date - today) / 86400000);
};

export const generateRandomPassword = (length = 10) => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

export const getVaccineStatus = (nextDate) => {
  const days = daysUntil(nextDate);
  if (days < 0) return { status: VACCINE_STATUS.OVERDUE, label: "Overdue" };
  if (days <= 14) return { status: VACCINE_STATUS.DUE, label: "Due soon" };
  return { status: VACCINE_STATUS.HEALTHY, label: "Up to date" };
};

export const calculateTotals = (items, type) => {
  return items
    .filter((item) => item.type === type)
    .reduce((sum, item) => sum + Number(item.amount), 0);
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

export const getInitials = (name) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

// ✅ NEW: Format currency in short form (e.g., 15,000 → 15k, 150,000 → 150k)
export const formatCurrencyShort = (amount) => {
  if (!amount) return "—";

  const num = Number(amount);
  if (isNaN(num) || num === 0) return "—";

  // Agar amount 1000 se kam hai to direct show karein
  if (num < 1000) {
    return num.toString();
  }

  // Thousands (1k - 999k)
  if (num < 1000000) {
    const thousands = num / 1000;
    if (thousands >= 100) {
      return `${Math.round(thousands)}k`;
    }
    if (thousands >= 10) {
      return `${thousands.toFixed(0)}k`;
    }
    return `${thousands.toFixed(1)}k`;
  }

  // Millions (1M - 999M)
  if (num < 1000000000) {
    const millions = num / 1000000;
    if (millions >= 10) {
      return `${Math.round(millions)}M`;
    }
    return `${millions.toFixed(1)}M`;
  }

  // Billions
  const billions = num / 1000000000;
  return `${billions.toFixed(1)}B`;
};

// ✅ NEW: Format currency with full PKR format (e.g., Rs. 15,000)
export const formatCurrencyFull = (amount) => {
  if (!amount) return "—";
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
