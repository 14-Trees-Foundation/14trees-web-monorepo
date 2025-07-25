"use client";


import MotionDiv from "components/animation/MotionDiv";
import { ScrollReveal } from "components/Partials/HomePage";
import { useState, useEffect, Suspense } from "react";
import { apiClient } from "~/api/apiClient";
import { 
  getUniqueRequestId, 
  isInternalTestUser, 
  getRazorpayConfig,
  getInternalTestMetadata,
  addInternalTestTags,
  addInternalTestPrefix,
  addInternalTestComments
} from "~/utils";
import { SummaryPaymentPage } from "./giftingSummary";
import Recipients from "components/Recipients";
import CsvUpload from "components/CsvUpload";
import GiftCardPreview from "components/gift-trees/GiftCardPreview";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Tooltip from '@mui/material/Tooltip';
import { useSearchParams } from "next/navigation";
import { ReferralDialog } from "components/referral/ReferralDialog";
import { Modal } from "ui";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface DedicatedName {
  recipient_name: string;
  recipient_email: string;
  assignee_name: string;
  assignee_email: string;
  relation: string;
  trees_count: number;
  image?: string;
  image_url?: string;
  [key: string]: string | number | undefined;
}

interface ValidationAlertProps {
  show: boolean;
  onClose: () => void;
  title: string;
  message: React.ReactNode;
}

const ValidationAlert = ({ show, onClose, title, message }: ValidationAlertProps) => {
  return (
    <Modal
      show={show}
      onClose={onClose}
      title={title}
      showCloseButton
      panelClass="rounded-lg p-6"
    >
      <div className="text-gray-700 p-6">
        {message}
      </div>
    </Modal>
  );
};

// Internal Test Banner Component
const InternalTestBanner = ({ userEmail }: { userEmail: string }) => {
  if (!isInternalTestUser(userEmail)) return null;
  
  return (
    <div className="bg-orange-500 text-white p-3 text-center font-bold text-sm md:text-base fixed top-16 left-0 right-0 z-50 shadow-lg">
      🔧 Internal Testing Mode - Using Test Razorpay Account
    </div>
  );
};

