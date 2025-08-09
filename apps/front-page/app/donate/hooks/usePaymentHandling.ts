import { useState, useCallback } from 'react';
import { PaymentService, RazorpayOptions } from '../services/paymentService';
import { isInternalTestUser } from "~/utils";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface UsePaymentHandlingProps {
  userEmail: string;
  userName: string;
  userPhone: string;
  panNumber: string;
}

interface UsePaymentHandlingReturn {
  isProcessing: boolean;
  razorpayPaymentId: number | null;
  razorpayOrderId: string | null;
  processRazorpayPayment: (
    amount: number,
    donationId: number,
    treeLocation: string,
    adoptedTreeCount: number,  
    donationTreeCount: number,
    onSuccess: () => void,
    onFailure: (error: string) => void
  ) => Promise<void>;
  processBankPayment: (
    amount: number,
    paymentProof: File,
    existingPaymentId?: number
  ) => Promise<number>;
  createPaymentOrder: (amount: number) => Promise<{ paymentId: number; orderId: string }>;
  setRazorpayPaymentId: (id: number | null) => void;
  setRazorpayOrderId: (id: string | null) => void;
}

export const usePaymentHandling = ({
  userEmail,
  userName,
  userPhone,
  panNumber
}: UsePaymentHandlingProps): UsePaymentHandlingReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayPaymentId, setRazorpayPaymentId] = useState<number | null>(null);
  const [razorpayOrderId, setRazorpayOrderId] = useState<string | null>(null);

  const createPaymentOrder = useCallback(async (amount: number): Promise<{ paymentId: number; orderId: string }> => {
    try {
      const response = await PaymentService.createPayment({
        amount,
        donorType: "Indian Citizen",
        panNumber,
        consent: true,
        userEmail
      });

      setRazorpayPaymentId(response.id);
      setRazorpayOrderId(response.order_id);

      return {
        paymentId: response.id,
        orderId: response.order_id
      };
    } catch (error: any) {
      throw new Error(error.message || "Failed to create payment");
    }
  }, [userEmail, panNumber]);

  const processRazorpayPayment = useCallback(async (
    amount: number,
    donationId: number,
    treeLocation: string,
    adoptedTreeCount: number,
    donationTreeCount: number,
    onSuccess: () => void,
    onFailure: (error: string) => void
  ): Promise<void> => {
    if (amount <= 0) {
      onFailure("Invalid amount");
      return;
    }

    if (!userName || !userEmail) {
      onFailure("Please fill in all required fields before payment");
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment order if not exists
      let orderId = razorpayOrderId;
      let paymentId = razorpayPaymentId;

      if (!orderId || !paymentId) {
        const orderResult = await createPaymentOrder(amount);
        orderId = orderResult.orderId;
        paymentId = orderResult.paymentId;
      }

      // Create Razorpay options
      const options = PaymentService.createRazorpayOptions(
        amount,
        orderId,
        donationId,
        userEmail,
        userName,
        userPhone,
        treeLocation,
        adoptedTreeCount,
        donationTreeCount,
        () => {
          onSuccess();
          setIsProcessing(false);
        },
        (error: string) => {
          onFailure(error);
          setIsProcessing(false);
        }
      );

      // Debug logging for Razorpay configuration
      console.log('Razorpay Debug Info:', {
        userEmail,
        isInternalTestUser: isInternalTestUser(userEmail),
        razorpayKeyId: options.key,
        orderId,
        amount
      });

      // Open Razorpay checkout
      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', (response: any) => {
        console.error('Razorpay payment failed:', response);
        onFailure(`Payment failed: ${response.error.description}`);
        setIsProcessing(false);
      });

      rzp.on('checkout.error', (response: any) => {
        console.error('Razorpay checkout error:', response);
        setIsProcessing(false);
      });

      rzp.open();
    } catch (error: any) {
      onFailure(error.message || "Payment failed");
      setIsProcessing(false);
    }
  }, [
    userEmail, 
    userName, 
    userPhone, 
    razorpayOrderId, 
    razorpayPaymentId, 
    createPaymentOrder
  ]);

  const processBankPayment = useCallback(async (
    amount: number,
    paymentProof: File,
    existingPaymentId?: number
  ): Promise<number> => {
    try {
      const paymentId = await PaymentService.handleBankPayment(
        amount,
        panNumber,
        userEmail,
        paymentProof,
        existingPaymentId
      );

      setRazorpayPaymentId(paymentId);
      return paymentId;
    } catch (error: any) {
      throw new Error(error.message || "Bank payment processing failed");
    }
  }, [userEmail, panNumber]);

  return {
    isProcessing,
    razorpayPaymentId,
    razorpayOrderId,
    processRazorpayPayment,
    processBankPayment,
    createPaymentOrder,
    setRazorpayPaymentId,
    setRazorpayOrderId
  };
};