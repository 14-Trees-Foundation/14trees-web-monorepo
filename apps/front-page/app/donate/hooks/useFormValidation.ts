import { useState, useCallback } from 'react';
import { DedicatedName, FormData } from '../types';
import { ValidationService } from '../services/validationService';

interface ValidationErrors {
  [key: string]: string;
}

interface UseFormValidationProps {
  formData: FormData;
  dedicatedNames: DedicatedName[];
}

interface UseFormValidationReturn {
  errors: ValidationErrors;
  setErrors: React.Dispatch<React.SetStateAction<ValidationErrors>>;
  validateField: (name: string, value: string) => string;
  validateDedicatedNamesValidation: (multipleNames: boolean) => { isValid: boolean; errors: Record<string, string> };
  validateMainForm: () => boolean;
  clearError: (fieldName: string) => void;
  clearAllErrors: () => void;
  checkDuplicateNames: () => boolean;
}

export const useFormValidation = ({ 
  formData, 
  dedicatedNames 
}: UseFormValidationProps): UseFormValidationReturn => {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateField = useCallback((name: string, value: string): string => {
    return ValidationService.validateField(name, value);
  }, []);

  const validateDedicatedNamesValidation = useCallback((multipleNames: boolean) => {
    return ValidationService.validateDedicatedNames(dedicatedNames, multipleNames);
  }, [dedicatedNames]);

  const validateMainForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    // Validate each field in formData
    Object.keys(formData).forEach(key => {
      if (key === "comments") return; // Comments are optional
      
      const value = formData[key as keyof FormData];
      if (!value && key !== "phone" && key !== "panNumber" && key !== "comments") {
        newErrors[key] = "This field is required";
        isValid = false;
      } else {
        const error = validateField(key, value);
        if (error) {
          newErrors[key] = error;
          isValid = false;
        }
      }
    });

    setErrors(prev => ({ ...prev, ...newErrors }));
    return isValid;
  }, [formData, validateField]);

  const checkDuplicateNames = useCallback((): boolean => {
    return ValidationService.checkDuplicateNames(dedicatedNames);
  }, [dedicatedNames]);

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
    validateDedicatedNamesValidation,
    validateMainForm,
    clearError,
    clearAllErrors,
    checkDuplicateNames
  };
};