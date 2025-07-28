import React from 'react';

interface RecipientEntryToggleProps {
  entryMethod: 'manual' | 'csv';
  onMethodChange: (method: 'manual' | 'csv') => void;
  manualLabel?: string;
  csvLabel?: string;
  className?: string;
}

export const RecipientEntryToggle: React.FC<RecipientEntryToggleProps> = ({
  entryMethod,
  onMethodChange,
  manualLabel = 'Add recipients manually',
  csvLabel = 'Upload CSV file',
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-6 mb-4 ${className}`}>
      <label className="flex items-center space-x-2 cursor-pointer">
        <input
          type="radio"
          checked={entryMethod === 'manual'}
          onChange={() => onMethodChange('manual')}
          className="h-4 w-4 text-green-600 focus:ring-green-500"
        />
        <span className="text-gray-700">{manualLabel}</span>
      </label>
      <label className="flex items-center space-x-2 cursor-pointer">
        <input
          type="radio"
          checked={entryMethod === 'csv'}
          onChange={() => onMethodChange('csv')}
          className="h-4 w-4 text-green-600 focus:ring-green-500"
        />
        <span className="text-gray-700">{csvLabel}</span>
      </label>
    </div>
  );
};