"use client";

import MotionDiv from "components/animation/MotionDiv";
import { ScrollReveal } from "components/Partials/HomePage";
import { useState, useEffect, useRef, Suspense } from "react";
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
import GiftCardPreview from "./components/GiftCardPreview";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Tooltip from '@mui/material/Tooltip';
import { useSearchParams } from "next/navigation";
import { ReferralDialog } from "components/referral/ReferralDialog";
import { Modal } from "ui";


// Import extracted types and utilities
import { 
  DedicatedName, 
  AutoPopulateSettings, 
  SavedFormData, 
  AutoCompleteData 
} from './types/forms';
import { ValidationAlertProps } from '../../components/Common/Types/common';
import { 
  getStoredAutoCompleteData,
  updateAutoCompleteData,
  getStoredSettings,
  saveSettings,
  getSavedForms,
  saveFormData,
  deleteSavedForm
} from './utils/localStorage';
import { 
  AUTO_POPULATE_STORAGE_KEY,
  SAVED_FORMS_STORAGE_KEY,
  AUTO_POPULATE_SETTINGS_KEY,
  defaultAutoPopulateSettings
} from './utils/constants';
import { ValidationAlert } from '../../components/Common/UI/ValidationAlert';
import { AutoCompleteInput } from './components/Common/AutoCompleteInput';
import { InternalTestBanner } from '../../components/Common/UI/InternalTestBanner';
import { TreeCountSection } from './components/FormSections/TreeCountSection';
import { EventDetailsSection } from './components/FormSections/EventDetailsSection';
import { RecipientDetailsSection } from './components/FormSections/RecipientDetailsSection';
import { SponsorDetailsSection } from './components/FormSections/SponsorDetailsSection';
import { PaymentSection } from './components/FormSections/PaymentSection';
import { SmartFormAssistant } from './components/SmartFormAssistant/SmartFormAssistant';
import { AutoPopulatePanel } from './components/SmartFormAssistant/AutoPopulatePanel';
import { SettingsPanel } from './components/SmartFormAssistant/SettingsPanel';
import { SaveFormDialog } from './components/SmartFormAssistant/SaveFormDialog';
import { SuccessDialog } from './components/Dialogs/SuccessDialog';

// Import extracted hooks and services
import { useFormValidation } from './hooks/useFormValidation';
import { useAutoComplete } from './hooks/useAutoComplete';
import { usePaymentHandling } from './hooks/usePaymentHandling';
import { useCSVProcessing } from './hooks/useCSVProcessing';
import { PaymentService } from './services/paymentService';
import { GiftingService } from './services/giftingService';
import { ValidationService } from './services/validationService';
import { CSVService } from './services/csvService';

declare global {
  interface Window {
    Razorpay: any;
  }
}
















