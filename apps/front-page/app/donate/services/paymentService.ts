import { apiClient } from "~/api/apiClient";
import { 
  getRazorpayConfig, 
  isInternalTestUser,
  getInternalTestMetadata,
  addInternalTestTags,
  addInternalTestPrefix,
  addInternalTestComments,
  getUniqueRequestId
} from "~/utils";

export interface CreatePaymentRequest {
  amount: number;
  panNumber: string;
  donorType: string;
  consent: boolean;
  userEmail: string;
}

export interface CreatePaymentResponse {
  id: number;
  order_id: string;
}

export interface VerifyPaymentRequest {
  razorpay_payment_id: string;
  order_id: string;
  razorpay_signature: string;
  user_email: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  notes: Record<string, any>;
  handler: (response: any) => Promise<void>;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
}

export class PaymentService {
  private static async createPaymentRequest(
    amount: number,
    donorType: string,
    panNumber: string,
    consent: boolean,
    userEmail: string
  ): Promise<CreatePaymentResponse> {
    const response = await apiClient.createPayment(
      amount,
      donorType,
      panNumber,
      consent,
      userEmail
    );
    return response;
  }

  private static async verifyRazorpayPayment(request: VerifyPaymentRequest): Promise<Response> {
    const verificationResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'verify',
        razorpay_payment_id: request.razorpay_payment_id,
        order_id: request.order_id,
        razorpay_signature: request.razorpay_signature,
        user_email: request.user_email
      })
    });
    
    if (!verificationResponse.ok) {
      throw new Error("Verification failed");
    }
    
    return verificationResponse;
  }

  private static async notifyPaymentSuccess(donationId: number): Promise<void> {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/donations/requests/payment-success`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donation_id: donationId.toString()
        })
      });
    } catch (err) {
      // Silent fail for payment success notification
      console.warn("Failed to notify payment success:", err);
    }
  }

  static async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    try {
      return await this.createPaymentRequest(
        request.amount,
        request.donorType,
        request.panNumber,
        request.consent,
        request.userEmail
      );
    } catch (error: any) {
      throw new Error(error.message || "Failed to create payment");
    }
  }

  static async verifyPayment(request: VerifyPaymentRequest): Promise<void> {
    try {
      await this.verifyRazorpayPayment(request);
    } catch (error: any) {
      throw new Error(error.message || "Payment verification failed");
    }
  }

  static createRazorpayOptions(
    amount: number,
    orderId: string,
    donationId: number,
    userEmail: string,
    userName: string,
    userPhone: string,
    treeLocation: string,
    adoptedTreeCount: number,
    donationTreeCount: number,
    onSuccess: () => void,
    onFailure: (error: string) => void
  ): RazorpayOptions {
    const razorpayConfig = getRazorpayConfig(userEmail);
    
    const options: RazorpayOptions = {
      key: razorpayConfig.key_id,
      amount: amount * 100,
      currency: 'INR',
      name: "14 Trees Foundation",
      description: treeLocation === "adopt"
        ? `Adoption of ${adoptedTreeCount} trees`
        : `Donation for ${donationTreeCount} trees`,
      order_id: orderId,
      notes: {
        "Donation Id": donationId,
        ...(isInternalTestUser(userEmail) && {
          "Internal Test": "true",
          "Test User Email": userEmail,
          "Razorpay Account": "test",
          "Test Timestamp": new Date().toISOString()
        })
      },
      handler: async (response: any) => {
        if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
          onFailure('Payment verification failed - incomplete response');
          return;
        }
        
        try {
          await this.verifyPayment({
            razorpay_payment_id: response.razorpay_payment_id,
            order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            user_email: userEmail
          });

          await this.notifyPaymentSuccess(donationId);
          onSuccess();
        } catch (err: any) {
          console.error("Verification error:", err);
          onFailure(err.message || "Payment verification failed");
        }
      },
      prefill: {
        name: userName,
        email: userEmail,
        contact: userPhone || ""
      },
      theme: { color: "#339933" }
    };

    return options;
  }

  static async handleBankPayment(
    amount: number,
    panNumber: string,
    userEmail: string,
    paymentProof: File,
    existingPaymentId?: number
  ): Promise<number> {
    if (!paymentProof) {
      throw new Error("Please upload a payment proof");
    }

    if (amount <= 0) {
      throw new Error("Invalid amount");
    }

    let paymentId = existingPaymentId;

    // Create payment if not exists
    if (!paymentId) {
      const response = await this.createPayment({
        amount,
        donorType: "Indian Citizen",
        panNumber,
        consent: true,
        userEmail
      });
      paymentId = response.id;
    }

    if (!paymentId) {
      throw new Error("Payment ID is required");
    }

    try {
      // Upload payment proof to S3
      const uniqueRequestId = getUniqueRequestId();
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
      throw new Error(err.message || "Failed to save payment details");
    }
  }
}