function GiftTrees() {
  const searchParams = useSearchParams();
  const rfr = searchParams.get('r');
  const c_key = searchParams.get('c');

  // Form state (existing state remains unchanged)
  const [eventName, setEventName] = useState<string | null>(null); // New state for event name
  const [eventType, setEventType] = useState<string | null>(null); // New state for event type
  const [giftedOn, setGiftedOn] = useState<Date>(new Date()); // New state for gifted on
  const [plantedBy, setPlantedBy] = useState<string | null>(null); // New state for planted by
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recipientOption, setRecipientOption] = useState<'manual' | 'csv'>('manual');

  const [treeCountValid, setTreeCountValid] = useState(false);
  const [presentationId, setPresentationId] = useState<string | null>(null);
  const [slideId, setSlideId] = useState<string | null>(null);
  const [treeLocation, setTreeLocation] = useState("");
  const [dedicatedNames, setDedicatedNames] = useState<DedicatedName[]>([{
    recipient_name: "",
    recipient_email: "",
    assignee_name: "",
    assignee_email: "",
    relation: "",
    trees_count: 1
  }]);
  const [primaryMessage, setPrimaryMessage] = useState("");
  const [secondaryMessage, setSecondaryMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayPaymentId, setRazorpayPaymentId] = useState<number | null>(null);
  const [razorpayOrderId, setRazorpayOrderId] = useState<string | null>(null);
  const [rpPaymentSuccess, setRpPaymentSuccess] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    numberOfTrees: "10",
    panNumber: "",
    comments: ""
  });
  const [totalAmount, setTotalAmount] = useState(0);
  const [isAboveLimit, setIsAboveLimit] = useState(false);
  const [csvHasErrors, setCsvHasErrors] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [giftRequestId, setGiftRequestId] = useState<string | null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [windowWidth, setWindowWidth] = useState(1024); // default value
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [hasDuplicateNames, setHasDuplicateNames] = useState(false);
  const [hasAssigneeError, setHasAssigneeError] = useState(false);
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [referralDetails, setReferralDetails] = useState<{ referred_by?: string, name?: string, c_key?: string, description?: string } | null>(null);
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  const [validationAlertData, setValidationAlertData] = useState<{
    title: string;
    message: React.ReactNode;
  }>({ title: "", message: "" });
  const [requestInProgress, setRequestInProgress] = useState(false);
  const [processedRequestId, setProcessedRequestId] = useState<string | null>(null);

  const scrollToRecipients = () => {
    const recipientsSection = document.getElementById('gift-recipients');
    if (recipientsSection) {
      const offset = -100;
      const top = recipientsSection.getBoundingClientRect().top + window.pageYOffset + offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (recipientOption === 'csv') {
      const totalTrees = dedicatedNames.reduce((sum, name) => sum + (name.trees_count || 0), 0);
      setCsvHasErrors(totalTrees > Number(formData.numberOfTrees));
    }
  }, [formData.numberOfTrees, recipientOption]);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
  }, []);

  useEffect(() => {
    const treesCount = parseInt(formData.numberOfTrees) || 0;
    const treesAssigned = dedicatedNames.reduce((sum, name) => sum + (name.trees_count || 0), 0);

    setTreeCountValid(treesAssigned === treesCount);
  }, [formData.numberOfTrees, dedicatedNames]);

  useEffect(() => {
    const fetchReferralDetails = async () => {
      if (rfr || c_key) {
        try {
          const details = await apiClient.getReferrelDetails(rfr, c_key);
          setReferralDetails(details);
        } catch (error) {
          console.error('Failed to fetch referral details:', error);
        }
      }
    };

    fetchReferralDetails();
  }, [rfr, c_key]);

  const calculateGiftingAmount = (): number => {
    return 2000;
  };

  // Calculate total amount (existing unchanged)
  useEffect(() => {
    const perTreeAmount = calculateGiftingAmount();
    const total = perTreeAmount * Number(formData.numberOfTrees || 0);
    setTotalAmount(total);
    setIsAboveLimit(total > 500000);

  }, [treeLocation, formData.numberOfTrees]);

  useEffect(() => {
    setErrors(prev => {
      const newErrors = { ...prev };

      return newErrors;
    });
  }, []);

  useEffect(() => {
    const seen = new Set<string>();
    const duplicateFound = dedicatedNames.some(({ recipient_name }) => {
      const name = recipient_name.trim().toLowerCase();
      if (name === "") return false;
      if (seen.has(name)) return true;
      seen.add(name);
      return false;
    });
    setHasDuplicateNames(duplicateFound);
  }, [dedicatedNames]);
  

  const handleRecipientOptionChange = (option: 'manual' | 'csv') => {
    setRecipientOption(option);

    if (option === 'manual') {

      const manualData = [{
        recipient_name: "",
        recipient_email: "",
        assignee_name: "",
        assignee_email: "",
        relation: "",
        trees_count: 1
      }];
      setDedicatedNames(manualData);
    } else {
      setDedicatedNames([]);
    }
  };


  const getOccasionQuestion = () => {
    const treeCount = parseInt(formData.numberOfTrees) || 0;
    return treeCount === 1
      ? "Is there a special occasion you're celebrating with this tree?"
      : "Is there a special occasion you're celebrating with these trees?";
  };

  // Animation variants (existing unchanged)
  const containerVariants = {
    hidden: { opacity: 0, y: 10, scale: 1.05 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5 },
    },
  };

  // Validation patterns (existing unchanged)
  const validationPatterns = {
    name: /^[A-Za-z0-9\s.,&_'-]+$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^\+?[0-9\s\-()]{7,20}$/,
    pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    number: /^[0-9]+(\.[0-9]+)?$/
  };

  // Validate field (existing unchanged)
  const validateField = (name: string, value: string) => {
    let error = "";

    if (!value.trim()) {
      if (name === "phone") return "";
      if (name === "panNumber") return "";
      if (name === "comments") return "";

      return "This field is required";
    }

    switch (name) {
      case "email":
        if (!validationPatterns.email.test(value)) {
          error = "Please enter a valid email address";
        }
        break;
      case "phone":
        if (!validationPatterns.phone.test(value)) {
          error = "Please enter a valid phone number (10-15 digits)";
        }
        break;
      case "panNumber":
        if (value && !validationPatterns.pan.test(value)) {
          error = "Please enter a valid PAN number (e.g., ABCDE1234F)";
        }
        break;

      case "numberOfTrees":
        if (!value.trim()) {
          error = "Number of trees is required";
        } else if (!validationPatterns.number.test(value)) {
          error = "Please enter a valid number";
        } else if (parseInt(value) <= 0) {
          error = "Must be at least 1 tree";
        }
        break;
    }

    return error;
  };

  // Handle input changes (existing unchanged)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === "numberOfTrees") {
      setErrors(prev => ({ ...prev, numberOfTrees: "" }));
    }

    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));

    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === "fullName") {
      setPlantedBy(prev => prev || value);
    }
  };

  // Validate dedicated names (existing unchanged)
  const validateDedicatedNames = () => {
    let isValid = true;
    const newErrors: Record<string, string> = {};
    const seenNames = new Set();

    // Calculate total trees count
    const totalTrees = dedicatedNames.reduce((sum, name) => sum + (name.trees_count || 1), 0);

    // Check if total trees exceed the number of trees being gifting
    if (formData.numberOfTrees && totalTrees > Number(formData.numberOfTrees)) {
      newErrors["totalTrees"] = `Total trees (${totalTrees}) cannot exceed the number of trees you're gifting (${formData.numberOfTrees})`;
      isValid = false;
    }

    dedicatedNames.forEach((name, index) => {
      const normalizedName = name.recipient_name.toLowerCase().trim();
      if (seenNames.has(normalizedName)) {
        newErrors[`dedicatedName-${index}`] = "Duplicate recipient name";
        isValid = false;
      } else if (normalizedName) {
        seenNames.add(normalizedName);
      }
      if (!name.recipient_name.trim()) {
        newErrors[`dedicatedName-${index}`] = "Name is required";
        isValid = false;
      }

      if (name.recipient_email && !validationPatterns.email.test(name.recipient_email)) {
        newErrors[`dedicatedEmail-${index}`] = "Please enter a valid email";
        isValid = false;
      }

    });
    setErrors(prev => ({ ...prev, ...newErrors }));
    return isValid;
  };

  // Existing form submission (unchanged)
  const handleSubmit = async () => {
    // Prevent multiple submissions
    if (isLoading || isProcessing || requestInProgress) {
      return;
    }

    if (!formData.fullName || !formData.email || !formData.phone || !formData.panNumber || !formData.numberOfTrees) {
      alert("Please fill in all required fields before payment");
      return;
    }

    const mainFormValid = Object.keys(formData).every(key => {
      if (key === "comments") {
        return true;
      }


      const value = formData[key as keyof typeof formData];
      if (!value && key !== "phone" && key !== "panNumber" && key !== "comments") {
        setErrors(prev => ({ ...prev, [key]: "This field is required" }));
        return false;
      }

      const error = validateField(key, value);
      if (error) {
        setErrors(prev => ({ ...prev, [key]: error }));
        return false;
      }

      return true;
    });

    const dedicatedNamesValid = dedicatedNames.length === 1 && dedicatedNames[0].recipient_name.trim() === "" ? true : validateDedicatedNames();
    if (!mainFormValid || !dedicatedNamesValid) {
      console.log(errors);
      alert("Please fix the errors in the form before submitting");
      setIsLoading(false);
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
        return;
      }
    }

    if (!paymentId) {
      setIsLoading(false);
      setIsProcessing(false);
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
        userId = userData.id; // Extract user_id from the response
      } else {
        userId = user.id;
      }
    } catch (error) {
      console.error("User creation error:", error);
      alert(error.message || "Failed to create user");
      setIsLoading(false);
      setIsProcessing(false);
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
    })

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
        // Add internal test metadata if applicable
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
      const giftRequestId = responseData.id;
      
      // Mark this request as processed to prevent duplicates
      setProcessedRequestId(uniqueRequestId);

      if (users.length > 0) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gift-cards/users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              gift_card_request_id: giftRequestId,
              users: users.map(user => ({
                ...user,
                gifted_trees: user.trees_count,
              })),
            })
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Gift Cards Users creation failed");
          }

        } catch (error) {
          console.error("Failed to create gift cards users:", error);
        }
      }

      setGiftRequestId(responseData.id);

      // handle razorpay payment
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
              // alert("Payment successful!");
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
              // 
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
  };

  // Rest of your existing functions (unchanged)
  const handleAddName = () => {
    console.log("Called")
    const lastRecipient = dedicatedNames[dedicatedNames.length - 1];

    // Check if the last name is empty
    if (lastRecipient.recipient_name.trim() === "") {
      console.log("Returned")
      return;
    }

    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.duplicateRecipient;
      return newErrors;
    });

    setDedicatedNames(prev => [...prev, { recipient_name: "", recipient_email: "", assignee_name: "", assignee_email: "", relation: "", trees_count: 1 }]);
  };

  const handleRemoveName = (index: number) => {
    const newNames = [...dedicatedNames];
    newNames.splice(index, 1);
    setDedicatedNames(newNames);

    const newErrors = { ...errors };
    delete newErrors[`dedicatedName-${index}`];
    delete newErrors[`dedicatedEmail-${index}`];
    delete newErrors[`dedicatedPhone-${index}`];
    setErrors(newErrors);
  };

  const handleNameChange = (index: number, field: keyof DedicatedName, value: string | number) => {
    setDedicatedNames(prev => {
      const newNames = [...prev];
      newNames[index] = { ...newNames[index], [field]: value };
      return newNames;
    });

    if (field === "recipient_name" && value) {
      const error = "";
      setErrors(prev => ({ ...prev, [`dedicatedName-${index}`]: error }));
    } else if (field === "recipient_email" && value) {
      const error = !validationPatterns.email.test(value.toString())
        ? "Please enter a valid email address"
        : "";
      setErrors(prev => ({ ...prev, [`dedicatedEmail-${index}`]: error }));
    } else if (field === "recipient_phone" && value) {
      const error = !validationPatterns.phone.test(value.toString())
        ? "Please enter a valid phone number"
        : "";
      setErrors(prev => ({ ...prev, [`dedicatedPhone-${index}`]: error }));
    } else if (field === "trees_count" && value) {
      // Validate that the value is a valid number
      const error = isNaN(Number(value))
        ? "Please enter a valid number"
        : "";

      // Check if the sum of trees_count exceeds formData.numberOfTrees
      if (!error && formData.numberOfTrees) {
        const totalTrees = dedicatedNames.reduce((sum, name, i) => {
          if (i === index) {
            return sum + Number(value);
          }
          return sum + (name.trees_count || 0);
        }, 0);

        if (totalTrees > Number(formData.numberOfTrees)) {
          setErrors(prev => ({
            ...prev,
            [`dedicatedTreeCount-${index}`]: `Total trees (${totalTrees}) cannot exceed the number of trees you're gifting (${formData.numberOfTrees})`
          }));
          return;
        }
      }

      setErrors(prev => ({ ...prev, [`dedicatedTreeCount-${index}`]: error }));
    } else if (field === "assignee_name" && value) {
      const error = "";
      setErrors(prev => ({ ...prev, [`assigneeName-${index}`]: error }));
    } else if (field === "recipient_email" && value) {
      const error = !validationPatterns.email.test(value.toString())
        ? "Please enter a valid email address"
        : "";
      setErrors(prev => ({ ...prev, [`dedicatedEmail-${index}`]: error }));
    } else if (field === "recipient_phone" && value) {
      const error = !validationPatterns.phone.test(value.toString())
        ? "Please enter a valid phone number"
        : "";
      setErrors(prev => ({ ...prev, [`dedicatedPhone-${index}`]: error }));
    }

  };

  const handleRazorpayPayment = async () => {
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
            // alert("Payment successful!");
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
  };

  const handleBankPayment = async (uniqueRequestId: string, paymentId: number | null) => {
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
  }

  // Add this new component before your return statement
  const SuccessDialog = () => {
    const [additionalInvolvement, setAdditionalInvolvement] = useState<string[]>([]);
    const [comments, setComments] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateSuccess, setUpdateSuccess] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [skipped, setSkipped] = useState(false); // New state for skip tracking

    const involvementOptions = [
      { display: "Plan a visit to the project site and plant trees by my own hands", value: "Planning visit" },
      { display: "Explore possibility of CSR contribution through my company or my employer", value: "CSR" },
      { display: "Volunteer my time, energy and expertise to grow this initiative further", value: "Volunteer" },
      { display: "Share the mission of 'Project 14 trees' with my friends and family", value: "Share" }
    ];

    const handleInvolvementChange = (value: string) => {
      setAdditionalInvolvement(prev =>
        prev.includes(value)
          ? prev.filter(item => item !== value)
          : [...prev, value]
      );
    };

    const handleReset = () => {
      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        numberOfTrees: "10", // Reset to default value
        panNumber: "",
        comments: ""
      });
      setRecipientOption('manual');
      setDedicatedNames([{
        recipient_name: "",
        recipient_email: "",
        assignee_name: "",
        assignee_email: "",
        relation: "",
        trees_count: 1
      }]);
      setEventName(null);
      setEventType(null);
      setPlantedBy(null);
      setCurrentStep(1);
      setTreeLocation("");
      setErrors({});
      setRpPaymentSuccess(false);
      setRazorpayOrderId(null);
      setRazorpayPaymentId(null);
      setPreviewUrl(null);
      setPresentationId(null);
      setSlideId(null);
      setEventName(null);
      setEventType(null);
      setGiftedOn(new Date());
      setPlantedBy(null);
      setGiftRequestId(null);
      setPrimaryMessage("");
      setSecondaryMessage("");
      setShowSuccessDialog(false);
      setProcessedRequestId(null);
    }

    const handleUpdate = async () => {
      if (!giftRequestId) return;

      setIsUpdating(true);
      setUpdateError(null);

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gift-cards/requests/update`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gift_card_request_id: giftRequestId,
            updateFields: ['contribution_options', 'comments'],
            data: {
              contribution_options: additionalInvolvement,
              comments: comments
            }
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update gift trees request details');
        }

        setUpdateSuccess(true);
      } catch (err: any) {
        setUpdateError(err.message);
      } finally {
        setIsUpdating(false);
      }
    };

    const handleSkip = () => {
      setSkipped(true); // Show thank you message without saving
    };

    const handleClose = () => {
      handleReset();
      setShowSuccessDialog(false);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 m-5 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-bold text-green-600 mb-4">Your memory is being planted!</h3>
          <p className="mb-2">Your request has been submitted successfully. We&apos;re crafting your personalised tree card.</p>
          {giftRequestId && (
            <p className="mb-2">
              <strong>Gift Trees Request ID:</strong> {giftRequestId}
            </p>
          )}
          <ul className="list-disc pl-6 mb-4 text-sm">
            <li>The receipt and the certificate of appreciation have been sent to your email ID.</li>
            <li>
              Soft copy of the cards will be sent via email within two working days.
              <ul className="list-disc pl-6">
                <li>
                  <i>(Sometimes the email lands up in the Spam/Junk folder, please ensure to check it)</i>.
                </li>
                <li>
                  This email will contain the link to your tree dashboard, which will show the latest picture of the plant/tree, location on the map and other details.
                </li>
              </ul>
            </li>
            <li>You can also print the cards, the default size of the card is A5.</li>
            <li>
              In case of any issues, please call <strong>+91 98458 05881</strong> or email{" "}
              <a href="mailto:contact@14trees.org" className="text-blue-600 underline">
                contact@14trees.org
              </a>.
            </li>
          </ul>

          {(!updateSuccess && !skipped) ? (
            <div className="space-y-6">
              {/* Divider */}
              <div className="h-px bg-gray-200"></div>

              {/* Additional Involvement Section */}
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Besides gifting, I would also like to:</p>
                <div className="space-y-2">
                  {involvementOptions.map((option) => (
                    <label key={option.value} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={additionalInvolvement.includes(option.value)}
                        onChange={() => handleInvolvementChange(option.value)}
                        className="h-5 w-5"
                      />
                      <span className="text-sm">{option.display}</span>
                    </label>
                  ))}
                </div>
                <p className="text-sm text-gray-600">We will get in touch with you based on the options you select.</p>
              </div>

              {/* Additional Comments Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Would you like to add any comments, feedback, ideas for improvement?
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-700"
                    rows={4}
                  />
                </div>
              </div>

              {updateError && (
                <p className="text-red-600 text-sm">{updateError}</p>
              )}

              <div className="mt-12 h-px bg-gray-200"></div>
              <div className="mt-6 mb-6 space-y-4 bg-green-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-green-800">Inspire Others to Give</h4>
                <p className="text-sm text-green-700">
                  Do you know, you can create your personal referral link and share it with friends and family? Every contribution made through your link will be tracked. When someone contributes using your link, you&apos;ll receive an email with your personal referral dashboard where you can see the impact you&apos;ve inspired as others join you in gifting trees.
                </p>
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    setShowReferralDialog(true);
                  }}
                  className="mt-2 text-green-800 hover:text-green-900 underline cursor-pointer"
                >
                  Create & Share Your Link
                </a>
              </div>

              <div className="sticky bottom-0 bg-white pt-4 mt-6 border-t border-gray-200 flex justify-end space-x-4">
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Skip
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Submit'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-green-600 mb-4">
                {updateSuccess
                  ? "We truly value your willingness to engage. Your support makes a real difference!"
                  : "Thank you for your gift trees request!"}
              </p>

              <button
                onClick={handleClose}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="overflow-hidden bg-white">
      <InternalTestBanner userEmail={formData.email} />
      <div className="relative w-full">
        <MotionDiv
          className="container z-0 mx-auto my-5 overflow-hidden text-gray-800"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className="z-0 mx-4 pt-16 md:mx-12">
            <div className="md:mx-12 my-5 object-center text-center md:my-5 md:w-4/5 md:text-left">
              <div className="mt-5 space-y-6">
                <h2 className="text-4xl font-bold text-green-800">We don&apos;t just plant trees, we rebuild forests.</h2>

                <p className="text-gray-700 leading-relaxed">
                  Dedicating trees in someone&apos;s name is a unique way to show your appreciation and your concern to the environment. Simply choose how many trees you would like to plant, design your custom Tree-card, and let us know who you would like to send it to.
                </p>
              </div>
            </div>
          </div>
        </MotionDiv>
      </div>

      {/* Form Section */}
      <div className={`text-gray-700 relative min-h-[45vh] w-full md:min-h-[60vh] container mx-auto ${isInternalTestUser(formData.email) ? 'pt-12' : ''}`}>
        <div className="md:mx-28 container z-0 overflow-hidden pb-20">
          <div className="w-full md:w-2/3">
            <ScrollReveal>
              {currentStep === 1 ? (
                <form className="space-y-8">

                  {/* Number of Trees */}
                  <div className="space-y-4">
                    <div className="border border-gray-300 rounded-lg p-4 sm:p-6 bg-white shadow-sm">

                      {/* Label + Input */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                        <label className="text-base sm:text-lg font-light">
                          How many trees would you like to sponsor?*
                        </label>
                        <input
                          type="number"
                          name="numberOfTrees"
                          min="1"
                          step="1" // Ensures only whole numbers
                          className={`w-full sm:w-60 rounded-md border px-4 py-2 text-gray-700 ${errors.numberOfTrees ? 'border-red-500' : 'border-gray-300'}`}
                          required
                          disabled={rpPaymentSuccess}
                          value={formData.numberOfTrees}
                          onChange={(e) => {
                            // Only update if value is empty or a valid integer ≥1
                            if (e.target.value === "" || (/^\d+$/.test(e.target.value) && parseInt(e.target.value) >= 1)) {
                              handleInputChange(e);
                            }
                          }}
                          onBlur={(e) => {
                            // Ensure minimum value of 1
                            if (e.target.value === "" || parseInt(e.target.value) < 1) {
                              setFormData(prev => ({ ...prev, numberOfTrees: "1" }));
                              setErrors(prev => ({ ...prev, numberOfTrees: "" }));
                            }
                          }}
                        />
                      </div>

                      {/* Predefined buttons + Other */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        {[2, 5, 10, 14, 50, 100].map((count) => (
                          <button
                            key={count}
                            type="button"
                            onClick={() =>
                              setFormData(prev => ({ ...prev, numberOfTrees: count.toString() }))
                            }
                            className={`px-4 py-2 rounded-md text-sm sm:text-base ${formData.numberOfTrees === count.toString()
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 hover:bg-gray-200'
                              }`}
                          >
                            {count} Trees
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.querySelector(
                              'input[name="numberOfTrees"]'
                            ) as HTMLInputElement;
                            if (input) {
                              input.focus();
                              input.select();
                            }
                          }}
                          className={`px-4 py-2 rounded-md text-sm sm:text-base ${![2, 5, 10, 14, 50, 100].includes(Number(formData.numberOfTrees))
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                        >
                          Other
                        </button>
                      </div>

                      {/* Total Amount */}
                      <p className="mt-4 text-sm sm:text-base text-gray-600">
                        Total Amount: ₹{totalAmount.toLocaleString('en-IN')}
                        {isAboveLimit && " (Above Razorpay limit - Bank Transfer recommended)"}
                      </p>
                    </div>
                  </div>

                  {/* Recipient Entry Method Toggle */}
                  <div className="space-y-4">
                    <h3 className="text-2xl font-semibold">Who would you like to honour with this living tribute?</h3>
                    {/* Recipient Entry Method Toggle */}
                    <div className="flex items-center space-x-6 mb-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={recipientOption === 'manual'}
                          onChange={() => handleRecipientOptionChange('manual')}
                          className="h-4 w-4 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-gray-700">Add recipients manually</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={recipientOption === 'csv'}
                          onChange={() => handleRecipientOptionChange('csv')}
                          className="h-4 w-4 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-gray-700">Upload CSV file</span>
                      </label>
                    </div>

                    {/* Conditional Rendering */}
                    {recipientOption === 'manual' ? (
                      <>
                        <Recipients
                          dedicatedNames={dedicatedNames}
                          errors={errors}
                          formData={formData}
                          handleNameChange={handleNameChange}
                          handleAddName={handleAddName}
                          handleRemoveName={handleRemoveName}
                          setHasAssigneeError={setHasAssigneeError}
                        />
                      </>
                    ) : (
                      <>
                        <CsvUpload
                          onDataParsed={(result) => {
                            const transformedData = result.validData.map(row => ({
                              recipient_name: row['Recipient Name'],
                              recipient_email: row['Recipient Email'] || '',
                              recipient_communication_email: row['Recipient Communication Email'] || '',
                              assignee_name: row['Recipient Name'],
                              assignee_email: row['Recipient Email'] || '',
                              relation: 'other',
                              trees_count: parseInt(row['Number of Trees']) || 1
                            }));

                            setDedicatedNames(transformedData);
                            setCsvHasErrors(
                              result.hasErrors || 
                              transformedData.reduce((sum, name) => sum + (name.trees_count || 0), 0) > 
                                Number(formData.numberOfTrees)
                            );
                          }}
                          maxTrees={Number(formData.numberOfTrees)}
                          initialData={recipientOption === 'csv' 
                            ? dedicatedNames.map(name => ({
                                'Recipient Name': name.recipient_name,
                                'Recipient Email': name.recipient_email?.toString() || '',
                                'Recipient Communication Email': name.recipient_communication_email?.toString() || '',
                                'Number of Trees': name.trees_count.toString()
                              }))
                            : []}
                        />
                      </>
                    )}
                  </div>

                  {/* Occasion Details */}
                  <div className="space-y-6 mt-2">
                    <h2 className="text-2xl font-semibold">{getOccasionQuestion()}</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Occasion Type */}
                    <div>
                      <label className="block text-base sm:text-lg font-light mb-2">Occasion Type</label>
                      <div className="relative">
                        <select
                          id="eventType"
                          name="eventType"
                          value={eventType || ""}
                          onChange={(e) => setEventType(e.target.value)}
                          className="appearance-none w-full rounded-md border border-gray-300 px-4 py-3 text-gray-700 bg-white transition-colors duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none"
                        >
                          <option value="" disabled>Select an event type</option>
                          <option value="1">Birthday</option>
                          <option value="2">Memorial</option>
                          <option value="4">Wedding</option>
                          <option value="5">Wedding Anniversary</option>
                          <option value="6">Festival Celebration</option>
                          <option value="7">Retirement</option>
                          <option value="3">General Gift</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Occasion Name */}
                    <div>
                      <label className="block text-base sm:text-lg font-light mb-2">Occasion Name</label>
                      <input
                        type="text"
                        id="eventName"
                        name="eventName"
                        placeholder="Occasion Name"
                        value={eventName || ""}
                        onChange={(e) => setEventName(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-700"
                      />
                    </div>

                    {/* Gifted By */}
                    <div>
                      <label className="block text-base sm:text-lg font-light mb-2">
                        Best wishes from
                        <Tooltip title="The name(s) of the person(s) gifting." className="ml-1">
                          <InfoOutlinedIcon fontSize="small" className="text-gray-500 cursor-help" />
                        </Tooltip>
                      </label>
                      <input
                        type="text"
                        id="plantedBy"
                        name="plantedBy"
                        placeholder="Best wishes from"
                        value={plantedBy || ""}
                        onChange={(e) => setPlantedBy(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-700"
                      />
                    </div>

                    {/* Date of Occasion */}
                    <div>
                      <label className="block text-base sm:text-lg font-light mb-2">Date of Occasion</label>
                      <input
                        type="date"
                        id="giftedOn"
                        name="giftedOn"
                        value={giftedOn ? giftedOn.toISOString().split('T')[0] : ""}
                        onChange={(e) => setGiftedOn(e.target.value ? new Date(e.target.value) : new Date())}
                        className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-700"
                      />
                    </div>
                  </div>


                  <GiftCardPreview
                    userName={dedicatedNames[0]?.recipient_name}
                    giftedBy={plantedBy ?? undefined}
                    primaryMessage={primaryMessage}
                    windowWidth={windowWidth}
                    setPrimaryMessage={setPrimaryMessage}
                    eventType={eventType}
                    previewUrl={previewUrl}
                    setPreviewUrl={setPreviewUrl}
                    presentationId={presentationId}
                    setPresentationId={setPresentationId}
                    slideId={slideId}
                    setSlideId={setSlideId}
                  />

                  {/* 6. Personal Information */}
                  <div className="space-y-6">
                    <h2 className="text-2xl font-semibold">Finally, help us with your (sponsor) details</h2>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center flex-wrap">
                        <label className="w-48 text-gray-700">
                          Sponsored by*:
                          <Tooltip title="The donor who's paying for the trees.">
                            <InfoOutlinedIcon fontSize="small" className="text-gray-500 cursor-help" />
                          </Tooltip>
                        </label>
                        <div className="min-w-[200px] flex-1">
                          <input
                            type="text"
                            name="fullName"
                            className={`w-full rounded-md border ${errors.fullName ? 'border-red-500' : 'border-gray-300'} px-4 py-2 text-gray-700`}
                            required
                            value={formData.fullName}
                            onChange={handleInputChange}
                            onBlur={(e) => {
                              const error = validateField(e.target.name, e.target.value);
                              setErrors(prev => ({ ...prev, fullName: error }));
                            }}
                            placeholder="Type your name"
                          />
                          {errors.fullName && (
                            <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center flex-wrap">
                        <label className="w-48 text-gray-700">Email ID*:</label>
                        <div className="min-w-[200px] flex-1">
                          <input
                            type="email"
                            name="email"
                            className={`w-full rounded-md border ${errors.email ? 'border-red-500' : 'border-gray-300'} px-4 py-2 text-gray-700`}
                            required
                            value={formData.email}
                            onChange={handleInputChange}
                            onBlur={(e) => {
                              const error = validateField(e.target.name, e.target.value);
                              setErrors(prev => ({ ...prev, email: error }));
                            }}
                            placeholder="Type your email id"
                          />
                          {errors.email && (
                            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center flex-wrap">
                        <label className="w-48 text-gray-700">Mobile number*:</label>
                        <div className="min-w-[200px] flex-1">
                          <input
                            type="tel"
                            name="phone"
                            className={`w-full rounded-md border ${errors.phone ? 'border-red-500' : 'border-gray-300'} px-4 py-2 text-gray-700`}
                            value={formData.phone}
                            onChange={handleInputChange}
                            onBlur={(e) => {
                              const error = validateField(e.target.name, e.target.value);
                              setErrors(prev => ({ ...prev, phone: error }));
                            }}
                            placeholder="Enter with country code, if outside India"
                            pattern="[0-9]{10,15}"
                            title="10-15 digit phone number"
                          />
                          {errors.phone && (
                            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center flex-wrap">
                        <label className="w-48 text-gray-700">
                          PAN number*:
                          <Tooltip title="PAN number is required for us to map and issue 80G receipt to the donor.">
                            <InfoOutlinedIcon fontSize="small" className="text-gray-500 cursor-help" />
                          </Tooltip>
                        </label>
                        <div className="min-w-[200px] flex-1">
                          <input
                            type="text"
                            name="panNumber"
                            className={`w-full rounded-md border ${errors.panNumber ? 'border-red-500' : 'border-gray-300'} px-4 py-2 text-gray-700 uppercase placeholder:text-gray-400 placeholder:normal-case`}
                            value={formData.panNumber}
                            onChange={handleInputChange}
                            placeholder="Enter your PAN number"
                            pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                            maxLength={10}
                          />
                          {errors.panNumber && (
                            <p className="mt-1 text-sm text-red-600">{errors.panNumber}</p>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-gray-600">
                          At present we can accept donations only from Indian residents. PAN number is required to know the donor&apos;s identity.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-8">
                    <button
                      type="button"
                      onClick={() => {
                        const mainFormValid = Object.keys(formData).every(key => {
                          if (key === "comments") return true;
                          const value = formData[key as keyof typeof formData];
                          // Check for mandatory fields
                          if (key === "fullName" || key === "email" || key === "phone" || key === "panNumber") {
                            return !!value;
                          }
                          return true;
                        });

                        const treesCount = parseInt(formData.numberOfTrees);
                        const treesAssigned = dedicatedNames.filter(user => user.recipient_name?.trim())
                          .map(user => user.trees_count)
                          .reduce((prev, curr) => prev + curr, 0);

                        if (treesAssigned < treesCount) {
                          if (treesAssigned !== 0) {
                            setValidationAlertData({
                              title: "Incomplete Tree Assignment",
                              message: (
                                <div className="space-y-2">
                                  <p>You have only assigned {treesAssigned} out of {treesCount} trees. <span className="text-red-600 font-medium mt-4">You should assign the remaining {treesCount - treesAssigned} {treesCount - treesAssigned === 1 ? 'tree' : 'trees'}</span></p>
                                  <ul className="list-disc pl-5 space-y-1">
                                    <li>Please assign all trees to recipients before proceeding</li>
                                    <li>Each tree needs to be assigned to a recipient</li>
                                    <li>You can add more recipients if needed</li>
                                  </ul>
                                </div>
                              )
                            });
                          } else {
                            setValidationAlertData({
                              title: "No Trees Assigned",
                              message: (
                                <div className="space-y-2">
                                  <p>You have not assigned any tree out of {treesCount} {treesCount === 1 ? "tree" : "trees"}. <span className="text-red-600 font-medium mt-4">You should assign all {treesCount} {treesCount === 1 ? 'tree' : 'trees'}</span></p>
                                  <ul className="list-disc pl-5 space-y-1">
                                    <li>Please assign all trees to recipients before proceeding</li>
                                    <li>Each tree needs to be assigned to a recipient</li>
                                    <li>You can add recipients using the form above</li>
                                  </ul>
                                </div>
                              )
                            });
                          }
                          setShowValidationAlert(true);
                          setTimeout(scrollToRecipients, 100);
                          return;
                        } else if (treesAssigned > treesCount) {
                          setValidationAlertData({
                            title: "Tree Count Mismatch",
                            message: (
                              <div className="space-y-2">
                                <p>You have opted to sponsor {treesCount} trees, but you have assigned {treesAssigned} trees. <span className="text-red-600 font-medium mt-4">Please update the total trees at the beginning of the section to {treesAssigned}</span></p>
                                <ul className="list-disc pl-5 space-y-1">
                                  <li>Please adjust the number of trees assigned to match your sponsorship</li>
                                  <li>You can either increase your sponsorship or reduce the number of trees assigned</li>
                                  <li>Each recipient can have multiple trees assigned to them</li>
                                </ul>
                              </div>
                            )
                          });
                          setShowValidationAlert(true);
                          setTimeout(scrollToRecipients, 100);
                          return;
                        }

                        if (mainFormValid) {
                          setCurrentStep(2);
                        } else {
                          alert("Please fill all required fields");
                        }
                      }}
                      className={`px-6 py-3 rounded-md transition-colors text-white ${hasDuplicateNames || hasAssigneeError || (recipientOption === 'csv' && csvHasErrors) ||
                        dedicatedNames.reduce((sum, name) => sum + (name.trees_count || 0), 0) !== 
                        Number(formData.numberOfTrees)
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                        }`}

                      disabled={hasDuplicateNames || hasAssigneeError || (recipientOption === 'csv' && csvHasErrors) ||
                        dedicatedNames.reduce((sum, name) => sum + (name.trees_count || 0), 0) !== 
                        Number(formData.numberOfTrees)}
                    >
                      Proceed to pay
                    </button>
                  </div>
                </form>

              ) : (
                currentStep === 2 && (
                  <SummaryPaymentPage
                    formData={formData}
                    dedicatedNames={dedicatedNames}
                    totalAmount={totalAmount}
                    isAboveLimit={isAboveLimit}
                    rpPaymentSuccess={rpPaymentSuccess}
                    paymentProof={paymentProof}
                    setPaymentProof={setPaymentProof}
                    isProcessing={isProcessing || requestInProgress}
                    isLoading={isLoading}
                    setCurrentStep={setCurrentStep}
                    handleSubmit={handleSubmit}
                    eventType={eventType}
                    eventName={eventName}
                    giftedOn={giftedOn}
                    plantedBy={plantedBy}
                  />
                )
              )}
            </ScrollReveal>
          </div>
        </div>
      </div>

      <div className="relative w-full">
        <MotionDiv
          className="container z-0 mx-auto overflow-hidden text-gray-800"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className="z-0 mx-4 pt-16 md:mx-12">
            <div className="md:mx-12 object-center text-center md:w-4/5 md:text-left">
              <div className="mt-6 space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-green-700">Through our reforestation efforts we:</h3>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <ul className="space-y-1 text-gray-700 text-left">
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          <span>Plant native tree species</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          <span>Do rainwater harvesting - dig ponds to store rainwater and create trenches for groundwater recharge</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          <span>Use only organic composts and no chemical pesticides</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          <span>Employ local rural population for all on-ground tasks</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          <span>Incubate microventures</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          <span>Leverage urban capital to scale-up</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-green-700">Our Impact till date:</h3>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <ul className="space-y-1 text-gray-700 text-left">
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          <span>1400+ acres area under reforestation</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          <span>2 lacs+ trees planted</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          <span>200+ local rural people employed</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          <span>Biodiversity impact: 400+ species (Flora & Fauna)</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          <span>13 of 17 SDGs mapped</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 leading-relaxed">
                  By funding 14Trees, you&apos;re enabling long-term environmental healing and economic empowerment for those who depend most on the land.
                </p>
              </div>
            </div>

            <div className="mt-12 h-px bg-gray-200"></div>
            <div className="mt-6 mb-6 space-y-4 bg-green-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-green-800">Inspire Others to Give</h4>
              <p className="text-sm text-green-700">
                Do you know, you can create your personal referral link and share it with friends and family? Every contribution made through your link will be tracked. When someone contributes using your link, you&apos;ll receive an email with your personal referral dashboard where you can see the impact you&apos;ve inspired as others join you in gifting trees.
              </p>
              <a
                onClick={(e) => {
                  e.preventDefault();
                  setShowReferralDialog(true);
                }}
                className="mt-2 text-green-800 hover:text-green-900 underline cursor-pointer"
              >
                Create & Share Your Link
              </a>
            </div>
          </div>
        </MotionDiv>
      </div>
      {showSuccessDialog && <SuccessDialog />}
      {showReferralDialog && (
        <ReferralDialog
          linkType="plant-memory"
          open={showReferralDialog}
          onClose={() => setShowReferralDialog(false)}
        />
      )}
      {showValidationAlert && (
        <ValidationAlert
          show={showValidationAlert}
          onClose={() => setShowValidationAlert(false)}
          title={validationAlertData.title}
          message={validationAlertData.message}
        />
      )}
    </div>
  );
}

export default function GiftTreesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GiftTrees />
    </Suspense>
  );
}