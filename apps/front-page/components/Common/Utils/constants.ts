// Shared constants for common values used across modules

// Form limits and constraints
export const FORM_LIMITS = {
  maxDedicatedNames: 100,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxImageSize: 2 * 1024 * 1024, // 2MB
  maxSavedForms: 20,
  autoCompleteLimit: 20, // Keep last 20 items
  minValueLength: 2, // Minimum length for autocomplete values
} as const;

// File type constraints
export const FILE_TYPES = {
  allowedImages: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  allowedCSV: ['text/csv', 'application/vnd.ms-excel'],
} as const;

// Common animation variants
export const ANIMATION_VARIANTS = {
  containerFadeIn: {
    hidden: { opacity: 0, y: 10, scale: 1.05 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5 },
    },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  },
  slideIn: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  },
} as const;

// Common storage key patterns
export const STORAGE_KEY_PATTERNS = {
  autoComplete: (module: string) => `${module}_auto_complete_data`,
  formData: (module: string) => `${module}_form_data`,
  dedicatedNames: (module: string) => `${module}_dedicated_names`,
  settings: (module: string) => `${module}_settings`,
} as const;

// Common form field types for validation
export const FORM_FIELD_TYPES = {
  FULL_NAME: 'fullName',
  EMAIL: 'email',
  PHONE: 'phone',
  PAN_NUMBER: 'panNumber',
  RECIPIENT_NAME: 'recipient_name',
  RECIPIENT_EMAIL: 'recipient_email',
  RECIPIENT_PHONE: 'recipient_phone',
  ASSIGNEE_NAME: 'assignee_name',
  ASSIGNEE_EMAIL: 'assignee_email',
  ASSIGNEE_PHONE: 'assignee_phone',
  RELATION: 'relation',
  TREES_COUNT: 'trees_count',
} as const;

// Common error messages
export const ERROR_MESSAGES = {
  required: (field: string) => `${field} is required`,
  invalidEmail: 'Please enter a valid email address',
  invalidPhone: 'Please enter a valid phone number',
  invalidPAN: 'Please enter a valid PAN number (e.g., ABCDE1234F)',
  invalidName: 'Please enter a valid name',
  fileTooLarge: (maxSizeMB: number) => `File size must be less than ${maxSizeMB}MB`,
  invalidFileType: (allowedTypes: string) => `Only ${allowedTypes} files are allowed`,
  minTreesCount: 'Number of trees must be at least 1',
  duplicateName: 'Duplicate names are not allowed',
} as const;

// Common success messages
export const SUCCESS_MESSAGES = {
  formSaved: 'Form data saved successfully',
  formSubmitted: 'Form submitted successfully',
  fileUploaded: 'File uploaded successfully',
  dataCleared: 'Data cleared successfully',
} as const;

// Default tree counts and amounts (can be overridden by modules)
export const DEFAULT_VALUES = {
  treeCount: 14,
  minTreeCount: 1,
} as const;