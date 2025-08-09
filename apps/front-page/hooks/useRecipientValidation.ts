import { useMemo } from 'react';

interface DedicatedName {
  recipient_name: string;
  recipient_email?: string;
  trees_count: number;
  [key: string]: any;
}

interface UseRecipientValidationProps {
  recipients: DedicatedName[];
  maxTrees: number;
}

interface ValidationResult {
  totalTrees: number;
  hasErrors: boolean;
  errors: string[];
  isOverLimit: boolean;
  hasEmptyNames: boolean;
}

export const useRecipientValidation = ({
  recipients,
  maxTrees
}: UseRecipientValidationProps): ValidationResult => {
  return useMemo(() => {
    const totalTrees = recipients.reduce((sum, recipient) => 
      sum + (recipient.trees_count || 0), 0
    );

    const hasEmptyNames = recipients.some(recipient => 
      !recipient.recipient_name?.trim()
    );

    const isOverLimit = totalTrees > maxTrees;
    
    const errors: string[] = [];
    
    if (isOverLimit) {
      errors.push(`Total trees (${totalTrees}) exceeds maximum allowed (${maxTrees})`);
    }
    
    if (hasEmptyNames) {
      errors.push('Some recipients have empty names');
    }

    // Validate email format
    recipients.forEach((recipient, index) => {
      if (recipient.recipient_email && recipient.recipient_email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(recipient.recipient_email)) {
          errors.push(`Invalid email format for recipient ${index + 1}`);
        }
      }
    });

    return {
      totalTrees,
      hasErrors: errors.length > 0,
      errors,
      isOverLimit,
      hasEmptyNames
    };
  }, [recipients, maxTrees]);
};