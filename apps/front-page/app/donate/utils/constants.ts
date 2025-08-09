// Constants and configurations for donate module

import { 
  FORM_LIMITS as SHARED_FORM_LIMITS, 
  ANIMATION_VARIANTS,
  DEFAULT_VALUES 
} from '../../../components/Common/Utils/constants';

// Pricing constants
export const PRICING = {
  ADOPT_TREE_PRICE: 3000,
  DONATE_TREE_PRICE: 1500,
  PAYMENT_LIMIT: 500000,
} as const;

// Pagination constants
export const PAGINATION = {
  ITEMS_PER_PAGE: 10,
} as const;

// Default form values
export const DEFAULT_FORM_DATA = {
  fullName: "",
  email: "",
  phone: "",
  panNumber: "",
  comments: ""
} as const;

export const DEFAULT_DEDICATED_NAME = {
  recipient_name: "",
  recipient_email: "",
  recipient_phone: "",
  assignee_name: "",
  assignee_email: "",
  assignee_phone: "",
  relation: "",
  trees_count: DEFAULT_VALUES.treeCount
} as const;

// Animation variants (using shared variants)
export const CONTAINER_VARIANTS = ANIMATION_VARIANTS.containerFadeIn;

// Default donation values
export const DEFAULT_DONATION = {
  TREE_COUNT: DEFAULT_VALUES.treeCount,
  AMOUNT: 5000,
} as const;

// Storage keys
export const STORAGE_KEYS = {
  AUTO_COMPLETE: 'donate_auto_complete_data',
  FORM_DATA: 'donate_form_data',
  DEDICATED_NAMES: 'donate_dedicated_names',
} as const;

// Form limits and constraints (using shared limits)
export const FORM_LIMITS = {
  ...SHARED_FORM_LIMITS,
  allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
} as const;