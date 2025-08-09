import React, { useState } from 'react';
import { DedicatedName } from '../../types/forms';

interface SuccessDialogProps {
  giftRequestId: string | null;
  onClose: () => void;
  onReset: () => void;
}

export const SuccessDialog: React.FC<SuccessDialogProps> = ({
  giftRequestId,
  onClose,
  onReset
}) => {
  const [additionalInvolvement, setAdditionalInvolvement] = useState<string[]>([]);
  const [comments, setComments] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);
  const [showReferralDialog, setShowReferralDialog] = useState(false);

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

  const handleSkip = () => {
    setSkipped(true);
  };

  const handleClose = () => {
    onReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {!updateSuccess && !skipped ? (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-green-600 mb-4">Your memory is being planted!</h3>
                <p className="mb-2">Your request has been submitted successfully. We&apos;re crafting your personalised tree card.</p>
                {giftRequestId && (
                  <p className="mb-2">
                    <strong>Gift Trees Request ID:</strong> {giftRequestId}
                  </p>
                )}
                <ul className="list-disc pl-6 mb-4 text-sm">
                  <li>The receipt and the certificate of appreciation have been sent to your email ID.</li>
                  <li>
                    Soft copy of the cards will be sent via email within two working days.
                    <ul className="list-disc pl-6">
                      <li>
                        <i>(Sometimes the email lands up in the Spam/Junk folder, please ensure to check it)</i>.
                      </li>
                      <li>
                        This email will contain the link to your tree dashboard, which will show the latest picture of the plant/tree, location on the map and other details.
                      </li>
                    </ul>
                  </li>
                  <li>You can also print the cards, the default size of the card is A5.</li>
                  <li>
                    In case of any issues, please call <strong>+91 98458 05881</strong> or email{" "}
                    <a href="mailto:contact@14trees.org" className="text-blue-600 underline">
                      contact@14trees.org
                    </a>.
                  </li>
                </ul>
              </div>

              <div className="h-px bg-gray-200 mb-6"></div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-600 mb-3">Besides gifting, I would also like to:</p>
                  <div className="space-y-3">
                    {involvementOptions.map((option) => (
                      <label key={option.value} className="flex items-start">
                        <input
                          type="checkbox"
                          className="mt-1 mr-3 h-5 w-5"
                          checked={additionalInvolvement.includes(option.value)}
                          onChange={() => handleInvolvementChange(option.value)}
                        />
                        <span className="text-sm text-gray-700">{option.display}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">We will get in touch with you based on the options you select.</p>
                </div>

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

              <div className="sticky bottom-0 bg-white pt-4 mt-6 border-t border-gray-200 flex justify-end space-x-4">
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
                  : "Thank you for your gift trees request!"}
              </p>

              <button
                onClick={handleClose}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};