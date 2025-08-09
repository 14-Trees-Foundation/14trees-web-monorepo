import { DedicatedName } from '../types/forms';
import { 
  validateEmail,
  validatePhone,
  validatePAN,
  validateEmailField,
  validatePhoneField,
  validatePANField,
  validateNameField,
  validateImageFile,
  validateCSVFile,
  ValidationResult,
  createValidationResult 
} from '../../../components/Common/Utils/validation';

export interface FormData {
  fullName: string;
  email: string;
  phone: string;
  panNumber: string;
}

export interface EventData {
  eventName: string;
  eventType: string;
  plantedBy: string;
  primaryMessage: string;
  secondaryMessage: string;
}

// Re-export shared validation functions for backward compatibility
export { validateEmail, validatePhone, validatePAN };

// Form validation using shared utilities
export const validateFormData = (formData: FormData): ValidationResult => {
  const errors: Record<string, string> = {};

  const fullNameError = validateNameField(formData.fullName, 'Full name');
  if (fullNameError) errors.fullName = fullNameError;

  const emailError = validateEmailField(formData.email);
  if (emailError) errors.email = emailError;

  const phoneError = validatePhoneField(formData.phone);
  if (phoneError) errors.phone = phoneError;

  const panError = validatePANField(formData.panNumber);
  if (panError) errors.panNumber = panError;

  return createValidationResult(errors);
};

// Event data validation using shared utilities
export const validateEventData = (eventData: EventData): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!eventData.eventName.trim()) {
    errors.eventName = 'Event name is required';
  }

  if (!eventData.eventType.trim()) {
    errors.eventType = 'Event type is required';
  }

  if (!eventData.plantedBy.trim()) {
    errors.plantedBy = 'Planted by field is required';
  }

  if (!eventData.primaryMessage.trim()) {
    errors.primaryMessage = 'Primary message is required';
  }

  return createValidationResult(errors);
};

// Dedicated names validation using shared utilities
export const validateDedicatedNames = (dedicatedNames: DedicatedName[]): ValidationResult => {
  const errors: Record<string, string> = {};

  if (dedicatedNames.length === 0) {
    errors.dedicatedNames = 'At least one recipient is required';
    return createValidationResult(errors);
  }

  dedicatedNames.forEach((name, index) => {
    const recipientNameError = validateNameField(name.recipient_name, 'Recipient name');
    if (recipientNameError) {
      errors[`recipient_name_${index}`] = `Recipient name is required for entry ${index + 1}`;
    }

    const recipientEmailError = validateEmailField(name.recipient_email);
    if (recipientEmailError) {
      errors[`recipient_email_${index}`] = recipientEmailError.includes('required') 
        ? `Recipient email is required for entry ${index + 1}`
        : `Invalid email format for entry ${index + 1}`;
    }

    const assigneeNameError = validateNameField(name.assignee_name, 'Assignee name');
    if (assigneeNameError) {
      errors[`assignee_name_${index}`] = `Assignee name is required for entry ${index + 1}`;
    }

    const assigneeEmailError = validateEmailField(name.assignee_email);
    if (assigneeEmailError) {
      errors[`assignee_email_${index}`] = assigneeEmailError.includes('required')
        ? `Assignee email is required for entry ${index + 1}`
        : `Invalid email format for assignee in entry ${index + 1}`;
    }

    if (!name.relation.trim()) {
      errors[`relation_${index}`] = `Relation is required for entry ${index + 1}`;
    }

    if (!name.trees_count || name.trees_count < 1) {
      errors[`trees_count_${index}`] = `Number of trees must be at least 1 for entry ${index + 1}`;
    }
  });

  return createValidationResult(errors);
};

// Complete form validation
export const validateCompleteForm = (
  formData: FormData,
  eventData: EventData,
  dedicatedNames: DedicatedName[]
): ValidationResult => {
  const formValidation = validateFormData(formData);
  const eventValidation = validateEventData(eventData);
  const namesValidation = validateDedicatedNames(dedicatedNames);

  const allErrors = {
    ...formValidation.errors,
    ...eventValidation.errors,
    ...namesValidation.errors
  };

  return {
    isValid: Object.keys(allErrors).length === 0,
    errors: allErrors
  };
};

// Re-export shared file validation functions
export { validateImageFile, validateCSVFile };