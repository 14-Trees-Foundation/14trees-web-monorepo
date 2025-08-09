import { useState, useCallback } from 'react';

interface DedicatedName {
  recipient_name: string;
  recipient_email: string;
  assignee_name: string;
  assignee_email: string;
  relation: string;
  trees_count: number;
  [key: string]: any;
}

interface UseRecipientsManagerProps {
  maxTrees: number;
  initialRecipients?: DedicatedName[];
}

interface UseRecipientsManagerReturn {
  recipients: DedicatedName[];
  setRecipients: React.Dispatch<React.SetStateAction<DedicatedName[]>>;
  addRecipient: () => void;
  removeRecipient: (index: number) => void;
  updateRecipient: (index: number, field: string, value: string | number) => void;
  resetRecipients: () => void;
  getTotalTrees: () => number;
  canAddMore: () => boolean;
  hasEmptyNames: () => boolean;
  createEmptyRecipient: (treesCount?: number) => DedicatedName;
}

export const useRecipientsManager = ({
  maxTrees,
  initialRecipients = []
}: UseRecipientsManagerProps): UseRecipientsManagerReturn => {
  
  const createEmptyRecipient = useCallback((treesCount?: number): DedicatedName => ({
    recipient_name: '',
    recipient_email: '',
    assignee_name: '',
    assignee_email: '',
    relation: '',
    trees_count: treesCount || 1
  }), []);

  const [recipients, setRecipients] = useState<DedicatedName[]>(() => {
    if (initialRecipients.length > 0) {
      return initialRecipients;
    }
    return [createEmptyRecipient(maxTrees)];
  });

  const getTotalTrees = useCallback(() => {
    return recipients.reduce((sum, recipient) => sum + (recipient.trees_count || 0), 0);
  }, [recipients]);

  const canAddMore = useCallback(() => {
    return getTotalTrees() < maxTrees;
  }, [getTotalTrees, maxTrees]);

  const hasEmptyNames = useCallback(() => {
    return recipients.some(recipient => !recipient.recipient_name?.trim());
  }, [recipients]);

  const addRecipient = useCallback(() => {
    if (!canAddMore() || hasEmptyNames()) return;
    
    const remainingTrees = maxTrees - getTotalTrees();
    setRecipients(prev => [...prev, createEmptyRecipient(Math.min(remainingTrees, 1))]);
  }, [canAddMore, hasEmptyNames, maxTrees, getTotalTrees, createEmptyRecipient]);

  const removeRecipient = useCallback((index: number) => {
    if (recipients.length <= 1) return;
    
    setRecipients(prev => prev.filter((_, i) => i !== index));
  }, [recipients.length]);

  const updateRecipient = useCallback((index: number, field: string, value: string | number) => {
    setRecipients(prev => prev.map((recipient, i) => 
      i === index ? { ...recipient, [field]: value } : recipient
    ));
  }, []);

  const resetRecipients = useCallback(() => {
    setRecipients([createEmptyRecipient(maxTrees)]);
  }, [createEmptyRecipient, maxTrees]);

  return {
    recipients,
    setRecipients,
    addRecipient,
    removeRecipient,
    updateRecipient,
    resetRecipients,
    getTotalTrees,
    canAddMore,
    hasEmptyNames,
    createEmptyRecipient
  };
};