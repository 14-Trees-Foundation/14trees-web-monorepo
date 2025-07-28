import { useState, useCallback } from 'react';
import { apiClient } from "~/api/apiClient";
import { 
  getUniqueRequestId, 
  getRazorpayConfig,
  getInternalTestMetadata,
  addInternalTestTags,
  addInternalTestPrefix,
  addInternalTestComments
} from "~/utils";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  numberOfTrees: string;
  panNumber: string;
  comments: string;
}

interface UsePaymentHandlingProps {
  formData: FormData;
  dedicatedNames: any[];
  totalAmount: number;
  isAboveLimit: boolean;
  eventName: string | null;
  eventType: string | null;
  plantedBy: string | null;
  giftedOn: Date;
  primaryMessage: string;
  secondaryMessage: string;
  rfr: string | null;
  c_key: string | null;
  paymentProof: File | null;
}

interface UsePaymentHandlingReturn {
  isProcessing: boolean;
  isLoading: boolean;
  requestInProgress: boolean;
  razorpayPaymentId: number | null;
  razorpayOrderId: string | null;
  rpPaymentSuccess: boolean;
  processedRequestId: string | null;
  giftRequestId: string | null;
  showSuccessDialog: boolean;
  setShowSuccessDialog: (show: boolean) => void;
  handleSubmit: () => Promise<void>;
  handleRazorpayPayment: () => Promise<void>;
  handleBankPayment: (uniqueRequestId: string, paymentId: number | null) => Promise<number | null>;
  calculateGiftingAmount: () => number;
}

