import React from 'react';
import { DonationType, DonationMethod } from '../../types';

interface DonationTypeSectionProps {
  treeLocation: DonationType | "";
  setTreeLocation: (value: DonationType) => void;
  donationMethod: DonationMethod;
  setDonationMethod: (value: DonationMethod) => void;
  donationTreeCount: number;
  setDonationTreeCount: (value: number) => void;
  donationAmount: number;
  setDonationAmount: (value: number) => void;
  adoptedTreeCount: number;
  setAdoptedTreeCount: (value: number) => void;
  visitDate: string;
  setVisitDate: (value: string) => void;
  dateInputRef: React.RefObject<HTMLInputElement>;
  multipleNames: boolean;
  setDedicatedNames: React.Dispatch<React.SetStateAction<any[]>>;
}

export const DonationTypeSection: React.FC<DonationTypeSectionProps> = ({
  treeLocation,
  setTreeLocation,
  donationMethod,
  setDonationMethod,
  donationTreeCount,
  setDonationTreeCount,
  donationAmount,
  setDonationAmount,
  adoptedTreeCount,
  setAdoptedTreeCount,
  visitDate,
  setVisitDate,
  dateInputRef,
  multipleNames,
  setDedicatedNames
}) => {
  return (
    <div className="space-y-6">
      {/* First radio option - Donation */}
      <div className="space-y-6 bg-green-50 p-4 rounded-lg border border-gray-600">
        <div className="space-y-3">
          <label className="flex items-start space-x-3">
            <input
              type="radio"
              name="treeLocation"
              value="donate"
              className="mt-1 h-5 w-5"
              onChange={() => {
                setTreeLocation("donate");
              }}
              checked={treeLocation === "donate"}
            />
            <span>I want to make a donation to support reforestation.</span>
          </label>
        </div>

        {/* Second radio option - Adoption */}
        <div className="space-y-3">
          <label className="flex items-start space-x-3">
            <input
              type="radio"
              name="treeLocation"
              value="adopt"
              className="mt-1 h-5 w-5"
              onChange={() => {
                setTreeLocation("adopt");
              }}
              checked={treeLocation === "adopt"}
            />
            <span>I would like to adopt the trees, I/we planted during my visit at 14 Trees in the past.</span>
          </label>
        </div>
      </div>

      <div className="mt-6 mb-8 h-px bg-gray-200"></div>

      {treeLocation === "donate" && (
        <div className="space-y-6 bg-green-50 p-4 rounded-lg border border-gray-600">
          <div className="space-y-4">
            <div className="space-y-4">
              {/* Option 1: Donate Trees */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="donationMethod"
                    value="trees"
                    className="h-5 w-5"
                    checked={donationMethod === "trees"}
                    onChange={() => {
                      setDonationMethod("trees");
                      setDonationAmount(1500);
                    }}
                  />
                  <span>I want to donate</span>
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  className="min-w-0 w-full sm:w-36 rounded-md border border-gray-300 px-3 py-1 text-gray-700 disabled:bg-gray-100"
                  disabled={donationMethod !== 'trees'}
                  value={donationMethod !== 'trees' ? 0 : donationTreeCount}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setDonationTreeCount(Number(value))
                    !multipleNames && setDedicatedNames(prev => {
                      prev[0].trees_count = Number(value) || 1;
                      return prev;
                    })
                  }}
                />
                <span className="text-sm">Trees</span>
              </div>

              {/* Option 2: Donate Amount */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="donationMethod"
                    value="amount"
                    className="h-5 w-5"
                    checked={donationMethod === "amount"}
                    onChange={() => setDonationMethod("amount")}
                  />
                  <span>I want to donate</span>
                </label>
                <input
                  type="number"
                  min="1500"
                  step="1"
                  inputMode="numeric"
                  className="min-w-0 w-full sm:w-36 rounded-md border border-gray-300 px-3 py-1 text-gray-700 disabled:bg-gray-100 appearance-none"
                  disabled={donationMethod !== 'amount'}
                  value={donationMethod !== 'amount' ? 0 : donationAmount || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    const amount = parseInt(value, 10);

                    if (!isNaN(amount)) {
                      setDonationAmount(amount);
                    } else {
                      setDonationAmount(0);
                    }
                  }}
                  onBlur={() => {
                    if (donationAmount < 1500) {
                      setDonationAmount(1500);
                    }
                  }}
                  placeholder="1500"
                />
                <span className="text-sm">Rupees</span>
              </div>
              {donationMethod === 'amount' && donationAmount < 1500 && donationAmount > 0 && (
                <p className="text-sm text-red-600 mt-1">Minimum donation amount is ₹1,500</p>
              )}
            </div>

            {donationMethod === "trees" && (
              <div className="font-medium">
                Donation amount: {(donationTreeCount * 1500).toLocaleString('en-IN')} INR
              </div>
            )}
          </div>
        </div>
      )}

      {treeLocation === "adopt" && (
        <div className="space-y-6 bg-green-50 p-4 rounded-lg border border-gray-600">
          <div className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of trees you would like to adopt:
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-700"
                  value={adoptedTreeCount || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setAdoptedTreeCount(Number(value))
                  }}
                />
                <p className="text-sm text-gray-500 mt-1">3000 INR per tree</p>
              </div>
            </div>
            <div className="mt-2">
              <p className="font-medium">Amount: {(3000 * (adoptedTreeCount || 0)).toLocaleString('en-IN')} INR</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of visit: <span className="text-gray-500">- approx date / month is fine if you don&apos;t remember</span>
              </label>
              <div
                className="relative cursor-pointer"
                onClick={() => {
                  dateInputRef.current?.showPicker();
                }}
              >
                <input
                  ref={dateInputRef}
                  type="date"
                  className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-700 cursor-pointer"
                  value={visitDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVisitDate(e.target.value)}
                  placeholder="dd-mm-yyyy"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};