import React from 'react';
import { DonationType, DonationMethod } from '../../types';

interface PaymentSectionProps {
  treeLocation: DonationType | "";
  donationMethod: DonationMethod;
  donationTreeCount: number;
  adoptedTreeCount: number;
  visitDate: string;
  dedicatedNames: any[];
  errors: Record<string, string>;
  csvErrors: string[];
  hasDuplicateNames: boolean;
  hasTableErrors: boolean;
  onProceedToPay: () => void;
}

export const PaymentSection: React.FC<PaymentSectionProps> = ({
  treeLocation,
  donationMethod,
  donationTreeCount,
  adoptedTreeCount,
  visitDate,
  dedicatedNames,
  errors,
  csvErrors,
  hasDuplicateNames,
  hasTableErrors,
  onProceedToPay
}) => {
  if (!treeLocation) return null;

  return (
    <div className="mt-8">
      <div className="flex flex-col items-center space-y-4">
        <button
          type="button"
          onClick={onProceedToPay}
          className={`px-6 py-3 rounded-md transition-colors text-white ${hasDuplicateNames || hasTableErrors || Object.entries(errors).some(([key, value]) => key !== "comments" && value && value.trim() !== "") || csvErrors.length > 0
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700"
            }`}
          disabled={hasDuplicateNames || hasTableErrors || Object.entries(errors).some(([key, value]) => key !== "comments" && value && value.trim() !== "") || csvErrors.length > 0}
        >
          Proceed to pay
        </button>
        
        {(hasTableErrors || Object.values(errors).some(e => e && e.trim() !== "") || csvErrors.length > 0) && (
          <div className="text-red-600 text-sm mt-2">
            Please fix all errors in the form before proceeding. {hasTableErrors && "There are errors in csv file uploaded!"}
          </div>
        )}
        
        {hasDuplicateNames && (
          <p className="text-red-600 text-sm mt-2">
            Assignee name should be unique. Please remove duplicates to proceed.
          </p>
        )}
      </div>
    </div>
  );
};