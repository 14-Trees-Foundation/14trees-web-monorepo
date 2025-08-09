import { useState, useCallback } from 'react';
import { DedicatedName, FormData } from '../types';
import { PaymentService } from '../services/paymentService';
import { DonationService } from '../services/donationService';
import { isInternalTestUser } from "~/utils";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface UseRazorpayPaymentProps {
  formData: FormData;
  treeLocation: string;
  donationMethod: string;
  adoptedTreeCount: number;
  donationTreeCount: number;
  donationAmount: number;
  visitDate: string;
  dedicatedNames: DedicatedName[];
  razorpayPaymentId: number | null;
  razorpayOrderId: string | null;
  setRazorpayPaymentId: (id: number | null) => void;
  setRazorpayOrderId: (id: string | null) => void;
  setDonationId: (id: number | null) => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

interface UseRazorpayPaymentReturn {
  isProcessing: boolean;
  handleRazorpayPayment: () => Promise<void>;
}

export const useRazorpayPayment = ({
  formData,
  treeLocation,
  donationMethod,
  adoptedTreeCount,
  donationTreeCount,
  donationAmount,
  visitDate,
  dedicatedNames,
  razorpayPaymentId,
  razorpayOrderId,
  setRazorpayPaymentId,
  setRazorpayOrderId,
  setDonationId,
  onSuccess,
  onError
}: UseRazorpayPaymentProps): UseRazorpayPaymentReturn => {
  const [isProcessing, setIsProcessing] = useState(false);

  const addInternalTestPrefix = useCallback((name: string, email: string): string => {
    return isInternalTestUser(email) ? `[TEST] ${name}` : name;
  }, []);

  const addInternalTestComments = useCallback((comments: string, email: string): string => {
    if (!isInternalTestUser(email)) return comments;
    const testNote = "🔧 INTERNAL TEST TRANSACTION - This is a test donation for development/testing purposes.";
    return comments ? `${testNote}\n\n${comments}` : testNote;
  }, []);

  const addInternalTestTags = useCallback((tags: string[], email: string): string[] => {
    return isInternalTestUser(email) ? [...tags, "Internal-Test", "Development"] : tags;
  }, []);

  const getInternalTestMetadata = useCallback((email: string, originalAmount: number) => {
    if (!isInternalTestUser(email)) return {};
    return {
      internal_test: true,
      test_user_email: email,
      original_amount: originalAmount,
      test_timestamp: new Date().toISOString(),
      test_environment: process.env.NODE_ENV || "development"
    };
  }, []);

  const handleRazorpayPayment = useCallback(async (): Promise<void> => {
    const isAboveLimit = DonationService.calculateAmount(treeLocation, donationMethod, adoptedTreeCount, donationTreeCount, donationAmount) > 500000;
    
    if (isAboveLimit) {
      onError("Please use Bank Transfer for donations above ₹5,00,000");
      return;
    }

    if (!formData.fullName || !formData.email || !formData.phone) {
      onError("Please fill in all required fields before payment");
      return;
    }

    setIsProcessing(true);
    try {
      // Calculate original amount first
      const originalAmount = treeLocation === "adopt"
        ? 3000 * (adoptedTreeCount || 0)
        : donationMethod === "trees"
          ? 1500 * (donationTreeCount || 0)
          : donationAmount;
      
      // No amount reduction - same pricing for all users
      const amount = originalAmount;
      if (amount <= 0) throw new Error("Invalid amount");

      let orderId = razorpayOrderId;
      let paymentId = razorpayPaymentId;
      if (!orderId) {
        const paymentResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            amount,
            pan_number: formData.panNumber,
            donor_type: "Indian Citizen",
            consent: true,
          })
        });
        if (!paymentResponse.ok) {
          const errorData = await paymentResponse.json();
          throw new Error(errorData.error || "Payment failed");
        }

        const paymentData = await paymentResponse.json();
        console.log('Payment creation response:', paymentData);
        
        const { order_id, id } = paymentData;
        setRazorpayPaymentId(id);
        setRazorpayOrderId(order_id);
        orderId = order_id;
        paymentId = id;
      }

      // First create the donation entry
      const donationRequest = {
        sponsor_name: addInternalTestPrefix(formData.fullName, formData.email),
        sponsor_email: formData.email,
        sponsor_phone: formData.phone,
        category: treeLocation === "adopt" ? "Foundation" : "Public",
        donation_type: treeLocation === "adopt" ? "adopt" : "donate",
        donation_method: treeLocation === "donate" ? donationMethod : undefined,
        payment_id: paymentId,
        contribution_options: [],
        comments: addInternalTestComments(formData.comments, formData.email),
        amount_donated: amount,
        ...(treeLocation === "adopt" && {
          visit_date: visitDate,
          trees_count: adoptedTreeCount,
        }),
        ...(treeLocation === "donate" && {
          ...(donationMethod === "trees" && { trees_count: donationTreeCount }),
          ...(donationMethod === "amount" && { amount_donated: amount }),
        }),
        users: dedicatedNames.map(user => ({
          ...user,
          recipient_email: user.recipient_email || user.recipient_name.trim().toLowerCase().replace(/\s+/g, '.') + ".donor@14trees",
          assignee_email: user.assignee_email || user.assignee_name.trim().toLowerCase().replace(/\s+/g, '.') + ".donor@14trees"
        })),
        tags: addInternalTestTags(["WebSite"], formData.email),
        ...getInternalTestMetadata(formData.email, originalAmount),
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/donations/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(donationRequest)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Donation submission failed");
      }

      const responseData = await response.json();
      setDonationId(responseData.id);

      const razorpayConfig = PaymentService.getRazorpayConfig(formData.email);
      
      const options = {
        key: razorpayConfig.key_id,
        amount: amount * 100,
        currency: 'INR',
        name: "14 Trees Foundation",
        description: treeLocation === "adopt"
          ? `Adoption of ${adoptedTreeCount} trees`
          : `Donation for ${donationTreeCount} trees`,
        order_id: orderId,
        notes: {
          "Donation Id": responseData.id,
          ...(isInternalTestUser(formData.email) && {
            "Internal Test": "true",
            "Test User Email": formData.email,
            "Razorpay Account": "test",
            "Test Timestamp": new Date().toISOString()
          })
        },
        handler: async (response: any) => {
          try {
            await PaymentService.verifyRazorpayPayment(response);
            onSuccess();
          } catch (err) {
            console.error("Payment verification failed:", err);
            onError("Payment verification failed");
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone || ""
        },
        theme: { color: "#339933" }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        console.error('Razorpay payment failed:', response);
        onError(`Payment failed: ${response.error.description}`);
      });
      
      rzp.on('checkout.error', (response: any) => {
        console.error('Razorpay checkout error:', response);
      });
      
      rzp.open();

    } catch (err: any) {
      console.error("Razorpay payment error:", err);
      onError(err.message || "Payment processing failed");
    } finally {
      setIsProcessing(false);
    }
  }, [
    formData,
    treeLocation,
    donationMethod,
    adoptedTreeCount,
    donationTreeCount,
    donationAmount,
    visitDate,
    dedicatedNames,
    razorpayPaymentId,
    razorpayOrderId,
    setRazorpayPaymentId,
    setRazorpayOrderId,
    setDonationId,
    onSuccess,
    onError,
    addInternalTestPrefix,
    addInternalTestComments,
    addInternalTestTags,
    getInternalTestMetadata
  ]);

  return {
    isProcessing,
    handleRazorpayPayment
  };
};