import { Orders } from "razorpay/dist/types/orders";
import { ObjectId } from "mongodb";

export type Project = {
  id: string;
  image: string;
  title: string;
  description: string;
  price: number;
};

type OneTimeContribution = {
  captured: boolean;
  orderId: string;
  type: 'one-time';
  amount: number;
  trees: number;
};

type RecurringContribution = {
  captured: boolean;
  orderId: string;
  type: 'recurring';
  amount: number;
  trees: number;
};

type LargeContribution = {
  captured: boolean;
  type: 'large';
  notes: string;
  trees: number;
};

type CsrContribution = {
  type: 'csr';
  notes: string;
};

type BaseOrder = {
  currency: 'INR' | 'USD';
  date: Date;
  status: 'created' | 'captured';
}

export type ContributionType = OneTimeContribution | RecurringContribution | LargeContribution | CsrContribution;

export interface Contribution {
  campaign: string;
  source: string;
  plantation: "foundation" | "public" | "farmland";
  purpose: string;
  emailSent: boolean;
  assignment_names?: string[];
  order: ContributionType & BaseOrder | null;
  donor?: ObjectId;
}

export interface ContributionUser {
  name: string;
  userid: string;
  phone: string;
  email: string;
  pan: string;
  org?: string;
  dob?: Date;
  comms: {
    visit: boolean;
    volunteer: boolean;
    updates: boolean;
  }
  parent?: ObjectId;
}

export interface Donor {
  first_name: string;
  last_name: string;
  pan: ContributionUser['pan'];
  email_id: ContributionUser['email'];
  phone: ContributionUser['phone'];
  comms: ContributionUser['comms'];
}

export interface VerificationResponse {
  status: "success" | "failed" | "invalid",
  message: string,
  emailSent: Contribution['emailSent'],
  orderId?: string,
  userid?: ContributionUser['userid'],
  paymentId?: string,
}

export interface ContributeRequest {
    contribution: Contribution,
    donor: Donor
}

export interface PaymentOrder {
    status: "created" | "captured" | "failed",
    emailStatus: "sent" | "not sent",
    order: Orders.RazorpayOrder,
    contribution: Contribution,
    donor: Donor
}

export type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};