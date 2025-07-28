"use client";

import MotionDiv from "components/animation/MotionDiv";
import { ScrollReveal } from "components/Partials/HomePage";
import labels from "~/assets/labels.json";
import { useState, useEffect, useRef, Suspense } from "react";
import { apiClient } from "~/api/apiClient";
import { UploadIcon } from "lucide-react";
import { isInternalTestUser } from "~/utils";
import { UserDetailsForm } from './components/UserDetailsForm';
import { SummaryPaymentPage } from './donationSummary';
import { useSearchParams } from "next/navigation";
import { ReferralDialog } from "components/referral/ReferralDialog";
import { Modal } from "ui";

// Import new hooks and services
import { useFormValidation } from './hooks/useFormValidation';
import { usePaymentHandling } from './hooks/usePaymentHandling';
import { useCSVProcessing } from './hooks/useCSVProcessing';
import { useDonationLogic } from './hooks/useDonationLogic';
import { useFormSubmission } from './hooks/useFormSubmission';
import { useDedicatedNames } from './hooks/useDedicatedNames';
import { useRazorpayPayment } from './hooks/useRazorpayPayment';
import { useImageUpload } from './hooks/useImageUpload';
import { useBankPayment } from './hooks/useBankPayment';
import { useStepValidation } from './hooks/useStepValidation';
import { useFormHandlers } from './hooks/useFormHandlers';
import { DedicatedName, FormData } from './types/donation';
import { containerVariants } from './utils/animations';

// Import components
import { DonationTypeSection } from './components/FormSections/DonationTypeSection';
import { DonationMethodSection } from './components/FormSections/DonationMethodSection';
import { DedicatedNamesSectionRefactored } from './components/FormSections/DedicatedNamesSectionRefactored';
import { SponsorDetailsSection } from './components/FormSections/SponsorDetailsSection';
import { PaymentSection } from './components/FormSections/PaymentSection';
import { CSVUploadSection } from './components/CSVUpload/CSVUploadSection';
import { ValidationAlert } from '../../components/Common/UI/ValidationAlert';
import { InternalTestBanner } from '../../components/Common/UI/InternalTestBanner';
import { ImpactInformationSection } from './components/Common/ImpactInformationSection';
import { ReferralInviteSection } from './components/Common/ReferralInviteSection';
import { SuccessDialog } from './components/Dialogs/SuccessDialog';

declare global {
  interface Window {
    Razorpay: any;
  }
}

