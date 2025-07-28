import { Button } from "ui/components/button";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { PaymentSection } from "./components/FormSections/PaymentSection";

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
  handleSubmit,
  eventType,
  eventName,
  giftedOn,
  plantedBy,
}: SummaryPaymentProps) => {
  const [hasDifferentAssignee, setHasDifferentAssignee] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const targetRef = useRef<HTMLDivElement>(null);
  const pageSizeOptions = [5, 10, 20, 50, 100];
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = dedicatedNames.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(dedicatedNames.length / itemsPerPage);

  const scrollToDiv = () => {
    const el = targetRef.current;
    if (el) {
      const yOffset = -100;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToDiv()
  }, [targetRef, currentPage, itemsPerPage]);

  useEffect(() => {
    const differentAssignee = dedicatedNames.some(user => user.assignee_name !== "" && user.assignee_name !== user.recipient_name);
    setHasDifferentAssignee(differentAssignee);
  }, [dedicatedNames])



  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    scrollToDiv();
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  return (
    <div ref={targetRef} className="space-y-8">
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

            {/* Page size selector */}
            <div className="flex justify-end">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Rows per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={handlePageSizeChange}
                  className="border rounded px-2 py-1 text-sm"
                >
                  {pageSizeOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table with scrollable container */}
            <div className="border border-gray-200 rounded overflow-hidden">
              <div className="overflow-auto" style={{ maxHeight: '400px' }}>
                <table className="min-w-full divide-y">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-2 text-left border-b">Recipient</th>
                      <th className="whitespace-nowrap px-4 py-2 text-left border-b">Recipient Email</th>
                      <th className="whitespace-nowrap px-4 py-2 text-left border-b">Trees</th>
                      {hasDifferentAssignee && (
                        <>
                          <th className="whitespace-nowrap px-4 py-2 text-left border-b">Assignee</th>
                          <th className="whitespace-nowrap px-4 py-2 text-left border-b">Assignee Email</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y">
                    {currentItems.map((recipient, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="whitespace-nowrap px-4 py-2 border-b">{recipient.recipient_name}</td>
                        <td className="whitespace-nowrap px-4 py-2 border-b">{recipient.recipient_email || '-'}</td>
                        <td className="whitespace-nowrap px-4 py-2 border-b">{recipient.trees_count}</td>
                        {hasDifferentAssignee && (
                          <>
                            <td className="whitespace-nowrap px-4 py-2 border-b">{recipient.assignee_name || '-'}</td>
                            <td className="whitespace-nowrap px-4 py-2 border-b">{recipient.assignee_email || '-'}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
                <div className="text-sm text-gray-600">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, dedicatedNames.length)} of {dedicatedNames.length} entries
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:bg-green-50'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:bg-green-50'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() =>{ setCurrentStep(1)}}
          className="mt-4 text-green-600 hover:text-green-800 underline"
        >
          ← Back to Edit
        </button>
      </div>

      {/* Payment Section */}
      <PaymentSection
        totalAmount={totalAmount}
        isAboveLimit={isAboveLimit}
        rpPaymentSuccess={rpPaymentSuccess}
        paymentProof={paymentProof}
        setPaymentProof={setPaymentProof}
        isProcessing={isProcessing}
        isLoading={isLoading}
        handleSubmit={handleSubmit}
        onCompleteGifting={() => {
          if (isAboveLimit && !paymentProof) {
            alert("Please upload payment proof for bank transfer");
            return;
          }
          const syntheticEvent = {
            preventDefault: () => { },
          } as React.FormEvent;
          handleSubmit(syntheticEvent);
        }}
      />
    </div>
  );
};

function getOccasionName(type: string | null): string {
  const types: Record<string, string> = {
    "1": "Birthday",
    "2": "Memorial",
    "4": "Wedding",
    "5": "Wedding Anniversary",
    "6": "Festival Celebration",
    "7": "Retirement",
    "3": "General Gift"
  };
  return type ? types[type] || "Other" : "Not specified";
}
