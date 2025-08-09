// Donation-specific type definitions

export interface DedicatedName {
  recipient_name: string;
  recipient_email: string;
  recipient_phone: string;
  assignee_name: string;
  assignee_email: string;
  assignee_phone: string;
  relation: string;
  trees_count: number;
  image?: string;
  image_url?: string;
  [key: string]: string | number | undefined;
}

export interface FormData {
  fullName: string;
  email: string;
  phone: string;
  panNumber: string;
  comments: string;
}

export interface ValidationAlertData {
  title: string;
  message: React.ReactNode;
}

export interface ReferralDetails {
  referred_by?: string;
  name?: string;
  c_key?: string;
  description?: string;
}

export type DonationType = "adopt" | "donate";
export type DonationMethod = "trees" | "amount";
export type PaymentOption = "razorpay" | "bank-transfer";
export type NameEntryMethod = "manual" | "csv";
export type CurrentStep = 1 | 2;