import { useState, useCallback, useEffect } from 'react';
import { DonationService } from '../services/donationService';
import { DedicatedName, FormData } from '../types';

interface UseDonationLogicProps {
  formData: FormData;
  rfr?: string | null;
  c_key?: string | null;
}

interface UseDonationLogicReturn {
  // Donation type and method
  donationType: "adopt" | "donate";
  donationMethod: "trees" | "amount";
  setDonationType: (type: "adopt" | "donate") => void;
  setDonationMethod: (method: "trees" | "amount") => void;
  
  // Tree counts and amounts
  adoptedTreeCount: number;
  donationTreeCount: number;
  donationAmount: number;
  setAdoptedTreeCount: (count: number) => void;
  setDonationTreeCount: (count: number) => void;
  setDonationAmount: (amount: number) => void;
  
  // Visit date for adoptions
  visitDate: string;
  setVisitDate: (date: string) => void;
  
  // Calculated values
  calculatedAmount: number;
  isAboveLimit: boolean;
  
  // Donation operations
  createDonation: (
    dedicatedNames: DedicatedName[],
    paymentId: number
  ) => Promise<{ id: number; message?: string }>;
  
  updateDonation: (
    donationId: number,
    contributionOptions: string[],
    comments: string
  ) => Promise<void>;
  
  // State management
  donationId: number | null;
  setDonationId: (id: number | null) => void;
}

export const useDonationLogic = ({
  formData,
  rfr,
  c_key
}: UseDonationLogicProps): UseDonationLogicReturn => {
  const [donationType, setDonationType] = useState<"adopt" | "donate">("adopt");
  const [donationMethod, setDonationMethod] = useState<"trees" | "amount">("trees");
  const [adoptedTreeCount, setAdoptedTreeCount] = useState<number>(0);
  const [donationTreeCount, setDonationTreeCount] = useState<number>(14);
  const [donationAmount, setDonationAmount] = useState<number>(5000);
  const [visitDate, setVisitDate] = useState<string>("");
  const [donationId, setDonationId] = useState<number | null>(null);
  const [calculatedAmount, setCalculatedAmount] = useState<number>(0);
  const [isAboveLimit, setIsAboveLimit] = useState<boolean>(false);

  // Calculate amount and check limits
  useEffect(() => {
    const originalAmount = DonationService.calculateAmount(
      donationType,
      donationMethod,
      adoptedTreeCount,
      donationTreeCount,
      donationAmount
    );
    
    setCalculatedAmount(originalAmount);
    setIsAboveLimit(originalAmount > 500000);
  }, [donationType, donationMethod, adoptedTreeCount, donationTreeCount, donationAmount]);

  const createDonation = useCallback(async (
    dedicatedNames: DedicatedName[],
    paymentId: number
  ): Promise<{ id: number; message?: string }> => {
    try {
      const result = await DonationService.createDonation(
        formData,
        dedicatedNames,
        donationType,
        donationMethod,
        paymentId,
        calculatedAmount,
        calculatedAmount, // originalAmount same as calculatedAmount (no discounts)
        adoptedTreeCount,
        donationTreeCount,
        visitDate,
        rfr,
        c_key
      );

      setDonationId(result.id);
      return result;
    } catch (error: any) {
      throw new Error(error.message || "Failed to create donation");
    }
  }, [
    formData,
    donationType,
    donationMethod,
    calculatedAmount,
    adoptedTreeCount,
    donationTreeCount,
    visitDate,
    rfr,
    c_key
  ]);

  const updateDonation = useCallback(async (
    donationId: number,
    contributionOptions: string[],
    comments: string
  ): Promise<void> => {
    try {
      await DonationService.updateDonation({
        donation_id: donationId,
        updateFields: ['contribution_options', 'comments'],
        data: {
          contribution_options: contributionOptions,
          comments: comments
        }
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to update donation");
    }
  }, []);

  return {
    // Donation type and method
    donationType,
    donationMethod,
    setDonationType,
    setDonationMethod,
    
    // Tree counts and amounts
    adoptedTreeCount,
    donationTreeCount,
    donationAmount,
    setAdoptedTreeCount,
    setDonationTreeCount,
    setDonationAmount,
    
    // Visit date
    visitDate,
    setVisitDate,
    
    // Calculated values
    calculatedAmount,
    isAboveLimit,
    
    // Donation operations
    createDonation,
    updateDonation,
    
    // State management
    donationId,
    setDonationId
  };
};