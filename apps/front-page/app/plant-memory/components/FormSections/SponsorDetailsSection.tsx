import React from 'react';
import { AutoCompleteInput } from '../Common/AutoCompleteInput';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Tooltip from '@mui/material/Tooltip';
import { DedicatedName, AutoCompleteData } from '../../types/forms';

interface SponsorDetailsSectionProps {
  formData: {
    fullName: string;
    email: string;
    phone: string;
    panNumber: string;
    numberOfTrees: string;
    [key: string]: any;
  };
  errors: Record<string, string>;
  autoCompleteData: AutoCompleteData;
  dedicatedNames: DedicatedName[];
  recipientOption: 'manual' | 'csv';
  csvHasErrors: boolean;
  hasDuplicateNames: boolean;
  hasAssigneeError: boolean;
  onAutoPopulateChange: (name: string, value: string) => void;
  onAutoPopulateBlur: (name: string) => void;
  onProceedToPayment: () => void;
  validateField: (field: string, value: string) => string | null;
  setValidationAlertData: (data: { title: string; message: React.ReactNode }) => void;
  setShowValidationAlert: (show: boolean) => void;
  scrollToRecipients: () => void;
  setCurrentStep: (step: number) => void;
}

export const SponsorDetailsSection: React.FC<SponsorDetailsSectionProps> = ({
  formData,
  errors,
  autoCompleteData,
  dedicatedNames,
  recipientOption,
  csvHasErrors,
  hasDuplicateNames,
  hasAssigneeError,
  onAutoPopulateChange,
  onAutoPopulateBlur,
  onProceedToPayment,
  validateField,
  setValidationAlertData,
  setShowValidationAlert,
  scrollToRecipients,
  setCurrentStep
}) => {
  const handleProceedToPayment = () => {
    // Comprehensive validation with detailed error messages
    const missingFields: string[] = [];
    const validationErrors: string[] = [];

    // Define required fields with user-friendly names
    const requiredFields = {
      fullName: "Full Name",
      email: "Email ID",
      phone: "Mobile Number",
      panNumber: "PAN Number"
    };

    // Check for missing required fields
    Object.entries(requiredFields).forEach(([key, label]) => {
      const value = formData[key as keyof typeof formData];
      if (!value || value.trim() === "") {
        missingFields.push(label);
      } else {
        // Validate field format if it has a value
        const error = validateField(key, value);
        if (error) {
          validationErrors.push(`${label}: ${error}`);
        }
      }
    });

    const treesCount = parseInt(formData.numberOfTrees);
    const treesAssigned = dedicatedNames.filter(user => user.recipient_name?.trim())
      .map(user => user.trees_count)
      .reduce((prev, curr) => prev + curr, 0);

    // Check for missing or invalid fields first
    if (missingFields.length > 0 || validationErrors.length > 0) {
      const errorMessages: React.ReactNode[] = [];
      
      if (missingFields.length > 0) {
        errorMessages.push(
          <div key="missing" className="mb-3">
            <p className="font-semibold text-red-600 mb-2">Missing Required Fields:</p>
            <ul className="list-disc pl-5 space-y-1">
              {missingFields.map((field, index) => (
                <li key={index} className="text-red-600">{field}</li>
              ))}
            </ul>
          </div>
        );
      }

      if (validationErrors.length > 0) {
        errorMessages.push(
          <div key="errors" className="mb-3">
            <p className="font-semibold text-red-600 mb-2">Field Validation Errors:</p>
            <ul className="list-disc pl-5 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-red-600">{error}</li>
              ))}
            </ul>
          </div>
        );
      }

      setValidationAlertData({
        title: "Please Complete Required Information",
        message: (
          <div className="space-y-2">
            {errorMessages}
            <div className="bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> Use the Smart Form Assistant at the top to auto-fill common information!
              </p>
            </div>
          </div>
        )
      });
      setShowValidationAlert(true);
      return;
    }

    if (treesAssigned < treesCount) {
      if (treesAssigned !== 0) {
        setValidationAlertData({
          title: "Incomplete Tree Assignment",
          message: (
            <div className="space-y-2">
              <p>You have only assigned {treesAssigned} out of {treesCount} trees. <span className="text-red-600 font-medium mt-4">You should assign the remaining {treesCount - treesAssigned} {treesCount - treesAssigned === 1 ? 'tree' : 'trees'}</span></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Please assign all trees to recipients before proceeding</li>
                <li>Each tree needs to be assigned to a recipient</li>
                <li>You can add more recipients if needed</li>
              </ul>
            </div>
          )
        });
      } else {
        setValidationAlertData({
          title: "No Trees Assigned",
          message: (
            <div className="space-y-2">
              <p>You have not assigned any tree out of {treesCount} {treesCount === 1 ? "tree" : "trees"}. <span className="text-red-600 font-medium mt-4">You should assign all {treesCount} {treesCount === 1 ? 'tree' : 'trees'}</span></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Please assign all trees to recipients before proceeding</li>
                <li>Each tree needs to be assigned to a recipient</li>
                <li>You can add recipients using the form above</li>
              </ul>
            </div>
          )
        });
      }
      setShowValidationAlert(true);
      setTimeout(scrollToRecipients, 100);
      return;
    } else if (treesAssigned > treesCount) {
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
      setTimeout(scrollToRecipients, 100);
      return;
    }

    // If all validations pass, proceed to payment
    setCurrentStep(2);
  };

  const isDisabled = hasDuplicateNames || hasAssigneeError || (recipientOption === 'csv' && csvHasErrors) ||
    dedicatedNames.reduce((sum, name) => sum + (name.trees_count || 0), 0) !== Number(formData.numberOfTrees);

  return (
    <>
      {/* Personal Information */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Finally, help us with your (sponsor) details</h2>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center flex-wrap">
            <label className="w-48 text-gray-700">
              Sponsored by*:
              <Tooltip title="The donor who's paying for the trees.">
                <InfoOutlinedIcon fontSize="small" className="text-gray-500 cursor-help" />
              </Tooltip>
            </label>
            <div className="min-w-[200px] flex-1">
              <AutoCompleteInput
                name="fullName"
                value={formData.fullName}
                onChange={onAutoPopulateChange}
                onBlur={onAutoPopulateBlur}
                suggestions={autoCompleteData.fullNames}
                className={`w-full rounded-md border ${errors.fullName ? 'border-red-500' : 'border-gray-300'} px-4 py-2 text-gray-700`}
                placeholder="Type your name"
                required
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>
          </div>

          <div className="flex items-center flex-wrap">
            <label className="w-48 text-gray-700">Email ID*:</label>
            <div className="min-w-[200px] flex-1">
              <AutoCompleteInput
                name="email"
                type="email"
                value={formData.email}
                onChange={onAutoPopulateChange}
                onBlur={onAutoPopulateBlur}
                suggestions={autoCompleteData.emails}
                className={`w-full rounded-md border ${errors.email ? 'border-red-500' : 'border-gray-300'} px-4 py-2 text-gray-700`}
                placeholder="Type your email id"
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="flex items-center flex-wrap">
            <label className="w-48 text-gray-700">Mobile number*:</label>
            <div className="min-w-[200px] flex-1">
              <AutoCompleteInput
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={onAutoPopulateChange}
                onBlur={onAutoPopulateBlur}
                suggestions={autoCompleteData.phones}
                className={`w-full rounded-md border ${errors.phone ? 'border-red-500' : 'border-gray-300'} px-4 py-2 text-gray-700`}
                placeholder="Enter with country code, if outside India"
                required
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>
          </div>

          <div className="flex items-center flex-wrap">
            <label className="w-48 text-gray-700">
              PAN number*:
              <Tooltip title="PAN number is required for us to map and issue 80G receipt to the donor.">
                <InfoOutlinedIcon fontSize="small" className="text-gray-500 cursor-help" />
              </Tooltip>
            </label>
            <div className="min-w-[200px] flex-1">
              <AutoCompleteInput
                name="panNumber"
                value={formData.panNumber}
                onChange={onAutoPopulateChange}
                onBlur={onAutoPopulateBlur}
                suggestions={autoCompleteData.panNumbers}
                className={`w-full rounded-md border ${errors.panNumber ? 'border-red-500' : 'border-gray-300'} px-4 py-2 text-gray-700 uppercase placeholder:text-gray-400 placeholder:normal-case`}
                placeholder="Enter your PAN number"
                required
              />
              {errors.panNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.panNumber}</p>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-600">
              At present we can accept donations only from Indian residents. PAN number is required to know the donor&apos;s identity.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <button
          type="button"
          onClick={handleProceedToPayment}
          className={`px-6 py-3 rounded-md transition-colors text-white ${
            isDisabled
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
          disabled={isDisabled}
        >
          Proceed to pay
        </button>
      </div>
    </>
  );
};