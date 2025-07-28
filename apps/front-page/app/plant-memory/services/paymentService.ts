import { apiClient } from "~/api/apiClient";

export interface PaymentResponse {
  id: number;
  order_id: string;
}

export interface PaymentVerificationData {
  action: string;
  razorpay_payment_id?: string;
  payment_id?: string;
  order_id: string;
  signature?: string;
  razorpay_signature?: string;
  user_email: string;
}

export class PaymentService {
  static async createPayment(
    amount: number, 
    donorType: string, 
    panNumber: string, 
    consent: boolean, 
    email: string
  ): Promise<PaymentResponse> {
    try {
      const response = await apiClient.createPayment(amount, donorType, panNumber, consent, email);
      return response;
    } catch (error: any) {
      throw new Error(error.message || "Failed to create payment");
    }
  }

  static async createRazorpayOrder(
    amount: number,
    donorType: string,
    panNumber: string,
    consent: boolean
  ): Promise<{ order_id: string; id: number }> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          amount,
          donor_type: donorType,
          pan_number: panNumber,
          consent,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Payment creation failed");
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || "Failed to create Razorpay order");
    }
  }

  static async verifyPayment(data: PaymentVerificationData): Promise<boolean> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error("Payment verification failed");
      }

      return true;
    } catch (error: any) {
      console.error("Verification error:", error);
      throw new Error(error.message || "Payment verification failed");
    }
  }

  static async uploadPaymentProof(
    uniqueRequestId: string, 
    paymentProof: File
  ): Promise<string> {
    try {
      const key = uniqueRequestId + "/payments/" + paymentProof.name;
      const url = await apiClient.uploadPaymentProof({ key, payment_proof: paymentProof });
      return url;
    } catch (error: any) {
      throw new Error(error.message || "Failed to upload payment proof");
    }
  }

  static async createPaymentHistory(
    paymentId: number,
    paymentMethod: string,
    amount: number,
    proofUrl: string
  ): Promise<void> {
    try {
      await apiClient.createPaymentHistory(paymentId, paymentMethod, amount, proofUrl);
    } catch (error: any) {
      throw new Error(error.message || "Failed to create payment history");
    }
  }

  static async markPaymentSuccess(
    giftRequestId: string,
    remainingTrees: number
  ): Promise<void> {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gift-cards/requests/payment-success`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gift_request_id: giftRequestId,
          remaining_trees: remainingTrees,
        })
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to mark payment as successful");
    }
  }
}