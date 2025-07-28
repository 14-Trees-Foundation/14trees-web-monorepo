// Data formatting utilities for donate module

import { PRICING } from './constants';
import { DonationType, DonationMethod } from '../types';

// Format currency amount
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Calculate donation amount
export const calculateDonationAmount = (
  donationType: DonationType,
  adoptedTreeCount: number,
  donationMethod: DonationMethod,
  donationTreeCount: number,
  donationAmount: number
): number => {
  let originalAmount = 0;
  
  if (donationType === "adopt") {
    originalAmount = PRICING.ADOPT_TREE_PRICE * (adoptedTreeCount || 0);
  } else if (donationType === "donate") {
    originalAmount = donationMethod === "trees"
      ? PRICING.DONATE_TREE_PRICE * (donationTreeCount || 0)
      : donationAmount;
  }
  
  return originalAmount;
};

// Process PAN number to uppercase
export const processPANNumber = (value: string): string => {
  return value.toUpperCase();
};

// Format phone number for display
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  return cleaned;
};

// Check if amount is above payment limit
export const isAmountAboveLimit = (amount: number): boolean => {
  return amount > PRICING.PAYMENT_LIMIT;
};