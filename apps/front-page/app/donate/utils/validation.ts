// Validation patterns and functions for donate module

import { DedicatedName } from '../types';
import { 
  VALIDATION_PATTERNS,
  validatePhoneFieldInternational,
  validateEmailField,
  validateNameField,
  validatePANField,
  ValidationResult,
  createValidationResult 
} from '../../../components/Common/Utils/validation';

// Re-export VALIDATION_PATTERNS for use in other donate module files
export { VALIDATION_PATTERNS };

// Field validation function using shared utilities
export const validateField = (name: string, value: string): string => {
  switch (name) {
    case "fullName":
      return validateNameField(value, "Full name");
    case "email":
      return validateEmailField(value);
    case "phone":
      return validatePhoneFieldInternational(value, false); // Phone is optional
    case "panNumber":
      return validatePANField(value, false); // PAN is optional
    default:
      return value.trim() ? "" : "This field is required";
  }
};

// Dedicated names validation using shared utilities
export const validateDedicatedNames = (
  dedicatedNames: DedicatedName[], 
  multipleNames: boolean
): ValidationResult => {
  const errors: Record<string, string> = {};

  dedicatedNames.forEach((name, index) => {
    // Validate recipient name
    const recipientNameError = validateNameField(
      name.recipient_name, 
      "Recipient name", 
      multipleNames
    );
    if (recipientNameError) {
      errors[`dedicatedName-${index}`] = recipientNameError;
    }

    // Validate recipient email (optional)
    if (name.recipient_email) {
      const emailError = validateEmailField(name.recipient_email);
      if (emailError) {
        errors[`dedicatedEmail-${index}`] = "Please enter a valid email";
      }
    }

    // Validate recipient phone (optional)
    if (name.recipient_phone) {
      const phoneError = validatePhoneFieldInternational(name.recipient_phone, false);
      if (phoneError) {
        errors[`dedicatedPhone-${index}`] = "Please enter a valid phone number";
      }
    }

    // Validate assignee name (optional)
    if (name.assignee_name) {
      const assigneeNameError = validateNameField(name.assignee_name, "Assignee name", false);
      if (assigneeNameError) {
        errors[`assigneeName-${index}`] = assigneeNameError;
      }
    }

    // Validate assignee email (optional)
    if (name.assignee_email) {
      const assigneeEmailError = validateEmailField(name.assignee_email);
      if (assigneeEmailError) {
        errors[`assigneeEmail-${index}`] = "Please enter a valid assignee email";
      }
    }

    // Validate assignee phone (optional)
    if (name.assignee_phone) {
      const assigneePhoneError = validatePhoneFieldInternational(name.assignee_phone, false);
      if (assigneePhoneError) {
        errors[`assigneePhone-${index}`] = "Please enter a valid assignee phone number";
      }
    }

    // Validate trees count
    if (name.trees_count <= 0) {
      errors[`treesCount-${index}`] = "Trees count must be greater than 0";
    }
  });

  return createValidationResult(errors);
};

// Check for duplicate names
export const checkDuplicateNames = (dedicatedNames: DedicatedName[]): boolean => {
  const nameCounts = dedicatedNames.reduce((acc, user) => {
    const name = user.recipient_name?.trim().toLowerCase();
    if (!name) return acc;
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.values(nameCounts).some(count => count > 1);
};