// Payment-related type definitions



export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface PaymentVerificationRequest {
  action: string;
  razorpay_payment_id: string;
  order_id: string;
  razorpay_signature: string;
  user_email: string;
}

export interface PaymentState {
  razorpayPaymentId: number | null;
  razorpayOrderId: string | null;
  rpPaymentSuccess: boolean;
  paymentOption: "razorpay" | "bank-transfer";
  paymentProof: File | null;
  isAboveLimit: boolean;
}