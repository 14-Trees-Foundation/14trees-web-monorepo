// components/donate/UserDetailsForm.tsx
import React, { useState } from 'react';
import { UserFormField } from 'components/donate/UserFormField';

export interface UserDetailsData {
  recipient_name: string;
  recipient_email: string;
  recipient_phone: string;
  trees_count: number;
  assignee_name: string;
  assignee_email: string;
  assignee_phone: string;
  relation: string;
  image?: string;
  image_url?: string;
  [key: string]: string | number | undefined;
}

interface UserDetailsFormProps {
  data: UserDetailsData;
  index: number;
  maxTrees: number,
  errors: Record<string, string>;
  onUpdate: (field: keyof UserDetailsData, value: string | number) => void;
  canRemove: boolean;
  onRemove?: () => void;
}

export const UserDetailsForm: React.FC<UserDetailsFormProps> = ({
  data,
  index,
  maxTrees,
  errors,
  onUpdate,
  canRemove,
  onRemove
}) => {
  const [showAssignee, setShowAssignee] = useState(false);

  const handleAssigneeToggle = (value: boolean) => {
    setShowAssignee(value);
  };

  // Relationship options for dropdown
  const relationOptions = [
    { value: '', label: 'Select Relation' },
    { value: 'father', label: 'Father' },
    { value: 'mother', label: 'Mother' },
    { value: 'uncle', label: 'Uncle' },
    { value: 'aunt', label: 'Aunt' },
    { value: 'grandfather', label: 'Grandfather' },
    { value: 'grandmother', label: 'Grandmother' },
    { value: 'son', label: 'Son' },
    { value: 'daughter', label: 'Daughter' },
    { value: 'wife', label: 'Wife' },
    { value: 'husband', label: 'Husband' },
    { value: 'grandson', label: 'Grandson' },
    { value: 'granddaughter', label: 'Granddaughter' },
    { value: 'brother', label: 'Brother' },
    { value: 'sister', label: 'Sister' },
    { value: 'cousin', label: 'Cousin' },
    { value: 'friend', label: 'Friend' },
    { value: 'colleague', label: 'Colleague' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="border border-gray-200 rounded-md p-4 relative">
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
        >
          Remove
        </button>
      )}
      
      <div className="grid gap-4 md:grid-cols-2">
        <UserFormField
          type="text"
          label={`Recipient Name ${index + 1}`}
          name="recipient_name"
          value={data.recipient_name}
          onChange={(value) => {
            onUpdate('recipient_name', value);
            if (!showAssignee) {
              onUpdate('assignee_name', value);
            }
          }}
          required
          error={errors[`dedicatedName-${index}`]}
        />
        
        <UserFormField
          type="email"
          label="Recipient Email"
          name="recipient_email"
          value={data.recipient_email}
          onChange={(value) => {
            onUpdate('recipient_email', value);
            if (!showAssignee) {
              onUpdate('assignee_email', value);
            }
          }}
          error={errors[`dedicatedEmail-${index}`]}
        />
        
        <UserFormField
          type="tel"
          label="Recipient Phone"
          name="recipient_phone"
          value={data.recipient_phone}
          onChange={(value) => {
            onUpdate('recipient_phone', value);
            if (!showAssignee) {
              onUpdate('assignee_phone', value);
            }
          }}
          error={errors[`dedicatedPhone-${index}`]}
        />
        
        <UserFormField
          type="number"
          label="Trees"
          name="trees_count"
          value={data.trees_count}
          onChange={(value) => onUpdate('trees_count', maxTrees && typeof value === 'number' && value > maxTrees ? maxTrees : value)}
          min={1}
          max={maxTrees}
        />
      </div>
      
      <div className="mt-6">
        <label className="flex items-center space-x-3 mb-4">
          <input
            type="checkbox"
            checked={showAssignee}
            onChange={(e) => handleAssigneeToggle(e.target.checked)}
            className="h-5 w-5"
          />
          <span>Assign trees to someone else?</span>
        </label>
        
        {showAssignee && (
          <div className="border border-gray-200 rounded-md p-4 space-y-4">
            <h3 className="font-medium">Assignee Details</h3>
            
            <UserFormField
              type="text"
              label="Assignee Name"
              name="assignee_name"
              value={data.assignee_name}
              onChange={(value) => onUpdate('assignee_name', value)}
              required
              error={errors[`assigneeName-${index}`]}
            />
            
            <div className="grid gap-4 md:grid-cols-2">
              <UserFormField
                type="email"
                label="Email"
                name="assignee_email"
                value={data.assignee_email}
                onChange={(value) => onUpdate('assignee_email', value)}
                placeholder="Email (optional)"
              />
              
              <UserFormField
                type="tel"
                label="Phone"
                name="assignee_phone"
                value={data.assignee_phone}
                onChange={(value) => onUpdate('assignee_phone', value)}
                placeholder="Phone (optional)"
              />
            </div>
            
            <UserFormField
              type="select"
              label="Relation"
              name="relation"
              value={data.relation}
              onChange={(value) => onUpdate('relation', value)}
              required
              options={relationOptions}
            />
          </div>
        )}
      </div>
    </div>
  );
};