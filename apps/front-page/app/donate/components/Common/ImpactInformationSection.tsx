import React from 'react';

interface ReferralDetails {
  name?: string;
  description?: string;
  referred_by?: string;
}

interface ImpactInformationSectionProps {
  referralDetails?: ReferralDetails | null;
}

export const ImpactInformationSection: React.FC<ImpactInformationSectionProps> = ({
  referralDetails
}) => {
  return (
    <div className="text-center space-y-4">
      {referralDetails && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7" />
            </svg>
            <span className="text-xl font-bold text-green-800">{referralDetails.name || 'Campaign'}</span>
          </div>
          {referralDetails.description && (
            <div className="text-gray-700 mb-1 pl-8" style={{ whiteSpace: 'pre-line' }}>
              {referralDetails.description}
            </div>
          )}
          {referralDetails.referred_by && (
            <div className="flex items-center gap-2 text-sm text-green-700 italic pl-8 mt-1">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Referred by: {referralDetails.referred_by}</span>
            </div>
          )}
        </div>
      )}

      <p className="text-gray-700 leading-relaxed text-left">
        By donating to 14Trees, you&apos;re directly contributing to the restoration of ecologically degraded hills near Pune. These barren landscapes are currently home only to fire-prone grass and suffer from severe topsoil erosion and depleted groundwater.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-green-700 text-left">Through our reforestation efforts we:</h3>
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
          <h3 className="font-semibold text-green-700 text-left">Our Impact till date:</h3>
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
  );
};