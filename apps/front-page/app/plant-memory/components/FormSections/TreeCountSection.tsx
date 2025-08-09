import React from 'react';

interface TreeCountSectionProps {
  numberOfTrees: string;
  totalAmount: number;
  isAboveLimit: boolean;
  errors: Record<string, string>;
  rpPaymentSuccess: boolean;
  onTreeCountChange: (count: string) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TreeCountSection: React.FC<TreeCountSectionProps> = ({
  numberOfTrees,
  totalAmount,
  isAboveLimit,
  errors,
  rpPaymentSuccess,
  onTreeCountChange,
  onInputChange
}) => {
  const handleOtherButtonClick = () => {
    const input = document.querySelector(
      'input[name="numberOfTrees"]'
    ) as HTMLInputElement;
    if (input) {
      input.focus();
      input.select();
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Ensure minimum value of 1
    if (e.target.value === "" || parseInt(e.target.value) < 1) {
      onTreeCountChange("1");
    }
  };

  const handleInputChangeWithValidation = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only update if value is empty or a valid integer ≥1
    if (e.target.value === "" || (/^\d+$/.test(e.target.value) && parseInt(e.target.value) >= 1)) {
      onInputChange(e);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border border-gray-300 rounded-lg p-4 sm:p-6 bg-white shadow-sm">
        {/* Label + Input */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          <label className="text-base sm:text-lg font-light">
            How many trees would you like to sponsor?*
          </label>
          <input
            type="number"
            name="numberOfTrees"
            min="1"
            step="1" // Ensures only whole numbers
            className={`w-full sm:w-60 rounded-md border px-4 py-2 text-gray-700 ${
              errors.numberOfTrees ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            disabled={rpPaymentSuccess}
            value={numberOfTrees}
            onChange={handleInputChangeWithValidation}
            onBlur={handleInputBlur}
          />
        </div>

        {/* Predefined buttons + Other */}
        <div className="flex flex-wrap gap-2 mt-4">
          {[2, 5, 10, 14, 50, 100].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => onTreeCountChange(count.toString())}
              className={`px-4 py-2 rounded-md text-sm sm:text-base ${
                numberOfTrees === count.toString()
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {count} Trees
            </button>
          ))}
          <button
            type="button"
            onClick={handleOtherButtonClick}
            className={`px-4 py-2 rounded-md text-sm sm:text-base ${
              ![2, 5, 10, 14, 50, 100].includes(Number(numberOfTrees))
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Other
          </button>
        </div>

        {/* Total Amount */}
        <p className="mt-4 text-sm sm:text-base text-gray-600">
          Total Amount: ₹{totalAmount.toLocaleString('en-IN')}
          {isAboveLimit && " (Above Razorpay limit - Bank Transfer recommended)"}
        </p>
      </div>
    </div>
  );
};