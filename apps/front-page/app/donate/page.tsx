"use client";

import { Button } from "ui/components/button";
import Link from "next/link";
import { motion } from "framer-motion";
import MotionDiv from "components/animation/MotionDiv";
import { ScrollReveal } from "components/Partials/HomePage";
import labels from "~/assets/labels.json";
import { useState, useEffect, useRef } from "react";
import Script from 'next/script';
import Image from 'next/image';
import Papa from 'papaparse';
import { apiClient } from "~/api/apiClient";
import CsvUpload from "components/CsvUpload";
import { UploadIcon } from "lucide-react";
import { getUniqueRequestId } from "~/utils";
import { UserDetailsForm } from 'components/donate/UserDetailsForm';
import { SummaryPaymentPage } from './donationSummary';

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

export default function DonatePage() {
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
    trees_count: 1
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
  const [pledgeType, setPledgeType] = useState<"trees" | "acres">("trees");
  const [paymentOption, setPaymentOption] = useState<"razorpay" | "bank-transfer">("razorpay");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isAboveLimit, setIsAboveLimit] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [nameEntryMethod, setNameEntryMethod] = useState<"manual" | "csv">("manual");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<DedicatedName[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<Record<string, File>>({});
  const [imageUploadProgress, setImageUploadProgress] = useState<Record<string, number>>({});
  const [visitDate, setVisitDate] = useState<string>("");
  const [adoptedTreeCount, setAdoptedTreeCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [donationId, setDonationId] = useState<string | null>(null);
  const [donationType, setDonationType] = useState<"adopt" | "donate">("adopt");
  const [donationMethod, setDonationMethod] = useState<"trees" | "amount">("trees");
  const [donationTreeCount, setDonationTreeCount] = useState<number>(1);
  const [donationAmount, setDonationAmount] = useState<number>(1500);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  const itemsPerPage = 10;
  const paginatedData = csvPreview.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  useEffect(() => {
    let amount = 0;
    if (treeLocation === "adopt") {
      amount = 3000 * (adoptedTreeCount || 0);
    } else if (treeLocation === "donate") {
      amount = donationMethod === "trees"
        ? 1500 * (donationTreeCount || 0)
        : donationAmount;
    }
    setTotalAmount(amount);
    setIsAboveLimit(amount > 100000);
  }, [treeLocation, adoptedTreeCount, donationMethod, donationTreeCount, donationAmount]);

  useEffect(() => {
    if (nameEntryMethod === "csv" && csvPreview.length > 0 && csvErrors.length === 0) {
      setDedicatedNames(csvPreview);
      setMultipleNames(true);
    }
  }, [csvPreview, nameEntryMethod, csvErrors]);

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
    name: /^[A-Za-z\s.'-]*$/, // Allow empty for optional fields
    email: /^[^\s@]+@[^\s@]+\.[^\s@]*$/,
    phone: /^[0-9]{10,15}$/,
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

    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateDedicatedNames = () => {
    let isValid = true;
    const newErrors: Record<string, string> = {};

    dedicatedNames.forEach((name, index) => {
      if (!name.recipient_name.trim()) {
        newErrors[`dedicatedName-${index}`] = "Name is optional";
        isValid = true; // Allow empty
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

        data.forEach((row, index) => {
          if (!row.recipient_name) {
            errors.push(`Row ${index + 1}: Recipient Name is optional`);
            return;
          }

          if (row.recipient_email && !validationPatterns.email.test(String(row.recipient_email))) {
            errors.push(`Row ${index + 1}: Invalid Recipient Email format`);
          }
          if (row.assignee_email && !validationPatterns.email.test(String(row.assignee_email))) {
            errors.push(`Row ${index + 1}: Invalid Assignee Email format`);
          }

          if (row.recipient_phone && !validationPatterns.phone.test(String(row.recipient_phone))) {
            errors.push(`Row ${index + 1}: Invalid Recipient Phone number (10-15 digits required)`);
          }
          if (row.assignee_phone && !validationPatterns.phone.test(String(row.assignee_phone))) {
            errors.push(`Row ${index + 1}: Invalid Assignee Phone number (10-15 digits required)`);
          }

          validRecipients.push({
            recipient_name: String(row.recipient_name),
            recipient_email: row.recipient_email ? String(row.recipient_email) : row.recipient_name.toLowerCase().replace(/\s+/g, '') + "@14trees",
            recipient_phone: row.recipient_phone ? String(row.recipient_phone) : '',
            trees_count: row.trees_count ? parseInt(String(row.trees_count)) : 1,
            image: row.image ? String(row.image) : undefined,
            assignee_name: row.assignee_name ? String(row.assignee_name) : String(row.recipient_name),
            assignee_email: row.assignee_email ? String(row.assignee_email) : row.assignee_name.toLowerCase().replace(/\s+/g, '') + "@14trees",
            assignee_phone: row.assignee_phone ? String(row.assignee_phone) : '',
            relation: row.relation ? String(row.relation) : 'other'
          });
        });

        setCsvErrors(errors);
        setCsvPreview(validRecipients);
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
    const url = "https://docs.google.com/spreadsheets/d/1DDM5nyrvP9YZ09B60cwWICa_AvbgThUx-yeDVzT4Kw4/gviz/tq?tqx=out:csv&sheet=Sheet1";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsSubmitting(true);

    const uniqueRequestId = getUniqueRequestId();
    setDonationId(uniqueRequestId);

  // Handle payment based on selected option
 
  let paymentId: number | null = razorpayPaymentId || null;
  if (paymentOption === "bank-transfer") {
    paymentId = await handleBankPayment(uniqueRequestId, razorpayPaymentId);
    setRazorpayPaymentId(paymentId);
  }

  if (!paymentId) {
    setIsLoading(false);
    setIsSubmitting(false);
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
    const users = dedicatedNames.length === 1 && dedicatedNames[0].recipient_name.trim() === "" ? [] : dedicatedNames;
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

    try {
      const recipientsWithImages = await Promise.all(
        dedicatedNames.map(async (recipient) => {
          const image = recipient.image;
          if (image && typeof image !== 'string') {
            try {
              const imageUrl = await apiClient.uploadUserImage(image);
              return { ...recipient, image_url: imageUrl };
            } catch (error) {
              console.error("Failed to upload image:", error);
              return recipient;
            }
          }
          return recipient;
        })
      );

      const donationRequest = {
        sponsor_name: formData.fullName,
        sponsor_email: formData.email,
        sponsor_phone: formData.phone,
        category: treeLocation === "adopt" ? "Foundation" : "Public",
        donation_type: treeLocation === "adopt" ? "adopt" : "donate", 
        donation_method: treeLocation === "donate" ? donationMethod : undefined,
        payment_id: razorpayPaymentId,
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
        users: users.map(user => ({
          ...user,
          recipient_email: user.recipient_email || user.recipient_name.toLowerCase().replace(/\s+/g, '') + "@14trees",
          assignee_email: user.assignee_email || user.assignee_name.toLowerCase().replace(/\s+/g, '') + "@14trees"
        })),
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
      setShowSuccessDialog(true);

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
        trees_count: 1
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

    } catch (err: any) {
      console.error("Donation error:", err);
      alert(err.message || "Failed to create donation");
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
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
      const error = !validationPatterns.name.test(value.toString())
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

  const calculateDonationAmount = (): number => {
    if (treeLocation === "adopt") return 3000;
    if (treeLocation === "donate") {
      return donationMethod === "trees" ? 1500 : 0;
    }
    return 0;
  };

  const handleRazorpayPayment = async () => {
    if (isAboveLimit) {
      alert("Please use Bank Transfer for donations above ₹1,00,000");
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
      if (!orderId) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            amount,
            donor_type: "Indian Citizen", // Assuming default for simplification
            consent: true,
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
                signature: response.razorpay_signature
              })
            });
            if (!verificationResponse.ok) throw new Error("Verification failed");
            alert("Payment successful!");
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
          "Individual", 
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
      alert(err.message || "Payment failed");
      return null;
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const previewUrls: Record<string, string> = {};

    Array.from(files).forEach(file => {
      const key = file.name.replace(/\.[^/.]+$/, "").toLowerCase().replace(/\s+/g, '_');
      previewUrls[key] = URL.createObjectURL(file);
    });

    setCsvPreview(prev => prev.map(recipient => {
      const imageKey = recipient.recipient_name.toLowerCase().replace(/\s+/g, '_');
      return previewUrls[imageKey]
        ? { ...recipient, image: previewUrls[imageKey] }
        : recipient;
    }));
  };

  const SuccessDialog = () => {
    const [additionalInvolvement, setAdditionalInvolvement] = useState<string[]>([]);
    const [comments, setComments] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateSuccess, setUpdateSuccess] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);

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

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-bold text-green-600 mb-4">Donation Successful!</h3>
          <p className="mb-2">Your donation request has been processed successfully.</p>
          {donationId && (
            <p className="mb-2">
              <strong>Donation ID:</strong> {donationId}
            </p>
          )}
          <p className="mb-4">The receipt and the certificate of appreciation have been sent to your email ID. (Sometimes the email lands up in the Spam/Junk folder, please ensure to check it.) This email will also contain the link to your tree dashboard if you have donated for planting trees, which will show the latest picture of the plant/tree, location on the map and other details.
          </p>
          <p className="mb-5">In case of any issue pls call ....... | contact@14trees.org
          </p>

          {!updateSuccess ? (
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
                  onClick={() => setShowSuccessDialog(false)}
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
              <p className="text-green-600 mb-4">Thank you for providing additional information!</p>
              <button
                onClick={() => setShowSuccessDialog(false)}
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
      <div className="relative min-h-[45vh] w-full md:min-h-[60vh]">
        <MotionDiv
          className="container z-0 mx-auto my-10 overflow-hidden text-gray-800"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className="z-0 mx-4 pt-16 md:mx-12">
            <div className="md:mx-12 my-10 object-center text-center md:my-20 md:w-4/5 md:text-left">
              <h6 className="text-grey-600 mt-6 text-sm font-light md:text-lg">
                By donating towards the plantation of 14 native trees, you're directly contributing to the restoration of ecologically degraded hills near Pune. These barren landscapes, currently home only to fire-prone grass, suffer from severe topsoil erosion and depleted groundwater. Through our reforestation efforts—planting native species, digging ponds to store rainwater, and creating trenches for groundwater recharge—we’re not just bringing life back to the land, we’re rebuilding entire ecosystems.
              </h6>
              <h6 className="text-grey-600 mt-6 text-sm font-light md:text-lg">
                Your support goes beyond planting trees. Each donation helps generate sustainable livelihoods for local tribal communities who are at the heart of this transformation. By funding 14 trees, you're enabling long-term environmental healing and economic empowerment for those who depend on the land the most.
              </h6>
              <h2 className="mt-12 leading-12 text-4xl font-bold tracking-tight text-gray-800 shadow-black drop-shadow-2xl md:text-5xl">
                Support Our Reforestation
              </h2>
              <h3 className="text-grey-600 mt-6 text-sm font-light md:text-xl">
                {labels.site.description}
              </h3>
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

                    {/* First radio option - Adoption */}
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
                        <div>
                          <div>I would like to adopt the trees planted during my visit to 14Trees in the past</div>
                          <div className="text-sm text-gray-500 pl-6">
                            (This option is planting on the foundation land but we are limiting its reach)
                          </div>
                        </div>
                      </label>

                      {treeLocation === "adopt" && (
                        <div className="space-y-4 pl-6">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date of visit: <span className="text-gray-500">- approx date / month is fine if you don't remember</span>
                              </label>
                              <input
                                type="date"
                                className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-700"
                                value={visitDate}
                                onChange={(e) => setVisitDate(e.target.value)}
                                placeholder="dd-mm-yyyy"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Trees</label>
                              <input
                                type="number"
                                min="0"
                                placeholder="Number of trees"
                                className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-700"
                                value={adoptedTreeCount || ""}
                                onChange={(e) => {
                                  const number = parseInt(e.target.value);
                                  if (isNaN(number) || number <= 0) setAdoptedTreeCount(0);
                                  else setAdoptedTreeCount(number);
                                }}
                              />
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="font-medium">Amount: {3000 * (adoptedTreeCount || 0)} INR</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Second radio option - Donation */}
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
                        <span>I am making a donation to support the reforestation project.</span>
                      </label>

                      {treeLocation === "donate" && (
                        <div className="space-y-4 pl-6">
                          <div className="space-y-2">
                            <label className="flex items-center space-x-3">
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
                              <input
                                type="number"
                                min="0"
                                className="w-20 min-w-[150px] rounded-md border border-gray-300 px-3 py-1 text-gray-700"
                                disabled={donationMethod !== 'trees'}
                                value={donationTreeCount}
                                onChange={(e) => setDonationTreeCount(Number(e.target.value))}
                              />
                              <span>Trees</span>
                            </label>

                            <label className="flex items-center space-x-3">
                              <input
                                type="radio"
                                name="donationMethod"
                                value="amount"
                                className="h-5 w-5"
                                checked={donationMethod === "amount"}
                                onChange={() => {
                                  setDonationMethod("amount");
                                }}
                              />
                              <span>I want to donate</span>
                              <input
                                type="number"
                                min="1500"
                                className="w-20 min-w-[150px] rounded-md border border-gray-300 px-3 py-1 text-gray-700"
                                disabled={donationMethod !== 'amount'}
                                value={donationAmount}
                                onChange={(e) => {
                                  const amount = parseInt(e.target.value);
                                  if (isNaN(amount) || amount < 1500) setDonationAmount(1500);
                                  else setDonationAmount(amount);
                                }}
                              />
                              <span>Rupees</span>
                            </label>
                          </div>

                          {donationMethod === "trees" && (
                            <div className="font-medium">
                              Donation amount: {donationTreeCount * 1500} INR
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h2 className="text-2xl font-semibold">Your details</h2>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center">
                        <label className="w-48 text-gray-700">Donated by*:</label>
                        <div className="flex-1">
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

                      <div className="flex items-center">
                        <label className="w-48 text-gray-700">Email ID*:</label>
                        <div className="flex-1">
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

                      <div className="flex items-center">
                        <label className="w-48 text-gray-700">Mobile number*:</label>
                        <div className="flex-1">
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
                            placeholder="Type your mobile number"
                            pattern="[0-9]{10,15}"
                            title="10-15 digit phone number"
                          />
                          {errors.phone && (
                            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center">
                        <label className="w-48 text-gray-700">PAN number*:</label>
                        <div className="flex-1">
                          <input
                            type="text"
                            name="panNumber"
                            className={`w-full rounded-md border ${errors.panNumber ? 'border-red-500' : 'border-gray-300'} px-4 py-2 text-gray-700 uppercase`}
                            value={formData.panNumber}
                            onChange={handleInputChange}
                            onBlur={(e) => {
                              const error = validateField(e.target.name, e.target.value);
                              setErrors(prev => ({ ...prev, panNumber: error }));
                            }}
                            placeholder="Enter your PAN number"
                            pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                            maxLength={10}
                          //required={taxStatus === "indian"}
                          />
                          {errors.panNumber && (
                            <p className="mt-1 text-sm text-red-600">{errors.panNumber}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {donationMethod === "trees" && treeLocation === "donate" && (
                    <div className="space-y-4">
                      <label className="mb-2 block text-lg font-light">
                        I&apos;d like my trees to be planted in the following name:
                      </label>

                      <div className="flex items-center mb-4">
                        <input
                          type="checkbox"
                          id="multipleNames"
                          className="h-5 w-5 mr-3"
                          checked={multipleNames}
                          onChange={(e) => setMultipleNames(e.target.checked)}
                        />
                        <label htmlFor="multipleNames" className="text-gray-700">
                          Dedicate to multiple people?
                        </label>
                      </div>

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
                            Add Manually
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
                            className="flex items-center text-green-700 hover:text-green-900 mt-2"
                            disabled={dedicatedNames[dedicatedNames.length - 1].recipient_name.trim() === ""}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Add another name
                          </button>
                        </div>
                      ) : multipleNames && nameEntryMethod === "csv" ? (
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
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient Name</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient Email</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient Phone</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee Name</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee Email</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee Phone</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trees</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedData.map((recipient, i) => (
                                      <tr key={i}>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{recipient.recipient_name}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{recipient.recipient_email || '-'}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{recipient.recipient_phone || '-'}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{recipient.assignee_name || '-'}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{recipient.assignee_email || '-'}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{recipient.assignee_phone || '-'}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{recipient.trees_count || '1'}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                          {recipient.image && (
                                            typeof recipient.image === 'string' ? (
                                              <img
                                                src={recipient.image}
                                                className="h-10 w-10 rounded-full object-cover"
                                                alt={`${recipient.recipient_name}'s profile`}
                                              />
                                            ) : (
                                              <div className="flex items-center">
                                                <span className="text-sm text-gray-500">Ready to upload</span>
                                                <button
                                                  onClick={() => {
                                                    // Add image upload handler here
                                                  }}
                                                  className="ml-2 text-sm text-blue-600 hover:underline"
                                                >
                                                  Upload
                                                </button>
                                              </div>
                                            )
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              <div className="flex justify-between items-center mt-2">
                                <button
                                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                  disabled={currentPage === 0}
                                  className="px-3 py-1 rounded-md bg-gray-200 disabled:opacity-50 text-sm"
                                >
                                  Previous
                                </button>

                                <button
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
                      ) : (
                        <div className="space-y-4">
                          <input
                            type="text"
                            placeholder="Recipient name"
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
                              placeholder="Recipient Email (optional)"
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
                              placeholder="Recipient Phone (optional)"
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
                          <div className="mt-6">
                            <label className="flex items-center space-x-3 mb-4">
                              <input
                                type="checkbox"
                                checked={isAssigneeDifferent}
                                onChange={(e) => setIsAssigneeDifferent(e.target.checked)}
                                className="h-5 w-5"
                              />
                              <span>Assign trees to someone else?</span>
                            </label>

                            {isAssigneeDifferent && (
                              <div className="border border-gray-200 rounded-md p-4 space-y-4">
                                <h3 className="font-medium">Assignee Details</h3>
                                <input
                                  type="text"
                                  placeholder="Assignee Name *"
                                  value={dedicatedNames[0].assignee_name}
                                  onChange={(e) => handleNameChange(0, "assignee_name", e.target.value)}
                                  className="w-full rounded-md border border-gray-300 px-4 py-3"
                                  required
                                />
                                <div className="grid gap-4 md:grid-cols-2">
                                  <input
                                    type="email"
                                    placeholder="Assignee Email (optional)"
                                    value={dedicatedNames[0].assignee_email}
                                    onChange={(e) => handleNameChange(0, "assignee_email", e.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-4 py-3"
                                  />
                                  <input
                                    type="tel"
                                    placeholder="Assignee Phone (optional)"
                                    value={dedicatedNames[0].assignee_phone}
                                    onChange={(e) => handleNameChange(0, "assignee_phone", e.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-4 py-3"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">Relation *</label>
                                  <select
                                    value={dedicatedNames[0].relation}
                                    onChange={(e) => handleNameChange(0, "relation", e.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-4 py-3"
                                  >
                                    <option value="father">Father</option>
                                    <option value="mother">Mother</option>
                                    <option value="uncle">Uncle</option>
                                    <option value="aunt">Aunt</option>
                                    <option value="grandfather">Grandfather</option>
                                    <option value="grandmother">Grandmother</option>
                                    <option value="son">Son</option>
                                    <option value="daughter">Daughter</option>
                                    <option value="wife">Wife</option>
                                    <option value="husband">Husband</option>
                                    <option value="grandson">Grandson</option>
                                    <option value="granddaughter">Granddaughter</option>
                                    <option value="brother">Brother</option>
                                    <option value="sister">Sister</option>
                                    <option value="cousin">Cousin</option>
                                    <option value="friend">Friend</option>
                                    <option value="colleague">Colleague</option>
                                    <option value="other">Other</option>
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

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

                        if (mainFormValid) {
                          setCurrentStep(2);
                        } else {
                          alert("Please fill all required fields");
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                </form>
              ) : (
                currentStep === 2 && (
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
                    razorpayLoaded={razorpayLoaded}
                    rpPaymentSuccess={rpPaymentSuccess}
                    isProcessing={isProcessing}
                    isLoading={isLoading}
                    setCurrentStep={setCurrentStep}
                    handleRazorpayPayment={handleRazorpayPayment}
                    handleSubmit={handleSubmit}
                    setDonationId={setDonationId}
                  />
                )
              )}
            </ScrollReveal>
          </div>
        </div>
      </div>
      {showSuccessDialog && <SuccessDialog />}
    </div>
  );
}