export const usePaymentHandling = ({
  formData,
  dedicatedNames,
  totalAmount,
  isAboveLimit,
  eventName,
  eventType,
  plantedBy,
  giftedOn,
  primaryMessage,
  secondaryMessage,
  rfr,
  c_key,
  paymentProof
}: UsePaymentHandlingProps): UsePaymentHandlingReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [requestInProgress, setRequestInProgress] = useState(false);
  const [razorpayPaymentId, setRazorpayPaymentId] = useState<number | null>(null);
  const [razorpayOrderId, setRazorpayOrderId] = useState<string | null>(null);
  const [rpPaymentSuccess, setRpPaymentSuccess] = useState<boolean>(false);
  const [processedRequestId, setProcessedRequestId] = useState<string | null>(null);
  const [giftRequestId, setGiftRequestId] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const calculateGiftingAmount = useCallback((): number => {
    return 2000;
  }, []);

  const handleBankPayment = useCallback(async (uniqueRequestId: string, paymentId: number | null): Promise<number | null> => {
    if (!paymentProof) {
      alert("Please upload a payment proof");
      return null;
    }

    try {
      const amount = calculateGiftingAmount() * Number(formData.numberOfTrees);
      if (amount <= 0) throw new Error("Invalid amount");

      if (!paymentId) {
        const response = await apiClient.createPayment(amount, "Indian Citizen", formData.panNumber, false, formData.email);
        paymentId = response.id;
      }

      if (!paymentId) {
        alert("Payment ID is required");
        return null;
      }

      const key = uniqueRequestId + "/payments/" + paymentProof.name;
      const url = await apiClient.uploadPaymentProof({ key, payment_proof: paymentProof });
      await apiClient.createPaymentHistory(paymentId, "Bank Transfer", amount, url);

      return paymentId;
    } catch (err: any) {
      alert(err.message || "Payment failed");
      return null;
    }
  }, [paymentProof, formData, calculateGiftingAmount]);

  const handleRazorpayPayment = useCallback(async (): Promise<void> => {
    if (isAboveLimit) {
      alert("Please use Bank Transfer for gifting trees above ₹5,00,000");
      return;
    }

    if (!formData.fullName || !formData.email || !formData.phone || !formData.panNumber || !formData.numberOfTrees) {
      alert("Please fill in all required fields before payment");
      return;
    }

    setIsProcessing(true);
    try {
      const amount = calculateGiftingAmount() * Number(formData.numberOfTrees);
      if (amount <= 0) throw new Error("Invalid amount");

      let orderId = razorpayOrderId;
      if (!orderId) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            amount,
            donor_type: "Indian Citizen",
            pan_number: formData.panNumber,
            consent: false,
          })
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Payment failed");
        }

        const { order_id, id } = await response.json();
        setRazorpayPaymentId(id);
        setRazorpayOrderId(order_id);
        orderId = order_id;
      }

      const razorpayConfig = getRazorpayConfig(formData.email);
      
      const options = {
        key: razorpayConfig.key_id,
        amount: amount * 100,
        currency: 'INR',
        name: "14 Trees Foundation",
        description: `Gifting ${formData.numberOfTrees} trees`,
        order_id: orderId,
        handler: async (response: any) => {
          setRpPaymentSuccess(true);
          if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
            alert('Payment verification failed - incomplete response');
            return;
          }
          try {
            const verificationResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'verify',
                payment_id: response.razorpay_payment_id,
                order_id: response.razorpay_order_id,
                signature: response.razorpay_signature,
                user_email: formData.email
              })
            });
            if (!verificationResponse.ok) throw new Error("Verification failed");
          } catch (err) {
            console.error("Verification error:", err);
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
        alert(`Payment failed: ${response.error.description}`);
      });
      rzp.open();

    } catch (err: any) {
      alert(err.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  }, [isAboveLimit, formData, razorpayOrderId, calculateGiftingAmount]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    // Prevent multiple submissions
    if (isLoading || isProcessing || requestInProgress) {
      return;
    }

    if (!formData.fullName || !formData.email || !formData.phone || !formData.panNumber || !formData.numberOfTrees) {
      alert("Please fill in all required fields before payment");
      return;
    }

    setIsLoading(true);
    setIsProcessing(true);
    setRequestInProgress(true);

    const uniqueRequestId = getUniqueRequestId();

    // Additional check to prevent duplicate requests with same ID
    if (processedRequestId === uniqueRequestId) {
      setIsLoading(false);
      setIsProcessing(false);
      setRequestInProgress(false);
      return;
    }

    const amount = calculateGiftingAmount() * Number(formData.numberOfTrees);
    let paymentId: number | null = razorpayPaymentId || null;
    let orderId: string | null = razorpayOrderId || null;
    
    if (isAboveLimit) {
      paymentId = await handleBankPayment(uniqueRequestId, razorpayPaymentId);
      setRazorpayPaymentId(paymentId);
    } else if (!paymentId && !isAboveLimit) {
      try {
        const response = await apiClient.createPayment(amount, "Indian Citizen", formData.panNumber, false, formData.email);
        paymentId = response.id;
        orderId = response.order_id;
        setRazorpayPaymentId(paymentId);
        setRazorpayOrderId(orderId);
      } catch (error: any) {
        alert("Failed to create your request. Please try again later!");
        setIsProcessing(false);
        setIsLoading(false);
        setRequestInProgress(false);
        return;
      }
    }

    if (!paymentId) {
      setIsLoading(false);
      setIsProcessing(false);
      setRequestInProgress(false);
      return;
    }

    let userId: number | null = null;
    try {
      const user = await apiClient.getUser(formData.email);
      if (!user) {
        const userData = await apiClient.createUser(
          formData.fullName,
          formData.email
        );
        userId = userData.id;
      } else {
        userId = user.id;
      }
    } catch (error: any) {
      console.error("User creation error:", error);
      alert(error.message || "Failed to create user");
      setIsLoading(false);
      setIsProcessing(false);
      setRequestInProgress(false);
      return;
    }

    let users = dedicatedNames.filter(user => user.recipient_name.trim() != "");

    const donor = formData.fullName.replaceAll(" ", "").toLocaleLowerCase();
    users = users.map(item => {
      let user = { ...item }
      if (!user.assignee_name?.trim()) {
        user.assignee_name = user.recipient_name;
        user.assignee_email = user.recipient_email;
        user.assignee_phone = user.recipient_phone;
      }
      user.recipient_communication_email = item.recipient_communication_email || "";

      if (user.recipient_email) {
        user.recipient_email = user.recipient_email.replace("donor", donor);
      } else {
        user.recipient_email = user.recipient_name.trim().toLowerCase().replace(/\s+/g, '.') + "." + donor + "@14trees"
      }

      if (user.assignee_email) {
        user.assignee_email = user.assignee_email.replace("donor", donor);
      } else {
        user.assignee_email = user.assignee_name.trim().toLowerCase().replace(/\s+/g, '.') + "." + donor + "@14trees"
      }

      return user;
    });

    try {
      const giftTreesRequest = {
        request_id: uniqueRequestId,
        user_id: userId,
        sponsor_id: userId,
        sponsor_name: addInternalTestPrefix(formData.fullName, formData.email),
        sponsor_email: formData.email,
        sponsor_phone: formData.phone,
        category: "Public",
        grove: null,
        no_of_cards: parseInt(formData.numberOfTrees),
        payment_id: paymentId,
        contribution_options: [],
        comments: addInternalTestComments(formData.comments, formData.email),
        primary_message: primaryMessage,
        secondary_message: secondaryMessage,
        request_type: 'Gift Cards',
        tags: addInternalTestTags(["WebSite"], formData.email),
        event_name: eventName,
        event_type: eventType,
        planted_by: plantedBy,
        gifted_on: giftedOn,
        rfr: rfr,
        c_key: c_key,
        remaining_trees: parseInt(formData.numberOfTrees) - users.map(user => Number(user.trees_count)).reduce((prev, curr) => prev + curr, 0),
        ...getInternalTestMetadata(formData.email, totalAmount),
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gift-cards/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(giftTreesRequest)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gift Trees Request submission failed");
      }

      const responseData = await response.json();
      const newGiftRequestId = responseData.id;
      
      // Mark this request as processed to prevent duplicates
      setProcessedRequestId(uniqueRequestId);

      if (users.length > 0) {
        try {
          const usersResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gift-cards/users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              gift_card_request_id: newGiftRequestId,
              users: users.map(user => ({
                ...user,
                gifted_trees: user.trees_count,
              })),
            })
          });

          if (!usersResponse.ok) {
            const error = await usersResponse.json();
            throw new Error(error.message || "Gift Cards Users creation failed");
          }
        } catch (error) {
          console.error("Failed to create gift cards users:", error);
        }
      }

      setGiftRequestId(responseData.id);

      // Handle razorpay payment
      if (orderId) {
        const razorpayConfig = getRazorpayConfig(formData.email);
        
        const options = {
          key: razorpayConfig.key_id,
          amount: amount * 100,
          currency: 'INR',
          name: "14 Trees Foundation",
          description: `Gifting ${formData.numberOfTrees} trees`,
          order_id: orderId,
          notes: {
            "Gift Request Id": responseData.id,
          },
          handler: async (response: any) => {
            setRpPaymentSuccess(true);
            if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
              alert('Payment verification failed - incomplete response');
              return;
            }
            try {
              setShowSuccessDialog(true);
              const verificationResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'verify',
                  razorpay_payment_id: response.razorpay_payment_id,
                  order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  user_email: formData.email
                })
              });
              if (!verificationResponse.ok) throw new Error("Verification failed");
            } catch (err) {
              console.error("Verification error:", err);
            }

            try {
              await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gift-cards/requests/payment-success`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  gift_request_id: responseData.id,
                  remaining_trees: parseInt(formData.numberOfTrees) - users.map(user => Number(user.trees_count)).reduce((prev, curr) => prev + curr, 0),
                })
              });
            } catch (err) {
              // Silent fail
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
          alert(`Payment failed: ${response.error.description}`);
        });
        rzp.open();
      } else if (isAboveLimit) {
        // For bank transfers, show success dialog immediately after request creation
        setShowSuccessDialog(true);
        
        // Also call the payment success endpoint for bank transfers
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gift-cards/requests/payment-success`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gift_request_id: responseData.id,
              remaining_trees: parseInt(formData.numberOfTrees) - users.map(user => Number(user.trees_count)).reduce((prev, curr) => prev + curr, 0),
            })
          });
        } catch (err) {
          console.error("Failed to mark payment success for bank transfer:", err);
        }
      }

    } catch (err: any) {
      console.error("Gift trees request error:", err);
      alert(err.message || "Failed to create gift trees request");
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
      setRequestInProgress(false);
    }
  }, [
    isLoading, isProcessing, requestInProgress, formData, processedRequestId,
    calculateGiftingAmount, isAboveLimit, handleBankPayment, razorpayPaymentId,
    razorpayOrderId, dedicatedNames, primaryMessage, secondaryMessage,
    eventName, eventType, plantedBy, giftedOn, rfr, c_key, totalAmount
  ]);

  return {
    isProcessing,
    isLoading,
    requestInProgress,
    razorpayPaymentId,
    razorpayOrderId,
    rpPaymentSuccess,
    processedRequestId,
    giftRequestId,
    showSuccessDialog,
    setShowSuccessDialog,
    handleSubmit,
    handleRazorpayPayment,
    handleBankPayment,
    calculateGiftingAmount
  };
};