import React, { useState } from 'react';

interface ValidationAlertData {
  title: string;
  message: React.ReactNode;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  panNumber: string;
  comments?: string;
  [key: string]: any;
}

interface DedicatedName {
  recipient_name?: string;
  trees_count: number;
}

interface UseStepValidationProps {
  formData: FormData;
  errors: Record<string, string>;
  hasTableErrors: boolean;
  csvErrors: any[];
  treeLocation: string;
  adoptedTreeCount: number;
  visitDate: string;
  donationMethod: string;
  donationTreeCount: number;
  dedicatedNames: DedicatedName[];
  hasDuplicateNames: boolean;
  setCurrentStep: (step: 1 | 2) => void;
}

interface UseStepValidationReturn {
  showValidationAlert: boolean;
  validationAlertData: ValidationAlertData;
  setShowValidationAlert: (show: boolean) => void;
  handleProceedToPayment: () => void;
  canProceed: boolean;
  hasErrors: boolean;
}

export const useStepValidation = ({
  formData,
  errors,
  hasTableErrors,
  csvErrors,
  treeLocation,
  adoptedTreeCount,
  visitDate,
  donationMethod,
  donationTreeCount,
  dedicatedNames,
  hasDuplicateNames,
  setCurrentStep
}: UseStepValidationProps): UseStepValidationReturn => {
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  const [validationAlertData, setValidationAlertData] = useState<ValidationAlertData>({
    title: "",
    message: ""
  });

  const validateFormErrors = (): boolean => {
    const hasFormErrors = Object.entries(errors).some(
      ([key, value]) => key !== "comments" && value && value.trim() !== ""
    );
    
    if (hasTableErrors || hasFormErrors || csvErrors.length > 0) {
      alert('Please fix all errors in the form and table above before proceeding.');
      return false;
    }
    return true;
  };

  const validateMainForm = (): boolean => {
    const mainFormValid = Object.keys(formData).every(key => {
      if (key === "comments") return true;
      const value = formData[key as keyof typeof formData];
      // Check for mandatory fields
      if (key === "fullName" || key === "email" || key === "phone" || key === "panNumber") {
        return !!value;
      }
      return true;
    });

    if (!mainFormValid) {
      alert("Please fill all required fields");
      return false;
    }
    return true;
  };

  const validateTreeLocation = (): boolean => {
    if (treeLocation === 'adopt') {
      if (!adoptedTreeCount) {
        alert("Please enter number of trees you would like to adopt!");
        return false;
      }
      if (!visitDate) {
        alert("Please select visit date!");
        return false;
      }
    }

    if (treeLocation === 'donate' && donationMethod === 'trees' && !donationTreeCount) {
      alert("Please enter number of trees you would like to donate!");
      return false;
    }
    return true;
  };

  const validateTreeCount = (): boolean => {
    const treesCount = donationTreeCount;
    const treesAssigned = dedicatedNames
      .filter(user => user.recipient_name?.trim())
      .map(user => user.trees_count)
      .reduce((prev, curr) => prev + curr, 0);

    if (treesAssigned > treesCount) {
      setValidationAlertData({
        title: "Tree Count Mismatch",
        message: (
          <div className="space-y-2">
            <p>You have opted to sponsor {treesCount} trees, but you have assigned {treesAssigned} trees. <span className="text-red-600 font-medium mt-4">Please update the total trees at the beginning of the section to {treesAssigned}</span></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Please adjust the number of trees assigned to match your sponsorship</li>
              <li>You can either increase your sponsorship or reduce the number of trees assigned</li>
              <li>Each recipient can have multiple trees assigned to them</li>
            </ul>
          </div>
        )
      });
      setShowValidationAlert(true);
      return false;
    }
    return true;
  };

  const handleProceedToPayment = () => {
    // Run all validations in sequence
    if (!validateFormErrors()) return;
    if (!validateTreeLocation()) return;
    if (!validateTreeCount()) return;
    if (!validateMainForm()) return;

    // If all validations pass, proceed to payment step
    setCurrentStep(2);
  };

  // Calculate if user can proceed (for button state)
  const hasFormErrors = Object.entries(errors).some(
    ([key, value]) => key !== "comments" && value && value.trim() !== ""
  );
  
  const canProceed = !hasDuplicateNames && !hasTableErrors && !hasFormErrors && csvErrors.length === 0;
  const hasErrors = hasTableErrors || Object.values(errors).some(e => e && e.trim() !== "") || csvErrors.length > 0;

  return {
    showValidationAlert,
    validationAlertData,
    setShowValidationAlert,
    handleProceedToPayment,
    canProceed,
    hasErrors
  };
};