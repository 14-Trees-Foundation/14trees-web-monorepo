// Shared validation utilities for common patterns used across modules

// Common validation patterns
export const VALIDATION_PATTERNS = {
  name: /^[A-Za-z0-9\u00C0-\u017F\u0100-\u024F\s.,&_'"\-()]+$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[6-9]\d{9}$/, // Indian mobile numbers (10 digits starting with 6-9)
  phoneInternational: /^\+?[0-9\s\-()]{7,20}$/, // International format
  pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  number: /^[0-9]+(\.[0-9]+)?$/,
  controlCharacters: /^[^\x00-\x1F\x7F]+$/ // No control characters
} as const;

// Basic validation functions
export const validateEmail = (email: string): boolean => {
  return VALIDATION_PATTERNS.email.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Remove all spaces, hyphens, and parentheses
  const cleanPhone = phone.replace(/[\s\-()]/g, '');
  
  // Check if it starts with +91, 91, or 0 and extract the last 10 digits
  let phoneNumber = '';
  
  if (cleanPhone.startsWith('+91')) {
    phoneNumber = cleanPhone.substring(3);
  } else if (cleanPhone.startsWith('91')) {
    phoneNumber = cleanPhone.substring(2);
  } else if (cleanPhone.startsWith('0')) {
    phoneNumber = cleanPhone.substring(1);
  } else {
    phoneNumber = cleanPhone;
  }
  
  // Validate that the remaining part is exactly 10 digits and starts with 6-9
  return /^[6-9]\d{9}$/.test(phoneNumber);
};

export const validatePhoneInternational = (phone: string): boolean => {
  // Use the same logic as validatePhone for consistency
  return validatePhone(phone);
};

export const validatePAN = (pan: string): boolean => {
  return VALIDATION_PATTERNS.pan.test(pan.toUpperCase());
};

export const validateName = (name: string): boolean => {
  // More lenient check - just ensure it doesn't contain control characters
  return VALIDATION_PATTERNS.controlCharacters.test(name);
};

// Generic field validation with common error messages
export const validateRequiredField = (value: string, fieldName: string): string => {
  if (!value.trim()) {
    return `${fieldName} is required`;
  }
  return '';
};

export const validateEmailField = (email: string): string => {
  if (!email.trim()) {
    return 'Email is required';
  }
  if (!validateEmail(email)) {
    return 'Please enter a valid email address';
  }
  return '';
};

export const validatePhoneField = (phone: string, required: boolean = true): string => {
  if (!phone.trim()) {
    return required ? 'Phone number is required' : '';
  }
  if (!validatePhone(phone)) {
    return 'Please enter a valid 10-digit Indian mobile number (can start with +91, 91, or 0)';
  }
  return '';
};

export const validatePhoneFieldInternational = (phone: string, required: boolean = true): string => {
  if (!phone.trim()) {
    return required ? 'Phone number is required' : '';
  }
  if (!validatePhoneInternational(phone)) {
    return 'Please enter a valid 10-digit Indian mobile number (can start with +91, 91, or 0)';
  }
  return '';
};

export const validatePANField = (pan: string, required: boolean = true): string => {
  if (!pan.trim()) {
    return required ? 'PAN number is required' : '';
  }
  if (!validatePAN(pan)) {
    return 'Please enter a valid PAN number (e.g., ABCDE1234F)';
  }
  return '';
};

export const validateNameField = (name: string, fieldName: string = 'Name', required: boolean = true): string => {
  if (!name.trim()) {
    return required ? `${fieldName} is required` : '';
  }
  if (!validateName(name)) {
    return `Please enter a valid ${fieldName.toLowerCase()}`;
  }
  return '';
};

// File validation utilities
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 2 * 1024 * 1024; // 2MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (file.size > maxSize) {
    return { isValid: false, error: 'Image size must be less than 2MB' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Only JPEG, PNG, GIF, and WebP images are allowed' };
  }

  return { isValid: true };
};

export const validateCSVFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['text/csv', 'application/vnd.ms-excel'];

  if (file.size > maxSize) {
    return { isValid: false, error: 'CSV file size must be less than 5MB' };
  }

  if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
    return { isValid: false, error: 'Only CSV files are allowed' };
  }

  return { isValid: true };
};

// Common validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Helper function to create validation result
export const createValidationResult = (errors: Record<string, string>): ValidationResult => {
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};