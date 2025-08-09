import { useState } from 'react';
import { FormData, DedicatedName } from '../types';

interface UseFormHandlersProps {
  formData: FormData;
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void;
  formValidation: any;
  csvProcessing: any;
  dedicatedNamesHook: any;
  setTreeLocation: (location: string) => void;
  setMultipleNames: (multiple: boolean) => void;
  setPaymentOption: (option: "razorpay" | "bank-transfer") => void;
  setErrors: (errors: any) => void;
  setRpPaymentSuccess: (success: boolean) => void;
  setRazorpayOrderId: (id: string | null) => void;
  setRazorpayPaymentId: (id: number | null) => void;
  setDonationAmount: (amount: number) => void;
  setDonationTreeCount: (count: number) => void;
  setCurrentStep: (step: 1 | 2) => void;
  setDonationId: (id: number | null) => void;
  setCsvFile: (file: File | null) => void;
  setCsvPreview: (preview: any[]) => void;
  setCsvErrors: (errors: any[]) => void;
}

interface UseFormHandlersReturn {
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleCsvUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  downloadSampleCsv: () => Promise<void>;
  handleReset: () => void;
}

export const useFormHandlers = ({
  formData,
  setFormData,
  formValidation,
  csvProcessing,
  dedicatedNamesHook,
  setTreeLocation,
  setMultipleNames,
  setPaymentOption,
  setErrors,
  setRpPaymentSuccess,
  setRazorpayOrderId,
  setRazorpayPaymentId,
  setDonationAmount,
  setDonationTreeCount,
  setCurrentStep,
  setDonationId,
  setCsvFile,
  setCsvPreview,
  setCsvErrors
}: UseFormHandlersProps): UseFormHandlersReturn => {

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Always store PAN number in uppercase
    const processedValue = name === "panNumber" ? value.toUpperCase() : value;

    const error = formValidation.validateField(name, processedValue);
    formValidation.setErrors((prev: any) => ({ ...prev, [name]: error }));
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await csvProcessing.handleCsvUpload(e, csvProcessing.donationTreeCount);
  };

  const downloadSampleCsv = async () => {
    try {
      await csvProcessing.downloadSampleCsv();
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleReset = () => {
    // Only reset form after successful payment
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      panNumber: "",
      comments: ""
    });
    dedicatedNamesHook.setDedicatedNames([{
      recipient_name: "",
      recipient_email: "",
      recipient_phone: "",
      assignee_name: "",
      assignee_email: "",
      assignee_phone: "",
      relation: "",
      trees_count: 14
    }]);
    setTreeLocation("");
    setMultipleNames(false);
    setPaymentOption("razorpay");
    setCsvFile(null);
    setCsvPreview([]);
    setCsvErrors([]);
    setErrors({});
    setRpPaymentSuccess(false);
    setRazorpayOrderId(null);
    setRazorpayPaymentId(null);
    setDonationAmount(5000);
    setDonationTreeCount(14);
    setCurrentStep(1);
    setDonationId(null);
  };

  return {
    handleInputChange,
    handleCsvUpload,
    downloadSampleCsv,
    handleReset
  };
};