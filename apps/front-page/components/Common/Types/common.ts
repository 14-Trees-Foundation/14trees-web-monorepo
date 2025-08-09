// Common type definitions shared across modules

export interface ValidationAlertProps {
  show: boolean;
  onClose: () => void;
  title: string;
  message: React.ReactNode;
}

// Common form field types
export interface BaseFormData {
  fullName: string;
  email: string;
  phone: string;
  panNumber: string;
}

// Common dedicated name structure (base fields)
export interface BaseDedicatedName {
  recipient_name: string;
  recipient_email: string;
  recipient_phone: string;
  assignee_name: string;
  assignee_email: string;
  assignee_phone: string;
  trees_count: number;
}

// Common API response types
export interface BaseApiResponse {
  success: boolean;
  message: string;
}

export interface BaseApiError {
  error: string;
  details?: Record<string, string>;
}

// Common validation result interface (re-exported from validation utils)
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Common file validation result
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

// Common storage interfaces
export interface BaseAutoCompleteData {
  fullNames: string[];
  emails: string[];
  phones: string[];
  panNumbers: string[];
}

// Common settings interface
export interface BaseSettings {
  autoPopulate: boolean;
  rememberData: boolean;
}