import React from 'react';
import { DedicatedName } from '../../types/donation';

interface SingleRecipientFormProps {
  recipient: DedicatedName;
  errors: Record<string, string>;
  isAssigneeDifferent: boolean;
  onNameChange: (field: string, value: string) => void;
}

export const SingleRecipientForm: React.FC<SingleRecipientFormProps> = ({
  recipient,
  errors,
  isAssigneeDifferent,
  onNameChange
}) => {
  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Assignee name"
        className={`w-full rounded-md border ${
          errors['dedicatedName-0'] ? 'border-red-500' : 'border-gray-300'
        } px-4 py-3 text-gray-700`}
        value={recipient.recipient_name}
        onChange={(e) => {
          onNameChange("recipient_name", e.target.value);
          if (!isAssigneeDifferent) {
            onNameChange("assignee_name", e.target.value);
          }
        }}
      />
      {errors['dedicatedName-0'] && (
        <p className="mt-1 text-sm text-red-600">{errors['dedicatedName-0']}</p>
      )}
      
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <input
            type="email"
            placeholder="Assignee Email (optional)"
            className={`w-full rounded-md border ${
              errors['dedicatedEmail-0'] ? 'border-red-500' : 'border-gray-300'
            } px-4 py-3 text-gray-700`}
            value={recipient.recipient_email}
            onChange={(e) => {
              onNameChange("recipient_email", e.target.value);
              if (!isAssigneeDifferent) {
                onNameChange("assignee_email", e.target.value);
              }
            }}
          />
          {errors['dedicatedEmail-0'] && (
            <p className="mt-1 text-sm text-red-600">{errors['dedicatedEmail-0']}</p>
          )}
        </div>
        
        <div>
          <input
            type="tel"
            placeholder="Assignee Phone (optional)"
            className={`w-full rounded-md border ${
              errors['dedicatedPhone-0'] ? 'border-red-500' : 'border-gray-300'
            } px-4 py-3 text-gray-700`}
            value={recipient.recipient_phone}
            onChange={(e) => {
              onNameChange("recipient_phone", e.target.value);
              if (!isAssigneeDifferent) {
                onNameChange("assignee_phone", e.target.value);
              }
            }}
            pattern="[0-9]{10,15}"
            title="10-15 digit phone number"
          />
          {errors['dedicatedPhone-0'] && (
            <p className="mt-1 text-sm text-red-600">{errors['dedicatedPhone-0']}</p>
          )}
        </div>
      </div>
    </div>
  );
};