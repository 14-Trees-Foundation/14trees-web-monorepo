import React from 'react';

interface ReferralInviteSectionProps {
  onCreateReferralLink: () => void;
}

export const ReferralInviteSection: React.FC<ReferralInviteSectionProps> = ({
  onCreateReferralLink
}) => {
  return (
    <>
      <div className="mt-12 h-px bg-gray-200"></div>
      <div className="mt-6 mb-6 space-y-4 bg-green-50 p-4 rounded-lg">
        <h4 className="text-lg font-semibold text-green-800">Inspire Others to Give</h4>
        <p className="text-sm text-green-700">
          Do you know you can create your personal referral link and share it with friends and family? Every contribution made through your link will be tracked. When someone contributes using your link, you&apos;ll receive an email with your personal referral dashboard where you can see the impact you&apos;ve inspired as others join you in supporting our reforestation efforts.
        </p>
        <a
          onClick={(e) => {
            e.preventDefault();
            onCreateReferralLink();
          }}
          className="mt-2 text-green-800 hover:text-green-900 underline cursor-pointer"
        >
          Create & Share Your Link
        </a>
      </div>
    </>
  );
};