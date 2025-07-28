import React, { useState } from 'react';
import { isInternalTestUser } from "~/utils";

interface SuccessDialogProps {
  donationId: string | null;
  formData: {
    fullName: string;
    email: string;
    phone: string;
    panNumber: string;
    comments: string;
  };
  onClose: () => void;
  onReset: () => void;
  setShowReferralDialog: (show: boolean) => void;
}

export const SuccessDialog: React.FC<SuccessDialogProps> = ({
  donationId,
  formData,
  onClose,
  onReset,
  setShowReferralDialog
}) => {
  const [additionalInvolvement, setAdditionalInvolvement] = useState<string[]>([]);
  const [comments, setComments] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);

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
    onReset();
    onClose();
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
        {isInternalTestUser(formData.email) && (
          <div className="mb-4 p-3 bg-orange-100 border border-orange-300 rounded">
            <p className="text-sm text-orange-800">
              <strong>🔧 Internal Test Transaction</strong><br/>
              This was processed with dummy razorpay account for testing purposes.
            </p>
          </div>
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