function Donation() {
  const searchParams = useSearchParams();
  const rfr = searchParams.get('r');
  const c_key = searchParams.get('c');

  // Form data state
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    panNumber: "",
    comments: ""
  });

  // UI state
  const [treeLocation, setTreeLocation] = useState("");
  const [multipleNames, setMultipleNames] = useState(false);
  // Initialize dedicated names hook
  const dedicatedNamesHook = useDedicatedNames();
  const [isAssigneeDifferent, setIsAssigneeDifferent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rpPaymentSuccess, setRpPaymentSuccess] = useState<boolean>(false);
  const [paymentOption, setPaymentOption] = useState<"razorpay" | "bank-transfer">("razorpay");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [nameEntryMethod, setNameEntryMethod] = useState<"manual" | "csv">("manual");
  const [hasDuplicateNames, setHasDuplicateNames] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<Record<string, File>>({});
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [referralDetails, setReferralDetails] = useState<{ referred_by?: string, name?: string, c_key?: string, description?: string } | null>(null);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0); // 0-based indexing
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [razorpayPaymentId, setRazorpayPaymentId] = useState<number | null>(null);
  const [razorpayOrderId, setRazorpayOrderId] = useState<string | null>(null);
  const [donationId, setDonationId] = useState<number | null>(null);

  // Initialize hooks
  const donationLogic = useDonationLogic({ formData, rfr, c_key });
  
  const formValidation = useFormValidation({ 
    formData, 
    dedicatedNames: dedicatedNamesHook.dedicatedNames 
  });

  const paymentHandling = usePaymentHandling({
    userEmail: formData.email,
    userName: formData.fullName,
    userPhone: formData.phone,
    panNumber: formData.panNumber
  });

  const csvProcessing = useCSVProcessing();

  // Initialize image upload hook
  const imageUpload = useImageUpload({
    csvPreview: csvProcessing.csvPreview,
    csvErrors: csvProcessing.csvErrors,
    setCsvPreview: csvProcessing.setCsvPreview,
    setCsvErrors: csvProcessing.setCsvErrors
  });

  // Initialize bank payment hook
  const bankPayment = useBankPayment({
    formData,
    treeLocation,
    donationMethod: donationLogic.donationMethod,
    adoptedTreeCount: donationLogic.adoptedTreeCount,
    donationTreeCount: donationLogic.donationTreeCount,
    donationAmount: donationLogic.donationAmount,
    paymentProof,
    setRazorpayPaymentId
  });

  // Initialize form submission hook
  const formSubmission = useFormSubmission({
    formData,
    treeLocation,
    donationMethod: donationLogic.donationMethod,
    adoptedTreeCount: donationLogic.adoptedTreeCount,
    donationTreeCount: donationLogic.donationTreeCount,
    donationAmount: donationLogic.donationAmount,
    visitDate: donationLogic.visitDate,
    dedicatedNames: dedicatedNamesHook.dedicatedNames,
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
    onSuccess: () => setShowSuccessDialog(true),
    onError: (message: string) => alert(message)
  });

  // Initialize Razorpay payment hook
  const razorpayPayment = useRazorpayPayment({
    formData,
    treeLocation,
    donationMethod: donationLogic.donationMethod,
    adoptedTreeCount: donationLogic.adoptedTreeCount,
    donationTreeCount: donationLogic.donationTreeCount,
    donationAmount: donationLogic.donationAmount,
    visitDate: donationLogic.visitDate,
    dedicatedNames: dedicatedNamesHook.dedicatedNames,
    razorpayPaymentId,
    razorpayOrderId,
    setRazorpayPaymentId,
    setRazorpayOrderId,
    setDonationId,
    onSuccess: () => setShowSuccessDialog(true),
    onError: (message: string) => alert(message)
  });

  // Calculate hasTableErrors
  const hasTableErrors = csvProcessing.csvErrors.length > 0;

  // Initialize step validation hook
  const stepValidation = useStepValidation({
    formData,
    errors: formValidation.errors,
    hasTableErrors,
    csvErrors: csvProcessing.csvErrors,
    treeLocation,
    adoptedTreeCount: donationLogic.adoptedTreeCount,
    visitDate: donationLogic.visitDate,
    donationMethod: donationLogic.donationMethod,
    donationTreeCount: donationLogic.donationTreeCount,
    dedicatedNames: dedicatedNamesHook.dedicatedNames,
    hasDuplicateNames,
    setCurrentStep
  });

  // Initialize form handlers hook
  const formHandlers = useFormHandlers({
    formData,
    setFormData,
    formValidation,
    csvProcessing,
    dedicatedNamesHook,
    setTreeLocation,
    setMultipleNames,
    setPaymentOption,
    setErrors: formValidation.setErrors,
    setRpPaymentSuccess,
    setRazorpayOrderId,
    setRazorpayPaymentId,
    setDonationAmount: donationLogic.setDonationAmount,
    setDonationTreeCount: donationLogic.setDonationTreeCount,
    setCurrentStep,
    setDonationId,
    setCsvFile: csvProcessing.setCsvFile,
    setCsvPreview: csvProcessing.setCsvPreview,
    setCsvErrors: csvProcessing.setCsvErrors
  });

  // Sync CSV data with dedicated names
  useEffect(() => {
    if (nameEntryMethod === "csv" && csvProcessing.csvPreview.length > 0 && csvProcessing.csvErrors.length === 0) {
      dedicatedNamesHook.setDedicatedNames(csvProcessing.csvPreview);
      setMultipleNames(true);
    }
  }, [csvProcessing.csvPreview, nameEntryMethod, csvProcessing.csvErrors, dedicatedNamesHook.setDedicatedNames]);

  // Check for duplicate names
  useEffect(() => {
    setHasDuplicateNames(formValidation.checkDuplicateNames());
  }, [dedicatedNamesHook.dedicatedNames, formValidation]);

  // Reset pagination when CSV data changes
  useEffect(() => {
    setCurrentPage(0);
  }, [csvProcessing.csvPreview.length]);

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



  // Use the form submission hook
  const handleSubmit = formSubmission.handleSubmit;

  // Use the dedicated names hook functions
  const handleAddName = dedicatedNamesHook.handleAddName;

  const handleRemoveName = dedicatedNamesHook.handleRemoveName;
  const handleNameChange = dedicatedNamesHook.handleNameChange;

  // Use the extracted hooks
  const handleRazorpayPayment = razorpayPayment.handleRazorpayPayment;
  const handleBankPayment = bankPayment.handleBankPayment;

  const handleImageUpload = imageUpload.handleImageUpload;

  return (
    <div className="overflow-hidden bg-white">
      <InternalTestBanner userEmail={formData.email} />
      <div className={`relative min-h-[45vh] w-full md:min-h-[60vh] ${isInternalTestUser(formData.email) ? 'pt-12' : ''}`}>
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

                <ImpactInformationSection referralDetails={referralDetails} />

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

                    <DonationMethodSection
                      treeLocation={treeLocation}
                      setTreeLocation={setTreeLocation}
                      donationMethod={donationLogic.donationMethod}
                      setDonationMethod={donationLogic.setDonationMethod}
                      donationTreeCount={donationLogic.donationTreeCount}
                      setDonationTreeCount={donationLogic.setDonationTreeCount}
                      donationAmount={donationLogic.donationAmount}
                      setDonationAmount={donationLogic.setDonationAmount}
                      adoptedTreeCount={donationLogic.adoptedTreeCount}
                      setAdoptedTreeCount={donationLogic.setAdoptedTreeCount}
                      visitDate={donationLogic.visitDate}
                      setVisitDate={donationLogic.setVisitDate}
                      multipleNames={multipleNames}
                      setDedicatedNames={dedicatedNamesHook.setDedicatedNames}
                    />
                  </div>

                  <SponsorDetailsSection
                    formData={formData}
                    errors={formValidation.errors}
                    handleInputChange={formHandlers.handleInputChange}
                    validateField={formValidation.validateField}
                    setErrors={formValidation.setErrors}
                    treeLocation={treeLocation}
                  />

                  <DedicatedNamesSectionRefactored
                    donationMethod={donationLogic.donationMethod}
                    treeLocation={treeLocation}
                    showAdditionalInfo={showAdditionalInfo}
                    setShowAdditionalInfo={setShowAdditionalInfo}
                    multipleNames={multipleNames}
                    setMultipleNames={setMultipleNames}
                    dedicatedNames={dedicatedNamesHook.dedicatedNames}
                    setDedicatedNames={dedicatedNamesHook.setDedicatedNames}
                    donationTreeCount={donationLogic.donationTreeCount}
                    errors={formValidation.errors}
                    handleNameChange={handleNameChange}
                    handleAddName={handleAddName}
                    handleRemoveName={handleRemoveName}
                    isAssigneeDifferent={isAssigneeDifferent}
                    nameEntryMethod={nameEntryMethod}
                    setNameEntryMethod={setNameEntryMethod}
                    csvFile={csvProcessing.csvFile}
                    setCsvFile={csvProcessing.setCsvFile}
                    csvPreview={csvProcessing.csvPreview}
                    setCsvPreview={csvProcessing.setCsvPreview}
                    csvErrors={csvProcessing.csvErrors}
                    setCsvErrors={csvProcessing.setCsvErrors}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    setItemsPerPage={setItemsPerPage}
                    uploadedImages={uploadedImages}
                    setUploadedImages={setUploadedImages}
                    fileInputRef={csvProcessing.fileInputRef}
                    handleCsvUpload={formHandlers.handleCsvUpload}
                    handleImageUpload={handleImageUpload}
                    downloadSampleCsv={formHandlers.downloadSampleCsv}
                  />

                  <div className="flex justify-end space-x-4 mt-8">
                    <div className="w-full flex flex-col items-end">
                      <button
                        type="button"
                        onClick={stepValidation.handleProceedToPayment}
                        className={`px-6 py-3 rounded-md transition-colors text-white ${!stepValidation.canProceed
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700"
                          }`}
                        disabled={!stepValidation.canProceed}
                      >
                        Proceed to pay
                      </button>
                      {stepValidation.hasErrors && (
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
                      visitDate={donationLogic.visitDate}
                      adoptedTreeCount={donationLogic.adoptedTreeCount}
                      donationMethod={donationLogic.donationMethod}
                      donationTreeCount={donationLogic.donationTreeCount}
                      donationAmount={donationLogic.donationAmount}
                      dedicatedNames={dedicatedNamesHook.dedicatedNames}
                      paymentOption={paymentOption}
                      isAboveLimit={donationLogic.isAboveLimit}
                      rpPaymentSuccess={rpPaymentSuccess}
                      paymentProof={paymentProof}
                      setPaymentProof={setPaymentProof}
                      isProcessing={isSubmitting}
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

        <ReferralInviteSection onCreateReferralLink={() => setShowReferralDialog(true)} />
      </div>
      {showSuccessDialog && (
        <SuccessDialog
          donationId={donationId?.toString() || null}
          formData={formData}
          onClose={() => setShowSuccessDialog(false)}
          onReset={formHandlers.handleReset}
          setShowReferralDialog={setShowReferralDialog}
        />
      )}
      {showReferralDialog && (
        <ReferralDialog
          linkType="donate"
          open={showReferralDialog}
          onClose={() => setShowReferralDialog(false)}
        />
      )}
      {stepValidation.showValidationAlert && (
        <ValidationAlert
          show={stepValidation.showValidationAlert}
          onClose={() => stepValidation.setShowValidationAlert(false)}
          title={stepValidation.validationAlertData.title}
          message={stepValidation.validationAlertData.message}
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