import { useState, useCallback } from 'react';
import { DedicatedName, FormData } from '../types';
import { PaymentService } from '../services/paymentService';
import { DonationService } from '../services/donationService';
import { ValidationService } from '../services/validationService';
import { isInternalTestUser, getRazorpayConfig } from "~/utils";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface UseFormSubmissionProps {
  formData: FormData;
  treeLocation: string;
  donationMethod: string;
  adoptedTreeCount: number;
  donationTreeCount: number;
  donationAmount: number;
  visitDate: string;
  dedicatedNames: DedicatedName[];
  multipleNames: boolean;
  paymentOption: string;
  razorpayPaymentId: number | null;
  razorpayOrderId: string | null;
  donationId: number | null;
  rfr?: string | null;
  c_key?: string | null;
  setRazorpayPaymentId: (id: number | null) => void;
  setRazorpayOrderId: (id: string | null) => void;
  setDonationId: (id: number | null) => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

interface UseFormSubmissionReturn {
  isLoading: boolean;
  isSubmitting: boolean;
  handleSubmit: () => Promise<void>;
}

export const useFormSubmission = ({
  formData,
  treeLocation,
  donationMethod,
  adoptedTreeCount,
  donationTreeCount,
  donationAmount,
  visitDate,
  dedicatedNames,
  multipleNames,
  paymentOption,
  razorpayPaymentId,
  razorpayOrderId,
  donationId,
  rfr,
  c_key,
  setRazorpayPaymentId,
  setRazorpayOrderId,
  setDonationId,
  onSuccess,
  onError
}: UseFormSubmissionProps): UseFormSubmissionReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBankPayment = useCallback(async (uniqueRequestId: string, existingPaymentId: number | null): Promise<number> => {
    try {
      const amount = DonationService.calculateAmount(treeLocation, donationMethod, adoptedTreeCount, donationTreeCount, donationAmount);
      return await PaymentService.handleBankPayment(
        amount,
        formData.panNumber,
        formData.email,
        null as any, // paymentProof will be handled separately
        existingPaymentId
      );
    } catch (error: any) {
      throw new Error(error.message || "Bank payment processing failed");
    }
  }, [treeLocation, donationMethod, adoptedTreeCount, donationTreeCount, donationAmount, formData.panNumber, formData.email]);

  const getUniqueRequestId = useCallback((): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

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

  const verifyRazorpayPayment = useCallback(async (response: any): Promise<void> => {
    try {
      await PaymentService.verifyPayment({
        razorpay_payment_id: response.razorpay_payment_id,
        order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
        user_email: formData.email
      });
    } catch (error: any) {
      throw new Error(error.message || "Payment verification failed");
    }
  }, [formData.email]);

  const getRazorpayConfigForUser = useCallback((email: string) => {
    return getRazorpayConfig(email);
  }, []);

  const handleSubmit = useCallback(async (): Promise<void> => {
    // Validate form data
    const { isValid: mainFormValid } = ValidationService.validateMainForm(formData);
    const { isValid: dedicatedNamesValid, errors } = ValidationService.validateDedicatedNames(dedicatedNames, multipleNames);

    // Process dedicated names
    const donor = formData.fullName.toLowerCase().trim().replace(/\s+/g, '.');
    const users = dedicatedNames.filter(user => user.recipient_name?.trim()).map(user => {
      const processedUser = { ...user };
      
      if (processedUser.assignee_name && !processedUser.assignee_phone) {
        processedUser.assignee_phone = processedUser.recipient_phone;
      }

      if (processedUser.recipient_email) {
        processedUser.recipient_email = processedUser.recipient_email.trim().replace("donor", donor);
      } else {
        processedUser.recipient_email = processedUser.recipient_name.toLowerCase().trim().replace(/\s+/g, '.') + "." + donor + "@14trees";
      }

      if (processedUser.assignee_email) {
        processedUser.assignee_email = processedUser.assignee_email.trim().replace("donor", donor);
      } else {
        processedUser.assignee_email = processedUser.assignee_name.toLowerCase().trim().replace(/\s+/g, '.') + "." + donor + "@14trees";
      }

      return processedUser;
    });

    if (users.length === 1 && !multipleNames) {
      users[0].trees_count = donationTreeCount;
    }

    if (!mainFormValid || !dedicatedNamesValid) {
      console.log(errors);
      onError("Please fix the errors in the form before submitting");
      return;
    }

    setIsLoading(true);
    setIsSubmitting(true);

    try {
      // Calculate original amount first
      const originalAmount = treeLocation === "adopt"
        ? 3000 * (adoptedTreeCount || 0)
        : donationMethod === "trees"
          ? 1500 * (donationTreeCount || 0)
          : donationAmount;
      
      // No amount reduction - same pricing for all users
      const amount = originalAmount;
      const uniqueRequestId = getUniqueRequestId();
      const isAboveLimit = amount > 500000;

      // Handle payment based on selected option
      let paymentId: number | null = razorpayPaymentId || null;
      let orderId: string | null = razorpayOrderId || null;
      
      if (isAboveLimit) {
        paymentId = await handleBankPayment(uniqueRequestId, razorpayPaymentId);
        setRazorpayPaymentId(paymentId);
      } else if (!paymentId && !isAboveLimit) {
        try {
          const response = await PaymentService.createPayment({
            amount,
            donorType: "Indian Citizen",
            panNumber: formData.panNumber,
            consent: true,
            userEmail: formData.email
          });
          paymentId = response.id;
          orderId = response.order_id;
          setRazorpayPaymentId(response.id);
          setRazorpayOrderId(orderId);
        } catch (error: any) {
          throw new Error("Failed to create your request. Please try again later!");
        }
      }

      if (!paymentId) {
        throw new Error("Payment ID is required");
      }

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
        users: users,
        tags: addInternalTestTags(["WebSite"], formData.email),
        rfr: rfr,
        c_key: c_key,
        ...getInternalTestMetadata(formData.email, originalAmount),
      };

      let donId = donationId;
      if (!donId) {
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
        donId = responseData.id;
        setDonationId(responseData.id);
      }

      const razorpayConfig = getRazorpayConfigForUser(formData.email);
      
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
          "Donation Id": donId,
          ...(isInternalTestUser(formData.email) && {
            "Internal Test": "true",
            "Test User Email": formData.email,
            "Razorpay Account": "test",
            "Test Timestamp": new Date().toISOString()
          })
        },
        handler: async (response: any) => {
          if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
            onError('Payment verification failed - incomplete response');
            return;
          }
          try {
            await verifyRazorpayPayment(response);
          } catch (err) {
            console.error("Verification error:", err);
          }

          onSuccess();

          try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/donations/requests/payment-success`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                donation_id: donId.toString()
              })
            });
          } catch (err) {
            // Silent fail for payment success notification
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone || ""
        },
        theme: { color: "#339933" }
      };

      if (!isAboveLimit) {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response: any) => {
          console.error('Razorpay payment failed:', response);
          onError(`Payment failed: ${response.error.description}`);
        });
        
        rzp.on('checkout.error', (response: any) => {
          console.error('Razorpay checkout error:', response);
        });
        
        rzp.open();
      } else {
        // For bank transfers (isAboveLimit), show success dialog immediately
        onSuccess();
        
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/donations/requests/payment-success`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              donation_id: donId
            })
          });
        } catch (err) {
          // Silent fail for payment success notification
        }
      }

    } catch (err: any) {
      console.error("Donation error:", err);
      onError(err.message || "Failed to create donation");
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
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
    multipleNames,
    paymentOption,
    razorpayPaymentId,
    razorpayOrderId,
    donationId,
    rfr,
    c_key,
    setRazorpayPaymentId,
    setRazorpayOrderId,
    setDonationId,
    onSuccess,
    onError,
    handleBankPayment,
    getUniqueRequestId,
    addInternalTestPrefix,
    addInternalTestComments,
    addInternalTestTags,
    getInternalTestMetadata,
    verifyRazorpayPayment,
    getRazorpayConfigForUser
  ]);

  return {
    isLoading,
    isSubmitting,
    handleSubmit
  };
};