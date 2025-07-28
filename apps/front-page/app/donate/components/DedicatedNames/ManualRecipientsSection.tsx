import React from 'react';
import { DedicatedName } from '../../types/donation';
import { UserDetailsForm } from '../UserDetailsForm';
import { ValidationErrorDisplay } from '../../../../components/shared/ErrorDisplay';

interface ManualRecipientsSectionProps {
  dedicatedNames: DedicatedName[];
  errors: Record<string, string>;
  donationTreeCount: number;
  onNameChange: (index: number, field: string, value: string | number) => void;
  onAddName: () => void;
  onRemoveName: (index: number) => void;
}

export const ManualRecipientsSection: React.FC<ManualRecipientsSectionProps> = ({
  dedicatedNames,
  errors,
  donationTreeCount,
  onNameChange,
  onAddName,
  onRemoveName
}) => {
  const totalTreesAssigned = dedicatedNames.reduce((sum, user) => sum + (user.trees_count || 1), 0);
  const canAddMore = totalTreesAssigned < donationTreeCount;
  const hasEmptyNames = dedicatedNames.some(user => user.recipient_name.trim() === "");

  return (
    <div className="space-y-4">
      <ValidationErrorDisplay error={errors["totalTrees"]} />
      
      {dedicatedNames.map((name, index) => (
        <UserDetailsForm
          key={index}
          data={name}
          index={index}
          onUpdate={(field, value) => onNameChange(index, field, value)}
          errors={errors}
          maxTrees={donationTreeCount - dedicatedNames.slice(0, -1).map(user => user.trees_count || 1).reduce((prev, count) => prev + count, 0)}
          canRemove={index > 0}
          onRemove={index > 0 ? () => onRemoveName(index) : undefined}
        />
      ))}
      
      <button
        type="button"
        onClick={onAddName}
        className={`flex items-center text-green-700 hover:text-green-900 mt-2 ${
          !canAddMore ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        disabled={hasEmptyNames || !canAddMore}
        title={!canAddMore ? 'You have already assigned all the trees to users' : ''}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Add another name
      </button>
    </div>
  );
};