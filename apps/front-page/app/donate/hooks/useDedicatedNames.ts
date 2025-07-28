import { useState, useCallback } from 'react';
import { DedicatedName } from '../types';
import { ValidationService } from '../services/validationService';
import { VALIDATION_PATTERNS } from '../utils/validation';

interface UseDedicatedNamesProps {
  initialNames?: DedicatedName[];
}

interface UseDedicatedNamesReturn {
  dedicatedNames: DedicatedName[];
  setDedicatedNames: (names: DedicatedName[]) => void;
  handleAddName: () => void;
  handleRemoveName: (index: number) => void;
  handleNameChange: (index: number, field: keyof DedicatedName, value: string | number) => void;
  validateDedicatedNames: () => { isValid: boolean; errors: Record<string, string> };
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
}

export const useDedicatedNames = ({
  initialNames = [{
    recipient_name: "",
    recipient_email: "",
    recipient_phone: "",
    assignee_name: "",
    assignee_email: "",
    assignee_phone: "",
    relation: "",
    trees_count: 14
  }]
}: UseDedicatedNamesProps = {}): UseDedicatedNamesReturn => {
  const [dedicatedNames, setDedicatedNames] = useState<DedicatedName[]>(initialNames);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddName = useCallback(() => {
    if (dedicatedNames[dedicatedNames.length - 1].recipient_name.trim() === "") {
      return;
    }
    setDedicatedNames([...dedicatedNames, { 
      recipient_name: "", 
      recipient_email: "", 
      recipient_phone: "", 
      assignee_name: "", 
      assignee_email: "", 
      assignee_phone: "", 
      relation: "", 
      trees_count: 1 
    }]);
  }, [dedicatedNames]);

  const handleRemoveName = useCallback((index: number) => {
    const newNames = [...dedicatedNames];
    newNames.splice(index, 1);
    setDedicatedNames(newNames);

    // Re-validate all dedicated names after removal
    setTimeout(() => {
      validateDedicatedNames();
    }, 0);
  }, [dedicatedNames]);

  const handleNameChange = useCallback((index: number, field: keyof DedicatedName, value: string | number) => {
    setDedicatedNames(prev => {
      const newNames = [...prev];
      newNames[index] = { ...newNames[index], [field]: value };
      return newNames;
    });

    // Validate the specific field
    if (field === "recipient_name") {
      let error = "";
      const nameValue = value.toString().trim();
      
      if (nameValue === "") {
        error = "Please enter a valid name";
      } else if (!VALIDATION_PATTERNS.name.test(nameValue)) {
        // More lenient check - just ensure it doesn't contain control characters
        if (!/^[^\x00-\x1F\x7F]+$/.test(nameValue)) {
          error = "Please enter a valid name";
        }
      }
      
      setErrors(prev => ({ ...prev, [`dedicatedName-${index}`]: error }));
    } else if (field === "recipient_email" && value) {
      const error = !VALIDATION_PATTERNS.email.test(value.toString())
        ? "Please enter a valid email address"
        : "";
      setErrors(prev => ({ ...prev, [`dedicatedEmail-${index}`]: error }));
    } else if (field === "recipient_phone" && value) {
      const error = !VALIDATION_PATTERNS.phone.test(value.toString())
        ? "Please enter a valid phone number"
        : "";
      setErrors(prev => ({ ...prev, [`dedicatedPhone-${index}`]: error }));
    }
  }, []);

  const validateDedicatedNames = useCallback(() => {
    const result = ValidationService.validateDedicatedNames(dedicatedNames, true);
    setErrors(prev => ({ ...prev, ...result.errors }));
    return result;
  }, [dedicatedNames]);

  return {
    dedicatedNames,
    setDedicatedNames,
    handleAddName,
    handleRemoveName,
    handleNameChange,
    validateDedicatedNames,
    errors,
    setErrors
  };
};