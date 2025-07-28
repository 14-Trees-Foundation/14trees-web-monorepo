import { useState, useCallback } from 'react';
import { DedicatedName } from '../types/forms';

interface ValidationErrors {
  [key: string]: string;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  numberOfTrees: string;
  panNumber: string;
  comments: string;
}

interface UseFormValidationProps {
  formData: FormData;
  dedicatedNames: DedicatedName[];
}

interface UseFormValidationReturn {
  errors: ValidationErrors;
  setErrors: React.Dispatch<React.SetStateAction<ValidationErrors>>;
  validateField: (name: string, value: string) => string;
  validateDedicatedNames: () => boolean;
  validateMainForm: () => boolean;
  clearError: (fieldName: string) => void;
  clearAllErrors: () => void;
}

export const useFormValidation = ({ 
  formData, 
  dedicatedNames 
}: UseFormValidationProps): UseFormValidationReturn => {
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Validation patterns
  const validationPatterns = {
    name: /^[A-Za-z0-9\s.,&_'-]+$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^\+?[0-9\s\-()]{7,20}$/,
    pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    number: /^[0-9]+(\.[0-9]+)?$/
  };

  const validateField = useCallback((name: string, value: string): string => {
    let error = "";

    if (!value.trim()) {
      if (name === "phone") return "";
      if (name === "panNumber") return "";
      if (name === "comments") return "";
      return "This field is required";
    }

    switch (name) {
      case "email":
        if (!validationPatterns.email.test(value)) {
          error = "Please enter a valid email address";
        }
        break;
      case "phone":
        if (!validationPatterns.phone.test(value)) {
          error = "Please enter a valid phone number (10-15 digits)";
        }
        break;
      case "panNumber":
        if (value && !validationPatterns.pan.test(value)) {
          error = "Please enter a valid PAN number (e.g., ABCDE1234F)";
        }
        break;
      case "numberOfTrees":
        if (!value.trim()) {
          error = "Number of trees is required";
        } else if (!validationPatterns.number.test(value)) {
          error = "Please enter a valid number";
        } else if (parseInt(value) <= 0) {
          error = "Must be at least 1 tree";
        }
        break;
    }

    return error;
  }, []);

  const validateDedicatedNames = useCallback((): boolean => {
    let isValid = true;
    const newErrors: ValidationErrors = {};
    const seenNames = new Set();

    // Calculate total trees count
    const totalTrees = dedicatedNames.reduce((sum, name) => sum + (name.trees_count || 1), 0);

    // Check if total trees exceed the number of trees being gifted
    if (formData.numberOfTrees && totalTrees > Number(formData.numberOfTrees)) {
      newErrors["totalTrees"] = `Total trees (${totalTrees}) cannot exceed the number of trees you're gifting (${formData.numberOfTrees})`;
      isValid = false;
    }

    dedicatedNames.forEach((name, index) => {
      const normalizedName = name.recipient_name.toLowerCase().trim();
      if (seenNames.has(normalizedName)) {
        newErrors[`dedicatedName-${index}`] = "Duplicate recipient name";
        isValid = false;
      } else if (normalizedName) {
        seenNames.add(normalizedName);
      }
      
      if (!name.recipient_name.trim()) {
        newErrors[`dedicatedName-${index}`] = "Name is required";
        isValid = false;
      }

      if (name.recipient_email && !validationPatterns.email.test(name.recipient_email)) {
        newErrors[`dedicatedEmail-${index}`] = "Please enter a valid email";
        isValid = false;
      }
    });

    setErrors(prev => ({ ...prev, ...newErrors }));
    return isValid;
  }, [dedicatedNames, formData.numberOfTrees]);

  const validateMainForm = useCallback((): boolean => {
    const mainFormValid = Object.keys(formData).every(key => {
      if (key === "comments") {
        return true;
      }

      const value = formData[key as keyof FormData];
      if (!value && key !== "phone" && key !== "panNumber" && key !== "comments") {
        setErrors(prev => ({ ...prev, [key]: "This field is required" }));
        return false;
      }

      const error = validateField(key, value);
      if (error) {
        setErrors(prev => ({ ...prev, [key]: error }));
        return false;
      }

      return true;
    });

    return mainFormValid;
  }, [formData, validateField]);

  const clearError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    setErrors,
    validateField,
    validateDedicatedNames,
    validateMainForm,
    clearError,
    clearAllErrors
  };
};