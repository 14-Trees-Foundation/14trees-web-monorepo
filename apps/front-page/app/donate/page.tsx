"use client";

import MotionDiv from "components/animation/MotionDiv";
import { ScrollReveal } from "components/Partials/HomePage";
import labels from "~/assets/labels.json";
import { useState, useEffect, useRef, Suspense } from "react";
import Papa from 'papaparse';
import { apiClient } from "~/api/apiClient";
import { UploadIcon } from "lucide-react";
import { getUniqueRequestId } from "~/utils";
import { UserDetailsForm } from 'components/donate/UserDetailsForm';
import { SummaryPaymentPage } from './donationSummary';
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
  recipient_phone: string;
  assignee_name: string;
  assignee_email: string;
  assignee_phone: string;
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

function Donation() {
  const searchParams = useSearchParams();
  const rfr = searchParams.get('r');
  const c_key = searchParams.get('c');

  const [treeLocation, setTreeLocation] = useState("");
  const [multipleNames, setMultipleNames] = useState(false);
  const [dedicatedNames, setDedicatedNames] = useState<DedicatedName[]>([{
    recipient_name: "",
    recipient_email: "",
    recipient_phone: "",
    assignee_name: "",
    assignee_email: "",
    assignee_phone: "",
    relation: "",
    trees_count: 14
  }]);
  const [isAssigneeDifferent, setIsAssigneeDifferent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [razorpayPaymentId, setRazorpayPaymentId] = useState<number | null>(null);
  const [razorpayOrderId, setRazorpayOrderId] = useState<string | null>(null);
  const [rpPaymentSuccess, setRpPaymentSuccess] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    panNumber: "",
    comments: ""
  });
  const [paymentOption, setPaymentOption] = useState<"razorpay" | "bank-transfer">("razorpay");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [isAboveLimit, setIsAboveLimit] = useState(false);
  const [nameEntryMethod, setNameEntryMethod] = useState<"manual" | "csv">("manual");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<DedicatedName[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [hasDuplicateNames, setHasDuplicateNames] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<Record<string, File>>({});
  const [visitDate, setVisitDate] = useState<string>("");
  const [adoptedTreeCount, setAdoptedTreeCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [donationId, setDonationId] = useState<number | null>(null);
  const [donationType, setDonationType] = useState<"adopt" | "donate">("adopt");
  const [donationMethod, setDonationMethod] = useState<"trees" | "amount">("trees");
  const [donationTreeCount, setDonationTreeCount] = useState<number>(14);
  const [donationAmount, setDonationAmount] = useState<number>(5000);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [referralDetails, setReferralDetails] = useState<{ referred_by?: string, name?: string, c_key?: string, description?: string } | null>(null);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  const [validationAlertData, setValidationAlertData] = useState<{
    title: string;
    message: React.ReactNode;
  }>({ title: "", message: "" });

  const itemsPerPage = 10;
  const paginatedData = csvPreview.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const hasTableErrors = csvPreview.some(row => Array.isArray(row._errors) && row._errors.length > 0);

  useEffect(() => {
    let amount = 0;
    if (treeLocation === "adopt") {
      amount = 3000 * (adoptedTreeCount || 0);
    } else if (treeLocation === "donate") {
      amount = donationMethod === "trees"
        ? 1500 * (donationTreeCount || 0)
        : donationAmount;
    }
    setIsAboveLimit(amount > 500000);
  }, [treeLocation, adoptedTreeCount, donationMethod, donationTreeCount, donationAmount]);

  useEffect(() => {
    if (nameEntryMethod === "csv" && csvPreview.length > 0 && csvErrors.length === 0) {
      setDedicatedNames(csvPreview);
      setMultipleNames(true);
    }
  }, [csvPreview, nameEntryMethod, csvErrors]);

  useEffect(() => {
    const nameCounts = dedicatedNames.reduce((acc, user) => {
      const name = user.recipient_name?.trim().toLowerCase();
      if (!name) return acc;
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const hasDuplicates = Object.values(nameCounts).some(count => count > 1);
    setHasDuplicateNames(hasDuplicates);
  }, [dedicatedNames]);

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

  const containerVariants = {
    hidden: { opacity: 0, y: 10, scale: 1.05 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5 },
    },
  };

  const validationPatterns = {
    name: /^[A-Za-z0-9\s.,&_'-]+$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]*$/,
    phone: /^\+?[0-9\s\-()]{7,20}$/,
    pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    number: /^[0-9]+(\.[0-9]+)?$/
  };

  const validateField = (name: string, value: string) => {
    let error = "";

    if (!value.trim()) {
      if (name === "phone") return "";
      if (name === "panNumber") return "";
      // if (name === "comments") return "";

      return "This field is required";
    }

    switch (name) {
      case "fullName":
        if (!validationPatterns.name.test(value)) {
          error = "Please enter a valid name (letters and spaces only)";
        }
        break;
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
    }

    return error;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Always store PAN number in uppercase
    const processedValue = name === "panNumber" ? value.toUpperCase() : value;

    const error = validateField(name, processedValue);
    setErrors(prev => ({ ...prev, [name]: error }));
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const validateDedicatedNames = () => {
    let isValid = true;
    const newErrors: Record<string, string> = {};

    dedicatedNames.forEach((name, index) => {
      // If multipleNames is true, recipient_name is required
      if (multipleNames && !name.recipient_name.trim()) {
        newErrors[`dedicatedName-${index}`] = "Name is required";
        isValid = false;
      } else if (!multipleNames && !name.recipient_name.trim()) {
        newErrors[`dedicatedName-${index}`] = "Name is optional";
        isValid = true; // Allow empty for single entry
      } else if (!validationPatterns.name.test(name.recipient_name)) {
        newErrors[`dedicatedName-${index}`] = "Please enter a valid name";
        isValid = false;
      }

      if (name.recipient_email && !validationPatterns.email.test(name.recipient_email)) {
        newErrors[`dedicatedEmail-${index}`] = "Please enter a valid email";
        isValid = false;
      }

      if (name.recipient_phone && !validationPatterns.phone.test(name.recipient_phone)) {
        newErrors[`dedicatedPhone-${index}`] = "Please enter a valid phone number";
        isValid = false;
      }

      if (isAssigneeDifferent) {
        if (!name.assignee_name.trim()) {
          newErrors[`assigneeName-${index}`] = "Assignee name is required";
          isValid = true; // Allow empty
        }
      }
    });
    setErrors(prev => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setCsvFile(files[0]);
    setCsvErrors([]);
    setCsvPreview([]);
    setCurrentPage(0);

    Papa.parse(files[0], {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        const headerMap: Record<string, string> = {
          'Recipient Name': 'recipient_name',
          'Recipient Email': 'recipient_email',
          'Recipient Communication Email (optional)': 'recipient_communication_email',
          'Recipient Phone (optional)': 'recipient_phone',
          'Number of trees to assign': 'trees_count',
          'Assignee Name': 'assignee_name',
          'Assignee Email (optional)': 'assignee_email',
          'Assignee Communication Email (optional)': 'assignee_communication_email',
          'Assignee Phone (optional)': 'assignee_phone',
          'Relation with the person': 'relation',
          'Image Name (optional)': 'image'
        };
        return headerMap[header] || header.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '');
      },
      complete: (results) => {
        const data = results.data as DedicatedName[];
        const errors: string[] = [];
        const validRecipients: DedicatedName[] = [];

        // Calculate total trees from CSV
        const totalTreesInCsv = data.reduce((sum, row) => {
          const trees = row.trees_count ? parseInt(String(row.trees_count)) : 1;
          return sum + trees;
        }, 0);

        // Check if total trees exceed the donation tree count
        if (totalTreesInCsv > donationTreeCount) {
          errors.push(`Total number of trees in CSV (${totalTreesInCsv}) exceeds the selected number of trees (${donationTreeCount})`);
        }

        // ✅ Check for duplicate names
        const nameCounts: Record<string, number> = {};
        data.forEach((row) => {
          const name = row.recipient_name?.trim().toLowerCase();
          if (name) nameCounts[name] = (nameCounts[name] || 0) + 1;
        });
        Object.entries(nameCounts).forEach(([name, count]) => {
          if (count > 1) {
            errors.push(`Duplicate recipient name detected: "${name}" appears ${count} times`);
          }
        });

        data.forEach((row, index) => {
          const rowErrors: string[] = [];
          if (!row.recipient_name || !row.recipient_name.trim() || !validationPatterns.name.test(row.recipient_name)) {
            rowErrors.push("Recipient name is required");
          }
          if (row.recipient_email && !validationPatterns.email.test(String(row.recipient_email))) {
            rowErrors.push("Invalid Assignee Email format");
          }
          if (row.assignee_email && !validationPatterns.email.test(String(row.assignee_email))) {
            rowErrors.push("Invalid Assignee Email format");
          }
          if (row.recipient_phone && !validationPatterns.phone.test(String(row.recipient_phone))) {
            rowErrors.push("Invalid Assignee Phone number (10-15 digits required)");
          }
          if (row.assignee_phone && !validationPatterns.phone.test(String(row.assignee_phone))) {
            rowErrors.push("Invalid Assignee Phone number (10-15 digits required)");
          }

          const user: any = {
            recipient_name: String(row.recipient_name || '').trim(),
            recipient_email: row.recipient_email ? String(row.recipient_email).trim() : "",
            recipient_phone: row.recipient_phone ? String(row.recipient_phone) : '',
            trees_count: row.trees_count ? parseInt(String(row.trees_count)) : 1,
            image: row.image ? String(row.image) : undefined,
            relation: row.relation ? String(row.relation) : 'other',
            _errors: rowErrors,
          };

          if (row.assignee_name?.trim()) {
            user.assignee_name = String(row.assignee_name).trim();
            user.assignee_email = row.assignee_email ? String(row.assignee_email).trim() : "";
            user.assignee_phone = row.assignee_phone ? String(row.assignee_phone) : '';
          } else {
            user.assignee_name = user.recipient_name;
            user.assignee_email = user.recipient_email;
            user.assignee_phone = user.recipient_phone;
          }

          validRecipients.push(user);
        });

        setCsvErrors(errors);
        setCsvPreview(validRecipients);
        if (errors.length === 0) {
          setDedicatedNames(validRecipients);
        }
      },
      error: (error) => {
        setCsvErrors([`Error parsing CSV: ${error.message}`]);
      }
    });

    if (files.length > 1) {
      const imageFiles = Array.from(files).slice(1);
      const updatedPreview = [...csvPreview];
      imageFiles.forEach((file) => {
        const match = file.name.match(/(\d+)/);
        if (match) {
          const rowIndex = parseInt(match[0]) - 1;
          if (rowIndex >= 0 && rowIndex < updatedPreview.length) {
            updatedPreview[rowIndex].image = URL.createObjectURL(file);
          }
        }
      });
      setCsvPreview(updatedPreview);
    }
  };

  const downloadSampleCsv = () => {
    const url = "https://docs.google.com/spreadsheets/d/106tLjWvjpKLGuAuCSDu-KFw4wmfLkP9UwoSbJ0hRXgU/gviz/tq?tqx=out:csv&sheet=Sheet1";
    const fileName = "UserDetails.csv";

    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch(error => console.error("Download failed:", error));
  }

  const handleSubmit = async () => {

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
    let users = dedicatedNames.length === 1 && dedicatedNames[0].recipient_name.trim() === "" ? [] : dedicatedNames;

    const donor = formData.fullName.replaceAll(" ", "").toLocaleLowerCase();
    users = users.map(item => {

      let user = { ...item }
      if (!user.assignee_name?.trim()) {
        user.assignee_name = user.recipient_name;
        user.assignee_email = user.recipient_email;
        user.assignee_phone = user.recipient_phone;
      }

      if (user.recipient_email) {
        user.recipient_email = user.recipient_email.trim().replace("donor", donor);
      } else {
        user.recipient_email = user.recipient_name.toLowerCase().trim().replace(/\s+/g, '') + "." + donor + "@14trees"
      }

      if (user.assignee_email) {
        user.assignee_email = user.assignee_email.trim().replace("donor", donor);
      } else {
        user.assignee_email = user.assignee_name.toLowerCase().trim().replace(/\s+/g, '') + "." + donor + "@14trees"
      }

      return user;
    })

    if (users.length === 1 && !multipleNames) {
      users[0].trees_count = donationTreeCount
    }

    if (!mainFormValid || !dedicatedNamesValid) {
      console.log(errors);
      alert("Please fix the errors in the form before submitting");
      setIsLoading(false);
      setIsSubmitting(false);
      return;
    }

    setIsLoading(true);
    setIsProcessing(true);
    setIsSubmitting(true);

    const amount = treeLocation === "adopt"
      ? 3000 * (adoptedTreeCount || 0)
      : donationMethod === "trees"
        ? 1500 * (donationTreeCount || 0)
        : donationAmount;

    const uniqueRequestId = getUniqueRequestId();

    // Handle payment based on selected option
    let paymentId: number | null = razorpayPaymentId || null;
    let orderId: string | null = razorpayOrderId || null;
    if (isAboveLimit) {
      paymentId = await handleBankPayment(uniqueRequestId, razorpayPaymentId);
      setRazorpayPaymentId(paymentId);
    } else if (!paymentId && !isAboveLimit) {
      try {
        const response = await apiClient.createPayment(
          amount,
          "Indian Citizen",
          formData.panNumber,
          true
        );
        paymentId = response.id;
        orderId = response.order_id;
        setRazorpayPaymentId(response.id);
        setRazorpayOrderId(orderId);
      } catch (error: any) {
        alert("Failed to create your request. Please try again later!");
        setIsProcessing(false);
        setIsLoading(false);
        setIsSubmitting(false);
        return;
      }
    }

    if (!paymentId) {
      setIsLoading(false);
      setIsSubmitting(false);
      setIsProcessing(false);
      return;
    }

    try {

      const donationRequest = {
        sponsor_name: formData.fullName,
        sponsor_email: formData.email,
        sponsor_phone: formData.phone,
        category: treeLocation === "adopt" ? "Foundation" : "Public",
        donation_type: treeLocation === "adopt" ? "adopt" : "donate",
        donation_method: treeLocation === "donate" ? donationMethod : undefined,
        payment_id: paymentId,
        contribution_options: [],
        comments: formData.comments,
        // Always include the calculated amount
        amount_donated: treeLocation === "adopt"
          ? 3000 * (adoptedTreeCount || 0)
          : donationMethod === "trees"
            ? 1500 * (donationTreeCount || 0)
            : donationAmount,
        ...(treeLocation === "adopt" && {
          visit_date: visitDate, // Required for adoptions
          trees_count: adoptedTreeCount,
        }),
        ...(treeLocation === "donate" && {
          ...(donationMethod === "trees" && { trees_count: donationTreeCount }),
          ...(donationMethod === "amount" && { amount_donated: donationAmount }),
        }),
        users: users,
        tags: ["WebSite"],
        rfr: rfr,
        c_key: c_key,
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


      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount * 100,
        currency: 'INR',
        name: "14 Trees Foundation",
        description: treeLocation === "adopt"
          ? `Adoption of ${adoptedTreeCount} trees`
          : `Donation for ${donationTreeCount} trees`,
        order_id: orderId,
        notes: {
          "Donation Id": donId,
        },
        handler: async (response: any) => {
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
                razorpay_payment_id: response.razorpay_payment_id,
                order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            if (!verificationResponse.ok) throw new Error("Verification failed");
            alert("Payment successful!");
          } catch (err) {
            console.error("Verification error:", err);
          }

          setShowSuccessDialog(true);

          try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/donations/requests/payment-success`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                donation_id: donId
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

      if (!isAboveLimit) {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response: any) => {
          alert(`Payment failed: ${response.error.description}`);
        });
        rzp.open();
      }

    } catch (err: any) {
      console.error("Donation error:", err);
      alert(err.message || "Failed to create donation");
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
      setIsProcessing(false);
    }
  };

  const handleAddName = () => {
    if (dedicatedNames[dedicatedNames.length - 1].recipient_name.trim() === "") {
      return;
    }
    setDedicatedNames([...dedicatedNames, { recipient_name: "", recipient_email: "", recipient_phone: "", assignee_name: "", assignee_email: "", assignee_phone: "", relation: "", trees_count: 1 }]);
  };

  const handleRemoveName = (index: number) => {
    const newNames = [...dedicatedNames];
    newNames.splice(index, 1);
    setDedicatedNames(newNames);

    // Re-validate all dedicated names after removal
    setTimeout(() => {
      validateDedicatedNames();
    }, 0);
  };

  const handleNameChange = (index: number, field: keyof DedicatedName, value: string | number) => {
    setDedicatedNames(prev => {
      const newNames = [...prev];
      newNames[index] = { ...newNames[index], [field]: value };
      return newNames;
    });

    if (field === "recipient_name") {
      const error = !validationPatterns.name.test(value.toString()) || (multipleNames && value.toString().trim() === "")
        ? "Please enter a valid name"
        : "";
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
    }
  };

  const handleRazorpayPayment = async () => {
    if (isAboveLimit) {
      alert("Please use Bank Transfer for donations above ₹5,00,000");
      return;
    }

    if (!formData.fullName || !formData.email || !formData.phone) {
      alert("Please fill in all required fields before payment");
      return;
    }

    setIsProcessing(true);
    try {
      const amount = treeLocation === "adopt"
        ? 3000 * (adoptedTreeCount || 0)
        : donationMethod === "trees"
          ? 1500 * (donationTreeCount || 0)
          : donationAmount;
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

        const { order_id, id } = await paymentResponse.json();
        setRazorpayPaymentId(id);
        setRazorpayOrderId(order_id);
        orderId = order_id;
        paymentId = id;
      }

      // First create the donation entry
      const donationRequest = {
        sponsor_name: formData.fullName,
        sponsor_email: formData.email,
        sponsor_phone: formData.phone,
        category: treeLocation === "adopt" ? "Foundation" : "Public",
        donation_type: treeLocation === "adopt" ? "adopt" : "donate",
        donation_method: treeLocation === "donate" ? donationMethod : undefined,
        payment_id: paymentId,
        contribution_options: [],
        comments: formData.comments,
        amount_donated: amount,
        ...(treeLocation === "adopt" && {
          visit_date: visitDate,
          trees_count: adoptedTreeCount,
        }),
        ...(treeLocation === "donate" && {
          ...(donationMethod === "trees" && { trees_count: donationTreeCount }),
          ...(donationMethod === "amount" && { amount_donated: donationAmount }),
        }),
        users: dedicatedNames.map(user => ({
          ...user,
          recipient_email: user.recipient_email || user.recipient_name.toLowerCase().replace(/\s+/g, '') + ".donor@14trees",
          assignee_email: user.assignee_email || user.assignee_name.toLowerCase().replace(/\s+/g, '') + ".donor@14trees"
        })),
        tags: ["WebSite"],
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

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount * 100,
        currency: 'INR',
        name: "14 Trees Foundation",
        description: treeLocation === "adopt"
          ? `Adoption of ${adoptedTreeCount} trees`
          : `Donation for ${donationTreeCount} trees`,
        order_id: orderId,
        handler: async (response: any) => {
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
                razorpay_payment_id: response.razorpay_payment_id,
                order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            if (!verificationResponse.ok) throw new Error("Verification failed");
            alert("Payment successful!");
          } catch (err) {
            console.error("Verification error:", err);
          }

          setShowSuccessDialog(true);

          try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/donations/requests/payment-success`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                donation_id: responseData.id
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
      // Calculate amount based on donation type
      const amount = treeLocation === "adopt"
        ? 3000 * (adoptedTreeCount || 0)
        : donationMethod === "trees"
          ? 1500 * (donationTreeCount || 0)
          : donationAmount;

      if (amount <= 0) throw new Error("Invalid amount");


      if (!paymentId) {
        const response = await apiClient.createPayment(
          amount,
          "Indian Citizen",
          formData.panNumber,
          true
        );
        paymentId = response.id;
        setRazorpayPaymentId(response.id);
      }

      if (!paymentId) {
        alert("Payment ID is required");
        return null;
      }

      // Upload payment proof to S3
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
      alert(err.message || "Payment to save payment details");
      return null;
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const previewUrls: Record<string, string> = {};
    const newCsvErrors = [...csvErrors];
    const expectedImageNames = csvPreview.map((row, idx) => row.image ? String(row.image).toLowerCase() : null).filter(Boolean);
    const uploadedImageNames = Array.from(files).map(file => file.name.toLowerCase());

    // Check for images not in CSV or not matching assignee name if no image in CSV
    Array.from(files).forEach(file => {
      const fileName = file.name.toLowerCase();
      let matched = false;
      csvPreview.forEach((recipient, idx) => {
        const imageNameInCsv = recipient.image ? String(recipient.image).toLowerCase() : null;
        const assigneeName = recipient.recipient_name ? String(recipient.recipient_name).toLowerCase().replace(/\s+|_/g, '') : null;
        const fileNameNoExt = file.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/\s+|_/g, '');
        if (imageNameInCsv) {
          // If image name is provided in CSV, only allow exact match
          if (fileName === imageNameInCsv) {
            matched = true;
            // Remove any previous error for this row about image name mismatch
            const rowErrorIdx = newCsvErrors.findIndex(err => err.includes(`Row ${idx + 1}:`) && err.includes('Image name does not match'));
            if (rowErrorIdx !== -1) newCsvErrors.splice(rowErrorIdx, 1);
            previewUrls[idx] = URL.createObjectURL(file);
          }
        } else if (assigneeName) {
          // If no image name in CSV, allow if file name matches assignee name
          if (fileNameNoExt === assigneeName) {
            matched = true;
            // Remove any previous error for this row about image name mismatch
            const rowErrorIdx = newCsvErrors.findIndex(err => err.includes(`Row ${idx + 1}:`) && err.includes('Image name does not match'));
            if (rowErrorIdx !== -1) newCsvErrors.splice(rowErrorIdx, 1);
            previewUrls[idx] = URL.createObjectURL(file);
          }
        }
      });
      if (!matched) {
        newCsvErrors.push(`Image '${file.name}' does not match any required image name or assignee name in the CSV.`);
      }
    });

    setCsvPreview(prev => prev.map((recipient, idx) => {
      const imageNameInCsv = recipient.image ? String(recipient.image).toLowerCase() : null;
      const assigneeName = recipient.recipient_name ? String(recipient.recipient_name).toLowerCase().replace(/\s+|_/g, '') : null;
      let newImage = recipient.image;
      if (imageNameInCsv) {
        // Find uploaded file with exact name
        const uploadedFile = Array.from(files).find(f => f.name.toLowerCase() === imageNameInCsv);
        if (uploadedFile) {
          newImage = URL.createObjectURL(uploadedFile);
        }
        // else, keep previous image (do not set to undefined)
      } else if (assigneeName) {
        // Find uploaded file matching assignee name
        const uploadedFile = Array.from(files).find(f => f.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/\s+|_/g, '') === assigneeName);
        if (uploadedFile) {
          newImage = URL.createObjectURL(uploadedFile);
        }
        // else, keep previous image (do not set to undefined)
      }
      return { ...recipient, image: newImage };
    }));
    setCsvErrors(newCsvErrors);
  };

  const SuccessDialog = () => {
    const [additionalInvolvement, setAdditionalInvolvement] = useState<string[]>([]);
    const [comments, setComments] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateSuccess, setUpdateSuccess] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [skipped, setSkipped] = useState(false); // New state for skip tracking

    const involvementOptions = [
      { display: "Plan a visit to the project site", value: "Planning visit" },
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
      // Only reset form after successful payment
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        panNumber: "",
        comments: ""
      });
      setDedicatedNames([{
        recipient_name: "",
        recipient_email: "",
        recipient_phone: "",
        assignee_name: "",
        assignee_email: "",
        assignee_phone: "",
        relation: "",
        trees_count: 14
      }]);
      setTreeLocation("");
      setMultipleNames(false);
      setPaymentOption("razorpay");
      setCsvFile(null);
      setCsvPreview([]);
      setCsvErrors([]);
      setErrors({});
      setRpPaymentSuccess(false);
      setRazorpayOrderId(null);
      setRazorpayPaymentId(null);
      setDonationAmount(5000);
      setDonationTreeCount(14);
      setCurrentStep(1);
      setDonationId(null);
    }

    const handleUpdate = async () => {
      if (!donationId) return;

      setIsUpdating(true);
      setUpdateError(null);

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/donations/requests/${donationId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            donation_id: donationId,
            updateFields: ['contribution_options', 'comments'],
            data: {
              contribution_options: additionalInvolvement,
              comments: comments
            }
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update donation details');
        }

        setUpdateSuccess(true);
      } catch (err: any) {
        setUpdateError(err.message);
      } finally {
        setIsUpdating(false);
      }
    };

    const handleSkip = () => {
      setSkipped(true);
    };

    const handleClose = () => {
      handleReset();
      setShowSuccessDialog(false);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 m-5 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-bold text-green-600 mb-4">Thank you for making a difference!</h3>
          <p className="mb-2">Your donation has been received.</p>
          {donationId && (
            <p className="mb-2">
              <strong>Donation ID:</strong> {donationId}
            </p>
          )}
          <p className="mb-4">The receipt and the certificate of appreciation have been sent to your email ID. (sometimes the email lands up in the spam/junk folder, please ensure to check it.)
          </p>
          <p className="mb-5">In case of any issue, please call +91 98458 05881 or write to us at contact@14trees.org
          </p>

          {(!updateSuccess && !skipped) ? (
            <div className="space-y-6">
              <div className="h-px bg-gray-200"></div>

              <div className="space-y-4">
                <p className="text-sm text-gray-600">Besides making a monetary contribution, I&apos;d also like to:</p>
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

              <div className="flex justify-end space-x-4">
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
                  : "Thank you for your donation!"}
              </p>

              <button
                onClick={handleClose}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Close
              </button>
            </div>
          )}

          <div className="mt-12 h-px bg-gray-200"></div>
          <div className="mt-6 mb-6 space-y-4 bg-green-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-green-800">Inspire Others to Give</h4>
            <p className="text-sm text-green-700">
              Do you know you can create your personal referral link and share it with friends and family? Every contribution made through your link will be tracked. When someone contributes using your link, you&apos;ll receive an email with your personal referral dashboard where you can see the impact you&apos;ve inspired as others join you in supporting our reforestation efforts.
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
      </div>
    );
  };

  return (
    <div className="overflow-hidden bg-white">
      <div className="relative min-h-[45vh] w-full md:min-h-[60vh]">
        <MotionDiv
          className="container z-0 mx-auto my-5 overflow-hidden text-gray-800"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className="z-0 mx-4 pt-16 md:mx-12">
            <div className="md:mx-12 my-10 object-center text-center md:my-5 md:w-4/5 md:text-left">
              <div className="mt-12 space-y-6">
                <h2 className="text-4xl font-bold text-green-800">We don&apos;t just plant trees, we rebuild forests.</h2>

                {/* Referral Campaign Details */}
                {referralDetails && (referralDetails.name || referralDetails.description || referralDetails.referred_by) && (
                  <div className="my-8 p-6 rounded-xl border border-green-200 bg-green-50 shadow-sm flex flex-col gap-2">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7" /></svg>
                      <span className="text-xl font-bold text-green-800">{referralDetails.name || 'Campaign'}</span>
                    </div>
                    {referralDetails.description && (
                      <div className="text-gray-700 mb-1 pl-8" style={{ whiteSpace: 'pre-line' }}>
                        {referralDetails.description}
                      </div>
                    )}
                    {referralDetails.referred_by && (
                      <div className="flex items-center gap-2 text-sm text-green-700 italic pl-8 mt-1">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span>Referred by: {referralDetails.referred_by}</span>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-gray-700 leading-relaxed">
                  By donating to 14Trees, you&apos;re directly contributing to the restoration of ecologically degraded hills near Pune. These barren landscapes are currently home only to fire-prone grass and suffer from severe topsoil erosion and depleted groundwater.
                </p>

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
          </div>
        </MotionDiv>
      </div>

      <div className="relative min-h-[45vh] w-full md:min-h-[60vh] container mx-auto">
        <div className="md:mx-28 container z-0 overflow-hidden pb-20">
          <div className="w-full md:w-2/3">
            <ScrollReveal>
              {currentStep === 1 ? (
                <form className="space-y-8">
                  <div className="space-y-6">

                    {/* First radio option - Donation */}
                    <div className="space-y-6 bg-green-50 p-4 rounded-lg border border-gray-600">
                      <div className="space-y-3">
                        <label className="flex items-start space-x-3">
                          <input
                            type="radio"
                            name="treeLocation"
                            value="donate"
                            className="mt-1 h-5 w-5"
                            onChange={() => {
                              setTreeLocation("donate");
                            }}
                            checked={treeLocation === "donate"}
                          />
                          <span>I want to make a donation to support reforestation.</span>
                        </label>
                      </div>

                      {/* Second radio option - Adoption */}
                      <div className="space-y-3">
                        <label className="flex items-start space-x-3">
                          <input
                            type="radio"
                            name="treeLocation"
                            value="adopt"
                            className="mt-1 h-5 w-5"
                            onChange={() => {
                              setTreeLocation("adopt");
                            }}
                            checked={treeLocation === "adopt"}
                          />
                          <span>I would like to adopt the trees, I/we planted during my visit at 14 Trees in the past.</span>
                        </label>
                      </div>
                    </div>


                    <div className="mt-6 mb-8 h-px bg-gray-200"></div>

                    {treeLocation === "donate" && (
                      <div className="space-y-6 bg-green-50 p-4 rounded-lg border border-gray-600">
                        <div className="space-y-4">
                          <div className="space-y-4">
                            {/* Option 1: Donate Trees */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name="donationMethod"
                                  value="trees"
                                  className="h-5 w-5"
                                  checked={donationMethod === "trees"}
                                  onChange={() => {
                                    setDonationMethod("trees");
                                    setDonationAmount(1500);
                                  }}
                                />
                                <span>I want to donate</span>
                              </label>
                              <input
                                type="number"
                                inputMode="numeric"
                                min="0"
                                step="1"
                                className="min-w-0 w-full sm:w-36 rounded-md border border-gray-300 px-3 py-1 text-gray-700 disabled:bg-gray-100"
                                disabled={donationMethod !== 'trees'}
                                value={donationMethod !== 'trees' ? 0 : donationTreeCount}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9]/g, '');
                                  setDonationTreeCount(Number(value))
                                  !multipleNames && setDedicatedNames(prev => {
                                    prev[0].trees_count = Number(value) || 1;
                                    return prev;
                                  })
                                }}
                              />
                              <span className="text-sm">Trees</span>
                            </div>

                            {/* Option 2: Donate Amount */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name="donationMethod"
                                  value="amount"
                                  className="h-5 w-5"
                                  checked={donationMethod === "amount"}
                                  onChange={() => setDonationMethod("amount")}
                                />
                                <span>I want to donate</span>
                              </label>
                              <input
                                type="number"
                                min="1500"
                                step="1"
                                inputMode="numeric"
                                className="min-w-0 w-full sm:w-36 rounded-md border border-gray-300 px-3 py-1 text-gray-700 disabled:bg-gray-100 appearance-none" // Removes up/down arrows
                                disabled={donationMethod !== 'amount'}
                                value={donationMethod !== 'amount' ? 0 : donationAmount || ""}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9]/g, "");
                                  const amount = parseInt(value, 10);

                                  if (!isNaN(amount)) {
                                    setDonationAmount(amount);
                                  } else {
                                    setDonationAmount(0);
                                  }
                                }}
                                onBlur={() => {
                                  if (donationAmount < 1500) {
                                    setDonationAmount(1500);
                                  }
                                }}
                                placeholder="1500"
                              />
                              <span className="text-sm">Rupees</span>
                            </div>
                            {donationMethod === 'amount' && donationAmount < 1500 && donationAmount > 0 && (
                              <p className="text-sm text-red-600 mt-1">Minimum donation amount is ₹1,500</p>
                            )}
                          </div>


                          {donationMethod === "trees" && (
                            <div className="font-medium">
                              Donation amount: {(donationTreeCount * 1500).toLocaleString('en-IN')} INR
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {treeLocation === "adopt" && (
                      <div className="space-y-6 bg-green-50 p-4 rounded-lg border border-gray-600">
                        <div className="space-y-4">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Number of trees you would like to adopt:
                              </label>
                              <input
                                type="number"
                                inputMode="numeric"
                                min="0"
                                step="1"
                                className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-700"
                                value={adoptedTreeCount || ""}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9]/g, '');
                                  setAdoptedTreeCount(Number(value))
                                }}
                              />
                              <p className="text-sm text-gray-500 mt-1">3000 INR per tree</p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="font-medium">Amount: {(3000 * (adoptedTreeCount || 0)).toLocaleString('en-IN')} INR</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Date of visit: <span className="text-gray-500">- approx date / month is fine if you don&apos;t remember</span>
                            </label>
                            <div
                              className="relative cursor-pointer"
                              onClick={() => {
                                dateInputRef.current?.showPicker();
                              }}
                            >
                              <input
                                ref={dateInputRef}
                                type="date"
                                className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-700 cursor-pointer"
                                value={visitDate}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVisitDate(e.target.value)}
                                placeholder="dd-mm-yyyy"
                              />
                            </div>
                          </div>

                        </div>
                      </div>
                    )}
                  </div>

                  {treeLocation !== "" && <div className="mt-6 space-y-6">
                    <h2 className="text-2xl font-semibold">Donor details</h2>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center flex-wrap">
                        <label className="w-48 text-gray-700">Donated by*:</label>
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
                        <label className="w-48 text-gray-700">PAN number*:</label>
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
                  </div>}

                  {treeLocation === "donate" && donationMethod === "trees" &&
                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        id="multiplePeople"
                        className="h-5 w-5 mr-3"
                        checked={showAdditionalInfo}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const checked = e.target.checked;
                          setShowAdditionalInfo(checked);
                          if (!checked) {
                            // Reset all multiple recipient data and keep only the first single recipient
                            setCsvPreview([]);
                            setCsvFile(null);
                            setCsvErrors([]);
                            setUploadedImages({});
                            setDedicatedNames([{
                              recipient_name: '',
                              recipient_email: '',
                              recipient_phone: '',
                              assignee_name: '',
                              assignee_email: '',
                              assignee_phone: '',
                              relation: '',
                              trees_count: donationTreeCount
                            }]);
                          }
                        }}
                      />
                      <label htmlFor="multiplePeople" className="text-gray-700">
                        Dedicate trees to someone?
                      </label>
                    </div>}

                  {donationMethod === "trees" && treeLocation === "donate" && (
                    <div className="space-y-4">
                      {showAdditionalInfo && (
                        <>
                          <label className="mb-2 block text-lg font-light">
                            I&apos;d like my trees to be planted in the following name:
                          </label>

                          {!multipleNames && (
                            <div className="space-y-4">
                              <input
                                type="text"
                                placeholder="Assignee name"
                                className={`w-full rounded-md border ${errors['dedicatedName-0'] ? 'border-red-500' : 'border-gray-300'
                                  } px-4 py-3 text-gray-700`}
                                value={dedicatedNames[0].recipient_name}
                                onChange={(e) => {
                                  handleNameChange(0, "recipient_name", e.target.value);
                                  if (!isAssigneeDifferent) {
                                    handleNameChange(0, "assignee_name", e.target.value);
                                  }
                                }}
                              />
                              {errors['dedicatedName-0'] && (
                                <p className="mt-1 text-sm text-red-600">{errors['dedicatedName-0']}</p>
                              )}
                              <div className="grid gap-4 md:grid-cols-2">
                                <input
                                  type="email"
                                  placeholder="Assignee Email (optional)"
                                  className={`w-full rounded-md border ${errors['dedicatedEmail-0'] ? 'border-red-500' : 'border-gray-300'
                                    } px-4 py-3 text-gray-700`}
                                  value={dedicatedNames[0].recipient_email}
                                  onChange={(e) => {
                                    handleNameChange(0, "recipient_email", e.target.value)
                                    if (!isAssigneeDifferent) {
                                      handleNameChange(0, "assignee_email", e.target.value)
                                    }
                                  }}
                                />
                                {errors['dedicatedEmail-0'] && (
                                  <p className="mt-1 text-sm text-red-600">{errors['dedicatedEmail-0']}</p>
                                )}
                                <input
                                  type="tel"
                                  placeholder="Assignee Phone (optional)"
                                  className={`w-full rounded-md border ${errors['dedicatedPhone-0'] ? 'border-red-500' : 'border-gray-300'
                                    } px-4 py-3 text-gray-700`}
                                  value={dedicatedNames[0].recipient_phone}
                                  onChange={(e) => {
                                    handleNameChange(0, "recipient_phone", e.target.value)
                                    if (!isAssigneeDifferent) {
                                      handleNameChange(0, "assignee_phone", e.target.value)
                                    }
                                  }}
                                  pattern="[0-9]{10,15}"
                                  title="10-15 digit phone number"
                                />
                                {errors['dedicatedPhone-0'] && (
                                  <p className="mt-1 text-sm text-red-600">{errors['dedicatedPhone-0']}</p>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center mb-4">
                            <input
                              type="checkbox"
                              id="multipleNames"
                              className="h-5 w-5 mr-3"
                              checked={multipleNames}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const checked = e.target.checked;
                                setMultipleNames(checked);
                                if (!checked) {
                                  // Reset all multiple recipient data and keep only the first single recipient
                                  setCsvPreview([]);
                                  setCsvFile(null);
                                  setCsvErrors([]);
                                  setUploadedImages({});
                                  setDedicatedNames([{
                                    recipient_name: '',
                                    recipient_email: '',
                                    recipient_phone: '',
                                    assignee_name: '',
                                    assignee_email: '',
                                    assignee_phone: '',
                                    relation: '',
                                    trees_count: donationTreeCount
                                  }]);
                                }
                              }}
                            />
                            <label htmlFor="multipleNames" className="text-gray-700">
                              Dedicate to multiple people?
                            </label>
                          </div>
                        </>
                      )}


                      {multipleNames && (
                        <div className="inline-flex p-1 space-x-1 rounded-xl w-full sm:w-auto border-2 border-gray-300">
                          <button
                            type="button"
                            className={`${nameEntryMethod === "manual"
                              ? "bg-green-500 shadow-sm text-white ring-green-700"
                              : "text-green-600 hover:bg-green-100"
                              } flex items-center justify-center px-6 py-2.5 text-sm font-medium rounded-lg flex-1 sm:flex-none transition-all duration-200`}
                            onClick={() => setNameEntryMethod("manual")}
                          >
                            Manual
                          </button>
                          <button
                            type="button"
                            className={`${nameEntryMethod === "csv"
                              ? "bg-green-500 shadow-sm text-white ring-green-700"
                              : "text-green-600 hover:bg-green-100"
                              } flex items-center justify-center px-6 py-2.5 text-sm font-medium rounded-lg flex-1 sm:flex-none transition-all duration-200`}
                            onClick={() => setNameEntryMethod("csv")}
                          >
                            Bulk Upload CSV
                          </button>
                        </div>
                      )}

                      {multipleNames && nameEntryMethod === "manual" ? (
                        <div className="space-y-4">
                          {errors["totalTrees"] && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                              <p className="text-red-700">{errors["totalTrees"]}</p>
                            </div>
                          )}
                          {dedicatedNames.map((name, index) => (
                            <UserDetailsForm
                              key={index}
                              data={name}
                              index={index}
                              onUpdate={(field, value) => handleNameChange(index, field, value)}
                              errors={errors}
                              maxTrees={donationTreeCount - dedicatedNames.slice(0, -1).map(user => user.trees_count || 1).reduce((prev, count) => prev + count, 0)}
                              canRemove={index > 0}
                              onRemove={index > 0 ? () => handleRemoveName(index) : undefined}
                            />
                          ))}
                          <button
                            type="button"
                            onClick={handleAddName}
                            className={`flex items-center text-green-700 hover:text-green-900 mt-2 ${dedicatedNames.reduce((sum, user) => sum + (user.trees_count || 1), 0) >= donationTreeCount ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={dedicatedNames[dedicatedNames.length - 1].recipient_name.trim() === "" || dedicatedNames.reduce((sum, user) => sum + (user.trees_count || 1), 0) >= donationTreeCount}
                            title={dedicatedNames.reduce((sum, user) => sum + (user.trees_count || 1), 0) >= donationTreeCount ? 'You have already assigned all the trees to users' : ''}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Add another name
                          </button>
                        </div>
                      ) : multipleNames && nameEntryMethod === "csv" && (
                        <div className="space-y-4 border border-gray-200 rounded-md p-4">
                          <div className="space-y-4">
                            {errors["totalTrees"] && (
                              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                                <p className="text-red-700">{errors["totalTrees"]}</p>
                              </div>
                            )}
                            <h3 className="font-medium">Bulk Upload Recipients via CSV</h3>
                            <p className="text-sm text-gray-600">
                              <button
                                type="button"
                                onClick={downloadSampleCsv}
                                className="text-blue-600 hover:underline"
                              >
                                Download sample CSV
                              </button>
                            </p>

                            <div className="flex gap-2">
                              <input
                                type="file"
                                ref={fileInputRef}
                                accept=".csv"
                                onChange={handleCsvUpload}
                                className="hidden"
                              />
                              <button
                                value={undefined}
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md"
                              >
                                Select CSV File
                              </button>
                              {csvFile && (
                                <span className="self-center text-sm">
                                  {csvFile.name}
                                </span>
                              )}
                            </div>

                            <div className="pt-2">
                              <label className="block text-sm font-medium mb-1">
                                Upload Recipient Images
                              </label>
                              <input
                                type="file"
                                id="recipient-images"
                                multiple
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                              <label
                                htmlFor="recipient-images"
                                className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md cursor-pointer"
                              >
                                <UploadIcon className="w-4 h-4" />
                                Select Images
                              </label>
                              <p className="mt-1 text-xs text-gray-500">
                                Upload images matching CSV names (e.g. &quot;john_doe.jpg&quot;)
                              </p>
                            </div>
                          </div>

                          {csvErrors.length > 0 && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4">
                              <h4 className="font-medium text-red-700">CSV Errors:</h4>
                              {(() => {
                                // Count unique rows with errors
                                const rowErrorNumbers = new Set(
                                  csvErrors
                                    .map(error => {
                                      const match = error.match(/Row (\d+):/);
                                      return match ? match[1] : null;
                                    })
                                    .filter(Boolean)
                                );
                                if (rowErrorNumbers.size > 0) {
                                  return (
                                    <p className="text-sm text-red-600 mb-2">
                                      Out of {csvPreview.length} rows, {rowErrorNumbers.size} row{rowErrorNumbers.size > 1 ? 's' : ''} have errors
                                    </p>
                                  );
                                }
                                return null;
                              })()}
                              <ul className="list-disc pl-5 text-red-600">
                                {csvErrors.map((error, i) => (
                                  <li key={i} className="text-sm">{error}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {csvPreview.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-medium">
                                Preview ({csvPreview.length} recipients) - Page {currentPage + 1} of {Math.ceil(csvPreview.length / itemsPerPage)}
                              </h4>
                              <div className="max-h-96 overflow-y-auto border rounded-md">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee Name</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee Email</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee Phone</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trees</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedData.map((recipient, i) => {
                                      const hasImageName = recipient.image && typeof recipient.image === 'string' && recipient.image.trim() !== '';
                                      const hasImageUploaded = hasImageName && recipient.image && recipient.image.startsWith('blob:');
                                      const hasErrors = Array.isArray(recipient._errors) && recipient._errors.length > 0;
                                      // For image column
                                      let imageCell;
                                      if (hasImageName) {
                                        if (hasImageUploaded) {
                                          imageCell = (
                                            <img
                                              src={recipient.image as string}
                                              className="h-10 w-10 rounded-full object-cover"
                                              alt={`${recipient.recipient_name}'s profile`}
                                            />
                                          );
                                        } else {
                                          imageCell = <span className="text-sm text-gray-500">No image uploaded</span>;
                                        }
                                      } else {
                                        imageCell = <span className="text-sm text-gray-500">Image not provided</span>;
                                      }
                                      // For valid column
                                      let validCell;
                                      if (hasErrors) {
                                        validCell = (
                                          <span
                                            className="text-red-600 cursor-help"
                                            title={Array.isArray(recipient._errors) ? recipient._errors.join(', ') : ''}
                                          >
                                            &#10006;
                                          </span>
                                        );
                                      } else if (hasImageName) {
                                        validCell = hasImageUploaded ? (
                                          <span className="text-green-600">✓</span>
                                        ) : (
                                          <span className="text-red-600">✕</span>
                                        );
                                      } else {
                                        validCell = <span className="text-green-600">✓</span>;
                                      }
                                      return (
                                        <tr key={i} className={hasErrors ? "bg-red-50" : ""}>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{recipient.recipient_name || <span className="italic text-gray-400">[Missing]</span>}</td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{recipient.recipient_email || '-'}</td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{recipient.recipient_phone || '-'}</td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{recipient.trees_count || '1'}</td>
                                          <td className="px-4 py-2 whitespace-nowrap">{imageCell}</td>
                                          <td className="px-4 py-2 whitespace-nowrap">{validCell}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                              <div className="flex justify-between items-center mt-2">
                                <button
                                  type="button"
                                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                  disabled={currentPage === 0}
                                  className="px-3 py-1 rounded-md bg-gray-200 disabled:opacity-50 text-sm"
                                >
                                  Previous
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setCurrentPage(p =>
                                    Math.min(p + 1, Math.ceil(csvPreview.length / itemsPerPage) - 1)
                                  )}
                                  disabled={(currentPage + 1) * itemsPerPage >= csvPreview.length}
                                  className="px-3 py-1 rounded-md bg-gray-200 disabled:opacity-50 text-sm"
                                >
                                  Next
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end space-x-4 mt-8">
                    <div className="w-full flex flex-col items-end">
                      <button
                        type="button"
                        onClick={() => {
                          // Check for any errors in form, csv, or table
                          const hasFormErrors = Object.entries(errors).some(
                            ([key, value]) => key !== "comments" && value && value.trim() !== ""
                          );
                          if (hasTableErrors || hasFormErrors || csvErrors.length > 0) {
                            alert('Please fix all errors in the form and table above before proceeding.');
                            return;
                          }
                          const mainFormValid = Object.keys(formData).every(key => {
                            if (key === "comments") return true;
                            const value = formData[key as keyof typeof formData];
                            // Check for mandatory fields
                            if (key === "fullName" || key === "email" || key === "phone" || key === "panNumber") {
                              return !!value;
                            }
                            return true;
                          });

                          if (treeLocation === 'adopt') {
                            if (!adoptedTreeCount) {
                              alert("Please enter number of trees you would like to adopt!");
                              return;
                            }
                            if (!visitDate) {
                              alert("Please select visit date!");
                              return;
                            }
                          }

                          if (treeLocation === 'donate' && donationMethod === 'trees' && !donationTreeCount) {
                            alert("Please enter number of trees you would like to donate!");
                            return;
                          }

                          const treesCount = donationTreeCount;
                          const treesAssigned = dedicatedNames.filter(user => user.recipient_name?.trim())
                            .map(user => user.trees_count)
                            .reduce((prev, curr) => prev + curr, 0);

                          if (treesAssigned > treesCount) {
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
                            return;
                          }

                          if (mainFormValid) {
                            setCurrentStep(2);
                          } else {
                            alert("Please fill all required fields");
                          }
                        }}
                        className={`px-6 py-3 rounded-md transition-colors text-white ${hasDuplicateNames || hasTableErrors || Object.entries(errors).some(([key, value]) => key !== "comments" && value && value.trim() !== "") || csvErrors.length > 0
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700"
                          }`}
                        disabled={hasDuplicateNames || hasTableErrors || Object.entries(errors).some(([key, value]) => key !== "comments" && value && value.trim() !== "") || csvErrors.length > 0}
                      >
                        Proceed to pay
                      </button>
                      {(hasTableErrors || Object.values(errors).some(e => e && e.trim() !== "") || csvErrors.length > 0) && (
                        <div className="text-red-600 text-sm mt-2">Please fix all errors in the form before proceeding. {hasTableErrors && "There are errors in csv file uploaded!"} </div>
                      )}
                      {hasDuplicateNames && (
                        <p className="text-red-600 text-sm mt-2">
                          Assignee name should be unique. Please remove duplicates to proceed.
                        </p>
                      )}
                    </div>
                  </div>
                </form>
              ) : (
                currentStep === 2 && (
                  <div id="order-summary">
                    <SummaryPaymentPage
                      formData={formData}
                      treeLocation={treeLocation}
                      visitDate={visitDate}
                      adoptedTreeCount={adoptedTreeCount}
                      donationMethod={donationMethod}
                      donationTreeCount={donationTreeCount}
                      donationAmount={donationAmount}
                      dedicatedNames={dedicatedNames}
                      paymentOption={paymentOption}
                      isAboveLimit={isAboveLimit}
                      rpPaymentSuccess={rpPaymentSuccess}
                      paymentProof={paymentProof}
                      setPaymentProof={setPaymentProof}
                      isProcessing={isProcessing}
                      isLoading={isLoading}
                      setCurrentStep={setCurrentStep}
                      handleSubmit={handleSubmit}
                    />
                  </div>
                )
              )}
            </ScrollReveal>
          </div>
        </div>

        <div className="mt-12 h-px bg-gray-200"></div>
        <div className="mt-6 mb-6 space-y-4 bg-green-50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold text-green-800">Inspire Others to Give</h4>
          <p className="text-sm text-green-700">
            Do you know you can create your personal referral link and share it with friends and family? Every contribution made through your link will be tracked. When someone contributes using your link, you&apos;ll receive an email with your personal referral dashboard where you can see the impact you&apos;ve inspired as others join you in supporting our reforestation efforts.
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
      {showSuccessDialog && <SuccessDialog />}
      {showReferralDialog && (
        <ReferralDialog
          linkType="donate"
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

export default function DonatePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Donation />
    </Suspense>
  );
}