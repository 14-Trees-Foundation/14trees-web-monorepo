import { AutoPopulateSettings } from '../types/forms';
import { 
  FORM_LIMITS as SHARED_FORM_LIMITS,
  DEFAULT_VALUES 
} from '../../../components/Common/Utils/constants';
import { VALIDATION_PATTERNS } from '../../../components/Common/Utils/validation';

// Local Storage Keys
export const AUTO_POPULATE_STORAGE_KEY = 'giftTreesAutoPopulate';
export const SAVED_FORMS_STORAGE_KEY = 'giftTreesSavedForms';
export const AUTO_POPULATE_SETTINGS_KEY = 'giftTreesAutoPopulateSettings';

// Default Settings
export const defaultAutoPopulateSettings: AutoPopulateSettings = {
  fullName: true,
  email: true,
  phone: true,
  panNumber: true,
  eventName: true,
  eventType: true,
  plantedBy: true,
  primaryMessage: true,
  secondaryMessage: true,
  recipients: false, // Default to false for privacy
};

// Re-export shared validation patterns for backward compatibility
export { VALIDATION_PATTERNS };

// Form Limits (using shared limits)
export const FORM_LIMITS = SHARED_FORM_LIMITS;

// CSV Headers
export const CSV_HEADERS = {
  required: [
    'Recipient Name',
    'Recipient Email',
    'Assignee Name', 
    'Assignee Email',
    'Relation',
    'Number of Trees'
  ],
  optional: [
    'Image URL'
  ]
};

// Event Types
export const EVENT_TYPES = [
  'Birthday',
  'Anniversary',
  'Wedding',
  'Memorial',
  'Corporate Event',
  'Festival',
  'Achievement',
  'Other'
];

// Relations
export const RELATIONS = [
  'Self',
  'Spouse',
  'Parent',
  'Child',
  'Sibling',
  'Friend',
  'Colleague',
  'Other'
];

// Payment Methods
export const PAYMENT_METHODS = {
  RAZORPAY: 'razorpay' as const,
  BANK_TRANSFER: 'bank_transfer' as const,
};

// API Endpoints (relative paths)
export const API_ENDPOINTS = {
  CREATE_PAYMENT: '/api/payments/create',
  VERIFY_PAYMENT: '/api/payments/verify',
  SUBMIT_GIFT: '/api/gifts/submit',
  UPLOAD_IMAGE: '/api/upload/image',
};