"use client";

import { Button } from "ui/components/button";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
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
import { getUniqueRequestId } from "~/utils";
import { UploadIcon } from "lucide-react";
import { UserDetailsForm } from 'components/donate/UserDetailsForm';
import { SummaryPaymentPage } from "./giftingSummary";

const defaultMessages = {
  primary: 'We are immensely delighted to share that a tree has been planted in your name at the 14 Trees Foundation, Pune. This tree will be nurtured in your honour, rejuvenating ecosystems, supporting biodiversity, and helping offset the harmful effects of climate change.',
  birthday: 'We are immensely delighted to share that a tree has been planted in your name on the occasion of your birthday at the 14 Trees Foundation, Pune. This tree will be nurtured in your honour, helping offset the harmful effects of climate change.',
  memorial: 'A tree has been planted in the memory of <name here> at the 14 Trees Foundation reforestation site. For many years, this tree will help rejuvenate local ecosystems, support local biodiversity and offset the harmful effects of climate change and global warming.',
  secondary: 'We invite you to visit 14 Trees and firsthand experience the growth and contribution of your tree towards a greener future.',
  logo: 'Gifted by 14 Trees in partnership with'
}

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

export default function GiftTreesPage() {
  // Form state (existing state remains unchanged)
  const [eventName, setEventName] = useState<string | null>(null); // New state for event name
  const [eventType, setEventType] = useState<string | null>(null); // New state for event type
  const [giftedOn, setGiftedOn] = useState<Date>(new Date()); // New state for gifted on
  const [plantedBy, setPlantedBy] = useState<string | null>(null); // New state for planted by
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
    trees_count: 1
  }]);
  const [primaryMessage, setPrimaryMessage] = useState(defaultMessages.primary);
  const [secondaryMessage, setSecondaryMessage] = useState(defaultMessages.secondary);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [presentationId, setPresentationId] = useState<string | null>(null);
  const [slideId, setSlideId] = useState<string | null>(null);
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
    numberOfTrees: "10",
    panNumber: "",
    comments: ""
  });
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
  const [giftRequestId, setGiftRequestId] = useState<string | null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [windowWidth, setWindowWidth] = useState(1024); // default value
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  useEffect(() => {
    // Only runs on the client
    setWindowWidth(window.innerWidth);
  }, []);

  const itemsPerPage = 10;
  const paginatedData = csvPreview.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  // const calculateGiftingAmount = (): number => {
  //    if (treeLocation === "foundation") return 3000;
  //   if (treeLocation === "public") return 2000;
  //   return 0;
  // };

  const calculateGiftingAmount = (): number => {
    return 2000;
  };

  // Calculate total amount (existing unchanged)
  useEffect(() => {
    const perTreeAmount = calculateGiftingAmount();
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

      return newErrors;
    });
  }, []);

  const getOccasionQuestion = () => {
    const treeCount = parseInt(formData.numberOfTrees) || 0;
    return treeCount === 1 
      ? "Are you gifting this tree for an occasion?" 
      : "Are you gifting these trees for an occasion?";
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
      if (name === "panNumber") return "";
      if (name === "comments") return "";

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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPrimaryMessage(eventType === "1" ? defaultMessages.birthday : eventType === "2" ? defaultMessages.memorial : defaultMessages.primary);
      setSecondaryMessage(defaultMessages.secondary);

      handleGeneratePreview();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [eventType]);

  const handleGeneratePreview = async () => {
    setIsGeneratingPreview(true);
    try {
      const endpoint = presentationId && slideId
        ? `${process.env.NEXT_PUBLIC_API_URL}/gift-cards/update-template`
        : `${process.env.NEXT_PUBLIC_API_URL}/gift-cards/generate-template`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: giftRequestId || getUniqueRequestId(),
          presentation_id: presentationId,
          slide_id: slideId,
          primary_message: primaryMessage,
          secondary_message: secondaryMessage,
          event_type: eventType,
          is_personal: true,
        })
      });

      const data = await response.json();
      if (response.ok) {
        setPresentationId(data.presentation_id || presentationId);
        setSlideId(data.slide_id || slideId);
        setPreviewUrl(
          `https://docs.google.com/presentation/d/${data.presentation_id || presentationId}/embed?rm=minimal&slide=id.${data.slide_id || slideId}&timestamp=${Date.now()}`
        );
      }
    } catch (error) {
      console.error("Error generating preview:", error);
    } finally {
      setIsGeneratingPreview(false);
    }
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

    // Calculate total trees count
    const totalTrees = dedicatedNames.reduce((sum, name) => sum + (name.trees_count || 1), 0);

    // Check if total trees exceed the number of trees being gifting
    if (formData.numberOfTrees && totalTrees > Number(formData.numberOfTrees)) {
      newErrors["totalTrees"] = `Total trees (${totalTrees}) cannot exceed the number of trees you're gifting (${formData.numberOfTrees})`;
      isValid = false;
    }

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
          if (row.trees_count && isNaN(parseInt(row.trees_count.toString()))) {
            errors.push(`Row ${index + 1}: Tree count must be a number`);
          }

          // Create valid recipient object
          validRecipients.push({
            recipient_name: String(row.recipient_name),
            recipient_email: row.recipient_email ? String(row.recipient_email) : row.recipient_communication_email ? String(row.recipient_communication_email) : row.recipient_name.toLowerCase().replace(/\s+/g, '') + "@14trees",
            recipient_phone: row.recipient_phone ? String(row.recipient_phone) : '',
            trees_count: row.trees_count ? parseInt(String(row.trees_count)) : 1,
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

    if (!formData.fullName || !formData.email || !formData.phone || !formData.panNumber || !formData.numberOfTrees) {
      alert("Please fill in all required fields before payment");
      return;
    }

    setIsLoading(true);
    setIsSubmitting(true);

    const uniqueRequestId = getUniqueRequestId();
    setGiftRequestId(uniqueRequestId);

    let paymentId: number | null = razorpayPaymentId || null;
    if (isAboveLimit) {
      paymentId = await handleBankPayment(uniqueRequestId, razorpayPaymentId);
      setRazorpayPaymentId(paymentId);
    }

    if (!paymentId) {
      setIsLoading(false);
      setIsSubmitting(false);
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
      users[0].trees_count = parseInt(formData.numberOfTrees);
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

      const giftTreesRequest = {
        request_id: uniqueRequestId,
        user_id: userId,
        sponsor_id: userId,
        sponsor_name: formData.fullName,
        sponsor_email: formData.email,
        sponsor_phone: formData.phone,
        category: "Public",
        grove: null,
        no_of_cards: parseInt(formData.numberOfTrees),
        payment_id: paymentId,
        contribution_options: [],
        comments: formData.comments,
        primary_message: primaryMessage,
        secondary_message: secondaryMessage,
        request_type: 'Gift Cards',
        event_name: eventName,
        event_type: eventType,
        planted_by: plantedBy,
        gifted_on: giftedOn
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
                recipient_email: user.recipient_email || user.recipient_name.toLowerCase().replace(/\s+/g, '') + "@14trees",
                assignee_email: user.assignee_email || user.assignee_name.toLowerCase().replace(/\s+/g, '') + "@14trees"
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
      setShowSuccessDialog(true);

      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        numberOfTrees: "",
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
          trees_count: 1
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
      setErrors({});
      setRpPaymentSuccess(false);
      setRazorpayOrderId(null);
      setRazorpayPaymentId(null);

    } catch (err: any) {
      console.error("Gift trees request error:", err);
      alert(err.message || "Failed to create gift trees request");
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  // Rest of your existing functions (unchanged)
  const handleAddName = () => {
    // check if the last name is empty
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

  const handleRazorpayPayment = async () => {
    if (isAboveLimit) {
      alert("Please use Bank Transfer for gifting trees above ₹1,00,000");
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


      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
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
      const amount = calculateGiftingAmount() * Number(formData.numberOfTrees);
      if (amount <= 0) throw new Error("Invalid amount");

      if (!paymentId) {
        const response = await apiClient.createPayment(amount, "Indian Citizen", formData.panNumber, false);
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

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-bold text-green-600 mb-4">Gift Trees Request Successful!</h3>
          <p className="mb-2">Your gift trees request has been processed successfully.</p>
          {giftRequestId && (
            <p className="mb-2">
              <strong>Gift Trees Request ID:</strong> {giftRequestId}
            </p>
          )}
          <p className="mb-4">You will receive an acknowledgment email shortly.</p>

          {!updateSuccess ? (
            <div className="space-y-6">
              {/* Divider */}
              <div className="h-px bg-gray-200"></div>

              {/* Additional Involvement Section */}
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
            <div className="md:mx-12 my-10 object-center text-center md:my-10 md:w-4/5 md:text-left">
              <h6 className="text-grey-600 mt-6 text-sm font-light md:text-lg">
                By donating towards the plantation of 14 native trees, you&apos;re directly contributing to the restoration of ecologically degraded hills near Pune. These barren landscapes, currently home only to fire-prone grass, suffer from severe topsoil erosion and depleted groundwater. Through our reforestation efforts—planting native species, digging ponds to store rainwater, and creating trenches for groundwater recharge—we’re not just bringing life back to the land, we’re rebuilding entire ecosystems.
              </h6>
              <h6 className="text-grey-600 mt-6 text-sm font-light md:text-lg">
                Your support goes beyond planting trees. Each donation helps generate sustainable livelihoods for local tribal communities who are at the heart of this transformation. By funding 14 trees, you&apos;re enabling long-term environmental healing and economic empowerment for those who depend on the land the most.
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

      {/* Form Section */}
      <div className="text-gray-700 relative min-h-[45vh] w-full md:min-h-[60vh] container mx-auto">
        <div className="md:mx-28 container z-0 overflow-hidden pb-20">
          <div className="w-full md:w-2/3">
            <ScrollReveal>
            {currentStep === 1 ? (
              <form className="space-y-8" onSubmit={handleSubmit}>
                {/* 1. Personal Information 
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

                 2. Tree Planting Options 
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold">Tree Planting Options</h2>
                  <p className="font-medium">
                    Please select your preference (if you want to spread your trees over multiple options, please submit a fresh request indicating the tree count for each option).
                  </p>

                  <div className="space-y-3">
                    {[
                      { value: "foundation", label: "I'd like my trees to be planted on 14 Trees Foundations land preserve. The cost is Rs 3,000 (USD $40) per tree (inclusive of land cost)" },
                      { value: "public", label: "I'd like my trees to be planted on public land (gram panchayat or public school land). The cost is Rs. 2000 (USD $23) per tree." },
                    ].map((option) => (
                      <label key={option.value} className="flex items-start space-x-3">
                        <input
                          type="radio"
                          name="treeLocation"
                          value={option.value}
                          disabled={rpPaymentSuccess}
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
                              disabled={rpPaymentSuccess}
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
                </div> */}

                {/* 3. Number of Trees*/}
<div className="space-y-2">
  <div className="flex items-center gap-4">
    <label className="mb-2 block text-lg font-light whitespace-nowrap">
      Number of trees you would like to gift *
    </label>
    <input
      type="number"
      name="numberOfTrees"
      min="1"
      className={`w-32 rounded-md border ${errors.numberOfTrees ? 'border-red-500' : 'border-gray-300'} px-4 py-2 text-gray-700`}
      required
      disabled={rpPaymentSuccess}
      value={formData.numberOfTrees}
      onChange={handleInputChange}
    />
  </div>
  <div className="flex flex-wrap gap-2 mt-2">
    {[2, 5, 10, 14, 50, 100].map((count) => (
      <button
        key={count}
        type="button"
        onClick={() => {
          setFormData(prev => ({
            ...prev,
            numberOfTrees: count.toString()
          }));
        }}
        className={`px-4 py-2 rounded-md ${
          formData.numberOfTrees === count.toString() 
            ? 'bg-green-600 text-white' 
            : 'bg-gray-100 hover:bg-gray-200'
        }`}
      >
        {count} TREES
      </button>
    ))}
    <button
      type="button"
      onClick={() => {
        const input = document.querySelector('input[name="numberOfTrees"]') as HTMLInputElement;
        if (input) {
          input.focus();
          input.select();
        }
      }}
      className={`px-4 py-2 rounded-md ${
        ![2, 5, 10, 14, 50, 100].includes(Number(formData.numberOfTrees))
          ? 'bg-green-600 text-white' 
          : 'bg-gray-100 hover:bg-gray-200'
      }`}
    >
      Other
    </button>
  </div>
</div>
<p className="mt-2 text-sm text-gray-600">
  Total Amount: ₹{totalAmount.toLocaleString('en-IN')}
  {isAboveLimit && " (Above Razorpay limit - Bank Transfer recommended)"}
</p>

<div className="space-y-6">
  {/* Title */}
  <h3 className="text-2xl font-semibold">Gift Recipients</h3>

  {errors["totalTrees"] && (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
      <p className="text-red-700">{errors["totalTrees"]}</p>
    </div>
  )}

  {dedicatedNames.map((name, index) => {
    const remainingTrees = Number(formData.numberOfTrees) - 
    dedicatedNames.reduce((sum, n, i) => i !== index ? sum + (Number(n.treeCount) || 0) : sum, 0);
  const maxTrees = Math.min(remainingTrees, Number(formData.numberOfTrees));
    return (
      <div key={index} className="border rounded-lg p-6 space-y-4 bg-white shadow-sm">
        <h3 className="font-medium text-lg">Recipient {index + 1}</h3>
        
        {/* Number of Trees for this recipient - First field */}
        <div className="flex items-center gap-4">
          <label className="block text-gray-700 whitespace-nowrap">Number of trees:</label>
          <input
            type="number"
            min="1"
            max={maxTrees}
            className={`w-32 rounded-md border ${errors[`treeCount-${index}`] ? 'border-red-500' : 'border-gray-300'} px-4 py-3 text-gray-700`}
            value={name.treeCount || ''}
            onChange={(e) => {
              const value = Math.min(
                Number(e.target.value),
                maxTrees
              );
              handleNameChange(index, "treeCount", value > 0 ? value.toString() : '');
            }}
            required
          />
          {errors[`treeCount-${index}`] && (
            <p className="mt-1 text-sm text-red-600">{errors[`treeCount-${index}`]}</p>
          )}
        </div>
        <p className="text-sm text-gray-500 -mt-3">
          {index === 0 && dedicatedNames.length === 1 
            ? `Maximum: ${formData.numberOfTrees} trees`
            : `Remaining: ${remainingTrees} trees available`}
        </p>

        {/* Recipient Name */}
        <div>
          <label className="block text-gray-700 mb-1">Recipient name:</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type Recipient name"
              className={`flex-1 rounded-md border ${errors[`dedicatedName-${index}`] ? 'border-red-500' : 'border-gray-300'} px-4 py-3 text-gray-700`}
              value={name.recipient_name}
              onChange={(e) => {
                handleNameChange(index, "recipient_name", e.target.value);
                if (!isAssigneeDifferent) {
                  handleNameChange(index, "assignee_name", e.target.value);
                }
              }}
            />
            {index > 0 && (
              <button
                type="button"
                onClick={() => handleRemoveName(index)}
                className="text-red-600 hover:text-red-800 px-3 py-2"
              >
                Remove
              </button>
            )}
          </div>
          {errors[`dedicatedName-${index}`] && (
            <p className="mt-1 text-sm text-red-600">{errors[`dedicatedName-${index}`]}</p>
          )}
        </div>

        {/* Recipient Email */}
        <div>
          <label className="block text-gray-700 mb-1">Recipient email ID:</label>
          <input
            type="email"
            placeholder="Type Recipient's email"
            className={`w-full rounded-md border ${errors[`dedicatedEmail-${index}`] ? 'border-red-500' : 'border-gray-300'} px-4 py-3 text-gray-700`}
            value={name.recipient_email}
            onChange={(e) => {
              handleNameChange(index, "recipient_email", e.target.value)
              if (!isAssigneeDifferent) {
                handleNameChange(index, "assignee_email", e.target.value)
              }
            }}
          />
          {errors[`dedicatedEmail-${index}`] && (
            <p className="mt-1 text-sm text-red-600">{errors[`dedicatedEmail-${index}`]}</p>
          )}
        </div>

        {/* Assignee Section */}
        <div className="mt-4 pt-4 border-t">
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
            <div className="border border-gray-200 rounded-md p-4 space-y-4 bg-gray-50">
              <h3 className="font-medium">Assignee Details</h3>
              <input
                type="text"
                placeholder="Assignee Name *"
                value={name.assignee_name}
                onChange={(e) => handleNameChange(index, "assignee_name", e.target.value)}
                className="w-full rounded-md border border-gray-300 px-4 py-3"
                required
              />
              <input
                type="email"
                placeholder="Assignee Email (optional)"
                value={name.assignee_email}
                onChange={(e) => handleNameChange(index, "assignee_email", e.target.value)}
                className="w-full rounded-md border border-gray-300 px-4 py-3"
              />
            </div>
          )}
        </div>
      </div>
    );
  })}

  {/* Single "Add another" button outside all cards */}
  <button
    type="button"
    onClick={handleAddName}
    className="flex items-center justify-center w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-green-700 hover:text-green-900 hover:border-green-300 mt-4"
    disabled={dedicatedNames[dedicatedNames.length - 1].recipient_name.trim() === "" || 
             dedicatedNames.reduce((sum, n) => sum + (Number(n.treeCount) || 0), 0) >= Number(formData.numberOfTrees)}
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
    Add another recipient
  </button>
</div>

                {/* Occasion Details */}
                <div className="space-y-6 mt-2">
                <h2 className="text-2xl font-semibold">{getOccasionQuestion()}</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-lg font-light mb-2">Occasion Type</label>
                    <div className="relative">
                      <select
                        id="eventType"
                        name="eventType"
                        value={eventType || ""}
                        onChange={(e) => {
                          setEventType(e.target.value);
                          setPrimaryMessage(e.target.value === "1" ? defaultMessages.birthday : e.target.value === "2" ? defaultMessages.memorial : defaultMessages.primary);
                          setSecondaryMessage(defaultMessages.secondary);
                        }}
                        className="appearance-none w-full rounded-md border border-gray-300 px-4 py-3 text-gray-700 bg-white transition-colors duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none"
                      >
                        <option value="" disabled>Select an event type</option>
                        <option value="1">Birthday</option>
                        <option value="2">Memorial</option>
                        <option value="3">Wedding</option>
                        <option value="4">Wedding Anniversary</option>
                        <option value="5">Festival Celebration</option>
                        <option value="6">General Gift</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-lg font-light mb-2">Occasion Name</label>
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

                  <div>
                    <label className="block text-lg font-light mb-2">Gifted By</label>
                    <input
                      type="text"
                      id="plantedBy"
                      name="plantedBy"
                      placeholder="Gifted By"
                      value={plantedBy || ""}
                      onChange={(e) => setPlantedBy(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-lg font-light mb-2">Date of Occasion</label>
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

                 {/* 4. Tree Dedication Names */}
                {/* <div className="space-y-4 mt-2">
                   <h3 className="text-2xl font-semibold">Gift Recipients</h3>
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
                          maxTrees={Number(formData.numberOfTrees) - dedicatedNames.slice(0, -1).map(user => user.trees_count || 1).reduce((prev, count) => prev + count, 0)}
                          errors={errors}
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
               {/*   ) : multipleNames && nameEntryMethod === "csv" ? (
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
                        </p> */}

                        {/* CSV Upload */}
                     {/*   <div className="flex gap-2">
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

                        {/* Image Upload Section 
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
                    </div> */}
                {/*  ) : ( 
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
                </div> */}

                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold">Help us craft a beautiful gift card for you!</h3>

                     {/* Preview section - now comes first */}
                     <div className="border border-gray-200 rounded-md w-full h-auto flex items-center justify-center">
                        {isGeneratingPreview ? (
                         <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                           <p className="mt-2 text-gray-600">Generating your card preview...</p>
                          </div>
                 ) : previewUrl ? (
                     <div className="w-full h-full aspect-[4/3] sm:aspect-[16/9]">
                     <iframe
                        src={previewUrl}
                        className="w-full h-full border-none rounded-md"
                        title="Gift card preview"
                        style={{ minHeight: '250px', height: "100%", width: "100%" }}
                      />
                   </div>
                ) : (
                      <p className="text-gray-500 py-16">Your card preview will appear here</p>
                   )}
                 </div>

                 {/* New line below the preview section */}
                 <p className="text-xs text-gray-500 mt-2">
                     The illustrations on the final gift card will differ from the template above depending upon the trees planted.
                 </p>

                 {/* Message inputs section - now comes after preview */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Primary Message</label>
                      <textarea
                         className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-700"
                         rows={windowWidth < 640 ? 5 : 3}
                         value={primaryMessage}
                         onChange={(e) => setPrimaryMessage(e.target.value)}
                         maxLength={270}
                         placeholder="A tree has been planted in your name at our conservation site..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                          {270 - primaryMessage.length} characters remaining
                      </p>
                  </div>

                   <div>
                      <label className="block text-sm font-medium mb-1">Secondary Message</label>
                        <textarea
                           className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-700"
                           rows={windowWidth < 640 ? 4 : 2}
                           value={secondaryMessage}
                           onChange={(e) => setSecondaryMessage(e.target.value)}
                           maxLength={125}
                           placeholder="We invite you to visit and witness your tree's growth..."
                         />
                         <p className="text-xs text-gray-500 mt-1">
                          {125 - secondaryMessage.length} characters remaining
                         </p>
                    </div>
                  <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-md"
                    onClick={() => {
                    setPrimaryMessage(eventType === "1" ? defaultMessages.birthday : eventType === "2" ? defaultMessages.memorial : defaultMessages.primary);
                    setSecondaryMessage(defaultMessages.secondary);
                   }}
                  >
                    Reset to Default
                 </button>
               <button
                  type="button"
                  className="px-4 py-2 bg-green-600 text-white rounded-md"
                  onClick={handleGeneratePreview}
                 disabled={isGeneratingPreview}
                >
                  {isGeneratingPreview ? 'Generating...' : 'Preview'}
              </button>
               </div>
              </div>
             </div>

                {/* 6. Personal Information */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold">Your details</h2>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center">
                      <label className="w-48 text-gray-700">Gifted by*:</label>
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
                    </div>
                  </div>
                </div>

                {/* 7. Payment Information */}
               {/*  <div className="space-y-6">
                  <Script
                    src="https://checkout.razorpay.com/v1/checkout.js"
                    strategy="lazyOnload"
                    onLoad={() => setRazorpayLoaded(true)}
                  />
                  <h2 className="text-2xl font-semibold">Payment Information</h2> */}

                  {/* <div>
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
                          disabled={isAboveLimit || rpPaymentSuccess}
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
                          disabled={rpPaymentSuccess}
                        />
                        <span>Bank Transfer {isAboveLimit && "(Recommended for large gifting)"}</span>
                      </label>
                    </div>

                    {isAboveLimit && (
                      <p className="text-yellow-600 bg-yellow-50 p-2 rounded-md">
                        For gifting trees above ₹1,00,000, please use Bank Transfer.
                      </p>
                    )}
                  </div>
                  

                  {paymentOption === "razorpay" && !isAboveLimit && !rpPaymentSuccess && (
                    <div className="flex justify-center">
                      <Button
                        type="button"
                        onClick={handleRazorpayPayment}
                        disabled={isProcessing || !razorpayLoaded || rpPaymentSuccess}
                        className={`bg-green-600 text-white w-[500px] py-4 mt-4 ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''
                          }`}
                      >
                        {isProcessing ? 'Processing...' : 'Pay Securely via Razorpay'}
                      </Button>
                    </div>
                  )} 

                  {!isAboveLimit && !rpPaymentSuccess && (
                    <div className="flex justify-center">
                      <Button
                        type="button"
                        onClick={handleRazorpayPayment}
                        disabled={isProcessing || !razorpayLoaded || rpPaymentSuccess}
                        className={`bg-green-600 text-white w-[500px] py-4 mt-4 ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''
                          }`}
                      >
                        {isProcessing ? 'Processing...' : 'Pay Securely via Razorpay'}
                      </Button>
                    </div>
                  )}

                  {isAboveLimit && (
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

                  {isAboveLimit && (
                    <div>
                      <label className="mb-2 block text-lg font-light">
                        Upload Payment Confirmation *
                      </label>
                      <input
                        value={undefined}
                        type="file"
                        accept="image/*,.pdf"
                        className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-700"
                        required={isAboveLimit}
                        onChange={(e) => {
                          setPaymentProof(e.target.files?.[0] || null);
                        }}
                      />
                      {paymentProof && (
                        <p className="mt-1 text-sm text-gray-600">
                          {paymentProof.name}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {!isAboveLimit && rpPaymentSuccess && multipleNames && Number(formData.numberOfTrees) != dedicatedNames.map(user => user.trees_count || 1).reduce((prev, count) => prev + count, 0) && (
                  <div className="pt-6 flex justify-center">
                    <p className="text-gray-600">
                      Only gifting {dedicatedNames.map(user => user.trees_count).reduce((a, b) => a + b, 0)} trees out of {formData.numberOfTrees} trees. You can choose to provide all the recipients now or can do it later.
                    </p>
                  </div>
                )}

                {(isAboveLimit || rpPaymentSuccess) && <div className="pt-6 flex justify-center">
                  <Button
                    type="submit"
                    className="bg-green-800 text-white hover:bg-green-900 w-[500px] py-6 text-lg"
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
                      "Submit Request"
                    )}
                  </Button>
                </div>}
              </form> */}
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
    dedicatedNames={dedicatedNames}
    totalAmount={totalAmount}
    isAboveLimit={isAboveLimit}
    razorpayLoaded={razorpayLoaded}
    rpPaymentSuccess={rpPaymentSuccess}
    paymentProof={paymentProof}
    setPaymentProof={setPaymentProof}
    isProcessing={isProcessing}
    isLoading={isLoading}
    setCurrentStep={setCurrentStep}
    handleRazorpayPayment={handleRazorpayPayment}
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
      {showSuccessDialog && <SuccessDialog />}
    </div>
  );
}