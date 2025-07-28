export interface PaymentData {
  amount: number;
  currency: string;
  paymentMethod: 'razorpay' | 'bank_transfer';
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  bankTransferDetails?: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  paymentId?: number;
  error?: string;
}