import { DedicatedName, FormData } from '../types';
import { 
  validateDedicatedNames as sharedValidateDedicatedNames,
  checkDuplicateNames,
  ValidationResult,
  VALIDATION_PATTERNS
} from '../utils/validation';

export interface DedicatedNamesValidationResult extends ValidationResult {
  hasDuplicates: boolean;
}

export class ValidationService {
  static validateField(name: string, value: string): string {
    let error = "";

    if (!value.trim()) {
      if (name === "phone") return "";
      if (name === "panNumber") return "";
      return "This field is required";
    }

    switch (name) {
      case "fullName":
        if (!VALIDATION_PATTERNS.name.test(value)) {
          // More lenient check - just ensure it doesn't contain control characters
          if (!/^[^\x00-\x1F\x7F]+$/.test(value)) {
            error = "Please enter a valid name";
          }
        }
        break;
      case "email":
        if (!VALIDATION_PATTERNS.email.test(value)) {
          error = "Please enter a valid email address";
        }
        break;
      case "phone":
        if (!VALIDATION_PATTERNS.phone.test(value)) {
          error = "Please enter a valid phone number (10-15 digits)";
        }
        break;
      case "panNumber":
        if (value && !VALIDATION_PATTERNS.pan.test(value)) {
          error = "Please enter a valid PAN number (e.g., ABCDE1234F)";
        }
        break;
    }

    return error;
  }

  static validateMainForm(formData: FormData): ValidationResult {
    const errors: Record<string, string> = {};
    let isValid = true;

    Object.keys(formData).forEach(key => {
      if (key === "comments") return; // Comments are optional

      const value = formData[key as keyof FormData];
      if (!value && key !== "phone" && key !== "panNumber" && key !== "comments") {
        errors[key] = "This field is required";
        isValid = false;
      } else {
        const error = this.validateField(key, value);
        if (error) {
          errors[key] = error;
          isValid = false;
        }
      }
    });

    return { isValid, errors };
  }

  static validateDedicatedNames(
    dedicatedNames: DedicatedName[],
    multipleNames: boolean,
    isAssigneeDifferent: boolean = false
  ): DedicatedNamesValidationResult {
    // Use shared validation function
    const baseValidation = sharedValidateDedicatedNames(dedicatedNames, multipleNames);
    
    // Check for duplicates using shared function
    const hasDuplicates = checkDuplicateNames(dedicatedNames);
    
    // Return combined result
    return {
      ...baseValidation,
      hasDuplicates
    };
  }

  static checkDuplicateNames = checkDuplicateNames;

  static validateFormBeforeSubmit(
    formData: FormData,
    dedicatedNames: DedicatedName[],
    multipleNames: boolean,
    isAssigneeDifferent: boolean = false
  ): ValidationResult {
    const mainFormResult = this.validateMainForm(formData);
    
    const dedicatedNamesResult = dedicatedNames.length === 1 && dedicatedNames[0].recipient_name.trim() === ""
      ? { isValid: true, errors: {}, hasDuplicates: false }
      : this.validateDedicatedNames(dedicatedNames, multipleNames, isAssigneeDifferent);

    return {
      isValid: mainFormResult.isValid && dedicatedNamesResult.isValid,
      errors: { ...mainFormResult.errors, ...dedicatedNamesResult.errors }
    };
  }
}