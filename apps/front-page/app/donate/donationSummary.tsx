import { useState } from 'react';
import Script from 'next/script';
import Image from 'next/image';
import { Button } from 'ui/components/button';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface SummaryPaymentProps {
  formData: {
    fullName: string;
    email: string;
    phone: string;
    panNumber: string;
  };
  treeLocation: string;
  visitDate: string;
  adoptedTreeCount: number;
  donationMethod: 'trees' | 'amount';
  donationTreeCount: number;
  donationAmount: number;
  multipleNames: boolean;
  dedicatedNames: Array<{
    recipient_name: string;
    trees_count: number;
    assignee_name?: string;
  }>;
  isAssigneeDifferent: boolean;
  paymentOption: 'razorpay' | 'bank-transfer';
  totalAmount: number;
  isAboveLimit: boolean;
  razorpayLoaded: boolean;
  rpPaymentSuccess: boolean;
  isProcessing: boolean;
  isLoading: boolean;
  showSuccessDialog: boolean;
  setCurrentStep: (step: number) => void;
  handleRazorpayPayment: () => void;
  handleSubmit: (e: React.FormEvent) => void;
  setShowSuccessDialog: (show: boolean) => void;
  setDonationId: (id: string | null) => void;
}

export const SummaryPaymentPage = ({
  formData,
  treeLocation,
  visitDate,
  adoptedTreeCount,
  donationMethod,
  donationTreeCount,
  donationAmount,
  multipleNames,
  dedicatedNames,
  isAssigneeDifferent,
  totalAmount,
  isAboveLimit,
  rpPaymentSuccess,
  isProcessing,
  isLoading,
  showSuccessDialog,
  setCurrentStep,
  handleRazorpayPayment,
  handleSubmit,
  setShowSuccessDialog,
}: SummaryPaymentProps) => {
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [paymentOption, setPaymentOption] = useState<"razorpay" | "bank-transfer">("razorpay");
  const [donationId, setDonationId] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {/* Summary Section */}
      <div className="space-y-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-green-800">Order Summary</h2>
        
        {/* Donor Info */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Your Details</h3>
          <p><span className="font-medium">Name:</span> {formData.fullName}</p>
          <p><span className="font-medium">Email:</span> {formData.email}</p>
          {formData.phone && <p><span className="font-medium">Phone:</span> {formData.phone}</p>}
          <p><span className="font-medium">PAN:</span> {formData.panNumber}</p>
        </div>

        {/* Tree Details */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            {treeLocation === "adopt" ? "Tree Adoption" : "Donation Details"}
          </h3>
          {treeLocation === "adopt" ? (
            <>
              <p><span className="font-medium">Visit Date:</span> {visitDate || "Not specified"}</p>
              <p><span className="font-medium">Trees:</span> {adoptedTreeCount}</p>
              <p><span className="font-medium">Amount:</span> ₹{3000 * (adoptedTreeCount || 0)}</p>
            </>
          ) : (
            <>
              {donationMethod === "trees" && (
                <p><span className="font-medium">Trees:</span> {donationTreeCount}</p>
              )}
              <p><span className="font-medium">Amount:</span> ₹{
                donationMethod === "trees" ? 
                (donationTreeCount * 1500) : 
                donationAmount
              }</p>
            </>
          )}
        </div>

        {/* Dedication Info */}
        {dedicatedNames[0]?.recipient_name && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Dedication</h3>
            {multipleNames ? (
              <>
                <p><span className="font-medium">Multiple Recipients:</span> {dedicatedNames.length}</p>
                <div className="max-h-40 overflow-y-auto border rounded p-2">
                  {dedicatedNames.map((name, i) => (
                    <div key={i} className="py-1 border-b last:border-0">
                      <p>{name.recipient_name} ({name.trees_count || 1} trees)</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p><span className="font-medium">Recipient:</span> {dedicatedNames[0].recipient_name}</p>
                {isAssigneeDifferent && (
                  <p><span className="font-medium">Assignee:</span> {dedicatedNames[0].assignee_name}</p>
                )}
              </>
            )}
          </div>
        )}

        {/* Back Button */}
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className="mt-4 text-green-600 hover:text-green-800 underline"
        >
          ← Back to Edit
        </button>
      </div>

      {/* Payment Section */}
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
              <span>Bank Transfer {isAboveLimit && "(Recommended for large donations)"}</span>
            </label>
          </div>

          {isAboveLimit && (
            <p className="text-yellow-600 bg-yellow-50 p-2 rounded-md">
              For donations above ₹1,00,000, please use Bank Transfer.
            </p>
          )}
        </div>

        {paymentOption === "razorpay" && !isAboveLimit && !rpPaymentSuccess && (
          <div className="flex justify-center">
            <Button
              type="button"
              onClick={handleRazorpayPayment}
              disabled={isProcessing || !razorpayLoaded || rpPaymentSuccess}
              className={`bg-green-600 text-white w-[500px] py-4 mt-4 ${
                isProcessing ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isProcessing ? 'Processing...' : 'Pay Securely via Razorpay'}
            </Button>
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

        {/* Complete Donation Button */}
        {(paymentOption !== "razorpay" || rpPaymentSuccess) && (
          <div className="pt-6 flex justify-center">
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
                "Complete Donation"
              )}
            </Button>
          </div>
        )}
      </div>

      {showSuccessDialog && (
        <showSuccessDialog
          donationId={donationId}
          setShowSuccessDialog={setShowSuccessDialog}
          setDonationId={setDonationId}
        />
      )}
    </div>
  );
};