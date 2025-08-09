import React from 'react';
import { isInternalTestUser } from '../../../src/utils';

interface InternalTestBannerProps {
  userEmail: string;
}

export const InternalTestBanner: React.FC<InternalTestBannerProps> = ({ userEmail }) => {
  if (!isInternalTestUser(userEmail)) return null;
  
  return (
    <div className="bg-orange-500 text-white p-3 text-center font-bold text-sm md:text-base fixed top-16 left-0 right-0 z-50 shadow-lg">
      🔧 Internal Testing Mode - Using Test Razorpay Account
    </div>
  );
};