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
import { UserDetailsForm } from 'components/donate/UserDetailsForm';

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
  tree_count: number;
  image?: string;
  image_url?: string;
  [key: string]: string | number | undefined;
}

export default function DonatePage() {
  // Form state (existing state remains unchanged)
  const [treeLocation, setTreeLocation] = useState("");
  const [groveType, setGroveType] = useState("");
  const [otherGroveType, setOtherGroveType] = useState("other");
  const [taxStatus, setTaxStatus] = useState("");
  const [multipleNames, setMultipleNames] = useState(false);
  const [dedicatedNames, setDedicatedNames] = useState<DedicatedName[]>([{
    recipient_name: "",
    recipient_email: "",
    recipient_phone: "",
    assignee_name: "",
    assignee_email: "",
    assignee_phone: "",
    relation: "",
    tree_count: 1
  }]);
  const [isAssigneeDifferent, setIsAssigneeDifferent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [razorpayPaymentId, setRazorpayPaymentId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    numberOfTrees: "",
    pledgedArea: "",
    panNumber: "",
    comments: ""
  });
  const [pledgeType, setPledgeType] = useState<"trees" | "acres">("trees");
  const [paymentOption, setPaymentOption] = useState<"razorpay" | "bank-transfer">("razorpay");
  const [totalAmount, setTotalAmount] = useState(0);
  const [isAboveLimit, setIsAboveLimit] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [nameEntryMethod, setNameEntryMethod] = useState<"manual" | "csv">("manual");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<DedicatedName[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<Record<string, File>>({});
  const [imageUploadProgress, setImageUploadProgress] = useState<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [donationId, setDonationId] = useState<string | null>(null);

  const itemsPerPage = 10;
  const paginatedData = csvPreview.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  // Calculate total amount (existing unchanged)
  useEffect(() => {
    const perTreeAmount = calculateDonationAmount();
    const total = perTreeAmount * Number(formData.numberOfTrees || 0);
    setTotalAmount(total);
    setIsAboveLimit(total > 100000);

    if (total > 100000) {
      setPaymentOption("bank-transfer");
    }
  }, [treeLocation, formData.numberOfTrees]);

  useEffect(() => {
    if (nameEntryMethod === "csv" && csvPreview.length > 0 && csvErrors.length === 0) {
      setDedicatedNames(csvPreview);
      setMultipleNames(true);
    }
  }, [csvPreview, nameEntryMethod, csvErrors]);

  useEffect(() => {
    setErrors(prev => {
      const newErrors = { ...prev };

      // Clear opposite field errors completely
      if (pledgeType === "acres") {
        delete newErrors.numberOfTrees;
      } else {
        delete newErrors.pledgedArea;
      }

      return newErrors;
    });
  }, [pledgeType]);

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
    name: /^[A-Za-z\s.'-]+$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[0-9]{10,15}$/,
    pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    number: /^[0-9]+(\.[0-9]+)?$/
  };

  // Validate field (existing unchanged)
  const validateField = (name: string, value: string) => {
    let error = "";

    if (!value.trim()) {
      if (name === "phone") return "";
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

      case "numberOfTrees":
        if (pledgeType === "trees") {
          if (!value.trim()) {
            error = "Number of trees is required";
          } else if (!validationPatterns.number.test(value)) {
            error = "Please enter a valid number";
          } else if (parseInt(value) <= 0) {
            error = "Must be at least 1 tree";
          }
        } else {
          error = ""; // Explicitly clear error when not applicable
        }
        break;
      // NEW: Acre validation
      case "pledgedArea":
        if (pledgeType === "acres") {
          if (!value.trim()) {
            error = "Acres is required";
          } else if (!validationPatterns.number.test(value)) {
            error = "Please enter a valid number";
          } else if (parseFloat(value) <= 0) {
            error = "Must be greater than 0";
          }
        }
        break;
    }

    return error;
  };

  // Handle input changes (existing unchanged)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // NEW: Clear opposite field errors when typing
    if (name === "pledgedArea" && pledgeType === "acres") {
      setErrors(prev => ({ ...prev, numberOfTrees: "" }));
    } else if (name === "numberOfTrees" && pledgeType === "trees") {
      setErrors(prev => ({ ...prev, pledgedArea: "" }));
    }

    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Validate dedicated names (existing unchanged)
  const validateDedicatedNames = () => {
    let isValid = true;
    const newErrors: Record<string, string> = {};

    dedicatedNames.forEach((name, index) => {
      if (!name.recipient_name.trim()) {
        newErrors[`dedicatedName-${index}`] = "Name is required";
        isValid = false;
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
          isValid = false;
        }
      }

    });
    setErrors(prev => ({ ...prev, ...newErrors }));
    return isValid;
  };

  // Updated CSV handling functions
  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setCsvFile(files[0]);
    setCsvErrors([]);
    setCsvPreview([]);
    setCurrentPage(0);

    // Handle CSV file
    Papa.parse(files[0], {
      header: true,
      transformHeader: (header) => {
        // Map the CSV headers to our internal field names
        const headerMap: Record<string, string> = {
          'Recipient Name': 'recipient_name',
          'Recipient Email': 'recipient_email',
          'Recipient Communication Email (optional)': 'recipient_communication_email',
          'Recipient Phone (optional)': 'recipient_phone',
          'Number of trees to assign': 'tree_count',
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
          // Validate required fields
          if (!row.recipient_name) {
            errors.push(`Row ${index + 1}: Recipient Name is required`);
            return;
          }

          // Validate email formats if provided
          if (row.recipient_email && !validationPatterns.email.test(String(row.recipient_email))) {
            errors.push(`Row ${index + 1}: Invalid Recipient Email format`);
          }
          if (row.assignee_email && !validationPatterns.email.test(String(row.assignee_email))) {
            errors.push(`Row ${index + 1}: Invalid Assignee Email format`);
          }

          // Validate phone numbers if provided
          if (row.recipient_phone && !validationPatterns.phone.test(String(row.recipient_phone))) {
            errors.push(`Row ${index + 1}: Invalid Recipient Phone number (10-15 digits required)`);
          }
          if (row.assignee_phone && !validationPatterns.phone.test(String(row.assignee_phone))) {
            errors.push(`Row ${index + 1}: Invalid Assignee Phone number (10-15 digits required)`);
          }

          // Validate tree count
          if (row.tree_count && isNaN(parseInt(row.tree_count.toString()))) {
            errors.push(`Row ${index + 1}: Tree count must be a number`);
          }

          // Create valid recipient object
          validRecipients.push({
            recipient_name: String(row.recipient_name),
            recipient_email: row.recipient_email ? String(row.recipient_email) : row.recipient_communication_email ? String(row.recipient_communication_email) : row.recipient_name.toLowerCase().replace(/\s+/g, '') + "@14trees",
            recipient_phone: row.recipient_phone ? String(row.recipient_phone) : '',
            tree_count: row.tree_count ? parseInt(String(row.tree_count)) : 1,
            image: row.image ? String(row.image) : undefined,
            assignee_name: row.assignee_name ? String(row.assignee_name) : String(row.recipient_name),
            assignee_email: row.assignee_email ? String(row.assignee_email) : row.assignee_communication_email ? String(row.assignee_communication_email) : row.assignee_name.toLowerCase().replace(/\s+/g, '') + "@14trees",
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

    // Handle image files if any
    if (files.length > 1) {
      const imageFiles = Array.from(files).slice(1);
      // Match images to CSV rows (example: by filename convention)
      const updatedPreview = [...csvPreview];
      imageFiles.forEach((file) => {
        const match = file.name.match(/(\d+)/); // Look for numbers in filename
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
    const fileName = "UserDetails.csv";  // Set your desired file name here

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

  // Existing form submission (unchanged)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsSubmitting(true);
    const mainFormValid = Object.keys(formData).every(key => {
      if (key === "comments") {
        return true;
      }

      // NEW: Skip validation for fields not relevant to current pledge type
      if ((key === "numberOfTrees" && pledgeType === "acres") ||
        (key === "pledgedArea" && pledgeType === "trees")) {
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
    const dedicatedNamesValid = validateDedicatedNames();

    if (!mainFormValid || !dedicatedNamesValid) {
      console.group("Validation Breakdown");
      console.groupEnd();
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
        category: treeLocation === "foundation" ? "Foundation" : "Public",
        grove: groveType === "Other" ? otherGroveType : groveType,
        trees_count: pledgeType === "trees" ? parseInt(formData.numberOfTrees) : null,
        pledged_area_acres: pledgeType === "acres" ? parseFloat(formData.pledgedArea) : null,
        payment_id: razorpayPaymentId,
        contribution_options: "CSR",
        comments: formData.comments,
        users: dedicatedNames.map(user => ({
          ...user,
          recipient_email: user.recipient_email || user.recipient_name.toLowerCase().replace(/\s+/g, '') + "@14trees",
          assignee_email: user.assignee_email || user.assignee_name.toLowerCase().replace(/\s+/g, '') + "@14trees"
        })),
      };
      console.log("Final Payload:", JSON.stringify(donationRequest, null, 2));

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

      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        numberOfTrees: "",
        pledgedArea: "",
        panNumber: "",
        comments: ""
      });
      setDedicatedNames([
        {
          recipient_name: "",
          recipient_email: "",
          recipient_phone: "",
          assignee_name: "",
          assignee_email: "",
          assignee_phone: "",
          relation: "",
          tree_count: 1
        }
      ]);
      setTreeLocation("");
      setGroveType("");
      setTaxStatus("");
      setMultipleNames(false);
      setPaymentOption("razorpay");
      setCsvFile(null);
      setCsvPreview([]);
      setCsvErrors([]);

    } catch (err: any) {
      console.error("Donation error:", err);
      alert(err.message || "Failed to create donation");
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  // Rest of your existing functions (unchanged)
  const handleAddName = () => {
    setDedicatedNames([...dedicatedNames, { recipient_name: "", recipient_email: "", recipient_phone: "", assignee_name: "", assignee_email: "", assignee_phone: "", relation: "", tree_count: 1 }]);
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
    } else if (field === "tree_count" && value) {
      const error = isNaN(Number(value))
        ? "Please enter a valid number"
        : "";
      setErrors(prev => ({ ...prev, [`dedicatedTreeCount-${index}`]: error }));
    } else if (field === "assignee_name" && value) {
      const error = !validationPatterns.name.test(value.toString())
        ? "Please enter a valid name"
        : "";
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

  const calculateDonationAmount = (): number => {
    if (treeLocation === "foundation") return 3000;
    if (treeLocation === "public") return 1500;
    if (treeLocation === "gift") return 2000;
    return 0;
  };

  const handleRazorpayPayment = async () => {
    if (isAboveLimit) {
      alert("Please use Bank Transfer for donations above ₹1,00,000");
      return;
    }

    if (!formData.fullName || !formData.email || !formData.numberOfTrees || !taxStatus) {
      alert("Please fill in all required fields before payment");
      return;
    }

    setIsProcessing(true);
    try {
      const amount = pledgeType === "trees"
        ? calculateDonationAmount() * Number(formData.numberOfTrees)
        : 0; // Acres have no immediate payment
      if (amount <= 0) throw new Error("Invalid amount");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          amount,
          donorType: taxStatus === "indian" ? "Individual" : "Foreign",
          panNumber: formData.panNumber || null,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          numberOfTrees: formData.numberOfTrees,
          treeLocation
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Payment failed");
      }

      const { orderId } = await response.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount * 100,
        currency: 'INR',
        name: "14 Trees Foundation",
        description: `Donation for ${formData.numberOfTrees} trees`,
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
                payment_id: response.razorpay_payment_id,
                order_id: response.razorpay_order_id,
                signature: response.razorpay_signature
              })
            });
            if (!verificationResponse.ok) throw new Error("Verification failed");
            alert("Payment successful!");
          } catch (err) {
            console.error("Verification error:", err);
            alert("Payment verification failed");
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

  // Add this new component before your return statement
  const SuccessDialog = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h3 className="text-xl font-bold text-green-600 mb-4">Donation Successful!</h3>
        <p className="mb-2">Your donation request has been processed successfully.</p>
        {donationId && (
          <p className="mb-2">
            <strong>Donation ID:</strong> {donationId}
          </p>
        )}
        <p className="mb-4">You will receive an acknowledgment email shortly.</p>
        <button
          onClick={() => setShowSuccessDialog(false)}
          className="bg-green-600 text-white px-4 py-2 rounded-md w-full"
        >
          Close
        </button>
      </div>
    </div>
  );

  return (
    <div className="overflow-hidden bg-white">

      {/* Hero Section */}
      <div className="relative min-h-[45vh] w-full md:min-h-[60vh]">
        <MotionDiv
          className="container z-0 mx-auto my-10 overflow-hidden text-gray-800"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className="z-0 mx-4 pt-16 md:mx-12">
            <div className="md:mx-12 my-10 object-center text-center md:my-20 md:w-4/5 md:text-left">
              <h2 className="leading-12 text-4xl font-bold tracking-tight text-gray-800 shadow-black drop-shadow-2xl md:text-5xl">
                Support Our Reforestation
              </h2>
              <h3 className="text-grey-600 mt-6 text-sm font-light md:text-xl">
                {labels.site.description}
              </h3>
            </div>
          </div>
        </MotionDiv>
      </div>

      {/* Form Section */}
      <div className="text-gray-700">
        <div className="container z-0 mx-auto overflow-hidden pb-20">
          <div className="mx-auto w-full md:w-2/3">
            <ScrollReveal>
              <form className="space-y-8" onSubmit={handleSubmit}>
                {/* 1. Personal Information */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold">Your Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-lg font-light">Full name *</label>
                      <input
                        type="text"
                        name="fullName"
                        className={`w-full rounded-md border ${errors.fullName ? 'border-red-500' : 'border-gray-300'} px-4 py-3 text-gray-700`}
                        required
                        value={formData.fullName}
                        onChange={handleInputChange}
                        onBlur={(e) => {
                          const error = validateField(e.target.name, e.target.value);
                          setErrors(prev => ({ ...prev, fullName: error }));
                        }}
                      />
                      {errors.fullName && (
                        <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-2 block text-lg font-light">Email *</label>
                      <input
                        type="email"
                        name="email"
                        className={`w-full rounded-md border ${errors.email ? 'border-red-500' : 'border-gray-300'} px-4 py-3 text-gray-700`}
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        onBlur={(e) => {
                          const error = validateField(e.target.name, e.target.value);
                          setErrors(prev => ({ ...prev, email: error }));
                        }}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-2 block text-lg font-light">Phone number</label>
                      <input
                        type="tel"
                        name="phone"
                        className={`w-full rounded-md border ${errors.phone ? 'border-red-500' : 'border-gray-300'} px-4 py-3 text-gray-700`}
                        value={formData.phone}
                        onChange={handleInputChange}
                        onBlur={(e) => {
                          const error = validateField(e.target.name, e.target.value);
                          setErrors(prev => ({ ...prev, phone: error }));
                        }}
                        pattern="[0-9]{10,15}"
                        title="10-15 digit phone number"
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Tree Planting Options */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold">Tree Planting Options</h2>
                  <p className="font-medium">
                    Please select your preference (if you want to spread your trees over multiple options, please submit a fresh request indicating the tree count for each option).
                  </p>

                  <div className="space-y-3">
                    {[
                      { value: "foundation", label: "I'd like my trees to be planted on 14 Trees Foundations land preserve. The cost is Rs 3,000 (USD $40) per tree (inclusive of land cost)" },
                      { value: "public", label: "I'd like my trees to be planted on public land (gram panchayat or public school land). The cost is Rs. 1500 (USD $20) per tree." },
                      { value: "gift", label: "I'd like to gift trees which are to be planted on public land (gram panchayat or public school land). The cost is Rs. 2000 (USD $27) per tree." }
                    ].map((option) => (
                      <label key={option.value} className="flex items-start space-x-3">
                        <input
                          type="radio"
                          name="treeLocation"
                          value={option.value}
                          className="mt-1 h-5 w-5"
                          onChange={() => setTreeLocation(option.value)}
                          checked={treeLocation === option.value}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>

                  {treeLocation === "foundation" && (
                    <div className="space-y-4 pl-6">
                      <p className="font-medium">(If you selected Foundations land preserve) I&apos;d like my trees to be planted on</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          "Visitor's grove",
                          "Family grove",
                          "Memorial grove",
                          "Social/professional group grove",
                          "School/College alumni grove",
                          "Corporate grove",
                          "Conference grove",
                          "Other"
                        ].map((option) => (
                          <label key={option} className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="groveType"
                              value={option}
                              className="h-5 w-5"
                              onChange={(e) => {
                                setGroveType(e.target.value);
                                if (option !== "Other") setOtherGroveType("");
                              }}
                              checked={groveType === option}
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                      {groveType === "Other" && (
                        <div className="mt-2">
                          <input
                            type="text"
                            placeholder="Please specify"
                            className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-700"
                            value={otherGroveType}
                            onChange={(e) => setOtherGroveType(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Number of Trees */}
                <div className="mb-6">
                  <label className="mb-2 block text-lg font-light">Plantation Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="pledgeType"
                        value="trees"
                        checked={pledgeType === "trees"}
                        onChange={() => setPledgeType("trees")}
                        className="h-5 w-5"
                      />
                      <span>Trees</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="pledgeType"
                        value="acres"
                        checked={pledgeType === "acres"}
                        onChange={() => setPledgeType("acres")}
                        className="h-5 w-5"
                      />
                      <span>Area</span>
                    </label>
                  </div>
                </div>

                {pledgeType === "trees" ? (
                  <div>
                    <label className="mb-2 block text-lg font-light">
                      Number of trees you would like to sponsor *
                    </label>
                    <input
                      type="number"
                      name="numberOfTrees"
                      min="1"
                      className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-700"
                      required
                      value={formData.numberOfTrees}
                      onChange={handleInputChange}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="mb-2 block text-lg font-light">
                    Area to Reforest (acres) *
                    </label>
                    <input
                      type="number"
                      name="pledgedArea"
                      min="0.1"
                      step="0.1"
                      className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-700"
                      required
                      value={formData.pledgedArea}
                      onChange={handleInputChange}
                    />
                  </div>
                )}
                {treeLocation && pledgeType === "trees" && (
                  <p className="mt-2 text-sm text-gray-600">
                    Total Amount: ₹{totalAmount.toLocaleString('en-IN')}
                    {isAboveLimit && " (Above Razorpay limit - Bank Transfer required)"}
                  </p>
                )}

                {/* 4. Tree Dedication Names */}
                {pledgeType === "trees" && (
                  <div className="space-y-4">
                    <label className="mb-2 block text-lg font-light">
                      I&apos;d like my trees to be planted in the following names
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
                        Dedicate to multiple people
                      </label>
                    </div>

                    {multipleNames && (
                      <div className="inline-flex p-1 space-x-1 rounded-xl w-full sm:w-auto border-2 border-gray-300">
                        <button
                          type="button"
                          className={`${
                            nameEntryMethod === "manual"
                              ? "bg-green-500 shadow-sm text-white ring-green-700"
                              : "text-green-600 hover:bg-green-100"
                          } flex items-center justify-center px-6 py-2.5 text-sm font-medium rounded-lg flex-1 sm:flex-none transition-all duration-200`}
                          onClick={() => setNameEntryMethod("manual")}
                        >
                          Add Manually
                        </button>
                        <button
                          type="button"
                          className={`${
                            nameEntryMethod === "csv"
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
                        {dedicatedNames.map((name, index) => (
                          <UserDetailsForm
                            key={index}
                            data={name}
                            index={index}
                            onUpdate={(field, value) => handleNameChange(index, field, value)}
                            errors={errors}
                            canRemove={index > 0}
                            onRemove={index > 0 ? () => handleRemoveName(index) : undefined}
                          />
                        ))}
                        <button
                          type="button"
                          onClick={handleAddName}
                          className="flex items-center text-green-700 hover:text-green-900 mt-2"
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

                          {/* CSV Upload */}
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

                          {/* Image Upload Section */}
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
                                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{recipient.tree_count || '1'}</td>
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
                          required
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

                {/* 5. Additional Involvement */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold">Additional Involvement</h2>
                  <p className="font-medium">Besides making a monetary contribution, I&apos;d also like to</p>

                  <div className="space-y-3">
                    {[
                      "Plan a visit to the project site and plant trees by my own hands",
                      "Explore possibility of CSR contribution through my company or my employer",
                      "Volunteer my time, energy and expertise to grow this initiative further",
                      "Share the mission of 'Project 14 trees' with my friends and family"
                    ].map((option) => (
                      <label key={option} className="flex items-center space-x-3">
                        <input type="checkbox" className="h-5 w-5" />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 6. Tax Information */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold">Tax Benifits</h2>
                  <div className="grid gap-6 md:grid-cols-2">
                    {taxStatus === "indian" && (
                      <div>
                        <label className="mb-2 block text-lg font-light">
                          PAN card number (for 80G benefit) *
                        </label>
                        <input
                          type="text"
                          name="panNumber"
                          className={`w-full rounded-md border ${errors.panNumber ? 'border-red-500' : 'border-gray-300'
                            } px-4 py-3 text-gray-700`}
                          value={formData.panNumber}
                          onChange={handleInputChange}
                          onBlur={(e) => {
                            const error = validateField(e.target.name, e.target.value);
                            setErrors(prev => ({ ...prev, panNumber: error }));
                          }}
                          placeholder="ABCDE1234F"
                          required={taxStatus === "indian"}
                        />
                        {errors.panNumber && (
                          <p className="mt-1 text-sm text-red-600">{errors.panNumber}</p>
                        )}
                      </div>
                    )}
                    <div className="space-y-3">
                      <label className="block text-lg font-light mb-2">Whould you like to availe tax benifits?</label>
                      {[
                        { value: "indian", label: "Indian citizen (80G benefit)" },
                        { value: "foreign", label: "Foreign donor (501(c) eligible)" }
                      ].map((option) => (
                        <label key={option.value} className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="taxStatus"
                            value={option.value}
                            className="h-5 w-5"
                            onChange={() => setTaxStatus(option.value)}
                            checked={taxStatus === option.value}
                            required
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 7. Payment Information */}
                <div className="space-y-6">
                  <Script
                    src="https://checkout.razorpay.com/v1/checkout.js"
                    strategy="lazyOnload"
                    onLoad={() => setRazorpayLoaded(true)}
                  />
                  <h2 className="text-2xl font-semibold">Payment Information</h2>

                  <div>
                    <label className="mb-2 block text-lg font-light">
                      Payment Method *
                    </label>
                    <div className="space-y-3 mb-4">
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="paymentOption"
                          value="razorpay"
                          checked={paymentOption === "razorpay" && !isAboveLimit}
                          onChange={() => setPaymentOption("razorpay")}
                          disabled={isAboveLimit}
                        />
                        <span>
                          Razorpay (UPI/Card/Net Banking)
                          {isAboveLimit && " - Not available for amounts above ₹1,00,000"}
                        </span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="paymentOption"
                          value="bank-transfer"
                          checked={paymentOption === "bank-transfer" || isAboveLimit}
                          onChange={() => setPaymentOption("bank-transfer")}
                        />
                        <span>Bank Transfer {isAboveLimit && "(Required for large donations)"}</span>
                      </label>
                    </div>

                    {isAboveLimit && (
                      <p className="text-yellow-600 bg-yellow-50 p-2 rounded-md">
                        For donations above ₹1,00,000, please use Bank Transfer.
                      </p>
                    )}
                  </div>

                  {pledgeType === "trees" && paymentOption === "razorpay" && !isAboveLimit && (
                    <Button
                      type="button"
                      onClick={handleRazorpayPayment}
                      disabled={isProcessing || !razorpayLoaded}
                      className={`bg-green-600 text-white w-full py-4 mt-4 ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                    >
                      {isProcessing ? 'Processing...' : 'Pay Securely via Razorpay'}
                    </Button>
                  )}

                  {pledgeType === "acres" && (
                    <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mt-4">
                      <p className="text-blue-800">
                        For acre pledges, our team will contact you to finalize details.
                        No payment is required at this stage.
                      </p>
                    </div>
                  )}

                  {(paymentOption === "bank-transfer" || isAboveLimit) && (
                    <div className="bg-gray-100 p-4 rounded-md flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold mb-2">Bank Transfer Details:</h3>
                        <p className="mb-1">Account Name: 14 Trees Foundation</p>
                        <p className="mb-1">Account Number: 007305012197</p>
                        <p className="mb-1">IFSC Code: ICIC0000073</p>
                        <p className="mb-1">Bank: ICICI Bank</p>
                        <p className="mb-1">Branch: Gurinovir park, IT1 road, Aundh, Pune 411007</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <Image
                          src="/images/QRCode.png"
                          alt="Scan to pay via UPI/Bank Transfer"
                          width={150}
                          height={150}
                          className="border border-gray-300 rounded-md mb-2"
                        />
                        <p className="text-sm text-gray-600">Scan to pay via UPI</p>
                      </div>
                    </div>
                  )}

                  {paymentOption === "bank-transfer" && (
                    <div>
                      <label className="mb-2 block text-lg font-light">
                        Upload Payment Confirmation *
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-700"
                        required={paymentOption === "bank-transfer"}
                      />
                    </div>
                  )}
                </div>

                {/* 8. Additional Comments */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold">Additional Information</h2>
                  <div>
                    <label className="mb-2 block text-lg font-light">
                      Comments, feedback, ideas for improvement
                    </label>
                    <textarea
                      name="comments"
                      className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-700"
                      rows={4}
                      value={formData.comments}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <Button
                    type="submit"
                    className="bg-green-800 text-white hover:bg-green-900 w-full py-6 text-lg"
                    size="xl"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </div>
                    ) : (
                      "Complete Donation"
                    )}
                  </Button>
                </div>
              </form>
            </ScrollReveal>
          </div>
        </div>
      </div>
      {showSuccessDialog && <SuccessDialog />}
    </div>
  );
}