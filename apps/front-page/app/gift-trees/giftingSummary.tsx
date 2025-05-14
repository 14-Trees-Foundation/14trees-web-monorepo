import { Button } from "ui/components/button";
import Image from "next/image";
import { useEffect, useState } from "react";

interface SummaryPaymentProps {
  formData: {
    fullName: string;
    email: string;
    phone: string;
    panNumber: string;
    numberOfTrees: string;
  };
  dedicatedNames: Array<{
    recipient_name: string;
    recipient_email?: string;
    trees_count: number;
    assignee_name?: string;
    assignee_email?: string;
  }>;
  totalAmount: number;
  isAboveLimit: boolean;
  rpPaymentSuccess: boolean;
  paymentProof: File | null;
  setPaymentProof: (file: File | null) => void;
  isProcessing: boolean;
  isLoading: boolean;
  setCurrentStep: (step: 1 | 2) => void;
  handleRazorpayPayment: () => void;
  handleSubmit: (e: React.FormEvent) => void;
  eventType: string | null;
  eventName: string | null;
  giftedOn: Date;
  plantedBy: string | null;

}

export const SummaryPaymentPage = ({
  formData,
  dedicatedNames,
  totalAmount,
  isAboveLimit,
  rpPaymentSuccess,
  paymentProof,
  setPaymentProof,
  isProcessing,
  isLoading,
  setCurrentStep,
  handleRazorpayPayment,
  handleSubmit,
  eventType,
  eventName,
  giftedOn,
  plantedBy,
}: SummaryPaymentProps) => {

  const [hasDifferentAssignee, setHasDifferentAssignee] = useState(false);

  useEffect(() => {
    const differentAssignee = dedicatedNames.some(user => user.assignee_name !== "" && user.assignee_name !== user.recipient_name);
    setHasDifferentAssignee(differentAssignee);
  }, [dedicatedNames])


  const handleCompleteGifting = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAboveLimit && !paymentProof) {
      alert("Please upload payment proof for bank transfer");
      return;
    }

    const syntheticEvent = {
      preventDefault: () => { },
    } as React.FormEvent;
    handleSubmit(syntheticEvent);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-green-800">Order Summary</h2>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Gift Details</h3>
          <p>Gifted By: {plantedBy}</p>
          <p>Email: {formData.email}</p>
          {formData.phone && <p>Phone: {formData.phone}</p>}
          <p>PAN: {formData.panNumber}</p>
          <p>Trees: {formData.numberOfTrees}</p>
          <p>Amount: ₹{totalAmount.toLocaleString('en-IN')}</p>
          {eventType && <p>Occasion: {getOccasionName(eventType)}</p>}
          {eventName && <p>Event Name: {eventName}</p>}
          <p>Gifted On: {giftedOn.toLocaleDateString()}</p>
        </div>


        {/* Dedication Info */}
        {dedicatedNames[0]?.recipient_name && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Trees will be assigned to</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border rounded">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left border-b">Recipient</th>
                    <th className="px-4 py-2 text-left border-b">Recipient Email</th>
                    <th className="px-4 py-2 text-left border-b">Trees</th>
                    {hasDifferentAssignee && <>
                      <th className="px-4 py-2 text-left border-b">Assignee</th>
                      <th className="px-4 py-2 text-left border-b">Assignee Email</th>
                    </>}
                  </tr>
                </thead>
                <tbody>
                  {dedicatedNames.map((recipient, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2 border-b">{recipient.recipient_name}</td>
                      <td className="px-4 py-2 border-b">{recipient.recipient_email || '-'}</td>
                      <td className="px-4 py-2 border-b">{recipient.trees_count}</td>
                      {hasDifferentAssignee && <>
                        <td className="px-4 py-2 border-b">{recipient.assignee_name || '-'}</td>
                        <td className="px-4 py-2 border-b">{recipient.assignee_email || '-'}</td>
                      </>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
        {!isAboveLimit && !rpPaymentSuccess && (
          <div className="flex justify-center">
            <Button
              type="button"
              onClick={handleRazorpayPayment}
              disabled={isProcessing || rpPaymentSuccess}
              className={`bg-green-600 text-white w-[500px] py-4 mt-4 ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''
                }`}
            >
              {isProcessing ? 'Processing...' : 'Pay Securely via Razorpay'}
            </Button>
          </div>
        )}

        {isAboveLimit && (
          <div>
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
            <div className="mt-8">
              <label className="mb-2 block text-lg font-light">
                Upload Payment Confirmation (Screenshot/Pdf)*
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
          </div>
        )}

        {/* Submit Button */}
        {(isAboveLimit || rpPaymentSuccess) && (
          <div className="pt-6 flex justify-center">
            <Button
              type="button"
              onClick={handleCompleteGifting}
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
          </div>
        )}
      </div>
    </div>
  );
};

function getOccasionName(type: string | null): string {
  const types: Record<string, string> = {
    "1": "Birthday",
    "2": "Memorial",
    "3": "Wedding",
    "4": "Wedding Anniversary",
    "5": "Festival Celebration",
    "6": "General Gift"
  };
  return type ? types[type] || "Other" : "Not specified";
}