function GiftTrees() {
  const searchParams = useSearchParams();
  const rfr = searchParams.get('r');
  const c_key = searchParams.get('c');
  const testMode = searchParams.get('test');

  // Form state
  const [eventName, setEventName] = useState<string | null>(null);
  const [eventType, setEventType] = useState<string | null>(null);
  const [giftedOn, setGiftedOn] = useState<Date>(new Date());
  const [plantedBy, setPlantedBy] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recipientOption, setRecipientOption] = useState<'manual' | 'csv'>('manual');
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
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [windowWidth, setWindowWidth] = useState(1024);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [referralDetails, setReferralDetails] = useState<{ referred_by?: string, name?: string, c_key?: string, description?: string } | null>(null);
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  const [validationAlertData, setValidationAlertData] = useState<{
    title: string;
    message: React.ReactNode;
  }>({ title: "", message: "" });

  // Initialize hooks
  const formValidation = useFormValidation({ formData, dedicatedNames });
  
  const autoCompleteHook = useAutoComplete({
    formData,
    eventName,
    eventType,
    plantedBy,
    primaryMessage,
    secondaryMessage,
    dedicatedNames
  });

  const paymentHandling = usePaymentHandling({
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
  });

  const csvProcessing = useCSVProcessing();

  const scrollToRecipients = () => {
    const recipientsSection = document.getElementById('gift-recipients');
    if (recipientsSection) {
      const offset = -100;
      const top = recipientsSection.getBoundingClientRect().top + window.pageYOffset + offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    setWindowWidth(window.innerWidth);
  }, []);

  useEffect(() => {
    const fetchReferralDetails = async () => {
      if (rfr || c_key) {
        try {
          const details = await GiftingService.getReferralDetails(rfr, c_key);
          setReferralDetails(details);
        } catch (error) {
          console.error('Failed to fetch referral details:', error);
        }
      }
    };

    fetchReferralDetails();
  }, [rfr, c_key]);

  // Calculate total amount
  useEffect(() => {
    const perTreeAmount = paymentHandling.calculateGiftingAmount();
    const total = perTreeAmount * Number(formData.numberOfTrees || 0);
    setTotalAmount(total);
    setIsAboveLimit(total > 500000);
  }, [treeLocation, formData.numberOfTrees, paymentHandling]);
  

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
      csvProcessing.clearCSVData();
    } else {
      setDedicatedNames([]);
    }
  };

  // Handle CSV upload
  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const maxTreeCount = parseInt(formData.numberOfTrees) || 0;
    await csvProcessing.handleCsvUpload(e, maxTreeCount);
  };

  // Sync CSV data with dedicated names
  useEffect(() => {
    if (recipientOption === 'csv' && csvProcessing.csvPreview.length > 0 && csvProcessing.csvErrors.length === 0) {
      setDedicatedNames(csvProcessing.csvPreview);
    }
  }, [csvProcessing.csvPreview, recipientOption, csvProcessing.csvErrors]);


  const getOccasionQuestion = () => {
    const treeCount = parseInt(formData.numberOfTrees) || 0;
    return treeCount === 1
      ? "Is there a special occasion you're celebrating with this tree?"
      : "Is there a special occasion you're celebrating with these trees?";
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 10, scale: 1.05 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5 },
    },
  };

  // Auto-populate handlers
  const handleAutoPopulateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Handle the regular input change first
    handleInputChange(e);
    
    // Update auto-complete data when user types (debounced)
    const fieldMapping: Record<string, keyof AutoCompleteData> = {
      fullName: 'fullNames',
      email: 'emails',
      phone: 'phones',
      panNumber: 'panNumbers',
      eventName: 'eventNames',
      eventType: 'eventTypes',
      plantedBy: 'plantedByNames',
      primaryMessage: 'primaryMessages',
      secondaryMessage: 'secondaryMessages',
    };

    if (fieldMapping[name] && value.trim().length >= 3) {
      autoCompleteHook.debouncedUpdateAutoComplete(fieldMapping[name], value);
    }
  };

  const handleAutoPopulateBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = formValidation.validateField(name, value);
    formValidation.setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Handle auto-populate for form fields
  const handleAutoPopulate = (name: string, value: string) => {
    // Field mapping for auto-complete data
    const fieldMapping: Record<string, keyof AutoCompleteData> = {
      fullName: 'fullNames',
      email: 'emails',
      phone: 'phones',
      panNumber: 'panNumbers',
      eventName: 'eventNames',
      eventType: 'eventTypes',
      plantedBy: 'plantedByNames',
      primaryMessage: 'primaryMessages',
      secondaryMessage: 'secondaryMessages',
    };

    // Update auto-complete data if the field is mapped and has sufficient length
    if (fieldMapping[name] && value.trim().length >= 3) {
      autoCompleteHook.debouncedUpdateAutoComplete(fieldMapping[name], value);
    }
  };

  const loadSavedForm = (savedFormData: SavedFormData) => {
    const loadedData = autoCompleteHook.loadSavedForm(savedFormData);
    
    if (loadedData.formData) {
      const settings = getStoredSettings();
      if (settings.fullName && loadedData.formData.fullName) {
        setFormData(prev => ({ ...prev, fullName: loadedData.formData.fullName! }));
      }
      if (settings.email && loadedData.formData.email) {
        setFormData(prev => ({ ...prev, email: loadedData.formData.email! }));
      }
      if (settings.phone && loadedData.formData.phone) {
        setFormData(prev => ({ ...prev, phone: loadedData.formData.phone! }));
      }  
      if (settings.panNumber && loadedData.formData.panNumber) {
        setFormData(prev => ({ ...prev, panNumber: loadedData.formData.panNumber! }));
      }
    }
    
    if (loadedData.eventData) {
      if (loadedData.eventData.eventName) setEventName(loadedData.eventData.eventName);
      if (loadedData.eventData.eventType) setEventType(loadedData.eventData.eventType);
      if (loadedData.eventData.plantedBy) setPlantedBy(loadedData.eventData.plantedBy);
      if (loadedData.eventData.primaryMessage) setPrimaryMessage(loadedData.eventData.primaryMessage);
      if (loadedData.eventData.secondaryMessage) setSecondaryMessage(loadedData.eventData.secondaryMessage);
    }
    
    if (loadedData.dedicatedNames) {
      setDedicatedNames(loadedData.dedicatedNames);
    }
    
    autoCompleteHook.setShowAutoPopulatePanel(false);
  };

  const handleSaveForm = () => {
    autoCompleteHook.handleSaveForm();
  };

  const handleExportData = () => {
    autoCompleteHook.handleExportData();
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const importedData = autoCompleteHook.handleImportData(event);
    if (importedData) {
      if (importedData.formData) {
        setFormData(importedData.formData);
      }
      if (importedData.eventData) {
        setEventName(importedData.eventData.eventName || null);
        setEventType(importedData.eventData.eventType || null);
        setPlantedBy(importedData.eventData.plantedBy || null);
        setPrimaryMessage(importedData.eventData.primaryMessage || "");
        setSecondaryMessage(importedData.eventData.secondaryMessage || "");
      }
      if (importedData.dedicatedNames) {
        setDedicatedNames(importedData.dedicatedNames);
      }
      alert("Data imported successfully!");
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === "numberOfTrees") {
      formValidation.clearError("numberOfTrees");
    }

    const error = formValidation.validateField(name, value);
    formValidation.setErrors(prev => ({ ...prev, [name]: error }));

    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === "fullName") {
      setPlantedBy(prev => prev || value);
    }
    
    // Handle auto-populate for specific fields
    handleAutoPopulate(name, value);
  };

  // Validate dedicated names using hook
  const validateDedicatedNames = () => {
    return formValidation.validateDedicatedNames();
  };

  // Form submission using payment hook
  const handleSubmit = async () => {
    // Validate main form and dedicated names
    const mainFormValid = formValidation.validateMainForm();
    const dedicatedNamesValid = dedicatedNames.length === 1 && dedicatedNames[0].recipient_name.trim() === "" ? true : validateDedicatedNames();
    
    if (!mainFormValid || !dedicatedNamesValid) {
      console.log(formValidation.errors);
      alert("Please fix the errors in the form before submitting");
      return;
    }

    // Use payment handling hook
    await paymentHandling.handleSubmit();
  };

  // Additional handlers
  const handleRazorpayPayment = async () => {
    await paymentHandling.handleRazorpayPayment();
  };

  // Handle dedicated name changes
  const handleNameChange = (index: number, field: keyof DedicatedName, value: string | number) => {
    setDedicatedNames(prev => {
      const newNames = [...prev];
      newNames[index] = { ...newNames[index], [field]: value };
      return newNames;
    });

    // Clear related errors
    if (formValidation.errors[`dedicatedName-${index}`]) {
      formValidation.clearError(`dedicatedName-${index}`);
    }
    if (formValidation.errors[`dedicatedEmail-${index}`]) {
      formValidation.clearError(`dedicatedEmail-${index}`);
    }
  };

  // Add name handler
  const handleAddName = () => {
    const lastRecipient = dedicatedNames[dedicatedNames.length - 1];

    // Check if the last name is empty
    if (lastRecipient && lastRecipient.recipient_name.trim() === "") {
      return;
    }

    setDedicatedNames(prev => [...prev, { 
      recipient_name: "", 
      recipient_email: "", 
      assignee_name: "", 
      assignee_email: "", 
      relation: "", 
      trees_count: 1 
    }]);
  };

  // Remove name handler
  const handleRemoveName = (index: number) => {
    setDedicatedNames(prev => {
      const newNames = [...prev];
      newNames.splice(index, 1);
      return newNames;
    });
  };

  // Form reset handler for success dialog
  const handleFormReset = () => {
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      numberOfTrees: "10",
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
    formValidation.clearAllErrors();
    setPreviewUrl(null);
    setPresentationId(null);
    setSlideId(null);
    setGiftedOn(new Date());
    setPrimaryMessage("");
    setSecondaryMessage("");
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

                  {/* Smart Form Assistant */}
                  <SmartFormAssistant
                    testMode={testMode}
                    onLoadSaved={() => autoCompleteHook.setShowAutoPopulatePanel(true)}
                    onSaveForm={() => autoCompleteHook.setShowSaveFormDialog(true)}
                    onExportData={handleExportData}
                    onImportData={handleImportData}
                    onShowSettings={() => autoCompleteHook.setShowSettingsPanel(true)}
                  />

                  {/* Number of Trees */}
                  <TreeCountSection
                    numberOfTrees={formData.numberOfTrees}
                    totalAmount={totalAmount}
                    isAboveLimit={isAboveLimit}
                    errors={formValidation.errors}
                    rpPaymentSuccess={paymentHandling.rpPaymentSuccess}
                    onTreeCountChange={(count) => {
                      setFormData(prev => ({ ...prev, numberOfTrees: count }));
                      formValidation.clearError("numberOfTrees");
                    }}
                    onInputChange={handleInputChange}
                  />

                  <RecipientDetailsSection
                    recipientOption={recipientOption}
                    dedicatedNames={dedicatedNames}
                    errors={formValidation.errors}
                    formData={formData}
                    onRecipientOptionChange={handleRecipientOptionChange}
                    onNameChange={handleNameChange}
                    onAddName={handleAddName}
                    onRemoveName={handleRemoveName}
                    setHasAssigneeError={() => {}}
                    // CSV processing props
                    csvFile={csvProcessing.csvFile}
                    csvPreview={csvProcessing.csvPreview}
                    csvErrors={csvProcessing.csvErrors}
                    currentPage={csvProcessing.currentPage}
                    itemsPerPage={csvProcessing.itemsPerPage}
                    paginatedData={csvProcessing.paginatedData}
                    filteredData={csvProcessing.filteredData}
                    hasTableErrors={csvProcessing.hasTableErrors}
                    fileInputRef={csvProcessing.fileInputRef}
                    // Search and filter props
                    searchName={csvProcessing.searchName}
                    searchEmail={csvProcessing.searchEmail}
                    validFilter={csvProcessing.validFilter}
                    setSearchName={csvProcessing.setSearchName}
                    setSearchEmail={csvProcessing.setSearchEmail}
                    setValidFilter={csvProcessing.setValidFilter}
                    clearFilters={csvProcessing.clearFilters}
                    // Functions
                    handleCsvUpload={handleCsvUpload}
                    downloadSampleCsv={csvProcessing.downloadSampleCsv}
                    setCurrentPage={csvProcessing.setCurrentPage}
                    setItemsPerPage={csvProcessing.setItemsPerPage}
                  />

                  {/* Occasion Details */}
                  <EventDetailsSection
                    eventType={eventType}
                    eventName={eventName}
                    plantedBy={plantedBy}
                    giftedOn={giftedOn}
                    autoCompleteData={{
                      eventNames: autoCompleteHook.autoCompleteData.eventNames,
                      plantedByNames: autoCompleteHook.autoCompleteData.plantedByNames
                    }}
                    getOccasionQuestion={getOccasionQuestion}
                    onEventTypeChange={setEventType}
                    onEventNameChange={setEventName}
                    onPlantedByChange={setPlantedBy}
                    onGiftedOnChange={setGiftedOn}
                    debouncedUpdateAutoComplete={autoCompleteHook.debouncedUpdateAutoComplete}
                  />


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
                    primaryMessageSuggestions={autoCompleteHook.autoCompleteData.primaryMessages}
                    onPrimaryMessageChange={(message) => {
                      if (message.trim().length >= 10) {
                        autoCompleteHook.debouncedUpdateAutoComplete('primaryMessages', message, 1000);
                      }
                    }}
                  />

                  <SponsorDetailsSection
                    formData={formData}
                    errors={formValidation.errors}
                    autoCompleteData={autoCompleteHook.autoCompleteData}
                    dedicatedNames={dedicatedNames}
                    recipientOption={recipientOption}
                    csvHasErrors={csvProcessing.csvHasErrors}
                    hasDuplicateNames={csvProcessing.hasDuplicateNames}
                    hasAssigneeError={csvProcessing.hasAssigneeError}
                    onAutoPopulateChange={handleAutoPopulateChange}
                    onAutoPopulateBlur={handleAutoPopulateBlur}
                    onProceedToPayment={() => setCurrentStep(2)}
                    validateField={formValidation.validateField}
                    setValidationAlertData={setValidationAlertData}
                    setShowValidationAlert={setShowValidationAlert}
                    scrollToRecipients={scrollToRecipients}
                    setCurrentStep={setCurrentStep}
                  />
                </form>

              ) : (
                currentStep === 2 && (
                  <SummaryPaymentPage
                    formData={formData}
                    dedicatedNames={dedicatedNames}
                    totalAmount={totalAmount}
                    isAboveLimit={isAboveLimit}
                    rpPaymentSuccess={paymentHandling.rpPaymentSuccess}
                    paymentProof={paymentProof}
                    setPaymentProof={setPaymentProof}
                    isProcessing={paymentHandling.isProcessing || paymentHandling.requestInProgress}
                    isLoading={paymentHandling.isLoading}
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
      {paymentHandling.showSuccessDialog && (
        <SuccessDialog
          giftRequestId={paymentHandling.giftRequestId}
          onClose={() => paymentHandling.setShowSuccessDialog(false)}
          onReset={handleFormReset}
        />
      )}
      {showReferralDialog && (
        <ReferralDialog
          linkType="plant-memory"
          open={showReferralDialog}
          onClose={() => setShowReferralDialog(false)}
        />
      )}
      {/* Auto-populate Panel */}
      <AutoPopulatePanel
        show={autoCompleteHook.showAutoPopulatePanel}
        onClose={() => autoCompleteHook.setShowAutoPopulatePanel(false)}
        savedForms={autoCompleteHook.savedForms}
        onLoadForm={loadSavedForm}
        onDeleteForm={autoCompleteHook.handleDeleteSavedForm}
      />

      {/* Settings Panel */}
      <SettingsPanel
        show={autoCompleteHook.showSettingsPanel}
        onClose={() => autoCompleteHook.setShowSettingsPanel(false)}
        settings={autoCompleteHook.autoPopulateSettings}
        onSettingsChange={autoCompleteHook.handleSettingsChange}
      />

      {/* Save Form Dialog */}
      <SaveFormDialog
        show={autoCompleteHook.showSaveFormDialog}
        onClose={() => autoCompleteHook.setShowSaveFormDialog(false)}
        formName={autoCompleteHook.saveFormName}
        onFormNameChange={autoCompleteHook.setSaveFormName}
        onSave={handleSaveForm}
      />

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