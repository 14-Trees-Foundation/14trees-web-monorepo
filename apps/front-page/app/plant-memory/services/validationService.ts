import { DedicatedName } from '../types/forms';

export interface ValidationPatterns {
  name: RegExp;
  email: RegExp;
  phone: RegExp;
  pan: RegExp;
  number: RegExp;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface FormData {
  fullName: string;
  email: string;
  phone: string;
  numberOfTrees: string;
  panNumber: string;
  comments: string;
}

export class ValidationService {
  private static patterns: ValidationPatterns = {
    name: /^[A-Za-z0-9\s.,&_'-]+$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^\+?[0-9\s\-()]{7,20}$/,
    pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    number: /^[0-9]+(\.[0-9]+)?$/
  };

  private static validatePhoneNumber(phone: string): boolean {
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
  }

  static validateField(name: string, value: string): string {
    let error = "";

    if (!value.trim()) {
      if (name === "phone") return "";
      if (name === "panNumber") return "";
      if (name === "comments") return "";
      return "This field is required";
    }

    switch (name) {
      case "email":
        if (!this.patterns.email.test(value)) {
          error = "Please enter a valid email address";
        }
        break;
      case "phone":
        if (!this.validatePhoneNumber(value)) {
          error = "Please enter a valid 10-digit Indian mobile number (can start with +91, 91, or 0)";
        }
        break;
      case "panNumber":
        if (value && !this.patterns.pan.test(value)) {
          error = "Please enter a valid PAN number (e.g., ABCDE1234F)";
        }
        break;
      case "numberOfTrees":
        if (!value.trim()) {
          error = "Number of trees is required";
        } else if (!this.patterns.number.test(value)) {
          error = "Please enter a valid number";
        } else if (parseInt(value) <= 0) {
          error = "Must be at least 1 tree";
        }
        break;
    }

    return error;
  }

  static validateFormData(formData: FormData): ValidationResult {
    const errors: Record<string, string> = {};
    let isValid = true;

    Object.keys(formData).forEach(key => {
      if (key === "comments") return;

      const value = formData[key as keyof FormData];
      if (!value && key !== "phone" && key !== "panNumber" && key !== "comments") {
        errors[key] = "This field is required";
        isValid = false;
        return;
      }

      const error = this.validateField(key, value);
      if (error) {
        errors[key] = error;
        isValid = false;
      }
    });

    return { isValid, errors };
  }

  static validateDedicatedNames(
    dedicatedNames: DedicatedName[], 
    numberOfTrees: string
  ): ValidationResult {
    const errors: Record<string, string> = {};
    let isValid = true;
    const seenNames = new Set();

    // Calculate total trees count
    const totalTrees = dedicatedNames.reduce((sum, name) => sum + (name.trees_count || 1), 0);

    // Check if total trees exceed the number of trees being gifted
    if (numberOfTrees && totalTrees > Number(numberOfTrees)) {
      errors["totalTrees"] = `Total trees (${totalTrees}) cannot exceed the number of trees you're gifting (${numberOfTrees})`;
      isValid = false;
    }

    dedicatedNames.forEach((name, index) => {
      const normalizedName = name.recipient_name.toLowerCase().trim();
      
      // Check for duplicates
      if (seenNames.has(normalizedName)) {
        errors[`dedicatedName-${index}`] = "Duplicate recipient name";
        isValid = false;
      } else if (normalizedName) {
        seenNames.add(normalizedName);
      }
      
      // Check if name is required
      if (!name.recipient_name.trim()) {
        errors[`dedicatedName-${index}`] = "Name is required";
        isValid = false;
      }

      // Validate email if provided
      if (name.recipient_email && !this.patterns.email.test(name.recipient_email)) {
        errors[`dedicatedEmail-${index}`] = "Please enter a valid email";
        isValid = false;
      }

      // Validate phone if provided
      if (name.recipient_phone && !this.validatePhoneNumber(name.recipient_phone)) {
        errors[`dedicatedPhone-${index}`] = "Please enter a valid 10-digit Indian mobile number (can start with +91, 91, or 0)";
        isValid = false;
      }

      // Validate trees count
      if (name.trees_count && isNaN(Number(name.trees_count))) {
        errors[`dedicatedTreeCount-${index}`] = "Please enter a valid number";
        isValid = false;
      }
    });

    return { isValid, errors };
  }

  static checkForDuplicateNames(dedicatedNames: DedicatedName[]): boolean {
    const seen = new Set<string>();
    return dedicatedNames.some(({ recipient_name }) => {
      const name = recipient_name.trim().toLowerCase();
      if (name === "") return false;
      if (seen.has(name)) return true;
      seen.add(name);
      return false;
    });
  }

  static validateTreeCount(dedicatedNames: DedicatedName[], numberOfTrees: string): boolean {
    const treesCount = parseInt(numberOfTrees) || 0;
    const treesAssigned = dedicatedNames.reduce((sum, name) => sum + (name.trees_count || 0), 0);
    return treesAssigned === treesCount;
  }

  static validateCSVData(dedicatedNames: DedicatedName[], numberOfTrees: string): boolean {
    const totalTrees = dedicatedNames.reduce((sum, name) => sum + (name.trees_count || 0), 0);
    return totalTrees <= Number(numberOfTrees);
  }

  static validateRecipientField(
    field: keyof DedicatedName, 
    value: string | number, 
    index: number, 
    dedicatedNames: DedicatedName[], 
    numberOfTrees: string
  ): string {
    let error = "";

    switch (field) {
      case "recipient_name":
        if (!value) {
          error = "Name is required";
        }
        break;
      case "recipient_email":
        if (value && !this.patterns.email.test(value.toString())) {
          error = "Please enter a valid email address";
        }
        break;
      case "recipient_phone":
        if (value && !this.validatePhoneNumber(value.toString())) {
          error = "Please enter a valid 10-digit Indian mobile number (can start with +91, 91, or 0)";
        }
        break;
      case "trees_count":
        if (isNaN(Number(value))) {
          error = "Please enter a valid number";
        } else if (numberOfTrees) {
          const totalTrees = dedicatedNames.reduce((sum, name, i) => {
            if (i === index) {
              return sum + Number(value);
            }
            return sum + (name.trees_count || 0);
          }, 0);

          if (totalTrees > Number(numberOfTrees)) {
            error = `Total trees (${totalTrees}) cannot exceed the number of trees you're gifting (${numberOfTrees})`;
          }
        }
        break;
    }

    return error;
  }
}