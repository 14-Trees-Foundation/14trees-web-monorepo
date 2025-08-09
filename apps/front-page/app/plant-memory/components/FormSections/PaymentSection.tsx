import { Button } from "ui/components/button";
import Image from "next/image";

interface PaymentSectionProps {
  totalAmount: number;
  isAboveLimit: boolean;
  rpPaymentSuccess: boolean;
  paymentProof: File | null;
  setPaymentProof: (file: File | null) => void;
  isProcessing: boolean;
  isLoading: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  onCompleteGifting: () => void;
}

export const PaymentSection = ({
  totalAmount,
  isAboveLimit,
  rpPaymentSuccess,
  paymentProof,
  setPaymentProof,
  isProcessing,
  isLoading,
  handleSubmit,
  onCompleteGifting,
}: PaymentSectionProps) => {
  const handleCompleteGifting = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAboveLimit && !paymentProof) {
      alert("Please upload payment proof for bank transfer");
      return;
    }
    onCompleteGifting();
  };

  return (
    <div className="space-y-6">
      {/* Razorpay Payment Button */}
      {!isAboveLimit && !rpPaymentSuccess && (
        <div className="flex justify-center">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing || rpPaymentSuccess}
            className={`bg-green-600 text-white w-[500px] py-4 mt-4 ${
              isProcessing ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isProcessing ? 'Processing...' : 'Pay Securely via Razorpay'}
          </Button>
        </div>
      )}

      {/* Bank Transfer Section */}
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
          
          {/* Payment Proof Upload */}
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

      {/* Submit Button for Bank Transfer or After Razorpay Success */}
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
  );
};