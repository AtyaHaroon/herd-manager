/**
 * Common validation functions
 */

// Validate email format
export const isValidEmail = (email) => {
  // More strict email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Validate phone number

// Validate phone number - Simple 11 digits with auto-format
export const isValidContact = (contact) => {
  if (!contact) return false;
  
  // Remove all non-digit characters
  const cleaned = contact.replace(/\D/g, "");
  
  // Check if it's exactly 11 digits and starts with 03
  return cleaned.length === 11 && cleaned.startsWith("03");
};

// Format phone number with dash (03XX-XXXXXXX)
export const formatContact = (contact) => {
  if (!contact) return "";
  
  // Remove all non-digit characters
  const cleaned = contact.replace(/\D/g, "");
  
  if (cleaned.length <= 4) return cleaned;
  if (cleaned.length <= 8) return cleaned.slice(0, 4) + "-" + cleaned.slice(4);
  return cleaned.slice(0, 4) + "-" + cleaned.slice(4, 11);
};


//validate username
export const isValidUsername = (username) => {
  if (!username) return false;
  // Allow letters, spaces, and some special characters
  const usernameRegex = /^[A-Za-z]+(?:\s[A-Za-z]+)*$/;
  return usernameRegex.test(username.trim());
};

// Validate date format
export const isValidDate = (date) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
};

// Validate positive number
export const isPositiveNumber = (value) => {
  const num = Number(value);
  return !isNaN(num) && num > 0;
};

// Validate non-negative number
export const isNonNegativeNumber = (value) => {
  const num = Number(value);
  return !isNaN(num) && num >= 0;
};

// Validate required fields
export const validateRequired = (data, requiredFields) => {
  const errors = [];
  requiredFields.forEach((field) => {
    if (!data[field]) {
      errors.push(`${field} is required`);
    }
  });
  return errors;
};

// Validate goat source type
export const validateGoatSource = (data) => {
  const errors = [];

  if (data.sourceType === "Purchased") {
    if (!data.purchaseId) {
      errors.push("Purchase ID is required for purchased goats");
    }
    if (data.motherId || data.fatherId) {
      errors.push("Parent IDs should be empty for purchased goats");
    }
  } else if (data.sourceType === "HomeBred") {
    if (!data.motherId && !data.fatherId) {
      errors.push("At least one parent is required for home-bred goats");
    }
    if (data.purchaseId) {
      errors.push("Purchase ID should be empty for home-bred goats");
    }
  }

  return errors;
};

// Validate goat data
export const validateGoat = (data) => {
  const errors = [];

  // Required fields
  const required = [
    "farmId",
    "tagId",
    "name",
    "gender",
    "breed",
    "dob",
    "sourceType",
  ];
  errors.push(...validateRequired(data, required));

  // Gender validation
  if (data.gender && !["M", "F"].includes(data.gender)) {
    errors.push("Gender must be M or F");
  }

  // Source type validation
  errors.push(...validateGoatSource(data));

  // Date validation
  if (data.dob && !isValidDate(data.dob)) {
    errors.push("Invalid date of birth format");
  }

  // Weight validation
  if (data.weight !== undefined && !isNonNegativeNumber(data.weight)) {
    errors.push("Weight must be a positive number");
  }

  return errors;
};
