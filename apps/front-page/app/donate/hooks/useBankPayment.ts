import { useCallback } from 'react';
import { FormData } from '../types';
import { apiClient } from '~/api/apiClient';

interface UseBankPaymentProps {
  formData: FormData;
  treeLocation: string;
  donationMethod: string;
  adoptedTreeCount: number;
  donationTreeCount: number;
  donationAmount: number;
  paymentProof: File | null;
  setRazorpayPaymentId: (id: number | null) => void;
}

interface UseBankPaymentReturn {
  handleBankPayment: (uniqueRequestId: string, paymentId: number | null) => Promise<number | null>;
}

export const useBankPayment = ({
  formData,
  treeLocation,
  donationMethod,
  adoptedTreeCount,
  donationTreeCount,
  donationAmount,
  paymentProof,
  setRazorpayPaymentId
}: UseBankPaymentProps): UseBankPaymentReturn => {

  const handleBankPayment = useCallback(async (uniqueRequestId: string, paymentId: number | null): Promise<number | null> => {
    if (!paymentProof) {
      alert("Please upload a payment proof");
      return null;
    }

    try {
      // Calculate amount based on donation type
      const amount = treeLocation === "adopt"
        ? 3000 * (adoptedTreeCount || 0)
        : donationMethod === "trees"
          ? 1500 * (donationTreeCount || 0)
          : donationAmount;

      if (amount <= 0) throw new Error("Invalid amount");

      if (!paymentId) {
        const response = await apiClient.createPayment(
          amount,
          "Indian Citizen",
          formData.panNumber,
          true,
          formData.email
        );
        paymentId = response.id;
        setRazorpayPaymentId(response.id);
      }

      if (!paymentId) {
        alert("Payment ID is required");
        return null;
      }

      // Upload payment proof to S3
      const key = uniqueRequestId + "/payments/" + paymentProof.name;
      const url = await apiClient.uploadPaymentProof({
        key,
        payment_proof: paymentProof
      });

      // Create payment history record
      await apiClient.createPaymentHistory(
        paymentId,
        "Bank Transfer",
        amount,
        url
      );

      return paymentId;
    } catch (err: any) {
      alert(err.message || "Payment to save payment details");
      return null;
    }
  }, [
    formData,
    treeLocation,
    donationMethod,
    adoptedTreeCount,
    donationTreeCount,
    donationAmount,
    paymentProof,
    setRazorpayPaymentId
  ]);

  return {
    handleBankPayment
  };
};