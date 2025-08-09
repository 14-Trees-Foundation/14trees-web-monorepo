// Shared validation service for recipient forms

export interface ValidationError {
  field: string;
  message: string;
  index?: number;
}

export interface DedicatedName {
  recipient_name: string;
  recipient_email?: string;
  recipient_phone?: string;
  assignee_name: string;
  assignee_email?: string;
  assignee_phone?: string;
  relation: string;
  trees_count: number;
  [key: string]: any;
}

export class RecipientValidationService {
  private static emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static phoneRegex = /^[0-9]{10,15}$/;

  /**
   * Validates a single recipient
   */
  static validateRecipient(recipient: DedicatedName, index: number): ValidationError[] {
    const errors: ValidationError[] = [];

    // Required field validation
    if (!recipient.recipient_name?.trim()) {
      errors.push({
        field: `dedicatedName-${index}`,
        message: 'Recipient name is required',
        index
      });
    }

    // Email validation (if provided)
    if (recipient.recipient_email && !this.emailRegex.test(recipient.recipient_email)) {
      errors.push({
        field: `dedicatedEmail-${index}`,
        message: 'Please enter a valid email address',
        index
      });
    }

    // Phone validation (if provided)
    if (recipient.recipient_phone && !this.phoneRegex.test(recipient.recipient_phone)) {
      errors.push({
        field: `dedicatedPhone-${index}`,
        message: 'Please enter a valid phone number (10-15 digits)',
        index
      });
    }

    // Trees count validation
    if (!recipient.trees_count || recipient.trees_count < 1) {
      errors.push({
        field: `treesCount-${index}`,
        message: 'Number of trees must be at least 1',
        index
      });
    }

    return errors;
  }

  /**
   * Validates all recipients and tree count limits
   */
  static validateAllRecipients(recipients: DedicatedName[], maxTrees: number) {
    const errors: ValidationError[] = [];
    const errorMap: Record<string, string> = {};

    // Validate each recipient
    recipients.forEach((recipient, index) => {
      const recipientErrors = this.validateRecipient(recipient, index);
      errors.push(...recipientErrors);
    });

    // Check total trees limit
    const totalTrees = recipients.reduce((sum, r) => sum + (r.trees_count || 0), 0);
    if (totalTrees > maxTrees) {
      errors.push({
        field: 'totalTrees',
        message: `Total trees (${totalTrees}) exceeds the maximum allowed (${maxTrees})`
      });
    }

    if (totalTrees === 0) {
      errors.push({
        field: 'totalTrees',
        message: 'At least one tree must be assigned'
      });
    }

    // Convert to error map for easier consumption
    errors.forEach(error => {
      errorMap[error.field] = error.message;
    });

    return {
      errors,
      errorMap,
      isValid: errors.length === 0,
      totalTrees
    };
  }

  /**
   * Validates assignee details if different from recipient
   */
  static validateAssignee(recipient: DedicatedName, index: number): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!recipient.assignee_name?.trim()) {
      errors.push({
        field: `assigneeName-${index}`,
        message: 'Assignee name is required',
        index
      });
    }

    if (recipient.assignee_email && !this.emailRegex.test(recipient.assignee_email)) {
      errors.push({
        field: `assigneeEmail-${index}`,
        message: 'Please enter a valid assignee email address',
        index
      });
    }

    if (recipient.assignee_phone && !this.phoneRegex.test(recipient.assignee_phone)) {
      errors.push({
        field: `assigneePhone-${index}`,
        message: 'Please enter a valid assignee phone number (10-15 digits)',
        index
      });
    }

    return errors;
  }

  /**
   * Real-time field validation
   */
  static validateField(field: string, value: string | number, index?: number): string | null {
    switch (field) {
      case 'recipient_name':
      case 'assignee_name':
        return !value || (typeof value === 'string' && !value.trim()) 
          ? 'Name is required' 
          : null;

      case 'recipient_email':
      case 'assignee_email':
        if (!value) return null; // Optional field
        return typeof value === 'string' && this.emailRegex.test(value) 
          ? null 
          : 'Please enter a valid email address';

      case 'recipient_phone':
      case 'assignee_phone':
        if (!value) return null; // Optional field
        return typeof value === 'string' && this.phoneRegex.test(value) 
          ? null 
          : 'Please enter a valid phone number (10-15 digits)';

      case 'trees_count':
        const count = typeof value === 'string' ? parseInt(value) : value;
        return count && count >= 1 ? null : 'Number of trees must be at least 1';

      default:
        return null;
    }
  }
}