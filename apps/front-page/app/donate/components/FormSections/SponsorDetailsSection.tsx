import React from 'react';
import { FormData } from '../../types';

interface SponsorDetailsSectionProps {
  formData: FormData;
  errors: Record<string, string>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  validateField: (name: string, value: string) => string;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  treeLocation: string;
}

export const SponsorDetailsSection: React.FC<SponsorDetailsSectionProps> = ({
  formData,
  errors,
  handleInputChange,
  validateField,
  setErrors,
  treeLocation
}) => {
  if (treeLocation === "") return null;

  return (
    <div className="mt-6 space-y-6">
      <h2 className="text-2xl font-semibold">Donor details</h2>
      <div className="grid grid-cols-1 gap-4">
        <div className="flex items-center flex-wrap">
          <label className="w-48 text-gray-700">Donated by*:</label>
          <div className="min-w-[200px] flex-1">
            <input
              type="text"
              name="fullName"
              className={`w-full rounded-md border ${errors.fullName ? 'border-red-500' : 'border-gray-300'} px-4 py-2 text-gray-700`}
              required
              value={formData.fullName}
              onChange={handleInputChange}
              onBlur={(e) => {
                const error = validateField(e.target.name, e.target.value);
                setErrors(prev => ({ ...prev, fullName: error }));
              }}
              placeholder="Type your name"
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
            )}
          </div>
        </div>

        <div className="flex items-center flex-wrap">
          <label className="w-48 text-gray-700">Email ID*:</label>
          <div className="min-w-[200px] flex-1">
            <input
              type="email"
              name="email"
              className={`w-full rounded-md border ${errors.email ? 'border-red-500' : 'border-gray-300'} px-4 py-2 text-gray-700`}
              required
              value={formData.email}
              onChange={handleInputChange}
              onBlur={(e) => {
                const error = validateField(e.target.name, e.target.value);
                setErrors(prev => ({ ...prev, email: error }));
              }}
              placeholder="Type your email id"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>
        </div>

        <div className="flex items-center flex-wrap">
          <label className="w-48 text-gray-700">Mobile number*:</label>
          <div className="min-w-[200px] flex-1">
            <input
              type="tel"
              name="phone"
              className={`w-full rounded-md border ${errors.phone ? 'border-red-500' : 'border-gray-300'} px-4 py-2 text-gray-700`}
              value={formData.phone}
              onChange={handleInputChange}
              onBlur={(e) => {
                const error = validateField(e.target.name, e.target.value);
                setErrors(prev => ({ ...prev, phone: error }));
              }}
              placeholder="Enter with country code, if outside India"
              pattern="[0-9]{10,15}"
              title="10-15 digit phone number"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>
        </div>

        <div className="flex items-center flex-wrap">
          <label className="w-48 text-gray-700">PAN number*:</label>
          <div className="min-w-[200px] flex-1">
            <input
              type="text"
              name="panNumber"
              className={`w-full rounded-md border ${errors.panNumber ? 'border-red-500' : 'border-gray-300'} px-4 py-2 text-gray-700 uppercase placeholder:text-gray-400 placeholder:normal-case`}
              value={formData.panNumber}
              onChange={handleInputChange}
              placeholder="Enter your PAN number"
              pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
              maxLength={10}
            />
            {errors.panNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.panNumber}</p>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-600">
            At present we can accept donations only from Indian residents. PAN number is required to know the donor&apos;s identity.
          </p>
        </div>
      </div>
    </div>
  );
};